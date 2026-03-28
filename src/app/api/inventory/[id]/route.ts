import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refreshMenuAvailability } from '@/lib/inventory'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const body = await req.json()

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        name: body.name,
        unit: body.unit,
        quantity: parseFloat(body.quantity),
        alertLevel: parseFloat(body.alertLevel),
      },
    })

    await refreshMenuAvailability()
    return NextResponse.json(ingredient)
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    await prisma.ingredient.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה במחיקה' }, { status: 500 })
  }
}
