import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { BrandKit, WatermarkPosition } from '../types/models'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardContent, CardHeader } from '../components/ui/Card'

const FONTS = ['Inter','Roboto','Poppins','Montserrat','Playfair Display','Lato','Open Sans','Raleway','Oswald','Source Sans Pro']

type KitForm = Omit<BrandKit, 'id' | 'user_id' | 'logo_url' | 'watermark_url' | 'created_at' | 'updated_at'>

const defaultKit: KitForm = {
  name: 'Il mio Brand Kit',
  primary_color: '#5b63f8',
  secondary_color: '#1c1c4e',
  accent_color: '#7488fc',
  font_primary: 'Inter',
  font_secondary: 'Poppins',
  watermark_position: 'bottom-right',
  watermark_opacity: 80,
}

export default function BrandKitPage() {
  const { user } = useAuth()
  const [kitId, setKitId] = useState<string | null>(null)
  const [form, setForm] = useState<KitForm>(defaultKit)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('brand_kits').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          const kit = data as BrandKit
          setKitId(kit.id)
          setForm({
            name: kit.name,
            primary_color: kit.primary_color,
            secondary_color: kit.secondary_color,
            accent_color: kit.accent_color,
            font_primary: kit.font_primary,
            font_secondary: kit.font_secondary,
            watermark_position: kit.watermark_position,
            watermark_opacity: kit.watermark_opacity,
          })
        }
        setLoading(false)
      })
  }, [user])

  const save = async () => {
    if (!user) return
    setSaving(true)
    if (kitId) {
      await supabase.from('brand_kits').update(form).eq('id', kitId)
    } else {
      const { data } = await supabase.from('brand_kits').insert({ ...form, user_id: user.id }).select().single()
      if (data) setKitId((data as BrandKit).id)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
    </div>
  )

  const colorFields: { key: keyof KitForm; label: string }[] = [
    { key: 'primary_color', label: 'Colore primario' },
    { key: 'secondary_color', label: 'Colore secondario' },
    { key: 'accent_color', label: 'Colore accento' },
  ]

  return (
    <div>
      <PageHeader title="Brand Kit" subtitle="Personalizza l'identità visiva dei tuoi video"
        actions={
          <Button size="sm" onClick={save} loading={saving}>
            <Save className="w-4 h-4" />{saved ? 'Salvato!' : 'Salva'}
          </Button>
        }
      />
      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h3 className="font-semibold text-white">Identità</h3></CardHeader>
          <CardContent>
            <Input label="Nome brand kit" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold text-white">Colori</h3></CardHeader>
          <CardContent className="space-y-4">
            {colorFields.map(({ key, label }) => (
              <div key={String(key)} className="flex items-center gap-3">
                <input type="color" value={form[key] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                <div className="flex-1">
                  <p className="text-sm text-white/70">{label}</p>
                  <p className="text-xs text-white/30 font-mono">{form[key] as string}</p>
                </div>
                <div className="w-8 h-8 rounded-lg border border-white/20" style={{ backgroundColor: form[key] as string }} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold text-white">Tipografia</h3></CardHeader>
          <CardContent className="space-y-4">
            {(['font_primary','font_secondary'] as const).map(key => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">
                  {key === 'font_primary' ? 'Font primario' : 'Font secondario'}
                </label>
                <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold text-white">Watermark</h3></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/80">Posizione</label>
              <div className="grid grid-cols-2 gap-2">
                {(['top-left','top-right','bottom-left','bottom-right'] as WatermarkPosition[]).map(pos => (
                  <button key={pos} onClick={() => setForm(f => ({ ...f, watermark_position: pos }))}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      form.watermark_position === pos ? 'bg-brand-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}>
                    {pos.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/80">Opacità: {form.watermark_opacity}%</label>
              <input type="range" min={0} max={100} value={form.watermark_opacity}
                onChange={e => setForm(f => ({ ...f, watermark_opacity: Number(e.target.value) }))}
                className="w-full accent-brand-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><h3 className="font-semibold text-white">Preview</h3></CardHeader>
          <CardContent>
            <div className="w-full h-40 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: form.secondary_color }}>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: form.primary_color, fontFamily: form.font_primary }}>
                  MY DREAM VIDEO STUDIO
                </p>
                <p className="text-sm mt-1" style={{ color: form.accent_color, fontFamily: form.font_secondary }}>
                  Video promozionali AI di qualità professionale
                </p>
              </div>
              <div
                className={`absolute text-xs ${form.watermark_position.includes('bottom') ? 'bottom-3' : 'top-3'} ${form.watermark_position.includes('right') ? 'right-3' : 'left-3'}`}
                style={{ color: form.accent_color, opacity: form.watermark_opacity / 100 }}
              >
                © {form.name}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
