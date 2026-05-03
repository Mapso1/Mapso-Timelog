'use client'
import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { TimeEntry, Project } from '@/types'
import { calcHours, today } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

interface Props { entry?: TimeEntry | null; projects: Project[]; onClose: () => void; onSaved: () => void }

const inputCls = `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`
const labelCls = 'block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1'

export default function EntryForm({ entry, projects, onClose, onSaved }: Props) {
  const { profile } = useAuth()
  const isEdit = !!entry

  const [date,      setDate]      = useState(entry?.date ?? today())
  const [startTime, setStartTime] = useState(entry?.start_time?.slice(0, 5) ?? '08:00')
  const [endTime,   setEndTime]   = useState(entry?.end_time?.slice(0, 5) ?? '17:00')
  const [projectId, setProjectId] = useState(entry?.project_id ?? (projects[0]?.id ?? ''))
  const [overtime,  setOvertime]  = useState(entry?.overtime ?? false)
  const [notes,     setNotes]     = useState(entry?.notes ?? '')
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)

  const totalHours = calcHours(startTime, endTime)
  const hoursValid = totalHours > 0 && totalHours <= 24

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!hoursValid) { setError('End time must be after start time.'); return }
    if (!projectId)  { setError('Please select a project.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const payload = {
      project_id: projectId, date,
      start_time: startTime + ':00', end_time: endTime + ':00',
      total_hours: totalHours, overtime, notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error: err } = isEdit
      ? await supabase.from('time_entries').update(payload).eq('id', entry!.id)
      : await supabase.from('time_entries').insert({ ...payload, user_id: profile!.id, status: 'draft' })
    setSaving(false)
    if (err) setError(err.message)
    else onSaved()
  }

  return (
    <Modal title={isEdit ? 'Edit Entry' : 'Log Hours'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Date *</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Project *</label>
            <select required value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls}>
              <option value="">Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Start Time *</label>
            <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>End Time *</label>
            <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total hours</span>
          <span className={`text-xl font-semibold ${hoursValid ? 'text-gray-900' : 'text-red-500'}`}>
            {hoursValid ? `${totalHours.toFixed(2)}h` : 'Invalid range'}
          </span>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={overtime} onChange={e => setOvertime(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm text-gray-700">Mark as overtime</span>
        </label>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="What did you work on?" className={inputCls + ' resize-none'} />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving || !hoursValid}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save entry'}
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
