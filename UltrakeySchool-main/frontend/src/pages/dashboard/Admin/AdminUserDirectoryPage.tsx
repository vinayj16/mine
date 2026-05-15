import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface UserDirectoryData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsersThisMonth: number;
  };
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    status: 'active' | 'inactive';
    lastLogin: string;
    createdDate: string;
  }[];
  usersByRole: {
    role: string;
    count: number;
    color: string;
  }[];
}

const AdminUserDirectoryPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserDirectoryData | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Set empty data for now
      setUserData({
        overview: {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          newUsersThisMonth: 0
        },
        users: [],
        usersByRole: [
          { role: 'Student', count: 0, color: '#3b82f6' },
          { role: 'Teacher', count: 0, color: '#10b981' },
          { role: 'Parent', count: 0, color: '#f59e0b' },
          { role: 'Staff', count: 0, color: '#ef4444' },
          { role: 'Admin', count: 0, color: '#8b5cf6' }
        ]
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = userData?.users.filter(user => {
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  }) || [];

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
          <h3 className="page-title mb-1">User Directory</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">User Management</li>
              <li className="breadcrumb-item active">User Directory</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchUserData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary">
            <i className="ti ti-user-plus me-2"></i>Add User
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
                  <h4 className="mb-1">{userData?.overview.totalUsers}</h4>
                  <p className="mb-0">Total Users</p>
                  <small>All registered users</small>
                </div>
                <i className="ti ti-users fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{userData?.overview.activeUsers}</h4>
                  <p className="mb-0">Active Users</p>
                  <small>Currently active</small>
                </div>
                <i className="ti ti-user-check fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{userData?.overview.newUsersThisMonth}</h4>
                  <p className="mb-0">New Users</p>
                  <small>This month</small>
                </div>
                <i className="ti ti-user-plus fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{userData?.overview.inactiveUsers}</h4>
                  <p className="mb-0">Inactive Users</p>
                  <small>Not active</small>
                </div>
                <i className="ti ti-user-off fs-24"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Users by Role</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={userData?.usersByRole || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {userData?.usersByRole.map((entry, index) => (
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
              <h5 className="card-title mb-0">Role Distribution</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={userData?.usersByRole || []}>
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

      {/* User List */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">User Directory</h5>
          <div className="d-flex gap-2">
            <input 
              type="text" 
              className="form-control form-control-sm" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="form-select form-select-sm"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
              <option value="Parent">Parent</option>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
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
                  <th>
                    <input type="checkbox" className="form-check-input" />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted">
                      No users found. Click "Add User" to create your first user.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <input type="checkbox" className="form-check-input" />
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm bg-primary text-white rounded-circle me-2">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className="badge bg-primary">{user.role}</span>
                      </td>
                      <td>{user.department}</td>
                      <td>
                        <span className={`badge ${
                          user.status === 'active' ? 'bg-success' : 'bg-danger'
                        }`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td>{user.lastLogin}</td>
                      <td>{user.createdDate}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary" title="View">
                            <i className="ti ti-eye"></i>
                          </button>
                          <button className="btn btn-outline-warning" title="Edit">
                            <i className="ti ti-edit"></i>
                          </button>
                          <button className="btn btn-outline-info" title="Reset Password">
                            <i className="ti ti-key"></i>
                          </button>
                          <button className="btn btn-outline-danger" title="Deactivate">
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
    </div>
  );
};

export default AdminUserDirectoryPage;
