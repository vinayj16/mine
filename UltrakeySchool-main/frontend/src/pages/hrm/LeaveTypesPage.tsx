import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface LeaveType {
  _id: string;
  leaveTypeId: string;
  type: string;
  description?: string;
  maxDays?: number;
  isPaid: boolean;
  requiresApproval: boolean;
  status: 'active' | 'inactive';
}

const LeaveTypesPage: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);

  const [formData, setFormData] = useState({
    type: '',
    description: '',
    maxDays: '',
    isPaid: true,
    requiresApproval: true,
    status: 'active' as 'active' | 'inactive'
  });

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/hrm/leave-types');
      if (response.data.success) {
        setLeaveTypes(response.data.data.leaveTypes || []);
      }
    } catch (err: any) {
      console.error('Error fetching leave types:', err);
      setError(err.response?.data?.message || 'Failed to load leave types');
      toast.error('Failed to load leave types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleStatusToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      status: checked ? 'active' : 'inactive'
    }));
  };

  const handleAddLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type.trim()) {
      toast.error('Please enter leave type');
      return;
    }

    try {
      const payload: any = {
        type: formData.type,
        description: formData.description || undefined,
        maxDays: formData.maxDays ? parseInt(formData.maxDays) : undefined,
        isPaid: formData.isPaid,
        requiresApproval: formData.requiresApproval,
        status: formData.status
      };

      await apiClient.post('/hrm/leave-types', payload);
      toast.success('Leave type added successfully');
      setShowAddModal(false);
      setFormData({
        type: '',
        description: '',
        maxDays: '',
        isPaid: true,
        requiresApproval: true,
        status: 'active'
      });
      fetchLeaveTypes();
    } catch (err: any) {
      console.error('Error adding leave type:', err);
      toast.error(err.response?.data?.message || 'Failed to add leave type');
    }
  };

  const handleEditLeaveType = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setFormData({
      type: leaveType.type,
      description: leaveType.description || '',
      maxDays: leaveType.maxDays?.toString() || '',
      isPaid: leaveType.isPaid,
      requiresApproval: leaveType.requiresApproval,
      status: leaveType.status
    });
    setShowEditModal(true);
  };

  const handleUpdateLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaveType) return;

    if (!formData.type.trim()) {
      toast.error('Please enter leave type');
      return;
    }

    try {
      const payload: any = {
        type: formData.type,
        description: formData.description || undefined,
        maxDays: formData.maxDays ? parseInt(formData.maxDays) : undefined,
        isPaid: formData.isPaid,
        requiresApproval: formData.requiresApproval,
        status: formData.status
      };

      await apiClient.put(`/hrm/leave-types/${selectedLeaveType._id}`, payload);
      toast.success('Leave type updated successfully');
      setShowEditModal(false);
      setSelectedLeaveType(null);
      setFormData({
        type: '',
        description: '',
        maxDays: '',
        isPaid: true,
        requiresApproval: true,
        status: 'active'
      });
      fetchLeaveTypes();
    } catch (err: any) {
      console.error('Error updating leave type:', err);
      toast.error(err.response?.data?.message || 'Failed to update leave type');
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedLeaveTypes.length > 0) {
        await Promise.all(
          selectedLeaveTypes.map(id => apiClient.delete(`/hrm/leave-types/${id}`))
        );
        toast.success(`${selectedLeaveTypes.length} leave type(s) deleted successfully`);
        setSelectedLeaveTypes([]);
        setSelectAll(false);
      } else if (selectedLeaveType) {
        await apiClient.delete(`/hrm/leave-types/${selectedLeaveType._id}`);
        toast.success('Leave type deleted successfully');
        setSelectedLeaveType(null);
      }
      setShowDeleteModal(false);
      fetchLeaveTypes();
    } catch (err: any) {
      console.error('Error deleting leave type:', err);
      toast.error(err.response?.data?.message || 'Failed to delete leave type');
    }
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedLeaveTypes(leaveTypes.map(lt => lt._id));
    } else {
      setSelectedLeaveTypes([]);
    }
  };

  const toggleLeaveTypeSelection = (id: string) => {
    if (selectedLeaveTypes.includes(id)) {
      setSelectedLeaveTypes(selectedLeaveTypes.filter(ltId => ltId !== id));
    } else {
      setSelectedLeaveTypes([...selectedLeaveTypes, id]);
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Leave Types</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/hrm">HRM</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Leave Types</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchLeaveTypes}
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
              <i className="ti ti-square-rounded-plus me-2"></i>Add Leave Type
            </button>
          </div>
        </div>
      </div>
      {/* /Page Header */}

      {/* Filter Section */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Leave List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar"></i>
              </span>
              <input type="text" className="form-control date-range bookingrange" placeholder="Select"
                value="Academic Year : 2024 / 2025" readOnly />
            </div>
            <div className="dropdown mb-3 me-2">
              <a href="javascript:void(0);" className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown" data-bs-auto-close="outside">
                <i className="ti ti-filter me-2"></i>Filter
              </a>
              <div className="dropdown-menu drop-width">
                <form>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Leave Type</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>Medical Leave</option>
                            <option>Casual Leave</option>
                            <option>Maternity Leave</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-0">
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
                    <a href="javascript:void(0);" className="btn btn-light me-3">Reset</a>
                    <button type="submit" className="btn btn-primary">Apply</button>
                  </div>
                </form>
              </div>
            </div>
            <div className="dropdown mb-3">
              <a href="javascript:void(0);" className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown">
                <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
              </a>
              <ul className="dropdown-menu p-3">
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1 active">
                    Ascending
                  </a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">
                    Descending
                  </a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">
                    Recently Viewed
                  </a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">
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
              <p className="mt-2 text-muted">Loading leave types...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="alert alert-danger m-3" role="alert">
              <i className="ti ti-alert-circle me-2"></i>
              {error}
              <button
                className="btn btn-sm btn-outline-danger ms-3"
                onClick={fetchLeaveTypes}
              >
                <i className="ti ti-refresh me-1"></i>Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && leaveTypes.length === 0 && (
            <div className="text-center py-5">
              <i className="ti ti-file-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No leave types found</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddModal(true)}
              >
                <i className="ti ti-plus me-1"></i>Add First Leave Type
              </button>
            </div>
          )}

          {/* Leaves List */}
          {!loading && !error && leaveTypes.length > 0 && (
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
                        checked={selectAll}
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </th>
                  <th>ID</th>
                  <th>Leave Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaveTypes.map((leaveType) => (
                  <tr key={leaveType._id}>
                    <td>
                      <div className="form-check form-check-md">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={selectedLeaveTypes.includes(leaveType._id)}
                          onChange={() => toggleLeaveTypeSelection(leaveType._id)}
                        />
                      </div>
                    </td>
                    <td><a href="#!" className="link-primary" onClick={(e) => e.preventDefault()}>{leaveType.leaveTypeId}</a></td>
                    <td>{leaveType.type}</td>
                    <td>
                      <span className={`badge badge-soft-${leaveType.status === 'active' ? 'success' : 'danger'} d-inline-flex align-items-center`}>
                        <i className="ti ti-circle-filled fs-5 me-1"></i>
                        {leaveType.status.charAt(0).toUpperCase() + leaveType.status.slice(1)}
                      </span>
                    </td>
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
                                onClick={() => handleEditLeaveType(leaveType)}
                              >
                                <i className="ti ti-edit-circle me-2"></i>Edit
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item rounded-1 text-danger"
                                onClick={() => {
                                  setSelectedLeaveType(leaveType);
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
          {/* /Leaves List */}
        </div>
      </div>

      {/* Add Leave Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Leave Type</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddLeaveType}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Leave Type <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          placeholder="Enter Leave Type"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Enter Description"
                          rows={3}
                        ></textarea>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Max Days</label>
                        <input
                          type="number"
                          className="form-control"
                          name="maxDays"
                          value={formData.maxDays}
                          onChange={handleInputChange}
                          placeholder="Enter Max Days"
                          min="0"
                        />
                      </div>
                      <div className="mb-3 form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isPaid"
                          checked={formData.isPaid}
                          onChange={(e) => handleCheckboxChange('isPaid', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="isPaid">
                          Is Paid Leave
                        </label>
                      </div>
                      <div className="mb-3 form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="requiresApproval"
                          checked={formData.requiresApproval}
                          onChange={(e) => handleCheckboxChange('requiresApproval', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="requiresApproval">
                          Requires Approval
                        </label>
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
                            onChange={(e) => handleStatusToggle(e.target.checked)}
                          />
                        </div>
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
                  <button type="submit" className="btn btn-primary">Add Leave Type</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Leave Modal */}
      {showEditModal && selectedLeaveType && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Leave Type</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleUpdateLeaveType}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Leave Type <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          placeholder="Enter Leave Type"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Enter Description"
                          rows={3}
                        ></textarea>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Max Days</label>
                        <input
                          type="number"
                          className="form-control"
                          name="maxDays"
                          value={formData.maxDays}
                          onChange={handleInputChange}
                          placeholder="Enter Max Days"
                          min="0"
                        />
                      </div>
                      <div className="mb-3 form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="editIsPaid"
                          checked={formData.isPaid}
                          onChange={(e) => handleCheckboxChange('isPaid', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="editIsPaid">
                          Is Paid Leave
                        </label>
                      </div>
                      <div className="mb-3 form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="editRequiresApproval"
                          checked={formData.requiresApproval}
                          onChange={(e) => handleCheckboxChange('requiresApproval', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="editRequiresApproval">
                          Requires Approval
                        </label>
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
                            onChange={(e) => handleStatusToggle(e.target.checked)}
                          />
                        </div>
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </span>
                <h4>Confirm Deletion</h4>
                <p>
                  {selectedLeaveTypes.length > 0
                    ? `You want to delete ${selectedLeaveTypes.length} selected leave type(s). This can't be undone once you delete.`
                    : 'Are you sure you want to delete this leave type? This action cannot be undone.'}
                </p>
                <div className="d-flex justify-content-center">
                  <button
                    className="btn btn-light me-3"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDelete}
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

export default LeaveTypesPage;