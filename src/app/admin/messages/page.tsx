'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Bell, ToggleLeft, ToggleRight } from 'lucide-react'

interface SystemMessage {
  id: number
  title: string
  content: string
  type: string
  emoji: string
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

interface FormState {
  title: string
  content: string
  type: string
  emoji: string
  isActive: boolean
  expiresAt: string
}

const EMPTY_FORM: FormState = {
  title: '',
  content: '',
  type: 'INFO',
  emoji: '📢',
  isActive: true,
  expiresAt: '',
}

const TYPE_COLORS: Record<string, string> = {
  INFO: 'bg-blue-50 border-blue-200 text-blue-700',
  PROMO: 'bg-amber-50 border-amber-200 text-amber-700',
  ALERT: 'bg-red-50 border-red-200 text-red-700',
}
const TYPE_LABELS: Record<string, string> = {
  INFO: 'מידע',
  PROMO: 'מבצע',
  ALERT: 'התראה',
}
const TYPE_EMOJI_DEFAULT: Record<string, string> = {
  INFO: '📢',
  PROMO: '🎉',
  ALERT: '⚠️',
}

// ── Message Form ────────────────────────────────────────────
function MessageForm({
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

  function setType(t: string) {
    setForm(f => ({ ...f, type: t, emoji: TYPE_EMOJI_DEFAULT[t] || f.emoji }))
  }

  async function submit() {
    if (!form.title.trim() || !form.content.trim()) { setError('נא למלא כותרת ותוכן'); return }
    setSaving(true)
    setError('')
    try { await onSave(form) } catch { setError('שגיאה בשמירה') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Type selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">סוג הודעה</label>
        <div className="flex gap-2">
          {Object.entries(TYPE_LABELS).map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                form.type === t ? TYPE_COLORS[t] : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              {TYPE_EMOJI_DEFAULT[t]} {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">אמוג&apos;י</label>
          <input
            value={form.emoji}
            onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="col-span-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">כותרת *</label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">תוכן ההודעה *</label>
        <textarea
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">תפוגה (אופציונלי)</label>
          <input
            value={form.expiresAt}
            onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
            type="datetime-local"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors w-full justify-center ${
              form.isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}
          >
            {form.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {form.isActive ? 'פעיל' : 'לא פעיל'}
          </button>
        </div>
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
export default function MessagesPage() {
  const [messages, setMessages] = useState<SystemMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function load() {
    const data = await fetch('/api/messages/all').then(r => r.json())
    setMessages(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addMessage(form: FormState) {
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, expiresAt: form.expiresAt || null }),
    })
    await load()
    setShowAdd(false)
  }

  async function updateMessage(id: number, form: FormState) {
    await fetch(`/api/messages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, expiresAt: form.expiresAt || null }),
    })
    await load()
    setEditId(null)
  }

  async function toggleActive(msg: SystemMessage) {
    await fetch(`/api/messages/${msg.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...msg, isActive: !msg.isActive }),
    })
    await load()
  }

  async function deleteMessage(id: number) {
    await fetch(`/api/messages/${id}`, { method: 'DELETE' })
    await load()
    setDeleteId(null)
  }

  const activeCount = messages.filter(m => m.isActive).length

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell size={22} className="text-orange-400" /> הודעות מערכת
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{activeCount} הודעות פעילות מתוך {messages.length}</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditId(null) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> הודעה חדשה
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">הודעה חדשה</h3>
            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <MessageForm initial={EMPTY_FORM} onSave={addMessage} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {/* Messages list */}
      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-12">
          <Bell size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm">אין הודעות עדיין</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`rounded-2xl border shadow-sm overflow-hidden ${msg.isActive ? 'bg-white' : 'bg-gray-50 opacity-70'}`}>
              {editId === msg.id ? (
                <div className="p-4">
                  <MessageForm
                    initial={{
                      title: msg.title,
                      content: msg.content,
                      type: msg.type,
                      emoji: msg.emoji,
                      isActive: msg.isActive,
                      expiresAt: msg.expiresAt ? msg.expiresAt.slice(0, 16) : '',
                    }}
                    onSave={form => updateMessage(msg.id, form)}
                    onCancel={() => setEditId(null)}
                  />
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Type stripe */}
                    <div className={`text-2xl mt-0.5`}>{msg.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${TYPE_COLORS[msg.type]}`}>
                          {TYPE_LABELS[msg.type]}
                        </span>
                        {!msg.isActive && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">לא פעיל</span>
                        )}
                        {msg.expiresAt && (
                          <span className="text-xs text-gray-400">
                            תפוגה: {new Date(msg.expiresAt).toLocaleDateString('he-IL')}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">{msg.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleActive(msg)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          msg.isActive
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={msg.isActive ? 'השבת' : 'הפעל'}
                      >
                        {msg.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      <button
                        onClick={() => setEditId(msg.id)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteId(msg.id)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl">
            <p className="font-bold text-gray-800 mb-2">מחיקת הודעה</p>
            <p className="text-gray-500 text-sm mb-5">האם למחוק את ההודעה? פעולה זו אינה ניתנת לביטול.</p>
            <div className="flex gap-2">
              <button
                onClick={() => deleteMessage(deleteId)}
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
