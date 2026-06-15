import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Cpu, CheckCircle2, XCircle, Clock, Loader2, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Generation, GenerationProvider } from '../types/models'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'

const providers: { id: GenerationProvider; name: string; description: string; color: string }[] = [
  { id: 'google_veo', name: 'Google Veo', description: 'Generazione video di alta qualità da Google DeepMind', color: 'text-blue-400' },
  { id: 'kling', name: 'Kling', description: 'Video AI con controllo cinematografico avanzato', color: 'text-purple-400' },
  { id: 'higgsfield', name: 'Higgsfield', description: 'Video promozionali con effetti fisici realistici', color: 'text-green-400' },
  { id: 'runway', name: 'Runway Gen-3', description: 'Leader nell\'AI video creativa professionale', color: 'text-orange-400' },
  { id: 'pika', name: 'Pika', description: 'Video AI veloce e accessibile per creator', color: 'text-pink-400' },
]

const statusConfig = {
  pending:    { label: 'In attesa',   variant: 'default'  as const, icon: Clock },
  processing: { label: 'Elaborazione', variant: 'warning' as const, icon: Loader2 },
  completed:  { label: 'Completato',  variant: 'success'  as const, icon: CheckCircle2 },
  failed:     { label: 'Fallito',     variant: 'danger'   as const, icon: XCircle },
}

export default function GenerationsPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const projectFilter = searchParams.get('project')
  const [generations, setGenerations] = useState<Generation[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    project_id: projectFilter || '',
    provider: 'runway' as GenerationProvider,
    prompt: '',
    aspect_ratio: '16:9',
    duration: 5,
  })

  useEffect(() => {
    if (!user) return
    const genQuery = supabase.from('generations').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    const q = projectFilter ? genQuery.eq('project_id', projectFilter) : genQuery
    Promise.all([
      q,
      supabase.from('projects').select('id, name').eq('user_id', user.id),
    ]).then(([gen, proj]) => {
      setGenerations((gen.data as Generation[]) || [])
      setProjects((proj.data as { id: string; name: string }[]) || [])
      setLoading(false)
    })
  }, [user, projectFilter])

  const createGeneration = async () => {
    if (!user || !form.project_id || !form.prompt.trim()) return
    setCreating(true)
    const { data } = await supabase.from('generations').insert({
      project_id: form.project_id,
      user_id: user.id,
      provider: form.provider,
      prompt: form.prompt,
      status: 'pending',
      progress: 0,
      settings: { aspect_ratio: form.aspect_ratio, duration: form.duration },
    }).select().single()
    if (data) setGenerations(prev => [data as Generation, ...prev])
    setShowCreate(false)
    setCreating(false)
  }

  return (
    <div>
      <PageHeader
        title="Generazioni"
        subtitle={`${generations.length} generazion${generations.length === 1 ? 'e' : 'i'}`}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />Nuova Generazione
          </Button>
        }
      />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {providers.map(p => (
            <Card key={p.id} className="p-4 text-center">
              <Zap className={`w-5 h-5 ${p.color} mx-auto mb-2`} />
              <p className="text-xs font-semibold text-white">{p.name}</p>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : generations.length === 0 ? (
          <div className="text-center py-16">
            <Cpu className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 font-medium">Nessuna generazione</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />Genera Video</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {generations.map(gen => {
              const status = statusConfig[gen.status]
              const StatusIcon = status.icon
              const provider = providers.find(p => p.id === gen.provider)
              return (
                <Card key={gen.id} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <Cpu className="w-5 h-5 text-white/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${provider?.color || 'text-white'}`}>{provider?.name}</span>
                        <Badge variant={status.variant}>
                          <StatusIcon className={`w-3 h-3 mr-1 ${gen.status === 'processing' ? 'animate-spin' : ''}`} />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/60 mt-1 line-clamp-2">{gen.prompt}</p>
                      {gen.status === 'processing' && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-white/40 mb-1">
                            <span>Progresso</span><span>{gen.progress}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5">
                            <div className="bg-brand-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${gen.progress}%` }} />
                          </div>
                        </div>
                      )}
                      {gen.error_message && <p className="text-xs text-red-400 mt-1">{gen.error_message}</p>}
                    </div>
                    <p className="text-xs text-white/30 shrink-0">{new Date(gen.created_at).toLocaleDateString('it-IT')}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuova Generazione" size="lg">
        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/80">Progetto</label>
            <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Seleziona un progetto</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/80">Provider AI</label>
            <div className="space-y-2">
              {providers.map(p => (
                <button key={p.id} onClick={() => setForm(f => ({ ...f, provider: p.id }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    form.provider === p.id ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}>
                  <Zap className={`w-4 h-4 ${p.color} shrink-0`} />
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-white/40">{p.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/80">Prompt</label>
            <textarea className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none h-28"
              placeholder="Descrivi dettagliatamente il video che vuoi generare..."
              value={form.prompt} onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/80">Formato</label>
              <select value={form.aspect_ratio} onChange={e => setForm(f => ({ ...f, aspect_ratio: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="16:9">16:9 — Widescreen</option>
                <option value="9:16">9:16 — Verticale Reel</option>
                <option value="1:1">1:1 — Quadrato</option>
                <option value="4:3">4:3 — Standard</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/80">Durata (sec)</label>
              <input type="number" min={3} max={60} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Annulla</Button>
          <Button onClick={createGeneration} loading={creating} disabled={!form.project_id || !form.prompt.trim()}>
            Avvia Generazione
          </Button>
        </div>
      </Modal>
    </div>
  )
}
