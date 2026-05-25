import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateTRIMP, calculateEMA } from '@/lib/coaching/metrics'

export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: users } = await supabase.from('users').select('id, rest_hr, max_hr')
  if (!users?.length) {
    return NextResponse.json({ ok: true, message: 'No users' })
  }

  for (const user of users) {
    const { data: todayActivities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', `${today}T00:00:00`)
      .lte('started_at', `${today}T23:59:59`)

    const trimpToday = (todayActivities || []).reduce((sum, a) => {
      if (!a.duration_s || !a.avg_hr) return sum
      return sum + calculateTRIMP(
        a.duration_s / 60,
        a.avg_hr,
        user.rest_hr || 50,
        user.max_hr || 190
      )
    }, 0)

    const { data: history } = await supabase
      .from('fitness_metrics')
      .select('date, trimp_today')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(42)

    const trimpHistory = (history || []).map(h => h.trimp_today || 0)
    trimpHistory.unshift(trimpToday)

    const ctl = calculateEMA(trimpHistory, 42)
    const atl = calculateEMA(trimpHistory.slice(0, 7), 7)
    const tsb = ctl - atl

    await supabase.from('fitness_metrics').upsert(
      { user_id: user.id, date: today, ctl, atl, tsb, trimp_today: trimpToday },
      { onConflict: 'user_id,date' }
    )
  }

  return NextResponse.json({ ok: true })
}
