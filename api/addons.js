import { supabase, handleError, handleCors, logToDb } from './utils.js'

export default async function handler(req, res) {
  handleCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getAddons(req, res)
      case 'POST':
        return await createAddon(req, res)
      case 'PUT':
        return await updateAddon(req, res)
      case 'DELETE':
        return await deleteAddon(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    return handleError(res, 500, error)
  }
}

async function getAddons(req, res) {
  const { service_id } = req.query

  let query = supabase.from('addons').select('*')

  if (service_id) {
    query = query.eq('service_id', service_id)
  }

  const { data, error } = await query.order('name', { ascending: true })

  if (error) throw error
  return res.status(200).json(data || [])
}

async function createAddon(req, res) {
  const { service_id, name, cost } = req.body

  if (!service_id || !name) {
    return res.status(400).json({ error: 'service_id and name are required' })
  }

  const { data, error } = await supabase
    .from('addons')
    .insert({
      service_id,
      name,
      cost: parseFloat(cost) || 0
    })
    .select()

  if (error) throw error
  logToDb('INFO', `Added addon: ${name} to service`)
  return res.status(201).json(data[0])
}

async function updateAddon(req, res) {
  const { id, name, cost } = req.body

  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  const { data, error } = await supabase
    .from('addons')
    .update({
      name,
      cost: parseFloat(cost) || 0
    })
    .eq('id', id)
    .select()

  if (error) throw error
  logToDb('INFO', `Updated addon: ${name}`)
  return res.status(200).json(data[0])
}

async function deleteAddon(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  const { error } = await supabase
    .from('addons')
    .delete()
    .eq('id', id)

  if (error) throw error
  logToDb('INFO', `Deleted addon with id: ${id}`)
  return res.status(200).json({ success: true })
}
