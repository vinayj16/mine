import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { classRoomService } from '../../services/classRoomService';
import type { ClassRoom, CreateClassRoomInput } from '../../services/classRoomService';
import classService from '../../services/classService';
import type { Class } from '../../services/classService';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

const FACILITY_OPTIONS = ['projector', 'whiteboard', 'smartboard', 'ac', 'computers', 'wifi', 'audio-system'];
const ROOM_TYPES = ['classroom', 'laboratory', 'library', 'auditorium', 'computer-lab', 'other'];

const ClassRoomPage = () => {
  // State management
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for modals and form
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<ClassRoom | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  
  const getUserData = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  };
  const userData = getUserData();
  const institutionId = userData.institutionId || localStorage.getItem('institutionId') || '';

  // Form state
  const [formData, setFormData] = useState<CreateClassRoomInput & { assignedClass?: string; roomType?: string }>({
    roomNo: '',
    capacity: 0,
    status: 'active',
    building: '',
    floor: 0,
    roomType: 'classroom',
    facilities: [],
    institutionId: institutionId,
  });

  // Fetch classrooms from backend
  useEffect(() => {
    fetchClassRooms();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await classService.getAll({ institutionId });
      setClasses(res.data || []);
    } catch { /* ignore */ }
  };

  const fetchClassRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await classRoomService.getAll({
        page: 1,
        limit: 100,
        sortBy: 'roomNo',
        sortOrder: 'asc',
        institutionId: institutionId
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

  const handleAssignClass = async (roomId: string, classId: string) => {
    try {
      setAssigning(roomId);
      await classRoomService.assignClass(roomId, classId);
      toast.success('Class assigned to room');
      fetchClassRooms();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign class');
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassignClass = async (roomId: string) => {
    try {
      setAssigning(roomId);
      await classRoomService.unassignClass(roomId);
      toast.success('Class unassigned from room');
      fetchClassRooms();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to unassign class');
    } finally {
      setAssigning(null);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' || name === 'floor' ? parseInt(value) || 0 : value
    }));
  };

  const handleFacilityChange = (facility: string) => {
    setFormData(prev => {
      const facilities = prev.facilities || [];
      return {
        ...prev,
        facilities: facilities.includes(facility)
          ? facilities.filter(f => f !== facility)
          : [...facilities, facility]
      };
    });
  };

  // Handle form submission for adding a new room
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await classRoomService.create({ ...formData, institutionId});
      toast.success('Classroom added successfully');
      setShowAddModal(false);
      resetForm();
      await fetchClassRooms();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to add classroom';
      const details = err.response?.data?.error?.details;
      if (details && Array.isArray(details)) {
        toast.error(details.map((d: any) => d.message || d).join(', '));
      } else {
        toast.error(msg);
      }
    }
  };

  // Handle form submission for editing a room
  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom?.id) return;
    
    try {
      const rid = currentRoom.id;
      await classRoomService.update(rid, formData);
      if ((formData as any).assignedClass) {
        await classRoomService.assignClass(rid, (formData as any).assignedClass);
      }
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
      building: '',
      floor: 0,
      roomType: 'classroom',
      facilities: [],
    });
  };

  // Open edit modal with room data
  const openEditModal = (room: ClassRoom) => {
    setCurrentRoom(room);
    setFormData({
      roomNo: room.roomNo,
      capacity: room.capacity,
      status: room.status,
      building: room.building || '',
      floor: room.floor || 0,
      facilities: room.facilities || [],
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (room: ClassRoom) => {
    setCurrentRoom(room);
    setShowDeleteModal(true);
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    const exportData = classRooms.map(room => ({
      'Room No': room.roomNo,
      Capacity: room.capacity,
      Building: room.building || '-',
      Floor: room.floor !== undefined ? room.floor : '-',
      Type: (room as any).roomType || 'classroom',
      'Assigned Class': (room as any).assignedClassName || '-',
      Status: (room.status || 'active').charAt(0).toUpperCase() + (room.status || 'active').slice(1)
    }));
    if (type === 'pdf') {
      exportToPDF(exportData, 'classrooms', [
        { key: 'Room No', label: 'Room No' },
        { key: 'Capacity', label: 'Capacity' },
        { key: 'Building', label: 'Building' },
        { key: 'Floor', label: 'Floor' },
        { key: 'Type', label: 'Type' },
        { key: 'Assigned Class', label: 'Assigned Class' },
        { key: 'Status', label: 'Status' }
      ]);
    } else {
      exportToExcel(exportData, 'classrooms');
    }
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
                  <button className="dropdown-item rounded-1" onClick={() => handleExport('pdf')}>
                    <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1" onClick={() => handleExport('excel')}>
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
                      <th>Room No</th>
                      <th>Capacity</th>
                      <th>Building</th>
                      <th>Floor</th>
                      <th>Type</th>
                      <th>Assigned Class</th>
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
                        <td>{room.roomNo}</td>
                        <td>{room.capacity}</td>
                        <td>{room.building || '-'}</td>
                        <td>{room.floor !== undefined ? room.floor : '-'}</td>
                        <td>{(room as any).roomType || 'classroom'}</td>
                        <td>
                          {(room as any).assignedClassName ? (
                            <span className="badge bg-info bg-opacity-10 text-info">
                              {(room as any).assignedClassName}
                            </span>
                          ) : (
                            <span className="text-muted">Not assigned</span>
                          )}
                        </td>
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
                                {room.assignedClass || (room as any).assignedClassName ? (
                                  <li>
                                    <button 
                                      className="dropdown-item rounded-1 text-warning"
                                      onClick={() => handleUnassignClass(room.id || room._id!)}
                                      disabled={assigning === (room.id || room._id)}
                                    >
                                      <i className="ti ti-x me-2"></i>Unassign
                                    </button>
                                  </li>
                                ) : (
                                    <li>
                                      <div className="px-3 py-2" style={{ minWidth: 180 }}>
                                        <small className="text-muted d-block mb-1">Assign a class:</small>
                                        <select
                                          className="form-select form-select-sm"
                                          value=""
                                          onChange={e => { if (e.target.value) handleAssignClass(room.id || room._id!, e.target.value); }}
                                          disabled={assigning === (room.id || room._id)}
                                        >
                                          <option value="">Select class...</option>
                                          {classes.map(cls => (
                                            <option key={cls._id || cls.id} value={cls._id || cls.id}>
                                              {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </li>
                                  )}
                                <li>
                                  <button 
                                    className="dropdown-item rounded-1 text-danger"
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
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Room No *</label>
                        <input type="text" className="form-control" name="roomNo" value={formData.roomNo} onChange={handleInputChange} required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Capacity *</label>
                        <input type="number" className="form-control" name="capacity" value={formData.capacity} onChange={handleInputChange} required min={1} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Building</label>
                        <input type="text" className="form-control" name="building" value={formData.building || ''} onChange={handleInputChange} placeholder="e.g. Main Building" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Floor</label>
                        <input type="number" className="form-control" name="floor" value={formData.floor || 0} onChange={handleInputChange} min={0} />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Room Type</label>
                        <select className="form-select" name="roomType" value={(formData as any).roomType || 'classroom'} onChange={handleInputChange}>
                          {ROOM_TYPES.map(t => <option key={t} value={t}>{t.replace('-', ' ')}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label d-block">Facilities</label>
                        <div className="d-flex flex-wrap gap-3">
                          {FACILITY_OPTIONS.map(f => (
                            <div className="form-check" key={f}>
                              <input className="form-check-input" type="checkbox" checked={(formData.facilities || []).includes(f)} onChange={() => handleFacilityChange(f)} id={`add-fac-${f}`} />
                              <label className="form-check-label" htmlFor={`add-fac-${f}`}>{f}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="status-title">
                          <h5>Status</h5>
                          <p>Change the Status by toggle</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" role="switch" checked={formData.status === 'active'}
                            onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Class Room</button>
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
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Room No *</label>
                        <input type="text" className="form-control" name="roomNo" value={formData.roomNo} onChange={handleInputChange} required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Capacity *</label>
                        <input type="number" className="form-control" name="capacity" value={formData.capacity} onChange={handleInputChange} required min={1} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Building</label>
                        <input type="text" className="form-control" name="building" value={formData.building || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Floor</label>
                        <input type="number" className="form-control" name="floor" value={formData.floor || 0} onChange={handleInputChange} min={0} />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Room Type</label>
                        <select className="form-select" name="roomType" value={(formData as any).roomType || 'classroom'} onChange={handleInputChange}>
                          {ROOM_TYPES.map(t => <option key={t} value={t}>{t.replace('-', ' ')}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label d-block">Facilities</label>
                        <div className="d-flex flex-wrap gap-3">
                          {FACILITY_OPTIONS.map(f => (
                            <div className="form-check" key={f}>
                              <input className="form-check-input" type="checkbox" checked={(formData.facilities || []).includes(f)} onChange={() => handleFacilityChange(f)} id={`edit-fac-${f}`} />
                              <label className="form-check-label" htmlFor={`edit-fac-${f}`}>{f}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {currentRoom && (
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Assign Class</label>
                          <select className="form-select" value={(formData as any).assignedClass || ''} onChange={e => setFormData({ ...formData, assignedClass: e.target.value })}>
                            <option value="">Not assigned</option>
                            {classes.map(cls => (
                              <option key={cls._id || cls.id} value={cls._id || cls.id}>{cls.name} {cls.section ? `- ${cls.section}` : ''}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    <div className="col-md-12">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="status-title">
                          <h5>Status</h5>
                          <p>Change the Status by toggle</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" role="switch" checked={formData.status === 'active'}
                            onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
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
