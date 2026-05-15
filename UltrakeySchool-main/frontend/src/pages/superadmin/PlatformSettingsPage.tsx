import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { apiService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'

interface Setting {
  key: string
  value: string
  category: string
  description?: string
  type?: string
}

const PlatformSettingsPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('branding')
  const [settings, setSettings] = useState<Record<string, any>>({})


  const tabs = [
    { id: 'branding', label: 'Branding', icon: 'ti ti-palette' },
    { id: 'email', label: 'Email', icon: 'ti ti-mail' },
    { id: 'sms', label: 'SMS', icon: 'ti ti-message' },
    { id: 'payment', label: 'Payment', icon: 'ti ti-credit-card' },
    { id: 'storage', label: 'Storage', icon: 'ti ti-database' },
    { id: 'security', label: 'Security', icon: 'ti ti-shield' },
    { id: 'api', label: 'API Keys', icon: 'ti ti-key' },
    { id: 'backup', label: 'Backup', icon: 'ti ti-cloud-upload' }
  ]

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.get('/super-admin/platform-settings')
      // The response is { success: true, data: { platformName, version, ... } }
      const settingsData = response.data || response

      // Convert array of settings to object for easier access
      if (Array.isArray(settingsData)) {
        const settingsObj: Record<string, any> = {}
        settingsData.forEach((setting: Setting) => {
          settingsObj[setting.key] = setting.value
        })
        setSettings(settingsObj)
      } else {
        setSettings(settingsData)
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err)
      setError(err.response?.data?.message || 'Failed to load settings')
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  // Handle setting change
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      await apiService.put('/super-admin/platform-settings', settings)
      toast.success('Settings saved successfully')
      fetchSettings()
    } catch (err: any) {
      console.error('Error saving settings:', err)
      toast.error(err.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Test connection
  const handleTestConnection = async (service: string) => {
    try {
      await apiService.post(`/super-admin/platform-settings/test/${service}`)
      toast.success(`${service} connection test successful`)
    } catch (err: any) {
      console.error('Error testing connection:', err)
      toast.error(err.response?.data?.message || `${service} connection test failed`)
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchSettings()
    toast.success('Settings refreshed')
  }

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="alert alert-danger m-4">
        <h4>Error Loading Settings</h4>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchSettings}>
          <i className="ti ti-refresh me-2" />Retry
        </button>
      </div>
    )
  }


  return (
    <>
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
        </div>
      </div>

      {/* Tabs */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body p-2">
              <ul className="nav nav-pills flex-wrap gap-2">
                {tabs.map(tab => (
                  <li key={tab.id} className="nav-item">
                    <button
                      className={`nav-link d-flex align-items-center ${activeTab === tab.id ? 'active' : ''}`}
                      style={{ fontSize: 13, padding: '8px 16px' }}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <i className={`${tab.icon} me-2`} />
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="col-lg-8">
              {/* Branding Settings */}
              {activeTab === 'branding' && (
                <>
                  <div className="mb-4">
                    <label className="form-label">Platform Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.platform_name || ''}
                      onChange={(e) => handleSettingChange('platform_name', e.target.value)}
                    />
                    <small className="text-muted">Name displayed throughout the platform</small>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Company Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.company_name || ''}
                      onChange={(e) => handleSettingChange('company_name', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Support Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={settings.support_email || ''}
                      onChange={(e) => handleSettingChange('support_email', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Support Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.support_phone || ''}
                      onChange={(e) => handleSettingChange('support_phone', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Primary Color</label>
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={settings.primary_color || '#4e73df'}
                      onChange={(e) => handleSettingChange('primary_color', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Email Settings */}
              {activeTab === 'email' && (
                <>
                  <div className="mb-4">
                    <label className="form-label">SMTP Host <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.smtp_host || ''}
                      onChange={(e) => handleSettingChange('smtp_host', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">SMTP Port <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.smtp_port || 587}
                      onChange={(e) => handleSettingChange('smtp_port', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">SMTP Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.smtp_username || ''}
                      onChange={(e) => handleSettingChange('smtp_username', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">SMTP Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={settings.smtp_password || ''}
                      onChange={(e) => handleSettingChange('smtp_password', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">From Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={settings.from_email || ''}
                      onChange={(e) => handleSettingChange('from_email', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* SMS Settings */}
              {activeTab === 'sms' && (
                <>
                  <div className="mb-4">
                    <label className="form-label">SMS Provider</label>
                    <select
                      className="form-select"
                      value={settings.sms_provider || 'twilio'}
                      onChange={(e) => handleSettingChange('sms_provider', e.target.value)}
                    >
                      <option value="twilio">Twilio</option>
                      <option value="msg91">MSG91</option>
                      <option value="aws-sns">AWS SNS</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">API Key</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.sms_api_key || ''}
                      onChange={(e) => handleSettingChange('sms_api_key', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">API Secret</label>
                    <input
                      type="password"
                      className="form-control"
                      value={settings.sms_api_secret || ''}
                      onChange={(e) => handleSettingChange('sms_api_secret', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.sms_enabled === 'true' || settings.sms_enabled === true}
                        onChange={(e) => handleSettingChange('sms_enabled', e.target.checked)}
                      />
                      <label className="form-check-label">Enable SMS Notifications</label>
                    </div>
                  </div>
                </>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <>
                  <div className="mb-4">
                    <label className="form-label">Razorpay Key ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.razorpay_key_id || ''}
                      onChange={(e) => handleSettingChange('razorpay_key_id', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Razorpay Key Secret</label>
                    <input
                      type="password"
                      className="form-control"
                      value={settings.razorpay_key_secret || ''}
                      onChange={(e) => handleSettingChange('razorpay_key_secret', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Stripe Publishable Key</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.stripe_publishable_key || ''}
                      onChange={(e) => handleSettingChange('stripe_publishable_key', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Stripe Secret Key</label>
                    <input
                      type="password"
                      className="form-control"
                      value={settings.stripe_secret_key || ''}
                      onChange={(e) => handleSettingChange('stripe_secret_key', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Default Currency</label>
                    <select
                      className="form-select"
                      value={settings.default_currency || 'INR'}
                      onChange={(e) => handleSettingChange('default_currency', e.target.value)}
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </>
              )}

              {/* Storage Settings */}
              {activeTab === 'storage' && (
                <>
                  <div className="mb-4">
                    <label className="form-label">Storage Provider</label>
                    <select
                      className="form-select"
                      value={settings.storage_provider || 'local'}
                      onChange={(e) => handleSettingChange('storage_provider', e.target.value)}
                    >
                      <option value="local">Local</option>
                      <option value="aws-s3">AWS S3</option>
                      <option value="google-cloud">Google Cloud</option>
                      <option value="azure">Azure</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Max File Size (MB)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.max_file_size || 10}
                      onChange={(e) => handleSettingChange('max_file_size', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Allowed File Types</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.allowed_file_types || 'jpg,jpeg,png,pdf,doc,docx'}
                      onChange={(e) => handleSettingChange('allowed_file_types', e.target.value)}
                    />
                    <small className="text-muted">Comma-separated list</small>
                  </div>
                </>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <>
                  <div className="mb-4">
                    <label className="form-label">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.session_timeout || 30}
                      onChange={(e) => handleSettingChange('session_timeout', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Max Login Attempts</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.max_login_attempts || 5}
                      onChange={(e) => handleSettingChange('max_login_attempts', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Password Min Length</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.password_min_length || 8}
                      onChange={(e) => handleSettingChange('password_min_length', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.two_factor_auth === 'true' || settings.two_factor_auth === true}
                        onChange={(e) => handleSettingChange('two_factor_auth', e.target.checked)}
                      />
                      <label className="form-check-label">Enable Two-Factor Authentication</label>
                    </div>
                  </div>
                </>
              )}

              {/* API Keys */}
              {activeTab === 'api' && (
                <>
                  <div className="mb-4">
                    <label className="form-label">Google Maps API Key</label>
                    <input
                      type="password"
                      className="form-control"
                      value={settings.google_maps_api_key || ''}
                      onChange={(e) => handleSettingChange('google_maps_api_key', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">reCAPTCHA Site Key</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.recaptcha_site_key || ''}
                      onChange={(e) => handleSettingChange('recaptcha_site_key', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">reCAPTCHA Secret Key</label>
                    <input
                      type="password"
                      className="form-control"
                      value={settings.recaptcha_secret_key || ''}
                      onChange={(e) => handleSettingChange('recaptcha_secret_key', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Backup Settings */}
              {activeTab === 'backup' && (
                <>
                  <div className="mb-4">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.auto_backup_enabled === 'true' || settings.auto_backup_enabled === true}
                        onChange={(e) => handleSettingChange('auto_backup_enabled', e.target.checked)}
                      />
                      <label className="form-check-label">Enable Automatic Backups</label>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Backup Frequency</label>
                    <select
                      className="form-select"
                      value={settings.backup_frequency || 'daily'}
                      onChange={(e) => handleSettingChange('backup_frequency', e.target.value)}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Backup Retention (days)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.backup_retention_days || 30}
                      onChange={(e) => handleSettingChange('backup_retention_days', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions Sidebar */}
            <div className="col-lg-4">
              <div className="card">
                <div className="card-header">
                  <h6 className="card-title mb-0">Quick Actions</h6>
                </div>
                <div className="card-body">
                  {activeTab === 'email' && (
                    <button 
                      className="btn btn-outline-primary btn-sm w-100 mb-2" 
                      onClick={() => handleTestConnection('email')}
                    >
                      <i className="ti ti-mail me-2"></i>Test Email Connection
                    </button>
                  )}
                  {activeTab === 'sms' && (
                    <button 
                      className="btn btn-outline-primary btn-sm w-100 mb-2" 
                      onClick={() => handleTestConnection('sms')}
                    >
                      <i className="ti ti-message me-2"></i>Test SMS Connection
                    </button>
                  )}
                  {activeTab === 'payment' && (
                    <>
                      <button 
                        className="btn btn-outline-primary btn-sm w-100 mb-2" 
                        onClick={() => handleTestConnection('razorpay')}
                      >
                        <i className="ti ti-credit-card me-2"></i>Test Razorpay
                      </button>
                      <button 
                        className="btn btn-outline-primary btn-sm w-100 mb-2" 
                        onClick={() => handleTestConnection('stripe')}
                      >
                        <i className="ti ti-credit-card me-2"></i>Test Stripe
                      </button>
                    </>
                  )}
                  {activeTab === 'storage' && (
                    <button 
                      className="btn btn-outline-primary btn-sm w-100 mb-2" 
                      onClick={() => handleTestConnection('storage')}
                    >
                      <i className="ti ti-database me-2"></i>Test Storage
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PlatformSettingsPage
