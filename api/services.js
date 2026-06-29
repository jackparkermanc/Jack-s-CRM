import { supabase, handleError, handleCors, logToDb } from './utils.js'

export default async function handler(req, res) {
  handleCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getServices(req, res)
      case 'POST':
        return await createService(req, res)
      case 'PUT':
        return await updateService(req, res)
      case 'DELETE':
        return await deleteService(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    return handleError(res, 500, error)
  }
}

async function getServices(req, res) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('title', { ascending: true })

  if (error) throw error
  return res.status(200).json(data || [])
}

async function createService(req, res) {
  const { category_id, title, duration, call_type, cost, additional_costs } = req.body

  if (!category_id || !title) {
    return res.status(400).json({ error: 'category_id and title are required' })
  }

  const { data, error } = await supabase
    .from('services')
    .insert({
      category_id,
      title,
      duration: parseFloat(duration) || 0.5,
      call_type,
      cost: parseFloat(cost) || 0,
      additional_costs: parseFloat(additional_costs) || 0
    })
    .select()

  if (error) throw error
  logToDb('INFO', `Added service: ${title}`)
  return res.status(201).json(data[0])
}

async function updateService(req, res) {
  const { id, category_id, title, duration, call_type, cost, additional_costs } = req.body

  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  const { data, error } = await supabase
    .from('services')
    .update({
      category_id,
      title,
      duration: parseFloat(duration) || 0.5,
      call_type,
      cost: parseFloat(cost) || 0,
      additional_costs: parseFloat(additional_costs) || 0
    })
    .eq('id', id)
    .select()

  if (error) throw error
  logToDb('INFO', `Updated service: ${title}`)
  return res.status(200).json(data[0])
}

async function deleteService(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) throw error
  logToDb('INFO', `Deleted service with id: ${id}`)
  return res.status(200).json({ success: true })
}
