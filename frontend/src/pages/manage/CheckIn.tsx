import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ScanResult {
  status: 'success' | 'already_checked_in' | 'invalid'
  message: string
  attendee_name?: string
  tier_name?: string
  checked_in_at?: string
}

interface Stats {
  total_registered: number
  checked_in: number
  not_checked_in: number
  percentage: number
  by_tier: Array<{ tier_name: string; total: number; checked_in: number }>
}

interface SearchResult {
  ticket_id: string
  attendee_name: string
  attendee_email: string
  tier_name: string
  confirmation_code: string
  checked_in: boolean
  checked_in_at: string | null
}

const statusStyles = {
  success: 'bg-green-100 border-green-400 text-green-800',
  already_checked_in: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  invalid: 'bg-red-100 border-red-400 text-red-800',
}

export function CheckIn() {
  const { eventSlug } = useParams()
  const [searchParams] = useSearchParams()
  const orgSlug = searchParams.get('org') || ''

  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [manualLoading, setManualLoading] = useState<string | null>(null)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const base = `/organizations/${orgSlug}/events/${eventSlug}/check-in`

  const loadStats = useCallback(() => {
    api.get(`${base}/stats/`).then((res) => setStats(res.data))
  }, [base])

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 10000) // refresh every 10s
    return () => clearInterval(interval)
  }, [loadStats])

  const startScanner = async () => {
    setScanResult(null)
    setScanning(true)

    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Stop scanner after successful read
          await scanner.stop()
          setScanning(false)

          // Send to API
          try {
            const res = await api.post(`${base}/scan/`, { qr_data: decodedText })
            setScanResult(res.data)
            loadStats()
          } catch {
            setScanResult({ status: 'invalid', message: 'Failed to process QR code.' })
          }
        },
        () => { /* ignore scan failures */ }
      )
    } catch (err) {
      setScanning(false)
      setScanResult({ status: 'invalid', message: 'Could not access camera. Please allow camera permissions.' })
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch { /* already stopped */ }
    }
    setScanning(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    const res = await api.get(`${base}/search/?q=${encodeURIComponent(searchQuery)}`)
    setSearchResults(res.data)
  }

  const handleManualCheckIn = async (ticketId: string) => {
    setManualLoading(ticketId)
    try {
      const res = await api.post(`${base}/${ticketId}/manual/`)
      if (res.data.status === 'success') {
        // Update search results
        setSearchResults(prev => prev.map(r =>
          r.ticket_id === ticketId ? { ...r, checked_in: true, checked_in_at: new Date().toISOString() } : r
        ))
        loadStats()
      }
      setScanResult(res.data)
    } catch {
      setScanResult({ status: 'invalid', message: 'Failed to check in.' })
    } finally {
      setManualLoading(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to={`/manage/events?org=${orgSlug}`} className="hover:text-gray-900">Events</Link>
        <span>/</span>
        <Link to={`/manage/events/${eventSlug}?org=${orgSlug}`} className="hover:text-gray-900">{eventSlug}</Link>
        <span>/</span>
        <span className="text-gray-900">Check-In</span>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <p className="text-3xl font-bold text-green-600">{stats.checked_in}</p>
              <p className="text-sm text-gray-500">Checked In</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.total_registered}</p>
              <p className="text-sm text-gray-500">Registered</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-400">{stats.not_checked_in}</p>
              <p className="text-sm text-gray-500">Remaining</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">{stats.percentage}% checked in</p>

          {stats.by_tier.length > 1 && (
            <div className="mt-4 space-y-1">
              {stats.by_tier.map((tier) => (
                <div key={tier.tier_name} className="flex justify-between text-sm">
                  <span className="text-gray-600">{tier.tier_name}</span>
                  <span className="text-gray-500">{tier.checked_in}/{tier.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scan result */}
      {scanResult && (
        <div className={`rounded-xl border-2 p-6 mb-6 ${statusStyles[scanResult.status]}`}>
          <p className="text-lg font-bold mb-1">
            {scanResult.status === 'success' ? 'Checked In!' :
             scanResult.status === 'already_checked_in' ? 'Already Checked In' : 'Invalid'}
          </p>
          <p>{scanResult.message}</p>
          {scanResult.attendee_name && (
            <p className="mt-2 font-medium">{scanResult.attendee_name} — {scanResult.tier_name}</p>
          )}
          <button
            onClick={() => setScanResult(null)}
            className="mt-3 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* QR Scanner */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code Scanner</h2>
        <div id="qr-reader" className={`mb-4 ${scanning ? '' : 'hidden'}`} />
        <div className="flex gap-3">
          {scanning ? (
            <Button variant="outline" onClick={stopScanner}>Stop Scanner</Button>
          ) : (
            <Button onClick={startScanner}>Start Scanner</Button>
          )}
          <Button variant="outline" onClick={() => { setScanResult(null); startScanner() }}>
            Scan Next
          </Button>
        </div>
      </div>

      {/* Manual search & check-in */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search & Manual Check-In</h2>
        <div className="flex gap-3 items-end mb-4">
          <div className="flex-1">
            <Input
              id="search"
              label="Search by name, email, or confirmation code"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>Search</Button>
        </div>

        {searchResults.length > 0 && (
          <div className="divide-y divide-gray-100">
            {searchResults.map((result) => (
              <div key={result.ticket_id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{result.attendee_name}</p>
                  <p className="text-sm text-gray-500">{result.tier_name} · {result.confirmation_code}</p>
                </div>
                <div>
                  {result.checked_in ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Checked In
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleManualCheckIn(result.ticket_id)}
                      loading={manualLoading === result.ticket_id}
                    >
                      Check In
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
