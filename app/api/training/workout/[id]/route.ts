import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAppUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single()
  return data?.id || null
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const userId = await getAppUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}

  if (body.action === 'complete') {
    updates.completed = true
    updates.skipped = false
    if (body.activity_id) updates.matched_activity_id = body.activity_id
  } else if (body.action === 'skip') {
    updates.skipped = true
    updates.completed = false
    updates.skip_reason = body.reason || null
  } else if (body.action === 'undo') {
    updates.completed = false
    updates.skipped = false
    updates.skip_reason = null
  }

  const { data, error } = await supabase
    .from('planned_workouts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ workout: data })
}
