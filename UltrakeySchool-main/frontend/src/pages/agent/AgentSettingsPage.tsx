import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { agentService } from '../../services/agentService';
import type { AgentSettings } from '../../services/agentService';

const DEFAULT_SETTINGS: AgentSettings = {
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    commissionAlerts: true,
    newInstitutionAlerts: true,
    performanceReports: false
  },
  privacy: {
    showProfileToPublic: false,
    showPerformanceStats: true,
    allowContactRequests: false
  },
  preferences: {
    language: 'English',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
    theme: 'light'
  },
  security: {
    notifications: false,
    emails: false,
    sms: false,
    twoFactorAuth: false,
    sessionTimeout: 30,
    lastPasswordChange: new Date().toISOString().split('T')[0]
  }
};

const AgentSettingsPage = () => {
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_SETTINGS);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'preferences' | 'security'>('notifications');
  const [hasChanges, setHasChanges] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      const data = await agentService.getSettings();
      // Merge with defaults to prevent undefined nested objects
      const merged = {
        notifications: { ...DEFAULT_SETTINGS.notifications, ...data?.notifications },
        privacy: { ...DEFAULT_SETTINGS.privacy, ...data?.privacy },
        preferences: { ...DEFAULT_SETTINGS.preferences, ...data?.preferences },
        security: { ...DEFAULT_SETTINGS.security, ...data?.security }
      };
      setSettings(merged);
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings. Using default values.');
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSettingChange = (category: keyof AgentSettings, setting: string, value: any) => {
    setSettings(prev => {
      const categoryDefaults = DEFAULT_SETTINGS[category] as Record<string, any>;
      return {
        ...prev,
        [category]: {
          ...categoryDefaults,
          ...(prev[category] as Record<string, any> || {}),
          [setting]: value
        }
      };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await agentService.updateSettings(settings);
      toast.success('Settings saved successfully!');
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings(DEFAULT_SETTINGS);
      setHasChanges(true);
      toast.info('Settings reset to default values. Click Save to apply changes.');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      // TODO: Call actual password change API endpoint
      // await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Update last password change date
      setSettings(prev => ({
        ...prev,
        security: {
          ...prev.security,
          lastPasswordChange: new Date().toISOString().split('T')[0]
        }
      }));
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password: ' + (error.message || 'Unknown error'));
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Settings</h4>
          <p className="text-muted mb-0">Manage your account settings and preferences</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-danger" onClick={handleReset}>
            <i className="ti ti-refresh me-2" />Reset to Default
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="ti ti-check me-2" />Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <i className="ti ti-bell me-2" />Notifications
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'privacy' ? 'active' : ''}`}
                onClick={() => setActiveTab('privacy')}
              >
                <i className="ti ti-lock me-2" />Privacy
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'preferences' ? 'active' : ''}`}
                onClick={() => setActiveTab('preferences')}
              >
                <i className="ti ti-settings me-2" />Preferences
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <i className="ti ti-shield me-2" />Security
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {activeTab === 'notifications' && (
            <div className="tab-content">
              <h6 className="mb-4">Notification Preferences</h6>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="emailNotifications"
                      checked={settings.notifications?.emailNotifications ?? true}
                      onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="emailNotifications">
                      Email Notifications
                    </label>
                  </div>
                  <small className="text-muted d-block">Receive notifications via email</small>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="smsNotifications"
                      checked={settings.notifications?.smsNotifications ?? false}
                      onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="smsNotifications">
                      SMS Notifications
                    </label>
                  </div>
                  <small className="text-muted d-block">Receive notifications via SMS</small>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="pushNotifications"
                      checked={settings.notifications?.pushNotifications ?? true}
                      onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="pushNotifications">
                      Push Notifications
                    </label>
                  </div>
                  <small className="text-muted d-block">Receive browser push notifications</small>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="commissionAlerts"
                      checked={settings.notifications?.commissionAlerts ?? true}
                      onChange={(e) => handleSettingChange('notifications', 'commissionAlerts', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="commissionAlerts">
                      Commission Alerts
                    </label>
                  </div>
                  <small className="text-muted d-block">Get notified about new commissions</small>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="newInstitutionAlerts"
                      checked={settings.notifications?.newInstitutionAlerts ?? true}
                      onChange={(e) => handleSettingChange('notifications', 'newInstitutionAlerts', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="newInstitutionAlerts">
                      New Institution Alerts
                    </label>
                  </div>
                  <small className="text-muted d-block">Get notified when institutions are added</small>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="performanceReports"
                      checked={settings.notifications?.performanceReports ?? false}
                      onChange={(e) => handleSettingChange('notifications', 'performanceReports', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="performanceReports">
                      Performance Reports
                    </label>
                  </div>
                  <small className="text-muted d-block">Receive monthly performance reports</small>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="tab-content">
              <h6 className="mb-4">Privacy Settings</h6>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="showProfileToPublic"
                      checked={settings.privacy?.showProfileToPublic ?? false}
                      onChange={(e) => handleSettingChange('privacy', 'showProfileToPublic', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="showProfileToPublic">
                      Show Profile to Public
                    </label>
                  </div>
                  <small className="text-muted d-block">Make your profile visible to everyone</small>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="showPerformanceStats"
                      checked={settings.privacy?.showPerformanceStats ?? true}
                      onChange={(e) => handleSettingChange('privacy', 'showPerformanceStats', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="showPerformanceStats">
                      Show Performance Stats
                    </label>
                  </div>
                  <small className="text-muted d-block">Display your performance statistics</small>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="allowContactRequests"
                      checked={settings.privacy?.allowContactRequests ?? false}
                      onChange={(e) => handleSettingChange('privacy', 'allowContactRequests', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="allowContactRequests">
                      Allow Contact Requests
                    </label>
                  </div>
                  <small className="text-muted d-block">Let others contact you</small>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="tab-content">
              <h6 className="mb-4">General Preferences</h6>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Language</label>
                  <select
                    className="form-select"
                    value={settings.preferences?.language || 'English'}
                    onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Timezone</label>
                  <select
                    className="form-select"
                    value={settings.preferences?.timezone || 'Asia/Kolkata'}
                    onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}
                  >
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Date Format</label>
                  <select
                    className="form-select"
                    value={settings.preferences?.dateFormat || 'DD/MM/YYYY'}
                    onChange={(e) => handleSettingChange('preferences', 'dateFormat', e.target.value)}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Currency</label>
                  <select
                    className="form-select"
                    value={settings.preferences?.currency || 'INR'}
                    onChange={(e) => handleSettingChange('preferences', 'currency', e.target.value)}
                  >
                    <option value="INR">Indian Rupee (INR)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Theme</label>
                  <select
                    className="form-select"
                    value={settings.preferences?.theme || 'light'}
                    onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="tab-content">
              <h6 className="mb-4">Security Settings</h6>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="twoFactorAuth"
                      checked={settings.security?.twoFactorAuth ?? false}
                      onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="twoFactorAuth">
                      Two-Factor Authentication
                    </label>
                  </div>
                  <small className="text-muted d-block">Add an extra layer of security</small>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.security?.sessionTimeout ?? 30}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value) || 30)}
                    min="5"
                    max="120"
                  />
                  <small className="text-muted d-block">Auto-logout after inactivity</small>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Last Password Change</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.security?.lastPasswordChange || new Date().toISOString().split('T')[0]}
                    disabled
                  />
                  <small className="text-muted d-block">Last time you changed your password</small>
                </div>
                <div className="col-12 mt-3">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <i className="ti ti-key me-2" />Change Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="ti ti-key me-2" />
                  Change Password
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowPasswordModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={() => setShowPasswordModal(false)}
                  disabled={changingPassword}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-key me-2" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSettingsPage;
