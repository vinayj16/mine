import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { exportToPDF, exportToExcel, type ExportColumn } from '../../utils/exportUtils';
import { toast } from 'react-toastify';

interface Expense {
  id: string;
  name: string;
  description: string;
  category: string;
  date: string;
  amount: number;
  invoiceNo: string;
  paymentMethod: string;
}

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: '', date: '', amount: '', invoiceNo: '', paymentMethod: '', description: '' });
  const [editFormData, setEditFormData] = useState({ id: '', name: '', category: '', date: '', amount: '', invoiceNo: '', paymentMethod: '', description: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/finance/transactions', { ...formData, type: 'expense' });
      if (response.data.success) {
        toast.success('Expense added successfully');
        setShowAddModal(false);
        setFormData({ name: '', category: '', date: '', amount: '', invoiceNo: '', paymentMethod: '', description: '' });
        fetchExpenses();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.put(`/finance/transactions/${editFormData.id}`, editFormData);
      if (response.data.success) {
        toast.success('Expense updated successfully');
        setShowEditModal(false);
        fetchExpenses();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update expense');
    }
  };

  const handleDeleteExpenses = async () => {
    try {
      await Promise.all(selectedExpenses.map(id => apiClient.delete(`/finance/transactions/${id}`)));
      toast.success('Expenses deleted successfully');
      setShowDeleteModal(false);
      setSelectedExpenses([]);
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete expenses');
    }
  };

  const openEditModal = (expense: Expense) => {
    setEditFormData({
      id: expense.id,
      name: expense.name,
      category: expense.category,
      date: expense.date,
      amount: String(expense.amount),
      invoiceNo: expense.invoiceNo,
      paymentMethod: expense.paymentMethod,
      description: expense.description
    });
    setShowEditModal(true);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/finance/transactions', {
        params: { type: 'expense' }
      });

      if (response.data.success) {
        const data = response.data.data?.transactions || response.data.data || [];
        const transactions = Array.isArray(data) ? data : [];
        setExpenses(transactions.map((transaction: any) => ({
          id: transaction._id || transaction.id,
          name: transaction.description || transaction.name || 'Expense',
          description: transaction.description || '',
          category: transaction.category || 'N/A',
          date: transaction.date || transaction.createdAt,
          amount: transaction.amount || 0,
          invoiceNo: transaction.invoiceNo || transaction.reference || 'N/A',
          paymentMethod: transaction.paymentMethod || transaction.method || 'N/A'
        })));
      } else {
        setError(response.data.message || 'Failed to load expense records');
      }
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load expense records');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedExpenses(expenses.map(expense => expense.id));
    } else {
      setSelectedExpenses([]);
    }
  };

  const toggleExpenseSelection = (id: string) => {
    if (selectedExpenses.includes(id)) {
      setSelectedExpenses(selectedExpenses.filter(expenseId => expenseId !== id));
    } else {
      setSelectedExpenses([...selectedExpenses, id]);
    }
  };

  useEffect(() => {
    setSelectedExpenses(prev => prev.filter(id => expenses.some(expense => expense.id === id)));
  }, [expenses]);

  useEffect(() => {
    setSelectAll(expenses.length > 0 && selectedExpenses.length === expenses.length);
  }, [expenses, selectedExpenses]);

  const exportColumns: ExportColumn[] = [
    { key: 'expenseId', label: 'Expense ID', format: (v, row) => v || row._id?.slice(-6) },
    { key: 'category', label: 'Category', format: (_, row) => row.category?.name || row.category || 'N/A' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', format: (v, row) => { const a = v || row.totalAmount || 0; return `₹${Number(a).toFixed(2)}`; } },
    { key: 'date', label: 'Date', format: (v, row) => { const d = v || row.expenseDate || row.createdAt; return d ? new Date(d).toLocaleDateString() : '-'; } },
    { key: 'paymentMethod', label: 'Payment Method', format: (v) => v || '-' },
    { key: 'status', label: 'Status' },
  ];

  const handleExport = (type: 'pdf' | 'excel') => {
    const data = expenses || [];
    if (!data.length) { toast.error('No data to export'); return; }
    if (type === 'pdf') {
      exportToPDF(data, 'expenses', exportColumns, 'Expenses Report');
    } else {
      exportToExcel(data, 'expenses', exportColumns);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Expenses</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <a href="#!">Finance & Accounts</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Expenses</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchExpenses}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button
              type="button"
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
              title="Print"
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
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button
              className="btn btn-primary d-flex align-items-center"
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus me-2"></i>Add Expense
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Expense List</h4>
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
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
              >
                <i className="ti ti-filter me-2"></i>Filter
              </button>
              <div className="dropdown-menu drop-width">
                <form>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 pb-0 border-bottom">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Category</label>
                          <select className="form-select">
                            <option value="">Select</option>
                            {Array.from(new Set(expenses.map(expense => expense.category))).map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Payment Method</label>
                          <select className="form-select">
                            <option value="">Select</option>
                            {Array.from(new Set(expenses.map(expense => expense.paymentMethod))).map(method => (
                              <option key={method} value={method}>{method}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 d-flex align-items-center justify-content-end">
                    <button type="button" className="btn btn-light me-3">Reset</button>
                    <button type="submit" className="btn btn-primary">Apply</button>
                  </div>
                </form>
              </div>
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
                  <button className="dropdown-item rounded-1 active">
                    Ascending
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Descending
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Recently Added
                  </button>
                </li>
              </ul>
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
                        checked={selectAll}
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Invoice No</th>
                  <th>Payment Method</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <p className="text-muted mb-0">No expense records found</p>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedExpenses.includes(expense.id)}
                            onChange={() => toggleExpenseSelection(expense.id)}
                          />
                        </div>
                      </td>
                      <td><a href="#!" className="link-primary">{expense.id.slice(-6)}</a></td>
                      <td>{expense.name}</td>
                      <td>{typeof expense.category === 'object' ? expense.category?.name || '-' : expense.category}</td>
                      <td>{formatDate(expense.date)}</td>
                      <td>₹{expense.amount.toLocaleString()}</td>
                      <td>{expense.invoiceNo}</td>
                      <td>{expense.paymentMethod}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="dropdown">
                            <button
                              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i className="ti ti-dots-vertical fs-14"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-right p-3">
                              <li>
                                <button
                                  className="dropdown-item rounded-1"
                                  onClick={() => openEditModal(expense)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item rounded-1"
                                  onClick={() => setShowDeleteModal(true)}
                                >
                                  <i className="ti ti-trash-x me-2"></i>Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Expense</h4>
                <button type="button" className="btn-close custom-btn-close" onClick={() => setShowAddModal(false)}>
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddExpense}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter expense name" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Category</label>
                        <select className="form-select" name="category" value={formData.category} onChange={handleInputChange}>
                          <option value="">Select</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Salaries">Salaries</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Supplies">Supplies</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Date</label>
                        <input type="date" className="form-control" name="date" value={formData.date} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Amount</label>
                        <input type="number" className="form-control" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="Enter amount" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Invoice No</label>
                        <input type="text" className="form-control" name="invoiceNo" value={formData.invoiceNo} onChange={handleInputChange} placeholder="Enter invoice number" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Payment Method</label>
                        <select className="form-select" name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}>
                          <option value="">Select</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Debit Card">Debit Card</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-0">
                        <label className="form-label">Description</label>
                        <textarea rows={3} className="form-control" name="description" value={formData.description} onChange={handleInputChange} placeholder="Enter description"></textarea>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Expense</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Expense</h4>
                <button type="button" className="btn-close custom-btn-close" onClick={() => setShowEditModal(false)}>
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditExpense}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input type="text" className="form-control" name="name" value={editFormData.name} onChange={handleEditInputChange} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Category</label>
                        <select className="form-select" name="category" value={editFormData.category} onChange={handleEditInputChange}>
                          <option value="">Select</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Salaries">Salaries</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Supplies">Supplies</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Date</label>
                        <input type="date" className="form-control" name="date" value={editFormData.date} onChange={handleEditInputChange} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Amount</label>
                        <input type="number" className="form-control" name="amount" value={editFormData.amount} onChange={handleEditInputChange} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Invoice No</label>
                        <input type="text" className="form-control" name="invoiceNo" value={editFormData.invoiceNo} onChange={handleEditInputChange} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Payment Method</label>
                        <select className="form-select" name="paymentMethod" value={editFormData.paymentMethod} onChange={handleEditInputChange}>
                          <option value="">Select</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Debit Card">Debit Card</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-0">
                        <label className="form-label">Description</label>
                        <textarea rows={3} className="form-control" name="description" value={editFormData.description} onChange={handleEditInputChange}></textarea>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </span>
                <h4>Confirm Deletion</h4>
                <p>You want to delete all the marked items, this can't be undone once you delete.</p>
                <div className="d-flex justify-content-center">
                  <button type="button" className="btn btn-light me-3" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteExpenses}>Yes, Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpensesPage;
