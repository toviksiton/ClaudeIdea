import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.setting.findMany()
    const map: Record<string, string> = {}
    settings.forEach((s) => (map[s.key] = s.value))
    return NextResponse.json(map)
  } catch {
    return NextResponse.json({ error: 'שגיאה' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    for (const [key, value] of Object.entries(body)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'שגיאה' }, { status: 500 })
  }
}
