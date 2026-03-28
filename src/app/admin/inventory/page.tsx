'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Save, X, AlertTriangle, RefreshCw } from 'lucide-react'

interface Ingredient {
  id: number
  name: string
  unit: string
  quantity: number
  alertLevel: number
  costPerUnit: number
  supplierId: number | null
  menuItemIngredients: { menuItem: { name: string } }[]
}

interface Supplier { id: number; name: string }

const EMPTY_FORM = { name: '', unit: "יח'", quantity: 0, alertLevel: 5, costPerUnit: 0, supplierId: '' }

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [newForm, setNewForm] = useState(EMPTY_FORM)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const [ingRes, supRes] = await Promise.all([
      fetch('/api/inventory'),
      fetch('/api/finance/suppliers'),
    ])
    setIngredients(Array.isArray(await ingRes.json()) ? await (await fetch('/api/inventory')).json() : [])
    setSuppliers(Array.isArray(await supRes.json()) ? await (await fetch('/api/finance/suppliers')).json() : [])
    setLoading(false)
  }

  useEffect(() => {
    Promise.all([fetch('/api/inventory'), fetch('/api/finance/suppliers')])
      .then(([i, s]) => Promise.all([i.json(), s.json()]))
      .then(([ing, sup]) => {
        setIngredients(Array.isArray(ing) ? ing : [])
        setSuppliers(Array.isArray(sup) ? sup : [])
        setLoading(false)
      })
  }, [])

  function showMsg(text: string) { setMsg(text); setTimeout(() => setMsg(''), 2500) }

  async function reload() {
    const [i, s] = await Promise.all([fetch('/api/inventory'), fetch('/api/finance/suppliers')])
    const [ing, sup] = await Promise.all([i.json(), s.json()])
    setIngredients(Array.isArray(ing) ? ing : [])
    setSuppliers(Array.isArray(sup) ? sup : [])
  }

  async function saveEdit(id: number) {
    setSaving(true)
    const r = await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        supplierId: editForm.supplierId ? parseInt(editForm.supplierId) : null,
      }),
    })
    if (r.ok) { setEditingId(null); await reload(); showMsg('המרכיב עודכן בהצלחה') }
    setSaving(false)
  }

  async function createIngredient() {
    if (!newForm.name.trim()) return
    setSaving(true)
    const r = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newForm,
        supplierId: newForm.supplierId ? parseInt(newForm.supplierId) : null,
      }),
    })
    if (r.ok) { setShowNew(false); setNewForm(EMPTY_FORM); await reload(); showMsg('מרכיב נוסף בהצלחה') }
    setSaving(false)
  }

  async function deleteIngredient(id: number) {
    if (!confirm('האם למחוק מרכיב זה?')) return
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
    await reload()
    showMsg('מרכיב נמחק')
  }

  const lowStock = ingredients.filter((i) => i.quantity <= i.alertLevel)

  function IngForm({ form, set }: { form: typeof EMPTY_FORM; set: (f: typeof EMPTY_FORM) => void }) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">שם מרכיב</label>
          <input value={form.name} onChange={(e) => set({ ...form, name: e.target.value })}
            placeholder="לחמניית המבורגר"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">יחידת מדידה</label>
          <select value={form.unit} onChange={(e) => set({ ...form, unit: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
            {["יח'", 'גרם', 'ק"ג', 'מ"ל', 'ליטר', 'כף', 'כוס', 'עלה', 'שן'].map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">כמות במלאי</label>
          <input type="number" value={form.quantity} onChange={(e) => set({ ...form, quantity: parseFloat(e.target.value) || 0 })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">עלות ליחידה (₪)</label>
          <input type="number" step="0.01" value={form.costPerUnit} onChange={(e) => set({ ...form, costPerUnit: parseFloat(e.target.value) || 0 })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">רמת התראה</label>
          <input type="number" value={form.alertLevel} onChange={(e) => set({ ...form, alertLevel: parseFloat(e.target.value) || 0 })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">ספק</label>
          <select value={form.supplierId} onChange={(e) => set({ ...form, supplierId: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
            <option value="">— ללא ספק —</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ניהול מלאי</h1>
        <div className="flex gap-2">
          <button onClick={reload} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm px-3 py-2 rounded-xl hover:bg-white transition-colors">
            <RefreshCw size={15} /> רענן
          </button>
          <button onClick={() => { setShowNew(true); setNewForm(EMPTY_FORM) }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm">
            <Plus size={16} /> מרכיב חדש
          </button>
        </div>
      </div>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 mb-4 text-sm font-medium">{msg}</div>}

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={18} className="text-red-600" /><h2 className="font-bold text-red-700">התראות מלאי נמוך</h2></div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((i) => (
              <span key={i.id} className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium">
                {i.name}: {i.quantity} {i.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {showNew && (
        <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4 animate-fade-in">
          <h3 className="font-bold text-gray-800 mb-3">מרכיב חדש</h3>
          <IngForm form={newForm} set={setNewForm} />
          <div className="flex gap-2 mt-3">
            <button onClick={createIngredient} disabled={saving}
              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
              <Save size={14} /> שמור
            </button>
            <button onClick={() => setShowNew(false)} className="flex items-center gap-1.5 text-gray-500 px-3 py-2 rounded-xl text-sm">
              <X size={14} /> ביטול
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">טוען...</div>
        ) : ingredients.length === 0 ? (
          <div className="p-8 text-center text-gray-400">אין מרכיבים עדיין.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">מרכיב</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">יחידה</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">כמות</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">עלות/יח׳</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">התראה</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">ספק</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">משמש ב...</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => {
                const low = ing.quantity <= ing.alertLevel
                const isEditing = editingId === ing.id
                const supplierName = suppliers.find((s) => s.id === ing.supplierId)?.name

                return (
                  <tr key={ing.id} className={`border-b last:border-0 ${low ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    {isEditing ? (
                      <>
                        <td className="px-3 py-2">
                          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-orange-300" />
                        </td>
                        <td className="px-3 py-2">
                          <select value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none">
                            {["יח'", 'גרם', 'ק"ג', 'מ"ל', 'ליטר', 'כף', 'כוס', 'עלה', 'שן'].map((u) => <option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 0 })}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-20 focus:outline-none focus:ring-1 focus:ring-orange-300" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" step="0.01" value={editForm.costPerUnit} onChange={(e) => setEditForm({ ...editForm, costPerUnit: parseFloat(e.target.value) || 0 })}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-20 focus:outline-none focus:ring-1 focus:ring-orange-300" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={editForm.alertLevel} onChange={(e) => setEditForm({ ...editForm, alertLevel: parseFloat(e.target.value) || 0 })}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-16 focus:outline-none" />
                        </td>
                        <td className="px-3 py-2">
                          <select value={editForm.supplierId} onChange={(e) => setEditForm({ ...editForm, supplierId: e.target.value })}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none">
                            <option value="">—</option>
                            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-gray-400 text-xs">
                          {ing.menuItemIngredients.map((m) => m.menuItem.name).join(', ') || '—'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => saveEdit(ing.id)} disabled={saving}
                              className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-lg"><Save size={13} /></button>
                            <button onClick={() => setEditingId(null)} className="bg-gray-200 text-gray-600 p-1.5 rounded-lg"><X size={13} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {low && <AlertTriangle size={14} className="text-red-500" />}
                            <span className={`font-medium text-sm ${low ? 'text-red-700' : 'text-gray-800'}`}>{ing.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{ing.unit}</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold text-sm ${low ? 'text-red-600' : 'text-gray-800'}`}>{ing.quantity}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-700">
                          {ing.costPerUnit > 0 ? `₪${ing.costPerUnit.toFixed(2)}` : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{ing.alertLevel}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{supplierName || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {ing.menuItemIngredients.map((m) => m.menuItem.name).join(', ') || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => {
                              setEditingId(ing.id)
                              setEditForm({ name: ing.name, unit: ing.unit, quantity: ing.quantity, alertLevel: ing.alertLevel, costPerUnit: ing.costPerUnit, supplierId: ing.supplierId ? String(ing.supplierId) : '' })
                            }} className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50"><Pencil size={14} /></button>
                            <button onClick={() => deleteIngredient(ing.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
