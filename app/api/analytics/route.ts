import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAppUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single()
  return data?.id || null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const userId = await getAppUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const range = parseInt(searchParams.get('days') || '28', 10)
  const type = searchParams.get('type') || 'fitness'

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - range)
  const startStr = startDate.toISOString().split('T')[0]

  switch (type) {
    case 'fitness': {
      const { data, error } = await supabase
        .from('fitness_metrics')
        .select('date, ctl, atl, tsb, trimp_today')
        .eq('user_id', userId)
        .gte('date', startStr)
        .order('date')

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: data || [] })
    }

    case 'volume': {
      const { data, error } = await supabase
        .from('activities')
        .select('started_at, duration_s, type, distance_m')
        .eq('user_id', userId)
        .gte('started_at', `${startStr}T00:00:00`)
        .order('started_at')

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Group by week
      const weeks: Record<string, { week: string; duration_min: number; sessions: number; distance_km: number }> = {}
      for (const a of data || []) {
        const d = new Date(a.started_at)
        const day = d.getDay() || 7
        const mon = new Date(d)
        mon.setDate(d.getDate() - day + 1)
        const weekKey = mon.toISOString().split('T')[0]

        if (!weeks[weekKey]) {
          weeks[weekKey] = { week: weekKey, duration_min: 0, sessions: 0, distance_km: 0 }
        }
        weeks[weekKey].duration_min += Math.round((a.duration_s || 0) / 60)
        weeks[weekKey].sessions += 1
        weeks[weekKey].distance_km += Math.round((a.distance_m || 0) / 100) / 10
      }

      return NextResponse.json({ data: Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week)) })
    }

    case 'weight': {
      const { data, error } = await supabase
        .from('body_metrics')
        .select('date, weight_kg')
        .eq('user_id', userId)
        .gte('date', startStr)
        .order('date')

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Calculate 7-day rolling average
      const result = (data || []).map((d, i, arr) => {
        const window = arr.slice(Math.max(0, i - 6), i + 1)
        const avg = window.reduce((s, w) => s + w.weight_kg, 0) / window.length
        return { date: d.date, weight: d.weight_kg, avg: Math.round(avg * 10) / 10 }
      })

      return NextResponse.json({ data: result })
    }

    case 'recovery': {
      const { data, error } = await supabase
        .from('recovery_scores')
        .select('date, score')
        .eq('user_id', userId)
        .gte('date', startStr)
        .order('date')

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: data || [] })
    }

    case 'sleep': {
      const { data, error } = await supabase
        .from('sleep_data')
        .select('date, total_min, deep_min, rem_min, score')
        .eq('user_id', userId)
        .gte('date', startStr)
        .order('date')

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: data || [] })
    }

    default:
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  }
}
