'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function GeneratePlanButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const generate = async () => {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/training/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: false }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Fehler beim Generieren')
      return
    }

    router.refresh()
  }

  return (
    <div>
      <Button onClick={generate} disabled={loading} className="bg-white text-black hover:bg-zinc-200">
        {loading ? 'Generiere...' : 'Wochenplan generieren'}
      </Button>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  )
}
