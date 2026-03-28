import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMenuWithStock } from '@/lib/inventory'

// GET - כל פריטי התפריט כולל לא פעילים (לניהול)
export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה' }, { status: 500 })
  }
}

// POST - יצירת פריט חדש
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, price, category, isActive, sortOrder, ingredients } = body

    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category: category || 'כללי',
        isActive: isActive ?? true,
        isAvailable: true,
        sortOrder: sortOrder ?? 0,
        ingredients: {
          create: (ingredients || []).map((ing: { ingredientId: number; quantity: number }) => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
          })),
        },
      },
      include: {
        ingredients: { include: { ingredient: true } },
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה ביצירת הפריט' }, { status: 500 })
  }
}
