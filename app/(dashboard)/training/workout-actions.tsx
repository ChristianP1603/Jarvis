'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface WorkoutActionsProps {
  workoutId: string
  completed: boolean
  skipped: boolean
}

export function WorkoutActions({ workoutId, completed, skipped }: WorkoutActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const action = async (actionType: 'complete' | 'skip' | 'undo') => {
    setLoading(true)
    await fetch(`/api/training/workout/${workoutId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionType }),
    })
    router.refresh()
    setLoading(false)
  }

  if (loading) {
    return <div className="w-5 h-5 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
  }

  if (completed) {
    return (
      <button onClick={() => action('undo')} className="text-emerald-400 hover:text-emerald-300" title="Rückgängig">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </button>
    )
  }

  if (skipped) {
    return (
      <button onClick={() => action('undo')} className="text-zinc-500 hover:text-zinc-400 text-xs" title="Rückgängig">
        ↩
      </button>
    )
  }

  return (
    <div className="flex gap-1">
      <button onClick={() => action('complete')}
        className="w-6 h-6 rounded-full border-2 border-zinc-600 hover:border-emerald-400 flex items-center justify-center transition-colors"
        title="Erledigt">
      </button>
      <button onClick={() => action('skip')}
        className="text-zinc-600 hover:text-zinc-400 text-[10px]"
        title="Überspringen">
        skip
      </button>
    </div>
  )
}
