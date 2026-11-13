import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { DEMO_MODE_KEY, isDemoMode } from './demo.js'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

const demoSession = {
  access_token: 'milkmitra-demo-session',
  user: { id: 'demo-owner', email: 'demo@milkmitra.local', user_metadata: { demo: true } },
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [isDemo, setIsDemo] = useState(false)
  const [settings, setSettings] = useState({ center_name: 'MilkMitra', fat_rate: 7, snf_rate: 1.6 })

  useEffect(() => {
    if (isDemoMode()) {
      setIsDemo(true)
      setSession(demoSession)
    } else {
      supabase.auth.getSession().then(({ data }) => setSession(data.session))
    }
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isDemoMode()) {
        setIsDemo(false)
        setSession(nextSession)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const enterDemo = () => {
    try { globalThis.localStorage?.setItem(DEMO_MODE_KEY, 'true') } catch { /* Demo is available until page reload. */ }
    setIsDemo(true)
    setSession(demoSession)
    setSettings({ center_name: 'MilkMitra Demo Centre', fat_rate: 7, snf_rate: 1.6 })
  }

  const exitDemo = () => {
    try { globalThis.localStorage?.removeItem(DEMO_MODE_KEY) } catch { /* Ignore storage restrictions. */ }
    setIsDemo(false)
    setSession(null)
    setSettings({ center_name: 'MilkMitra', fat_rate: 7, snf_rate: 1.6 })
  }

  const loadSettings = async () => {
    if (isDemo) {
      const { data } = await supabase.from('settings').select('*').maybeSingle()
      if (data) setSettings(data)
      return
    }
    const { data } = await supabase.from('settings').select('*').maybeSingle()
    if (data) setSettings(data)
  }
  useEffect(() => { if (session) loadSettings() }, [session, isDemo])

  return <Ctx.Provider value={{ session, settings, setSettings, loadSettings, isDemo, enterDemo, exitDemo }}>{children}</Ctx.Provider>
}
