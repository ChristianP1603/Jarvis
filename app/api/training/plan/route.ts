import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWeeklyPlan, shouldDeload } from '@/lib/coaching/engine'
import { getProfile } from '@/lib/coaching/profiles'
import { startOfWeek, format } from 'date-fns'

async function getAppUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('*').eq('auth_id', user.id).single()
  return data
}

export async function GET() {
  const supabase = await createClient()
  const appUser = await getAppUser()
  if (!appUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const { data: plan } = await supabase
    .from('training_plans')
    .select('*, planned_workouts(*)')
    .eq('user_id', appUser.id)
    .eq('week_start', weekStart)
    .single()

  if (!plan) {
    return NextResponse.json({ plan: null, message: 'No plan for this week' })
  }

  return NextResponse.json({ plan })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const appUser = await getAppUser()
  if (!appUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const forceRegenerate = body.force || false

  // Get active profile
  const { data: activeProfile } = await supabase
    .from('training_profiles')
    .select('*')
    .eq('user_id', appUser.id)
    .eq('active', true)
    .single()

  if (!activeProfile) {
    return NextResponse.json({ error: 'No active training profile. Create a goal first.' }, { status: 400 })
  }

  const profile = getProfile(activeProfile.profile_type)
  if (!profile) {
    return NextResponse.json({ error: `Unknown profile type: ${activeProfile.profile_type}` }, { status: 400 })
  }

  // Get settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', appUser.id)
    .single()

  if (!settings) {
    return NextResponse.json({ error: 'No user settings found' }, { status: 400 })
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')

  // Check if plan already exists
  if (!forceRegenerate) {
    const { data: existing } = await supabase
      .from('training_plans')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('week_start', weekStartStr)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Plan already exists. Use force=true to regenerate.' }, { status: 409 })
    }
  } else {
    // Delete existing plan
    const { data: existing } = await supabase
      .from('training_plans')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('week_start', weekStartStr)
      .single()

    if (existing) {
      await supabase.from('planned_workouts').delete().eq('plan_id', existing.id)
      await supabase.from('training_plans').delete().eq('id', existing.id)
    }
  }

  // Get metrics for deload check
  const { data: metrics } = await supabase
    .from('fitness_metrics')
    .select('tsb')
    .eq('user_id', appUser.id)
    .order('date', { ascending: false })
    .limit(1)

  const currentTSB = metrics?.[0]?.tsb ?? null

  // Count weeks since last deload
  const { data: recentPlans } = await supabase
    .from('training_plans')
    .select('is_deload, week_start')
    .eq('user_id', appUser.id)
    .order('week_start', { ascending: false })
    .limit(8)

  const weeksSinceDeload = recentPlans
    ? recentPlans.findIndex(p => p.is_deload)
    : 99
  const effectiveWeeksSince = weeksSinceDeload === -1 ? 99 : weeksSinceDeload

  // Get recovery score
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: recovery } = await supabase
    .from('recovery_scores')
    .select('score')
    .eq('user_id', appUser.id)
    .eq('date', today)
    .single()

  // Determine phase from profile config
  const profileConfig = activeProfile.config as Record<string, unknown> || {}
  const currentPhase = (profileConfig.current_phase as string) || profile.phases[0].id

  // Generate plan
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

  // Save to database
  const { data: savedPlan, error: planError } = await supabase
    .from('training_plans')
    .insert({
      user_id: appUser.id,
      goal_id: activeProfile.goal_id,
      week_start: weekStartStr,
      phase: weekPlan.phase,
      is_deload: weekPlan.is_deload,
      status: 'active',
    })
    .select()
    .single()

  if (planError || !savedPlan) {
    return NextResponse.json({ error: 'Failed to create plan', details: planError }, { status: 500 })
  }

  // Save workouts
  const DAY_NAMES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  const workouts = weekPlan.sessions.map(s => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + s.day)
    return {
      plan_id: savedPlan.id,
      user_id: appUser.id,
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

  const { error: workoutError } = await supabase
    .from('planned_workouts')
    .insert(workouts)

  if (workoutError) {
    return NextResponse.json({ error: 'Failed to create workouts', details: workoutError }, { status: 500 })
  }

  return NextResponse.json({
    plan: savedPlan,
    workouts: workouts.length,
    is_deload: weekPlan.is_deload,
    phase: weekPlan.phase,
    total_duration_min: weekPlan.total_duration_min,
  })
}
