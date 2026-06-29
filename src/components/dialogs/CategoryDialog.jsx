import React, { useState } from 'react'
import { FaTimes } from 'react-icons/fa'

function CategoryDialog({ mode, editingData, parentCategoryId, onSave, onClose }) {
  const [categoryName, setCategoryName] = useState(editingData?.name || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!categoryName.trim()) {
      alert('Please enter a category name')
      return
    }

    const data = {
      name: categoryName
    }

    if (mode === 'add_sub') {
      data.parent_id = parentCategoryId
    }

    onSave(data)
  }

  const titleText = mode === 'add_sub' ? '➕ Add Sub-Category' : mode === 'edit' ? '✏️ Edit Category' : '➕ Add Main Category'

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        <div className="flex justify-between items-center border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold">{titleText}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">Category Name *</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              autoFocus
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
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryDialog
