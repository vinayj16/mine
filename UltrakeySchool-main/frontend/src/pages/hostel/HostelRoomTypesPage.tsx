import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface RoomType {
  _id: string;
  type: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

const HostelRoomTypesPage: React.FC = () => {
  // State management
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: '',
    description: ''
  });

  // Fetch room types from backend
  const fetchRoomTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/hostel/room-types');
      if (response.data.success) {
        setRoomTypes(response.data.data?.roomTypes || response.data.data || []);
        setError(null);
      } else {
        setError(response.data.error?.message || response.data.message || 'Failed to load room types');
        toast.error(response.data.error?.message || 'Failed to load room types');
      }
    } catch (err: any) {
      console.error('Error fetching room types:', err);
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load room types');
      toast.error(err.response?.data?.error?.message || 'Failed to load room types');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchRoomTypes();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle add room type
  const handleAddRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/hostel/room-types', formData);
      toast.success('Room type added successfully');
      setShowAddModal(false);
      setFormData({
        type: '',
        description: ''
      });
      fetchRoomTypes();
    } catch (err: any) {
      console.error('Error adding room type:', err);
      toast.error(err.response?.data?.message || 'Failed to add room type');
    }
  };

  // Handle edit room type
  const handleEditRoomType = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setFormData({
      type: roomType.type,
      description: roomType.description
    });
    setShowEditModal(true);
  };

  // Handle update room type
  const handleUpdateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomType) return;
    
    try {
      await apiClient.put(`/hostel/room-types/${selectedRoomType._id}`, formData);
      toast.success('Room type updated successfully');
      setShowEditModal(false);
      setSelectedRoomType(null);
      setFormData({
        type: '',
        description: ''
      });
      fetchRoomTypes();
    } catch (err: any) {
      console.error('Error updating room type:', err);
      toast.error(err.response?.data?.message || 'Failed to update room type');
    }
  };

  // Handle delete room type
  const handleDeleteRoomType = async () => {
    if (!selectedRoomType) return;
    
    try {
      await apiClient.delete(`/hostel/room-types/${selectedRoomType._id}`);
      toast.success('Room type deleted successfully');
      setShowDeleteModal(false);
      setSelectedRoomType(null);
      fetchRoomTypes();
    } catch (err: any) {
      console.error('Error deleting room type:', err);
      toast.error(err.response?.data?.message || 'Failed to delete room type');
    }
  };

  return (
    <>
      
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Room Type</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <a href="#!">Management</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Room Type</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1"
                onClick={fetchRoomTypes}
                title="Refresh"
                disabled={loading}
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
                  <a href="#!" className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                  </a>
                </li>
                <li>
                  <a href="#!" className="dropdown-item rounded-1">
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
                <i className="ti ti-square-rounded-plus me-2"></i>Add Room Type
              </button>
            </div>
          </div>
        </div>

        {/* Room Types List */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Room Type</h4>
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
                          <div className="mb-0">
                            <label className="form-label">Type</label>
                            <select className="form-select">
                              <option>Select</option>
                              <option>One Bed</option>
                              <option>One Bed AC</option>
                              <option>Two Bed</option>
                              <option>Two Bed AC</option>
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
                    <a href="#!" className="dropdown-item rounded-1 active">
                      Ascending
                    </a>
                  </li>
                  <li>
                    <a href="#!" className="dropdown-item rounded-1">
                      Descending
                    </a>
                  </li>
                  <li>
                    <a href="#!" className="dropdown-item rounded-1">
                      Recently Viewed
                    </a>
                  </li>
                  <li>
                    <a href="#!" className="dropdown-item rounded-1">
                      Recently Added
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="card-body p-0 py-3">
            {/* Loading State */}
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading room types...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="alert alert-danger m-3" role="alert">
                <i className="ti ti-alert-circle me-2"></i>
                {error}
                <button 
                  className="btn btn-sm btn-outline-danger ms-3"
                  onClick={fetchRoomTypes}
                >
                  <i className="ti ti-refresh me-1"></i>Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && roomTypes.length === 0 && (
              <div className="text-center py-5">
                <i className="ti ti-folder-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
                <p className="mt-2 text-muted">No room types found</p>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="ti ti-plus me-1"></i>Add First Room Type
                </button>
              </div>
            )}

            {/* Data Table */}
            {!loading && !error && roomTypes.length > 0 && (
              <div className="custom-datatable-filter table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" id="select-all" />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Room Type</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roomTypes.map((roomType) => (
                    <tr key={roomType._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td><a href="#!" className="link-primary">{roomType._id.slice(-6).toUpperCase()}</a></td>
                      <td>{roomType.type}</td>
                      <td>{roomType.description}</td>
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
                                  onClick={() => handleEditRoomType(roomType)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setSelectedRoomType(roomType);
                                    setShowDeleteModal(true);
                                  }}
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

      {/* Add Room Type Modal */}
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
                <h4 className="modal-title">Add Room Type</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddRoomType}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Room Type</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control" 
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={4}
                          required
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add Room Type</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Type Modal */}
      {showEditModal && selectedRoomType && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Room Type</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleUpdateRoomType}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Room Type</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control" 
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={4}
                          required
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
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
              <form>
                <div className="modal-body text-center">
                  <span className="delete-icon">
                    <i className="ti ti-trash-x"></i>
                  </span>
                  <h4>Confirm Deletion</h4>
                  <p>Are you sure you want to delete this room type? This action cannot be undone.</p>
                  <div className="d-flex justify-content-center">
                    <button 
                      type="button" 
                      className="btn btn-light me-3" 
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger"
                      onClick={handleDeleteRoomType}
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HostelRoomTypesPage;