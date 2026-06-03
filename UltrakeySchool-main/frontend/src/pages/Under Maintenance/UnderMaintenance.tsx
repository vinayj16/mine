import { useState, useEffect, useRef } from 'react'

const FALLBACK_POLL_MS = 60000

const UnderMaintenance = () => {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/v1/super-admin/settings/maintenance')
        if (res.status === 503) {
          const body = await res.json()
          const msg = body?.data?.message || 'System is currently under maintenance. Please check back later.'
          if (!cancelled) setMessage(msg)
          return
        }
        const data = await res.json()
        const settings = data?.data || data
        if (!settings?.enabled) {
          window.location.href = '/'
          return
        }
        if (!cancelled) setMessage(settings.message || 'System is currently under maintenance. Please check back later.')

        // Set a timeout to auto-redirect when endTime is reached (no polling needed)
        if (settings.endTime) {
          const endMs = new Date(settings.endTime).getTime()
          const delay = endMs - Date.now()
          if (delay > 0) {
            endTimerRef.current = setTimeout(() => {
              window.location.href = '/'
            }, delay)
          }
        }
      } catch {
        if (!cancelled) setMessage('System is currently under maintenance. Please check back later.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSettings()

    // Fallback safety check every 60s (in case endTime wasn't set or was missed)
    fallbackRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/v1/super-admin/settings/maintenance')
        const data = await res.json()
        const settings = data?.data || data
        if (!settings?.enabled) {
          window.location.href = '/'
        }
      } catch {
        // stay on maintenance page
      }
    }, FALLBACK_POLL_MS)

    const endHandler = () => { window.location.href = '/' }
    window.addEventListener('app:maintenance-end', endHandler)

    return () => {
      cancelled = true
      if (fallbackRef.current) clearInterval(fallbackRef.current)
      if (endTimerRef.current) clearTimeout(endTimerRef.current)
      window.removeEventListener('app:maintenance-end', endHandler)
    }
  }, [])

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fff'
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="main-wrapper">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xxl-5 col-xl-5 col-md-6">
            <div className="d-flex flex-column justify-content-between vh-100">
              <div className="text-center p-4">
                <img src="/assets/img/Ultrakey.svg" alt="Ultrakey Logo" className="img-fluid" />
              </div>
              <div className="d-flex flex-column align-items-center justify-content-center mb-4">
                <div className="mb-4">
                  <img
                    src="/assets/img/authentication/under-maintanence.svg"
                    className="img-fluid"
                    alt="Under Maintenance"
                  />
                </div>
                <h3 className="h1 mb-3">Under Maintenance</h3>
                <p className="text-center" style={{ fontSize: 15, lineHeight: 1.6, color: '#666' }}>
                  {message || 'System is currently under maintenance. Please check back later.'}
                </p>
              </div>
              <div className="text-center p-3">
                <p className="mb-0">Copyright &copy; 2026 - Ultrakey</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnderMaintenance
