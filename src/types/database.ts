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
      moodboards: {
        Row: {
          id: number
          user_id: string
          title: string
          description?: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          description?: string | null
          created_at?: string
        }
      }
      moodboard_items: {
        Row: {
          id: number
          moodboard_id: number
          item_type: 'image' | 'text' | 'link'
          content: string
          url?: string | null
          created_at: string
        }
        Insert: {
          id?: number
          moodboard_id: number
          item_type: 'image' | 'text' | 'link'
          content: string
          url?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          moodboard_id?: number
          item_type?: 'image' | 'text' | 'link'
          content?: string
          url?: string | null
          created_at?: string
        }
      }
      challenges: {
        Row: {
          id: number
          title: string
          description?: string | null
          created_by: string
          start_date: string
          end_date?: string | null
          is_active?: boolean | null
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          created_by: string
          start_date?: string
          end_date?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          created_by?: string
          start_date?: string
          end_date?: string | null
          is_active?: boolean | null
        }
      }
      challenge_participants: {
        Row: {
          id: number
          challenge_id: number
          user_id: string
          joined_at: string
          progress?: number | null
        }
        Insert: {
          id?: number
          challenge_id: number
          user_id: string
          joined_at?: string
          progress?: number | null
        }
        Update: {
          id?: number
          challenge_id?: number
          user_id?: string
          joined_at?: string
          progress?: number | null
        }
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
  }
}
