'use client'

import { useEffect, useState, useRef } from 'react'
import { Save, Upload, X } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    business_name: '',
    business_phone: '',
    paybox_link: '',
    bit_phone: '',
    admin_password: '',
    event_active: 'true',
    logo_url: '',
  })
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings((prev) => ({ ...prev, ...data }))
        setLoading(false)
      })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setMsg('ההגדרות נשמרו בהצלחה')
    setTimeout(() => setMsg(''), 2500)
  }

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">הגדרות מערכת</h1>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 mb-4 text-sm font-medium">
          {msg}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border p-6 max-w-lg space-y-5">

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">לוגו העסק</label>
          <div className="flex items-start gap-3">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="לוגו" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-3xl">🍽️</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 text-sm bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 px-3 py-2 rounded-xl font-medium"
              >
                <Upload size={14} /> העלה תמונה
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 500 * 1024) { alert('הקובץ גדול מדי (מקסימום 500KB). אנא דחוס את התמונה.'); return }
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    setSettings((s) => ({ ...s, logo_url: ev.target?.result as string }))
                  }
                  reader.readAsDataURL(file)
                }}
              />
              <input
                value={settings.logo_url.startsWith('data:') ? '' : settings.logo_url}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="או הדבק קישור לתמונה (URL)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              {settings.logo_url && (
                <button onClick={() => setSettings({ ...settings, logo_url: '' })} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600">
                  <X size={12} /> הסר לוגו
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם העסק</label>
          <input
            value={settings.business_name}
            onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">טלפון עסק</label>
          <input
            value={settings.business_phone}
            onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
            type="tel"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">קישור Paybox</label>
          <input
            value={settings.paybox_link}
            onChange={(e) => setSettings({ ...settings, paybox_link: e.target.value })}
            placeholder="https://payboxapp.page.link/..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <p className="text-xs text-gray-400 mt-1">הדבק את הקישור האישי שלך מ-Paybox</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מספר Bit לתשלום</label>
          <input
            value={settings.bit_phone}
            onChange={(e) => setSettings({ ...settings, bit_phone: e.target.value })}
            type="tel"
            placeholder="050-0000000"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סיסמת מנהל</label>
          <input
            value={settings.admin_password}
            onChange={(e) => setSettings({ ...settings, admin_password: e.target.value })}
            type="password"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
          <div>
            <p className="font-medium text-gray-700 text-sm">אירוע פעיל</p>
            <p className="text-gray-400 text-xs">כשמושבת, דף ההזמנות מציג הודעת סגירה</p>
          </div>
          <button
            onClick={() =>
              setSettings({ ...settings, event_active: settings.event_active === 'true' ? 'false' : 'true' })
            }
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              settings.event_active === 'true' ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                settings.event_active === 'true' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Save size={16} /> {saving ? 'שומר...' : 'שמור הגדרות'}
        </button>
      </div>
    </div>
  )
}
