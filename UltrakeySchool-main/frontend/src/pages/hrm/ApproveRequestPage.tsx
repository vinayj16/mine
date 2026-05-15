import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface LeaveRequest {
  _id: string;
  leaveId: string;
  staffId: string;
  staffName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled';
  appliedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  comments?: string;
}

const ApproveRequestPage: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch leave requests on mount
  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/hrm/leaves');
      setLeaveRequests(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching leave requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const updateLeaveStatus = async (leaveId: string, status: 'approved' | 'pending' | 'rejected', note?: string) => {
    try {
      setSubmitting(true);
      
      if (status === 'approved') {
        await apiClient.post(`/hrm/leaves/${leaveId}/approve`, {
          approvedBy: 'Current User' // Replace with actual user from auth context
        });
      } else if (status === 'rejected') {
        await apiClient.post(`/hrm/leaves/${leaveId}/reject`, {
          approvedBy: 'Current User', // Replace with actual user from auth context
          comments: note || 'Rejected'
        });
      }

      // Refresh the list after update
      await fetchLeaveRequests();
      return true;
    } catch (err: any) {
      console.error('Error updating leave status:', err);
      setError(err.response?.data?.message || 'Failed to update leave status');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedRequests(leaveRequests.map(req => req._id));
    } else {
      setSelectedRequests([]);
    }
  };

  const toggleRequestSelection = (id: string) => {
    if (selectedRequests.includes(id)) {
      setSelectedRequests(selectedRequests.filter(reqId => reqId !== id));
    } else {
      setSelectedRequests([...selectedRequests, id]);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      approved: 'success',
      pending: 'warning',
      rejected: 'danger',
      cancelled: 'secondary'
    };
    
    return `badge-soft-${statusClasses[status as keyof typeof statusClasses] || 'secondary'}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatLeaveType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1) + ' Leave';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Approved Leave Request</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <a href="javascript:void(0);">HRM</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Approved Leave Request</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              onClick={fetchLeaveRequests}
              className="btn btn-outline-light bg-white btn-icon me-1" 
              data-bs-toggle="tooltip" 
              data-bs-placement="top" 
              aria-label="Refresh" 
              data-bs-original-title="Refresh"
              disabled={loading}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button type="button" className="btn btn-outline-light bg-white btn-icon me-1"
              data-bs-toggle="tooltip" data-bs-placement="top" aria-label="Print"
              data-bs-original-title="Print">
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <a href="javascript:void(0);"
              className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center"
              data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2"></i>Export
            </a>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <a href="javascript:void(0);" className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </a>
              </li>
              <li>
                <a href="javascript:void(0);" className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {/* /Page Header */}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Filter Section */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Approved Leave Request List</h4>
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
                      <div className="col-md-6">
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
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Role</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>Student</option>
                            <option>Teacher</option>
                            <option>Admin</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-0">
                          <label className="form-label">From - To Date</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>05 May 2024 - 07 May 2024</option>
                            <option>07 May 2024 - 07 May 2024</option>
                            <option>08 May 2024 - 19 May 2024</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-0">
                          <label className="form-label">Status</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>Approved</option>
                            <option>Pending</option>
                            <option>Rejected</option>
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
          {/* Approve List */}
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
                  <th>Submitted By</th>
                  <th>Leave Type</th>
                  <th>Role</th>
                  <th>Leave Date</th>
                  <th>No of Days</th>
                  <th>Applied On</th>
                  <th>Authority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4">
                      <p className="text-muted mb-0">No leave requests found</p>
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((request) => (
                    <tr key={request._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            checked={selectedRequests.includes(request._id)}
                            onChange={() => toggleRequestSelection(request._id)}
                          />
                        </div>
                      </td>
                      <td>{request.staffName} ({request.staffId})</td>
                      <td>{formatLeaveType(request.leaveType)}</td>
                      <td>Staff</td>
                      <td>{formatDate(request.startDate)} - {formatDate(request.endDate)}</td>
                      <td>{request.days}</td>
                      <td>{formatDate(request.appliedOn)}</td>
                      <td>{request.approvedBy || '-'}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(request.status)} d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="dropdown">
                            <a href="#leave_request"
                              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                              data-bs-toggle="modal" data-bs-target={`#leave_request_${request._id}`}>
                              <i className="ti ti-dots-vertical fs-14"></i>
                            </a>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* /Approve List */}
        </div>
      </div>

      {/* Leave Request Modals */}
      {leaveRequests.map((request) => (
        <div key={`modal_${request._id}`} className="modal fade" id={`leave_request_${request._id}`}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Leave Request</h4>
                <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal"
                  aria-label="Close">
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const status = formData.get(`status_${request.leaveId}`) as 'approved' | 'pending' | 'rejected';
                const note = formData.get('note') as string;
                
                const success = await updateLeaveStatus(request.leaveId, status, note);
                if (success) {
                  // Close modal
                  const modal = document.getElementById(`leave_request_${request._id}`);
                  const backdrop = document.querySelector('.modal-backdrop');
                  if (modal) modal.classList.remove('show');
                  if (backdrop) backdrop.remove();
                  document.body.classList.remove('modal-open');
                  document.body.style.removeProperty('overflow');
                  document.body.style.removeProperty('padding-right');
                }
              }}>
                <div className="modal-body">
                  <div className="student-leave-info">
                    <ul>
                      <li>
                        <span>Submitted By</span>
                        <h6>{request.staffName}</h6>
                      </li>
                      <li>
                        <span>Staff ID</span>
                        <h6>{request.staffId}</h6>
                      </li>
                      <li>
                        <span>Role</span>
                        <h6>Staff</h6>
                      </li>
                      <li>
                        <span>Leave Type</span>
                        <h6>{formatLeaveType(request.leaveType)}</h6>
                      </li>
                      <li>
                        <span>No of Days</span>
                        <h6>{request.days}</h6>
                      </li>
                      <li>
                        <span>Applied On</span>
                        <h6>{formatDate(request.appliedOn)}</h6>
                      </li>
                      <li>
                        <span>Authority</span>
                        <h6>{request.approvedBy || 'Pending'}</h6>
                      </li>
                      <li>
                        <span>Leave</span>
                        <h6>{formatDate(request.startDate)} - {formatDate(request.endDate)}</h6>
                      </li>
                    </ul>
                  </div>
                  <div className="mb-3 leave-reason">
                    <h6 className="mb-1">Reason</h6>
                    <span>{request.reason}</span>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Approval Status</label>
                    <div className="d-flex align-items-center check-radio-group">
                      <label className="custom-radio">
                        <input 
                          type="radio" 
                          name={`status_${request.leaveId}`} 
                          value="pending"
                          defaultChecked={request.status === 'pending'}
                        />
                        <span className="checkmark"></span>
                        Pending
                      </label>
                      <label className="custom-radio">
                        <input 
                          type="radio" 
                          name={`status_${request.leaveId}`} 
                          value="approved"
                          defaultChecked={request.status === 'approved'}
                        />
                        <span className="checkmark"></span>
                        Approved
                      </label>
                      <label className="custom-radio">
                        <input 
                          type="radio" 
                          name={`status_${request.leaveId}`} 
                          value="rejected"
                          defaultChecked={request.status === 'rejected'}
                        />
                        <span className="checkmark"></span>
                        Disapproved
                      </label>
                    </div>
                  </div>
                  <div className="mb-0">
                    <label className="form-label">Note</label>
                    <textarea 
                      name="note" 
                      className="form-control" 
                      placeholder="Add Comment" 
                      rows={4}
                      defaultValue={request.comments || ''}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <a href="javascript:void(0);" className="btn btn-light me-2" data-bs-dismiss="modal">Cancel</a>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ))}

      {/* Delete Modal */}
      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form>
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </span>
                <h4>Confirm Deletion</h4>
                <p>You want to delete all the marked items, this can't be undone once you delete.</p>
                <div className="d-flex justify-content-center">
                  <a href="javascript:void(0);" className="btn btn-light me-3"
                    data-bs-dismiss="modal">Cancel</a>
                  <button type="submit" className="btn btn-danger">Yes, Delete</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApproveRequestPage;