import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface LeaveReport {
  _id: string;
  leaveId: string;
  staffId: string;
  staffName: string;
  leaveType: 'casual' | 'sick' | 'maternity' | 'paternity' | 'annual' | 'emergency';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  comments?: string;
  documents?: string[];
}


const LeaveReportPage: React.FC = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveReports, setLeaveReports] = useState<LeaveReport[]>([]);
  const [filters, setFilters] = useState({
    staffId: '',
    status: '',
    leaveType: ''
  });
  const [sortBy, setSortBy] = useState('ascending');


  const fetchLeaveReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (filters.staffId) params.staffId = filters.staffId;
      if (filters.status) params.status = filters.status;
      if (filters.leaveType) params.leaveType = filters.leaveType;

      const response = await apiClient.get('/leave-reports', {
        params
      });

      if (response.data.success) {
        const reports = response.data.data || [];
        
        setLeaveReports(reports);
        
        if (reports.length === 0) {
          toast.info('No leave reports found for the selected filters');
        }
      }
    } catch (err: any) {
      console.error('Error fetching leave reports:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load leave reports';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveReports();
  }, []);

  const handleRefresh = () => {
    fetchLeaveReports();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setShowFilter(false);
    fetchLeaveReports();
  };

  const resetFilters = () => {
    setFilters({
      staffId: '',
      status: '',
      leaveType: ''
    });
    fetchLeaveReports();
  };

  const handleSort = (sortType: string) => {
    setSortBy(sortType);
    // Sort the reports
    const sorted = [...leaveReports].sort((a, b) => {
      if (sortType === 'ascending') {
        return a.staffName.localeCompare(b.staffName);
      } else if (sortType === 'descending') {
        return b.staffName.localeCompare(a.staffName);
      }
      return 0;
    });
    setLeaveReports(sorted);
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    toast.info(`Export to ${type} feature coming soon`);
  };

  const getLeaveTypeColor = (leaveType: string) => {
    switch (leaveType) {
      case 'casual': return 'info';
      case 'sick': return 'warning';
      case 'maternity': return 'success';
      case 'paternity': return 'primary';
      case 'annual': return 'secondary';
      case 'emergency': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <>

        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Leave Report</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="#">Report</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Leave Report</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <button
                className="btn btn-outline-light bg-white btn-icon me-1"
                onClick={handleRefresh}
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
                  <button
                    className="dropdown-item rounded-1"
                    onClick={() => handleExport('pdf')}
                  >
                    <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item rounded-1"
                    onClick={() => handleExport('excel')}
                  >
                    <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* /Page Header */}

        {/* Student List */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Leave Report List</h4>
            <div className="d-flex align-items-center flex-wrap">
              <div className="input-icon-start mb-3 me-2 position-relative">
                <span className="icon-addon">
                  <i className="ti ti-calendar"></i>
                </span>
                <input type="text" className="form-control date-range bookingrange" placeholder="Select"
                  value="Academic Year : 2024 / 2025" readOnly />
              </div>
              <div className="dropdown mb-3 me-2">
                <button className="btn btn-outline-light bg-white dropdown-toggle"
                  onClick={() => setShowFilter(!showFilter)}>
                  <i className="ti ti-filter me-2"></i>Filter
                </button>
                {showFilter && (
                  <div className="dropdown-menu drop-width show" style={{ position: 'absolute', inset: '0px auto auto 0px', margin: '0px', transform: 'translate(0px, 40px)' }}>
                    <form onSubmit={handleApplyFilters}>
                      <div className="d-flex align-items-center border-bottom p-3">
                        <h4>Filter</h4>
                      </div>
                      <div className="p-3 border-bottom">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="mb-3">
                              <label className="form-label">Status</label>
                              <select className="form-select" name="status" value={filters.status} onChange={handleFilterChange}>
                                <option value="">Select Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="mb-0">
                              <label className="form-label">Leave Type</label>
                              <select className="form-select" name="leaveType" value={filters.leaveType} onChange={handleFilterChange}>
                                <option value="">Select Type</option>
                                <option value="casual">Casual</option>
                                <option value="sick">Sick</option>
                                <option value="maternity">Maternity</option>
                                <option value="paternity">Paternity</option>
                                <option value="annual">Annual</option>
                                <option value="emergency">Emergency</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 d-flex align-items-center justify-content-end">
                        <button type="button" className="btn btn-light me-3" onClick={resetFilters}>Reset</button>
                        <button type="submit" className="btn btn-primary">Apply</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
              <div className="dropdown mb-3">
                <button className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown">
                  <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
                </button>
                <ul className="dropdown-menu p-3">
                  <li>
                    <button 
                      className={`dropdown-item rounded-1 ${sortBy === 'ascending' ? 'active' : ''}`}
                      onClick={() => handleSort('ascending')}>
                      Ascending
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-item rounded-1 ${sortBy === 'descending' ? 'active' : ''}`}
                      onClick={() => handleSort('descending')}>
                      Descending
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-item rounded-1 ${sortBy === 'recently-viewed' ? 'active' : ''}`}
                      onClick={() => handleSort('recently-viewed')}>
                      Recently Viewed
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-item rounded-1 ${sortBy === 'recently-added' ? 'active' : ''}`}
                      onClick={() => handleSort('recently-added')}>
                      Recently Added
                    </button>
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
                <p className="mt-2 text-muted">Loading leave reports...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-3">
                <div className="alert alert-danger" role="alert">
                  <i className="ti ti-alert-circle me-2"></i>
                  {error}
                  <button
                    className="btn btn-sm btn-outline-danger ms-3"
                    onClick={fetchLeaveReports}
                  >
                    <i className="ti ti-refresh me-1"></i>Retry
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && leaveReports.length === 0 && (
              <div className="text-center py-5">
                <i className="ti ti-calendar-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
                <p className="mt-2 text-muted">No leave reports found</p>
                <p className="text-muted small">Leave reports will appear here once staff members apply for leave</p>
              </div>
            )}

            {/* Leave Reports List */}
            {!loading && !error && leaveReports.length > 0 && (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Leave ID</th>
                    <th>Staff Name</th>
                    <th>Staff ID</th>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Status</th>
                    <th>Applied On</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveReports.map((report) => (
                    <tr key={report._id}>
                      <td><span className="badge bg-light text-dark">{report.leaveId}</span></td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm rounded-circle me-2 bg-light d-flex align-items-center justify-content-center">
                            <i className="ti ti-user fs-14 text-muted"></i>
                          </div>
                          <div>
                            <p className="text-dark mb-0">{report.staffName}</p>
                          </div>
                        </div>
                      </td>
                      <td>{report.staffId}</td>
                      <td>
                        <span className={`badge bg-${getLeaveTypeColor(report.leaveType)} text-white`}>
                          {report.leaveType.charAt(0).toUpperCase() + report.leaveType.slice(1)}
                        </span>
                      </td>
                      <td>{report.startDate}</td>
                      <td>{report.endDate}</td>
                      <td>{report.days}</td>
                      <td>
                        <span className={`badge bg-${getStatusColor(report.status)} text-white`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </td>
                      <td>{new Date(report.appliedOn).toLocaleDateString()}</td>
                      <td>
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }} title={report.reason}>
                          {report.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            {/* /Student List */}
          </div>
        </div>
        {/* /Student List */}
     
    </>
  );
};

export default LeaveReportPage;
