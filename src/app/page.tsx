'use client'

import { useEffect, useState, useCallback } from 'react'
import { ShoppingCart, X, Plus, Minus, Phone, User, MessageSquare, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react'
import PaymentModal from '@/components/PaymentModal'

interface Ingredient {
  ingredient: { name: string }
  quantity: number
}

interface MenuItem {
  id: number
  name: string
  description: string | null
  price: number
  category: string
  isAvailable: boolean
  isActive: boolean
  maxQuantity: number
  ingredients: Ingredient[]
}

interface CartItem {
  menuItem: MenuItem
  quantity: number
  notes: string
}

interface Settings {
  business_name?: string
  business_phone?: string
  paybox_link?: string
  bit_phone?: string
  event_active?: string
  [key: string]: string | undefined
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'ממתין',
  CONFIRMED: 'אושר',
  PREPARING: 'בהכנה',
  READY: 'מוכן לאיסוף',
  COMPLETED: 'הושלם',
  CANCELLED: 'בוטל',
}

export default function CustomerPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('הכל')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)

  // Order form
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
      const res = await fetch('/api/menu')
      const data = await res.json()
      setMenuItems(data)
      const cats = Array.from(new Set<string>(data.map((i: MenuItem) => i.category)))
      setCategories(cats)
    } catch {}
  }, [])

  useEffect(() => {
    fetchMenu()
    fetch('/api/settings')
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {})
    setLoading(false)

    // רענון תפריט כל 30 שניות
    const interval = setInterval(fetchMenu, 30000)
    return () => clearInterval(interval)
  }, [fetchMenu])

  const filteredItems =
    activeCategory === 'הכל' ? menuItems : menuItems.filter((i) => i.category === activeCategory)

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0)
  const totalPrice = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0)

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id)
      if (existing) {
        if (existing.quantity >= item.maxQuantity) return prev
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }]
    })
  }

  function removeFromCart(itemId: number) {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId))
  }

  function updateQty(itemId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.menuItem.id !== itemId) return c
          const newQty = c.quantity + delta
          if (newQty <= 0) return null as any
          if (newQty > c.menuItem.maxQuantity) return c
          return { ...c, quantity: newQty }
        })
        .filter(Boolean)
    )
  }

  function updateNotes(itemId: number, notes: string) {
    setCart((prev) => prev.map((c) => (c.menuItem.id === itemId ? { ...c, notes } : c)))
  }

  async function placeOrder() {
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('נא להזין שם ומספר טלפון')
      return
    }
    if (cart.length === 0) {
      setError('העגלה ריקה')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          notes: orderNotes,
          paymentMethod,
          items: cart.map((c) => ({
            menuItemId: c.menuItem.id,
            quantity: c.quantity,
            notes: c.notes,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'שגיאה ביצירת ההזמנה')
        return
      }
      setPlacedOrder(data)
      setCart([])
      setCartOpen(false)
      if (paymentMethod !== 'CASH') setShowPayment(true)
      await fetchMenu()
    } catch {
      setError('שגיאת רשת, נסה שוב')
    } finally {
      setSubmitting(false)
    }
  }

  async function trackOrder() {
    setTrackError('')
    setTrackedOrder(null)
    if (!trackOrderId.trim()) return
    try {
      const res = await fetch(`/api/orders/${trackOrderId}`)
      if (!res.ok) { setTrackError('הזמנה לא נמצאה'); return }
      const data = await res.json()
      setTrackedOrder(data)
    } catch {
      setTrackError('שגיאה, נסה שוב')
    }
  }

  if (settings.event_active === 'false') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🍽️</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{settings.business_name || 'מטבח הכפר'}</h1>
          <p className="text-gray-500 text-lg">האירוע אינו פעיל כרגע. נשוב בקרוב!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">{settings.business_name || 'מטבח הכפר'}</h1>
            {settings.business_phone && (
              <a href={`tel:${settings.business_phone}`} className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <Phone size={12} /> {settings.business_phone}
              </a>
            )}
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-colors"
          >
            <ShoppingCart size={20} />
            <span>עגלה</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Success banner */}
      {placedOrder && !showPayment && (
        <div className="bg-green-500 text-white p-4 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 font-semibold text-lg">
            <CheckCircle2 size={22} />
            ההזמנה נקלטה בהצלחה! מספר הזמנה: #{placedOrder.id}
          </div>
          <p className="text-green-100 text-sm mt-1">שמור את מספר ההזמנה למעקב</p>
          <button onClick={() => setPlacedOrder(null)} className="mt-2 text-green-100 text-sm underline">סגור</button>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {['הכל', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">טוען תפריט...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const cartQty = cart.find((c) => c.menuItem.id === item.id)?.quantity || 0
              const unavailable = !item.isAvailable || item.maxQuantity === 0

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl shadow-sm border transition-all ${
                    unavailable ? 'opacity-60' : 'hover:shadow-md'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                          {unavailable && (
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              אזל המלאי
                            </span>
                          )}
                          {!unavailable && item.maxQuantity <= 5 && (
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              נותרו {item.maxQuantity}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                        )}
                        <p className="text-orange-600 font-bold text-xl mt-2">₪{item.price}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {unavailable ? (
                        <span className="text-gray-400 text-sm">לא ניתן להזמין כרגע</span>
                      ) : cartQty === 0 ? (
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl font-medium transition-colors w-full"
                        >
                          הוסף לעגלה
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 w-full justify-between">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-bold text-lg text-gray-800">{cartQty}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            disabled={cartQty >= item.maxQuantity}
                            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Order tracking */}
        <div className="mt-10 bg-white rounded-2xl shadow-sm border p-5">
          <h2 className="font-bold text-gray-800 text-lg mb-3">מעקב הזמנה</h2>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="מספר הזמנה"
              value={trackOrderId}
              onChange={(e) => setTrackOrderId(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 flex-1 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              onClick={trackOrder}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
            >
              חפש
            </button>
          </div>
          {trackError && <p className="text-red-500 text-sm mt-2">{trackError}</p>}
          {trackedOrder && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold">הזמנה #{trackedOrder.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[trackedOrder.status]}`}>
                  {STATUS_LABELS[trackedOrder.status]}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {trackedOrder.items.map((item: any) => (
                  <div key={item.id}>{item.quantity}x {item.menuItem.name}</div>
                ))}
                <div className="font-bold text-orange-600 mt-1">סה"כ: ₪{trackedOrder.totalAmount}</div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl animate-fade-in flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-xl text-gray-800">עגלת הקניות</h2>
              <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-center p-8">
                <div>
                  <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                  <p>העגלה ריקה</p>
                  <p className="text-sm">הוסף פריטים מהתפריט</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map((c) => (
                  <div key={c.menuItem.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{c.menuItem.name}</p>
                        <p className="text-orange-600 font-bold">₪{(c.menuItem.price * c.quantity).toFixed(0)}</p>
                      </div>
                      <button onClick={() => removeFromCart(c.menuItem.id)} className="text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQty(c.menuItem.id, -1)} className="bg-white border w-7 h-7 rounded-lg flex items-center justify-center">
                        <Minus size={12} />
                      </button>
                      <span className="font-bold text-gray-800 w-6 text-center">{c.quantity}</span>
                      <button
                        onClick={() => updateQty(c.menuItem.id, 1)}
                        disabled={c.quantity >= c.menuItem.maxQuantity}
                        className="bg-orange-500 text-white w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <input
                      placeholder="הערות לפריט זה..."
                      value={c.notes}
                      onChange={(e) => updateNotes(c.menuItem.id, e.target.value)}
                      className="mt-2 w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-300"
                    />
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="p-4 border-t space-y-3">
                {/* Customer details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <User size={16} className="text-gray-400" />
                    <input
                      placeholder="שם מלא *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <Phone size={16} className="text-gray-400" />
                    <input
                      placeholder="טלפון *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      type="tel"
                      className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <MessageSquare size={16} className="text-gray-400" />
                    <input
                      placeholder="הערות כלליות להזמנה..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">אמצעי תשלום:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['CASH', 'PAYBOX', 'BIT'] as const).map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                          paymentMethod === method
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        {method === 'CASH' ? 'מזומן' : method === 'PAYBOX' ? 'Paybox' : 'Bit'}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-3">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between py-2">
                  <span className="font-bold text-gray-800 text-lg">סה"כ:</span>
                  <span className="font-bold text-orange-600 text-xl">₪{totalPrice.toFixed(0)}</span>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={submitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-lg transition-colors"
                >
                  {submitting ? 'שולח...' : 'שלח הזמנה'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && placedOrder && (
        <PaymentModal
          order={placedOrder}
          settings={settings}
          onClose={() => {
            setShowPayment(false)
            setPlacedOrder(null)
          }}
        />
      )}
    </div>
  )
}
