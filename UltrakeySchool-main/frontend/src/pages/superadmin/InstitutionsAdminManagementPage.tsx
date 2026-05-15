import React, { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { getInstitutionConfigFromPath } from '../../utils/institutionUtils'
import { apiService } from '../../services/api'

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'Super Admin' | 'Admin' | 'Viewer'
  status: 'Active' | 'Inactive'
  lastLogin: string
  createdAt: string
}

interface School {
  id: string
  name: string
  address: string
  city: string
  state: string
  adminName?: string
  adminEmail?: string
}

const InstitutionsAdminManagementPage: React.FC = () => {
  const params = useParams<{ id?: string }>()
  const location = useLocation()
  const institutionConfig = getInstitutionConfigFromPath(location.pathname)
  const schoolId = params.id
  
  console.log('URL params:', params) // Debug log
  console.log('Extracted schoolId:', schoolId) // Debug log
  
  // Get institution by ID and type from the current path
  // const institutionType = location.pathname.includes('/inter-colleges') ? 'inter-colleges' : 
  //                         location.pathname.includes('/degree-colleges') ? 'degree-colleges' : 'schools'
  
  const [school, setSchool] = useState<School | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null)

  useEffect(() => {
    const fetchSchoolAndAdmins = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch school from API based on institution type
        const schoolResponse = await apiService.get(`/schools/${schoolId}`)
        
        if (schoolResponse.success && schoolResponse.data) {
          setSchool(schoolResponse.data as School)
          
          // Fetch admin users for this school
          const adminsResponse = await apiService.get(`/schools/${schoolId}/admins`)
          
          if (adminsResponse.success && adminsResponse.data) {
            setAdminUsers(Array.isArray(adminsResponse.data) ? adminsResponse.data : [])
          } else {
            // If API fails, set empty array
            setAdminUsers([])
          }
        } else {
          setError('Failed to fetch school details')
        }
      } catch (err) {
        console.error('Error fetching school or admins:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch school details')
      } finally {
        setLoading(false)
      }
    }

    if (schoolId) {
      fetchSchoolAndAdmins()
    }
  }, [schoolId])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <div className="alert alert-danger">{error}</div>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="text-center">
            <div className="card">
              <div className="card-body">
                <i className="ti ti-exclamation-triangle text-warning fs-1 mb-3"></i>
                <h4>{institutionConfig?.singularName || 'Institution'} Not Found</h4>
                <p className="text-muted">The {institutionConfig?.singularName?.toLowerCase() || 'institution'} with ID "{schoolId}" could not be found.</p>
                <div className="alert alert-info mt-3">
                  <strong>Available {institutionConfig?.name || 'Institutions'} IDs:</strong>
                  <ul className="list-unstyled mb-0">
                    <li><strong>1</strong> - Sample {institutionConfig?.singularName || 'Institution'}</li>
                  </ul>
                </div>
                <Link to={institutionConfig?.basePath || '/super-admin/institutions'} className="btn btn-primary">
                  <i className="ti ti-arrow-left me-2"></i>Back to {institutionConfig?.name || 'Institutions'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSelectAdmin = (adminId: string) => {
    if (selectedAdmins.includes(adminId)) {
      setSelectedAdmins(selectedAdmins.filter(id => id !== adminId))
    } else {
      setSelectedAdmins([...selectedAdmins, adminId])
    }
  }

  const handleSelectAll = () => {
    setSelectedAdmins(adminUsers.map(admin => admin.id))
  }

  const handleToggleStatus = async (adminId: string) => {
    try {
      const response = await apiService.patch(`/schools/${schoolId}/admins/${adminId}/toggle-status`)
      if (response.success) {
        // Refresh admin users list
        const adminsResponse = await apiService.get(`/schools/${schoolId}/admins`)
        if (adminsResponse.success && adminsResponse.data) {
          setAdminUsers(Array.isArray(adminsResponse.data) ? adminsResponse.data : [])
        }
      }
    } catch (err) {
      console.error('Error toggling admin status:', err)
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (window.confirm('Are you sure you want to delete this admin user?')) {
      try {
        const response = await apiService.delete(`/schools/${schoolId}/admins/${adminId}`)
        if (response.success) {
          // Refresh admin users list
          const adminsResponse = await apiService.get(`/schools/${schoolId}/admins`)
          if (adminsResponse.success && adminsResponse.data) {
            setAdminUsers(adminsResponse.data as AdminUser[])
          }
        }
      } catch (err) {
        console.error('Error deleting admin:', err)
      }
    }
  }

  const handleEditAdmin = (admin: AdminUser) => {
    setEditingAdmin(admin)
    setShowAddModal(true)
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'Super Admin': 'bg-danger',
      'Admin': 'bg-warning',
      'Viewer': 'bg-info'
    }
    return roleConfig[role as keyof typeof roleConfig] || 'bg-secondary'
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Active': 'bg-success',
      'Inactive': 'bg-warning'
    }
    return statusConfig[status as keyof typeof statusConfig] || 'bg-secondary'
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Admin Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/super-admin/institutions">Institutions</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={institutionConfig?.basePath || '#'}>{institutionConfig?.name || 'Institutions'}</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`${institutionConfig?.basePath || '#'}/${schoolId}`}>{school.name}</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Admin Management</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1">
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <button 
            className="btn btn-primary mb-2"
            onClick={() => setShowAddModal(true)}
          >
            <i className="ti ti-plus me-2"></i>Add Admin
          </button>
        </div>
      </div>

      {/* School Info Card */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center">
            <div className="avatar avatar-lg me-3">
              <i className="ti ti-building text-primary fs-4"></i>
            </div>
            <div>
              <h4 className="mb-1">{school.name}</h4>
              <p className="text-muted mb-0">{school.address}, {school.city}, {school.state}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="card-title">Admin Users ({adminUsers.length})</h4>
          <div className="d-flex align-items-center">
            {selectedAdmins.length > 0 && (
              <span className="badge bg-primary me-2">
                {selectedAdmins.length} selected
              </span>
            )}
            <div className="form-check">
              <input 
                className="form-check-input"
                type="checkbox"
                id="selectAll"
                checked={selectedAdmins.length === adminUsers.length}
                onChange={handleSelectAll}
              />
              <label className="form-check-label" htmlFor="selectAll">
                Select All
              </label>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th className="w-1">
                    <div className="form-check">
                      <input 
                        className="form-check-input"
                        type="checkbox"
                        id="headerSelectAll"
                        checked={selectedAdmins.length === adminUsers.length}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label" htmlFor="headerSelectAll"></label>
                    </div>
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <div className="form-check">
                        <input 
                          className="form-check-input"
                          type="checkbox"
                          checked={selectedAdmins.includes(admin.id)}
                          onChange={() => handleSelectAdmin(admin.id)}
                        />
                        <label className="form-check-label"></label>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-sm me-2">
                          <i className="ti ti-user text-info"></i>
                        </div>
                        <span className="fw-medium">{admin.name}</span>
                      </div>
                    </td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={`badge ${getRoleBadge(admin.role)}`}>
                        {admin.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(admin.status)}`}>
                        {admin.status}
                      </span>
                    </td>
                    <td>{admin.lastLogin}</td>
                    <td>{admin.createdAt}</td>
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
                            <button className="dropdown-item" onClick={() => handleEditAdmin(admin)}>
                              <i className="ti ti-edit me-2"></i>Edit User
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => handleToggleStatus(admin.id)}>
                              <i className="ti ti-player-pause me-2"></i>
                              {admin.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item text-danger" onClick={() => handleDeleteAdmin(admin.id)}>
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
        </div>
      </div>

      {/* Add/Edit Admin Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingAdmin ? 'Edit Admin User' : 'Add Admin User'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingAdmin(null)
                  }}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={editingAdmin?.name || ''}
                      onChange={(e) => setEditingAdmin(prev => prev ? { ...prev, name: e.target.value } : null)}
                      placeholder="Enter admin name"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-control"
                      value={editingAdmin?.email || ''}
                      onChange={(e) => setEditingAdmin(prev => prev ? { ...prev, email: e.target.value } : null)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select 
                      className="form-select"
                      value={editingAdmin?.role || 'Viewer'}
                      onChange={(e) => setEditingAdmin(prev => prev ? { ...prev, role: e.target.value as 'Super Admin' | 'Admin' | 'Viewer' } : null)}
                    >
                      <option value="Viewer">Viewer</option>
                      <option value="Admin">Admin</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-select"
                      value={editingAdmin?.status || 'Active'}
                      onChange={(e) => setEditingAdmin(prev => prev ? { ...prev, status: e.target.value as 'Active' | 'Inactive' } : null)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingAdmin(null)
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={async () => {
                    console.log('Save admin:', editingAdmin || 'new admin')
                    
                    if (editingAdmin) {
                      // Update existing admin
                      try {
                        const response = await apiService.put(`/schools/${schoolId}/admins/${editingAdmin.id}`, {
                          name: editingAdmin.name,
                          email: editingAdmin.email,
                          role: editingAdmin.role,
                          status: editingAdmin.status
                        })
                        if (response.success) {
                          // Refresh admin users list
                          const adminsResponse = await apiService.get(`/schools/${schoolId}/admins`)
                          if (adminsResponse.success) {
                            setAdminUsers(Array.isArray(adminsResponse.data) ? adminsResponse.data : [])
                          } else {
                            setAdminUsers([])
                          }
                        }
                      } catch (err) {
                        console.error('Error updating admin:', err)
                      }
                    } else {
                      // Create new admin
                      try {
                        const response = await apiService.post(`/schools/${schoolId}/admins`, {
                          name: 'New Admin',
                          email: 'new.admin@school.edu',
                          role: 'Viewer',
                          status: 'Active'
                        })
                        if (response.success) {
                          // Refresh admin users list
                          const adminsResponse = await apiService.get(`/schools/${schoolId}/admins`)
                          if (adminsResponse.success) {
                            setAdminUsers(Array.isArray(adminsResponse.data) ? adminsResponse.data : [])
                          } else {
                            setAdminUsers([])
                          }
                        }
                      } catch (err) {
                        console.error('Error creating admin:', err)
                      }
                    }
                    
                    setShowAddModal(false)
                    setEditingAdmin(null)
                  }}
                >
                  {editingAdmin ? 'Update' : 'Add'} User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default InstitutionsAdminManagementPage
