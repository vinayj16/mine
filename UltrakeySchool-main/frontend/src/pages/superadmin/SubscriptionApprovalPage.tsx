import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../api/client'

interface Subscription {
  _id: string
  schoolId: {
    _id: string
    name: string
    instituteCode: string
  }
  planId: string
  planName: string
  status: string
  approvalStatus: string
  price: number
  currency: string
  startDate: string
  endDate: string
  createdAt: string
  features: string[]
  paymentMethod: {
    type: string
    brand: string
    lastFour: string
  }
}

const SubscriptionApprovalPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [notes, setNotes] = useState<{ [key: string]: string }>({})
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.log('No authentication token found')
      setAuthError(true)
      setLoading(false)
      return
    }

    let isMounted = true
    
    const fetchPendingSubscriptions = async () => {
      try {
        console.log('Fetching pending subscriptions...')
        const response = await apiClient.get('/subscriptions/pending')
        console.log('Response received:', response.data)
        
        if (isMounted && response.data.success) {
          setSubscriptions(response.data.data || [])
        }
      } catch (error: any) {
        console.error('Failed to fetch pending subscriptions:', error)
        
        // Check if it's an auth error
        if (error.response?.status === 401) {
          console.log('Authentication error - redirecting to login')
          setAuthError(true)
        }
        
        if (isMounted) {
          setSubscriptions([]) // Set empty array on error to prevent infinite loading
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchPendingSubscriptions()
    
    return () => {
      isMounted = false
    }
  }, [])

  const handleApprove = async (subscriptionId: string) => {
    setProcessing(subscriptionId)
    try {
      const response = await apiClient.patch(`/subscriptions/${subscriptionId}/approve`, {
        action: 'approve',
        notes: notes[subscriptionId] || 'Approved by SuperAdmin'
      })

      if (response.data.success) {
        // Remove from pending list
        setSubscriptions(prev => prev.filter(sub => sub._id !== subscriptionId))
        alert('Subscription approved successfully!')
      } else {
        alert('Failed to approve subscription')
      }
    } catch (error) {
      console.error('Approval error:', error)
      alert('Error approving subscription')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (subscriptionId: string) => {
    if (!notes[subscriptionId]?.trim()) {
      alert('Please provide rejection notes')
      return
    }

    setProcessing(subscriptionId)
    try {
      const response = await apiClient.patch(`/subscriptions/${subscriptionId}/approve`, {
        action: 'reject',
        notes: notes[subscriptionId]
      })

      if (response.data.success) {
        // Remove from pending list
        setSubscriptions(prev => prev.filter(sub => sub._id !== subscriptionId))
        alert('Subscription rejected successfully!')
      } else {
        alert('Failed to reject subscription')
      }
    } catch (error) {
      console.error('Rejection error:', error)
      alert('Error rejecting subscription')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge-soft-warning'
      case 'active':
        return 'badge-soft-success'
      case 'rejected':
        return 'badge-soft-danger'
      default:
        return 'badge-soft-secondary'
    }
  }

  // Handle authentication error
  if (authError) {
    return (
      <div className="content">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="ti ti-lock text-danger fs-1 mb-3"></i>
            <h4 className="mb-3">Authentication Required</h4>
            <p className="text-muted">You need to be logged in as SuperAdmin to access this page.</p>
            <div className="d-flex justify-content-center gap-2">
              <button 
                className="btn btn-primary"
                onClick={() => window.location.href = '/login'}
              >
                <i className="ti ti-login me-1"></i>
                Login
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => window.location.reload()}
              >
                <i className="ti ti-refresh me-1"></i>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="content">
        <div className="d-flex justify-content-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  // Handle error state
  if (!subscriptions) {
    return (
      <div className="content">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="ti ti-alert-circle text-warning fs-1 mb-3"></i>
            <h4 className="mb-3">Error Loading Subscriptions</h4>
            <p className="text-muted">There was an error loading subscription requests. Please try again.</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              <i className="ti ti-refresh me-1"></i>
              Reload Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="page-title mb-1">Subscription Approvals</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/super-admin/dashboard">Dashboard</Link></li>
              <li className="breadcrumb-item active">Subscription Approvals</li>
            </ol>
          </nav>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="ti ti-check-circle text-success fs-1 mb-3"></i>
            <h4 className="mb-3">No Pending Approvals</h4>
            <p className="text-muted">All subscription requests have been processed.</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {subscriptions.map((subscription) => (
            <div className="col-lg-6 mb-4" key={subscription._id}>
              <div className="card border-0 shadow-sm">
                <div className="card-header border-bottom">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{subscription.schoolId.name}</h5>
                    <span className={`badge ${getStatusBadge(subscription.status)}`}>
                      {subscription.approvalStatus}
                    </span>
                  </div>
                  <small className="text-muted">Code: {subscription.schoolId.instituteCode}</small>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Plan:</strong> {subscription.planName}</p>
                      <p className="mb-1"><strong>Price:</strong> ${subscription.price}/{subscription.currency}</p>
                      <p className="mb-1"><strong>Duration:</strong> {new Date(subscription.startDate).toLocaleDateString()} - {new Date(subscription.endDate).toLocaleDateString()}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Payment:</strong> {subscription.paymentMethod.brand} ****{subscription.paymentMethod.lastFour}</p>
                      <p className="mb-1"><strong>Requested:</strong> {new Date(subscription.createdAt).toLocaleDateString()}</p>
                      <p className="mb-1"><strong>Type:</strong> {subscription.paymentMethod.type}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <strong>Features:</strong>
                    <div className="mt-1">
                      {subscription.features.slice(0, 3).map((feature, idx) => (
                        <span key={idx} className="badge bg-light text-dark me-1 mb-1">
                          {feature}
                        </span>
                      ))}
                      {subscription.features.length > 3 && (
                        <span className="badge bg-light text-dark me-1 mb-1">
                          +{subscription.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label"><strong>Notes:</strong></label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Add notes for approval/rejection..."
                      value={notes[subscription._id] || ''}
                      onChange={(e) => setNotes(prev => ({
                        ...prev,
                        [subscription._id]: e.target.value
                      }))}
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-success flex-fill"
                      onClick={() => handleApprove(subscription._id)}
                      disabled={processing === subscription._id}
                    >
                      {processing === subscription._id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="ti ti-check me-1"></i>
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-danger flex-fill"
                      onClick={() => handleReject(subscription._id)}
                      disabled={processing === subscription._id}
                    >
                      {processing === subscription._id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="ti ti-x me-1"></i>
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SubscriptionApprovalPage
