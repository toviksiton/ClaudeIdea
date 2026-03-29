'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Search, Users, Phone, Mail, Calendar, Star } from 'lucide-react'

interface ClubMember {
  id: number
  name: string
  phone: string
  email: string | null
  birthday: string | null
  notes: string | null
  createdAt: string
}

interface FormState {
  name: string
  phone: string
  email: string
  birthday: string
  notes: string
}

const EMPTY_FORM: FormState = { name: '', phone: '', email: '', birthday: '', notes: '' }

// ── Member Form ─────────────────────────────────────────────
function MemberForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: FormState
  onSave: (f: FormState) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<FormState>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!form.name.trim() || !form.phone.trim()) { setError('נא למלא שם וטלפון'); return }
    setSaving(true)
    setError('')
    try { await onSave(form) } catch (e: any) { setError(e.message || 'שגיאה') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">שם מלא *</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">טלפון *</label>
          <input
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            type="tel"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">אימייל</label>
          <input
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            type="email"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">יום הולדת (DD/MM)</label>
          <input
            value={form.birthday}
            onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
            placeholder="15/03"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
        <input
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={submit}
          disabled={saving}
          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-2 rounded-xl text-sm font-medium transition-colors"
        >
          {saving ? 'שומר...' : 'שמור'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ביטול
        </button>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function ClubPage() {
  const [members, setMembers] = useState<ClubMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function load() {
    const data = await fetch('/api/club').then(r => r.json())
    setMembers(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addMember(form: FormState) {
    const res = await fetch('/api/club', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error || 'שגיאה')
    }
    await load()
    setShowAdd(false)
  }

  async function updateMember(id: number, form: FormState) {
    await fetch(`/api/club/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    await load()
    setEditId(null)
  }

  async function deleteMember(id: number) {
    await fetch(`/api/club/${id}`, { method: 'DELETE' })
    await load()
    setDeleteId(null)
  }

  const filtered = members.filter(m =>
    !search || m.name.includes(search) || m.phone.includes(search)
  )

  const today = new Date()
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`
  const birthdaysToday = members.filter(m => m.birthday === todayStr)

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Star size={22} className="text-orange-400" /> מועדון לקוחות
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{members.length} חברי מועדון</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditId(null) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> הוסף חבר
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{members.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">חברי מועדון</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{members.filter(m => m.birthday).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">עם יום הולדת</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">{birthdaysToday.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">יום הולדת היום 🎂</p>
        </div>
      </div>

      {/* Birthdays today */}
      {birthdaysToday.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <p className="font-semibold text-amber-700 text-sm mb-2">🎂 יום הולדת היום!</p>
          {birthdaysToday.map(m => (
            <div key={m.id} className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-800">{m.name}</span>
              <a href={`tel:${m.phone}`} className="text-amber-600 flex items-center gap-1 text-xs">
                <Phone size={11} /> {m.phone}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">הוספת חבר חדש</h3>
            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <MemberForm
            initial={EMPTY_FORM}
            onSave={addMember}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          placeholder="חיפוש לפי שם או טלפון..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      {/* Members list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{search ? 'לא נמצאו תוצאות' : 'אין חברי מועדון עדיין'}</p>
          </div>
        ) : filtered.map(m => (
          <div key={m.id}>
            {editId === m.id ? (
              <div className="p-4">
                <MemberForm
                  initial={{ name: m.name, phone: m.phone, email: m.email || '', birthday: m.birthday || '', notes: m.notes || '' }}
                  onSave={form => updateMember(m.id, form)}
                  onCancel={() => setEditId(null)}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-sm">{m.name}</p>
                    {m.birthday === todayStr && <span className="text-xs">🎂</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <a href={`tel:${m.phone}`} className="text-gray-500 text-xs flex items-center gap-1 hover:text-orange-500">
                      <Phone size={10} /> {m.phone}
                    </a>
                    {m.email && <span className="text-gray-400 text-xs flex items-center gap-1"><Mail size={10} /> {m.email}</span>}
                    {m.birthday && <span className="text-gray-400 text-xs flex items-center gap-1"><Calendar size={10} /> {m.birthday}</span>}
                  </div>
                  {m.notes && <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{m.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditId(m.id)}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => setDeleteId(m.id)}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl">
            <p className="font-bold text-gray-800 mb-2">מחיקת חבר מועדון</p>
            <p className="text-gray-500 text-sm mb-5">האם למחוק את החבר? פעולה זו אינה ניתנת לביטול.</p>
            <div className="flex gap-2">
              <button
                onClick={() => deleteMember(deleteId)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-medium"
              >
                מחק
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
