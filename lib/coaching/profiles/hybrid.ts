import type { TrainingProfile } from '../types'

export const HYBRID_CONCURRENT: TrainingProfile = {
  id: 'hybrid',
  name: 'Hybrid (Ausdauer + Kraft)',
  description: 'Beides parallel: Laufen/Radfahren verbessern + Kraft erhalten/aufbauen. Interferenz minimieren.',

  phases: [
    {
      id: 'concurrent_base', name: 'Paralleler Aufbau', duration_weeks: 8,
      focus: 'Beide Qualitäten entwickeln, Interferenz managen',
      volume_multiplier: 0.8, intensity_ceiling: 'Z4',
      key_session_types: ['tempo_run', 'long_session', 'upper_body', 'lower_body'],
      cross_training_allowed: true, strength_focus: 'build',
    },
    {
      id: 'endurance_emphasis', name: 'Ausdauer-Fokus', duration_weeks: 4,
      focus: 'Ausdauer betonen, Kraft auf Erhaltung',
      volume_multiplier: 1.0, intensity_ceiling: 'Z5',
      key_session_types: ['threshold_intervals', 'long_session', 'tempo_run'],
      cross_training_allowed: true, strength_focus: 'maintain',
    },
    {
      id: 'strength_emphasis', name: 'Kraft-Fokus', duration_weeks: 4,
      focus: 'Kraft betonen, Ausdauer auf Erhaltung',
      volume_multiplier: 0.7, intensity_ceiling: 'Z3',
      key_session_types: ['upper_body', 'lower_body', 'easy_run'],
      cross_training_allowed: true, strength_focus: 'progressive_overload',
    },
    {
      id: 'integration', name: 'Integration', duration_weeks: 4,
      focus: 'Beide auf hohem Niveau',
      volume_multiplier: 0.9, intensity_ceiling: 'Z4',
      key_session_types: ['tempo_run', 'long_session', 'upper_body', 'lower_body'],
      cross_training_allowed: true, strength_focus: 'maintain',
    },
    {
      id: 'maintain', name: 'Halten', duration_weeks: 0,
      focus: 'Status quo erhalten',
      volume_multiplier: 0.75, intensity_ceiling: 'Z4',
      key_session_types: ['easy_run', 'full_body'],
      cross_training_allowed: true, strength_focus: 'maintain',
    },
  ],

  sessions: [
    // Ausdauer
    { id: 'easy_run', type: 'run', subtype: 'easy_run', title: 'Easy Run', zone: 'Z2', duration_min: 40, description: 'Locker Z2', is_key_session: false, is_cross_training: false, purpose: 'Aerobe Basis' },
    { id: 'tempo_run', type: 'run', subtype: 'tempo_run', title: 'Tempo-Lauf', zone: 'Z3', duration_min: 40, description: '15min WU, 20min Z3, Cool-Down', is_key_session: true, is_cross_training: false, purpose: 'Schwelle entwickeln' },
    { id: 'threshold_intervals', type: 'run', subtype: 'threshold_intervals', title: 'Schwellen-Intervalle', zone: 'Z4', duration_min: 45, description: '4x 5min Z4, 2min Pause', is_key_session: true, is_cross_training: false, purpose: 'Laktatschwelle' },
    { id: 'long_session', type: 'run', subtype: 'long_session', title: 'Langer Lauf/Rad', zone: 'Z2', duration_min: 75, description: 'Z2 gleichmäßig — Laufen oder Radfahren', is_key_session: true, is_cross_training: false, purpose: 'Aerobe Ausdauer' },

    // Cross-Training
    { id: 'easy_bike', type: 'bike', subtype: 'easy_bike', title: 'Easy Bike', zone: 'Z2', duration_min: 50, description: 'Lockeres Radfahren', is_key_session: false, is_cross_training: true, purpose: 'Aerob + Bein-Recovery' },
    { id: 'recovery_spin', type: 'bike', subtype: 'recovery_spin', title: 'Recovery Spin', zone: 'Z1', duration_min: 25, description: 'Ganz leicht Z1', is_key_session: false, is_cross_training: true, purpose: 'Aktive Recovery' },

    // Kraft
    { id: 'upper_body', type: 'strength', subtype: 'upper_body', title: 'Kraft: Oberkörper', zone: null, duration_min: 50, description: 'Bench/OHP + Rows/Pull-Ups + Accessory', is_key_session: true, is_cross_training: false, purpose: 'Oberkörper Kraft + Masse' },
    { id: 'lower_body', type: 'strength', subtype: 'lower_body', title: 'Kraft: Unterkörper', zone: null, duration_min: 50, description: 'Squats + RDL + Lunges + Calves', is_key_session: true, is_cross_training: false, purpose: 'Unterkörper Kraft' },
    { id: 'full_body', type: 'strength', subtype: 'full_body', title: 'Kraft: Ganzkörper', zone: null, duration_min: 45, description: 'Squat, Bench, Row — moderate', is_key_session: false, is_cross_training: false, purpose: 'Erhaltung / leichterer Tag' },

    // Rest
    { id: 'rest', type: 'rest', subtype: 'rest', title: 'Ruhetag', zone: null, duration_min: 0, description: 'Komplett frei', is_key_session: false, is_cross_training: false, purpose: 'Regeneration' },
  ],

  interference_rules: [
    // Die wichtigste Regel: Beine nie 2x hintereinander hart
    { after: 'lower_body', blocked: ['threshold_intervals', 'tempo_run', 'long_session'], hours: 24, allowed: ['easy_bike', 'recovery_spin', 'upper_body'], reason: 'Bein-Recovery nach Kraft' },
    { after: 'threshold_intervals', blocked: ['lower_body'], hours: 24, reason: 'Bein-Recovery nach hartem Lauf' },
    { after: 'long_session', blocked: ['lower_body', 'threshold_intervals'], hours: 36, reason: 'Long Session ermüdet System' },
    { after: 'tempo_run', blocked: ['lower_body'], hours: 24, allowed: ['easy_bike', 'upper_body'] },
    // Oberkörper blockt Ausdauer kaum
    { after: 'upper_body', blocked: [], hours: 0, reason: 'Oberkörper beeinflusst Laufen/Rad kaum' },
  ],

  weekly_key_sessions: 2,       // 1 harte Ausdauer + 1 Long
  weekly_easy_sessions: 2,
  has_long_session: true,
  deload: { every_n_weeks: 4, volume_reduction: 0.6, drop_intervals: true },
  strength_sessions_per_week: 3,
  cross_training_enabled: true,
  cross_training_max_share: 0.30,
  default_nutrition_split: { carbs: 0.45, protein: 0.28, fat: 0.27 },
}
