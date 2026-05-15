import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import StudentSelector from '../../components/students/StudentSelector';

interface Student {
  _id: string;
  admissionNumber: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  classId?: {
    name: string;
  };
  sectionId?: {
    name: string;
  };
  status: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  admissionDate?: string;
  gender?: string;
}

interface FeeRecord {
  _id: string;
  feeGroup: string;
  feeCode: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'partial';
  referenceId?: string;
  paymentMode?: string;
  paidOn?: string;
  discount?: number;
  fine?: number;
  academicYear?: string;
}

const StudentFeesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [feesLoading, setFeesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [selectedYear, setSelectedYear] = useState('2024/2025');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [upId, setUpId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const schoolId = '507f1f77bcf86cd799439011';

  const fetchStudent = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/students/${id}`, {
        params: { schoolId }
      });

      if (response.data.success) {
        setStudent(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching student:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load student details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchFees = async () => {
    if (!id) return;

    try {
      setFeesLoading(true);

      const response = await apiClient.get(`/students/${id}/fees`, {
        params: { 
          schoolId,
          academicYear: selectedYear
        }
      });

      if (response.data.success) {
        setFees(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching fees:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load fees';
      toast.error(errorMessage);
    } finally {
      setFeesLoading(false);
    }
  };

  const handlePayNow = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setPaymentAmount(fee.amount.toString());
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee || !id) return;

    setProcessingPayment(true);
    try {
      const paymentData = {
        studentId: id,
        feeId: selectedFee._id,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        upiId: paymentMethod === 'upi' ? upId : null,
        cardDetails: paymentMethod === 'card' ? {
          number: cardNumber.slice(-4),
          expiry: cardExpiry,
          lastFour: cardNumber.slice(-4)
        } : null,
        paymentDate: new Date().toISOString()
      };

      const response = await apiClient.post('/fees/pay', paymentData);
      
      if (response.data.success) {
        toast.success('Payment successful! Invoice generated.');
        setShowPaymentModal(false);
        fetchFees();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  useEffect(() => {
    if (student) {
      fetchFees();
    }
  }, [student, selectedYear]);

  const handleLoginDetails = () => {
    setShowLoginModal(true);
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '₹0';
    return new Intl.NumberFormat('en-INR', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const capitalize = (str?: string) => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'badge-soft-success';
      case 'unpaid':
        return 'badge-soft-danger';
      case 'partial':
        return 'badge-soft-warning';
      default:
        return 'badge-soft-secondary';
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

  if (error || !student) {
    if (!id && !error) {
      return (
        <StudentSelector
          redirectPath="/students/fees"
          title="Select Student for Fees"
          description="Choose a student to view their fee details"
        />
      );
    }
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">{error || 'Student not found'}</h4>
          <button className="btn btn-primary" onClick={fetchStudent}>
            <i className="ti ti-refresh me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${student.firstName} ${student.lastName}`;
  const classLabel = [student.classId?.name, student.sectionId?.name].filter(Boolean).join(', ') || 'N/A';

  // Calculate totals
  const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPaid = fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0);
  const totalPending = fees.filter(f => f.status === 'unpaid').reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Student Fees</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/students">Students</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Student Fees
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-light me-2 mb-2" type="button" onClick={handleLoginDetails}>
            <i className="ti ti-lock me-2" />
            Login Details
          </button>
          <Link to={`/students/edit/${id}`} className="btn btn-primary d-flex align-items-center mb-2">
            <i className="ti ti-edit-circle me-2" />
            Edit Student
          </Link>
        </div>
      </div>

      <div className="row">
        {/* Sidebar */}
        <div className="col-xxl-3 col-xl-4">
          <div className="card">
            <div className="card-body">
              <div className="border-bottom pb-3 mb-3">
                <div className="text-center">
                  <div className="avatar avatar-xxl mb-3">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${fullName}&background=random`} 
                      className="img-fluid rounded-circle" 
                      alt={fullName} 
                    />
                  </div>
                  <h5 className="mb-1">{fullName}</h5>
                  <p className="text-muted mb-2">{classLabel}</p>
                  <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {capitalize(student.status)}
                  </span>
                </div>
              </div>

              <div className="border-bottom pb-3 mb-3">
                <h6 className="mb-3">Basic Information</h6>
                <div className="mb-2">
                  <p className="text-muted mb-1">Admission No</p>
                  <p className="fw-medium mb-0">{student.admissionNumber}</p>
                </div>
                <div className="mb-2">
                  <p className="text-muted mb-1">Roll No</p>
                  <p className="fw-medium mb-0">{student.rollNumber || 'N/A'}</p>
                </div>
                {student.email && (
                  <div className="mb-2">
                    <p className="text-muted mb-1">Email</p>
                    <p className="fw-medium mb-0">{student.email}</p>
                  </div>
                )}
                {student.phone && (
                  <div className="mb-2">
                    <p className="text-muted mb-1">Phone</p>
                    <p className="fw-medium mb-0">{student.phone}</p>
                  </div>
                )}
              </div>

              <div>
                <h6 className="mb-3">Fees Summary</h6>
                <div className="mb-2">
                  <p className="text-muted mb-1">Total Amount</p>
                  <p className="fw-medium mb-0 text-primary">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="mb-2">
                  <p className="text-muted mb-1">Total Paid</p>
                  <p className="fw-medium mb-0 text-success">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="mb-2">
                  <p className="text-muted mb-1">Total Pending</p>
                  <p className="fw-medium mb-0 text-danger">{formatCurrency(totalPending)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-xxl-9 col-xl-8">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Fees Records</h4>
              <div className="dropdown mb-3">
                <select 
                  className="form-select" 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="2024/2025">Year: 2024 / 2025</option>
                  <option value="2023/2024">Year: 2023 / 2024</option>
                  <option value="2022/2023">Year: 2022 / 2023</option>
                </select>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              {feesLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading fees...</span>
                  </div>
                </div>
              ) : fees.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-receipt-off fs-1 text-muted mb-3"></i>
                  <h5 className="text-muted">No fees records found</h5>
                  <p className="text-muted">No fees have been assigned for this academic year.</p>
                </div>
              ) : (
                <div className="custom-datatable-filter table-responsive">
                  <table className="table">
                    <thead className="thead-light">
                      <tr>
                        <th>Fees Group</th>
                        <th>Fees Code</th>
                        <th>Due Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Ref ID</th>
                        <th>Mode</th>
                        <th>Date Paid</th>
                        <th>Discount</th>
                        <th>Fine</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((fee) => (
                        <tr key={fee._id}>
                          <td>
                            <p className="text-primary mb-0">{fee.feeGroup}</p>
                          </td>
                          <td>{fee.feeCode}</td>
                          <td>{formatDate(fee.dueDate)}</td>
                          <td>{formatCurrency(fee.amount)}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(fee.status)} d-inline-flex align-items-center`}>
                              <i className="ti ti-circle-filled fs-5 me-1" />
                              {capitalize(fee.status)}
                            </span>
                          </td>
                          <td>{fee.referenceId || 'N/A'}</td>
                          <td>{fee.paymentMode ? capitalize(fee.paymentMode) : 'N/A'}</td>
                          <td>{formatDate(fee.paidOn)}</td>
                          <td>{fee.discount ? formatCurrency(fee.discount) : '₹0'}</td>
                          <td>{fee.fine ? formatCurrency(fee.fine) : '₹0'}</td>
                          <td>
                            {fee.status !== 'paid' && (
                              <button className="btn btn-success btn-sm" onClick={() => handlePayNow(fee)}>
                                <i className="ti ti-cash me-1"></i>Pay Now
                              </button>
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

      {/* Login Details Modal */}
      {showLoginModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Login Details - {fullName}</h5>
                <button type="button" className="btn-close" onClick={handleCloseLoginModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Student Name</label>
                      <input type="text" className="form-control" value={fullName} readOnly />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Admission No</label>
                      <input type="text" className="form-control" value={student.admissionNumber} readOnly />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Class</label>
                      <input type="text" className="form-control" value={classLabel} readOnly />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Roll No</label>
                      <input type="text" className="form-control" value={student.rollNumber || 'N/A'} readOnly />
                    </div>
                  </div>
                </div>
                
                <hr className="my-4" />
                
                <h6 className="mb-3">Student Login Credentials</h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Username</label>
                      <input type="text" className="form-control" value={`student${student.rollNumber || student.admissionNumber}`} readOnly />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input type="password" className="form-control" value="********" readOnly />
                    </div>
                  </div>
                </div>

                <hr className="my-4" />
                
                <h6 className="mb-3">Parent Login Credentials</h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Username</label>
                      <input type="text" className="form-control" value={`parent${student.rollNumber || student.admissionNumber}`} readOnly />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input type="password" className="form-control" value="********" readOnly />
                    </div>
                  </div>
                </div>

                <div className="alert alert-info mt-3">
                  <i className="ti ti-info-circle me-2"></i>
                  <strong>Note:</strong> Login credentials are managed by the system administrator. Contact admin for password reset.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseLoginModal}>
                  <i className="ti ti-x me-2"></i>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedFee && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Pay Fees - {selectedFee.feeGroup}</h5>
                <button type="button" className="btn-close" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <form onSubmit={handlePaymentSubmit}>
                <div className="modal-body">
                  <div className="alert alert-info mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Total Amount:</span>
                      <strong>{formatCurrency(selectedFee.amount)}</strong>
                    </div>
                    {selectedFee.discount && (
                      <div className="d-flex justify-content-between mt-2">
                        <span>Discount:</span>
                        <span className="text-success">-{formatCurrency(selectedFee.discount)}</span>
                      </div>
                    )}
                    {selectedFee.fine && (
                      <div className="d-flex justify-content-between mt-2">
                        <span>Fine:</span>
                        <span className="text-danger">+{formatCurrency(selectedFee.fine)}</span>
                      </div>
                    )}
                    <hr />
                    <div className="d-flex justify-content-between">
                      <span>Payable Amount:</span>
                      <strong>{formatCurrency(selectedFee.amount - (selectedFee.discount || 0) + (selectedFee.fine || 0))}</strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Payment Amount</label>
                    <input type="number" className="form-control" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Payment Method</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input type="radio" className="form-check-input" id="upi" name="paymentMethod" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                        <label className="form-check-label" htmlFor="upi">UPI</label>
                      </div>
                      <div className="form-check">
                        <input type="radio" className="form-check-input" id="card" name="paymentMethod" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                        <label className="form-check-label" htmlFor="card">Debit/Credit Card</label>
                      </div>
                      <div className="form-check">
                        <input type="radio" className="form-check-input" id="netbanking" name="paymentMethod" checked={paymentMethod === 'netbanking'} onChange={() => setPaymentMethod('netbanking')} />
                        <label className="form-check-label" htmlFor="netbanking">Net Banking</label>
                      </div>
                      <div className="form-check">
                        <input type="radio" className="form-check-input" id="cash" name="paymentMethod" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                        <label className="form-check-label" htmlFor="cash">Cash</label>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="mb-3">
                      <label className="form-label">UPI ID</label>
                      <input type="text" className="form-control" placeholder="yourname@upi" value={upId} onChange={(e) => setUpId(e.target.value)} />
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Card Number</label>
                        <input type="text" className="form-control" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} maxLength={16} />
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Expiry</label>
                          <input type="text" className="form-control" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} maxLength={5} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">CVV</label>
                          <input type="password" className="form-control" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} maxLength={4} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success" disabled={processingPayment}>
                    {processingPayment ? 'Processing...' : <>Pay ₹{paymentAmount}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentFeesPage;
