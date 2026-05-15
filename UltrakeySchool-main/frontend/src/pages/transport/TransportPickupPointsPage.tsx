import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { transportService, type PickupPoint } from '../../services/transportService';
import { toast } from 'react-toastify';

const DEFAULT_INSTITUTION_ID = import.meta.env.VITE_DEFAULT_INSTITUTION_ID || '507f1f77bcf86cd799439011';

const TransportPickupPointsPage: React.FC = () => {
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<PickupPoint | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const institutionId = DEFAULT_INSTITUTION_ID;

  useEffect(() => {
    fetchPickupPoints();
  }, []);

  const fetchPickupPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const pickupPoints = await transportService.getPickupPoints({ institutionId });
      setPickupPoints(pickupPoints);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch pickup points';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      status: 'Active'
    });
  };

  const formatAddedDate = (point: PickupPoint) => {
    const value = point.createdAt || point.updatedAt;
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const openAddModal = () => {
    setError(null);
    clearForm();
    setShowAddModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditPickupPoint = (pickupPoint: PickupPoint) => {
    setError(null);
    setSelectedPickupPoint(pickupPoint);
    setFormData({
      name: pickupPoint.name,
      address: pickupPoint.address,
      latitude: pickupPoint.location?.latitude?.toString() || '',
      longitude: pickupPoint.location?.longitude?.toString() || '',
      status: pickupPoint.status
    });
    setShowEditModal(true);
  };

  const handleAddPickupPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error('Name and address are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        status: formData.status
      };

      if (formData.latitude && formData.longitude) {
        payload.location = {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        };
      }

      await transportService.createPickupPoint({ institutionId, ...payload });
      toast.success('Pickup point created successfully');
      setShowAddModal(false);
      clearForm();
      fetchPickupPoints();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create pickup point';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePickupPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPickupPoint) return;

    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        status: formData.status
      };

      if (formData.latitude && formData.longitude) {
        payload.location = {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        };
      }

      await transportService.updatePickupPoint(selectedPickupPoint._id, { institutionId, ...payload });
      toast.success('Pickup point updated successfully');
      setShowEditModal(false);
      setSelectedPickupPoint(null);
      clearForm();
      fetchPickupPoints();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update pickup point';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePickupPoint = async () => {
    try {
      setSaving(true);
      if (selectedPoints.length > 0) {
        const response = await transportService.bulkDeletePickupPoints(selectedPoints, { institutionId });
        toast.success(response.message || 'Selected pickup points deleted');
        setSelectedPoints([]);
        setSelectAll(false);
      } else if (selectedPickupPoint) {
        const response = await transportService.deletePickupPoint(selectedPickupPoint._id, { institutionId });
        toast.success(response.message || 'Pickup point deleted successfully');
      }
      setShowDeleteModal(false);
      setSelectedPickupPoint(null);
      fetchPickupPoints();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete pickup point';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedPoints(pickupPoints.map(point => point._id));
    } else {
      setSelectedPoints([]);
    }
  };

  const togglePointSelection = (id: string) => {
    if (selectedPoints.includes(id)) {
      setSelectedPoints(selectedPoints.filter(pointId => pointId !== id));
    } else {
      setSelectedPoints([...selectedPoints, id]);
    }
  };

  const openDeleteModal = (point: PickupPoint) => {
    setError(null);
    setSelectedPickupPoint(point);
    setShowDeleteModal(true);
  };

  // Loading state
  if (loading && pickupPoints.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && pickupPoints.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">Error Loading Pickup Points</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchPickupPoints}>
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
          <h3 className="page-title mb-1">Pickup Points</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/transport">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/institution/transport/routes">Transport</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Pickup Points</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchPickupPoints}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
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
                <a href="#" className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </a>
              </li>
              <li>
                <a href="#" className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </a>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button 
              className="btn btn-primary d-flex align-items-center"
              onClick={openAddModal}
            >
              <i className="ti ti-square-rounded-plus me-2"></i>Add Pickup Point
            </button>
          </div>
        </div>
      </div>

      {/* Pickup Points List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Pickup Points List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar"></i>
              </span>
              <input 
                type="text" 
                className="form-control date-range bookingrange" 
                placeholder="Select"
                value="Academic Year : 2024 / 2025"
                readOnly
              />
            </div>
            
            <div className="dropdown mb-3 me-2">
              <button 
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown" 
                data-bs-auto-close="outside"
              >
                <i className="ti ti-filter me-2"></i>Filter
              </button>
              <div className="dropdown-menu drop-width">
                <form>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Status</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>Active</option>
                            <option>Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 d-flex align-items-center justify-content-end">
                    <button type="button" className="btn btn-light me-3">Reset</button>
                    <button type="submit" className="btn btn-primary">Apply</button>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="dropdown mb-3">
              <button 
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
              </button>
              <ul className="dropdown-menu p-3">
                <li>
                  <a href="#" className="dropdown-item rounded-1 active">
                    Ascending
                  </a>
                </li>
                <li>
                  <a href="#" className="dropdown-item rounded-1">
                    Descending
                  </a>
                </li>
                <li>
                  <a href="#" className="dropdown-item rounded-1">
                    Recently Viewed
                  </a>
                </li>
                <li>
                  <a href="#" className="dropdown-item rounded-1">
                    Recently Added
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="card-body p-0 py-3">
          {/* Empty State */}
          {pickupPoints.length === 0 && !loading && (
            <div className="text-center py-5">
              <i className="ti ti-map-pin-off fs-1 text-muted mb-3"></i>
              <h5 className="mb-2">No Pickup Points Found</h5>
              <p className="text-muted mb-4">Start by adding pickup points for your transport routes</p>
              <button className="btn btn-primary" onClick={openAddModal}>
                <i className="ti ti-plus me-2"></i>Add First Pickup Point
              </button>
            </div>
          )}

          {/* Pickup Points Table */}
          {pickupPoints.length > 0 && (
            <div className="custom-datatable-filter table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Route</th>
                    <th>Status</th>
                    <th>Added On</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pickupPoints.map((point) => (
                    <tr key={point._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            checked={selectedPoints.includes(point._id)}
                            onChange={() => togglePointSelection(point._id)}
                          />
                        </div>
                      </td>
                      <td>
                        <Link to="#" className="link-primary">{point._id.slice(-6)}</Link>
                      </td>
                      <td>{point.name}</td>
                      <td>{point.address}</td>
                      <td>{point.routeId?.name || 'N/A'}</td>
                      <td>
                        <span className={`badge badge-soft-${point.status === 'Active' ? 'success' : 'danger'} d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1"></i>{point.status}
                        </span>
                      </td>
                      <td>{formatAddedDate(point)}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="dropdown">
                            <button
                              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                              data-bs-toggle="dropdown" 
                              aria-expanded="false"
                            >
                              <i className="ti ti-dots-vertical fs-14"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              <li>
                                <button 
                                  className="dropdown-item rounded-1"
                                  onClick={() => handleEditPickupPoint(point)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => openDeleteModal(point)}
                                >
                                  <i className="ti ti-trash-x me-2"></i>Delete
                                </button>
                              </li>
                            </ul>
                          </div>
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

      {/* Add Pickup Point Modal */}
      {showAddModal && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Pickup Point</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => {
                    setShowAddModal(false);
                    clearForm();
                  }}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddPickupPoint}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter pickup point name"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Address <span className="text-danger">*</span></label>
                        <textarea 
                          className="form-control"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          rows={3}
                          placeholder="Enter full address"
                        />
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Latitude (Optional)</label>
                            <input 
                              type="number" 
                              step="any"
                              className="form-control"
                              name="latitude"
                              value={formData.latitude}
                              onChange={handleInputChange}
                              placeholder="e.g., 40.7128"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Longitude (Optional)</label>
                            <input 
                              type="number" 
                              step="any"
                              className="form-control"
                              name="longitude"
                              value={formData.longitude}
                              onChange={handleInputChange}
                              placeholder="e.g., -74.0060"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
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
                      clearForm();
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Add Pickup Point'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pickup Point Modal */}
      {showEditModal && selectedPickupPoint && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Pickup Point</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPickupPoint(null);
                    clearForm();
                  }}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleUpdatePickupPoint}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter pickup point name"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Address <span className="text-danger">*</span></label>
                        <textarea 
                          className="form-control"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          rows={3}
                          placeholder="Enter full address"
                        />
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Latitude (Optional)</label>
                            <input 
                              type="number" 
                              step="any"
                              className="form-control"
                              name="latitude"
                              value={formData.latitude}
                              onChange={handleInputChange}
                              placeholder="e.g., 40.7128"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Longitude (Optional)</label>
                            <input 
                              type="number" 
                              step="any"
                              className="form-control"
                              name="longitude"
                              value={formData.longitude}
                              onChange={handleInputChange}
                              placeholder="e.g., -74.0060"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
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
                      setSelectedPickupPoint(null);
                      clearForm();
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
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
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <div className="delete-icon mb-3">
                  <i className="ti ti-trash-x fs-1 text-danger"></i>
                </div>
                <h4 className="mb-3">Confirm Deletion</h4>
                <p className="mb-4">
                  {selectedPoints.length > 0 
                    ? `You want to delete ${selectedPoints.length} selected item(s). This can't be undone.`
                    : 'Are you sure you want to delete this pickup point? This action cannot be undone.'
                  }
                </p>
                <div className="d-flex justify-content-center">
                  <button 
                    type="button" 
                    className="btn btn-light me-3" 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedPickupPoint(null);
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDeletePickupPoint}
                    disabled={saving}
                  >
                    {saving ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransportPickupPointsPage;
