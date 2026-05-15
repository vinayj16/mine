import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';

type HostelFee = {
  _id: string;
  studentId: string;
  studentName: string;
  roomId: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  paymentDate: string | null;
  period: string;
};

type Student = {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  class: string;
  section: string;
  hostelAllocated: boolean;
  roomId: string | null;
};

type Room = {
  _id: string;
  roomNumber: string;
  block: string;
  capacity: number;
  currentResidents: number;
};

const HostelFeesPage = () => {
  const [fees, setFees] = useState<HostelFee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<HostelFee | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const [newFee, setNewFee] = useState({
    studentId: '',
    amount: '',
    period: '',
    roomId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [feesRes, studentsRes, roomsRes] = await Promise.all([
        apiClient.get('/hostel/fees').catch(() => ({ data: { success: true, data: { fees: [] } } })),
        apiClient.get('/hostel/students').catch(() => ({ data: { success: true, data: { students: [] } } })),
        apiClient.get('/hostel/rooms').catch(() => ({ data: { success: true, data: { rooms: [] } } }))
      ]);

      if (feesRes.data?.success) {
        setFees(feesRes.data.data?.fees || []);
      }
      if (studentsRes.data?.success) {
        setStudents(studentsRes.data.data?.students || []);
      }
      if (roomsRes.data?.success) {
        setRooms(roomsRes.data.data?.rooms || roomsRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const student = students.find(s => s._id === newFee.studentId);
      const res = await apiClient.post('/hostel/fees', {
        studentId: newFee.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : '',
        roomId: newFee.roomId,
        amount: parseFloat(newFee.amount),
        period: newFee.period
      });

      if (res.data?.success) {
        toast.success('Fee created successfully');
        setShowAddModal(false);
        setNewFee({ studentId: '', amount: '', period: '', roomId: '' });
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create fee');
    }
  };

  const handlePayment = async () => {
    if (!selectedFee || !paymentAmount) return;
    try {
      const res = await apiClient.post('/hostel/fees/pay', {
        feeId: selectedFee._id,
        amount: parseFloat(paymentAmount)
      });

      if (res.data?.success) {
        toast.success('Payment successful');
        setShowPaymentModal(false);
        setSelectedFee(null);
        setPaymentAmount('');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  const filteredFees = fees.filter(fee => {
    const matchesStatus = statusFilter === 'all' || fee.status === statusFilter;
    const matchesSearch = fee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fee.period.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: fees.length,
    paid: fees.filter(f => f.status === 'paid').length,
    partial: fees.filter(f => f.status === 'partial').length,
    pending: fees.filter(f => f.status === 'pending').length,
    totalAmount: fees.reduce((sum, f) => sum + f.amount, 0),
    totalCollected: fees.reduce((sum, f) => sum + f.paidAmount, 0),
    totalDue: fees.reduce((sum, f) => sum + f.dueAmount, 0)
  };

  const hostelStudents = students.filter(s => s.hostelAllocated);

  return (
    <div className="content">
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Hostel Fees Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to="/dashboard/hostel/hostels">Hostel</Link></li>
              <li className="breadcrumb-item active">Fees</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-1" onClick={fetchData} title="Refresh">
            <i className="ti ti-refresh"></i>
          </button>
          <div className="mb-2">
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <i className="ti ti-plus me-2"></i>Create Fee
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-3 col-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-sm bg-primary rounded-circle me-2">
                  <i className="ti ti-file-text text-white"></i>
                </div>
                <div>
                  <p className="text-muted mb-0 small">Total Fees</p>
                  <h5 className="mb-0">{stats.total}</h5>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-sm bg-success rounded-circle me-2">
                  <i className="ti ti-check text-white"></i>
                </div>
                <div>
                  <p className="text-muted mb-0 small">Paid</p>
                  <h5 className="mb-0">{stats.paid}</h5>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-sm bg-warning rounded-circle me-2">
                  <i className="ti ti-clock text-white"></i>
                </div>
                <div>
                  <p className="text-muted mb-0 small">Pending</p>
                  <h5 className="mb-0">{stats.pending}</h5>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-sm bg-info rounded-circle me-2">
                  <i className="ti ti-cash text-white"></i>
                </div>
                <div>
                  <p className="text-muted mb-0 small">Total Due</p>
                  <h5 className="mb-0">₹{stats.totalDue.toLocaleString()}</h5>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h4 className="mb-0">Hostel Fees</h4>
          <div className="d-flex align-items-center flex-wrap gap-2">
            <div className="input-group" style={{ width: '250px' }}>
              <span className="input-group-text bg-light border-0">
                <i className="ti ti-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ width: '150px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3">Period</th>
                  <th className="py-3">Room</th>
                  <th className="py-3 text-end">Total</th>
                  <th className="py-3 text-end">Paid</th>
                  <th className="py-3 text-end">Due</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredFees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <i className="ti ti-inbox fs-1 text-muted mb-2"></i>
                      <p className="text-muted mb-0">No fees found</p>
                    </td>
                  </tr>
                ) : (
                  filteredFees.map((fee) => {
                    const room = rooms.find(r => r._id === fee.roomId);
                    return (
                      <tr key={fee._id}>
                        <td className="py-3 px-3">
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm bg-primary rounded-circle me-2">
                              <span className="text-white">{fee.studentName[0]}</span>
                            </div>
                            <span>{fee.studentName}</span>
                          </div>
                        </td>
                        <td className="py-3">{fee.period}</td>
                        <td className="py-3">{room ? `Room ${room.roomNumber}` : 'N/A'}</td>
                        <td className="py-3 text-end">₹{fee.amount.toLocaleString()}</td>
                        <td className="py-3 text-end text-success">₹{fee.paidAmount.toLocaleString()}</td>
                        <td className="py-3 text-end text-danger">₹{fee.dueAmount.toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`badge ${
                            fee.status === 'paid' ? 'bg-success' :
                            fee.status === 'partial' ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3">
                          {fee.status !== 'paid' && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => {
                                setSelectedFee(fee);
                                setPaymentAmount(fee.dueAmount.toString());
                                setShowPaymentModal(true);
                              }}
                            >
                              <i className="ti ti-cash me-1"></i>Collect
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Hostel Fee</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddFee}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Student</label>
                    <select
                      className="form-select"
                      value={newFee.studentId}
                      onChange={(e) => setNewFee({ ...newFee, studentId: e.target.value })}
                      required
                    >
                      <option value="">Select Student</option>
                      {hostelStudents.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.firstName} {s.lastName} ({s.admissionNo})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Period</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., April 2026"
                      value={newFee.period}
                      onChange={(e) => setNewFee({ ...newFee, period: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Amount (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Enter amount"
                      value={newFee.amount}
                      onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Fee</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedFee && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Collect Payment</h5>
                <button type="button" className="btn-close" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-light mb-3">
                  <strong>{selectedFee.studentName}</strong><br />
                  <span className="text-muted">{selectedFee.period}</span><br />
                  <span className="text-danger">Due: ₹{selectedFee.dueAmount.toLocaleString()}</span>
                </div>
                <div className="mb-3">
                  <label className="form-label">Payment Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={selectedFee.dueAmount}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="button" className="btn btn-success" onClick={handlePayment} disabled={!paymentAmount}>
                  <i className="ti ti-cash me-1"></i>Collect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostelFeesPage;
