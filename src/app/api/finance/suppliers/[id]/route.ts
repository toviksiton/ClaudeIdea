import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const supplier = await prisma.supplier.update({
    where: { id: parseInt(params.id) },
    data: { name: body.name, phone: body.phone, email: body.email, notes: body.notes },
  })
  return NextResponse.json(supplier)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.supplier.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
