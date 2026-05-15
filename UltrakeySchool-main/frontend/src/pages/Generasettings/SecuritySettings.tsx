import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface SecuritySettingsData {
  phoneNumber: string;
  phoneVerified: boolean;
  email: string;
  emailVerified: boolean;
}

const SecuritySettings: React.FC = () => {
  const [settings, setSettings] = useState<SecuritySettingsData>({
    phoneNumber: '',
    phoneVerified: false,
    email: '',
    emailVerified: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating] = useState(false);

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get('/settings/security');
        
        if (response.data?.success) {
          const data = response.data.data?.settings || {};
          setSettings({
            phoneNumber: data.phoneNumber || '',
            phoneVerified: data.phoneVerified ?? false,
            email: data.email || '',
            emailVerified: data.emailVerified ?? false
          });
        }
      } catch {
        console.log('Using default security settings');
      }
    } catch (err: any) {
      console.error('Error fetching security settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    toast.info('Change password functionality - to be implemented');
  };

  return (
    <div className="content">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">General Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/">Dashboard</a>
              </li>
              <li className="breadcrumb-item">
                <a href="#!">Settings</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">General Settings</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon" 
              data-bs-toggle="tooltip"
              data-bs-placement="top" 
              title="Refresh"
              onClick={fetchSecuritySettings}
              disabled={loading || updating}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-xxl-2 col-xl-3">
          <div className="pt-3 d-flex flex-column list-group mb-4">
            <a href="/profile-settings" className="d-block rounded p-2">Profile Settings</a>
            <a href="/security-settings" className="d-block rounded active p-2">Security Settings</a>
            <a href="/notifications-settings" className="d-block rounded p-2">Notifications</a>
            <a href="/connected-apps" className="d-block rounded p-2">Connected Apps</a>
          </div>
        </div>
        <div className="col-xxl-10 col-xl-9">
          <div className="border-start ps-3 flex-fill">
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom mb-3 pt-3">
              <div className="mb-3">
                <h5>Security Settings</h5>
                <p>Manage your account security and privacy</p>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mb-3">
                <i className="ti ti-alert-circle me-2" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading security settings...</p>
              </div>
            ) : (
              <div className="d-block">
                <div className="d-flex justify-content-between align-items-center rounded flex-wrap bg-white border rounded p-3 pb-0 mb-3">
                  <div className="mb-3">
                    <h6>Password</h6>
                    <p>Set a unique password to protect the account</p>
                  </div>
                  <div className="mb-3">
                    <button 
                      className="btn btn-outline-primary"
                      onClick={handleChangePassword}
                      disabled={updating}
                    >
                      Change Password
                    </button>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center rounded flex-wrap bg-white border rounded p-3 pb-0 mb-3">
                  <div className="mb-3">
                    <h6>Phone Number</h6>
                    <p>{settings.phoneNumber || 'Not set'}</p>
                  </div>
                  <div className="mb-3">
                    <span className={`badge ${settings.phoneVerified ? 'badge-soft-success' : 'badge-soft-warning'}`}>
                      {settings.phoneVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center rounded flex-wrap bg-white border rounded p-3 pb-0 mb-3">
                  <div className="mb-3">
                    <h6>Email Address</h6>
                    <p>{settings.email || 'Not set'}</p>
                  </div>
                  <div className="mb-3">
                    <span className={`badge ${settings.emailVerified ? 'badge-soft-success' : 'badge-soft-warning'}`}>
                      {settings.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;