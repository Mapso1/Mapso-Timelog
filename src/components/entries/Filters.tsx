'use client'
import { Project, UserProfile, EntryFilters } from '@/types'

interface Props {
  filters: EntryFilters
  onChange: (f: EntryFilters) => void
  projects: Project[]
  users?: UserProfile[]
  showUserFilter?: boolean
}

const STATUSES = ['', 'draft', 'submitted', 'approved', 'rejected'] as const
const selectCls = `px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500`

export default function Filters({ filters, onChange, projects, users = [], showUserFilter }: Props) {
  const upd = (key: keyof EntryFilters, val: string) => onChange({ ...filters, [key]: val })
  const hasActive = Object.values(filters).some(Boolean)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-xs text-gray-500 mb-1">From</p>
          <input type="date" value={filters.dateFrom} onChange={e => upd('dateFrom', e.target.value)} className={selectCls} />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">To</p>
          <input type="date" value={filters.dateTo} onChange={e => upd('dateTo', e.target.value)} className={selectCls} />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Project</p>
          <select value={filters.projectId} onChange={e => upd('projectId', e.target.value)} className={selectCls}>
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {showUserFilter && users.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Employee</p>
            <select value={filters.userId} onChange={e => upd('userId', e.target.value)} className={selectCls}>
              <option value="">All employees</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <select value={filters.status} onChange={e => upd('status', e.target.value)} className={selectCls}>
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
          </select>
        </div>
        {hasActive && (
          <button onClick={() => onChange({ dateFrom: '', dateTo: '', projectId: '', userId: '', status: '' })}
            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
