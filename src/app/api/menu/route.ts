import { NextResponse } from 'next/server'
import { getMenuWithStock } from '@/lib/inventory'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const items = await getMenuWithStock()
    return NextResponse.json(items, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בטעינת התפריט' }, { status: 500 })
  }
}
