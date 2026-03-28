'use client'

import { useEffect, useState, useRef } from 'react'
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, Volume2, VolumeX } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'border-yellow-400 bg-yellow-50',
  CONFIRMED: 'border-blue-400 bg-blue-50',
  PREPARING: 'border-orange-400 bg-orange-50',
  READY: 'border-green-400 bg-green-50',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'ממתין',
  CONFIRMED: 'אושר',
  PREPARING: 'בהכנה',
  READY: 'מוכן',
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-800',
}

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
}

const NEXT_LABEL: Record<string, string> = {
  PENDING: '✓ אשר',
  CONFIRMED: '→ התחל הכנה',
  PREPARING: '✓ מוכן!',
  READY: '✓ הושלם',
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastOrderIds, setLastOrderIds] = useState<Set<number>>(new Set())
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [updating, setUpdating] = useState<number | null>(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [businessName, setBusinessName] = useState('')
  const audioCtxRef = useRef<AudioContext | null>(null)
  const isFirstLoad = useRef(true)

  function playBeep() {
    if (!soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.15)
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  async function load(silent = false) {
    if (!silent) setLoading(true)
    try {
      const [ordersRes, ingRes] = await Promise.all([
        fetch('/api/orders?limit=100'),
        fetch('/api/inventory'),
      ])
      const newOrders: any[] = await ordersRes.json()
      const ingData: any[] = await ingRes.json()

      const activeOrders = Array.isArray(newOrders)
        ? newOrders.filter((o) => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status))
        : []

      // Detect new orders
      if (!isFirstLoad.current) {
        const incoming = activeOrders.filter((o) => !lastOrderIds.has(o.id))
        if (incoming.length > 0) {
          const ids = new Set(incoming.map((o: any) => o.id))
          setNewOrderIds(ids)
          playBeep()
          setTimeout(() => setNewOrderIds(new Set()), 4000)
        }
      }

      setOrders(activeOrders)
      setIngredients(Array.isArray(ingData) ? ingData : [])
      setLastOrderIds(new Set(activeOrders.map((o: any) => o.id)))
      setLastRefresh(new Date())
      isFirstLoad.current = false
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetch('/api/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((s) => { setLogoUrl(s.logo_url || ''); setBusinessName(s.business_name || '') })
      .catch(() => {})
    const interval = setInterval(() => load(true), 8000)
    return () => clearInterval(interval)
  }, [soundEnabled])

  async function advanceStatus(orderId: number, currentStatus: string) {
    const nextStatus = NEXT_STATUS[currentStatus]
    if (!nextStatus) return
    setUpdating(orderId)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    await load(true)
    setUpdating(null)
  }

  const lowStock = ingredients.filter((i) => i.quantity <= i.alertLevel)

  const grouped: Record<string, any[]> = {
    PENDING: orders.filter((o) => o.status === 'PENDING'),
    CONFIRMED: orders.filter((o) => o.status === 'CONFIRMED'),
    PREPARING: orders.filter((o) => o.status === 'PREPARING'),
    READY: orders.filter((o) => o.status === 'READY'),
  }

  const totalActive = orders.length

  return (
    <div className="min-h-screen bg-gray-900 text-white" dir="rtl">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-gray-700 shrink-0">
                <img src={logoUrl} alt="לוגו" className="w-full h-full object-contain p-0.5" />
              </div>
            )}
            <h1 className="text-xl font-bold text-orange-400">{businessName || 'מסך מטבח'}</h1>
            <span className="text-gray-400 text-sm">
              {totalActive} הזמנות פעילות
            </span>
            {loading && <RefreshCw size={14} className="animate-spin text-gray-400" />}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>עדכון: {lastRefresh.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-1 hover:text-white transition-colors"
              title={soundEnabled ? 'השתק צלילים' : 'הפעל צלילים'}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={() => load()}
              className="hover:text-white transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="bg-red-900/80 border-b border-red-700 px-4 py-2.5">
          <div className="flex items-center gap-2 text-red-200">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <span className="font-semibold text-red-300 text-sm">התראת מלאי:</span>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((ing) => (
                <span key={ing.id} className="bg-red-800 text-red-100 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {ing.name}: {ing.quantity} {ing.unit}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New order flash */}
      {newOrderIds.size > 0 && (
        <div className="bg-green-600 text-white text-center py-3 font-bold text-lg animate-pulse">
          הזמנה חדשה נכנסה! #{Array.from(newOrderIds).join(', #')}
        </div>
      )}

      {/* Columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 min-h-screen">
        {(['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] as const).map((status) => (
          <div key={status}>
            {/* Column header */}
            <div className={`rounded-xl p-2.5 mb-3 text-center font-bold text-sm ${STATUS_BADGE[status]}`}>
              {STATUS_LABELS[status]} ({grouped[status].length})
            </div>

            {/* Orders in column */}
            <div className="space-y-3">
              {grouped[status].length === 0 && (
                <div className="text-gray-600 text-center text-sm py-6 border border-dashed border-gray-700 rounded-xl">
                  אין הזמנות
                </div>
              )}
              {grouped[status].map((order) => {
                const isNew = newOrderIds.has(order.id)
                const orderAge = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)

                return (
                  <div
                    key={order.id}
                    className={`rounded-xl border-2 p-3 transition-all ${STATUS_COLORS[order.status]} ${
                      isNew ? 'new-order-pulse ring-2 ring-green-400' : ''
                    }`}
                  >
                    {/* Order header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 text-lg">#{order.id}</span>
                          {isNew && (
                            <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                              חדש!
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-700 text-sm">{order.customerName}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <Clock size={11} />
                          {orderAge < 60 ? `לפני ${orderAge} דק'` : `לפני ${Math.floor(orderAge / 60)} ש'`}
                        </p>
                        {order.paymentStatus === 'PENDING' && order.paymentMethod !== 'CASH' && (
                          <span className="text-xs text-red-600 font-medium">💳 ממתין לתשלום</span>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white/60 rounded-lg p-2 mb-2 space-y-1">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex items-start gap-2">
                          <span className="font-bold text-orange-600 text-sm shrink-0">×{item.quantity}</span>
                          <div>
                            <span className="font-medium text-gray-800 text-sm">{item.menuItem.name}</span>
                            {item.notes && (
                              <p className="text-gray-500 text-xs italic">"{item.notes}"</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="text-gray-600 text-xs italic mb-2 bg-white/60 rounded p-1.5">
                        💬 {order.notes}
                      </p>
                    )}

                    {/* Phone */}
                    <p className="text-gray-500 text-xs mb-2">📞 {order.customerPhone}</p>

                    {/* Advance button */}
                    {NEXT_STATUS[order.status] && (
                      <button
                        onClick={() => advanceStatus(order.id, order.status)}
                        disabled={updating === order.id}
                        className={`w-full py-2 rounded-xl font-bold text-sm transition-all ${
                          order.status === 'PREPARING'
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : order.status === 'READY'
                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 text-white'
                        } disabled:opacity-60`}
                      >
                        {updating === order.id ? '...' : NEXT_LABEL[order.status]}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
