'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { getProfileList } from '@/lib/coaching/profiles'

interface Goal {
  id: string
  title: string
  type: string
  category: string
  target_date: string | null
  status: string
}

const GOAL_TYPES = [
  { value: 'performance', label: 'Performance', desc: '5K unter 20:00, FTP auf 250W' },
  { value: 'endurance_race', label: 'Wettkampf', desc: 'Marathon, Ironman, Radrennen' },
  { value: 'body_composition', label: 'Körper', desc: 'Gewicht, Muskelaufbau' },
  { value: 'habit', label: 'Gewohnheit', desc: 'Jeden Tag meditieren, Streak' },
]

const PROFILES = getProfileList()

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    title: '', type: 'performance', category: 'fitness',
    target_date: '', profile_type: '',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/goals')
      if (res.ok) {
        const data = await res.json()
        setGoals(data.goals || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const create = async () => {
    setCreating(true)
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        target_date: form.target_date || null,
      }),
    })
    if (res.ok) {
      const { goal } = await res.json()
      setGoals(prev => [goal, ...prev])
      setShowCreate(false)
      setForm({ title: '', type: 'performance', category: 'fitness', target_date: '', profile_type: '' })
    }
    setCreating(false)
  }

  if (loading) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse mt-2" />
        <div className="h-32 bg-zinc-800 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <div className="pt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ziele</h1>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}
          className="bg-white text-black hover:bg-zinc-200 text-xs">
          + Neues Ziel
        </Button>
      </div>

      {showCreate && (
        <Card className="border-zinc-700 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Neues Ziel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-zinc-400 text-xs">Titel</Label>
              <Input className="bg-zinc-800 border-zinc-700 mt-1" placeholder="z.B. 5K unter 20:00"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div>
              <Label className="text-zinc-400 text-xs mb-2 block">Ziel-Typ</Label>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_TYPES.map(t => (
                  <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className={`p-2 rounded-lg text-left transition-colors ${
                      form.type === t.value ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                    <p className="text-xs font-medium">{t.label}</p>
                    <p className="text-[10px] opacity-60">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-zinc-400 text-xs mb-2 block">Trainings-Profil</Label>
              <div className="space-y-1.5">
                {PROFILES.map(p => (
                  <button key={p.id} onClick={() => setForm(f => ({ ...f, profile_type: p.id }))}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      form.profile_type === p.id ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-[10px] opacity-60">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-zinc-400 text-xs">Zieldatum (optional)</Label>
              <Input className="bg-zinc-800 border-zinc-700 mt-1" type="date"
                value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
            </div>

            <div className="flex gap-2">
              <Button onClick={create} disabled={creating || !form.title || !form.profile_type}
                className="bg-white text-black hover:bg-zinc-200">
                {creating ? 'Erstelle...' : 'Ziel erstellen'}
              </Button>
              <Button variant="outline" className="border-zinc-700" onClick={() => setShowCreate(false)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {goals.length === 0 && !showCreate && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-zinc-500 text-sm">Noch keine Ziele.</p>
            <p className="text-zinc-600 text-xs mt-1">Erstelle ein Ziel um deinen Trainingsplan zu starten.</p>
          </CardContent>
        </Card>
      )}

      {goals.map(goal => (
        <Card key={goal.id} className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-4 px-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{goal.title}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] border-zinc-700">{goal.type}</Badge>
                  {goal.target_date && (
                    <span className="text-[10px] text-zinc-500">
                      bis {new Date(goal.target_date).toLocaleDateString('de-DE')}
                    </span>
                  )}
                </div>
              </div>
              <Badge className={`text-[10px] ${
                goal.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-0' :
                goal.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-0' :
                'bg-zinc-800 text-zinc-500 border-0'
              }`}>
                {goal.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
