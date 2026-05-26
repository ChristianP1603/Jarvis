import type { TrainingProfile } from '../types'

export const STRENGTH_HYPERTROPHY: TrainingProfile = {
  id: 'strength_hypertrophy',
  name: 'Kraftaufbau',
  description: 'Muskelaufbau / Hypertrophie. 4x Kraft, minimales Cardio für Gesundheit.',

  phases: [
    {
      id: 'anatomical_adaptation', name: 'Anpassung', duration_weeks: 3,
      focus: 'Technik, Volumen langsam aufbauen, Sehnen-Adaptation',
      volume_multiplier: 0.7, intensity_ceiling: 'Z2',
      key_session_types: ['full_body'],
      cross_training_allowed: true, strength_focus: 'moderate_reps',
    },
    {
      id: 'hypertrophy', name: 'Hypertrophie', duration_weeks: 6,
      focus: 'Muskelwachstum: 8-12 Reps, progressive Overload',
      volume_multiplier: 1.0, intensity_ceiling: 'Z2',
      key_session_types: ['upper_push', 'upper_pull', 'lower_quad', 'lower_hinge'],
      cross_training_allowed: true, strength_focus: 'hypertrophy',
    },
    {
      id: 'strength_max', name: 'Maximalkraft', duration_weeks: 4,
      focus: 'Kraft: 3-6 Reps, schwere Gewichte',
      volume_multiplier: 0.85, intensity_ceiling: 'Z2',
      key_session_types: ['upper_push', 'upper_pull', 'lower_quad', 'lower_hinge'],
      cross_training_allowed: true, strength_focus: 'max_strength',
    },
    {
      id: 'maintain', name: 'Halten', duration_weeks: 0,
      focus: 'Kraft und Masse erhalten',
      volume_multiplier: 0.7, intensity_ceiling: 'Z2',
      key_session_types: ['upper_push', 'lower_quad', 'full_body'],
      cross_training_allowed: true, strength_focus: 'maintenance',
    },
  ],

  sessions: [
    // Kraft-Sessions
    { id: 'upper_push', type: 'strength', subtype: 'upper_push', title: 'Oberkörper Push', zone: null, duration_min: 55, description: 'Bench Press, OHP, Dips, Lateral Raises, Trizeps', is_key_session: true, is_cross_training: false, purpose: 'Brust, Schultern, Trizeps' },
    { id: 'upper_pull', type: 'strength', subtype: 'upper_pull', title: 'Oberkörper Pull', zone: null, duration_min: 55, description: 'Rows, Pull-Ups, Face Pulls, Biceps Curls', is_key_session: true, is_cross_training: false, purpose: 'Rücken, Bizeps' },
    { id: 'lower_quad', type: 'strength', subtype: 'lower_quad', title: 'Unterkörper Quad', zone: null, duration_min: 55, description: 'Squats, Leg Press, Lunges, Leg Extension, Calves', is_key_session: true, is_cross_training: false, purpose: 'Quads, Glutes' },
    { id: 'lower_hinge', type: 'strength', subtype: 'lower_hinge', title: 'Unterkörper Hinge', zone: null, duration_min: 55, description: 'Deadlifts, RDL, Hip Thrust, Hamstring Curls', is_key_session: true, is_cross_training: false, purpose: 'Hamstrings, Glutes, unterer Rücken' },
    { id: 'full_body', type: 'strength', subtype: 'full_body', title: 'Ganzkörper', zone: null, duration_min: 50, description: 'Squat, Bench, Row, OHP — moderate Gewichte', is_key_session: false, is_cross_training: false, purpose: 'Ganzkörper-Stimulus, Deload/Anpassung' },

    // Minimales Cardio
    { id: 'easy_cardio', type: 'bike', subtype: 'easy_cardio', title: 'Leichtes Cardio', zone: 'Z1', duration_min: 30, description: 'Rad, Gehen, Rudern — locker Z1-Z2', is_key_session: false, is_cross_training: true, purpose: 'Herz-Kreislauf Gesundheit, nicht Performance' },
    { id: 'walking', type: 'cross', subtype: 'walking', title: 'Spaziergang', zone: 'Z1', duration_min: 40, description: 'Zügiges Gehen für NEAT', is_key_session: false, is_cross_training: true, purpose: 'NEAT erhöhen, aktive Recovery' },

    // Rest
    { id: 'rest', type: 'rest', subtype: 'rest', title: 'Ruhetag', zone: null, duration_min: 0, description: 'Komplett frei', is_key_session: false, is_cross_training: false, purpose: 'Muskelregeneration' },
  ],

  interference_rules: [
    { after: 'lower_quad', blocked: ['lower_hinge', 'lower_quad'], hours: 48, reason: 'Bein-Recovery schützen' },
    { after: 'lower_hinge', blocked: ['lower_quad', 'lower_hinge'], hours: 48, reason: 'Bein-Recovery schützen' },
    { after: 'upper_push', blocked: ['upper_push'], hours: 48, allowed: ['lower_quad', 'lower_hinge', 'easy_cardio'] },
    { after: 'upper_pull', blocked: ['upper_pull'], hours: 48, allowed: ['lower_quad', 'lower_hinge', 'easy_cardio'] },
  ],

  weekly_key_sessions: 4,
  weekly_easy_sessions: 2,
  has_long_session: false,
  deload: { every_n_weeks: 4, volume_reduction: 0.5, drop_intervals: false },
  strength_sessions_per_week: 4,
  cross_training_enabled: true,
  cross_training_max_share: 0.15,
  default_nutrition_split: { carbs: 0.40, protein: 0.30, fat: 0.30 },
}
