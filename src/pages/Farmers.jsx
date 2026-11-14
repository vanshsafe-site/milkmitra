import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import { PageHead, Empty } from '../components/Bits.jsx'
import { fmtDateTime } from '../lib/util'

export default function Farmers() {
  const [form, setForm] = useState({
    name: '', father_name: '', mobile: '', village: '', district: '', milk_type: 'Buffalo', animals: 1, ifsc: '', bank_account: ''
  })
  const [list, setList] = useState([])
  const [sel, setSel] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const load = async () => {
    const { data } = await supabase.from('farmers').select('*').order('created_at', { ascending: false })
    setList(data || [])
    if (data?.length && !sel) setSel(data[0])
  }
  useEffect(() => { load() }, [])

  const register = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    const { data, error } = await supabase.from('farmers').insert({ ...form, animals: Number(form.animals) || 1 }).select().single()
    setBusy(false)
    if (error) return setErr(error.message)
    setSel(data); setForm({
      name: '', father_name: '', mobile: '', village: '', district: '', milk_type: 'Buffalo', animals: 1, ifsc: '', bank_account: ''
    }); load()
  }

  const remove = async (f) => {
    if (!confirm(`Delete ${f.name} and all their collection records?`)) return
    await supabase.from('farmers').delete().eq('id', f.id)
    if (sel?.id === f.id) setSel(null)
    load()
  }

  return (
    <>
      <PageHead title="Farmer registration" />
      <div className="two-col">
        <form className="card" onSubmit={register}>
          <h2>Register a new farmer</h2>
          <p className="muted">Fill in the details. A unique ID and QR code are created automatically.</p>
          <div className="grid2">
            <label>Farmer name<input required value={form.name} onChange={set('name')} /></label>
            <label>Father's name<input value={form.father_name} onChange={set('father_name')} /></label>
            <label>Mobile number<input value={form.mobile} onChange={set('mobile')} /></label>
            <label>Village<input value={form.village} onChange={set('village')} /></label>
            <label>District<input value={form.district} onChange={set('district')} /></label>
            <label>Milk type
              <select value={form.milk_type} onChange={set('milk_type')}>
                <option>Buffalo</option><option>Cow</option><option>Mixed</option>
              </select>
            </label>
            <label>Number of animals<input type="number" min="1" value={form.animals} onChange={set('animals')} /></label>
            <label>IFSC code<input value={form.ifsc} onChange={set('ifsc')} /></label>
            <label className="full">Bank account number<input value={form.bank_account} onChange={set('bank_account')} /></label>
          </div>
          <div className="pill">Bank account: securely stored (visible only to you)</div>
          {err && <p className="msg">{err}</p>}
          <button className="btn green wide" disabled={busy}>{busy ? 'Saving…' : 'Register and generate QR code'}</button>
        </form>

        <div className="card profile">
          <div className="profile-head"><span className="avatar big">👤</span><b>Farmer profile</b></div>
          {sel ? (
            <div className="profile-body">
              <h2>{sel.name}</h2>
              <span className="pill">ID: {sel.farmer_code}</span>
              <p>Father: {sel.father_name || '—'}<br />Mobile: {sel.mobile || '—'}<br />
                Village: {sel.village || '—'}, {sel.district || '—'}<br />
                Milk: {sel.milk_type} · {sel.animals} animals<br />
                Registered: {fmtDateTime(sel.created_at)}</p>
              <div className="qr"><QRCodeSVG value={sel.farmer_code} size={150} fgColor="#1f5a2c" /><small>Unique QR code</small></div>
            </div>
          ) : <Empty>Register your first farmer to see their profile and QR code.</Empty>}
        </div>
      </div>

      <div className="card">
        <h3>All farmers ({list.length})</h3>
        {list.length === 0 ? <Empty>No farmers registered yet.</Empty> : (
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Village</th><th>Milk</th><th>Mobile</th><th>Registered</th><th></th></tr></thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id} className="clickable" onClick={() => setSel(f)}>
                  <td>{f.farmer_code}</td><td>{f.name}</td><td>{f.village}</td><td>{f.milk_type}</td><td>{f.mobile}</td>
                  <td>{fmtDateTime(f.created_at)}</td>
                  <td><button className="link-btn danger" onClick={(e) => { e.stopPropagation(); remove(f) }}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
