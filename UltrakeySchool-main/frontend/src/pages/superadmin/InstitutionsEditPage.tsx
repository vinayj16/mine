import React, { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { MODULES } from '../../config/modules'
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
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  website: string
  enabledModules: string[]
  studentLimit: number
  userLimit: number
}

const InstitutionsEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
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
          setSchool(response.data as School)
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

  const handleSave = async () => {
    try {
      const response = await apiService.put(`/schools/${id}`, school)
      if (response.success) {
        console.log('School updated successfully:', response.data)
        // Show success message or redirect
        alert('School updated successfully!')
        // Optionally navigate back to details page
        // window.location.href = `/super-admin/institutions/${institutionConfig?.basePath?.split('/').pop()}/${id}`
      } else {
        setError('Failed to update school')
      }
    } catch (err) {
      console.error('Error saving school:', err)
      setError(err instanceof Error ? err.message : 'Failed to update school')
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
          <h3 className="page-title mb-1">Edit {institutionConfig?.singularName || 'Institution'}</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/institutions">Institutions</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={institutionConfig?.basePath || '#'}>{institutionConfig?.name || 'Institutions'}</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`${institutionConfig?.basePath || '#'}/${id}`}>{school.name}</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Edit</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <Link to={institutionConfig?.basePath || '/super-admin/institutions'} className="btn btn-outline-light bg-white btn-icon me-1">
              <i className="ti ti-arrow-left"></i>
            </Link>
          </div>
          <button className="btn btn-primary" onClick={handleSave}>
            <i className="ti ti-device-floppy me-2"></i>
            Save Changes
          </button>
        </div>
      </div>

      {/* Edit Form */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">{institutionConfig?.singularName || 'Institution'} Information</h4>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Basic Information */}
                <div className="col-md-6">
                  <h5 className="mb-3">Basic Information</h5>
                  <div className="mb-3">
                    <label className="form-label">{institutionConfig?.singularName || 'Institution'} Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={school.name}
                      onChange={(e) => setSchool({ ...school, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={school.email}
                      onChange={(e) => setSchool({ ...school, email: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={school.phone}
                      onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Website</label>
                    <input
                      type="url"
                      className="form-control"
                      value={school.website}
                      onChange={(e) => setSchool({ ...school, website: e.target.value })}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="col-md-6">
                  <h5 className="mb-3">Address Information</h5>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={school.address}
                      onChange={(e) => setSchool({ ...school, address: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-control"
                      value={school.city}
                      onChange={(e) => setSchool({ ...school, city: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-control"
                      value={school.state}
                      onChange={(e) => setSchool({ ...school, state: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      value={school.country}
                      onChange={(e) => setSchool({ ...school, country: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Postal Code</label>
                    <input
                      type="text"
                      className="form-control"
                      value={school.postalCode}
                      onChange={(e) => setSchool({ ...school, postalCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Information */}
              <div className="row mt-4">
                <div className="col-12">
                  <h5 className="mb-3">Subscription Information</h5>
                  <div className="row">
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Subscription Plan</label>
                        <select
                          className="form-control"
                          value={school.plan}
                          onChange={(e) => setSchool({ ...school, plan: e.target.value as 'Basic' | 'Medium' | 'Premium' })}
                        >
                          <option value="Basic">Basic (₹2,500/month)</option>
                          <option value="Medium">Medium (₹6,500/month)</option>
                          <option value="Premium">Premium (₹16,500/month)</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-control"
                          value={school.status}
                          onChange={(e) => setSchool({ ...school, status: e.target.value as 'Active' | 'Suspended' | 'Expired' })}
                        >
                          <option value="Active">Active</option>
                          <option value="Suspended">Suspended</option>
                          <option value="Expired">Expired</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Expiry Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={school.expiryDate}
                          onChange={(e) => setSchool({ ...school, expiryDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Current Students</label>
                        <input
                          type="number"
                          className="form-control"
                          value={school.students}
                          onChange={(e) => setSchool({ ...school, students: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Limits Information */}
              <div className="row mt-4">
                <div className="col-12">
                  <h5 className="mb-3">Usage Limits</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Student Limit</label>
                        <input
                          type="number"
                          className="form-control"
                          value={school.studentLimit}
                          onChange={(e) => setSchool({ ...school, studentLimit: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">User Limit</label>
                        <input
                          type="number"
                          className="form-control"
                          value={school.userLimit}
                          onChange={(e) => setSchool({ ...school, userLimit: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enabled Modules - Dynamic from Config */}
              <div className="row mt-4">
                <div className="col-12">
                  <h5 className="mb-3">Enabled Modules (18 Total)</h5>
                  <div className="alert alert-info mb-3" role="alert">
                    <i className="ti ti-info-circle me-2"></i>
                    Select modules to enable for this school. Only enabled modules will be accessible to users.
                  </div>
                  <div className="row">
                    {[0, 1, 2].map((colIndex) => (
                      <div className="col-lg-4 col-md-6" key={colIndex}>
                        {MODULES.slice(colIndex * 6, (colIndex + 1) * 6).map((module: any) => {
                          // prefer legacyKey (uppercase) if present, otherwise uppercase the key
                          const moduleKey = module.legacyKey ?? module.key.toUpperCase()
                          return (
                            <div className="form-check mb-3" key={module.key}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={module.key}
                                checked={school.enabledModules.includes(moduleKey)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSchool({
                                      ...school,
                                      enabledModules: [...school.enabledModules, moduleKey]
                                    })
                                  } else {
                                    setSchool({
                                      ...school,
                                      enabledModules: school.enabledModules.filter(m => m !== moduleKey)
                                    })
                                  }
                                }}
                              />
                              <label className="form-check-label" htmlFor={module.key} style={{ cursor: 'pointer' }}>
                                <strong>{module.name}</strong>
                                <br />
                                <small className="text-muted d-block">{module.description}</small>
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default InstitutionsEditPage;
