import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import { PageHead } from '../components/Bits.jsx'

export default function Settings() {
  const { settings, loadSettings } = useAuth()
  const [s, setS] = useState(settings)
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('settings').upsert({
      center_name: s.center_name, fat_rate: Number(s.fat_rate), snf_rate: Number(s.snf_rate),
    })
    if (error) return setMsg(error.message)
    await loadSettings(); setMsg('Settings saved.')
  }

  return (
    <>
      <PageHead title="Settings" />
      <form className="card narrow" onSubmit={save}>
        <label>Centre name<input value={s.center_name} onChange={set('center_name')} /></label>
        <label>Price per 1% fat (₹)<input type="number" step="0.1" value={s.fat_rate} onChange={set('fat_rate')} /></label>
        <label>Price per 1% SNF (₹)<input type="number" step="0.1" value={s.snf_rate} onChange={set('snf_rate')} /></label>
        <p className="muted">Rate per litre = Fat % × fat price + SNF % × SNF price. Applies to new entries only.</p>
        {msg && <p className="msg">{msg}</p>}
        <button className="btn green">Save changes</button>
      </form>
    </>
  )
}
