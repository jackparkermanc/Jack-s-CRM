import axios from 'axios'
import { handleCors, logToDb, supabase } from './utils.js'

export default async function handler(req, res) {
  handleCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { contact_number, room_url } = req.body

    if (!contact_number || !room_url) {
      return res.status(400).json({ error: 'contact_number and room_url are required' })
    }

    const ultramsgInstance = process.env.VITE_ULTRAMSG_INSTANCE
    const ultramsgToken = process.env.VITE_ULTRAMSG_TOKEN

    if (!ultramsgInstance || !ultramsgToken) {
      return res.status(400).json({ error: 'UltraMsg credentials not configured' })
    }

    const cleanNumber = contact_number.replace(/\D/g, '')
    const message = `Please join my secure video call here: ${room_url}`

    // Send via UltraMsg API
    const ultramsgUrl = `https://api.ultramsg.com/${ultramsgInstance}/messages/chat`
    const response = await axios.post(ultramsgUrl, {
      token: ultramsgToken,
      to: `${cleanNumber}@c.us`,
      body: message
    })

    // Save message to database
    await supabase.from('messages').insert({
      contact_info: cleanNumber,
      direction: 'outbound',
      message_body: message,
      timestamp: new Date().toISOString()
    })

    logToDb('INFO', `Sent Jitsi link to ${cleanNumber}`)
    return res.status(200).json({ success: true, message: 'Call link sent' })
  } catch (error) {
    logToDb('ERROR', `Failed to send call link: ${error.message}`)
    return res.status(500).json({ error: error.message })
  }
}
