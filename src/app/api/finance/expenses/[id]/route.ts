import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VAT_RATE } from '@/lib/costing'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const amount = parseFloat(body.amount)
  const vatAmount = body.vatIncluded ? amount * (VAT_RATE / (1 + VAT_RATE)) : 0
  const expense = await prisma.expense.update({
    where: { id: parseInt(params.id) },
    data: {
      category: body.category,
      description: body.description,
      amount,
      vatAmount,
      date: body.date ? new Date(body.date) : undefined,
      notes: body.notes,
    },
  })
  return NextResponse.json(expense)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.expense.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
