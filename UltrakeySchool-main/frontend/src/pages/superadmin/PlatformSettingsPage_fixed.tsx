import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../../api/client'
import LoadingSpinner from '../../components/common/LoadingSpinner'

interface Setting {
  id: string
  category: string
  key: string
  value: string | boolean | number
  description: string
  type: 'text' | 'email' | 'number' | 'boolean' | 'select' | 'textarea' | 'file' | 'color' | 'password' | 'datetime-local'
  options?: string[]
  required?: boolean
  validation?: string
}

const PlatformSettingsPageFixed = () => {
  const [activeTab, setActiveTab] = useState<string>('branding')
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/platform-settings')
      const data = response.data.data || response.data
      
      if (Array.isArray(data)) {
        setSettings(data as Setting[])
      } else {
        setError('Invalid settings data format')
      }
    } catch (err: any) {
      console.error('Error fetching platform settings:', err)
      setError(err.response?.data?.message || 'Failed to fetch platform settings')
      toast.error('Failed to load platform settings')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'branding', label: 'Branding', icon: 'ti ti-palette' },
    { id: 'smtp', label: 'SMTP', icon: 'ti ti-mail' },
    { id: 'sms', label: 'SMS', icon: 'ti ti-message' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'ti ti-brand-whatsapp' },
    { id: 'payment', label: 'Payment Gateway', icon: 'ti ti-credit-card' },
    { id: 'gst', label: 'GST', icon: 'ti ti-receipt' },
    { id: 'storage', label: 'Storage', icon: 'ti ti-database' },
    { id: 'notifications', label: 'Notification Templates', icon: 'ti ti-bell' },
    { id: 'academic', label: 'Academic Templates', icon: 'ti ti-school' },
    { id: 'security', label: 'Security', icon: 'ti ti-shield' },
    { id: 'api', label: 'API Keys', icon: 'ti ti-key' },
    { id: 'backup', label: 'Backup Settings', icon: 'ti ti-cloud-upload' }
  ]

  const filteredSettings = settings.filter(setting => setting.category === activeTab)

  const handleSettingChange = (settingId: string, value: any) => {
    setSettings(prevSettings => 
      prevSettings.map(setting => 
        setting.id === settingId ? { ...setting, value } : setting
      )
    )
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      await apiClient.put('/platform-settings/bulk', { settings })
      toast.success('Settings saved successfully!')
      fetchSettings()
    } catch (err: any) {
      console.error('Error saving settings:', err)
      toast.error(err.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async (service: string) => {
    try {
      await apiClient.post(`/platform-settings/test/${service}`)
      toast.success(`${service.toUpperCase()} connection test successful!`)
    } catch (err: any) {
      console.error('Error testing connection:', err)
      toast.error(err.response?.data?.message || `${service.toUpperCase()} connection test failed!`)
    }
  }

  const handleRefresh = () => {
    fetchSettings()
    toast.success('Settings refreshed')
  }

  const renderSettingInput = (setting: Setting) => {
    switch (setting.type) {
      case 'text':
      case 'email':
      case 'password':
        return (
          <input
            type={setting.type}
            className="form-control"
            value={String(setting.value)}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            required={setting.required}
          />
        )
      case 'number':
        return (
          <input
            type="number"
            className="form-control"
            value={Number(setting.value)}
            onChange={(e) => handleSettingChange(setting.id, Number(e.target.value))}
            required={setting.required}
          />
        )
      case 'textarea':
        return (
          <textarea
            className="form-control"
            rows={3}
            value={String(setting.value)}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            required={setting.required}
          />
        )
      case 'select':
        return (
          <select
            className="form-select"
            value={String(setting.value)}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            required={setting.required}
          >
            {setting.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      case 'boolean':
        return (
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={Boolean(setting.value)}
              onChange={(e) => handleSettingChange(setting.id, e.target.checked)}
            />
          </div>
        )
      case 'color':
        return (
          <input
            type="color"
            className="form-control form-control-color"
            value={String(setting.value)}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
          />
        )
      case 'file':
        return (
          <input
            type="file"
            className="form-control"
            onChange={(e) => handleSettingChange(setting.id, e.target.files?.[0]?.name || '')}
          />
        )
      case 'datetime-local':
        return (
          <input
            type="datetime-local"
            className="form-control"
            value={String(setting.value)}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
          />
        )
      default:
        return (
          <input
            type="text"
            className="form-control"
            value={String(setting.value)}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4">
        <h4>Error Loading Platform Settings</h4>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchSettings}>
          <i className="ti ti-refresh me-2" />Retry
        </button>
      </div>
    )
  }


  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Platform Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Platform Settings
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={handleRefresh}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <button 
            className="btn btn-primary me-2 mb-2" 
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="ti ti-device-floppy me-2"></i>Save All Settings
              </>
            )}
          </button>
          <div className="dropdown me-2 mb-2">
            <button className="btn btn-light fw-medium dropdown-toggle" data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu">
              <li><a className="dropdown-item" href="#"><i className="ti ti-file-type-json me-2"></i>Export as JSON</a></li>
              <li><a className="dropdown-item" href="#"><i className="ti ti-file-type-csv me-2"></i>Export as CSV</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-2">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <ul className="nav nav-pills flex-wrap gap-2">
                  {tabs.map(tab => (
                    <li key={tab.id} className="nav-item">
                      <button
                        className={`nav-link d-flex align-items-center ${activeTab === tab.id ? 'active bg-primary text-white' : 'text-dark'}`}
                        style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, minWidth: '120px', justifyContent: 'center' }}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <i className={`${tab.icon} me-2`} />
                        {tab.label}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="text-muted" style={{ fontSize: 13 }}>
                  <i className="ti ti-info-circle me-1" />
                  {filteredSettings.length} settings in this category
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-3">
          
          {/* Settings Content */}
          <div className="row">
            <div className="col-lg-8">
              {filteredSettings.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-settings-off fs-1 text-muted d-block mb-3"></i>
                  <h5 className="text-muted">No settings found</h5>
                  <p className="text-muted">No settings available for this category</p>
                </div>
              ) : (
                filteredSettings.map(setting => (
                  <div className="mb-4" key={setting.id}>
                    <label className="form-label">
                      {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      {setting.required && <span className="text-danger ms-1">*</span>}
                    </label>
                    {renderSettingInput(setting)}
                    {setting.description && (
                      <small className="form-text text-muted d-block mt-1">{setting.description}</small>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="col-lg-4">
              <div className="card">
                <div className="card-header">
                  <h6 className="card-title mb-0">Quick Actions</h6>
                </div>
                <div className="card-body">
                  {activeTab === 'smtp' && (
                    <>
                      <button className="btn btn-outline-primary btn-sm w-100 mb-2" onClick={() => handleTestConnection('smtp')}>
                        <i className="ti ti-mail me-2"></i>Test SMTP Connection
                      </button>
                      <button className="btn btn-outline-success btn-sm w-100 mb-2">
                        <i className="ti ti-send me-2"></i>Send Test Email
                      </button>
                    </>
                  )}
                  {activeTab === 'sms' && (
                    <>
                      <button className="btn btn-outline-primary btn-sm w-100 mb-2" onClick={() => handleTestConnection('sms')}>
                        <i className="ti ti-message me-2"></i>Test SMS Connection
                      </button>
                      <button className="btn btn-outline-success btn-sm w-100 mb-2">
                        <i className="ti ti-send me-2"></i>Send Test SMS
                      </button>
                    </>
                  )}
                  {activeTab === 'whatsapp' && (
                    <>
                      <button className="btn btn-outline-primary btn-sm w-100 mb-2" onClick={() => handleTestConnection('whatsapp')}>
                        <i className="ti ti-brand-whatsapp me-2"></i>Test WhatsApp Connection
                      </button>
                      <button className="btn btn-outline-success btn-sm w-100 mb-2">
                        <i className="ti ti-send me-2"></i>Send Test Message
                      </button>
                    </>
                  )}
                  {activeTab === 'payment' && (
                    <>
                      <button className="btn btn-outline-primary btn-sm w-100 mb-2" onClick={() => handleTestConnection('razorpay')}>
                        <i className="ti ti-credit-card me-2"></i>Test Razorpay
                      </button>
                      <button className="btn btn-outline-primary btn-sm w-100 mb-2" onClick={() => handleTestConnection('stripe')}>
                        <i className="ti ti-credit-card me-2"></i>Test Stripe
                      </button>
                    </>
                  )}
                  {activeTab === 'storage' && (
                    <button className="btn btn-outline-primary btn-sm w-100 mb-2" onClick={() => handleTestConnection('storage')}>
                      <i className="ti ti-database me-2"></i>Test Storage Connection
                    </button>
                  )}
                  <button className="btn btn-outline-warning btn-sm w-100 mb-2">
                    <i className="ti ti-refresh me-2"></i>Reset to Defaults
                  </button>
                  <button className="btn btn-outline-info btn-sm w-100">
                    <i className="ti ti-file-text me-2"></i>View Configuration
                  </button>
                </div>
              </div>

              {/* Status Card */}
              <div className="card mt-3">
                <div className="card-header">
                  <h6 className="card-title mb-0">Service Status</h6>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>SMTP Service</span>
                    <span className="badge bg-success">Active</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>SMS Service</span>
                    <span className="badge bg-success">Active</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>WhatsApp Service</span>
                    <span className="badge bg-warning">Testing</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Payment Gateway</span>
                    <span className="badge bg-success">Active</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Storage Service</span>
                    <span className="badge bg-success">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlatformSettingsPageFixed
