import React, { useState, useEffect } from 'react';
import ConfirmModal from '../../components/common/ConfirmModal';
import budgetService from '../../services/budgetService';
import type { Budget } from '../../services/budgetService';
import { toast } from 'react-toastify';
import { exportToPDF, exportToExcel, type ExportColumn } from '../../utils/exportUtils';
import { getInstitutionId } from '../../utils/auth';

const BudgetsPage: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [plannedAmount, setPlannedAmount] = useState<number>(0);
  const [spentAmount, setSpentAmount] = useState<number>(0);
  const [academicYear, setAcademicYear] = useState<string>('');
  const [category, setCategory] = useState<string>('academics');
  const [status, setStatus] = useState<'draft' | 'approved' | 'active' | 'closed'>('active');
  const [description, setDescription] = useState<string>('');

  const categories = [
    { value: 'academics', label: 'Academics' },
    { value: 'infrastructure', label: 'Infrastructure & Labs' },
    { value: 'events', label: 'Events & Sports' },
    { value: 'salary', label: 'Staff Salaries' },
    { value: 'utilities', label: 'Utilities & General Office' },
    { value: 'other', label: 'Other Expenses' }
  ];

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const data: any = await budgetService.getAll({ institutionId: getInstitutionId() });
      setBudgets(data?.budgets || data?.data?.budgets || []);
    } catch (error: any) {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setTitle('');
    setPlannedAmount(0);
    setSpentAmount(0);
    setAcademicYear(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
    setCategory('academics');
    setStatus('active');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (budget: Budget) => {
    setIsEditing(true);
    setCurrentId(budget._id || null);
    setTitle(budget.title);
    setPlannedAmount(budget.plannedAmount);
    setSpentAmount(budget.spentAmount || 0);
    setAcademicYear(budget.academicYear);
    setCategory(budget.category);
    setStatus(budget.status);
    setDescription(budget.description || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !academicYear) {
      toast.warn('Please fill in all required fields');
      return;
    }
    const payload: Budget = {
      title,
      plannedAmount,
      spentAmount,
      academicYear,
      category,
      status,
      description
    };

    try {
      if (isEditing && currentId) {
        await budgetService.update(currentId, payload);
        toast.success('Budget record updated successfully');
      } else {
        await budgetService.create(payload);
        toast.success('Budget record created successfully');
      }
      setShowModal(false);
      fetchBudgets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    setShowDeleteModal(true);
    setDeleteTarget(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await budgetService.delete(deleteTarget);
      toast.success('Budget record deleted successfully');
      fetchBudgets();
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error('Failed to delete budget record');
    }
  };

  const getStatusClass = (statusStr: string) => {
    switch (statusStr) {
      case 'active': return 'bg-success-soft text-success';
      case 'approved': return 'bg-info-soft text-info';
      case 'draft': return 'bg-warning-soft text-warning';
      case 'closed': return 'bg-secondary-soft text-secondary';
      default: return 'bg-light text-secondary';
    }
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    if (!budgets.length) {
      toast.error('No budget data to export');
      return;
    }

    const exportData = budgets.map((budget) => ({
      Title: budget.title,
      Category: categories.find((item) => item.value === budget.category)?.label || budget.category,
      'Academic Year': budget.academicYear,
      'Planned Amount': budget.plannedAmount,
      'Spent Amount': budget.spentAmount || 0,
      Remaining: budget.plannedAmount - (budget.spentAmount || 0),
      Status: budget.status,
      Description: budget.description || ''
    }));

    const columns: ExportColumn[] = [
      { key: 'Title', label: 'Title' },
      { key: 'Category', label: 'Category' },
      { key: 'Academic Year', label: 'Academic Year' },
      { key: 'Planned Amount', label: 'Planned Amount' },
      { key: 'Spent Amount', label: 'Spent Amount' },
      { key: 'Remaining', label: 'Remaining' },
      { key: 'Status', label: 'Status' },
      { key: 'Description', label: 'Description' }
    ];

    if (type === 'pdf') {
      exportToPDF(exportData, 'budgets', columns, 'Budget & Allocation Report');
    } else {
      exportToExcel(exportData, 'budgets', columns);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ minHeight: '85vh' }}>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>Budget & Allocation</h2>
          <p className="text-muted mb-0">Monitor planned institutional allocations versus actual spends dynamically.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="dropdown">
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center shadow-sm px-4 py-2" style={{ borderRadius: '10px', fontWeight: 500 }} data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2"></i>
              Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item rounded-1" onClick={() => handleExport('pdf')}>
                  <i className="ti ti-file-type-pdf me-2"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1" onClick={() => handleExport('excel')}>
                  <i className="ti ti-file-type-xls me-2"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <button
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm px-4 py-2"
            style={{ borderRadius: '10px', fontWeight: 500 }}
            onClick={openAddModal}
          >
            <i className="ti ti-plus fs-5"></i> Create New Budget
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-primary text-white" style={{ borderRadius: '16px' }}>
            <span className="text-white-50 fw-semibold fs-7 uppercase d-block mb-1">Total Budget Allocated</span>
            <h3 className="fw-bold mb-0">
              ₹{budgets.reduce((acc, b) => acc + b.plannedAmount, 0).toLocaleString()}
            </h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white text-dark" style={{ borderRadius: '16px' }}>
            <span className="text-secondary fw-semibold fs-7 uppercase d-block mb-1">Total Spent Amount</span>
            <h3 className="fw-bold mb-0 text-danger">
              ₹{budgets.reduce((acc, b) => acc + b.spentAmount, 0).toLocaleString()}
            </h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white text-dark" style={{ borderRadius: '16px' }}>
            <span className="text-secondary fw-semibold fs-7 uppercase d-block mb-1">Total Budget Remaining</span>
            <h3 className="fw-bold mb-0 text-success">
              ₹{budgets.reduce((acc, b) => acc + (b.plannedAmount - b.spentAmount), 0).toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Budget Grid List */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fw-semibold text-dark">Institutional Budgets</h5>
          <span className="badge bg-indigo-soft text-indigo px-3 py-2 rounded-pill fw-medium">
            {budgets.length} Categories
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary uppercase fs-7">
              <tr>
                <th className="px-4 py-3">Budget Title</th>
                <th className="py-3">Category</th>
                <th className="py-3">Academic Year</th>
                <th className="py-3">Planned Amount</th>
                <th className="py-3">Spent Amount</th>
                <th className="py-3">Progress / Usage</th>
                <th className="py-3">Status</th>
                <th className="px-4 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted mb-0">Loading budgets...</p>
                  </td>
                </tr>
              ) : budgets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <i className="ti ti-chart-pie-off fs-1 d-block mb-3 opacity-40"></i>
                    No budgets generated yet.
                  </td>
                </tr>
              ) : (
                budgets.map((budget) => {
                  const spendPercent = budget.plannedAmount > 0
                    ? Math.min(Math.round((budget.spentAmount / budget.plannedAmount) * 100), 100)
                    : 0;

                  return (
                    <tr key={budget._id}>
                      <td className="px-4">
                        <div>
                          <h6 className="mb-0 fw-semibold text-dark">{budget.title}</h6>
                          <span className="text-muted fs-7">{budget.description || 'No description'}</span>
                        </div>
                      </td>
                      <td className="text-capitalize text-dark fw-medium">{budget.category}</td>
                      <td className="text-dark">{budget.academicYear}</td>
                      <td className="fw-semibold text-dark">₹{budget.plannedAmount.toLocaleString()}</td>
                      <td className="text-danger fw-semibold">₹{budget.spentAmount.toLocaleString()}</td>
                      <td style={{ minWidth: '150px' }}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '6px', borderRadius: '3px' }}>
                            <div
                              className={`progress-bar ${spendPercent > 90 ? 'bg-danger' : spendPercent > 70 ? 'bg-warning' : 'bg-primary'}`}
                              role="progressbar"
                              style={{ width: `${spendPercent}%` }}
                            ></div>
                          </div>
                          <span className="fs-7 fw-bold text-secondary">{spendPercent}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge px-3 py-1.5 rounded-pill fs-7 text-capitalize ${getStatusClass(budget.status)}`}>
                          {budget.status}
                        </span>
                      </td>
                      <td className="px-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className="btn btn-icon btn-light-soft border-0 rounded-circle"
                            title="Edit"
                            onClick={() => openEditModal(budget)}
                          >
                            <i className="ti ti-pencil text-secondary"></i>
                          </button>
                          <button
                            className="btn btn-icon btn-light-soft border-0 rounded-circle"
                            title="Delete"
                            onClick={() => handleDelete(budget._id!)}
                          >
                            <i className="ti ti-trash text-danger"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Modal Dialog */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark">{isEditing ? 'Edit Budget Record' : 'Create Budget Record'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Title */}
                    <div className="col-12">
                      <label className="form-label fw-medium text-secondary">Budget Title</label>
                      <input
                        type="text"
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    {/* Planned Amount */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Planned Budget (₹)</label>
                      <input
                        type="number"
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={plannedAmount}
                        onChange={(e) => setPlannedAmount(Number(e.target.value))}
                        required
                      />
                    </div>

                    {/* Spent Amount */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Spent Amount (₹)</label>
                      <input
                        type="number"
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={spentAmount}
                        onChange={(e) => setSpentAmount(Number(e.target.value))}
                      />
                    </div>

                    {/* Academic Year */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Academic Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 2026-2027"
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        required
                      />
                    </div>

                    {/* Category */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Category</label>
                      <select
                        className="form-select border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {categories.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div className="col-12">
                      <label className="form-label fw-medium text-secondary">Status</label>
                      <select
                        className="form-select border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                      >
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label fw-medium text-secondary">Description</label>
                      <textarea
                        rows={3}
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 bg-light p-3 px-4 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light shadow-sm px-4 py-2 border" style={{ borderRadius: '10px' }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary shadow-sm px-4 py-2" style={{ borderRadius: '10px' }}>{isEditing ? 'Save Changes' : 'Create Budget'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleDeleteConfirm} message="Are you sure you want to delete this budget?" />
    </div>
  );
};

export default BudgetsPage;
