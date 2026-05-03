'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { TimeEntry, Project, EntryFilters } from '@/types'
import EntryTable from '@/components/entries/EntryTable'
import EntryForm from '@/components/entries/EntryForm'
import Filters from '@/components/entries/Filters'

const EMPTY_FILTERS: EntryFilters = { dateFrom: '', dateTo: '', projectId: '', userId: '', status: '' }

export default function EntriesPage() {
  const { profile } = useAuth()
  const [entries,   setEntries]   = useState<TimeEntry[]>([])
  const [projects,  setProjects]  = useState<Project[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null)
  const [filters,   setFilters]   = useState<EntryFilters>(EMPTY_FILTERS)

  useEffect(() => {
    createClient().from('projects').select('*').eq('active', true).order('name')
      .then(({ data }) => setProjects(data ?? []))
  }, [])

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('time_entries')
      .select('*, projects(id,name,code), user_profiles(id,full_name,department)')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })

    if (filters.dateFrom)  q = q.gte('date', filters.dateFrom)
    if (filters.dateTo)    q = q.lte('date', filters.dateTo)
    if (filters.projectId) q = q.eq('project_id', filters.projectId)
    if (filters.status)    q = q.eq('status', filters.status)

    const { data } = await q
    setEntries(data ?? [])
    setLoading(false)
  }, [profile, filters]) // eslint-disable-line

  useEffect(() => { load() }, [load])

  async function handleDelete(e: TimeEntry) {
    if (!confirm('Delete this entry?')) return
    await createClient().from('time_entries').delete().eq('id', e.id)
    load()
  }

  async function handleSubmit(e: TimeEntry) {
    await createClient().from('time_entries').update({ status: 'submitted' }).eq('id', e.id)
    load()
  }

  const totalHours = entries.reduce((s, e) => s + Number(e.total_hours), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Entries</h1>
          <p className="text-sm text-gray-500 mt-0.5">{entries.length} entries · {totalHours.toFixed(1)}h total</p>
        </div>
        <button onClick={() => { setEditEntry(null); setShowForm(true) }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Log hours
        </button>
      </div>
      <Filters filters={filters} onChange={setFilters} projects={projects} showUserFilter={false} />
      {loading ? <div className="text-sm text-gray-400 py-8 text-center">Loading…</div> : (
        <EntryTable entries={entries} role="employee" showUser={false}
          onEdit={e => (e.status === 'draft' || e.status === 'rejected') && (setEditEntry(e), setShowForm(true))}
          onDelete={e => (e.status === 'draft' || e.status === 'rejected') && handleDelete(e)}
          onSubmit={e => e.status === 'draft' && handleSubmit(e)} />
      )}
      {showForm && (
        <EntryForm entry={editEntry} projects={projects}
          onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />
      )}
    </div>
  )
}
