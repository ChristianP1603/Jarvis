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
  const days = parseInt(searchParams.get('days') || '30')

  const { data: entries } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(days)

  // 7-day moving average
  const sorted = (entries || []).slice().reverse()
  const trend = sorted.length >= 7
    ? sorted.slice(-7).reduce((s, e) => s + Number(e.weight_kg), 0) / 7
    : sorted.length > 0
      ? sorted.reduce((s, e) => s + Number(e.weight_kg), 0) / sorted.length
      : null

  // Weekly change
  const fourWeeksAgo = sorted.slice(-28, -21)
  const recent = sorted.slice(-7)
  const weeklyChange = fourWeeksAgo.length > 0 && recent.length > 0
    ? (recent.reduce((s, e) => s + Number(e.weight_kg), 0) / recent.length -
       fourWeeksAgo.reduce((s, e) => s + Number(e.weight_kg), 0) / fourWeeksAgo.length) / 4
    : null

  return NextResponse.json({
    entries: entries || [],
    trend: trend ? Math.round(trend * 10) / 10 : null,
    weekly_change: weeklyChange ? Math.round(weeklyChange * 100) / 100 : null,
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const userId = await getAppUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { weight_kg, date } = await request.json()
  const targetDate = date || new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('body_metrics')
    .upsert(
      { user_id: userId, date: targetDate, weight_kg, source: 'manual' },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also update user's current weight
  await supabase.from('users').update({ weight_kg }).eq('id', userId)

  return NextResponse.json({ entry: data })
}
