import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function send(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').end(JSON.stringify(body))
}

export function adminClient() {
  if (!supabaseUrl || !serviceKey) throw new Error('Server Supabase configuration is missing')
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function authenticatedUser(req) {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '')
  if (!match || !supabaseUrl || !anonKey) return null
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await client.auth.getUser(match[1])
  return error ? null : data.user
}

export function hashKey(key) {
  return createHash('sha256').update(key).digest('hex')
}

export function newApiKey() {
  return `mm_${randomBytes(32).toString('base64url')}`
}
