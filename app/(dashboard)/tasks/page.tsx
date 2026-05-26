'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface Task {
  id: string
  title: string
  description: string | null
  priority: number
  due_date: string | null
  completed: boolean
  completed_at: string | null
  tags: string[]
  project: { id: string; name: string; color: string | null } | null
}

const PRIORITY_COLORS = {
  1: 'bg-red-500',
  2: 'bg-orange-400',
  3: 'bg-blue-400',
  4: 'bg-zinc-600',
} as const

const PRIORITY_LABELS = { 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4' }

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [view, setView] = useState('today')
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState(4)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/tasks?view=${view}`)
    if (res.ok) {
      const data = await res.json()
      setTasks(data.tasks || [])
    }
    setLoading(false)
  }, [view])

  useEffect(() => { setLoading(true); load() }, [load])

  const addTask = async () => {
    if (!newTitle.trim()) return
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), priority: newPriority }),
    })
    if (res.ok) {
      setNewTitle('')
      setNewPriority(4)
      setShowAdd(false)
      load()
    }
  }

  const toggleComplete = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    })
    load()
  }

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <div className="pt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}
          className="bg-white text-black hover:bg-zinc-200 text-xs">
          + Task
        </Button>
      </div>

      {/* Quick Add */}
      {showAdd && (
        <Card className="border-zinc-700 bg-zinc-900">
          <CardContent className="pt-4 pb-4 space-y-2">
            <Input className="bg-zinc-800 border-zinc-700" placeholder="Task eingeben..."
              value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              autoFocus />
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Priorität:</span>
              {([1, 2, 3, 4] as const).map(p => (
                <button key={p} onClick={() => setNewPriority(p)}
                  className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                    newPriority === p ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                  P{p}
                </button>
              ))}
              <div className="flex-1" />
              <Button size="sm" onClick={addTask} className="bg-white text-black hover:bg-zinc-200 text-xs">
                Hinzufügen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={view} onValueChange={setView}>
        <TabsList className="w-full bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="today" className="flex-1 text-xs">Heute</TabsTrigger>
          <TabsTrigger value="inbox" className="flex-1 text-xs">Inbox</TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1 text-xs">Demnächst</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 text-xs">Erledigt</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tasks */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-zinc-800 rounded animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-zinc-500 text-sm">
              {view === 'today' ? 'Keine Tasks für heute.' :
               view === 'inbox' ? 'Inbox leer.' :
               view === 'upcoming' ? 'Nichts geplant.' :
               'Noch nichts erledigt.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {tasks.map(task => (
            <Card key={task.id} className="border-zinc-800 bg-zinc-900">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <button onClick={() => toggleComplete(task)}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      task.completed ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-600 hover:border-zinc-400'
                    }`}>
                    {task.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.completed ? 'text-zinc-500 line-through' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.due_date && (
                        <span className={`text-[10px] ${
                          !task.completed && task.due_date <= new Date().toISOString().split('T')[0]
                            ? 'text-red-400' : 'text-zinc-600'
                        }`}>
                          {new Date(task.due_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {task.project && (
                        <span className="text-[10px] text-zinc-600">{task.project.name}</span>
                      )}
                    </div>
                  </div>

                  {/* Priority dot */}
                  <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || 'bg-zinc-600'}`} />

                  {/* Delete */}
                  {task.completed && (
                    <button onClick={() => deleteTask(task.id)} className="text-zinc-600 hover:text-zinc-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
