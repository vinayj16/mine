import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import superAdminService, { type Institution } from '../../services/superAdminService'

const InstitutionsByTypePage: React.FC = () => {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Type configuration
  const typeConfig: Record<string, { title: string; icon: string; color: string; bg: string }> = {
    'schools': { title: 'Schools', icon: 'ti ti-school', color: 'text-primary', bg: 'bg-primary-transparent' },
    'inter-colleges': { title: 'Inter Colleges', icon: 'ti ti-building', color: 'text-warning', bg: 'bg-warning-transparent' },
    'degree-colleges': { title: 'Degree Colleges', icon: 'ti ti-award', color: 'text-info', bg: 'bg-info-transparent' },
    'engineering-colleges': { title: 'Engineering Colleges', icon: 'ti ti-building-factory', color: 'text-success', bg: 'bg-success-transparent' }
  }

  const config = typeConfig[type || ''] || { title: 'Institutions', icon: 'ti ti-building', color: 'text-primary', bg: 'bg-primary-transparent' }

  // Map URL type to backend type (handle both formats)
  const getBackendType = (urlType: string): string => {
    const mapping: Record<string, string> = {
      'schools': 'School',
      'inter-colleges': 'Inter College',
      'degree-colleges': 'Degree College',
      'engineering-colleges': 'Engineering College'
    }
    return mapping[urlType] || urlType
  }

  useEffect(() => {
    fetchInstitutionsByType()
  }, [type])

  const fetchInstitutionsByType = async () => {
    try {
      setLoading(true)
      const backendType = getBackendType(type || '')
      const response = await superAdminService.getInstitutionsByType(backendType)
      setInstitutions(response || [])
    } catch (error: any) {
      console.error('Error fetching institutions by type:', error)
      toast.error('Failed to load institutions')
    } finally {
      setLoading(false)
    }
  }

  const handleAddInstitution = async (institutionData: any) => {
    try {
      setIsSubmitting(true)
      
      // Validate required fields
      const { name, institutionCode, contactEmail, contactPhone } = institutionData
      
      if (!name || name.trim() === '') {
        toast.error('Institution name is required')
        return
      }
      
      if (!institutionCode || institutionCode.trim() === '') {
        toast.error('Institution code is required')
        return
      }
      
      if (!contactEmail || contactEmail.trim() === '') {
        toast.error('Contact email is required')
        return
      }
      
      if (!contactPhone || contactPhone.trim() === '') {
        toast.error('Contact phone is required')
        return
      }
      
      // Check for duplicate institution code
      const existingInstitution = institutions.find(
        inst => inst.instituteCode?.toLowerCase() === institutionCode.toLowerCase()
      )
      
      if (existingInstitution) {
        toast.error(`Institution with code "${institutionCode}" already exists`)
        return
      }
      
      // Prepare data for API
      const preparedData = {
        ...institutionData,
        type: getBackendType(type || ''),
        status: 'active'
      }
      
      await superAdminService.createInstitution(preparedData)
      
      toast.success(`${config.title.slice(0, -1)} created successfully!`)
      setShowAddModal(false)
      fetchInstitutionsByType() // Refresh list
      
    } catch (error: any) {
      console.error('Error creating institution:', error)
      
      // Handle different error types
      if (error.response?.data?.error?.details) {
        const errorDetails = error.response.data.error.details
        if (Array.isArray(errorDetails)) {
          errorDetails.forEach((detail: string) => toast.error(detail))
        } else {
          toast.error(errorDetails)
        }
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to create institution. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredInstitutions = institutions.filter(inst =>
    inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.instituteCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeInstitutions = filteredInstitutions.filter(inst => inst.status === 'active')
  const inactiveInstitutions = filteredInstitutions.filter(inst => inst.status !== 'active')

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading {config.title.toLowerCase()}...</p>
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
              <h3 className="page-title mb-1">{config.title}</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/super-admin/dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/super-admin/institutions">Institutions</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">{config.title}</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex gap-2 mb-2">
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <i className="ti ti-plus me-1"></i>
                Add {config.title.slice(0, -1)}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className={`avatar-sm ${config.bg} rounded me-3`}>
                      <i className={`${config.icon} fs-4 ${config.color}`}></i>
                    </div>
                    <div>
                      <h5 className="card-title mb-0">{filteredInstitutions.length}</h5>
                      <p className="card-text text-muted small">Total {config.title.toLowerCase()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="avatar-sm bg-success-transparent rounded me-3">
                      <i className="ti ti-check fs-4 text-success"></i>
                    </div>
                    <div>
                      <h5 className="card-title mb-0">{activeInstitutions.length}</h5>
                      <p className="card-text text-muted small">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="avatar-sm bg-warning-transparent rounded me-3">
                      <i className="ti ti-alert-circle fs-4 text-warning"></i>
                    </div>
                    <div>
                      <h5 className="card-title mb-0">{inactiveInstitutions.length}</h5>
                      <p className="card-text text-muted small">Inactive</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="ti ti-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Search ${config.title.toLowerCase()}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Institutions List */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">{config.title} List</h4>
            </div>
            <div className="card-body">
              {filteredInstitutions.length === 0 ? (
                <div className="text-center py-5">
                  <i className={`${config.icon} fs-1 ${config.color} mb-3`}></i>
                  <h5>No {config.title.toLowerCase()} found</h5>
                  <p className="text-muted">
                    {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first institution'}
                  </p>
                  {!searchTerm && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowAddModal(true)}
                    >
                      <i className="ti ti-plus me-1"></i>
                      Add {config.title.slice(0, -1)}
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Contact Email</th>
                        <th>Contact Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInstitutions.map((institution) => (
                        <tr key={institution._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className={`avatar-sm ${config.bg} rounded me-3`}>
                                <i className={`${config.icon} ${config.color}`}></i>
                              </div>
                              <div>
                                <h6 className="mb-0">{institution.name}</h6>
                                <small className="text-muted">{institution.type}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {institution.instituteCode}
                            </span>
                          </td>
                          <td>{institution.contactEmail}</td>
                          <td>{institution.contactPhone}</td>
                          <td>
                            <span className={`badge ${
                              institution.status === 'active' 
                                ? 'bg-success' 
                                : institution.status === 'inactive'
                                ? 'bg-warning'
                                : 'bg-danger'
                            }`}>
                              {institution.status || 'active'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary">
                                <i className="ti ti-eye"></i>
                              </button>
                              <button className="btn btn-outline-secondary">
                                <i className="ti ti-edit"></i>
                              </button>
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

      {/* Add Institution Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add {config.title.slice(0, -1)}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <AddInstitutionForm 
                  onSubmit={handleAddInstitution}
                  isSubmitting={isSubmitting}
                  institutionType={getBackendType(type || '')}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple Add Institution Form Component
const AddInstitutionForm: React.FC<{
  onSubmit: (data: any) => void
  isSubmitting: boolean
  institutionType: string
}> = ({ onSubmit, isSubmitting, institutionType }) => {
  const [formData, setFormData] = useState({
    name: '',
    institutionCode: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    address: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Institution Name *</label>
        <input
          type="text"
          className="form-control"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Institution Code *</label>
        <input
          type="text"
          className="form-control"
          name="institutionCode"
          value={formData.institutionCode}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Contact Email *</label>
        <input
          type="email"
          className="form-control"
          name="contactEmail"
          value={formData.contactEmail}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Contact Phone *</label>
        <input
          type="tel"
          className="form-control"
          name="contactPhone"
          value={formData.contactPhone}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Website</label>
        <input
          type="url"
          className="form-control"
          name="website"
          value={formData.website}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Address</label>
        <input
          type="text"
          className="form-control"
          name="address"
          value={formData.address}
          onChange={handleChange}
        />
      </div>
      <div className="modal-footer">
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={() => window.location.reload()}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Creating...
            </>
          ) : (
            'Create Institution'
          )}
        </button>
      </div>
    </form>
  )
}

export default InstitutionsByTypePage
