import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      _count: { select: { purchases: true, ingredients: true } },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(suppliers)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supplier = await prisma.supplier.create({
    data: { name: body.name, phone: body.phone, email: body.email, notes: body.notes },
  })
  return NextResponse.json(supplier)
}
