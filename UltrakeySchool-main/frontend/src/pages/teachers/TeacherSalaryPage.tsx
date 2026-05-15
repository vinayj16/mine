import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import TeacherDetailTabs from '../../components/teachers/TeacherDetailTabs';

interface SalaryRecord {
  _id: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: {
    hra: number;
    da: number;
    ta: number;
    medical: number;
    other: number;
  };
  deductions: {
    pf: number;
    tax: number;
    insurance: number;
    loan: number;
    other: number;
  };
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  paymentDate?: string;
  paymentMode: 'bank_transfer' | 'cash' | 'cheque';
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed';
  transactionId?: string;
  remarks?: string;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  overtimeHours: number;
  overtimeAmount: number;
  createdAt: string;
}

interface SalarySummary {
  totalPaid: number;
  totalPending: number;
  totalProcessing: number;
  totalFailed: number;
}

interface TeacherProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  department: string;
  designation: string;
}

const TeacherSalaryPage = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [salaryHistory, setSalaryHistory] = useState<SalaryRecord[]>([]);
  const [salarySummary, setSalarySummary] = useState<SalarySummary>({
    totalPaid: 0,
    totalPending: 0,
    totalProcessing: 0,
    totalFailed: 0
  });
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSalary, setSelectedSalary] = useState<SalaryRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const schoolId = '507f1f77bcf86cd799439011'; // This should come from auth context

  useEffect(() => {
    if (teacherId) {
      fetchTeacherProfile();
      fetchSalaryData();
    }
  }, [teacherId]);

  const fetchTeacherProfile = async () => {
    try {
      const response = await apiClient.get(`/teachers/${teacherId}`);
      if (response.data.success) {
        setTeacherProfile(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch teacher profile:', error);
    }
  };

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/teachers/${teacherId}/salary`, {
        params: { schoolId, limit: 12 }
      });

      if (response.data.success) {
        setSalaryHistory(response.data.data.salaries || []);
        
        // Calculate summary from the data
        const summary = response.data.data.summary || [];
        const summaryObj: SalarySummary = {
          totalPaid: 0,
          totalPending: 0,
          totalProcessing: 0,
          totalFailed: 0
        };

        summary.forEach((item: any) => {
          switch (item._id) {
            case 'paid':
              summaryObj.totalPaid = item.totalAmount;
              break;
            case 'pending':
              summaryObj.totalPending = item.totalAmount;
              break;
            case 'processing':
              summaryObj.totalProcessing = item.totalAmount;
              break;
            case 'failed':
              summaryObj.totalFailed = item.totalAmount;
              break;
          }
        });

        setSalarySummary(summaryObj);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch salary data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash';
      case 'cheque':
        return 'Cheque';
      default:
        return method;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'badge-soft-success';
      case 'pending':
        return 'badge-soft-warning';
      case 'processing':
        return 'badge-soft-info';
      case 'failed':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  const handleViewDetails = (salary: SalaryRecord) => {
    setSelectedSalary(salary);
    setShowDetailsModal(true);
  };

  // Loading state
  if (loading && salaryHistory.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && salaryHistory.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">Error Loading Salary Data</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchSalaryData}>
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
          <h3 className="page-title mb-1">Teacher Details</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/teachers">Teachers</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Teacher Details
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-light me-2 mb-2" type="button">
            <i className="ti ti-lock me-2" />
            Login Details
          </button>
          <Link to={`/teachers/${teacherId}/edit`} className="btn btn-primary d-flex align-items-center mb-2">
            <i className="ti ti-edit-circle me-2" />
            Edit Teacher
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-3 col-xl-4">
          {/* Teacher Profile Sidebar */}
          {teacherProfile && (
            <div className="card border-white">
              <div className="card-header">
                <div className="d-flex align-items-center flex-wrap row-gap-3">
                  <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0">
                    <img 
                      src={teacherProfile.photo || `https://ui-avatars.com/api/?name=${teacherProfile.firstName}+${teacherProfile.lastName}&background=random`} 
                      className="img-fluid rounded-circle" 
                      alt={`${teacherProfile.firstName} ${teacherProfile.lastName}`} 
                    />
                  </div>
                  <div>
                    <h5 className="mb-1 text-truncate">{teacherProfile.firstName} {teacherProfile.lastName}</h5>
                    <p className="text-primary mb-1">{teacherProfile._id.slice(-6)}</p>
                    <p className="mb-0">{teacherProfile.designation}</p>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <h5 className="mb-3">Contact Information</h5>
                <div className="d-flex align-items-center mb-3">
                  <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                    <i className="ti ti-phone" />
                  </span>
                  <div>
                    <p className="text-dark mb-0">{teacherProfile.phone}</p>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                    <i className="ti ti-mail" />
                  </span>
                  <div>
                    <p className="text-dark mb-0">{teacherProfile.email}</p>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-0">
                  <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                    <i className="ti ti-building" />
                  </span>
                  <div>
                    <p className="text-dark mb-0">{teacherProfile.department}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="col-xxl-9 col-xl-8">
          <TeacherDetailTabs active="salary" />

          {/* Salary Summary Cards */}
          <div className="row">
            <div className="col-md-6 col-xxl-3 d-flex">
              <div className="d-flex align-items-center justify-content-between rounded border p-3 mb-3 flex-fill bg-white w-100">
                <div className="ms-2">
                  <p className="mb-1">Total Paid</p>
                  <h5>{formatCurrency(salarySummary.totalPaid)}</h5>
                </div>
                <span className="avatar avatar-lg bg-success-transparent rounded flex-shrink-0 text-success">
                  <i className="ti ti-check fs-24" />
                </span>
              </div>
            </div>
            <div className="col-md-6 col-xxl-3 d-flex">
              <div className="d-flex align-items-center justify-content-between rounded border p-3 mb-3 flex-fill bg-white w-100">
                <div className="ms-2">
                  <p className="mb-1">Pending</p>
                  <h5>{formatCurrency(salarySummary.totalPending)}</h5>
                </div>
                <span className="avatar avatar-lg bg-warning-transparent rounded flex-shrink-0 text-warning">
                  <i className="ti ti-clock fs-24" />
                </span>
              </div>
            </div>
            <div className="col-md-6 col-xxl-3 d-flex">
              <div className="d-flex align-items-center justify-content-between rounded border p-3 mb-3 flex-fill bg-white w-100">
                <div className="ms-2">
                  <p className="mb-1">Processing</p>
                  <h5>{formatCurrency(salarySummary.totalProcessing)}</h5>
                </div>
                <span className="avatar avatar-lg bg-info-transparent rounded flex-shrink-0 text-info">
                  <i className="ti ti-refresh fs-24" />
                </span>
              </div>
            </div>
            <div className="col-md-6 col-xxl-3 d-flex">
              <div className="d-flex align-items-center justify-content-between rounded border p-3 mb-3 flex-fill bg-white w-100">
                <div className="ms-2">
                  <p className="mb-1">Failed</p>
                  <h5>{formatCurrency(salarySummary.totalFailed)}</h5>
                </div>
                <span className="avatar avatar-lg bg-danger-transparent rounded flex-shrink-0 text-danger">
                  <i className="ti ti-x fs-24" />
                </span>
              </div>
            </div>
          </div>

          {/* Salary History Table */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Salary History</h4>
              <div className="d-flex align-items-center flex-wrap">
                <button 
                  className="btn btn-outline-light bg-white d-flex align-items-center mb-3"
                  onClick={fetchSalaryData}
                >
                  <i className="ti ti-refresh me-2" />
                  Refresh
                </button>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              {/* Empty State */}
              {salaryHistory.length === 0 && !loading && (
                <div className="text-center py-5">
                  <i className="ti ti-cash-off fs-1 text-muted mb-3"></i>
                  <h5 className="mb-2">No Salary Records Found</h5>
                  <p className="text-muted mb-4">No salary records have been created for this teacher yet</p>
                </div>
              )}

              {/* Salary Table */}
              {salaryHistory.length > 0 && (
                <div className="custom-datatable-filter table-responsive">
                  <table className="table">
                    <thead className="thead-light">
                      <tr>
                        <th>ID</th>
                        <th>Salary For</th>
                        <th>Payment Date</th>
                        <th>Payment Method</th>
                        <th>Net Salary</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryHistory.map((salary) => (
                        <tr key={salary._id}>
                          <td>
                            <Link to="#" className="link-primary">
                              {salary._id.slice(-6)}
                            </Link>
                          </td>
                          <td>{getMonthName(salary.month)} {salary.year}</td>
                          <td>{formatDate(salary.paymentDate)}</td>
                          <td>{getPaymentMethodLabel(salary.paymentMode)}</td>
                          <td className="fw-medium">{formatCurrency(salary.netSalary)}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(salary.paymentStatus)} d-inline-flex align-items-center`}>
                              <i className="ti ti-circle-filled fs-5 me-1"></i>
                              {salary.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-light btn-sm"
                              onClick={() => handleViewDetails(salary)}
                            >
                              View Details
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
        </div>
      </div>

      {/* Salary Details Modal */}
      {showDetailsModal && selectedSalary && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Salary Details - {getMonthName(selectedSalary.month)} {selectedSalary.year}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedSalary(null);
                  }}
                />
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label text-muted">Payment Status</label>
                      <div>
                        <span className={`badge ${getStatusBadge(selectedSalary.paymentStatus)} fs-6`}>
                          {selectedSalary.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label text-muted">Payment Date</label>
                      <p className="mb-0">{formatDate(selectedSalary.paymentDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label text-muted">Working Days</label>
                      <p className="mb-0 fw-medium">{selectedSalary.workingDays}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label text-muted">Present Days</label>
                      <p className="mb-0 fw-medium">{selectedSalary.presentDays}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label text-muted">Leave Days</label>
                      <p className="mb-0 fw-medium">{selectedSalary.leaveDays}</p>
                    </div>
                  </div>
                </div>

                <h6 className="mb-3">Salary Breakdown</h6>
                <div className="table-responsive mb-4">
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <td className="fw-medium">Basic Salary</td>
                        <td className="text-end">{formatCurrency(selectedSalary.basicSalary)}</td>
                      </tr>
                      <tr className="table-light">
                        <td colSpan={2} className="fw-medium">Allowances</td>
                      </tr>
                      <tr>
                        <td className="ps-4">HRA</td>
                        <td className="text-end">{formatCurrency(selectedSalary.allowances.hra)}</td>
                      </tr>
                      <tr>
                        <td className="ps-4">DA</td>
                        <td className="text-end">{formatCurrency(selectedSalary.allowances.da)}</td>
                      </tr>
                      <tr>
                        <td className="ps-4">TA</td>
                        <td className="text-end">{formatCurrency(selectedSalary.allowances.ta)}</td>
                      </tr>
                      <tr>
                        <td className="ps-4">Medical</td>
                        <td className="text-end">{formatCurrency(selectedSalary.allowances.medical)}</td>
                      </tr>
                      <tr>
                        <td className="ps-4">Other</td>
                        <td className="text-end">{formatCurrency(selectedSalary.allowances.other)}</td>
                      </tr>
                      {selectedSalary.overtimeAmount > 0 && (
                        <tr>
                          <td className="ps-4">Overtime ({selectedSalary.overtimeHours} hrs)</td>
                          <td className="text-end">{formatCurrency(selectedSalary.overtimeAmount)}</td>
                        </tr>
                      )}
                      <tr className="table-light">
                        <td colSpan={2} className="fw-medium">Deductions</td>
                      </tr>
                      <tr>
                        <td className="ps-4">PF</td>
                        <td className="text-end text-danger">-{formatCurrency(selectedSalary.deductions.pf)}</td>
                      </tr>
                      <tr>
                        <td className="ps-4">Tax</td>
                        <td className="text-end text-danger">-{formatCurrency(selectedSalary.deductions.tax)}</td>
                      </tr>
                      <tr>
                        <td className="ps-4">Insurance</td>
                        <td className="text-end text-danger">-{formatCurrency(selectedSalary.deductions.insurance)}</td>
                      </tr>
                      <tr>
                        <td className="ps-4">Loan</td>
                        <td className="text-end text-danger">-{formatCurrency(selectedSalary.deductions.loan)}</td>
                      </tr>
                      <tr>
                        <td className="ps-4">Other</td>
                        <td className="text-end text-danger">-{formatCurrency(selectedSalary.deductions.other)}</td>
                      </tr>
                      <tr className="table-success">
                        <td className="fw-bold">Net Salary</td>
                        <td className="text-end fw-bold">{formatCurrency(selectedSalary.netSalary)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {selectedSalary.remarks && (
                  <div className="mb-3">
                    <label className="form-label text-muted">Remarks</label>
                    <p className="mb-0">{selectedSalary.remarks}</p>
                  </div>
                )}

                {selectedSalary.transactionId && (
                  <div className="mb-3">
                    <label className="form-label text-muted">Transaction ID</label>
                    <p className="mb-0 font-monospace">{selectedSalary.transactionId}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedSalary(null);
                  }}
                >
                  Close
                </button>
                <button type="button" className="btn btn-primary">
                  <i className="ti ti-download me-2" />
                  Download Payslip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherSalaryPage;
