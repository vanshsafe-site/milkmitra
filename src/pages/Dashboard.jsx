import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../lib/supabase'
import { PageHead, Badge, Empty } from '../components/Bits.jsx'
import { inr, fmtDateTime } from '../lib/util'

export default function Dashboard() {
  const [farmers, setFarmers] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const farmerRequest = supabase.from('farmers').select('id', { count: 'exact', head: true })
        let collectionRequest = supabase.from('collections').select('*, farmers(name)').order('collected_at', { ascending: false })
        let [farmerResult, collectionResult] = await Promise.all([farmerRequest, collectionRequest])

        // Older databases may not yet have the collected_at migration. Fall back to created_at.
        if (collectionResult.error && /collected_at/i.test(collectionResult.error.message || '')) {
          collectionResult = await supabase.from('collections').select('*, farmers(name)').order('created_at', { ascending: false })
        }
        if (farmerResult.error) throw farmerResult.error
        if (collectionResult.error) throw collectionResult.error
        if (!active) return

        setFarmers(farmerResult.count || 0)
        setRows(collectionResult.data || [])
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load dashboard data.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const todayRows = rows.filter((r) => r.collected_on === today)
  const todayL = todayRows.reduce((a, r) => a + Number(r.litres), 0)
  const avgFat = todayRows.length ? (todayRows.reduce((a, r) => a + Number(r.fat), 0) / todayRows.length).toFixed(1) : '0.0'
  const pending = rows.filter((r) => r.status === 'Pending').reduce((a, r) => a + Number(r.amount), 0)

  const days = [...Array(7)].map((_, i) => new Date(Date.now() - (6 - i) * 864e5).toISOString().slice(0, 10))
  const chart = days.map((d) => ({
    day: d.slice(5),
    Morning: rows.filter((r) => r.collected_on === d && r.shift === 'Morning').reduce((a, r) => a + Number(r.litres), 0),
    Evening: rows.filter((r) => r.collected_on === d && r.shift === 'Evening').reduce((a, r) => a + Number(r.litres), 0),
  }))
  const pie = [
    { name: 'Morning', value: chart.reduce((a, d) => a + d.Morning, 0) },
    { name: 'Evening', value: chart.reduce((a, d) => a + d.Evening, 0) },
  ]

  return (
    <>
      <PageHead title="Dashboard" />
      {error && <p className="msg" role="alert">Dashboard data could not be loaded: {error}</p>}
      {loading && <p className="muted" role="status">Loading dashboard…</p>}
      <div className="stats4">
        <div className="kpi"><span className="dot" style={{ background: '#2e7d3c' }}>👥</span><div><b>{farmers}</b><small>Total farmers</small></div></div>
        <div className="kpi"><span className="dot" style={{ background: '#3b82c4' }}>⚖</span><div><b>{todayL} L</b><small>Today's milk</small></div></div>
        <div className="kpi"><span className="dot" style={{ background: '#f0b84a' }}>⚗</span><div><b>{avgFat}%</b><small>Average fat</small></div></div>
        <div className="kpi"><span className="dot" style={{ background: '#e68a1e' }}>₹</span><div><b>{inr(pending)}</b><small>Pending payments</small></div></div>
      </div>

      <div className="charts">
        <div className="card">
          <h3>Daily milk collected (litres), last 7 days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chart}>
              <CartesianGrid vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="day" /><YAxis /><Tooltip /><Legend />
              <Bar dataKey="Morning" stackId="a" fill="#2e7d3c" />
              <Bar dataKey="Evening" stackId="a" fill="#3b82c4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Morning vs evening</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pie} dataKey="value" innerRadius={55} outerRadius={90}>
                <Cell fill="#2e7d3c" /><Cell fill="#3b82c4" />
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>Recent collections</h3>
        {rows.length === 0 ? <Empty>No collections yet. Add one from the Collection page.</Empty> : (
          <table>
            <thead><tr><th>Farmer</th><th>Time</th><th>Litres</th><th>Fat</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {rows.slice(0, 5).map((r) => (
                <tr key={r.id}>
                  <td>{r.farmers?.name}</td>
                  <td>{fmtDateTime(r.collected_at || r.created_at)}<br /><small>{r.shift}</small></td>
                  <td>{r.litres} L</td>
                  <td>{r.fat}%</td><td>{inr(r.amount)}</td><td><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
