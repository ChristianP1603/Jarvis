import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, startOfWeek, addDays } from 'date-fns'
import { de } from 'date-fns/locale'
import Link from 'next/link'
import { GeneratePlanButton } from './generate-button'
import { WorkoutActions } from './workout-actions'

const ZONE_COLORS: Record<string, string> = {
  Z1: 'bg-blue-500/20 text-blue-300',
  Z2: 'bg-emerald-500/20 text-emerald-300',
  Z3: 'bg-yellow-500/20 text-yellow-300',
  Z4: 'bg-orange-500/20 text-orange-300',
  Z5: 'bg-red-500/20 text-red-300',
}

const TYPE_ICONS: Record<string, string> = {
  run: '🏃',
  bike: '🚴',
  swim: '🏊',
  strength: '🏋️',
  rest: '😴',
  cross: '🔄',
}

export default async function TrainingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: appUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single()
  if (!appUser) return null

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')

  const { data: plan } = await supabase
    .from('training_plans')
    .select('*')
    .eq('user_id', appUser.id)
    .eq('week_start', weekStartStr)
    .single()

  let workouts: Array<Record<string, unknown>> = []
  if (plan) {
    const { data } = await supabase
      .from('planned_workouts')
      .select('*')
      .eq('plan_id', plan.id)
      .order('date')
    workouts = data || []
  }

  // Check if profile exists
  const { data: activeProfile } = await supabase
    .from('training_profiles')
    .select('name, profile_type')
    .eq('user_id', appUser.id)
    .eq('active', true)
    .single()

  const today = format(new Date(), 'yyyy-MM-dd')

  // Group workouts by day
  const daySlots = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayWorkouts = workouts.filter(w => w.date === dateStr)
    return {
      date,
      dateStr,
      isToday: dateStr === today,
      dayLabel: format(date, 'EEE', { locale: de }),
      dayNum: format(date, 'd'),
      workouts: dayWorkouts,
    }
  })

  const completedCount = workouts.filter(w => w.completed).length
  const totalCount = workouts.filter(w => w.type !== 'rest').length

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Training</h1>
          <p className="text-zinc-500 text-sm">
            KW {format(weekStart, 'w')} · {activeProfile?.name || 'Kein Profil'}
            {plan?.is_deload && <span className="text-yellow-400 ml-2">DELOAD</span>}
          </p>
        </div>
        {plan && totalCount > 0 && (
          <div className="text-right">
            <p className="text-lg font-bold">{completedCount}/{totalCount}</p>
            <p className="text-[10px] text-zinc-500">absolviert</p>
          </div>
        )}
      </div>

      {!activeProfile && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-zinc-400 text-sm mb-3">Kein Trainingsprofil aktiv.</p>
            <Link href="/goals" className="text-sm bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-zinc-200">
              Ziel erstellen
            </Link>
          </CardContent>
        </Card>
      )}

      {activeProfile && !plan && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-6 pb-6 text-center space-y-3">
            <p className="text-zinc-400 text-sm">Kein Wochenplan für diese Woche.</p>
            <GeneratePlanButton />
          </CardContent>
        </Card>
      )}

      {plan && (
        <div className="space-y-2">
          {daySlots.map(day => (
            <Card key={day.dateStr} className={`border-zinc-800 ${day.isToday ? 'bg-zinc-800/80 border-zinc-600' : 'bg-zinc-900'}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  {/* Date column */}
                  <div className={`text-center min-w-[36px] ${day.isToday ? 'text-white' : 'text-zinc-500'}`}>
                    <p className="text-[10px] uppercase font-medium">{day.dayLabel}</p>
                    <p className={`text-lg font-bold ${day.isToday ? '' : 'text-zinc-400'}`}>{day.dayNum}</p>
                  </div>

                  {/* Workouts */}
                  <div className="flex-1 space-y-1.5">
                    {day.workouts.length > 0 ? day.workouts.map((w: Record<string, unknown>) => (
                      <div key={w.id as string} className="flex items-center gap-2">
                        <span className="text-sm">{TYPE_ICONS[(w.type as string)] || '💪'}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${(w.completed as boolean) ? 'text-zinc-500 line-through' : ''}`}>
                            {(w.title as string) || (w.type as string)}
                          </p>
                          <p className="text-[10px] text-zinc-600">
                            {[(w.target_duration_min as number) && `${w.target_duration_min}min`, w.target_zone as string].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {(w.target_zone as string) && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${ZONE_COLORS[(w.target_zone as string)] || ''}`}>
                              {w.target_zone as string}
                            </span>
                          )}
                          {(w.is_key_session as boolean) && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">KEY</span>
                          )}
                          {(w.is_cross_training as boolean) && (
                            <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-medium">CROSS</span>
                          )}
                          {(w.adjusted_for_recovery as boolean) && (
                            <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-medium">ADJ</span>
                          )}
                        </div>
                        {(w.type as string) !== 'rest' && (
                          <WorkoutActions
                            workoutId={w.id as string}
                            completed={w.completed as boolean}
                            skipped={w.skipped as boolean}
                          />
                        )}
                      </div>
                    )) : (
                      <p className="text-sm text-zinc-600">—</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {plan && (
        <div className="text-center">
          <p className="text-[10px] text-zinc-600">
            Phase: {plan.phase} · Gesamt: {workouts.reduce((s, w) => s + ((w.target_duration_min as number) || 0), 0)} min
          </p>
        </div>
      )}
    </div>
  )
}
