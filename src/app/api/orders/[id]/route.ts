import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { restoreInventoryForOrder } from '@/lib/inventory'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { menuItem: true } } },
    })
    if (!order) return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 })
    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: 'שגיאה' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const body = await req.json()
    const prevOrder = await prisma.order.findUnique({ where: { id } })

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: body.status,
        paymentStatus: body.paymentStatus,
        paymentRef: body.paymentRef,
      },
      include: { items: { include: { menuItem: true } } },
    })

    // אם ההזמנה בוטלה - מחזיר מלאי
    if (body.status === 'CANCELLED' && prevOrder?.status !== 'CANCELLED') {
      await restoreInventoryForOrder(id)
    }

    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: 'שגיאה בעדכון ההזמנה' }, { status: 500 })
  }
}
