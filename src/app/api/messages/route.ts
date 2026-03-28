import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date()
  const messages = await prisma.systemMessage.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(messages, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const msg = await prisma.systemMessage.create({
    data: {
      title: body.title,
      content: body.content,
      type: body.type || 'INFO',
      emoji: body.emoji || '📢',
      isActive: body.isActive ?? true,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  })
  return NextResponse.json(msg)
}
