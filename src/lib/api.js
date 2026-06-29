import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const contactsAPI = {
  getAll: () => api.get('/contacts'),
  create: (data) => api.post('/contacts', data),
  update: (data) => api.put('/contacts', data),
  delete: (id) => api.delete(`/contacts?id=${id}`)
}

export const servicesAPI = {
  getAll: () => api.get('/services'),
  create: (data) => api.post('/services', data),
  update: (data) => api.put('/services', data),
  delete: (id) => api.delete(`/services?id=${id}`)
}

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (data) => api.put('/categories', data),
  delete: (id) => api.delete(`/categories?id=${id}`)
}

export const bookingsAPI = {
  getAll: () => api.get('/bookings'),
  create: (data) => api.post('/bookings', data),
  update: (data) => api.put('/bookings', data),
  delete: (id) => api.delete(`/bookings?id=${id}`)
}

export const messagesAPI = {
  getAll: (contactInfo) => api.get('/messages', { params: { contact_info: contactInfo } }),
  create: (data) => api.post('/messages', data)
}

export const logsAPI = {
  getAll: () => api.get('/logs'),
  clear: () => api.delete('/logs')
}

export const callsAPI = {
  sendLink: (data) => api.post('/calls', data)
}

export default api
