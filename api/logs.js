import { supabase, handleError, handleCors, logToDb } from './utils.js'

export default async function handler(req, res) {
  handleCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getLogs(req, res)
      case 'DELETE':
        return await clearLogs(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    return handleError(res, 500, error)
  }
}

async function getLogs(req, res) {
  const { data, error } = await supabase
    .from('app_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return res.status(200).json(data || [])
}

async function clearLogs(req, res) {
  const { error } = await supabase
    .from('app_logs')
    .delete()
    .neq('id', 0)

  if (error) throw error
  logToDb('INFO', 'System logs cleared')
  return res.status(200).json({ success: true })
}
