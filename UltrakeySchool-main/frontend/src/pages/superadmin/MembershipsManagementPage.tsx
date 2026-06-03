import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { apiService } from '../../services/api'
import ConfirmModal from '../../components/common/ConfirmModal'

// ─── Types ──────────────────────────────────────────────

interface InstitutionSubscription {
  _id: string
  name: string
  instituteCode: string
  type: string
  status: string
  contact: {
    email?: string
    phone?: string
  }
  plan: string
  planId: string
  subscriptionExpiry: string | null
  monthlyCost: number
  billingCycle: 'monthly' | 'yearly'
  subscriptionStatus: string
  autoRenew: boolean
  totalPaid: number
  lastPaymentDate: string | null
  lastPaymentAmount: number
  paymentMethod: string
  previousPaymentDate: string | null
  previousPaymentAmount: number
  transactionCount: number
  createdAt: string
}

interface Module {
  id: string
  name: string
  enabled: boolean
  category?: string
  description?: string
  icon?: string
  plans?: string[]
  institutionTypes?: string[]
  mandatory?: boolean
  isBeta?: boolean
  dependencyModules?: string[]
}

interface Plan {
  id: string
  name: string
  displayName?: string
  status: 'Active' | 'Disabled'
  monthlyPrice: number
  yearlyPrice: number
  currency: string
  maxStudents: number
  maxBranches: number
  storageLimit: number
  activeSchools: number
  modules: Module[]
  features: string[]
  trialDays: number
  discountYearly: number
  isRecommended?: boolean
  isPopular?: boolean
  enabledModules?: string[]
}

const MembershipsManagementPage: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'plans' | 'institutions'>('plans')
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Institution subscriptions state
  const [institutionSubs, setInstitutionSubs] = useState<InstitutionSubscription[]>([])
  const [instSubsLoading, setInstSubsLoading] = useState(false)
  const [instFilterStatus, setInstFilterStatus] = useState<string>('all')
  const [instFilterPlan, setInstFilterPlan] = useState<string>('all')
  const [instSearchTerm, setInstSearchTerm] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const pageSize = 50

  // Action modals
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionSubscription | null>(null)
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [changePlanTarget, setChangePlanTarget] = useState<string>('medium')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [showReactivateModal, setShowReactivateModal] = useState(false)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response: any = await apiService.get('/subscriptions/plans')
        
        if (response.success) {
          // The backend returns: { success: true, data: [...plans], message: '...' }
          // So the plans array is directly at response.data
          let plansData: any[] = [];
          
          if (Array.isArray(response.data)) {
            plansData = response.data;
          } else if (response.data?.length > 0) {
            plansData = response.data;
          } else if (Array.isArray(response.data?.data)) {
            plansData = response.data.data;
          }
          
          setPlans(plansData as Plan[])
        }
      } catch (err) {
        console.error('Error fetching plans:', err)
        setError('Failed to load plans')
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  const fetchInstitutionSubscriptions = async (page?: number) => {
    try {
      setInstSubsLoading(true)
      const pageToFetch = page ?? currentPage
      const params: Record<string, string> = { limit: String(pageSize), page: String(pageToFetch) }
      if (instFilterStatus !== 'all') params.status = instFilterStatus
      if (instFilterPlan !== 'all') params.plan = instFilterPlan
      if (instSearchTerm) params.search = instSearchTerm

      const response: any = await apiService.get('/super-admin/institution-subscriptions', params)

      if (response.success && Array.isArray(response.data)) {
        setInstitutionSubs(response.data as InstitutionSubscription[])
      }
      if (response.pagination) {
        setTotalPages(response.pagination.pages || 1)
        setTotalRecords(response.pagination.total || 0)
        setCurrentPage(pageToFetch)
      }
    } catch (err) {
      console.error('Error fetching institution subscriptions:', err)
      toast.error('Failed to load institution subscriptions')
    } finally {
      setInstSubsLoading(false)
    }
  }

  useEffect(() => {
    if (activeMainTab === 'institutions') {
      fetchInstitutionSubscriptions()
    }
  }, [activeMainTab])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [newPlan, setNewPlan] = useState<Partial<Plan>>({
    name: '',
    status: 'Active',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: '₹',
    maxStudents: 0,
    maxBranches: 0,
    storageLimit: 0,
    trialDays: 14,
    discountYearly: 17
  })

  const formatCurrency = (amount: number | undefined | null, currency: string = '₹') => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return `${currency}0`
    }
    return `${currency}${amount.toLocaleString('en-IN')}`
  }

  const safePlans = plans || []

  const getHighestPrice = () => {
    if (!plans || plans.length === 0) return 0
    const prices = plans.map(p => p.monthlyPrice).filter(p => typeof p === 'number' && !isNaN(p))
    if (prices.length === 0) return 0
    return Math.max(...prices)
  }

  const getActivePlansCount = () => {
    if (!plans || plans.length === 0) return 0
    return plans.filter(p => p.status === 'Active').length
  }

  const getTotalActiveSchools = () => {
    if (!plans || plans.length === 0) return 0
    return plans.reduce((sum, p) => sum + (p.activeSchools || 0), 0)
  }

  const handleCreatePlan = async () => {
    try {
      const plan: Plan = {
        id: Date.now().toString(),
        name: newPlan.name || 'New Plan',
        status: newPlan.status || 'Active',
        monthlyPrice: newPlan.monthlyPrice || 0,
        yearlyPrice: newPlan.yearlyPrice || 0,
        currency: '₹',
        maxStudents: newPlan.maxStudents || 0,
        maxBranches: newPlan.maxBranches || 0,
        storageLimit: newPlan.storageLimit || 0,
        activeSchools: 0,
        modules: [],
        features: [],
        trialDays: newPlan.trialDays || 14,
        discountYearly: newPlan.discountYearly || 17
      }
      
      try {
        const response = await apiService.post('/subscriptions/plans', plan)
        
        if (response.success && response.data) {
          setPlans(prev => [...prev, response.data as Plan])
        } else {
          setPlans(prev => [...prev, plan])
        }
      } catch {
        setPlans(prev => [...prev, plan])
      }
      
      setShowCreateModal(false)
      setNewPlan({
        name: '',
        status: 'Active',
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: '₹',
        maxStudents: 0,
        maxBranches: 0,
        storageLimit: 0,
        trialDays: 14,
        discountYearly: 17
      })
      toast.success('Plan created successfully!')
    } catch (err) {
      console.error('Error creating plan:', err)
      setError(err instanceof Error ? err.message : 'Failed to create plan')
    }
  }

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowEditModal(true)
  }

  const handleUpdatePlan = async () => {
    if (selectedPlan) {
      try {
        try {
          const response = await apiService.put(`/subscriptions/plans/${selectedPlan.id}`, selectedPlan)
          
          if (response.success && response.data) {
            setPlans(plans.map(p => p.id === selectedPlan.id ? response.data as Plan : p))
          } else {
            setPlans(plans.map(p => p.id === selectedPlan.id ? selectedPlan : p))
          }
        } catch {
          setPlans(plans.map(p => p.id === selectedPlan.id ? selectedPlan : p))
        }
        setShowEditModal(false)
        setSelectedPlan(null)
        toast.success('Plan updated successfully!')
      } catch (err) {
        console.error('Error updating plan:', err)
        setError(err instanceof Error ? err.message : 'Failed to update plan')
      }
    }
  }

  const handleToggleStatus = async (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    if (plan) {
      try {
        const newStatus = plan.status === 'Active' ? 'Disabled' : 'Active'
        try {
          const response = await apiService.patch(`/subscriptions/plans/${planId}`, { status: newStatus })
          
          if (response.success && response.data) {
            setPlans(plans.map(p => p.id === planId ? response.data as Plan : p))
          } else {
            setPlans(plans.map(p => p.id === planId ? { ...p, status: newStatus } : p))
          }
        } catch {
          setPlans(plans.map(p => p.id === planId ? { ...p, status: newStatus } : p))
        }
      } catch (err) {
        console.error('Error updating plan status:', err)
        setError(err instanceof Error ? err.message : 'Failed to update plan status')
      }
    }
  }

  const handleDeletePlan = (planId: string) => {
    setShowDeleteModal(true)
    setDeleteTarget(planId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      try {
        const response = await apiService.delete(`/subscriptions/plans/${deleteTarget}`)
        
        if (response.success) {
          setPlans(plans.filter(p => p.id !== deleteTarget))
        } else {
          setPlans(plans.filter(p => p.id !== deleteTarget))
        }
      } catch {
        setPlans(plans.filter(p => p.id !== deleteTarget))
      }
      toast.success('Plan deleted successfully!')
    } catch (err) {
      console.error('Error deleting plan:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete plan')
    } finally {
      setShowDeleteModal(false)
      setDeleteTarget(null)
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
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getSubStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      active: 'bg-success',
      pending: 'bg-warning',
      suspended: 'bg-warning text-dark',
      expired: 'bg-danger',
      cancelled: 'bg-secondary',
      trial: 'bg-info',
      none: 'bg-light text-dark'
    }
    return config[status] || 'bg-secondary'
  }

  const handleChangePlan = async () => {
    if (!selectedInstitution) return
    try {
      await apiService.post(`/subscriptions/schools/${selectedInstitution._id}/upgrade`, {
        targetPlanId: changePlanTarget
      })
      toast.success(`Plan changed to ${changePlanTarget} successfully`)
      setShowChangePlanModal(false)
      setSelectedInstitution(null)
      fetchInstitutionSubscriptions()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change plan')
    }
  }

  const handleCancelSubscription = async () => {
    if (!selectedInstitution) return
    try {
      await apiService.post(`/subscriptions/schools/${selectedInstitution._id}/cancel`, {
        reason: cancelReason || 'Cancelled by SuperAdmin'
      })
      toast.success('Subscription cancelled successfully')
      setShowCancelModal(false)
      setSelectedInstitution(null)
      setCancelReason('')
      fetchInstitutionSubscriptions()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel subscription')
    }
  }

  const handleRenewSubscription = async () => {
    if (!selectedInstitution) return
    try {
      await apiService.post(`/subscriptions/schools/${selectedInstitution._id}/renew`)
      toast.success('Subscription renewed successfully')
      setShowRenewModal(false)
      setSelectedInstitution(null)
      fetchInstitutionSubscriptions()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to renew subscription')
    }
  }

  const handleSuspendSubscription = async () => {
    if (!selectedInstitution) return
    try {
      await apiService.post(`/subscriptions/schools/${selectedInstitution._id}/suspend`, {
        reason: suspendReason || 'Suspended by SuperAdmin'
      })
      toast.success('Subscription suspended successfully')
      setShowSuspendModal(false)
      setSelectedInstitution(null)
      setSuspendReason('')
      fetchInstitutionSubscriptions()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to suspend subscription')
    }
  }

  const handleReactivateSubscription = async () => {
    if (!selectedInstitution) return
    try {
      await apiService.post(`/subscriptions/schools/${selectedInstitution._id}/reactivate`)
      toast.success('Subscription reactivated successfully')
      setShowReactivateModal(false)
      setSelectedInstitution(null)
      fetchInstitutionSubscriptions()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reactivate subscription')
    }
  }

  // Filter institution subscriptions
  const filteredInstSubs = institutionSubs.filter(sub => {
    const matchesSearch = !instSearchTerm || 
      sub.name.toLowerCase().includes(instSearchTerm.toLowerCase()) ||
      sub.instituteCode?.toLowerCase().includes(instSearchTerm.toLowerCase())
    return matchesSearch
  })

  const renderInstitutionSubscriptions = () => (
    <>
      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Search Institution</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or code..."
                  value={instSearchTerm}
                  onChange={(e) => setInstSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Status</label>
                <select className="form-select" value={instFilterStatus} onChange={(e) => setInstFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Plan</label>
                <select className="form-select" value={instFilterPlan} onChange={(e) => setInstFilterPlan(e.target.value)}>
                  <option value="all">All Plans</option>
                  <option value="basic">Basic</option>
                  <option value="medium">Medium</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <div className="mb-3 w-100">
                <button className="btn btn-primary w-100" onClick={() => fetchInstitutionSubscriptions()}>
                  <i className="ti ti-refresh me-1"></i>Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-primary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{filteredInstSubs.length}</h4>
                  <p className="text-white mb-0">Total Institutions</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-building text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{filteredInstSubs.filter(s => s.subscriptionStatus === 'active').length}</h4>
                  <p className="text-white mb-0">Active Subscriptions</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-checks text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-info">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{formatCurrency(filteredInstSubs.reduce((sum, s) => sum + s.totalPaid, 0))}</h4>
                  <p className="text-white mb-0">Total Revenue</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-currency-rupee text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{filteredInstSubs.reduce((sum, s) => sum + s.monthlyCost, 0)}</h4>
                  <p className="text-white mb-0">Monthly Recurring</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-trending-up text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institution Subscriptions Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="card-title">Institution Subscriptions ({filteredInstSubs.length})</h4>
          <div className="text-muted">
            Monthly: {formatCurrency(filteredInstSubs.reduce((sum, s) => sum + s.monthlyCost, 0))} |
            Total Paid: {formatCurrency(filteredInstSubs.reduce((sum, s) => sum + s.totalPaid, 0))}
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Plan</th>
                  <th>Monthly</th>
                  <th>Last Payment</th>
                  <th>Total Paid</th>
                  <th>Subscription</th>
                  <th>Expiry</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {instSubsLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredInstSubs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <i className="ti ti-building text-muted fs-1 mb-3 d-block"></i>
                      <h5 className="text-muted">No Institutions Found</h5>
                      <p className="text-muted mb-0">No institutions match your current filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInstSubs.map((inst) => (
                    <tr key={inst._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm me-2">
                            <i className="ti ti-building text-primary"></i>
                          </div>
                          <div>
                            <div className="fw-medium">{inst.name}</div>
                            <small className="text-muted">
                              {inst.instituteCode} · {inst.type}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${inst.plan === 'Premium' ? 'bg-success' : inst.plan === 'Medium' ? 'bg-warning text-dark' : 'bg-info'}`}>
                          {inst.plan}
                        </span>
                      </td>
                      <td className="fw-semibold">{formatCurrency(inst.monthlyCost)}</td>
                      <td>
                        <div>
                          <div className="fw-medium">{formatCurrency(inst.lastPaymentAmount)}</div>
                          <small className="text-muted">{formatDate(inst.lastPaymentDate)}</small>
                        </div>
                      </td>
                      <td className="fw-semibold text-success">{formatCurrency(inst.totalPaid)}</td>
                      <td>
                        <span className={`badge ${getSubStatusBadge(inst.subscriptionStatus)}`}>
                          {inst.subscriptionStatus || 'None'}
                        </span>
                      </td>
                      <td>
                        {inst.subscriptionExpiry ? (
                          <div>
                            <div className="small">{formatDate(inst.subscriptionExpiry)}</div>
                            <small className={`${new Date(inst.subscriptionExpiry) < new Date() ? 'text-danger' : 'text-muted'}`}>
                              {Math.ceil((new Date(inst.subscriptionExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 0
                                ? `${Math.ceil((new Date(inst.subscriptionExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`
                                : 'Expired'
                              }
                            </small>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
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
                              <button
                                className="dropdown-item"
                                onClick={() => window.location.href = `/super-admin/institutions/${inst._id}`}
                              >
                                <i className="ti ti-eye me-2"></i>View Details
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => window.location.href = `/super-admin/transactions`}
                              >
                                <i className="ti ti-report-money me-2"></i>Transactions
                              </button>
                            </li>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setSelectedInstitution(inst)
                                  setChangePlanTarget(inst.planId === 'basic' ? 'medium' : inst.planId === 'medium' ? 'premium' : 'premium')
                                  setShowChangePlanModal(true)
                                }}
                              >
                                <i className="ti ti-arrow-up-circle me-2"></i>Change Plan
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setSelectedInstitution(inst)
                                  setShowRenewModal(true)
                                }}
                                disabled={inst.subscriptionStatus === 'active' && new Date(inst.subscriptionExpiry || '') > new Date()}
                              >
                                <i className="ti ti-refresh me-2"></i>Renew
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item text-success"
                                onClick={() => {
                                  setSelectedInstitution(inst)
                                  setShowReactivateModal(true)
                                }}
                                disabled={inst.subscriptionStatus !== 'suspended' && inst.subscriptionStatus !== 'cancelled'}
                              >
                                <i className="ti ti-player-play me-2"></i>Reactivate
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item text-warning"
                                onClick={() => {
                                  setSelectedInstitution(inst)
                                  setShowSuspendModal(true)
                                }}
                                disabled={inst.subscriptionStatus === 'suspended' || inst.subscriptionStatus === 'expired' || inst.subscriptionStatus === 'cancelled'}
                              >
                                <i className="ti ti-player-pause me-2"></i>Suspend
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item text-danger"
                                onClick={() => {
                                  setSelectedInstitution(inst)
                                  setShowCancelModal(true)
                                }}
                                disabled={inst.subscriptionStatus === 'cancelled' || inst.subscriptionStatus === 'expired'}
                              >
                                <i className="ti ti-x-circle me-2"></i>Cancel
                              </button>
                            </li>
                          </ul>
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

      {/* Change Plan Modal */}
      {showChangePlanModal && selectedInstitution && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Plan - {selectedInstitution.name}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowChangePlanModal(false); setSelectedInstitution(null); }}></button>
              </div>
              <div className="modal-body">
                <p>Current Plan: <strong>{selectedInstitution.plan}</strong></p>
                <div className="mb-3">
                  <label className="form-label">New Plan</label>
                  <select className="form-select" value={changePlanTarget} onChange={(e) => setChangePlanTarget(e.target.value)}>
                    <option value="basic">Basic - ₹29/mo</option>
                    <option value="medium">Medium - ₹79/mo</option>
                    <option value="premium">Premium - ₹199/mo</option>
                  </select>
                </div>
                <div className="alert alert-info">
                  <i className="ti ti-info-circle me-2"></i>
                  The institution will be upgraded to the new plan. Prorated charges will apply.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowChangePlanModal(false); setSelectedInstitution(null); }}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleChangePlan}>Change Plan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && selectedInstitution && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cancel Subscription - {selectedInstitution.name}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowCancelModal(false); setSelectedInstitution(null); }}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger">
                  <i className="ti ti-alert-triangle me-2"></i>
                  This will cancel the subscription for <strong>{selectedInstitution.name}</strong>. They will lose access to premium features.
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason for Cancellation</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter reason..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCancelModal(false); setSelectedInstitution(null); }}>Keep Active</button>
                <button type="button" className="btn btn-danger" onClick={handleCancelSubscription}>Confirm Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renew Subscription Modal */}
      {showRenewModal && selectedInstitution && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Renew Subscription - {selectedInstitution.name}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowRenewModal(false); setSelectedInstitution(null); }}></button>
              </div>
              <div className="modal-body">
                <p>Institution: <strong>{selectedInstitution.name}</strong></p>
                <p>Plan: <strong>{selectedInstitution.plan}</strong> - {formatCurrency(selectedInstitution.monthlyCost)}/mo</p>
                {selectedInstitution.subscriptionExpiry && (
                  <p>Expires: <strong>{formatDate(selectedInstitution.subscriptionExpiry)}</strong></p>
                )}
                <div className="alert alert-success">
                  <i className="ti ti-check-circle me-2"></i>
                  The subscription will be renewed with the same plan and billing cycle.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowRenewModal(false); setSelectedInstitution(null); }}>Cancel</button>
                <button type="button" className="btn btn-success" onClick={handleRenewSubscription}>
                  <i className="ti ti-refresh me-1"></i>Renew Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Subscription Modal */}
      {showSuspendModal && selectedInstitution && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Suspend Subscription - {selectedInstitution.name}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowSuspendModal(false); setSelectedInstitution(null); }}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="ti ti-alert-triangle me-2"></i>
                  This will temporarily suspend the subscription for <strong>{selectedInstitution.name}</strong>.
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason for Suspension</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Enter reason..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowSuspendModal(false); setSelectedInstitution(null); }}>Cancel</button>
                <button type="button" className="btn btn-warning" onClick={handleSuspendSubscription}>Suspend</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Subscription Modal */}
      {showReactivateModal && selectedInstitution && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reactivate Subscription - {selectedInstitution.name}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowReactivateModal(false); setSelectedInstitution(null); }}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-success">
                  <i className="ti ti-check-circle me-2"></i>
                  This will reactivate the subscription for <strong>{selectedInstitution.name}</strong>.
                </div>
                <p>Plan: <strong>{selectedInstitution.plan}</strong> - {formatCurrency(selectedInstitution.monthlyCost)}/mo</p>
                <p>Status: <span className={`badge ${getSubStatusBadge(selectedInstitution.subscriptionStatus)}`}>{selectedInstitution.subscriptionStatus}</span></p>
                <div className="alert alert-info">
                  <i className="ti ti-info-circle me-2"></i>
                  The institution will regain access to all plan features upon reactivation.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowReactivateModal(false); setSelectedInstitution(null); }}>Cancel</button>
                <button type="button" className="btn btn-success" onClick={handleReactivateSubscription}>
                  <i className="ti ti-player-play me-1"></i>Reactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted small">
            Showing {filteredInstSubs.length} of {totalRecords} institutions
          </div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => fetchInstitutionSubscriptions(currentPage - 1)} disabled={currentPage <= 1}>
                  <i className="ti ti-chevron-left"></i>
                </button>
              </li>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const startPage = Math.max(1, currentPage - 2)
                const pageNum = startPage + i
                if (pageNum > totalPages) return null
                return (
                  <li key={pageNum} className={`page-item ${pageNum === currentPage ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => fetchInstitutionSubscriptions(pageNum)}>{pageNum}</button>
                  </li>
                )
              })}
              <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => fetchInstitutionSubscriptions(currentPage + 1)} disabled={currentPage >= totalPages}>
                  <i className="ti ti-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Subscriptions Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/super-admin/dashboard">Dashboard</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {activeMainTab === 'plans' ? 'Subscription Plans' : 'Institution Subscriptions'}
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          {activeMainTab === 'plans' && (
            <>
              <div className="pe-1 mb-2">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="ti ti-plus me-2"></i>Create Plan
                </button>
              </div>
              <div className="pe-1 mb-2">
                <button 
                  className="btn btn-info"
                  onClick={() => setShowComparison(true)}
                >
                  <i className="ti ti-scales me-2"></i>Compare Plans
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card mb-4">
        <div className="card-body p-0">
          <ul className="nav nav-tabs nav-tabs-bottom" role="tablist">
            <li className="nav-item">
              <button
                className={`nav-link ${activeMainTab === 'plans' ? 'active' : ''}`}
                onClick={() => setActiveMainTab('plans')}
              >
                <i className="ti ti-crown me-2"></i>Subscription Plans
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeMainTab === 'institutions' ? 'active' : ''}`}
                onClick={() => setActiveMainTab('institutions')}
              >
                <i className="ti ti-building me-2"></i>Institution Subscriptions
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      {activeMainTab === 'institutions' ? renderInstitutionSubscriptions() : (
        <>
          {/* Original Plans Content */}

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-primary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{safePlans.length}</h4>
                  <p className="text-white mb-0">Total Plans</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-crown text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{getActivePlansCount()}</h4>
                  <p className="text-white mb-0">Active Plans</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-checks text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{getTotalActiveSchools()}</h4>
                  <p className="text-white mb-0">Active Schools</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-building text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-info">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{formatCurrency(getHighestPrice())}</h4>
                  <p className="text-white mb-0">Highest Price</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-currency-rupee text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="row">
        {safePlans.map((plan) => (
          <div className="col-lg-4 mb-3" key={plan.id}>
            <div className={`card h-100 ${plan.status === 'Disabled' ? 'opacity-50' : ''}`}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">{plan.name}</h5>
                <span className={`badge ${plan.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                  {plan.status}
                </span>
              </div>
              <div className="card-body">
                <div className="text-center mb-3">
                  <h2 className="mb-1">{formatCurrency(plan.monthlyPrice)}</h2>
                  <small className="text-muted">per month</small>
                  <div className="mt-2">
                    <span className="badge bg-light text-dark">
                      {formatCurrency(plan.yearlyPrice)}/year
                    </span>
                      <span className="badge bg-success ms-1">
                      Save {plan.discountYearly || 0}%
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Max Students</span>
                    <strong>{(plan.maxStudents || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Max Branches</span>
                    <strong>{plan.maxBranches || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Storage Limit</span>
                    <strong>{plan.storageLimit || 0} GB</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Active Schools</span>
                    <strong>{plan.activeSchools || 0}</strong>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="mb-2">Modules ({(plan.modules || []).length})</h6>
                  <div className="row g-2">
                    {(plan.modules || []).map((module) => (
                      <div className="col-md-6 col-lg-4" key={module.id}>
                        <div className={`badge border ${module.enabled ? 'border-success text-success' : 'border-secondary text-secondary'} bg-white w-100 text-start p-2`}>
                          <div className="d-flex align-items-center mb-1">
                            <i className={`${module.icon || 'ti ti-package'} me-1`}></i>
                            <small className="fw-medium text-truncate" style={{maxWidth: '150px'}}>{module.name}</small>
                          </div>
                          {module.mandatory && (
                            <small className="text-warning d-block">MANDATORY</small>
                          )}
                          {module.isBeta && (
                            <small className="text-info d-block">BETA</small>
                          )}
                          {module.dependencyModules?.length && (
                            <small className="text-muted d-block">Requires: {module.dependencyModules.join(', ')}</small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="mb-2">Features</h6>
                  <div className="row">
                    <div className="col-6">
                      {(plan.features || []).slice(0, Math.ceil((plan.features || []).length / 2)).map((feature, idx) => (
                        <div className="mb-1 d-flex align-items-center" key={idx}>
                          <i className="ti ti-check text-success me-1"></i>
                          <small>{feature}</small>
                        </div>
                      ))}
                    </div>
                    <div className="col-6">
                      {(plan.features || []).slice(Math.ceil((plan.features || []).length / 2)).map((feature, idx) => (
                        <div className="mb-1 d-flex align-items-center" key={idx}>
                          <i className="ti ti-check text-success me-1"></i>
                          <small>{feature}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleEditPlan(plan)}
                  >
                    <i className="ti ti-edit me-1"></i>Edit Plan
                  </button>
                  <button 
                    className={`btn btn-sm ${plan.status === 'Active' ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => handleToggleStatus(plan.id)}
                  >
                    <i className={`ti ti-${plan.status === 'Active' ? 'player-pause' : 'player-play'} me-1`}></i>
                    {plan.status === 'Active' ? 'Disable' : 'Enable'}
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeletePlan(plan.id)}
                  >
                    <i className="ti ti-trash me-1"></i>Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Plan</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Plan Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                        placeholder="Enter plan name"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={newPlan.status}
                        onChange={(e) => setNewPlan({...newPlan, status: e.target.value as 'Active' | 'Disabled'})}
                      >
                        <option value="Active">Active</option>
                        <option value="Disabled">Disabled</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Monthly Price (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newPlan.monthlyPrice}
                        onChange={(e) => setNewPlan({...newPlan, monthlyPrice: parseInt(e.target.value)})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Yearly Price (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newPlan.yearlyPrice}
                        onChange={(e) => setNewPlan({...newPlan, yearlyPrice: parseInt(e.target.value)})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Yearly Discount (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newPlan.discountYearly}
                        onChange={(e) => setNewPlan({...newPlan, discountYearly: parseInt(e.target.value)})}
                        placeholder="17"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Max Students</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newPlan.maxStudents}
                        onChange={(e) => setNewPlan({...newPlan, maxStudents: parseInt(e.target.value)})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Max Branches</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newPlan.maxBranches}
                        onChange={(e) => setNewPlan({...newPlan, maxBranches: parseInt(e.target.value)})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Storage Limit (GB)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newPlan.storageLimit}
                        onChange={(e) => setNewPlan({...newPlan, storageLimit: parseInt(e.target.value)})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Trial Days</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newPlan.trialDays}
                        onChange={(e) => setNewPlan({...newPlan, trialDays: parseInt(e.target.value)})}
                        placeholder="14"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCreatePlan}>
                  Create Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditModal && selectedPlan && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Plan: {selectedPlan.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Plan Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedPlan.name}
                        onChange={(e) => setSelectedPlan({...selectedPlan, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={selectedPlan.status}
                        onChange={(e) => setSelectedPlan({...selectedPlan, status: e.target.value as 'Active' | 'Disabled'})}
                      >
                        <option value="Active">Active</option>
                        <option value="Disabled">Disabled</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Monthly Price (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={selectedPlan.monthlyPrice}
                        onChange={(e) => setSelectedPlan({...selectedPlan, monthlyPrice: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Yearly Price (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={selectedPlan.yearlyPrice}
                        onChange={(e) => setSelectedPlan({...selectedPlan, yearlyPrice: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Yearly Discount (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={selectedPlan.discountYearly}
                        onChange={(e) => setSelectedPlan({...selectedPlan, discountYearly: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Max Students</label>
                      <input
                        type="number"
                        className="form-control"
                        value={selectedPlan.maxStudents}
                        onChange={(e) => setSelectedPlan({...selectedPlan, maxStudents: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Max Branches</label>
                      <input
                        type="number"
                        className="form-control"
                        value={selectedPlan.maxBranches}
                        onChange={(e) => setSelectedPlan({...selectedPlan, maxBranches: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Storage Limit (GB)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={selectedPlan.storageLimit}
                        onChange={(e) => setSelectedPlan({...selectedPlan, storageLimit: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Trial Days</label>
                      <input
                        type="number"
                        className="form-control"
                        value={selectedPlan.trialDays}
                        onChange={(e) => setSelectedPlan({...selectedPlan, trialDays: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h6>Module Mapping ({(selectedPlan.modules || []).length} modules)</h6>
                  <div className="row g-2">
                    {(selectedPlan.modules || []).map((module) => (
                      <div className="col-md-6" key={module.id}>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`module-${module.id}`}
                            checked={module.enabled}
                            disabled={module.mandatory}
                            onChange={() => {
                              const updatedModules = (selectedPlan.modules || []).map(m => 
                                m.id === module.id ? { ...m, enabled: !m.enabled } : m
                              )
                              setSelectedPlan({...selectedPlan, modules: updatedModules})
                            }}
                          />
                          <label className="form-check-label" htmlFor={`module-${module.id}`}>
                            <div className="d-flex align-items-center">
                              <i className={`${module.icon || 'ti ti-package'} me-1`}></i>
                              <span>{module.name}</span>
                              {module.mandatory && (
                                <small className="text-warning ms-2">MANDATORY</small>
                              )}
                              {module.isBeta && (
                                <small className="text-info ms-2">BETA</small>
                              )}
                            </div>
                            {module.description && (
                              <small className="text-muted d-block">{module.description}</small>
                            )}
                            {module.dependencyModules?.length && (
                              <small className="text-muted d-block">Requires: {module.dependencyModules.join(', ')}</small>
                            )}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleUpdatePlan}>
                  Update Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Comparison Modal */}
      {showComparison && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Plan Comparison</h5>
                <button type="button" className="btn-close" onClick={() => setShowComparison(false)}></button>
              </div>
              <div className="modal-body">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Feature</th>
                        {safePlans.map((plan) => (
                          <th key={plan.id} className="text-center">
                            {plan.name}
                            <br />
                            <small>{formatCurrency(plan.monthlyPrice)}/mo</small>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Status</strong></td>
                        {safePlans.map((plan) => (
                          <td key={plan.id} className="text-center">
                            <span className={`badge ${plan.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                              {plan.status}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td><strong>Monthly Price</strong></td>
                        {safePlans.map((plan) => (
                          <td key={plan.id} className="text-center">
                            {formatCurrency(plan.monthlyPrice)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td><strong>Yearly Price</strong></td>
                        {safePlans.map((plan) => (
                          <td key={plan.id} className="text-center">
                            {formatCurrency(plan.yearlyPrice)}
                            <br />
                            <small className="text-success">Save {plan.discountYearly || 0}%</small>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td><strong>Max Students</strong></td>
                        {safePlans.map((plan) => (
                          <td key={plan.id} className="text-center">
                            {(plan.maxStudents || 0).toLocaleString('en-IN')}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td><strong>Max Branches</strong></td>
                        {safePlans.map((plan) => (
                          <td key={plan.id} className="text-center">
                            {plan.maxBranches || 0}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td><strong>Storage Limit</strong></td>
                        {safePlans.map((plan) => (
                          <td key={plan.id} className="text-center">
                            {plan.storageLimit || 0} GB
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td><strong>Trial Days</strong></td>
                        {safePlans.map((plan) => (
                          <td key={plan.id} className="text-center">
                            {plan.trialDays || 0} days
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td><strong>Active Schools</strong></td>
                        {safePlans.map((plan) => (
                          <td key={plan.id} className="text-center">
                            {plan.activeSchools || 0}
                          </td>
                        ))}
                      </tr>
                      {(safePlans[0]?.modules || []).map((module) => (
                        <tr key={module.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className={`${module.icon || 'ti ti-package'} me-1`}></i>
                              <strong>{module.name}</strong>
                              {module.mandatory && (
                                <small className="text-warning ms-2">MANDATORY</small>
                              )}
                              {module.isBeta && (
                                <small className="text-info ms-2">BETA</small>
                              )}
                            </div>
                            {module.description && (
                              <small className="text-muted d-block">{module.description}</small>
                            )}
                          </td>
                          {safePlans.map((plan) => {
                            const planModule = (plan.modules || []).find(m => m.id === module.id)
                            return (
                              <td key={plan.id} className="text-center">
                                {planModule ? (
                                  <div>
                                    <i className={`ti ti-${planModule.enabled ? 'check text-success' : 'x text-danger'}`}></i>
                                    {planModule.dependencyModules?.length && (
                                      <small className="text-muted d-block">Has deps</small>
                                    )}
                                  </div>
                                ) : (
                                  <i className="ti ti-minus text-muted"></i>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowComparison(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleConfirmDelete} message="Are you sure you want to delete this plan?" />
    </>
  )
}
</>
)
}

export default MembershipsManagementPage
