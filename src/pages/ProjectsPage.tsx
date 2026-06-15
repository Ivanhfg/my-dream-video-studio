import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FolderOpen, Trash2, Film, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Project } from '../types/models'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import Input from '../components/ui/Input'

const statusMap: Record<Project['status'], { label: string; variant: 'default' | 'warning' | 'success' }> = {
  draft: { label: 'Bozza', variant: 'default' },
  in_progress: { label: 'In corso', variant: 'warning' },
  completed: { label: 'Completato', variant: 'success' },
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const fetchProjects = async () => {
    if (!user) return
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setProjects((data as Project[]) || [])
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [user])

  const createProject = async () => {
    if (!user || !name.trim()) return
    setCreating(true)
    const { data } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name: name.trim(), description: description.trim() || null, status: 'draft' })
      .select()
      .single()
    if (data) setProjects(prev => [data as Project, ...prev])
    setShowCreate(false)
    setName('')
    setDescription('')
    setCreating(false)
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Eliminare questo progetto?')) return
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div>
      <PageHeader
        title="Progetti"
        subtitle={`${projects.length} progett${projects.length === 1 ? 'o' : 'i'}`}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            Nuovo Progetto
          </Button>
        }
      />
      <div className="p-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 font-medium">Nessun progetto ancora</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />Crea Progetto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <Card key={project.id} className="group hover:border-brand-600/40">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
                      <Film className="w-5 h-5 text-brand-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusMap[project.status].variant}>{statusMap[project.status].label}</Badge>
                      <button onClick={() => deleteProject(project.id)}
                        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-white text-sm line-clamp-1">{project.name}</h3>
                  {project.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{project.description}</p>}
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <p className="text-xs text-white/30">{new Date(project.created_at).toLocaleDateString('it-IT')}</p>
                    <Link to={`/projects/${project.id}`}
                      className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
                      Apri <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuovo Progetto">
        <div className="px-6 py-4 space-y-4">
          <Input label="Nome del progetto" placeholder="Es. Video Resort Sardegna 2024"
            value={name} onChange={e => setName(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/80">Descrizione (opzionale)</label>
            <textarea className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none h-24"
              placeholder="Descrivi il progetto..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Annulla</Button>
          <Button onClick={createProject} loading={creating} disabled={!name.trim()}>Crea Progetto</Button>
        </div>
      </Modal>
    </div>
  )
}
