import { supabase, handleError, handleCors, logToDb } from './utils.js'

export default async function handler(req, res) {
  handleCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getCategories(req, res)
      case 'POST':
        return await createCategory(req, res)
      case 'PUT':
        return await updateCategory(req, res)
      case 'DELETE':
        return await deleteCategory(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    return handleError(res, 500, error)
  }
}

async function getCategories(req, res) {
  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return res.status(200).json(data || [])
}

async function createCategory(req, res) {
  const { name, parent_id } = req.body

  if (!name) {
    return res.status(400).json({ error: 'name is required' })
  }

  const { data, error } = await supabase
    .from('service_categories')
    .insert({
      name,
      parent_id: parent_id || null
    })
    .select()

  if (error) throw error
  logToDb('INFO', `Added category: ${name}`)
  return res.status(201).json(data[0])
}

async function updateCategory(req, res) {
  const { id, name } = req.body

  if (!id || !name) {
    return res.status(400).json({ error: 'id and name are required' })
  }

  const { data, error } = await supabase
    .from('service_categories')
    .update({ name })
    .eq('id', id)
    .select()

  if (error) throw error
  logToDb('INFO', `Updated category: ${name}`)
  return res.status(200).json(data[0])
}

async function deleteCategory(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  const { error } = await supabase
    .from('service_categories')
    .delete()
    .eq('id', id)

  if (error) throw error
  logToDb('INFO', `Deleted category with id: ${id}`)
  return res.status(200).json({ success: true })
}
