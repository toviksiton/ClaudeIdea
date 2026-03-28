'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Package, AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/orders?limit=100').then((r) => r.json()),
      fetch('/api/inventory').then((r) => r.json()),
    ]).then(([o, i]) => {
      setOrders(Array.isArray(o) ? o : [])
      setIngredients(Array.isArray(i) ? i : [])
      setLoading(false)
    })

    const interval = setInterval(() => {
      fetch('/api/orders?limit=100').then((r) => r.json()).then((o) => setOrders(Array.isArray(o) ? o : []))
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const today = new Date().toDateString()
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today)
  const pendingOrders = orders.filter((o) => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status))
  const todayRevenue = todayOrders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0)

  const lowStockIngredients = ingredients.filter((i) => i.quantity <= i.alertLevel)

  const recentOrders = orders.slice(0, 8)

  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'ממתין',
    CONFIRMED: 'אושר',
    PREPARING: 'בהכנה',
    READY: 'מוכן',
    COMPLETED: 'הושלם',
    CANCELLED: 'בוטל',
  }
  const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PREPARING: 'bg-orange-100 text-orange-800',
    READY: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-800',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">לוח בקרה</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-100 p-2 rounded-xl"><ShoppingBag size={20} className="text-orange-600" /></div>
            <p className="text-gray-500 text-sm">הזמנות היום</p>
          </div>
          <p className="text-3xl font-bold text-gray-800">{todayOrders.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 p-2 rounded-xl"><Clock size={20} className="text-yellow-600" /></div>
            <p className="text-gray-500 text-sm">ממתינות לטיפול</p>
          </div>
          <p className="text-3xl font-bold text-gray-800">{pendingOrders.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-xl"><TrendingUp size={20} className="text-green-600" /></div>
            <p className="text-gray-500 text-sm">הכנסות היום</p>
          </div>
          <p className="text-3xl font-bold text-gray-800">₪{todayRevenue.toFixed(0)}</p>
        </div>
        <div className={`rounded-2xl p-4 shadow-sm border ${lowStockIngredients.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${lowStockIngredients.length > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle size={20} className={lowStockIngredients.length > 0 ? 'text-red-600' : 'text-gray-400'} />
            </div>
            <p className="text-gray-500 text-sm">התראות מלאי</p>
          </div>
          <p className={`text-3xl font-bold ${lowStockIngredients.length > 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {lowStockIngredients.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alert */}
        {lowStockIngredients.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-red-600" />
              <h2 className="font-bold text-red-800">מלאי נמוך</h2>
            </div>
            <div className="space-y-2">
              {lowStockIngredients.map((ing) => (
                <div key={ing.id} className="flex items-center justify-between text-sm">
                  <span className="text-red-700 font-medium">{ing.name}</span>
                  <span className="text-red-600 font-bold">
                    {ing.quantity} {ing.unit} (מינימום: {ing.alertLevel})
                  </span>
                </div>
              ))}
            </div>
            <Link href="/admin/inventory" className="mt-3 inline-block text-sm text-red-600 font-medium underline">
              עדכן מלאי →
            </Link>
          </div>
        )}

        {/* Recent orders */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">הזמנות אחרונות</h2>
            <Link href="/admin/orders" className="text-orange-500 text-sm hover:underline">הכל →</Link>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm">טוען...</p>
          ) : recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">אין הזמנות עדיין</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="font-medium text-gray-800 text-sm">#{order.id} {order.customerName}</span>
                    <p className="text-gray-400 text-xs">{new Date(order.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-600 text-sm">₪{order.totalAmount}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/kitchen" className="bg-gray-800 hover:bg-gray-700 text-white rounded-2xl p-4 text-center transition-colors">
          <div className="text-2xl mb-1">👨‍🍳</div>
          <p className="font-medium">מסך מטבח</p>
        </Link>
        <Link href="/" className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl p-4 text-center transition-colors">
          <div className="text-2xl mb-1">🛒</div>
          <p className="font-medium">דף הזמנות לקוח</p>
        </Link>
        <Link href="/admin/inventory" className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl p-4 text-center transition-colors">
          <div className="text-2xl mb-1">📦</div>
          <p className="font-medium">עדכון מלאי</p>
        </Link>
      </div>
    </div>
  )
}
