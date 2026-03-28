import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refreshMenuAvailability } from '@/lib/inventory'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const body = await req.json()

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        category: body.category,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון הפריט' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    await prisma.menuItem.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה במחיקת הפריט' }, { status: 500 })
  }
}
