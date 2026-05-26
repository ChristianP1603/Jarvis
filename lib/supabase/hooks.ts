'use client'

import { useEffect, useState } from 'react'
import { createClient } from './client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User, UserSettings } from '@/lib/utils/types'

export function useUser() {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
  const [appUser, setAppUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setAuthUser(user)

      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single()
        setAppUser(data)
      }
      setLoading(false)
    }

    load()
  }, [])

  return { authUser, appUser, loading }
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: appUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (appUser) {
        const { data } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', appUser.id)
          .single()
        setSettings(data)
      }
      setLoading(false)
    }

    load()
  }, [])

  return { settings, loading }
}
