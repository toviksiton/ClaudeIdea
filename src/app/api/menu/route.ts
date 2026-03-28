import { NextResponse } from 'next/server'
import { getMenuWithStock } from '@/lib/inventory'

export async function GET() {
  try {
    const items = await getMenuWithStock()
    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בטעינת התפריט' }, { status: 500 })
  }
}
