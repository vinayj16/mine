import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Role {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    filterRoles();
  }, [searchTerm, categoryFilter, roles]);

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

  const filterRoles = () => {
    let filtered = [...roles];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(role => role.category === categoryFilter);
    }

    setFilteredRoles(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category === categoryFilter ? '' : category);
  };

  const getUniqueCategories = () => {
    const categories = roles
      .map(role => role.category)
      .filter((cat): cat is string => !!cat);
    return [...new Set(categories)];
  };

  if (error && !loading) {
    return (
      <div>
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Roles</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/users">User Management</Link>
                </li>
                <li className="breadcrumb-item active">Roles</li>
              </ol>
            </nav>
          </div>
        </div>
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
      </div>
    );
  }

  return (
    <div>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Roles</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/users">User Management</Link>
              </li>
              <li className="breadcrumb-item active">Roles</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon"
              onClick={fetchRoles}
              disabled={loading}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="mb-2">
            <Link to="/roles-permissions" className="btn btn-primary">
              <i className="ti ti-settings me-2"></i>Manage Roles
            </Link>
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
                  <h3 className="mb-0 text-primary">{roles.length}</h3>
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
                  <h6 className="mb-0">Active Roles</h6>
                  <h3 className="mb-0 text-success">
                    {roles.filter(r => r.isActive).length}
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
                  <h6 className="mb-0">Categories</h6>
                  <h3 className="mb-0 text-info">
                    {getUniqueCategories().length}
                  </h3>
                </div>
                <div className="avatar avatar-lg bg-info-transparent rounded">
                  <i className="ti ti-category text-info fs-24"></i>
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
                  <h3 className="mb-0 text-warning">{filteredRoles.length}</h3>
                </div>
                <div className="avatar avatar-lg bg-warning-transparent rounded">
                  <i className="ti ti-filter text-warning fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      {getUniqueCategories().length > 0 && (
        <div className="mb-3">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <span className="text-muted me-2">Filter by category:</span>
            <button
              className={`btn btn-sm ${!categoryFilter ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setCategoryFilter('')}
            >
              All
            </button>
            {getUniqueCategories().map(category => (
              <button
                key={category}
                className={`btn btn-sm ${categoryFilter === category ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleCategoryFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Roles List</h4>
            <div className="d-flex align-items-center flex-wrap">
              <div className="input-icon-start mb-3 me-2 position-relative">
                <span className="icon-addon">
                  <i className="ti ti-search"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>
          <div className="card-body p-0 py-3">
            {filteredRoles.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="ti ti-lock" style={{ fontSize: '48px', color: '#6c757d' }}></i>
                </div>
                <h5>No Roles Found</h5>
                <p className="text-muted">
                  {searchTerm || categoryFilter
                    ? 'Try adjusting your search or filters'
                    : 'No roles available'}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table datatable">
                  <thead className="thead-light">
                    <tr>
                      <th>Role Name</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Permissions</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoles.map((role) => (
                      <tr key={role._id}>
                        <td>
                          <span className="fw-medium badge bg-info-transparent text-info">
                            {role.name}
                          </span>
                        </td>
                        <td>{role.description || '-'}</td>
                        <td>
                          {role.category ? (
                            <span className="badge bg-secondary-transparent text-secondary">
                              {role.category}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          <span className="badge bg-primary-transparent text-primary">
                            {role.permissions?.length || 0} permissions
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge badge-soft-${
                              role.isActive ? 'success' : 'danger'
                            } d-inline-flex align-items-center`}
                          >
                            <i className="ti ti-circle-filled fs-5 me-1"></i>
                            {role.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {new Date(role.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Link
                              to={`/role/${role._id}`}
                              className="btn btn-sm btn-icon btn-light me-2"
                              title="View Details"
                            >
                              <i className="ti ti-eye"></i>
                            </Link>
                            <Link
                              to={`/permissions?role=${role._id}`}
                              className="btn btn-sm btn-icon btn-info me-2"
                              title="View Permissions"
                            >
                              <i className="ti ti-shield"></i>
                            </Link>
                            <Link
                              to={`/roles/${role._id}/users`}
                              className="btn btn-sm btn-icon btn-success"
                              title="View Users"
                            >
                              <i className="ti ti-users"></i>
                            </Link>
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
      )}
    </div>
  );
};

export default RolesPage;
