import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import { inr, today } from '../lib/util'
import Logo from '../components/Logo.jsx'

const features = [
  ['⚖', 'Measure', 'Record each milk collection digitally with accurate quantity tracking.'],
  ['▣', 'Identify', 'Give every farmer a unique ID and QR code for quick identification.'],
  ['⚗', 'Track quality', 'Record fat and SNF values and calculate rates consistently.'],
  ['₹', 'Manage payments', 'See pending dues and keep payment records in one place.'],
]

const steps = [
  ['01', 'Register farmers', 'Create farmer profiles and assign unique IDs with QR codes.'],
  ['02', 'Record collections', 'Enter milk quantity and quality; the amount is calculated automatically.'],
  ['03', 'Track and pay', 'Review collection history, pending balances, and completed payments.'],
]

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
    <div className="home" id="home">
      <header className="topbar">
        <a className="home-brand" href="#home" aria-label="MilkMitra home"><Logo size={52} /></a>
        <nav aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <Link to={session ? '/farmers' : '/login'}>Farmers</Link>
          <Link to={session ? '/records' : '/login'}>Records</Link>
        </nav>
        <Link className="btn green" to={go}>{session ? 'Open dashboard' : 'Get Started'}</Link>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-text">
            <span className="hero-eyebrow">A simpler way to manage your dairy centre</span>
            <h1 id="hero-title">Smart milk collection,<br /><em>fair payment</em><br />for every farmer</h1>
            <p>MilkMitra helps you identify farmers, record milk quality, calculate payments, and keep your collection centre organized.</p>
            <ul className="ticks">
              <li>Digital milk weighing</li><li>QR farmer ID</li>
              <li>Quality recording</li><li>Automatic payment</li>
            </ul>
            <div className="hero-btns">
              <Link className="btn black" to={go}>Open dashboard</Link>
              <a className="btn outline" href="#how-it-works">How it works</a>
            </div>
          </div>
          <div className="hero-img" aria-hidden="true"><span>🐄</span><span>🥛</span></div>
        </section>

        <section className="live card" aria-label="Collection centre summary">
          <small>Live from the collection centre</small>
          <div className="live-row">
            <div><b>{s ? s.farmers : '—'}</b><span>Farmers</span></div>
            <div><b>{s ? `${s.litres} L` : '—'}</b><span>Today's milk</span></div>
            <div><b>{s ? inr(s.pending) : '—'}</b><span>Pending payments</span></div>
          </div>
          {!session && <small>Log in to see your centre's numbers.</small>}
        </section>

        <section id="features" className="home-section features-section" aria-labelledby="features-title">
          <div className="section-heading">
            <span className="section-kicker">Everything in one place</span>
            <h2 id="features-title">Made for your collection centre</h2>
            <p>Spend less time on paperwork and keep every collection and payment easy to find.</p>
          </div>
          <div className="feature-grid">
            {features.map(([icon, title, description]) => (
              <article key={title} className="feature-card">
                <span className="circle" aria-hidden="true">{icon}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="home-section steps-section" aria-labelledby="steps-title">
          <div className="section-heading">
            <span className="section-kicker">A straightforward workflow</span>
            <h2 id="steps-title">From collection to payment</h2>
            <p>Three simple steps keep your daily dairy operations organized.</p>
          </div>
          <div className="steps-grid">
            {steps.map(([number, title, description]) => (
              <article key={number} className="step-card">
                <span className="step-number">{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-cta" aria-labelledby="cta-title">
          <div>
            <span className="section-kicker">Get started with MilkMitra</span>
            <h2 id="cta-title">Bring your collection records together.</h2>
            <p>Manage farmers, daily collections, and payments from one dashboard.</p>
          </div>
          <Link className="btn green" to={go}>{session ? 'Go to dashboard' : 'Get started'}</Link>
        </section>
      </main>

      <footer className="home-footer">
        <a href="#home" aria-label="Back to top"><Logo size={42} /></a>
        <span>MilkMitra · Smart milk collection, fair payment.</span>
        <a href="#home">Back to top ↑</a>
      </footer>
    </div>
  )
}
