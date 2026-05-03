'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

interface ProjectStat { name: string; code: string; hours: number }
interface Stats {
  totalHours: number; monthHours: number; weekHours: number
  pendingCount: number; approvedCount: number
  byProject: ProjectStat[]
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-semibold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const supabase = createClient()

    async function load() {
      const [{ data: entries }, { data: projects }] = await Promise.all([
        supabase.from('time_entries').select('project_id, date, total_hours, status'),
        supabase.from('projects').select('id, name, code').eq('active', true),
      ])

      const now = new Date()
      const monthStr = now.toISOString().slice(0, 7)
      const weekDate = new Date(now); weekDate.setDate(now.getDate() - now.getDay())
      const weekStr = weekDate.toISOString().slice(0, 10)

      const all = entries ?? []
      const projMap = new Map<string, ProjectStat>()
      ;(projects ?? []).forEach(p => projMap.set(p.id, { name: p.name, code: p.code, hours: 0 }))
      all.forEach(e => {
        const p = projMap.get(e.project_id)
        if (p) p.hours += Number(e.total_hours)
      })

      const byProject = Array.from(projMap.values()).filter(p => p.hours > 0).sort((a, b) => b.hours - a.hours)

      setStats({
        totalHours:    all.reduce((s, e) => s + Number(e.total_hours), 0),
        monthHours:    all.filter(e => e.date.startsWith(monthStr)).reduce((s, e) => s + Number(e.total_hours), 0),
        weekHours:     all.filter(e => e.date >= weekStr).reduce((s, e) => s + Number(e.total_hours), 0),
        pendingCount:  all.filter(e => e.status === 'submitted').length,
        approvedCount: all.filter(e => e.status === 'approved').length,
        byProject,
      })
      setLoading(false)
    }
    load()
  }, [profile]) // eslint-disable-line

  if (loading) return <div className="text-sm text-gray-400 py-8">Loading…</div>
  if (!stats) return null

  const fmt = (h: number) => `${h.toFixed(1)}h`

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back, {profile?.full_name}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="All-time hours"   value={fmt(stats.totalHours)} />
        <StatCard label="This month"       value={fmt(stats.monthHours)} />
        <StatCard label="This week"        value={fmt(stats.weekHours)} />
        <StatCard label="Pending approval" value={String(stats.pendingCount)}  sub="submitted" />
        <StatCard label="Approved entries" value={String(stats.approvedCount)} />
      </div>
      {stats.byProject.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Hours by Project</h2>
          <div className="space-y-3">
            {stats.byProject.map(p => {
              const pct = stats.totalHours > 0 ? (p.hours / stats.totalHours) * 100 : 0
              return (
                <div key={p.code}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-medium text-gray-800">
                      {p.name} <span className="text-xs text-gray-400 font-normal">({p.code})</span>
                    </span>
                    <span className="text-sm text-gray-600 tabular-nums">{fmt(p.hours)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
