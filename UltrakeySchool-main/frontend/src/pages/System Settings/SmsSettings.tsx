import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface SmsProvider {
  name: string;
  provider: 'twilio' | 'aws-sns' | 'nexmo' | 'messagebird' | 'textlocal';
  enabled: boolean;
  config: {
    accountSid?: string;
    authToken?: string;
    phoneNumber?: string;
    apiKey?: string;
    apiSecret?: string;
    senderId?: string;
  };
}

interface SmsSettings {
  providers: SmsProvider[];
  defaultProvider: string;
  enableSMSNotifications: boolean;
}

const SmsSettingsPage = () => {
  const [settings, setSettings] = useState<SmsSettings>({
    providers: [],
    defaultProvider: 'twilio',
    enableSMSNotifications: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<SmsProvider | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    fetchSmsSettings();
  }, []);

  const fetchSmsSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/sms');

      if (response.data.success) {
        setSettings(response.data.data || {
          providers: getDefaultProviders(),
          defaultProvider: 'twilio',
          enableSMSNotifications: true
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch SMS settings:', error);
      // Initialize with default providers if fetch fails
      setSettings({
        providers: getDefaultProviders(),
        defaultProvider: 'twilio',
        enableSMSNotifications: true
      });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultProviders = (): SmsProvider[] => [
    {
      name: 'Twilio',
      provider: 'twilio',
      enabled: false,
      config: {
        accountSid: '',
        authToken: '',
        phoneNumber: ''
      }
    },
    {
      name: 'AWS SNS',
      provider: 'aws-sns',
      enabled: false,
      config: {
        apiKey: '',
        apiSecret: '',
        senderId: ''
      }
    },
    {
      name: 'Nexmo',
      provider: 'nexmo',
      enabled: false,
      config: {
        apiKey: '',
        apiSecret: '',
        senderId: ''
      }
    },
    {
      name: 'MessageBird',
      provider: 'messagebird',
      enabled: false,
      config: {
        apiKey: '',
        senderId: ''
      }
    },
    {
      name: 'TextLocal',
      provider: 'textlocal',
      enabled: false,
      config: {
        apiKey: '',
        senderId: ''
      }
    }
  ];

  const handleToggleProvider = async (provider: SmsProvider) => {
    try {
      const updatedProviders = settings.providers.map(p =>
        p.provider === provider.provider ? { ...p, enabled: !p.enabled } : p
      );

      const updatedSettings = { ...settings, providers: updatedProviders };
      setSettings(updatedSettings);

      await saveSmsSettings(updatedSettings);
      toast.success(`${provider.name} ${!provider.enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error: any) {
      toast.error('Failed to update provider status');
    }
  };

  const handleConfigureProvider = (provider: SmsProvider) => {
    setSelectedProvider(provider);
    setShowConfigModal(true);
  };

  const handleSaveProviderConfig = async (config: any) => {
    if (!selectedProvider) return;

    try {
      setSaving(true);
      const updatedProviders = settings.providers.map(p =>
        p.provider === selectedProvider.provider ? { ...p, config } : p
      );

      const updatedSettings = { ...settings, providers: updatedProviders };
      await saveSmsSettings(updatedSettings);
      
      setSettings(updatedSettings);
      setShowConfigModal(false);
      toast.success('Provider configuration saved successfully');
    } catch (error: any) {
      toast.error('Failed to save provider configuration');
    } finally {
      setSaving(false);
    }
  };

  const saveSmsSettings = async (updatedSettings: SmsSettings) => {
    const response = await apiClient.put('/settings/sms', updatedSettings);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to save settings');
    }
  };

  const handleTestProvider = async (provider: SmsProvider) => {
    try {
      const response = await apiClient.post('/settings/sms/test', {
        provider: provider.provider,
        config: provider.config
      });

      if (response.data.success) {
        toast.success('Test SMS sent successfully');
      } else {
        toast.error('Failed to send test SMS');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to test SMS configuration');
    }
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      twilio: '/assets/img/icons/sms-icon-01.svg',
      'aws-sns': '/assets/img/icons/sms-icon-02.svg',
      nexmo: '/assets/img/icons/sms-icon-03.svg',
      messagebird: '/assets/img/icons/sms-icon-01.svg',
      textlocal: '/assets/img/icons/sms-icon-02.svg'
    };
    return icons[provider] || '/assets/img/icons/sms-icon-01.svg';
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
                SMS Settings
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon"
              onClick={fetchSmsSettings}
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
            <Link to="/settings/email" className="d-block rounded p-2">
              Email Settings
            </Link>
            <Link to="/settings/email-templates" className="d-block rounded p-2">
              Email Templates
            </Link>
            <Link to="/settings/sms" className="d-block rounded active p-2">
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
                <h5 className="mb-1">SMS Settings</h5>
                <p className="mb-0">Configure SMS providers for sending notifications</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body p-3 pb-0">
                <div className="row">
                  {settings.providers.map((provider) => (
                    <div className="col-xxl-4 col-md-6" key={provider.provider}>
                      <div className="d-flex align-items-center justify-content-between bg-white p-3 border rounded mb-3">
                        <div className="d-flex align-items-center">
                          <img 
                            src={getProviderIcon(provider.provider)} 
                            alt={provider.name}
                            style={{ maxWidth: '120px', maxHeight: '40px' }}
                          />
                          <div className="ms-2">
                            <h6 className="mb-0">{provider.name}</h6>
                            <small className="text-muted">
                              {provider.enabled ? 'Active' : 'Inactive'}
                            </small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <div className="status-toggle modal-status">
                            <input 
                              type="checkbox" 
                              id={`provider-${provider.provider}`}
                              className="check"
                              checked={provider.enabled}
                              onChange={() => handleToggleProvider(provider)}
                            />
                            <label 
                              htmlFor={`provider-${provider.provider}`}
                              className="checktoggle"
                            ></label>
                          </div>
                          <button 
                            className="btn btn-outline-light bg-white btn-icon ms-2"
                            onClick={() => handleConfigureProvider(provider)}
                            title="Configure"
                          >
                            <i className="ti ti-settings-cog"></i>
                          </button>
                          {provider.enabled && (
                            <button 
                              className="btn btn-outline-light bg-white btn-icon ms-2"
                              onClick={() => handleTestProvider(provider)}
                              title="Test"
                            >
                              <i className="ti ti-send"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedProvider && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Configure {selectedProvider.name}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowConfigModal(false)}
                />
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const config: any = {};
                  formData.forEach((value, key) => {
                    config[key] = value;
                  });
                  handleSaveProviderConfig(config);
                }}>
                  {selectedProvider.provider === 'twilio' && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Account SID</label>
                        <input 
                          type="text" 
                          name="accountSid"
                          className="form-control"
                          defaultValue={selectedProvider.config.accountSid}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Auth Token</label>
                        <input 
                          type="password" 
                          name="authToken"
                          className="form-control"
                          defaultValue={selectedProvider.config.authToken}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Phone Number</label>
                        <input 
                          type="text" 
                          name="phoneNumber"
                          className="form-control"
                          defaultValue={selectedProvider.config.phoneNumber}
                          placeholder="+1234567890"
                          required
                        />
                      </div>
                    </>
                  )}
                  {(selectedProvider.provider === 'aws-sns' || selectedProvider.provider === 'nexmo') && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">API Key</label>
                        <input 
                          type="text" 
                          name="apiKey"
                          className="form-control"
                          defaultValue={selectedProvider.config.apiKey}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">API Secret</label>
                        <input 
                          type="password" 
                          name="apiSecret"
                          className="form-control"
                          defaultValue={selectedProvider.config.apiSecret}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Sender ID</label>
                        <input 
                          type="text" 
                          name="senderId"
                          className="form-control"
                          defaultValue={selectedProvider.config.senderId}
                          required
                        />
                      </div>
                    </>
                  )}
                  {(selectedProvider.provider === 'messagebird' || selectedProvider.provider === 'textlocal') && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">API Key</label>
                        <input 
                          type="text" 
                          name="apiKey"
                          className="form-control"
                          defaultValue={selectedProvider.config.apiKey}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Sender ID</label>
                        <input 
                          type="text" 
                          name="senderId"
                          className="form-control"
                          defaultValue={selectedProvider.config.senderId}
                          required
                        />
                      </div>
                    </>
                  )}
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
        </div>
      )}
    </div>
  );
};

export default SmsSettingsPage;
