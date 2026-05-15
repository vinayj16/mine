import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PendingRequestData {
  overview: {
    totalRequests: number;
    pendingReview: number;
    approvedToday: number;
    rejectedToday: number;
  };
  requests: {
    id: string;
    name: string;
    email: string;
    requestedRole: string;
    department: string;
    requestedOn: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedOn?: string;
    comments?: string;
  }[];
  requestsByRole: {
    role: string;
    count: number;
  }[];
  dailyRequests: {
    date: string;
    requests: number;
    approved: number;
    rejected: number;
  }[];
}

const AdminPendingRequestsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState<PendingRequestData | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchRequestData();
  }, []);

  const fetchRequestData = async () => {
    try {
      setLoading(true);
      // Set empty data for now
      setRequestData({
        overview: {
          totalRequests: 0,
          pendingReview: 0,
          approvedToday: 0,
          rejectedToday: 0
        },
        requests: [],
        requestsByRole: [
          { role: 'Student', count: 0 },
          { role: 'Teacher', count: 0 },
          { role: 'Parent', count: 0 },
          { role: 'Staff', count: 0 }
        ],
        dailyRequests: [
          { date: 'Mon', requests: 0, approved: 0, rejected: 0 },
          { date: 'Tue', requests: 0, approved: 0, rejected: 0 },
          { date: 'Wed', requests: 0, approved: 0, rejected: 0 },
          { date: 'Thu', requests: 0, approved: 0, rejected: 0 },
          { date: 'Fri', requests: 0, approved: 0, rejected: 0 }
        ]
      });
    } catch (error) {
      console.error('Error fetching request data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (requestId: string) => {
    // Handle approval logic
    console.log('Approving request:', requestId);
    // In a real app, this would call an API
  };

  const handleReject = (requestId: string) => {
    // Handle rejection logic
    console.log('Rejecting request:', requestId);
    // In a real app, this would call an API
  };

  const filteredRequests = requestData?.requests.filter(request => {
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
    const matchesSearch = request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  const statusData = requestData ? [
    { name: 'Pending', value: requestData.overview.pendingReview, color: '#f59e0b' },
    { name: 'Approved Today', value: requestData.overview.approvedToday, color: '#10b981' },
    { name: 'Rejected Today', value: requestData.overview.rejectedToday, color: '#ef4444' }
  ] : [];

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
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Pending Requests</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">User Management</li>
              <li className="breadcrumb-item active">Pending Requests</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchRequestData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-success">
            <i className="ti ti-check me-2"></i>Approve Selected
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{requestData?.overview.totalRequests}</h4>
                  <p className="mb-0">Total Requests</p>
                  <small>All time</small>
                </div>
                <i className="ti ti-users fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{requestData?.overview.pendingReview}</h4>
                  <p className="mb-0">Pending Review</p>
                  <small>Awaiting action</small>
                </div>
                <i className="ti ti-clock fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{requestData?.overview.approvedToday}</h4>
                  <p className="mb-0">Approved Today</p>
                  <small>Processed today</small>
                </div>
                <i className="ti ti-check fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{requestData?.overview.rejectedToday}</h4>
                  <p className="mb-0">Rejected Today</p>
                  <small>Processed today</small>
                </div>
                <i className="ti ti-x fs-24"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Request Status</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Requests by Role</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={requestData?.requestsByRole || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Access Requests</h5>
          <div className="d-flex gap-2">
            <input 
              type="text" 
              className="form-control form-control-sm" 
              placeholder="Search requests..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="form-select form-select-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="btn btn-primary btn-sm">
              <i className="ti ti-filter me-1"></i>Filter
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" className="form-check-input" />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Requested Role</th>
                  <th>Department</th>
                  <th>Requested On</th>
                  <th>Status</th>
                  <th>Reviewed By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted">
                      No requests found. All access requests have been processed.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <input type="checkbox" className="form-check-input" />
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm bg-warning text-white rounded-circle me-2">
                            {request.name.charAt(0).toUpperCase()}
                          </div>
                          {request.name}
                        </div>
                      </td>
                      <td>{request.email}</td>
                      <td>
                        <span className="badge bg-primary">{request.requestedRole}</span>
                      </td>
                      <td>{request.department}</td>
                      <td>{request.requestedOn}</td>
                      <td>
                        <span className={`badge ${
                          request.status === 'pending' ? 'bg-warning' :
                          request.status === 'approved' ? 'bg-success' : 'bg-danger'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td>{request.reviewedBy || '-'}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {request.status === 'pending' && (
                            <>
                              <button 
                                className="btn btn-success"
                                onClick={() => handleApprove(request.id)}
                                title="Approve"
                              >
                                <i className="ti ti-check"></i>
                              </button>
                              <button 
                                className="btn btn-danger"
                                onClick={() => handleReject(request.id)}
                                title="Reject"
                              >
                                <i className="ti ti-x"></i>
                              </button>
                            </>
                          )}
                          <button className="btn btn-outline-primary" title="View Details">
                            <i className="ti ti-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily Trends */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Daily Request Trends</h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={requestData?.dailyRequests || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="requests" fill="#3b82f6" />
              <Bar dataKey="approved" fill="#10b981" />
              <Bar dataKey="rejected" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminPendingRequestsPage;
