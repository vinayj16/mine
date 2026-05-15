import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Driver {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry?: string;
  address?: string;
  status: 'Active' | 'Inactive';
  assignedVehicle?: {
    _id: string;
    registrationNumber: string;
  };
  createdAt: string;
}

const TransportVehicleDriversPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    address: '',
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/transport/drivers?_t=' + Date.now());

      let driversData = [];
      if (response.data?.success) {
        const innerData = response.data.data;
        if (Array.isArray(innerData)) {
          driversData = innerData;
        } else if (innerData?.drivers && Array.isArray(innerData.drivers)) {
          driversData = innerData.drivers;
        }
      } else if (Array.isArray(response.data)) {
        driversData = response.data;
      }
      setDrivers(driversData);
    } catch (err: any) {
      console.error('Error fetching drivers:', err);
      setError(err.response?.data?.message || 'Failed to load drivers');
      toast.error(err.response?.data?.message || 'Failed to load drivers');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.post('/transport/drivers', formData);

      if (response.data.success) {
        toast.success('Driver added successfully');
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          licenseNumber: '',
          licenseExpiry: '',
          address: '',
        });
        fetchDrivers();
      }
    } catch (err: any) {
      console.error('Error adding driver:', err);
      toast.error(err.response?.data?.message || 'Failed to add driver');
    } finally {
      setSaving(false);
    }
  };

  const handleEditDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;

    try {
      setSaving(true);
      const response = await apiClient.put(`/transport/drivers/${selectedDriver._id}`, formData);

      if (response.data.success) {
        toast.success('Driver updated successfully');
        setShowEditModal(false);
        setSelectedDriver(null);
        setFormData({
          name: '',
          email: '',
          phone: '',
          licenseNumber: '',
          licenseExpiry: '',
          address: '',
        });
        fetchDrivers();
      }
    } catch (err: any) {
      console.error('Error updating driver:', err);
      toast.error(err.response?.data?.message || 'Failed to update driver');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      if (selectedDrivers.length === 1) {
        const response = await apiClient.delete(`/transport/drivers/${selectedDrivers[0]}`);
        if (response.data.success) {
          toast.success('Driver deleted successfully');
        }
      } else {
        const response = await apiClient.post('/transport/drivers/bulk-delete', {
          ids: selectedDrivers,
        });
        if (response.data.success) {
          toast.success('Drivers deleted successfully');
        }
      }

      setShowDeleteModal(false);
      setSelectedDrivers([]);
      fetchDrivers();
    } catch (err: any) {
      console.error('Error deleting driver(s):', err);
      toast.error(err.response?.data?.message || 'Failed to delete driver(s)');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email || '',
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry || '',
      address: driver.address || '',
    });
    setShowEditModal(true);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedDrivers(filteredDrivers.map((d) => d._id));
    } else {
      setSelectedDrivers([]);
    }
  };

  const toggleSelectDriver = (id: string) => {
    setSelectedDrivers((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon');
  };

  const exportToExcel = () => {
    toast.info('Excel export feature coming soon');
  };

  const activeDrivers = drivers.filter((d) => d.status === 'Active').length;
  const inactiveDrivers = drivers.filter((d) => d.status === 'Inactive').length;
  const assignedDrivers = drivers.filter((d) => d.assignedVehicle).length;

  if (error && !loading) {
    return (
      <div>
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Vehicle Drivers</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/transport">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/institution/transport/routes">Transport</Link>
                </li>
                <li className="breadcrumb-item active">Drivers</li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="ti ti-alert-circle" style={{ fontSize: '48px', color: '#dc3545' }}></i>
          </div>
          <h5>Error Loading Drivers</h5>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary" onClick={fetchDrivers}>
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
          <h3 className="page-title mb-1">Vehicle Drivers</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/transport">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/institution/transport/routes">Transport</Link>
              </li>
              <li className="breadcrumb-item active">Drivers</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchDrivers}
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
              <i className="ti ti-square-rounded-plus me-2"></i>Add Driver
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
                  <h6 className="mb-0">Total Drivers</h6>
                  <h3 className="mb-0 text-primary">{drivers.length}</h3>
                </div>
                <div className="avatar avatar-lg bg-primary-transparent rounded">
                  <i className="ti ti-user text-primary fs-24"></i>
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
                  <h3 className="mb-0 text-success">{activeDrivers}</h3>
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
                  <h3 className="mb-0 text-danger">{inactiveDrivers}</h3>
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
                  <h6 className="mb-0">Assigned</h6>
                  <h3 className="mb-0 text-info">{assignedDrivers}</h3>
                </div>
                <div className="avatar avatar-lg bg-info-transparent rounded">
                  <i className="ti ti-steering-wheel text-info fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Drivers List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search drivers..."
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
                    className={`dropdown-item rounded-1 ${statusFilter === 'Active' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('Active')}
                  >
                    Active
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item rounded-1 ${
                      statusFilter === 'Inactive' ? 'active' : ''
                    }`}
                    onClick={() => setStatusFilter('Inactive')}
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
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="ti ti-user" style={{ fontSize: '48px', color: '#6c757d' }}></i>
              </div>
              <h5>No Drivers Found</h5>
              <p className="text-muted">
                {searchTerm || statusFilter
                  ? 'Try adjusting your search or filters'
                  : 'Click "Add Driver" to add your first driver'}
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
                            selectedDrivers.length === filteredDrivers.length &&
                            filteredDrivers.length > 0
                          }
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>License Number</th>
                    <th>License Expiry</th>
                    <th>Assigned Vehicle</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((driver) => (
                    <tr key={driver._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedDrivers.includes(driver._id)}
                            onChange={() => toggleSelectDriver(driver._id)}
                          />
                        </div>
                      </td>
                      <td>
                        <span className="fw-medium">{driver.name}</span>
                      </td>
                      <td>{driver.phone}</td>
                      <td>
                        <code className="badge bg-secondary-transparent text-secondary">
                          {driver.licenseNumber}
                        </code>
                      </td>
                      <td>
                        {driver.licenseExpiry
                          ? new Date(driver.licenseExpiry).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        {driver.assignedVehicle ? (
                          <Link
                            to={`/institution/transport/vehicles/${driver.assignedVehicle._id}`}
                            className="badge bg-info-transparent text-info"
                          >
                            {driver.assignedVehicle.registrationNumber}
                          </Link>
                        ) : (
                          <span className="text-muted">Not Assigned</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge badge-soft-${
                            driver.status === 'Active' ? 'success' : 'danger'
                          } d-inline-flex align-items-center`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {driver.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Link
                            to={`/transport/drivers/${driver._id}`}
                            className="btn btn-sm btn-icon btn-light me-2"
                            title="View Details"
                          >
                            <i className="ti ti-eye"></i>
                          </Link>
                          <button
                            className="btn btn-sm btn-icon btn-info me-2"
                            onClick={() => openEditModal(driver)}
                            title="Edit Driver"
                          >
                            <i className="ti ti-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-icon btn-danger"
                            onClick={() => {
                              setSelectedDrivers([driver._id]);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Driver"
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

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Driver</h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleAddDriver}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Enter driver name"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Phone <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">License Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.licenseNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, licenseNumber: e.target.value })
                        }
                        placeholder="Enter license number"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">License Expiry</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.licenseExpiry}
                        onChange={(e) =>
                          setFormData({ ...formData, licenseExpiry: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Address</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Enter address"
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
                        email: '',
                        phone: '',
                        licenseNumber: '',
                        licenseExpiry: '',
                        address: '',
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
                      'Add Driver'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Driver</h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleEditDriver}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Phone <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">License Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.licenseNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, licenseNumber: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">License Expiry</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.licenseExpiry}
                        onChange={(e) =>
                          setFormData({ ...formData, licenseExpiry: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Address</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                      setSelectedDriver(null);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        licenseNumber: '',
                        licenseExpiry: '',
                        address: '',
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
                    {selectedDrivers.length > 1 ? 'all the marked drivers' : 'this driver'}, this
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

export default TransportVehicleDriversPage;
