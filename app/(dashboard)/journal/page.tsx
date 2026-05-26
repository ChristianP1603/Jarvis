'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JOURNAL_FACTORS } from '@/lib/journal/factors'
import type { CorrelationInsight } from '@/lib/journal/correlations'

const CATEGORIES = [
  { key: 'substances', label: 'Substanzen' },
  { key: 'behavior', label: 'Verhalten' },
  { key: 'recovery', label: 'Recovery' },
  { key: 'nutrition', label: 'Ernährung' },
] as const

export default function JournalPage() {
  const [selected, setSelected] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [insights, setInsights] = useState<CorrelationInsight[]>([])

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/journal?date=${today}`)
      if (res.ok) {
        const { entry } = await res.json()
        if (entry) {
          setSelected(entry.factors || [])
          setNotes(entry.notes || '')
        }
      }
      setLoaded(true)
    }
    async function loadInsights() {
      const res = await fetch('/api/journal/correlations')
      if (res.ok) {
        const data = await res.json()
        setInsights(data.insights || [])
      }
    }
    load()
    loadInsights()
  }, [today])

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, factors: selected, notes: notes || null }),
    })
    setSaving(false)
    setSaved(true)
  }

  if (!loaded) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse mt-2" />
        <div className="h-48 bg-zinc-800 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Logbuch</h1>
        <p className="text-zinc-500 text-sm">
          {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {CATEGORIES.map(cat => {
        const factors = JOURNAL_FACTORS.filter(f => f.category === cat.key)
        return (
          <Card key={cat.key} className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400 font-medium">{cat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {factors.map(f => (
                  <button
                    key={f.id}
                    onClick={() => toggle(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selected.includes(f.id)
                        ? 'bg-white text-black'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {f.icon} {f.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Notes */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 font-medium">Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); setSaved(false) }}
            placeholder="Wie war der Tag? Optional..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm resize-none h-20 placeholder:text-zinc-600"
          />
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 font-medium">📊 Erkenntnisse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className={`text-xs px-3 py-2 rounded-lg ${
                insight.type === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                insight.type === 'negative' ? 'bg-red-500/10 text-red-400' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {insight.message}
              </div>
            ))}
            <p className="text-[10px] text-zinc-600 pt-1">Basierend auf deinen letzten 90 Tagen</p>
          </CardContent>
        </Card>
      )}

      <Button onClick={save} disabled={saving} className="w-full bg-white text-black hover:bg-zinc-200">
        {saving ? 'Speichern...' : saved ? 'Gespeichert' : 'Logbuch speichern'}
      </Button>
    </div>
  )
}
