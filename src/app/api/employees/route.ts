import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const employees = await prisma.employee.findMany({
    include: {
      referredBy: { select: { id: true, name: true } },
      _count: { select: { referrals: true, shiftAssignments: true } },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const emp = await prisma.employee.create({
    data: {
      name: body.name,
      phone: body.phone,
      role: body.role || 'KITCHEN',
      hourlyRate: parseFloat(body.hourlyRate) || 0,
      status: 'ACTIVE',
      referredById: body.referredById ? parseInt(body.referredById) : null,
      referralBonus: parseFloat(body.referralBonus) || 0,
      notes: body.notes,
    },
  })
  return NextResponse.json(emp)
}
