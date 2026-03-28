import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Webhook / callback מ-Paybox לאחר תשלום
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, transactionId, status } = body

    if (!orderId) {
      return NextResponse.json({ error: 'חסר מזהה הזמנה' }, { status: 400 })
    }

    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        paymentStatus: status === 'success' ? 'PAID' : 'FAILED',
        paymentRef: transactionId,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'שגיאה' }, { status: 500 })
  }
}
