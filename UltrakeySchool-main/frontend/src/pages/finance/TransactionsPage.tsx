import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface Transaction {
  id: string;
  description: string;
  date: string;
  amount: number;
  type: string;
  method: string;
  status: 'Completed' | 'Pending' | string;
}

const formatCurrency = (value: number) => `${value.toLocaleString()}`;
const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(transactions.map(t => t.id));
    } else {
      setSelectedRows([]);
    }
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'badge-soft-success';
      case 'Pending':
        return 'badge-soft-warning';
      default:
        return 'badge-soft-secondary';
    }
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/finance/transactions');
        if (response.data.success) {
          const payload = response.data.data?.transactions ?? [];
          setTransactions(payload.map((txn: any) => ({
            id: txn._id ?? txn.id ?? txn.transactionId,
            description: txn.description ?? txn.purpose ?? 'Transaction',
            date: txn.processedAt ? formatDate(txn.processedAt) : formatDate(txn.processedAt ?? new Date()),
            amount: txn.amount ?? txn.totalAmount ?? 0,
            type: txn.type ? txn.type.charAt(0).toUpperCase() + txn.type.slice(1) : 'Income',
            method: txn.paymentMethod ?? txn.method ?? 'N/A',
            status: txn.status ? txn.status.charAt(0).toUpperCase() + txn.status.slice(1) : 'Pending'
          })));
        } else {
          setError(response.data.message || 'Failed to fetch transactions');
        }
      } catch (err: any) {
        setError(err.response?.data?.message ?? err.message ?? 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    setSelectedRows(prev => prev.filter(id => transactions.some(txn => txn.id === id)));
  }, [transactions]);

  return (
    <>
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
                <a href="#!">Finance & Accounts</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Transactions
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <a
              href="#"
              className="btn btn-outline-light bg-white btn-icon me-1"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </a>
          </div>
          <div className="pe-1 mb-2">
            <button
              type="button"
              className="btn btn-outline-light bg-white btn-icon me-1"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Print"
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <a
              href="#"
              className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-file-export me-2"></i>Export
            </a>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <a href="#" className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </a>
              </li>
              <li>
                <a href="#" className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Transactions List</h4>
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
          </div>
        </div>

        <div className="card-body p-0 py-3">
          {error && (
            <div className="alert alert-danger m-3">
              <i className="ti ti-alert-circle me-2" />
              {error}
            </div>
          )}
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
                        onChange={toggleSelectAll}
                        checked={
                          selectedRows.length === transactions.length &&
                          transactions.length > 0
                        }
                      />
                    </div>
                  </th>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Transaction Date</th>
                  <th>Amount</th>
                  <th>Transaction Type</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <p className="text-muted mb-0">No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(transaction.id)}
                            onChange={() => toggleRowSelection(transaction.id)}
                          />
                        </div>
                      </td>
                      <td>
                        <Link to={`/transaction/${transaction.id}`} className="link-primary">
                          {transaction.id.slice(-6)}
                        </Link>
                      </td>
                      <td>{transaction.description}</td>
                      <td>{transaction.date}</td>
                      <td>${formatCurrency(transaction.amount)}</td>
                      <td>{transaction.type}</td>
                      <td>{transaction.method}</td>
                      <td>
                        <span
                          className={`badge ${getStatusBadgeClass(
                            transaction.status
                          )} d-inline-flex align-items-center`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default TransactionsPage;
