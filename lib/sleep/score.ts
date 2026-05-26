import type { SleepData } from '@/lib/utils/types'

interface SleepTargets {
  duration_min: number        // z.B. 480 (8h)
  bedtime_hour: number        // z.B. 22.5 (22:30)
  bedtime_tolerance_min: number  // z.B. 30
}

const DEFAULT_TARGETS: SleepTargets = {
  duration_min: 480,
  bedtime_hour: 22.5,
  bedtime_tolerance_min: 30,
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function calculateSleepScore(
  sleep: SleepData,
  targets: SleepTargets = DEFAULT_TARGETS
): number {
  if (!sleep.total_sleep_min) return 0

  // Duration (0-30 points)
  // Optimal: 100% of target, cap at 110%
  const durationRatio = sleep.total_sleep_min / targets.duration_min
  const durationScore = clamp(durationRatio * 30, 0, 30)

  // Efficiency (0-20 points)
  // >95% = perfect, <80% = bad
  const efficiency = sleep.sleep_efficiency ?? (
    sleep.time_in_bed_min ? sleep.total_sleep_min / sleep.time_in_bed_min : 0.85
  )
  const efficiencyScore = clamp(((efficiency - 0.75) / 0.20) * 20, 0, 20)

  // Deep Sleep (0-20 points)
  // Target: 15-20% of total sleep
  const deepRatio = (sleep.deep_sleep_min ?? 0) / sleep.total_sleep_min
  const deepScore = sleep.deep_sleep_min ? clamp((deepRatio / 0.20) * 20, 0, 20) : 10 // Default 10 if no data

  // REM (0-15 points)
  // Target: 20-25% of total sleep
  const remRatio = (sleep.rem_sleep_min ?? 0) / sleep.total_sleep_min
  const remScore = sleep.rem_sleep_min ? clamp((remRatio / 0.25) * 15, 0, 15) : 7 // Default 7 if no data

  // Consistency (0-15 points)
  // How close to target bedtime?
  let consistencyScore = 15
  if (sleep.bedtime) {
    const bedtime = new Date(sleep.bedtime)
    const bedHour = bedtime.getHours() + bedtime.getMinutes() / 60
    const diffMin = Math.abs(bedHour - targets.bedtime_hour) * 60
    consistencyScore = clamp(((targets.bedtime_tolerance_min * 2 - diffMin) / (targets.bedtime_tolerance_min * 2)) * 15, 0, 15)
  }

  return Math.round(durationScore + efficiencyScore + deepScore + remScore + consistencyScore)
}

export function calculateSleepDebt(
  recentSleep: SleepData[],
  targetMin: number = 480,
  days: number = 7
): number {
  const recent = recentSleep.slice(0, days)
  if (recent.length === 0) return 0

  const totalDebt = recent.reduce((debt, s) => {
    const actual = s.total_sleep_min ?? 0
    return debt + Math.max(0, targetMin - actual)
  }, 0)

  return totalDebt // in minutes
}
