import React, { useState, useEffect } from 'react'
import { FaSync, FaTrash } from 'react-icons/fa'
import { logsAPI } from '../lib/api'
import { format, parseISO } from 'date-fns'

function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await logsAPI.getAll()
      setLogs(res.data || [])
    } catch (error) {
      alert('Failed to fetch logs: ' + error.message)
    }
    setLoading(false)
  }

  const handleClearLogs = async () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      try {
        await logsAPI.clear()
        setLogs([])
        alert('Logs cleared successfully')
      } catch (error) {
        alert('Failed to clear logs: ' + error.message)
      }
    }
  }

  if (loading) return <div className="p-6 text-center">Loading logs...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">System Logs</h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchLogs}
            className="btn-secondary flex items-center space-x-2"
          >
            <FaSync /> <span>Refresh</span>
          </button>
          <button
            onClick={handleClearLogs}
            className="btn-danger flex items-center space-x-2"
          >
            <FaTrash /> <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="card text-center text-gray-500">
          <p>No logs recorded yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">Source</th>
                <th className="px-4 py-2 text-left">Level</th>
                <th className="px-4 py-2 text-left">Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm">
                    {format(parseISO(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                  <td className="px-4 py-2 text-sm">{log.source}</td>
                  <td className="px-4 py-2 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                        log.level === 'ERROR'
                          ? 'bg-red-600'
                          : log.level === 'WARNING'
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                      }`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Logs
