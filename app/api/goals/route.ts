import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/coaching/profiles'

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

  const { data: goals } = await supabase
    .from('goals')
    .select('*, milestones(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ goals: goals || [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const userId = await getAppUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Create goal
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      title: body.title,
      type: body.type,
      category: body.category || 'fitness',
      target_date: body.target_date || null,
      target_value: body.target_value || null,
      status: 'active',
    })
    .select()
    .single()

  if (goalError || !goal) {
    return NextResponse.json({ error: goalError?.message || 'Failed to create goal' }, { status: 500 })
  }

  // If a profile type is specified, create + activate a training profile
  if (body.profile_type) {
    const profile = getProfile(body.profile_type)
    if (profile) {
      // Deactivate all existing profiles
      await supabase
        .from('training_profiles')
        .update({ active: false })
        .eq('user_id', userId)

      await supabase
        .from('training_profiles')
        .insert({
          user_id: userId,
          goal_id: goal.id,
          profile_type: body.profile_type,
          name: profile.name,
          config: { current_phase: profile.phases[0].id },
          active: true,
          activated_at: new Date().toISOString(),
        })
    }
  }

  return NextResponse.json({ goal })
}
