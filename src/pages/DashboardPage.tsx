import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, Image, Cpu, Download, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'

interface Stats { projects: number; mediaFiles: number; generations: number; exports: number }

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ projects: 0, mediaFiles: 0, generations: 0, exports: 0 })
  const [loading, setLoading] = useState(true)
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Utente'

  useEffect(() => {
    async function fetchStats() {
      if (!user) return
      const [p, m, g, e] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('media_files').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('generations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('exports').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      setStats({ projects: p.count || 0, mediaFiles: m.count || 0, generations: g.count || 0, exports: e.count || 0 })
      setLoading(false)
    }
    fetchStats()
  }, [user])

  const statCards = [
    { label: 'Progetti', value: stats.projects, icon: FolderOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', to: '/projects' },
    { label: 'File Media', value: stats.mediaFiles, icon: Image, color: 'text-green-400', bg: 'bg-green-500/10', to: '/media' },
    { label: 'Generazioni', value: stats.generations, icon: Cpu, color: 'text-purple-400', bg: 'bg-purple-500/10', to: '/generations' },
    { label: 'Export', value: stats.exports, icon: Download, color: 'text-orange-400', bg: 'bg-orange-500/10', to: '/exports' },
  ]

  return (
    <div>
      <PageHeader title={`Ciao, ${firstName} 👋`} subtitle="Benvenuto nel tuo studio video AI"
        actions={<Link to="/projects"><Button size="sm"><Plus className="w-4 h-4" />Nuovo Progetto</Button></Link>}
      />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg, to }) => (
            <Link key={label} to={to}>
              <Card className="p-6 hover:border-white/20 cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-white/40 font-medium">{label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{loading ? '—' : value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-white/30 group-hover:text-brand-400 transition-colors">
                  <TrendingUp className="w-3 h-3" />Vedi tutti
                </div>
              </Card>
            </Link>
          ))}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Azioni rapide</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { to: '/projects', icon: FolderOpen, color: 'text-brand-400', title: 'Nuovo Progetto', desc: 'Crea un progetto video dalla libreria template', hover: 'group-hover:text-brand-400' },
              { to: '/media', icon: Image, color: 'text-green-400', title: 'Carica Media', desc: 'Aggiungi immagini, video o audio alla libreria', hover: 'group-hover:text-green-400' },
              { to: '/generations', icon: Cpu, color: 'text-purple-400', title: 'Genera Video', desc: 'Usa AI per generare il tuo video promozionale', hover: 'group-hover:text-purple-400' },
            ].map(({ to, icon: Icon, color, title, desc, hover }) => (
              <Link key={to} to={to}>
                <Card className="p-6 hover:border-brand-600/50 cursor-pointer group h-full">
                  <Icon className={`w-6 h-6 ${color} mb-3`} />
                  <h3 className="font-semibold text-white text-sm">{title}</h3>
                  <p className="text-xs text-white/40 mt-1">{desc}</p>
                  <ArrowRight className={`w-4 h-4 text-white/20 ${hover} mt-3 transition-colors`} />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
