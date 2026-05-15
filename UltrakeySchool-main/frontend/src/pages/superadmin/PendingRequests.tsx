import React, { useState, useEffect } from 'react';
import { institutionRegistrationService } from '../../services';

interface AccountRequest {
  _id: string;
  instituteType: string;
  instituteCode: string;
  fullName: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

const PendingRequests: React.FC = () => {
  console.log('PendingRequests component mounted!');
  
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<AccountRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      console.log('Fetching account requests...');
      const data = await institutionRegistrationService.getPendingRegistrations({
        status: filter === 'all' ? undefined : filter
      }) as any;
      console.log('Received data:', data);
      setRequests(data.data?.requests || []);
      console.log('Set requests to:', data.data?.requests || []);
    } catch (err: any) {
      console.error('Error fetching requests:', err.message);
      setError('Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      await institutionRegistrationService.approveRegistration(selectedRequest._id, {
        institutionId: 'INST-' + Date.now(),
        ownerEmail: selectedRequest.email,
        ownerPassword: 'DefaultPassword123!',
        notes: adminNotes,
        sendCredentials: true
      });
      setShowApproveModal(false);
      setAdminNotes('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;

    try {
      setActionLoading(true);
      await institutionRegistrationService.rejectRegistration(selectedRequest._id, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(request =>
    request.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.instituteCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.instituteType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', icon: 'ti-clock', text: 'Pending' },
      approved: { color: 'success', icon: 'ti-check', text: 'Approved' },
      rejected: { color: 'danger', icon: 'ti-x', text: 'Rejected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`badge bg-${config.color} bg-opacity-10 text-${config.color}`}>
        <i className={`ti ${config.icon} me-1`}></i>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title">Account Requests</h4>
          <p className="text-muted mb-0">Manage institute account creation requests</p>
        </div>
        <button className="btn btn-outline-primary" onClick={fetchRequests}>
          <i className="ti ti-refresh me-2"></i>
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="ti ti-alert-circle me-2"></i>
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="btn-group" role="group">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                  <button
                    key={status}
                    type="button"
                    className={`btn ${filter === status ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setFilter(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="ti ti-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email, institute code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="card">
        <div className="card-body">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-inbox text-muted" style={{ fontSize: '48px' }}></i>
              <h5 className="text-muted mt-3">No requests found</h5>
              <p className="text-muted">
                {filter === 'all' ? 'No account requests have been submitted yet.' : `No ${filter} requests found.`}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Institute Details</th>
                    <th>Contact Person</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(request => (
                    <tr key={request._id}>
                      <td>
                        <div>
                          <strong>{request.instituteType}</strong>
                          <div className="text-muted small">Code: {request.instituteCode}</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{request.fullName}</strong>
                          <div className="text-muted small">{request.email}</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          {new Date(request.submittedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                          <div className="text-muted small">
                            {new Date(request.submittedAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </td>
                      <td>{getStatusBadge(request.status)}</td>
                      <td>
                        {request.status === 'pending' && (
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowApproveModal(true);
                              }}
                            >
                              <i className="ti ti-check me-1"></i>
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectModal(true);
                              }}
                            >
                              <i className="ti ti-x me-1"></i>
                              Reject
                            </button>
                          </div>
                        )}
                        {request.status === 'approved' && (
                          <button className="btn btn-sm btn-outline-primary">
                            <i className="ti ti-eye me-1"></i>
                            View Details
                          </button>
                        )}
                        {request.status === 'rejected' && (
                          <button className="btn btn-sm btn-outline-secondary">
                            <i className="ti ti-eye me-1"></i>
                            View Reason
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Approve Account Request</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowApproveModal(false);
                    setAdminNotes('');
                    setSelectedRequest(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <h6>Request Details:</h6>
                  <p className="mb-1"><strong>Institute:</strong> {selectedRequest.instituteType}</p>
                  <p className="mb-1"><strong>Code:</strong> {selectedRequest.instituteCode}</p>
                  <p className="mb-1"><strong>Name:</strong> {selectedRequest.fullName}</p>
                  <p className="mb-0"><strong>Email:</strong> {selectedRequest.email}</p>
                </div>
                <div className="mb-3">
                  <label htmlFor="adminNotes" className="form-label">Admin Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    id="adminNotes"
                    rows={3}
                    placeholder="Add any notes for the approved institution..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowApproveModal(false);
                    setAdminNotes('');
                    setSelectedRequest(null);
                  }}
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
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Approving...
                    </>
                  ) : (
                    'Approve Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Account Request</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setSelectedRequest(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <h6>Request Details:</h6>
                  <p className="mb-1"><strong>Institute:</strong> {selectedRequest.instituteType}</p>
                  <p className="mb-1"><strong>Code:</strong> {selectedRequest.instituteCode}</p>
                  <p className="mb-1"><strong>Name:</strong> {selectedRequest.fullName}</p>
                  <p className="mb-0"><strong>Email:</strong> {selectedRequest.email}</p>
                </div>
                <div className="mb-3">
                  <label htmlFor="rejectionReason" className="form-label">Rejection Reason *</label>
                  <textarea
                    className="form-control"
                    id="rejectionReason"
                    rows={3}
                    placeholder="Please provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setSelectedRequest(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Rejecting...
                    </>
                  ) : (
                    'Reject Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingRequests;
