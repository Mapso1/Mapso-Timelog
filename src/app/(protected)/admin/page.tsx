'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TimeEntry, Project, UserProfile, EntryFilters } from '@/types'
import EntryTable from '@/components/entries/EntryTable'
import EntryForm from '@/components/entries/EntryForm'
import Filters from '@/components/entries/Filters'
import { exportToCSV } from '@/lib/utils'

const EMPTY: EntryFilters = { dateFrom: '', dateTo: '', projectId: '', userId: '', status: '' }

export default function AdminPage() {
  const [entries,   setEntries]   = useState<TimeEntry[]>([])
  const [projects,  setProjects]  = useState<Project[]>([])
  const [users,     setUsers]     = useState<UserProfile[]>([])
  const [loading,   setLoading]   = useState(true)
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null)
  const [showForm,  setShowForm]  = useState(false)
  const [filters,   setFilters]   = useState<EntryFilters>(EMPTY)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('projects').select('*').eq('active', true).order('name').then(({ data }) => setProjects(data ?? []))
    supabase.from('user_profiles').select('*').order('full_name').then(({ data }) => setUsers(data ?? []))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('time_entries')
      .select('*, projects(id,name,code), user_profiles(id,full_name,department)')
      .order('date', { ascending: false }).limit(2000)

    if (filters.userId)    q = q.eq('user_id', filters.userId)
    if (filters.dateFrom)  q = q.gte('date', filters.dateFrom)
    if (filters.dateTo)    q = q.lte('date', filters.dateTo)
    if (filters.projectId) q = q.eq('project_id', filters.projectId)
    if (filters.status)    q = q.eq('status', filters.status)

    const { data } = await q
    setEntries(data ?? [])
    setLoading(false)
  }, [filters])

  useEffect(() => { load() }, [load])

  async function handleDelete(e: TimeEntry) {
    if (!confirm('Delete this entry permanently?')) return
    await createClient().from('time_entries').delete().eq('id', e.id)
    load()
  }

  async function updateStatus(e: TimeEntry, status: 'approved' | 'rejected') {
    await createClient().from('time_entries').update({ status }).eq('id', e.id)
    load()
  }

  function doExport() {
    const rows = entries.map(e => ({
      date: e.date, employee: e.user_profiles?.full_name ?? '',
      department: e.user_profiles?.department ?? '', project: e.projects?.name ?? '',
      project_code: e.projects?.code ?? '', start_time: e.start_time, end_time: e.end_time,
      total_hours: e.total_hours, overtime: e.overtime ? 'Yes' : 'No', status: e.status, notes: e.notes ?? '',
    }))
    exportToCSV(rows, `mapso-timelog-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const totalHours = entries.reduce((s, e) => s + Number(e.total_hours), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Admin — All Entries</h1>
          <p className="text-sm text-gray-500 mt-0.5">{entries.length} entries · {totalHours.toFixed(1)}h total</p>
        </div>
        <button onClick={doExport}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          ↓ Export to Excel
        </button>
      </div>
      <Filters filters={filters} onChange={setFilters} projects={projects} users={users} showUserFilter />
      {loading ? <div className="text-sm text-gray-400 py-8 text-center">Loading…</div> : (
        <EntryTable entries={entries} role="admin" showUser
          onEdit={e => { setEditEntry(e); setShowForm(true) }}
          onDelete={handleDelete}
          onApprove={e => e.status === 'submitted' && updateStatus(e, 'approved')}
          onReject={e  => e.status === 'submitted' && updateStatus(e, 'rejected')} />
      )}
      {showForm && (
        <EntryForm entry={editEntry} projects={projects}
          onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />
      )}
    </div>
  )
}
