import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMessage, getChatId } from '@/lib/telegram/bot'
import { formatMorningBriefing } from '@/lib/telegram/formatters'

export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
  const dayOfWeek = dayNames[new Date().getDay()]

  // Get first user (single-user app)
  const { data: user } = await supabase.from('users').select('id').limit(1).single()
  if (!user) return NextResponse.json({ ok: true, message: 'No user' })

  const userId = user.id
  const dayIdx = new Date(today).getDay() || 7

  // Calculate week boundaries for planned_workouts
  const d = new Date(today)
  const dayNum = d.getDay() || 7
  const weekStartD = new Date(d)
  weekStartD.setDate(d.getDate() - dayNum + 1)
  const weekEndD = new Date(d)
  weekEndD.setDate(d.getDate() + (7 - dayNum))
  const weekStart = weekStartD.toISOString().split('T')[0]
  const weekEnd = weekEndD.toISOString().split('T')[0]

  const [recoveryRes, metricsRes, workoutsRes, tasksRes] = await Promise.all([
    supabase.from('recovery_scores').select('score')
      .eq('user_id', userId).eq('date', today).single(),
    supabase.from('fitness_metrics').select('tsb')
      .eq('user_id', userId).eq('date', today).single(),
    supabase.from('planned_workouts')
      .select('id, name, session_type, zone, completed, skipped')
      .eq('user_id', userId)
      .gte('plan_date', weekStart)
      .lte('plan_date', weekEnd)
      .eq('day_of_week', dayIdx),
    supabase.from('tasks')
      .select('id, title, priority, due_date')
      .eq('user_id', userId)
      .eq('completed', false)
      .lte('due_date', today)
      .order('priority'),
  ])

  // Get sleep score from sleep_data
  const { data: sleepData } = await supabase
    .from('sleep_data')
    .select('score')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  const msg = formatMorningBriefing({
    recoveryScore: recoveryRes.data?.score || 0,
    sleepScore: sleepData?.score || 0,
    tsb: metricsRes.data?.tsb || 0,
    workouts: workoutsRes.data || [],
    tasks: tasksRes.data || [],
    dayOfWeek,
  })

  const chatId = getChatId()
  await sendMessage(chatId, msg)

  // Log notification
  await supabase.from('notification_log').insert({
    user_id: userId,
    channel: 'telegram',
    type: 'morning_briefing',
    content: msg,
  })

  return NextResponse.json({ ok: true })
}
