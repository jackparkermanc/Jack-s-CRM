import React, { useState, useEffect } from 'react'
import { FaTimes, FaCheck } from 'react-icons/fa'
import { format, parseISO } from 'date-fns'
import { addonsAPI } from '../../lib/api'

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

  const [availableAddons, setAvailableAddons] = useState([])
  const [selectedAddons, setSelectedAddons] = useState(editingData?.addon_ids || [])

  useEffect(() => {
    if (formData.service_id) {
      fetchAddons(formData.service_id)
    }
  }, [formData.service_id])

  const fetchAddons = async (serviceId) => {
    try {
      const res = await addonsAPI.getAll(serviceId)
      setAvailableAddons(res.data || [])
    } catch (error) {
      console.error('Failed to fetch add-ons:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleAddon = (addonId) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    )
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
      hours: selectedService.duration,
      addon_ids: selectedAddons
    })
  }

  const selectedService = services.find(s => s.id === parseInt(formData.service_id))
  const totalAddonCost = selectedAddons.reduce((sum, addonId) => {
    const addon = availableAddons.find(a => a.id === addonId)
    return sum + (addon?.cost || 0)
  }, 0)

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
              <p className="text-sm text-gray-700 mt-1">
                💷 <strong>Base Cost:</strong> £{selectedService.cost}
              </p>
            </div>
          )}

          {availableAddons.length > 0 && (
            <div className="border-t border-gray-300 pt-4">
              <h3 className="font-semibold text-gray-700 mb-3">➕ Add-Ons</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableAddons.map(addon => (
                  <label key={addon.id} className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedAddons.includes(addon.id)}
                      onChange={() => toggleAddon(addon.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 flex-1 text-sm">
                      <strong>{addon.name}</strong> <span className="text-gray-600">+£{addon.cost}</span>
                    </span>
                    {selectedAddons.includes(addon.id) && (
                      <FaCheck className="text-green-600 text-sm" />
                    )}
                  </label>
                ))}
              </div>
              {selectedAddons.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm">
                    <strong>Add-Ons Total:</strong> £{totalAddonCost}
                  </p>
                </div>
              )}
            </div>
          )}

          {availableAddons.length === 0 && selectedService && (
            <p className="text-xs text-gray-500 italic">No add-ons available for this service</p>
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
