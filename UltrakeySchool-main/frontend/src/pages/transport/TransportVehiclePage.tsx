import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Vehicle {
  _id: string;
  registrationNumber: string;
  vehicleType: string;
  model: string;
  manufacturer: string;
  capacity: number;
  driver?: {
    _id: string;
    name: string;
  };
  status: 'active' | 'inactive' | 'maintenance';
  gpsEnabled: boolean;
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  createdAt: string;
}

const TransportVehiclePage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    registrationNumber: '',
    vehicleType: '',
    model: '',
    manufacturer: '',
    capacity: 0,
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/transport/vehicles?_t=' + Date.now());

      let vehiclesData = [];
      if (response.data?.success) {
        const innerData = response.data.data;
        if (Array.isArray(innerData)) {
          vehiclesData = innerData;
        } else if (innerData?.vehicles && Array.isArray(innerData.vehicles)) {
          vehiclesData = innerData.vehicles;
        }
      } else if (Array.isArray(response.data)) {
        vehiclesData = response.data;
      }
      setVehicles(vehiclesData);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      setError(err.response?.data?.message || 'Failed to load vehicles');
      toast.error(err.response?.data?.message || 'Failed to load vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.registrationNumber.trim()) {
      toast.error('Registration number is required');
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.post('/transport/vehicles', formData);

      if (response.data.success) {
        toast.success('Vehicle added successfully');
        setShowAddModal(false);
        setFormData({
          registrationNumber: '',
          vehicleType: '',
          model: '',
          manufacturer: '',
          capacity: 0,
        });
        fetchVehicles();
      }
    } catch (err: any) {
      console.error('Error adding vehicle:', err);
      toast.error(err.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    try {
      setSaving(true);
      const response = await apiClient.put(`/transport/vehicles/${selectedVehicle._id}`, formData);

      if (response.data.success) {
        toast.success('Vehicle updated successfully');
        setShowEditModal(false);
        setSelectedVehicle(null);
        setFormData({
          registrationNumber: '',
          vehicleType: '',
          model: '',
          manufacturer: '',
          capacity: 0,
        });
        fetchVehicles();
      }
    } catch (err: any) {
      console.error('Error updating vehicle:', err);
      toast.error(err.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      if (selectedVehicles.length === 1) {
        const response = await apiClient.delete(`/transport/vehicles/${selectedVehicles[0]}`);
        if (response.data.success) {
          toast.success('Vehicle deleted successfully');
        }
      } else {
        await Promise.all(
          selectedVehicles.map((id) => apiClient.delete(`/transport/vehicles/${id}`))
        );
        toast.success('Vehicles deleted successfully');
      }

      setShowDeleteModal(false);
      setSelectedVehicles([]);
      fetchVehicles();
    } catch (err: any) {
      console.error('Error deleting vehicle(s):', err);
      toast.error(err.response?.data?.message || 'Failed to delete vehicle(s)');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      registrationNumber: vehicle.registrationNumber,
      vehicleType: vehicle.vehicleType,
      model: vehicle.model,
      manufacturer: vehicle.manufacturer,
      capacity: vehicle.capacity,
    });
    setShowEditModal(true);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedVehicles(vehicles.map((v) => v._id));
    } else {
      setSelectedVehicles([]);
    }
  };

  const toggleSelectVehicle = (id: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id]
    );
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon');
  };

  const exportToExcel = () => {
    toast.info('Excel export feature coming soon');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-soft-success';
      case 'maintenance':
        return 'badge-soft-warning';
      case 'inactive':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  if (error && !loading) {
    return (
      <div>
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Transport Vehicles</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/transport">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/institution/transport/routes">Transport</Link>
                </li>
                <li className="breadcrumb-item active">Vehicles</li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="ti ti-alert-circle" style={{ fontSize: '48px', color: '#dc3545' }}></i>
          </div>
          <h5>Error Loading Vehicles</h5>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary" onClick={fetchVehicles}>
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
          <h3 className="page-title mb-1">Transport Vehicles</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/transport">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/institution/transport/routes">Transport</Link>
              </li>
              <li className="breadcrumb-item active">Vehicles</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchVehicles}
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
              <i className="ti ti-square-rounded-plus me-2"></i>Add Vehicle
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
                  <h6 className="mb-0">Total Vehicles</h6>
                  <h3 className="mb-0 text-primary">{vehicles.length}</h3>
                </div>
                <div className="avatar avatar-lg bg-primary-transparent rounded">
                  <i className="ti ti-bus text-primary fs-24"></i>
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
                  <h3 className="mb-0 text-success">
                    {vehicles.filter((v) => v.status === 'active').length}
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
                  <h6 className="mb-0">Maintenance</h6>
                  <h3 className="mb-0 text-warning">
                    {vehicles.filter((v) => v.status === 'maintenance').length}
                  </h3>
                </div>
                <div className="avatar avatar-lg bg-warning-transparent rounded">
                  <i className="ti ti-tool text-warning fs-24"></i>
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
                  <h6 className="mb-0">GPS Enabled</h6>
                  <h3 className="mb-0 text-info">
                    {vehicles.filter((v) => v.gpsEnabled).length}
                  </h3>
                </div>
                <div className="avatar avatar-lg bg-info-transparent rounded">
                  <i className="ti ti-map-pin text-info fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Vehicles List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search vehicles..."
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
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="ti ti-bus" style={{ fontSize: '48px', color: '#6c757d' }}></i>
              </div>
              <h5>No Vehicles Found</h5>
              <p className="text-muted">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Click "Add Vehicle" to add your first vehicle'}
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
                            selectedVehicles.length === filteredVehicles.length &&
                            filteredVehicles.length > 0
                          }
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Registration No</th>
                    <th>Type</th>
                    <th>Model</th>
                    <th>Manufacturer</th>
                    <th>Capacity</th>
                    <th>Driver</th>
                    <th>GPS</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedVehicles.includes(vehicle._id)}
                            onChange={() => toggleSelectVehicle(vehicle._id)}
                          />
                        </div>
                      </td>
                      <td>
                        <span className="fw-medium">{vehicle.registrationNumber}</span>
                      </td>
                      <td>{vehicle.vehicleType}</td>
                      <td>{vehicle.model}</td>
                      <td>{vehicle.manufacturer}</td>
                      <td>{vehicle.capacity}</td>
                      <td>{vehicle.driver?.name || '-'}</td>
                      <td>
                        {vehicle.gpsEnabled ? (
                          <span className="badge bg-success-transparent text-success">
                            <i className="ti ti-check me-1"></i>Enabled
                          </span>
                        ) : (
                          <span className="badge bg-secondary-transparent text-secondary">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusBadge(
                            vehicle.status
                          )} d-inline-flex align-items-center`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Link
                            to={`/transport/vehicles/${vehicle._id}`}
                            className="btn btn-sm btn-icon btn-light me-2"
                            title="View Details"
                          >
                            <i className="ti ti-eye"></i>
                          </Link>
                          <button
                            className="btn btn-sm btn-icon btn-info me-2"
                            onClick={() => openEditModal(vehicle)}
                            title="Edit Vehicle"
                          >
                            <i className="ti ti-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-icon btn-danger"
                            onClick={() => {
                              setSelectedVehicles([vehicle._id]);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Vehicle"
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

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Vehicle</h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleAddVehicle}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Registration Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.registrationNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, registrationNumber: e.target.value })
                        }
                        required
                        placeholder="e.g., ABC-1234"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Vehicle Type</label>
                      <select
                        className="form-select"
                        value={formData.vehicleType}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicleType: e.target.value })
                        }
                      >
                        <option value="">Select Type</option>
                        <option value="Bus">Bus</option>
                        <option value="Van">Van</option>
                        <option value="Car">Car</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Model</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="e.g., Transit 2020"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Manufacturer</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.manufacturer}
                        onChange={(e) =>
                          setFormData({ ...formData, manufacturer: e.target.value })
                        }
                        placeholder="e.g., Ford"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Capacity</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.capacity}
                        onChange={(e) =>
                          setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })
                        }
                        placeholder="e.g., 50"
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
                        registrationNumber: '',
                        vehicleType: '',
                        model: '',
                        manufacturer: '',
                        capacity: 0,
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
                      'Add Vehicle'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Vehicle</h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleEditVehicle}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Registration Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.registrationNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, registrationNumber: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Vehicle Type</label>
                      <select
                        className="form-select"
                        value={formData.vehicleType}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicleType: e.target.value })
                        }
                      >
                        <option value="">Select Type</option>
                        <option value="Bus">Bus</option>
                        <option value="Van">Van</option>
                        <option value="Car">Car</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Model</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Manufacturer</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.manufacturer}
                        onChange={(e) =>
                          setFormData({ ...formData, manufacturer: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Capacity</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.capacity}
                        onChange={(e) =>
                          setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })
                        }
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
                      setSelectedVehicle(null);
                      setFormData({
                        registrationNumber: '',
                        vehicleType: '',
                        model: '',
                        manufacturer: '',
                        capacity: 0,
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
                    {selectedVehicles.length > 1
                      ? 'all the marked vehicles'
                      : 'this vehicle'}
                    , this can't be undone once you delete.
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

export default TransportVehiclePage;
