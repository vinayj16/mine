// frontend/src/pages/hostel/HostelRoomsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface HostelRoom {
  _id: string;
  roomNumber: string;
  hostel: string;
  roomType: string;
  capacity: number;
  rent: string;
  status?: string;
}

const HostelRoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<HostelRoom | null>(null);

  const [formData, setFormData] = useState({
    roomNo: '',
    hostel: '',
    roomType: 'One Bed',
    capacity: '1',
    rent: ''
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/hostel/rooms');
      if (response.data && response.data.success) {
        setRooms(response.data.data?.rooms || response.data.data || []);
      } else {
        setError(response.data.error?.message || response.data.message || 'Failed to load rooms');
      }
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/hostel/rooms', {
        roomNumber: formData.roomNo,
        hostel: formData.hostel,
        roomType: formData.roomType,
        capacity: parseInt(formData.capacity),
        rent: formData.rent
      });
      if (response.data && response.data.success) {
        const newRoom = response.data.data?.room || response.data.data;
        setRooms([...rooms, newRoom]);
      }
      setShowAddModal(false);
      setFormData({
        roomNo: '',
        hostel: '',
        roomType: 'One Bed',
        capacity: '1',
        rent: ''
      });
    } catch (err: any) {
      console.error('Error adding room:', err);
      setError(err.response?.data?.message || 'Failed to add room');
    }
  };

  const handleEditRoom = (room: HostelRoom) => {
    setSelectedRoom(room);
    setFormData({
      roomNo: room.roomNumber || '',
      hostel: room.hostel || '',
      roomType: room.roomType || 'One Bed',
      capacity: room.capacity.toString(),
      rent: room.rent || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    
    try {
      await apiClient.put(`/hostel/rooms/${selectedRoom._id}`, {
        roomNumber: formData.roomNo,
        hostel: formData.hostel,
        roomType: formData.roomType,
        capacity: parseInt(formData.capacity),
        rent: formData.rent
      });
      setRooms(rooms.map(room => 
        room._id === selectedRoom._id
          ? { 
              ...room, 
              roomNumber: formData.roomNo,
              hostel: formData.hostel,
              roomType: formData.roomType,
              capacity: parseInt(formData.capacity),
              rent: formData.rent
            } 
          : room
      ));
      setShowEditModal(false);
      setSelectedRoom(null);
      setFormData({
        roomNo: '',
        hostel: '',
        roomType: 'One Bed',
        capacity: '1',
        rent: ''
      });
    } catch (err: any) {
      console.error('Error updating room:', err);
      setError(err.response?.data?.message || 'Failed to update room');
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    try {
      await apiClient.delete(`/hostel/rooms/${selectedRoom._id}`);
      setRooms(rooms.filter(room => room._id !== selectedRoom._id));
      setShowDeleteModal(false);
      setSelectedRoom(null);
    } catch (err: any) {
      console.error('Error deleting room:', err);
      setError(err.response?.data?.message || 'Failed to delete room');
    }
  };

  return (
    <>
      
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Hostel Rooms</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <a href="#!">Management</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Hostel Rooms</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1"
                onClick={() => window.location.reload()}
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
                <i className="ti ti-square-rounded-plus me-2"></i>Add Hostel Room
              </button>
            </div>
          </div>
        </div>

        {/* Hostel Rooms List */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Hostel Rooms</h4>
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
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Room No</label>
                            <select className="form-select">
                              <option>Select</option>
                              <option>A1</option>
                              <option>A2</option>
                              <option>A3</option>
                              <option>A4</option>
                              <option>B1</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Name</label>
                            <select className="form-select">
                              <option>Select</option>
                              <option>Phoenix Residence</option>
                              <option>Tranquil Haven</option>
                              <option>Radiant Towers</option>
                              <option>Nova Nest</option>
                              <option>Vista Villa</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-0">
                            <label className="form-label">Type</label>
                            <select className="form-select">
                              <option>One Bed</option>
                              <option>One Bed AC</option>
                              <option>Two Bed</option>
                              <option>Two Bed AC</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-0">
                            <label className="form-label">More Filter</label>
                            <select className="form-select">
                              <option>Select</option>
                              <option>Filters</option>
                              <option>Room No</option>
                              <option>Hostel Name</option>
                              <option>Room Type</option>
                              <option>No of Bed</option>
                              <option>Cost per Bed</option>
                              <option>Action</option>
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
                    <th>Room No</th>
                    <th>Hostel Name</th>
                    <th>Room Type</th>
                    <th>No of Bed</th>
                    <th>Cost per Bed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-danger">{error}</td>
                    </tr>
                  ) : rooms.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">No rooms found</td>
                    </tr>
                  ) : (
                    rooms.map((room) => (
                      <tr key={room._id}>
                        <td>
                          <div className="form-check form-check-md">
                            <input className="form-check-input" type="checkbox" />
                          </div>
                        </td>
                        <td><a href="#!" className="link-primary">{room._id.substring(0, 8)}</a></td>
                        <td>{room.roomNumber}</td>
                        <td>{room.hostel}</td>
                        <td>{room.roomType}</td>
                        <td>{room.capacity}</td>
                        <td>{room.rent}</td>
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
                                    onClick={() => handleEditRoom(room)}
                                  >
                                    <i className="ti ti-edit-circle me-2"></i>Edit
                                  </button>
                                </li>
                                <li>
                                  <button 
                                    className="dropdown-item rounded-1 text-danger"
                                    onClick={() => {
                                      setSelectedRoom(room);
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    

      {/* Add Hostel Room Modal */}
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
                <h4 className="modal-title">Add Hostel Room</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddRoom}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Room No</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="roomNo"
                          value={formData.roomNo}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Hostel</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="hostel"
                          value={formData.hostel}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Room Type</label>
                        <select 
                          className="form-select"
                          name="roomType"
                          value={formData.roomType}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="One Bed">One Bed</option>
                          <option value="One Bed AC">One Bed AC</option>
                          <option value="Two Bed">Two Bed</option>
                          <option value="Two Bed AC">Two Bed AC</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Capacity</label>
                        <select 
                          className="form-select"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                        </select>
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Rent</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="rent"
                          value={formData.rent}
                          onChange={handleInputChange}
                          required
                        />
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
                  <button type="submit" className="btn btn-primary">Add Hostel Room</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Hostel Room Modal */}
      {showEditModal && selectedRoom && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Hostel Room</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleUpdateRoom}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Room No</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="roomNo"
                          value={formData.roomNo}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Hostel</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="hostel"
                          value={formData.hostel}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Room Type</label>
                        <select 
                          className="form-select"
                          name="roomType"
                          value={formData.roomType}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="One Bed">One Bed</option>
                          <option value="One Bed AC">One Bed AC</option>
                          <option value="Two Bed">Two Bed</option>
                          <option value="Two Bed AC">Two Bed AC</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Capacity</label>
                        <select 
                          className="form-select"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                        </select>
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Rent</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="rent"
                          value={formData.rent}
                          onChange={handleInputChange}
                          required
                        />
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
                  <p>Are you sure you want to delete this hostel room? This action cannot be undone.</p>
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
                      onClick={handleDeleteRoom}
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

export default HostelRoomsPage;