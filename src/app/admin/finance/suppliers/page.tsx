'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Save, X, Phone, Mail, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Supplier {
  id: number; name: string; phone: string | null; email: string | null; notes: string | null
  _count: { purchases: number; ingredients: number }
}

const EMPTY = { name: '', phone: '', email: '', notes: '' }

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState(EMPTY)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    const r = await fetch('/api/finance/suppliers')
    const d = await r.json()
    setSuppliers(Array.isArray(d) ? d : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  function showMsg(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  async function create() {
    if (!newForm.name.trim()) return
    setSaving(true)
    await fetch('/api/finance/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newForm) })
    setShowNew(false); setNewForm(EMPTY); await load(); showMsg('ספק נוסף')
    setSaving(false)
  }

  async function save(id: number) {
    setSaving(true)
    await fetch(`/api/finance/suppliers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    setEditId(null); await load(); showMsg('ספק עודכן')
    setSaving(false)
  }

  async function del(id: number) {
    if (!confirm('למחוק ספק זה?')) return
    await fetch(`/api/finance/suppliers/${id}`, { method: 'DELETE' }); await load(); showMsg('ספק נמחק')
  }

  function Form({ form, set }: { form: typeof EMPTY; set: (f: typeof EMPTY) => void }) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'name', label: 'שם ספק', placeholder: 'מינהרת המזון' },
          { key: 'phone', label: 'טלפון', placeholder: '050-0000000' },
          { key: 'email', label: 'אימייל', placeholder: 'supplier@example.com' },
          { key: 'notes', label: 'הערות', placeholder: '' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
            <input value={(form as any)[key]} onChange={(e) => set({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link href="/admin/finance" className="text-gray-400 hover:text-orange-500 text-sm">כספים</Link>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="text-gray-700 text-sm font-medium">ספקים</span>
      </div>
      <div className="flex items-center justify-between mb-6 mt-2">
        <h1 className="text-2xl font-bold text-gray-800">ספקים</h1>
        <button onClick={() => { setShowNew(true); setNewForm(EMPTY) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium text-sm">
          <Plus size={16} /> ספק חדש
        </button>
      </div>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 mb-4 text-sm">{msg}</div>}

      {showNew && (
        <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4 animate-fade-in">
          <h3 className="font-bold text-gray-800 mb-3">ספק חדש</h3>
          <Form form={newForm} set={setNewForm} />
          <div className="flex gap-2 mt-3">
            <button onClick={create} disabled={saving} className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium"><Save size={14} /> שמור</button>
            <button onClick={() => setShowNew(false)} className="text-gray-500 px-3 py-2 rounded-xl text-sm"><X size={14} /></button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">טוען...</div>
          : suppliers.length === 0 ? <div className="p-8 text-center text-gray-400">אין ספקים עדיין.</div>
          : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">ספק</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">טלפון</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">אימייל</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">קניות</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">מרכיבים</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  {editId === s.id ? (
                    <>
                      <td colSpan={5} className="px-4 py-3">
                        <Form form={editForm} set={setEditForm} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => save(s.id)} disabled={saving} className="bg-green-500 text-white p-1.5 rounded-lg"><Save size={13} /></button>
                          <button onClick={() => setEditId(null)} className="bg-gray-200 text-gray-600 p-1.5 rounded-lg"><X size={13} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-3 text-sm">
                        {s.phone ? <a href={`tel:${s.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Phone size={12} />{s.phone}</a> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {s.email ? <a href={`mailto:${s.email}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Mail size={12} />{s.email}</a> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s._count.purchases} קניות</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s._count.ingredients} מרכיבים</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditId(s.id); setEditForm({ name: s.name, phone: s.phone || '', email: s.email || '', notes: s.notes || '' }) }}
                            className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50"><Pencil size={14} /></button>
                          <button onClick={() => del(s.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
