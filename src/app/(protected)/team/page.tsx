'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { TimeEntry, Project, UserProfile, EntryFilters } from '@/types'
import EntryTable from '@/components/entries/EntryTable'
import Filters from '@/components/entries/Filters'

const EMPTY: EntryFilters = { dateFrom: '', dateTo: '', projectId: '', userId: '', status: '' }

export default function TeamPage() {
  const { profile } = useAuth()
  const [entries,     setEntries]     = useState<TimeEntry[]>([])
  const [projects,    setProjects]    = useState<Project[]>([])
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filters,     setFilters]     = useState<EntryFilters>(EMPTY)

  useEffect(() => {
    if (!profile) return
    const supabase = createClient()
    supabase.from('projects').select('*').eq('active', true).order('name').then(({ data }) => setProjects(data ?? []))
    supabase.from('user_profiles').select('*').eq('supervisor_id', profile.id).order('full_name')
      .then(({ data }) => setTeamMembers(data ?? []))
  }, [profile]) // eslint-disable-line

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('time_entries')
      .select('*, projects(id,name,code), user_profiles(id,full_name,department)')
      .order('date', { ascending: false }).limit(500)

    if (filters.userId)    q = q.eq('user_id', filters.userId)
    if (filters.dateFrom)  q = q.gte('date', filters.dateFrom)
    if (filters.dateTo)    q = q.lte('date', filters.dateTo)
    if (filters.projectId) q = q.eq('project_id', filters.projectId)
    if (filters.status)    q = q.eq('status', filters.status)

    const { data } = await q
    setEntries(data ?? [])
    setLoading(false)
  }, [profile, filters]) // eslint-disable-line

  useEffect(() => { load() }, [load])

  async function updateStatus(e: TimeEntry, status: 'approved' | 'rejected') {
    await createClient().from('time_entries').update({ status }).eq('id', e.id)
    load()
  }

  const totalHours = entries.reduce((s, e) => s + Number(e.total_hours), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Team Entries</h1>
        <p className="text-sm text-gray-500 mt-0.5">{entries.length} entries · {totalHours.toFixed(1)}h · {teamMembers.length} team members</p>
      </div>
      <Filters filters={filters} onChange={setFilters} projects={projects} users={teamMembers} showUserFilter />
      {loading ? <div className="text-sm text-gray-400 py-8 text-center">Loading…</div> : (
        <EntryTable entries={entries} role="supervisor" showUser
          onApprove={e => e.status === 'submitted' && updateStatus(e, 'approved')}
          onReject={e  => e.status === 'submitted' && updateStatus(e, 'rejected')} />
      )}
    </div>
  )
}
