export type GoalType =
  | 'endurance_race'
  | 'performance'
  | 'body_composition'
  | 'habit'
  | 'project'
  | 'custom'

export type GoalCategory = 'fitness' | 'nutrition' | 'personal' | 'work'
export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned'

export type TrainingProfileType =
  | 'running_performance'
  | 'strength_hypertrophy'
  | 'hybrid'
  | 'ironman'
  | 'cycling_performance'
  | 'custom'

export interface User {
  id: string
  name: string | null
  email: string
  whatsapp_phone: string | null
  telegram_chat_id: string | null
  rest_hr: number
  max_hr: number
  weight_kg: number | null
  height_cm: number | null
  age: number | null
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  morning_briefing_time: string
  evening_recap_time: string
  timezone: string
  endurance_sessions_week: number
  strength_days: string[]
  strength_splits: Record<string, string>
  available_days: string[]
  double_sessions: boolean
  long_session_day: string
  preferred_rest_day: string
  nutrition_goal: 'maintain' | 'slight_cut' | 'slight_bulk'
  notification_prefs: {
    morning: boolean
    evening: boolean
    weekly: boolean
    alerts: boolean
  }
}

export interface Goal {
  id: string
  user_id: string
  title: string
  type: GoalType
  category: GoalCategory
  target_date: string | null
  target_value: Record<string, unknown> | null
  current_value: Record<string, unknown> | null
  status: GoalStatus
  created_at: string
}

export interface Milestone {
  id: string
  goal_id: string
  title: string
  target_date: string | null
  target_value: Record<string, unknown> | null
  completed: boolean
  order_index: number
}

export interface Activity {
  id: string
  user_id: string
  source: string
  source_id: string | null
  type: string
  name: string | null
  distance_m: number | null
  duration_s: number | null
  avg_hr: number | null
  max_hr: number | null
  avg_pace: string | null
  avg_speed: number | null
  elevation_gain: number | null
  calories: number | null
  trimp: number | null
  started_at: string | null
  created_at: string
}

export interface PlannedWorkout {
  id: string
  plan_id: string | null
  user_id: string
  date: string
  type: string
  title: string | null
  description: string | null
  target_duration_min: number | null
  target_distance_km: number | null
  target_zone: string | null
  completed: boolean
  skipped: boolean
  skip_reason: string | null
  matched_activity_id: string | null
  adjusted_for_recovery: boolean
  original_title: string | null
  is_key_session?: boolean
  is_cross_training?: boolean
}

export interface FitnessMetrics {
  id: string
  user_id: string
  date: string
  ctl: number | null
  atl: number | null
  tsb: number | null
  trimp_today: number | null
}

export interface SleepData {
  id: string
  user_id: string
  date: string
  total_sleep_min: number | null
  deep_sleep_min: number | null
  rem_sleep_min: number | null
  light_sleep_min: number | null
  awake_min: number | null
  time_in_bed_min: number | null
  sleep_efficiency: number | null
  bedtime: string | null
  wake_time: string | null
  hrv_overnight: number | null
  resting_hr: number | null
  sleep_score: number | null
  source: string
}

export interface RecoveryScore {
  id: string
  user_id: string
  date: string
  score: number
  hrv_status: string | null
  rhr_status: string | null
  recommendation: string | null
}

export interface JournalEntry {
  id: string
  user_id: string
  date: string
  factors: string[]
  notes: string | null
  created_at: string
}

export interface NutritionDaily {
  id: string
  user_id: string
  date: string
  target_calories: number
  target_carbs_g: number
  target_protein_g: number
  target_fat_g: number
  logged_calories: number
  logged_carbs_g: number
  logged_protein_g: number
  logged_fat_g: number
  water_liters: number
}

export interface MealLog {
  id: string
  user_id: string
  date: string
  meal_type: string | null
  description: string | null
  calories: number | null
  carbs_g: number | null
  protein_g: number | null
  fat_g: number | null
  created_at: string
}

export interface MealTemplate {
  id: string
  user_id: string
  name: string
  calories: number
  carbs_g: number
  protein_g: number
  fat_g: number
  category: string | null
}

export interface BodyMetric {
  id: string
  user_id: string
  date: string
  weight_kg: number
  source: string
}

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  goal_id: string | null
  title: string
  description: string | null
  priority: 1 | 2 | 3 | 4
  tags: string[]
  due_date: string | null
  due_time: string | null
  recurrence: string | null
  parent_task_id: string | null
  completed: boolean
  completed_at: string | null
  source: 'manual' | 'goal_engine' | 'telegram'
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  color: string | null
  icon: string | null
  order_index: number
}
