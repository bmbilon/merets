import { createClient } from '@supabase/supabase-js'

// Ments (Commitments) Supabase project credentials
const supabaseUrl = 'https://bzogqqkptnbtnmpzvdca.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Database types for TypeScript
export interface TaskTemplate {
  id: string
  title: string
  description: string
  skill_category: string
  effort_minutes: number
  base_pay_cents: number
  difficulty_level: number
  is_micro_task: boolean
  next_available_at?: string // When this task becomes available again after completion
  created_at: string
}

export interface PayRate {
  id: string
  skill_category: string
  difficulty_level: number
  base_rate_per_minute_cents: number
  micro_task_flat_rate_cents: number
  created_at: string
}

export interface UserProfile {
  id: string
  name: string
  role: 'kid' | 'parent'
  age?: number
  level: number
  total_xp: number
  total_earnings_cents: number
  created_at: string
}

export interface Commitment {
  id: string
  user_id: string
  task_template_id?: string
  custom_title?: string
  custom_description?: string
  skill_category: string
  effort_minutes: number
  pay_cents: number
  status: 'pending' | 'approved' | 'completed' | 'rejected'
  quality_rating?: 'miss' | 'pass' | 'perfect'
  completed_at?: string
  created_at: string
}

export interface ChatMessage {
  id: string
  sender_id: string
  message_type: 'text' | 'commitment_request' | 'commitment_approved' | 'commitment_rejected'
  content: string
  commitment_id?: string
  created_at: string
}