import React, { useState, useEffect } from 'react'
import { FaPlus, FaEdit, FaTrash, FaCalendar } from 'react-icons/fa'
import { bookingsAPI, contactsAPI, servicesAPI } from '../lib/api'
import BookingDialog from './dialogs/BookingDialog'
import { formatISO, parseISO, format, isPast } from 'date-fns'

function Bookings() {
  const [bookings, setBookings] = useState([])
  const [contacts, setContacts] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingBooking, setEditingBooking] = useState(null)
  const [viewMode, setViewMode] = useState('table')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [bookingsRes, contactsRes, servicesRes] = await Promise.all([
        bookingsAPI.getAll(),
        contactsAPI.getAll(),
        servicesAPI.getAll()
      ])
      setBookings(bookingsRes.data || [])
      setContacts(contactsRes.data || [])
      setServices(servicesRes.data || [])
    } catch (error) {
      alert('Failed to fetch data: ' + error.message)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      try {
        await bookingsAPI.delete(id)
        setBookings(bookings.filter(b => b.id !== id))
      } catch (error) {
        alert('Failed to delete booking: ' + error.message)
      }
    }
  }

  const handleSaveBooking = async (bookingData) => {
    try {
      if (editingBooking) {
        const res = await bookingsAPI.update({ ...bookingData, id: editingBooking.id })
        setBookings(bookings.map(b => b.id === editingBooking.id ? res.data : b))
      } else {
        const res = await bookingsAPI.create(bookingData)
        setBookings([...bookings, res.data])
      }
      setShowDialog(false)
      setEditingBooking(null)
    } catch (error) {
      alert('Failed to save booking: ' + error.message)
    }
  }

  const futureBookings = bookings.filter(b => !isPast(parseISO(b.booking_datetime)))
  const pastBookings = bookings.filter(b => isPast(parseISO(b.booking_datetime)))

  if (loading) return <div className="p-6 text-center">Loading bookings...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => {
            setEditingBooking(null)
            setShowDialog(true)
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <FaPlus /> <span>Schedule Booking</span>
        </button>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Calendar
          </button>
        </div>
      </div>

      {showDialog && (
        <BookingDialog
          contacts={contacts}
          services={services}
          editingData={editingBooking}
          onSave={handleSaveBooking}
          onClose={() => {
            setShowDialog(false)
            setEditingBooking(null)
          }}
        />
      )}

      {contacts.length === 0 || services.length === 0 ? (
        <div className="card bg-yellow-50">
          <p className="text-yellow-800">Please add at least one contact and one service before scheduling bookings.</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4">📅 Upcoming Bookings</h3>
              {futureBookings.length === 0 ? (
                <p className="text-gray-500">No upcoming bookings</p>
              ) : (
                <div className="space-y-3">
                  {futureBookings.map(booking => (
                    <div key={booking.id} className="card flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{format(parseISO(booking.booking_datetime), 'yyyy-MM-dd HH:mm')}</p>
                        <p className="text-sm text-gray-600">{booking.contacts?.name} - {booking.services?.title} ({booking.hours}h)</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingBooking(booking)
                            setShowDialog(true)
                          }}
                          className="btn-secondary p-2"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="btn-danger p-2"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">📅 Past Bookings</h3>
              {pastBookings.length === 0 ? (
                <p className="text-gray-500">No past bookings</p>
              ) : (
                <div className="space-y-3">
                  {pastBookings.map(booking => (
                    <div key={booking.id} className="card flex justify-between items-start opacity-75">
                      <div>
                        <p className="font-semibold">{format(parseISO(booking.booking_datetime), 'yyyy-MM-dd HH:mm')}</p>
                        <p className="text-sm text-gray-600">{booking.contacts?.name} - {booking.services?.title} ({booking.hours}h)</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="btn-danger p-2"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Bookings
