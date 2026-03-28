'use client'

import { useEffect, useState, useRef } from 'react'
import { AlertTriangle, ShoppingCart, Printer, RefreshCw, CheckSquare, Square, Package } from 'lucide-react'

interface Ingredient {
  id: number; name: string; unit: string; quantity: number; alertLevel: number; costPerUnit: number
  supplierId: number | null
  supplier: { name: string } | null
  menuItemIngredients: { quantity: number; menuItem: { name: string } }[]
}

export default function ShoppingListPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [buffer, setBuffer] = useState(1.5) // מכפיל כמות (לוודא שיש מספיק)

  async function load() {
    setLoading(true)
    const r = await fetch('/api/inventory')
    const d = await r.json()
    setIngredients(Array.isArray(d) ? d : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const lowStock = ingredients.filter((i) => i.quantity <= i.alertLevel)
  const criticalStock = ingredients.filter((i) => i.quantity === 0)

  function toggleCheck(id: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function checkAll() { setChecked(new Set(lowStock.map((i) => i.id))) }
  function uncheckAll() { setChecked(new Set()) }

  function suggestedQty(ing: Ingredient) {
    return Math.max(ing.alertLevel * buffer - ing.quantity, 0)
  }

  function estimatedCost(ing: Ingredient) {
    return suggestedQty(ing) * ing.costPerUnit
  }

  const totalEstimated = lowStock.reduce((s, i) => s + estimatedCost(i), 0)

  function print() { window.print() }

  // Group by supplier
  const bySupplier: Record<string, Ingredient[]> = {}
  lowStock.forEach((ing) => {
    const key = ing.supplier?.name || 'ללא ספק'
    if (!bySupplier[key]) bySupplier[key] = []
    bySupplier[key].push(ing)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">רשימת קניות מעודכנת</h1>
          <p className="text-gray-500 text-sm mt-0.5">מרכיבים שצריך לרכוש</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm px-3 py-2 rounded-xl hover:bg-white">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> רענן
          </button>
          <button onClick={print} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl font-medium text-sm print:hidden">
            <Printer size={15} /> הדפס
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5 print:hidden">
        <div className={`rounded-2xl border p-4 ${criticalStock.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className="text-xs text-gray-500 mb-1">נגמר לגמרי</p>
          <p className={`text-2xl font-bold ${criticalStock.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>{criticalStock.length}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-gray-500 mb-1">מלאי נמוך</p>
          <p className="text-2xl font-bold text-amber-600">{lowStock.length}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-gray-500 mb-1">עלות משוערת</p>
          <p className="text-2xl font-bold text-gray-800">₪{totalEstimated.toFixed(0)}</p>
        </div>
      </div>

      {/* Buffer control */}
      <div className="bg-white rounded-2xl border p-4 mb-5 flex items-center gap-4 print:hidden">
        <Package size={18} className="text-gray-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">מכפיל כמות קנייה</p>
          <p className="text-xs text-gray-400">כמה פעמים מעל רמת ההתראה לקנות</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setBuffer(Math.max(1, buffer - 0.5))} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg text-lg font-bold">−</button>
          <span className="font-bold text-gray-800 w-8 text-center">×{buffer}</span>
          <button onClick={() => setBuffer(buffer + 0.5)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg text-lg font-bold">+</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">טוען...</div>
      ) : lowStock.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-bold text-green-700 text-lg">המלאי מלא!</p>
          <p className="text-green-600 text-sm mt-1">אין צורך בקניות כרגע</p>
        </div>
      ) : (
        <>
          {/* Print header */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold">רשימת קניות</h1>
            <p className="text-gray-500">{new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Check controls */}
          <div className="flex items-center gap-3 mb-4 print:hidden">
            <button onClick={checkAll} className="text-sm text-orange-500 hover:underline">סמן הכל</button>
            <span className="text-gray-300">|</span>
            <button onClick={uncheckAll} className="text-sm text-gray-400 hover:underline">נקה הכל</button>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">{checked.size} / {lowStock.length} נבחרו</span>
          </div>

          {/* By supplier */}
          {Object.entries(bySupplier).map(([supplierName, items]) => (
            <div key={supplierName} className="bg-white rounded-2xl border shadow-sm mb-4 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-gray-500" />
                  <span className="font-bold text-gray-700 text-sm">{supplierName}</span>
                </div>
                <span className="text-xs text-gray-400">{items.length} פריטים</span>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((ing) => {
                  const isChecked = checked.has(ing.id)
                  const outOfStock = ing.quantity === 0
                  const suggested = suggestedQty(ing)
                  const cost = estimatedCost(ing)

                  return (
                    <div key={ing.id} onClick={() => toggleCheck(ing.id)}
                      className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors ${isChecked ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                      {/* Checkbox */}
                      <div className="print:hidden shrink-0">
                        {isChecked ? <CheckSquare size={20} className="text-green-500" /> : <Square size={20} className="text-gray-300" />}
                      </div>
                      <div className="print:block hidden w-5 h-5 border-2 border-gray-400 rounded shrink-0" />

                      {/* Status dot */}
                      <div className={`w-2 h-2 rounded-full shrink-0 ${outOfStock ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>{ing.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          יש: <span className={`font-medium ${outOfStock ? 'text-red-500' : 'text-amber-600'}`}>{ing.quantity} {ing.unit}</span>
                          {' · '}התראה: {ing.alertLevel} {ing.unit}
                        </p>
                        {ing.menuItemIngredients.length > 0 && (
                          <p className="text-xs text-gray-300 mt-0.5">
                            {ing.menuItemIngredients.slice(0, 3).map((m) => m.menuItem.name).join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Suggested buy */}
                      <div className="text-left shrink-0">
                        <p className="font-bold text-gray-800 text-sm">{suggested.toFixed(1)} {ing.unit}</p>
                        {cost > 0 && <p className="text-xs text-gray-400">~₪{cost.toFixed(0)}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Total */}
          {totalEstimated > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
              <span className="font-bold text-gray-700">עלות משוערת לרכישה</span>
              <span className="font-bold text-orange-600 text-xl">₪{totalEstimated.toFixed(2)}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
