import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Film, BookOpen, Cpu, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Project } from '../types/models'
import PageHeader from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase.from('projects').select('*').eq('id', id).single()
      .then(({ data }) => { setProject(data as Project); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
    </div>
  )
  if (!project) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white/40">Progetto non trovato</p>
    </div>
  )

  const sections = [
    { icon: BookOpen, label: 'Storyboard', description: 'Organizza le scene del tuo video', to: `/projects/${id}/storyboard`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Cpu, label: 'Generazioni', description: 'Genera il video con AI', to: `/generations?project=${id}`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: Film, label: 'Media', description: 'Gestisci i media del progetto', to: `/media?project=${id}`, color: 'text-green-400', bg: 'bg-green-500/10' },
  ]

  return (
    <div>
      <PageHeader title={project.name} subtitle={project.description || 'Nessuna descrizione'}
        actions={<Link to="/projects"><Button variant="secondary" size="sm"><ArrowLeft className="w-4 h-4" />Progetti</Button></Link>}
      />
      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sections.map(({ icon: Icon, label, description, to, color, bg }) => (
            <Link key={label} to={to}>
              <Card className="p-6 hover:border-brand-600/40 cursor-pointer group h-full">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-white">{label}</h3>
                <p className="text-sm text-white/40 mt-1">{description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
