import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CredentialData {
  overview: {
    totalCredentials: number;
    activeCredentials: number;
    credentialsCreatedToday: number;
    credentialsExpiringSoon: number;
  };
  credentials: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    username: string;
    password: string;
    status: 'active' | 'inactive' | 'expired';
    createdDate: string;
    lastLogin: string;
    expiryDate: string;
  }[];
  credentialsByRole: {
    role: string;
    count: number;
    color: string;
  }[];
  recentCredentials: {
    id: string;
    userName: string;
    role: string;
    createdDate: string;
    status: string;
  }[];
}

const AdminCreateCredentialsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [credentialData, setCredentialData] = useState<CredentialData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('create');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchCredentialData();
  }, []);

  const fetchCredentialData = async () => {
    try {
      setLoading(true);
      // Set empty data for now
      setCredentialData({
        overview: {
          totalCredentials: 0,
          activeCredentials: 0,
          credentialsCreatedToday: 0,
          credentialsExpiringSoon: 0
        },
        credentials: [],
        credentialsByRole: [
          { role: 'Student', count: 0, color: '#3b82f6' },
          { role: 'Teacher', count: 0, color: '#10b981' },
          { role: 'Parent', count: 0, color: '#f59e0b' },
          { role: 'Staff', count: 0, color: '#ef4444' },
          { role: 'Admin', count: 0, color: '#8b5cf6' }
        ],
        recentCredentials: []
      });
    } catch (error) {
      console.error('Error fetching credential data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCredential = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle credential creation logic
    console.log('Creating credential');
    // In a real app, this would call an API
  };

  const handleResetPassword = (credentialId: string) => {
    // Handle password reset logic
    console.log('Resetting password for:', credentialId);
    // In a real app, this would call an API
  };

  const handleDeactivateCredential = (credentialId: string) => {
    // Handle deactivation logic
    console.log('Deactivating credential:', credentialId);
    // In a real app, this would call an API
  };

  const filteredCredentials = credentialData?.credentials.filter(credential => 
    credential.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    credential.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    credential.username.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const statusData = credentialData ? [
    { name: 'Active', value: credentialData.overview.activeCredentials, color: '#10b981' },
    { name: 'Inactive', value: credentialData.overview.totalCredentials - credentialData.overview.activeCredentials, color: '#ef4444' },
    { name: 'Expiring Soon', value: credentialData.overview.credentialsExpiringSoon, color: '#f59e0b' }
  ] : [];

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
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Create Credentials</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">User Management</li>
              <li className="breadcrumb-item active">Create Credentials</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchCredentialData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary">
            <i className="ti ti-download me-2"></i>Export Credentials
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{credentialData?.overview.totalCredentials}</h4>
                  <p className="mb-0">Total Credentials</p>
                  <small>All user credentials</small>
                </div>
                <i className="ti ti-key fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{credentialData?.overview.activeCredentials}</h4>
                  <p className="mb-0">Active Credentials</p>
                  <small>Currently active</small>
                </div>
                <i className="ti ti-user-check fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{credentialData?.overview.credentialsCreatedToday}</h4>
                  <p className="mb-0">Created Today</p>
                  <small>New credentials</small>
                </div>
                <i className="ti ti-user-plus fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{credentialData?.overview.credentialsExpiringSoon}</h4>
                  <p className="mb-0">Expiring Soon</p>
                  <small>Need attention</small>
                </div>
                <i className="ti ti-alert-circle fs-24"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* Left Sidebar */}
        <div className="col-xl-3 col-md-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Credential Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'create' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('create')}
                >
                  <i className="ti ti-user-plus me-2"></i>
                  Create Credential
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'manage' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('manage')}
                >
                  <i className="ti ti-key me-2"></i>
                  Manage Credentials
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'reset' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('reset')}
                >
                  <i className="ti ti-refresh me-2"></i>
                  Reset Passwords
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'bulk' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('bulk')}
                >
                  <i className="ti ti-users me-2"></i>
                  Bulk Operations
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="col-xl-9 col-md-12">
          {/* Create Credential */}
          {selectedSection === 'create' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Create New User Credential</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleCreateCredential}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Select User</label>
                        <select className="form-select" required>
                          <option value="">Select User</option>
                          <option value="user1">John Doe - Student</option>
                          <option value="user2">Jane Smith - Teacher</option>
                          <option value="user3">Mike Johnson - Parent</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">User Role</label>
                        <input type="text" className="form-control" placeholder="Auto-populated" readOnly />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input type="text" className="form-control" placeholder="Enter username" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <div className="input-group">
                          <input type="password" className="form-control" placeholder="Enter password" required />
                          <button className="btn btn-outline-secondary" type="button">
                            <i className="ti ti-eye"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Confirm Password</label>
                        <input type="password" className="form-control" placeholder="Confirm password" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Expiry Date</label>
                        <input type="date" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="sendEmail" />
                      <label className="form-check-label" htmlFor="sendEmail">
                        Send login credentials via email
                      </label>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="button" className="btn btn-info">
                      <i className="ti ti-key me-1"></i>Generate Password
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="ti ti-user-check me-1"></i>Create Credential
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Manage Credentials */}
          {selectedSection === 'manage' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Manage User Credentials</h5>
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Search credentials..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-download me-1"></i>Export
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Username</th>
                        <th>Password</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Last Login</th>
                        <th>Expiry Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCredentials.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center text-muted">
                            No credentials found. Create your first user credential.
                          </td>
                        </tr>
                      ) : (
                        filteredCredentials.map((credential) => (
                          <tr key={credential.id}>
                            <td>{credential.userName}</td>
                            <td>{credential.userEmail}</td>
                            <td>
                              <span className="badge bg-primary">{credential.userRole}</span>
                            </td>
                            <td>{credential.username}</td>
                            <td>
                              <span className="text-muted">••••••••</span>
                            </td>
                            <td>
                              <span className={`badge ${
                                credential.status === 'active' ? 'bg-success' :
                                credential.status === 'inactive' ? 'bg-danger' : 'bg-warning'
                              }`}>
                                {credential.status.charAt(0).toUpperCase() + credential.status.slice(1)}
                              </span>
                            </td>
                            <td>{credential.createdDate}</td>
                            <td>{credential.lastLogin}</td>
                            <td>{credential.expiryDate}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-outline-info"
                                  onClick={() => handleResetPassword(credential.id)}
                                  title="Reset Password"
                                >
                                  <i className="ti ti-key"></i>
                                </button>
                                <button className="btn btn-outline-warning" title="Edit">
                                  <i className="ti ti-edit"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDeactivateCredential(credential.id)}
                                  title="Deactivate"
                                >
                                  <i className="ti ti-power"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reset Passwords */}
          {selectedSection === 'reset' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Reset User Passwords</h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-8">
                    <div className="mb-3">
                      <label className="form-label">Select User(s)</label>
                      <select className="form-select" multiple>
                        <option value="user1">John Doe - Student</option>
                        <option value="user2">Jane Smith - Teacher</option>
                        <option value="user3">Mike Johnson - Parent</option>
                      </select>
                      <small className="text-muted">Hold Ctrl/Cmd to select multiple users</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Reset Type</label>
                      <select className="form-select">
                        <option value="generate">Generate New Password</option>
                        <option value="custom">Set Custom Password</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <div className="input-group">
                    <input type="password" className="form-control" placeholder="Enter new password" />
                    <button className="btn btn-outline-secondary" type="button">
                      <i className="ti ti-eye"></i>
                    </button>
                    <button className="btn btn-outline-info" type="button">
                      <i className="ti ti-key"></i> Generate
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="forceChange" />
                    <label className="form-check-label" htmlFor="forceChange">
                      Force user to change password on next login
                    </label>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="notifyEmail" />
                    <label className="form-check-label" htmlFor="notifyEmail">
                      Send new password via email
                    </label>
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-secondary">Cancel</button>
                  <button type="button" className="btn btn-primary">
                    <i className="ti ti-refresh me-1"></i>Reset Password(s)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Operations */}
          {selectedSection === 'bulk' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Bulk Credential Operations</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-users fs-24 text-primary mb-2"></i>
                        <h6>Bulk Create Credentials</h6>
                        <p className="text-muted small">Create credentials for multiple users</p>
                        <button className="btn btn-primary btn-sm">Start Bulk Creation</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-file-upload fs-24 text-success mb-2"></i>
                        <h6>Import from CSV</h6>
                        <p className="text-muted small">Import users from CSV file</p>
                        <button className="btn btn-success btn-sm">Import CSV</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-6">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-download fs-24 text-warning mb-2"></i>
                        <h6>Export Credentials</h6>
                        <p className="text-muted small">Export all credentials to file</p>
                        <button className="btn btn-warning btn-sm">Export All</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-refresh fs-24 text-info mb-2"></i>
                        <h6>Bulk Password Reset</h6>
                        <p className="text-muted small">Reset passwords for multiple users</p>
                        <button className="btn btn-info btn-sm">Bulk Reset</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Credential Status</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Credentials by Role</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={credentialData?.credentialsByRole || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateCredentialsPage;
