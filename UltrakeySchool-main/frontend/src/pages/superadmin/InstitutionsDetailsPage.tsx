import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getInstitutionConfigFromPath } from '../../utils/institutionUtils'
import { apiService } from '../../services/api'
import superAdminService from '../../services/superAdminService'
import branchService from '../../services/branchService'
import ConfirmModal from '../../components/common/ConfirmModal'

interface BranchItem {
  _id: string
  id: string
  name: string
  code: string
  address: string
  city: string
  state: string
  students: number
  status: string
}

interface BillingEntry {
  _id: string
  date: string
  description: string
  amount: number
  amountFormatted: string
  status: string
  method: string
}

interface School {
  id: string
  name: string
  type: string
  plan: string
  status: string
  expiryDate: string
  students: number
  monthlyRevenue: number
  totalRevenue: number
  adminName: string
  adminEmail: string
  adminPhone: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  createdAt: string
  lastLogin: string
}

const formatAddress = (addr: any): string => {
  if (!addr) return ''
  if (typeof addr === 'string') return addr
  return [addr.street, addr.city, addr.state, addr.country, addr.postalCode].filter(Boolean).join(', ')
}

const extract = (obj: any, field: string, fallback = '') => {
  if (!obj) return fallback
  if (typeof obj === 'object') return obj[field] || fallback
  return obj || fallback
}

const InstitutionsDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const institutionConfig = getInstitutionConfigFromPath(location.pathname)

  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Branches state
  const [branches, setBranches] = useState<BranchItem[]>([])
  const [branchesLoading, setBranchesLoading] = useState(false)

  // Billing state
  const [billingEntries, setBillingEntries] = useState<BillingEntry[]>([])
  const [billingLoading, setBillingLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [receiptEntry, setReceiptEntry] = useState<BillingEntry | null>(null)

  // Fetch institution
  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        setLoading(true)
        setError(null)
        const data: any = await superAdminService.getInstitutionById(id!)
        setSchool({
          id: data._id || data.id || '',
          name: data.name || '',
          type: data.type || '',
          plan: typeof data.plan === 'string' ? data.plan : (data.plan?.name || 'Basic'),
          status: typeof data.status === 'string' ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : 'Active',
          expiryDate: data.subscriptionExpiry || data.expiryDate || data.subscription?.endDate || '',
          students: data.analytics?.totalStudents || data.currentUsers || data.students || 0,
          monthlyRevenue: data.subscription?.monthlyCost || data._monthlyRevenue || 0,
          totalRevenue: data.totalRevenue || 0,
          adminName: data.adminName || data.contactPerson || data.principalName || data.contact?.name || '',
          adminEmail: data.email || data.contactEmail || data.principalEmail || data.contact?.email || '',
          adminPhone: data.phone || data.contactPhone || data.principalPhone || data.contact?.phone || '',
          address: formatAddress(data.address || data.contact?.address),
          city: extract(data.address || data.contact?.address, 'city', data.city || ''),
          state: extract(data.address || data.contact?.address, 'state', data.state || ''),
          country: extract(data.address || data.contact?.address, 'country', data.country || ''),
          postalCode: extract(data.address || data.contact?.address, 'postalCode', data.postalCode || ''),
          createdAt: data.createdAt || '',
          lastLogin: data.lastLogin || ''
        })
      } catch (err) {
        console.error('Error fetching institution:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch institution details')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchInstitution()
  }, [id])

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    if (!id) return
    try {
      setBranchesLoading(true)
      const branchData: any = await branchService.getBranchesByInstitution(id)
      const rawBranches = Array.isArray(branchData) ? branchData : (branchData?.branches || [])
      setBranches(rawBranches.map((b: any) => ({
        _id: b._id || b.id || '',
        id: b.id || b._id || '',
        name: b.name || '',
        code: b.code || '',
        address: formatAddress(b.address),
        city: extract(b.address, 'city', b.city || ''),
        state: extract(b.address, 'state', b.state || ''),
        students: b.students || 0,
        status: typeof b.status === 'string' ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : 'Active'
      })))
    } catch (err) {
      console.error('Error fetching branches:', err)
      setBranches([])
    } finally {
      setBranchesLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  // Fetch billing history
  useEffect(() => {
    const fetchBilling = async () => {
      if (!id) return
      try {
        setBillingLoading(true)
        // Try to fetch transactions from finance endpoint scoped to this institution
        const response: any = await apiService.get(`/finance/transactions`, {
          institutionId: id,
          limit: 20
        })

        let transactions: any[] = []
        if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            transactions = response.data
          } else if (response.data.transactions) {
            transactions = response.data.transactions
          } else if (response.data.data && Array.isArray(response.data.data)) {
            transactions = response.data.data
          }
        }

        if (transactions.length > 0) {
          setBillingEntries(transactions.map((t: any) => ({
            _id: t._id || t.id || '',
            date: t.date || t.createdAt || t.processedAt || '',
            description: t.description || t.note || `Transaction - ${t.type || t.category || 'Payment'}`,
            amount: t.amount || 0,
            amountFormatted: new Intl.NumberFormat('en-IN', { style: 'currency', currency: t.currency || 'INR', minimumFractionDigits: 2 }).format(t.amount || 0),
            status: t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : 'Completed',
            method: t.method || t.paymentMethod || t.type || 'Bank Transfer'
          })))
        } else {
          // Fall back to showing subscription-related billing info from the institution
          const instData: any = await superAdminService.getInstitutionById(id)
          const sub = instData?.subscription
          if (sub) {
            const entries: BillingEntry[] = []
            if (sub.startDate) {
              entries.push({
                _id: 'sub-start',
                date: sub.startDate,
                description: `Subscription Started - ${sub.planName || sub.planId || 'Plan'}`,
                amount: sub.monthlyCost || 0,
                amountFormatted: new Intl.NumberFormat('en-IN', { style: 'currency', currency: sub.currency || 'INR', minimumFractionDigits: 2 }).format(sub.monthlyCost || 0),
                status: 'Active',
                method: 'Auto Debit'
              })
            }
            if (sub.endDate) {
              entries.push({
                _id: 'sub-end',
                date: sub.endDate,
                description: `Subscription ${sub.planName || 'Plan'} - Next Billing`,
                amount: sub.monthlyCost || 0,
                amountFormatted: new Intl.NumberFormat('en-IN', { style: 'currency', currency: sub.currency || 'INR', minimumFractionDigits: 2 }).format(sub.monthlyCost || 0),
                status: 'Upcoming',
                method: 'Auto Debit'
              })
            }
            setBillingEntries(entries)
          }
        }
      } catch (err) {
        console.error('Error fetching billing history:', err)
        setBillingEntries([])
      } finally {
        setBillingLoading(false)
      }
    }
    if (id && activeTab === 'billing') fetchBilling()
  }, [id, activeTab])

  const handleDeactivateBranch = (branchId: string) => {
    setShowDeleteModal(true)
    setDeleteTarget({ type: 'deactivate', id: branchId })
  }

  const handleDeleteBranch = (branchId: string) => {
    setShowDeleteModal(true)
    setDeleteTarget({ type: 'delete', id: branchId })
  }

  const handleConfirmAction = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'deactivate') {
        await branchService.suspendBranch(deleteTarget.id, 'Deactivated by super admin')
        fetchBranches()
      } else if (deleteTarget.type === 'delete') {
        await branchService.deleteBranch(deleteTarget.id)
        fetchBranches()
      }
    } catch (err) {
      console.error('Error performing action:', err)
    } finally {
      setShowDeleteModal(false)
      setDeleteTarget(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success'
      case 'Suspended': return 'warning'
      case 'Expired': return 'danger'
      default: return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <div className="alert alert-danger">{error}</div>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <div className="alert alert-warning">Institution not found</div>
          <Link to="/super-admin/institutions" className="btn btn-primary">Back to Institutions</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">{institutionConfig?.singularName || 'Institution'} Details</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/super-admin/institutions">Institutions</Link></li>
              <li className="breadcrumb-item">
                <Link to={institutionConfig?.basePath || '/super-admin/institutions'}>{institutionConfig?.name || 'Institutions'}</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">{school.name}</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <Link to="/super-admin/institutions" className="btn btn-outline-light bg-white btn-icon me-1">
              <i className="ti ti-arrow-left"></i>
            </Link>
          </div>
          <div className="dropdown me-2 mb-2">
            <button className="btn btn-light fw-medium dropdown-toggle" data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li><button className="dropdown-item"><i className="ti ti-file-type-pdf me-2"></i>Export as PDF</button></li>
              <li><button className="dropdown-item"><i className="ti ti-file-type-xls me-2"></i>Export as Excel</button></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Institution Overview Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">{institutionConfig?.singularName || 'Institution'} Overview</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-xl me-3">
                      <i className="ti ti-building text-primary"></i>
                    </div>
                    <div>
                      <h4 className="mb-1">{school.name}</h4>
                      <p className="text-muted mb-0">{institutionConfig?.singularName || 'Institution'} Name</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-xl me-3">
                      <i className="ti ti-credit-card text-success"></i>
                    </div>
                    <div>
                      <h4 className="mb-1">{school.plan}</h4>
                      <p className="text-muted mb-0">Subscription Plan</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-xl me-3">
                      <i className={`ti ti-shield text-${getStatusColor(school.status)}`}></i>
                    </div>
                    <div>
                      <h4 className="mb-1">{school.status}</h4>
                      <p className="text-muted mb-0">Status</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-xl me-3">
                      <i className="ti ti-calendar text-info"></i>
                    </div>
                    <div>
                      <h4 className="mb-1">{school.expiryDate ? new Date(school.expiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</h4>
                      <p className="text-muted mb-0">Expiry Date</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs nav-tabs-line mb-0" role="tablist">
                {[ 
                  { key: 'overview', label: 'Overview' },
                  { key: 'branches', label: 'Branches' },
                  { key: 'details', label: 'Contact Details' },
                  { key: 'usage', label: 'Usage Analytics' },
                  { key: 'billing', label: 'Billing History' }
                ].map(tab => (
                  <li className="nav-item" key={tab.key}>
                    <button
                      className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-body">

              {/* ========== Overview Tab ========== */}
              {activeTab === 'overview' && (
                <div className="row">
                  <div className="col-md-3">
                    <div className="card bg-primary">
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <h4 className="text-white mb-1">{school.students.toLocaleString()}</h4>
                            <p className="text-white mb-0">Total Students</p>
                          </div>
                          <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                            <i className="ti ti-users text-white fs-4"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-success">
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <h4 className="text-white mb-1">₹{school.monthlyRevenue.toLocaleString('en-IN')}</h4>
                            <p className="text-white mb-0">Monthly Revenue</p>
                          </div>
                          <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                            <i className="ti ti-credit-card text-white fs-4"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-warning">
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <h4 className="text-white mb-1">₹{school.totalRevenue.toLocaleString('en-IN')}</h4>
                            <p className="text-white mb-0">Total Revenue</p>
                          </div>
                          <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                            <i className="ti ti-chart-line text-white fs-4"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-info">
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <h4 className="text-white mb-1">
                              {school.createdAt ? new Date(school.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                            </h4>
                            <p className="text-white mb-0">Member Since</p>
                          </div>
                          <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                            <i className="ti ti-calendar-event text-white fs-4"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== Contact Details Tab ========== */}
              {activeTab === 'details' && (
                <div className="row">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title">Contact Information</h5>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="form-label text-muted small">Admin Name</label>
                          <div className="fw-medium">{school.adminName || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted small">Email Address</label>
                          <div className="fw-medium">{school.adminEmail || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted small">Phone Number</label>
                          <div className="fw-medium">{school.adminPhone || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted small">Institution Type</label>
                          <div className="fw-medium">{school.type || '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title">Address Information</h5>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="form-label text-muted small">Address</label>
                          <div className="fw-medium">{school.address || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted small">City</label>
                          <div className="fw-medium">{school.city || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted small">State</label>
                          <div className="fw-medium">{school.state || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted small">Country</label>
                          <div className="fw-medium">{school.country || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted small">Postal Code</label>
                          <div className="fw-medium">{school.postalCode || '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== Branches Tab ========== */}
              {activeTab === 'branches' && (
                <div className="row">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">Branch Management</h5>
                        <span className="badge bg-primary">{branches.length} Branches</span>
                      </div>
                      <div className="card-body">
                        {branchesLoading ? (
                          <div className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="text-muted mt-2 mb-0">Loading branches...</p>
                          </div>
                        ) : branches.length === 0 ? (
                          <div className="text-center py-4">
                            <i className="ti ti-building-warehouse text-muted" style={{ fontSize: '3rem' }}></i>
                            <p className="text-muted mt-2">No branches found for this institution</p>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover">
                              <thead>
                                <tr>
                                  <th>Branch Name</th>
                                  <th>Code</th>
                                  <th>Address</th>
                                  <th>City</th>
                                  <th>State</th>
                                  <th>Students</th>
                                  <th>Status</th>
                                  <th className="text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {branches.map((branch) => (
                                  <tr key={branch._id}>
                                    <td className="fw-medium">{branch.name}</td>
                                    <td><code>{branch.code}</code></td>
                                    <td>{branch.address || '-'}</td>
                                    <td>{branch.city || '-'}</td>
                                    <td>{branch.state || '-'}</td>
                                    <td>{branch.students}</td>
                                    <td>
                                      <span className={`badge bg-${branch.status === 'Active' ? 'success' : branch.status === 'Suspended' ? 'warning' : 'secondary'}`}>
                                        {branch.status}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="dropdown">
                                        <button className="btn btn-sm btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                                          <i className="ti ti-dots-vertical"></i>
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end">
                                          <li><button className="dropdown-item" onClick={() => navigate(`/super-admin/branches/${branch._id}/edit`)}>Edit Branch</button></li>
                                          <li><button className="dropdown-item" onClick={() => navigate(`/super-admin/branches/${branch._id}`)}>View Details</button></li>
                                          <li><button className="dropdown-item" onClick={() => navigate(`/super-admin/branches/${branch._id}/students`)}>Manage Students</button></li>
                                          <li><hr className="dropdown-divider" /></li>
                                          <li>
                                            <button
                                              className="dropdown-item"
                                              onClick={() => handleDeactivateBranch(branch._id)}
                                            >
                                              {branch.status === 'Active' ? 'Deactivate Branch' : 'Activate Branch'}
                                            </button>
                                          </li>
                                          <li>
                                            <button
                                              className="dropdown-item text-danger"
                                              onClick={() => handleDeleteBranch(branch._id)}
                                            >
                                              Delete Branch
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
                  </div>
                </div>
              )}

              {/* ========== Usage Analytics Tab ========== */}
              {activeTab === 'usage' && (
                <div className="row">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title">Usage Analytics</h5>
                      </div>
                      <div className="card-body">
                        {/* Key Metrics */}
                        <div className="row mb-4">
                          <div className="col-md-3">
                            <div className="card bg-primary">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <h4 className="text-white mb-1">{school.students.toLocaleString()}</h4>
                                    <p className="text-white mb-0">Total Users</p>
                                  </div>
                                  <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                                    <i className="ti ti-users text-white fs-4"></i>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="card bg-success">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <h4 className="text-white mb-1">{branches.length}</h4>
                                    <p className="text-white mb-0">Active Branches</p>
                                  </div>
                                  <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                                    <i className="ti ti-building-community text-white fs-4"></i>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="card bg-warning">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <h4 className="text-white mb-1">
                                      {school.plan ? `${school.plan.charAt(0).toUpperCase() + school.plan.slice(1)}` : 'N/A'}
                                    </h4>
                                    <p className="text-white mb-0">Plan Tier</p>
                                  </div>
                                  <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                                    <i className="ti ti-crown text-white fs-4"></i>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="card bg-info">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <h4 className="text-white mb-1">
                                      {school.createdAt ? new Date(school.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }) : '-'}
                                    </h4>
                                    <p className="text-white mb-0">Member Since</p>
                                  </div>
                                  <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                                    <i className="ti ti-calendar-time text-white fs-4"></i>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Activity & Plan Details */}
                        <div className="row mb-4">
                          <div className="col-md-6">
                            <div className="card">
                              <div className="card-header">
                                <h6 className="card-title mb-0">Plan Details</h6>
                              </div>
                              <div className="card-body">
                                <table className="table table-sm">
                                  <tbody>
                                    <tr>
                                      <td className="text-muted">Plan</td>
                                      <td className="fw-medium">{school.plan}</td>
                                    </tr>
                                    <tr>
                                      <td className="text-muted">Monthly Cost</td>
                                      <td className="fw-medium">₹{school.monthlyRevenue.toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr>
                                      <td className="text-muted">Status</td>
                                      <td><span className={`badge bg-${getStatusColor(school.status)}`}>{school.status}</span></td>
                                    </tr>
                                    <tr>
                                      <td className="text-muted">Expiry</td>
                                      <td className="fw-medium">
                                        {school.expiryDate ? new Date(school.expiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-muted">Last Login</td>
                                      <td className="fw-medium">
                                        {school.lastLogin ? new Date(school.lastLogin).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="card">
                              <div className="card-header">
                                <h6 className="card-title mb-0">Activity Overview</h6>
                              </div>
                              <div className="card-body">
                                <div className="table-responsive">
                                  <table className="table table-sm">
                                    <thead>
                                      <tr>
                                        <th>Metric</th>
                                        <th>Value</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td>Total Students</td>
                                        <td className="fw-medium">{school.students.toLocaleString()}</td>
                                      </tr>
                                      <tr>
                                        <td>Total Branches</td>
                                        <td className="fw-medium">{branches.length}</td>
                                      </tr>
                                      <tr>
                                        <td>Admin Contact</td>
                                        <td className="fw-medium">{school.adminEmail || '-'}</td>
                                      </tr>
                                      <tr>
                                        <td>Institution Type</td>
                                        <td className="fw-medium">{school.type || '-'}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== Billing History Tab ========== */}
              {activeTab === 'billing' && (
                <div className="row">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">Billing History</h5>
                        {!billingLoading && billingEntries.length > 0 && (
                          <span className="badge bg-primary">{billingEntries.length} Records</span>
                        )}
                      </div>
                      <div className="card-body">
                        {billingLoading ? (
                          <div className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="text-muted mt-2 mb-0">Loading billing history...</p>
                          </div>
                        ) : billingEntries.length === 0 ? (
                          <div className="text-center py-4">
                            <i className="ti ti-receipt text-muted" style={{ fontSize: '3rem' }}></i>
                            <p className="text-muted mt-2">No billing records found</p>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Description</th>
                                  <th>Amount</th>
                                  <th>Status</th>
                                  <th>Method</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {billingEntries.map((entry) => (
                                  <tr key={entry._id}>
                                    <td className="text-nowrap">
                                      {entry.date ? new Date(entry.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                                    </td>
                                    <td>{entry.description}</td>
                                    <td className="fw-medium">{entry.amountFormatted}</td>
                                    <td>
                                      <span className={`badge bg-${entry.status === 'Paid' || entry.status === 'Completed' || entry.status === 'Active' ? 'success' : entry.status === 'Upcoming' ? 'info' : entry.status === 'Failed' ? 'danger' : 'secondary'}`}>
                                        {entry.status}
                                      </span>
                                    </td>
                                    <td>{entry.method}</td>
                                    <td>
                                      <button className="btn btn-sm btn-outline-primary" onClick={() => setReceiptEntry(entry)}>
                                        <i className="ti ti-file-text me-1"></i>Receipt
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleConfirmAction} message={deleteTarget?.type === 'deactivate' ? 'Are you sure you want to deactivate this branch?' : 'Are you sure you want to delete this branch? This cannot be undone.'} />

      {receiptEntry && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1} onClick={() => setReceiptEntry(null)}>
          <div className="modal-dialog modal-dialog-centered modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="ti ti-file-text me-2"></i>Payment Receipt</h5>
                <button type="button" className="btn-close" onClick={() => setReceiptEntry(null)}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4 pb-3 border-bottom">
                  <h4 className="mb-1">Receipt</h4>
                  <small className="text-muted">#{receiptEntry._id.slice(-8).toUpperCase()}</small>
                </div>
                <div className="row mb-2">
                  <div className="col-6 text-muted">Date</div>
                  <div className="col-6 text-end fw-medium">{receiptEntry.date ? new Date(receiptEntry.date).toLocaleDateString('en-IN') : '-'}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-6 text-muted">Description</div>
                  <div className="col-6 text-end fw-medium">{receiptEntry.description}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-6 text-muted">Amount</div>
                  <div className="col-6 text-end fw-semibold fs-5">{receiptEntry.amountFormatted}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-6 text-muted">Payment Method</div>
                  <div className="col-6 text-end fw-medium">{receiptEntry.method}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-6 text-muted">Status</div>
                  <div className="col-6 text-end">
                    <span className={`badge bg-${receiptEntry.status === 'Paid' || receiptEntry.status === 'Completed' || receiptEntry.status === 'Active' ? 'success' : receiptEntry.status === 'Upcoming' ? 'info' : receiptEntry.status === 'Failed' ? 'danger' : 'secondary'}`}>
                      {receiptEntry.status}
                    </span>
                  </div>
                </div>
                <div className="bg-light p-3 rounded mt-3">
                  <p className="mb-0 text-center text-muted small">
                    <i className="ti ti-printer me-1"></i>
                    Use browser print (Ctrl+P) to save or print this receipt.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setReceiptEntry(null)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                  <i className="ti ti-printer me-1"></i>Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default InstitutionsDetailsPage
