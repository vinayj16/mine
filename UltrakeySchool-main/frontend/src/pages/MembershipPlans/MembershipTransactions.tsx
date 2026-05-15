import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Transaction {
  _id: string;
  transactionId: string;
  schoolId: {
    _id: string;
    name: string;
  };
  subscriptionId?: {
    _id: string;
    planName: string;
  };
  type: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentDetails?: {
    cardBrand?: string;
    lastFour?: string;
  };
  metadata?: {
    planId?: string;
    planName?: string;
    billingCycle?: string;
  };
  createdAt: string;
  processedAt?: string;
}

const MembershipTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    planType: '',
    providerName: ''
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      
      const response = await apiClient.get('/transactions', { params });
      
      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
      } else if (response.data.data) {
        // Handle alternative response format
        setTransactions(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.message || 'Failed to load transactions');
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleRefresh = () => {
    fetchTransactions();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    toast.info('PDF export feature coming soon');
  };

  const handleExportExcel = () => {
    toast.info('Excel export feature coming soon');
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleReset = () => {
    setFilters({
      status: '',
      type: '',
      planType: '',
      providerName: ''
    });
    setTimeout(() => fetchTransactions(), 100);
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedTransactions(transactions.map(t => t._id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const toggleTransactionSelection = (id: string) => {
    if (selectedTransactions.includes(id)) {
      setSelectedTransactions(selectedTransactions.filter(tId => tId !== id));
    } else {
      setSelectedTransactions([...selectedTransactions, id]);
    }
  };

  const handleTransactionClick = (transactionId: string) => {
    toast.info(`Transaction details: ${transactionId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'badge-soft-success';
      case 'pending':
        return 'badge-soft-warning';
      case 'failed':
        return 'badge-soft-danger';
      case 'refunded':
        return 'badge-soft-info';
      case 'cancelled':
        return 'badge-soft-secondary';
      default:
        return 'badge-soft-secondary';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getPaymentMethodDisplay = (method: string, details?: any) => {
    if (method === 'card' && details?.cardBrand) {
      return `${details.cardBrand} ****${details.lastFour || ''}`;
    }
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const calculateEndDate = (startDate: string, billingCycle?: string) => {
    if (!startDate) return '-';
    const start = new Date(startDate);
    if (billingCycle === 'yearly') {
      start.setFullYear(start.getFullYear() + 1);
    } else {
      start.setMonth(start.getMonth() + 1);
    }
    return formatDate(start.toISOString());
  };

  return (
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Transactions</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/membership-plans">Membership</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Transactions</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              data-bs-toggle="tooltip"
              data-bs-placement="top" 
              aria-label="Refresh" 
              data-bs-original-title="Refresh"
              onClick={handleRefresh}
              disabled={loading}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              type="button" 
              className="btn btn-outline-light bg-white btn-icon me-1"
              data-bs-toggle="tooltip" 
              data-bs-placement="top" 
              aria-label="Print"
              data-bs-original-title="Print"
              onClick={handlePrint}
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
                  onClick={handleExportPDF}
                >
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button 
                  className="dropdown-item rounded-1"
                  onClick={handleExportExcel}
                >
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel 
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {/* /Page Header */}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading transactions...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="alert alert-danger" role="alert">
          <i className="ti ti-alert-circle me-2"></i>
          {error}
          <button
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={fetchTransactions}
          >
            <i className="ti ti-refresh me-1"></i>Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Filter Section */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Transactions List ({transactions.length})</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="dropdown mb-3 me-2">
                  <button 
                    className="btn btn-outline-light bg-white dropdown-toggle"
                    data-bs-toggle="dropdown" 
                    data-bs-auto-close="outside"
                  >
                    <i className="ti ti-filter me-2"></i>Filter
                  </button>
                  <div className="dropdown-menu drop-width">
                    <form onSubmit={handleFilterSubmit}>
                      <div className="d-flex align-items-center border-bottom p-3">
                        <h4>Filter</h4>
                      </div>
                      <div className="p-3 border-bottom">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="mb-3">
                              <label className="form-label">Status</label>
                              <select 
                                className="form-select"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                              >
                                <option value="">All</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="mb-0">
                              <label className="form-label">Transaction Type</label>
                              <select 
                                className="form-select"
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                              >
                                <option value="">All</option>
                                <option value="subscription">Subscription</option>
                                <option value="upgrade">Upgrade</option>
                                <option value="addon">Addon</option>
                                <option value="refund">Refund</option>
                                <option value="adjustment">Adjustment</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 d-flex align-items-center justify-content-end">
                        <button 
                          type="button" 
                          className="btn btn-light me-3"
                          onClick={handleReset}
                        >
                          Reset
                        </button>
                        <button type="submit" className="btn btn-primary">Apply</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-body p-0 py-3">
              {/* Empty State */}
              {transactions.length === 0 && (
                <div className="text-center py-5">
                  <i className="ti ti-receipt" style={{ fontSize: '48px', color: '#ccc' }}></i>
                  <p className="mt-2 text-muted">No transactions found</p>
                </div>
              )}

              {/* Transaction List */}
              {transactions.length > 0 && (
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
                        <th>Provider Name</th>
                        <th>Plan Type</th>
                        <th>Transaction Date</th>
                        <th>Amount</th>
                        <th>Payment Method</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction._id}>
                          <td>
                            <div className="form-check form-check-md">
                              <input 
                                className="form-check-input" 
                                type="checkbox"
                                checked={selectedTransactions.includes(transaction._id)}
                                onChange={() => toggleTransactionSelection(transaction._id)}
                              />
                            </div>
                          </td>
                          <td>
                            <button 
                              className="btn btn-link link-primary p-0"
                              onClick={() => handleTransactionClick(transaction.transactionId)}
                            >
                              {transaction.transactionId}
                            </button>
                          </td>
                          <td>
                            {typeof transaction.schoolId === 'object' 
                              ? transaction.schoolId.name 
                              : 'N/A'}
                          </td>
                          <td className="text-capitalize">
                            {transaction.metadata?.planName || 
                             (typeof transaction.subscriptionId === 'object' 
                               ? transaction.subscriptionId.planName 
                               : transaction.type)}
                          </td>
                          <td>{formatDate(transaction.createdAt)}</td>
                          <td>{formatCurrency(transaction.amount, transaction.currency)}</td>
                          <td>{getPaymentMethodDisplay(transaction.paymentMethod, transaction.paymentDetails)}</td>
                          <td>{formatDate(transaction.processedAt || transaction.createdAt)}</td>
                          <td>{calculateEndDate(transaction.processedAt || transaction.createdAt, transaction.metadata?.billingCycle)}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(transaction.status)} d-inline-flex align-items-center`}>
                              <i className="ti ti-circle-filled fs-5 me-1"></i>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* /Transaction List */}
            </div>
          </div>
          {/* /Filter Section */}
        </>
      )}
    </div>
  );
};

export default MembershipTransactions;
