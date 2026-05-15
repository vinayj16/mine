import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

type PaymentRecord = {
  _id: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  period: string;
  receiptNo: string;
};

const PaymentHistoryPage = () => {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [summary, setSummary] = useState({
    totalCollected: 0,
    transactionCount: 0,
    paidCount: 0
  });

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/hostel/payments/history').catch(() => ({
        data: {
          success: true,
          data: {
            records: [],
            summary: { totalCollected: 0, transactionCount: 0, paidCount: 0 }
          }
        }
      }));

      if (res.data?.success) {
        setRecords(res.data.data?.records || []);
        setSummary(res.data.data?.summary || {
          totalCollected: 0,
          transactionCount: 0,
          paidCount: 0
        });
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || record.paymentMethod.toLowerCase() === methodFilter.toLowerCase();
    return matchesSearch && matchesMethod;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="content">
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Payment History</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to="/dashboard/hostel/hostels">Hostel</Link></li>
              <li className="breadcrumb-item"><Link to="/dashboard/hostel/fees">Fees</Link></li>
              <li className="breadcrumb-item active">Payment History</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-1" onClick={fetchPaymentHistory} title="Refresh">
            <i className="ti ti-refresh"></i>
          </button>
          <div className="mb-2">
            <button className="btn btn-light" onClick={() => window.print()}>
              <i className="ti ti-printer me-2"></i>Print
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-4 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg bg-success rounded-circle me-3">
                  <i className="ti ti-cash text-white"></i>
                </div>
                <div>
                  <p className="text-muted mb-1 small">Total Collected</p>
                  <h3 className="mb-0 text-success">₹{summary.totalCollected.toLocaleString()}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg bg-primary rounded-circle me-3">
                  <i className="ti ti-receipt text-white"></i>
                </div>
                <div>
                  <p className="text-muted mb-1 small">Total Transactions</p>
                  <h3 className="mb-0">{summary.transactionCount}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg bg-info rounded-circle me-3">
                  <i className="ti ti-user-check text-white"></i>
                </div>
                <div>
                  <p className="text-muted mb-1 small">Payments Received</p>
                  <h3 className="mb-0">{summary.paidCount}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h4 className="mb-0">All Transactions</h4>
          <div className="d-flex align-items-center flex-wrap gap-2">
            <div className="input-group" style={{ width: '250px' }}>
              <span className="input-group-text bg-light border-0">
                <i className="ti ti-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, receipt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ width: '150px' }}
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-3">Receipt No</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Student</th>
                  <th className="py-3">Period</th>
                  <th className="py-3">Method</th>
                  <th className="py-3 text-end">Amount</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted">Loading payment history...</p>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <i className="ti ti-receipt text-muted" style={{ fontSize: '48px' }}></i>
                      <p className="text-muted mt-2 mb-0">No payment records found</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record._id}>
                      <td className="py-3 px-3">
                        <span className="badge bg-light text-dark">{record.receiptNo}</span>
                      </td>
                      <td className="py-3">{formatDate(record.paymentDate)}</td>
                      <td className="py-3">
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm bg-secondary rounded-circle me-2">
                            <span className="text-white">{record.studentName[0]}</span>
                          </div>
                          <span>{record.studentName}</span>
                        </div>
                      </td>
                      <td className="py-3">{record.period}</td>
                      <td className="py-3">
                        <span className={`badge ${
                          record.paymentMethod.toLowerCase() === 'cash' ? 'bg-secondary' :
                          record.paymentMethod.toLowerCase() === 'online' ? 'bg-primary' :
                          record.paymentMethod.toLowerCase() === 'upi' ? 'bg-success' : 'bg-info'
                        }`}>
                          <i className={`ti ${
                            record.paymentMethod.toLowerCase() === 'cash' ? 'ti-cash' :
                            record.paymentMethod.toLowerCase() === 'online' ? 'ti-world' :
                            record.paymentMethod.toLowerCase() === 'upi' ? 'ti-device-mobile' : 'ti-credit-card'
                          } me-1`}></i>
                          {record.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 text-end">
                        <span className="text-success fw-semibold">₹{record.amount.toLocaleString()}</span>
                      </td>
                      <td className="py-3">
                        <button className="btn btn-sm btn-light" title="View Receipt">
                          <i className="ti ti-eye"></i>
                        </button>
                      </td>
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

export default PaymentHistoryPage;
