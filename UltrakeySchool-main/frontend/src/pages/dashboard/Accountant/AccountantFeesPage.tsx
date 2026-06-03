import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';

interface FeeData {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    rollNumber?: string;
  };
  feeType: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  academicYear: string;
  term: string;
}

interface HostelFeeData {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
}

interface TransportFeeData {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    rollNumber?: string;
  };
  feeAmount: number;
  paidAmount: number;
  dueDate: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  academicYear: string;
  term: string;
}

const AccountantFeesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'hostel' | 'transport'>('general');
  const [generalFees, setGeneralFees] = useState<FeeData[]>([]);
  const [hostelFees, setHostelFees] = useState<HostelFeeData[]>([]);
  const [transportFees, setTransportFees] = useState<TransportFeeData[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);

  const [newFee, setNewFee] = useState({
    studentId: '',
    feeType: 'tuition',
    amount: '',
    dueDate: '',
    academicYear: '2024-2025',
    term: 'term1'
  });

  const fetchGeneralFees = async () => {
    try {
      const response = await apiClient.get('/fees');
      if (response.data.success) {
        setGeneralFees(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching general fees:', error);
      toast.error('Failed to load general fees');
    }
  };

  const fetchHostelFees = async () => {
    try {
      const response = await apiClient.get('/hostel-fees');
      if (response.data.success) {
        setHostelFees(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching hostel fees:', error);
      toast.error('Failed to load hostel fees');
    }
  };

  const fetchTransportFees = async () => {
    try {
      const response = await apiClient.get('/transport-fees');
      if (response.data.success) {
        setTransportFees(response.data.data?.fees || []);
      }
    } catch (error: any) {
      console.error('Error fetching transport fees:', error);
      toast.error('Failed to load transport fees');
    }
  };

  const fetchAllFees = async () => {
    setLoading(true);
    await Promise.all([fetchGeneralFees(), fetchHostelFees(), fetchTransportFees()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllFees();
  }, []);

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      let endpoint = '/fees';
      let payload: any = {
        studentId: newFee.studentId,
        feeType: newFee.feeType,
        amount: parseFloat(newFee.amount),
        dueDate: newFee.dueDate,
        academicYear: newFee.academicYear,
        term: newFee.term
      };

      if (activeTab === 'hostel') {
        endpoint = '/hostel-fees';
        payload = {
          studentId: newFee.studentId,
          description: `${newFee.feeType} Fee`,
          amount: parseFloat(newFee.amount),
          dueDate: newFee.dueDate
        };
      } else if (activeTab === 'transport') {
        endpoint = '/transport-fees';
        payload = {
          studentId: newFee.studentId,
          studentTransportId: newFee.studentId, // This would need to be the actual transport ID
          feeAmount: parseFloat(newFee.amount),
          dueDate: newFee.dueDate,
          academicYear: newFee.academicYear,
          term: newFee.term
        };
      }

      const response = await apiClient.post(endpoint, payload);
      if (response.data.success) {
        toast.success('Fee created successfully');
        setShowCreateModal(false);
        setNewFee({
          studentId: '',
          feeType: 'tuition',
          amount: '',
          dueDate: '',
          academicYear: '2024-2025',
          term: 'term1'
        });
        fetchAllFees();
      }
    } catch (error: any) {
      console.error('Error creating fee:', error);
      toast.error(error.response?.data?.message || 'Failed to create fee');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;

    setProcessing(true);
    try {
      let endpoint = `/fees/collect`;
      let payload: any = {
        feeId: selectedFee._id,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        transactionId: `TXN-${Date.now()}`
      };

      if (activeTab === 'hostel') {
        endpoint = `/hostel-fees/${selectedFee._id}/pay`;
        payload = {
          transactionReference: `TXN-${Date.now()}`,
          paymentMethod,
          paidAmount: parseFloat(paymentAmount)
        };
      } else if (activeTab === 'transport') {
        endpoint = `/transport-fees/${selectedFee._id}/pay`;
        payload = {
          paymentMethod,
          paymentReference: `TXN-${Date.now()}`,
          paidAmount: parseFloat(paymentAmount)
        };
      }

      const response = await apiClient.post(endpoint, payload);
      if (response.data.success) {
        toast.success('Payment recorded successfully');
        setShowPaymentModal(false);
        setPaymentAmount('');
        fetchAllFees();
      }
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendReminder = async (feeId: string) => {
    try {
      const response = await apiClient.post('/fees/reminders', { feeIds: [feeId] });
      if (response.data.success) {
        toast.success('Reminder sent successfully');
      }
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-INR', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'badge-soft-success';
      case 'pending':
        return 'badge-soft-warning';
      case 'partial':
        return 'badge-soft-info';
      case 'overdue':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  const calculateTotals = () => {
    if (activeTab === 'general') {
      const total = generalFees.reduce((sum, f) => sum + f.amount, 0);
      const collected = generalFees.reduce((sum, f) => sum + f.paidAmount, 0);
      const pending = total - collected;
      return { total, collected, pending };
    } else if (activeTab === 'hostel') {
      const total = hostelFees.reduce((sum, f) => sum + f.amount, 0);
      const collected = hostelFees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
      const pending = total - collected;
      return { total, collected, pending };
    } else {
      const total = transportFees.reduce((sum, f) => sum + f.feeAmount, 0);
      const collected = transportFees.reduce((sum, f) => sum + f.paidAmount, 0);
      const pending = total - collected;
      return { total, collected, pending };
    }
  };

  const totals = calculateTotals();

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
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Fee Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/accountant">Dashboard</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Fees</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <i className="ti ti-plus me-1" />Create Fee
          </button>
          <button className="btn btn-outline-primary" onClick={fetchAllFees}>
            <i className="ti ti-refresh me-1" />Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-xl-4 col-lg-6 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xl bg-primary text-white me-3 flex-shrink-0">
                  <i className="ti ti-currency-rupee fs-24"></i>
                </div>
                <div className="overflow-hidden flex-fill">
                  <h4 className="counter mb-0">{formatCurrency(totals.total)}</h4>
                  <p className="mb-0 text-muted">Total {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Fees</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-lg-6 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xl bg-success text-white me-3 flex-shrink-0">
                  <i className="ti ti-cash fs-24"></i>
                </div>
                <div className="overflow-hidden flex-fill">
                  <h4 className="counter mb-0">{formatCurrency(totals.collected)}</h4>
                  <p className="mb-0 text-muted">Collected Amount</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-lg-6 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xl bg-warning text-white me-3 flex-shrink-0">
                  <i className="ti ti-clock fs-24"></i>
                </div>
                <div className="overflow-hidden flex-fill">
                  <h4 className="counter mb-0">{formatCurrency(totals.pending)}</h4>
                  <p className="mb-0 text-muted">Pending Amount</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                <i className="ti ti-book me-2" />General Fees
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'hostel' ? 'active' : ''}`}
                onClick={() => setActiveTab('hostel')}
              >
                <i className="ti ti-building me-2" />Hostel Fees
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'transport' ? 'active' : ''}`}
                onClick={() => setActiveTab('transport')}
              >
                <i className="ti ti-bus me-2" />Transport Fees
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {activeTab === 'general' && (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Fee Type</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Remaining</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {generalFees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        <i className="ti ti-receipt-off fs-1 text-muted mb-3"></i>
                        <p className="text-muted">No general fees found</p>
                      </td>
                    </tr>
                  ) : (
                    generalFees.map((fee) => (
                      <tr key={fee._id}>
                        <td>
                          {fee.studentId?.firstName} {fee.studentId?.lastName}
                          {fee.studentId?.rollNumber && <small className="d-block text-muted">Roll: {fee.studentId.rollNumber}</small>}
                        </td>
                        <td className="text-capitalize">{fee.feeType}</td>
                        <td>{formatCurrency(fee.amount)}</td>
                        <td>{formatCurrency(fee.paidAmount)}</td>
                        <td>{formatCurrency(fee.remainingAmount)}</td>
                        <td>{new Date(fee.dueDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(fee.status)}`}>
                            {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            {fee.status !== 'paid' && (
                              <>
                                <button 
                                  className="btn btn-sm btn-success"
                                  onClick={() => {
                                    setSelectedFee(fee);
                                    setPaymentAmount(fee.remainingAmount.toString());
                                    setShowPaymentModal(true);
                                  }}
                                >
                                  <i className="ti ti-cash" />
                                </button>
                                <button 
                                  className="btn btn-sm btn-info"
                                  onClick={() => handleSendReminder(fee._id)}
                                >
                                  <i className="ti ti-bell" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'hostel' && (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hostelFees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        <i className="ti ti-building-off fs-1 text-muted mb-3"></i>
                        <p className="text-muted">No hostel fees found</p>
                      </td>
                    </tr>
                  ) : (
                    hostelFees.map((fee) => (
                      <tr key={fee._id}>
                        <td>
                          {fee.student?.firstName} {fee.student?.lastName}
                        </td>
                        <td>{fee.description}</td>
                        <td>{formatCurrency(fee.amount)}</td>
                        <td>{new Date(fee.dueDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(fee.status)}`}>
                            {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            {fee.status !== 'paid' && (
                              <>
                                <button 
                                  className="btn btn-sm btn-success"
                                  onClick={() => {
                                    setSelectedFee(fee);
                                    setPaymentAmount(fee.amount.toString());
                                    setShowPaymentModal(true);
                                  }}
                                >
                                  <i className="ti ti-cash" />
                                </button>
                                <button 
                                  className="btn btn-sm btn-info"
                                  onClick={() => handleSendReminder(fee._id)}
                                >
                                  <i className="ti ti-bell" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'transport' && (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Fee Amount</th>
                    <th>Paid</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transportFees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        <i className="ti ti-bus-off fs-1 text-muted mb-3"></i>
                        <p className="text-muted">No transport fees found</p>
                      </td>
                    </tr>
                  ) : (
                    transportFees.map((fee) => (
                      <tr key={fee._id}>
                        <td>
                          {fee.studentId?.firstName} {fee.studentId?.lastName}
                          {fee.studentId?.rollNumber && <small className="d-block text-muted">Roll: {fee.studentId.rollNumber}</small>}
                        </td>
                        <td>{formatCurrency(fee.feeAmount)}</td>
                        <td>{formatCurrency(fee.paidAmount)}</td>
                        <td>{new Date(fee.dueDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(fee.paymentStatus)}`}>
                            {fee.paymentStatus.charAt(0).toUpperCase() + fee.paymentStatus.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            {fee.paymentStatus !== 'paid' && (
                              <>
                                <button 
                                  className="btn btn-sm btn-success"
                                  onClick={() => {
                                    setSelectedFee(fee);
                                    setPaymentAmount((fee.feeAmount - fee.paidAmount).toString());
                                    setShowPaymentModal(true);
                                  }}
                                >
                                  <i className="ti ti-cash" />
                                </button>
                                <button 
                                  className="btn btn-sm btn-info"
                                  onClick={() => handleSendReminder(fee._id)}
                                >
                                  <i className="ti ti-bell" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Fee Modal */}
      {showCreateModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Fee</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateFee}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Student ID</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newFee.studentId}
                      onChange={(e) => setNewFee({...newFee, studentId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Fee Type</label>
                    <select 
                      className="form-select"
                      value={newFee.feeType}
                      onChange={(e) => setNewFee({...newFee, feeType: e.target.value})}
                    >
                      <option value="tuition">Tuition Fee</option>
                      <option value="transport">Transport Fee</option>
                      <option value="hostel">Hostel Fee</option>
                      <option value="library">Library Fee</option>
                      <option value="sports">Sports Fee</option>
                      <option value="exam">Exam Fee</option>
                      <option value="annual">Annual Fee</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Amount (₹)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newFee.amount}
                      onChange={(e) => setNewFee({...newFee, amount: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Due Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={newFee.dueDate}
                      onChange={(e) => setNewFee({...newFee, dueDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Academic Year</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={newFee.academicYear}
                        onChange={(e) => setNewFee({...newFee, academicYear: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Term</label>
                      <select 
                        className="form-select"
                        value={newFee.term}
                        onChange={(e) => setNewFee({...newFee, term: e.target.value})}
                      >
                        <option value="term1">Term 1</option>
                        <option value="term2">Term 2</option>
                        <option value="term3">Term 3</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={processing}>
                    {processing ? 'Creating...' : 'Create Fee'}
                  </button>
                </div>
              </form>
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
                <h5 className="modal-title">Record Payment</h5>
                <button type="button" className="btn-close" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <form onSubmit={handlePayment}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <strong>Amount to Pay:</strong> {formatCurrency(parseFloat(paymentAmount) || 0)}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Payment Amount (₹)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Payment Method</label>
                    <select 
                      className="form-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Net Banking</option>
                      <option value="cheque">Cheque</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success" disabled={processing}>
                    {processing ? 'Processing...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantFeesPage;
