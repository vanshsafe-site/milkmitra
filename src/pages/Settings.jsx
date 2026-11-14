import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import { PageHead } from '../components/Bits.jsx'

const defaultSettings = {
  center_name: 'MilkMitra',
  fat_rate: 7,
  snf_rate: 1.6,
  support_phone: '+91 90000 00000',
  support_email: 'support@milkmitra.local',
  grievance_email: 'grievance@milkmitra.local',
  payment_upi: 'milkmitra@upi',
  bank_name: 'MilkMitra Cooperative Bank',
  account_holder: 'MilkMitra Collection Centre',
  bank_account: '000000000000',
  ifsc_code: 'MILB0000001',
}

export default function Settings() {
  const { settings, loadSettings } = useAuth()
  const [s, setS] = useState({ ...defaultSettings, ...settings })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setS({ ...defaultSettings, ...settings })
  }, [settings])

  const set = (k) => (e) => setS({ ...s, [k]: e.target.value })

  const resetForm = () => {
    setS({ ...defaultSettings })
    setMsg('Form reset to default values.')
  }

  const save = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('settings').upsert({
      center_name: s.center_name,
      fat_rate: Number(s.fat_rate),
      snf_rate: Number(s.snf_rate),
      support_phone: s.support_phone,
      support_email: s.support_email,
      grievance_email: s.grievance_email,
      payment_upi: s.payment_upi,
      bank_name: s.bank_name,
      account_holder: s.account_holder,
      bank_account: s.bank_account,
      ifsc_code: s.ifsc_code,
    })
    if (error) return setMsg(error.message)
    await loadSettings(); setMsg('Settings saved.')
  }

  return (
    <>
      <PageHead title="Settings" />
      <form className="card narrow" onSubmit={save}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <label>Centre name<input value={s.center_name} onChange={set('center_name')} /></label>
            <label>Price per 1% fat (₹)<input type="number" step="0.1" value={s.fat_rate} onChange={set('fat_rate')} /></label>
            <label>Price per 1% SNF (₹)<input type="number" step="0.1" value={s.snf_rate} onChange={set('snf_rate')} /></label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <label>Support phone<input value={s.support_phone} onChange={set('support_phone')} /></label>
            <label>Support email<input type="email" value={s.support_email} onChange={set('support_email')} /></label>
            <label>Grievance email<input type="email" value={s.grievance_email} onChange={set('grievance_email')} /></label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <label>UPI ID<input value={s.payment_upi} onChange={set('payment_upi')} /></label>
            <label>Bank name<input value={s.bank_name} onChange={set('bank_name')} /></label>
            <label>Account holder<input value={s.account_holder} onChange={set('account_holder')} /></label>
            <label>Bank account number<input value={s.bank_account} onChange={set('bank_account')} /></label>
            <label>IFSC code<input value={s.ifsc_code} onChange={set('ifsc_code')} /></label>
          </div>
        </div>

        <p className="muted">Rate per litre = Fat % × fat price + SNF % × SNF price. Applies to new entries only.</p>
        {msg && <p className="msg">{msg}</p>}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn outline" onClick={resetForm}>Reset</button>
          <button className="btn green">Save changes</button>
        </div>
      </form>
    </>
  )
}
