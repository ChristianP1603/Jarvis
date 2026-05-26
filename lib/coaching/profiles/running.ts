import type { TrainingProfile } from '../types'

export const RUNNING_PERFORMANCE: TrainingProfile = {
  id: 'running_performance',
  name: 'Lauf-Performance',
  description: '5K–Halbmarathon Verbesserung. 80/20 polarisiert, Kraft für Resilienz.',

  phases: [
    {
      id: 'base', name: 'Aerobe Basis', duration_weeks: 6,
      focus: 'Z2-Volumen aufbauen, Kraft-Fundament',
      volume_multiplier: 0.75, intensity_ceiling: 'Z3',
      key_session_types: ['long_run', 'easy_run_strides'],
      cross_training_allowed: true, strength_focus: 'build',
    },
    {
      id: 'build', name: 'Schwelle entwickeln', duration_weeks: 6,
      focus: 'Tempo + Threshold Arbeit einführen',
      volume_multiplier: 1.0, intensity_ceiling: 'Z4',
      key_session_types: ['tempo_run', 'threshold_intervals', 'long_run'],
      cross_training_allowed: true, strength_focus: 'maintain',
    },
    {
      id: 'sharpen', name: 'Schärfen', duration_weeks: 4,
      focus: 'VO2max + Race Pace, Spezifität hoch',
      volume_multiplier: 0.9, intensity_ceiling: 'Z5',
      key_session_types: ['vo2max_intervals', 'race_pace', 'long_run_efforts'],
      cross_training_allowed: false, strength_focus: 'maintain_reduced',
    },
    {
      id: 'maintain', name: 'Halten', duration_weeks: 0,
      focus: 'Level halten ohne Wettkampf-Ziel',
      volume_multiplier: 0.8, intensity_ceiling: 'Z4',
      key_session_types: ['tempo_run', 'long_run'],
      cross_training_allowed: true, strength_focus: 'maintain',
    },
  ],

  sessions: [
    // Key Sessions
    { id: 'tempo_run', type: 'run', subtype: 'tempo_run', title: 'Tempo-Lauf', zone: 'Z3', duration_min: 40, description: '15min Warm-Up, 20min Z3, 5min Cool-Down', is_key_session: true, is_cross_training: false, purpose: 'Schwelle entwickeln' },
    { id: 'threshold_intervals', type: 'run', subtype: 'threshold_intervals', title: 'Schwellen-Intervalle', zone: 'Z4', duration_min: 45, description: '4-6x 5min Z4, 2min Pause', is_key_session: true, is_cross_training: false, purpose: 'Laktatschwelle anheben' },
    { id: 'vo2max_intervals', type: 'run', subtype: 'vo2max_intervals', title: 'VO2max-Intervalle', zone: 'Z5', duration_min: 35, description: '5-8x 3min Z5, 3min Trabpause', is_key_session: true, is_cross_training: false, purpose: 'Maximale Sauerstoffaufnahme' },
    { id: 'race_pace', type: 'run', subtype: 'race_pace', title: 'Race-Pace Lauf', zone: 'Z4', duration_min: 30, description: '2km Warm-Up, 3-5km Race Pace, Cool-Down', is_key_session: true, is_cross_training: false, purpose: 'Renn-Pace einschleifen' },
    { id: 'long_run', type: 'run', subtype: 'long_run', title: 'Langer Lauf', zone: 'Z2', duration_min: 80, description: 'Gleichmäßig Z2, letztes Drittel leicht schneller', is_key_session: true, is_cross_training: false, purpose: 'Aerobe Ausdauer + Fettstoffwechsel' },
    { id: 'long_run_efforts', type: 'run', subtype: 'long_run_efforts', title: 'Long Run mit Tempo-Blöcken', zone: 'Z2', duration_min: 80, description: '60min Z2, darin 3x 5min Z3', is_key_session: true, is_cross_training: false, purpose: 'Ausdauer + Tempo unter Ermüdung' },

    // Easy Sessions
    { id: 'easy_run', type: 'run', subtype: 'easy_run', title: 'Easy Run', zone: 'Z2', duration_min: 40, description: 'Locker Z2, HR unter Obergrenze', is_key_session: false, is_cross_training: false, purpose: 'Aerobe Basis, Recovery' },
    { id: 'easy_run_strides', type: 'run', subtype: 'easy_run_strides', title: 'Easy Run + Strides', zone: 'Z2', duration_min: 45, description: '35min Z2, dann 6x 20s Strides (Z5 Pace, volle Erholung)', is_key_session: false, is_cross_training: false, purpose: 'Aerob + neuromuskuläre Aktivierung' },
    { id: 'recovery_run', type: 'run', subtype: 'recovery_run', title: 'Recovery Run', zone: 'Z1', duration_min: 25, description: 'Sehr locker Z1, kurz', is_key_session: false, is_cross_training: false, purpose: 'Aktive Erholung' },

    // Cross-Training
    { id: 'easy_bike', type: 'bike', subtype: 'easy_bike', title: 'Easy Bike', zone: 'Z2', duration_min: 50, description: 'Lockes Radfahren Z2', is_key_session: false, is_cross_training: true, purpose: 'Aerobe Ergänzung ohne Impact' },
    { id: 'recovery_spin', type: 'bike', subtype: 'recovery_spin', title: 'Recovery Spin', zone: 'Z1', duration_min: 30, description: 'Ganz leicht Z1 auf Rolle/Rad', is_key_session: false, is_cross_training: true, purpose: 'Aktive Recovery gelenkschonend' },

    // Strength (Resilience-Rolle)
    { id: 'strength_running', type: 'strength', subtype: 'strength_running', title: 'Kraft: Lauf-Stabilität', zone: null, duration_min: 40, description: 'Single-Leg Squats, Hip Thrusts, Calf Raises, Core', is_key_session: false, is_cross_training: false, purpose: 'Verletzungsprävention + Laufökonomie' },

    // Rest
    { id: 'rest', type: 'rest', subtype: 'rest', title: 'Ruhetag', zone: null, duration_min: 0, description: 'Komplett frei oder leichter Spaziergang', is_key_session: false, is_cross_training: false, purpose: 'Regeneration' },
  ],

  interference_rules: [
    { after: 'threshold_intervals', blocked: ['tempo_run', 'vo2max_intervals', 'race_pace', 'strength_lower'], hours: 36, reason: 'Schwelle braucht Erholung' },
    { after: 'vo2max_intervals', blocked: ['threshold_intervals', 'tempo_run', 'race_pace', 'strength_lower'], hours: 48, reason: 'VO2max ist maximal belastend' },
    { after: 'long_run', blocked: ['threshold_intervals', 'vo2max_intervals', 'race_pace'], hours: 36, reason: 'Long Run ermüdet System' },
    { after: 'long_run_efforts', blocked: ['threshold_intervals', 'vo2max_intervals'], hours: 48 },
    { after: 'strength_running', blocked: ['vo2max_intervals', 'threshold_intervals'], hours: 24, allowed: ['easy_run', 'easy_bike', 'recovery_run'] },
    { after: 'race_pace', blocked: ['vo2max_intervals', 'threshold_intervals'], hours: 36 },
  ],

  weekly_key_sessions: 2,
  weekly_easy_sessions: 3,
  has_long_session: true,
  deload: { every_n_weeks: 4, volume_reduction: 0.6, drop_intervals: true },
  strength_sessions_per_week: 2,
  cross_training_enabled: true,
  cross_training_max_share: 0.25,
  default_nutrition_split: { carbs: 0.50, protein: 0.25, fat: 0.25 },
}
