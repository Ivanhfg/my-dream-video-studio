import { useEffect, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Image, Film, Music, Tag, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { MediaFile, MediaType } from '../types/models'
import PageHeader from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

const typeIcon: Record<MediaType, React.ElementType> = {
  image: Image, video: Film, audio: Music, logo: Tag,
}
const typeBadge: Record<MediaType, 'info' | 'success' | 'warning' | 'purple'> = {
  image: 'info', video: 'success', audio: 'warning', logo: 'purple',
}
const typeLabel: Record<MediaType, string> = {
  image: 'Immagine', video: 'Video', audio: 'Audio', logo: 'Logo',
}

function getMimeType(mime: string): MediaType {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'image'
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaPage() {
  const { user } = useAuth()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<MediaType | 'all'>('all')
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  const fetchFiles = async () => {
    if (!user) return
    const { data } = await supabase
      .from('media_files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setFiles((data as MediaFile[]) || [])
    setLoading(false)
  }

  const fetchSignedUrls = useCallback(async (mediaFiles: MediaFile[]) => {
    const urls: Record<string, string> = {}
    await Promise.all(
      mediaFiles.map(async (f) => {
        const { data } = await supabase.storage
          .from('media')
          .createSignedUrl(f.storage_path, 3600)
        if (data?.signedUrl) urls[f.id] = data.signedUrl
      })
    )
    setSignedUrls(urls)
  }, [])

  useEffect(() => { fetchFiles() }, [user])
  useEffect(() => { if (files.length > 0) fetchSignedUrls(files) }, [files, fetchSignedUrls])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return
    setUploading(true)
    for (const file of acceptedFiles) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file)
      if (uploadError) continue
      const { data: urlData } = await supabase.storage.from('media').createSignedUrl(path, 3600)
      await supabase.from('media_files').insert({
        user_id: user.id,
        name: file.name,
        type: getMimeType(file.type),
        url: urlData?.signedUrl || '',
        storage_path: path,
        size: file.size,
        mime_type: file.type,
      })
    }
    await fetchFiles()
    setUploading(false)
  }, [user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [], 'audio/*': [] },
    maxSize: 500 * 1024 * 1024,
  })

  const deleteFile = async (file: MediaFile) => {
    if (!confirm(`Eliminare "${file.name}"?`)) return
    await supabase.storage.from('media').remove([file.storage_path])
    await supabase.from('media_files').delete().eq('id', file.id)
    setFiles(prev => prev.filter(f => f.id !== file.id))
  }

  const filtered = filter === 'all' ? files : files.filter(f => f.type === filter)

  return (
    <div>
      <PageHeader title="Media Library" subtitle={`${files.length} file caricati`} />
      <div className="p-8 space-y-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragActive ? 'border-brand-500 bg-brand-500/10' : 'border-white/20 hover:border-brand-500/50 hover:bg-white/5'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 text-white/30 mx-auto mb-3" />
          <p className="text-white/60 font-medium">
            {isDragActive ? 'Rilascia i file qui...' : 'Trascina i file o clicca per caricare'}
          </p>
          <p className="text-white/30 text-sm mt-1">Immagini, video, audio — max 500MB per file</p>
          {uploading && <p className="text-brand-400 text-sm mt-2 animate-pulse">Caricamento in corso...</p>}
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'image', 'video', 'audio', 'logo'] as const).map(type => (
            <button key={type} onClick={() => setFilter(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === type ? 'bg-brand-600 text-white' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
              }`}>
              {type === 'all' ? 'Tutti' : typeLabel[type as MediaType]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Image className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">Nessun file</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(file => {
              const Icon = typeIcon[file.type]
              const url = signedUrls[file.id]
              return (
                <Card key={file.id} className="group overflow-hidden">
                  <div className="aspect-square bg-white/5 relative flex items-center justify-center">
                    {file.type === 'image' && url
                      ? <img src={url} alt={file.name} className="w-full h-full object-cover" />
                      : file.type === 'video' && url
                      ? <video src={url} className="w-full h-full object-cover" />
                      : <Icon className="w-8 h-8 text-white/20" />
                    }
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => deleteFile(file)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-white/70 font-medium truncate">{file.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant={typeBadge[file.type]}>{typeLabel[file.type]}</Badge>
                      <span className="text-xs text-white/30">{formatSize(file.size)}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
