import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import academicReasonService from '../../services/academicReasonService';
import type { AcademicReason, CreateAcademicReasonDto } from '../../services/academicReasonService';
import { useAuth } from '../../store/authStore';

const AcademicReasonsPage: React.FC = () => {
  const { user } = useAuth();
  const schoolId = user?.institutionId || user?.schoolId || '';
  
  const [reasons, setReasons] = useState<AcademicReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<AcademicReason | null>(null);
  const [newReason, setNewReason] = useState<CreateAcademicReasonDto>({ 
    role: '', 
    reason: '',
    status: true 
  });

  // Fetch reasons from backend
  useEffect(() => {
    fetchReasons();
  }, [schoolId]);

  const fetchReasons = async () => {
    if (!schoolId) {
      setError('School ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await academicReasonService.getAll(schoolId);
      setReasons(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching reasons:', err);
      setError(err.message || 'Failed to fetch academic reasons');
      setReasons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReason = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schoolId) {
      setError('School ID not found');
      return;
    }

    try {
      await academicReasonService.create(schoolId, newReason);
      setShowAddModal(false);
      setNewReason({ 
        role: '', 
        reason: '', 
        status: true 
      });
      await fetchReasons(); // Refresh the list
    } catch (err: any) {
      console.error('Error adding reason:', err);
      setError(err.message || 'Failed to add academic reason');
    }
  };

  const handleEditReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason || !schoolId) return;
    
    try {
      await academicReasonService.update(schoolId, selectedReason._id, newReason);
      setShowEditModal(false);
      await fetchReasons(); // Refresh the list
    } catch (err: any) {
      console.error('Error updating reason:', err);
      setError(err.message || 'Failed to update academic reason');
    }
  };

  const handleDeleteReason = async () => {
    if (!selectedReason || !schoolId) return;
    
    try {
      await academicReasonService.delete(schoolId, selectedReason._id);
      setShowDeleteModal(false);
      await fetchReasons(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting reason:', err);
      setError(err.message || 'Failed to delete academic reason');
    }
  };

  const openEditModal = (reason: AcademicReason) => {
    setSelectedReason(reason);
    setNewReason({
      role: reason.role,
      reason: reason.reason,
      status: reason.status
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (reason: AcademicReason) => {
    setSelectedReason(reason);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Reason</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Academic</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Reason</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" data-bs-toggle="tooltip"
              data-bs-placement="top" aria-label="Refresh" data-bs-original-title="Refresh">
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
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center"
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
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Reasons
            </button>
          </div>
        </div>
      </div>

      {/* Reasons List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Academic Reasons</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar"></i>
              </span>
              <input type="text" className="form-control date-range bookingrange" placeholder="Select"
                value="Academic Year : 2024 / 2025" readOnly />
            </div>
            <div className="dropdown mb-3 me-2">
              <button className="btn btn-outline-light bg-white dropdown-toggle"
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
                          <label className="form-label">Role</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>Teacher</option>
                            <option>Student</option>
                            <option>Staff</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Reason</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>Pregnancy</option>
                            <option>Fees Unpaid</option>
                            <option>Complaint</option>
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
              <button className="btn btn-outline-light bg-white dropdown-toggle"
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
          {/* Error Message */}
          {error && (
            <div className="alert alert-danger mx-3" role="alert">
              <i className="ti ti-alert-circle me-2"></i>
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading academic reasons...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && reasons.length === 0 && (
            <div className="text-center py-5">
              <i className="ti ti-file-off fs-1 text-muted mb-3"></i>
              <p className="text-muted">No academic reasons found</p>
              <button className="btn btn-primary mt-2" onClick={() => setShowAddModal(true)}>
                <i className="ti ti-plus me-2"></i>Add First Reason
              </button>
            </div>
          )}

          {/* Table */}
          {!loading && !error && reasons.length > 0 && (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" id="select-all" />
                      </div>
                    </th>
                    <th>Role</th>
                    <th>Reason</th>
                    <th>Created Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reasons.map((reason) => (
                    <tr key={reason._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>{reason.role}</td>
                      <td>{reason.reason}</td>
                      <td>{formatDate(reason.createdAt)}</td>
                      <td>
                        <div className="dropdown">
                          <button className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                            data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="ti ti-dots-vertical fs-14"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end p-3">
                            <li>
                              <button className="dropdown-item rounded-1" onClick={() => openEditModal(reason)}>
                                <i className="ti ti-edit-circle me-2"></i>Edit
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item rounded-1" onClick={() => openDeleteModal(reason)}>
                                <i className="ti ti-trash-x me-2"></i>Delete
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
        </div>
      </div>

      {/* Add Reason Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Reason</h4>
                <button type="button" className="btn-close custom-btn-close" onClick={() => setShowAddModal(false)}>
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddReason}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={newReason.reason}
                          onChange={(e) => setNewReason({...newReason, reason: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Role</label>
                        <select 
                          className="form-select"
                          value={newReason.role}
                          onChange={(e) => setNewReason({...newReason, role: e.target.value})}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Student">Student</option>
                          <option value="Staff">Staff</option>
                        </select>
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
                            checked={newReason.status}
                            onChange={(e) => setNewReason({...newReason, status: e.target.checked})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Reason</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reason Modal */}
      {showEditModal && selectedReason && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Reason</h4>
                <button type="button" className="btn-close custom-btn-close" onClick={() => setShowEditModal(false)}>
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditReason}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={newReason.reason}
                          onChange={(e) => setNewReason({...newReason, reason: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Role</label>
                        <select 
                          className="form-select"
                          value={newReason.role}
                          onChange={(e) => setNewReason({...newReason, role: e.target.value})}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Student">Student</option>
                          <option value="Staff">Staff</option>
                        </select>
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
                            checked={newReason.status}
                            onChange={(e) => setNewReason({...newReason, status: e.target.checked})}
                          />
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
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </span>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this reason? This action cannot be undone.</p>
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
                    onClick={handleDeleteReason}
                  >
                    Yes, Delete
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

export default AcademicReasonsPage;
