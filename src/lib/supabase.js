import { createClient } from '@supabase/supabase-js'
import { demoDatabase, isDemoMode } from './demo.js'

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const isLocalhost = (hostname) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1'

let configurationError = ''
let supabaseUrl = configuredUrl

if (!configuredUrl || !anonKey) {
  configurationError = 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment, then redeploy.'
} else {
  try {
    const parsedUrl = new URL(configuredUrl)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      configurationError = 'VITE_SUPABASE_URL must use HTTP or HTTPS.'
    } else if (import.meta.env.PROD && isLocalhost(parsedUrl.hostname)) {
      configurationError = 'The deployed app is configured to use a local Supabase server. Set VITE_SUPABASE_URL to your hosted Supabase project URL and redeploy.'
    }
  } catch {
    configurationError = 'VITE_SUPABASE_URL is invalid. Set it to your hosted Supabase project URL.'
  }
}

const clientUrl = configurationError ? 'https://supabase-not-configured.invalid' : supabaseUrl
const realClient = createClient(clientUrl, anonKey || 'missing-supabase-anon-key')
export const supabaseConfigError = configurationError
export const supabase = {
  from: (table) => isDemoMode() ? demoDatabase.from(table) : realClient.from(table),
  auth: realClient.auth,
}
