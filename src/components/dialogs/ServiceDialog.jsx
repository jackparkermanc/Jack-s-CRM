import React, { useState } from 'react'
import { FaTimes } from 'react-icons/fa'

function ServiceDialog({ editingData, categories, selectedCategoryId, onSave, onClose }) {
  const [formData, setFormData] = useState({
    category_id: editingData?.category_id || selectedCategoryId || (categories[0]?.id || ''),
    title: editingData?.title || '',
    duration: editingData?.duration || 0.5,
    cost: editingData?.cost || 0,
    additional_costs: editingData?.additional_costs || 0,
    call_type: editingData?.call_type || 'Both'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'cost' || name === 'additional_costs' ? parseFloat(value) : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('Please enter a service title')
      return
    }
    onSave(formData)
  }

  const categoryOptions = []
  categories.forEach(cat => {
    if (cat.parent_id) {
      const parent = categories.find(c => c.id === cat.parent_id)
      categoryOptions.push({
        id: cat.id,
        label: `📁 ${parent?.name || 'Unknown'} > 📂 ${cat.name}`
      })
    } else {
      categoryOptions.push({
        id: cat.id,
        label: `📁 ${cat.name}`
      })
    }
  })

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex justify-between items-center border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold">
            {editingData ? '✏️ Edit Service' : '➕ Add Service'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">Location / Category *</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            >
              {categoryOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Hours</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                step="0.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">Additional Costs (£)</label>
            <input
              type="number"
              name="additional_costs"
              value={formData.additional_costs}
              onChange={handleChange}
              step="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">Type</label>
            <select
              name="call_type"
              value={formData.call_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="In-call">In-call</option>
              <option value="Out-call">Out-call</option>
              <option value="Both">Both</option>
            </select>
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

export default ServiceDialog
