import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import institutionService, { type Institution } from '../../services/institutionService'
import { toast } from 'react-toastify'

const AgentInstitutionEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState<Partial<Institution>>({
    name: '',
    type: 'School',
    status: 'pending',
    contact: {
      email: '',
      phone: '',
      alternatePhone: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: 'India',
        postalCode: ''
      },
      name: ''
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        setLoading(true)
        if (!id) return;
        const data = await institutionService.getInstitutionById(id)
        setFormData(data)
      } catch (err: any) {
        console.error('Error fetching institution:', err)
        toast.error('Failed to load institution details')
        navigate('/agent/institutions')
      } finally {
        setLoading(false)
      }
    }

    fetchInstitution()
  }, [id, navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'email' || name === 'phone' || name === 'alternatePhone' || name === 'website') {
      setFormData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          [name]: value
        } as any
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        address: {
          ...prev.contact?.address,
          [name]: value
        }
      } as any
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      if (!id) return;
      await institutionService.updateInstitution(id, formData)
      toast.success('Institution updated successfully')
      navigate(`/agent/institutions/${id}`)
    } catch (err: any) {
      console.error('Error updating institution:', err)
      toast.error(err.message || 'Failed to update institution')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Edit Institution</h4>
          <p className="text-muted mb-0">Update information for {formData.name}</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">General Information</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Institution Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Institution Type</label>
                    <select
                      className="form-select"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="School">School</option>
                      <option value="Inter College">Inter College</option>
                      <option value="Degree College">Degree College</option>
                      <option value="Engineering College">Engineering College</option>
                      <option value="University">University</option>
                      <option value="Coaching Institute">Coaching Institute</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.contact?.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.contact?.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Website</label>
                    <input
                      type="url"
                      className="form-control"
                      name="website"
                      value={formData.contact?.website}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">Location Details</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Street Address</label>
                    <input
                      type="text"
                      className="form-control"
                      name="street"
                      value={formData.contact?.address?.street}
                      onChange={handleAddressChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={formData.contact?.address?.city}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-control"
                      name="state"
                      value={formData.contact?.address?.state}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Postal Code</label>
                    <input
                      type="text"
                      className="form-control"
                      name="postalCode"
                      value={formData.contact?.address?.postalCode}
                      onChange={handleAddressChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      name="country"
                      value={formData.contact?.address?.country}
                      onChange={handleAddressChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">Status & Settings</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <hr />
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2"
                  disabled={saving}
                >
                  {saving ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                  ) : (
                    <><i className="ti ti-device-floppy me-2"></i>Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AgentInstitutionEditPage;
