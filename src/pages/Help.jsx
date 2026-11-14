import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { PageHead } from '../components/Bits.jsx'

export default function Help() {
  const { settings } = useAuth()
  const nav = useNavigate()

  const cards = [
    { title: 'Customer care', value: settings.support_phone || '+91 90000 00000', note: 'Call for account and operation support.' },
    { title: 'Email support', value: settings.support_email || 'support@milkmitra.local', note: 'For account help, setup questions, and general assistance.' },
    { title: 'Grievance desk', value: settings.grievance_email || 'grievance@milkmitra.local', note: 'Report complaints, payment issues, or service concerns.' },
  ]

  return (
    <>
      <PageHead title="Help & support" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {cards.map((card) => (
          <div key={card.title} className="card">
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{card.title}</div>
            <div style={{ marginTop: 12, fontWeight: 700, fontSize: 18 }}>{card.value}</div>
            <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>{card.note}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Need help with payment or collection records?</h3>
        <p className="muted">Contact the support team for issues related to unpaid collections, payment confirmation, farmer records, or account settings.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
          <button className="btn green" onClick={() => nav('/payments')}>Open payments</button>
          <Link className="btn outline" to="/settings">Update support settings</Link>
        </div>
      </div>
    </>
  )
}
