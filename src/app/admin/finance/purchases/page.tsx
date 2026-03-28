'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Save, X, ChevronRight, Package } from 'lucide-react'
import Link from 'next/link'

interface Supplier { id: number; name: string }
interface Ingredient { id: number; name: string; unit: string; costPerUnit: number }
interface Purchase {
  id: number; description: string; quantity: number; costPerUnit: number; totalAmount: number
  date: string; notes: string | null; vatIncluded: boolean
  supplier: Supplier | null; ingredient: Ingredient | null
}

const EMPTY = {
  supplierId: '', ingredientId: '', description: '',
  quantity: '', costPerUnit: '', totalAmount: '',
  date: new Date().toISOString().slice(0, 10), notes: '', vatIncluded: true,
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const [p, s, i] = await Promise.all([
      fetch('/api/finance/purchases').then((r) => r.json()),
      fetch('/api/finance/suppliers').then((r) => r.json()),
      fetch('/api/inventory').then((r) => r.json()),
    ])
    setPurchases(Array.isArray(p) ? p : [])
    setSuppliers(Array.isArray(s) ? s : [])
    setIngredients(Array.isArray(i) ? i : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  function showMsg(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  // Auto-calculate total when qty × cost changes
  function updateForm(patch: Partial<typeof EMPTY>) {
    const next = { ...form, ...patch }
    const qty = parseFloat(next.quantity) || 0
    const cpu = parseFloat(next.costPerUnit) || 0
    if ((patch.quantity !== undefined || patch.costPerUnit !== undefined) && qty > 0 && cpu > 0) {
      next.totalAmount = (qty * cpu).toFixed(2)
    }
    setForm(next)
  }

  async function create() {
    if (!form.description.trim()) return
    setSaving(true)
    await fetch('/api/finance/purchases', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    })
    setShowNew(false); setForm(EMPTY); await load(); showMsg('קנייה נרשמה ומלאי עודכן')
    setSaving(false)
  }

  async function del(id: number) {
    if (!confirm('למחוק קנייה זו?')) return
    await fetch(`/api/finance/purchases/${id}`, { method: 'DELETE' }); await load(); showMsg('קנייה נמחקה')
  }

  const total = purchases.reduce((s, p) => s + p.totalAmount, 0)

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link href="/admin/finance" className="text-gray-400 hover:text-orange-500 text-sm">כספים</Link>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="text-gray-700 text-sm font-medium">קניות מספקים</span>
      </div>
      <div className="flex items-center justify-between mb-6 mt-2">
        <h1 className="text-2xl font-bold text-gray-800">קניות מספקים</h1>
        <button onClick={() => { setShowNew(true); setForm(EMPTY) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium text-sm">
          <Plus size={16} /> קנייה חדשה
        </button>
      </div>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 mb-4 text-sm">{msg}</div>}

      {showNew && (
        <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4 animate-fade-in">
          <h3 className="font-bold text-gray-800 mb-3">קנייה חדשה</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ספק</label>
              <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                <option value="">— ללא ספק —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">מרכיב (לעדכון מלאי)</label>
              <select value={form.ingredientId} onChange={(e) => {
                const ing = ingredients.find((i) => i.id === parseInt(e.target.value))
                updateForm({ ingredientId: e.target.value, costPerUnit: ing?.costPerUnit ? String(ing.costPerUnit) : form.costPerUnit })
              }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                <option value="">— ללא מרכיב —</option>
                {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="text-xs text-gray-500 mb-1 block">תיאור</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="רכישת קציצות"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">כמות</label>
              <input type="number" step="0.1" value={form.quantity} onChange={(e) => updateForm({ quantity: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">עלות ליחידה (₪)</label>
              <input type="number" step="0.01" value={form.costPerUnit} onChange={(e) => updateForm({ costPerUnit: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">סכום סופי (₪)</label>
              <input type="number" step="0.01" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">תאריך</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">הערות</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-3 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={form.vatIncluded} onChange={(e) => setForm({ ...form, vatIncluded: e.target.checked })} className="rounded" />
            הסכום כולל מע״מ (17%)
          </label>
          {form.ingredientId && (
            <p className="text-xs text-blue-600 mt-2 bg-blue-50 rounded-lg p-2 flex items-center gap-1">
              <Package size={12} /> רישום קנייה זו יעדכן את כמות המרכיב במלאי ואת עלות היחידה שלו
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button onClick={create} disabled={saving} className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium"><Save size={14} /> רשום קנייה</button>
            <button onClick={() => setShowNew(false)} className="text-gray-500 px-3 py-2 text-sm"><X size={14} /></button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">טוען...</div>
          : purchases.length === 0 ? <div className="p-8 text-center text-gray-400">אין קניות רשומות.</div>
          : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">תאריך</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">תיאור</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">מרכיב</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">ספק</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">כמות</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">עלות/יח׳</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">סה״כ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.date).toLocaleDateString('he-IL')}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{p.description}</td>
                  <td className="px-4 py-3 text-sm">{p.ingredient ? <span className="text-blue-700">{p.ingredient.name}</span> : <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.supplier?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.quantity > 0 ? p.quantity : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.costPerUnit > 0 ? `₪${p.costPerUnit.toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 font-bold text-orange-600">₪{p.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => del(p.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td colSpan={6} className="px-4 py-3 text-sm font-bold text-gray-700">סה״כ</td>
                <td className="px-4 py-3 font-bold text-orange-600">₪{total.toFixed(2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
