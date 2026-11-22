import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import { PageHead } from '../components/Bits.jsx'
import './Device.css'

const endpoint = () => `${window.location.origin}/api/milk-readings`
const fmt = (value, digits = 2) => value == null ? '—' : Number(value).toFixed(digits)

export default function Device() {
  const { session, isDemo } = useAuth()
  const [devices, setDevices] = useState([])
  const [readings, setReadings] = useState([])
  const [name, setName] = useState('Milk analyser')
  const [newKey, setNewKey] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [deviceResult, readingResult] = await Promise.all([
      supabase.from('api_devices').select('id,name,created_at,last_seen_at,revoked_at').order('created_at', { ascending: false }),
      supabase.from('milk_device_readings').select('id,device_id,device_label,milk_type,weight_kg,turbidity_ntu,temperature_c,fat_percent,snf_percent,ph,measured_at').order('measured_at', { ascending: false }).limit(50),
    ])
    if (deviceResult.error || readingResult.error) {
      setMessage(deviceResult.error?.message || readingResult.error?.message || 'Could not load device data. Apply supabase/device-api.sql first.')
      return
    }
    setDevices(deviceResult.data || [])
    setReadings(readingResult.data || [])
  }, [])

  useEffect(() => { load() }, [load])

  const createKey = async (event) => {
    event.preventDefault()
    setMessage(''); setNewKey(''); setBusy(true)
    try {
      const response = await fetch('/api/device-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ name }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not create API key')
      setNewKey(result.api_key)
      setMessage('Copy the API key now. It will not be shown again.')
      await load()
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  const revoke = async (deviceId) => {
    if (!window.confirm('Revoke this device key? The ESP32 will no longer be able to upload readings.')) return
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/device-keys', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ device_id: deviceId }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not revoke key')
      setMessage('Device key revoked.')
      await load()
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setMessage('Copied to clipboard.') }
    catch { setMessage('Copy failed. Select and copy the value manually.') }
  }

  return <>
    <PageHead title="ESP32 milk analyser" />
    <section className="card">
      <h2>Connect a device</h2>
      <p className="muted">Create a private upload key for your ESP32. The key is shown once; keep it secret and revoke it if it is exposed.</p>
      {isDemo ? <p className="msg">Device API keys are unavailable in demo mode. Sign in to configure a real device.</p> : <form onSubmit={createKey} className="device-key-form">
        <label>Device name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required /></label>
        <button className="btn blue" disabled={busy}>{busy ? 'Working…' : 'Create device API key'}</button>
      </form>}
      {newKey && <div className="device-secret">
        <b>Copy this key now — it cannot be retrieved later</b>
        <code>{newKey}</code>
        <button className="btn blue sm" type="button" onClick={() => copy(newKey)}>Copy API key</button>
      </div>}
      <p className="device-endpoint"><b>Upload URL:</b> <code>{endpoint()}</code></p>
      <p className="muted">Send HTTPS POST with <code>X-API-Key: your-key</code> and a JSON body. Readings are saved separately from farmer payment collections.</p>
      {message && <p className="msg" role="status">{message}</p>}
    </section>

    <section className="card">
      <h2>Your devices</h2>
      {devices.length === 0 ? <p className="empty">No devices registered yet.</p> : <div className="table-wrap"><table className="zebra"><thead><tr><th>Device</th><th>Created</th><th>Last upload</th><th>Status</th><th /></tr></thead><tbody>
        {devices.map((device) => <tr key={device.id}><td>{device.name}</td><td>{new Date(device.created_at).toLocaleString()}</td><td>{device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Never'}</td><td>{device.revoked_at ? 'Revoked' : 'Active'}</td><td>{!device.revoked_at && !isDemo && <button className="link-btn danger" disabled={busy} onClick={() => revoke(device.id)}>Revoke key</button>}</td></tr>)}
      </tbody></table></div>}
    </section>

    <section className="card">
      <div className="row-between"><h2>Recent sensor readings</h2><button className="btn blue sm" onClick={load}>Refresh</button></div>
      {readings.length === 0 ? <p className="empty">No device readings received yet.</p> : <div className="table-wrap"><table className="zebra"><thead><tr><th>Time</th><th>Device</th><th>Milk</th><th>Weight kg</th><th>Turbidity NTU</th><th>Temp °C</th><th>Fat %</th><th>SNF %</th><th>pH</th></tr></thead><tbody>
        {readings.map((reading) => <tr key={reading.id}><td>{new Date(reading.measured_at).toLocaleString()}</td><td>{reading.device_label || devices.find((d) => d.id === reading.device_id)?.name || 'ESP32'}</td><td>{reading.milk_type || '—'}</td><td>{fmt(reading.weight_kg)}</td><td>{fmt(reading.turbidity_ntu)}</td><td>{fmt(reading.temperature_c)}</td><td>{fmt(reading.fat_percent)}</td><td>{fmt(reading.snf_percent)}</td><td>{fmt(reading.ph)}</td></tr>)}
      </tbody></table></div>}
    </section>
  </>
}
