import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/lib/api'

interface TicketData {
  id: string
  tier_name: string
  event_title: string
  attendee_name: string
  qr_code_data: string
  checked_in: boolean
  status: string
}

export function MyTickets() {
  const [tickets, setTickets] = useState<TicketData[]>([])

  useEffect(() => {
    api.get('/tickets/').then((res) => setTickets(res.data))
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Tickets</h1>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">No tickets yet.</p>
          <Link to="/events" className="text-(--color-primary) hover:underline text-sm">Browse events</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{ticket.event_title}</p>
                  <p className="text-sm text-gray-600 mt-1">{ticket.tier_name}</p>
                  <p className="text-sm text-gray-500">{ticket.attendee_name}</p>
                </div>
                <div className="text-right">
                  {ticket.checked_in ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Checked In</span>
                  ) : (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Active</span>
                  )}
                </div>
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">QR Code Data</p>
                <p className="text-xs font-mono text-gray-600 break-all">{ticket.qr_code_data}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
