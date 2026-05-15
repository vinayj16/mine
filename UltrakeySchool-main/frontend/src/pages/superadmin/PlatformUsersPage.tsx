import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../../api/client'
import LoadingSpinner from '../../components/common/LoadingSpinner'

interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: string
  institutionName?: string
  institutionType?: string
  status: 'Active' | 'Inactive' | 'Suspended'
  lastLogin?: string
  createdAt: string
  permissions?: string[]
  department?: string
}

const PlatformUsersPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedInstitutionType, setSelectedInstitutionType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<User>>({})
  const [saving, setSaving] = useState(false)

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: any = { page: 1, limit: 10000 }
      if (selectedRole !== 'all') params.role = selectedRole
      if (selectedStatus !== 'all') params.status = selectedStatus
      if (searchTerm) params.search = searchTerm

      const response = await apiClient.get('/super-admin/users', { params })
      const userData = response.data.data || response.data
      setUsers(Array.isArray(userData) ? userData : userData.users || [])
    } catch (err: any) {
      console.error('Error fetching users:', err)
      setError(err.response?.data?.message || 'Failed to load users')
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [selectedRole, selectedStatus])

  // Filter users locally for search and institution type
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesInstitutionType = selectedInstitutionType === 'all' || user.institutionType === selectedInstitutionType
      const matchesSearch = !searchTerm || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.institutionName && user.institutionName.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesInstitutionType && matchesSearch
    })
  }, [users, selectedInstitutionType, searchTerm])

  // Handle user operations
  const handleViewDetails = (user: User) => {
    setSelectedUser(user)
    setShowUserDetailsModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department
    })
    setShowEditUserModal(true)
  }

  const handleSaveEditUser = async () => {
    if (!selectedUser || !editFormData) return

    try {
      setSaving(true)
      await apiClient.put(`/super-admin/users/${selectedUser._id}`, editFormData)
      toast.success('User updated successfully')
      setShowEditUserModal(false)
      setEditFormData({})
      fetchUsers()
    } catch (err: any) {
      console.error('Error updating user:', err)
      toast.error(err.response?.data?.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active'
    if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} ${user.name}?`)) return

    try {
      await apiClient.patch(`/super-admin/users/${user._id}/status`, { status: newStatus })
      toast.success(`User ${newStatus.toLowerCase()} successfully`)
      fetchUsers()
    } catch (err: any) {
      console.error('Error toggling status:', err)
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) return

    try {
      await apiClient.delete(`/super-admin/users/${user._id}`)
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (err: any) {
      console.error('Error deleting user:', err)
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleResetPassword = async (user: User) => {
    if (!window.confirm(`Send password reset link to ${user.email}?`)) return

    try {
      await apiClient.post(`/super-admin/users/${user._id}/reset-password`)
      toast.success(`Password reset link sent to ${user.email}`)
    } catch (err: any) {
      console.error('Error resetting password:', err)
      toast.error(err.response?.data?.message || 'Failed to send reset link')
    }
  }

  const handleRefresh = () => {
    fetchUsers()
    toast.success('Data refreshed')
  }

  // Helper functions
  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, string> = {
      SUPER_ADMIN: 'bg-danger',
      PLATFORM_ADMIN: 'bg-purple',
      SUPPORT_STAFF: 'bg-info',
      BILLING_MANAGER: 'bg-warning',
      admin: 'bg-primary',
      TEACHER: 'bg-success',
      STUDENT: 'bg-secondary',
      PARENT: 'bg-light',
      superadmin: 'bg-danger',
      Admin: 'bg-primary',
      teacher: 'bg-success',
      student: 'bg-secondary',
      parent: 'bg-light'
    }
    return roleConfig[role] || 'bg-secondary'
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      Active: 'bg-success',
      Inactive: 'bg-secondary',
      Suspended: 'bg-warning'
    }
    return statusConfig[status] || 'bg-secondary'
  }

  // Calculate stats
  const activeCount = users.filter(u => u.status === 'Active').length
  const suspendedCount = users.filter(u => u.status === 'Suspended').length
  const adminCount = users.filter(u => 
    u.role === 'SUPER_ADMIN' || u.role === 'admin' || u.role === 'superadmin' || u.role === 'Admin'
  ).length

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="alert alert-danger m-4">
        <h4>Error Loading Users</h4>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchUsers}>
          <i className="ti ti-refresh me-2" />Retry
        </button>
      </div>
    )
  }


  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Platform Users</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Platform Users</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" onClick={handleRefresh}>
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <Link to="/super-admin/users/add" className="btn btn-primary me-2 mb-2">
            <i className="ti ti-user-plus me-2"></i>Add User
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-primary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{users.length}</h4>
                  <p className="text-white mb-0">Total Users</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-users text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-success">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{activeCount}</h4>
                  <p className="text-white mb-0">Active Users</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-user-check text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-warning">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{suspendedCount}</h4>
                  <p className="text-white mb-0">Suspended Users</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-user-x text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-info">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{adminCount}</h4>
                  <p className="text-white mb-0">Admin Users</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-shield text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Filters</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Search</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search users, institutions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-outline-secondary" type="button">
                    <i className="ti ti-search"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">School Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Institution Type</label>
                <select
                  className="form-select"
                  value={selectedInstitutionType}
                  onChange={(e) => setSelectedInstitutionType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="School">School</option>
                  <option value="Inter College">Inter College</option>
                  <option value="Degree College">Degree College</option>
                  <option value="System">System</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Users Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="card-title">Users ({filteredUsers.length})</h4>
          <div className="d-flex align-items-center">
            <span className="badge bg-primary me-2">
              {activeCount} Active
            </span>
            <button className="btn btn-outline-light bg-white btn-icon" onClick={handleRefresh}>
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {filteredUsers.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Institution</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm me-2 bg-primary-transparent rounded">
                            <i className="ti ti-user text-primary"></i>
                          </div>
                          <div className="fw-medium">{user.name}</div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone || 'N/A'}</td>
                      <td>
                        <span className={`badge ${getRoleBadge(user.role)}`}>
                          {user.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{user.institutionName || 'N/A'}</div>
                          <small className="text-muted">{user.institutionType || ''}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <small>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</small>
                      </td>
                      <td>
                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            <i className="ti ti-dots-vertical"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <button className="dropdown-item" onClick={() => handleViewDetails(user)}>
                                <i className="ti ti-eye me-2"></i>View Details
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item" onClick={() => handleEditUser(user)}>
                                <i className="ti ti-edit me-2"></i>Edit User
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item" onClick={() => handleResetPassword(user)}>
                                <i className="ti ti-lock me-2"></i>Reset Password
                              </button>
                            </li>
                            <li>
                              <hr className="dropdown-divider" />
                            </li>
                            <li>
                              <button 
                                className={`dropdown-item ${user.status === 'Active' ? 'text-warning' : 'text-success'}`} 
                                onClick={() => handleToggleStatus(user)}
                              >
                                <i className={`ti ti-${user.status === 'Active' ? 'player-pause' : 'player-play'} me-2`}></i>
                                {user.status === 'Active' ? 'Suspend' : 'Activate'}
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item text-danger" onClick={() => handleDeleteUser(user)}>
                                <i className="ti ti-trash me-2"></i>Delete User
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="ti ti-users-off text-muted fs-1 mb-3"></i>
              <h5>No Users Found</h5>
              <p className="text-muted">No users match the selected filters</p>
            </div>
          )}
        </div>
        {filteredUsers.length > 0 && (
          <div className="card-footer">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>
          </div>
        )}
      </div>


      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">User Details - {selectedUser.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowUserDetailsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">User ID</label>
                      <p className="form-control-plaintext">{selectedUser._id}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Full Name</label>
                      <p className="form-control-plaintext">{selectedUser.name}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <p className="form-control-plaintext">{selectedUser.email}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <p className="form-control-plaintext">{selectedUser.phone || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Role</label>
                      <span className={`badge ${getRoleBadge(selectedUser.role)} text-white`}>
                        {selectedUser.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Department</label>
                      <p className="form-control-plaintext">{selectedUser.department || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Institution</label>
                      <p className="form-control-plaintext">{selectedUser.institutionName || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Institution Type</label>
                      <p className="form-control-plaintext">{selectedUser.institutionType || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <span className={`badge ${getStatusBadge(selectedUser.status)} text-white`}>
                        {selectedUser.status}
                      </span>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Created Date</label>
                      <p className="form-control-plaintext">
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                {selectedUser.permissions && selectedUser.permissions.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label">Permissions</label>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedUser.permissions.map((permission, index) => (
                        <span key={index} className="badge bg-light text-dark">
                          {permission.replace('_', ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserDetailsModal(false)}>
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={() => {
                  setShowUserDetailsModal(false)
                  handleEditUser(selectedUser)
                }}>
                  <i className="ti ti-edit me-2"></i>Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User - {selectedUser.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditUserModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Department</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editFormData.department || ''}
                    onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditUserModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveEditUser} disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-save me-2"></i>Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PlatformUsersPage
