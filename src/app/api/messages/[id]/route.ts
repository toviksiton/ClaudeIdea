import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/messages/all — admin endpoint to retrieve all messages regardless of status
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  if (params.id === 'all') {
    const messages = await prisma.systemMessage.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(messages)
  }
  const msg = await prisma.systemMessage.findUnique({ where: { id: parseInt(params.id) } })
  return NextResponse.json(msg)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const msg = await prisma.systemMessage.update({
    where: { id: parseInt(params.id) },
    data: {
      title: body.title,
      content: body.content,
      type: body.type,
      emoji: body.emoji,
      isActive: body.isActive,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  })
  return NextResponse.json(msg)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.systemMessage.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
