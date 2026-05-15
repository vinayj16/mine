import React from 'react';
import { useAuth } from '../store/authStore';
import { LogOut, User, Shield, Settings, Building, Mail, Phone, MapPin } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout, isLoading, institutionData } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">EduAdmin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-layout max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="dashboard-stack px-4 py-6 sm:px-0">
          {/* Institution Details */}
          {institutionData ? (
            <div className="card mb-4 border-primary">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center">
                    <div className="rounded bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px', fontSize: '24px' }}>
                      <Building size={24} />
                    </div>
                    <div>
                      <h4 className="mb-1">{institutionData.name}</h4>
                      <div className="d-flex align-items-center text-muted small">
                        <span className="me-3">
                          <Building size={14} className="me-1" />
                          Code: {institutionData.instituteCode}
                        </span>
                        <span className="me-3">
                          Type: {institutionData.type}
                        </span>
                        <span className={`badge ${institutionData.status === 'active' ? 'bg-success' : 'bg-warning'} me-2`}>
                          {institutionData.status?.toUpperCase()}
                        </span>
                        {user?.role && (
                          <span className="me-3">
                            Role: {user.role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="small text-muted mb-1">Institution ID</div>
                    <code className="small bg-light p-1 rounded">{institutionData.id?.slice(-8) || 'N/A'}</code>
                  </div>
                </div>
                
                {institutionData.contact && (
                  <div className="d-flex align-items-center text-muted small">
                    {institutionData.contact.email && (
                      <span className="me-3">
                        <Mail size={14} className="me-1" />
                        {institutionData.contact.email}
                      </span>
                    )}
                    {institutionData.contact.phone && (
                      <span className="me-3">
                        <Phone size={14} className="me-1" />
                        {institutionData.contact.phone}
                      </span>
                    )}
                    {institutionData.contact.address && (
                      <span className="me-3">
                        <MapPin size={14} className="me-1" />
                        {[
                          institutionData.contact.address.city,
                          institutionData.contact.address.state,
                          institutionData.contact.address.country === 'India' ? '' : institutionData.contact.address.country
                        ].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card mb-4 border-warning">
              <div className="card-body p-3">
                <div className="text-center text-warning">
                  <Building size={48} className="mb-2" />
                  <h5 className="mb-2">Institution Not Assigned</h5>
                  <p className="text-muted small mb-0">
                    You are not currently assigned to any institution. Please contact your administrator.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Section */}
          <div className="profile-card bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="avatar-circle flex-shrink-0">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Welcome back, {user?.name}!</h2>
                <p className="text-sm text-gray-500">You are logged in as {user?.role}</p>
                {user?.institutionData && (
                  <p className="text-sm text-blue-600 mt-1">
                    Connected to: {user.institutionData.name} ({user.institutionData.instituteCode})
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* User Info Cards */}
          <div className="dashboard-grid mt-8">
            <div className="info-card">
              <div className="card-inner">
                <div className="icon-wrapper">
                  <User className="icon" />
                </div>
                <div>
                  <p className="label">User Information</p>
                  <p className="value">{user?.name}</p>
                  <p className="muted">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="info-card">
              <div className="card-inner">
                <div className="icon-wrapper">
                  <Shield className="icon" />
                </div>
                <div>
                  <p className="label">Role & Permissions</p>
                  <p className="value capitalize">{user?.role}</p>
                  <p className="muted">{user?.permissions?.length || 0} permissions</p>
                </div>
              </div>
            </div>
            <div className="info-card">
              <div className="card-inner">
                <div className="icon-wrapper">
                  <Settings className="icon" />
                </div>
                <div>
                  <p className="label">Account Settings</p>
                  <p className="value">Active</p>
                  <p className="muted">Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions mt-8">
            <h3 className="section-title">Quick Actions</h3>
            <div className="quick-grid">
              {[{
                icon: <User className="action-icon" />,
                title: 'Manage Students',
                desc: 'Add, edit, or view student records'
              }, {
                icon: <Shield className="action-icon" />,
                title: 'View Attendance',
                desc: 'Check attendance records'
              }, {
                icon: <Settings className="action-icon" />,
                title: 'Settings',
                desc: 'Configure system settings'
              }, {
                icon: <LogOut className="action-icon" />,
                title: 'Reports',
                desc: 'Generate system reports'
              }].map((action) => (
                <button key={action.title} className="action-card">
                  <div className="action-content">
                    {action.icon}
                    <h3>{action.title}</h3>
                    <p>{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* API Status */}
          <div className="status-panel mt-8 bg-white shadow rounded-lg">
            <div className="status-content">
              <h3 className="section-title">System Status</h3>
              <div className="status-grid">
                {['Backend API', 'Database', 'Authentication'].map((label) => (
                  <div key={label} className="status-pill">
                    <span className="status-dot" />
                    <div>
                      <p className="pill-label">{label}</p>
                      <p className="pill-detail">Operational</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
