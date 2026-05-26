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

  const { data: meals } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at')

  const { data: templates } = await supabase
    .from('meal_templates')
    .select('*')
    .eq('user_id', userId)
    .order('name')

  const { data: daily } = await supabase
    .from('nutrition_daily')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  return NextResponse.json({ meals: meals || [], templates: templates || [], daily })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const userId = await getAppUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const date = body.date || new Date().toISOString().split('T')[0]

  // Insert meal log
  const { data: meal, error: mealError } = await supabase
    .from('meal_logs')
    .insert({
      user_id: userId,
      date,
      meal_type: body.meal_type || null,
      description: body.description || null,
      calories: body.calories || 0,
      carbs_g: body.carbs_g || 0,
      protein_g: body.protein_g || 0,
      fat_g: body.fat_g || 0,
      template_id: body.template_id || null,
    })
    .select()
    .single()

  if (mealError) return NextResponse.json({ error: mealError.message }, { status: 500 })

  // Update nutrition_daily totals
  const { data: allMeals } = await supabase
    .from('meal_logs')
    .select('calories, carbs_g, protein_g, fat_g')
    .eq('user_id', userId)
    .eq('date', date)

  if (allMeals) {
    const totals = allMeals.reduce(
      (acc, m) => ({
        logged_calories: acc.logged_calories + (m.calories || 0),
        logged_carbs_g: acc.logged_carbs_g + (m.carbs_g || 0),
        logged_protein_g: acc.logged_protein_g + (m.protein_g || 0),
        logged_fat_g: acc.logged_fat_g + (m.fat_g || 0),
      }),
      { logged_calories: 0, logged_carbs_g: 0, logged_protein_g: 0, logged_fat_g: 0 }
    )

    await supabase.from('nutrition_daily').upsert(
      { user_id: userId, date, ...totals },
      { onConflict: 'user_id,date' }
    )
  }

  return NextResponse.json({ meal })
}
