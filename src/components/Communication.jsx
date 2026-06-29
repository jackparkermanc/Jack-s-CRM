import React, { useState, useEffect } from 'react'
import { FaPaperPlane, FaVideo, FaPhone } from 'react-icons/fa'
import { contactsAPI, messagesAPI, callsAPI } from '../lib/api'

function Communication() {
  const [contacts, setContacts] = useState([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    if (selectedContact) {
      fetchMessages()
      // Fix: Refresh interval set to 30000ms (30 seconds)
      const interval = setInterval(fetchMessages, 30000)
      return () => clearInterval(interval)
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
      console.error('Failed to fetch contacts: ' + error.message)
    }
    setLoading(false)
  }

  const fetchMessages = async () => {
    if (!selectedContact) return
    try {
      const res = await messagesAPI.getAll(selectedContact.contact_info)
      setMessages(res.data || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!selectedContact || !messageInput.trim()) return

    try {
      // Fix: Send standard text message using what you typed
      await messagesAPI.sendMessage({
        contact_number: selectedContact.contact_info,
        message_body: messageInput
      })
            
      setMessageInput('') // Clear the input field
      await new Promise(resolve => setTimeout(resolve, 500)) 
      fetchMessages() 
      
    } catch (error) {
      console.error('Failed to send message: ' + error.message)
    }
  }

  if (loading) return <div className="p-6 text-center">Loading...</div>

  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-6 h-full">
        {/* Contacts List */}
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

        {/* Chat Area */}
        <div className="col-span-3 flex flex-col space-y-4">
          {selectedContact ? (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-bold">{selectedContact.name}</h2>
                <p className="text-gray-600">📞 {selectedContact.contact_info}</p>
              </div>

              <div className="flex space-x-2 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg flex-1">
                  <p className="text-sm text-gray-700">
                    💬 <strong>Messages from WhatsApp appear here automatically</strong>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Messages sent from any device will sync with your CRM</p>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-y-auto max-h-96">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center">No messages yet</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.direction === 'inbound'
                              ? 'bg-gray-200 text-gray-900'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          <p className="text-sm">{msg.message_body}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 flex items-center space-x-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPaperPlane /> <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="card text-center text-gray-500 bg-white p-8 rounded-lg shadow">
              <p>Select a contact to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Communication  }

  const fetchMessages = async () => {
    if (!selectedContact) return
    try {
      const res = await messagesAPI.getAll(selectedContact.contact_info)
      setMessages(res.data || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    // Check if there is a contact selected AND if the message is not empty
    if (!selectedContact || !messageInput.trim()) return

    try {
      // Fix 2: Sending actual text message instead of hardcoded Jitsi link
      await messagesAPI.sendMessage({
        contact_number: selectedContact.contact_info,
        message_body: messageInput
      })
            
      setMessageInput('') // Clear the input field
      await new Promise(resolve => setTimeout(resolve, 500)) // Brief pause 
      fetchMessages() // Refresh the chat
      
    } catch (error) {
      alert('Failed to send message: ' + error.message)
    }
  }

  if (loading) return <div className="p-6 text-center">Loading...</div>

  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-6 h-full">
        {/* Contacts List */}
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

        {/* Chat Area */}
        <div className="col-span-3 flex flex-col space-y-4">
          {selectedContact ? (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-bold">{selectedContact.name}</h2>
                <p className="text-gray-600">📞 {selectedContact.contact_info}</p>
              </div>

              <div className="flex space-x-2 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg flex-1">
                  <p className="text-sm text-gray-700">
                    💬 <strong>Messages from WhatsApp appear here automatically</strong>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Messages sent from any device will sync with your CRM</p>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-y-auto max-h-96">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center">No messages yet</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.direction === 'inbound'
                              ? 'bg-gray-200 text-gray-900'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          <p className="text-sm">{msg.message_body}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 flex items-center space-x-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send size={16} /> <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="card text-center text-gray-500 bg-white p-8 rounded-lg shadow">
              <p>Select a contact to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Communication
