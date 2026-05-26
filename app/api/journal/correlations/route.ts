import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateCorrelations, generateInsights } from '@/lib/journal/correlations'

async function getAppUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single()
  return data?.id || null
}

export async function GET() {
  const supabase = await createClient()
  const userId = await getAppUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch last 90 days of journal + outcomes
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 90)
  const startStr = startDate.toISOString().split('T')[0]

  const [journalRes, sleepRes, recoveryRes, metricsRes] = await Promise.all([
    supabase.from('journal_entries')
      .select('date, factors')
      .eq('user_id', userId)
      .gte('date', startStr)
      .order('date'),
    supabase.from('sleep_data')
      .select('date, score')
      .eq('user_id', userId)
      .gte('date', startStr),
    supabase.from('recovery_scores')
      .select('date, score')
      .eq('user_id', userId)
      .gte('date', startStr),
    supabase.from('fitness_metrics')
      .select('date, trimp_today')
      .eq('user_id', userId)
      .gte('date', startStr),
  ])

  // Index by date for fast lookup
  const sleepByDate = new Map<string, number>()
  for (const s of sleepRes.data || []) sleepByDate.set(s.date, s.score)

  const recoveryByDate = new Map<string, number>()
  for (const r of recoveryRes.data || []) recoveryByDate.set(r.date, r.score)

  const trimpByDate = new Map<string, number>()
  for (const m of metricsRes.data || []) trimpByDate.set(m.date, m.trimp_today)

  // Build combined day data — shift sleep/recovery by +1 day
  // (factors logged today affect tomorrow's sleep/recovery)
  const dayData = (journalRes.data || []).map(j => {
    const nextDay = new Date(j.date)
    nextDay.setDate(nextDay.getDate() + 1)
    const nextDayStr = nextDay.toISOString().split('T')[0]

    return {
      date: j.date,
      factors: j.factors || [],
      sleep_score: sleepByDate.get(nextDayStr) ?? null,
      recovery_score: recoveryByDate.get(nextDayStr) ?? null,
      trimp: trimpByDate.get(j.date) ?? null,
    }
  })

  const correlations = calculateCorrelations(dayData)
  const insights = generateInsights(correlations)

  // Store correlations in DB for reference
  for (const c of correlations) {
    await supabase.from('journal_correlations').upsert(
      {
        user_id: userId,
        factor: c.factor_id,
        metric: 'recovery',
        correlation_value: c.recovery_impact || 0,
        sample_size: c.occurrences,
      },
      { onConflict: 'user_id,factor,metric' }
    )
  }

  return NextResponse.json({ correlations, insights })
}
