'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'

const DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const
const DAY_LABELS: Record<string, string> = {
  MO: 'Mo', TU: 'Di', WE: 'Mi', TH: 'Do', FR: 'Fr', SA: 'Sa', SU: 'So',
}

interface FormState {
  name: string
  age: string
  weight_kg: string
  height_cm: string
  rest_hr: string
  max_hr: string
  telegram_chat_id: string
  strength_days: string[]
  strength_splits: Record<string, string>
  available_days: string[]
  long_session_day: string
  preferred_rest_day: string
  endurance_sessions_week: string
  double_sessions: boolean
  nutrition_goal: string
  morning_briefing_time: string
  evening_recap_time: string
}

export default function SettingsPage() {
  const [form, setForm] = useState<FormState>({
    name: '', age: '', weight_kg: '', height_cm: '',
    rest_hr: '50', max_hr: '190', telegram_chat_id: '',
    strength_days: ['MO', 'WE', 'FR'],
    strength_splits: { MO: 'Upper Body', WE: 'Lower Body', FR: 'Full Body' },
    available_days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
    long_session_day: 'SA', preferred_rest_day: 'SU',
    endurance_sessions_week: '4', double_sessions: false,
    nutrition_goal: 'maintain',
    morning_briefing_time: '07:00', evening_recap_time: '21:00',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/user/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.user && data.settings) {
          setForm({
            name: data.user.name || '',
            age: data.user.age?.toString() || '',
            weight_kg: data.user.weight_kg?.toString() || '',
            height_cm: data.user.height_cm?.toString() || '',
            rest_hr: data.user.rest_hr?.toString() || '50',
            max_hr: data.user.max_hr?.toString() || '190',
            telegram_chat_id: data.user.telegram_chat_id || '',
            strength_days: data.settings.strength_days || ['MO', 'WE', 'FR'],
            strength_splits: data.settings.strength_splits || {},
            available_days: data.settings.available_days || DAYS.slice(),
            long_session_day: data.settings.long_session_day || 'SA',
            preferred_rest_day: data.settings.preferred_rest_day || 'SU',
            endurance_sessions_week: data.settings.endurance_sessions_week?.toString() || '4',
            double_sessions: data.settings.double_sessions || false,
            nutrition_goal: data.settings.nutrition_goal || 'maintain',
            morning_briefing_time: data.settings.morning_briefing_time || '07:00',
            evening_recap_time: data.settings.evening_recap_time || '21:00',
          })
        }
      } else {
        // First time — create user & settings
        await fetch('/api/user/setup', { method: 'POST' })
      }
      setLoading(false)
    }
    load()
  }, [])

  const update = useCallback((key: keyof FormState, value: FormState[keyof FormState]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleDay = useCallback((key: 'strength_days' | 'available_days', day: string) => {
    setForm(prev => {
      const arr = prev[key]
      const next = arr.includes(day) ? arr.filter(d => d !== day) : [...arr, day]
      return { ...prev, [key]: next }
    })
  }, [])

  const save = async () => {
    setSaving(true)
    await fetch('/api/user/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: {
          name: form.name || null,
          age: form.age ? parseInt(form.age) : null,
          weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
          height_cm: form.height_cm ? parseInt(form.height_cm) : null,
          rest_hr: parseInt(form.rest_hr) || 50,
          max_hr: parseInt(form.max_hr) || 190,
          telegram_chat_id: form.telegram_chat_id || null,
        },
        settings: {
          strength_days: form.strength_days,
          strength_splits: form.strength_splits,
          available_days: form.available_days,
          long_session_day: form.long_session_day,
          preferred_rest_day: form.preferred_rest_day,
          endurance_sessions_week: parseInt(form.endurance_sessions_week) || 4,
          double_sessions: form.double_sessions,
          nutrition_goal: form.nutrition_goal,
          morning_briefing_time: form.morning_briefing_time,
          evening_recap_time: form.evening_recap_time,
        },
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse" />
        <div className="h-48 bg-zinc-800 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Personal Data */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Persönliche Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-zinc-400 text-xs">Name</Label>
            <Input className="bg-zinc-800 border-zinc-700 mt-1" value={form.name}
              onChange={e => update('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-zinc-400 text-xs">Alter</Label>
              <Input className="bg-zinc-800 border-zinc-700 mt-1" type="number"
                value={form.age} onChange={e => update('age', e.target.value)} />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Gewicht (kg)</Label>
              <Input className="bg-zinc-800 border-zinc-700 mt-1" type="number" step="0.1"
                value={form.weight_kg} onChange={e => update('weight_kg', e.target.value)} />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Größe (cm)</Label>
              <Input className="bg-zinc-800 border-zinc-700 mt-1" type="number"
                value={form.height_cm} onChange={e => update('height_cm', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-zinc-400 text-xs">Ruhe-HR</Label>
              <Input className="bg-zinc-800 border-zinc-700 mt-1" type="number"
                value={form.rest_hr} onChange={e => update('rest_hr', e.target.value)} />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Max-HR</Label>
              <Input className="bg-zinc-800 border-zinc-700 mt-1" type="number"
                value={form.max_hr} onChange={e => update('max_hr', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Preferences */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Training</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-zinc-400 text-xs mb-2 block">Verfügbare Tage</Label>
            <div className="flex gap-1">
              {DAYS.map(d => (
                <button key={d} onClick={() => toggleDay('available_days', d)}
                  className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                    form.available_days.includes(d) ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-zinc-400 text-xs mb-2 block">Kraft-Tage</Label>
            <div className="flex gap-1">
              {DAYS.map(d => (
                <button key={d} onClick={() => toggleDay('strength_days', d)}
                  className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                    form.strength_days.includes(d) ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {form.strength_days.length > 0 && (
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">Kraft-Splits</Label>
              {form.strength_days.map(d => (
                <div key={d} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 w-6">{DAY_LABELS[d]}</span>
                  <Input className="bg-zinc-800 border-zinc-700 text-sm" placeholder="z.B. Upper Body"
                    value={form.strength_splits[d] || ''}
                    onChange={e => update('strength_splits', { ...form.strength_splits, [d]: e.target.value })} />
                </div>
              ))}
            </div>
          )}

          <Separator className="bg-zinc-800" />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-zinc-400 text-xs">Ausdauer/Woche</Label>
              <Input className="bg-zinc-800 border-zinc-700 mt-1" type="number" min="1" max="7"
                value={form.endurance_sessions_week}
                onChange={e => update('endurance_sessions_week', e.target.value)} />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Long Session</Label>
              <select className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm"
                value={form.long_session_day} onChange={e => update('long_session_day', e.target.value)}>
                {DAYS.map(d => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-zinc-400 text-xs">Ruhetag</Label>
              <select className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm"
                value={form.preferred_rest_day} onChange={e => update('preferred_rest_day', e.target.value)}>
                {DAYS.map(d => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Ernährungsziel</Label>
              <select className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm"
                value={form.nutrition_goal} onChange={e => update('nutrition_goal', e.target.value)}>
                <option value="slight_cut">Leichtes Defizit</option>
                <option value="maintain">Halten</option>
                <option value="slight_bulk">Leichter Aufbau</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => update('double_sessions', !form.double_sessions)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                form.double_sessions ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                form.double_sessions ? 'translate-x-5.5' : 'translate-x-0.5'
              }`} />
            </button>
            <Label className="text-zinc-400 text-xs">Doppel-Sessions erlaubt</Label>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Benachrichtigungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-zinc-400 text-xs">Telegram Chat ID</Label>
            <Input className="bg-zinc-800 border-zinc-700 mt-1" placeholder="Deine Chat-ID"
              value={form.telegram_chat_id}
              onChange={e => update('telegram_chat_id', e.target.value)} />
            <p className="text-[10px] text-zinc-600 mt-1">Schick /start an deinen JARVIS Bot</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-zinc-400 text-xs">Morgen-Briefing</Label>
              <Input className="bg-zinc-800 border-zinc-700 mt-1" type="time"
                value={form.morning_briefing_time}
                onChange={e => update('morning_briefing_time', e.target.value)} />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Abend-Recap</Label>
              <Input className="bg-zinc-800 border-zinc-700 mt-1" type="time"
                value={form.evening_recap_time}
                onChange={e => update('evening_recap_time', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save + Logout */}
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving} className="flex-1 bg-white text-black hover:bg-zinc-200">
          {saving ? 'Speichern...' : saved ? 'Gespeichert' : 'Speichern'}
        </Button>
        <Button onClick={logout} variant="outline" className="border-zinc-700 text-zinc-400">
          Logout
        </Button>
      </div>
    </div>
  )
}
