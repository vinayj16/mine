import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface BasicInfo {
  schoolName: string;
  phoneNumber: string;
  email: string;
  fax: string;
  address: string;
  website: string;
}

interface SchoolSettings {
  _id: string;
  institutionId: string;
  basicInfo: BasicInfo;
  status: string;
}

const CompanyInfo: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BasicInfo>({
    schoolName: '',
    phoneNumber: '',
    email: '',
    fax: '',
    address: '',
    website: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<BasicInfo>>({});

  // Using a hardcoded institution ID - in production, this would come from auth context
  const institutionId = '507f1f77bcf86cd799439011';

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/school-settings/institution/${institutionId}`);

      if (response.data.success) {
        setSettings(response.data.data);
        setFormData(response.data.data.basicInfo);
      }
    } catch (err: any) {
      console.error('Error fetching school settings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load company information';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const validateForm = (): boolean => {
    const errors: Partial<BasicInfo> = {};

    if (!formData.schoolName.trim()) {
      errors.schoolName = 'School name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      errors.website = 'Website must start with http:// or https://';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name as keyof BasicInfo]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      setSaving(true);

      const response = await apiClient.patch(
        `/school-settings/institution/${institutionId}/basic-info`,
        formData
      );

      if (response.data.success) {
        setSettings(response.data.data);
        setIsEditing(false);
        toast.success('Company information updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating school settings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update company information';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      setFormData(settings.basicInfo);
    }
    setFormErrors({});
    setIsEditing(false);
  };

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

  if (error) {
    return (
      <div>
        <h3 className="page-title mb-1">Company Info</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">Company Info</li>
          </ol>
        </nav>

        <div className="card mt-3">
          <div className="card-body">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="ti ti-alert-circle me-2 fs-4"></i>
              <div className="flex-grow-1">
                <h5 className="alert-heading">Error Loading Company Information</h5>
                <p className="mb-0">{error}</p>
              </div>
              <button
                className="btn btn-outline-danger ms-3"
                onClick={fetchSettings}
              >
                <i className="ti ti-refresh me-1"></i>Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div>
        <h3 className="page-title mb-1">Company Info</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">Company Info</li>
          </ol>
        </nav>

        <div className="card mt-3">
          <div className="card-body text-center py-5">
            <i className="ti ti-database-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
            <p className="mt-2 text-muted">No company information available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="page-title mb-1">Company Info</h3>
      <nav>
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active">Company Info</li>
        </ol>
      </nav>

      <div className="card mt-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Company Details</h5>
          {!isEditing && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsEditing(true)}
            >
              <i className="ti ti-edit me-1"></i>Edit
            </button>
          )}
        </div>
        <div className="card-body">
          {!isEditing ? (
            <div className="row g-3">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label text-muted">School Name</label>
                  <p className="fw-medium">{settings.basicInfo.schoolName || 'N/A'}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label text-muted">Phone Number</label>
                  <p className="fw-medium">{settings.basicInfo.phoneNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label text-muted">Email</label>
                  <p className="fw-medium">{settings.basicInfo.email || 'N/A'}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label text-muted">Fax</label>
                  <p className="fw-medium">{settings.basicInfo.fax || 'N/A'}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label text-muted">Website</label>
                  <p className="fw-medium">
                    {settings.basicInfo.website ? (
                      <a href={settings.basicInfo.website} target="_blank" rel="noopener noreferrer">
                        {settings.basicInfo.website}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
              </div>
              <div className="col-12">
                <div className="mb-3">
                  <label className="form-label text-muted">Address</label>
                  <p className="fw-medium">{settings.basicInfo.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      School Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.schoolName ? 'is-invalid' : ''}`}
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleInputChange}
                      placeholder="Enter school name"
                    />
                    {formErrors.schoolName && (
                      <div className="invalid-feedback">{formErrors.schoolName}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                    />
                    {formErrors.email && (
                      <div className="invalid-feedback">{formErrors.email}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Fax</label>
                    <input
                      type="text"
                      className="form-control"
                      name="fax"
                      value={formData.fax}
                      onChange={handleInputChange}
                      placeholder="Enter fax number"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Website</label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.website ? 'is-invalid' : ''}`}
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                    />
                    {formErrors.website && (
                      <div className="invalid-feedback">{formErrors.website}</div>
                    )}
                  </div>
                </div>
                <div className="col-12">
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter complete address"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check me-1"></i>Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <i className="ti ti-x me-1"></i>Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyInfo;
