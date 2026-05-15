import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api.js';

interface AccountRequest {
  _id: string;
  instituteType: string;
  instituteCode: string;
  fullName: string;
  email: string;
  status: string;
  submittedAt: string;
}

const PendingRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/admin/account-requests');
      
      if (response.success) {
        const data = response.data as any;
        // Backend returns { requests: [...], pagination: {...} }
        // Ensure we always get a valid array
        let requestsArray: AccountRequest[] = [];
        
        if (Array.isArray(data)) {
          requestsArray = data;
        } else if (data && typeof data === 'object') {
          // Check nested properties that might contain the array
          if (Array.isArray(data.requests)) {
            requestsArray = data.requests;
          } else if (Array.isArray(data.data)) {
            requestsArray = data.data;
          } else if (Array.isArray(data.items)) {
            requestsArray = data.items;
          } else if (Array.isArray(data.results)) {
            requestsArray = data.results;
          }
        }
        
        setRequests(requestsArray);
        setError('');
      } else {
        setError(response.message || 'Failed to fetch pending requests');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch pending requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const response = await apiService.post('/admin/approve-request', { requestId });
      
      if (response.success) {
        // Refresh the requests list
        fetchPendingRequests();
      } else {
        setError(response.message || 'Failed to approve request');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const response = await apiService.post('/admin/reject-request', { requestId });
      
      if (response.success) {
        // Refresh the requests list
        fetchPendingRequests();
      } else {
        setError(response.message || 'Failed to reject request');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-warning">Pending</span>;
      case 'approved':
        return <span className="badge bg-success">Approved</span>;
      case 'rejected':
        return <span className="badge bg-danger">Rejected</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-md-flex d-block align-items-center justify-content-between my-4 page-header-breadcrumb">
        <h3 className="page-title">Pending Account Requests</h3>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/dashboard/main">Dashboard</Link>
            </li>
            <li className="breadcrumb-item active">Pending Requests</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Account Requests</h5>
              <p className="card-subtitle text-muted">
                Review and manage institution account requests
              </p>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                  <button 
                    type="button" 
                    className="btn-close float-end" 
                    onClick={() => setError('')}
                  ></button>
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading pending requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-4">
                  <div className="mb-3">
                    <i className="ti ti-user-check display-1 text-muted"></i>
                  </div>
                  <h5>No Pending Requests</h5>
                  <p className="text-muted">
                    There are no pending account requests at the moment.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Institution Type</th>
                        <th>Institute Code</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request._id}>
                          <td>
                            <span className="badge bg-info">
                              {request.instituteType}
                            </span>
                          </td>
                          <td>{request.instituteCode}</td>
                          <td>{request.fullName}</td>
                          <td>{request.email}</td>
                          <td>
                            {new Date(request.submittedAt).toLocaleDateString()}
                          </td>
                          <td>{getStatusBadge(request.status)}</td>
                          <td>
                            {request.status === 'pending' && (
                              <div className="btn-group" role="group">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleApprove(request._id)}
                                  title="Approve Request"
                                >
                                  <i className="ti ti-check"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleReject(request._id)}
                                  title="Reject Request"
                                >
                                  <i className="ti ti-x"></i>
                                </button>
                              </div>
                            )}
                            {request.status !== 'pending' && (
                              <span className="text-muted">No actions available</span>
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
      </div>
    </div>
  );
};

export default PendingRequestsPage;
