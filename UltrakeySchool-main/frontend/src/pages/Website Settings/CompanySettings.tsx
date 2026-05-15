import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface CompanySettingsData {
  companyName: string;
  phone: string;
  email: string;
  fax: string;
  website: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
  logo?: string;
  favicon?: string;
  icon?: string;
  darkLogo?: string;
}

const CompanySettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CompanySettingsData>({
    companyName: '',
    phone: '',
    email: '',
    fax: '',
    website: '',
    address: '',
    country: '',
    state: '',
    city: '',
    postalCode: '',
  });

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/company');

      if (response.data.success) {
        setFormData(response.data.data || formData);
      }
    } catch (err: any) {
      console.error('Error fetching company settings:', err);
      toast.error(err.response?.data?.message || 'Failed to load company settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.put('/settings/company', formData);

      if (response.data.success) {
        toast.success('Company settings updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating company settings:', err);
      toast.error(err.response?.data?.message || 'Failed to update company settings');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon' | 'icon' | 'darkLogo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const endpoint = `/settings/company/upload-${type.toLowerCase().replace(/([A-Z])/g, '-$1')}`;
      const response = await apiClient.post(endpoint, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setFormData(prev => ({ ...prev, [type]: response.data.data.url }));
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
      }
    } catch (err: any) {
      console.error(`Error uploading ${type}:`, err);
      toast.error(err.response?.data?.message || `Failed to upload ${type}`);
    }
  };

  const handleImageDelete = async (type: 'logo' | 'favicon' | 'icon' | 'darkLogo') => {
    if (!window.confirm(`Are you sure you want to delete the ${type}?`)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/settings/company/delete-image/${type}`);

      if (response.data.success) {
        setFormData(prev => ({ ...prev, [type]: undefined }));
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      }
    } catch (err: any) {
      console.error(`Error deleting ${type}:`, err);
      toast.error(err.response?.data?.message || `Failed to delete ${type}`);
    }
  };

  const handleCancel = () => {
    fetchCompanySettings();
    toast.info('Changes discarded');
  };

  return (
    <div className="content">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Website Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/settings">Settings</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Website Settings
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon"
              onClick={fetchCompanySettings}
              disabled={loading}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-xxl-2 col-xl-3">
            <div className="pt-3 d-flex flex-column list-group mb-4">
              <Link to="/company-settings" className="d-block rounded p-2 active">
                Company Settings
              </Link>
              <Link to="/localization" className="d-block rounded p-2">
                Localization
              </Link>
              <Link to="/prefixes" className="d-block rounded p-2">
                Prefixes
              </Link>
              <Link to="/preferences" className="d-block rounded p-2">
                Preferences
              </Link>
              <Link to="/social-authentication" className="d-block rounded p-2">
                Social Authentication
              </Link>
              <Link to="/language" className="d-block rounded p-2">
                Language
              </Link>
            </div>
          </div>

          <div className="col-xxl-10 col-xl-9">
            <div className="flex-fill border-start ps-3">
              <form onSubmit={handleSubmit}>
                <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
                  <div className="mb-3">
                    <h5>Company Settings</h5>
                    <p>Provide your company information</p>
                  </div>
                  <div className="mb-3">
                    <button
                      className="btn btn-light me-2"
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                </div>

                <div className="d-md-flex d-block">
                  <div className="flex-fill">
                    {/* Company Information */}
                    <div className="card">
                      <div className="card-header">
                        <h5>Company Information</h5>
                      </div>
                      <div className="card-body pb-1">
                        <div className="d-block d-xl-flex">
                          <div className="mb-3 flex-fill me-xl-3 me-0">
                            <label className="form-label">Company Name *</label>
                            <input
                              type="text"
                              name="companyName"
                              className="form-control"
                              placeholder="Enter Company Name"
                              value={formData.companyName}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="mb-3 flex-fill">
                            <label className="form-label">Phone Number</label>
                            <input
                              type="tel"
                              name="phone"
                              className="form-control"
                              placeholder="Enter Phone Number"
                              value={formData.phone}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Company Email Address *</label>
                          <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="Enter Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="d-block d-xl-flex">
                          <div className="mb-3 flex-fill me-xl-3 me-0">
                            <label className="form-label">Fax Number</label>
                            <input
                              type="tel"
                              name="fax"
                              className="form-control"
                              placeholder="Enter Fax Number"
                              value={formData.fax}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="mb-3 flex-fill">
                            <label className="form-label">Website</label>
                            <input
                              type="url"
                              name="website"
                              className="form-control"
                              placeholder="Enter Website"
                              value={formData.website}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="card">
                      <div className="card-header">
                        <h5>Address Information</h5>
                      </div>
                      <div className="card-body pb-1">
                        <div className="mb-3">
                          <label className="form-label">Address</label>
                          <input
                            type="text"
                            name="address"
                            className="form-control"
                            placeholder="Enter Address"
                            value={formData.address}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="d-block d-xl-flex">
                          <div className="mb-3 flex-fill me-xl-3 me-0">
                            <label className="form-label">Country</label>
                            <input
                              type="text"
                              name="country"
                              className="form-control"
                              placeholder="Enter Country"
                              value={formData.country}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="mb-3 flex-fill">
                            <label className="form-label">State / Province</label>
                            <input
                              type="text"
                              name="state"
                              className="form-control"
                              placeholder="Enter State"
                              value={formData.state}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                        <div className="d-block d-xl-flex">
                          <div className="mb-3 flex-fill me-xl-3 me-0">
                            <label className="form-label">City</label>
                            <input
                              type="text"
                              name="city"
                              className="form-control"
                              placeholder="City"
                              value={formData.city}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="mb-3 flex-fill">
                            <label className="form-label">Postal Code</label>
                            <input
                              type="text"
                              name="postalCode"
                              className="form-control"
                              placeholder="Enter Postal Code"
                              value={formData.postalCode}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company Images Sidebar */}
                  <div className="settings-right-sidebar ms-md-3">
                    <div className="card">
                      <div className="card-header">
                        <h5>Company Images</h5>
                      </div>
                      <div className="card-body">
                        {/* Logo */}
                        <div className="border-bottom mb-3 pb-3">
                          <div className="d-flex justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <span className="avatar avatar-xl border rounded d-flex align-items-center justify-content-center p-2 me-2">
                                <img
                                  src={formData.logo || '/assets/img/logo-small.svg'}
                                  alt="Logo"
                                />
                              </span>
                              <h5>Logo</h5>
                            </div>
                            {formData.logo && (
                              <div className="d-flex align-items-center">
                                <button
                                  type="button"
                                  className="text-danger border rounded fs-16 p-1 badge badge-danger-hover"
                                  onClick={() => handleImageDelete('logo')}
                                >
                                  <i className="ti ti-trash-x"></i>
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="profile-uploader profile-uploader-two mb-0">
                            <span className="d-block text-center lh-1 fs-24 mb-1">
                              <i className="ti ti-upload"></i>
                            </span>
                            <div className="drag-upload-btn bg-transparent me-0 border-0">
                              <p className="fs-12 mb-2">
                                <span className="text-primary">Click to Upload</span> or drag and drop
                              </p>
                              <h6>JPG or PNG</h6>
                              <h6>(Max 450 x 450 px)</h6>
                            </div>
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'logo')}
                            />
                          </div>
                        </div>

                        {/* Favicon */}
                        <div className="border-bottom mb-3 pb-3">
                          <div className="d-flex justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <span className="avatar avatar-xl border rounded d-flex align-items-center justify-content-center p-2 me-2">
                                <img
                                  src={formData.favicon || '/assets/img/logo-small.svg'}
                                  alt="Favicon"
                                />
                              </span>
                              <h5>Favicon</h5>
                            </div>
                            {formData.favicon && (
                              <div className="d-flex align-items-center">
                                <button
                                  type="button"
                                  className="text-danger border rounded fs-16 p-1 badge badge-danger-hover"
                                  onClick={() => handleImageDelete('favicon')}
                                >
                                  <i className="ti ti-trash-x"></i>
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="profile-uploader profile-uploader-two mb-0">
                            <span className="d-block text-center lh-1 fs-24 mb-1">
                              <i className="ti ti-upload"></i>
                            </span>
                            <div className="drag-upload-btn bg-transparent me-0 border-0">
                              <p className="fs-12 mb-2">
                                <span className="text-primary">Click to Upload</span> or drag and drop
                              </p>
                              <h6>JPG or PNG</h6>
                              <h6>(Max 450 x 450 px)</h6>
                            </div>
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'favicon')}
                            />
                          </div>
                        </div>

                        {/* Icon */}
                        <div className="border-bottom mb-3 pb-3">
                          <div className="d-flex justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <span className="avatar avatar-xl border rounded d-flex align-items-center justify-content-center p-2 me-2">
                                <img
                                  src={formData.icon || '/assets/img/logo-small.svg'}
                                  alt="Icon"
                                />
                              </span>
                              <h5>Icon</h5>
                            </div>
                            {formData.icon && (
                              <div className="d-flex align-items-center">
                                <button
                                  type="button"
                                  className="text-danger border rounded fs-16 p-1 badge badge-danger-hover"
                                  onClick={() => handleImageDelete('icon')}
                                >
                                  <i className="ti ti-trash-x"></i>
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="profile-uploader profile-uploader-two mb-0">
                            <span className="d-block text-center lh-1 fs-24 mb-1">
                              <i className="ti ti-upload"></i>
                            </span>
                            <div className="drag-upload-btn bg-transparent me-0 border-0">
                              <p className="fs-12 mb-2">
                                <span className="text-primary">Click to Upload</span> or drag and drop
                              </p>
                              <h6>JPG or PNG</h6>
                              <h6>(Max 450 x 450 px)</h6>
                            </div>
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'icon')}
                            />
                          </div>
                        </div>

                        {/* Dark Logo */}
                        <div>
                          <div className="d-flex justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <span className="avatar avatar-xl border rounded d-flex align-items-center justify-content-center p-2 me-2">
                                <img
                                  src={formData.darkLogo || '/assets/img/logo-small.svg'}
                                  alt="Dark Logo"
                                />
                              </span>
                              <h5>Dark Logo</h5>
                            </div>
                            {formData.darkLogo && (
                              <div className="d-flex align-items-center">
                                <button
                                  type="button"
                                  className="text-danger border rounded fs-16 p-1 badge badge-danger-hover"
                                  onClick={() => handleImageDelete('darkLogo')}
                                >
                                  <i className="ti ti-trash-x"></i>
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="profile-uploader profile-uploader-two mb-0">
                            <span className="d-block text-center lh-1 fs-24 mb-1">
                              <i className="ti ti-upload"></i>
                            </span>
                            <div className="drag-upload-btn bg-transparent me-0 border-0">
                              <p className="fs-12 mb-2">
                                <span className="text-primary">Click to Upload</span> or drag and drop
                              </p>
                              <h6>JPG or PNG</h6>
                              <h6>(Max 450 x 450 px)</h6>
                            </div>
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'darkLogo')}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySettings;
