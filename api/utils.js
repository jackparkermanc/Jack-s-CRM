import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function logToDb(level, message) {
  try {
    await supabase.table('app_logs').insert({
      source: 'Vercel_App',
      level,
      message
    })
  } catch (e) {
    console.error('Failed to log:', e)
  }
}

export const handleError = (response, status, error) => {
  logToDb('ERROR', error.message)
  return response.status(status).json({ error: error.message })
}

export const handleCors = (response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}
