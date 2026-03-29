import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const messages = await prisma.systemMessage.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(messages, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
