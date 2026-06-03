import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiClient } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';
import authService from '../../../api/authService';
import uploadService from '../../../services/uploadService';

interface InstitutionProfile {
  name: string;
  code: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  website: string;
}

interface UserProfileData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface LocalizationSettings {
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  language: string;
}

interface SecuritySettings {
  sessionTimeout: number;
  passwordExpiry: number;
  ipWhitelist: string[];
  loginAttempts: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  studentAdmission: boolean;
  feePayment: boolean;
  examSchedule: boolean;
  attendance: boolean;
  homework: boolean;
  announcements: boolean;
}

interface EmailConfig {
  enabled: boolean;
  provider: 'smtp' | 'phpMailer' | 'google';
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
  fromEmail: string;
  fromName: string;
  supportEmail: string;
}

interface SmsConfig {
  enabled: boolean;
  provider: string;
  apiKey: string;
  senderId: string;
}

interface PaymentGateway {
  enabled: boolean;
  provider: string;
  merchantId: string;
  apiKey: string;
  environment: 'test' | 'live';
  razorpay?: {
    keyId: string;
    keySecret: string;
  };
}

interface TaxSetting {
  enabled: boolean;
  name: string;
  rate: number;
  number: string;
}

interface StorageSetting {
  provider: 'local' | 's3' | 'google-drive';
  maxFileSize: number;
  allowedTypes: string[];
}

const InstitutionSettingsPage: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const institutionId = localStorage.getItem('institutionId') || '';
  const { user } = useAuthStore() as any;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Sync activeTab with URL path
  useEffect(() => {
    const path = location.pathname;
    const lastPart = path.split('/').pop() || '';
    const pathToTab: Record<string, string> = {
      'settings': 'profile',   // index case: /dashboard/main/settings → show profile
      'profile': 'profile',
      'general': 'settings',   // /dashboard/main/settings/general → show settings
      'notifications': 'notifications',
      'company': 'settings',
      'localization': 'settings',
      'email': 'settings',
      'sms': 'settings',
      'payment': 'settings',
      'tax': 'settings',
      'school': 'settings',
      'storage': 'settings'
    };
    if (pathToTab[lastPart]) {
      setActiveTab(pathToTab[lastPart]);
    }
  }, [location.pathname]);

  // Profile photo
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar || user?.profilePhoto || '');

  // Profile state (user)
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Institution profile state
  const [profile, setProfile] = useState<InstitutionProfile>({
    name: '',
    code: '',
    type: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    website: ''
  });

  // Settings state
  const [security, setSecurity] = useState<SecuritySettings>({
    sessionTimeout: 30,
    passwordExpiry: 90,
    ipWhitelist: [],
    loginAttempts: 5
  });
  const [localization, setLocalization] = useState<LocalizationSettings>({
    currency: 'INR',
    currencySymbol: '₹',
    timezone: 'UTC',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    language: 'en'
  });
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    enabled: false,
    provider: 'smtp',
    host: '',
    port: 587,
    username: '',
    password: '',
    encryption: 'tls',
    fromEmail: '',
    fromName: '',
    supportEmail: ''
  });
  const [smsConfig, setSmsConfig] = useState<SmsConfig>({
    enabled: false,
    provider: '',
    apiKey: '',
    senderId: ''
  });
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>({
    enabled: false,
    provider: 'stripe',
    merchantId: '',
    apiKey: '',
    environment: 'test'
  });
  const [taxSettings, setTaxSettings] = useState<TaxSetting>({
    enabled: false,
    name: '',
    rate: 0,
    number: ''
  });
  const [storage, setStorage] = useState<StorageSetting>({
    provider: 'local',
    maxFileSize: 10,
    allowedTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
  });

  // Notification state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    studentAdmission: true,
    feePayment: true,
    examSchedule: true,
    attendance: true,
    homework: true,
    announcements: true
  });


  useEffect(() => {
    fetchAllSettings();
  }, [institutionId]);

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchSecurity(),
        fetchNotifications(),
        fetchLocalization(),
        fetchEmailConfig(),
        fetchSmsConfig(),
        fetchPaymentGateway(),
        fetchTaxSettings(),
        fetchStorage()
      ]);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get(`/institution/${institutionId}/profile`);
      if (response.data?.success && response.data?.data) {
        setProfile(response.data.data);
      }
    } catch {
      // Use default
    }
  };

  const fetchSecurity = async () => {
    try {
      const response = await apiClient.get(`/institution/${institutionId}/security`);
      if (response.data?.success && response.data?.data) {
        setSecurity(response.data.data);
      }
    } catch {
      // Use default
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get(`/institution/${institutionId}/notifications`);
      if (response.data?.success && response.data?.data) {
        setNotifications(response.data.data);
      }
    } catch {
      // Use default
    }
  };

  const fetchLocalization = async () => {
    try {
      const response = await apiClient.get(`/institution/${institutionId}/localization`);
      if (response.data?.success && response.data?.data) {
        setLocalization(response.data.data);
      }
    } catch {
      // Use default
    }
  };

  const fetchEmailConfig = async () => {
    try {
      const response = await apiClient.get(`/institution/${institutionId}/email-config`);
      if (response.data?.success && response.data?.data) {
        setEmailConfig({
          enabled: response.data.data.enabled || false,
          provider: response.data.data.provider || 'smtp',
          host: response.data.data.host || '',
          port: response.data.data.port || 587,
          username: response.data.data.username || '',
          password: response.data.data.password || '',
          encryption: response.data.data.encryption || 'tls',
          fromEmail: response.data.data.fromEmail || '',
          fromName: response.data.data.fromName || ''
        });
      }
    } catch {
      // Use default
    }
  };

  const fetchSmsConfig = async () => {
    try {
      const response = await apiClient.get(`/institution/${institutionId}/sms-config`);
      if (response.data?.success && response.data?.data) {
        setSmsConfig({
          enabled: response.data.data.enabled || false,
          provider: response.data.data.provider || '',
          apiKey: response.data.data.apiKey || '',
          senderId: response.data.data.senderId || ''
        });
      }
    } catch {
      // Use default
    }
  };

  const fetchPaymentGateway = async () => {
    try {
      const response = await apiClient.get(`/institution/${institutionId}/payment-gateway`);
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        setPaymentGateway({
          enabled: data.enabled || false,
          provider: data.provider || '',
          apiKey: data.apiKey || '',
          merchantId: data.merchantId || '',
          environment: data.environment || 'test',
          razorpay: {
            keyId: data.razorpay?.keyId || '',
            keySecret: data.razorpay?.keySecret || ''
          }
        });
      }
    } catch {
      // Use default
    }
  };

  const fetchTaxSettings = async () => {
    try {
      const response = await apiClient.get(`/institution/${institutionId}/tax-settings`);
      if (response.data?.success && response.data?.data) {
        setTaxSettings(response.data.data);
      }
    } catch {
      // Use default
    }
  };

  const fetchStorage = async () => {
    try {
      const response = await apiClient.get(`/institution/${institutionId}/storage`);
      if (response.data?.success && response.data?.data) {
        setStorage({
          ...response.data.data,
          allowedTypes: response.data.data.allowedTypes || ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
        });
      }
    } catch {
      // Use default
    }
  };

  const saveSettings = async (type: string, data: any) => {
    const key = type;
    try {
      setSaving(key);
      const response = await apiClient.put(`/institution/${institutionId}/${type}`, data);
      if (response.data?.success) {
        toast.success(`Settings saved successfully`);
      } else {
        toast.error(response.data?.message || 'Failed to save settings');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to save settings`);
    } finally {
      setSaving(null);
    }
  };

  // ─── Profile Tab ────────────────────────────────────────────────────────

  const handleUpdateProfile = async () => {
    try {
      setSaving('profile');
      const response = await apiClient.put(`/institution/${institutionId}/profile`, profile);
      if (response.data?.success) {
        toast.success('Institution profile updated successfully');
      } else {
        toast.error(response.data?.message || 'Failed to update profile');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(null);
    }
  };

  const handleChangePassword = async () => {
    if (!userProfile.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!userProfile.newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (userProfile.newPassword !== userProfile.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (userProfile.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (userProfile.currentPassword === userProfile.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    try {
      setSaving('password');
      await authService.changePassword({
        currentPassword: userProfile.currentPassword,
        newPassword: userProfile.newPassword
      });
      toast.success('Password changed successfully');
      setUserProfile(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(null);
    }
  };

  // ─── Settings Tab ────────────────────────────────────────────────────────

  const handleSaveSettings = async (section: string, data: any) => {
    const endpointMap: Record<string, string> = {
      security: 'security',
      localization: 'localization',
      email: 'email-config',
      sms: 'sms-config',
      payment: 'payment-gateway',
      tax: 'tax-settings',
      storage: 'storage'
    };
    await saveSettings(endpointMap[section] || section, data);
  };

  // ─── Notifications Tab ──────────────────────────────────────────────────

  const handleSaveNotifications = async () => {
    await saveSettings('notifications', notifications);
  };

  // ─── Tabs ───────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'ti ti-user' },
    { id: 'settings', label: 'Settings', icon: 'ti ti-settings' },
    { id: 'notifications', label: 'Notifications', icon: 'ti ti-bell' }
  ];

  const getTabLink = (tabId: string) => {
    if (tabId === 'settings') return `/dashboard/main/settings/general`;
    return `/dashboard/main/settings/${tabId}`;
  };

  // ─── Profile Photo Upload ──────────────────────────────────────────────

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      const result = await uploadService.uploadSingle(file, { folder: 'profiles' });
      if (result?.success && result?.file?.url) {
        setAvatarUrl(result.file.url);
        // Update user avatar via profile API
        await apiClient.put(`/institution/${institutionId}/profile`, {
          ...profile,
          logo: result.file.url,
          avatar: result.file.url
        });
        toast.success('Profile photo updated successfully');
      } else if (result?.file?.url) {
        setAvatarUrl(result.file.url);
        toast.success('Profile photo updated successfully');
      } else {
        toast.error('Failed to upload photo');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Render Profile Tab ─────────────────────────────────────────────────

  const renderProfileTab = () => (
    <div>
      {/* Profile Header */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)' }}>
        <div className="card-body py-4">
          <div className="d-flex align-items-center">
            <div
              className="d-flex align-items-center justify-content-center me-3"
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.2)',
                fontSize: '1.6rem',
                color: 'white',
              }}
            >
              <i className="ti ti-user"></i>
            </div>
            <div>
              <h5 className="mb-1 text-white">Profile Settings</h5>
              <p className="mb-0" style={{ opacity: 0.85, fontSize: '0.9rem' }}>
                Manage your institution profile, admin details, and account security
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin User Profile Card */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center">
            {/* Profile Photo */}
            <div className="position-relative me-4" style={{ width: 100, height: 100, flexShrink: 0 }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f1f5f9',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to change photo"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      color: '#6366f1',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
                {/* Camera overlay */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    border: '2px solid white',
                    fontSize: '0.8rem',
                  }}
                >
                  <i className="ti ti-camera"></i>
                </div>
                {uploadingPhoto && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <div className="spinner-border spinner-border-sm" role="status" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Admin Details */}
            <div>
              <h4 className="mb-1">{user?.name || 'Admin User'}</h4>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                <span className="badge bg-primary">{user?.role || 'institution_admin'}</span>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  <i className="ti ti-mail me-1"></i>{user?.email || '—'}
                </div>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                <i className="ti ti-building me-1"></i>{profile.name || 'Your Institution'} · {profile.code || ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institution Logo */}
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">Institution Logo</h6>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center gap-4">
            <div className="position-relative">
              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt="Institution Logo"
                  className="rounded border"
                  style={{ width: '120px', height: '120px', objectFit: 'contain' }}
                />
              ) : (
                <div
                  className="rounded border bg-light d-flex align-items-center justify-content-center"
                  style={{ width: '120px', height: '120px' }}
                >
                  <i className="ti ti-building fs-3 text-muted"></i>
                </div>
              )}
            </div>
            <div>
              <label className="btn btn-outline-primary btn-sm">
                <i className="ti ti-upload me-1"></i>Upload Logo
                <input
                  type="file"
                  className="d-none"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const result = await uploadService.uploadSingle(file, { folder: `institution_${institutionId}` });
                      const logoUrl = result?.file?.url || result?.url || '';
                      if (logoUrl) {
                        await apiClient.post(`/institution/${institutionId}/logo`, { logo: logoUrl });
                        setProfile(prev => ({ ...prev, logo: logoUrl }));
                        toast.success('Logo uploaded successfully');
                      }
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || 'Failed to upload logo');
                    }
                  }}
                />
              </label>
              <p className="text-muted small mb-0 mt-1">Recommended: 200x200px, PNG or JPG</p>
            </div>
          </div>
        </div>
      </div>

      {/* Institution Profile */}
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h6 className="mb-0">Institution Profile</h6>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleUpdateProfile}
            disabled={saving === 'profile'}
          >
            {saving === 'profile' ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Institution Name</label>
              <input
                type="text"
                className="form-control"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Institution Code</label>
              <input
                type="text"
                className="form-control"
                value={profile.code}
                disabled
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-control"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">Address</label>
              <textarea
                className="form-control"
                rows={2}
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-control"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">State</label>
              <input
                type="text"
                className="form-control"
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Country</label>
              <input
                type="text"
                className="form-control"
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Postal Code</label>
              <input
                type="text"
                className="form-control"
                value={profile.postalCode}
                onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Website</label>
              <input
                type="url"
                className="form-control"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">Change Password</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-control"
                value={userProfile.currentPassword}
                onChange={(e) => setUserProfile({ ...userProfile, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                value={userProfile.newPassword}
                onChange={(e) => setUserProfile({ ...userProfile, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                value={userProfile.confirmPassword}
                onChange={(e) => setUserProfile({ ...userProfile, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <button
            className="btn btn-warning"
            onClick={handleChangePassword}
            disabled={saving === 'password'}
          >
            {saving === 'password' ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Render Settings Tab ────────────────────────────────────────────────

  const renderSettingsTab = () => (
    <div>
      {/* Settings Header */}
      <div className="card mb-4 bg-gradient-primary text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card-body py-4">
          <div className="d-flex align-items-center">
            <div
              className="d-flex align-items-center justify-content-center me-3"
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.2)',
                fontSize: '1.6rem',
                color: 'white',
              }}
            >
              <i className="ti ti-settings"></i>
            </div>
            <div>
              <h5 className="mb-1 text-white">System Configuration</h5>
              <p className="mb-0" style={{ opacity: 0.85, fontSize: '0.9rem' }}>
                Manage security, localization, email, SMS, payment gateway, and storage settings for your institution
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h6 className="mb-0">Security</h6>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleSaveSettings('security', security)}
            disabled={saving === 'security'}
          >
            {saving === 'security' ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Session Timeout (minutes)</label>
              <input
                type="number"
                className="form-control"
                value={security.sessionTimeout}
                onChange={(e) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Password Expiry (days)</label>
              <input
                type="number"
                className="form-control"
                value={security.passwordExpiry}
                onChange={(e) => setSecurity({ ...security, passwordExpiry: parseInt(e.target.value) || 90 })}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Max Login Attempts</label>
              <input
                type="number"
                className="form-control"
                value={security.loginAttempts}
                onChange={(e) => setSecurity({ ...security, loginAttempts: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">IP Whitelist (comma separated)</label>
              <input
                type="text"
                className="form-control"
                value={Array.isArray(security.ipWhitelist) ? security.ipWhitelist.join(', ') : ''}
                onChange={(e) => setSecurity({
                  ...security,
                  ipWhitelist: e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip)
                })}
                placeholder="192.168.1.1, 10.0.0.1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Localization */}
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h6 className="mb-0">Localization</h6>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleSaveSettings('localization', localization)}
            disabled={saving === 'localization'}
          >
            {saving === 'localization' ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Currency</label>
              <select
                className="form-select"
                value={localization.currency}
                onChange={(e) => setLocalization({ ...localization, currency: e.target.value })}
              >
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Currency Symbol</label>
              <input
                type="text"
                className="form-control"
                value={localization.currencySymbol}
                onChange={(e) => setLocalization({ ...localization, currencySymbol: e.target.value })}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Timezone</label>
              <select
                className="form-select"
                value={localization.timezone}
                onChange={(e) => setLocalization({ ...localization, timezone: e.target.value })}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="Asia/Singapore">Singapore (SGT)</option>
                <option value="Europe/London">UK (GMT)</option>
                <option value="Europe/Paris">Europe (CET)</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Date Format</label>
              <select
                className="form-select"
                value={localization.dateFormat}
                onChange={(e) => setLocalization({ ...localization, dateFormat: e.target.value })}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Time Format</label>
              <select
                className="form-select"
                value={localization.timeFormat}
                onChange={(e) => setLocalization({ ...localization, timeFormat: e.target.value as '12h' | '24h' })}
              >
                <option value="12h">12 Hour</option>
                <option value="24h">24 Hour</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Language</label>
              <select
                className="form-select"
                value={localization.language}
                onChange={(e) => setLocalization({ ...localization, language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="kn">Kannada</option>
                <option value="ml">Malayalam</option>
                <option value="bn">Bengali</option>
                <option value="mr">Marathi</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Settings */}
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h6 className="mb-0">Tax Settings</h6>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleSaveSettings('tax', taxSettings)}
            disabled={saving === 'tax'}
          >
            {saving === 'tax' ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 className="mb-1">Enable Tax</h6>
              <p className="text-muted mb-0">Apply tax to fee calculations</p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={taxSettings.enabled}
                onChange={(e) => setTaxSettings({ ...taxSettings, enabled: e.target.checked })}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Tax Name</label>
              <input
                type="text"
                className="form-control"
                value={taxSettings.name}
                onChange={(e) => setTaxSettings({ ...taxSettings, name: e.target.value })}
                placeholder="GST"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Tax Rate (%)</label>
              <input
                type="number"
                className="form-control"
                value={taxSettings.rate}
                onChange={(e) => setTaxSettings({ ...taxSettings, rate: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                step="0.01"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Tax Number</label>
              <input
                type="text"
                className="form-control"
                value={taxSettings.number}
                onChange={(e) => setTaxSettings({ ...taxSettings, number: e.target.value })}
                placeholder="GSTIN123456"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Email Configuration */}
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h6 className="mb-0">Email Configuration</h6>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleSaveSettings('email', emailConfig)}
            disabled={saving === 'email'}
          >
            {saving === 'email' ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 className="mb-1">Enable Email</h6>
              <p className="text-muted mb-0">Send emails to users</p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={emailConfig.enabled}
                onChange={(e) => setEmailConfig({ ...emailConfig, enabled: e.target.checked })}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Provider</label>
              <select
                className="form-select"
                value={emailConfig.provider}
                onChange={(e) => setEmailConfig({ ...emailConfig, provider: e.target.value as 'smtp' | 'phpMailer' | 'google' })}
              >
                <option value="smtp">SMTP</option>
                <option value="phpMailer">PHP Mailer</option>
                <option value="google">Google Gmail</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">SMTP Host</label>
              <input
                type="text"
                className="form-control"
                value={emailConfig.host}
                onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Port</label>
              <input
                type="number"
                className="form-control"
                value={emailConfig.port}
                onChange={(e) => setEmailConfig({ ...emailConfig, port: parseInt(e.target.value, 10) || 587 })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                value={emailConfig.username}
                onChange={(e) => setEmailConfig({ ...emailConfig, username: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={emailConfig.password || ''}
                onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Encryption</label>
              <select
                className="form-select"
                value={emailConfig.encryption}
                onChange={(e) => setEmailConfig({ ...emailConfig, encryption: e.target.value as 'tls' | 'ssl' | 'none' })}
              >
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">From Email</label>
              <input
                type="email"
                className="form-control"
                value={emailConfig.fromEmail}
                onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">From Name</label>
              <input
                type="text"
                className="form-control"
                value={emailConfig.fromName}
                onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">
                Support Email <i className="ti ti-info-circle" data-bs-toggle="tooltip" title="Used for payment confirmations and support replies"></i>
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="support@yourschool.com"
                value={emailConfig.supportEmail}
                onChange={(e) => setEmailConfig({ ...emailConfig, supportEmail: e.target.value })}
              />
              <small className="text-muted">This email appears as the support/reply-to address in all outgoing emails</small>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Configuration */}
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h6 className="mb-0">SMS Configuration</h6>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleSaveSettings('sms', smsConfig)}
            disabled={saving === 'sms'}
          >
            {saving === 'sms' ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 className="mb-1">Enable SMS</h6>
              <p className="text-muted mb-0">Send SMS notifications to users</p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={smsConfig.enabled}
                onChange={(e) => setSmsConfig({ ...smsConfig, enabled: e.target.checked })}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">SMS Provider</label>
              <select
                className="form-select"
                value={smsConfig.provider}
                onChange={(e) => setSmsConfig({ ...smsConfig, provider: e.target.value })}
              >
                <option value="">Select Provider</option>
                <option value="twilio">Twilio</option>
                <option value="msg91">MSG91</option>
                <option value="textlocal">TextLocal</option>
                <option value="nexmo">Nexmo</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Sender ID</label>
              <input
                type="text"
                className="form-control"
                value={smsConfig.senderId}
                onChange={(e) => setSmsConfig({ ...smsConfig, senderId: e.target.value })}
                placeholder="SCHOOL"
              />
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">API Key</label>
              <input
                type="password"
                className="form-control"
                value={smsConfig.apiKey || ''}
                onChange={(e) => setSmsConfig({ ...smsConfig, apiKey: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway */}
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h6 className="mb-0">Payment Gateway</h6>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleSaveSettings('payment', paymentGateway)}
            disabled={saving === 'payment'}
          >
            {saving === 'payment' ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 className="mb-1">Enable Payment Gateway</h6>
              <p className="text-muted mb-0">Accept online payments</p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={paymentGateway.enabled}
                onChange={(e) => setPaymentGateway({ ...paymentGateway, enabled: e.target.checked })}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Provider</label>
              <select
                className="form-select"
                value={paymentGateway.provider}
                onChange={(e) => setPaymentGateway({ ...paymentGateway, provider: e.target.value })}
              >
                <option value="stripe">Stripe</option>
                <option value="razorpay">Razorpay</option>
                <option value="paypal">PayPal</option>
                <option value="paystack">Paystack</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Environment</label>
              <select
                className="form-select"
                value={paymentGateway.environment}
                onChange={(e) => setPaymentGateway({ ...paymentGateway, environment: e.target.value as 'test' | 'live' })}
              >
                <option value="test">Test Mode</option>
                <option value="live">Live Mode</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Merchant ID</label>
              <input
                type="text"
                className="form-control"
                value={paymentGateway.merchantId}
                onChange={(e) => setPaymentGateway({ ...paymentGateway, merchantId: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">API Key</label>
              <input
                type="password"
                className="form-control"
                value={paymentGateway.apiKey || ''}
                onChange={(e) => setPaymentGateway({ ...paymentGateway, apiKey: e.target.value })}
              />
            </div>
            {paymentGateway.provider === 'razorpay' && (
              <>
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Razorpay Key ID <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="rzp_live_xxxxxxxx"
                    value={paymentGateway.razorpay?.keyId || ''}
                    onChange={(e) => setPaymentGateway({
                      ...paymentGateway,
                      razorpay: { ...paymentGateway.razorpay, keyId: e.target.value }
                    })}
                  />
                  <small className="text-muted">From Razorpay Dashboard → Settings → API Keys</small>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Razorpay Key Secret <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter key secret"
                    value={paymentGateway.razorpay?.keySecret || ''}
                    onChange={(e) => setPaymentGateway({
                      ...paymentGateway,
                      razorpay: { ...paymentGateway.razorpay, keySecret: e.target.value }
                    })}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Storage Settings */}
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h6 className="mb-0">Storage Settings</h6>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleSaveSettings('storage', storage)}
            disabled={saving === 'storage'}
          >
            {saving === 'storage' ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Storage Provider</label>
              <select
                className="form-select"
                value={storage.provider}
                onChange={(e) => setStorage({ ...storage, provider: e.target.value as 'local' | 's3' | 'google-drive' })}
              >
                <option value="local">Local Storage</option>
                <option value="s3">Amazon S3</option>
                <option value="google-drive">Google Drive</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Max File Size (MB)</label>
              <input
                type="number"
                className="form-control"
                value={storage.maxFileSize}
                onChange={(e) => setStorage({ ...storage, maxFileSize: parseInt(e.target.value) || 10 })}
              />
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">Allowed File Types (comma separated)</label>
              <input
                type="text"
                className="form-control"
                value={storage.allowedTypes?.join(', ') || ''}
                onChange={(e) => setStorage({
                  ...storage,
                  allowedTypes: e.target.value.split(',').map(t => t.trim().toLowerCase()).filter(t => t)
                })}
                placeholder="jpg, jpeg, png, pdf, doc, docx"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Render Notifications Tab ───────────────────────────────────────────

  const renderNotificationsTab = () => (
    <div>
      {/* Notifications Header */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}>
        <div className="card-body py-4">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div
                className="d-flex align-items-center justify-content-center me-3"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  fontSize: '1.6rem',
                  color: 'white',
                }}
              >
                <i className="ti ti-bell"></i>
              </div>
              <div>
                <h5 className="mb-1 text-white">Notification Settings</h5>
                <p className="mb-0" style={{ opacity: 0.85, fontSize: '0.9rem' }}>
                  Configure notification preferences for your institution
                </p>
              </div>
            </div>
            <button
              className="btn btn-light"
              onClick={handleSaveNotifications}
              disabled={saving === 'notifications'}
            >
              {saving === 'notifications' ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">Notification Channels</h6>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 className="mb-1">Email Notifications</h6>
              <p className="text-muted mb-0">Receive notifications via email</p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={notifications.emailNotifications}
                onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
              />
            </div>
          </div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 className="mb-1">SMS Notifications</h6>
              <p className="text-muted mb-0">Receive notifications via SMS</p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={notifications.smsNotifications}
                onChange={(e) => setNotifications({ ...notifications, smsNotifications: e.target.checked })}
              />
            </div>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h6 className="mb-1">Push Notifications</h6>
              <p className="text-muted mb-0">Receive push notifications in-browser</p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={notifications.pushNotifications}
                onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">Notification Types</h6>
        </div>
        <div className="card-body">
          {[
            { key: 'studentAdmission', label: 'Student Admission', desc: 'Notify on new student admissions and registrations' },
            { key: 'feePayment', label: 'Fee Payment', desc: 'Notify on fee payments, due dates, and receipts' },
            { key: 'examSchedule', label: 'Exam Schedule', desc: 'Notify on exam schedule changes and results' },
            { key: 'attendance', label: 'Attendance', desc: 'Notify on attendance records and alerts' },
            { key: 'homework', label: 'Homework', desc: 'Notify on homework assignments and submissions' },
            { key: 'announcements', label: 'Announcements', desc: 'Notify on general announcements and notices' }
          ].map(item => (
            <div key={item.key} className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="mb-1">{item.label}</h6>
                <p className="text-muted mb-0">{item.desc}</p>
              </div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={notifications[item.key as keyof NotificationSettings] as boolean}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    [item.key]: e.target.checked
                  })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'settings':
        return renderSettingsTab();
      case 'notifications':
        return renderNotificationsTab();
      default:
        return renderProfileTab();
    }
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
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3 mb-4">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">
            {activeTab === 'settings' ? 'System Configuration' : activeTab === 'profile' ? 'Profile Settings' : 'Notification Settings'}
          </h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/dashboard/main">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Settings</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon"
              onClick={fetchAllSettings}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4">
        <ul className="nav nav-tabs nav-tabs-line">
          {tabs.map(tab => (
            <li className="nav-item" key={tab.id}>
              <Link
                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                to={getTabLink(tab.id)}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={tab.icon} style={{ marginRight: '0.4rem' }}></i>
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="row">
        <div className="col-12">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default InstitutionSettingsPage;
