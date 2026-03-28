import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const shift = await prisma.shift.findUnique({
    where: { id: parseInt(params.id) },
    include: { assignments: { include: { employee: true } } },
  })
  if (!shift) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json(shift)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  const body = await req.json()

  // Update shift base
  await prisma.shift.update({
    where: { id },
    data: {
      date: body.date ? new Date(body.date) : undefined,
      startTime: body.startTime,
      endTime: body.endTime,
      notes: body.notes,
      status: body.status,
    },
  })

  // Replace assignments if provided
  if (body.assignments) {
    await prisma.shiftAssignment.deleteMany({ where: { shiftId: id } })
    if (body.assignments.length > 0) {
      await prisma.shiftAssignment.createMany({
        data: body.assignments.map((a: any) => ({
          shiftId: id,
          employeeId: parseInt(a.employeeId),
          role: a.role,
          hours: parseFloat(a.hours) || 0,
          hourlyRate: parseFloat(a.hourlyRate) || 0,
          bonus: parseFloat(a.bonus) || 0,
          notes: a.notes,
        })),
      })
    }
  }

  const shift = await prisma.shift.findUnique({
    where: { id },
    include: { assignments: { include: { employee: true } } },
  })
  return NextResponse.json(shift)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.shift.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
