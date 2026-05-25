import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.HEALTH_SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const body = await request.json()
  const { user_id, activities, sleep, weight } = body

  const results: Record<string, { inserted: number; errors: number }> = {}

  if (activities?.length) {
    let inserted = 0
    let errors = 0
    for (const activity of activities) {
      const { error } = await supabase.from('activities').upsert(
        { user_id, ...activity },
        { onConflict: 'source,source_id' }
      )
      if (error) errors++
      else inserted++
    }
    results.activities = { inserted, errors }
  }

  if (sleep?.length) {
    let inserted = 0
    let errors = 0
    for (const entry of sleep) {
      const { error } = await supabase.from('sleep_data').upsert(
        { user_id, ...entry },
        { onConflict: 'user_id,date' }
      )
      if (error) errors++
      else inserted++
    }
    results.sleep = { inserted, errors }
  }

  if (weight?.length) {
    let inserted = 0
    let errors = 0
    for (const entry of weight) {
      const { error } = await supabase.from('body_metrics').upsert(
        { user_id, ...entry },
        { onConflict: 'user_id,date' }
      )
      if (error) errors++
      else inserted++
    }
    results.weight = { inserted, errors }
  }

  return NextResponse.json({ ok: true, results })
}
