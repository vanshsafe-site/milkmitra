import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, supabaseConfigError } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import Logo from '../components/Logo.jsx'

export default function Login() {
  const { enterDemo } = useAuth()
  const [authMethod, setAuthMethod] = useState('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  const startDemo = () => {
    enterDemo()
    nav('/dashboard')
  }

  const submitEmail = async (e) => {
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

  const submitPhone = async (e) => {
    e.preventDefault()
    if (supabaseConfigError) return setMsg(supabaseConfigError)
    if (!/^\+[1-9]\d{7,14}$/.test(phone.trim())) {
      setMsg('Enter your number with country code, for example +919876543210.')
      return
    }
    setBusy(true)
    setMsg('')
    try {
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() })
        if (error) return setMsg(error.message)
        setOtpSent(true)
        setMsg(`A one-time code was sent to ${phone.trim()}.`)
      } else {
        const { error } = await supabase.auth.verifyOtp({
          phone: phone.trim(),
          token: otp.trim(),
          type: 'sms',
        })
        if (error) return setMsg(error.message)
        nav('/dashboard')
      }
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Unable to connect to the authentication service.')
    } finally {
      setBusy(false)
    }
  }

  const changeAuthMethod = (method) => {
    setAuthMethod(method)
    setOtpSent(false)
    setOtp('')
    setMsg('')
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={authMethod === 'email' ? submitEmail : submitPhone}>
        <Link to="/"><Logo size={80} /></Link>
        <h2>{authMethod === 'phone' ? 'Mobile number login' : mode === 'login' ? 'Operator login' : 'Create operator account'}</h2>
        {supabaseConfigError && <p className="msg" role="alert">{supabaseConfigError}</p>}
        <div className="toggle" aria-label="Choose a login method">
          <button type="button" className={authMethod === 'email' ? 'on greenb' : ''} aria-pressed={authMethod === 'email'} onClick={() => changeAuthMethod('email')}>Email</button>
          <button type="button" className={authMethod === 'phone' ? 'on greenb' : ''} aria-pressed={authMethod === 'phone'} onClick={() => changeAuthMethod('phone')}>Mobile OTP</button>
        </div>
        {authMethod === 'email' ? (
          <>
            <label>Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            {msg && <p className="msg" role="alert">{msg}</p>}
            <button className="btn green" disabled={busy || Boolean(supabaseConfigError)}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</button>
            <button type="button" className="link-btn" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg('') }}>
              {mode === 'login' ? 'New centre? Create an account' : 'Have an account? Log in'}
            </button>
          </>
        ) : (
          <>
            <label>Mobile number
              <input
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+919876543210"
                aria-describedby="phone-hint"
                required
                value={phone}
                disabled={otpSent}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <small id="phone-hint" className="demo-note">Include your country code, e.g. +91 for India.</small>
            {otpSent && (
              <>
                <label>One-time password
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{4,8}"
                    maxLength={8}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </label>
                <button type="button" className="link-btn" disabled={busy} onClick={() => { setOtpSent(false); setOtp(''); setMsg('') }}>Use a different number</button>
              </>
            )}
            {msg && <p className="msg" role="status">{msg}</p>}
            <button className="btn green" disabled={busy || Boolean(supabaseConfigError)}>
              {busy ? 'Please wait…' : otpSent ? 'Verify and log in' : 'Send OTP'}
            </button>
            {otpSent && <button type="button" className="link-btn" disabled={busy} onClick={submitPhone}>Resend code</button>}
          </>
        )}
        <div className="demo-login-divider"><span>or explore first</span></div>
        <button type="button" className="btn demo-btn" onClick={startDemo}>Explore the demo — no account needed</button>
        <small className="demo-note">Sample data is stored only in this browser and can be reset anytime.</small>
      </form>
    </div>
  )
}
