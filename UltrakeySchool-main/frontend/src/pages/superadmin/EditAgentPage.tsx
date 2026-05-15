import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import agentService, { type Agent } from '../../services/agentService'

const EditAgentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    commissionRate: 10,
    status: 'Active' as 'Active' | 'Suspended' | 'Inactive',
    performance: 'Average' as 'Excellent' | 'Good' | 'Average' | 'Poor',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchAgent = async () => {
      if (!id) {
        setError('Agent ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const agentData = await agentService.getById(id)
        setAgent(agentData)
        setFormData({
          name: agentData.name || '',
          email: agentData.email || '',
          phone: agentData.phone || '',
          address: agentData.address || '',
          city: agentData.city || '',
          state: agentData.state || '',
          country: agentData.country || '',
          postalCode: agentData.postalCode || '',
          commissionRate: agentData.commissionRate || 10,
          status: agentData.status || 'Active',
          performance: agentData.performance || 'Average',
          notes: agentData.notes || ''
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch agent')
      } finally {
        setLoading(false)
      }
    }

    fetchAgent()
  }, [id])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Agent name is required'
    } else if (formData.name.trim().split(' ').length < 2) {
      newErrors.name = 'Please enter full name (first & last)'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[+\d][\d\s\-()]{7,14}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required'
    } else if (!/^\d{5,10}$/.test(formData.postalCode)) {
      newErrors.postalCode = 'Postal code must be 5-10 digits'
    }

    if (formData.commissionRate < 0 || formData.commissionRate > 50) {
      newErrors.commissionRate = 'Commission rate must be between 0 and 50%'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      setIsLoading(true)
      
      try {
        await agentService.update(id!, formData)
        
        alert('Agent updated successfully!')
        navigate('/super-admin/agents')
      } catch (error: any) {
        console.error('Error updating agent:', error)
        alert(error.message || 'Failed to update agent. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <i className="ti ti-user-off fs-48 text-muted mb-3 d-block" />
              <h5 className="text-muted">{error || 'Agent not found'}</h5>
              <p className="text-muted">{error || 'The agent you\'re looking for doesn\'t exist.'}</p>
              <button className="btn btn-primary" onClick={() => navigate('/super-admin/agents')}>
                <i className="ti ti-arrow-left me-2" />Back to Agents
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Edit Agent</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <a href="/super-admin/dashboard">Dashboard</a>
                  </li>
                  <li className="breadcrumb-item">
                    <a href="/super-admin/agents">Agents</a>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">Edit Agent</li>
                </ol>
              </nav>
            </div>
            <div>
              <button className="btn btn-light" onClick={() => navigate('/super-admin/agents')}>
                <i className="ti ti-arrow-left me-2" />Back to Agents
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Edit Agent Information</h4>
              <p className="text-muted mb-0">
                Update the details for {agent.name}.
              </p>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Personal Information */}
                  <div className="col-12">
                    <h5 className="mb-3">Personal Information</h5>
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid border-danger' : formData.name ? 'is-valid' : ''}`}
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter agent's full name"
                    />
                    {errors.name && (
                      <div className="invalid-feedback d-flex align-items-center mt-1">
                        <i className="ti ti-alert-triangle me-1" />
                        {errors.name}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Email <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="ti ti-mail" />
                      </span>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid border-danger' : formData.email ? 'is-valid' : ''}`}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="agent@example.com"
                      />
                    </div>
                    {errors.email && (
                      <div className="invalid-feedback d-flex align-items-center mt-1">
                        <i className="ti ti-alert-triangle me-1" />
                        {errors.email}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Phone <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="ti ti-phone" />
                      </span>
                      <input
                        type="tel"
                        className={`form-control ${errors.phone ? 'is-invalid border-danger' : formData.phone ? 'is-valid' : ''}`}
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1-555-0123"
                      />
                    </div>
                    {errors.phone && (
                      <div className="invalid-feedback d-flex align-items-center mt-1">
                        <i className="ti ti-alert-triangle me-1" />
                        {errors.phone}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Commission Rate <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className={`form-control ${errors.commissionRate ? 'is-invalid border-danger' : ''}`}
                        value={formData.commissionRate}
                        onChange={(e) => handleInputChange('commissionRate', parseInt(e.target.value) || 0)}
                        min="0"
                        max="50"
                        placeholder="10"
                      />
                      <span className="input-group-text bg-light">%</span>
                    </div>
                    {errors.commissionRate && (
                      <div className="invalid-feedback d-flex align-items-center mt-1">
                        <i className="ti ti-alert-triangle me-1" />
                        {errors.commissionRate}
                      </div>
                    )}
                    <small className="text-muted">Commission rate for agent (0-50%)</small>
                  </div>

                  {/* Address Information */}
                  <div className="col-12 mt-4">
                    <h5 className="mb-3">Address Information</h5>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Address <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className={`form-control ${errors.address ? 'is-invalid border-danger' : formData.address ? 'is-valid' : ''}`}
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter complete address"
                      rows={2}
                    />
                    {errors.address && (
                      <div className="invalid-feedback d-flex align-items-center mt-1">
                        <i className="ti ti-alert-triangle me-1" />
                        {errors.address}
                      </div>
                    )}
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">
                      City <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.city ? 'is-invalid border-danger' : formData.city ? 'is-valid' : ''}`}
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="New York"
                    />
                    {errors.city && (
                      <div className="invalid-feedback d-flex align-items-center mt-1">
                        <i className="ti ti-alert-triangle me-1" />
                        {errors.city}
                      </div>
                    )}
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">
                      State <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.state ? 'is-invalid border-danger' : formData.state ? 'is-valid' : ''}`}
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="NY"
                    />
                    {errors.state && (
                      <div className="invalid-feedback d-flex align-items-center mt-1">
                        <i className="ti ti-alert-triangle me-1" />
                        {errors.state}
                      </div>
                    )}
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">
                      Country <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.country ? 'is-invalid border-danger' : formData.country ? 'is-valid' : ''}`}
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="United States"
                    />
                    {errors.country && (
                      <div className="invalid-feedback d-flex align-items-center mt-1">
                        <i className="ti ti-alert-triangle me-1" />
                        {errors.country}
                      </div>
                    )}
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">
                      Postal Code <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.postalCode ? 'is-invalid border-danger' : formData.postalCode ? 'is-valid' : ''}`}
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="10001"
                    />
                    {errors.postalCode && (
                      <div className="invalid-feedback d-flex align-items-center mt-1">
                        <i className="ti ti-alert-triangle me-1" />
                        {errors.postalCode}
                      </div>
                    )}
                  </div>

                  {/* Additional Information */}
                  <div className="col-12 mt-4">
                    <h5 className="mb-3">Additional Information</h5>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Status <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <small className="text-muted">Current status of the agent</small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Performance <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.performance}
                      onChange={(e) => handleInputChange('performance', e.target.value)}
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Average">Average</option>
                      <option value="Poor">Poor</option>
                    </select>
                    <small className="text-muted">Performance rating based on agent's results</small>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Notes</label>
                    <textarea
                      className="form-control"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Add any additional notes about this agent..."
                      rows={3}
                    />
                    <small className="text-muted">Optional notes about the agent</small>
                  </div>

                  {/* Form Actions */}
                  <div className="col-12 mt-4">
                    <div className="d-flex gap-2 justify-content-end">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/super-admin/agents')}
                      >
                        <i className="ti ti-x me-2" />
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Updating...
                          </>
                        ) : (
                          <>
                            <i className="ti ti-device-floppy me-2" />
                            Update Agent
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditAgentPage
