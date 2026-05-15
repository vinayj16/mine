import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../api/client'
import { toast } from 'react-toastify'

const DEFAULT_PROFILE = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@school.edu',
  phone: '+91 9876543210',
  role: 'Hostel Warden',
  gender: 'Male',
  address: { street: '', city: '', state: '', country: '', zipCode: '' }
}

const HostelProfilePage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(DEFAULT_PROFILE)

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/user/profile').catch(() => ({ data: { success: true, data: DEFAULT_PROFILE } }))
      if (res.data?.success) setProfile({ ...DEFAULT_PROFILE, ...res.data.data })
    } catch (err) { console.error('Error:', err) } finally { setLoading(false) }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await apiClient.put('/user/profile', profile)
      if (res.data.success) toast.success('Profile updated!')
    } catch { toast.error('Failed to update') } finally { setSaving(false) }
  }

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><div className="spinner-border text-primary"></div></div>

  return (
    <div className="content">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">My Profile</h4>
          <nav className="d-flex align-items-center gap-2 small text-muted">
            <Link to="/dashboard" className="text-decoration-none">Dashboard</Link>
            <span>/</span>
            <Link to="/dashboard/hostel" className="text-decoration-none">Hostel</Link>
            <span>/</span>
            <span>Profile</span>
          </nav>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-3 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-4">
              <div className="avatar avatar-xl bg-primary rounded-circle mx-auto mb-3">
                <span className="text-white fs-2">{profile.firstName?.[0] || 'U'}</span>
              </div>
              <h5>{profile.firstName} {profile.lastName}</h5>
              <p className="text-muted small">{profile.role}</p>
              <p className="text-muted small mb-0">{profile.email}</p>
            </div>
          </div>
        </div>
        <div className="col-lg-9">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white d-flex justify-content-between">
              <h6 className="mb-0">Personal Info</h6>
              <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label small">First Name</label>
                  <input type="text" className="form-control form-control-sm" value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label small">Last Name</label>
                  <input type="text" className="form-control form-control-sm" value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label small">Email</label>
                  <input type="email" className="form-control form-control-sm" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label small">Phone</label>
                  <input type="text" className="form-control form-control-sm" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label small">Gender</label>
                  <select className="form-select form-select-sm" value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white"><h6 className="mb-0">Address</h6></div>
            <div className="card-body">
              <div className="row">
                <div className="col-12 mb-3">
                  <label className="form-label small">Street</label>
                  <input type="text" className="form-control form-control-sm" value={profile.address?.street || ''} onChange={e => setProfile({ ...profile, address: { ...profile.address, street: e.target.value } })} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label small">City</label>
                  <input type="text" className="form-control form-control-sm" value={profile.address?.city || ''} onChange={e => setProfile({ ...profile, address: { ...profile.address, city: e.target.value } })} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label small">State</label>
                  <input type="text" className="form-control form-control-sm" value={profile.address?.state || ''} onChange={e => setProfile({ ...profile, address: { ...profile.address, state: e.target.value } })} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HostelProfilePage
