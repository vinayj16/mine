import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { classRoomService } from '../../services/classRoomService';
import type { ClassRoom, CreateClassRoomInput } from '../../services/classRoomService';

const ClassRoomPage = () => {
  // State management
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for modals and form
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<ClassRoom | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateClassRoomInput>({
    roomNo: '',
    capacity: 0,
    status: 'active',
  });

  // Fetch classrooms from backend
  useEffect(() => {
    fetchClassRooms();
  }, []);

  const fetchClassRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await classRoomService.getAll({
        page: 1,
        limit: 100,
        sortBy: 'roomNo',
        sortOrder: 'asc'
      });
      setClassRooms(response.classrooms || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch classrooms';
      console.error('Error fetching classrooms:', err);
      setError(errorMessage);
      setClassRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value
    }));
  };

  // Handle form submission for adding a new room
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await classRoomService.create(formData);
      toast.success('Classroom added successfully');
      setShowAddModal(false);
      resetForm();
      await fetchClassRooms();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add classroom';
      console.error('Error adding classroom:', err);
      toast.error(errorMessage); 
    }
  };

  // Handle form submission for editing a room
  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom?.id) return;
    
    try {
      await classRoomService.update(currentRoom.id, formData);
      toast.success('Classroom updated successfully');
      setShowEditModal(false);
      resetForm();
      await fetchClassRooms();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update classroom';
      console.error('Error updating classroom:', err);
      toast.error(errorMessage);
    }
  };

  // Handle delete room
  const handleDeleteRoom = async () => {
    if (!currentRoom?.id) return;
    
    try {
      await classRoomService.delete(currentRoom.id);
      toast.success('Classroom deleted successfully');
      setShowDeleteModal(false);
      await fetchClassRooms();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete classroom';
      console.error('Error deleting classroom:', err);
      toast.error(errorMessage);
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      roomNo: '',
      capacity: 0,
      status: 'active',
    });
  };

  // Open edit modal with room data
  const openEditModal = (room: ClassRoom) => {
    setCurrentRoom(room);
    setFormData({
      roomNo: room.roomNo,
      capacity: room.capacity,
      status: room.status,
      building: room.building,
      floor: room.floor,
      facilities: room.facilities,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (room: ClassRoom) => {
    setCurrentRoom(room);
    setShowDeleteModal(true);
  };

  return (
    <>
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Class Room</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <span>Academic</span>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Class Room
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1" 
                onClick={() => fetchClassRooms()}
                data-bs-toggle="tooltip"
                data-bs-placement="top" 
                aria-label="Refresh" 
                data-bs-original-title="Refresh"
              >
                <i className="ti ti-refresh"></i>
              </button>
            </div>
            <div className="pe-1 mb-2">
              <button type="button" className="btn btn-outline-light bg-white btn-icon me-1"
                data-bs-toggle="tooltip" data-bs-placement="top" aria-label="Print"
                data-bs-original-title="Print" onClick={() => window.print()}>
                <i className="ti ti-printer"></i>
              </button>
            </div>
            <div className="dropdown me-2 mb-2">
              <button
                className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center"
                data-bs-toggle="dropdown">
                <i className="ti ti-file-export me-2"></i>Export
              </button>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li>
                  <button className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                  </button>
                </li>
              </ul>
            </div>
            <div className="mb-2">
              <button 
                className="btn btn-primary" 
                data-bs-toggle="modal"
                data-bs-target="#add_class_room" 
                onClick={(e) => { e.preventDefault(); setShowAddModal(true); }}
              >
                <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Class Room
              </button>
            </div>
          </div>
        </div>

        {/* Class Rooms Table */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Class Room</h4>
            <div className="d-flex align-items-center flex-wrap">
              <div className="input-icon-start mb-3 me-2 position-relative">
                <span className="icon-addon">
                  <i className="ti ti-calendar"></i>
                </span>
                <input type="text" className="form-control date-range bookingrange" placeholder="Select"
                  value="Academic Year : 2024 / 2025" readOnly />
              </div>
              <div className="dropdown mb-3 me-2">
                <button 
                  className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown" data-bs-auto-close="outside">
                  <i className="ti ti-filter me-2"></i>Filter
                </button>
                <div className="dropdown-menu drop-width">
                  <form>
                    <div className="d-flex align-items-center border-bottom p-3">
                      <h4>Filter</h4>
                    </div>
                    <div className="p-3 border-bottom pb-0">
                      <div className="row">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Room No</label>
                            <select className="form-select">
                              <option>Select</option>
                              {[...new Set(classRooms.map(room => room.roomNo))].map(roomNo => (
                                <option key={roomNo} value={roomNo}>{roomNo}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Capacity</label>
                            <select className="form-select">
                              <option>Select</option>
                              {[...new Set(classRooms.map(room => room.capacity))].map(capacity => (
                                <option key={capacity} value={capacity}>{capacity}</option>
                              ))}
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
                  data-bs-toggle="dropdown">
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
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading classrooms...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger m-3" role="alert">
                <i className="ti ti-alert-circle me-2"></i>
                {error}
              </div>
            ) : classRooms.length === 0 ? (
              <div className="text-center py-5">
                <i className="ti ti-door-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
                <p className="mt-2 text-muted">No classrooms found. Add your first classroom to get started.</p>
              </div>
            ) : (
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
                      <th>Capacity</th>
                      <th>Building</th>
                      <th>Floor</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classRooms.map((room) => (
                      <tr key={room.id}>
                        <td>
                          <div className="form-check form-check-md">
                            <input className="form-check-input" type="checkbox" />
                          </div>
                        </td>
                        <td><a href="#" className="link-primary">{(room.id || room._id || '').slice(0, 8)}</a></td>
                        <td>{room.roomNo}</td>
                        <td>{room.capacity}</td>
                        <td>{room.building || '-'}</td>
                        <td>{room.floor !== undefined ? room.floor : '-'}</td>
                        <td>
                          <span className={`badge badge-soft-${
                            room.status === 'active' ? 'success' : 
                            room.status === 'inactive' ? 'danger' : 
                            'warning'
                          } d-inline-flex align-items-center`}>
                            <i className="ti ti-circle-filled fs-5 me-1"></i>
                            {(room.status || 'active').charAt(0).toUpperCase() + (room.status || 'active').slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="dropdown">
                              <button
                                className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                                data-bs-toggle="dropdown" aria-expanded="false">
                                <i className="ti ti-dots-vertical fs-14"></i>
                              </button>
                              <ul className="dropdown-menu dropdown-menu-right p-3">
                                <li>
                                  <button 
                                    className="dropdown-item rounded-1"
                                    onClick={() => openEditModal(room)}
                                  >
                                    <i className="ti ti-edit-circle me-2"></i>Edit
                                  </button>
                                </li>
                                <li>
                                  <button 
                                    className="dropdown-item rounded-1"
                                    onClick={() => openDeleteModal(room)}
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
      

      {/* Add Class Room Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Class Room</h4>
                <button type="button" className="btn-close custom-btn-close" onClick={() => setShowAddModal(false)}>
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
                        <label className="form-label">Capacity</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="status-title">
                          <h5>Status</h5>
                          <p>Change the Status by toggle</p>
                        </div>
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            role="switch" 
                            checked={formData.status === 'active'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                status: e.target.checked ? 'active' : 'inactive'
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Class Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Room Modal */}
      {showEditModal && currentRoom && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Class Room</h4>
                <button type="button" className="btn-close custom-btn-close" onClick={() => setShowEditModal(false)}>
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditRoom}>
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
                        <label className="form-label">Capacity</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="status-title">
                          <h5>Status</h5>
                          <p>Change the Status by toggle</p>
                        </div>
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            role="switch" 
                            checked={formData.status === 'active'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                status: e.target.checked ? 'active' : 'inactive'
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
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
              <form onSubmit={(e) => { e.preventDefault(); handleDeleteRoom(); }}>
                <div className="modal-body text-center">
                  <span className="delete-icon">
                    <i className="ti ti-trash-x"></i>
                  </span>
                  <h4>Confirm Deletion</h4>
                  <p>Are you sure you want to delete this class room? This action cannot be undone.</p>
                  <div className="d-flex justify-content-center">
                    <button type="button" className="btn btn-light me-3" onClick={() => setShowDeleteModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-danger">
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

export default ClassRoomPage;
