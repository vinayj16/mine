import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface DeleteRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  reason?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
  createdAt: string;
}

const DeleteAccountPage = () => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [requests, setRequests] = useState<DeleteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/user-management/users/delete-requests');

      if (response.data.success) {
        setRequests(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching delete requests:', err);
      setError(err.response?.data?.message || 'Failed to load delete requests');
      toast.error(err.response?.data?.message || 'Failed to load delete requests');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setProcessing(true);

      if (selectedRequests.length === 1) {
        const response = await apiClient.patch(
          `/user-management/users/delete-requests/${selectedRequests[0]}/confirm`
        );
        if (response.data.success) {
          toast.success('Delete request confirmed successfully');
        }
      } else {
        // Bulk confirm
        const response = await apiClient.post(
          '/user-management/users/delete-requests/bulk-confirm',
          { ids: selectedRequests }
        );
        if (response.data.success) {
          toast.success('Delete requests confirmed successfully');
        }
      }

      setShowConfirmModal(false);
      setSelectedRequests([]);
      fetchRequests();
    } catch (err: any) {
      console.error('Error confirming request(s):', err);
      toast.error(err.response?.data?.message || 'Failed to confirm request(s)');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);

      if (selectedRequests.length === 1) {
        const response = await apiClient.patch(
          `/user-management/users/delete-requests/${selectedRequests[0]}/reject`,
          { reason: rejectionReason }
        );
        if (response.data.success) {
          toast.success('Delete request rejected successfully');
        }
      } else {
        // Bulk reject
        const response = await apiClient.post(
          '/user-management/users/delete-requests/bulk-reject',
          { ids: selectedRequests, reason: rejectionReason }
        );
        if (response.data.success) {
          toast.success('Delete requests rejected successfully');
        }
      }

      setShowRejectModal(false);
      setSelectedRequests([]);
      setRejectionReason('');
      fetchRequests();
    } catch (err: any) {
      console.error('Error rejecting request(s):', err);
      toast.error(err.response?.data?.message || 'Failed to reject request(s)');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      setProcessing(true);

      if (selectedRequests.length === 1) {
        const response = await apiClient.delete(
          `/user-management/users/delete-requests/${selectedRequests[0]}`
        );
        if (response.data.success) {
          toast.success('Request record deleted successfully');
        }
      } else {
        // Bulk delete
        await Promise.all(
          selectedRequests.map((id) =>
            apiClient.delete(`/user-management/users/delete-requests/${id}`)
          )
        );
        toast.success('Request records deleted successfully');
      }

      setShowDeleteModal(false);
      setSelectedRequests([]);
      fetchRequests();
    } catch (err: any) {
      console.error('Error deleting request(s):', err);
      toast.error(err.response?.data?.message || 'Failed to delete request(s)');
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRequests(requests.map((req) => req._id));
    } else {
      setSelectedRequests([]);
    }
  };

  const toggleSelectRequest = (id: string) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((reqId) => reqId !== id) : [...prev, id]
    );
  };

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon');
  };

  const exportToExcel = () => {
    toast.info('Excel export feature coming soon');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge-soft-warning';
      case 'confirmed':
        return 'badge-soft-success';
      case 'rejected':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  // Ensure requests is an array before filtering
  const requestsArray = Array.isArray(requests) ? requests : [];
  const pendingRequests = requestsArray.filter((r) => r.status === 'pending').length;
  const confirmedRequests = requestsArray.filter((r) => r.status === 'confirmed').length;
  const rejectedRequests = requestsArray.filter((r) => r.status === 'rejected').length;

  if (error && !loading) {
    return (
      <div>
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Delete Account Request</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/users">User Management</Link>
                </li>
                <li className="breadcrumb-item active">Delete Account Request</li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="ti ti-alert-circle" style={{ fontSize: '48px', color: '#dc3545' }}></i>
          </div>
          <h5>Error Loading Delete Requests</h5>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary" onClick={fetchRequests}>
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
          <h3 className="page-title mb-1">Delete Account Request</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/users">User Management</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Delete Account Request
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchRequests}
              disabled={loading}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button
              type="button"
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
                <button className="dropdown-item rounded-1" onClick={exportToPDF}>
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1" onClick={exportToExcel}>
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Total Requests</h6>
                  <h3 className="mb-0 text-primary">{requests.length}</h3>
                </div>
                <div className="avatar avatar-lg bg-primary-transparent rounded">
                  <i className="ti ti-file-text text-primary fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Pending</h6>
                  <h3 className="mb-0 text-warning">{pendingRequests}</h3>
                </div>
                <div className="avatar avatar-lg bg-warning-transparent rounded">
                  <i className="ti ti-clock text-warning fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Confirmed</h6>
                  <h3 className="mb-0 text-success">{confirmedRequests}</h3>
                </div>
                <div className="avatar avatar-lg bg-success-transparent rounded">
                  <i className="ti ti-circle-check text-success fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Rejected</h6>
                  <h3 className="mb-0 text-danger">{rejectedRequests}</h3>
                </div>
                <div className="avatar avatar-lg bg-danger-transparent rounded">
                  <i className="ti ti-circle-x text-danger fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Request List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Delete Account Request List</h4>
          <div className="d-flex align-items-center flex-wrap">
            {selectedRequests.length > 0 && (
              <div className="mb-3 me-2">
                <button
                  className="btn btn-success me-2"
                  onClick={() => setShowConfirmModal(true)}
                >
                  <i className="ti ti-check me-2"></i>Confirm ({selectedRequests.length})
                </button>
                <button
                  className="btn btn-warning me-2"
                  onClick={() => setShowRejectModal(true)}
                >
                  <i className="ti ti-x me-2"></i>Reject ({selectedRequests.length})
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <i className="ti ti-trash me-2"></i>Delete ({selectedRequests.length})
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card-body p-0 py-3">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="ti ti-file-text" style={{ fontSize: '48px', color: '#6c757d' }}></i>
              </div>
              <h5>No Delete Requests Found</h5>
              <p className="text-muted">There are no account deletion requests at this time</p>
            </div>
          ) : (
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
                          checked={
                            selectedRequests.length === requests.length && requests.length > 0
                          }
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Reason</th>
                    <th>Requested Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRequests.includes(request._id)}
                            onChange={() => toggleSelectRequest(request._id)}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Link to={`/user/${request.userId._id}`} className="avatar avatar-md">
                            <img
                              src={
                                request.userId.avatar || '/assets/img/students/student-01.jpg'
                              }
                              className="img-fluid rounded-circle"
                              alt={request.userId.name}
                            />
                          </Link>
                          <div className="ms-2">
                            <p className="text-dark mb-0">
                              <Link to={`/user/${request.userId._id}`}>
                                {request.userId.name}
                              </Link>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>{request.userId.email}</td>
                      <td>{request.reason || '-'}</td>
                      <td>{new Date(request.requestedAt).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={`badge ${getStatusBadge(
                            request.status
                          )} d-inline-flex align-items-center`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          {request.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-sm btn-icon btn-success me-2"
                                onClick={() => {
                                  setSelectedRequests([request._id]);
                                  setShowConfirmModal(true);
                                }}
                                title="Confirm Request"
                              >
                                <i className="ti ti-check"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-icon btn-warning me-2"
                                onClick={() => {
                                  setSelectedRequests([request._id]);
                                  setShowRejectModal(true);
                                }}
                                title="Reject Request"
                              >
                                <i className="ti ti-x"></i>
                              </button>
                            </>
                          )}
                          <button
                            className="btn btn-sm btn-icon btn-danger"
                            onClick={() => {
                              setSelectedRequests([request._id]);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Record"
                          >
                            <i className="ti ti-trash"></i>
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

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div
          className="modal show d-block"
          id="confirm-modal"
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleConfirm();
                }}
              >
                <div className="modal-body text-center">
                  <span className="avatar avatar-xl bg-success-transparent rounded-circle mb-3">
                    <i className="ti ti-check fs-36 text-success"></i>
                  </span>
                  <h4>Confirm Delete Request</h4>
                  <p>
                    You are about to confirm{' '}
                    {selectedRequests.length > 1
                      ? `${selectedRequests.length} delete requests`
                      : 'this delete request'}
                    . The user account(s) will be permanently deleted.
                  </p>
                  <div className="d-flex justify-content-center">
                    <button
                      type="button"
                      className="btn btn-light me-3"
                      onClick={() => setShowConfirmModal(false)}
                      disabled={processing}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-success" disabled={processing}>
                      {processing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Confirming...
                        </>
                      ) : (
                        'Yes, Confirm'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="modal show d-block"
          id="reject-modal"
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Reject Delete Request</h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleReject();
                }}
              >
                <div className="modal-body">
                  <p>
                    You are about to reject{' '}
                    {selectedRequests.length > 1
                      ? `${selectedRequests.length} delete requests`
                      : 'this delete request'}
                    . Please provide a reason:
                  </p>
                  <div className="mb-3">
                    <label className="form-label">
                      Rejection Reason <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                    }}
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-warning" disabled={processing}>
                    {processing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Rejecting...
                      </>
                    ) : (
                      'Reject Request'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="modal show d-block"
          id="delete-modal"
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
              >
                <div className="modal-body text-center">
                  <span className="delete-icon">
                    <i className="ti ti-trash-x"></i>
                  </span>
                  <h4>Confirm Deletion</h4>
                  <p>
                    You want to delete{' '}
                    {selectedRequests.length > 1
                      ? 'all the marked request records'
                      : 'this request record'}
                    , this can't be undone once you delete.
                  </p>
                  <div className="d-flex justify-content-center">
                    <button
                      type="button"
                      className="btn btn-light me-3"
                      onClick={() => setShowDeleteModal(false)}
                      disabled={processing}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-danger" disabled={processing}>
                      {processing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Deleting...
                        </>
                      ) : (
                        'Yes, Delete'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showConfirmModal || showRejectModal || showDeleteModal) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  );
};

export default DeleteAccountPage;
