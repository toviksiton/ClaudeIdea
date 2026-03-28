import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const members = await prisma.clubMember.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(members, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.name?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ error: 'נא למלא שם וטלפון' }, { status: 400 })
  }
  try {
    const member = await prisma.clubMember.create({
      data: {
        name: body.name.trim(),
        phone: body.phone.trim(),
        email: body.email || null,
        birthday: body.birthday || null,
        notes: body.notes || null,
      },
    })
    return NextResponse.json(member)
  } catch {
    return NextResponse.json({ error: 'מספר טלפון זה כבר רשום במועדון' }, { status: 409 })
  }
}
