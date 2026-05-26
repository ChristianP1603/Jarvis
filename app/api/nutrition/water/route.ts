import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAppUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single()
  return data?.id || null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const userId = await getAppUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, date: inputDate } = await request.json()
  const date = inputDate || new Date().toISOString().split('T')[0]

  // Get current water
  const { data: daily } = await supabase
    .from('nutrition_daily')
    .select('water_liters')
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  const currentWater = daily?.water_liters || 0
  const newWater = Math.round((currentWater + (amount || 0.25)) * 100) / 100

  await supabase.from('nutrition_daily').upsert(
    { user_id: userId, date, water_liters: newWater },
    { onConflict: 'user_id,date' }
  )

  return NextResponse.json({ water_liters: newWater })
}
