import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import { PageHead } from '../components/Bits.jsx'
import { calcRate, calcAmount, inr, today, fmtDateTime } from '../lib/util'

export default function Collection() {
  const { settings } = useAuth()
  const [farmers, setFarmers] = useState([])
  const [count, setCount] = useState(0)
  const [f, setF] = useState({
    farmer_id: '', collected_on: today(), shift: 'Morning', milk_type: 'Buffalo',
    litres: '', fat: '', snf: '', status: 'Pending',
  })
  const [manualRate, setManualRate] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const [a, b] = await Promise.all([
      supabase.from('farmers').select('id,name,farmer_code,milk_type').order('farmer_code'),
      supabase.from('collections').select('id', { count: 'exact', head: true }),
    ])
    setFarmers(a.data || []); setCount(b.count || 0)
  }
  useEffect(() => { load() }, [])

  const pick = (id) => {
    const fm = farmers.find((x) => x.id === id)
    setF((p) => ({ ...p, farmer_id: id, milk_type: fm && fm.milk_type !== 'Mixed' ? fm.milk_type : p.milk_type }))
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const auto = calcRate(f.fat, f.snf, settings)
  const rate = manualRate !== '' ? Number(manualRate) : auto
  const amount = calcAmount(f.litres, rate)

  const save = async (e) => {
    e.preventDefault(); setMsg(''); setBusy(true)
    const { error } = await supabase.from('collections').insert({
      farmer_id: f.farmer_id,
      collected_on: f.collected_on,
      collected_at: new Date().toISOString(),
      shift: f.shift,
      milk_type: f.milk_type,
      litres: Number(f.litres),
      fat: Number(f.fat),
      snf: Number(f.snf),
      rate,
      amount,
      status: f.status,
    })
    setBusy(false)
    if (error) return setMsg(error.message)
    setMsg('Record saved.')
    setF({ ...f, litres: '', fat: '', snf: '' }); setManualRate(''); load()
  }

  const Toggle = ({ k, opts, cls }) => (
    <div className="toggle">
      {opts.map((o) => (
        <button type="button" key={o} className={f[k] === o ? 'on ' + (cls?.[o] || '') : ''} onClick={() => setF({ ...f, [k]: o })}>{o}</button>
      ))}
    </div>
  )

  return (
    <>
      <PageHead title="Milk collection entry" />
      <div className="two-col">
        <form className="card" onSubmit={save}>
          <div className="row-between"><h2>New milk collection</h2><span className="pill">Sample ID: S-{String(count + 1).padStart(3, '0')}</span></div>
          <div className="grid2">
            <label>Farmer
              <select required value={f.farmer_id} onChange={(e) => pick(e.target.value)}>
                <option value="">Select farmer…</option>
                {farmers.map((x) => <option key={x.id} value={x.id}>{x.farmer_code} · {x.name}</option>)}
              </select>
            </label>
            <label>Collection date<input type="date" required value={f.collected_on} onChange={set('collected_on')} /></label>
            <div><span className="lbl">Collection time</span><Toggle k="shift" opts={['Morning', 'Evening']} /></div>
            <label>Milk type<select value={f.milk_type} onChange={set('milk_type')}><option>Buffalo</option><option>Cow</option></select></label>
            <label>Quantity (litres)<input type="number" step="0.1" min="0.1" required value={f.litres} onChange={set('litres')} /></label>
            <label>Fat %<input type="number" step="0.1" min="0" required value={f.fat} onChange={set('fat')} /></label>
            <label>SNF %<input type="number" step="0.1" min="0" required value={f.snf} onChange={set('snf')} /></label>
            <label>Rate (₹ per litre)
              <input type="number" step="1" value={manualRate !== '' ? manualRate : auto || ''} onChange={(e) => setManualRate(e.target.value)} placeholder="auto" />
              <small className="muted">{manualRate === '' ? 'Auto-calculated' : <button type="button" className="link-btn" onClick={() => setManualRate('')}>Reset to auto</button>}</small>
            </label>
          </div>
          <span className="lbl">Payment status</span>
          <Toggle k="status" opts={['Pending', 'Paid']} cls={{ Pending: 'orange', Paid: 'greenb' }} />
          {msg && <p className="msg">{msg}</p>}
          <button className="btn blue wide" disabled={busy || !f.farmer_id}>{busy ? 'Saving…' : 'Save digital record'}</button>
        </form>

        <div className="side-stack">
          <div className="card summary">
            <small>PAYMENT SUMMARY</small>
            <p>{f.litres || 0} L × {inr(rate)} per litre</p>
            <div className="big">{inr(amount)}</div>
            <small>Rate = Fat % × ₹{settings.fat_rate} + SNF % × ₹{settings.snf_rate}<br />Amount = Quantity × Rate</small>
          </div>
          <div className="card scale">
            <div className="scale-art">⚖️🥛</div>
            <small>Digital weighing scale</small>
            <div className="small-meta">Recorded at: {fmtDateTime(new Date().toISOString())}</div>
          </div>
        </div>
      </div>
    </>
  )
}
