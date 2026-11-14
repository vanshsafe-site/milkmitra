import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, supabaseConfigError } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import { useLanguage } from '../lib/language.jsx'
import Logo from '../components/Logo.jsx'

export default function Login() {
  const { enterDemo } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()
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
      if (mode === 'signup' && !data.session) return setMsg(t('Account created. Check your email to confirm, then log in.'))
      nav('/dashboard')
    } catch (error) {
      setMsg(error instanceof Error ? error.message : t('Unable to connect to the authentication service.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <div className="auth-language">
          <button type="button" className="language-switch" onClick={toggleLanguage} aria-label={language === 'en' ? 'Switch language to Hindi' : 'भाषा अंग्रेज़ी में बदलें'}>
            {language === 'en' ? 'हिन्दी' : 'English'}
          </button>
        </div>
        <Link to="/"><Logo size={80} /></Link>
        <h2>{t(mode === 'login' ? 'Operator login' : 'Create operator account')}</h2>
        {supabaseConfigError && <p className="msg" role="alert">{supabaseConfigError}</p>}
        <label>{t('Email')}<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>{t('Password')}<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {msg && <p className="msg" role="alert">{msg}</p>}
        <button className="btn green" disabled={busy || Boolean(supabaseConfigError)}>{busy ? t('Please wait…') : t(mode === 'login' ? 'Log in' : 'Sign up')}</button>
        <button type="button" className="link-btn" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg('') }}>
          {t(mode === 'login' ? 'New centre? Create an account' : 'Have an account? Log in')}
        </button>
        <div className="demo-login-divider"><span>{t('or explore first')}</span></div>
        <button type="button" className="btn demo-btn" onClick={startDemo}>{t('Explore the demo — no account needed')}</button>
        <small className="demo-note">{t('Sample data is stored only in this browser and can be reset anytime.')}</small>
      </form>
    </div>
  )
}
