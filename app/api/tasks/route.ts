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
  const view = searchParams.get('view') || 'all'
  const projectId = searchParams.get('project')

  let query = supabase
    .from('tasks')
    .select('*, project:projects(id, name, color)')
    .eq('user_id', userId)

  switch (view) {
    case 'today': {
      const today = new Date().toISOString().split('T')[0]
      query = query.eq('completed', false).lte('due_date', today).order('priority').order('due_date')
      break
    }
    case 'inbox':
      query = query.is('project_id', null).eq('completed', false).order('created_at', { ascending: false })
      break
    case 'upcoming':
      query = query.eq('completed', false).not('due_date', 'is', null).order('due_date').order('priority')
      break
    case 'completed':
      query = query.eq('completed', true).order('completed_at', { ascending: false }).limit(50)
      break
    default:
      query = query.eq('completed', false).order('priority').order('due_date', { ascending: true, nullsFirst: false })
  }

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ tasks: data || [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const userId = await getAppUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: body.title,
      description: body.description || null,
      project_id: body.project_id || null,
      goal_id: body.goal_id || null,
      priority: body.priority || 4,
      tags: body.tags || [],
      due_date: body.due_date || null,
      due_time: body.due_time || null,
      recurrence: body.recurrence || null,
      parent_task_id: body.parent_task_id || null,
      source: body.source || 'manual',
    })
    .select('*, project:projects(id, name, color)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ task: data })
}
