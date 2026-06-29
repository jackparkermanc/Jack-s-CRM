import React, { useState, useEffect } from 'react'
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import { contactsAPI, bookingsAPI } from '../lib/api'
import ContactDialog from './dialogs/ContactDialog'
import { formatISO, parseISO, format, isPast } from 'date-fns'

function Contacts() {
  const [contacts, setContacts] = useState([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [contactBookings, setContactBookings] = useState([])

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    if (selectedContact) {
      fetchContactBookings()
    }
  }, [selectedContact])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const res = await contactsAPI.getAll()
      setContacts(res.data || [])
      if (res.data && res.data.length > 0) {
        setSelectedContact(res.data[0])
      }
    } catch (error) {
      alert('Failed to fetch contacts: ' + error.message)
    }
    setLoading(false)
  }

  const fetchContactBookings = async () => {
    try {
      const res = await bookingsAPI.getAll()
      const filtered = (res.data || []).filter(b => b.contact_id === selectedContact.id)
      setContactBookings(filtered)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }

  const handleDeleteContact = async (id) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        await contactsAPI.delete(id)
        const newContacts = contacts.filter(c => c.id !== id)
        setContacts(newContacts)
        if (selectedContact?.id === id) {
          setSelectedContact(newContacts[0] || null)
        }
      } catch (error) {
        alert('Failed to delete contact: ' + error.message)
      }
    }
  }

  const handleSaveContact = async (contactData) => {
    try {
      if (editingContact) {
        const res = await contactsAPI.update({ ...contactData, id: editingContact.id })
        setContacts(contacts.map(c => c.id === editingContact.id ? res.data : c))
      } else {
        const res = await contactsAPI.create(contactData)
        setContacts([...contacts, res.data])
      }
      setShowDialog(false)
      setEditingContact(null)
    } catch (error) {
      alert('Failed to save contact: ' + error.message)
    }
  }

  const futureBookings = contactBookings.filter(b => !isPast(parseISO(b.booking_datetime)))
  const pastBookings = contactBookings.filter(b => isPast(parseISO(b.booking_datetime)))

  if (loading) return <div className="p-6 text-center">Loading contacts...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => {
            setEditingContact(null)
            setShowDialog(true)
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <FaPlus /> <span>Add Contact</span>
        </button>
      </div>

      {showDialog && (
        <ContactDialog
          editingData={editingContact}
          onSave={handleSaveContact}
          onClose={() => {
            setShowDialog(false)
            setEditingContact(null)
          }}
        />
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <h3 className="text-lg font-bold mb-4">Contacts</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedContact?.id === contact.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <p className="font-semibold text-sm">{contact.name}</p>
                <p className="text-xs opacity-75">{contact.contact_info}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          {selectedContact ? (
            <div className="space-y-6">
              <div className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedContact.name}</h3>
                    <p className="text-gray-600">📞 {selectedContact.contact_info}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingContact(selectedContact)
                        setShowDialog(true)
                      }}
                      className="btn-secondary px-4 py-2 flex items-center space-x-2"
                    >
                      <FaEdit /> <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteContact(selectedContact.id)}
                      className="btn-danger px-4 py-2 flex items-center space-x-2"
                    >
                      <FaTrash /> <span>Delete</span>
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="font-semibold text-gray-700">Notes</p>
                  <p className="text-gray-600">{selectedContact.last_notes || 'No notes added'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold mb-4">📅 Upcoming Bookings</h4>
                {futureBookings.length === 0 ? (
                  <p className="text-gray-500">No upcoming bookings</p>
                ) : (
                  <div className="space-y-2">
                    {futureBookings.map(booking => (
                      <div key={booking.id} className="card">
                        <p className="font-semibold">{format(parseISO(booking.booking_datetime), 'yyyy-MM-dd HH:mm')}</p>
                        <p className="text-sm text-gray-600">{booking.services?.title} ({booking.hours}h)</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-lg font-bold mb-4">📅 Past Bookings</h4>
                {pastBookings.length === 0 ? (
                  <p className="text-gray-500">No past bookings</p>
                ) : (
                  <div className="space-y-2">
                    {pastBookings.map(booking => (
                      <div key={booking.id} className="card opacity-75">
                        <p className="font-semibold">{format(parseISO(booking.booking_datetime), 'yyyy-MM-dd HH:mm')}</p>
                        <p className="text-sm text-gray-600">{booking.services?.title} ({booking.hours}h)</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center text-gray-500">
              <p>Select a contact to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Contacts
