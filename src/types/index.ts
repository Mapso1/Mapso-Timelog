export type UserRole = 'employee' | 'supervisor' | 'admin'
export type EntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface UserProfile {
  id: string
  full_name: string
  role: UserRole
  department: string | null
  supervisor_id: string | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  code: string
  active: boolean
}

export interface TimeEntry {
  id: string
  user_id: string
  project_id: string
  date: string
  start_time: string
  end_time: string
  total_hours: number
  overtime: boolean
  notes: string | null
  status: EntryStatus
  created_at: string
  updated_at: string
  user_profiles?: Pick<UserProfile, 'id' | 'full_name' | 'department'>
  projects?: Pick<Project, 'id' | 'name' | 'code'>
}

export interface EntryFilters {
  dateFrom: string
  dateTo: string
  projectId: string
  userId: string
  status: string
}
