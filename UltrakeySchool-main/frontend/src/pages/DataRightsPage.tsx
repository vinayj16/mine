import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../api/client';

interface DataExportRequest {
  _id: string;
  userId: string;
  format: 'json' | 'csv' | 'pdf';
  status: 'pending' | 'reviewing' | 'completed' | 'failed';
  fileUrl?: string;
  createdAt: string;
  completedAt?: string;
}

interface DataErasureRequest {
  _id: string;
  userId: string;
  reason: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  scheduledDeletionDate?: string;
  completedAt?: string;
}

interface AuditLog {
  _id: string;
  userId: string;
  action: string;
  details: any;
  ipAddress: string;
  createdAt: string;
}

const DataRightsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([]);
  const [erasureRequests, setErasureRequests] = useState<DataErasureRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Form states
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [erasureReason, setErasureReason] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    fetchDataRequests();
    fetchAuditLogs();
  }, []);

  const fetchDataRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch export requests
      const exportResponse = await apiClient.get('/data-rights/export-requests');
      if (exportResponse.data.success) {
        setExportRequests(exportResponse.data.data || []);
      }

      // Fetch erasure requests
      const erasureResponse = await apiClient.get('/data-rights/erasure-requests');
      if (erasureResponse.data.success) {
        setErasureRequests(erasureResponse.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching data requests:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch data requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await apiClient.get('/data-rights/audit-logs', {
        params: { limit: 20 }
      });
      if (response.data.success) {
        setAuditLogs(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/data-rights/export', {
        format: exportFormat
      });

      if (response.data.success) {
        toast.success('Data export request created successfully. Check your email for verification.');
        fetchDataRequests();
        // Close modal
        const modal = document.getElementById('exportModal');
        if (modal) {
          const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
          bootstrapModal?.hide();
        }
      }
    } catch (err: any) {
      console.error('Error creating export request:', err);
      toast.error(err.response?.data?.message || 'Failed to create export request');
    } finally {
      setLoading(false);
    }
  };

  const handleEraseData = async () => {
    if (!erasureReason.trim() || erasureReason.length < 10) {
      toast.error('Please provide a reason (minimum 10 characters)');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/data-rights/erasure', {
        reason: erasureReason
      });

      if (response.data.success) {
        toast.success('Data erasure request created successfully. Check your email for verification.');
        setErasureReason('');
        fetchDataRequests();
        // Close modal
        const modal = document.getElementById('erasureModal');
        if (modal) {
          const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
          bootstrapModal?.hide();
        }
      }
    } catch (err: any) {
      console.error('Error creating erasure request:', err);
      toast.error(err.response?.data?.message || 'Failed to create erasure request');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRequest = async () => {
    if (!verificationToken.trim()) {
      toast.error('Please enter verification token');
      return;
    }

    if (!selectedRequestId) {
      toast.error('No request selected');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post(`/data-rights/verify/${selectedRequestId}`, {
        verificationToken
      });

      if (response.data.success) {
        toast.success('Request verified successfully');
        setVerificationToken('');
        setSelectedRequestId(null);
        fetchDataRequests();
        // Close modal
        const modal = document.getElementById('verificationModal');
        if (modal) {
          const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
          bootstrapModal?.hide();
        }
      }
    } catch (err: any) {
      console.error('Error verifying request:', err);
      toast.error(err.response?.data?.message || 'Failed to verify request');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExport = async (fileUrl: string) => {
    try {
      setLoading(true);
      
      // Direct download using the file URL
      const link = document.createElement('a');
      link.href = `/api/data-rights/download/${encodeURIComponent(fileUrl)}`;
      link.download = `my-data-export-${new Date().toISOString()}.${exportFormat}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Download started');
    } catch (err: any) {
      console.error('Error downloading file:', err);
      toast.error('Failed to download file');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'badge-soft-success';
      case 'pending':
        return 'badge-soft-warning';
      case 'reviewing':
        return 'badge-soft-info';
      case 'failed':
      case 'rejected':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Data Subject Rights</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/settings">Settings</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Data Rights
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row">
        {/* Data Export Section */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="mb-0">Data Export</h4>
              <button
                className="btn btn-primary btn-sm"
                data-bs-toggle="modal"
                data-bs-target="#exportModal"
              >
                <i className="ti ti-download me-2"></i>
                Export My Data
              </button>
            </div>
            <div className="card-body">
              {loading && exportRequests.length === 0 ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : exportRequests.length === 0 ? (
                <div className="text-center py-4">
                  <i className="ti ti-file-download fs-1 text-muted mb-3"></i>
                  <p className="text-muted">No export requests yet. Click "Export My Data" to start.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="thead-light">
                      <tr>
                        <th>Status</th>
                        <th>Format</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportRequests.map((request) => (
                        <tr key={request._id}>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                              {request.status}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-soft-primary">
                              {request.format.toUpperCase()}
                            </span>
                          </td>
                          <td>{formatDateTime(request.createdAt)}</td>
                          <td>
                            {request.status === 'completed' && request.fileUrl ? (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleDownloadExport(request.fileUrl!)}
                                title="Download exported data"
                              >
                                <i className="ti ti-download"></i>
                              </button>
                            ) : request.status === 'pending' ? (
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => {
                                  setSelectedRequestId(request._id);
                                }}
                                data-bs-toggle="modal"
                                data-bs-target="#verificationModal"
                                title="Verify request"
                              >
                                <i className="ti ti-eye"></i>
                              </button>
                            ) : (
                              <span className="text-muted">-</span>
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
        </div>

        {/* Data Erasure Section */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="mb-0">Data Erasure</h4>
              <button
                className="btn btn-danger btn-sm"
                data-bs-toggle="modal"
                data-bs-target="#erasureModal"
              >
                <i className="ti ti-trash me-2"></i>
                Request Data Erasure
              </button>
            </div>
            <div className="card-body">
              {loading && erasureRequests.length === 0 ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : erasureRequests.length === 0 ? (
                <div className="text-center py-4">
                  <i className="ti ti-trash-off fs-1 text-muted mb-3"></i>
                  <p className="text-muted">No erasure requests yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="thead-light">
                      <tr>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {erasureRequests.map((request) => (
                        <tr key={request._id}>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                              {request.status}
                            </span>
                          </td>
                          <td>
                            <span title={request.reason} className="text-truncate d-inline-block" style={{ maxWidth: '150px' }}>
                              {request.reason}
                            </span>
                          </td>
                          <td>{formatDateTime(request.createdAt)}</td>
                          <td>
                            {request.status === 'pending' ? (
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => {
                                  setSelectedRequestId(request._id);
                                }}
                                data-bs-toggle="modal"
                                data-bs-target="#verificationModal"
                                title="Verify request"
                              >
                                <i className="ti ti-eye"></i>
                              </button>
                            ) : (
                              <span className="text-muted">-</span>
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
        </div>

        {/* Audit Logs Section */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">Activity Log</h4>
            </div>
            <div className="card-body">
              {auditLogs.length === 0 ? (
                <div className="text-center py-4">
                  <i className="ti ti-file-text-off fs-1 text-muted mb-3"></i>
                  <p className="text-muted">No activity logged yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="thead-light">
                      <tr>
                        <th>Action</th>
                        <th>Details</th>
                        <th>IP Address</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log._id}>
                          <td>
                            <span className="badge badge-soft-info">
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>
                            <span className="text-muted small">
                              {JSON.stringify(log.details).slice(0, 100)}...
                            </span>
                          </td>
                          <td>
                            <code className="small">{log.ipAddress}</code>
                          </td>
                          <td>{formatDateTime(log.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <div className="modal fade" id="exportModal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Export My Data</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <p className="mb-3">
                Select the format for your data export. You will receive a verification email to complete the process.
              </p>
              <div className="mb-3">
                <label className="form-label">Export Format</label>
                <select
                  className="form-select"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv' | 'pdf')}
                >
                  <option value="json">JSON (Recommended)</option>
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExportData}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating...
                  </>
                ) : (
                  'Create Export Request'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Erasure Modal */}
      <div className="modal fade" id="erasureModal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Request Data Erasure</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                <i className="ti ti-alert-triangle me-2"></i>
                <strong>Warning:</strong> This action will permanently delete your personal data. 
                You have a 30-day grace period to cancel this request.
              </div>
              <div className="mb-3">
                <label className="form-label">Reason for erasure *</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={erasureReason}
                  onChange={(e) => setErasureReason(e.target.value)}
                  placeholder="Please explain why you want your data erased..."
                />
                <small className="text-muted">Minimum 10 characters required</small>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleEraseData}
                disabled={loading || erasureReason.length < 10}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating...
                  </>
                ) : (
                  'Request Erasure'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      <div className="modal fade" id="verificationModal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Verify Request</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <p className="mb-3">
                Please enter the verification token sent to your email to verify this request.
              </p>
              <div className="mb-3">
                <label className="form-label">Verification Token</label>
                <input
                  type="text"
                  className="form-control"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  placeholder="Enter verification token..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleVerifyRequest}
                disabled={loading || !verificationToken.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DataRightsPage;
