'use client'

import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'

interface MenuItem { id: number; name: string; price: number; ingredientCost?: number; prepTimeMinutes?: number }
interface Employee { id: number; name: string; hourlyRate: number; status: string }

const VAT_RATE = 0.17
const DEFAULT_SHIFTS_PER_MONTH = 22
const DEFAULT_HOURS_PER_SHIFT = 8
const DEFAULT_SUPPLIER_EXPENSE = 3000

export default function SimulatorPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  // Simulation inputs
  const [dishCounts, setDishCounts] = useState<Record<number, number>>({})
  const [shiftsPerMonth, setShiftsPerMonth] = useState(DEFAULT_SHIFTS_PER_MONTH)
  const [hoursPerShift, setHoursPerShift] = useState(DEFAULT_HOURS_PER_SHIFT)
  const [activeEmployeeIds, setActiveEmployeeIds] = useState<Set<number>>(new Set())
  const [extraExpenses, setExtraExpenses] = useState(DEFAULT_SUPPLIER_EXPENSE)
  const [showDetails, setShowDetails] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/menu').then((r) => r.json()),
      fetch('/api/employees').then((r) => r.json()),
    ]).then(([menu, emps]) => {
      const items: MenuItem[] = Array.isArray(menu) ? menu : []
      const empList: Employee[] = Array.isArray(emps) ? emps.filter((e: Employee) => e.status === 'ACTIVE') : []
      setMenuItems(items)
      setEmployees(empList)
      // Default: 10 of each dish
      const defaults: Record<number, number> = {}
      items.forEach((m) => { defaults[m.id] = 10 })
      setDishCounts(defaults)
      // All employees active by default
      setActiveEmployeeIds(new Set(empList.map((e) => e.id)))
      setLoading(false)
    })
  }, [])

  const sim = useMemo(() => {
    // Revenue
    const revenue = menuItems.reduce((s, m) => s + (dishCounts[m.id] || 0) * m.price, 0)
    const vat = revenue * (VAT_RATE / (1 + VAT_RATE))
    const revenueExVat = revenue - vat

    // Ingredient cost (from menu item data)
    const ingredientCost = menuItems.reduce((s, m) => {
      const qty = dishCounts[m.id] || 0
      const cost = m.ingredientCost || 0
      return s + qty * cost
    }, 0)

    // Labor cost
    const activeEmps = employees.filter((e) => activeEmployeeIds.has(e.id))
    const avgHourlyRate = activeEmps.length > 0
      ? activeEmps.reduce((s, e) => s + e.hourlyRate, 0) / activeEmps.length
      : 0
    const totalHours = shiftsPerMonth * hoursPerShift * activeEmps.length
    const laborCost = totalHours * avgHourlyRate

    // Total expenses
    const totalExpenses = ingredientCost + laborCost + extraExpenses
    const grossProfit = revenueExVat - totalExpenses
    const totalDishes = Object.values(dishCounts).reduce((s, v) => s + v, 0)

    return { revenue, vat, revenueExVat, ingredientCost, laborCost, extraExpenses, totalExpenses, grossProfit, totalDishes, totalHours, activeEmps }
  }, [menuItems, employees, dishCounts, shiftsPerMonth, hoursPerShift, activeEmployeeIds, extraExpenses])

  function setDish(id: number, val: number) {
    setDishCounts((prev) => ({ ...prev, [id]: Math.max(0, val) }))
  }

  function toggleEmployee(id: number) {
    setActiveEmployeeIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const profitColor = sim.grossProfit > 0 ? 'text-green-600' : sim.grossProfit < 0 ? 'text-red-600' : 'text-gray-600'
  const profitBg = sim.grossProfit > 0 ? 'bg-green-50 border-green-200' : sim.grossProfit < 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'

  if (loading) return <div className="text-center py-16 text-gray-400">טוען...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">סימולטור רווחים</h1>
          <p className="text-gray-500 text-sm mt-0.5">מה נשאר לבעלים לפני מיסים?</p>
        </div>
      </div>

      {/* Result card */}
      <div className={`rounded-2xl border p-5 mb-6 ${profitBg}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">רווח גולמי לבעלים (לפני מיסים)</p>
            <p className={`text-4xl font-bold ${profitColor}`}>
              {sim.grossProfit >= 0 ? '' : '-'}₪{Math.abs(sim.grossProfit).toFixed(0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {sim.totalDishes} מנות · {sim.totalHours.toFixed(0)} שעות עבודה
            </p>
          </div>
          <div>
            {sim.grossProfit > 0 ? <TrendingUp size={48} className="text-green-400 opacity-60" />
              : sim.grossProfit < 0 ? <TrendingDown size={48} className="text-red-400 opacity-60" />
              : <Minus size={48} className="text-gray-400 opacity-60" />}
          </div>
        </div>

        {/* Quick breakdown */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/60 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">הכנסה נטו</p>
            <p className="font-bold text-gray-800">₪{sim.revenueExVat.toFixed(0)}</p>
          </div>
          <div className="bg-white/60 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">הוצאות</p>
            <p className="font-bold text-red-600">₪{sim.totalExpenses.toFixed(0)}</p>
          </div>
          <div className="bg-white/60 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">מע״מ לשלם</p>
            <p className="font-bold text-gray-700">₪{sim.vat.toFixed(0)}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Dish counts */}
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between mb-3"
          >
            <h2 className="font-bold text-gray-800">🍽️ כמות מנות חודשית</h2>
            {showDetails ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>
          {showDetails && (
            <div className="space-y-2">
              {menuItems.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-gray-700 truncate">{m.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setDish(m.id, (dishCounts[m.id] || 0) - 5)}
                      className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold">−</button>
                    <input
                      type="number"
                      value={dishCounts[m.id] || 0}
                      onChange={(e) => setDish(m.id, parseInt(e.target.value) || 0)}
                      className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-center text-sm focus:outline-none"
                    />
                    <button onClick={() => setDish(m.id, (dishCounts[m.id] || 0) + 5)}
                      className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold">+</button>
                  </div>
                  <span className="text-xs text-gray-400 w-16 text-left shrink-0">₪{((dishCounts[m.id] || 0) * m.price).toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shifts & employees */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <h2 className="font-bold text-gray-800 mb-3">👷 כוח עבודה</h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">משמרות בחודש</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShiftsPerMonth(Math.max(1, shiftsPerMonth - 1))}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold">−</button>
                  <input
                    type="number"
                    value={shiftsPerMonth}
                    onChange={(e) => setShiftsPerMonth(parseInt(e.target.value) || 0)}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm focus:outline-none"
                  />
                  <button onClick={() => setShiftsPerMonth(shiftsPerMonth + 1)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold">+</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">שעות למשמרת</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setHoursPerShift(Math.max(1, hoursPerShift - 1))}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold">−</button>
                  <input
                    type="number"
                    value={hoursPerShift}
                    onChange={(e) => setHoursPerShift(parseInt(e.target.value) || 0)}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm focus:outline-none"
                  />
                  <button onClick={() => setHoursPerShift(hoursPerShift + 1)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold">+</button>
                </div>
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-500 mb-2">עובדים פעילים בחישוב:</p>
            <div className="space-y-1.5">
              {employees.map((e) => (
                <label key={e.id} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeEmployeeIds.has(e.id)}
                    onChange={() => toggleEmployee(e.id)}
                    className="rounded accent-orange-500"
                  />
                  <span className="text-sm text-gray-700 flex-1">{e.name}</span>
                  <span className="text-xs text-gray-400">₪{e.hourlyRate}/ש׳</span>
                </label>
              ))}
              {employees.length === 0 && <p className="text-xs text-gray-400 italic">אין עובדים פעילים</p>}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>עלות עבודה משוערת:</span>
                <span className="font-bold text-red-500">₪{sim.laborCost.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Other expenses */}
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <h2 className="font-bold text-gray-800 mb-3">💸 הוצאות נוספות</h2>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ספקים / שכירות / אחר (₪/חודש)</label>
              <input
                type="number"
                value={extraExpenses}
                onChange={(e) => setExtraExpenses(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full breakdown */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 mt-5">
        <h2 className="font-bold text-gray-800 mb-3">📊 פירוט מלא</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-600">הכנסה ברוטו</span>
            <span className="font-medium">₪{sim.revenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-600">מע״מ (17%)</span>
            <span className="font-medium text-orange-600">− ₪{sim.vat.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100 font-semibold">
            <span className="text-gray-700">הכנסה נטו</span>
            <span>₪{sim.revenueExVat.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-600">עלות חומרי גלם</span>
            <span className="font-medium text-red-500">− ₪{sim.ingredientCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-600">עלות עבודה ({sim.activeEmps.length} עובדים · {sim.totalHours.toFixed(0)} שעות)</span>
            <span className="font-medium text-red-500">− ₪{sim.laborCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-600">הוצאות נוספות</span>
            <span className="font-medium text-red-500">− ₪{sim.extraExpenses.toFixed(2)}</span>
          </div>
          <div className={`flex justify-between py-2.5 rounded-xl px-3 font-bold text-base ${profitBg} border mt-2`}>
            <span>רווח לבעלים (לפני מיסים)</span>
            <span className={profitColor}>₪{sim.grossProfit.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
