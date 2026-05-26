import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMessage, getChatId } from '@/lib/telegram/bot'
import { formatWeeklySummary } from '@/lib/telegram/formatters'

export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: user } = await supabase.from('users').select('id').limit(1).single()
  if (!user) return NextResponse.json({ ok: true, message: 'No user' })

  const userId = user.id

  // Last week boundaries (Mon-Sun)
  const now = new Date()
  const today = now.getDay() || 7
  const lastSunday = new Date(now)
  lastSunday.setDate(now.getDate() - today)
  const lastMonday = new Date(lastSunday)
  lastMonday.setDate(lastSunday.getDate() - 6)

  const weekStart = lastMonday.toISOString().split('T')[0]
  const weekEnd = lastSunday.toISOString().split('T')[0]

  // ISO week number
  const jan1 = new Date(lastMonday.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((lastMonday.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)

  const [workoutsRes, activitiesRes, recoveryRes, tasksRes, weightRes] = await Promise.all([
    supabase.from('planned_workouts')
      .select('id, completed, skipped')
      .eq('user_id', userId)
      .gte('plan_date', weekStart)
      .lte('plan_date', weekEnd),
    supabase.from('activities')
      .select('duration_s')
      .eq('user_id', userId)
      .gte('started_at', `${weekStart}T00:00:00`)
      .lte('started_at', `${weekEnd}T23:59:59`),
    supabase.from('recovery_scores')
      .select('score')
      .eq('user_id', userId)
      .gte('date', weekStart)
      .lte('date', weekEnd),
    supabase.from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', `${weekStart}T00:00:00`)
      .lte('completed_at', `${weekEnd}T23:59:59`),
    supabase.from('body_metrics')
      .select('weight_kg, date')
      .eq('user_id', userId)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .order('date'),
  ])

  const workouts = workoutsRes.data || []
  const workoutsCompleted = workouts.filter(w => w.completed).length
  const workoutsPlanned = workouts.length

  const totalDurationMin = Math.round(
    (activitiesRes.data || []).reduce((sum, a) => sum + (a.duration_s || 0), 0) / 60
  )

  const recoveryScores = (recoveryRes.data || []).map(r => r.score)
  const avgRecovery = recoveryScores.length > 0
    ? recoveryScores.reduce((a, b) => a + b, 0) / recoveryScores.length : 0

  const weights = (weightRes.data || []).map(w => w.weight_kg)
  const weightChange = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : null

  const msg = formatWeeklySummary({
    weekNumber,
    workoutsCompleted,
    workoutsPlanned,
    totalDurationMin,
    avgRecovery,
    tasksCompleted: tasksRes.data?.length || 0,
    weightChange,
  })

  const chatId = getChatId()
  await sendMessage(chatId, msg)

  await supabase.from('notification_log').insert({
    user_id: userId,
    channel: 'telegram',
    type: 'weekly_summary',
    content: msg,
  })

  return NextResponse.json({ ok: true })
}
