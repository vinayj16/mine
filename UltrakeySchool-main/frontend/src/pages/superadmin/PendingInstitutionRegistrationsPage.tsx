import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { institutionRegistrationService } from '../../services'

interface PendingRegistration {
  _id: string
  instituteType: string
  instituteCode: string
  fullName: string
  email: string
  agreedToTerms: boolean
  status: 'pending' | 'approved' | 'rejected'
  registrationDate: string
  reviewedBy?: {
    name: string
    email: string
  }
  reviewedAt?: string
  reviewNotes?: string
  rejectionReason?: string
  institutionId?: string
}

interface RegistrationStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

type ApprovalField = 'email' | 'password' | 'confirmPassword'

interface ApprovalModalState {
  open: boolean
  registration: PendingRegistration | null
  email: string
  password: string
  confirmPassword: string
  notes: string
}

const DEFAULT_APPROVAL_STATE: ApprovalModalState = {
  open: false,
  registration: null,
  email: '',
  password: '',
  confirmPassword: '',
  notes: ''
}

const PendingInstitutionRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([])
  const [stats, setStats] = useState<RegistrationStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [approvalModal, setApprovalModal] = useState<ApprovalModalState>(() => ({ ...DEFAULT_APPROVAL_STATE }))
  const [approvalErrors, setApprovalErrors] = useState<Partial<Record<ApprovalField, string>>>({})
  const [approvalLoading, setApprovalLoading] = useState(false)

  useEffect(() => {
    fetchRegistrations()
    fetchStats()
  }, [filterStatus, currentPage])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const params: { page: number; limit: number; status?: string } = {
        page: currentPage,
        limit: 10
      }

      if (filterStatus !== 'all') {
        params.status = filterStatus
      }

      const response = await institutionRegistrationService.getPendingRegistrations(params)

      if (response.success && response.data) {
        const data = response.data as any
        setRegistrations(data.registrations || [])
      }
    } catch (err) {
      console.error('Error fetching registrations:', err)
      setError('Failed to fetch registrations')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await institutionRegistrationService.getRegistrationStats()
      if (response.success && response.data) {
        const data = response.data as any
        setStats(data.stats || data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const handleSelectRegistration = (registrationId: string) => {
    if (selectedRegistrations.includes(registrationId)) {
      setSelectedRegistrations(selectedRegistrations.filter(id => id !== registrationId))
    } else {
      setSelectedRegistrations([...selectedRegistrations, registrationId])
    }
  }

  const handleSelectAll = () => {
    if (selectedRegistrations.length === registrations.length) {
      setSelectedRegistrations([])
    } else {
      setSelectedRegistrations(registrations.map(r => r._id))
    }
  }

  const handleRejectRegistration = async (registrationId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
      await institutionRegistrationService.rejectRegistration(registrationId, reason)
      toast.success('Registration rejected successfully')
      fetchRegistrations()
      fetchStats()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject registration')
    }
  }

  const handleBulkApprove = () => {
    toast.info('Bulk approval will be implemented with institution creation workflow')
  }

  const handleBulkReject = () => {
    const reason = prompt('Enter rejection reason for selected registrations:')
    if (!reason) return

    // Implement bulk reject
    selectedRegistrations.forEach(async (id) => {
      try {
        await institutionRegistrationService.rejectRegistration(id, reason)
      } catch (error) {
        console.error(`Failed to reject registration ${id}:`, error)
      }
    })

    toast.success(`Rejected ${selectedRegistrations.length} registrations`)
    setSelectedRegistrations([])
    fetchRegistrations()
    fetchStats()
  }

  const openApprovalModal = (registration: PendingRegistration) => {
    setApprovalModal({
      open: true,
      registration,
      email: registration.email,
      password: '',
      confirmPassword: '',
      notes: ''
    })
    setApprovalErrors({})
  }

  const closeApprovalModal = () => {
    setApprovalModal({ ...DEFAULT_APPROVAL_STATE })
    setApprovalErrors({})
  }

  const handleApproveSubmit = async () => {
    if (!approvalModal.registration) return

    const errors: Partial<Record<ApprovalField, string>> = {}

    if (!approvalModal.email) {
      errors.email = 'Email is required'
    }

    if (!approvalModal.password || approvalModal.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (approvalModal.password !== approvalModal.confirmPassword) {
      errors.confirmPassword = 'Passwords must match'
    }

    if (Object.keys(errors).length > 0) {
      setApprovalErrors(errors)
      return
    }

    try {
      setApprovalLoading(true)
      await institutionRegistrationService.approveRegistration(approvalModal.registration._id, {
        ownerEmail: approvalModal.email,
        ownerPassword: approvalModal.password,
        notes: approvalModal.notes.trim()
      })
      toast.success('Access granted and credentials emailed to the owner')
      closeApprovalModal()
      fetchRegistrations()
      fetchStats()
    } catch (error: any) {
      console.error('Approval error:', error)
      toast.error(error?.message || 'Failed to grant access')
    } finally {
      setApprovalLoading(false)
    }
  }

  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch =
      registration.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.instituteCode.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: 'bg-warning',
      approved: 'bg-success',
      rejected: 'bg-danger'
    }
    return statusConfig[status as keyof typeof statusConfig] || 'bg-secondary'
  }

  const getInstituteTypeLabel = (type: string) => {
    const typeLabels = {
      'school': 'School',
      'inter': 'Inter College',
      'degree': 'Degree College',
      'engineering': 'Engineering College'
    }
    return typeLabels[type as keyof typeof typeLabels] || type
  }

  const selectedCount = selectedRegistrations.length
  const totalCount = filteredRegistrations.length

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Pending Institution Registrations</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Registrations</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" onClick={fetchRegistrations}>
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          {selectedCount > 0 && (
            <div className="dropdown me-2 mb-2">
              <button className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                <i className="ti ti-settings me-2"></i>
                Actions ({selectedCount})
              </button>
              <ul className="dropdown-menu dropdown-menu-end p-2">
                <li>
                  <button className="dropdown-item" onClick={handleBulkApprove}>
                    <i className="ti ti-user-check me-2"></i>Approve Selected
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={handleBulkReject}>
                    <i className="ti ti-user-x me-2"></i>Reject Selected
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={() => setSelectedRegistrations([])}
                  >
                    <i className="ti ti-x me-2"></i>Clear Selection
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-primary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{stats.total}</h4>
                  <p className="text-white mb-0">Total Registrations</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-file-text text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-warning">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{stats.pending}</h4>
                  <p className="text-white mb-0">Pending Review</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-clock text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-success">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{stats.approved}</h4>
                  <p className="text-white mb-0">Approved</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-check text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-danger">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{stats.rejected}</h4>
                  <p className="text-white mb-0">Rejected</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-x text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Filters</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Search</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, email, or institute code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-outline-secondary" type="button">
                    <i className="ti ti-search"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All Status</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">&nbsp;</label>
                <button
                  className="btn btn-secondary w-100"
                  onClick={() => {
                    setFilterStatus('pending')
                    setSearchTerm('')
                    setCurrentPage(1)
                  }}
                >
                  <i className="ti ti-refresh me-2"></i>
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="card-title">Institution Registrations ({filteredRegistrations.length})</h4>
          <div className="d-flex align-items-center">
            {selectedCount > 0 && (
              <span className="badge bg-primary me-2">
                {selectedCount} selected
              </span>
            )}
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="selectAll"
                checked={selectedCount === totalCount && totalCount > 0}
                onChange={handleSelectAll}
              />
              <label className="form-check-label" htmlFor="selectAll">
                Select All
              </label>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center p-4 text-danger">
              <i className="ti ti-alert-circle fs-1 d-block mb-2"></i>
              {error}
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center p-4">
              <i className="ti ti-file-x fs-1 text-muted d-block mb-2"></i>
              <h5 className="text-muted">No registrations found</h5>
              <p className="text-muted mb-0">There are no {filterStatus} registrations matching your criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th className="w-1">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="headerSelectAll"
                          checked={selectedCount === totalCount && totalCount > 0}
                          onChange={handleSelectAll}
                        />
                        <label className="form-check-label" htmlFor="headerSelectAll"></label>
                      </div>
                    </th>
                    <th>Institution Details</th>
                    <th>Contact Person</th>
                    <th>Institute Type</th>
                    <th>Status</th>
                    <th>Registration Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((registration) => (
                    <tr key={registration._id}>
                      <td>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRegistrations.includes(registration._id)}
                            onChange={() => handleSelectRegistration(registration._id)}
                          />
                          <label className="form-check-label"></label>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm me-2">
                            <i className="ti ti-building text-primary"></i>
                          </div>
                          <div>
                            <div className="fw-medium">{registration.instituteCode}</div>
                            <small className="text-muted d-block">Code: {registration.instituteCode}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm me-2">
                            <i className="ti ti-user text-info"></i>
                          </div>
                          <div>
                            <div className="fw-medium">{registration.fullName}</div>
                            <small className="text-muted d-block">{registration.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {getInstituteTypeLabel(registration.instituteType)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(registration.status)}`}>
                          {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        {new Date(registration.registrationDate).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            <i className="ti ti-dots-vertical"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <button className="dropdown-item" onClick={() => openApprovalModal(registration)}>
                                <i className="ti ti-check me-2"></i>Approve & Create Account
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item text-danger"
                                onClick={() => handleRejectRegistration(registration._id)}
                              >
                                <i className="ti ti-x me-2"></i>Reject
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
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {approvalModal.open && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content">
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleApproveSubmit()
                  }}
                >
                  <div className="modal-header">
                    <div>
                      <h5 className="modal-title">
                        Create access for {approvalModal.registration?.instituteCode || 'Institution'}
                      </h5>
                      <p className="text-muted mb-0">
                        Owner: {approvalModal.registration?.fullName} · {approvalModal.registration?.email}
                      </p>
                    </div>
                    <button type="button" className="btn-close" aria-label="Close" onClick={closeApprovalModal}></button>
                  </div>
                  <div className="modal-body">
                    {approvalModal.registration && (
                      <div className="alert alert-light border mb-4">
                        <strong className="d-block mb-1">Registration snapshot</strong>
                        <span className="d-block mb-1">
                          <strong>Institute Type:</strong> {approvalModal.registration.instituteType}
                        </span>
                        <span className="d-block mb-1">
                          <strong>Institute Code:</strong> {approvalModal.registration.instituteCode}
                        </span>
                        <span className="d-block">
                          <strong>Submitted:</strong> {new Date(approvalModal.registration.registrationDate).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className={`form-control ${approvalErrors.email ? 'is-invalid' : ''}`}
                          value={approvalModal.email}
                          onChange={(event) => {
                            const value = event.target.value
                            setApprovalModal((prev) => ({ ...prev, email: value }))
                            setApprovalErrors((prev) => ({ ...prev, email: undefined }))
                          }}
                          placeholder="owner@example.com"
                        />
                        {approvalErrors.email && <div className="invalid-feedback">{approvalErrors.email}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Password</label>
                        <input
                          type="password"
                          className={`form-control ${approvalErrors.password ? 'is-invalid' : ''}`}
                          value={approvalModal.password}
                          onChange={(event) => {
                            const value = event.target.value
                            setApprovalModal((prev) => ({ ...prev, password: value }))
                            setApprovalErrors((prev) => ({ ...prev, password: undefined }))
                          }}
                          placeholder="Minimum 8 characters"
                        />
                        <div className="form-text">Must be at least 8 characters. Include uppercase, lowercase & numbers.</div>
                        {approvalErrors.password && <div className="invalid-feedback">{approvalErrors.password}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Confirm Password</label>
                        <input
                          type="password"
                          className={`form-control ${approvalErrors.confirmPassword ? 'is-invalid' : ''}`}
                          value={approvalModal.confirmPassword}
                          onChange={(event) => {
                            const value = event.target.value
                            setApprovalModal((prev) => ({ ...prev, confirmPassword: value }))
                            setApprovalErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                          }}
                          placeholder="Repeat the password"
                        />
                        {approvalErrors.confirmPassword && (
                          <div className="invalid-feedback">{approvalErrors.confirmPassword}</div>
                        )}
                      </div>
                      <div className="col-12">
                        <label className="form-label">Notes (optional)</label>
                        <textarea
                          className="form-control"
                          value={approvalModal.notes}
                          onChange={(event) => {
                            const value = event.target.value
                            setApprovalModal((prev) => ({ ...prev, notes: value }))
                          }}
                          rows={3}
                          placeholder="Add internal notes for auditing or future reference"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeApprovalModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={approvalLoading}>
                      {approvalLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Creating access...
                        </>
                      ) : (
                        'Create Access & Send Email'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default PendingInstitutionRegistrationsPage
