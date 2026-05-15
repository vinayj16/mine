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

const ParentListPage = () => {
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
  const [selectedGuardians, setSelectedGuardians] = useState<Set<string>>(new Set())

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedGuardians(new Set(guardians.map(g => g._id)))
    } else {
      setSelectedGuardians(new Set())
    }
  }

  const handleSelectGuardian = (guardianId: string) => {
    const newSelected = new Set(selectedGuardians)
    if (newSelected.has(guardianId)) {
      newSelected.delete(guardianId)
    } else {
      newSelected.add(guardianId)
    }
    setSelectedGuardians(newSelected)
  }
  return (
    <>
      <div className="d-md-flex d-block alignments-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Parents List</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Peoples</li>
              <li className="breadcrumb-item active" aria-current="page">
                Parent List
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={handleRefresh}
              disabled={loading}
            >
              <i className="ti ti-refresh" />
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1">
              <i className="ti ti-printer" />
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex alignments-center" data-bs-toggle="dropdown">
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
            <button className="btn btn-primary d-flex alignments-center" onClick={handleAddParent}>
              <i className="ti ti-square-rounded-plus me-2" />
              Add Parent
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex alignments-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Parents List</h4>
          <div className="d-flex alignments-center flex-wrap">
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
                <div className="d-flex alignments-center border-bottom p-3">
                  <h4 className="mb-0">Filter</h4>
                </div>
                <div className="p-3 border-bottom pb-0">
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
                <div className="p-3 d-flex alignments-center justify-content-end">
                  <button className="btn btn-light me-3">Reset</button>
                  <button className="btn btn-primary">Apply</button>
                </div>
              </div>
            </div>
            <div className="d-flex alignments-center bg-white border rounded-2 p-1 mb-3 me-2">
              <button className="btn btn-icon btn-sm primary-hover active me-1">
                <i className="ti ti-list-tree" />
              </button>
              <Link to="/parent-grid" className="btn btn-icon btn-sm bg-light primary-hover">
                <i className="ti ti-grid-dots" />
              </Link>
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
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading parents...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="card-body">
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
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && guardians.length === 0 && (
          <div className="card-body text-center py-5">
            <i className="ti ti-users-group" style={{ fontSize: '48px', color: '#ccc' }}></i>
            <p className="mt-2 text-muted">No parents found</p>
            <button className="btn btn-primary mt-2" onClick={handleAddParent}>
              <i className="ti ti-square-rounded-plus me-2" />
              Add First Parent
            </button>
          </div>
        )}

        {/* Parents Table */}
        {!loading && !error && guardians.length > 0 && (
          <div className="card-body p-0 py-3">
            <div className="table-responsive">
              <table className="table">
                <thead className="thead-light">
                  <tr>
                    <th>
                      <div className="form-check form-check-md">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          checked={selectedGuardians.size === guardians.length && guardians.length > 0}
                          onChange={handleSelectAll}
                        />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Parent Name</th>
                    <th>Child</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {guardians.map((guardian) => {
                    const primaryChild = getPrimaryChild(guardian.children)
                    return (
                      <tr key={guardian._id}>
                        <td>
                          <div className="form-check form-check-md">
                            <input 
                              className="form-check-input" 
                              type="checkbox"
                              checked={selectedGuardians.has(guardian._id)}
                              onChange={() => handleSelectGuardian(guardian._id)}
                            />
                          </div>
                        </td>
                        <td className="text-primary">{guardian.guardianId}</td>
                        <td>
                          <div className="d-flex alignments-center">
                            <span className="avatar avatar-md me-2">
                              {parentImageErrors[guardian._id] || !guardian.avatar ? (
                                <div className="d-flex align-items-center justify-content-center w-100 h-100 bg-light rounded-circle">
                                  <i className="ti ti-user fs-16 text-muted"></i>
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
                            <div className="overflow-hidden">
                              <p className="text-dark mb-0">
                                {guardian.firstName} {guardian.lastName}
                              </p>
                              <small className="text-muted">Added on {formatDate(guardian.createdAt)}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {primaryChild ? (
                            <div className="d-flex alignments-center">
                              <span className="avatar avatar-md me-2">
                                {childImageErrors[primaryChild.studentId._id] || !primaryChild.studentId.avatar ? (
                                  <div className="d-flex align-items-center justify-content-center w-100 h-100 bg-light rounded-circle">
                                    <i className="ti ti-user fs-16 text-muted"></i>
                                  </div>
                                ) : (
                                  <img 
                                    src={primaryChild.studentId.avatar} 
                                    className="img-fluid rounded-circle" 
                                    alt={`${primaryChild.studentId.firstName} ${primaryChild.studentId.lastName}`}
                                    onError={() => handleChildImageError(primaryChild.studentId._id)}
                                  />
                                )}
                              </span>
                              <div className="overflow-hidden">
                                <p className="text-dark mb-0">
                                  {primaryChild.studentId.firstName} {primaryChild.studentId.lastName}
                                </p>
                                <small className="text-muted">
                                  {primaryChild.studentId.classId?.name || '-'}
                                  {primaryChild.studentId.sectionId?.name && `, ${primaryChild.studentId.sectionId.name}`}
                                </small>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted">No child linked</span>
                          )}
                        </td>
                        <td>{guardian.phone}</td>
                        <td>{guardian.email}</td>
                        <td>
                          <div className="dropdown">
                            <button className="btn btn-white btn-icon btn-sm d-flex alignments-center justify-content-center rounded-circle p-0" data-bs-toggle="dropdown">
                              <i className="ti ti-dots-vertical fs-14" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              <li>
                                <Link to={`/parent-details/${guardian._id}`} className="dropdown-item rounded-1">
                                  <i className="ti ti-menu me-2" />
                                  View Details
                                </Link>
                              </li>
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
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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

export default ParentListPage

