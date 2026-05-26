export type Zone = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'

export type SessionCategory = 'run' | 'bike' | 'swim' | 'strength' | 'rest' | 'cross'

export type PhaseId = 'base' | 'build' | 'peak' | 'taper' | 'recovery_post_race' | 'maintain' | 'deload'
  | 'anatomical_adaptation' | 'hypertrophy' | 'strength_max' | 'concurrent_base'
  | 'endurance_emphasis' | 'strength_emphasis' | 'integration' | 'sharpen'

export interface SessionTemplate {
  id: string
  type: SessionCategory
  subtype: string             // e.g. 'easy_run', 'tempo_run', 'upper_push'
  title: string
  zone: Zone | null           // null for strength
  duration_min: number
  description: string
  is_key_session: boolean
  is_cross_training: boolean
  purpose: string
}

export interface Phase {
  id: PhaseId
  name: string
  duration_weeks: number
  focus: string
  volume_multiplier: number
  intensity_ceiling: Zone
  key_session_types: string[]
  cross_training_allowed: boolean
  strength_focus: string
}

export interface InterferenceRule {
  after: string
  blocked: string[]
  allowed?: string[]
  hours: number
  reason?: string
}

export interface DeloadConfig {
  every_n_weeks: number
  volume_reduction: number
  drop_intervals: boolean
}

export interface TrainingProfile {
  id: string
  name: string
  description: string
  phases: Phase[]
  sessions: SessionTemplate[]
  interference_rules: InterferenceRule[]
  weekly_key_sessions: number
  weekly_easy_sessions: number
  has_long_session: boolean
  deload: DeloadConfig
  strength_sessions_per_week: number
  cross_training_enabled: boolean
  cross_training_max_share: number
  default_nutrition_split: { carbs: number; protein: number; fat: number }
}

export interface PlannedSession {
  day: number                 // 0=MO, 6=SU
  template: SessionTemplate
  adjusted: boolean
  original_title?: string
  note?: string
}

export interface WeekPlan {
  sessions: PlannedSession[]
  phase: PhaseId
  is_deload: boolean
  week_number: number
  total_duration_min: number
}
