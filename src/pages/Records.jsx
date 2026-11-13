import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PageHead, Badge, Stat, Empty } from '../components/Bits.jsx'
import { inr, fmtDay } from '../lib/util'

export default function Records() {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('All')
  const [q, setQ] = useState('')

  const load = async () => {
    const { data } = await supabase.from('collections').select('*, farmers(name,farmer_code)')
      .order('collected_on', { ascending: false }).order('created_at', { ascending: false })
    setRows(data || [])
  }
  useEffect(() => { load() }, [])

  const month = new Date().toISOString().slice(0, 7)
  const thisMonth = rows.filter((r) => r.collected_on.startsWith(month))
  const litres = thisMonth.reduce((a, r) => a + Number(r.litres), 0)
  const paid = rows.filter((r) => r.status === 'Paid').reduce((a, r) => a + Number(r.amount), 0)
  const pending = rows.filter((r) => r.status === 'Pending').reduce((a, r) => a + Number(r.amount), 0)

  const shown = rows.filter((r) =>
    (filter === 'All' || r.status === filter) &&
    (r.farmers?.name || '').toLowerCase().includes(q.toLowerCase()))

  const toggle = async (r) => {
    await supabase.from('collections').update({ status: r.status === 'Paid' ? 'Pending' : 'Paid' }).eq('id', r.id)
    load()
  }

  return (
    <>
      <PageHead title="Records and payments" />
      <div className="stats3">
        <Stat color="#3b82c4" label="This month" value={litres + ' L'} />
        <Stat color="#2e7d3c" label="Paid" value={inr(paid)} />
        <Stat color="#e68a1e" label="Pending" value={inr(pending)} />
      </div>
      <div className="toolbar">
        <div className="chips">
          {['All', 'Paid', 'Pending'].map((c) => (
            <button key={c} className={filter === c ? 'chip on' : 'chip'} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
        <input className="search" placeholder="Search farmer…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card table-wrap">
        {shown.length === 0 ? <Empty>No records match. Add a collection to get started.</Empty> : (
          <table className="zebra">
            <thead><tr><th>Date</th><th>Time</th><th>Farmer</th><th>Milk</th><th>Litres</th><th>Fat</th><th>Rate</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td>{fmtDay(r.collected_on)}</td><td>{r.shift}</td><td>{r.farmers?.name}</td><td>{r.milk_type}</td>
                  <td>{r.litres}</td><td>{r.fat}%</td><td>{inr(r.rate)}</td><td><b>{inr(r.amount)}</b></td>
                  <td><button className="plain" title="Click to toggle" onClick={() => toggle(r)}><Badge status={r.status} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
