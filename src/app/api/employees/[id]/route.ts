import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const emp = await prisma.employee.update({
    where: { id: parseInt(params.id) },
    data: {
      name: body.name,
      phone: body.phone,
      role: body.role,
      hourlyRate: parseFloat(body.hourlyRate) || 0,
      status: body.status,
      referredById: body.referredById ? parseInt(body.referredById) : null,
      referralBonus: parseFloat(body.referralBonus) || 0,
      notes: body.notes,
    },
  })
  return NextResponse.json(emp)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.employee.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
