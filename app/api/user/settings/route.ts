import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAppUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  return data?.id || null
}

export async function GET() {
  const supabase = await createClient()
  const userId = await getAppUserId()
  if (!userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  return NextResponse.json({ user, settings })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const userId = await getAppUserId()
  if (!userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { user: userData, settings: settingsData } = body

  if (userData) {
    const { error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (settingsData) {
    const { error } = await supabase
      .from('user_settings')
      .update(settingsData)
      .eq('user_id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
