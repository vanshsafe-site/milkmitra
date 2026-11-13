import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, supabaseConfigError } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import Logo from '../components/Logo.jsx'

export default function Login() {
  const { enterDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  const startDemo = () => {
    enterDemo()
    nav('/dashboard')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (supabaseConfigError) return setMsg(supabaseConfigError)
    setBusy(true)
    setMsg('')
    try {
      const fn = mode === 'login' ? supabase.auth.signInWithPassword : supabase.auth.signUp
      const { data, error } = await fn.call(supabase.auth, { email, password })
      if (error) return setMsg(error.message)
      if (mode === 'signup' && !data.session) return setMsg('Account created. Check your email to confirm, then log in.')
      nav('/dashboard')
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Unable to connect to the authentication service.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <Link to="/"><Logo size={80} /></Link>
        <h2>{mode === 'login' ? 'Operator login' : 'Create operator account'}</h2>
        {supabaseConfigError && <p className="msg" role="alert">{supabaseConfigError}</p>}
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {msg && <p className="msg" role="alert">{msg}</p>}
        <button className="btn green" disabled={busy || Boolean(supabaseConfigError)}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</button>
        <button type="button" className="link-btn" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'New centre? Create an account' : 'Have an account? Log in'}
        </button>
        <div className="demo-login-divider"><span>or explore first</span></div>
        <button type="button" className="btn demo-btn" onClick={startDemo}>Explore the demo — no account needed</button>
        <small className="demo-note">Sample data is stored only in this browser and can be reset anytime.</small>
      </form>
    </div>
  )
}
