import { useEffect, useState } from 'react'
import { Plus, Download, CheckCircle2, XCircle, Clock, Loader2, Film } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Export, ExportFormat, ExportResolution } from '../types/models'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'

const statusConfig = {
  pending:    { label: 'In attesa',   variant: 'default'  as const, icon: Clock },
  processing: { label: 'Elaborazione', variant: 'warning' as const, icon: Loader2 },
  completed:  { label: 'Completato',  variant: 'success'  as const, icon: CheckCircle2 },
  failed:     { label: 'Fallito',     variant: 'danger'   as const, icon: XCircle },
}

function formatSize(bytes: number | null) {
  if (!bytes) return '—'
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ExportsPage() {
  const { user } = useAuth()
  const [exports, setExports] = useState<Export[]>([])
  const [generations, setGenerations] = useState<{ id: string; prompt: string; project_id: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    generation_id: '',
    format: 'mp4' as ExportFormat,
    resolution: '1080p' as ExportResolution,
  })

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('exports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('generations').select('id, prompt, project_id').eq('user_id', user.id).eq('status', 'completed'),
      supabase.from('projects').select('id, name').eq('user_id', user.id),
    ]).then(([exp, gen, proj]) => {
      setExports((exp.data as Export[]) || [])
      setGenerations((gen.data as { id: string; prompt: string; project_id: string }[]) || [])
      setProjects((proj.data as { id: string; name: string }[]) || [])
      setLoading(false)
    })
  }, [user])

  const createExport = async () => {
    if (!user || !form.generation_id) return
    setCreating(true)
    const gen = generations.find(g => g.id === form.generation_id)
    const { data } = await supabase.from('exports').insert({
      project_id: gen?.project_id || '',
      user_id: user.id,
      generation_id: form.generation_id,
      format: form.format,
      resolution: form.resolution,
      status: 'pending',
    }).select().single()
    if (data) setExports(prev => [data as Export, ...prev])
    setShowCreate(false)
    setCreating(false)
  }

  const getProjectName = (pid: string) => projects.find(p => p.id === pid)?.name || '—'

  return (
    <div>
      <PageHeader title="Export" subtitle={`${exports.length} export`}
        actions={<Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />Nuovo Export</Button>}
      />
      <div className="p-8">
        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : exports.length === 0 ? (
          <div className="text-center py-16">
            <Download className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 font-medium">Nessun export</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exports.map(exp => {
              const status = statusConfig[exp.status]
              const StatusIcon = status.icon
              return (
                <Card key={exp.id} className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Film className="w-5 h-5 text-white/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white uppercase">{exp.format}</span>
                        <span className="text-xs text-white/40">{exp.resolution}</span>
                        <Badge variant={status.variant}>
                          <StatusIcon className={`w-3 h-3 mr-1 ${exp.status === 'processing' ? 'animate-spin' : ''}`} />
                          {status.label}
                        </Badge>
                        {exp.file_size && <span className="text-xs text-white/30">{formatSize(exp.file_size)}</span>}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">Progetto: {getProjectName(exp.project_id)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {exp.download_url && exp.status === 'completed' && (
                        <a href={exp.download_url} download>
                          <Button variant="secondary" size="sm"><Download className="w-4 h-4" />Scarica</Button>
                        </a>
                      )}
                      <p className="text-xs text-white/30">{new Date(exp.created_at).toLocaleDateString('it-IT')}</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuovo Export">
        <div className="px-6 py-4 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/80">Generazione completata</label>
            <select value={form.generation_id} onChange={e => setForm(f => ({ ...f, generation_id: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Seleziona generazione</option>
              {generations.map(g => <option key={g.id} value={g.id}>{g.prompt.slice(0, 60)}...</option>)}
            </select>
            {generations.length === 0 && <p className="text-xs text-yellow-400">Nessuna generazione completata disponibile</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/80">Formato</label>
              <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value as ExportFormat }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="mp4">MP4</option>
                <option value="mov">MOV</option>
                <option value="webm">WebM</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/80">Risoluzione</label>
              <select value={form.resolution} onChange={e => setForm(f => ({ ...f, resolution: e.target.value as ExportResolution }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="720p">720p — HD</option>
                <option value="1080p">1080p — Full HD</option>
                <option value="4k">4K — Ultra HD</option>
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Annulla</Button>
          <Button onClick={createExport} loading={creating} disabled={!form.generation_id}>Avvia Export</Button>
        </div>
      </Modal>
    </div>
  )
}
