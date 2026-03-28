import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refreshMenuAvailability } from '@/lib/inventory'

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
      include: {
        menuItemIngredients: {
          include: { menuItem: true },
        },
      },
    })
    return NextResponse.json(ingredients)
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ingredient = await prisma.ingredient.create({
      data: {
        name: body.name,
        unit: body.unit,
        quantity: parseFloat(body.quantity) || 0,
        alertLevel: parseFloat(body.alertLevel) || 5,
      },
    })
    return NextResponse.json(ingredient)
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה ביצירת המרכיב' }, { status: 500 })
  }
}
