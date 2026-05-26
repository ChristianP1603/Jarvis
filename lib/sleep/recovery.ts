import type { SleepData, JournalEntry } from '@/lib/utils/types'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

const JOURNAL_IMPACT: Record<string, number> = {
  // Negative
  alcohol: -12,
  caffeine_late: -5,
  screen_late: -3,
  late_meal: -4,
  stress: -8,
  travel: -6,
  underfueled: -5,
  // Positive
  meditation: +6,
  stretching: +4,
  sauna: +5,
  cold_exposure: +4,
  massage: +5,
  hydrated_well: +3,
  high_protein: +2,
  supplements: +1,
  creatine: 0,
  high_carb: 0,
}

export function calculateRecoveryScore(
  sleep: SleepData,
  sleepScore: number,
  hrvBaseline: number | null,
  rhrBaseline: number | null,
  journal: JournalEntry | null,
): { score: number; hrv_status: string; rhr_status: string } {
  let score = 0

  // HRV vs Baseline (0-35 points) — most important factor
  let hrv_status = 'no_data'
  if (sleep.hrv_overnight && hrvBaseline && hrvBaseline > 0) {
    const hrvDeviation = sleep.hrv_overnight / hrvBaseline
    const hrvScore = clamp(((hrvDeviation - 0.7) / 0.5) * 35, 0, 35)
    score += hrvScore

    if (hrvDeviation >= 1.1) hrv_status = 'above'
    else if (hrvDeviation >= 0.9) hrv_status = 'normal'
    else if (hrvDeviation >= 0.75) hrv_status = 'below'
    else hrv_status = 'low'
  } else {
    // No HRV data — give moderate default
    score += 18
  }

  // Resting HR vs Baseline (0-20 points)
  let rhr_status = 'no_data'
  if (sleep.resting_hr && rhrBaseline && rhrBaseline > 0) {
    // Lower than baseline = recovered, higher = stressed
    const rhrDeviation = rhrBaseline / sleep.resting_hr  // inverted
    const rhrScore = clamp(((rhrDeviation - 0.9) / 0.2) * 20, 0, 20)
    score += rhrScore

    const diff = sleep.resting_hr - rhrBaseline
    if (diff <= -3) rhr_status = 'low'  // Good
    else if (diff <= 2) rhr_status = 'normal'
    else if (diff <= 5) rhr_status = 'elevated'
    else rhr_status = 'high'  // Bad
  } else {
    score += 10
  }

  // Sleep Score component (0-25 points)
  score += sleepScore * 0.25

  // Journal impact (0-20 points, base 10)
  let journalScore = 10
  if (journal) {
    const impact = journal.factors.reduce((sum, f) => sum + (JOURNAL_IMPACT[f] || 0), 0)
    journalScore = clamp(10 + impact, 0, 20)
  }
  score += journalScore

  return {
    score: Math.round(clamp(score, 0, 100)),
    hrv_status,
    rhr_status,
  }
}

export function getRecoveryRecommendation(score: number, tsbCurrent: number | null): string {
  if (score >= 80) {
    if (tsbCurrent !== null && tsbCurrent > 15) {
      return 'Recovery exzellent und du bist frisch. Heute ist alles drin.'
    }
    return 'Recovery gut. Plan wie geplant.'
  }
  if (score >= 60) {
    return 'Recovery moderat. Easy Sessions ok, harte Sessions evtl. kürzer.'
  }
  if (score >= 40) {
    return 'Recovery niedrig. Harte Sessions auf Easy downgraden. Mehr Schlaf priorisieren.'
  }
  return 'Recovery kritisch. Heute Ruhetag oder max 30min Z1. Schlaf und Erholung first.'
}

export function getRecoveryColor(score: number): string {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 50) return 'text-yellow-400'
  if (score >= 30) return 'text-orange-400'
  return 'text-red-400'
}

export function getRecoveryBgColor(score: number): string {
  if (score >= 70) return 'bg-emerald-400'
  if (score >= 50) return 'bg-yellow-400'
  if (score >= 30) return 'bg-orange-400'
  return 'bg-red-400'
}
