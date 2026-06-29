import React, { useState } from 'react'
import { FaTimes } from 'react-icons/fa'

function AddOnDialog({ editingData, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: editingData?.name || '',
    cost: editingData?.cost || 0
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cost' ? parseFloat(value) : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Please enter an add-on name')
      return
    }
    onSave(formData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        <div className="flex justify-between items-center border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold">
            {editingData ? '✏️ Edit Add-On' : '➕ Add Add-On'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">Add-On Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Express Booking, Extra Hours"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">Cost (£)</label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              step="10"
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddOnDialog
