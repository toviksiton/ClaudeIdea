import { NextRequest, NextResponse } from 'next/server'
import { getFinancialSummary } from '@/lib/costing'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const summary = await getFinancialSummary(
    from ? new Date(from) : undefined,
    to ? new Date(to) : undefined
  )
  return NextResponse.json(summary)
}
