import type { TrainingProfile, SessionTemplate, PlannedSession, WeekPlan, PhaseId } from './types'

const DAY_MAP: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 }

interface PlanContext {
  profile: TrainingProfile
  phase: PhaseId
  weekNumber: number
  strengthDays: string[]          // ['MO', 'WE', 'FR']
  strengthSplits: Record<string, string>  // { MO: 'Upper Body', ... }
  availableDays: string[]
  longSessionDay: string
  restDay: string
  doubleSessions: boolean
  recoveryScore: number | null
  shouldDeload: boolean
}

export function generateWeeklyPlan(ctx: PlanContext): WeekPlan {
  const { profile, phase, strengthDays, longSessionDay, restDay } = ctx

  const currentPhase = profile.phases.find(p => p.id === phase) || profile.phases[0]
  if (!currentPhase) throw new Error(`Phase ${phase} not found in profile ${profile.id}`)

  // Deload check
  if (ctx.shouldDeload) {
    return generateDeloadWeek(ctx, currentPhase)
  }

  const plan: (PlannedSession | null)[] = Array(7).fill(null)

  // ====== STEP 1: Rest Day ======
  const restIdx = DAY_MAP[restDay] ?? 6
  plan[restIdx] = { day: restIdx, template: findSession(profile, 'rest'), adjusted: false }

  // ====== STEP 2: Strength Days (user-defined, fixed) ======
  for (const dayCode of strengthDays) {
    const dayIdx = DAY_MAP[dayCode]
    if (dayIdx === undefined || plan[dayIdx]) continue

    const split = ctx.strengthSplits[dayCode]?.toLowerCase() || ''
    const strengthSession = matchStrengthSession(profile, split)
    if (strengthSession) {
      plan[dayIdx] = { day: dayIdx, template: strengthSession, adjusted: false }
    }
  }

  // ====== STEP 3: Long Session ======
  if (profile.has_long_session) {
    const longIdx = DAY_MAP[longSessionDay] ?? 5
    if (!plan[longIdx]) {
      const longSession = findLongSession(profile, currentPhase)
      if (longSession) {
        plan[longIdx] = { day: longIdx, template: longSession, adjusted: false }
      }
    }
  }

  // ====== STEP 4: Key Sessions ======
  const keySlots = findOpenSlots(plan, ctx.availableDays)
    .filter(idx => !isAdjacentToKeySession(plan, idx))

  let keysPlaced = countKeySessions(plan)
  const keySessionTypes = currentPhase.key_session_types.filter(
    t => !plan.some(p => p?.template.subtype === t)
  )

  for (const sessionType of keySessionTypes) {
    if (keysPlaced >= profile.weekly_key_sessions) break
    const session = profile.sessions.find(s => s.subtype === sessionType && s.is_key_session)
    if (!session) continue

    const slot = keySlots.find(idx => !plan[idx] && !hasInterference(plan, idx, session, profile))
    if (slot !== undefined) {
      plan[slot] = { day: slot, template: session, adjusted: false }
      keysPlaced++
    }
  }

  // ====== STEP 5: Fill Easy Sessions ======
  const openSlots = findOpenSlots(plan, ctx.availableDays)
  for (const idx of openSlots) {
    if (plan[idx]) continue

    const session = selectEasySession(plan, idx, profile, currentPhase)
    plan[idx] = { day: idx, template: session, adjusted: false }
  }

  // ====== STEP 6: Apply Recovery Overlay ======
  const finalPlan = applyRecoveryOverlay(plan.filter(Boolean) as PlannedSession[], ctx.recoveryScore)

  return {
    sessions: finalPlan,
    phase: currentPhase.id,
    is_deload: false,
    week_number: ctx.weekNumber,
    total_duration_min: finalPlan.reduce((s, p) => s + p.template.duration_min, 0),
  }
}

function generateDeloadWeek(ctx: PlanContext, currentPhase: typeof ctx.profile.phases[0]): WeekPlan {
  const { profile, strengthDays, restDay } = ctx
  const plan: PlannedSession[] = []

  // Rest day
  plan.push({ day: DAY_MAP[restDay] ?? 6, template: findSession(profile, 'rest'), adjusted: false })

  // Strength days stay but lighter (user manages weights)
  for (const dayCode of strengthDays) {
    const dayIdx = DAY_MAP[dayCode]
    if (dayIdx === undefined) continue
    const split = ctx.strengthSplits[dayCode]?.toLowerCase() || ''
    const session = matchStrengthSession(profile, split)
    if (session) {
      plan.push({
        day: dayIdx, template: { ...session, duration_min: Math.round(session.duration_min * 0.7) },
        adjusted: true, original_title: session.title,
        note: 'Deload: Gewicht -30%, gleiches Schema',
      })
    }
  }

  // Only easy sessions, no intervals
  const easySessions = profile.sessions.filter(s =>
    !s.is_key_session && s.type !== 'rest' && s.type !== 'strength'
  )

  const openDays = ctx.availableDays
    .map(d => DAY_MAP[d])
    .filter(d => d !== undefined && !plan.some(p => p.day === d))
    .slice(0, 3)

  for (const dayIdx of openDays) {
    const easy = easySessions[0] || findSession(profile, 'rest')
    plan.push({
      day: dayIdx,
      template: { ...easy, duration_min: Math.round(easy.duration_min * profile.deload.volume_reduction) },
      adjusted: true,
      note: `Deload: ${Math.round(profile.deload.volume_reduction * 100)}% Volumen`,
    })
  }

  return {
    sessions: plan.sort((a, b) => a.day - b.day),
    phase: currentPhase.id,
    is_deload: true,
    week_number: ctx.weekNumber,
    total_duration_min: plan.reduce((s, p) => s + p.template.duration_min, 0),
  }
}

function selectEasySession(
  plan: (PlannedSession | null)[],
  dayIdx: number,
  profile: TrainingProfile,
  currentPhase: typeof profile.phases[0]
): SessionTemplate {
  const prevDay = plan[dayIdx - 1]
  const prevWasHardRun = prevDay?.template.type === 'run' && prevDay.template.is_key_session
  const prevWasLegStrength = prevDay?.template.subtype?.includes('lower') || prevDay?.template.subtype?.includes('hinge') || prevDay?.template.subtype?.includes('quad')

  // After hard run or leg day → cross-training (bike) if allowed
  if ((prevWasHardRun || prevWasLegStrength) && profile.cross_training_enabled && currentPhase.cross_training_allowed) {
    const crossSession = profile.sessions.find(s => s.is_cross_training && s.subtype.includes('bike'))
    if (crossSession) return crossSession
  }

  // Count how many runs this week already
  const runCount = plan.filter(p => p?.template.type === 'run').length
  if (runCount >= 4 && profile.cross_training_enabled && currentPhase.cross_training_allowed) {
    const crossSession = profile.sessions.find(s => s.is_cross_training)
    if (crossSession) return crossSession
  }

  // Default: easy session in primary sport
  const easySession = profile.sessions.find(s => !s.is_key_session && !s.is_cross_training && s.type !== 'rest' && s.type !== 'strength')
  return easySession || findSession(profile, 'rest')
}

function applyRecoveryOverlay(sessions: PlannedSession[], recoveryScore: number | null): PlannedSession[] {
  if (recoveryScore === null || recoveryScore >= 70) return sessions

  return sessions.map(s => {
    if (s.template.type === 'rest' || s.template.type === 'strength') return s

    if (recoveryScore < 30) {
      // Red: replace everything with rest or Z1
      if (s.template.is_key_session) {
        return {
          ...s,
          template: { ...s.template, title: 'Recovery: Pause oder Z1', zone: 'Z1' as const, duration_min: 20, is_key_session: false },
          adjusted: true, original_title: s.template.title,
          note: `Recovery bei ${recoveryScore}%. Heute kein hartes Training.`,
        }
      }
      return {
        ...s,
        template: { ...s.template, duration_min: Math.round(s.template.duration_min * 0.5) },
        adjusted: true, note: `Recovery niedrig — Dauer halbiert.`,
      }
    }

    if (recoveryScore < 50 && s.template.is_key_session) {
      // Yellow + key session: downgrade intensity
      const zoneDown: Record<string, string> = { Z5: 'Z4', Z4: 'Z3', Z3: 'Z2' }
      const newZone = s.template.zone ? (zoneDown[s.template.zone] || s.template.zone) : s.template.zone
      return {
        ...s,
        template: { ...s.template, zone: newZone as typeof s.template.zone, duration_min: Math.round(s.template.duration_min * 0.85) },
        adjusted: true, original_title: s.template.title,
        note: `Recovery ${recoveryScore}% — Intensität reduziert.`,
      }
    }

    return s
  })
}

// ====== Helpers ======

function findSession(profile: TrainingProfile, subtype: string): SessionTemplate {
  return profile.sessions.find(s => s.subtype === subtype) || profile.sessions[profile.sessions.length - 1]
}

function findLongSession(profile: TrainingProfile, phase: typeof profile.phases[0]): SessionTemplate | null {
  const longTypes = ['long_run', 'long_session', 'long_run_efforts', 'long_ride']
  const allowed = phase.key_session_types.filter(t => longTypes.includes(t))
  if (allowed.length > 0) {
    return profile.sessions.find(s => allowed.includes(s.subtype)) || null
  }
  return profile.sessions.find(s => longTypes.includes(s.subtype)) || null
}

function matchStrengthSession(profile: TrainingProfile, split: string): SessionTemplate | null {
  const strengthSessions = profile.sessions.filter(s => s.type === 'strength')
  if (strengthSessions.length === 0) return null

  if (split.includes('upper') && split.includes('push')) return strengthSessions.find(s => s.subtype.includes('upper_push')) || strengthSessions[0]
  if (split.includes('upper') && split.includes('pull')) return strengthSessions.find(s => s.subtype.includes('upper_pull')) || strengthSessions[0]
  if (split.includes('upper')) return strengthSessions.find(s => s.subtype.includes('upper')) || strengthSessions[0]
  if (split.includes('lower') && split.includes('quad')) return strengthSessions.find(s => s.subtype.includes('lower_quad')) || strengthSessions.find(s => s.subtype.includes('lower')) || strengthSessions[0]
  if (split.includes('lower') && split.includes('hinge')) return strengthSessions.find(s => s.subtype.includes('lower_hinge')) || strengthSessions.find(s => s.subtype.includes('lower')) || strengthSessions[0]
  if (split.includes('lower')) return strengthSessions.find(s => s.subtype.includes('lower')) || strengthSessions[0]
  if (split.includes('full') || split.includes('ganzkörper') || split.includes('core')) return strengthSessions.find(s => s.subtype.includes('full')) || strengthSessions[0]
  if (split.includes('bein') || split.includes('leg')) return strengthSessions.find(s => s.subtype.includes('lower')) || strengthSessions[0]

  return strengthSessions[0]
}

function findOpenSlots(plan: (PlannedSession | null)[], availableDays: string[]): number[] {
  const available = new Set(availableDays.map(d => DAY_MAP[d]).filter(d => d !== undefined))
  return Array.from({ length: 7 }, (_, i) => i).filter(i => !plan[i] && available.has(i))
}

function countKeySessions(plan: (PlannedSession | null)[]): number {
  return plan.filter(p => p?.template.is_key_session).length
}

function isAdjacentToKeySession(plan: (PlannedSession | null)[], idx: number): boolean {
  const prev = idx > 0 ? plan[idx - 1] : null
  const next = idx < 6 ? plan[idx + 1] : null
  return Boolean(
    (prev?.template.is_key_session && prev.template.type !== 'strength') ||
    (next?.template.is_key_session && next.template.type !== 'strength')
  )
}

function hasInterference(
  plan: (PlannedSession | null)[],
  dayIdx: number,
  session: SessionTemplate,
  profile: TrainingProfile
): boolean {
  // Check previous day
  const prevSession = dayIdx > 0 ? plan[dayIdx - 1] : null
  if (prevSession) {
    for (const rule of profile.interference_rules) {
      if (prevSession.template.subtype === rule.after || prevSession.template.subtype.includes(rule.after)) {
        if (rule.blocked.some(b => session.subtype === b || session.subtype.includes(b))) {
          return true
        }
      }
    }
  }

  // Check next day
  const nextSession = dayIdx < 6 ? plan[dayIdx + 1] : null
  if (nextSession) {
    for (const rule of profile.interference_rules) {
      if (session.subtype === rule.after || session.subtype.includes(rule.after)) {
        if (rule.blocked.some(b => nextSession.template.subtype === b || nextSession.template.subtype.includes(b))) {
          return true
        }
      }
    }
  }

  return false
}

export function shouldDeload(weeksSinceDeload: number, deloadEvery: number, tsb: number | null): boolean {
  if (weeksSinceDeload >= deloadEvery) return true
  if (tsb !== null && tsb < -25) return true
  return false
}
