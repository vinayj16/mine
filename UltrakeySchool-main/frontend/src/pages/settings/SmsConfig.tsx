import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface SmsConfig {
  provider: 'twilio' | 'aws-sns' | 'nexmo' | 'messagebird' | 'textlocal';
  enabled: boolean;
  credentials: {
    accountSid?: string;
    authToken?: string;
    phoneNumber?: string;
    apiKey?: string;
    apiSecret?: string;
    senderId?: string;
  };
  settings: {
    defaultCountryCode: string;
    enableDeliveryReports: boolean;
    maxRetries: number;
  };
}

const SmsConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [config, setConfig] = useState<SmsConfig>({
    provider: 'twilio',
    enabled: false,
    credentials: {
      accountSid: '',
      authToken: '',
      phoneNumber: '',
      apiKey: '',
      apiSecret: '',
      senderId: ''
    },
    settings: {
      defaultCountryCode: '+1',
      enableDeliveryReports: true,
      maxRetries: 3
    }
  });

  const institutionId = '507f1f77bcf86cd799439011';

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/settings', {
        params: {
          institutionId,
          type: 'sms'
        }
      });

      if (response.data.success && response.data.data) {
        const smsData = response.data.data.data || response.data.data;
        if (smsData.provider) {
          setConfig(smsData);
        }
      }
    } catch (err: any) {
      console.error('Error fetching SMS config:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load SMS configuration';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (config.enabled) {
      if (config.provider === 'twilio') {
        if (!config.credentials.accountSid || !config.credentials.authToken || !config.credentials.phoneNumber) {
          toast.error('Please fill in all Twilio credentials');
          return;
        }
      } else if (config.provider === 'aws-sns') {
        if (!config.credentials.apiKey || !config.credentials.apiSecret) {
          toast.error('Please fill in AWS SNS credentials');
          return;
        }
      } else if (config.provider === 'nexmo' || config.provider === 'messagebird') {
        if (!config.credentials.apiKey || !config.credentials.apiSecret) {
          toast.error('Please fill in API credentials');
          return;
        }
      } else if (config.provider === 'textlocal') {
        if (!config.credentials.apiKey) {
          toast.error('Please fill in TextLocal API key');
          return;
        }
      }
    }

    try {
      setSaving(true);

      const response = await apiClient.put('/settings', {
        institutionId,
        type: 'sms',
        data: config
      });

      if (response.data.success) {
        toast.success('SMS configuration updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating SMS config:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update SMS configuration';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleTestSms = async () => {
    if (!config.enabled) {
      toast.error('Please enable SMS first');
      return;
    }

    try {
      setTesting(true);
      toast.info('Test SMS feature requires backend implementation');
    } catch (err: any) {
      toast.error('Failed to send test SMS');
    } finally {
      setTesting(false);
    }
  };

  const handleCredentialChange = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [field]: value
      }
    }));
  };

  const handleSettingChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading SMS configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="page-title mb-1">SMS Configuration</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">SMS Config</li>
          </ol>
        </nav>
        <div className="card mt-3">
          <div className="card-body">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="ti ti-alert-circle me-2 fs-4"></i>
              <div className="flex-grow-1">
                <h5 className="alert-heading">Error Loading SMS Configuration</h5>
                <p className="mb-0">{error}</p>
              </div>
              <button className="btn btn-outline-danger ms-3" onClick={fetchConfig}>
                <i className="ti ti-refresh me-1"></i>Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="page-title mb-1">SMS Configuration</h3>
      <nav>
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active">SMS Config</li>
        </ol>
      </nav>

      <div className="card mt-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">SMS Provider Settings</h5>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              id="smsEnabled"
            />
            <label className="form-check-label" htmlFor="smsEnabled">
              Enable SMS
            </label>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* PROVIDER SELECTION */}
            <div className="mb-4">
              <label className="form-label">
                <i className="ti ti-building me-1"></i>SMS Provider
              </label>
              <select
                className="form-select"
                value={config.provider}
                onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
              >
                <option value="twilio">Twilio</option>
                <option value="aws-sns">AWS SNS</option>
                <option value="nexmo">Nexmo (Vonage)</option>
                <option value="messagebird">MessageBird</option>
                <option value="textlocal">TextLocal</option>
              </select>
              <small className="text-muted">Select your SMS service provider</small>
            </div>

            {/* TWILIO CREDENTIALS */}
            {config.provider === 'twilio' && (
              <div className="border rounded p-3 mb-4">
                <h6 className="mb-3">
                  <i className="ti ti-key me-1"></i>Twilio Credentials
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Account SID <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={config.credentials.accountSid || ''}
                      onChange={(e) => handleCredentialChange('accountSid', e.target.value)}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Auth Token <span className="text-danger">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      value={config.credentials.authToken || ''}
                      onChange={(e) => handleCredentialChange('authToken', e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={config.credentials.phoneNumber || ''}
                      onChange={(e) => handleCredentialChange('phoneNumber', e.target.value)}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AWS SNS CREDENTIALS */}
            {config.provider === 'aws-sns' && (
              <div className="border rounded p-3 mb-4">
                <h6 className="mb-3">
                  <i className="ti ti-key me-1"></i>AWS SNS Credentials
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Access Key ID <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={config.credentials.apiKey || ''}
                      onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Secret Access Key <span className="text-danger">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      value={config.credentials.apiSecret || ''}
                      onChange={(e) => handleCredentialChange('apiSecret', e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Sender ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={config.credentials.senderId || ''}
                      onChange={(e) => handleCredentialChange('senderId', e.target.value)}
                      placeholder="YourBrand"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NEXMO/MESSAGEBIRD CREDENTIALS */}
            {(config.provider === 'nexmo' || config.provider === 'messagebird') && (
              <div className="border rounded p-3 mb-4">
                <h6 className="mb-3">
                  <i className="ti ti-key me-1"></i>{config.provider === 'nexmo' ? 'Nexmo' : 'MessageBird'} Credentials
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">API Key <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={config.credentials.apiKey || ''}
                      onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
                      placeholder="API Key"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">API Secret <span className="text-danger">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      value={config.credentials.apiSecret || ''}
                      onChange={(e) => handleCredentialChange('apiSecret', e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Sender ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={config.credentials.senderId || ''}
                      onChange={(e) => handleCredentialChange('senderId', e.target.value)}
                      placeholder="YourBrand"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TEXTLOCAL CREDENTIALS */}
            {config.provider === 'textlocal' && (
              <div className="border rounded p-3 mb-4">
                <h6 className="mb-3">
                  <i className="ti ti-key me-1"></i>TextLocal Credentials
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">API Key <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={config.credentials.apiKey || ''}
                      onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
                      placeholder="API Key"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Sender ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={config.credentials.senderId || ''}
                      onChange={(e) => handleCredentialChange('senderId', e.target.value)}
                      placeholder="TXTLCL"
                      maxLength={6}
                    />
                    <small className="text-muted">Max 6 characters</small>
                  </div>
                </div>
              </div>
            )}

            {/* GENERAL SETTINGS */}
            <div className="border rounded p-3 mb-4">
              <h6 className="mb-3">
                <i className="ti ti-settings me-1"></i>General Settings
              </h6>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Default Country Code</label>
                  <select
                    className="form-select"
                    value={config.settings.defaultCountryCode}
                    onChange={(e) => handleSettingChange('defaultCountryCode', e.target.value)}
                  >
                    <option value="+1">+1 (US/Canada)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+91">+91 (India)</option>
                    <option value="+971">+971 (UAE)</option>
                    <option value="+966">+966 (Saudi Arabia)</option>
                    <option value="+61">+61 (Australia)</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Max Retries</label>
                  <input
                    type="number"
                    className="form-control"
                    value={config.settings.maxRetries}
                    onChange={(e) => handleSettingChange('maxRetries', Number(e.target.value))}
                    min="0"
                    max="5"
                  />
                  <small className="text-muted">Number of retry attempts</small>
                </div>
                <div className="col-md-4">
                  <div className="form-check form-switch mt-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={config.settings.enableDeliveryReports}
                      onChange={(e) => handleSettingChange('enableDeliveryReports', e.target.checked)}
                      id="deliveryReports"
                    />
                    <label className="form-check-label" htmlFor="deliveryReports">
                      Enable Delivery Reports
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check me-1"></i>Save Configuration
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleTestSms}
                disabled={testing || !config.enabled}
              >
                {testing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Testing...
                  </>
                ) : (
                  <>
                    <i className="ti ti-send me-1"></i>Test SMS
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={fetchConfig}
              >
                <i className="ti ti-refresh me-1"></i>Reset
              </button>
            </div>
          </form>

          {/* INFO ALERT */}
          <div className="alert alert-info mt-4">
            <h6 className="alert-heading">
              <i className="ti ti-info-circle me-1"></i>Important Information
            </h6>
            <ul className="mb-0">
              <li>Ensure your SMS provider account is active and has sufficient credits</li>
              <li>Test the configuration before using in production</li>
              <li>Keep your API credentials secure and never share them</li>
              <li>Check your provider's documentation for rate limits and restrictions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsConfigPage;
