import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refreshMenuAvailability } from '@/lib/inventory'

// Replace all ingredients for a menu item
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const menuItemId = parseInt(params.id)
    const body = await req.json()
    const { ingredients } = body

    // Delete all existing and recreate
    await prisma.menuItemIngredient.deleteMany({ where: { menuItemId } })

    if (ingredients && ingredients.length > 0) {
      await prisma.menuItemIngredient.createMany({
        data: ingredients.map((ing: { ingredientId: number; quantity: number }) => ({
          menuItemId,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
        })),
      })
    }

    await refreshMenuAvailability()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון מרכיבים' }, { status: 500 })
  }
}
