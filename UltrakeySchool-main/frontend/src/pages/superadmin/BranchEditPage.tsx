import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import branchService, { type Branch } from '../../services/branchService'

const BranchEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        setLoading(true)
        const branchData = await branchService.getBranchById(id!)
        setBranch(branchData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch branch')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchBranch()
    }
  }, [id])

  const handleSave = async () => {
    if (!branch) return

    try {
      setSaving(true)
      await branchService.updateBranch(id!, branch)
      navigate(`/super-admin/branches/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branch')
    } finally {
      setSaving(false)
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

  if (error || !branch) {
    return (
      <div className="alert alert-danger" role="alert">
        {error || 'Branch not found'}
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Edit Branch</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/super-admin/institutions">Institutions</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/super-admin/branches">Branches</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`/super-admin/branches/${id}`}>{branch.name}</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Edit</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <Link to={`/super-admin/branches/${id}`} className="btn btn-outline-light bg-white btn-icon me-1">
              <i className="ti ti-arrow-left"></i>
            </Link>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <i className="ti ti-device-floppy me-2"></i>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Edit Form */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Branch Information</h4>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Basic Information */}
                <div className="col-md-6">
                  <h5 className="mb-3">Basic Information</h5>
                  <div className="mb-3">
                    <label className="form-label">Branch Name</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={branch.name}
                      onChange={(e) => setBranch({...branch, name: e.target.value})}
                      disabled={saving}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Branch Code</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={branch.code}
                      onChange={(e) => setBranch({...branch, code: e.target.value})}
                      disabled={saving}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-control"
                      value={branch.status}
                      onChange={(e) => setBranch({...branch, status: e.target.value as 'Active' | 'Suspended' | 'Inactive'})}
                      disabled={saving}
                    >
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Max Students</label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={branch.capacity?.maxStudents || branch.students}
                      onChange={(e) => setBranch({...branch, capacity: {...branch.capacity, maxStudents: parseInt(e.target.value)}})}
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="col-md-6">
                  <h5 className="mb-3">Contact Information</h5>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-control"
                      value={branch.contact?.email || ''}
                      onChange={(e) => setBranch({...branch, contact: {...branch.contact, email: e.target.value}})}
                      disabled={saving}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input 
                      type="tel" 
                      className="form-control"
                      value={branch.contact?.phone || ''}
                      onChange={(e) => setBranch({...branch, contact: {...branch.contact, phone: e.target.value}})}
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="col-12">
                  <h5 className="mb-3">Address Information</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Address</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={branch.address?.street || ''}
                          onChange={(e) => setBranch({...branch, address: {...branch.address, street: e.target.value}})}
                          disabled={saving}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">City</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={branch.address?.city || ''}
                          onChange={(e) => setBranch({...branch, address: {...branch.address, city: e.target.value}})}
                          disabled={saving}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">State</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={branch.address?.state || ''}
                          onChange={(e) => setBranch({...branch, address: {...branch.address, state: e.target.value}})}
                          disabled={saving}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Country</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={branch.address?.country || ''}
                          onChange={(e) => setBranch({...branch, address: {...branch.address, country: e.target.value}})}
                          disabled={saving}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Postal Code</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={branch.address?.postalCode || ''}
                          onChange={(e) => setBranch({...branch, address: {...branch.address, postalCode: e.target.value}})}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Institution Information */}
                <div className="col-12">
                  <h5 className="mb-3">Institution Information</h5>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Institution Name</label>
                        <div className="form-control">{branch.institutionName}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Institution Type</label>
                        <div className="form-control">{branch.institutionType}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Institution ID</label>
                        <div className="form-control">{branch.institutionId}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="row mt-4">
                <div className="col-12">
                  <div className="d-flex justify-content-end">
                    <Link to={`/super-admin/branches/${id}`} className="btn btn-secondary me-2">
                      <i className="ti ti-x me-2"></i>Cancel
                    </Link>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                      <i className="ti ti-device-floppy me-2"></i>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
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

export default BranchEditPage
