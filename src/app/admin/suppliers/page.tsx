'use client'

import { useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2, Save, X, Phone, Mail, ChevronDown, ChevronUp,
  ShoppingCart, Package, TrendingUp, Truck, MessageCircle
} from 'lucide-react'

interface Ingredient { id: number; name: string; unit: string; quantity: number }
interface RecentPurchase {
  id: number; description: string; totalAmount: number; date: string
  ingredient: { name: string } | null
}
interface Supplier {
  id: number; name: string; phone: string | null; email: string | null; notes: string | null
  totalSpent: number; lastPurchase: string | null
  _count: { purchases: number; ingredients: number }
  ingredients: Ingredient[]
  purchases: RecentPurchase[]
}
interface IngredientOption { id: number; name: string; unit: string }

const EMPTY_FORM = { name: '', phone: '', email: '', notes: '' }

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const intl = digits.startsWith('0') ? '972' + digits.slice(1) : digits
  return `https://wa.me/${intl}`
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'היום'
  if (days === 1) return 'אתמול'
  if (days < 7) return `לפני ${days} ימים`
  if (days < 30) return `לפני ${Math.floor(days / 7)} שבועות`
  return `לפני ${Math.floor(days / 30)} חודשים`
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [ingredients, setIngredients] = useState<IngredientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Quick-purchase state per supplier
  const [purchaseSupId, setPurchaseSupId] = useState<number | null>(null)
  const [purchaseForm, setPurchaseForm] = useState({
    description: '', ingredientId: '', quantity: '', costPerUnit: '', notes: ''
  })

  async function load() {
    const [sRes, iRes] = await Promise.all([
      fetch('/api/finance/suppliers'),
      fetch('/api/inventory'),
    ])
    const sData = await sRes.json()
    const iData = await iRes.json()
    setSuppliers(Array.isArray(sData) ? sData : [])
    setIngredients(Array.isArray(iData) ? iData : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  function showMsg(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  async function create() {
    if (!newForm.name.trim()) return
    setSaving(true)
    await fetch('/api/finance/suppliers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newForm),
    })
    setShowNew(false); setNewForm(EMPTY_FORM); await load(); showMsg('ספק נוסף ✓')
    setSaving(false)
  }

  async function saveEdit(id: number) {
    setSaving(true)
    await fetch(`/api/finance/suppliers/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm),
    })
    setEditId(null); await load(); showMsg('ספק עודכן ✓')
    setSaving(false)
  }

  async function del(id: number) {
    if (!confirm('למחוק ספק זה? קניות קיימות לא יימחקו.')) return
    await fetch(`/api/finance/suppliers/${id}`, { method: 'DELETE' })
    await load(); showMsg('ספק נמחק')
  }

  async function addPurchase(supplierId: number) {
    if (!purchaseForm.description.trim()) return
    setSaving(true)
    const qty = parseFloat(purchaseForm.quantity) || 0
    const cpu = parseFloat(purchaseForm.costPerUnit) || 0
    await fetch('/api/finance/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierId,
        ingredientId: purchaseForm.ingredientId || null,
        description: purchaseForm.description,
        quantity: qty,
        costPerUnit: cpu,
        totalAmount: qty * cpu || parseFloat(purchaseForm.quantity) || 0,
        notes: purchaseForm.notes,
      }),
    })
    setPurchaseSupId(null)
    setPurchaseForm({ description: '', ingredientId: '', quantity: '', costPerUnit: '', notes: '' })
    await load()
    showMsg('רכישה נרשמה ✓')
    setSaving(false)
  }

  const totalSpent = suppliers.reduce((s, sup) => s + sup.totalSpent, 0)
  const totalPurchases = suppliers.reduce((s, sup) => s + sup._count.purchases, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Truck size={22} className="text-orange-500" /> ספקים
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{suppliers.length} ספקים פעילים</p>
        </div>
        <button
          onClick={() => { setShowNew(true); setNewForm(EMPTY_FORM) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus size={16} /> ספק חדש
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl border shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{suppliers.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">ספקים</p>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">₪{totalSpent.toLocaleString('he-IL', { maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-gray-500 mt-0.5">סה"כ הוצאות</p>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalPurchases}</p>
          <p className="text-xs text-gray-500 mt-0.5">סה"כ קניות</p>
        </div>
      </div>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 mb-4 text-sm font-medium">{msg}</div>
      )}

      {/* New supplier form */}
      {showNew && (
        <div className="bg-white rounded-2xl border shadow-sm p-5 mb-4">
          <h3 className="font-bold text-gray-800 mb-3">ספק חדש</h3>
          <SupplierForm form={newForm} set={setNewForm} />
          <div className="flex gap-2 mt-4">
            <button onClick={create} disabled={saving || !newForm.name.trim()}
              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium">
              <Save size={14} /> שמור ספק
            </button>
            <button onClick={() => setShowNew(false)} className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Suppliers list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">טוען...</div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border text-gray-400">
          <Truck size={40} className="mx-auto mb-3 opacity-30" />
          <p>אין ספקים עדיין</p>
          <p className="text-sm mt-1">לחץ "ספק חדש" להתחיל</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suppliers.map((sup) => {
            const isExpanded = expandedId === sup.id
            const isEditing = editId === sup.id
            const isAddingPurchase = purchaseSupId === sup.id

            return (
              <div key={sup.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="p-4">
                  {isEditing ? (
                    <>
                      <SupplierForm form={editForm} set={setEditForm} />
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => saveEdit(sup.id)} disabled={saving}
                          className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-xl text-sm font-medium">
                          <Save size={13} /> שמור
                        </button>
                        <button onClick={() => setEditId(null)} className="text-gray-400 p-1.5"><X size={14} /></button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 text-orange-600 font-bold text-base">
                        {sup.name.charAt(0)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-800">{sup.name}</h3>
                          {sup.lastPurchase && (
                            <span className="text-xs text-gray-400">קנייה אחרונה: {relativeDate(sup.lastPurchase)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {sup.phone && (
                            <div className="flex items-center gap-1.5">
                              <a href={`tel:${sup.phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                <Phone size={11} /> {sup.phone}
                              </a>
                              <a href={whatsappUrl(sup.phone)} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 bg-green-50 px-1.5 py-0.5 rounded-lg">
                                <MessageCircle size={11} /> WhatsApp
                              </a>
                            </div>
                          )}
                          {sup.email && (
                            <a href={`mailto:${sup.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                              <Mail size={11} /> {sup.email}
                            </a>
                          )}
                        </div>
                        {sup.notes && <p className="text-xs text-gray-400 mt-1 italic">{sup.notes}</p>}
                      </div>

                      {/* Stats + actions */}
                      <div className="shrink-0 text-left flex flex-col items-end gap-1.5">
                        <span className="font-bold text-orange-600 text-sm">₪{sup.totalSpent.toLocaleString('he-IL', { maximumFractionDigits: 0 })}</span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <ShoppingCart size={11} /> {sup._count.purchases} קניות
                          <Package size={11} className="mr-1" /> {sup._count.ingredients} מרכיבים
                        </div>
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => { setPurchaseSupId(isAddingPurchase ? null : sup.id); setExpandedId(sup.id) }}
                            className="flex items-center gap-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 px-2 py-1 rounded-lg border border-orange-100 transition-colors"
                          >
                            <Plus size={11} /> רכישה
                          </button>
                          <button
                            onClick={() => { setEditId(sup.id); setEditForm({ name: sup.name, phone: sup.phone || '', email: sup.email || '', notes: sup.notes || '' }) }}
                            className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => del(sup.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 size={13} />
                          </button>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : sup.id)}
                            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick purchase form */}
                {isAddingPurchase && (
                  <div className="border-t border-orange-100 bg-orange-50 px-4 py-3">
                    <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                      <ShoppingCart size={12} /> רכישה חדשה מ-{sup.name}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 mb-0.5 block">תיאור *</label>
                        <input value={purchaseForm.description}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, description: e.target.value })}
                          placeholder="לדוגמה: קמח, עגבניות..."
                          className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">מרכיב (אופציונלי)</label>
                        <select value={purchaseForm.ingredientId}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, ingredientId: e.target.value })}
                          className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                          <option value="">— ללא קישור —</option>
                          {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">כמות</label>
                        <input type="number" value={purchaseForm.quantity}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                          placeholder="0"
                          className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">₪ ליחידה</label>
                        <input type="number" value={purchaseForm.costPerUnit}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, costPerUnit: e.target.value })}
                          placeholder="0"
                          className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">סה"כ לתשלום (₪)</label>
                        <input type="number"
                          value={purchaseForm.quantity && purchaseForm.costPerUnit
                            ? (parseFloat(purchaseForm.quantity) * parseFloat(purchaseForm.costPerUnit)).toFixed(2)
                            : ''}
                          readOnly
                          placeholder="מחושב אוטומטית"
                          className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">הערות</label>
                        <input value={purchaseForm.notes}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                          className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => addPurchase(sup.id)} disabled={saving || !purchaseForm.description.trim()}
                        className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                        <Save size={13} /> שמור רכישה
                      </button>
                      <button onClick={() => setPurchaseSupId(null)} className="text-gray-500 px-3 py-2 text-sm"><X size={14} /></button>
                    </div>
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && !isEditing && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Ingredients */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                          <Package size={12} /> מרכיבים מספק זה
                        </p>
                        {sup.ingredients.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">אין מרכיבים מקושרים</p>
                        ) : (
                          <div className="space-y-1">
                            {sup.ingredients.map((ing) => (
                              <div key={ing.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-2.5 py-1.5 border border-gray-100">
                                <span className="text-gray-700">{ing.name}</span>
                                <span className="text-gray-400">{ing.quantity} {ing.unit} במלאי</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Recent purchases */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                          <TrendingUp size={12} /> קניות אחרונות
                        </p>
                        {sup.purchases.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">אין קניות עדיין</p>
                        ) : (
                          <div className="space-y-1">
                            {sup.purchases.map((p) => (
                              <div key={p.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-2.5 py-1.5 border border-gray-100">
                                <div>
                                  <span className="text-gray-700">{p.description}</span>
                                  {p.ingredient && <span className="text-gray-400 mr-1">({p.ingredient.name})</span>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-orange-500 font-medium">₪{p.totalAmount.toFixed(0)}</span>
                                  <span className="text-gray-400">{relativeDate(p.date)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SupplierForm({ form, set }: { form: typeof EMPTY_FORM; set: (f: typeof EMPTY_FORM) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { key: 'name', label: 'שם ספק *', placeholder: 'מינהרת המזון' },
        { key: 'phone', label: 'טלפון', placeholder: '050-0000000' },
        { key: 'email', label: 'אימייל', placeholder: 'supplier@example.com' },
        { key: 'notes', label: 'הערות', placeholder: 'ימי אספקה, מינימום הזמנה...' },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="text-xs text-gray-500 mb-1 block">{label}</label>
          <input
            value={(form as any)[key]}
            onChange={(e) => set({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      ))}
    </div>
  )
}
