import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deductInventoryForOrder, getMenuItemMaxQuantity } from '@/lib/inventory'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const orders = await prisma.order.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        items: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(orders, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בטעינת הזמנות' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerName, customerPhone, notes, paymentMethod, items } = body

    if (!customerName || !customerPhone || !items?.length) {
      return NextResponse.json({ error: 'נא למלא את כל השדות הנדרשים' }, { status: 400 })
    }

    // וידוא מלאי לכל פריט
    for (const item of items) {
      const maxQty = await getMenuItemMaxQuantity(item.menuItemId)
      if (maxQty < item.quantity) {
        const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } })
        return NextResponse.json(
          { error: `אין מספיק מלאי עבור: ${menuItem?.name}` },
          { status: 400 }
        )
      }
    }

    // חישוב סכום
    let totalAmount = 0
    const itemsWithPrices = []
    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } })
      if (!menuItem || !menuItem.isActive || !menuItem.isAvailable) {
        return NextResponse.json(
          { error: `הפריט ${menuItem?.name || ''} אינו זמין כרגע` },
          { status: 400 }
        )
      }
      totalAmount += menuItem.price * item.quantity
      itemsWithPrices.push({ ...item, priceEach: menuItem.price })
    }

    // יצירת ההזמנה
    const order = await prisma.order.create({
      data: {
        customerName,
        customerPhone,
        notes,
        paymentMethod,
        totalAmount,
        items: {
          create: itemsWithPrices.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            priceEach: item.priceEach,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: { include: { menuItem: true } },
      },
    })

    // הורדת מלאי מיידית
    await deductInventoryForOrder(order.id)

    return NextResponse.json(order)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה ביצירת ההזמנה' }, { status: 500 })
  }
}
