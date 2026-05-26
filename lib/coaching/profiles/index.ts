import { RUNNING_PERFORMANCE } from './running'
import { STRENGTH_HYPERTROPHY } from './strength'
import { HYBRID_CONCURRENT } from './hybrid'
import type { TrainingProfile } from '../types'

export const PROFILES: Record<string, TrainingProfile> = {
  running_performance: RUNNING_PERFORMANCE,
  strength_hypertrophy: STRENGTH_HYPERTROPHY,
  hybrid: HYBRID_CONCURRENT,
}

export function getProfile(id: string): TrainingProfile | null {
  return PROFILES[id] || null
}

export function getProfileList(): { id: string; name: string; description: string }[] {
  return Object.values(PROFILES).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }))
}
