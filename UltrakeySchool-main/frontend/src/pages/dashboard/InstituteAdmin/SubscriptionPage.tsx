import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../../../api/client'
import { useAuthStore } from '../../../store/authStore'

declare global {
  interface Window {
    Razorpay: any
  }
}

const SubscriptionPage: React.FC = () => {
  const { user } = useAuthStore()
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [step, setStep] = useState<'plans' | 'success'>('plans')
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await apiClient.get('/subscriptions/plans')
      if (response.data.success) {
        const planData = response.data.data
        setPlans(Array.isArray(planData) ? planData : [])
        if (Array.isArray(planData) && planData.length > 0) {
          setSelectedPlan(planData[0].id || planData[0]._id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    }
  }

  const getPrice = (plan: any) => {
    if (billingCycle === 'yearly' && plan.yearlyPrice) return plan.yearlyPrice
    return plan.price || plan.monthlyPrice || 0
  }

  const getOriginalPrice = (plan: any) => {
    if (billingCycle === 'yearly' && plan.price) return plan.price * 12
    return 0
  }

  const currentPlan = plans?.find(p => (p.id || p._id) === selectedPlan)
  const planPrice = currentPlan ? getPrice(currentPlan) : 0

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePlanSelect = async (planId: string) => {
    setSelectedPlan(planId)
    setLoading(true)

    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Failed to load payment gateway. Please try again.')
        setLoading(false)
        return
      }

      const orderRes = await apiClient.post('/subscriptions/create-order', {
        planId,
        billingCycle
      })

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to create order')
      }

      const { orderId, amount, key_id } = orderRes.data.data

      const options = {
        key: key_id,
        amount: amount * 100,
        currency: orderRes.data.data.currency || 'INR',
        name: 'EduSearch',
        description: `${currentPlan?.name || planId} Plan (${billingCycle})`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await apiClient.post('/subscriptions/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
              billingCycle,
              institutionId: user?.institutionId
            })

            if (verifyRes.data.success) {
              setStep('success')
            } else {
              throw new Error(verifyRes.data.message || 'Verification failed')
            }
          } catch (err: any) {
            console.error('Payment verification failed:', err)
            toast.error('Payment verification failed. Please contact support.')
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
            toast.info('Payment cancelled')
          }
        },
        prefill: {
          name: user?.name || user?.fullName || '',
          email: user?.email || '',
          contact: user?.phone || user?.mobile || ''
        },
        theme: {
          color: '#6366f1'
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error: any) {
      console.error('Failed to initiate payment:', error)
      toast.error(error.message || 'Failed to initiate payment')
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="content">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <div style={{ width: 80, height: 80, margin: '0 auto' }} className="bg-success d-flex align-items-center justify-content-center rounded-circle">
                    <i className="ti ti-check text-white" style={{ fontSize: 36 }}></i>
                  </div>
                </div>
                <h3 className="mb-3 fw-bold">Payment Successful!</h3>
                <p className="text-muted mb-4" style={{ maxWidth: 400, margin: '0 auto' }}>
                  Your payment of <strong className="text-dark">₹{planPrice.toLocaleString()}</strong> for <strong className="text-dark">{currentPlan?.name}</strong> plan has been processed successfully.
                </p>
                <div className="alert alert-info d-flex align-items-center" style={{ borderRadius: 12 }}>
                  <i className="ti ti-info-circle me-2 fs-5"></i>
                  <span>Your subscription is <strong>Pending Approval</strong>. The SuperAdmin will review and activate it shortly.</span>
                </div>
                <div className="d-flex justify-content-center gap-3 mt-4">
                  <Link to="/dashboard/main" className="btn btn-primary btn-lg px-4" style={{ borderRadius: 10 }}>
                    <i className="ti ti-home me-1"></i> Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="page-title mb-1 fw-bold">Choose Your Plan</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/main">Dashboard</Link></li>
              <li className="breadcrumb-item active">Subscription</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="d-flex justify-content-center mb-5">
        <div className="d-flex align-items-center bg-light p-1 rounded-4" style={{ gap: 0 }}>
          <button
            className={`btn px-4 py-2 rounded-3 fw-semibold ${billingCycle === 'monthly' ? 'btn-primary shadow-sm' : 'btn-light border-0'}`}
            onClick={() => setBillingCycle('monthly')}
            style={{ minWidth: 120, transition: 'all 0.2s ease' }}
          >
            Monthly
          </button>
          <button
            className={`btn px-4 py-2 rounded-3 fw-semibold position-relative ${billingCycle === 'yearly' ? 'btn-primary shadow-sm' : 'btn-light border-0'}`}
            onClick={() => setBillingCycle('yearly')}
            style={{ minWidth: 120, transition: 'all 0.2s ease' }}
          >
            Annual
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success" style={{ fontSize: 10 }}>
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="row justify-content-center g-4">
        {plans.map((plan) => {
          const planId = plan.id || plan._id
          const isSelected = selectedPlan === planId
          const price = getPrice(plan)
          const originalPrice = getOriginalPrice(plan)
          const features = plan.features || []
          const userLimit = plan.userLimit === -1 ? 'Unlimited' : (plan.userLimit || plan.maxBranches || '—')
          const studentLimit = plan.studentLimit === -1 ? 'Unlimited' : (plan.studentLimit || plan.maxStudents || '—')

          return (
            <div key={planId} className="col-lg-4 col-md-6">
              <div
                className={`card border-0 h-100 position-relative ${isSelected ? 'shadow-lg' : 'shadow-sm'}`}
                style={{
                  borderRadius: 16,
                  border: isSelected ? '2px solid #6366f1' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedPlan(planId)}
                onMouseEnter={(e) => !isSelected && (e.currentTarget.style.borderColor = '#e2e8f0')}
                onMouseLeave={(e) => !isSelected && (e.currentTarget.style.borderColor = 'transparent')}
              >
                {plan.isPopular && (
                  <span className="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-primary px-3 py-2" style={{ zIndex: 1 }}>
                    <i className="ti ti-star-filled me-1" style={{ fontSize: 12 }}></i>
                    Most Popular
                  </span>
                )}
                <div className="card-body p-4">
                  <div className="text-center mb-4 pt-2">
                    <h4 className="fw-bold mb-1">{plan.name}</h4>
                    <p className="text-muted small mb-3">{plan.description || `Perfect for growing institutions`}</p>
                    <div className="mb-2">
                      <span className="fw-bold" style={{ fontSize: '2.5rem', color: '#6366f1' }}>
                        ₹{price?.toLocaleString() || 0}
                      </span>
                      <span className="text-muted ms-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                    {billingCycle === 'yearly' && originalPrice > price && (
                      <p className="small text-success mb-0">
                        <i className="ti ti-discount-2 me-1"></i>
                        Save ₹{(originalPrice - price).toLocaleString()} / year
                      </p>
                    )}
                  </div>

                  <ul className="list-unstyled mb-4" style={{ minHeight: 200 }}>
                    {(features || []).slice(0, 6).map((feature: string, idx: number) => (
                      <li key={idx} className="mb-2 d-flex align-items-start">
                        <i className="ti ti-circle-check text-success me-2 mt-1" style={{ fontSize: 14 }}></i>
                        <span className="small">{feature}</span>
                      </li>
                    ))}
                    {(features || []).length > 6 && (
                      <li className="text-muted small mt-2">
                        <i className="ti ti-plus me-1"></i>
                        {(features || []).length - 6} more features
                      </li>
                    )}
                    {(features || []).length === 0 && (
                      <li className="text-muted small d-flex align-items-center mb-2">
                        <i className="ti ti-users me-2"></i>
                        Up to {userLimit} users
                      </li>
                    )}
                  </ul>

                  <div className="border-top pt-3 mb-3">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span><i className="ti ti-users me-1"></i> Users</span>
                      <span className="fw-medium text-dark">{userLimit}</span>
                    </div>
                    <div className="d-flex justify-content-between small text-muted">
                      <span><i className="ti ti-book me-1"></i> Students</span>
                      <span className="fw-medium text-dark">{studentLimit}</span>
                    </div>
                  </div>

                  <button
                    className={`btn w-100 py-2 fw-semibold ${isSelected ? 'btn-primary' : 'btn-outline-primary'}`}
                    style={{ borderRadius: 10 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlanSelect(planId)
                    }}
                    disabled={loading}
                  >
                    {loading && selectedPlan === planId ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <i className={`ti ${isSelected ? 'ti-credit-card' : 'ti-file-description'} me-1`}></i>
                        {isSelected ? `Subscribe ₹${price?.toLocaleString() || 0}/${billingCycle === 'monthly' ? 'mo' : 'yr'}` : 'Choose Plan'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      {plans.length > 1 && (
        <div className="card border-0 shadow-sm mt-5" style={{ borderRadius: 16 }}>
          <div className="card-header bg-transparent border-0 pt-4 pb-0">
            <h5 className="fw-bold mb-0">Plan Comparison</h5>
          </div>
          <div className="card-body p-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ borderTopLeftRadius: 12 }}>Feature</th>
                    {plans.map(p => (
                      <th key={p.id || p._id} className="text-center fw-semibold">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-medium">Max Users</td>
                    {plans.map(p => (
                      <td key={p.id || p._id} className="text-center">
                        {p.userLimit === -1 ? 'Unlimited' : (p.userLimit || p.maxBranches || '—')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="fw-medium">Max Students</td>
                    {plans.map(p => (
                      <td key={p.id || p._id} className="text-center">
                        {p.studentLimit === -1 ? 'Unlimited' : (p.studentLimit || p.maxStudents || '—')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="fw-medium">Monthly Price</td>
                    {plans.map(p => (
                      <td key={p.id || p._id} className="text-center">
                        <span className="fw-semibold text-primary">₹{(p.price || p.monthlyPrice || 0).toLocaleString()}</span>
                      </td>
                    ))}
                  </tr>
                  {plans.some(p => p.yearlyPrice) && (
                    <tr>
                      <td className="fw-medium">Yearly Price</td>
                      {plans.map(p => (
                        <td key={p.id || p._id} className="text-center">
                          <span className="fw-semibold text-success">
                            {p.yearlyPrice ? `₹${p.yearlyPrice.toLocaleString()}` : '—'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  )}
                  <tr>
                    <td className="fw-medium">Features</td>
                    {plans.map(p => (
                      <td key={p.id || p._id} className="text-center">
                        {(p.features || []).length} features
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionPage
