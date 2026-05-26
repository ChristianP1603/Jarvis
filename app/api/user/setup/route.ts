import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Check if app user already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ user_id: existing.id, created: false })
  }

  // Create app user
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      auth_id: user.id,
      name: user.user_metadata?.full_name || null,
      email: user.email || '',
    })
    .select('id')
    .single()

  if (userError || !newUser) {
    return NextResponse.json({ error: 'Failed to create user', details: userError }, { status: 500 })
  }

  // Create default settings
  const { error: settingsError } = await supabase
    .from('user_settings')
    .insert({ user_id: newUser.id })

  if (settingsError) {
    return NextResponse.json({ error: 'Failed to create settings', details: settingsError }, { status: 500 })
  }

  return NextResponse.json({ user_id: newUser.id, created: true })
}
