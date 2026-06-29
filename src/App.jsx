import React, { useState, useEffect } from 'react'
import { FaBook, FaUsers, FaGem, FaComments, FaChartBar } from 'react-icons/fa'
import Bookings from './components/Bookings'
import Contacts from './components/Contacts'
import Services from './components/Services'
import Communication from './components/Communication'
import Logs from './components/Logs'
import './styles/globals.css'

function App() {
  const [activeTab, setActiveTab] = useState('bookings')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const tabs = [
    { id: 'bookings', label: 'Bookings', icon: FaBook, component: Bookings },
    { id: 'contacts', label: 'Contacts', icon: FaUsers, component: Contacts },
    { id: 'services', label: 'Services', icon: FaGem, component: Services },
    { id: 'communication', label: 'Communication', icon: FaComments, component: Communication },
    { id: 'logs', label: 'Logs', icon: FaChartBar, component: Logs }
  ]

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-700">
          <h1 className={`text-2xl font-bold ${!sidebarOpen && 'hidden'}`}>CRM</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="text-xl" />
                {sidebarOpen && <span>{tab.label}</span>}
              </button>
            )
          })}
        </nav>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-gray-700 text-gray-300 hover:text-white"
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900">
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
        </header>
        <main className="flex-1 overflow-auto">
          {ActiveComponent && <ActiveComponent />}
        </main>
      </div>
    </div>
  )
}

export default App
