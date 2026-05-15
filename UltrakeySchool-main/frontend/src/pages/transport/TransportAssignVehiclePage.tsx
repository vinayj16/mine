import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transportAssignmentService } from '../../services/transportAssignmentService';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';

interface AssignedVehicle {
  _id: string;
  route: string;
  pickupPoint: string;
  vehicleNumber: string;
  driver: {
    name: string;
    contact: string;
    image?: string;
  };
  status: 'Active' | 'Inactive';
}

interface RouteOption {
  _id: string;
  routeName: string;
}

interface PickupPointOption {
  _id: string;
  name: string;
  address: string;
}

interface VehicleOption {
  _id: string;
  vehicleNumber: string;
}

const TransportAssignVehiclePage = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<AssignedVehicle[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<AssignedVehicle | null>(null);
  const [formData, setFormData] = useState({
    routeId: '',
    pickupPointId: '',
    vehicleId: '',
    academicYear: '2024/2025'
  });
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPointOption[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);

  const institutionId = '507f1f77bcf86cd799439011';

  useEffect(() => {
    fetchAssignments();
    fetchFormOptions();
  }, []);

  const fetchFormOptions = async () => {
    try {
      const [routesRes, pickupRes, vehiclesRes] = await Promise.all([
        apiClient.get('/transport/routes'),
        apiClient.get('/transport/pickup-points'),
        apiClient.get('/transport/vehicles')
      ]);
      
      const extractArray = (res: any) => {
        if (res.data?.success && res.data?.data) {
          const arr = res.data.data.routes || res.data.data.vehicles || res.data.data.pickupPoints || res.data.data;
          return Array.isArray(arr) ? arr : [];
        }
        if (Array.isArray(res.data)) return res.data;
        return [];
      };
      
      setRoutes(extractArray(routesRes).map((r: any) => ({ _id: r._id, routeName: r.routeName || r.name })));
      setPickupPoints(extractArray(pickupRes).map((p: any) => ({ _id: p._id, name: p.name, address: p.address })));
      setVehicleOptions(extractArray(vehiclesRes).map((v: any) => ({ _id: v._id, vehicleNumber: v.vehicleNumber || v.registrationNumber })));
    } catch (err) {
      console.error('Error fetching form options:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transportAssignmentService.getAllAssignments(institutionId);
      if (response.success) {
        const mappedData: AssignedVehicle[] = response.data.map((item: any) => ({
          _id: item._id,
          route: item.routeId?.name || 'N/A',
          pickupPoint: item.pickupPointId?.address || 'N/A',
          vehicleNumber: item.vehicleId?.vehicleNumber || 'N/A',
          driver: {
            name: item.driverId?.name || 'N/A',
            contact: item.driverId?.phone || 'N/A',
            image: `https://ui-avatars.com/api/?name=${item.driverId?.name || 'Driver'}&background=random`
          },
          status: (item.status === 'active' ? 'Active' : 'Inactive') as 'Active' | 'Inactive'
        }));
        setVehicles(mappedData);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch assignments';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedVehicles(vehicles.map(vehicle => vehicle._id));
    } else {
      setSelectedVehicles([]);
    }
  };

  const toggleVehicleSelection = (id: string) => {
    if (selectedVehicles.includes(id)) {
      setSelectedVehicles(selectedVehicles.filter(vehicleId => vehicleId !== id));
    } else {
      setSelectedVehicles([...selectedVehicles, id]);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await transportAssignmentService.createAssignment(institutionId, formData);
      if (response.success) {
        toast.success('Vehicle assigned successfully');
        setShowAddModal(false);
        setFormData({ routeId: '', pickupPointId: '', vehicleId: '', academicYear: '2024/2025' });
        fetchAssignments();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to assign vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    
    try {
      setLoading(true);
      const response = await transportAssignmentService.updateAssignment(
        editingVehicle._id,
        institutionId,
        formData
      );
      if (response.success) {
        toast.success('Assignment updated successfully');
        setShowEditModal(false);
        setEditingVehicle(null);
        setFormData({ routeId: '', pickupPointId: '', vehicleId: '', academicYear: '2024/2025' });
        fetchAssignments();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    try {
      setLoading(true);
      if (selectedVehicles.length > 0) {
        const response = await transportAssignmentService.bulkDeleteAssignments(selectedVehicles, institutionId);
        if (response.success) {
          toast.success(response.message);
          setSelectedVehicles([]);
          setSelectAll(false);
        }
      } else if (editingVehicle) {
        const response = await transportAssignmentService.deleteAssignment(editingVehicle._id, institutionId);
        if (response.success) {
          toast.success('Assignment deleted successfully');
        }
      }
      setShowDeleteModal(false);
      setEditingVehicle(null);
      fetchAssignments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete assignment');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (vehicle: AssignedVehicle) => {
    setEditingVehicle(vehicle);
    setShowEditModal(true);
  };

  const openDeleteModal = (vehicle: AssignedVehicle) => {
    setEditingVehicle(vehicle);
    setShowDeleteModal(true);
  };

  // Loading state
  if (loading && vehicles.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && vehicles.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">Error Loading Assignments</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchAssignments}>
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
          <h3 className="page-title mb-1">Assign Vehicle</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/transport">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/institution/transport/routes">Transport</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Assign Vehicle</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              data-bs-toggle="tooltip" 
              title="Refresh"
              onClick={fetchAssignments}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" data-bs-toggle="tooltip" title="Print">
              <i className="ti ti-printer"></i>
            </button>
          </div>    
          <div className="dropdown me-2 mb-2">
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown">
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
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus-filled me-2"></i>Assign New Vehicle
            </button>
          </div>
        </div>
      </div>
      {/* /Page Header */}

      {/* Assign Vehicle List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Assign Vehicle List</h4>
          <div className="d-flex align-items-center flex-wrap">       
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar"></i>
              </span>
              <input type="text" className="form-control date-range bookingrange" placeholder="Select" value="Academic Year : 2024 / 2025" readOnly />
            </div>
            
            {/* Filter Dropdown */}
            <div className="dropdown mb-3 me-2">
              <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                <i className="ti ti-filter me-2"></i>Filter
              </button>
              <div className="dropdown-menu drop-width">
                <form>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Route</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Pickup point</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Vehicle Number</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Driver</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
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
                    <button type="button" className="btn btn-light me-3" data-bs-dismiss="modal">Reset</button>
                    <button type="submit" className="btn btn-primary">Apply</button>
                  </div>
                </form>                                 
              </div>
            </div>
            
            {/* Sort Dropdown */}
            <div className="dropdown mb-3">
              <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown">
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
                    Recently Viewed
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
          {/* Empty State */}
          {vehicles.length === 0 && !loading && (
            <div className="text-center py-5">
              <i className="ti ti-car-off fs-1 text-muted mb-3"></i>
              <h5 className="mb-2">No Vehicle Assignments Found</h5>
              <p className="text-muted mb-4">Start by assigning vehicles to routes and pickup points</p>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <i className="ti ti-plus me-2"></i>Assign First Vehicle
              </button>
            </div>
          )}

          {/* Vehicle List Table */}
          {vehicles.length > 0 && (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check">
                        <input 
                          type="checkbox" 
                          className="form-check-input" 
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Route</th>
                    <th>Pickup Point</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle._id}>
                      <td>
                        <div className="form-check">
                          <input 
                            type="checkbox" 
                            className="form-check-input" 
                            checked={selectedVehicles.includes(vehicle._id)}
                            onChange={() => toggleVehicleSelection(vehicle._id)}
                          />
                        </div>
                      </td>
                      <td>
                        <Link to="#" className="link-primary">{vehicle._id.slice(-6)}</Link>
                      </td>
                      <td>{vehicle.route}</td>
                      <td>{vehicle.pickupPoint}</td>
                      <td>{vehicle.vehicleNumber}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm me-2">
                            <img 
                              src={vehicle.driver.image || `https://ui-avatars.com/api/?name=${vehicle.driver.name}&background=random`} 
                              alt={vehicle.driver.name} 
                              className="rounded-circle"
                            />
                          </div>
                          <div>
                            <div>{vehicle.driver.name}</div>
                            <small className="text-muted">{vehicle.driver.contact}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${vehicle.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                          <i className={`ti ti-circle-filled fs-5 me-1`}></i>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="dropdown">
                          <button 
                            className="btn btn-sm btn-icon" 
                            type="button" 
                            data-bs-toggle="dropdown" 
                            aria-expanded="false"
                          >
                            <i className="ti ti-dots-vertical"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <button 
                                className="dropdown-item" 
                                onClick={() => openEditModal(vehicle)}
                              >
                                <i className="ti ti-edit me-2"></i>Edit
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item text-danger" 
                                onClick={() => openDeleteModal(vehicle)}
                              >
                                <i className="ti ti-trash me-2"></i>Delete
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
          )}
          {/* /Vehicle List Table */}
        </div>
      </div>
      {/* /Assign Vehicle List */}

      {/* Add Assign Vehicle Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Assign New Vehicle</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowAddModal(false)}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddVehicle}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Select Route <span className="text-danger">*</span></label>
                        <select 
                          className="form-select" 
                          required
                          value={formData.routeId}
                          onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                        >
                          <option value="">Select Route</option>
                          {routes.map(route => (
                            <option key={route._id} value={route._id}>{route.routeName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Select Pickup Point <span className="text-danger">*</span></label>
                        <select 
                          className="form-select" 
                          required
                          value={formData.pickupPointId}
                          onChange={(e) => setFormData({ ...formData, pickupPointId: e.target.value })}
                        >
                          <option value="">Select Pickup Point</option>
                          {pickupPoints.map(point => (
                            <option key={point._id} value={point._id}>{point.name} - {point.address}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Select Vehicle <span className="text-danger">*</span></label>
                        <select 
                          className="form-select" 
                          required
                          value={formData.vehicleId}
                          onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                        >
                          <option value="">Select Vehicle</option>
                          {vehicleOptions.map(v => (
                            <option key={v._id} value={v._id}>{v.vehicleNumber}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowAddModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Assigning...' : 'Assign Now'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assign Vehicle Modal */}
      {showEditModal && editingVehicle && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Assign Vehicle</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingVehicle(null);
                  }}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditVehicle}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Select Route</label>
                        <select 
                          className="form-select"
                          value={formData.routeId}
                          onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                        >
                          <option value="">Select Route</option>
                          {routes.map(route => (
                            <option key={route._id} value={route._id}>{route.routeName}</option>
                          ))}
                        </select>
                        <small className="text-muted">Current: {editingVehicle.route}</small>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Select Pickup Point</label>
                        <select 
                          className="form-select"
                          value={formData.pickupPointId}
                          onChange={(e) => setFormData({ ...formData, pickupPointId: e.target.value })}
                        >
                          <option value="">Select Pickup Point</option>
                          {pickupPoints.map(point => (
                            <option key={point._id} value={point._id}>{point.name} - {point.address}</option>
                          ))}
                        </select>
                        <small className="text-muted">Current: {editingVehicle.pickupPoint}</small>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Select Vehicle</label>
                        <select 
                          className="form-select"
                          value={formData.vehicleId}
                          onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                        >
                          <option value="">Select Vehicle</option>
                          {vehicleOptions.map(v => (
                            <option key={v._id} value={v._id}>{v.vehicleNumber}</option>
                          ))}
                        </select>
                        <small className="text-muted">Current: {editingVehicle.vehicleNumber}</small>
                      </div>
                      <div className="assigned-driver p-3 bg-light rounded">
                        <h6 className="mb-3">Assigned Driver</h6>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-lg me-3">
                            <img 
                              src={editingVehicle.driver.image} 
                              alt="Driver" 
                              className="rounded-circle"
                            />
                          </div>
                          <div>
                            <h5 className="mb-0">{editingVehicle.driver.name}</h5>
                            <span className="text-muted">{editingVehicle.driver.contact}</span>
                          </div>
                        </div>
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
                      setEditingVehicle(null);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <div className="delete-icon mb-3">
                  <i className="ti ti-trash-x fs-1 text-danger"></i>
                </div>
                <h4 className="mb-3">Confirm Deletion</h4>
                <p className="mb-4">
                  {selectedVehicles.length > 0 
                    ? `You want to delete ${selectedVehicles.length} selected item(s). This can't be undone.`
                    : 'Are you sure you want to delete this item? This action cannot be undone.'
                  }
                </p>
                <div className="d-flex justify-content-center">
                  <button 
                    type="button" 
                    className="btn btn-light me-3" 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setEditingVehicle(null);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDeleteVehicle}
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Yes, Delete'}
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

export default TransportAssignVehiclePage;
