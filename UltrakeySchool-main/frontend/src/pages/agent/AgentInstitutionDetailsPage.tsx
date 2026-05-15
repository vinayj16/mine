import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import institutionService, { type Institution } from '../../services/institutionService'
import { toast } from 'react-toastify'

const AgentInstitutionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (!id) return;
        
        const data = await institutionService.getAgentInstitutionById(id)
        setInstitution(data)
      } catch (err: any) {
        console.error('Error fetching institution:', err)
        setError(err.message || 'Failed to fetch institution details')
        toast.error('Failed to load institution details')
      } finally {
        setLoading(false)
      }
    }

    fetchInstitution()
  }, [id])

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-success';
      case 'inactive': return 'bg-secondary';
      case 'pending': return 'bg-warning';
      case 'suspended': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !institution) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="alert alert-danger mb-4">{error || 'Institution not found'}</div>
          <button className="btn btn-primary" onClick={() => navigate('/agent/institutions')}>
            Back to Institutions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Institution Details</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/agent/dashboard">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to="/agent/institutions">Institutions</Link></li>
              <li className="breadcrumb-item active">{institution.contact?.name || institution.name}</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate('/agent/institutions')}>
            <i className="ti ti-arrow-left me-2"></i>Back
          </button>
          <Link to={`/agent/institutions/${id}/edit`} className="btn btn-primary">
            <i className="ti ti-edit me-2"></i>Edit Institution
          </Link>
        </div>
      </div>

      <div className="row">
        {/* Main Info */}
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">Basic Information</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Institution Name</div>
                <div className="col-md-8 fw-semibold">{institution.name}</div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Institution Type</div>
                <div className="col-md-8">{institution.type}</div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Status</div>
                <div className="col-md-8">
                  <span className={`badge ${getStatusBadgeClass(institution.status)} text-white`}>
                    {getStatusText(institution.status)}
                  </span>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Code</div>
                <div className="col-md-8">{institution.instituteCode || 'N/A'}</div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Created Date</div>
                <div className="col-md-8">{institution.createdAt ? new Date(institution.createdAt).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">Contact Details</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Email</div>
                <div className="col-md-8">{institution.contact?.email || 'N/A'}</div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Phone</div>
                <div className="col-md-8">{institution.contact?.phone || 'N/A'}</div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Website</div>
                <div className="col-md-8">
                  {institution.contact?.website ? (
                    <a href={institution.contact.website.startsWith('http') ? institution.contact.website : `https://${institution.contact.website}`} target="_blank" rel="noopener noreferrer">
                      {institution.contact.website}
                    </a>
                  ) : 'N/A'}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 text-muted">Address</div>
                <div className="col-md-8">
                  {institution.contact?.address ? (
                    <>
                      {institution.contact.address.street && <>{institution.contact.address.street}<br /></>}
                      {institution.contact.address.city}, {institution.contact.address.state}<br />
                      {institution.contact.address.postalCode}, {institution.contact.address.country}
                    </>
                  ) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">Subscription Details</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="text-muted small d-block">Current Plan</label>
                <div className="fw-bold fs-5">{institution.subscription?.planName || 'Free/Trial'}</div>
              </div>
              <div className="mb-3">
                <label className="text-muted small d-block">Monthly Cost</label>
                <div className="fw-bold text-success">₹{institution.subscription?.monthlyCost?.toLocaleString() || '0'}</div>
              </div>
              <div className="mb-3">
                <label className="text-muted small d-block">Expiry Date</label>
                <div>{institution.subscription?.endDate ? new Date(institution.subscription.endDate).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">Administrator</h5>
            </div>
            <div className="card-body text-center">
              <div className="avatar avatar-xl bg-primary text-white rounded-circle mx-auto mb-3">
                <i className="ti ti-user fs-24"></i>
              </div>
              <h6 className="mb-1">{institution.principalName || 'Admin User'}</h6>
              <p className="text-muted small mb-0">{institution.principalEmail || 'admin@institution.com'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentInstitutionDetailsPage;
