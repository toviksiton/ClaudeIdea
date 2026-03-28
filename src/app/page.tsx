'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { ShoppingBag, X, Plus, Minus, Search, ChevronRight, Phone, MessageSquare, SlidersHorizontal, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
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
  bit_phone?: string; event_active?: string; [key: string]: string | undefined
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
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollTimeout = useRef<any>(null)

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu')
      const data = await res.json()
      if (Array.isArray(data)) {
        setMenuItems(data)
        const cats = Array.from(new Set<string>(data.map((i: MenuItem) => i.category)))
        setCategories(cats)
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchMenu()
    fetch('/api/settings').then((r) => r.json()).then(setSettings).catch(() => {})
    setLoading(false)
    const interval = setInterval(fetchMenu, 15000)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchMenu() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) }
  }, [fetchMenu])

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0)
  const totalPrice = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0)

  const filteredItems = menuItems.filter((item) => {
    const matchCat = activeCategory === 'הכל' || item.category === activeCategory
    const matchSearch = !search || item.name.includes(search) || item.description?.includes(search)
    return matchCat && matchSearch
  })

  // Group by category when showing all
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

  if (settings.event_active === 'false') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl">🍽️</div>
          <h1 className="text-3xl font-bold text-white mb-2">{settings.business_name || 'מטבח הכפר'}</h1>
          <p className="text-zinc-400">האירוע אינו פעיל כרגע. נשוב בקרוב!</p>
        </div>
      </div>
    )
  }

  const STATUS_LABELS: Record<string, string> = { PENDING: 'ממתין', CONFIRMED: 'אושר', PREPARING: 'בהכנה', READY: 'מוכן לאיסוף', COMPLETED: 'הושלם', CANCELLED: 'בוטל' }
  const STATUS_COLORS: Record<string, string> = { PENDING: 'text-amber-400 bg-amber-400/10', CONFIRMED: 'text-blue-400 bg-blue-400/10', PREPARING: 'text-orange-400 bg-orange-400/10', READY: 'text-green-400 bg-green-400/10', COMPLETED: 'text-zinc-400 bg-zinc-400/10', CANCELLED: 'text-red-400 bg-red-400/10' }

  return (
    <div className="min-h-screen bg-zinc-950 text-white" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>

      {/* ── Hero Header ────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-zinc-900 px-5 pt-10 pb-8">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #f97316 0%, transparent 60%), radial-gradient(circle at 80% 20%, #fb923c 0%, transparent 50%)' }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-zinc-400 text-sm mb-0.5">ברוך הבא אל</p>
              <h1 className="text-2xl font-bold text-white">{settings.business_name || 'מטבח הכפר'}</h1>
            </div>
            {settings.business_phone && (
              <a href={`tel:${settings.business_phone}`} className="w-10 h-10 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-300 hover:text-orange-400 transition-colors">
                <Phone size={18} />
              </a>
            )}
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              placeholder="חיפוש מנה..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl pr-10 pl-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ── Category Tabs ───────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['הכל', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSearch('') }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              <span>{categoryEmoji(cat)}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Success banner ──────────────────────────────────── */}
      {placedOrder && !showPayment && (
        <div className="mx-4 mt-4 bg-green-500/15 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-400 shrink-0" />
          <div className="flex-1">
            <p className="text-green-300 font-semibold text-sm">הזמנה #{placedOrder.id} נקלטה!</p>
            <p className="text-green-400/70 text-xs">שמור את מספר ההזמנה למעקב</p>
          </div>
          <button onClick={() => setPlacedOrder(null)} className="text-green-500 hover:text-green-300"><X size={16} /></button>
        </div>
      )}

      {/* ── Menu ────────────────────────────────────────────── */}
      <main className="px-4 py-5 pb-36">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">טוען תפריט...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <p className="text-4xl mb-3">🔍</p>
            <p>לא נמצאו פריטים</p>
          </div>
        ) : activeCategory === 'הכל' && !search ? (
          // Grouped view
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} ref={(el) => { categoryRefs.current[cat] = el }} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{categoryEmoji(cat)}</span>
                <h2 className="font-bold text-white text-lg">{cat}</h2>
                <div className="flex-1 h-px bg-zinc-800 mr-2" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((item) => <MenuCard key={item.id} item={item} cart={cart} onAdd={addToCart} onUpdate={updateQty} />)}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.map((item) => <MenuCard key={item.id} item={item} cart={cart} onAdd={addToCart} onUpdate={updateQty} />)}
          </div>
        )}

        {/* ── Order Tracking ───────────────────────────────── */}
        <div className="mt-6 bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
          <h2 className="font-bold text-white mb-3 text-base">מעקב הזמנה</h2>
          <div className="flex gap-2">
            <input type="number" placeholder="מספר הזמנה" value={trackOrderId} onChange={(e) => setTrackOrderId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && trackOrder()}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500" />
            <button onClick={trackOrder} className="bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-2xl text-sm font-medium transition-colors">
              חפש
            </button>
          </div>
          {trackError && <p className="text-red-400 text-sm mt-2">{trackError}</p>}
          {trackedOrder && (
            <div className="mt-3 bg-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-white">#{trackedOrder.id}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[trackedOrder.status]}`}>
                  {STATUS_LABELS[trackedOrder.status]}
                </span>
              </div>
              {trackedOrder.items.map((item: any) => (
                <p key={item.id} className="text-zinc-400 text-sm">{item.quantity}× {item.menuItem.name}</p>
              ))}
              <p className="text-orange-400 font-bold mt-2">₪{trackedOrder.totalAmount}</p>
            </div>
          )}
        </div>
      </main>

      {/* ── Floating Cart Bar ───────────────────────────────── */}
      {totalItems > 0 && !cartOpen && (
        <div className="fixed bottom-5 right-4 left-4 z-40">
          <button onClick={() => setCartOpen(true)}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white rounded-3xl px-5 py-4 flex items-center justify-between shadow-2xl shadow-orange-500/40 transition-all active:scale-98">
            <div className="bg-white/20 rounded-2xl w-8 h-8 flex items-center justify-center text-sm font-bold">
              {totalItems}
            </div>
            <span className="font-bold text-base">צפה בעגלה</span>
            <span className="font-bold text-lg">₪{totalPrice.toFixed(0)}</span>
          </button>
        </div>
      )}

      {/* ── Cart Sheet ──────────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" dir="rtl">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="bg-zinc-900 rounded-t-3xl border-t border-zinc-800 max-h-[90vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-zinc-700 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
              <h2 className="font-bold text-xl text-white">ההזמנה שלי</h2>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              {cart.map((c) => (
                <div key={c.menuItem.id} className="bg-zinc-800 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{c.menuItem.name}</p>
                      <p className="text-orange-400 font-bold">₪{(c.menuItem.price * c.quantity).toFixed(0)}</p>
                    </div>
                    <button onClick={() => removeFromCart(c.menuItem.id)} className="text-zinc-600 hover:text-red-400 transition-colors"><X size={15} /></button>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => updateQty(c.menuItem.id, -1)} className="w-8 h-8 bg-zinc-700 hover:bg-zinc-600 rounded-xl flex items-center justify-center transition-colors">
                      <Minus size={14} className="text-white" />
                    </button>
                    <span className="font-bold text-white w-6 text-center">{c.quantity}</span>
                    <button onClick={() => updateQty(c.menuItem.id, 1)} disabled={c.quantity >= c.menuItem.maxQuantity} className="w-8 h-8 bg-orange-500 hover:bg-orange-400 disabled:opacity-30 rounded-xl flex items-center justify-center transition-colors">
                      <Plus size={14} className="text-white" />
                    </button>
                  </div>
                  <input placeholder="הערות לפריט..." value={c.notes} onChange={(e) => updateNotes(c.menuItem.id, e.target.value)}
                    className="w-full bg-zinc-700/50 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-orange-500" />
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-zinc-800 space-y-4">
              {/* Customer info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input placeholder="שם מלא *" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div className="relative">
                  <input placeholder="טלפון *" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <input placeholder="הערות להזמנה..." value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500" />

              {/* Payment */}
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'PAYBOX', 'BIT'] as const).map((m) => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className={`py-2.5 rounded-2xl text-sm font-medium transition-all ${paymentMethod === m ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'}`}>
                    {m === 'CASH' ? '💵 מזומן' : m === 'PAYBOX' ? '💳 Paybox' : '📱 Bit'}
                  </button>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-2xl p-3">
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">סה״כ</span>
                <span className="font-bold text-white text-xl">₪{totalPrice.toFixed(0)}</span>
              </div>

              <button onClick={placeOrder} disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-orange-500/25 active:scale-98">
                {submitting ? 'שולח...' : 'שלח הזמנה →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && placedOrder && (
        <PaymentModal order={placedOrder} settings={settings} onClose={() => { setShowPayment(false); setPlacedOrder(null) }} />
      )}
    </div>
  )
}

// ── Menu Card Component ──────────────────────────────────────
function MenuCard({ item, cart, onAdd, onUpdate }: {
  item: MenuItem; cart: CartItem[]
  onAdd: (i: MenuItem) => void; onUpdate: (id: number, delta: number) => void
}) {
  const cartQty = cart.find((c) => c.menuItem.id === item.id)?.quantity || 0
  const unavailable = !item.isAvailable || item.maxQuantity === 0

  return (
    <div className={`bg-zinc-900 rounded-3xl border transition-all overflow-hidden ${
      unavailable ? 'border-zinc-800 opacity-50' : 'border-zinc-800 hover:border-zinc-700'
    }`}>
      {/* Emoji / color header */}
      <div className="h-28 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative overflow-hidden">
        <span className="text-5xl">{categoryEmoji(item.category)}</span>
        {unavailable && (
          <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center">
            <span className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30">אזל המלאי</span>
          </div>
        )}
        {!unavailable && item.maxQuantity <= 5 && (
          <div className="absolute top-2 left-2">
            <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/30">נותרו {item.maxQuantity}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-white text-base leading-tight mb-1">{item.name}</h3>
        {item.description && <p className="text-zinc-500 text-xs mb-2 line-clamp-2">{item.description}</p>}
        {item.prepTimeMinutes > 0 && (
          <p className="text-zinc-600 text-xs mb-2 flex items-center gap-1"><Clock size={10} /> {item.prepTimeMinutes} דקות</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-orange-400 font-bold text-lg">₪{item.price}</span>
          {unavailable ? null : cartQty === 0 ? (
            <button onClick={() => onAdd(item)}
              className="w-8 h-8 bg-orange-500 hover:bg-orange-400 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-md shadow-orange-500/30">
              <Plus size={16} className="text-white" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => onUpdate(item.id, -1)} className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center">
                <Minus size={12} className="text-zinc-300" />
              </button>
              <span className="font-bold text-white text-sm w-5 text-center">{cartQty}</span>
              <button onClick={() => onUpdate(item.id, 1)} disabled={cartQty >= item.maxQuantity}
                className="w-7 h-7 bg-orange-500 hover:bg-orange-400 disabled:opacity-30 rounded-lg flex items-center justify-center">
                <Plus size={12} className="text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
