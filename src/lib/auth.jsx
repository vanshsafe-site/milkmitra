import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [settings, setSettings] = useState({ center_name: 'MilkMitra', fat_rate: 7, snf_rate: 1.6 })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('*').maybeSingle()
    if (data) setSettings(data)
  }
  useEffect(() => { if (session) loadSettings() }, [session])

  return <Ctx.Provider value={{ session, settings, setSettings, loadSettings }}>{children}</Ctx.Provider>
}
