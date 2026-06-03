import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface InstitutionInfo {
  name: string;
  instituteCode: string;
  shortName?: string;
  type?: string;
  category?: string;
  established?: number;
  description?: string;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: { street?: string; city?: string; state?: string; country?: string; postalCode?: string };
  };
  principalName?: string;
  principalEmail?: string;
  principalPhone?: string;
  status?: string;
}

const CompanyInfo: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [institution, setInstitution] = useState<InstitutionInfo | null>(null);

  const institutionId = localStorage.getItem('institutionId') || '';

  const fetchInstitution = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/institutions/${institutionId}`);

      if (response.data.success) {
        setInstitution(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching institution:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load institution information';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitution();
  }, []);

  const contactInfo = institution?.contact || {};

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading company information...</p>
        </div>
      </div>
    );
  }

  const formatAddress = () => {
    const addr = contactInfo.address;
    if (!addr) return 'N/A';
    const parts = [addr.street, addr.city, addr.state, addr.country, addr.postalCode].filter(Boolean);
    return parts.join(', ') || 'N/A';
  };

  const getTypeLabel = () => {
    const t = institution?.type;
    if (!t) return 'N/A';
    return t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (error) {
    return (
      <div>
        <h3 className="page-title mb-1">Institution Information</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">Institution Info</li>
          </ol>
        </nav>

        <div className="card mt-3">
          <div className="card-body">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="ti ti-alert-circle me-2 fs-4"></i>
              <div className="flex-grow-1">
                <h5 className="alert-heading">Error Loading Institution Information</h5>
                <p className="mb-0">{error}</p>
              </div>
              <button
                className="btn btn-outline-danger ms-3"
                onClick={fetchInstitution}
              >
                <i className="ti ti-refresh me-1"></i>Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div>
        <h3 className="page-title mb-1">Institution Information</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">Institution Info</li>
          </ol>
        </nav>

        <div className="card mt-3">
          <div className="card-body text-center py-5">
            <i className="ti ti-database-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
            <p className="mt-2 text-muted">No institution information available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="page-title mb-1">Institution Details</h3>
      <nav>
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active">Institution Info</li>
        </ol>
      </nav>

      <div className="card mt-3">
        <div className="card-header">
          <h5 className="mb-0">General Institution Information</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted">Institution Name</label>
                <p className="fw-medium">{institution.name || 'N/A'}</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted">Institution Code</label>
                <p className="fw-medium">{institution.instituteCode || 'N/A'}</p>
              </div>
            </div> 
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted">Phone Number</label>
                <p className="fw-medium">{contactInfo.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted">Email Address</label>
                <p className="fw-medium">{contactInfo.email || 'N/A'}</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted">Website</label>
                <p className="fw-medium">
                  {contactInfo.website ? (
                    <a href={contactInfo.website} target="_blank" rel="noopener noreferrer">
                      {contactInfo.website}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted">Institution Type</label>
                <p className="fw-medium">{getTypeLabel()}</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted">Established Year</label>
                <p className="fw-medium">{institution.established || 'N/A'}</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted">Status</label>
                <p className="fw-medium">
                  <span className={`badge ${institution.status === 'active' ? 'badge-soft-success' : 'badge-soft-warning'}`}>
                    {institution.status ? institution.status.charAt(0).toUpperCase() + institution.status.slice(1) : 'N/A'}
                  </span>
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted">Principal Name</label>
                <p className="fw-medium">{institution.principalName || 'N/A'}</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted">Principal Email</label>
                <p className="fw-medium">{institution.principalEmail || 'N/A'}</p>
              </div>
            </div>
            <div className="col-12">
              <div className="mb-3">
                <label className="form-label text-muted">Address</label>
                <p className="fw-medium">{formatAddress()}</p>
              </div>
            </div>
            {institution.description && (
              <div className="col-12">
                <div className="mb-3">
                  <label className="form-label text-muted">Description</label>
                  <p className="fw-medium">{institution.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfo;
