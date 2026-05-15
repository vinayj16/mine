import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Approval {
  _id: string;
  employee: {
    _id: string;
    name: string;
    email?: string;
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  appliedDate: string;
  documents?: Array<{
    name: string;
    url: string;
  }>;
}

const ApprovalsPage: React.FC = () => {
  // State management
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch approvals from backend
  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/hrm/approvals');
      if (response.data.success) {
        setApprovals(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching approvals:', err);
      setError(err.response?.data?.message || 'Failed to load approvals');
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchApprovals();
  }, []);

  // Handle approve leave
  const handleApprove = async () => {
    if (!selectedApproval) return;

    try {
      setActionLoading(true);
      await apiClient.post(`/hrm/approvals/${selectedApproval._id}/approve`, {
        approvedBy: 'current-user-id' // This should come from auth context
      });
      toast.success('Leave request approved successfully');
      setShowApproveModal(false);
      setSelectedApproval(null);
      fetchApprovals();
    } catch (err: any) {
      console.error('Error approving leave:', err);
      toast.error(err.response?.data?.message || 'Failed to approve leave request');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject leave
  const handleReject = async () => {
    if (!selectedApproval) return;

    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      await apiClient.post(`/hrm/approvals/${selectedApproval._id}/reject`, {
        approvedBy: 'current-user-id', // This should come from auth context
        comments: rejectionReason
      });
      toast.success('Leave request rejected');
      setShowRejectModal(false);
      setSelectedApproval(null);
      setRejectionReason('');
      fetchApprovals();
    } catch (err: any) {
      console.error('Error rejecting leave:', err);
      toast.error(err.response?.data?.message || 'Failed to reject leave request');
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get leave type badge color
  const getLeaveTypeBadge = (type: string) => {
    const badges: { [key: string]: string } = {
      annual: 'badge-soft-primary',
      sick: 'badge-soft-danger',
      maternity: 'badge-soft-success',
      paternity: 'badge-soft-info',
      emergency: 'badge-soft-warning',
      other: 'badge-soft-secondary'
    };
    return badges[type] || 'badge-soft-secondary';
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Leave Approvals</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/hrm">HRM</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Approvals
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchApprovals}
              title="Refresh"
              disabled={loading}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Approvals List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Pending Leave Approvals</h4>
        </div>

        <div className="card-body p-0 py-3">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading approvals...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="alert alert-danger m-3" role="alert">
              <i className="ti ti-alert-circle me-2"></i>
              {error}
              <button
                className="btn btn-sm btn-outline-danger ms-3"
                onClick={fetchApprovals}
              >
                <i className="ti ti-refresh me-1"></i>Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && approvals.length === 0 && (
            <div className="text-center py-5">
              <i className="ti ti-clipboard-check" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No pending approvals</p>
              <p className="text-muted">All leave requests have been processed</p>
            </div>
          )}

          {/* Data Table */}
          {!loading && !error && approvals.length > 0 && (
            <div className="custom-datatable-filter table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Duration</th>
                    <th>Applied Date</th>
                    <th>Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((approval) => (
                    <tr key={approval._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md">
                            <span className="avatar-title rounded-circle bg-primary-transparent">
                              {approval.employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ms-2">
                            <p className="mb-0 fw-medium">{approval.employee.name}</p>
                            {approval.employee.email && (
                              <span className="text-muted fs-12">{approval.employee.email}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getLeaveTypeBadge(approval.leaveType)}`}>
                          {approval.leaveType.charAt(0).toUpperCase() + approval.leaveType.slice(1)}
                        </span>
                      </td>
                      <td>{formatDate(approval.startDate)}</td>
                      <td>{formatDate(approval.endDate)}</td>
                      <td>
                        <span className="badge badge-soft-info">
                          {approval.totalDays} {approval.totalDays === 1 ? 'day' : 'days'}
                        </span>
                      </td>
                      <td>{formatDate(approval.appliedDate)}</td>
                      <td>
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }} title={approval.reason}>
                          {approval.reason}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => {
                              setSelectedApproval(approval);
                              setShowApproveModal(true);
                            }}
                          >
                            <i className="ti ti-check me-1"></i>Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              setSelectedApproval(approval);
                              setShowRejectModal(true);
                            }}
                          >
                            <i className="ti ti-x me-1"></i>Reject
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

      {/* Approve Confirmation Modal */}
      {showApproveModal && selectedApproval && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Approve Leave Request</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => setShowApproveModal(false)}
                  aria-label="Close"
                  disabled={actionLoading}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-3">
                  <span className="approve-icon">
                    <i className="ti ti-check-circle text-success" style={{ fontSize: '48px' }}></i>
                  </span>
                </div>
                <h5 className="text-center mb-3">Confirm Approval</h5>
                <p className="text-center">
                  Are you sure you want to approve the leave request for{' '}
                  <strong>{selectedApproval.employee.name}</strong>?
                </p>
                <div className="bg-light p-3 rounded">
                  <p className="mb-1">
                    <strong>Leave Type:</strong> {selectedApproval.leaveType}
                  </p>
                  <p className="mb-1">
                    <strong>Duration:</strong> {formatDate(selectedApproval.startDate)} to{' '}
                    {formatDate(selectedApproval.endDate)} ({selectedApproval.totalDays} days)
                  </p>
                  <p className="mb-0">
                    <strong>Reason:</strong> {selectedApproval.reason}
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  onClick={() => setShowApproveModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Approving...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check me-1"></i>Yes, Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApproval && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Reject Leave Request</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  aria-label="Close"
                  disabled={actionLoading}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-3">
                  <span className="reject-icon">
                    <i className="ti ti-x-circle text-danger" style={{ fontSize: '48px' }}></i>
                  </span>
                </div>
                <h5 className="text-center mb-3">Reject Leave Request</h5>
                <p className="text-center">
                  You are about to reject the leave request for{' '}
                  <strong>{selectedApproval.employee.name}</strong>
                </p>
                <div className="bg-light p-3 rounded mb-3">
                  <p className="mb-1">
                    <strong>Leave Type:</strong> {selectedApproval.leaveType}
                  </p>
                  <p className="mb-1">
                    <strong>Duration:</strong> {formatDate(selectedApproval.startDate)} to{' '}
                    {formatDate(selectedApproval.endDate)} ({selectedApproval.totalDays} days)
                  </p>
                  <p className="mb-0">
                    <strong>Reason:</strong> {selectedApproval.reason}
                  </p>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Rejection Reason <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Please provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    disabled={actionLoading}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-x me-1"></i>Reject Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApprovalsPage;
