'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

type ChartTab = 'fitness' | 'volume' | 'weight' | 'recovery' | 'sleep'

export default function AnalyticsPage() {
  const [tab, setTab] = useState<ChartTab>('fitness')
  const [days, setDays] = useState(28)
  const [data, setData] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/analytics?type=${tab}&days=${days}`)
    if (res.ok) {
      const json = await res.json()
      setData(json.data || [])
    }
    setLoading(false)
  }, [tab, days])

  useEffect(() => { load() }, [load])

  const formatDate = (d: string) => {
    const date = new Date(d)
    return `${date.getDate()}.${date.getMonth() + 1}`
  }

  const tooltipLabel = (label: unknown) => formatDate(String(label))

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>

      {/* Chart selector */}
      <Tabs value={tab} onValueChange={v => setTab(v as ChartTab)}>
        <TabsList className="w-full bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="fitness" className="flex-1 text-[10px]">Fitness</TabsTrigger>
          <TabsTrigger value="volume" className="flex-1 text-[10px]">Volumen</TabsTrigger>
          <TabsTrigger value="weight" className="flex-1 text-[10px]">Gewicht</TabsTrigger>
          <TabsTrigger value="recovery" className="flex-1 text-[10px]">Recovery</TabsTrigger>
          <TabsTrigger value="sleep" className="flex-1 text-[10px]">Schlaf</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Time range */}
      <div className="flex gap-2">
        {[7, 14, 28, 90].map(d => (
          <button key={d} onClick={() => setDays(d)}
            className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
              days === d ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'
            }`}>
            {d}T
          </button>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-64 bg-zinc-800 rounded animate-pulse" />
      ) : data.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-zinc-500 text-sm">Noch keine Daten für diesen Zeitraum.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {tab === 'fitness' && 'CTL / ATL / TSB'}
              {tab === 'volume' && 'Trainingsvolumen'}
              {tab === 'weight' && 'Gewichtsverlauf'}
              {tab === 'recovery' && 'Recovery Score'}
              {tab === 'sleep' && 'Schlafanalyse'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                {tab === 'fitness' ? (
                  <LineChart data={data as FitnessPoint[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: '#71717a' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }}
                      labelFormatter={tooltipLabel} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="ctl" stroke="#22c55e" strokeWidth={2}
                      dot={false} name="CTL (Fitness)" />
                    <Line type="monotone" dataKey="atl" stroke="#ef4444" strokeWidth={2}
                      dot={false} name="ATL (Fatigue)" />
                    <Line type="monotone" dataKey="tsb" stroke="#3b82f6" strokeWidth={2}
                      dot={false} name="TSB (Form)" />
                  </LineChart>
                ) : tab === 'volume' ? (
                  <BarChart data={data as VolumePoint[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="week" tickFormatter={formatDate} tick={{ fontSize: 10, fill: '#71717a' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }}
                      labelFormatter={tooltipLabel} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="duration_min" fill="#8b5cf6" name="Minuten" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sessions" fill="#06b6d4" name="Sessions" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : tab === 'weight' ? (
                  <LineChart data={data as WeightPoint[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: '#71717a' }} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: '#71717a' }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }}
                      labelFormatter={tooltipLabel} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="weight" stroke="#71717a" strokeWidth={1}
                      dot={{ fill: '#71717a', r: 2 }} name="Gewicht" />
                    <Line type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={2}
                      dot={false} name="7T-Schnitt" />
                  </LineChart>
                ) : tab === 'recovery' ? (
                  <AreaChart data={data as RecoveryPoint[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: '#71717a' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#71717a' }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }}
                      labelFormatter={tooltipLabel} />
                    <Area type="monotone" dataKey="score" stroke="#22c55e" fill="#22c55e"
                      fillOpacity={0.15} strokeWidth={2} name="Recovery" />
                  </AreaChart>
                ) : (
                  <BarChart data={data as SleepPoint[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: '#71717a' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }}
                      labelFormatter={tooltipLabel} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="deep_min" stackId="sleep" fill="#6366f1" name="Deep" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="rem_min" stackId="sleep" fill="#a78bfa" name="REM" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="light_min" stackId="sleep" fill="#3f3f46" name="Light" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats summary */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {tab === 'fitness' && <FitnessStats data={data as FitnessPoint[]} />}
          {tab === 'volume' && <VolumeStats data={data as VolumePoint[]} />}
          {tab === 'weight' && <WeightStats data={data as WeightPoint[]} />}
          {tab === 'recovery' && <RecoveryStats data={data as RecoveryPoint[]} />}
          {tab === 'sleep' && <SleepStats data={data as SleepPoint[]} />}
        </div>
      )}
    </div>
  )
}

// ── Types ──

interface FitnessPoint { date: string; ctl: number; atl: number; tsb: number; trimp_today: number }
interface VolumePoint { week: string; duration_min: number; sessions: number; distance_km: number }
interface WeightPoint { date: string; weight: number; avg: number }
interface RecoveryPoint { date: string; score: number }
interface SleepPoint { date: string; total_min: number; deep_min: number; rem_min: number; score: number; light_min?: number }

// ── Stat Boxes ──

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardContent className="py-3 px-3 text-center">
        <p className="text-lg font-bold">{value}</p>
        <p className="text-[10px] text-zinc-500">{label}</p>
      </CardContent>
    </Card>
  )
}

function FitnessStats({ data }: { data: FitnessPoint[] }) {
  const latest = data[data.length - 1]
  return (
    <>
      <StatBox label="CTL (Fitness)" value={latest.ctl.toFixed(0)} />
      <StatBox label="ATL (Fatigue)" value={latest.atl.toFixed(0)} />
      <StatBox label="TSB (Form)" value={`${latest.tsb > 0 ? '+' : ''}${latest.tsb.toFixed(0)}`} />
    </>
  )
}

function VolumeStats({ data }: { data: VolumePoint[] }) {
  const total = data.reduce((s, d) => s + d.duration_min, 0)
  const sessions = data.reduce((s, d) => s + d.sessions, 0)
  const km = data.reduce((s, d) => s + d.distance_km, 0)
  return (
    <>
      <StatBox label="Minuten gesamt" value={String(total)} />
      <StatBox label="Sessions" value={String(sessions)} />
      <StatBox label="Distanz (km)" value={km.toFixed(1)} />
    </>
  )
}

function WeightStats({ data }: { data: WeightPoint[] }) {
  const first = data[0].weight
  const last = data[data.length - 1].weight
  const change = last - first
  const min = Math.min(...data.map(d => d.weight))
  return (
    <>
      <StatBox label="Aktuell" value={`${last.toFixed(1)} kg`} />
      <StatBox label="Veränderung" value={`${change > 0 ? '+' : ''}${change.toFixed(1)} kg`} />
      <StatBox label="Minimum" value={`${min.toFixed(1)} kg`} />
    </>
  )
}

function RecoveryStats({ data }: { data: RecoveryPoint[] }) {
  const avg = data.reduce((s, d) => s + d.score, 0) / data.length
  const min = Math.min(...data.map(d => d.score))
  const max = Math.max(...data.map(d => d.score))
  return (
    <>
      <StatBox label="Ø Recovery" value={avg.toFixed(0)} />
      <StatBox label="Min" value={String(min)} />
      <StatBox label="Max" value={String(max)} />
    </>
  )
}

function SleepStats({ data }: { data: SleepPoint[] }) {
  const avgTotal = data.reduce((s, d) => s + d.total_min, 0) / data.length
  const avgDeep = data.reduce((s, d) => s + d.deep_min, 0) / data.length
  const avgScore = data.reduce((s, d) => s + d.score, 0) / data.length
  return (
    <>
      <StatBox label="Ø Schlaf" value={`${Math.floor(avgTotal / 60)}h ${Math.round(avgTotal % 60)}m`} />
      <StatBox label="Ø Deep" value={`${Math.round(avgDeep)}min`} />
      <StatBox label="Ø Score" value={avgScore.toFixed(0)} />
    </>
  )
}
