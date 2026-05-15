import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Route {
  _id: string;
  name: string;
  description?: string;
  vehicle?: {
    _id: string;
    registrationNumber: string;
  };
  driver?: {
    _id: string;
    name: string;
  };
  startTime?: string;
  endTime?: string;
  stops: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

const TransportRoutesPage = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/transport/routes?_t=' + Date.now());

      let routesData: Route[] = [];
      if (response.data?.success) {
        const innerData = response.data.data;
        if (Array.isArray(innerData)) {
          routesData = innerData;
        } else if (innerData?.routes && Array.isArray(innerData.routes)) {
          routesData = innerData.routes;
        }
      } else if (Array.isArray(response.data)) {
        routesData = response.data;
      }
      setRoutes(routesData);
    } catch (err: any) {
      console.error('Error fetching routes:', err);
      setError(err.response?.data?.message || 'Failed to load routes');
      toast.error(err.response?.data?.message || 'Failed to load routes');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Route name is required');
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.post('/transport/routes', formData);

      if (response.data?.success || response.status === 200) {
        toast.success('Route added successfully');
        setShowAddModal(false);
        setFormData({
          name: '',
          description: '',
          startTime: '',
          endTime: '',
        });
        fetchRoutes();
      }
    } catch (err: any) {
      console.error('Error adding route:', err);
      toast.error(err.response?.data?.message || 'Failed to add route');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;

    try {
      setSaving(true);
      const response = await apiClient.put(`/transport/routes/${selectedRoute._id}`, formData);

      if (response.data.success) {
        toast.success('Route updated successfully');
        setShowEditModal(false);
        setSelectedRoute(null);
        setFormData({
          name: '',
          description: '',
          startTime: '',
          endTime: '',
        });
        fetchRoutes();
      }
    } catch (err: any) {
      console.error('Error updating route:', err);
      toast.error(err.response?.data?.message || 'Failed to update route');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      if (selectedRoutes.length === 1) {
        const response = await apiClient.delete(`/transport/routes/${selectedRoutes[0]}`);
        if (response.data.success) {
          toast.success('Route deleted successfully');
        }
      } else {
        await Promise.all(
          selectedRoutes.map((id) => apiClient.delete(`/transport/routes/${id}`))
        );
        toast.success('Routes deleted successfully');
      }

      setShowDeleteModal(false);
      setSelectedRoutes([]);
      fetchRoutes();
    } catch (err: any) {
      console.error('Error deleting route(s):', err);
      toast.error(err.response?.data?.message || 'Failed to delete route(s)');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (route: Route) => {
    setSelectedRoute(route);
    setFormData({
      name: route.name,
      description: route.description || '',
      startTime: route.startTime || '',
      endTime: route.endTime || '',
    });
    setShowEditModal(true);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRoutes(filteredRoutes.map((r) => r._id));
    } else {
      setSelectedRoutes([]);
    }
  };

  const toggleSelectRoute = (id: string) => {
    setSelectedRoutes((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon');
  };

  const exportToExcel = () => {
    toast.info('Excel export feature coming soon');
  };

  const activeRoutes = routes.filter((r) => r.status === 'active').length;
  const inactiveRoutes = routes.filter((r) => r.status === 'inactive').length;
  const assignedVehicles = routes.filter((r) => r.vehicle).length;

  if (error && !loading) {
    return (
      <div>
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Transport Routes</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/transport">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/transport">Transport</Link>
                </li>
                <li className="breadcrumb-item active">Routes</li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="ti ti-alert-circle" style={{ fontSize: '48px', color: '#dc3545' }}></i>
          </div>
          <h5>Error Loading Routes</h5>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary" onClick={fetchRoutes}>
            <i className="ti ti-refresh me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Transport Routes</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/transport">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/transport">Transport</Link>
              </li>
              <li className="breadcrumb-item active">Routes</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchRoutes}
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
              <i className="ti ti-square-rounded-plus me-2"></i>Add Route
            </button>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Total Routes</h6>
                  <h3 className="mb-0 text-primary">{routes.length}</h3>
                </div>
                <div className="avatar avatar-lg bg-primary-transparent rounded">
                  <i className="ti ti-route text-primary fs-24"></i>
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
                  <h6 className="mb-0">Active</h6>
                  <h3 className="mb-0 text-success">{activeRoutes}</h3>
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
                  <h6 className="mb-0">Inactive</h6>
                  <h3 className="mb-0 text-danger">{inactiveRoutes}</h3>
                </div>
                <div className="avatar avatar-lg bg-danger-transparent rounded">
                  <i className="ti ti-circle-x text-danger fs-24"></i>
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
                  <h6 className="mb-0">Assigned Vehicles</h6>
                  <h3 className="mb-0 text-info">{assignedVehicles}</h3>
                </div>
                <div className="avatar avatar-lg bg-info-transparent rounded">
                  <i className="ti ti-bus text-info fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Routes List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="dropdown mb-3 me-2">
              <button
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-filter me-2"></i>
                {statusFilter || 'All Status'}
              </button>
              <ul className="dropdown-menu p-3">
                <li>
                  <button
                    className={`dropdown-item rounded-1 ${!statusFilter ? 'active' : ''}`}
                    onClick={() => setStatusFilter('')}
                  >
                    All Status
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item rounded-1 ${statusFilter === 'active' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('active')}
                  >
                    Active
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item rounded-1 ${
                      statusFilter === 'inactive' ? 'active' : ''
                    }`}
                    onClick={() => setStatusFilter('inactive')}
                  >
                    Inactive
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
          ) : filteredRoutes.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="ti ti-route" style={{ fontSize: '48px', color: '#6c757d' }}></i>
              </div>
              <h5>No Routes Found</h5>
              <p className="text-muted">
                {searchTerm || statusFilter
                  ? 'Try adjusting your search or filters'
                  : 'Click "Add Route" to add your first route'}
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
                            selectedRoutes.length === filteredRoutes.length &&
                            filteredRoutes.length > 0
                          }
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Route Name</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Stops</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoutes.map((route) => (
                    <tr key={route._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRoutes.includes(route._id)}
                            onChange={() => toggleSelectRoute(route._id)}
                          />
                        </div>
                      </td>
                      <td>
                        <span className="fw-medium">{route.name}</span>
                      </td>
                      <td>
                        {route.vehicle ? (
                          <Link
                            to={`/institution/transport/vehicles/${route.vehicle._id}`}
                            className="badge bg-info-transparent text-info"
                          >
                            {route.vehicle.registrationNumber}
                          </Link>
                        ) : (
                          <span className="text-muted">Not Assigned</span>
                        )}
                      </td>
                      <td>
                        {route.driver ? (
                          <span>{route.driver.name}</span>
                        ) : (
                          <span className="text-muted">Not Assigned</span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-secondary-transparent text-secondary">
                          {route.stops} stops
                        </span>
                      </td>
                      <td>{route.startTime || '-'}</td>
                      <td>{route.endTime || '-'}</td>
                      <td>
                        <span
                          className={`badge badge-soft-${
                            route.status === 'active' ? 'success' : 'danger'
                          } d-inline-flex align-items-center`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Link
                            to={`/transport/routes/${route._id}`}
                            className="btn btn-sm btn-icon btn-light me-2"
                            title="View Details"
                          >
                            <i className="ti ti-eye"></i>
                          </Link>
                          <button
                            className="btn btn-sm btn-icon btn-info me-2"
                            onClick={() => openEditModal(route)}
                            title="Edit Route"
                          >
                            <i className="ti ti-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-icon btn-danger"
                            onClick={() => {
                              setSelectedRoutes([route._id]);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Route"
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

      {/* Add Route Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Route</h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleAddRoute}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label">
                        Route Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g., Route A - Morning"
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Enter route description"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({
                        name: '',
                        description: '',
                        startTime: '',
                        endTime: '',
                      });
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
                      'Add Route'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Route</h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleEditRoute}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label">
                        Route Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedRoute(null);
                      setFormData({
                        name: '',
                        description: '',
                        startTime: '',
                        endTime: '',
                      });
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
        <div className="modal show d-block" tabIndex={-1} aria-modal="true" role="dialog">
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
                    {selectedRoutes.length > 1 ? 'all the marked routes' : 'this route'}, this
                    can't be undone once you delete.
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

export default TransportRoutesPage;
