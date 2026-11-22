import { adminClient, hashKey, send } from './_lib/device-api.js'

const limits = {
  weight_kg: [0, 100000],
  turbidity_ntu: [0, 100000],
  temperature_c: [-20, 100],
  fat_percent: [0, 100],
  snf_percent: [0, 100],
  ph: [0, 14],
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return send(res, 405, { error: 'Method not allowed' })
  }
  const rawKey = req.headers['x-api-key'] || /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '')?.[1]
  if (typeof rawKey !== 'string' || rawKey.length < 20 || rawKey.length > 128) {
    return send(res, 401, { error: 'Valid API key required in X-API-Key header' })
  }
  const bodyLength = Number(req.headers['content-length'] || 0)
  if (bodyLength > 4096) return send(res, 413, { error: 'Request body too large' })
  const body = req.body
  if (!body || typeof body !== 'object' || Array.isArray(body)) return send(res, 400, { error: 'JSON object required' })

  const values = {}
  for (const [field, [min, max]] of Object.entries(limits)) {
    const value = body[field]
    if (value === undefined || value === null || value === '') continue
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
      return send(res, 400, { error: `${field} must be a number from ${min} to ${max}` })
    }
    values[field] = value
  }
  if (Object.keys(values).length === 0) return send(res, 400, { error: 'Include at least one measurement' })
  if (body.milk_type !== undefined && !['Cow', 'Buffalo', 'Mixed'].includes(body.milk_type)) {
    return send(res, 400, { error: 'milk_type must be Cow, Buffalo, or Mixed' })
  }
  if (body.device_id !== undefined && (typeof body.device_id !== 'string' || body.device_id.length > 80)) {
    return send(res, 400, { error: 'device_id must be a string of at most 80 characters' })
  }
  if (body.measured_at !== undefined && (typeof body.measured_at !== 'string' || !Number.isFinite(Date.parse(body.measured_at)))) {
    return send(res, 400, { error: 'measured_at must be a valid ISO date-time' })
  }

  try {
    const db = adminClient()
    const { data: credential, error: authError } = await db.from('api_device_credentials')
      .select('device_id, api_devices!inner(id, owner_id, revoked_at)')
      .eq('key_hash', hashKey(rawKey)).is('revoked_at', null).maybeSingle()
    if (authError) throw authError
    const device = credential?.api_devices
    if (!credential || !device || device.revoked_at) return send(res, 401, { error: 'API key is invalid or revoked' })

    const record = {
      owner_id: device.owner_id,
      device_id: credential.device_id,
      device_label: typeof body.device_id === 'string' ? body.device_id : null,
      milk_type: body.milk_type || null,
      measured_at: body.measured_at || new Date().toISOString(),
      ...values,
    }
    const { data, error } = await db.from('milk_device_readings')
      .insert(record).select('id, measured_at').single()
    if (error) throw error
    await db.from('api_devices').update({ last_seen_at: new Date().toISOString() }).eq('id', credential.device_id)
    return send(res, 201, { ok: true, id: data.id, measured_at: data.measured_at })
  } catch (error) {
    console.error('Milk reading API error:', error.message)
    return send(res, 500, { error: 'Could not save reading' })
  }
}
