import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Image, Film, Download,
  Palette, Cpu, LogOut, Settings, ChevronRight, Clapperboard
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderOpen, label: 'Progetti' },
  { to: '/media', icon: Image, label: 'Media Library' },
  { to: '/generations', icon: Cpu, label: 'Generazioni' },
  { to: '/exports', icon: Download, label: 'Export' },
  { to: '/brand-kit', icon: Palette, label: 'Brand Kit' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-surface-50 border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">MY DREAM</p>
            <p className="text-xs text-brand-400 font-semibold leading-tight">VIDEO STUDIO</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx('w-4 h-4', isActive ? 'text-brand-400' : 'text-white/40 group-hover:text-white')} />
                {label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto text-brand-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive ? 'bg-brand-600/20 text-brand-400' : 'text-white/50 hover:text-white hover:bg-white/5'
            )
          }
        >
          <Settings className="w-4 h-4" />
          Impostazioni
        </NavLink>
        <div className="px-3 py-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-white/50 truncate">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="mt-2 flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Esci
          </button>
        </div>
      </div>
    </aside>
  )
}
