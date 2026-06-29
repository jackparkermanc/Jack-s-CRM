import { supabase, handleError, handleCors, logToDb } from './utils.js'

export default async function handler(req, res) {
  handleCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getContacts(req, res)
      case 'POST':
        return await createContact(req, res)
      case 'PUT':
        return await updateContact(req, res)
      case 'DELETE':
        return await deleteContact(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    return handleError(res, 500, error)
  }
}

async function getContacts(req, res) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return res.status(200).json(data || [])
}

async function createContact(req, res) {
  const { name, contact_info, last_notes } = req.body

  if (!name || !contact_info) {
    return res.status(400).json({ error: 'Name and contact_info are required' })
  }

  const cleanInfo = contact_info.replace(/\D/g, '')

  const { data, error } = await supabase
    .table('contacts')
    .insert({
      name,
      contact_info: cleanInfo,
      last_notes: last_notes || ''
    })
    .select()

  if (error) throw error
  logToDb('INFO', `Added contact: ${name}`)
  return res.status(201).json(data[0])
}

async function updateContact(req, res) {
  const { id, name, contact_info, last_notes } = req.body

  if (!id || !name || !contact_info) {
    return res.status(400).json({ error: 'id, name, and contact_info are required' })
  }

  const cleanInfo = contact_info.replace(/\D/g, '')

  const { data, error } = await supabase
    .from('contacts')
    .update({
      name,
      contact_info: cleanInfo,
      last_notes
    })
    .eq('id', id)
    .select()

  if (error) throw error
  logToDb('INFO', `Updated contact: ${name}`)
  return res.status(200).json(data[0])
}

async function deleteContact(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)

  if (error) throw error
  logToDb('INFO', `Deleted contact with id: ${id}`)
  return res.status(200).json({ success: true })
}
