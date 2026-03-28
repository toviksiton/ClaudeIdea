'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Save, X, UserCheck, Star, Phone } from 'lucide-react'

interface Employee {
  id: number; name: string; phone: string | null; role: string; hourlyRate: number
  status: string; referredById: number | null; referralBonus: number; notes: string | null
  referredBy: { id: number; name: string } | null
  _count: { referrals: number; shiftAssignments: number }
}

const ROLES: Record<string, { label: string; color: string; icon: string }> = {
  CHEF:     { label: 'טבח', color: 'bg-orange-100 text-orange-700', icon: '👨‍🍳' },
  KITCHEN:  { label: 'פועל מטבח', color: 'bg-blue-100 text-blue-700', icon: '🍳' },
  DELIVERY: { label: 'שליח', color: 'bg-green-100 text-green-700', icon: '🛵' },
  OTHER:    { label: 'אחר', color: 'bg-gray-100 text-gray-600', icon: '👤' },
}

const EMPTY = { name: '', phone: '', role: 'KITCHEN', hourlyRate: 0, referredById: '', referralBonus: 0, notes: '' }

function EmpForm({ form, set, employees, excludeId }: { form: any; set: (f: any) => void; employees: any[]; excludeId: number | null }) {
  const others = employees.filter((e) => e.id !== excludeId)
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">שם מלא</label>
        <input value={form.name} onChange={(e) => set({ ...form, name: e.target.value })} placeholder="ישראל ישראלי"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">טלפון</label>
        <input type="tel" value={form.phone} onChange={(e) => set({ ...form, phone: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">תפקיד</label>
        <select value={form.role} onChange={(e) => set({ ...form, role: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">שכר לשעה (₪)</label>
        <input type="number" value={form.hourlyRate} onChange={(e) => set({ ...form, hourlyRate: parseFloat(e.target.value) || 0 })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1"><Star size={11} className="text-amber-400" /> הופנה ע״י</label>
        <select value={form.referredById} onChange={(e) => set({ ...form, referredById: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option value="">— ללא ממליץ —</option>
          {others.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">בונוס המלצה (₪)</label>
        <input type="number" value={form.referralBonus} onChange={(e) => set({ ...form, referralBonus: parseFloat(e.target.value) || 0 })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
      </div>
      <div className="md:col-span-3">
        <label className="text-xs text-gray-500 mb-1 block">הערות</label>
        <input value={form.notes} onChange={(e) => set({ ...form, notes: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
      </div>
    </div>
  )
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState(EMPTY as any)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState(EMPTY as any)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    const r = await fetch('/api/employees')
    const d = await r.json()
    setEmployees(Array.isArray(d) ? d : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  function showMsg(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  async function create() {
    if (!newForm.name.trim()) return
    setSaving(true)
    await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newForm) })
    setShowNew(false); setNewForm(EMPTY); await load(); showMsg('עובד נוסף')
    setSaving(false)
  }

  async function save(id: number) {
    setSaving(true)
    await fetch(`/api/employees/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    setEditId(null); await load(); showMsg('עובד עודכן')
    setSaving(false)
  }

  async function del(id: number) {
    if (!confirm('למחוק עובד זה?')) return
    await fetch(`/api/employees/${id}`, { method: 'DELETE' }); await load(); showMsg('עובד נמחק')
  }

  async function toggleStatus(emp: Employee) {
    await fetch(`/api/employees/${emp.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...emp, status: emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }) })
    await load()
  }

  const activeEmps = employees.filter((e) => e.status === 'ACTIVE')
  const referralStats = employees.reduce((acc, e) => { if (e.referredById) acc.count++; return acc }, { count: 0 })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">עובדים</h1>
          <p className="text-gray-500 text-sm mt-0.5">{activeEmps.length} עובדים פעילים · {referralStats.count} הגיעו דרך המלצה</p>
        </div>
        <button onClick={() => { setShowNew(true); setNewForm(EMPTY) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium text-sm">
          <Plus size={16} /> עובד חדש
        </button>
      </div>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 mb-4 text-sm">{msg}</div>}

      {/* Referral program banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
        <div className="bg-amber-100 p-2.5 rounded-xl"><Star size={20} className="text-amber-600" /></div>
        <div className="flex-1">
          <p className="font-bold text-gray-800">קמפיין חבר מביא חבר 🎉</p>
          <p className="text-gray-600 text-sm">עובד שמפנה חבר מקבל בונוס. הגדר את הבונוס בפרופיל העובד.</p>
        </div>
        <div className="text-left">
          <p className="text-2xl font-bold text-amber-600">{referralStats.count}</p>
          <p className="text-xs text-gray-400">גיוסים דרך המלצה</p>
        </div>
      </div>

      {showNew && (
        <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4 animate-fade-in">
          <h3 className="font-bold text-gray-800 mb-3">עובד חדש</h3>
          <EmpForm form={newForm} set={setNewForm} employees={employees} excludeId={null} />
          <div className="flex gap-2 mt-3">
            <button onClick={create} disabled={saving} className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium"><Save size={14} /> שמור</button>
            <button onClick={() => setShowNew(false)} className="text-gray-500 px-3 py-2 text-sm"><X size={14} /></button>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-gray-400">טוען...</div> : (
        <div className="space-y-2">
          {employees.map((emp) => {
            const roleInfo = ROLES[emp.role] || ROLES.OTHER
            const isEditing = editId === emp.id
            return (
              <div key={emp.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${emp.status === 'INACTIVE' ? 'opacity-50' : ''}`}>
                <div className="p-4">
                  {isEditing ? (
                    <>
                      <EmpForm form={editForm} set={setEditForm} employees={employees} excludeId={emp.id} />
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => save(emp.id)} disabled={saving} className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium"><Save size={14} /> שמור</button>
                        <button onClick={() => setEditId(null)} className="text-gray-500 px-3 py-2 text-sm"><X size={14} /></button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-gray-100 rounded-2xl flex items-center justify-center text-xl shrink-0">
                        {roleInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800">{emp.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleInfo.color}`}>{roleInfo.label}</span>
                          {emp.status === 'INACTIVE' && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">לא פעיל</span>}
                          {emp._count.referrals > 0 && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Star size={10} /> הפנה {emp._count.referrals}
                            </span>
                          )}
                          {emp.referredBy && (
                            <span className="text-xs text-gray-400">הגיע דרך: {emp.referredBy.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-0.5 text-sm text-gray-500">
                          {emp.phone && <a href={`tel:${emp.phone}`} className="flex items-center gap-1 hover:text-blue-600"><Phone size={11} /> {emp.phone}</a>}
                          <span>₪{emp.hourlyRate}/ש׳</span>
                          <span>{emp._count.shiftAssignments} משמרות</span>
                          {emp.referralBonus > 0 && <span className="text-amber-600">בונוס: ₪{emp.referralBonus}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => toggleStatus(emp)} className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'}`}>
                          {emp.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
                        </button>
                        <button onClick={() => { setEditId(emp.id); setEditForm({ name: emp.name, phone: emp.phone || '', role: emp.role, hourlyRate: emp.hourlyRate, referredById: emp.referredById || '', referralBonus: emp.referralBonus, notes: emp.notes || '' }) }}
                          className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50"><Pencil size={15} /></button>
                        <button onClick={() => del(emp.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
