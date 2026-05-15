import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PAYMENT_METHODS, INDIAN_BANKS, CARD_TYPES } from '../../../data/indiaData'
import apiClient from '../../../api/client'
import { useAuthStore } from '../../../store/authStore'

const SubscriptionPage: React.FC = () => {
  const { user } = useAuthStore()
  const [selectedPlan, setSelectedPlan] = useState<string>('basic')
  const [step, setStep] = useState<'plans' | 'payment' | 'success'>('plans')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  
  // Payment form state
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [upiId, setUpiId] = useState('')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await apiClient.get('/subscriptions/plans')
      if (response.data.success) {
        setPlans(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      // Fallback to basic plans if API fails
      setPlans([
        { id: 'basic', name: 'Basic', price: 29, studentLimit: 100, userLimit: 5, features: ['Core dashboards', 'Student management', 'Teacher management', 'Basic academic management'] },
        { id: 'medium', name: 'Medium', price: 79, studentLimit: 500, userLimit: 20, features: ['Everything in Basic', 'Parent management', 'Exams & results', 'Fees management', 'Library management'] },
        { id: 'premium', name: 'Premium', price: 199, studentLimit: 2000, userLimit: 100, features: ['Everything in Medium', 'Transport management', 'Hostel management', 'HR & payroll', 'Advanced reporting', 'API access'] }
      ])
    }
  }

  const currentPlan = plans?.find(p => p.id === selectedPlan)
  const planPrice = currentPlan?.price || 0

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    setStep('payment')
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Prepare payment data
      const paymentData = {
        planId: selectedPlan,
        billingCycle: 'monthly',
        paymentMethod: {
          type: paymentMethod,
          brand: paymentMethod.includes('card') ? 'Visa' : 'Other',
          lastFour: paymentMethod.includes('card') ? cardNumber.slice(-4) : ''
        },
        institutionId: user?.institutionId,
        userId: user?.id,
        amount: planPrice,
        currency: 'USD'
      }

      // Save subscription request to backend
      const response = await apiClient.post('/subscriptions/create', paymentData)
      
      if (response.data.success) {
        setStep('success')
      } else {
        throw new Error(response.data.message || 'Payment failed')
      }
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  if (step === 'success') {
    return (
      <div className="content">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-0 shadow-lg">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <div className="avatar avatar-xl bg-success rounded-circle">
                    <i className="ti ti-check text-white fs-2"></i>
                  </div>
                </div>
                <h3 className="mb-3">Payment Successful!</h3>
                <p className="text-muted mb-4">
                  Your payment of ${planPrice.toLocaleString()} for {currentPlan?.name} plan has been processed.
                  Your subscription is now pending approval from the SuperAdmin.
                  You will receive full access once approved.
                </p>
                <div className="alert alert-info">
                  <i className="ti ti-info-circle me-2"></i>
                  Your subscription status is: <strong>Pending Approval</strong>. The SuperAdmin will review and activate your subscription shortly.
                </div>
                <div className="d-flex justify-content-center gap-3 mt-4">
                  <Link to="/dashboard/main" className="btn btn-primary">
                    <i className="ti ti-home me-1"></i> Back to Dashboard
                  </Link>
                  <Link to="/dashboard/settings" className="btn btn-outline-secondary">
                    <i className="ti ti-settings me-1"></i> Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'payment') {
    return (
      <div className="content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="page-title mb-1">Payment</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item"><Link to="/dashboard/main">Dashboard</Link></li>
                <li className="breadcrumb-item"><Link to="/dashboard/subscription">Subscription</Link></li>
                <li className="breadcrumb-item active">Payment</li>
              </ol>
            </nav>
          </div>
          <button onClick={() => setStep('plans')} className="btn btn-outline-secondary">
            <i className="ti ti-arrow-left me-1"></i> Back
          </button>
        </div>

        <div className="row">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header">
                <h5 className="mb-0">Select Payment Method</h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  {PAYMENT_METHODS.map((method) => (
                    <div className="col-md-6 mb-3" key={method.id}>
                      <div 
                        className={`card cursor-pointer border ${paymentMethod === method.id ? 'border-primary bg-primary-light' : ''}`}
                        onClick={() => setPaymentMethod(method.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="card-body d-flex align-items-center">
                          <i className={`ti ${method.icon} fs-3 me-3 ${paymentMethod === method.id ? 'text-primary' : 'text-muted'}`}></i>
                          <span className="fw-medium">{method.name}</span>
                          {paymentMethod === method.id && (
                            <i className="ti ti-check-circle text-primary ms-auto"></i>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {paymentMethod && (
                  <form onSubmit={handlePayment}>
                    {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Card Type</label>
                          <select className="form-select" required>
                            <option value="">Select Card Type</option>
                            {CARD_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Card Number</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            maxLength={19}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Card Holder Name</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Enter card holder name"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Expiry Date</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="MM/YY"
                              value={expiry}
                              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                              maxLength={5}
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">CVV</label>
                            <input 
                              type="password" 
                              className="form-control" 
                              placeholder="***"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              maxLength={4}
                              required
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {paymentMethod === 'net_banking' && (
                      <div className="mb-3">
                        <label className="form-label">Select Bank</label>
                        <select 
                          className="form-select" 
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          required
                        >
                          <option value="">Select Your Bank</option>
                          {INDIAN_BANKS.map(bank => (
                            <option key={bank} value={bank}>{bank}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {paymentMethod === 'upi' && (
                      <div className="mb-3">
                        <label className="form-label">UPI ID</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="yourname@upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          required
                        />
                        <small className="text-muted">Enter your UPI ID (e.g., mobile number@upi)</small>
                      </div>
                    )}

                    <div className="alert alert-warning mt-4">
                      <i className="ti ti-info-circle me-2"></i>
                      <strong>Note:</strong> This is a demo payment. No real charges will be made.
                    </div>

                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="ti ti-credit-card me-1"></i>
                          Pay ${(planPrice + Math.round(planPrice * 0.1)).toLocaleString()}
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Order Summary</h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span>Plan</span>
                  <strong>{currentPlan?.name}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Duration</span>
                  <span>Monthly</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>${planPrice.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tax</span>
                  <span>${Math.round(planPrice * 0.1).toLocaleString()}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <strong>Total</strong>
                  <strong className="text-primary">${(planPrice + Math.round(planPrice * 0.1)).toLocaleString()}</strong>
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
          <h3 className="page-title mb-1">Subscription Plans</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/main">Dashboard</Link></li>
              <li className="breadcrumb-item active">Subscription</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row">
        {plans.map((plan) => (
          <div className="col-md-6 col-lg-3 mb-4" key={plan.id}>
            <div className={`card border-0 shadow-sm h-100 ${selectedPlan === plan.id ? 'border-primary' : ''}`}>
              <div className="card-header bg-transparent">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{plan.name}</h5>
                  {plan.id === 'premium' && <span className="badge bg-success">Popular</span>}
                </div>
              </div>
              <div className="card-body">
                <div className="text-center mb-4">
                  <span className="fs-1 fw-bold text-primary">${plan.price?.toLocaleString() || 0}</span>
                  <span className="text-muted">/month</span>
                </div>
                <ul className="list-unstyled mb-4">
                  {(plan.features || []).slice(0, 5).map((feature: string, idx: number) => (
                    <li key={idx} className="mb-2">
                      <i className="ti ti-check text-success me-2"></i>
                      {feature}
                    </li>
                  ))}
                  {(plan.features || []).length > 5 && (
                    <li className="text-muted">+{(plan.features || []).length - 5} more features</li>
                  )}
                </ul>
                <button 
                  className={`btn w-100 ${selectedPlan === plan.id ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Comparison */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-header">
          <h5 className="mb-0">Plan Comparison</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Feature</th>
                  {plans.map(p => <th key={p.id} className="text-center">{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Max Users</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {p.userLimit === -1 ? 'Unlimited' : p.userLimit || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Max Students</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {p.studentLimit === -1 ? 'Unlimited' : p.studentLimit || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Price</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      ${p.price?.toLocaleString() || 0}/month
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPage