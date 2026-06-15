export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          thumbnail_url: string | null
          status: 'draft' | 'in_progress' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      media_files: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          name: string
          type: 'image' | 'video' | 'audio' | 'logo'
          url: string
          storage_path: string
          size: number
          mime_type: string
          duration: number | null
          width: number | null
          height: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['media_files']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['media_files']['Insert']>
      }
      project_media: {
        Row: {
          id: string
          project_id: string
          media_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['project_media']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['project_media']['Insert']>
      }
      storyboard_scenes: {
        Row: {
          id: string
          project_id: string
          user_id: string
          title: string
          description: string | null
          media_id: string | null
          overlay_text: string | null
          overlay_position: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right'
          duration: number
          order_index: number
          transition: 'none' | 'fade' | 'slide' | 'zoom'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['storyboard_scenes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['storyboard_scenes']['Insert']>
      }
      generations: {
        Row: {
          id: string
          project_id: string
          user_id: string
          provider: 'google_veo' | 'kling' | 'higgsfield' | 'runway' | 'pika'
          prompt: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          progress: number
          video_url: string | null
          thumbnail_url: string | null
          error_message: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['generations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['generations']['Insert']>
      }
      exports: {
        Row: {
          id: string
          project_id: string
          user_id: string
          generation_id: string | null
          format: 'mp4' | 'mov' | 'webm'
          resolution: '720p' | '1080p' | '4k'
          status: 'pending' | 'processing' | 'completed' | 'failed'
          download_url: string | null
          file_size: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['exports']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['exports']['Insert']>
      }
      brand_kits: {
        Row: {
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
          watermark_position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
          watermark_opacity: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['brand_kits']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['brand_kits']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
