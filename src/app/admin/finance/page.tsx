'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, ShoppingCart, Receipt, Users, DollarSign, RefreshCw, Calculator } from 'lucide-react'

interface Summary {
  totalRevenue: number; vatFromRevenue: number; revenueBeforeVat: number
  totalExpenses: number; totalPurchases: number; totalCosts: number
  profit: number; orderCount: number
}

const PERIODS = [
  { label: 'היום', days: 0 },
  { label: '7 ימים', days: 7 },
  { label: '30 ימים', days: 30 },
  { label: '90 ימים', days: 90 },
  { label: 'הכל', days: -1 },
]

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function FinancePage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(0) // index into PERIODS

  async function load(periodIdx: number) {
    setLoading(true)
    const p = PERIODS[periodIdx]
    let url = '/api/finance/summary'
    if (p.days === 0) {
      const from = startOfDay(new Date()).toISOString()
      url += `?from=${from}`
    } else if (p.days > 0) {
      const from = new Date(Date.now() - p.days * 86400000).toISOString()
      url += `?from=${from}`
    }
    const r = await fetch(url)
    const data = await r.json()
    setSummary(data)
    setLoading(false)
  }

  useEffect(() => { load(period) }, [period])

  function fmt(n: number) { return `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">מודול כספים</h1>
        <button onClick={() => load(period)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm px-3 py-2 rounded-xl hover:bg-white">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> רענן
        </button>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border w-fit">
        {PERIODS.map((p, idx) => (
          <button key={idx} onClick={() => setPeriod(idx)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${period === idx ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading || !summary ? (
        <div className="text-center py-12 text-gray-400">טוען...</div>
      ) : (
        <>
          {/* Main summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-green-100 p-2 rounded-xl"><TrendingUp size={20} className="text-green-600" /></div>
                <p className="text-sm text-gray-500 font-medium">הכנסות</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{fmt(summary.totalRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">{summary.orderCount} הזמנות</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-100 p-2 rounded-xl"><Receipt size={20} className="text-blue-600" /></div>
                <p className="text-sm text-gray-500 font-medium">מע״מ (17%)</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{fmt(summary.vatFromRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">כולל בהכנסות</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-red-100 p-2 rounded-xl"><TrendingDown size={20} className="text-red-600" /></div>
                <p className="text-sm text-gray-500 font-medium">הוצאות סה״כ</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{fmt(summary.totalCosts)}</p>
              <p className="text-xs text-gray-400 mt-1">קניות + הוצאות</p>
            </div>

            <div className={`rounded-2xl p-5 shadow-sm border ${summary.profit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-xl ${summary.profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <DollarSign size={20} className={summary.profit >= 0 ? 'text-green-600' : 'text-red-600'} />
                </div>
                <p className="text-sm text-gray-500 font-medium">רווח נקי</p>
              </div>
              <p className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(summary.profit)}</p>
              <p className="text-xs text-gray-400 mt-1">הכנסות פחות הוצאות</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border">
              <h2 className="font-bold text-gray-800 mb-4">פירוט הכנסות</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">הכנסות ברוטו (כולל מע״מ)</span>
                  <span className="font-bold text-gray-900">{fmt(summary.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">מע״מ לתשלום (17%)</span>
                  <span className="font-bold text-red-600">{fmt(summary.vatFromRevenue)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-800 font-medium">הכנסות נטו (לפני מע״מ)</span>
                  <span className="font-bold text-green-700 text-base">{fmt(summary.revenueBeforeVat)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border">
              <h2 className="font-bold text-gray-800 mb-4">פירוט הוצאות</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">קניות מספקים</span>
                  <span className="font-bold text-gray-900">{fmt(summary.totalPurchases)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">הוצאות שוטפות</span>
                  <span className="font-bold text-gray-900">{fmt(summary.totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-800 font-medium">סה״כ הוצאות</span>
                  <span className="font-bold text-red-700 text-base">{fmt(summary.totalCosts)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Link href="/admin/finance/purchases"
              className="bg-white hover:bg-orange-50 border rounded-2xl p-4 flex items-center gap-3 transition-colors group">
              <div className="bg-orange-100 p-3 rounded-xl"><ShoppingCart size={20} className="text-orange-600" /></div>
              <div>
                <p className="font-bold text-gray-800">קניות מספקים</p>
                <p className="text-xs text-gray-500">הוסף רכישה ועדכן מלאי</p>
              </div>
            </Link>
            <Link href="/admin/finance/expenses"
              className="bg-white hover:bg-red-50 border rounded-2xl p-4 flex items-center gap-3 transition-colors group">
              <div className="bg-red-100 p-3 rounded-xl"><Receipt size={20} className="text-red-600" /></div>
              <div>
                <p className="font-bold text-gray-800">הוצאות</p>
                <p className="text-xs text-gray-500">ציוד, שיווק, אחר</p>
              </div>
            </Link>
            <Link href="/admin/finance/suppliers"
              className="bg-white hover:bg-blue-50 border rounded-2xl p-4 flex items-center gap-3 transition-colors group">
              <div className="bg-blue-100 p-3 rounded-xl"><Users size={20} className="text-blue-600" /></div>
              <div>
                <p className="font-bold text-gray-800">ספקים</p>
                <p className="text-xs text-gray-500">ניהול רשימת ספקים</p>
              </div>
            </Link>
            <Link href="/admin/finance/simulator"
              className="bg-white hover:bg-green-50 border rounded-2xl p-4 flex items-center gap-3 transition-colors group">
              <div className="bg-green-100 p-3 rounded-xl"><Calculator size={20} className="text-green-600" /></div>
              <div>
                <p className="font-bold text-gray-800">סימולטור רווחים</p>
                <p className="text-xs text-gray-500">מה נשאר לבעלים?</p>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
