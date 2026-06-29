import React, { useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import { format, parseISO } from 'date-fns'

function BookingDialog({ contacts, services, editingData, onSave, onClose }) {
  const [formData, setFormData] = useState({
    contact_id: editingData?.contact_id || (contacts[0]?.id || ''),
    service_id: editingData?.service_id || (services[0]?.id || ''),
    booking_date: editingData
      ? format(parseISO(editingData.booking_datetime), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    booking_time: editingData
      ? format(parseISO(editingData.booking_datetime), 'HH:mm')
      : '12:00'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const selectedService = services.find(s => s.id === parseInt(formData.service_id))
    if (!selectedService) {
      alert('Please select a service')
      return
    }

    const booking_datetime = `${formData.booking_date}T${formData.booking_time}:00Z`

    onSave({
      contact_id: parseInt(formData.contact_id),
      service_id: parseInt(formData.service_id),
      booking_datetime,
      hours: selectedService.duration
    })
  }

  const selectedService = services.find(s => s.id === parseInt(formData.service_id))

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex justify-between items-center border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold">
            {editingData ? '✏️ Edit Booking' : '➕ Schedule Booking'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">Contact *</label>
            <select
              name="contact_id"
              value={formData.contact_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            >
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">Service *</label>
            <select
              name="service_id"
              value={formData.service_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            >
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.title} ({service.duration} hrs)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">Date *</label>
            <input
              type="date"
              name="booking_date"
              value={formData.booking_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">Time (24hr) *</label>
            <input
              type="time"
              name="booking_time"
              value={formData.booking_time}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          {selectedService && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                ⏱️ <strong>Duration:</strong> {selectedService.duration} hours
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookingDialog
