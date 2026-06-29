import { supabase, handleError, handleCors, logToDb } from './utils.js'

export default async function handler(req, res) {
  handleCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getBookings(req, res)
      case 'POST':
        return await createBooking(req, res)
      case 'PUT':
        return await updateBooking(req, res)
      case 'DELETE':
        return await deleteBooking(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    return handleError(res, 500, error)
  }
}

async function getBookings(req, res) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      contacts(name),
      services(title, cost),
      booking_addons(addon_id, addons(id, name, cost))
    `)
    .order('booking_datetime', { ascending: false })

  if (error) throw error
  
  // Transform data to include addon_ids
  const transformedData = data.map(booking => ({
    ...booking,
    addon_ids: booking.booking_addons?.map(ba => ba.addon_id) || [],
    addons: booking.booking_addons?.map(ba => ba.addons) || []
  }))
  
  return res.status(200).json(transformedData || [])
}

async function createBooking(req, res) {
  const { contact_id, service_id, booking_datetime, hours, addon_ids = [] } = req.body

  if (!contact_id || !service_id || !booking_datetime) {
    return res.status(400).json({ error: 'contact_id, service_id, and booking_datetime are required' })
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      contact_id,
      service_id,
      booking_datetime,
      hours: parseFloat(hours) || 1
    })
    .select('*, contacts(name), services(title)')

  if (error) throw error

  // Add booking add-ons if any
  if (addon_ids.length > 0) {
    const addonRecords = addon_ids.map(addon_id => ({
      booking_id: data[0].id,
      addon_id
    }))
    await supabase.from('booking_addons').insert(addonRecords)
  }

  logToDb('INFO', `Scheduled booking for contact ${contact_id}`)
  return res.status(201).json(data[0])
}

async function updateBooking(req, res) {
  const { id, contact_id, service_id, booking_datetime, hours, addon_ids = [] } = req.body

  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({
      contact_id,
      service_id,
      booking_datetime,
      hours: parseFloat(hours) || 1
    })
    .eq('id', id)
    .select('*, contacts(name), services(title)')

  if (error) throw error

  // Update booking add-ons
  // First delete existing add-ons
  await supabase.from('booking_addons').delete().eq('booking_id', id)
  
  // Then insert new ones
  if (addon_ids.length > 0) {
    const addonRecords = addon_ids.map(addon_id => ({
      booking_id: id,
      addon_id
    }))
    await supabase.from('booking_addons').insert(addonRecords)
  }

  logToDb('INFO', `Updated booking with id: ${id}`)
  return res.status(200).json(data[0])
}

async function deleteBooking(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)

  if (error) throw error
  logToDb('INFO', `Deleted booking with id: ${id}`)
  return res.status(200).json({ success: true })
}
