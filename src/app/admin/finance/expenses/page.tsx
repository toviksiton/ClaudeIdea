'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Save, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Expense {
  id: number; category: string; description: string; amount: number
  vatAmount: number; date: string; notes: string | null
}

const CATEGORIES = ['חומרי גלם', 'ציוד', 'שיווק', 'שכר', 'חשמל/מים/גז', 'אריזה', 'אחר']

const EMPTY = { category: 'אחר', description: '', amount: '', vatIncluded: true, date: new Date().toISOString().slice(0, 10), notes: '' }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const r = await fetch('/api/finance/expenses')
    const d = await r.json()
    setExpenses(Array.isArray(d) ? d : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  function showMsg(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  async function create() {
    if (!form.description.trim() || !form.amount) return
    setSaving(true)
    await fetch('/api/finance/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowNew(false); setForm(EMPTY); await load(); showMsg('הוצאה נרשמה')
    setSaving(false)
  }

  async function del(id: number) {
    if (!confirm('למחוק הוצאה זו?')) return
    await fetch(`/api/finance/expenses/${id}`, { method: 'DELETE' }); await load(); showMsg('הוצאה נמחקה')
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const totalVat = expenses.reduce((s, e) => s + e.vatAmount, 0)

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link href="/admin/finance" className="text-gray-400 hover:text-orange-500 text-sm">כספים</Link>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="text-gray-700 text-sm font-medium">הוצאות</span>
      </div>
      <div className="flex items-center justify-between mb-6 mt-2">
        <h1 className="text-2xl font-bold text-gray-800">הוצאות</h1>
        <button onClick={() => { setShowNew(true); setForm(EMPTY) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium text-sm">
          <Plus size={16} /> הוצאה חדשה
        </button>
      </div>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 mb-4 text-sm">{msg}</div>}

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl border p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 mb-1">סה״כ הוצאות</p>
          <p className="text-xl font-bold text-red-600">₪{total.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 mb-1">מע״מ בהוצאות</p>
          <p className="text-xl font-bold text-gray-700">₪{totalVat.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 mb-1">הוצאה ממוצעת</p>
          <p className="text-xl font-bold text-gray-700">₪{expenses.length > 0 ? (total / expenses.length).toFixed(2) : '0'}</p>
        </div>
      </div>

      {showNew && (
        <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4 animate-fade-in">
          <h3 className="font-bold text-gray-800 mb-3">הוצאה חדשה</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">קטגוריה</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">תיאור</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="רכישת ציוד מטבח"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">סכום (₪)</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
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
          <div className="flex gap-2 mt-3">
            <button onClick={create} disabled={saving} className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium"><Save size={14} /> שמור</button>
            <button onClick={() => setShowNew(false)} className="text-gray-500 px-3 py-2 text-sm"><X size={14} /></button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">טוען...</div>
          : expenses.length === 0 ? <div className="p-8 text-center text-gray-400">אין הוצאות רשומות.</div>
          : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">תאריך</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">קטגוריה</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">תיאור</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">סכום</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">מע״מ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(e.date).toLocaleDateString('he-IL')}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{e.category}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-800">{e.description}{e.notes && <span className="text-gray-400 text-xs mr-2">({e.notes})</span>}</td>
                  <td className="px-4 py-3 font-bold text-red-600">₪{e.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{e.vatAmount > 0 ? `₪${e.vatAmount.toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => del(e.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-700">סה״כ</td>
                <td className="px-4 py-3 font-bold text-red-600">₪{total.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">₪{totalVat.toFixed(2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
