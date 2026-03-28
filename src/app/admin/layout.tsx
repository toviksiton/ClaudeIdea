'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, UtensilsCrossed, ClipboardList, Settings, Menu, X, LogOut, TrendingUp, ShoppingCart, Users, CalendarDays, Truck } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'לוח בקרה', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'הזמנות', icon: ClipboardList },
  { href: '/admin/inventory', label: 'מלאי', icon: Package },
  { href: '/admin/menu', label: 'תפריט', icon: UtensilsCrossed },
  { href: '/admin/shopping-list', label: 'רשימת קניות', icon: ShoppingCart },
  { href: '/admin/suppliers', label: 'ספקים', icon: Truck },
  { href: '/admin/employees', label: 'עובדים', icon: Users },
  { href: '/admin/shifts', label: 'משמרות', icon: CalendarDays },
  { href: '/admin/finance', label: 'כספים', icon: TrendingUp },
  { href: '/admin/settings', label: 'הגדרות', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_authed')
    if (stored === 'true') setAuthed(true)
    fetch('/api/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((s) => { setLogoUrl(s.logo_url || ''); setBusinessName(s.business_name || '') })
      .catch(() => {})
  }, [])

  function login() {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((settings) => {
        const adminPwd = settings.admin_password || 'admin123'
        if (password === adminPwd) {
          sessionStorage.setItem('admin_authed', 'true')
          setAuthed(true)
          setError('')
        } else {
          setError('סיסמה שגויה')
        }
      })
  }

  function logout() {
    sessionStorage.removeItem('admin_authed')
    setAuthed(false)
    setPassword('')
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔒</div>
            <h1 className="text-2xl font-bold text-gray-800">פאנל ניהול</h1>
            <p className="text-gray-500 text-sm mt-1">הזן סיסמת מנהל</p>
          </div>
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800"
          />
          {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
          <button
            onClick={login}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-colors"
          >
            כניסה
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex" dir="rtl">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-60 bg-gray-900 text-white flex-col fixed h-full">
        <div className="p-5 border-b border-gray-700 flex items-center gap-3">
          {logoUrl && (
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-700 shrink-0">
              <img src={logoUrl} alt="לוגו" className="w-full h-full object-contain p-0.5" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg text-orange-400 leading-tight">{businessName || 'מטבח הכפר'}</h1>
            <p className="text-gray-400 text-xs">פאנל ניהול</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                  active ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white text-sm w-full rounded-xl hover:bg-gray-800 transition-colors"
          >
            <LogOut size={16} />
            יציאה
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white text-sm w-full rounded-xl hover:bg-gray-800 transition-colors mt-1"
          >
            → לדף ההזמנות
          </Link>
          <Link
            href="/kitchen"
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white text-sm w-full rounded-xl hover:bg-gray-800 transition-colors mt-1"
          >
            → מסך מטבח
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-orange-400">פאנל ניהול</h1>
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-gray-900 text-white pt-16 p-4">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 text-gray-200"
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main */}
      <main className="md:mr-60 flex-1 p-4 md:p-6 mt-14 md:mt-0">
        {children}
      </main>
    </div>
  )
}
