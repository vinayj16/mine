import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  category?: string;
}

interface RoleStats {
  total: number;
  admin: number;
  staff: number;
  user: number;
}

const RolesPermissionsPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState<RoleStats>({
    total: 0,
    admin: 0,
    staff: 0,
    user: 0,
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchRoles();
    fetchStats();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/roles');

      if (response.data.success || response.data) {
        const rolesData = response.data.data || response.data;
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      }
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      setError(err.response?.data?.message || 'Failed to load roles');
      toast.error(err.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/roles/stats');

      if (response.data.success && response.data.data) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching role stats:', err);
      // Don't show error toast for stats, it's not critical
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      setSaving(true);
      // Note: The backend doesn't have a POST /roles endpoint in the routes
      // This would need to be added to the backend or use a different endpoint
      toast.info('Role creation endpoint needs to be implemented in backend');
      
      setShowAddModal(false);
      setFormData({ name: '', description: '' });
      // fetchRoles(); // Uncomment when endpoint is available
    } catch (err: any) {
      console.error('Error adding role:', err);
      toast.error(err.response?.data?.message || 'Failed to add role');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      setSaving(true);
      // Note: The backend doesn't have a PUT /roles/:id endpoint in the routes
      // This would need to be added to the backend
      toast.info('Role update endpoint needs to be implemented in backend');
      
      setShowEditModal(false);
      setSelectedRole(null);
      setFormData({ name: '', description: '' });
      // fetchRoles(); // Uncomment when endpoint is available
    } catch (err: any) {
      console.error('Error updating role:', err);
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      // Note: The backend doesn't have a DELETE /roles/:id endpoint in the routes
      // This would need to be added to the backend
      toast.info('Role deletion endpoint needs to be implemented in backend');
      
      setShowDeleteModal(false);
      setSelectedRoles([]);
      // fetchRoles(); // Uncomment when endpoint is available
    } catch (err: any) {
      console.error('Error deleting role(s):', err);
      toast.error(err.response?.data?.message || 'Failed to delete role(s)');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
    });
    setShowEditModal(true);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRoles(roles.map(role => role._id));
    } else {
      setSelectedRoles([]);
    }
  };

  const toggleSelectRole = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon');
  };

  const exportToExcel = () => {
    toast.info('Excel export feature coming soon');
  };

  if (error && !loading) {
    return (
      <div className="text-center py-5">
        <div className="mb-3">
          <i className="ti ti-alert-circle" style={{ fontSize: '48px', color: '#dc3545' }}></i>
        </div>
        <h5>Error Loading Roles</h5>
        <p className="text-muted">{error}</p>
        <button className="btn btn-primary" onClick={fetchRoles}>
          <i className="ti ti-refresh me-2"></i>Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Roles & Permissions</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/users">User Management</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Roles & Permissions
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchRoles}
              disabled={loading}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              type="button" 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
              title="Print"
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button 
              className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item rounded-1" onClick={exportToPDF}>
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1" onClick={exportToExcel}>
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button 
              className="btn btn-primary d-flex align-items-center" 
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus me-2"></i>Add Role
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Total Roles</h6>
                  <h3 className="mb-0 text-primary">{stats.total || roles.length}</h3>
                </div>
                <div className="avatar avatar-lg bg-primary-transparent rounded">
                  <i className="ti ti-lock text-primary fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Admin Roles</h6>
                  <h3 className="mb-0 text-success">{stats.admin}</h3>
                </div>
                <div className="avatar avatar-lg bg-success-transparent rounded">
                  <i className="ti ti-shield-lock text-success fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Staff Roles</h6>
                  <h3 className="mb-0 text-warning">{stats.staff}</h3>
                </div>
                <div className="avatar avatar-lg bg-warning-transparent rounded">
                  <i className="ti ti-users text-warning fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">User Roles</h6>
                  <h3 className="mb-0 text-info">{stats.user}</h3>
                </div>
                <div className="avatar avatar-lg bg-info-transparent rounded">
                  <i className="ti ti-user text-info fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Roles & Permissions List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="dropdown mb-3">
              <button 
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
              </button>
              <ul className="dropdown-menu p-3">
                <li>
                  <button className="dropdown-item rounded-1 active">
                    Ascending
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Descending
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Recently Added
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card-body p-0 py-3">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="ti ti-lock" style={{ fontSize: '48px', color: '#6c757d' }}></i>
              </div>
              <h5>No Roles Found</h5>
              <p className="text-muted">Click "Add Role" to create your first role</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="select-all"
                          checked={selectedRoles.length === roles.length && roles.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Permissions</th>
                    <th>Created On</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            checked={selectedRoles.includes(role._id)}
                            onChange={() => toggleSelectRole(role._id)}
                          />
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-info-transparent text-info">
                          {role.name}
                        </span>
                      </td>
                      <td>{role.description || '-'}</td>
                      <td>
                        <span className="badge bg-primary-transparent text-primary">
                          {role.permissions?.length || 0} permissions
                        </span>
                      </td>
                      <td>{formatDate(role.createdAt)}</td>
                      <td>
                        <span className={`badge badge-soft-${role.isActive ? 'success' : 'danger'} d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {role.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <button
                            className="btn btn-sm btn-icon btn-light me-2"
                            onClick={() => openEditModal(role)}
                            title="Edit Role"
                          >
                            <i className="ti ti-edit"></i>
                          </button>
                          <Link
                            to={`/permissions?role=${role._id}`}
                            className="btn btn-sm btn-icon btn-info me-2"
                            title="Manage Permissions"
                          >
                            <i className="ti ti-shield"></i>
                          </Link>
                          <button
                            className="btn btn-sm btn-icon btn-danger"
                            onClick={() => {
                              setSelectedRoles([role._id]);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Role"
                          >
                            <i className="ti ti-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Role Modal */}
      {showAddModal && (
        <div className="modal show d-block" id="add_role" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Role</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddRole}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Role Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Enter role name"
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Description (Optional)</label>
                        <textarea 
                          className="form-control"
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Enter role description"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({ name: '', description: '' });
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Adding...
                      </>
                    ) : (
                      'Add Role'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && (
        <div className="modal show d-block" id="edit_role" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Role</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditRole}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="col-form-label">Role Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-0">
                        <label className="col-form-label">Description (Optional)</label>
                        <textarea 
                          className="form-control"
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedRole(null);
                      setFormData({ name: '', description: '' });
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" id="delete-modal" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleDelete();
              }}>
                <div className="modal-body text-center">
                  <span className="delete-icon">
                    <i className="ti ti-trash-x"></i>
                  </span>
                  <h4>Confirm Deletion</h4>
                  <p>
                    You want to delete {selectedRoles.length > 1 ? 'all the marked items' : 'this role'}, 
                    this can't be undone once you delete.
                  </p>
                  <div className="d-flex justify-content-center">
                    <button 
                      type="button" 
                      className="btn btn-light me-3"
                      onClick={() => setShowDeleteModal(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-danger" disabled={deleting}>
                      {deleting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Deleting...
                        </>
                      ) : (
                        'Yes, Delete'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showAddModal || showEditModal || showDeleteModal) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  );
};

export default RolesPermissionsPage;
