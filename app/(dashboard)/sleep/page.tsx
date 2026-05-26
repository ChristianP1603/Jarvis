import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getRecoveryColor, getRecoveryRecommendation } from '@/lib/sleep/recovery'

export default async function SleepPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: appUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()
  if (!appUser) return null

  const today = new Date().toISOString().split('T')[0]

  const [sleepRes, recoveryRes, recentSleepRes, recentRecoveryRes] = await Promise.all([
    supabase.from('sleep_data').select('*').eq('user_id', appUser.id).eq('date', today).single(),
    supabase.from('recovery_scores').select('*').eq('user_id', appUser.id).eq('date', today).single(),
    supabase.from('sleep_data').select('*').eq('user_id', appUser.id).order('date', { ascending: false }).limit(7),
    supabase.from('recovery_scores').select('*').eq('user_id', appUser.id).order('date', { ascending: false }).limit(7),
  ])

  const sleep = sleepRes.data
  const recovery = recoveryRes.data
  const recentSleep = recentSleepRes.data || []
  const recentRecovery = recentRecoveryRes.data || []

  const recoveryScore = recovery?.score ?? null
  const sleepScore = sleep?.sleep_score ?? null

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold pt-2">Sleep & Recovery</h1>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-zinc-500 text-xs mb-1">Recovery</p>
            <p className={`text-4xl font-bold ${recoveryScore !== null ? getRecoveryColor(recoveryScore) : 'text-zinc-600'}`}>
              {recoveryScore ?? '--'}
            </p>
            {recovery?.hrv_status && recovery.hrv_status !== 'no_data' && (
              <p className="text-[10px] text-zinc-600 mt-1">HRV: {recovery.hrv_status}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-zinc-500 text-xs mb-1">Sleep Score</p>
            <p className={`text-4xl font-bold ${
              sleepScore !== null ? (sleepScore >= 70 ? 'text-emerald-400' : sleepScore >= 50 ? 'text-yellow-400' : 'text-red-400') : 'text-zinc-600'
            }`}>
              {sleepScore ?? '--'}
            </p>
            {sleep?.total_sleep_min && (
              <p className="text-[10px] text-zinc-600 mt-1">
                {Math.floor(sleep.total_sleep_min / 60)}h {sleep.total_sleep_min % 60}min
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendation */}
      {recovery && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-zinc-300">{recovery.recommendation}</p>
          </CardContent>
        </Card>
      )}

      {/* Sleep Breakdown */}
      {sleep && sleep.total_sleep_min && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 font-medium">Schlafphasen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SleepPhaseBar label="Deep" minutes={sleep.deep_sleep_min} total={sleep.total_sleep_min} color="bg-indigo-500" targetPct={0.20} />
            <SleepPhaseBar label="REM" minutes={sleep.rem_sleep_min} total={sleep.total_sleep_min} color="bg-cyan-500" targetPct={0.25} />
            <SleepPhaseBar label="Light" minutes={sleep.light_sleep_min} total={sleep.total_sleep_min} color="bg-zinc-500" targetPct={0.55} />
            <SleepPhaseBar label="Wach" minutes={sleep.awake_min} total={sleep.total_sleep_min} color="bg-red-500/50" targetPct={0} />

            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div>
                <p className="text-xs text-zinc-500">Effizienz</p>
                <p className="text-sm font-medium">
                  {sleep.sleep_efficiency ? `${Math.round(sleep.sleep_efficiency * 100)}%` : '--'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">HRV</p>
                <p className="text-sm font-medium">
                  {sleep.hrv_overnight ? `${Math.round(sleep.hrv_overnight)} ms` : '--'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Ruhe-HR</p>
                <p className="text-sm font-medium">
                  {sleep.resting_hr ? `${sleep.resting_hr} bpm` : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7-Day Trends */}
      {recentRecovery.length > 1 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 font-medium">Letzte 7 Tage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-20">
              {recentRecovery.slice().reverse().map((r, i) => (
                <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-sm ${
                      r.score >= 70 ? 'bg-emerald-500' : r.score >= 50 ? 'bg-yellow-500' : r.score >= 30 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ height: `${Math.max(r.score * 0.7, 4)}px` }}
                  />
                  <span className="text-[8px] text-zinc-600">
                    {new Date(r.date).toLocaleDateString('de-DE', { weekday: 'narrow' })}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-zinc-600 mt-2">
              <span>Recovery Avg: {Math.round(recentRecovery.reduce((s, r) => s + r.score, 0) / recentRecovery.length)}</span>
              <span>Sleep Avg: {
                recentSleep.filter(s => s.sleep_score).length > 0
                  ? Math.round(recentSleep.filter(s => s.sleep_score).reduce((s, r) => s + (r.sleep_score || 0), 0) / recentSleep.filter(s => s.sleep_score).length)
                  : '--'
              }</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!sleep && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-zinc-500 text-sm">Keine Schlafdaten für heute.</p>
            <p className="text-zinc-600 text-xs mt-1">Daten kommen via Apple Health Sync.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SleepPhaseBar({ label, minutes, total, color, targetPct }: {
  label: string; minutes: number | null; total: number; color: string; targetPct: number
}) {
  if (!minutes) return null
  const pct = (minutes / total) * 100
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 w-10">{label}</span>
      <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-full rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-400 w-16 text-right">
        {Math.floor(minutes / 60)}h {minutes % 60}m
      </span>
      <span className="text-[9px] text-zinc-600 w-8 text-right">{Math.round(pct)}%</span>
    </div>
  )
}
