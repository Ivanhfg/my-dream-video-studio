export type MediaType = 'image' | 'video' | 'audio' | 'logo'
export type ProjectStatus = 'draft' | 'in_progress' | 'completed'
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type GenerationProvider = 'google_veo' | 'kling' | 'higgsfield' | 'runway' | 'pika'
export type ExportFormat = 'mp4' | 'mov' | 'webm'
export type ExportResolution = '720p' | '1080p' | '4k'
export type OverlayPosition = 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right'
export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom'
export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  status: ProjectStatus
  created_at: string
  updated_at: string
}

export interface MediaFile {
  id: string
  user_id: string
  project_id: string | null
  name: string
  type: MediaType
  url: string
  storage_path: string
  size: number
  mime_type: string
  duration: number | null
  width: number | null
  height: number | null
  created_at: string
}

export interface StoryboardScene {
  id: string
  project_id: string
  user_id: string
  title: string
  description: string | null
  media_id: string | null
  overlay_text: string | null
  overlay_position: OverlayPosition
  duration: number
  order_index: number
  transition: TransitionType
  created_at: string
  updated_at: string
}

export interface Generation {
  id: string
  project_id: string
  user_id: string
  provider: GenerationProvider
  prompt: string
  status: GenerationStatus
  progress: number
  video_url: string | null
  thumbnail_url: string | null
  error_message: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Export {
  id: string
  project_id: string
  user_id: string
  generation_id: string | null
  format: ExportFormat
  resolution: ExportResolution
  status: 'pending' | 'processing' | 'completed' | 'failed'
  download_url: string | null
  file_size: number | null
  created_at: string
}

export interface BrandKit {
  id: string
  user_id: string
  name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  font_primary: string
  font_secondary: string
  watermark_url: string | null
  watermark_position: WatermarkPosition
  watermark_opacity: number
  created_at: string
  updated_at: string
}

export interface ProjectMedia {
  id: string
  project_id: string
  media_id: string
  created_at: string
}
