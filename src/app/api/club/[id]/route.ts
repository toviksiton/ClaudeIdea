import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const member = await prisma.clubMember.update({
    where: { id: parseInt(params.id) },
    data: { name: body.name, phone: body.phone, email: body.email || null, birthday: body.birthday || null, notes: body.notes || null },
  })
  return NextResponse.json(member)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.clubMember.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
