'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Save, X, AlertTriangle, RefreshCw } from 'lucide-react'

interface Ingredient {
  id: number
  name: string
  unit: string
  quantity: number
  alertLevel: number
  menuItemIngredients: { menuItem: { name: string } }[]
}

const EMPTY_FORM = { name: '', unit: 'יח\'', quantity: 0, alertLevel: 5 }

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [newForm, setNewForm] = useState(EMPTY_FORM)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const r = await fetch('/api/inventory')
    const data = await r.json()
    setIngredients(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function showMsg(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 2500)
  }

  async function saveEdit(id: number) {
    setSaving(true)
    const r = await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (r.ok) {
      setEditingId(null)
      await load()
      showMsg('המרכיב עודכן בהצלחה')
    }
    setSaving(false)
  }

  async function createIngredient() {
    if (!newForm.name.trim()) return
    setSaving(true)
    const r = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    })
    if (r.ok) {
      setShowNew(false)
      setNewForm(EMPTY_FORM)
      await load()
      showMsg('מרכיב נוסף בהצלחה')
    }
    setSaving(false)
  }

  async function deleteIngredient(id: number) {
    if (!confirm('האם למחוק מרכיב זה?')) return
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
    await load()
    showMsg('מרכיב נמחק')
  }

  const lowStock = ingredients.filter((i) => i.quantity <= i.alertLevel)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ניהול מלאי</h1>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm px-3 py-2 rounded-xl hover:bg-white transition-colors">
            <RefreshCw size={15} /> רענן
          </button>
          <button
            onClick={() => { setShowNew(true); setNewForm(EMPTY_FORM) }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
          >
            <Plus size={16} /> מרכיב חדש
          </button>
        </div>
      </div>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 mb-4 text-sm font-medium">
          {msg}
        </div>
      )}

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-red-600" />
            <h2 className="font-bold text-red-700">התראות מלאי נמוך</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((i) => (
              <span key={i.id} className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium">
                {i.name}: {i.quantity} {i.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* New ingredient form */}
      {showNew && (
        <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4 animate-fade-in">
          <h3 className="font-bold text-gray-800 mb-3">מרכיב חדש</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">שם מרכיב</label>
              <input
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                placeholder="לחמניית המבורגר"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">יחידת מדידה</label>
              <select
                value={newForm.unit}
                onChange={(e) => setNewForm({ ...newForm, unit: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {["יח'", 'גרם', 'ק"ג', 'מ"ל', 'ליטר', 'כף', 'כוס', 'עלה', 'שן'].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">כמות במלאי</label>
              <input
                type="number"
                value={newForm.quantity}
                onChange={(e) => setNewForm({ ...newForm, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">רמת התראה</label>
              <input
                type="number"
                value={newForm.alertLevel}
                onChange={(e) => setNewForm({ ...newForm, alertLevel: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={createIngredient}
              disabled={saving}
              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Save size={14} /> שמור
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl text-sm transition-colors"
            >
              <X size={14} /> ביטול
            </button>
          </div>
        </div>
      )}

      {/* Ingredients table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">טוען...</div>
        ) : ingredients.length === 0 ? (
          <div className="p-8 text-center text-gray-400">אין מרכיבים עדיין. לחץ "מרכיב חדש" להוספה.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">מרכיב</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">יחידה</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">כמות במלאי</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">רמת התראה</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">משמש ב...</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => {
                const low = ing.quantity <= ing.alertLevel
                const isEditing = editingId === ing.id

                return (
                  <tr key={ing.id} className={`border-b last:border-0 ${low ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-orange-300"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editForm.unit}
                            onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                          >
                            {["יח'", 'גרם', 'ק"ג', 'מ"ל', 'ליטר', 'כף', 'כוס', 'עלה', 'שן'].map((u) => (
                              <option key={u}>{u}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 0 })}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-orange-300"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={editForm.alertLevel}
                            onChange={(e) => setEditForm({ ...editForm, alertLevel: parseFloat(e.target.value) || 0 })}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-20 focus:outline-none focus:ring-1 focus:ring-orange-300"
                          />
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-xs">
                          {ing.menuItemIngredients.map((m) => m.menuItem.name).join(', ') || '—'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            <button
                              onClick={() => saveEdit(ing.id)}
                              disabled={saving}
                              className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-lg transition-colors"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-600 p-1.5 rounded-lg transition-colors"
                            >
                              <X size={14} />
                            </button>
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
                          <span className={`font-bold text-sm ${low ? 'text-red-600' : 'text-gray-800'}`}>
                            {ing.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{ing.alertLevel}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {ing.menuItemIngredients.map((m) => m.menuItem.name).join(', ') || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingId(ing.id)
                                setEditForm({ name: ing.name, unit: ing.unit, quantity: ing.quantity, alertLevel: ing.alertLevel })
                              }}
                              className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => deleteIngredient(ing.id)}
                              className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
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
