'use client'
import { TimeEntry, UserRole } from '@/types'
import { formatDate } from '@/lib/utils'

const STATUS_CLS: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  submitted: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  approved:  'bg-green-50 text-green-700 border border-green-200',
  rejected:  'bg-red-50 text-red-700 border border-red-200',
}

interface Props {
  entries: TimeEntry[]
  role: UserRole
  showUser?: boolean
  onEdit?:    (e: TimeEntry) => void
  onDelete?:  (e: TimeEntry) => void
  onSubmit?:  (e: TimeEntry) => void
  onApprove?: (e: TimeEntry) => void
  onReject?:  (e: TimeEntry) => void
}

const Btn = ({ label, onClick, color }: { label: string; onClick: () => void; color: string }) => (
  <button onClick={onClick} className={`text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity ${color}`}>
    {label}
  </button>
)

export default function EntryTable(props: Props) {
  const { entries, role, showUser, onEdit, onDelete, onSubmit, onApprove, onReject } = props

  if (!entries.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">No entries found.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              {showUser && <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>}
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map(e => (
              <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(e.date)}</td>
                {showUser && (
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{e.user_profiles?.full_name}</p>
                    {e.user_profiles?.department && <p className="text-xs text-gray-400">{e.user_profiles.department}</p>}
                  </td>
                )}
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{e.projects?.name}</p>
                  <p className="text-xs text-gray-400">{e.projects?.code}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {e.start_time.slice(0, 5)} – {e.end_time.slice(0, 5)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-semibold text-gray-900">{Number(e.total_hours).toFixed(2)}h</span>
                  {e.overtime && <span className="ml-1.5 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">OT</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_CLS[e.status] ?? ''}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={e.notes ?? ''}>{e.notes || '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex gap-1 justify-end">
                    {role === 'employee' && (
                      <>
                        {(e.status === 'draft' || e.status === 'rejected') && onEdit && <Btn label="Edit" onClick={() => onEdit(e)} color="text-blue-600 hover:bg-blue-50" />}
                        {e.status === 'draft' && onSubmit && <Btn label="Submit" onClick={() => onSubmit(e)} color="text-green-600 hover:bg-green-50" />}
                        {(e.status === 'draft' || e.status === 'rejected') && onDelete && <Btn label="Del" onClick={() => onDelete(e)} color="text-red-500 hover:bg-red-50" />}
                      </>
                    )}
                    {(role === 'supervisor' || role === 'admin') && (
                      <>
                        {e.status === 'submitted' && onApprove && <Btn label="Approve" onClick={() => onApprove(e)} color="text-green-600 hover:bg-green-50" />}
                        {e.status === 'submitted' && onReject && <Btn label="Reject" onClick={() => onReject(e)} color="text-red-500 hover:bg-red-50" />}
                        {role === 'admin' && onEdit && <Btn label="Edit" onClick={() => onEdit(e)} color="text-blue-600 hover:bg-blue-50" />}
                        {role === 'admin' && onDelete && <Btn label="Del" onClick={() => onDelete(e)} color="text-red-500 hover:bg-red-50" />}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
