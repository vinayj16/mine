import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Leave {
  _id: string;
  leaveId?: string;
  employee: {
    _id: string;
    name: string;
    employeeId?: string;
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedDate: string;
  approvedBy?: {
    name: string;
  };
  approvedDate?: string;
}

const LeavesPage: React.FC = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/hrm/leaves');
      
      if (response.data.success) {
        setLeaves(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching leaves:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch leave requests';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success';
      case 'pending':
        return 'bg-warning';
      case 'rejected':
        return 'bg-danger';
      case 'cancelled':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
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

  if (error) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">Error Loading Leaves</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchLeaves}>
            <i className="ti ti-refresh me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Leave Requests</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item">HRM</li>
              <li className="breadcrumb-item active">Leaves</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button 
            className="btn btn-outline-light bg-white btn-icon me-2" 
            onClick={fetchLeaves}
            title="Refresh"
          >
            <i className="ti ti-refresh"></i>
          </button>
          <Link to="/hrm/leave-types" className="btn btn-primary">
            <i className="ti ti-plus me-2"></i>Manage Leave Types
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">All Leave Requests</h4>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Leave ID</th>
                  <th>Staff</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Approved By</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <p className="text-muted mb-0">No leave requests found</p>
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave._id}>
                      <td>{leave.leaveId || leave._id.slice(-6)}</td>
                      <td>
                        <div>
                          <div className="fw-medium">{leave.employee?.name || 'Unknown Employee'}</div>
                          <small className="text-muted">{leave.employee?.employeeId || leave.employee?._id?.slice(-6) || '-'}</small>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {leave.leaveType?.charAt(0)?.toUpperCase() + leave.leaveType?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td>{formatDate(leave.startDate)}</td>
                      <td>{formatDate(leave.endDate)}</td>
                      <td>{leave.totalDays}</td>
                      <td>{formatDate(leave.appliedDate)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(leave.status)}`}>
                          {leave.status?.charAt(0)?.toUpperCase() + leave.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td>{leave.approvedBy?.name || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeavesPage;
