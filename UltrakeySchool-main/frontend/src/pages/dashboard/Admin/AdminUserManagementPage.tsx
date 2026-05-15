import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserManagementData {
  pendingRequests: {
    id: string;
    name: string;
    email: string;
    role: string;
    requestedOn: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
  userCredentials: {
    id: string;
    name: string;
    email: string;
    role: string;
    username: string;
    password: string;
    status: 'active' | 'inactive';
    lastLogin: string;
  }[];
  statistics: {
    totalUsers: number;
    activeUsers: number;
    pendingRequests: number;
    newUsersThisMonth: number;
    usersByRole: {
      role: string;
      count: number;
    }[];
  };
}

const AdminUserManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserManagementData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Set empty data for now
      setUserData({
        pendingRequests: [],
        userCredentials: [],
        statistics: {
          totalUsers: 0,
          activeUsers: 0,
          pendingRequests: 0,
          newUsersThisMonth: 0,
          usersByRole: [
            { role: 'Student', count: 0 },
            { role: 'Teacher', count: 0 },
            { role: 'Parent', count: 0 },
            { role: 'Staff', count: 0 }
          ]
        }
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = (requestId: string) => {
    // Handle approval logic
    console.log('Approving request:', requestId);
  };

  const handleRejectRequest = (requestId: string) => {
    // Handle rejection logic
    console.log('Rejecting request:', requestId);
  };

  const handleResetPassword = (userId: string) => {
    // Handle password reset
    console.log('Resetting password for user:', userId);
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
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">User Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item active">User Management</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchUserData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary">
            <i className="ti ti-user-plus me-2"></i>Create User
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
                  <h4 className="mb-1">{userData?.statistics.totalUsers}</h4>
                  <p className="mb-0">Total Users</p>
                  <small>{userData?.statistics.activeUsers} Active</small>
                </div>
                <i className="ti ti-users fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{userData?.statistics.pendingRequests}</h4>
                  <p className="mb-0">Pending Requests</p>
                  <small>Awaiting approval</small>
                </div>
                <i className="ti ti-clock fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{userData?.statistics.newUsersThisMonth}</h4>
                  <p className="mb-0">New Users</p>
                  <small>This month</small>
                </div>
                <i className="ti ti-user-plus fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{userData?.statistics.activeUsers}</h4>
                  <p className="mb-0">Active Users</p>
                  <small>Currently active</small>
                </div>
                <i className="ti ti-user-check fs-24"></i>
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
              <h5 className="card-title">User Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'pending' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('pending')}
                >
                  <i className="ti ti-clock me-2"></i>
                  Pending Requests
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'credentials' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('credentials')}
                >
                  <i className="ti ti-key me-2"></i>
                  User Credentials
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'create' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('create')}
                >
                  <i className="ti ti-user-plus me-2"></i>
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="col-xl-9 col-md-12">
          {/* Overview */}
          {selectedSection === 'overview' && (
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Users by Role</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={userData?.statistics.usersByRole || []}>
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
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Recent Activity</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>User Name</th>
                            <th>Role</th>
                            <th>Action</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={5} className="text-center text-muted">
                              No recent user activity found.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Requests */}
          {selectedSection === 'pending' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Pending User Requests</h5>
                <div className="d-flex gap-2">
                  <input type="text" className="form-control form-control-sm" placeholder="Search requests..." />
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-filter me-1"></i>Filter
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" className="form-check-input" />
                        </th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Requested Role</th>
                        <th>Requested On</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData?.pendingRequests.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted">
                            No pending user requests found.
                          </td>
                        </tr>
                      ) : (
                        userData?.pendingRequests.map((request) => (
                          <tr key={request.id}>
                            <td>
                              <input type="checkbox" className="form-check-input" />
                            </td>
                            <td>{request.name}</td>
                            <td>{request.email}</td>
                            <td>
                              <span className="badge bg-primary">{request.role}</span>
                            </td>
                            <td>{request.requestedOn}</td>
                            <td>
                              <span className="badge bg-warning">Pending</span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-success"
                                  onClick={() => handleApproveRequest(request.id)}
                                  title="Approve"
                                >
                                  <i className="ti ti-check"></i>
                                </button>
                                <button 
                                  className="btn btn-danger"
                                  onClick={() => handleRejectRequest(request.id)}
                                  title="Reject"
                                >
                                  <i className="ti ti-x"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {userData?.pendingRequests.length === 0 && (
                  <div className="text-center mt-3">
                    <p className="text-muted">All user requests have been processed.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Credentials */}
          {selectedSection === 'credentials' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">User Credentials</h5>
                <div className="d-flex gap-2">
                  <input type="text" className="form-control form-control-sm" placeholder="Search users..." />
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-filter me-1"></i>Filter
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" className="form-check-input" />
                        </th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Username</th>
                        <th>Password</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData?.userCredentials.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center text-muted">
                            No user credentials found. Approve pending requests to create credentials.
                          </td>
                        </tr>
                      ) : (
                        userData?.userCredentials.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <input type="checkbox" className="form-check-input" />
                            </td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                              <span className="badge bg-primary">{user.role}</span>
                            </td>
                            <td>{user.username}</td>
                            <td>
                              <span className="text-muted">••••••••</span>
                            </td>
                            <td>
                              <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                                {user.status}
                              </span>
                            </td>
                            <td>{user.lastLogin}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-info"
                                  onClick={() => handleResetPassword(user.id)}
                                  title="Reset Password"
                                >
                                  <i className="ti ti-key"></i>
                                </button>
                                <button 
                                  className="btn btn-warning"
                                  title="Edit User"
                                >
                                  <i className="ti ti-edit"></i>
                                </button>
                                <button 
                                  className="btn btn-danger"
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

          {/* Create User */}
          {selectedSection === 'create' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Create New User</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">First Name</label>
                        <input type="text" className="form-control" placeholder="Enter first name" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Last Name</label>
                        <input type="text" className="form-control" placeholder="Enter last name" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email Address</label>
                        <input type="email" className="form-control" placeholder="Enter email address" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Phone Number</label>
                        <input type="tel" className="form-control" placeholder="Enter phone number" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">User Role</label>
                        <select className="form-select">
                          <option value="">Select Role</option>
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="parent">Parent</option>
                          <option value="staff">Staff</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Department/Grade</label>
                        <input type="text" className="form-control" placeholder="Enter department or grade" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input type="text" className="form-control" placeholder="Enter username" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-control" placeholder="Enter password" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea className="form-control" rows={3} placeholder="Enter address"></textarea>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">Create User</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagementPage;
