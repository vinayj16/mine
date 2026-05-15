import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface SmtpSettings {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
  fromEmail: string;
  fromName: string;
}

interface PhpMailerSettings {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
  fromEmail: string;
  fromName: string;
}

interface GoogleSettings {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  fromEmail: string;
  fromName: string;
}

interface EmailSettings {
  _id: string;
  institutionId: string;
  smtp: SmtpSettings;
  phpMailer: PhpMailerSettings;
  google: GoogleSettings;
  activeProvider: 'smtp' | 'phpMailer' | 'google' | 'none';
  isActive: boolean;
}

const EmailConfig: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'smtp' | 'phpMailer' | 'google'>('smtp');

  const [smtpForm, setSmtpForm] = useState<SmtpSettings>({
    enabled: false,
    host: '',
    port: 587,
    username: '',
    password: '',
    encryption: 'tls',
    fromEmail: '',
    fromName: ''
  });

  const [phpMailerForm, setPhpMailerForm] = useState<PhpMailerSettings>({
    enabled: false,
    host: '',
    port: 587,
    username: '',
    password: '',
    encryption: 'tls',
    fromEmail: '',
    fromName: ''
  });

  const [googleForm, setGoogleForm] = useState<GoogleSettings>({
    enabled: false,
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    fromEmail: '',
    fromName: ''
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/email-settings');

      if (response.data.success) {
        const data = response.data.data;
        setSettings(data);
        setSmtpForm(data.smtp);
        setPhpMailerForm(data.phpMailer);
        setGoogleForm(data.google);
      }
    } catch (err: any) {
      console.error('Error fetching email settings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load email configuration';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSmtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!smtpForm.host || !smtpForm.fromEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      const response = await apiClient.put('/email-settings/smtp', smtpForm);

      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('SMTP settings updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating SMTP settings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update SMTP settings';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePhpMailerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phpMailerForm.host || !phpMailerForm.fromEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      const response = await apiClient.put('/email-settings/phpmailer', phpMailerForm);

      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('PHP Mailer settings updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating PHP Mailer settings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update PHP Mailer settings';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!googleForm.clientId || !googleForm.clientSecret || !googleForm.fromEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      const response = await apiClient.put('/email-settings/google', googleForm);

      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Google settings updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating Google settings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update Google settings';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (provider: 'smtp' | 'phpMailer' | 'google') => {
    try {
      setTesting(true);

      const response = await apiClient.get(`/email-settings/test/${provider}`);

      if (response.data.success) {
        toast.success(`${provider.toUpperCase()} connection test successful!`);
      } else {
        toast.error(response.data.message || 'Connection test failed');
      }
    } catch (err: any) {
      console.error('Error testing connection:', err);
      const errorMessage = err.response?.data?.message || 'Connection test failed';
      toast.error(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  const handleToggleProvider = async (provider: 'smtp' | 'phpMailer' | 'google', enabled: boolean) => {
    try {
      const response = await apiClient.post('/email-settings/toggle', {
        provider,
        enabled
      });

      if (response.data.success) {
        setSettings(response.data.data);
        toast.success(`${provider} ${enabled ? 'enabled' : 'disabled'} successfully`);
      }
    } catch (err: any) {
      console.error('Error toggling provider:', err);
      const errorMessage = err.response?.data?.message || 'Failed to toggle provider';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading email configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="page-title mb-1">Email Configuration</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">Email Config</li>
          </ol>
        </nav>

        <div className="card mt-3">
          <div className="card-body">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="ti ti-alert-circle me-2 fs-4"></i>
              <div className="flex-grow-1">
                <h5 className="alert-heading">Error Loading Email Configuration</h5>
                <p className="mb-0">{error}</p>
              </div>
              <button
                className="btn btn-outline-danger ms-3"
                onClick={fetchSettings}
              >
                <i className="ti ti-refresh me-1"></i>Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div>
        <h3 className="page-title mb-1">Email Configuration</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">Email Config</li>
          </ol>
        </nav>

        <div className="card mt-3">
          <div className="card-body text-center py-5">
            <i className="ti ti-database-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
            <p className="mt-2 text-muted">No email configuration available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="page-title mb-1">Email Configuration</h3>
      <nav>
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active">Email Config</li>
        </ol>
      </nav>

      <div className="card mt-3">
        <div className="card-header">
          <h5 className="mb-0">Email Provider Settings</h5>
          {settings.activeProvider !== 'none' && (
            <p className="text-muted mb-0 mt-1">
              Active Provider: <span className="badge bg-success">{settings.activeProvider.toUpperCase()}</span>
            </p>
          )}
        </div>
        <div className="card-body">
          {/* TABS */}
          <ul className="nav nav-tabs mb-3" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'smtp' ? 'active' : ''}`}
                onClick={() => setActiveTab('smtp')}
                type="button"
              >
                <i className="ti ti-mail me-1"></i>SMTP
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'phpMailer' ? 'active' : ''}`}
                onClick={() => setActiveTab('phpMailer')}
                type="button"
              >
                <i className="ti ti-brand-php me-1"></i>PHP Mailer
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'google' ? 'active' : ''}`}
                onClick={() => setActiveTab('google')}
                type="button"
              >
                <i className="ti ti-brand-google me-1"></i>Google
              </button>
            </li>
          </ul>

          {/* SMTP TAB */}
          {activeTab === 'smtp' && (
            <form onSubmit={handleSmtpSubmit}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">SMTP Configuration</h6>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={smtpForm.enabled}
                    onChange={(e) => {
                      setSmtpForm({ ...smtpForm, enabled: e.target.checked });
                      handleToggleProvider('smtp', e.target.checked);
                    }}
                  />
                  <label className="form-check-label">Enable SMTP</label>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">SMTP Host <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    placeholder="smtp.example.com"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Port <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    value={smtpForm.port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={smtpForm.username}
                    onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })}
                    placeholder="username"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={smtpForm.password}
                    onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Encryption</label>
                  <select
                    className="form-select"
                    value={smtpForm.encryption}
                    onChange={(e) => setSmtpForm({ ...smtpForm, encryption: e.target.value as 'tls' | 'ssl' | 'none' })}
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">From Email <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    value={smtpForm.fromEmail}
                    onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                    placeholder="noreply@example.com"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">From Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={smtpForm.fromName}
                    onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                    placeholder="School Name"
                  />
                </div>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check me-1"></i>Save SMTP Settings
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => handleTestConnection('smtp')}
                  disabled={testing || !smtpForm.enabled}
                >
                  {testing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Testing...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-send me-1"></i>Test Connection
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* PHP MAILER TAB */}
          {activeTab === 'phpMailer' && (
            <form onSubmit={handlePhpMailerSubmit}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">PHP Mailer Configuration</h6>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={phpMailerForm.enabled}
                    onChange={(e) => {
                      setPhpMailerForm({ ...phpMailerForm, enabled: e.target.checked });
                      handleToggleProvider('phpMailer', e.target.checked);
                    }}
                  />
                  <label className="form-check-label">Enable PHP Mailer</label>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Host <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={phpMailerForm.host}
                    onChange={(e) => setPhpMailerForm({ ...phpMailerForm, host: e.target.value })}
                    placeholder="smtp.example.com"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Port <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    value={phpMailerForm.port}
                    onChange={(e) => setPhpMailerForm({ ...phpMailerForm, port: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={phpMailerForm.username}
                    onChange={(e) => setPhpMailerForm({ ...phpMailerForm, username: e.target.value })}
                    placeholder="username"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={phpMailerForm.password}
                    onChange={(e) => setPhpMailerForm({ ...phpMailerForm, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Encryption</label>
                  <select
                    className="form-select"
                    value={phpMailerForm.encryption}
                    onChange={(e) => setPhpMailerForm({ ...phpMailerForm, encryption: e.target.value as 'tls' | 'ssl' | 'none' })}
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">From Email <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    value={phpMailerForm.fromEmail}
                    onChange={(e) => setPhpMailerForm({ ...phpMailerForm, fromEmail: e.target.value })}
                    placeholder="noreply@example.com"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">From Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={phpMailerForm.fromName}
                    onChange={(e) => setPhpMailerForm({ ...phpMailerForm, fromName: e.target.value })}
                    placeholder="School Name"
                  />
                </div>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check me-1"></i>Save PHP Mailer Settings
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => handleTestConnection('phpMailer')}
                  disabled={testing || !phpMailerForm.enabled}
                >
                  {testing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Testing...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-send me-1"></i>Test Connection
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* GOOGLE TAB */}
          {activeTab === 'google' && (
            <form onSubmit={handleGoogleSubmit}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Google OAuth Configuration</h6>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={googleForm.enabled}
                    onChange={(e) => {
                      setGoogleForm({ ...googleForm, enabled: e.target.checked });
                      handleToggleProvider('google', e.target.checked);
                    }}
                  />
                  <label className="form-check-label">Enable Google</label>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Client ID <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={googleForm.clientId}
                    onChange={(e) => setGoogleForm({ ...googleForm, clientId: e.target.value })}
                    placeholder="Google Client ID"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Client Secret <span className="text-danger">*</span></label>
                  <input
                    type="password"
                    className="form-control"
                    value={googleForm.clientSecret}
                    onChange={(e) => setGoogleForm({ ...googleForm, clientSecret: e.target.value })}
                    placeholder="Google Client Secret"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Refresh Token</label>
                  <input
                    type="text"
                    className="form-control"
                    value={googleForm.refreshToken}
                    onChange={(e) => setGoogleForm({ ...googleForm, refreshToken: e.target.value })}
                    placeholder="Refresh Token"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">From Email <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    value={googleForm.fromEmail}
                    onChange={(e) => setGoogleForm({ ...googleForm, fromEmail: e.target.value })}
                    placeholder="noreply@example.com"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">From Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={googleForm.fromName}
                    onChange={(e) => setGoogleForm({ ...googleForm, fromName: e.target.value })}
                    placeholder="School Name"
                  />
                </div>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check me-1"></i>Save Google Settings
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => handleTestConnection('google')}
                  disabled={testing || !googleForm.enabled}
                >
                  {testing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Testing...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-send me-1"></i>Test Connection
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailConfig;
