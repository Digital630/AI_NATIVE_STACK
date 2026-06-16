import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useSubscription } from './useSubscription'

const ANON_KEY = 'agrismes_anon_runs'
const FREE_LIMIT = 5
const ANON_LIMIT = 1

export function useUsage(session: Session | null) {
  const [runCount, setRunCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const subscription = useSubscription(session)
  const plan = subscription.isPro ? subscription.plan : 'free'

  const currentMonth = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    async function loadUsage() {
      if (!session) return
      const userId = session.user.id

      const usageRes = await supabase
        .from('user_usage')
        .select('run_count')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .single()

      setRunCount(usageRes.data?.run_count || 0)
      setLoading(false)
    }

    if (!session) {
      const anon = parseInt(localStorage.getItem(ANON_KEY) || '0')
      setRunCount(anon)
      setLoading(false)
      return
    }
    loadUsage()
  }, [session, currentMonth])

  async function incrementRun() {
    if (!session) {
      const newCount = parseInt(localStorage.getItem(ANON_KEY) || '0') + 1
      localStorage.setItem(ANON_KEY, String(newCount))
      setRunCount(newCount)
      return
    }

    const userId = session.user.id
    await supabase.from('user_usage').upsert({
      user_id: userId,
      month: currentMonth,
      run_count: runCount + 1
    }, { onConflict: 'user_id,month' })

    setRunCount(c => c + 1)
  }

  function canRun(): boolean {
    if (subscription.isPro) return true
    if (!session) return runCount < ANON_LIMIT
    return runCount < FREE_LIMIT
  }

  function getLimit() {
    if (!session) return ANON_LIMIT
    if (subscription.isPro) return Infinity
    return FREE_LIMIT
  }

  function needsAuth(): boolean {
    return !session && runCount >= ANON_LIMIT
  }

  function needsUpgrade(): boolean {
    return !!session && !subscription.isPro && runCount >= FREE_LIMIT
  }

  return {
    runCount,
    plan,
    loading: loading || subscription.isLoading,
    subscription,
    canRun,
    getLimit,
    needsAuth,
    needsUpgrade,
    incrementRun,
  }
}
