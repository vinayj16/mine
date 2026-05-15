import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Payroll {
  _id: string;
  payrollId: string;
  employee: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'paid' | 'generated' | 'pending';
  paymentDate?: string;
}

const PayrollPage: React.FC = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedPayrolls, setSelectedPayrolls] = useState<string[]>([]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/hrm/payroll');
      if (response.data.success) {
        setPayrolls(response.data.data.payrolls || []);
      }
    } catch (err: any) {
      console.error('Error fetching payrolls:', err);
      setError(err.response?.data?.message || 'Failed to load payroll records');
      toast.error('Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedPayrolls(payrolls.map(p => p._id));
    } else {
      setSelectedPayrolls([]);
    }
  };

  const togglePayrollSelection = (id: string) => {
    if (selectedPayrolls.includes(id)) {
      setSelectedPayrolls(selectedPayrolls.filter(pId => pId !== id));
    } else {
      setSelectedPayrolls([...selectedPayrolls, id]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'badge-soft-success';
      case 'generated':
        return 'badge-soft-warning';
      case 'pending':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Payroll</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/hrm">HRM</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Payroll</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchPayrolls}
              title="Refresh"
              disabled={loading}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
            <div className="pe-1 mb-2">
              <button type="button" className="btn btn-outline-light bg-white btn-icon me-1"
                data-bs-toggle="tooltip" data-bs-placement="top" aria-label="Print"
                data-bs-original-title="Print">
                <i className="ti ti-printer"></i>
              </button>
            </div>
            <div className="dropdown me-2 mb-2">
              <a href="javascript:void(0);"
                className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center"
                data-bs-toggle="dropdown">
                <i className="ti ti-file-export me-2"></i>Export
              </a>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                  </a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* /Page Header */}

        {/* Filter Section */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Payroll List</h4>
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
                <a href="javascript:void(0);" className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown" data-bs-auto-close="outside">
                  <i className="ti ti-filter me-2"></i>Filter
                </a>
                <div className="dropdown-menu drop-width">
                  <form>
                    <div className="d-flex align-items-center border-bottom p-3">
                      <h4>Filter</h4>
                    </div>
                    <div className="p-3 border-bottom">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">All Staffs</label>
                            <select className="form-select">
                              <option>Select</option>
                              <option>Kevin</option>
                              <option>Willie</option>
                              <option>Daniel</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Month</label>
                            <select className="form-select">
                              <option>Select</option>
                              <option>April</option>
                              <option>May</option>
                              <option>June</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-0">
                            <label className="form-label">Year</label>
                            <select className="form-select">
                              <option>Select</option>
                              <option>2024</option>
                              <option>2023</option>
                              <option>2022</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 d-flex align-items-center justify-content-end">
                      <a href="javascript:void(0);" className="btn btn-light me-3">Reset</a>
                      <button type="submit" className="btn btn-primary">Apply</button>
                    </div>
                  </form>
                </div>
              </div>
              <div className="dropdown mb-3">
                <a href="javascript:void(0);" className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown">
                  <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
                </a>
                <ul className="dropdown-menu p-3">
                  <li>
                    <a href="javascript:void(0);" className="dropdown-item rounded-1 active">
                      Ascending
                    </a>
                  </li>
                  <li>
                    <a href="javascript:void(0);" className="dropdown-item rounded-1">
                      Descending
                    </a>
                  </li>
                  <li>
                    <a href="javascript:void(0);" className="dropdown-item rounded-1">
                      Recently Viewed
                    </a>
                  </li>
                  <li>
                    <a href="javascript:void(0);" className="dropdown-item rounded-1">
                      Recently Added
                    </a>
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
                <p className="mt-2 text-muted">Loading payroll records...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="alert alert-danger m-3" role="alert">
                <i className="ti ti-alert-circle me-2"></i>
                {error}
                <button
                  className="btn btn-sm btn-outline-danger ms-3"
                  onClick={fetchPayrolls}
                >
                  <i className="ti ti-refresh me-1"></i>Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && payrolls.length === 0 && (
              <div className="text-center py-5">
                <i className="ti ti-file-dollar" style={{ fontSize: '48px', color: '#ccc' }}></i>
                <p className="mt-2 text-muted">No payroll records found</p>
              </div>
            )}

            {/* Payroll List */}
            {!loading && !error && payrolls.length > 0 && (
              <div className="custom-datatable-filter table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="select-all"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Period</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((payroll) => (
                    <tr key={payroll._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedPayrolls.includes(payroll._id)}
                            onChange={() => togglePayrollSelection(payroll._id)}
                          />
                        </div>
                      </td>
                      <td><a href="#!" className="link-primary" onClick={(e) => e.preventDefault()}>{payroll.payrollId}</a></td>
                      <td>
                        <div className="d-flex align-items-center">
                          {payroll.employee.avatar && (
                            <a href="#!" className="avatar avatar-md me-2" onClick={(e) => e.preventDefault()}>
                              <img src={payroll.employee.avatar} alt={payroll.employee.name} />
                            </a>
                          )}
                          <span>{payroll.employee.name}</span>
                        </div>
                      </td>
                      <td>{getMonthName(payroll.month)} {payroll.year}</td>
                      <td>{payroll.employee.phone || '-'}</td>
                      <td>{formatCurrency(payroll.netSalary)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(payroll.status)} d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-light add-fee">
                          {payroll.status === 'generated' ? 'View Details' : 'View Payslip'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            {/* /Payroll List */}
          </div>
        </div>
    </>
  );
};

export default PayrollPage;