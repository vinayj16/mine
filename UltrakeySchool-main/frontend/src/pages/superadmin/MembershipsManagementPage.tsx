import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/api'

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
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await apiService.get('/subscriptions/plans')
        
        if (response.success) {
          // The backend returns: { success: true, data: [...plans], message: '...' }
          // So the plans array is directly at response.data
          let plansData = [];
          
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

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
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
      alert('Plan created successfully!')
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
        alert('Plan updated successfully!')
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

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        try {
          const response = await apiService.delete(`/subscriptions/plans/${planId}`)
          
          if (response.success) {
            setPlans(plans.filter(p => p.id !== planId))
          } else {
            setPlans(plans.filter(p => p.id !== planId))
          }
        } catch {
          setPlans(plans.filter(p => p.id !== planId))
        }
        alert('Plan deleted successfully!')
      } catch (err) {
        console.error('Error deleting plan:', err)
        setError(err instanceof Error ? err.message : 'Failed to delete plan')
      }
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

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Subscription Plans</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/super-admin/dashboard">Dashboard</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Subscription Plans</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
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
        </div>
      </div>

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
    </>
  )
}

export default MembershipsManagementPage
