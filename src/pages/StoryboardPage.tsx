import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, GripVertical, Trash2, Image, Clock, Type, Eye, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { StoryboardScene, MediaFile, OverlayPosition, TransitionType } from '../types/models'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import Input from '../components/ui/Input'

const overlayPositions: OverlayPosition[] = [
  'top-left','top-center','top-right',
  'center',
  'bottom-left','bottom-center','bottom-right',
]

interface SceneForm {
  title: string
  description: string
  media_id: string
  overlay_text: string
  overlay_position: OverlayPosition
  duration: number
  transition: TransitionType
}

const defaultForm: SceneForm = {
  title: '',
  description: '',
  media_id: '',
  overlay_text: '',
  overlay_position: 'bottom-center',
  duration: 5,
  transition: 'fade',
}

export default function StoryboardPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [scenes, setScenes] = useState<StoryboardScene[]>([])
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingScene, setEditingScene] = useState<StoryboardScene | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<SceneForm>(defaultForm)

  const fetchScenes = async () => {
    if (!projectId) return
    const { data } = await supabase
      .from('storyboard_scenes')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index')
    setScenes((data as StoryboardScene[]) || [])
    setLoading(false)
  }

  const fetchMedia = async () => {
    if (!user) return
    const { data } = await supabase.from('media_files').select('*').eq('user_id', user.id)
    setMediaFiles((data as MediaFile[]) || [])
  }

  const fetchSignedUrls = useCallback(async (files: MediaFile[]) => {
    const urls: Record<string, string> = {}
    await Promise.all(files.map(async (f) => {
      const { data } = await supabase.storage.from('media').createSignedUrl(f.storage_path, 3600)
      if (data?.signedUrl) urls[f.id] = data.signedUrl
    }))
    setSignedUrls(urls)
  }, [])

  useEffect(() => { fetchScenes(); fetchMedia() }, [projectId, user])
  useEffect(() => { if (mediaFiles.length > 0) fetchSignedUrls(mediaFiles) }, [mediaFiles, fetchSignedUrls])

  const openAdd = () => { setForm(defaultForm); setEditingScene(null); setShowAdd(true) }
  const openEdit = (scene: StoryboardScene) => {
    setForm({
      title: scene.title,
      description: scene.description || '',
      media_id: scene.media_id || '',
      overlay_text: scene.overlay_text || '',
      overlay_position: scene.overlay_position,
      duration: scene.duration,
      transition: scene.transition,
    })
    setEditingScene(scene)
    setShowAdd(true)
  }

  const saveScene = async () => {
    if (!projectId || !user || !form.title.trim()) return
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description || null,
      media_id: form.media_id || null,
      overlay_text: form.overlay_text || null,
      overlay_position: form.overlay_position,
      duration: form.duration,
      transition: form.transition,
    }
    if (editingScene) {
      const { data } = await supabase
        .from('storyboard_scenes')
        .update(payload)
        .eq('id', editingScene.id)
        .select()
        .single()
      if (data) setScenes(prev => prev.map(s => s.id === (data as StoryboardScene).id ? (data as StoryboardScene) : s))
    } else {
      const { data } = await supabase
        .from('storyboard_scenes')
        .insert({
          ...payload,
          project_id: projectId,
          user_id: user.id,
          order_index: scenes.length,
        })
        .select()
        .single()
      if (data) setScenes(prev => [...prev, data as StoryboardScene])
    }
    setShowAdd(false)
    setSaving(false)
  }

  const deleteScene = async (id: string) => {
    if (!confirm('Eliminare questa scena?')) return
    await supabase.from('storyboard_scenes').delete().eq('id', id)
    setScenes(prev => prev.filter(s => s.id !== id))
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(scenes)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    const updated = items.map((s, i) => ({ ...s, order_index: i }))
    setScenes(updated)
    await Promise.all(
      updated.map(s => supabase.from('storyboard_scenes').update({ order_index: s.order_index }).eq('id', s.id))
    )
  }

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0)

  return (
    <div>
      <PageHeader
        title="Storyboard"
        subtitle={`${scenes.length} scene · ${totalDuration}s totali`}
        actions={
          <div className="flex gap-2">
            {scenes.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setShowPreview(true)}>
                <Eye className="w-4 h-4" />Preview
              </Button>
            )}
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4" />Aggiungi Scena
            </Button>
          </div>
        }
      />

      <div className="p-8">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : scenes.length === 0 ? (
          <div className="text-center py-20">
            <Image className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 font-medium">Nessuna scena ancora</p>
            <Button className="mt-4" onClick={openAdd}><Plus className="w-4 h-4" />Prima Scena</Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="storyboard">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {scenes.map((scene, index) => {
                    const mediaUrl = scene.media_id ? signedUrls[scene.media_id] : null
                    const media = scene.media_id ? mediaFiles.find(m => m.id === scene.media_id) : null
                    return (
                      <Draggable key={scene.id} draggableId={scene.id} index={index}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 group cursor-pointer ${
                              snap.isDragging ? 'border-brand-500 bg-brand-500/10 shadow-lg' : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                            onClick={() => openEdit(scene)}
                          >
                            <div {...prov.dragHandleProps} className="text-white/20 hover:text-white/60 cursor-grab" onClick={e => e.stopPropagation()}>
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-brand-400">{index + 1}</span>
                            </div>
                            <div className="w-20 h-14 rounded-lg bg-white/5 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                              {mediaUrl && media?.type === 'image'
                                ? <img src={mediaUrl} alt={scene.title} className="w-full h-full object-cover" />
                                : mediaUrl && media?.type === 'video'
                                ? <video src={mediaUrl} className="w-full h-full object-cover" />
                                : <Image className="w-5 h-5 text-white/20" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white text-sm truncate">{scene.title}</p>
                              {scene.description && <p className="text-xs text-white/40 truncate mt-0.5">{scene.description}</p>}
                              <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-xs text-white/30">
                                  <Clock className="w-3 h-3" />{scene.duration}s
                                </span>
                                {scene.overlay_text && (
                                  <span className="flex items-center gap-1 text-xs text-white/30">
                                    <Type className="w-3 h-3" />{scene.overlay_text.slice(0, 20)}
                                  </span>
                                )}
                                <span className="text-xs text-white/20 capitalize">{scene.transition}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                              <button onClick={() => deleteScene(scene.id)}
                                className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editingScene ? 'Modifica Scena' : 'Nuova Scena'} size="lg">
        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <Input label="Titolo scena" placeholder="Es. Tramonto sulla spiaggia"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/80">Descrizione</label>
            <textarea className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none h-20"
              placeholder="Descrivi cosa succede..." value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          {/* Media Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/80">Media</label>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              <button onClick={() => setForm(f => ({ ...f, media_id: '' }))}
                className={`aspect-square rounded-lg border flex items-center justify-center transition-all ${
                  !form.media_id ? 'border-brand-500 bg-brand-500/20' : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}>
                <X className="w-4 h-4 text-white/30" />
              </button>
              {mediaFiles.filter(m => m.type === 'image' || m.type === 'video').map(m => (
                <button key={m.id} onClick={() => setForm(f => ({ ...f, media_id: m.id }))}
                  className={`aspect-square rounded-lg border overflow-hidden transition-all ${
                    form.media_id === m.id ? 'border-brand-500 ring-1 ring-brand-500' : 'border-white/10 hover:border-white/20'
                  }`}>
                  {signedUrls[m.id] && m.type === 'image'
                    ? <img src={signedUrls[m.id]} alt={m.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <Image className="w-4 h-4 text-white/20" />
                      </div>
                  }
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/80">Durata (secondi)</label>
              <input type="number" min={1} max={60} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/80">Transizione</label>
              <select value={form.transition} onChange={e => setForm(f => ({ ...f, transition: e.target.value as TransitionType }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="none">Nessuna</option>
                <option value="fade">Dissolvenza</option>
                <option value="slide">Scorri</option>
                <option value="zoom">Zoom</option>
              </select>
            </div>
          </div>
          <Input label="Testo overlay" placeholder="Es. Benvenuti al Paradise Resort"
            value={form.overlay_text} onChange={e => setForm(f => ({ ...f, overlay_text: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/80">Posizione overlay</label>
            <div className="grid grid-cols-3 gap-2">
              {overlayPositions.map(pos => (
                <button key={pos} onClick={() => setForm(f => ({ ...f, overlay_position: pos }))}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    form.overlay_position === pos ? 'bg-brand-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}>
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Annulla</Button>
          <Button onClick={saveScene} loading={saving} disabled={!form.title.trim()}>
            {editingScene ? 'Salva' : 'Aggiungi'}
          </Button>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="Preview Storyboard" size="xl">
        <div className="px-6 py-4">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {scenes.map((scene, index) => {
              const mediaUrl = scene.media_id ? signedUrls[scene.media_id] : null
              const media = scene.media_id ? mediaFiles.find(m => m.id === scene.media_id) : null
              return (
                <div key={scene.id} className="flex-shrink-0 w-48">
                  <div className="aspect-video rounded-xl bg-white/5 border border-white/10 overflow-hidden relative">
                    {mediaUrl && media?.type === 'image'
                      ? <img src={mediaUrl} alt={scene.title} className="w-full h-full object-cover" />
                      : mediaUrl && media?.type === 'video'
                      ? <video src={mediaUrl} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Image className="w-6 h-6 text-white/20" /></div>
                    }
                    {scene.overlay_text && (
                      <div className={`absolute px-2 py-1 text-xs text-white bg-black/60 rounded mx-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[90%] ${
                        scene.overlay_position.includes('bottom') ? 'bottom-2' :
                        scene.overlay_position.includes('top') ? 'top-2' : 'top-1/2 -translate-y-1/2'
                      } ${
                        scene.overlay_position.includes('left') ? 'left-1' :
                        scene.overlay_position.includes('right') ? 'right-1' : 'left-1/2 -translate-x-1/2'
                      }`}>
                        {scene.overlay_text}
                      </div>
                    )}
                    <div className="absolute top-1 left-1 w-5 h-5 rounded bg-brand-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>
                  </div>
                  <p className="text-xs text-white/60 mt-1.5 truncate font-medium">{scene.title}</p>
                  <p className="text-xs text-white/30">{scene.duration}s · {scene.transition}</p>
                </div>
              )
            })}
          </div>
        </div>
      </Modal>
    </div>
  )
}
