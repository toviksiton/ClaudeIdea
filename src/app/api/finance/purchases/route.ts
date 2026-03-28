import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refreshMenuAvailability } from '@/lib/inventory'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '100')
  const purchases = await prisma.purchase.findMany({
    include: {
      supplier: true,
      ingredient: true,
    },
    orderBy: { date: 'desc' },
    take: limit,
  })
  return NextResponse.json(purchases)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const quantity = parseFloat(body.quantity) || 0
  const costPerUnit = parseFloat(body.costPerUnit) || 0
  const totalAmount = parseFloat(body.totalAmount) || quantity * costPerUnit

  const purchase = await prisma.purchase.create({
    data: {
      supplierId: body.supplierId ? parseInt(body.supplierId) : null,
      ingredientId: body.ingredientId ? parseInt(body.ingredientId) : null,
      description: body.description,
      quantity,
      costPerUnit,
      totalAmount,
      date: body.date ? new Date(body.date) : new Date(),
      notes: body.notes,
      vatIncluded: body.vatIncluded ?? true,
    },
    include: { supplier: true, ingredient: true },
  })

  // Update ingredient stock and cost per unit
  if (body.ingredientId && quantity > 0) {
    await prisma.ingredient.update({
      where: { id: parseInt(body.ingredientId) },
      data: {
        quantity: { increment: quantity },
        // Update cost per unit using weighted average
        costPerUnit: costPerUnit > 0 ? costPerUnit : undefined,
      },
    })
    await refreshMenuAvailability()
  }

  return NextResponse.json(purchase)
}
