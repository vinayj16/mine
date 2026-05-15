import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api.js';

interface UserCredential {
  _id: string;
  userId: string;
  email: string;
  role: string;
  fullName: string;
  instituteType: string;
  instituteCode: string;
  status: string;
  hasLoggedIn: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const UserDirectoryPage: React.FC = () => {
  const [users, setUsers] = useState<UserCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/admin/credentials');
      
      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data);
        setError('');
      } else {
        setUsers([]); // Always set to array
        setError(response.message || 'Failed to fetch user directory');
      }
    } catch (error: any) {
      setUsers([]); // Always set to array on error
      setError(error.response?.data?.message || 'Failed to fetch user directory');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === '' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  }) : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge bg-success">Active</span>;
      case 'inactive':
        return <span className="badge bg-danger">Inactive</span>;
      case 'suspended':
        return <span className="badge bg-warning">Suspended</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      'superadmin': 'bg-primary',
      'institution_admin': 'bg-info',
      'admin': 'bg-success',
      'principal': 'bg-warning',
      'teacher': 'bg-secondary',
      'student': 'bg-light text-dark',
      'parent': 'bg-dark',
      'accountant': 'bg-primary',
      'librarian': 'bg-info',
      'hr_manager': 'bg-warning',
      'transport_manager': 'bg-success',
      'hostel_warden': 'bg-danger',
      'staff_member': 'bg-secondary'
    };

    return (
      <span className={`badge ${roleColors[role] || 'bg-secondary'}`}>
        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  return (
    <div className="container-fluid">
      <div className="d-md-flex d-block align-items-center justify-content-between my-4 page-header-breadcrumb">
        <h3 className="page-title">User Directory</h3>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/dashboard/main">Dashboard</Link>
            </li>
            <li className="breadcrumb-item active">User Directory</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">User Directory</h5>
              <p className="card-subtitle text-muted">
                View and manage all institution users
              </p>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                  <button 
                    type="button" 
                    className="btn-close float-end" 
                    onClick={() => setError('')}
                  ></button>
                </div>
              )}

              {/* Filters */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, email, or user ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="superadmin">Super Admin</option>
                    <option value="institution_admin">Institution Admin</option>
                    <option value="admin">School Admin</option>
                    <option value="principal">Principal</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                    <option value="accountant">Accountant</option>
                    <option value="librarian">Librarian</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="transport_manager">Transport Manager</option>
                    <option value="hostel_warden">Hostel Warden</option>
                    <option value="staff_member">Staff Member</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterRole('');
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading user directory...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-4">
                  <div className="mb-3">
                    <i className="ti ti-users display-1 text-muted"></i>
                  </div>
                  <h5>No Users Found</h5>
                  <p className="text-muted">
                    {users.length === 0 
                      ? "There are no users in the system yet." 
                      : "No users match your current filters."
                    }
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Institute</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user._id}>
                          <td>{user.userId}</td>
                          <td>{user.fullName}</td>
                          <td>{user.email}</td>
                          <td>{getRoleBadge(user.role)}</td>
                          <td>
                            <small>
                              {user.instituteType}
                              <br />
                              <span className="text-muted">{user.instituteCode}</span>
                            </small>
                          </td>
                          <td>{getStatusBadge(user.status)}</td>
                          <td>
                            {user.hasLoggedIn ? (
                              <small className="text-success">
                                {user.lastLoginAt 
                                  ? new Date(user.lastLoginAt).toLocaleDateString()
                                  : 'Recently'
                                }
                              </small>
                            ) : (
                              <small className="text-muted">Never</small>
                            )}
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                title="View Details"
                              >
                                <i className="ti ti-eye"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                title="Edit User"
                              >
                                <i className="ti ti-edit"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary Stats */}
              <div className="row mt-4">
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h4 className="text-primary">{users.length}</h4>
                      <p className="mb-0">Total Users</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h4 className="text-success">
                        {Array.isArray(users) ? users.filter(u => u.status === 'active').length : 0}
                      </h4>
                      <p className="mb-0">Active Users</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h4 className="text-info">
                        {Array.isArray(users) ? users.filter(u => u.hasLoggedIn).length : 0}
                      </h4>
                      <p className="mb-0">Logged In</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h4 className="text-warning">
                        {Array.isArray(users) ? users.filter(u => !u.hasLoggedIn).length : 0}
                      </h4>
                      <p className="mb-0">Never Logged In</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDirectoryPage;
