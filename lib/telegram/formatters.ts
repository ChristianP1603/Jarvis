import { getRecoveryColor } from '@/lib/sleep/recovery'

interface WorkoutSummary {
  id: string
  name: string
  session_type: string | null
  zone: string | null
  completed: boolean
  skipped: boolean
}

interface TaskSummary {
  id: string
  title: string
  priority: number
  due_date: string | null
}

interface NutritionSummary {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  target_calories: number
  target_protein: number
  water_ml: number
}

const ZONE_EMOJI: Record<string, string> = {
  recovery: '🟢', easy: '🟢', aerobic: '🔵',
  tempo: '🟡', threshold: '🟠', vo2max: '🔴',
  anaerobic: '🔴', sprint: '⚫', strength: '🟣',
}

const PRIORITY_EMOJI: Record<number, string> = {
  1: '🔴', 2: '🟠', 3: '🔵', 4: '⚪',
}

// ── Morning Briefing ──

export function formatMorningBriefing(data: {
  recoveryScore: number
  sleepScore: number
  tsb: number
  workouts: WorkoutSummary[]
  tasks: TaskSummary[]
  dayOfWeek: string
}): string {
  const { recoveryScore, sleepScore, tsb, workouts, tasks, dayOfWeek } = data
  const color = getRecoveryColor(recoveryScore)
  const recoveryEmoji = color === 'green' ? '🟢' : color === 'yellow' ? '🟡' : '🔴'

  const lines: string[] = [
    `<b>☀️ Guten Morgen — ${dayOfWeek}</b>`,
    '',
    `${recoveryEmoji} Recovery: <b>${recoveryScore}/100</b>  |  😴 Sleep: <b>${sleepScore}/100</b>`,
    `📊 TSB: <b>${tsb > 0 ? '+' : ''}${tsb.toFixed(0)}</b> ${tsb > 5 ? '(fresh)' : tsb < -10 ? '(müde)' : '(ok)'}`,
  ]

  if (workouts.length > 0) {
    lines.push('', '<b>🏋️ Training heute:</b>')
    for (const w of workouts) {
      const emoji = ZONE_EMOJI[w.zone || ''] || '⚪'
      lines.push(`  ${emoji} ${w.name}`)
    }
  } else {
    lines.push('', '🛋️ <i>Kein Training geplant — Ruhetag</i>')
  }

  if (tasks.length > 0) {
    lines.push('', `<b>📋 ${tasks.length} Tasks für heute:</b>`)
    for (const t of tasks.slice(0, 5)) {
      lines.push(`  ${PRIORITY_EMOJI[t.priority] || '⚪'} ${t.title}`)
    }
    if (tasks.length > 5) {
      lines.push(`  ... und ${tasks.length - 5} weitere`)
    }
  }

  lines.push('', '💪 Gib Gas!')
  return lines.join('\n')
}

// ── Evening Recap ──

export function formatEveningRecap(data: {
  workouts: WorkoutSummary[]
  tasksCompleted: number
  tasksTotal: number
  nutrition: NutritionSummary | null
  recoveryScore: number
}): string {
  const { workouts, tasksCompleted, tasksTotal, nutrition, recoveryScore } = data

  const completed = workouts.filter(w => w.completed)
  const skipped = workouts.filter(w => w.skipped)
  const pending = workouts.filter(w => !w.completed && !w.skipped)

  const lines: string[] = [
    '<b>🌙 Tagesrückblick</b>',
    '',
  ]

  // Training summary
  if (workouts.length > 0) {
    lines.push('<b>🏋️ Training:</b>')
    for (const w of completed) {
      lines.push(`  ✅ ${w.name}`)
    }
    for (const w of skipped) {
      lines.push(`  ⏭️ ${w.name} (übersprungen)`)
    }
    for (const w of pending) {
      lines.push(`  ⬜ ${w.name} (offen)`)
    }
  } else {
    lines.push('🛋️ Ruhetag — kein Training geplant')
  }

  // Tasks
  const taskPct = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0
  lines.push('', `<b>📋 Tasks:</b> ${tasksCompleted}/${tasksTotal} erledigt (${taskPct}%)`)

  // Nutrition
  if (nutrition) {
    const calPct = nutrition.target_calories > 0
      ? Math.round((nutrition.calories / nutrition.target_calories) * 100) : 0
    const protPct = nutrition.target_protein > 0
      ? Math.round((nutrition.protein_g / nutrition.target_protein) * 100) : 0
    lines.push('', '<b>🍽️ Ernährung:</b>')
    lines.push(`  Kalorien: ${nutrition.calories}/${nutrition.target_calories} kcal (${calPct}%)`)
    lines.push(`  Protein: ${nutrition.protein_g}/${nutrition.target_protein}g (${protPct}%)`)
    lines.push(`  💧 Wasser: ${(nutrition.water_ml / 1000).toFixed(1)}L`)
  }

  // Recovery outlook
  const color = getRecoveryColor(recoveryScore)
  const emoji = color === 'green' ? '🟢' : color === 'yellow' ? '🟡' : '🔴'
  lines.push('', `${emoji} Recovery Score: <b>${recoveryScore}/100</b>`)

  lines.push('', 'Gute Nacht! 💤')
  return lines.join('\n')
}

// ── Weekly Summary ──

export function formatWeeklySummary(data: {
  weekNumber: number
  workoutsCompleted: number
  workoutsPlanned: number
  totalDurationMin: number
  avgRecovery: number
  tasksCompleted: number
  weightChange: number | null
}): string {
  const { weekNumber, workoutsCompleted, workoutsPlanned, totalDurationMin,
    avgRecovery, tasksCompleted, weightChange } = data

  const hours = Math.floor(totalDurationMin / 60)
  const mins = totalDurationMin % 60

  const lines: string[] = [
    `<b>📊 Wochenrückblick — KW ${weekNumber}</b>`,
    '',
    '<b>🏋️ Training:</b>',
    `  ${workoutsCompleted}/${workoutsPlanned} Sessions absolviert`,
    `  ⏱️ ${hours}h ${mins}min gesamt`,
    '',
    `📈 Ø Recovery: <b>${avgRecovery.toFixed(0)}/100</b>`,
    `📋 ${tasksCompleted} Tasks erledigt`,
  ]

  if (weightChange !== null) {
    const dir = weightChange > 0 ? '↑' : weightChange < 0 ? '↓' : '→'
    lines.push(`⚖️ Gewicht: ${dir} ${Math.abs(weightChange).toFixed(1)}kg`)
  }

  lines.push('', 'Weiter so! 🔥')
  return lines.join('\n')
}

// ── Status Command ──

export function formatStatus(data: {
  recoveryScore: number
  ctl: number
  atl: number
  tsb: number
  weight: number | null
}): string {
  const { recoveryScore, ctl, atl, tsb, weight } = data
  const color = getRecoveryColor(recoveryScore)
  const emoji = color === 'green' ? '🟢' : color === 'yellow' ? '🟡' : '🔴'

  const lines = [
    '<b>📊 Aktueller Status</b>',
    '',
    `${emoji} Recovery: <b>${recoveryScore}/100</b>`,
    `📈 CTL (Fitness): <b>${ctl.toFixed(0)}</b>`,
    `📉 ATL (Fatigue): <b>${atl.toFixed(0)}</b>`,
    `⚡ TSB (Form): <b>${tsb > 0 ? '+' : ''}${tsb.toFixed(0)}</b>`,
  ]

  if (weight) {
    lines.push(`⚖️ Gewicht: <b>${weight.toFixed(1)} kg</b>`)
  }

  return lines.join('\n')
}
