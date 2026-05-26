'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import type { MealTemplate, MealLog, NutritionDaily } from '@/lib/utils/types'

export default function NutritionPage() {
  const [daily, setDaily] = useState<NutritionDaily | null>(null)
  const [meals, setMeals] = useState<MealLog[]>([])
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showManual, setShowManual] = useState(false)
  const [manual, setManual] = useState({ description: '', calories: '', carbs_g: '', protein_g: '', fat_g: '' })

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    const res = await fetch(`/api/nutrition/meals?date=${today}`)
    if (res.ok) {
      const data = await res.json()
      setMeals(data.meals || [])
      setTemplates(data.templates || [])
      setDaily(data.daily)
    }
    setLoading(false)
  }, [today])

  useEffect(() => { load() }, [load])

  const logMeal = async (meal: Partial<MealLog>) => {
    await fetch('/api/nutrition/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...meal, date: today }),
    })
    load()
  }

  const logTemplate = async (t: MealTemplate) => {
    await logMeal({
      description: t.name,
      calories: t.calories,
      carbs_g: t.carbs_g,
      protein_g: t.protein_g,
      fat_g: t.fat_g,
    })
  }

  const logManual = async () => {
    await logMeal({
      description: manual.description,
      calories: parseInt(manual.calories) || 0,
      carbs_g: parseInt(manual.carbs_g) || 0,
      protein_g: parseInt(manual.protein_g) || 0,
      fat_g: parseInt(manual.fat_g) || 0,
    })
    setManual({ description: '', calories: '', carbs_g: '', protein_g: '', fat_g: '' })
    setShowManual(false)
  }

  const addWater = async (amount: number) => {
    await fetch('/api/nutrition/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, date: today }),
    })
    load()
  }

  if (loading) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse mt-2" />
        <div className="h-32 bg-zinc-800 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <h1 className="text-2xl font-bold pt-2">Nutrition</h1>

      {/* Macro Overview */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="pt-4">
          <div className="grid grid-cols-4 gap-3 text-center">
            <MacroRing label="kcal" current={daily?.logged_calories || 0} target={daily?.target_calories || 0} />
            <MacroRing label="Carbs" current={daily?.logged_carbs_g || 0} target={daily?.target_carbs_g || 0} unit="g" />
            <MacroRing label="Protein" current={daily?.logged_protein_g || 0} target={daily?.target_protein_g || 0} unit="g" />
            <MacroRing label="Fett" current={daily?.logged_fat_g || 0} target={daily?.target_fat_g || 0} unit="g" />
          </div>
        </CardContent>
      </Card>

      {/* Water */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">Wasser</span>
            <Progress value={Math.min(((daily?.water_liters || 0) / 3.0) * 100, 100)} className="h-2 flex-1" />
            <span className="text-sm font-medium">{daily?.water_liters || 0}L</span>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="border-zinc-700 text-xs" onClick={() => addWater(0.25)}>+0.25L</Button>
            <Button size="sm" variant="outline" className="border-zinc-700 text-xs" onClick={() => addWater(0.5)}>+0.5L</Button>
            <Button size="sm" variant="outline" className="border-zinc-700 text-xs" onClick={() => addWater(1.0)}>+1.0L</Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add from Templates */}
      {templates.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 font-medium">Schnell loggen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <button key={t.id} onClick={() => logTemplate(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
                  {t.name} <span className="text-zinc-500">{t.calories}kcal</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Entry */}
      {showManual ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 font-medium">Mahlzeit eingeben</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input className="bg-zinc-800 border-zinc-700" placeholder="Beschreibung"
              value={manual.description} onChange={e => setManual(m => ({ ...m, description: e.target.value }))} />
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-[10px] text-zinc-500">kcal</Label>
                <Input className="bg-zinc-800 border-zinc-700" type="number"
                  value={manual.calories} onChange={e => setManual(m => ({ ...m, calories: e.target.value }))} />
              </div>
              <div>
                <Label className="text-[10px] text-zinc-500">Carbs g</Label>
                <Input className="bg-zinc-800 border-zinc-700" type="number"
                  value={manual.carbs_g} onChange={e => setManual(m => ({ ...m, carbs_g: e.target.value }))} />
              </div>
              <div>
                <Label className="text-[10px] text-zinc-500">Protein g</Label>
                <Input className="bg-zinc-800 border-zinc-700" type="number"
                  value={manual.protein_g} onChange={e => setManual(m => ({ ...m, protein_g: e.target.value }))} />
              </div>
              <div>
                <Label className="text-[10px] text-zinc-500">Fett g</Label>
                <Input className="bg-zinc-800 border-zinc-700" type="number"
                  value={manual.fat_g} onChange={e => setManual(m => ({ ...m, fat_g: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={logManual} className="bg-white text-black hover:bg-zinc-200">Speichern</Button>
              <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => setShowManual(false)}>Abbrechen</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" className="w-full border-zinc-800 text-zinc-400" onClick={() => setShowManual(true)}>
          + Mahlzeit loggen
        </Button>
      )}

      {/* Today's Meals */}
      {meals.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 font-medium">Heute gegessen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {meals.map(m => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300 truncate flex-1">{m.description || 'Mahlzeit'}</span>
                  <span className="text-zinc-500 text-xs ml-2">{m.calories}kcal</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MacroRing({ label, current, target, unit = '' }: {
  label: string; current: number; target: number; unit?: string
}) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
  return (
    <div>
      <div className="relative w-14 h-14 mx-auto">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#27272a" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none"
            stroke={pct >= 90 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#71717a'}
            strokeWidth="3" strokeDasharray={`${pct * 0.94} 100`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
          {Math.round(pct)}%
        </span>
      </div>
      <p className="text-[10px] text-zinc-500 mt-1">{current}/{target}{unit}</p>
      <p className="text-[10px] text-zinc-600">{label}</p>
    </div>
  )
}
