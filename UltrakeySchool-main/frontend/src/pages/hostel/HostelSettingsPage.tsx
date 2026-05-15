import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../api/client'
import { toast } from 'react-toastify'

const DEFAULT_SECURITY = {
  twoFactorEnabled: false,
  sessionTimeout: 30,
  loginNotifications: true
}

const DEFAULT_NOTIFICATIONS = {
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
  studentAdmission: true,
  feePayment: true
}

const HostelSettingsPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('security')
  const [security, setSecurity] = useState(DEFAULT_SECURITY)
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const [secRes, notifRes] = await Promise.all([
        apiClient.get('/user/security').catch(() => ({ data: { success: true, data: DEFAULT_SECURITY } })),
        apiClient.get('/user/notifications').catch(() => ({ data: { success: true, data: DEFAULT_NOTIFICATIONS } }))
      ])
      if (secRes.data?.success) setSecurity({ ...DEFAULT_SECURITY, ...secRes.data.data })
      if (notifRes.data?.success) setNotifications({ ...DEFAULT_NOTIFICATIONS, ...notifRes.data.data })
    } catch (err) { console.error('Error:', err) } finally { setLoading(false) }
  }

  const handleSaveSecurity = async () => {
    try {
      setSaving(true)
      const res = await apiClient.put('/user/security', security)
      if (res.data.success) toast.success('Security settings updated!')
    } catch { toast.error('Failed to update') } finally { setSaving(false) }
  }

  const handleSaveNotifications = async () => {
    try {
      setSaving(true)
      const res = await apiClient.put('/user/notifications', notifications)
      if (res.data.success) toast.success('Notification preferences updated!')
    } catch { toast.error('Failed to update') } finally { setSaving(false) }
  }

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><div className="spinner-border text-primary"></div></div>

  return (
    <div className="content">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">Settings</h4>
          <nav className="d-flex align-items-center gap-2 small text-muted">
            <Link to="/dashboard" className="text-decoration-none">Dashboard</Link>
            <span>/</span>
            <Link to="/dashboard/hostel" className="text-decoration-none">Hostel</Link>
            <span>/</span>
            <span>Settings</span>
          </nav>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-3 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="list-group list-group-flush">
              <button className={`list-group-item list-group-item-action ${activeSection === 'security' ? 'active' : ''}`} onClick={() => setActiveSection('security')}>
                <i className="ti ti-lock me-2"></i>Security
              </button>
              <button className={`list-group-item list-group-item-action ${activeSection === 'notifications' ? 'active' : ''}`} onClick={() => setActiveSection('notifications')}>
                <i className="ti ti-bell me-2"></i>Notifications
              </button>
            </div>
          </div>
        </div>
        <div className="col-lg-9">
          {activeSection === 'security' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between">
                <h6 className="mb-0">Security Settings</h6>
                <button className="btn btn-sm btn-primary" onClick={handleSaveSecurity} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="twoFactor" checked={security.twoFactorEnabled} onChange={e => setSecurity({ ...security, twoFactorEnabled: e.target.checked })} />
                    <label className="form-check-label" htmlFor="twoFactor">
                      <strong>Two-Factor Authentication</strong>
                      <p className="text-muted small mb-0">Add an extra layer of security to your account</p>
                    </label>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label"><strong>Session Timeout</strong></label>
                  <select className="form-select" value={security.sessionTimeout} onChange={e => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) })}>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                  </select>
                  <p className="text-muted small">Auto-logout after inactivity</p>
                </div>
                <div className="mb-0">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="loginNotif" checked={security.loginNotifications} onChange={e => setSecurity({ ...security, loginNotifications: e.target.checked })} />
                    <label className="form-check-label" htmlFor="loginNotif">
                      <strong>Login Notifications</strong>
                      <p className="text-muted small mb-0">Get notified when someone logs into your account</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between">
                <h6 className="mb-0">Notification Preferences</h6>
                <button className="btn btn-sm btn-primary" onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label"><strong>Notification Channels</strong></label>
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="emailNotif" checked={notifications.emailNotifications} onChange={e => setNotifications({ ...notifications, emailNotifications: e.target.checked })} />
                    <label className="form-check-label" htmlFor="emailNotif">Email Notifications</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="smsNotif" checked={notifications.smsNotifications} onChange={e => setNotifications({ ...notifications, smsNotifications: e.target.checked })} />
                    <label className="form-check-label" htmlFor="smsNotif">SMS Notifications</label>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" id="pushNotif" checked={notifications.pushNotifications} onChange={e => setNotifications({ ...notifications, pushNotifications: e.target.checked })} />
                    <label className="form-check-label" htmlFor="pushNotif">Push Notifications</label>
                  </div>
                </div>
                <hr />
                <div className="mb-0">
                  <label className="form-label"><strong>Alert Types</strong></label>
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="admissionNotif" checked={notifications.studentAdmission} onChange={e => setNotifications({ ...notifications, studentAdmission: e.target.checked })} />
                    <label className="form-check-label" htmlFor="admissionNotif">Student Admission Alerts</label>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" id="feeNotif" checked={notifications.feePayment} onChange={e => setNotifications({ ...notifications, feePayment: e.target.checked })} />
                    <label className="form-check-label" htmlFor="feeNotif">Fee Payment Alerts</label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HostelSettingsPage
