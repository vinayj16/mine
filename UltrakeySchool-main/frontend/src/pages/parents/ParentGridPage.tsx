import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../../api/client'

interface Guardian {
  _id: string
  guardianId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  alternatePhone?: string
  avatar?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  children: Array<{
    studentId: {
      _id: string
      firstName: string
      lastName: string
      admissionNumber: string
      avatar?: string
      classId?: {
        _id: string
        name: string
        grade?: string
      }
      sectionId?: {
        _id: string
        name: string
      }
    }
    relationship: {
      type: string
      isPrimary: boolean
    }
    isActive: boolean
  }>
  status: string
  createdAt: string
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  alternatePhone: string
  relationship: string
  address: string
  occupation: string
  studentId: string
}

const ParentGridPage = () => {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddParentModal, setShowAddParentModal] = useState(false)
  const [parentImageErrors, setParentImageErrors] = useState<Record<string, boolean>>({})
  const [childImageErrors, setChildImageErrors] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    relationship: '',
    address: '',
    occupation: '',
    studentId: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Get schoolId from localStorage
  const schoolId = localStorage.getItem('schoolId') || '507f1f77bcf86cd799439011'

  const fetchGuardians = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get(`/guardians/schools/${schoolId}`, {
        params: { limit: 100 }
      })

      if (response.data.success) {
        setGuardians(response.data.data.guardians || [])
      }
    } catch (err: any) {
      console.error('Error fetching guardians:', err)
      const errorMessage = err.response?.data?.message || 'Failed to load parents'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuardians()
  }, [])

  const handleRefresh = () => {
    fetchGuardians()
  }

  const handleAddParent = () => {
    setShowAddParentModal(true)
  }

  const handleCloseModal = () => {
    setShowAddParentModal(false)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      alternatePhone: '',
      relationship: '',
      address: '',
      occupation: '',
      studentId: ''
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      toast.error('First name is required')
      return false
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required')
      return false
    }
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return false
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required')
      return false
    }
    if (!formData.relationship) {
      toast.error('Relationship is required')
      return false
    }
    return true
  }

  const handleSubmitParent = async () => {
    if (!validateForm()) return

    try {
      setSubmitting(true)

      const guardianData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        alternatePhone: formData.alternatePhone.trim() || undefined,
        occupation: formData.occupation.trim() || undefined,
        address: formData.address.trim() ? {
          street: formData.address.trim()
        } : undefined,
        children: formData.studentId ? [{
          studentId: formData.studentId,
          relationship: {
            type: formData.relationship,
            isPrimary: true
          },
          enrollmentDate: new Date(),
          isActive: true
        }] : []
      }

      const response = await apiClient.post(`/guardians/schools/${schoolId}`, guardianData)

      if (response.data.success) {
        toast.success('Parent added successfully')
        handleCloseModal()
        fetchGuardians()
      }
    } catch (err: any) {
      console.error('Error adding parent:', err)
      const errorMessage = err.response?.data?.message || 'Failed to add parent'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleParentImageError = (parentId: string) => {
    setParentImageErrors(prev => ({ ...prev, [parentId]: true }))
  }

  const handleChildImageError = (childName: string) => {
    setChildImageErrors(prev => ({ ...prev, [childName]: true }))
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  }

  const getPrimaryChild = (children: Guardian['children']) => {
    const activeChildren = children.filter(c => c.isActive)
    return activeChildren.find(c => c.relationship.isPrimary) || activeChildren[0]
  }
  return (
    <>
      <div className="d-md-flex d-block alignments-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Parents</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Peoples</li>
              <li className="breadcrumb-item active" aria-current="page">
                Parents Grid
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              aria-label="Refresh"
              onClick={handleRefresh}
              disabled={loading}
            >
              <i className="ti ti-refresh" />
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" aria-label="Print">
              <i className="ti ti-printer" />
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2" />
              Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-2" />
                  Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-2" />
                  Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button className="btn btn-primary d-flex align-items-center" onClick={handleAddParent}>
              <i className="ti ti-square-rounded-plus me-2" />
              Add Parent
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-3 border rounded-1 d-flex align-items-center justify-content-between flex-wrap mb-4 pb-0">
        <h4 className="mb-3">Parents Grid</h4>
        <div className="d-flex align-items-center flex-wrap">
          <div className="input-icon-start mb-3 me-2 position-relative">
            <span className="icon-addon">
              <i className="ti ti-calendar" />
            </span>
            <input type="text" className="form-control" defaultValue="Academic Year : 2024 / 2025" readOnly />
          </div>
          <div className="dropdown mb-3 me-2">
            <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside">
              <i className="ti ti-filter me-2" />
              Filter
            </button>
            <div className="dropdown-menu drop-width p-0">
              <div className="d-flex align-items-center border-bottom p-3">
                <h4 className="mb-0">Filter</h4>
              </div>
              <div className="p-3 pb-0 border-bottom">
                <div className="row">
                  {['Parent', 'Child', 'Class', 'Status'].map((label) => (
                    <div className="col-md-6" key={label}>
                      <div className="mb-3">
                        <label className="form-label">{label}</label>
                        <select className="form-select">
                          <option>Select</option>
                          <option>Option 1</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 d-flex align-items-center justify-content-end">
                <button className="btn btn-light me-3">Reset</button>
                <button className="btn btn-primary">Apply</button>
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center bg-white border rounded-2 p-1 mb-3 me-2">
            <Link to="/parents" className="btn btn-icon btn-sm bg-light primary-hover me-1">
              <i className="ti ti-list-tree" />
            </Link>
            <button className="btn btn-icon btn-sm primary-hover active">
              <i className="ti ti-grid-dots" />
            </button>
          </div>
          <div className="dropdown mb-3">
            <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown">
              <i className="ti ti-sort-ascending-2 me-2" />
              Sort by A-Z
            </button>
            <ul className="dropdown-menu p-3">
              {['Ascending', 'Descending', 'Recently Viewed', 'Recently Added'].map((label) => (
                <li key={label}>
                  <button className="dropdown-item rounded-1">{label}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading parents...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="alert alert-danger" role="alert">
          <i className="ti ti-alert-circle me-2"></i>
          {error}
          <button
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={fetchGuardians}
          >
            <i className="ti ti-refresh me-1"></i>Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && guardians.length === 0 && (
        <div className="text-center py-5">
          <i className="ti ti-users-group" style={{ fontSize: '48px', color: '#ccc' }}></i>
          <p className="mt-2 text-muted">No parents found</p>
          <button className="btn btn-primary mt-2" onClick={handleAddParent}>
            <i className="ti ti-square-rounded-plus me-2" />
            Add First Parent
          </button>
        </div>
      )}

      {/* Parents Grid */}
      {!loading && !error && guardians.length > 0 && (
        <div className="row">
          {guardians.map((guardian) => {
            const primaryChild = getPrimaryChild(guardian.children)
            return (
              <div className="col-xl-4 col-md-6 d-flex" key={guardian._id}>
                <div className="card flex-fill">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <span className="link-primary">{guardian.guardianId}</span>
                    <div className="dropdown">
                      <button className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0" data-bs-toggle="dropdown">
                        <i className="ti ti-dots-vertical fs-14" />
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end p-3">
                        <li>
                          <button className="dropdown-item rounded-1">
                            <i className="ti ti-edit-circle me-2" />
                            Edit
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item rounded-1">
                            <i className="ti ti-trash-x me-2" />
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="bg-light-300 rounded-2 p-3 mb-3">
                      <div className="d-flex alignments-center">
                        <span className="avatar avatar-lg flex-shrink-0">
                          {parentImageErrors[guardian._id] || !guardian.avatar ? (
                            <div className="d-flex align-items-center justify-content-center w-100 h-100 bg-light rounded-circle">
                              <i className="ti ti-user fs-20 text-muted"></i>
                            </div>
                          ) : (
                            <img 
                              src={guardian.avatar} 
                              className="img-fluid rounded-circle" 
                              alt={`${guardian.firstName} ${guardian.lastName}`}
                              onError={() => handleParentImageError(guardian._id)}
                            />
                          )}
                        </span>
                        <div className="ms-2 overflow-hidden">
                          <h6 className="text-dark text-truncate mb-0">
                            {guardian.firstName} {guardian.lastName}
                          </h6>
                          <p className="mb-0">Added on {formatDate(guardian.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between gx-2">
                      <div>
                        <p className="mb-0">Email</p>
                        <p className="text-dark mb-0">{guardian.email}</p>
                      </div>
                      <div>
                        <p className="mb-0">Phone</p>
                        <p className="text-dark mb-0">{guardian.phone}</p>
                      </div>
                    </div>
                  </div>
                  {primaryChild && (
                    <div className="card-footer d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <span className="avatar avatar-md flex-shrink-0 p-0 me-2">
                          {childImageErrors[primaryChild.studentId._id] || !primaryChild.studentId.avatar ? (
                            <div className="d-flex align-items-center justify-content-center w-100 h-100 bg-light rounded-circle">
                              <i className="ti ti-user fs-12 text-muted"></i>
                            </div>
                          ) : (
                            <img 
                              src={primaryChild.studentId.avatar} 
                              alt={`${primaryChild.studentId.firstName} ${primaryChild.studentId.lastName}`} 
                              className="img-fluid rounded-circle"
                              onError={() => handleChildImageError(primaryChild.studentId._id)}
                            />
                          )}
                        </span>
                        <div>
                          <p className="text-dark mb-0">
                            {primaryChild.studentId.firstName} {primaryChild.studentId.lastName}
                          </p>
                          <small className="text-muted">
                            {primaryChild.studentId.classId?.name || '-'}
                            {primaryChild.studentId.sectionId?.name && `, ${primaryChild.studentId.sectionId.name}`}
                          </small>
                        </div>
                      </div>
                      <Link to={`/parent-details/${guardian._id}`} className="btn btn-light btn-sm">
                        View Details
                      </Link>
                    </div>
                  )}
                  {!primaryChild && (
                    <div className="card-footer">
                      <Link to={`/parent-details/${guardian._id}`} className="btn btn-light btn-sm w-100">
                        View Details
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Parent Modal */}
      {showAddParentModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Parent</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">First Name *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter first name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Last Name *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter last name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email *</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        placeholder="Enter email address"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone *</label>
                      <input 
                        type="tel" 
                        className="form-control" 
                        placeholder="Enter phone number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Alternate Phone</label>
                      <input 
                        type="tel" 
                        className="form-control" 
                        placeholder="Enter alternate phone"
                        name="alternatePhone"
                        value={formData.alternatePhone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Relationship *</label>
                      <select 
                        className="form-select"
                        name="relationship"
                        value={formData.relationship}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Relationship</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="guardian">Guardian</option>
                        <option value="grandparent">Grandparent</option>
                        <option value="sibling">Sibling</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Occupation</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter occupation"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Student ID (Optional)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter student ID to link"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleInputChange}
                      />
                      <small className="text-muted">Leave empty to add student later</small>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <textarea 
                        className="form-control" 
                        rows={3} 
                        placeholder="Enter address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  <i className="ti ti-x me-2"></i>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSubmitParent}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check me-2"></i>
                      Add Parent
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ParentGridPage

