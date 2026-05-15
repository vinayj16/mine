import React, { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { getInstitutionConfigFromPath } from '../../utils/institutionUtils'
import { apiService } from '../../services/api'

interface School {
  id: string
  name: string
  plan: 'Basic' | 'Medium' | 'Premium'
  status: 'Active' | 'Suspended' | 'Expired'
  expiryDate: string
  students: number
  monthlyRevenue: number
  totalRevenue: number
}

const extractPlanName = (plan: any): 'Basic' | 'Medium' | 'Premium' => {
  if (!plan) return 'Basic'
  if (typeof plan === 'string') {
    const normalized = plan.charAt(0).toUpperCase() + plan.slice(1)
    if (normalized === 'Basic' || normalized === 'Medium' || normalized === 'Premium') return normalized
    if (normalized.includes('Professional') || normalized.includes('Enterprise')) return 'Premium'
    return 'Basic'
  }
  if (typeof plan === 'object' && plan.name) {
    return extractPlanName(plan.name)
  }
  return 'Basic'
}

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  studentLimit: number
  userLimit: number
  isPopular?: boolean
}

const InstitutionsUpgradePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const location = useLocation()
  const institutionConfig = getInstitutionConfigFromPath(location.pathname)

  // Get institution by ID and type from the current path
  // const institutionType = location.pathname.includes('/inter-colleges') ? 'inter-colleges' : 
  //                         location.pathname.includes('/degree-colleges') ? 'degree-colleges' : 'schools'

  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch school from API based on institution type
        const response = await apiService.get(`/schools/${id}`)

        if (response.success && response.data) {
          const data = response.data as any
          setSchool({
            ...data,
            plan: extractPlanName(data.plan),
            status: data.status ? (data.status.charAt(0).toUpperCase() + data.status.slice(1)) : 'Active',
            expiryDate: data.subscriptionExpiry || data.expiryDate || '',
            students: data.currentUsers || data.students || 0,
          } as School)
        } else {
          setError('Failed to fetch school details')
        }
      } catch (err) {
        console.error('Error fetching school:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch school details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchSchool()
    }
  }, [id])

  const [selectedPlan, setSelectedPlan] = useState<string>('premium')

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      features: [
        'Core dashboards',
        'Student management',
        'Teacher management',
        'Academic management',
        'Student attendance',
        'Basic reports',
        'User & role management',
        'School settings'
      ],
      studentLimit: 100,
      userLimit: 5
    },
    {
      id: 'medium',
      name: 'Medium',
      price: 79,
      features: [
        'Everything in Basic',
        'Parent & guardian management',
        'Exams & results',
        'Fees & accounts',
        'Library management',
        'Full reports',
        'Email / SMS notifications'
      ],
      studentLimit: 500,
      userLimit: 20
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 199,
      features: [
        'Everything in Medium',
        'Transport management',
        'Hostel management',
        'HR & payroll',
        'Advanced reports',
        'Custom branding',
        'Priority support'
      ],
      studentLimit: 2000,
      userLimit: 100,
      isPopular: true
    }
  ]

  const getCurrentPlan = () => {
    return plans.find(
      (p) => p.name.toLowerCase() === school?.plan.toLowerCase()
    )
  }

  const handleUpgrade = async () => {
    if (!school) return

    try {
      const selectedPlanData = plans.find((p) => p.id === selectedPlan)
      if (!selectedPlanData) return

      const response = await apiService.post(`/subscriptions/schools/${id}/upgrade`, {
        newPlan: selectedPlanData.name,
        planId: selectedPlan
      })

      if (response.success) {
        console.log('School upgraded successfully:', response.data)
        // Update local state to reflect the upgrade
        setSchool(prev => prev ? {
          ...prev,
          plan: selectedPlanData.name as 'Basic' | 'Medium' | 'Premium'
        } : null)

        alert(`School ${school.name} upgraded to ${selectedPlanData.name} plan successfully!`)

        // Optionally redirect back to details page
        // window.location.href = `/super-admin/institutions/${institutionConfig?.basePath?.split('/').pop()}/${id}`
      } else {
        setError('Failed to upgrade school plan')
      }
    } catch (err) {
      console.error('Error upgrading school:', err)
      setError(err instanceof Error ? err.message : 'Failed to upgrade school plan')
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

  if (!school) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <div className="alert alert-warning">School not found</div>
          <Link to={institutionConfig?.basePath || '/super-admin/institutions'} className="btn btn-primary">
            Back to Institutions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Upgrade {institutionConfig?.singularName || 'Institution'} Plan</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/institutions">Institutions</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={institutionConfig?.basePath || '#'}>{institutionConfig?.name || 'Institutions'}</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`${institutionConfig?.basePath || '#'}/${school.id}`}>
                  {school.name}
                </Link>
              </li>
              <li className="breadcrumb-item active">Upgrade Plan</li>
            </ol>
          </nav>
        </div>

        <div className="d-flex align-items-center">
          <Link
            to={`${institutionConfig?.basePath || '#'}/${school.id}`}
            className="btn btn-outline-light bg-white btn-icon me-2"
          >
            <i className="ti ti-arrow-left"></i>
          </Link>

          <button className="btn btn-success" onClick={handleUpgrade}>
            <i className="ti ti-credit-card me-2"></i>
            Process Upgrade
          </button>
        </div>
      </div>

      {/* Current Plan Info */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-warning">
            <div className="card-body d-flex align-items-center">
              <div className="avatar avatar-xl me-3">
                <i className="ti ti-info text-white"></i>
              </div>
              <div>
                <h4 className="text-white mb-1">
                  Current Plan: {school.plan}
                </h4>
                <p className="text-white mb-0">{institutionConfig?.name || 'Institution'}: {school.name}</p>
                <p className="text-white mb-0">
                  Students: {school.students} /{' '}
                  {getCurrentPlan()?.studentLimit}
                </p>
                <p className="text-white mb-0">
                  Expires: {school.expiryDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="row">
        {plans.map((plan) => (
          <div key={plan.id} className="col-lg-4 col-md-6 mb-4">
            <div
              className={`card h-100 ${plan.id === selectedPlan ? 'border-primary' : ''
                }`}
            >
              {plan.isPopular && (
                <div className="card-header bg-primary text-white text-center">
                  <span className="badge bg-light text-primary">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="card-body d-flex flex-column">
                <div className="text-center mb-3">
                  <h4>{plan.name}</h4>
                  <div className="display-6">
                    <sup>$</sup>
                    <span className="text-primary">{plan.price}</span>
                    <span className="text-muted"> / month</span>
                  </div>
                </div>

                <ul className="list-unstyled mb-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="mb-2">
                      <i className="ti ti-check text-success me-2"></i>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mb-4">
                  <strong>Students:</strong> {plan.studentLimit} <br />
                  <strong>Users:</strong> {plan.userLimit}
                </div>

                <div className="mt-auto">
                  {plan.name === school.plan ? (
                    <button className="btn btn-secondary w-100" disabled>
                      Current Plan
                    </button>
                  ) : (
                    <button
                      className={`btn w-100 ${plan.id === selectedPlan
                          ? 'btn-primary'
                          : 'btn-outline-primary'
                        }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      {plan.id === selectedPlan ? 'Selected' : 'Select Plan'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade Summary */}
      {selectedPlan !== school.plan.toLowerCase() && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card bg-primary text-white">
              <div className="card-body d-flex justify-content-between">
                <div>
                  <h4>Upgrade Summary</h4>
                  <p>
                    From {school.plan} →{' '}
                    {plans.find((p) => p.id === selectedPlan)?.name}
                  </p>
                </div>

                <div className="text-end">
                  <div>
                    Old: ${getCurrentPlan()?.price}/month <br />
                    New:{' '}
                    ${plans.find((p) => p.id === selectedPlan)?.price}/month
                  </div>
                  <div className="display-6">
                    +$
                    {(plans.find((p) => p.id === selectedPlan)?.price || 0) -
                      (getCurrentPlan()?.price || 0)}
                    /month
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default InstitutionsUpgradePage;
