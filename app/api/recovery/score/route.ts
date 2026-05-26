import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateSleepScore } from '@/lib/sleep/score'
import { calculateRecoveryScore, getRecoveryRecommendation } from '@/lib/sleep/recovery'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: appUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()
  if (!appUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  // Get today's sleep data
  const { data: sleep } = await supabase
    .from('sleep_data')
    .select('*')
    .eq('user_id', appUser.id)
    .eq('date', date)
    .single()

  if (!sleep) {
    return NextResponse.json({ score: null, message: 'No sleep data for this date' })
  }

  // Calculate baselines (14-day average)
  const { data: recentSleep } = await supabase
    .from('sleep_data')
    .select('hrv_overnight, resting_hr')
    .eq('user_id', appUser.id)
    .lt('date', date)
    .order('date', { ascending: false })
    .limit(14)

  const hrvValues = (recentSleep || []).map(s => s.hrv_overnight).filter(Boolean) as number[]
  const rhrValues = (recentSleep || []).map(s => s.resting_hr).filter(Boolean) as number[]
  const hrvBaseline = hrvValues.length > 0 ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length : null
  const rhrBaseline = rhrValues.length > 0 ? rhrValues.reduce((a, b) => a + b, 0) / rhrValues.length : null

  // Get journal entry
  const { data: journal } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', appUser.id)
    .eq('date', date)
    .single()

  // Calculate scores
  const sleepScore = calculateSleepScore(sleep)
  const { score, hrv_status, rhr_status } = calculateRecoveryScore(
    sleep, sleepScore, hrvBaseline, rhrBaseline, journal
  )

  // Get TSB for recommendation
  const { data: metrics } = await supabase
    .from('fitness_metrics')
    .select('tsb')
    .eq('user_id', appUser.id)
    .eq('date', date)
    .single()

  const recommendation = getRecoveryRecommendation(score, metrics?.tsb ?? null)

  // Store scores
  await supabase.from('sleep_data').update({ sleep_score: sleepScore }).eq('id', sleep.id)
  await supabase.from('recovery_scores').upsert(
    { user_id: appUser.id, date, score, hrv_status, rhr_status, recommendation },
    { onConflict: 'user_id,date' }
  )

  return NextResponse.json({
    sleep_score: sleepScore,
    recovery_score: score,
    hrv_status,
    rhr_status,
    recommendation,
    baselines: { hrv: hrvBaseline, rhr: rhrBaseline },
  })
}
