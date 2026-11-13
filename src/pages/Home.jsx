import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import { inr, today } from '../lib/util'
import Logo from '../components/Logo.jsx'

export default function Home() {
  const { session } = useAuth()
  const [s, setS] = useState(null)

  useEffect(() => {
    if (!session) return setS(null)
    ;(async () => {
      const [f, c] = await Promise.all([
        supabase.from('farmers').select('id', { count: 'exact', head: true }),
        supabase.from('collections').select('litres,amount,status,collected_on'),
      ])
      const rows = c.data || []
      setS({
        farmers: f.count || 0,
        litres: rows.filter((r) => r.collected_on === today()).reduce((a, r) => a + Number(r.litres), 0),
        pending: rows.filter((r) => r.status === 'Pending').reduce((a, r) => a + Number(r.amount), 0),
      })
    })()
  }, [session])

  const go = session ? '/dashboard' : '/login'
  return (
    <div className="home">
      <header className="topbar">
        <Logo size={52} />
        <nav>
          <Link className="on" to="/">Home</Link>
          <a href="#features">Features</a>
          <Link to={go}>Dashboard</Link>
          <Link to={session ? '/farmers' : '/login'}>Farmers</Link>
          <Link to={session ? '/records' : '/login'}>Records</Link>
        </nav>
        <Link className="btn green" to={go}>Get Started</Link>
      </header>

      <section className="hero">
        <div className="hero-text">
          <h1>Smart milk collection,<br /><em>fair payment</em><br />for every farmer</h1>
          <p>MilkMitra weighs milk digitally, identifies each farmer with a QR code, records quality and calculates the payment automatically.</p>
          <ul className="ticks">
            <li>Digital milk weighing</li><li>QR farmer ID</li>
            <li>Quality recording</li><li>Automatic payment</li>
          </ul>
          <div className="hero-btns">
            <Link className="btn black" to={go}>Open dashboard</Link>
            <a className="btn outline" href="#features">How it works</a>
            <a className="btn outline" href="mailto:support@milkmitra.com">Help</a>
          </div>
        </div>
        <div className="hero-img" aria-hidden>🐄🥛</div>
      </section>

      <section className="live card">
        <small>Live from the collection centre</small>
        <div className="live-row">
          <div><b>{s ? s.farmers : '—'}</b><span>Farmers</span></div>
          <div><b>{s ? s.litres + ' L' : '—'}</b><span>Today's milk</span></div>
          <div><b>{s ? inr(s.pending) : '—'}</b><span>Pending payments</span></div>
        </div>
        {!session && <small>Log in to see your centre's numbers.</small>}
      </section>

      <section id="features" className="features">
        {[
          ['⚖', 'Measure', 'Digital weighing'],
          ['▣', 'Identify', 'QR farmer ID'],
          ['⚗', 'Record', 'Quality testing'],
          ['₹', 'Pay', 'Automatic payment'],
        ].map(([i, t, d]) => (
          <div key={t} className="feat"><span className="circle">{i}</span><div><b>{t}</b><br />{d}</div></div>
        ))}
      </section>
    </div>
  )
}
