import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../../api/client'

interface Payroll {
  _id: string
  payrollId: string
  employee: {
    _id: string
    name: string
    email: string
    phone?: string
    avatar?: string
  }
  month: number
  year: number
  basicSalary: number
  allowances: number
  deductions: number
  netSalary: number
  status: 'paid' | 'generated' | 'pending'
  paymentDate?: string
  paymentMethod: 'bank-transfer' | 'cash' | 'cheque'
  notes?: string
  createdAt: string
}

interface FormData {
  employee: string
  month: number
  year: number
  basicSalary: number
  allowances: number
  deductions: number
  status: string
  paymentMethod: string
  notes: string
}

const TeacherSalaryPage: React.FC = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null)
  const [formData, setFormData] = useState<FormData>({
    employee: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    status: 'pending',
    paymentMethod: 'bank-transfer',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchPayrolls = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get('/hrm/payroll', {
        params: { limit: 100 }
      })

      if (response.data.success) {
        setPayrolls(response.data.data.payrolls || [])
      }
    } catch (err: any) {
      console.error('Error fetching payrolls:', err)
      const errorMessage = err.response?.data?.message || 'Failed to load payroll records'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayrolls()
  }, [])

  const handleRefresh = () => {
    fetchPayrolls()
  }

  const handleAddPayroll = () => {
    setShowAddModal(true)
    setFormData({
      employee: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      status: 'pending',
      paymentMethod: 'bank-transfer',
      notes: ''
    })
  }

  const handleEditPayroll = (payroll: Payroll) => {
    setEditingPayroll(payroll)
    setFormData({
      employee: payroll.employee._id,
      month: payroll.month,
      year: payroll.year,
      basicSalary: payroll.basicSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      status: payroll.status,
      paymentMethod: payroll.paymentMethod,
      notes: payroll.notes || ''
    })
    setShowEditModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setEditingPayroll(null)
    setFormData({
      employee: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      status: 'pending',
      paymentMethod: 'bank-transfer',
      notes: ''
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = (): boolean => {
    if (!formData.employee) {
      toast.error('Employee is required')
      return false
    }
    if (!formData.month || formData.month < 1 || formData.month > 12) {
      toast.error('Valid month is required (1-12)')
      return false
    }
    if (!formData.year || formData.year < 2000) {
      toast.error('Valid year is required')
      return false
    }
    if (formData.basicSalary < 0) {
      toast.error('Basic salary must be positive')
      return false
    }
    return true
  }

  const handleSubmitPayroll = async () => {
    if (!validateForm()) return

    try {
      setSubmitting(true)

      const netSalary = parseFloat(formData.basicSalary.toString()) + 
                       parseFloat(formData.allowances.toString()) - 
                       parseFloat(formData.deductions.toString())

      const payrollData = {
        employee: formData.employee,
        month: parseInt(formData.month.toString()),
        year: parseInt(formData.year.toString()),
        basicSalary: parseFloat(formData.basicSalary.toString()),
        allowances: parseFloat(formData.allowances.toString()),
        deductions: parseFloat(formData.deductions.toString()),
        netSalary,
        status: formData.status,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes.trim() || undefined
      }

      if (showEditModal && editingPayroll) {
        const response = await apiClient.put(`/hrm/payroll/${editingPayroll._id}`, payrollData)
        if (response.data.success) {
          toast.success('Payroll updated successfully')
          handleCloseModal()
          fetchPayrolls()
        }
      } else {
        const response = await apiClient.post('/hrm/payroll', payrollData)
        if (response.data.success) {
          toast.success('Payroll created successfully')
          handleCloseModal()
          fetchPayrolls()
        }
      }
    } catch (err: any) {
      console.error('Error saving payroll:', err)
      const errorMessage = err.response?.data?.message || 'Failed to save payroll'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePayroll = async (payrollId: string) => {
    if (!window.confirm('Are you sure you want to delete this payroll record?')) {
      return
    }

    try {
      const response = await apiClient.delete(`/hrm/payroll/${payrollId}`)
      if (response.data.success) {
        toast.success('Payroll deleted successfully')
        fetchPayrolls()
      }
    } catch (err: any) {
      console.error('Error deleting payroll:', err)
      const errorMessage = err.response?.data?.message || 'Failed to delete payroll'
      toast.error(errorMessage)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="badge bg-success">Paid</span>
      case 'generated':
        return <span className="badge bg-info">Generated</span>
      case 'pending':
        return <span className="badge bg-warning">Pending</span>
      default:
        return <span className="badge bg-secondary">{status}</span>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month - 1] || month
  }

  return (
    <div>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Teacher Salaries</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item active">Teacher Salaries</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button 
            className="btn btn-outline-light bg-white btn-icon me-2"
            onClick={handleRefresh}
            disabled={loading}
          >
            <i className="ti ti-refresh" />
          </button>
          <button className="btn btn-primary d-flex align-items-center" onClick={handleAddPayroll}>
            <i className="ti ti-square-rounded-plus me-2" />
            Add Payroll
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="mb-0">Payroll Records</h4>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading payroll records...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <i className="ti ti-alert-circle me-2"></i>
              {error}
              <button
                className="btn btn-sm btn-outline-danger ms-3"
                onClick={fetchPayrolls}
              >
                <i className="ti ti-refresh me-1"></i>Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && payrolls.length === 0 && (
          <div className="card-body text-center py-5">
            <i className="ti ti-cash" style={{ fontSize: '48px', color: '#ccc' }}></i>
            <p className="mt-2 text-muted">No payroll records found</p>
            <button className="btn btn-primary mt-2" onClick={handleAddPayroll}>
              <i className="ti ti-square-rounded-plus me-2" />
              Add First Payroll
            </button>
          </div>
        )}

        {/* Payroll Table */}
        {!loading && !error && payrolls.length > 0 && (
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Payroll ID</th>
                    <th>Employee</th>
                    <th>Period</th>
                    <th>Basic Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((payroll) => (
                    <tr key={payroll._id}>
                      <td className="text-primary">{payroll.payrollId}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-sm me-2">
                            {payroll.employee.avatar ? (
                              <img 
                                src={payroll.employee.avatar} 
                                className="img-fluid rounded-circle" 
                                alt={payroll.employee.name}
                              />
                            ) : (
                              <div className="d-flex align-items-center justify-content-center w-100 h-100 bg-light rounded-circle">
                                <i className="ti ti-user fs-12 text-muted"></i>
                              </div>
                            )}
                          </span>
                          <div>
                            <p className="text-dark mb-0">{payroll.employee.name}</p>
                            <small className="text-muted">{payroll.employee.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{getMonthName(payroll.month)} {payroll.year}</td>
                      <td>{formatCurrency(payroll.basicSalary)}</td>
                      <td>{formatCurrency(payroll.allowances)}</td>
                      <td>{formatCurrency(payroll.deductions)}</td>
                      <td className="fw-bold">{formatCurrency(payroll.netSalary)}</td>
                      <td>{getStatusBadge(payroll.status)}</td>
                      <td>
                        <div className="dropdown">
                          <button 
                            className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0" 
                            data-bs-toggle="dropdown"
                          >
                            <i className="ti ti-dots-vertical fs-14" />
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end p-3">
                            <li>
                              <button 
                                className="dropdown-item rounded-1"
                                onClick={() => handleEditPayroll(payroll)}
                              >
                                <i className="ti ti-edit-circle me-2" />
                                Edit
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item rounded-1"
                                onClick={() => handleDeletePayroll(payroll._id)}
                              >
                                <i className="ti ti-trash-x me-2" />
                                Delete
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Payroll Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {showEditModal ? 'Edit Payroll' : 'Add Payroll'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Employee ID *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter employee ID"
                        name="employee"
                        value={formData.employee}
                        onChange={handleInputChange}
                        disabled={showEditModal}
                      />
                      <small className="text-muted">MongoDB ObjectId of the employee</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3">
                      <label className="form-label">Month *</label>
                      <select 
                        className="form-select"
                        name="month"
                        value={formData.month}
                        onChange={handleInputChange}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                          <option key={m} value={m}>{getMonthName(m)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3">
                      <label className="form-label">Year *</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="2024"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        min="2000"
                        max="2100"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Basic Salary *</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="0.00"
                        name="basicSalary"
                        value={formData.basicSalary}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Allowances</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="0.00"
                        name="allowances"
                        value={formData.allowances}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Deductions</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="0.00"
                        name="deductions"
                        value={formData.deductions}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status *</label>
                      <select 
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="pending">Pending</option>
                        <option value="generated">Generated</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Payment Method *</label>
                      <select 
                        className="form-select"
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleInputChange}
                      >
                        <option value="bank-transfer">Bank Transfer</option>
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Notes</label>
                      <textarea 
                        className="form-control" 
                        rows={3} 
                        placeholder="Enter any notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="alert alert-info">
                      <strong>Net Salary:</strong> {formatCurrency(
                        parseFloat(formData.basicSalary.toString() || '0') + 
                        parseFloat(formData.allowances.toString() || '0') - 
                        parseFloat(formData.deductions.toString() || '0')
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  <i className="ti ti-x me-2"></i>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSubmitPayroll}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check me-2"></i>
                      {showEditModal ? 'Update' : 'Create'} Payroll
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherSalaryPage
