import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VAT_RATE } from '@/lib/costing'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '100')
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' },
    take: limit,
  })
  return NextResponse.json(expenses)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const amount = parseFloat(body.amount)
  // Extract VAT from amount if included
  const vatAmount = body.vatIncluded ? amount * (VAT_RATE / (1 + VAT_RATE)) : 0

  const expense = await prisma.expense.create({
    data: {
      category: body.category || 'אחר',
      description: body.description,
      amount,
      vatAmount,
      date: body.date ? new Date(body.date) : new Date(),
      notes: body.notes,
    },
  })
  return NextResponse.json(expense)
}
