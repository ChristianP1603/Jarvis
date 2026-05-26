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
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  return NextResponse.json({ entry: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const userId = await getAppUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, factors, notes } = await request.json()
  const targetDate = date || new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('journal_entries')
    .upsert(
      { user_id: userId, date: targetDate, factors: factors || [], notes: notes || null },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}
