export interface JournalFactor {
  id: string
  label: string
  icon: string
  category: 'substances' | 'behavior' | 'recovery' | 'nutrition'
}

export const JOURNAL_FACTORS: JournalFactor[] = [
  // Substances
  { id: 'alcohol', label: 'Alkohol', icon: '🍷', category: 'substances' },
  { id: 'caffeine_late', label: 'Koffein nach 14h', icon: '☕', category: 'substances' },
  { id: 'supplements', label: 'Supplements', icon: '💊', category: 'substances' },
  { id: 'creatine', label: 'Kreatin', icon: '🧪', category: 'substances' },
  // Behavior
  { id: 'screen_late', label: 'Screen nach 21h', icon: '📱', category: 'behavior' },
  { id: 'late_meal', label: 'Spät gegessen', icon: '🍽️', category: 'behavior' },
  { id: 'stress', label: 'Stress', icon: '😤', category: 'behavior' },
  { id: 'travel', label: 'Reise', icon: '✈️', category: 'behavior' },
  // Recovery
  { id: 'meditation', label: 'Meditation', icon: '🧘', category: 'recovery' },
  { id: 'stretching', label: 'Stretching', icon: '🤸', category: 'recovery' },
  { id: 'sauna', label: 'Sauna', icon: '🧖', category: 'recovery' },
  { id: 'cold_exposure', label: 'Eisbad/Kalt', icon: '🧊', category: 'recovery' },
  { id: 'massage', label: 'Massage/Foam Roll', icon: '💆', category: 'recovery' },
  // Nutrition
  { id: 'high_carb', label: 'High Carb', icon: '🍝', category: 'nutrition' },
  { id: 'high_protein', label: 'High Protein', icon: '🥩', category: 'nutrition' },
  { id: 'hydrated_well', label: 'Gut hydriert', icon: '💧', category: 'nutrition' },
  { id: 'underfueled', label: 'Zu wenig gegessen', icon: '⚠️', category: 'nutrition' },
]

export const FACTOR_MAP = Object.fromEntries(JOURNAL_FACTORS.map(f => [f.id, f]))
