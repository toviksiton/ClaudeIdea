'use client'

import { useEffect, useState } from 'react'
import { Plus, ChevronRight, ChevronLeft, Trash2, Save, X, Clock, Users, CalendarDays } from 'lucide-react'

interface Employee { id: number; name: string; role: string; hourlyRate: number; status: string }
interface Assignment { employeeId: number; role: string; hours: number; hourlyRate: number; bonus: number; notes: string; employee?: { name: string; role: string } }
interface Shift {
  id: number; date: string; startTime: string; endTime: string
  notes: string | null; status: string; assignments: (Assignment & { employee: Employee })[]
}

const ROLES: Record<string, { label: string; icon: string; color: string }> = {
  CHEF:     { label: 'טבח', icon: '👨‍🍳', color: 'text-orange-600' },
  KITCHEN:  { label: 'פועל מטבח', icon: '🍳', color: 'text-blue-600' },
  DELIVERY: { label: 'שליח', icon: '🛵', color: 'text-green-600' },
  OTHER:    { label: 'אחר', icon: '👤', color: 'text-gray-600' },
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-blue-100 text-blue-700', ACTIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600', CANCELLED: 'bg-red-100 text-red-600',
}
const STATUS_LABELS: Record<string, string> = { PLANNED: 'מתוכנן', ACTIVE: 'פעיל', COMPLETED: 'הסתיים', CANCELLED: 'בוטל' }

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showNewShift, setShowNewShift] = useState(false)
  const [editShiftId, setEditShiftId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)

  const [newShift, setNewShift] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: '10:00', endTime: '22:00', notes: '',
    assignments: [] as Assignment[],
  })

  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

  async function load() {
    setLoading(true)
    const [s, e] = await Promise.all([
      fetch(`/api/shifts?month=${monthKey}`).then((r) => r.json()),
      fetch('/api/employees').then((r) => r.json()),
    ])
    setShifts(Array.isArray(s) ? s : [])
    setEmployees(Array.isArray(e) ? e.filter((em: Employee) => em.status === 'ACTIVE') : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [monthKey])
  function showMsg(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  function addAssignment(form: any, set: any) {
    const firstEmp = employees.find((e) => !form.assignments.find((a: any) => a.employeeId === e.id))
    if (!firstEmp) return
    set({ ...form, assignments: [...form.assignments, { employeeId: firstEmp.id, role: firstEmp.role, hours: 8, hourlyRate: firstEmp.hourlyRate, bonus: 0, notes: '' }] })
  }

  function updateAssignment(form: any, set: any, idx: number, patch: any) {
    set({ ...form, assignments: form.assignments.map((a: any, i: number) => i === idx ? { ...a, ...patch } : a) })
  }

  function removeAssignment(form: any, set: any, idx: number) {
    set({ ...form, assignments: form.assignments.filter((_: any, i: number) => i !== idx) })
  }

  async function createShift() {
    setSaving(true)
    await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newShift) })
    setShowNewShift(false)
    setNewShift({ date: new Date().toISOString().slice(0, 10), startTime: '10:00', endTime: '22:00', notes: '', assignments: [] })
    await load(); showMsg('משמרת נוצרה')
    setSaving(false)
  }

  async function updateShift(id: number, data: any) {
    setSaving(true)
    await fetch(`/api/shifts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    setEditShiftId(null); await load(); showMsg('משמרת עודכנה')
    setSaving(false)
  }

  async function deleteShift(id: number) {
    if (!confirm('למחוק משמרת זו?')) return
    await fetch(`/api/shifts/${id}`, { method: 'DELETE' }); await load(); showMsg('משמרת נמחקה')
  }

  function shiftLaborCost(shift: Shift) {
    return shift.assignments.reduce((s, a) => s + a.hours * a.hourlyRate + a.bonus, 0)
  }

  function monthLaborCost() {
    return shifts.reduce((s, sh) => s + shiftLaborCost(sh), 0)
  }

  // Calendar view
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay() // 0=Sun
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const shiftsByDay: Record<number, Shift[]> = {}
  shifts.forEach((s) => {
    const d = new Date(s.date).getDate()
    if (!shiftsByDay[d]) shiftsByDay[d] = []
    shiftsByDay[d].push(s)
  })

  function AssignmentEditor({ form, set }: { form: any; set: (f: any) => void }) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-3 mt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Users size={12} /> שיבוץ עובדים</p>
          <button type="button" onClick={() => addAssignment(form, set)} className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600">
            <Plus size={12} /> הוסף עובד
          </button>
        </div>
        {form.assignments.length === 0 && <p className="text-xs text-gray-400 text-center py-1">לחץ "הוסף עובד" לשיבוץ</p>}
        {form.assignments.map((a: any, idx: number) => {
          const emp = employees.find((e) => e.id === a.employeeId)
          return (
            <div key={idx} className="grid grid-cols-5 gap-2 mb-2 items-end">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-0.5 block">עובד</label>
                <select value={a.employeeId} onChange={(e) => {
                  const emp = employees.find((em) => em.id === parseInt(e.target.value))
                  updateAssignment(form, set, idx, { employeeId: parseInt(e.target.value), role: emp?.role || a.role, hourlyRate: emp?.hourlyRate || a.hourlyRate })
                }} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-0.5 block">שעות</label>
                <input type="number" step="0.5" value={a.hours} onChange={(e) => updateAssignment(form, set, idx, { hours: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-0.5 block">₪/שעה</label>
                <input type="number" value={a.hourlyRate} onChange={(e) => updateAssignment(form, set, idx, { hourlyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
              </div>
              <div className="flex items-end gap-1">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-0.5 block">בונוס</label>
                  <input type="number" value={a.bonus} onChange={(e) => updateAssignment(form, set, idx, { bonus: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
                </div>
                <button onClick={() => removeAssignment(form, set, idx)} className="text-red-400 hover:text-red-600 mb-1.5"><X size={14} /></button>
              </div>
            </div>
          )
        })}
        {form.assignments.length > 0 && (
          <p className="text-xs text-gray-500 mt-2 text-left">
            עלות עבודה: ₪{form.assignments.reduce((s: number, a: any) => s + (a.hours * a.hourlyRate + a.bonus), 0).toFixed(0)}
          </p>
        )}
      </div>
    )
  }

  function ShiftForm({ form, set, onSave, onCancel }: { form: any; set: any; onSave: () => void; onCancel: () => void }) {
    return (
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">תאריך</label>
            <input type="date" value={form.date} onChange={(e) => set({ ...form, date: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">התחלה</label>
            <input type="time" value={form.startTime} onChange={(e) => set({ ...form, startTime: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">סיום</label>
            <input type="time" value={form.endTime} onChange={(e) => set({ ...form, endTime: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">הערות</label>
            <input value={form.notes} onChange={(e) => set({ ...form, notes: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
        </div>
        <AssignmentEditor form={form} set={set} />
        <div className="flex gap-2 mt-3">
          <button onClick={onSave} disabled={saving}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Save size={14} /> שמור משמרת
          </button>
          <button onClick={onCancel} className="text-gray-500 px-3 py-2 text-sm"><X size={14} /></button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ניהול משמרות</h1>
          <p className="text-gray-500 text-sm mt-0.5">עלות עבודה החודש: ₪{monthLaborCost().toFixed(0)}</p>
        </div>
        <button onClick={() => setShowNewShift(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium text-sm">
          <Plus size={16} /> משמרת חדשה
        </button>
      </div>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 mb-4 text-sm">{msg}</div>}

      {/* New shift form */}
      {showNewShift && (
        <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4">
          <h3 className="font-bold text-gray-800 mb-3">משמרת חדשה</h3>
          <ShiftForm form={newShift} set={setNewShift} onSave={createShift} onCancel={() => setShowNewShift(false)} />
        </div>
      )}

      {/* Month navigator */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-100 rounded-xl">
            <ChevronRight size={18} />
          </button>
          <h2 className="font-bold text-gray-800">
            {currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-100 rounded-xl">
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((d) => (
            <div key={d} className="text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const dayShifts = shiftsByDay[day] || []
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year
            return (
              <div
                key={day}
                className={`rounded-xl py-1.5 px-1 min-h-[52px] text-xs cursor-pointer hover:bg-orange-50 transition-colors ${isToday ? 'bg-orange-50 border border-orange-200' : ''}`}
                onClick={() => {
                  if (dayShifts.length > 0) setExpandedId(expandedId === dayShifts[0].id ? null : dayShifts[0].id)
                }}
              >
                <p className={`font-medium mb-1 ${isToday ? 'text-orange-600' : 'text-gray-700'}`}>{day}</p>
                {dayShifts.map((s) => (
                  <div key={s.id} className={`text-xs px-1 py-0.5 rounded text-white font-medium mb-0.5 ${s.status === 'COMPLETED' ? 'bg-gray-400' : s.status === 'CANCELLED' ? 'bg-red-300' : s.status === 'ACTIVE' ? 'bg-green-500' : 'bg-orange-400'}`}>
                    {s.startTime}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Shifts list */}
      {loading ? <div className="text-center py-8 text-gray-400">טוען...</div> : shifts.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-2xl border text-gray-400">אין משמרות החודש</div>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => {
            const laborCost = shiftLaborCost(shift)
            const isEditing = editShiftId === shift.id

            return (
              <div key={shift.id} className="bg-white rounded-2xl shadow-sm border">
                <div className="p-4">
                  {isEditing && editForm ? (
                    <ShiftForm form={editForm} set={setEditForm} onSave={() => updateShift(shift.id, editForm)} onCancel={() => setEditShiftId(null)} />
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-gray-800">
                            {new Date(shift.date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-gray-400 text-sm flex items-center gap-1">
                            <Clock size={12} /> {shift.startTime} – {shift.endTime}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[shift.status]}`}>
                            {STATUS_LABELS[shift.status]}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {shift.assignments.map((a, i) => (
                            <span key={i} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                              {ROLES[a.role]?.icon} {a.employee.name} · {a.hours}ש׳ · ₪{(a.hours * a.hourlyRate + a.bonus).toFixed(0)}
                            </span>
                          ))}
                          {shift.assignments.length === 0 && (
                            <span className="text-xs text-gray-400 italic">אין עובדים משובצים</span>
                          )}
                        </div>
                        {shift.notes && <p className="text-gray-400 text-xs mt-1.5 italic">{shift.notes}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="font-bold text-orange-600">₪{laborCost.toFixed(0)}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditShiftId(shift.id)
                              setEditForm({
                                date: new Date(shift.date).toISOString().slice(0, 10),
                                startTime: shift.startTime, endTime: shift.endTime,
                                notes: shift.notes || '', status: shift.status,
                                assignments: shift.assignments.map((a) => ({ employeeId: a.employeeId, role: a.role, hours: a.hours, hourlyRate: a.hourlyRate, bonus: a.bonus, notes: a.notes || '' })),
                              })
                            }}
                            className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50"
                          >
                            <CalendarDays size={15} />
                          </button>
                          <button onClick={() => deleteShift(shift.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50">
                            <Trash2 size={15} />
                          </button>
                        </div>
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
