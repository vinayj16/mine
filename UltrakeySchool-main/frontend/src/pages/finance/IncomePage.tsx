import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import { exportToPDF, exportToExcel, type ExportColumn } from '../../utils/exportUtils';

interface Income {
  id: string;
  name: string;
  description: string;
  source: string;
  date: string;
  amount: number;
  invoiceNo: string;
  paymentMethod: string;
}

const IncomePage: React.FC = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedIncomes, setSelectedIncomes] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', source: '', date: '', amount: '', invoiceNo: '', paymentMethod: '', description: '' });
  const [editFormData, setEditFormData] = useState({ id: '', name: '', source: '', date: '', amount: '', invoiceNo: '', paymentMethod: '', description: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/finance/transactions', { ...formData, type: 'income' });
      if (response.data.success) {
        toast.success('Income added successfully');
        setShowAddModal(false);
        setFormData({ name: '', source: '', date: '', amount: '', invoiceNo: '', paymentMethod: '', description: '' });
        fetchIncomes();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add income');
    }
  };

  const handleEditIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.put(`/finance/transactions/${editFormData.id}`, editFormData);
      if (response.data.success) {
        toast.success('Income updated successfully');
        setShowEditModal(false);
        fetchIncomes();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update income');
    }
  };

  const handleDeleteIncomes = async () => {
    try {
      await Promise.all(selectedIncomes.map(id => apiClient.delete(`/finance/transactions/${id}`)));
      toast.success('Incomes deleted successfully');
      setShowDeleteModal(false);
      setSelectedIncomes([]);
      fetchIncomes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete incomes');
    }
  };

  const openEditModal = (income: Income) => {
    setEditFormData({
      id: income.id,
      name: income.name,
      source: income.source,
      date: income.date,
      amount: String(income.amount),
      invoiceNo: income.invoiceNo,
      paymentMethod: income.paymentMethod,
      description: income.description
    });
    setShowEditModal(true);
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/finance/transactions', {
        params: { type: 'income' }
      });
      
      if (response.data.success) {
        const transactions = response.data.data?.transactions || response.data.data || [];
        setIncomes(transactions.map((transaction: any) => ({
          id: transaction._id || transaction.id,
          name: transaction.description || transaction.name || 'Income',
          description: transaction.description || '',
          source: transaction.source || transaction.category || 'N/A',
          date: transaction.date || transaction.createdAt,
          amount: transaction.amount || 0,
          invoiceNo: transaction.invoiceNo || transaction.reference || 'N/A',
          paymentMethod: transaction.paymentMethod || transaction.method || 'N/A'
        })));
      } else {
        setError(response.data.message || 'Failed to load income records');
      }
    } catch (err: any) {
      console.error('Error fetching income:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load income records');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedIncomes(incomes.map(income => income.id));
    } else {
      setSelectedIncomes([]);
    }
  };

  const toggleIncomeSelection = (id: string) => {
    if (selectedIncomes.includes(id)) {
      setSelectedIncomes(selectedIncomes.filter(incomeId => incomeId !== id));
    } else {
      setSelectedIncomes([...selectedIncomes, id]);
    }
  };

  useEffect(() => {
    setSelectedIncomes(prev => prev.filter(id => incomes.some(income => income.id === id)));
  }, [incomes]);

  useEffect(() => {
    setSelectAll(incomes.length > 0 && selectedIncomes.length === incomes.length);
  }, [incomes, selectedIncomes]);

  const handleExport = (type: 'pdf' | 'excel') => {
    if (!incomes.length) { toast.error('No data to export'); return; }
    const exportData = incomes.map(income => ({
      'Name': income.name,
      'Source': income.source,
      'Date': formatDate(income.date),
      'Amount': income.amount,
      'Invoice No': income.invoiceNo,
      'Payment Method': income.paymentMethod
    }));
    const columns: ExportColumn[] = [
      { key: 'Name', label: 'Name' },
      { key: 'Source', label: 'Source' },
      { key: 'Date', label: 'Date' },
      { key: 'Amount', label: 'Amount' },
      { key: 'Invoice No', label: 'Invoice No' },
      { key: 'Payment Method', label: 'Payment Method' }
    ];
    if (type === 'pdf') {
      exportToPDF(exportData, 'income', columns, 'Income Report');
    } else {
      exportToExcel(exportData, 'income', columns);
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
          <h3 className="page-title mb-1">Income</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <a href="#!">Finance & Accounts</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Income</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={fetchIncomes}
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
                <button className="dropdown-item rounded-1" onClick={() => handleExport('pdf')}>
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1" onClick={() => handleExport('excel')}>
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
              <i className="ti ti-square-rounded-plus me-2"></i>Add Income
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Income List</h4>
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
                          <label className="form-label">Source</label>
                          <select className="form-select">
                            <option value="">Select</option>
                            {Array.from(new Set(incomes.map(income => income.source))).map(source => (
                              <option key={source} value={source}>{source}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Payment Method</label>
                          <select className="form-select">
                            <option value="">Select</option>
                            {Array.from(new Set(incomes.map(income => income.paymentMethod))).map(method => (
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
                  <th>Source</th>
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
                ) : incomes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <p className="text-muted mb-0">No income records found</p>
                    </td>
                  </tr>
                ) : (
                  incomes.map((income) => (
                    <tr key={income.id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            checked={selectedIncomes.includes(income.id)}
                            onChange={() => toggleIncomeSelection(income.id)}
                          />
                        </div>
                      </td>
                      <td><a href="#!" className="link-primary">{income.id.slice(-6)}</a></td>
                      <td>{income.name}</td>
                      <td>{income.source}</td>
                      <td>{formatDate(income.date)}</td>
                      <td>₹{income.amount.toLocaleString()}</td>
                      <td>{income.invoiceNo}</td>
                      <td>{income.paymentMethod}</td>
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
                                  onClick={() => openEditModal(income)}
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

      {/* Add Income Modal */}
      {showAddModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Income</h4>
                <button type="button" className="btn-close custom-btn-close" onClick={() => setShowAddModal(false)}>
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddIncome}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter income name" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Source</label>
                        <input type="text" className="form-control" name="source" value={formData.source} onChange={handleInputChange} placeholder="Enter source" />
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
                          <option value="UPI">UPI</option>
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
                  <button type="submit" className="btn btn-primary">Add Income</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Income Modal */}
      {showEditModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Income</h4>
                <button type="button" className="btn-close custom-btn-close" onClick={() => setShowEditModal(false)}>
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditIncome}>
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
                        <label className="form-label">Source</label>
                        <input type="text" className="form-control" name="source" value={editFormData.source} onChange={handleEditInputChange} />
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
                          <option value="UPI">UPI</option>
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
                  <button type="button" className="btn btn-danger" onClick={handleDeleteIncomes}>Yes, Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IncomePage;

