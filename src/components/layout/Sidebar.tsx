'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/types'

interface NavLink { href: string; label: string; roles: UserRole[] }
const NAV: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard',  roles: ['employee', 'supervisor', 'admin'] },
  { href: '/entries',   label: 'My Entries', roles: ['employee', 'supervisor', 'admin'] },
  { href: '/team',      label: 'Team',       roles: ['supervisor', 'admin'] },
  { href: '/admin',     label: 'Admin',      roles: ['admin'] },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const links = NAV.filter(l => profile?.role && l.roles.includes(profile.role))

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="font-semibold text-gray-900">MapsoTimeLog</span>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {links.map(link => {
          const active = pathname === link.href
          return (
            <Link key={link.href} href={link.href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}>
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-2 mb-2">
          <p className="text-sm font-medium text-gray-800 truncate">{profile?.full_name}</p>
          <p className="text-xs text-gray-400 capitalize mt-0.5">
            {profile?.role}{profile?.department ? ` · ${profile.department}` : ''}
          </p>
        </div>
        <button onClick={signOut}
          className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  )
}
