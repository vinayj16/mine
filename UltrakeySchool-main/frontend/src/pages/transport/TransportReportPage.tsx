import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transportReportService, type TransportReport, type TransportStatistics } from '../../services';
import { toast } from 'react-toastify';

const TransportReportPage: React.FC = () => {
  const [reports, setReports] = useState<TransportReport[]>([]);
  const [transportStats, setTransportStats] = useState<TransportStatistics>({
    totalRoutes: 0,
    totalVehicles: 0,
    totalStudents: 0,
    activeAssignments: 0,
    byRoute: [],
    byVehicle: []
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<TransportReport | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'route' | 'vehicle' | 'driver' | 'student' | 'revenue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  const institutionId = '507f1f77bcf86cd799439011';

  useEffect(() => {
    fetchReports();
    fetchStatistics();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transportReportService.getAllReports(institutionId);
      if (response.success) {
        setReports(response.data);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch reports';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await transportReportService.getTransportStatistics(institutionId);
      setTransportStats(response);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch statistics');
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const reportData = {
        reportType: 'Route',
        title: 'Monthly Route Performance Report',
        description: 'Complete analysis of all transport routes',
        dateRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        },
        data: {},
        generatedBy: 'System',
        status: 'pending' as const
      };
      
      const response = await transportReportService.generateReport(institutionId, reportData);
      if (response.success) {
        toast.success('Report generation started');
        fetchReports();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      setLoading(true);
      const response = await transportReportService.deleteReport(reportId, institutionId);
      if (response.success) {
        toast.success('Report deleted successfully');
        setReports(prev => prev.filter(r => r._id !== reportId));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete report');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.length === 0) {
      toast.error('Please select reports to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedReports.length} report(s)?`)) return;

    try {
      setLoading(true);
      const response = await transportReportService.bulkDeleteReports(selectedReports, institutionId);
      if (response.success) {
        toast.success(response.message);
        setSelectedReports([]);
        setSelectAll(false);
        fetchReports();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete reports');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedReports(filteredReports.map(r => r._id));
    } else {
      setSelectedReports([]);
    }
  };

  const toggleReportSelection = (id: string) => {
    if (selectedReports.includes(id)) {
      setSelectedReports(selectedReports.filter(reportId => reportId !== id));
    } else {
      setSelectedReports([...selectedReports, id]);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (report.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reportType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || report.reportType.toLowerCase() === filterType.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'processing':
      case 'pending':
        return 'bg-warning';
      case 'scheduled':
        return 'bg-info';
      case 'failed':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  const getReportTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'route':
        return 'bg-primary';
      case 'vehicle':
        return 'bg-info';
      case 'driver':
        return 'bg-success';
      case 'student':
        return 'bg-warning';
      case 'revenue':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  // Loading state
  if (loading && reports.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && reports.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">Error Loading Reports</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchReports}>
            <i className="ti ti-refresh me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Transport Reports</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/transport">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/institution/transport/routes">Transport</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Reports
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          {selectedReports.length > 0 && (
            <button 
              className="btn btn-danger d-flex align-items-center mb-2 me-2"
              onClick={handleBulkDelete}
              disabled={loading}
            >
              <i className="ti ti-trash me-2" />
              Delete Selected ({selectedReports.length})
            </button>
          )}
          <button 
            className="btn btn-primary d-flex align-items-center mb-2"
            onClick={handleGenerateReport}
            disabled={loading}
          >
            <i className="ti ti-file-plus me-2" />
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row">
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1">Total Routes</p>
                  <h4 className="mb-0">{transportStats.totalRoutes}</h4>
                </div>
                <div className="avatar avatar-md bg-primary-transparent">
                  <i className="ti ti-list text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1">Total Vehicles</p>
                  <h4 className="mb-0">{transportStats.totalVehicles}</h4>
                </div>
                <div className="avatar avatar-md bg-info-transparent">
                  <i className="ti ti-car text-info" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1">Total Students</p>
                  <h4 className="mb-0">{transportStats.totalStudents}</h4>
                </div>
                <div className="avatar avatar-md bg-success-transparent">
                  <i className="ti ti-users text-success" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1">Active Assignments</p>
                  <h4 className="mb-0">{transportStats.activeAssignments}</h4>
                </div>
                <div className="avatar avatar-md bg-warning-transparent">
                  <i className="ti ti-user text-warning" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
          <h4 className="card-title">Generated Reports</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start me-2">
              <span className="icon-addon">
                <i className="ti ti-search" />
              </span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="form-select" 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              style={{ width: 'auto' }}
            >
              <option value="all">All Reports</option>
              <option value="route">Route Reports</option>
              <option value="vehicle">Vehicle Reports</option>
              <option value="driver">Driver Reports</option>
              <option value="student">Student Reports</option>
              <option value="revenue">Revenue Reports</option>
            </select>
          </div>
        </div>
        <div className="card-body p-0">
          {/* Empty State */}
          {filteredReports.length === 0 && !loading && (
            <div className="text-center py-5">
              <i className="ti ti-file-off fs-1 text-muted mb-3"></i>
              <h5 className="mb-2">No Reports Found</h5>
              <p className="text-muted mb-4">Generate your first transport report to get started</p>
              <button className="btn btn-primary" onClick={handleGenerateReport}>
                <i className="ti ti-plus me-2"></i>Generate First Report
              </button>
            </div>
          )}

          {/* Reports Table */}
          {filteredReports.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Report Type</th>
                    <th>Title</th>
                    <th>Period</th>
                    <th>Generated Date</th>
                    <th>Records</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report._id}>
                      <td>
                        <div className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            checked={selectedReports.includes(report._id)}
                            onChange={() => toggleReportSelection(report._id)}
                          />
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getReportTypeBadge(report.reportType)}`}>
                          {report.reportType}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="mb-0 fw-medium">{report.title}</p>
                          <small className="text-muted text-truncate d-block" style={{ maxWidth: '200px' }}>
                            {report.description || 'No description'}
                          </small>
                        </div>
                      </td>
                      <td>
                        {report.dateRange ? `${report.dateRange.startDate} to ${report.dateRange.endDate}` : 'N/A'}
                      </td>
                      <td>{report.generatedAt?.split('T')[0] || 'N/A'}</td>
                      <td>{Object.keys(report.data || {}).length.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td>
                        <div className="dropdown">
                          <button className="btn btn-white btn-icon btn-sm" data-bs-toggle="dropdown">
                            <i className="ti ti-dots-vertical" />
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <button 
                                className="dropdown-item" 
                                onClick={() => {
                                  setSelectedReport(report);
                                  setShowViewModal(true);
                                }}
                              >
                                <i className="ti ti-eye me-2" />
                                View Details
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item">
                                <i className="ti ti-download me-2" />
                                Download PDF
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item">
                                <i className="ti ti-file-export me-2" />
                                Export Excel
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item">
                                <i className="ti ti-printer me-2" />
                                Print
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item text-danger" 
                                onClick={() => handleDeleteReport(report._id)}
                              >
                                <i className="ti ti-trash me-2" />
                                Delete
                              </button>
                            </li>
                          </ul>
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

      {/* View Report Modal */}
      {showViewModal && selectedReport && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Transport Report Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedReport(null);
                  }}
                />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Report Type</label>
                      <div>
                        <span className={`badge ${getReportTypeBadge(selectedReport.reportType)} fs-6`}>
                          {selectedReport.reportType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <div>
                        <span className={`badge ${getStatusBadge(selectedReport.status)} fs-6`}>
                          {selectedReport.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Title</label>
                      <p className="form-control-plaintext">{selectedReport.title}</p>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Period</label>
                      <p className="form-control-plaintext">
                        {selectedReport.dateRange ? `${selectedReport.dateRange.startDate} to ${selectedReport.dateRange.endDate}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Generated Date</label>
                      <p className="form-control-plaintext">{selectedReport.generatedAt?.split('T')[0] || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <p className="form-control-plaintext">{selectedReport.description || 'No description'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Total Records</label>
                      <p className="form-control-plaintext">{Object.keys(selectedReport.data || {}).length.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Generated By</label>
                      <p className="form-control-plaintext">{selectedReport.generatedBy || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedReport(null);
                  }}
                >
                  Close
                </button>
                <button type="button" className="btn btn-primary">
                  <i className="ti ti-download me-2" />
                  Download Report
                </button>
                <button type="button" className="btn btn-info">
                  <i className="ti ti-printer me-2" />
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransportReportPage;
