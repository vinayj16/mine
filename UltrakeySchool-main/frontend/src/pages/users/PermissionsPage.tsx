import React, { useState, useEffect } from 'react';
import { Link} from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Permission {
  _id: string;
  name: string;
  key: string;
  description?: string;
  module?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
}

const PermissionsPage: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    module: '',
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    filterPermissions();
  }, [searchTerm, moduleFilter, permissions]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/permissions');

      if (response.data.success || response.data) {
        const permissionsData = response.data.data || response.data;
        setPermissions(Array.isArray(permissionsData) ? permissionsData : []);
      }
    } catch (err: any) {
      console.error('Error fetching permissions:', err);
      setError(err.response?.data?.message || 'Failed to load permissions');
      toast.error(err.response?.data?.message || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const filterPermissions = () => {
    let filtered = [...permissions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (perm) =>
          perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Module filter
    if (moduleFilter) {
      filtered = filtered.filter((perm) => perm.module === moduleFilter);
    }

    setFilteredPermissions(filtered);
  };

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.key.trim()) {
      toast.error('Name and key are required');
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.post('/permissions', formData);

      if (response.data.success) {
        toast.success('Permission added successfully');
        setShowAddModal(false);
        setFormData({ name: '', key: '', description: '', module: '' });
        fetchPermissions();
      }
    } catch (err: any) {
      console.error('Error adding permission:', err);
      toast.error(err.response?.data?.message || 'Failed to add permission');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPermission) return;

    if (!formData.name.trim() || !formData.key.trim()) {
      toast.error('Name and key are required');
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.put(`/permissions/${selectedPermission._id}`, formData);

      if (response.data.success) {
        toast.success('Permission updated successfully');
        setShowEditModal(false);
        setSelectedPermission(null);
        setFormData({ name: '', key: '', description: '', module: '' });
        fetchPermissions();
      }
    } catch (err: any) {
      console.error('Error updating permission:', err);
      toast.error(err.response?.data?.message || 'Failed to update permission');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      if (selectedPermissions.length === 1) {
        const response = await apiClient.delete(`/permissions/${selectedPermissions[0]}`);
        if (response.data.success) {
          toast.success('Permission deleted successfully');
        }
      } else {
        // Bulk delete
        await Promise.all(
          selectedPermissions.map((id) => apiClient.delete(`/permissions/${id}`))
        );
        toast.success('Permissions deleted successfully');
      }

      setShowDeleteModal(false);
      setSelectedPermissions([]);
      fetchPermissions();
    } catch (err: any) {
      console.error('Error deleting permission(s):', err);
      toast.error(err.response?.data?.message || 'Failed to delete permission(s)');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (permission: Permission) => {
    setSelectedPermission(permission);
    setFormData({
      name: permission.name,
      key: permission.key,
      description: permission.description || '',
      module: permission.module || '',
    });
    setShowEditModal(true);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPermissions(filteredPermissions.map((perm) => perm._id));
    } else {
      setSelectedPermissions([]);
    }
  };

  const toggleSelectPermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const getUniqueModules = () => {
    const modules = permissions.map((perm) => perm.module).filter((mod): mod is string => !!mod);
    return [...new Set(modules)];
  };

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon');
  };

  const exportToExcel = () => {
    toast.info('Excel export feature coming soon');
  };

  if (error && !loading) {
    return (
      <div>
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Permissions</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/users">User Management</Link>
                </li>
                <li className="breadcrumb-item active">Permissions</li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="ti ti-alert-circle" style={{ fontSize: '48px', color: '#dc3545' }}></i>
          </div>
          <h5>Error Loading Permissions</h5>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary" onClick={fetchPermissions}>
            <i className="ti ti-refresh me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Permissions</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/users">User Management</Link>
              </li>
              <li className="breadcrumb-item active">Permissions</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchPermissions}
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
              <i className="ti ti-square-rounded-plus me-2"></i>Add Permission
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
                  <h6 className="mb-0">Total Permissions</h6>
                  <h3 className="mb-0 text-primary">{permissions.length}</h3>
                </div>
                <div className="avatar avatar-lg bg-primary-transparent rounded">
                  <i className="ti ti-key text-primary fs-24"></i>
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
                  <h6 className="mb-0">Active Permissions</h6>
                  <h3 className="mb-0 text-success">
                    {permissions.filter((p) => p.isActive).length}
                  </h3>
                </div>
                <div className="avatar avatar-lg bg-success-transparent rounded">
                  <i className="ti ti-circle-check text-success fs-24"></i>
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
                  <h6 className="mb-0">Modules</h6>
                  <h3 className="mb-0 text-info">{getUniqueModules().length}</h3>
                </div>
                <div className="avatar avatar-lg bg-info-transparent rounded">
                  <i className="ti ti-apps text-info fs-24"></i>
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
                  <h6 className="mb-0">Filtered Results</h6>
                  <h3 className="mb-0 text-warning">{filteredPermissions.length}</h3>
                </div>
                <div className="avatar avatar-lg bg-warning-transparent rounded">
                  <i className="ti ti-filter text-warning fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Filter Chips */}
      {getUniqueModules().length > 0 && (
        <div className="mb-3">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <span className="text-muted me-2">Filter by module:</span>
            <button
              className={`btn btn-sm ${!moduleFilter ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setModuleFilter('')}
            >
              All
            </button>
            {getUniqueModules().map((module) => (
              <button
                key={module}
                className={`btn btn-sm ${
                  moduleFilter === module ? 'btn-primary' : 'btn-outline-primary'
                }`}
                onClick={() => setModuleFilter(moduleFilter === module ? '' : module)}
              >
                {module}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Permissions List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Permissions List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
          ) : filteredPermissions.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="ti ti-key" style={{ fontSize: '48px', color: '#6c757d' }}></i>
              </div>
              <h5>No Permissions Found</h5>
              <p className="text-muted">
                {searchTerm || moduleFilter
                  ? 'Try adjusting your search or filters'
                  : 'Click "Add Permission" to create your first permission'}
              </p>
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
                          checked={
                            selectedPermissions.length === filteredPermissions.length &&
                            filteredPermissions.length > 0
                          }
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Permission Name</th>
                    <th>Key</th>
                    <th>Description</th>
                    <th>Module</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissions.map((permission) => (
                    <tr key={permission._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedPermissions.includes(permission._id)}
                            onChange={() => toggleSelectPermission(permission._id)}
                          />
                        </div>
                      </td>
                      <td>
                        <span className="fw-medium">{permission.name}</span>
                      </td>
                      <td>
                        <code className="badge bg-secondary-transparent text-secondary">
                          {permission.key}
                        </code>
                      </td>
                      <td>{permission.description || '-'}</td>
                      <td>
                        {permission.module ? (
                          <span className="badge bg-info-transparent text-info">
                            {permission.module}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge badge-soft-${
                            permission.isActive ? 'success' : 'danger'
                          } d-inline-flex align-items-center`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {permission.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {new Date(permission.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <button
                            className="btn btn-sm btn-icon btn-light me-2"
                            onClick={() => openEditModal(permission)}
                            title="Edit Permission"
                          >
                            <i className="ti ti-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-icon btn-danger"
                            onClick={() => {
                              setSelectedPermissions([permission._id]);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Permission"
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

      {/* Add Permission Modal */}
      {showAddModal && (
        <div
          className="modal show d-block"
          id="add_permission"
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Permission</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddPermission}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Permission Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="e.g., View Students"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">
                          Permission Key <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.key}
                          onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                          required
                          placeholder="e.g., view_students"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Module (Optional)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.module}
                          onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                          placeholder="e.g., Students"
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Description (Optional)</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          placeholder="Enter permission description"
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
                      setFormData({ name: '', key: '', description: '', module: '' });
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
                      'Add Permission'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Permission Modal */}
      {showEditModal && (
        <div
          className="modal show d-block"
          id="edit_permission"
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Permission</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditPermission}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="col-form-label">
                          Permission Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="col-form-label">
                          Permission Key <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.key}
                          onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="col-form-label">Module (Optional)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.module}
                          onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                        />
                      </div>
                      <div className="mb-0">
                        <label className="col-form-label">Description (Optional)</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
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
                      setSelectedPermission(null);
                      setFormData({ name: '', key: '', description: '', module: '' });
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
        <div
          className="modal show d-block"
          id="delete-modal"
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
              >
                <div className="modal-body text-center">
                  <span className="delete-icon">
                    <i className="ti ti-trash-x"></i>
                  </span>
                  <h4>Confirm Deletion</h4>
                  <p>
                    You want to delete{' '}
                    {selectedPermissions.length > 1 ? 'all the marked items' : 'this permission'},
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

export default PermissionsPage;
