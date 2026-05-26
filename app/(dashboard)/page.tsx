import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getRecoveryColor } from '@/lib/sleep/recovery'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: appUser } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]
  const todayFormatted = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  // Fetch all dashboard data in parallel
  const [recoveryRes, workoutsRes, nutritionRes, tasksRes, weightRes] = await Promise.all([
    supabase.from('recovery_scores').select('*').eq('user_id', appUser?.id).eq('date', today).single(),
    supabase.from('planned_workouts').select('*').eq('user_id', appUser?.id).eq('date', today).order('type'),
    supabase.from('nutrition_daily').select('*').eq('user_id', appUser?.id).eq('date', today).single(),
    supabase.from('tasks').select('*').eq('user_id', appUser?.id).eq('due_date', today).eq('completed', false).order('priority'),
    supabase.from('body_metrics').select('*').eq('user_id', appUser?.id).order('date', { ascending: false }).limit(1),
  ])

  const recovery = recoveryRes.data
  const workouts = workoutsRes.data || []
  const nutrition = nutritionRes.data
  const tasks = tasksRes.data || []
  const latestWeight = weightRes.data?.[0]

  const firstName = appUser?.name?.split(' ')[0] || user.user_metadata?.full_name?.split(' ')[0] || ''
  const recoveryScore = recovery?.score ?? null
  const recoveryColorClass = recoveryScore !== null ? getRecoveryColor(recoveryScore) : 'text-zinc-600'

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-2">
        <p className="text-zinc-500 text-sm">{todayFormatted}</p>
        <h1 className="text-2xl font-bold">
          Hey{firstName ? `, ${firstName}` : ''}
        </h1>
      </div>

      {/* Recovery Score */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 font-medium">
            <Link href="/sleep" className="hover:text-zinc-300 transition-colors">Recovery</Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold ${recoveryColorClass}`}>
              {recoveryScore !== null ? recoveryScore : '--'}
            </div>
            <div className="text-sm text-zinc-500 flex-1">
              {recovery?.recommendation || 'Keine Daten. Verbinde Apple Health in den Settings.'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Workout */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 font-medium">
            <Link href="/training" className="hover:text-zinc-300 transition-colors">Training heute</Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length > 0 ? (
            <div className="space-y-2">
              {workouts.map((w) => (
                <div key={w.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    w.completed ? 'bg-emerald-400' : w.skipped ? 'bg-zinc-600' : 'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${w.completed ? 'text-zinc-500 line-through' : ''}`}>
                      {w.title || w.type}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {[w.target_duration_min && `${w.target_duration_min}min`, w.target_zone].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {w.is_key_session && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">KEY</span>
                  )}
                  {w.is_cross_training && (
                    <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-medium">CROSS</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">
              Kein Training geplant.{' '}
              <Link href="/goals" className="text-zinc-400 underline">Ziel erstellen</Link>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Nutrition */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 font-medium">
            <Link href="/nutrition" className="hover:text-zinc-300 transition-colors">Nutrition</Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nutrition ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                <MacroItem label="kcal" current={nutrition.logged_calories} target={nutrition.target_calories} />
                <MacroItem label="Carbs" current={nutrition.logged_carbs_g} target={nutrition.target_carbs_g} unit="g" />
                <MacroItem label="Protein" current={nutrition.logged_protein_g} target={nutrition.target_protein_g} unit="g" />
                <MacroItem label="Fett" current={nutrition.logged_fat_g} target={nutrition.target_fat_g} unit="g" />
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>Wasser</span>
                <Progress value={(nutrition.water_liters / 3.0) * 100} className="h-1.5 flex-1" />
                <span>{nutrition.water_liters}L</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 text-center">
              {['kcal', 'Carbs', 'Protein', 'Fett'].map(l => (
                <div key={l}>
                  <p className="text-lg font-semibold text-zinc-600">--</p>
                  <p className="text-[10px] text-zinc-600">{l}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 font-medium">
            <Link href="/tasks" className="hover:text-zinc-300 transition-colors">Tasks heute</Link>
            {tasks.length > 0 && (
              <span className="ml-2 text-xs text-zinc-600">{tasks.length}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <div className="space-y-1.5">
              {tasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    t.priority === 1 ? 'bg-red-400' : t.priority === 2 ? 'bg-orange-400' : 'bg-zinc-600'
                  }`} />
                  <span className="text-sm truncate">{t.title}</span>
                </div>
              ))}
              {tasks.length > 5 && (
                <p className="text-[10px] text-zinc-600">+{tasks.length - 5} weitere</p>
              )}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">Keine Tasks fällig.</p>
          )}
        </CardContent>
      </Card>

      {/* Weight (if available) */}
      {latestWeight && (
        <div className="flex items-center justify-between px-1 text-sm text-zinc-500">
          <span>Gewicht</span>
          <span className="font-medium text-zinc-300">{latestWeight.weight_kg} kg</span>
        </div>
      )}
    </div>
  )
}

function MacroItem({ label, current, target, unit = '' }: {
  label: string; current: number; target: number; unit?: string
}) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
  return (
    <div>
      <p className="text-lg font-semibold">{current}<span className="text-xs text-zinc-500">/{target}{unit}</span></p>
      <Progress value={pct} className="h-1 mt-1" />
      <p className="text-[10px] text-zinc-500 mt-0.5">{label}</p>
    </div>
  )
}
