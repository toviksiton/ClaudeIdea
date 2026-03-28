'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Save, X, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'

interface Ingredient {
  id: number
  name: string
  unit: string
  quantity: number
}

interface MenuItemIngredient {
  ingredientId: number
  quantity: number
  ingredient: Ingredient
}

interface MenuItem {
  id: number
  name: string
  description: string | null
  price: number
  category: string
  isActive: boolean
  isAvailable: boolean
  sortOrder: number
  ingredients: MenuItemIngredient[]
}

const EMPTY_ITEM = {
  name: '',
  description: '',
  price: 0,
  category: 'כללי',
  isActive: true,
  sortOrder: 0,
  ingredients: [] as { ingredientId: number; quantity: number }[],
}

export default function MenuAdminPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<typeof EMPTY_ITEM>(EMPTY_ITEM)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState<typeof EMPTY_ITEM>(EMPTY_ITEM)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const [menuRes, ingRes] = await Promise.all([
      fetch('/api/menu/admin'),
      fetch('/api/inventory'),
    ])
    const menuData = await menuRes.json()
    const ingData = await ingRes.json()
    setItems(Array.isArray(menuData) ? menuData : [])
    setAllIngredients(Array.isArray(ingData) ? ingData : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function showMsg(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 2500)
  }

  function formToPayload(form: typeof EMPTY_ITEM) {
    return {
      ...form,
      price: parseFloat(String(form.price)),
      sortOrder: parseInt(String(form.sortOrder)) || 0,
    }
  }

  async function saveEdit(id: number) {
    setSaving(true)
    // Update base fields
    await fetch(`/api/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formToPayload(editForm)),
    })
    // Update ingredients
    await fetch(`/api/menu/${id}/ingredients`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: editForm.ingredients }),
    })
    setEditingId(null)
    await load()
    showMsg('הפריט עודכן בהצלחה')
    setSaving(false)
  }

  async function createItem() {
    if (!newForm.name.trim()) return
    setSaving(true)
    await fetch('/api/menu/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formToPayload(newForm)),
    })
    setShowNew(false)
    setNewForm(EMPTY_ITEM)
    await load()
    showMsg('פריט חדש נוסף לתפריט')
    setSaving(false)
  }

  async function deleteItem(id: number) {
    if (!confirm('למחוק פריט זה מהתפריט?')) return
    await fetch(`/api/menu/${id}`, { method: 'DELETE' })
    await load()
    showMsg('פריט נמחק')
  }

  async function toggleActive(item: MenuItem) {
    await fetch(`/api/menu/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, isActive: !item.isActive }),
    })
    await load()
  }

  function IngredientEditor({ form, setForm }: { form: typeof EMPTY_ITEM; setForm: (f: typeof EMPTY_ITEM) => void }) {
    function addIng() {
      if (allIngredients.length === 0) return
      const firstUnused = allIngredients.find((a) => !form.ingredients.find((i) => i.ingredientId === a.id))
      if (!firstUnused) return
      setForm({ ...form, ingredients: [...form.ingredients, { ingredientId: firstUnused.id, quantity: 1 }] })
    }

    function removeIng(idx: number) {
      setForm({ ...form, ingredients: form.ingredients.filter((_, i) => i !== idx) })
    }

    function updateIng(idx: number, field: string, value: any) {
      setForm({
        ...form,
        ingredients: form.ingredients.map((ing, i) =>
          i === idx ? { ...ing, [field]: field === 'quantity' ? parseFloat(value) || 0 : parseInt(value) } : ing
        ),
      })
    }

    return (
      <div className="mt-3 border border-dashed border-gray-200 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500">מרכיבים נדרשים</p>
          <button
            type="button"
            onClick={addIng}
            className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600"
          >
            <Plus size={12} /> הוסף מרכיב
          </button>
        </div>
        {form.ingredients.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-1">ללא מרכיבים (ניתן להוסיף)</p>
        )}
        {form.ingredients.map((ing, idx) => (
          <div key={idx} className="flex gap-2 items-center mb-1.5">
            <select
              value={ing.ingredientId}
              onChange={(e) => updateIng(idx, 'ingredientId', e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
            >
              {allIngredients.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.unit})</option>
              ))}
            </select>
            <input
              type="number"
              value={ing.quantity}
              onChange={(e) => updateIng(idx, 'quantity', e.target.value)}
              className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
              placeholder="כמות"
              min="0.1"
              step="0.5"
            />
            <button onClick={() => removeIng(idx)} className="text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    )
  }

  function ItemForm({ form, setForm, onSave, onCancel }: {
    form: typeof EMPTY_ITEM
    setForm: (f: typeof EMPTY_ITEM) => void
    onSave: () => void
    onCancel: () => void
  }) {
    return (
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mt-2 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">שם הפריט</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="המבורגר ביתי"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">מחיר (₪)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">קטגוריה</label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="המבורגרים"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">תיאור</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="תיאור הפריט..."
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          />
        </div>
        <IngredientEditor form={form} setForm={setForm} />
        <div className="flex gap-2 mt-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            <Save size={14} /> שמור
          </button>
          <button onClick={onCancel} className="flex items-center gap-1.5 text-gray-500 px-3 py-2 rounded-xl text-sm hover:bg-white">
            <X size={14} /> ביטול
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ניהול תפריט</h1>
        <button
          onClick={() => { setShowNew(true); setNewForm(EMPTY_ITEM) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium text-sm"
        >
          <Plus size={16} /> פריט חדש
        </button>
      </div>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 mb-4 text-sm font-medium">
          {msg}
        </div>
      )}

      {showNew && (
        <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4">
          <h3 className="font-bold text-gray-800 mb-2">פריט חדש לתפריט</h3>
          <ItemForm
            form={newForm}
            setForm={setNewForm}
            onSave={createItem}
            onCancel={() => setShowNew(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">טוען תפריט...</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{item.category}</span>
                      {!item.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">מוסתר</span>
                      )}
                      {item.isActive && !item.isAvailable && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">אזל המלאי</span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                    )}
                    <p className="text-orange-600 font-bold mt-1">₪{item.price}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50"
                      title="מרכיבים"
                    >
                      {expandedId === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                      onClick={() => toggleActive(item)}
                      className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50"
                      title={item.isActive ? 'הסתר מתפריט' : 'הצג בתפריט'}
                    >
                      {item.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(item.id)
                        setEditForm({
                          name: item.name,
                          description: item.description || '',
                          price: item.price,
                          category: item.category,
                          isActive: item.isActive,
                          sortOrder: item.sortOrder,
                          ingredients: item.ingredients.map((i) => ({
                            ingredientId: i.ingredientId,
                            quantity: i.quantity,
                          })),
                        })
                      }}
                      className="text-gray-400 hover:text-orange-600 p-1.5 rounded-lg hover:bg-orange-50"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded ingredients */}
                {expandedId === item.id && item.ingredients.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">מרכיבים:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.ingredients.map((ing) => (
                        <span key={ing.ingredientId} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                          {ing.ingredient.name}: {ing.quantity} {ing.ingredient.unit}
                          {ing.ingredient.quantity < ing.quantity && (
                            <span className="text-red-500 mr-1">⚠</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Edit form */}
              {editingId === item.id && (
                <div className="px-4 pb-4">
                  <ItemForm
                    form={editForm}
                    setForm={setEditForm}
                    onSave={() => saveEdit(item.id)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
