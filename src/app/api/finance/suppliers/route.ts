import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [suppliers, purchaseTotals] = await Promise.all([
    prisma.supplier.findMany({
      include: {
        _count: { select: { purchases: true, ingredients: true } },
        ingredients: { select: { id: true, name: true, unit: true, quantity: true } },
        purchases: {
          orderBy: { date: 'desc' },
          take: 5,
          select: { id: true, description: true, totalAmount: true, date: true, ingredient: { select: { name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.purchase.groupBy({
      by: ['supplierId'],
      _sum: { totalAmount: true },
      _max: { date: true },
    }),
  ])

  const totalsMap: Record<number, { totalSpent: number; lastPurchase: string | null }> = {}
  purchaseTotals.forEach((t) => {
    if (t.supplierId != null) {
      totalsMap[t.supplierId] = {
        totalSpent: t._sum.totalAmount ?? 0,
        lastPurchase: t._max.date?.toISOString() ?? null,
      }
    }
  })

  const result = suppliers.map((s) => ({
    ...s,
    totalSpent: totalsMap[s.id]?.totalSpent ?? 0,
    lastPurchase: totalsMap[s.id]?.lastPurchase ?? null,
  }))

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supplier = await prisma.supplier.create({
    data: { name: body.name, phone: body.phone || null, email: body.email || null, notes: body.notes || null },
  })
  return NextResponse.json(supplier)
}
