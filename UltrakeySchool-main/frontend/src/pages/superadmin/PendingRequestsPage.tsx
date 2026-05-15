import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';

interface AccountRequest {
  _id: string;
  fullName: string;
  email: string;
  instituteCode: string;
  instituteType: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

const PendingRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get<any>('/admin/account-requests');
      const data = response?.data?.requests || response?.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await apiService.patch(`/admin/account-requests/${id}/approve`, {});
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'approved' } : r));
    } catch (err: any) {
      alert(err?.message || 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Reject this request?')) return;
    try {
      setActionLoading(id);
      await apiService.patch(`/admin/account-requests/${id}/reject`, {});
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'rejected' } : r));
    } catch (err: any) {
      alert(err?.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { pending: 'bg-warning', approved: 'bg-success', rejected: 'bg-danger' };
    return <span className={`badge ${map[status] || 'bg-secondary'}`}>{status}</span>;
  };

  return (
    <div className="container-fluid">
      <div className="d-md-flex d-block align-items-center justify-content-between mb-4">
        <div>
          <h3 className="page-title mb-1">Pending Requests</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/super-admin/dashboard">Dashboard</Link></li>
              <li className="breadcrumb-item active">Pending Requests</li>
            </ol>
          </nav>
        </div>
        <button className="btn btn-outline-secondary" onClick={fetchRequests}>
          <i className="ti ti-refresh me-1"></i>Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: 'Total', count: requests.length, color: 'primary', icon: 'ti-list' },
          { label: 'Pending', count: pending.length, color: 'warning', icon: 'ti-clock' },
          { label: 'Approved', count: requests.filter(r => r.status === 'approved').length, color: 'success', icon: 'ti-check' },
          { label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length, color: 'danger', icon: 'ti-x' },
        ].map(s => (
          <div className="col-md-3 col-6" key={s.label}>
            <div className={`card bg-${s.color}`}>
              <div className="card-body d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{s.count}</h4>
                  <p className="text-white mb-0">{s.label}</p>
                </div>
                <i className={`ti ${s.icon} text-white fs-2`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending table */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Pending Requests ({pending.length})</h4>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : error ? (
            <div className="text-center py-5 text-danger"><i className="ti ti-alert-circle me-2"></i>{error}</div>
          ) : pending.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-check-circle ti-4x text-success mb-3 d-block" style={{ fontSize: '3rem' }}></i>
              <h5>No pending requests</h5>
              <p className="text-muted">All registration requests have been processed.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Institute Code</th>
                    <th>Type</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(req => (
                    <tr key={req._id}>
                      <td className="fw-medium">{req.fullName}</td>
                      <td>{req.email}</td>
                      <td><code>{req.instituteCode}</code></td>
                      <td>{req.instituteType}</td>
                      <td>{new Date(req.submittedAt).toLocaleDateString()}</td>
                      <td>{statusBadge(req.status)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-success me-1"
                          onClick={() => handleApprove(req._id)}
                          disabled={actionLoading === req._id}
                        >
                          {actionLoading === req._id ? <span className="spinner-border spinner-border-sm"></span> : <><i className="ti ti-check me-1"></i>Approve</>}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleReject(req._id)}
                          disabled={actionLoading === req._id}
                        >
                          <i className="ti ti-x me-1"></i>Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Processed table */}
      {processed.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Processed Requests ({processed.length})</h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Institute Code</th>
                    <th>Type</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {processed.map(req => (
                    <tr key={req._id}>
                      <td className="fw-medium">{req.fullName}</td>
                      <td>{req.email}</td>
                      <td><code>{req.instituteCode}</code></td>
                      <td>{req.instituteType}</td>
                      <td>{new Date(req.submittedAt).toLocaleDateString()}</td>
                      <td>{statusBadge(req.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingRequestsPage;
