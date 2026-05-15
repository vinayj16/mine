import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface FeesReport {
  _id: string;
  feeId: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
  feeType: string;
  feeGroup?: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'partial';
  paidAmount?: number;
  paymentDate?: string;
  paymentMode?: string;
  transactionId?: string;
  discount?: number;
  fine?: number;
  balance: number;
  createdAt: string;
}

const FeesReportPage: React.FC = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feesReports, setFeesReports] = useState<FeesReport[]>([]);
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    student: '',
    status: ''
  });
  const [sortBy, setSortBy] = useState('ascending');

  // Get schoolId from localStorage
  const schoolId = localStorage.getItem('schoolId') || '507f1f77bcf86cd799439011';

  const fetchFeesReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        schoolId,
        limit: 100
      };

      if (filters.status) params.status = filters.status;

      const response = await apiClient.get('/fees/report', { params });

      if (response.data.success) {
        setFeesReports(response.data.data.fees || []);
      }
    } catch (err: any) {
      console.error('Error fetching fees report:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load fees report';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeesReport();
  }, []);

  const handleRefresh = () => {
    fetchFeesReport();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    setShowFilter(false);
    fetchFeesReport();
  };

  const resetFilters = () => {
    setFilters({
      class: '',
      section: '',
      student: '',
      status: ''
    });
    fetchFeesReport();
  };

  const handleSort = (sortType: string) => {
    setSortBy(sortType);
    // Implement sorting logic here
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    toast.info(`Export to ${type} feature coming soon`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      paid: { color: 'success', label: 'Paid' },
      unpaid: { color: 'danger', label: 'Unpaid' },
      partial: { color: 'warning', label: 'Partial' }
    };

    const statusInfo = statusMap[status] || { color: 'secondary', label: status };

    return (
      <span className={`badge badge-soft-${statusInfo.color} d-inline-flex align-items-center`}>
        <i className="ti ti-circle-filled fs-5 me-1"></i>
        {statusInfo.label}
      </span>
    );
  };

  // Calculate totals
  const calculateTotals = () => {
    return feesReports.reduce(
      (acc, report) => ({
        amount: acc.amount + report.amount,
        discount: acc.discount + (report.discount || 0),
        fine: acc.fine + (report.fine || 0),
        balance: acc.balance + report.balance
      }),
      { amount: 0, discount: 0, fine: 0, balance: 0 }
    );
  };

  const totals = calculateTotals();

  return (
    <>
    
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Fees Report</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="#">Report</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Fees Report</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1" 
                onClick={handleRefresh}
                disabled={loading}
                data-bs-toggle="tooltip"
                data-bs-placement="top" 
                aria-label="Refresh" 
                data-bs-original-title="Refresh"
              >
                <i className="ti ti-refresh"></i>
              </button>
            </div>
            <div className="pe-1 mb-2">
              <button 
                type="button" 
                className="btn btn-outline-light bg-white btn-icon me-1"
                onClick={() => window.print()}
                data-bs-toggle="tooltip" 
                data-bs-placement="top" 
                aria-label="Print"
                data-bs-original-title="Print"
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

        {/* Fees Report List */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Fees Report List</h4>
            <div className="d-flex align-items-center flex-wrap">
              <div className="input-icon-start mb-3 me-2 position-relative">
                <span className="icon-addon">
                  <i className="ti ti-calendar"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control date-range bookingrange" 
                  placeholder="Select"
                  value="Academic Year : 2024 / 2025" 
                  readOnly 
                />
              </div>
              
              <div className="dropdown mb-3 me-2">
                <button 
                  className="btn btn-outline-light bg-white dropdown-toggle"
                  onClick={() => setShowFilter(!showFilter)}
                >
                  <i className="ti ti-filter me-2"></i>Filter
                </button>
                {showFilter && (
                  <div className="dropdown-menu drop-width show" style={{ position: 'absolute', inset: '0px auto auto 0px', margin: '0px', transform: 'translate(0px, 40px)' }}>
                    <form>
                      <div className="d-flex align-items-center border-bottom p-3">
                        <h4>Filter</h4>
                      </div>
                      <div className="p-3 border-bottom">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="mb-3">
                              <label className="form-label">Class</label>
                              <select 
                                className="form-select" 
                                name="class" 
                                value={filters.class} 
                                onChange={handleFilterChange}
                              >
                                <option value="">Select</option>
                                <option value="I">I</option>
                                <option value="II">II</option>
                                <option value="III">III</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="mb-3">
                              <label className="form-label">Section</label>
                              <select 
                                className="form-select" 
                                name="section" 
                                value={filters.section} 
                                onChange={handleFilterChange}
                              >
                                <option value="">Select</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="mb-0">
                              <label className="form-label">Students</label>
                              <select 
                                className="form-select" 
                                name="student" 
                                value={filters.student} 
                                onChange={handleFilterChange}
                              >
                                <option value="">Select</option>
                                <option value="Janet">Janet</option>
                                <option value="Joann">Joann</option>
                                <option value="Kathleen">Kathleen</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 d-flex align-items-center justify-content-end">
                        <button 
                          type="button" 
                          className="btn btn-light me-3" 
                          onClick={resetFilters}
                        >
                          Reset
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          onClick={handleApplyFilters}
                        >
                          Apply
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
              
              <div className="dropdown mb-3">
                <button 
                  className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown"
                >
                  <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
                </button>
                <ul className="dropdown-menu p-3">
                  <li>
                    <button 
                      className={`dropdown-item rounded-1 ${sortBy === 'ascending' ? 'active' : ''}`}
                      onClick={() => handleSort('ascending')}
                    >
                      Ascending
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-item rounded-1 ${sortBy === 'descending' ? 'active' : ''}`}
                      onClick={() => handleSort('descending')}
                    >
                      Descending
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-item rounded-1 ${sortBy === 'recently-viewed' ? 'active' : ''}`}
                      onClick={() => handleSort('recently-viewed')}
                    >
                      Recently Viewed
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-item rounded-1 ${sortBy === 'recently-added' ? 'active' : ''}`}
                      onClick={() => handleSort('recently-added')}
                    >
                      Recently Added
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading fees report...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="card-body">
              <div className="alert alert-danger" role="alert">
                <i className="ti ti-alert-circle me-2"></i>
                {error}
                <button
                  className="btn btn-sm btn-outline-danger ms-3"
                  onClick={fetchFeesReport}
                >
                  <i className="ti ti-refresh me-1"></i>Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && feesReports.length === 0 && (
            <div className="card-body text-center py-5">
              <i className="ti ti-receipt" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No fees records found</p>
            </div>
          )}

          {/* Fees Report Table */}
          {!loading && !error && feesReports.length > 0 && (
          <div className="card-body p-0 py-3">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Student</th>
                    <th>Fees Type</th>
                    <th>Fees Group</th>
                    <th>Due Date</th>
                    <th>Amount $ </th>
                    <th>Status</th>
                    <th>Ref ID</th>
                    <th>Mode</th>
                    <th>Date Paid</th>
                    <th>Discount ($)</th>
                    <th>Fine ($)</th>
                    <th>Balance ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {feesReports.map((report) => (
                    <tr key={report._id}>
                      <td>
                        <p className="mb-0">
                          {report.studentId.firstName} {report.studentId.lastName}
                          <span className="d-block text-muted small">{report.studentId.admissionNumber}</span>
                        </p>
                      </td>
                      <td>{report.feeType}</td>
                      <td>{report.feeGroup || '-'}</td>
                      <td>{formatDate(report.dueDate)}</td>
                      <td>{formatCurrency(report.amount)}</td>
                      <td>{getStatusBadge(report.status)}</td>
                      <td>{report.transactionId || report.feeId}</td>
                      <td>{report.paymentMode || '-'}</td>
                      <td>{report.paymentDate ? formatDate(report.paymentDate) : '-'}</td>
                      <td>{report.discount ? formatCurrency(report.discount) : '-'}</td>
                      <td>{report.fine ? formatCurrency(report.fine) : '-'}</td>
                      <td>{formatCurrency(report.balance)}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-dark text-white">
                    <td colSpan={4} className="text-end fw-bold">Totals:</td>
                    <td className="fw-bold">{formatCurrency(totals.amount)}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td className="fw-bold">{formatCurrency(totals.discount)}</td>
                    <td className="fw-bold">{formatCurrency(totals.fine)}</td>
                    <td className="fw-bold">{formatCurrency(totals.balance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
        {/* /Fees Report List */}

    </>
  );
};

export default FeesReportPage;
