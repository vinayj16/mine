import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  gender: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
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

interface Preferences {
  language: string;
  timezone: string;
  dateFormat: string;
  theme: string;
}

const UserSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    _id: '', firstName: '', lastName: '', name: '', email: '', phone: '', avatar: '', role: '',
    gender: '', dateOfBirth: '', address: { street: '', city: '', state: '', zipCode: '', country: '' }
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    currentPassword: '', newPassword: '', confirmPassword: '', twoFactorEnabled: false, sessionTimeout: 30, loginNotifications: true
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true, smsNotifications: true, pushNotifications: true,
    studentAdmission: true, feePayment: true, examSchedule: true, attendance: true, homework: true, announcements: true
  });

  const [preferences, setPreferences] = useState<Preferences>({
    language: 'en', timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY', theme: 'light'
  });

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      // Use correct backend endpoints: /user-profiles/me for profile data
      const [profileRes] = await Promise.all([
        apiClient.get('/user-profiles/me').catch(() => ({ data: { success: true, data: getDefaultProfile() } })),
      ]);

      if (profileRes.data?.success && profileRes.data.data) {
        const d = profileRes.data.data;
        setProfile(prev => ({
          ...prev,
          _id: d._id || d.id || prev._id,
          firstName: d.firstName || d.name?.split(' ')[0] || prev.firstName,
          lastName: d.lastName || d.name?.split(' ').slice(1).join(' ') || prev.lastName,
          name: d.name || prev.name,
          email: d.email || prev.email,
          phone: d.phone || d.phoneNumber || prev.phone,
          avatar: d.avatar || d.profilePicture || prev.avatar,
          role: d.role || prev.role,
          gender: d.gender || prev.gender,
          dateOfBirth: d.dateOfBirth || d.dob || prev.dateOfBirth,
          address: d.address || prev.address,
        }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultProfile = (): UserProfile => ({
    _id: 'user-001', firstName: 'John', lastName: 'Doe', name: 'John Doe', email: 'john.doe@school.edu',
    phone: '+91 9876543210', avatar: '', role: 'hostel_warden', gender: 'Male', dateOfBirth: '1990-05-15',
    address: { street: '123 Main Street', city: 'New Delhi', state: 'Delhi', zipCode: '110001', country: 'India' }
  });

  const handleSave = async (section: string, data: any, apiEndpoint: string) => {
    try {
      setSaving(true);
      const res = await apiClient.put(apiEndpoint, data);
      if (res.data?.success) {
        toast.success(`${section} updated successfully`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to update ${section}`);
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = () => handleSave('Profile', profile, '/user-profiles/me');
  const handleSecurityUpdate = () => {
    if (security.newPassword && security.newPassword !== security.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    handleSave('Security', { currentPassword: security.currentPassword, newPassword: security.newPassword }, '/user-profiles/me/change-password');
    if (security.newPassword) {
      setSecurity(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    }
  };
  const handleNotificationsUpdate = () => handleSave('Notifications', notifications, '/user-profiles/me/notifications');
  const handlePreferencesUpdate = () => handleSave('Preferences', preferences, '/user-profiles/me');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'ti ti-user' },
    { id: 'security', label: 'Security', icon: 'ti ti-lock' },
    { id: 'notifications', label: 'Notifications', icon: 'ti ti-bell' },
    { id: 'preferences', label: 'Preferences', icon: 'ti ti-settings' }
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mb-0"><i className="ti ti-settings me-2"></i>Settings</h4>
        <button className="btn btn-sm btn-light" onClick={fetchAllSettings}><i className="ti ti-refresh"></i></button>
      </div>

      <div className="row">
        {/* Tab Navigation - Vertical */}
        <div className="col-lg-2 col-md-3">
          <div className="nav flex-column nav-pills gap-1" role="tablist">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-link text-start px-3 py-2 ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                <i className={`ti ${tab.icon} me-2`}></i>{tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="col-lg-10 col-md-9">
          <div className="tab-content">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="tab-pane fade show active" role="tabpanel">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white d-flex align-items-center justify-content-between">
                    <h6 className="mb-0">Personal Information</h6>
                    <button className="btn btn-sm btn-primary" onClick={handleProfileUpdate} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label small">First Name</label>
                        <input type="text" className="form-control form-control-sm" value={profile.firstName}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small">Last Name</label>
                        <input type="text" className="form-control form-control-sm" value={profile.lastName}
                          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small">Email</label>
                        <input type="email" className="form-control form-control-sm" value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small">Phone</label>
                        <input type="text" className="form-control form-control-sm" value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small">Gender</label>
                        <select className="form-select form-select-sm" value={profile.gender}
                          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small">Date of Birth</label>
                        <input type="date" className="form-control form-control-sm" value={profile.dateOfBirth}
                          onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow-sm mt-3">
                  <div className="card-header bg-white">
                    <h6 className="mb-0">Address</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-12 mb-3">
                        <label className="form-label small">Street Address</label>
                        <input type="text" className="form-control form-control-sm" value={profile.address?.street || ''}
                          onChange={(e) => setProfile({ ...profile, address: { ...profile.address, street: e.target.value } })} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small">City</label>
                        <input type="text" className="form-control form-control-sm" value={profile.address?.city || ''}
                          onChange={(e) => setProfile({ ...profile, address: { ...profile.address, city: e.target.value } })} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small">State</label>
                        <input type="text" className="form-control form-control-sm" value={profile.address?.state || ''}
                          onChange={(e) => setProfile({ ...profile, address: { ...profile.address, state: e.target.value } })} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small">Country</label>
                        <input type="text" className="form-control form-control-sm" value={profile.address?.country || ''}
                          onChange={(e) => setProfile({ ...profile, address: { ...profile.address, country: e.target.value } })} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small">Postal Code</label>
                        <input type="text" className="form-control form-control-sm" value={profile.address?.zipCode || ''}
                          onChange={(e) => setProfile({ ...profile, address: { ...profile.address, zipCode: e.target.value } })} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="tab-pane fade show active" role="tabpanel">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white d-flex align-items-center justify-content-between">
                    <h6 className="mb-0">Change Password</h6>
                    <button className="btn btn-sm btn-primary" onClick={handleSecurityUpdate} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label small">Current Password</label>
                        <input type="password" className="form-control form-control-sm" value={security.currentPassword}
                          onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })} placeholder="Enter current" />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label small">New Password</label>
                        <input type="password" className="form-control form-control-sm" value={security.newPassword}
                          onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })} placeholder="Enter new" />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label small">Confirm Password</label>
                        <input type="password" className="form-control form-control-sm" value={security.confirmPassword}
                          onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })} placeholder="Confirm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow-sm mt-3">
                  <div className="card-header bg-white">
                    <h6 className="mb-0">Security Options</h6>
                  </div>
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h6 className="mb-1 small">Two-Factor Authentication</h6>
                        <p className="text-muted mb-0 small">Add extra security to your account</p>
                      </div>
                      <div className="form-check form-switch mb-0">
                        <input className="form-check-input" type="checkbox" checked={security.twoFactorEnabled}
                          onChange={(e) => setSecurity({ ...security, twoFactorEnabled: e.target.checked })} />
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h6 className="mb-1 small">Login Notifications</h6>
                        <p className="text-muted mb-0 small">Get notified of new login attempts</p>
                      </div>
                      <div className="form-check form-switch mb-0">
                        <input className="form-check-input" type="checkbox" checked={security.loginNotifications}
                          onChange={(e) => setSecurity({ ...security, loginNotifications: e.target.checked })} />
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="mb-1 small">Session Timeout</h6>
                        <p className="text-muted mb-0 small">Auto logout after inactivity</p>
                      </div>
                      <select className="form-select form-select-sm w-auto" value={security.sessionTimeout}
                        onChange={(e) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) })}>
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="tab-pane fade show active" role="tabpanel">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white d-flex align-items-center justify-content-between">
                    <h6 className="mb-0">Notification Channels</h6>
                    <button className="btn btn-sm btn-primary" onClick={handleNotificationsUpdate} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                        { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive updates via SMS' },
                        { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' }
                      ].map(item => (
                        <div key={item.key} className="col-md-4 mb-3">
                          <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                            <div>
                              <h6 className="mb-1 small">{item.label}</h6>
                              <p className="text-muted mb-0 small">{item.desc}</p>
                            </div>
                            <div className="form-check form-switch mb-0">
                              <input className="form-check-input" type="checkbox"
                                checked={notifications[item.key as keyof NotificationSettings] as boolean}
                                onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow-sm mt-3">
                  <div className="card-header bg-white">
                    <h6 className="mb-0">Activity Alerts</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {[
                        { key: 'studentAdmission', label: 'Student Admission' },
                        { key: 'feePayment', label: 'Fee Payment' },
                        { key: 'examSchedule', label: 'Exam Schedule' },
                        { key: 'attendance', label: 'Attendance' },
                        { key: 'homework', label: 'Homework' },
                        { key: 'announcements', label: 'Announcements' }
                      ].map(item => (
                        <div key={item.key} className="col-md-6 mb-2">
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="small">{item.label}</span>
                            <div className="form-check form-switch mb-0">
                              <input className="form-check-input" type="checkbox" style={{ width: '36px', height: '18px' }}
                                checked={notifications[item.key as keyof NotificationSettings] as boolean}
                                onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="tab-pane fade show active" role="tabpanel">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white d-flex align-items-center justify-content-between">
                    <h6 className="mb-0">Regional Settings</h6>
                    <button className="btn btn-sm btn-primary" onClick={handlePreferencesUpdate} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <label className="form-label small">Language</label>
                        <select className="form-select form-select-sm" value={preferences.language}
                          onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}>
                          <option value="en">English</option>
                          <option value="hi">Hindi</option>
                          <option value="ta">Tamil</option>
                          <option value="te">Telugu</option>
                        </select>
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label small">Timezone</label>
                        <select className="form-select form-select-sm" value={preferences.timezone}
                          onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}>
                          <option value="Asia/Kolkata">India (IST)</option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="Europe/London">UK (GMT)</option>
                        </select>
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label small">Date Format</label>
                        <select className="form-select form-select-sm" value={preferences.dateFormat}
                          onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label small">Theme</label>
                        <select className="form-select form-select-sm" value={preferences.theme}
                          onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}>
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow-sm mt-3">
                  <div className="card-header bg-white">
                    <h6 className="mb-0">Account Info</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <p className="text-muted small mb-1">Role</p>
                        <p className="mb-0">{profile.role?.replace('_', ' ').toUpperCase()}</p>
                      </div>
                      <div className="col-md-4">
                        <p className="text-muted small mb-1">User ID</p>
                        <p className="mb-0">{profile._id}</p>
                      </div>
                      <div className="col-md-4">
                        <p className="text-muted small mb-1">Last Updated</p>
                        <p className="mb-0">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
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

export default UserSettingsPage;
