import { supabase, handleCors, logToDb } from './utils.js'

export default async function handler(req, res) {
  handleCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const data = req.body

    if (data.event_type === 'message_received') {
      const msgData = data.data || {}
      const incomingMsg = msgData.body || ''
      const senderNumber = (msgData.from || '').replace('@c.us', '')

      if (!senderNumber || !incomingMsg) {
        return res.status(400).json({ error: 'Invalid message data' })
      }

      await supabase.from('messages').insert({
        contact_info: senderNumber,
        direction: 'inbound',
        message_body: incomingMsg,
        timestamp: new Date().toISOString()
      })

      logToDb('INFO', `Received message from ${senderNumber}`)
      return res.status(200).json({ success: true })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    logToDb('ERROR', `WhatsApp webhook error: ${error.message}`)
    return res.status(500).json({ error: error.message })
  }
}
