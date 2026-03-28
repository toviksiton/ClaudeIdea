import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // "2025-04"
  let where = {}
  if (month) {
    const [y, m] = month.split('-').map(Number)
    where = { date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } }
  }
  const shifts = await prisma.shift.findMany({
    where,
    include: {
      assignments: {
        include: {
          employee: { select: { id: true, name: true, role: true, hourlyRate: true } },
        },
      },
    },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(shifts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const shift = await prisma.shift.create({
    data: {
      date: new Date(body.date),
      startTime: body.startTime || '09:00',
      endTime: body.endTime || '17:00',
      notes: body.notes,
      status: 'PLANNED',
      assignments: body.assignments ? {
        create: body.assignments.map((a: any) => ({
          employeeId: parseInt(a.employeeId),
          role: a.role,
          hours: parseFloat(a.hours) || 0,
          hourlyRate: parseFloat(a.hourlyRate) || 0,
          bonus: parseFloat(a.bonus) || 0,
          notes: a.notes,
        })),
      } : undefined,
    },
    include: { assignments: { include: { employee: true } } },
  })
  return NextResponse.json(shift)
}
