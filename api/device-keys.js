import { adminClient, authenticatedUser, newApiKey, send, hashKey } from './_lib/device-api.js'

export default async function handler(req, res) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, DELETE')
    return send(res, 405, { error: 'Method not allowed' })
  }
  const user = await authenticatedUser(req)
  if (!user) return send(res, 401, { error: 'Sign in required' })

  try {
    const db = adminClient()
    if (req.method === 'GET') {
      const { data, error } = await db.from('api_devices')
        .select('id, name, created_at, last_seen_at, revoked_at')
        .eq('owner_id', user.id).order('created_at', { ascending: false })
      if (error) throw error
      return send(res, 200, { devices: data })
    }

    if (req.method === 'POST') {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 60) : ''
      if (!name) return send(res, 400, { error: 'Device name is required' })
      const key = newApiKey()
      const { data: device, error: deviceError } = await db.from('api_devices')
        .insert({ owner_id: user.id, name }).select('id, name, created_at').single()
      if (deviceError) throw deviceError
      const { error: keyError } = await db.from('api_device_credentials').insert({
        device_id: device.id,
        key_hash: hashKey(key),
      })
      if (keyError) {
        await db.from('api_devices').delete().eq('id', device.id).eq('owner_id', user.id)
        throw keyError
      }
      return send(res, 201, { device, api_key: key, api_url: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/milk-readings` })
    }

    const deviceId = typeof req.body?.device_id === 'string' ? req.body.device_id : ''
    if (!/^[0-9a-f-]{36}$/i.test(deviceId)) return send(res, 400, { error: 'Valid device_id is required' })
    const { data: device, error: findError } = await db.from('api_devices')
      .select('id').eq('id', deviceId).eq('owner_id', user.id).maybeSingle()
    if (findError) throw findError
    if (!device) return send(res, 404, { error: 'Device not found' })
    const { error: revokeError } = await db.from('api_device_credentials')
      .update({ revoked_at: new Date().toISOString() }).eq('device_id', deviceId).is('revoked_at', null)
    if (revokeError) throw revokeError
    const { error: deviceError } = await db.from('api_devices')
      .update({ revoked_at: new Date().toISOString() }).eq('id', deviceId).eq('owner_id', user.id)
    if (deviceError) throw deviceError
    return send(res, 200, { ok: true })
  } catch (error) {
    console.error('Device API error:', error.message)
    return send(res, 500, { error: 'Device API request failed' })
  }
}
