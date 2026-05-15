import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface ProviderConfig {
  enabled: boolean;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  encryption?: 'tls' | 'ssl' | 'none';
  fromEmail?: string;
  fromName?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

interface EmailSettings {
  phpMailer: ProviderConfig;
  smtp: ProviderConfig;
  google: ProviderConfig;
  activeProvider: 'phpMailer' | 'smtp' | 'google' | 'none';
}

const EmailSettingsPage = () => {
  const [settings, setSettings] = useState<EmailSettings>({
    phpMailer: { enabled: false },
    smtp: { enabled: false },
    google: { enabled: false },
    activeProvider: 'none'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'phpMailer' | 'smtp' | 'google' | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/email-settings');

      if (response.data.success) {
        setSettings(response.data.data || {
          phpMailer: { enabled: false },
          smtp: { enabled: false },
          google: { enabled: false },
          activeProvider: 'none'
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch email settings:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProvider = async (provider: 'phpMailer' | 'smtp' | 'google') => {
    try {
      const enabled = !settings[provider].enabled;
      
      const response = await apiClient.post('/email-settings/toggle', {
        provider,
        enabled
      });

      if (response.data.success) {
        setSettings(response.data.data);
        toast.success(`${getProviderName(provider)} ${enabled ? 'enabled' : 'disabled'} successfully`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update provider status');
    }
  };

  const handleConfigureProvider = (provider: 'phpMailer' | 'smtp' | 'google') => {
    setSelectedProvider(provider);
    setShowConfigModal(true);
  };

  const handleSaveProviderConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProvider) return;

    try {
      setSaving(true);
      const formData = new FormData(e.currentTarget);
      const config: any = {};
      
      formData.forEach((value, key) => {
        if (key === 'port') {
          config[key] = parseInt(value as string);
        } else {
          config[key] = value;
        }
      });

      const endpoint = `/email-settings/${selectedProvider.toLowerCase()}`;
      const response = await apiClient.put(endpoint, config);

      if (response.data.success) {
        setSettings(response.data.data);
        setShowConfigModal(false);
        toast.success('Provider configuration saved successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save provider configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestProvider = async (provider: 'phpMailer' | 'smtp' | 'google') => {
    try {
      setTestingProvider(provider);
      const response = await apiClient.get(`/email-settings/test/${provider}`);

      if (response.data.success) {
        toast.success('Test email sent successfully');
      } else {
        toast.error('Failed to send test email');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to test email connection');
    } finally {
      setTestingProvider(null);
    }
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      phpMailer: 'PHP Mailer',
      smtp: 'SMTP',
      google: 'Google'
    };
    return names[provider] || provider;
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      phpMailer: '/assets/img/icons/php-icon.svg',
      smtp: '/assets/img/icons/smtp-icon.svg',
      google: '/assets/img/icons/google-icon-02.svg'
    };
    return icons[provider] || '/assets/img/icons/php-icon.svg';
  };

  const getProviderDescription = (provider: string) => {
    const descriptions: Record<string, string> = {
      phpMailer: 'Used to send emails safely and easily via PHP code from a web server.',
      smtp: 'SMTP is used to send, relay or forward messages from a mail client.',
      google: 'Cloud-based email marketing tool that assists marketers and developers.'
    };
    return descriptions[provider] || '';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">System Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/settings">Settings</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Email Settings
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon"
              onClick={fetchEmailSettings}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-xxl-2 col-xl-3">
          <div className="pt-3 d-flex flex-column list-group mb-4">
            <Link to="/settings/email" className="d-block rounded active p-2">
              Email Settings
            </Link>
            <Link to="/settings/email-templates" className="d-block rounded p-2">
              Email Templates
            </Link>
            <Link to="/settings/sms" className="d-block rounded p-2">
              SMS Settings
            </Link>
            <Link to="/settings/otp" className="d-block rounded p-2">
              OTP
            </Link>
            <Link to="/settings/gdpr" className="d-block rounded p-2">
              GDPR Cookies
            </Link>
          </div>
        </div>
        <div className="col-xxl-10 col-xl-9">
          <div className="flex-fill border-start ps-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
              <div className="mb-3">
                <h5 className="mb-1">Email Settings</h5>
                <p className="mb-0">Configure email providers for sending notifications</p>
              </div>
            </div>
            <div className="row">
              {(['phpMailer', 'smtp', 'google'] as const).map((provider) => (
                <div className="col-xxl-4 col-xl-6" key={provider}>
                  <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between border-0 mb-3 pb-0">
                      <div className="d-flex align-items-center">
                        <span className="avatar avatar-lg p-2 rounded bg-gray flex-shrink-0 me-2">
                          <img src={getProviderIcon(provider)} alt={getProviderName(provider)} />
                        </span>
                        <h6>{getProviderName(provider)}</h6>
                      </div>
                      <span className={`badge ${settings[provider].enabled ? 'bg-transparent-success text-success' : 'bg-transparent-dark text-dark'}`}>
                        {settings[provider].enabled ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <div className="card-body pt-0">
                      <p>{getProviderDescription(provider)}</p>
                    </div>
                    <div className="card-footer d-flex justify-content-between align-items-center">
                      <div>
                        <button 
                          className="btn btn-outline-light"
                          onClick={() => handleConfigureProvider(provider)}
                        >
                          <i className="ti ti-tool me-2"></i>
                          {settings[provider].enabled ? 'Edit' : 'Configure'}
                        </button>
                        {settings[provider].enabled && (
                          <button 
                            className="btn btn-outline-light ms-2"
                            onClick={() => handleTestProvider(provider)}
                            disabled={testingProvider === provider}
                          >
                            <i className="ti ti-send me-2"></i>
                            {testingProvider === provider ? 'Testing...' : 'Test'}
                          </button>
                        )}
                      </div>
                      <div className="status-toggle modal-status">
                        <input 
                          type="checkbox" 
                          id={`provider-${provider}`}
                          className="check"
                          checked={settings[provider].enabled}
                          onChange={() => handleToggleProvider(provider)}
                        />
                        <label 
                          htmlFor={`provider-${provider}`}
                          className="checktoggle"
                        ></label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedProvider && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Configure {getProviderName(selectedProvider)}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowConfigModal(false)}
                />
              </div>
              <form onSubmit={handleSaveProviderConfig}>
                <div className="modal-body">
                  {selectedProvider === 'phpMailer' && (
                    <>
                      <div className="row">
                        <div className="col-md-8 mb-3">
                          <label className="form-label">SMTP Host</label>
                          <input 
                            type="text" 
                            name="host"
                            className="form-control"
                            defaultValue={settings.phpMailer.host}
                            placeholder="smtp.example.com"
                            required
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Port</label>
                          <input 
                            type="number" 
                            name="port"
                            className="form-control"
                            defaultValue={settings.phpMailer.port || 587}
                            required
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input 
                          type="text" 
                          name="username"
                          className="form-control"
                          defaultValue={settings.phpMailer.username}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input 
                          type="password" 
                          name="password"
                          className="form-control"
                          defaultValue={settings.phpMailer.password}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Encryption</label>
                        <select 
                          name="encryption"
                          className="form-select"
                          defaultValue={settings.phpMailer.encryption || 'tls'}
                        >
                          <option value="tls">TLS</option>
                          <option value="ssl">SSL</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">From Email</label>
                        <input 
                          type="email" 
                          name="fromEmail"
                          className="form-control"
                          defaultValue={settings.phpMailer.fromEmail}
                          placeholder="noreply@example.com"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">From Name</label>
                        <input 
                          type="text" 
                          name="fromName"
                          className="form-control"
                          defaultValue={settings.phpMailer.fromName}
                          placeholder="Your Company"
                          required
                        />
                      </div>
                    </>
                  )}
                  {selectedProvider === 'smtp' && (
                    <>
                      <div className="row">
                        <div className="col-md-8 mb-3">
                          <label className="form-label">SMTP Host</label>
                          <input 
                            type="text" 
                            name="host"
                            className="form-control"
                            defaultValue={settings.smtp.host}
                            placeholder="smtp.example.com"
                            required
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Port</label>
                          <input 
                            type="number" 
                            name="port"
                            className="form-control"
                            defaultValue={settings.smtp.port || 587}
                            required
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input 
                          type="text" 
                          name="username"
                          className="form-control"
                          defaultValue={settings.smtp.username}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input 
                          type="password" 
                          name="password"
                          className="form-control"
                          defaultValue={settings.smtp.password}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Encryption</label>
                        <select 
                          name="encryption"
                          className="form-select"
                          defaultValue={settings.smtp.encryption || 'tls'}
                        >
                          <option value="tls">TLS</option>
                          <option value="ssl">SSL</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">From Email</label>
                        <input 
                          type="email" 
                          name="fromEmail"
                          className="form-control"
                          defaultValue={settings.smtp.fromEmail}
                          placeholder="noreply@example.com"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">From Name</label>
                        <input 
                          type="text" 
                          name="fromName"
                          className="form-control"
                          defaultValue={settings.smtp.fromName}
                          placeholder="Your Company"
                          required
                        />
                      </div>
                    </>
                  )}
                  {selectedProvider === 'google' && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Client ID</label>
                        <input 
                          type="text" 
                          name="clientId"
                          className="form-control"
                          defaultValue={settings.google.clientId}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Client Secret</label>
                        <input 
                          type="password" 
                          name="clientSecret"
                          className="form-control"
                          defaultValue={settings.google.clientSecret}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Refresh Token</label>
                        <input 
                          type="text" 
                          name="refreshToken"
                          className="form-control"
                          defaultValue={settings.google.refreshToken}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">From Email</label>
                        <input 
                          type="email" 
                          name="fromEmail"
                          className="form-control"
                          defaultValue={settings.google.fromEmail}
                          placeholder="noreply@example.com"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">From Name</label>
                        <input 
                          type="text" 
                          name="fromName"
                          className="form-control"
                          defaultValue={settings.google.fromName}
                          placeholder="Your Company"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowConfigModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSettingsPage;
