import { useState, useEffect } from 'react'

const MaintenanceModePage = () => {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/v1/super-admin/settings/maintenance')
        const data = await res.json()
        const settings = data?.data || data
        if (!cancelled) {
          if (settings?.enabled) {
            setMessage(settings.message || 'System is currently under maintenance. We\'ll be back shortly.')
          } else {
            // Maintenance not active — redirect back
            window.location.href = '/'
            return
          }
        }
      } catch {
        if (!cancelled) {
          setMessage('System is currently under maintenance. We\'ll be back shortly.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchSettings()
    return () => { cancelled = true }
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#fff', padding: '48px 40px', maxWidth: 500, width: '90%',
        textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div className="avatar avatar-xl bg-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
          <i className="ti ti-tools fs-1 text-white"></i>
        </div>
        <h2 style={{ margin: '0 0 8px', color: '#1a1a2e' }}>Under Maintenance</h2>
        <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6, margin: '0 0 16px' }}>
          {message}
        </p>
      </div>
    </div>
  )
}

export default MaintenanceModePage
