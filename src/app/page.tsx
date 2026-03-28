'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Plus, Minus, Search, Phone, CheckCircle2, AlertCircle, Clock, ShoppingCart } from 'lucide-react'
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
function categoryEmoji(cat: string) {
  for (const [k, v] of Object.entries(EMOJI_MAP)) { if (cat.includes(k)) return v }
  return '🍴'
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
        const cats = Array.from(new Set<string>(data.map((i: MenuItem) => i.category)))
        setCategories(cats)
      }
    } catch {}
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' })
      const data = await res.json()
      setSettings((prev) => ({ ...prev, ...data }))
    } catch {}
  }, [])

  useEffect(() => {
    fetchMenu()
    fetchSettings()
    setLoading(false)
    const interval = setInterval(() => { fetchMenu(); fetchSettings() }, 15000)
    const onVisible = () => { if (document.visibilityState === 'visible') { fetchMenu(); fetchSettings() } }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) }
  }, [fetchMenu, fetchSettings])

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0)
  const totalPrice = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0)

  const filteredItems = menuItems.filter((item) => {
    const matchCat = activeCategory === 'הכל' || item.category === activeCategory
    const matchSearch = !search || item.name.includes(search) || item.description?.includes(search)
    return matchCat && matchSearch
  })

  const grouped: Record<string, MenuItem[]> = {}
  filteredItems.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  })

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const ex = prev.find((c) => c.menuItem.id === item.id)
      if (ex) {
        if (ex.quantity >= item.maxQuantity) return prev
        return prev.map((c) => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }]
    })
  }
  function removeFromCart(id: number) { setCart((p) => p.filter((c) => c.menuItem.id !== id)) }
  function updateQty(id: number, delta: number) {
    setCart((p) => p.map((c) => {
      if (c.menuItem.id !== id) return c
      const q = c.quantity + delta
      if (q <= 0) return null as any
      if (q > c.menuItem.maxQuantity) return c
      return { ...c, quantity: q }
    }).filter(Boolean))
  }
  function updateNotes(id: number, notes: string) {
    setCart((p) => p.map((c) => c.menuItem.id === id ? { ...c, notes } : c))
  }

  async function placeOrder() {
    if (!customerName.trim() || !customerPhone.trim()) { setError('נא להזין שם ומספר טלפון'); return }
    if (!cart.length) { setError('העגלה ריקה'); return }
    setError(''); setSubmitting(true)
    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName, customerPhone, notes: orderNotes, paymentMethod, items: cart.map((c) => ({ menuItemId: c.menuItem.id, quantity: c.quantity, notes: c.notes })) }) })
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

  const STATUS_LABELS: Record<string, string> = { PENDING: 'ממתין', CONFIRMED: 'אושר', PREPARING: 'בהכנה', READY: 'מוכן לאיסוף', COMPLETED: 'הושלם', CANCELLED: 'בוטל' }
  const STATUS_COLORS: Record<string, string> = { PENDING: 'text-amber-600 bg-amber-50', CONFIRMED: 'text-blue-600 bg-blue-50', PREPARING: 'text-orange-600 bg-orange-50', READY: 'text-green-600 bg-green-50', COMPLETED: 'text-gray-500 bg-gray-50', CANCELLED: 'text-red-600 bg-red-50' }

  if (settings.event_active === 'false') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm overflow-hidden border border-gray-100">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="לוגו" className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-4xl">🍽️</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{settings.business_name || 'מטבח הכפר'}</h1>
          <p className="text-gray-500">האירוע אינו פעיל כרגע. נשוב בקרוב!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800" dir="rtl">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-4 pt-5 pb-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {settings.logo_url && (
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                <img src={settings.logo_url} alt="לוגו" className="w-full h-full object-contain p-0.5" />
              </div>
            )}
            <h1 className="text-lg font-bold text-gray-800">{settings.business_name || 'מטבח הכפר'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {settings.business_phone && (
              <a href={`tel:${settings.business_phone}`} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:text-orange-500 transition-colors">
                <Phone size={16} />
              </a>
            )}
            <button onClick={() => setCartOpen(true)} className="relative w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:text-orange-500 transition-colors">
              <ShoppingCart size={16} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -left-1 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{totalItems}</span>
              )}
            </button>
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="חיפוש מנה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-100 rounded-xl pr-9 pl-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      </header>

      {/* ── Category Tabs ───────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['הכל', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSearch('') }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-xs">{categoryEmoji(cat)}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Success banner ──────────────────────────────────── */}
      {placedOrder && !showPayment && (
        <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2.5">
          <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          <div className="flex-1">
            <p className="text-green-700 font-semibold text-sm">הזמנה #{placedOrder.id} נקלטה!</p>
            <p className="text-green-600 text-xs">שמור את מספר ההזמנה למעקב</p>
          </div>
          <button onClick={() => setPlacedOrder(null)} className="text-green-400 hover:text-green-600"><X size={14} /></button>
        </div>
      )}

      {/* ── Menu ────────────────────────────────────────────── */}
      <main className="px-4 py-4 pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">טוען תפריט...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm">לא נמצאו פריטים</p>
          </div>
        ) : activeCategory === 'הכל' && !search ? (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-5">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-base">{categoryEmoji(cat)}</span>
                <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{cat}</h2>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {items.map((item) => (
                  <MenuItem key={item.id} item={item} cart={cart} onAdd={addToCart} onUpdate={updateQty} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {filteredItems.map((item) => (
              <MenuItem key={item.id} item={item} cart={cart} onAdd={addToCart} onUpdate={updateQty} />
            ))}
          </div>
        )}

        {/* ── Order Tracking ───────────────────────────────── */}
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-bold text-gray-700 text-sm mb-3">מעקב הזמנה</h2>
          <div className="flex gap-2">
            <input type="number" placeholder="מספר הזמנה" value={trackOrderId}
              onChange={(e) => setTrackOrderId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && trackOrder()}
              className="flex-1 bg-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300" />
            <button onClick={trackOrder} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">חפש</button>
          </div>
          {trackError && <p className="text-red-500 text-xs mt-2">{trackError}</p>}
          {trackedOrder && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-gray-700 text-sm">#{trackedOrder.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[trackedOrder.status]}`}>
                  {STATUS_LABELS[trackedOrder.status]}
                </span>
              </div>
              {trackedOrder.items.map((item: any) => (
                <p key={item.id} className="text-gray-500 text-xs">{item.quantity}× {item.menuItem.name}</p>
              ))}
              <p className="text-orange-500 font-bold text-sm mt-2">₪{trackedOrder.totalAmount}</p>
            </div>
          )}
        </div>
      </main>

      {/* ── Floating Cart Bar ───────────────────────────────── */}
      {totalItems > 0 && !cartOpen && (
        <div className="fixed bottom-5 right-4 left-4 z-40">
          <button onClick={() => setCartOpen(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xl shadow-orange-500/30 transition-all">
            <span className="bg-white/20 rounded-xl w-7 h-7 flex items-center justify-center text-sm font-bold">{totalItems}</span>
            <span className="font-bold">צפה בעגלה</span>
            <span className="font-bold">₪{totalPrice.toFixed(0)}</span>
          </button>
        </div>
      )}

      {/* ── Cart Sheet ──────────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" dir="rtl">
          <div className="flex-1 bg-black/30" onClick={() => setCartOpen(false)} />
          <div className="bg-white rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="font-bold text-lg text-gray-800">ההזמנה שלי</h2>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700">
                <X size={15} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
              {cart.map((c) => (
                <div key={c.menuItem.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{c.menuItem.name}</p>
                      <p className="text-orange-500 font-bold text-sm">₪{(c.menuItem.price * c.quantity).toFixed(0)}</p>
                    </div>
                    <button onClick={() => removeFromCart(c.menuItem.id)} className="text-gray-300 hover:text-red-400 transition-colors mt-0.5"><X size={14} /></button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => updateQty(c.menuItem.id, -1)} className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                      <Minus size={12} className="text-gray-600" />
                    </button>
                    <span className="font-bold text-gray-800 w-5 text-center text-sm">{c.quantity}</span>
                    <button onClick={() => updateQty(c.menuItem.id, 1)} disabled={c.quantity >= c.menuItem.maxQuantity}
                      className="w-7 h-7 bg-orange-500 hover:bg-orange-600 disabled:opacity-30 rounded-lg flex items-center justify-center transition-colors">
                      <Plus size={12} className="text-white" />
                    </button>
                  </div>
                  <input placeholder="הערות לפריט..." value={c.notes} onChange={(e) => updateNotes(c.menuItem.id, e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-300" />
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="שם מלא *" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                <input placeholder="טלפון *" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <input placeholder="הערות להזמנה..." value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300" />

              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'PAYBOX', 'BIT'] as const).map((m) => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className={`py-2 rounded-xl text-sm font-medium transition-all ${paymentMethod === m ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}>
                    {m === 'CASH' ? '💵 מזומן' : m === 'PAYBOX' ? '💳 Paybox' : '📱 Bit'}
                  </button>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl p-2.5">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">סה״כ</span>
                <span className="font-bold text-gray-800 text-xl">₪{totalPrice.toFixed(0)}</span>
              </div>

              <button onClick={placeOrder} disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition-all shadow-md shadow-orange-500/20">
                {submitting ? 'שולח...' : 'שלח הזמנה →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayment && placedOrder && (
        <PaymentModal order={placedOrder} settings={settings} onClose={() => { setShowPayment(false); setPlacedOrder(null) }} />
      )}
    </div>
  )
}

// ── Compact Menu Item Row ────────────────────────────────────
function MenuItem({ item, cart, onAdd, onUpdate }: {
  item: MenuItem; cart: CartItem[]
  onAdd: (i: MenuItem) => void; onUpdate: (id: number, delta: number) => void
}) {
  const cartQty = cart.find((c) => c.menuItem.id === item.id)?.quantity || 0
  const unavailable = !item.isAvailable || item.maxQuantity === 0

  return (
    <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${unavailable ? 'opacity-50' : 'hover:bg-gray-50'}`}>
      {/* Emoji */}
      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0 text-xl">
        {categoryEmoji(item.category)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm leading-tight">{item.name}</p>
        {item.description && (
          <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-orange-500 font-bold text-sm">₪{item.price}</span>
          {item.prepTimeMinutes > 0 && (
            <span className="text-gray-400 text-xs flex items-center gap-0.5"><Clock size={9} />{item.prepTimeMinutes}′</span>
          )}
          {unavailable && (
            <span className="text-red-400 text-xs font-medium">אזל המלאי</span>
          )}
          {!unavailable && item.maxQuantity <= 5 && (
            <span className="text-amber-500 text-xs">נותרו {item.maxQuantity}</span>
          )}
        </div>
      </div>

      {/* Add / qty */}
      <div className="shrink-0">
        {unavailable ? (
          <div className="w-8 h-8" />
        ) : cartQty === 0 ? (
          <button onClick={() => onAdd(item)}
            className="w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-xl flex items-center justify-center transition-colors shadow-sm shadow-orange-500/30">
            <Plus size={15} className="text-white" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={() => onUpdate(item.id, -1)} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
              <Minus size={11} className="text-gray-600" />
            </button>
            <span className="font-bold text-gray-800 text-sm w-4 text-center">{cartQty}</span>
            <button onClick={() => onUpdate(item.id, 1)} disabled={cartQty >= item.maxQuantity}
              className="w-7 h-7 bg-orange-500 hover:bg-orange-600 disabled:opacity-30 rounded-lg flex items-center justify-center transition-colors">
              <Plus size={11} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
