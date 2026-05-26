import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateWeeklyPlan, shouldDeload } from '@/lib/coaching/engine'
import { getProfile } from '@/lib/coaching/profiles'
import { sendMessage, getChatId } from '@/lib/telegram/bot'
import { startOfWeek, format } from 'date-fns'

export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get all users with active profiles
  const { data: users } = await supabase.from('users').select('id')
  if (!users?.length) {
    return NextResponse.json({ ok: true, message: 'No users' })
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const today = format(new Date(), 'yyyy-MM-dd')

  for (const user of users) {
    const userId = user.id

    // Check if plan already exists for this week
    const { data: existing } = await supabase
      .from('training_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStartStr)
      .single()

    if (existing) continue // Skip if plan exists

    // Get active profile
    const { data: activeProfile } = await supabase
      .from('training_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .single()

    if (!activeProfile) continue

    const profile = getProfile(activeProfile.profile_type)
    if (!profile) continue

    // Get settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!settings) continue

    // Get metrics
    const { data: metrics } = await supabase
      .from('fitness_metrics')
      .select('tsb')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)

    const currentTSB = metrics?.[0]?.tsb ?? null

    // Weeks since last deload
    const { data: recentPlans } = await supabase
      .from('training_plans')
      .select('is_deload')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(8)

    const weeksSinceDeload = recentPlans
      ? recentPlans.findIndex(p => p.is_deload) : 99
    const effectiveWeeksSince = weeksSinceDeload === -1 ? 99 : weeksSinceDeload

    // Recovery
    const { data: recovery } = await supabase
      .from('recovery_scores')
      .select('score')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    // Phase
    const profileConfig = activeProfile.config as Record<string, unknown> || {}
    const currentPhase = (profileConfig.current_phase as string) || profile.phases[0].id

    // Generate
    const weekPlan = generateWeeklyPlan({
      profile,
      phase: currentPhase as Parameters<typeof generateWeeklyPlan>[0]['phase'],
      weekNumber: effectiveWeeksSince + 1,
      strengthDays: settings.strength_days || [],
      strengthSplits: settings.strength_splits || {},
      availableDays: settings.available_days || ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
      longSessionDay: settings.long_session_day || 'SA',
      restDay: settings.preferred_rest_day || 'SU',
      doubleSessions: settings.double_sessions || false,
      recoveryScore: recovery?.score ?? null,
      shouldDeload: shouldDeload(effectiveWeeksSince, profile.deload.every_n_weeks, currentTSB),
    })

    // Save plan
    const { data: savedPlan, error: planError } = await supabase
      .from('training_plans')
      .insert({
        user_id: userId,
        goal_id: activeProfile.goal_id,
        week_start: weekStartStr,
        phase: weekPlan.phase,
        is_deload: weekPlan.is_deload,
        status: 'active',
      })
      .select()
      .single()

    if (planError || !savedPlan) continue

    // Save workouts
    const workouts = weekPlan.sessions.map(s => {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + s.day)
      return {
        plan_id: savedPlan.id,
        user_id: userId,
        date: format(date, 'yyyy-MM-dd'),
        type: s.template.type,
        title: s.template.title,
        description: s.template.description + (s.note ? `\n${s.note}` : ''),
        target_duration_min: s.template.duration_min,
        target_zone: s.template.zone,
        is_key_session: s.template.is_key_session,
        is_cross_training: s.template.is_cross_training,
        adjusted_for_recovery: s.adjusted,
        original_title: s.original_title || null,
      }
    })

    await supabase.from('planned_workouts').insert(workouts)

    // Notify via Telegram
    const sessionCount = weekPlan.sessions.length
    const totalMin = weekPlan.total_duration_min
    const hours = Math.floor(totalMin / 60)
    const mins = totalMin % 60

    const msg = [
      `<b>📋 Neuer Trainingsplan — KW ${format(weekStart, 'w')}</b>`,
      '',
      `Phase: <b>${weekPlan.phase}</b>${weekPlan.is_deload ? ' (Deload)' : ''}`,
      `${sessionCount} Sessions  |  ${hours}h ${mins}min geplant`,
      '',
      ...weekPlan.sessions.map(s => {
        const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
        const key = s.template.is_key_session ? '🔑' : ''
        const cross = s.template.is_cross_training ? '🔄' : ''
        return `  ${dayNames[s.day]} — ${s.template.title} ${key}${cross}`
      }),
      '',
      'Viel Erfolg! 💪',
    ].join('\n')

    await sendMessage(getChatId(), msg)

    await supabase.from('notification_log').insert({
      user_id: userId,
      channel: 'telegram',
      type: 'plan_generated',
      content: msg,
    })
  }

  return NextResponse.json({ ok: true })
}
