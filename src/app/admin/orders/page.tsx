'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Phone, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'ממתין',
  CONFIRMED: 'אושר',
  PREPARING: 'בהכנה',
  READY: 'מוכן לאיסוף',
  COMPLETED: 'הושלם',
  CANCELLED: 'בוטל',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PREPARING: 'bg-orange-100 text-orange-800 border-orange-200',
  READY: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
}

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
}

const PAYMENT_LABELS: Record<string, string> = {
  PAYBOX: 'Paybox',
  BIT: 'Bit',
  CASH: 'מזומן',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'ממתין לתשלום',
  PAID: 'שולם',
  FAILED: 'נכשל',
  REFUNDED: 'הוחזר',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('active')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const r = await fetch('/api/orders?limit=100')
    const data = await r.json()
    setOrders(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  async function updateStatus(orderId: number, status: string) {
    setUpdating(orderId)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
    setUpdating(null)
  }

  async function markPaid(orderId: number) {
    setUpdating(orderId)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'PAID' }),
    })
    await load()
    setUpdating(null)
  }

  const filtered = orders.filter((o) => {
    if (filterStatus === 'active') return ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)
    if (filterStatus === 'completed') return o.status === 'COMPLETED'
    if (filterStatus === 'cancelled') return o.status === 'CANCELLED'
    return true
  })

  const activeCounts = {
    active: orders.filter((o) => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
    cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
    all: orders.length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">הזמנות</h1>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm px-3 py-2 rounded-xl hover:bg-white transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> רענן
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 bg-white rounded-2xl p-1.5 shadow-sm border w-fit">
        {[
          { key: 'active', label: `פעילות (${activeCounts.active})` },
          { key: 'completed', label: `הושלמו (${activeCounts.completed})` },
          { key: 'cancelled', label: `בוטלו (${activeCounts.cancelled})` },
          { key: 'all', label: `הכל (${activeCounts.all})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              filterStatus === tab.key
                ? 'bg-orange-500 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">טוען הזמנות...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border">אין הזמנות</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const expanded = expandedId === order.id
            const nextStatus = NEXT_STATUS[order.status]

            return (
              <div key={order.id} className={`bg-white rounded-2xl shadow-sm border-2 ${STATUS_COLORS[order.status]}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-lg">#{order.id}</span>
                        <span className="font-medium text-gray-700">{order.customerName}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {PAYMENT_LABELS[order.paymentMethod]} · {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1 hover:text-blue-600">
                          <Phone size={13} /> {order.customerPhone}
                        </a>
                        <span>{new Date(order.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {order.notes && (
                        <div className="flex items-start gap-1 mt-1 text-sm text-gray-500">
                          <MessageSquare size={13} className="mt-0.5 shrink-0" />
                          <span className="italic">{order.notes}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-orange-600 text-xl">₪{order.totalAmount}</span>
                      <button
                        onClick={() => setExpandedId(expanded ? null : order.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Quick summary */}
                  <div className="mt-2 text-sm text-gray-600">
                    {order.items.map((item: any) => (
                      <span key={item.id} className="inline-block bg-gray-100 rounded-lg px-2 py-0.5 ml-1 mb-1">
                        {item.quantity}× {item.menuItem.name}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {nextStatus && (
                      <button
                        onClick={() => updateStatus(order.id, nextStatus)}
                        disabled={updating === order.id}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
                      >
                        {updating === order.id ? '...' : `← ${STATUS_LABELS[nextStatus]}`}
                      </button>
                    )}
                    {order.paymentStatus === 'PENDING' && (
                      <button
                        onClick={() => markPaid(order.id)}
                        disabled={updating === order.id}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
                      >
                        אשר תשלום
                      </button>
                    )}
                    {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                      <button
                        onClick={() => updateStatus(order.id, 'CANCELLED')}
                        disabled={updating === order.id}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-1.5 rounded-xl text-sm font-medium transition-colors"
                      >
                        בטל הזמנה
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t px-4 py-3 bg-gray-50 rounded-b-2xl">
                    <p className="text-xs font-semibold text-gray-500 mb-2">פירוט הזמנה:</p>
                    <table className="w-full text-sm">
                      <tbody>
                        {order.items.map((item: any) => (
                          <tr key={item.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-1.5 font-medium text-gray-700">{item.menuItem.name}</td>
                            <td className="py-1.5 text-gray-500 text-center">×{item.quantity}</td>
                            {item.notes && (
                              <td className="py-1.5 text-gray-400 italic text-xs">"{item.notes}"</td>
                            )}
                            <td className="py-1.5 text-left font-medium text-gray-700">₪{(item.priceEach * item.quantity).toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
