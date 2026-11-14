import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import { PageHead, Empty } from '../components/Bits.jsx'
import { inr, fmtDateTime } from '../lib/util'

export default function Payments() {
  const { settings } = useAuth()
  const [rows, setRows] = useState([])

  const load = async () => {
    const { data } = await supabase.from('collections').select('*, farmers(id,name,farmer_code,ifsc,bank_account)').eq('status', 'Pending')
    setRows(data || [])
  }

  useEffect(() => { load() }, [])

  const groups = Object.values(rows.reduce((m, r) => {
    const k = r.farmer_id
    m[k] ??= { farmer: r.farmers, ids: [], litres: 0, amount: 0 }
    m[k].ids.push(r.id); m[k].litres += Number(r.litres); m[k].amount += Number(r.amount)
    return m
  }, {}))

  const settle = async (g) => {
    if (!confirm(`Mark ${inr(g.amount)} as paid to ${g.farmer.name}?`)) return
    await supabase.from('collections').update({ status: 'Paid' }).in('id', g.ids)
    load()
  }

  return (
    <>
      <PageHead title="Payments" />

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Centre payment details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 12 }}>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>UPI</div>
            <div style={{ marginTop: 8, fontWeight: 700 }}>{settings.payment_upi || 'Not added yet'}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>NEFT / Bank transfer</div>
            <div style={{ marginTop: 8, lineHeight: 1.7 }}>
              <div><b>{settings.bank_name || 'Bank name not set'}</b></div>
              <div>Account: {settings.account_holder || '—'}</div>
              <div>Number: {settings.bank_account || '—'}</div>
              <div>IFSC: {settings.ifsc_code || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Pending dues by farmer</h3>
        {groups.length === 0 ? <Empty>All farmers are paid up.</Empty> : (
          <table>
            <thead><tr><th>Farmer</th><th>ID</th><th>Entries</th><th>Litres</th><th>Bank</th><th>Due</th><th>Last collection</th><th></th></tr></thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.farmer.id}>
                  <td>{g.farmer.name}</td><td>{g.farmer.farmer_code}</td><td>{g.ids.length}</td><td>{g.litres} L</td>
                  <td>{g.farmer.bank_account ? '••••' + g.farmer.bank_account.slice(-4) : '—'} {g.farmer.ifsc}</td>
                  <td><b>{inr(g.amount)}</b></td>
                  <td>{fmtDateTime(rows.find((r) => r.farmer_id === g.farmer.id)?.collected_at || new Date())}</td>
                  <td><button className="btn green sm" onClick={() => settle(g)}>Mark paid</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
