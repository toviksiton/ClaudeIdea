'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Plus, Minus, Search, Phone, CheckCircle2, AlertCircle, Clock, ShoppingCart, ChevronLeft } from 'lucide-react'
import PaymentModal from '@/components/PaymentModal'

interface Ingredient { ingredient: { name: string }; quantity: number }
interface MenuItem {
  id: number; name: string; description: string | null; price: number
  category: string; isAvailable: boolean; isActive: boolean
  maxQuantity: number; prepTimeMinutes: number; ingredients: Ingredient[]
}
interface CartItem { menuItem: MenuItem; quantity: number; notes: string }
interface Settings {
  business_name?: string; business_phone?: string; paybox_link?: string
  bit_phone?: string; event_active?: string; logo_url?: string
  [key: string]: string | undefined
}

const EMOJI_MAP: Record<string, string> = {
  'המבורגרים': '🍔', 'עיקריות': '🍽️', 'אוכל רחוב': '🥙', 'קינוחים': '🍰',
  'שתייה': '🥤', 'סלטים': '🥗', 'פיצה': '🍕', 'פסטה': '🍝', 'כללי': '🍴',
}
function catEmoji(cat: string) {
  for (const [k, v] of Object.entries(EMOJI_MAP)) { if (cat.includes(k)) return v }
  return '🍴'
}

const STATUS_LABELS: Record<string, string> = { PENDING: 'ממתין', CONFIRMED: 'אושר', PREPARING: 'בהכנה', READY: 'מוכן לאיסוף', COMPLETED: 'הושלם', CANCELLED: 'בוטל' }
const STATUS_PILL: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700', CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-orange-100 text-orange-700', READY: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-500', CANCELLED: 'bg-red-100 text-red-600',
}

export default function CustomerPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState('הכל')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'PAYBOX' | 'BIT' | 'CASH'>('CASH')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [placedOrder, setPlacedOrder] = useState<any>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [trackOrderId, setTrackOrderId] = useState('')
  const [trackedOrder, setTrackedOrder] = useState<any>(null)
  const [trackError, setTrackError] = useState('')

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu', { cache: 'no-store' })
      const data = await res.json()
      if (Array.isArray(data)) {
        setMenuItems(data)
        setCategories(Array.from(new Set<string>(data.map((i: MenuItem) => i.category))))
      }
    } catch {}
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const data = await fetch('/api/settings', { cache: 'no-store' }).then(r => r.json())
      setSettings(prev => ({ ...prev, ...data }))
    } catch {}
  }, [])

  useEffect(() => {
    Promise.all([fetchMenu(), fetchSettings()]).finally(() => setLoading(false))
    const iv = setInterval(() => { fetchMenu(); fetchSettings() }, 15000)
    const onVis = () => { if (document.visibilityState === 'visible') { fetchMenu(); fetchSettings() } }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis) }
  }, [fetchMenu, fetchSettings])

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0)
  const totalPrice = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0)

  const filtered = menuItems.filter(item => {
    const matchCat = activeCategory === 'הכל' || item.category === activeCategory
    const matchSearch = !search || item.name.includes(search) || item.description?.includes(search)
    return matchCat && matchSearch
  })

  const grouped: Record<string, MenuItem[]> = {}
  filtered.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  })

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const ex = prev.find(c => c.menuItem.id === item.id)
      if (ex) {
        if (ex.quantity >= item.maxQuantity) return prev
        return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }]
    })
  }
  function removeFromCart(id: number) { setCart(p => p.filter(c => c.menuItem.id !== id)) }
  function updateQty(id: number, delta: number) {
    setCart(p => p.map(c => {
      if (c.menuItem.id !== id) return c
      const q = c.quantity + delta
      if (q <= 0) return null as any
      if (q > c.menuItem.maxQuantity) return c
      return { ...c, quantity: q }
    }).filter(Boolean))
  }
  function updateNotes(id: number, notes: string) {
    setCart(p => p.map(c => c.menuItem.id === id ? { ...c, notes } : c))
  }

  async function placeOrder() {
    if (!customerName.trim() || !customerPhone.trim()) { setError('נא להזין שם ומספר טלפון'); return }
    if (!cart.length) { setError('העגלה ריקה'); return }
    setError(''); setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, customerPhone, notes: orderNotes, paymentMethod, items: cart.map(c => ({ menuItemId: c.menuItem.id, quantity: c.quantity, notes: c.notes })) })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'שגיאה'); return }
      setPlacedOrder(data); setCart([]); setCartOpen(false)
      if (paymentMethod !== 'CASH') setShowPayment(true)
      await fetchMenu()
    } catch { setError('שגיאת רשת, נסה שוב') }
    finally { setSubmitting(false) }
  }

  async function trackOrder() {
    setTrackError(''); setTrackedOrder(null)
    if (!trackOrderId.trim()) return
    try {
      const r = await fetch(`/api/orders/${trackOrderId}`)
      if (!r.ok) { setTrackError('הזמנה לא נמצאה'); return }
      setTrackedOrder(await r.json())
    } catch { setTrackError('שגיאה') }
  }

  if (settings.event_active === 'false') {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6" dir="rtl">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto mb-5 overflow-hidden border border-orange-100">
            {settings.logo_url ? <img src={settings.logo_url} alt="" className="w-full h-full object-contain p-2" /> : <span className="text-4xl">🍽️</span>}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{settings.business_name || 'מטבח הכפר'}</h1>
          <p className="text-gray-500 text-sm">האירוע אינו פעיל כרגע. נשוב בקרוב!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8]" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>

      {/* ── Header ─────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          {/* Logo + name */}
          <div className="flex items-center gap-2.5">
            {settings.logo_url
              ? <img src={settings.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain border border-gray-100" />
              : <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm">🍽️</div>
            }
            <span className="font-bold text-gray-900 text-base">{settings.business_name || 'מטבח הכפר'}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {settings.business_phone && (
              <a href={`tel:${settings.business_phone}`}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <Phone size={15} />
              </a>
            )}
            <button onClick={() => setCartOpen(true)}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold transition-colors">
              <ShoppingCart size={14} />
              {totalItems > 0 ? <span>({totalItems}) ₪{totalPrice.toFixed(0)}</span> : <span>עגלה</span>}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-2.5">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            placeholder="חיפוש מנה..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-100 rounded-full pr-9 pl-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
          />
        </div>
      </header>

      {/* ── Category Tabs ───────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 sticky top-[88px] z-10">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {['הכל', ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSearch('') }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{catEmoji(cat)}</span> {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Success banner ──────────────────────────── */}
      {placedOrder && !showPayment && (
        <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-green-500 shrink-0" />
          <p className="text-green-700 text-sm font-medium flex-1">הזמנה #{placedOrder.id} נקלטה בהצלחה!</p>
          <button onClick={() => setPlacedOrder(null)} className="text-green-400 hover:text-green-600"><X size={14} /></button>
        </div>
      )}

      {/* ── Menu ────────────────────────────────────── */}
      <main className="px-4 py-4 pb-28 max-w-xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
            <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">טוען תפריט...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm">לא נמצאו מנות</p>
          </div>
        ) : activeCategory === 'הכל' && !search ? (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5">
                <span>{catEmoji(cat)}</span>{cat}
              </h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {items.map(item => <MenuRow key={item.id} item={item} cart={cart} onAdd={addToCart} onUpdate={updateQty} />)}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {filtered.map(item => <MenuRow key={item.id} item={item} cart={cart} onAdd={addToCart} onUpdate={updateQty} />)}
          </div>
        )}

        {/* Track order */}
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-2.5">מעקב הזמנה</h3>
          <div className="flex gap-2">
            <input type="number" placeholder="מספר הזמנה" value={trackOrderId}
              onChange={e => setTrackOrderId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && trackOrder()}
              className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300" />
            <button onClick={trackOrder}
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              חפש
            </button>
          </div>
          {trackError && <p className="text-red-500 text-xs mt-2">{trackError}</p>}
          {trackedOrder && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-gray-800 text-sm">#{trackedOrder.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_PILL[trackedOrder.status]}`}>
                  {STATUS_LABELS[trackedOrder.status]}
                </span>
              </div>
              {trackedOrder.items.map((item: any) => (
                <p key={item.id} className="text-gray-500 text-xs">{item.quantity}× {item.menuItem.name}</p>
              ))}
              <p className="text-orange-500 font-bold text-sm mt-1.5">₪{trackedOrder.totalAmount}</p>
            </div>
          )}
        </div>
      </main>

      {/* ── Cart Sheet ──────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" dir="rtl">
          <div className="flex-1 bg-black/40 backdrop-blur-[2px]" onClick={() => setCartOpen(false)} />
          <div className="bg-white rounded-t-3xl max-h-[94vh] flex flex-col shadow-2xl">

            {/* Handle + Header */}
            <div className="flex justify-center pt-2.5"><div className="w-9 h-1 bg-gray-200 rounded-full" /></div>
            <div className="flex items-center px-5 py-3 border-b border-gray-100">
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors ml-3">
                <ChevronLeft size={16} />
              </button>
              <h2 className="font-bold text-gray-900 text-lg flex-1">ההזמנה שלי</h2>
              {totalItems > 0 && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">{totalItems} פריטים</span>
              )}
            </div>

            {/* Cart items */}
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">העגלה ריקה</p>
                </div>
              ) : cart.map(c => (
                <div key={c.menuItem.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-800 text-sm truncate">{c.menuItem.name}</p>
                      <button onClick={() => removeFromCart(c.menuItem.id)} className="text-gray-300 hover:text-red-400 shrink-0 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-orange-500 font-bold text-sm">₪{(c.menuItem.price * c.quantity).toFixed(0)}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(c.menuItem.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-300 transition-colors">
                          <Minus size={10} />
                        </button>
                        <span className="text-sm font-bold text-gray-800 w-4 text-center">{c.quantity}</span>
                        <button onClick={() => updateQty(c.menuItem.id, 1)} disabled={c.quantity >= c.menuItem.maxQuantity}
                          className="w-6 h-6 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-30 flex items-center justify-center transition-colors">
                          <Plus size={10} className="text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order form */}
            {cart.length > 0 && (
              <div className="px-5 pb-6 pt-3 border-t border-gray-100 space-y-3">

                {/* Customer info */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <label className="absolute right-3 top-1.5 text-[10px] font-semibold text-orange-500">שם מלא *</label>
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 pb-2 pt-5 text-sm text-gray-800 focus:outline-none focus:border-orange-400 transition-colors" />
                  </div>
                  <div className="relative">
                    <label className="absolute right-3 top-1.5 text-[10px] font-semibold text-orange-500">טלפון *</label>
                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 pb-2 pt-5 text-sm text-gray-800 focus:outline-none focus:border-orange-400 transition-colors" />
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute right-3 top-1.5 text-[10px] font-semibold text-gray-400">הערות להזמנה</label>
                  <input value={orderNotes} onChange={e => setOrderNotes(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 pb-2 pt-5 text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-colors" />
                </div>

                {/* Payment */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">אמצעי תשלום</p>
                  <div className="flex gap-2">
                    {(['CASH', 'PAYBOX', 'BIT'] as const).map(m => (
                      <button key={m} onClick={() => setPaymentMethod(m)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          paymentMethod === m
                            ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                        }`}>
                        {m === 'CASH' ? '💵 מזומן' : m === 'PAYBOX' ? '💳 Paybox' : '📱 Bit'}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-red-600 text-sm">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                {/* Total + submit */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">סה״כ לתשלום</p>
                    <p className="text-xl font-bold text-gray-900">₪{totalPrice.toFixed(0)}</p>
                  </div>
                  <button onClick={placeOrder} disabled={submitting}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold text-base transition-all shadow-md shadow-orange-200">
                    {submitting ? '...' : 'שלח הזמנה ←'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Floating Cart CTA ───────────────────────── */}
      {totalItems > 0 && !cartOpen && (
        <div className="fixed bottom-5 inset-x-4 z-40 max-w-xl mx-auto">
          <button onClick={() => setCartOpen(true)}
            className="w-full flex items-center justify-between bg-gray-900 hover:bg-gray-800 text-white rounded-2xl px-4 py-3.5 shadow-2xl transition-all active:scale-95">
            <span className="bg-orange-500 text-white rounded-xl w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">{totalItems}</span>
            <span className="font-bold text-sm">צפה בעגלה</span>
            <span className="font-bold text-orange-400">₪{totalPrice.toFixed(0)}</span>
          </button>
        </div>
      )}

      {showPayment && placedOrder && (
        <PaymentModal order={placedOrder} settings={settings} onClose={() => { setShowPayment(false); setPlacedOrder(null) }} />
      )}
    </div>
  )
}

// ── Menu Row ────────────────────────────────────────────────
function MenuRow({ item, cart, onAdd, onUpdate }: {
  item: MenuItem; cart: CartItem[]
  onAdd: (i: MenuItem) => void; onUpdate: (id: number, delta: number) => void
}) {
  const qty = cart.find(c => c.menuItem.id === item.id)?.quantity || 0
  const unavailable = !item.isAvailable || item.maxQuantity === 0

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${unavailable ? 'opacity-40' : ''}`}>
      {/* Category dot */}
      <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-lg shrink-0">
        {catEmoji(item.category)}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{item.name}</p>
          {!unavailable && item.maxQuantity <= 5 && (
            <span className="text-[10px] text-amber-600 font-semibold shrink-0">נותרו {item.maxQuantity}</span>
          )}
        </div>
        {item.description && (
          <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-gray-900 font-bold text-sm">₪{item.price}</span>
          {item.prepTimeMinutes > 0 && (
            <span className="text-gray-400 text-xs flex items-center gap-0.5"><Clock size={9} />{item.prepTimeMinutes}′</span>
          )}
          {unavailable && <span className="text-red-400 text-xs font-medium">אזל</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0">
        {unavailable ? null : qty === 0 ? (
          <button onClick={() => onAdd(item)}
            className="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-90 flex items-center justify-center transition-all shadow-sm shadow-orange-200">
            <Plus size={15} className="text-white" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={() => onUpdate(item.id, -1)}
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Minus size={11} className="text-gray-700" />
            </button>
            <span className="text-sm font-bold text-gray-900 w-4 text-center tabular-nums">{qty}</span>
            <button onClick={() => onUpdate(item.id, 1)} disabled={qty >= item.maxQuantity}
              className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-30 flex items-center justify-center transition-colors">
              <Plus size={11} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
