import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Transaction {
  _id: string;
  transactionId: string;
  schoolId: {
    _id: string;
    name: string;
    code?: string;
  };
  subscriptionId?: {
    _id: string;
    planId: {
      name: string;
      price: number;
    };
  };
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  paymentGateway?: string;
  invoiceId?: string;
  description?: string;
  metadata?: any;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  failureReason?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
}

const TransactionDetailsPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transactionId) {
      fetchTransactionDetails();
    }
  }, [transactionId]);

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/transactions/${transactionId}`);

      if (response.data.success) {
        setTransaction(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch transaction details:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch transaction details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      completed: 'bg-success',
      pending: 'bg-warning',
      failed: 'bg-danger',
      refunded: 'bg-info'
    };
    return statusConfig[status] || 'bg-secondary';
  };

  const getPaymentIcon = (method: string) => {
    const iconConfig: Record<string, string> = {
      'credit_card': 'ti ti-credit-card',
      'debit_card': 'ti ti-credit-card',
      'paypal': 'ti ti-brand-paypal',
      'bank_transfer': 'ti ti-building-bank',
      'stripe': 'ti ti-brand-stripe',
      'razorpay': 'ti ti-wallet',
      'upi': 'ti ti-qrcode'
    };
    return iconConfig[method.toLowerCase()] || 'ti ti-credit-card';
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    if (currency === 'INR' || currency === '₹') {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    return `$${amount.toLocaleString('en-US')}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (error || !transaction) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="card">
              <div className="card-body p-5">
                <i className="ti ti-exclamation-triangle text-warning" style={{ fontSize: '48px' }}></i>
                <h4 className="mt-3">Transaction Not Found</h4>
                <p className="text-muted">
                  {error || `The transaction with ID "${transactionId}" could not be found.`}
                </p>
                <div className="d-flex gap-2 justify-content-center mt-4">
                  <button className="btn btn-outline-primary" onClick={fetchTransactionDetails}>
                    <i className="ti ti-refresh me-2"></i>Retry
                  </button>
                  <Link to="/super-admin/transactions" className="btn btn-primary">
                    <i className="ti ti-arrow-left me-2"></i>Back to Transactions
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Transaction Details</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/super-admin/transactions">Transactions</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {transaction.transactionId}
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchTransactionDetails}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => navigate(-1)}
              title="Go Back"
            >
              <i className="ti ti-arrow-left"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Details Card */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">Transaction Information</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Transaction ID</label>
                    <div className="fw-medium">{transaction.transactionId}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted">School</label>
                    <div>
                      <div className="fw-medium">{transaction.schoolId.name}</div>
                      {transaction.schoolId.code && (
                        <small className="text-muted">Code: {transaction.schoolId.code}</small>
                      )}
                    </div>
                  </div>
                  {transaction.subscriptionId && (
                    <div className="mb-3">
                      <label className="form-label text-muted">Plan</label>
                      <div className="fw-medium">{transaction.subscriptionId.planId.name}</div>
                    </div>
                  )}
                  {transaction.invoiceId && (
                    <div className="mb-3">
                      <label className="form-label text-muted">Invoice ID</label>
                      <div className="fw-medium">{transaction.invoiceId}</div>
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Amount</label>
                    <div className="fw-medium fs-5 text-primary">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted">Status</label>
                    <div>
                      <span className={`badge ${getStatusBadge(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted">Transaction Date</label>
                    <div className="fw-medium">{formatDate(transaction.createdAt)}</div>
                  </div>
                  {transaction.paidAt && (
                    <div className="mb-3">
                      <label className="form-label text-muted">Paid At</label>
                      <div className="fw-medium">{formatDate(transaction.paidAt)}</div>
                    </div>
                  )}
                </div>
              </div>

              {transaction.description && (
                <div className="mt-3">
                  <label className="form-label text-muted">Description</label>
                  <div className="fw-medium">{transaction.description}</div>
                </div>
              )}

              {transaction.status === 'failed' && transaction.failureReason && (
                <div className="alert alert-danger mt-3">
                  <strong>Failure Reason:</strong> {transaction.failureReason}
                </div>
              )}

              {transaction.status === 'refunded' && (
                <div className="alert alert-info mt-3">
                  <div className="row">
                    <div className="col-md-6">
                      <strong>Refund Amount:</strong> {formatCurrency(transaction.refundAmount || 0, transaction.currency)}
                    </div>
                    {transaction.refundedAt && (
                      <div className="col-md-6">
                        <strong>Refunded At:</strong> {formatDate(transaction.refundedAt)}
                      </div>
                    )}
                  </div>
                  {transaction.refundReason && (
                    <div className="mt-2">
                      <strong>Refund Reason:</strong> {transaction.refundReason}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">Payment Information</h4>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label text-muted">Payment Method</label>
                <div className="d-flex align-items-center">
                  <i className={`${getPaymentIcon(transaction.paymentMethod)} me-2 fs-5`}></i>
                  <span className="fw-medium">
                    {transaction.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>

              {transaction.paymentGateway && (
                <div className="mb-3">
                  <label className="form-label text-muted">Payment Gateway</label>
                  <div className="fw-medium">
                    {transaction.paymentGateway.charAt(0).toUpperCase() + transaction.paymentGateway.slice(1)}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label text-muted">Currency</label>
                <div className="fw-medium">{transaction.currency}</div>
              </div>

              {transaction.createdBy && (
                <div className="mb-3">
                  <label className="form-label text-muted">Created By</label>
                  <div>
                    <div className="fw-medium">{transaction.createdBy.name}</div>
                    <small className="text-muted">{transaction.createdBy.email}</small>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label text-muted">Last Updated</label>
                <div className="fw-medium">{formatDate(transaction.updatedAt)}</div>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="card mt-3">
            <div className="card-header">
              <h4 className="card-title mb-0">Actions</h4>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {transaction.invoiceId && (
                  <Link 
                    to={`/super-admin/invoices/${transaction.invoiceId}`}
                    className="btn btn-outline-primary"
                  >
                    <i className="ti ti-file-invoice me-2"></i>
                    View Invoice
                  </Link>
                )}
                <Link 
                  to={`/super-admin/schools/${transaction.schoolId._id}`}
                  className="btn btn-outline-primary"
                >
                  <i className="ti ti-building me-2"></i>
                  View School
                </Link>
                {transaction.status === 'completed' && (
                  <button className="btn btn-outline-warning">
                    <i className="ti ti-receipt-refund me-2"></i>
                    Process Refund
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TransactionDetailsPage;
