import { supabase, handleError, handleCors, logToDb } from './utils.js'

export default async function handler(req, res) {
  handleCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getMessages(req, res)
      case 'POST':
        return await createMessage(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    return handleError(res, 500, error)
  }
}

async function getMessages(req, res) {
  const { contact_info } = req.query

  let query = supabase
    .from('messages')
    .select('*')
    .order('timestamp', { ascending: true })

  if (contact_info) {
    query = query.eq('contact_info', contact_info)
  }

  const { data, error } = await query

  if (error) throw error
  return res.status(200).json(data || [])
}

async function createMessage(req, res) {
  const { contact_info, direction, message_body } = req.body

  if (!contact_info || !direction || !message_body) {
    return res.status(400).json({ error: 'contact_info, direction, and message_body are required' })
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      contact_info,
      direction,
      message_body,
      timestamp: new Date().toISOString()
    })
    .select()

  if (error) throw error
  logToDb('INFO', `Message saved from ${contact_info}`)
  return res.status(201).json(data[0])
}
