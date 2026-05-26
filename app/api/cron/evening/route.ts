import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMessage, getChatId } from '@/lib/telegram/bot'
import { formatEveningRecap } from '@/lib/telegram/formatters'

export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: user } = await supabase.from('users').select('id').limit(1).single()
  if (!user) return NextResponse.json({ ok: true, message: 'No user' })

  const userId = user.id
  const dayIdx = new Date(today).getDay() || 7

  // Week boundaries
  const d = new Date(today)
  const dayNum = d.getDay() || 7
  const weekStartD = new Date(d)
  weekStartD.setDate(d.getDate() - dayNum + 1)
  const weekEndD = new Date(d)
  weekEndD.setDate(d.getDate() + (7 - dayNum))
  const weekStart = weekStartD.toISOString().split('T')[0]
  const weekEnd = weekEndD.toISOString().split('T')[0]

  const [workoutsRes, tasksAllRes, tasksCompletedRes, nutritionRes, recoveryRes] = await Promise.all([
    supabase.from('planned_workouts')
      .select('id, name, session_type, zone, completed, skipped')
      .eq('user_id', userId)
      .gte('plan_date', weekStart)
      .lte('plan_date', weekEnd)
      .eq('day_of_week', dayIdx),
    supabase.from('tasks')
      .select('id')
      .eq('user_id', userId)
      .lte('due_date', today)
      .or('completed.eq.false,completed_at.gte.' + today + 'T00:00:00'),
    supabase.from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', `${today}T00:00:00`),
    supabase.from('nutrition_daily')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single(),
    supabase.from('recovery_scores')
      .select('score')
      .eq('user_id', userId)
      .eq('date', today)
      .single(),
  ])

  // Get user targets for nutrition context
  const { data: settings } = await supabase
    .from('user_settings')
    .select('target_calories, target_protein')
    .eq('user_id', userId)
    .single()

  const nutrition = nutritionRes.data ? {
    calories: nutritionRes.data.total_calories || 0,
    protein_g: nutritionRes.data.total_protein || 0,
    carbs_g: nutritionRes.data.total_carbs || 0,
    fat_g: nutritionRes.data.total_fat || 0,
    target_calories: settings?.target_calories || 2500,
    target_protein: settings?.target_protein || 150,
    water_ml: nutritionRes.data.water_ml || 0,
  } : null

  const msg = formatEveningRecap({
    workouts: workoutsRes.data || [],
    tasksCompleted: tasksCompletedRes.data?.length || 0,
    tasksTotal: (tasksAllRes.data?.length || 0),
    nutrition,
    recoveryScore: recoveryRes.data?.score || 0,
  })

  const chatId = getChatId()
  await sendMessage(chatId, msg)

  await supabase.from('notification_log').insert({
    user_id: userId,
    channel: 'telegram',
    type: 'evening_recap',
    content: msg,
  })

  return NextResponse.json({ ok: true })
}
