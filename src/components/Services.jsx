import React, { useState, useEffect } from 'react'
import { FaPlus, FaEdit, FaTrash, FaChevronRight } from 'react-icons/fa'
import { servicesAPI, categoriesAPI, addonsAPI } from '../lib/api'
import CategoryDialog from './dialogs/CategoryDialog'
import ServiceDialog from './dialogs/ServiceDialog'
import AddOnDialog from './dialogs/AddOnDialog'

function Services() {
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const [addons, setAddons] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMainCat, setSelectedMainCat] = useState(null)
  const [selectedSubCat, setSelectedSubCat] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [showCatDialog, setShowCatDialog] = useState(false)
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [showAddOnDialog, setShowAddOnDialog] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [editingService, setEditingService] = useState(null)
  const [editingAddon, setEditingAddon] = useState(null)
  const [catDialogMode, setCatDialogMode] = useState('add')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [catsRes, servicesRes] = await Promise.all([
        categoriesAPI.getAll(),
        servicesAPI.getAll()
      ])
      setCategories(catsRes.data || [])
      setServices(servicesRes.data || [])
    } catch (error) {
      alert('Failed to fetch data: ' + error.message)
    }
    setLoading(false)
  }

  const fetchAddons = async (serviceId) => {
    try {
      const res = await addonsAPI.getAll(serviceId)
      setAddons(res.data || [])
    } catch (error) {
      alert('Failed to fetch add-ons: ' + error.message)
    }
  }

  const mainCategories = categories.filter(c => !c.parent_id)
  const subCategories = selectedMainCat ? categories.filter(c => c.parent_id === selectedMainCat.id) : []
  const categoryServices = selectedSubCat
    ? services.filter(s => s.category_id === selectedSubCat.id)
    : selectedMainCat
    ? services.filter(s => s.category_id === selectedMainCat.id)
    : []

  const handleAddMainCategory = () => {
    setCatDialogMode('add')
    setEditingCat(null)
    setSelectedSubCat(null)
    setShowCatDialog(true)
  }

  const handleAddSubCategory = () => {
    if (!selectedMainCat) return
    setCatDialogMode('add_sub')
    setEditingCat(null)
    setShowCatDialog(true)
  }

  const handleSaveCategory = async (data) => {
    try {
      if (editingCat) {
        const res = await categoriesAPI.update({ id: editingCat.id, ...data })
        setCategories(categories.map(c => c.id === editingCat.id ? res.data : c))
      } else {
        const res = await categoriesAPI.create(data)
        setCategories([...categories, res.data])
      }
      setShowCatDialog(false)
      setEditingCat(null)
    } catch (error) {
      alert('Failed to save category: ' + error.message)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (confirm('Delete this category? (Must have no sub-categories or services)')) {
      try {
        await categoriesAPI.delete(id)
        setCategories(categories.filter(c => c.id !== id))
        if (selectedMainCat?.id === id) setSelectedMainCat(null)
        if (selectedSubCat?.id === id) setSelectedSubCat(null)
      } catch (error) {
        alert('Failed to delete category: ' + error.message)
      }
    }
  }

  const handleSaveService = async (data) => {
    try {
      if (editingService) {
        const res = await servicesAPI.update({ id: editingService.id, ...data })
        setServices(services.map(s => s.id === editingService.id ? res.data : s))
      } else {
        const res = await servicesAPI.create(data)
        setServices([...services, res.data])
      }
      setShowServiceDialog(false)
      setEditingService(null)
    } catch (error) {
      alert('Failed to save service: ' + error.message)
    }
  }

  const handleDeleteService = async (id) => {
    if (confirm('Delete this service?')) {
      try {
        await servicesAPI.delete(id)
        setServices(services.filter(s => s.id !== id))
      } catch (error) {
        alert('Failed to delete service: ' + error.message)
      }
    }
  }

  const handleSaveAddon = async (data) => {
    if (!selectedService) return
    try {
      if (editingAddon) {
        const res = await addonsAPI.update({ id: editingAddon.id, ...data })
        setAddons(addons.map(a => a.id === editingAddon.id ? res.data : a))
      } else {
        const res = await addonsAPI.create({ service_id: selectedService.id, ...data })
        setAddons([...addons, res.data])
      }
      setShowAddOnDialog(false)
      setEditingAddon(null)
    } catch (error) {
      alert('Failed to save add-on: ' + error.message)
    }
  }

  const handleDeleteAddon = async (id) => {
    if (confirm('Delete this add-on?')) {
      try {
        await addonsAPI.delete(id)
        setAddons(addons.filter(a => a.id !== id))
      } catch (error) {
        alert('Failed to delete add-on: ' + error.message)
      }
    }
  }

  if (loading) return <div className="p-6 text-center">Loading services...</div>

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-6 h-full">
        {/* Main Categories */}
        <div className="col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Categories</h3>
            <button
              onClick={handleAddMainCategory}
              className="btn-primary px-2 py-2"
              title="Add Main Category"
            >
              <FaPlus />
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {mainCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedMainCat(cat)
                  setSelectedSubCat(null)
                }}
                className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-colors ${
                  selectedMainCat?.id === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <span className="font-semibold">📁 {cat.name}</span>
                <FaChevronRight className="text-sm" />
              </button>
            ))}
          </div>
        </div>

        {/* Sub Categories & Services */}
        <div className="col-span-2 space-y-6">
          {selectedMainCat && (
            <>
              {/* Sub Categories Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">📁 {selectedMainCat.name}</h3>
                  <button
                    onClick={handleAddSubCategory}
                    className="btn-primary px-3 py-2 flex items-center space-x-2"
                  >
                    <FaPlus /> <span>Sub-Cat</span>
                  </button>
                </div>

                {subCategories.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {subCategories.map(subCat => (
                      <button
                        key={subCat.id}
                        onClick={() => setSelectedSubCat(subCat)}
                        className={`p-3 rounded-lg text-left transition-colors ${
                          selectedSubCat?.id === subCat.id
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        <p className="font-semibold">📂 {subCat.name}</p>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Services Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Services</h3>
                  <button
                    onClick={() => {
                      setEditingService(null)
                      setShowServiceDialog(true)
                    }}
                    className="btn-primary px-3 py-2 flex items-center space-x-2"
                  >
                    <FaPlus /> <span>Service</span>
                  </button>
                </div>

                {categoryServices.length === 0 ? (
                  <p className="text-gray-500">No services in this category</p>
                ) : (
                  <div className="space-y-3">
                    {categoryServices.map(service => (
                      <div key={service.id} className="border-2 rounded-lg overflow-hidden" style={{borderColor: selectedService?.id === service.id ? '#2563eb' : '#e5e7eb'}}>
                        <div className="card cursor-pointer p-0">
                          <button
                            onClick={() => {
                              setSelectedService(service)
                              fetchAddons(service.id)
                            }}
                            className="w-full text-left p-4 hover:bg-gray-50"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{service.title}</p>
                                <p className="text-sm text-gray-600">£{service.cost} | {service.duration}hrs | {service.call_type}</p>
                              </div>
                            </div>
                          </button>

                          {selectedService?.id === service.id && (
                            <div className="border-t border-gray-200 p-4 bg-blue-50">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold text-sm">Add-Ons</h4>
                                <button
                                  onClick={() => {
                                    setEditingAddon(null)
                                    setShowAddOnDialog(true)
                                  }}
                                  className="btn-primary px-2 py-1 text-sm flex items-center space-x-1"
                                >
                                  <FaPlus className="text-xs" /> <span>Add-On</span>
                                </button>
                              </div>

                              {addons.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">No add-ons yet</p>
                              ) : (
                                <div className="space-y-2">
                                  {addons.map(addon => (
                                    <div key={addon.id} className="bg-white p-3 rounded-lg flex justify-between items-center">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{addon.name}</p>
                                        <p className="text-xs text-gray-600">+£{addon.cost}</p>
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => {
                                            setEditingAddon(addon)
                                            setShowAddOnDialog(true)
                                          }}
                                          className="btn-secondary p-2 text-xs"
                                        >
                                          <FaEdit />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteAddon(addon.id)}
                                          className="btn-danger p-2 text-xs"
                                        >
                                          <FaTrash />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="border-t border-gray-200 p-4 flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingService(service)
                                setShowServiceDialog(true)
                              }}
                              className="btn-secondary p-2"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="btn-danger p-2"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showCatDialog && (
        <CategoryDialog
          mode={catDialogMode}
          editingData={editingCat}
          parentCategoryId={selectedMainCat?.id}
          onSave={handleSaveCategory}
          onClose={() => {
            setShowCatDialog(false)
            setEditingCat(null)
          }}
        />
      )}

      {showServiceDialog && (
        <ServiceDialog
          editingData={editingService}
          categories={categories}
          selectedCategoryId={selectedSubCat?.id || selectedMainCat?.id}
          onSave={handleSaveService}
          onClose={() => {
            setShowServiceDialog(false)
            setEditingService(null)
          }}
        />
      )}

      {showAddOnDialog && (
        <AddOnDialog
          editingData={editingAddon}
          onSave={handleSaveAddon}
          onClose={() => {
            setShowAddOnDialog(false)
            setEditingAddon(null)
          }}
        />
      )}
    </div>
  )
}

export default Services
