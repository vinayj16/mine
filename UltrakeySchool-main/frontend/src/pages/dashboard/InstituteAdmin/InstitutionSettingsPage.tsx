import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiClient } from '../../../api/client';

interface Module {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  description: string;
  icon: string;
  category: string;
}

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
  logo?: string;
}

interface LocalizationSettings {
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  language: string;
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

interface SecuritySettings {
  sessionTimeout: number;
  passwordExpiry: number;
  ipWhitelist: string[];
  loginAttempts: number;
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('modules');
  const institutionId = localStorage.getItem('institutionId') || '';

  // Sync activeTab with URL path
  useEffect(() => {
    const path = location.pathname;
    const pathParts = path.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    
    // Map URL path to tab
    const pathToTab: Record<string, string> = {
      'settings': 'modules',
      'modules': 'modules',
      'profile': 'profile',
      'security': 'security',
      'notifications': 'notifications',
      'company': 'company',
      'localization': 'localization',
      'email': 'email',
      'sms': 'sms',
      'payment': 'payment',
      'tax': 'tax',
      'school': 'school',
      'storage': 'storage'
    };
    
    if (pathToTab[lastPart]) {
      setActiveTab(pathToTab[lastPart]);
    }
  }, [location.pathname]);

  const [modules, setModules] = useState<Module[]>([]);
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
  const [security, setSecurity] = useState<SecuritySettings>({
    sessionTimeout: 30,
    passwordExpiry: 90,
    ipWhitelist: [],
    loginAttempts: 5
  });
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
  const [localization, setLocalization] = useState<LocalizationSettings>({
    currency: 'USD',
    currencySymbol: '$',
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
    fromName: ''
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

  useEffect(() => {
    fetchAllSettings();
  }, [institutionId]);

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchModules(),
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

  const fetchModules = async () => {
    try {
      const response = await apiClient.get(`/institution/${institutionId}/modules`);
      if (response.data?.success && response.data?.data) {
        setModules(response.data.data);
      } else {
        setModules(getDefaultModules());
      }
    } catch {
      setModules(getDefaultModules());
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
        // Ensure all properties have default values to prevent controlled input issues
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
        // Ensure all properties have default values to prevent controlled input issues
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
        // Ensure all properties have default values to prevent controlled input issues
        setPaymentGateway({
          enabled: response.data.data.enabled || false,
          provider: response.data.data.provider || '',
          apiKey: response.data.data.apiKey || '',
          merchantId: response.data.data.merchantId || '',
          environment: response.data.data.environment || 'test'
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
        // Ensure allowedTypes is always present
        setStorage({
          ...response.data.data,
          allowedTypes: response.data.data.allowedTypes || ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
        });
      }
    } catch {
      // Use default
    }
  };

  const getDefaultModules = (): Module[] => [
    { id: '1', name: 'Student Management', key: 'student_management', enabled: true, description: 'Manage student records, admissions, and profiles', icon: 'ti-users', category: 'academic' },
    { id: '2', name: 'Teacher Management', key: 'teacher_management', enabled: true, description: 'Manage teacher profiles, assignments, and attendance', icon: 'ti-user', category: 'academic' },
    { id: '3', name: 'Academic Management', key: 'academic_management', enabled: true, description: 'Classes, subjects, timetables, and syllabi', icon: 'ti-book', category: 'academic' },
    { id: '4', name: 'Examination', key: 'examination', enabled: true, description: 'Exams, schedules, and result management', icon: 'ti-clipboard-list', category: 'academic' },
    { id: '5', name: 'Attendance', key: 'attendance', enabled: true, description: 'Track student and staff attendance', icon: 'ti-calendar', category: 'academic' },
    { id: '6', name: 'Fee Management', key: 'fee_management', enabled: true, description: 'Fee collection, invoices, and payment tracking', icon: 'ti-credit-card', category: 'finance' },
    { id: '7', name: 'Library', key: 'library', enabled: true, description: 'Book management and issue tracking', icon: 'ti-bookmark', category: 'academic' },
    { id: '8', name: 'Hostel', key: 'hostel', enabled: false, description: 'Hostel room allocation and management', icon: 'ti-home', category: 'infrastructure' },
    { id: '9', name: 'Transport', key: 'transport', enabled: false, description: 'Vehicle and route management', icon: 'ti-bus', category: 'infrastructure' },
    { id: '10', name: 'HRM', key: 'hrm', enabled: false, description: 'Staff management, payroll, and leave tracking', icon: 'ti-id-badge', category: 'hr' },
    { id: '11', name: 'Reports', key: 'reports', enabled: true, description: 'Generate various analytical reports', icon: 'ti-chart-bar', category: 'analytics' },
    { id: '12', name: 'Announcements', key: 'announcements', enabled: true, description: 'Send notices and notifications', icon: 'ti-bell', category: 'communication' },
    { id: '13', name: 'Chat & Messaging', key: 'messaging', enabled: true, description: 'Internal messaging system', icon: 'ti-message', category: 'communication' },
    { id: '14', name: 'Parent Portal', key: 'parent_portal', enabled: true, description: 'Parent access to student information', icon: 'ti-users', category: 'communication' },
    { id: '15', name: 'Online Admission', key: 'online_admission', enabled: false, description: 'Accept online admission applications', icon: 'ti-world', category: 'admission' }
  ];

  const saveSettings = async (type: string, data: any) => {
    try {
      setSaving(true);
      const response = await apiClient.put(`/institution/${institutionId}/${type}`, data);
      if (response.data?.success) {
        toast.success(`${type.replace('-', ' ')} settings saved successfully`);
      } else {
        toast.error(response.data?.message || 'Failed to save settings');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to save ${type} settings`);
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = async (moduleId: string) => {
    const updatedModules = modules.map(m => 
      m.id === moduleId ? { ...m, enabled: !m.enabled } : m
    );
    setModules(updatedModules);
    await saveSettings('modules', { modules: updatedModules });
  };

  const handleSaveProfile = async () => {
    await saveSettings('profile', profile);
  };

  const handleSaveSecurity = async () => {
    await saveSettings('security', security);
  };

  const handleSaveNotifications = async () => {
    await saveSettings('notifications', notifications);
  };

  const handleSaveLocalization = async () => {
    await saveSettings('localization', localization);
  };

  const handleSaveEmailConfig = async () => {
    await saveSettings('email-config', emailConfig);
  };

  const handleSaveSmsConfig = async () => {
    await saveSettings('sms-config', smsConfig);
  };

  const handleSavePaymentGateway = async () => {
    await saveSettings('payment-gateway', paymentGateway);
  };

  const handleSaveTaxSettings = async () => {
    await saveSettings('tax-settings', taxSettings);
  };

  const handleSaveStorage = async () => {
    await saveSettings('storage', storage);
  };

  const requestPermission = async (moduleKey: string) => {
    try {
      const response = await apiClient.post('/superadmin/module-requests', {
        institutionId,
        moduleKey,
        requestedBy: localStorage.getItem('userId')
      });
      if (response.data?.success) {
        toast.success('Permission request sent to superadmin');
      }
    } catch {
      toast.error('Failed to request permission');
    }
  };

  const tabs = [
    { id: 'modules', label: 'Module Activation', icon: 'ti-apps' },
    { id: 'profile', label: 'Profile', icon: 'ti-user' },
    { id: 'security', label: 'Security', icon: 'ti-lock' },
    { id: 'notifications', label: 'Notifications', icon: 'ti-bell' },
    { id: 'localization', label: 'Localization', icon: 'ti-world' },
    { id: 'company', label: 'Company Info', icon: 'ti-building' },
    { id: 'email', label: 'Email Config', icon: 'ti-mail' },
    { id: 'sms', label: 'SMS Config', icon: 'ti-comment' },
    { id: 'payment', label: 'Payment Gateway', icon: 'ti-credit-card' },
    { id: 'tax', label: 'Tax Settings', icon: 'ti-receipt' },
    { id: 'school', label: 'School Settings', icon: 'ti-school' },
    { id: 'storage', label: 'Storage', icon: 'ti-server' }
  ];

  const renderModulesTab = () => {
  // Ensure modules is always an array
  const safeModules = Array.isArray(modules) ? modules : [];
  
  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-1">Module Activation</h5>
          <p className="text-muted mb-0">Enable or disable modules for your institution</p>
        </div>
        <button className="btn btn-primary" onClick={() => saveSettings('modules', { modules })} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      
      <div className="row">
        {safeModules.filter(m => m.category === 'academic').length > 0 && (
          <div className="col-12 mb-4">
            <h6 className="text-muted mb-3">Academic Modules</h6>
            <div className="row">
              {safeModules.filter(m => m.category === 'academic').map(module => (
                <div className="col-xl-4 col-lg-6 mb-3" key={module.id}>
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-start justify-content-between">
                        <div className="d-flex">
                          <div className="avatar avatar-lg bg-light rounded me-3">
                            <i className={`ti ${module.icon} fs-4 text-primary`}></i>
                          </div>
                          <div>
                            <h6 className="mb-1">{module.name}</h6>
                            <p className="text-muted small mb-0">{module.description}</p>
                          </div>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={module.enabled}
                            onChange={() => toggleModule(module.id)}
                          />
                        </div>
                      </div>
                      {!module.enabled && (
                        <button 
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={() => requestPermission(module.key)}
                        >
                          Request Permission
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {safeModules.filter(m => m.category === 'finance').length > 0 && (
          <div className="col-12 mb-4">
            <h6 className="text-muted mb-3">Finance Modules</h6>
            <div className="row">
              {safeModules.filter(m => m.category === 'finance').map(module => (
                <div className="col-xl-4 col-lg-6 mb-3" key={module.id}>
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-start justify-content-between">
                        <div className="d-flex">
                          <div className="avatar avatar-lg bg-light rounded me-3">
                            <i className={`ti ${module.icon} fs-4 text-success`}></i>
                          </div>
                          <div>
                            <h6 className="mb-1">{module.name}</h6>
                            <p className="text-muted small mb-0">{module.description}</p>
                          </div>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={module.enabled}
                            onChange={() => toggleModule(module.id)}
                          />
                        </div>
                      </div>
                      {!module.enabled && (
                        <button 
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={() => requestPermission(module.key)}
                        >
                          Request Permission
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {safeModules.filter(m => m.category === 'hr' || m.category === 'infrastructure').length > 0 && (
          <div className="col-12 mb-4">
            <h6 className="text-muted mb-3">Infrastructure & HR</h6>
            <div className="row">
              {safeModules.filter(m => m.category === 'hr' || m.category === 'infrastructure').map(module => (
                <div className="col-xl-4 col-lg-6 mb-3" key={module.id}>
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-start justify-content-between">
                        <div className="d-flex">
                          <div className="avatar avatar-lg bg-light rounded me-3">
                            <i className={`ti ${module.icon} fs-4 text-warning`}></i>
                          </div>
                          <div>
                            <h6 className="mb-1">{module.name}</h6>
                            <p className="text-muted small mb-0">{module.description}</p>
                          </div>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={module.enabled}
                            onChange={() => toggleModule(module.id)}
                          />
                        </div>
                      </div>
                      {!module.enabled && (
                        <button 
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={() => requestPermission(module.key)}
                        >
                          Request Permission
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {safeModules.filter(m => m.category === 'communication' || m.category === 'admission' || m.category === 'analytics').length > 0 && (
          <div className="col-12">
            <h6 className="text-muted mb-3">Communication & Other</h6>
            <div className="row">
              {safeModules.filter(m => m.category === 'communication' || m.category === 'admission' || m.category === 'analytics').map(module => (
                <div className="col-xl-4 col-lg-6 mb-3" key={module.id}>
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-start justify-content-between">
                        <div className="d-flex">
                          <div className="avatar avatar-lg bg-light rounded me-3">
                            <i className={`ti ${module.icon} fs-4 text-info`}></i>
                          </div>
                          <div>
                            <h6 className="mb-1">{module.name}</h6>
                            <p className="text-muted small mb-0">{module.description}</p>
                          </div>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={module.enabled}
                            onChange={() => toggleModule(module.id)}
                          />
                        </div>
                      </div>
                      {!module.enabled && (
                        <button 
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={() => requestPermission(module.key)}
                        >
                          Request Permission
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  };

  const renderProfileTab = () => (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-1">Institution Profile</h5>
          <p className="text-muted mb-0">Manage your institution profile information</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Institution Name</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Institution Code</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.code}
                onChange={(e) => setProfile({...profile, code: e.target.value})}
                disabled
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-control"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Phone</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
              />
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">Address</label>
              <textarea 
                className="form-control"
                rows={2}
                value={profile.address}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">City</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.city}
                onChange={(e) => setProfile({...profile, city: e.target.value})}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">State</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.state}
                onChange={(e) => setProfile({...profile, state: e.target.value})}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Country</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.country}
                onChange={(e) => setProfile({...profile, country: e.target.value})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Postal Code</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.postalCode}
                onChange={(e) => setProfile({...profile, postalCode: e.target.value})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Website</label>
              <input 
                type="url" 
                className="form-control"
                value={profile.website}
                onChange={(e) => setProfile({...profile, website: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-1">Security Settings</h5>
          <p className="text-muted mb-0">Configure security settings for your institution</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveSecurity} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">Authentication</h6>
        </div>
        <div className="card-body">
          <div className="row mt-3">
            <div className="col-md-6">
              <label className="form-label">Session Timeout (minutes)</label>
              <input 
                type="number" 
                className="form-control"
                value={security.sessionTimeout}
                onChange={(e) => setSecurity({...security, sessionTimeout: parseInt(e.target.value)})}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Password Expiry (days)</label>
              <input 
                type="number" 
                className="form-control"
                value={security.passwordExpiry}
                onChange={(e) => setSecurity({...security, passwordExpiry: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">Login Security</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Max Login Attempts</label>
              <input 
                type="number" 
                className="form-control"
                value={security.loginAttempts}
                onChange={(e) => setSecurity({...security, loginAttempts: parseInt(e.target.value)})}
              />
            </div>
            <div className="col-md-6 mb-3">
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
    </div>
  );

  const renderNotificationsTab = () => (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-1">Notification Settings</h5>
          <p className="text-muted mb-0">Configure notification preferences</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveNotifications} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
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
                onChange={(e) => setNotifications({...notifications, emailNotifications: e.target.checked})}
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
                onChange={(e) => setNotifications({...notifications, smsNotifications: e.target.checked})}
              />
            </div>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h6 className="mb-1">Push Notifications</h6>
              <p className="text-muted mb-0">Receive push notifications</p>
            </div>
            <div className="form-check form-switch">
              <input 
                className="form-check-input"
                type="checkbox"
                checked={notifications.pushNotifications}
                onChange={(e) => setNotifications({...notifications, pushNotifications: e.target.checked})}
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
            { key: 'studentAdmission', label: 'Student Admission', desc: 'Notify on new student admissions' },
            { key: 'feePayment', label: 'Fee Payment', desc: 'Notify on fee payments and due dates' },
            { key: 'examSchedule', label: 'Exam Schedule', desc: 'Notify on exam schedule changes' },
            { key: 'attendance', label: 'Attendance', desc: 'Notify on attendance records' },
            { key: 'homework', label: 'Homework', desc: 'Notify on homework assignments' },
            { key: 'announcements', label: 'Announcements', desc: 'Notify on general announcements' }
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

  const renderLocalizationTab = () => (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-1">Localization Settings</h5>
          <p className="text-muted mb-0">Configure regional and language settings</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveLocalization} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">Currency & Time</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Currency</label>
              <select 
                className="form-select"
                value={localization.currency}
                onChange={(e) => setLocalization({...localization, currency: e.target.value})}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="SGD">SGD - Singapore Dollar</option>
                <option value="MYR">MYR - Malaysian Ringgit</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Currency Symbol</label>
              <input 
                type="text" 
                className="form-control"
                value={localization.currencySymbol}
                onChange={(e) => setLocalization({...localization, currencySymbol: e.target.value})}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Timezone</label>
              <select 
                className="form-select"
                value={localization.timezone}
                onChange={(e) => setLocalization({...localization, timezone: e.target.value})}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="Asia/Singapore">Singapore (SGT)</option>
                <option value="Asia/Kuala_Lumpur">Malaysia (MYT)</option>
                <option value="Europe/London">UK (GMT)</option>
                <option value="Europe/Paris">Europe (CET)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">Date & Language</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Date Format</label>
              <select 
                className="form-select"
                value={localization.dateFormat}
                onChange={(e) => setLocalization({...localization, dateFormat: e.target.value})}
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
                onChange={(e) => setLocalization({...localization, timeFormat: e.target.value as '12h' | '24h'})}
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
                onChange={(e) => setLocalization({...localization, language: e.target.value})}
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
    </div>
  );

  const renderCompanyTab = () => (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-1">Company Information</h5>
          <p className="text-muted mb-0">Manage company details and branding</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">Basic Information</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Company Name</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Registration Number</label>
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
                onChange={(e) => setProfile({...profile, email: e.target.value})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Phone</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
              />
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">Address</label>
              <textarea 
                className="form-control"
                rows={3}
                value={profile.address}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">Branding</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Website URL</label>
              <input 
                type="url" 
                className="form-control"
                value={profile.website}
                onChange={(e) => setProfile({...profile, website: e.target.value})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Logo</label>
              <input type="file" className="form-control" accept="image/*" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailConfigTab = () => (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-1">Email Configuration</h5>
          <p className="text-muted mb-0">Configure email provider settings</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveEmailConfig} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">Provider Selection</h6>
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
                onChange={(e) => setEmailConfig({...emailConfig, enabled: e.target.checked})}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Email Provider</label>
            <select 
              className="form-select"
              value={emailConfig.provider}
              onChange={(e) => setEmailConfig({...emailConfig, provider: e.target.value as 'smtp' | 'phpMailer' | 'google'})}
            >
              <option value="smtp">SMTP</option>
              <option value="phpMailer">PHP Mailer</option>
              <option value="google">Google Gmail</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">SMTP Settings</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-8 mb-3">
              <label className="form-label">SMTP Host</label>
              <input 
                type="text" 
                className="form-control"
                value={emailConfig.host}
                onChange={(e) => setEmailConfig({...emailConfig, host: e.target.value})}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Port</label>
              <input 
                type="number" 
                className="form-control"
                value={emailConfig.port}
                onChange={(e) => setEmailConfig({...emailConfig, port: parseInt(e.target.value)})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-control"
                value={emailConfig.username}
                onChange={(e) => setEmailConfig({...emailConfig, username: e.target.value})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control"
                value={emailConfig.password || ''}
                onChange={(e) => setEmailConfig({...emailConfig, password: e.target.value})}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Encryption</label>
              <select 
                className="form-select"
                value={emailConfig.encryption}
                onChange={(e) => setEmailConfig({...emailConfig, encryption: e.target.value as 'tls' | 'ssl' | 'none'})}
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
                onChange={(e) => setEmailConfig({...emailConfig, fromEmail: e.target.value})}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">From Name</label>
              <input 
                type="text" 
                className="form-control"
                value={emailConfig.fromName}
                onChange={(e) => setEmailConfig({...emailConfig, fromName: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSmsConfigTab = () => (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-1">SMS Configuration</h5>
          <p className="text-muted mb-0">Configure SMS provider settings</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveSmsConfig} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">SMS Settings</h6>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 className="mb-1">Enable SMS</h6>
              <p className="text-muted mb-0">Send SMS to users</p>
            </div>
            <div className="form-check form-switch">
              <input 
                className="form-check-input"
                type="checkbox"
                checked={smsConfig.enabled}
                onChange={(e) => setSmsConfig({...smsConfig, enabled: e.target.checked})}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">SMS Provider</label>
              <select 
                className="form-select"
                value={smsConfig.provider}
                onChange={(e) => setSmsConfig({...smsConfig, provider: e.target.value})}
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
                onChange={(e) => setSmsConfig({...smsConfig, senderId: e.target.value})}
                placeholder="SCHOOL"
              />
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">API Key</label>
              <input 
                type="password" 
                className="form-control"
                value={smsConfig.apiKey || ''}
                onChange={(e) => setSmsConfig({...smsConfig, apiKey: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentGatewayTab = () => (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-1">Payment Gateway</h5>
          <p className="text-muted mb-0">Configure payment processor settings</p>
        </div>
        <button className="btn btn-primary" onClick={handleSavePaymentGateway} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">Gateway Settings</h6>
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
                onChange={(e) => setPaymentGateway({...paymentGateway, enabled: e.target.checked})}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Payment Provider</label>
              <select 
                className="form-select"
                value={paymentGateway.provider}
                onChange={(e) => setPaymentGateway({...paymentGateway, provider: e.target.value})}
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
                onChange={(e) => setPaymentGateway({...paymentGateway, environment: e.target.value as 'test' | 'live'})}
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
                onChange={(e) => setPaymentGateway({...paymentGateway, merchantId: e.target.value})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">API Key</label>
              <input 
                type="password" 
                className="form-control"
                value={paymentGateway.apiKey || ''}
                onChange={(e) => setPaymentGateway({...paymentGateway, apiKey: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTaxSettingsTab = () => (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-1">Tax Settings</h5>
          <p className="text-muted mb-0">Configure tax rates for fees</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveTaxSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">Tax Configuration</h6>
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
                onChange={(e) => setTaxSettings({...taxSettings, enabled: e.target.checked})}
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
                onChange={(e) => setTaxSettings({...taxSettings, name: e.target.value})}
                placeholder="GST"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Tax Rate (%)</label>
              <input 
                type="number" 
                className="form-control"
                value={taxSettings.rate}
                onChange={(e) => setTaxSettings({...taxSettings, rate: parseFloat(e.target.value)})}
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
                onChange={(e) => setTaxSettings({...taxSettings, number: e.target.value})}
                placeholder="TAX123456"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSchoolSettingsTab = () => (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-1">School Settings</h5>
          <p className="text-muted mb-0">Configure school-specific settings</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">Basic Information</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">School Name</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">School Code</label>
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
                onChange={(e) => setProfile({...profile, email: e.target.value})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Phone</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">Address</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-12 mb-3">
              <label className="form-label">Address</label>
              <textarea 
                className="form-control"
                rows={2}
                value={profile.address}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">City</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.city}
                onChange={(e) => setProfile({...profile, city: e.target.value})}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">State</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.state}
                onChange={(e) => setProfile({...profile, state: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStorageTab = () => (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-1">Storage Settings</h5>
          <p className="text-muted mb-0">Configure file storage options</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveStorage} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">Storage Provider</h6>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Storage Type</label>
            <select 
              className="form-select"
              value={storage.provider}
              onChange={(e) => setStorage({...storage, provider: e.target.value as 'local' | 's3' | 'google-drive'})}
            >
              <option value="local">Local Storage</option>
              <option value="s3">Amazon S3</option>
              <option value="google-drive">Google Drive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">File Upload Settings</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Max File Size (MB)</label>
              <input 
                type="number" 
                className="form-control"
                value={storage.maxFileSize}
                onChange={(e) => setStorage({...storage, maxFileSize: parseInt(e.target.value)})}
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

  const renderContent = () => {
    switch (activeTab) {
      case 'modules': return renderModulesTab();
      case 'profile': return renderProfileTab();
      case 'security': return renderSecurityTab();
      case 'notifications': return renderNotificationsTab();
      case 'localization': return renderLocalizationTab();
      case 'company': return renderCompanyTab();
      case 'email': return renderEmailConfigTab();
      case 'sms': return renderSmsConfigTab();
      case 'payment': return renderPaymentGatewayTab();
      case 'tax': return renderTaxSettingsTab();
      case 'school': return renderSchoolSettingsTab();
      case 'storage': return renderStorageTab();
      default: return renderModulesTab();
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
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Institution Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/institution">Dashboard</Link>
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

      <div className="row">
        <div className="col-12">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default InstitutionSettingsPage;
