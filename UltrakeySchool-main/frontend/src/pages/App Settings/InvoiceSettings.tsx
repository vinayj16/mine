import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import settingsService, { type Settings } from '../../services/settingsService';

const InvoiceSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const [formData, setFormData] = useState({
    invoicePrefix: '',
    invoiceDueDays: 5,
    invoiceRoundOff: false,
    invoiceRoundOffType: 'up' as 'up' | 'down' | 'nearest',
    showCompanyDetails: true,
    invoiceHeaderTerms: '',
    invoiceFooterTerms: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const institutionId = localStorage.getItem('institutionId') || localStorage.getItem('schoolId');
      if (!institutionId) {
        toast.error('Institution ID not found');
        return;
      }

      const response = await settingsService.getSettings(institutionId);
      const data = (response as any).data;
      
      if (data) {
        setSettings(data);
        setFormData({
          invoicePrefix: data.prefixes?.invoice || 'INV',
          invoiceDueDays: 5, // This would come from settings if we add it to the model
          invoiceRoundOff: false,
          invoiceRoundOffType: 'up',
          showCompanyDetails: true,
          invoiceHeaderTerms: '',
          invoiceFooterTerms: ''
        });

        if (data.logo?.url) {
          setLogoPreview(data.logo.url);
        }
      }
    } catch (error: any) {
      // If settings don't exist yet, that's okay - we'll create them on save
      if (error.response?.status !== 404) {
        toast.error(error.response?.data?.message || 'Failed to fetch settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoDelete = async () => {
    try {
      const institutionId = localStorage.getItem('institutionId') || localStorage.getItem('schoolId');
      if (!institutionId) {
        toast.error('Institution ID not found');
        return;
      }

      await settingsService.deleteLogo(institutionId);
      setLogoFile(null);
      setLogoPreview('');
      toast.success('Logo deleted successfully');
      fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete logo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const institutionId = localStorage.getItem('institutionId') || localStorage.getItem('schoolId');
      if (!institutionId) {
        toast.error('Institution ID not found');
        return;
      }

      // Upload logo if changed
      if (logoFile) {
        await settingsService.uploadLogo(institutionId, logoFile);
      }

      // Update settings
      const updateData: Partial<Settings> = {
        prefixes: {
          ...settings?.prefixes,
          invoice: formData.invoicePrefix
        }
      };

      await settingsService.updateSettings(institutionId, updateData);
      toast.success('Invoice settings saved successfully');
      fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchSettings();
    setLogoFile(null);
  };

  if (loading) {
    return (
      <div className="content bg-white">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Invoice Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/settings">Settings</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Invoice Settings
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon"
              onClick={fetchSettings}
              disabled={loading}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-2 col-xl-3">
          <div className="pt-3 d-flex flex-column list-group mb-4">
            <Link to="/invoice-settings" className="d-block rounded p-2 active">
              Invoice Settings
            </Link>
            <Link to="/custom-fields" className="d-block rounded p-2">
              Custom Fields
            </Link>
          </div>
        </div>

        <div className="col-xxl-10 col-xl-9">
          <div className="flex-fill border-start ps-3">
            <form onSubmit={handleSubmit}>
              <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
                <div className="mb-3">
                  <h5 className="mb-1">Invoice Settings</h5>
                  <p>Configure invoice preferences and appearance</p>
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
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div className="d-md-flex d-block">
                <div className="row flex-fill">
                  <div className="col-xl-10">
                    <div className="settings-middle-info invoice-setting-wrap">
                      {/* Invoice Logo */}
                      <div className="row align-items-center mb-2">
                        <div className="col-xxl-7 col-lg-6">
                          <div className="invoice-info-title">
                            <h6>Invoice Logo</h6>
                            <p>Upload logo of your company to display in invoices</p>
                          </div>
                        </div>
                        <div className="col-xxl-5 col-lg-6">
                          <div className="card">
                            <div className="card-body">
                              {logoPreview && (
                                <div className="d-flex justify-content-between mb-3">
                                  <div className="d-flex align-items-center">
                                    <span className="avatar avatar-xl border rounded d-flex align-items-center justify-content-center p-2 me-2">
                                      <img src={logoPreview} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                    </span>
                                    <h5>Logo</h5>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <button
                                      type="button"
                                      className="text-danger border rounded fs-16 p-1 badge badge-danger-hover"
                                      onClick={handleLogoDelete}
                                    >
                                      <i className="ti ti-trash-x"></i>
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="profile-uploader profile-uploader-two mb-0">
                                <span className="d-block text-center lh-1 fs-24 mb-1">
                                  <i className="ti ti-upload"></i>
                                </span>
                                <div className="drag-upload-btn bg-transparent me-0 border-0">
                                  <p className="fs-12 mb-2">
                                    <span className="text-primary">Click to Upload</span> or drag and drop
                                  </p>
                                  <h6>JPG or PNG</h6>
                                  <h6>(Max 450 x 450 px, 2MB)</h6>
                                </div>
                                <input
                                  type="file"
                                  className="form-control"
                                  accept="image/*"
                                  onChange={handleLogoChange}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Invoice Prefix */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-7 col-lg-6">
                            <div className="mb-3">
                              <h6>Invoice Prefix</h6>
                              <p>Add prefix to your invoice numbers (e.g., INV-001)</p>
                            </div>
                          </div>
                          <div className="col-xxl-5 col-lg-6">
                            <div className="mb-3">
                              <input
                                type="text"
                                className="form-control"
                                name="invoicePrefix"
                                value={formData.invoicePrefix}
                                onChange={handleInputChange}
                                placeholder="INV"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Invoice Due Days */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-7 col-lg-6">
                            <div className="mb-3">
                              <h6>Invoice Due</h6>
                              <p>Default number of days until invoice is due</p>
                            </div>
                          </div>
                          <div className="col-xxl-5 col-lg-6">
                            <div className="mb-3 d-flex align-items-center">
                              <div className="w-100">
                                <input
                                  type="number"
                                  className="form-control"
                                  name="invoiceDueDays"
                                  value={formData.invoiceDueDays}
                                  onChange={handleInputChange}
                                  min="1"
                                  max="365"
                                />
                              </div>
                              <span className="ms-3 d-block">Days</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Invoice Round Off */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-7 col-lg-6">
                            <div className="mb-3">
                              <h6>Invoice Round Off</h6>
                              <p>Enable value rounding in invoices</p>
                            </div>
                          </div>
                          <div className="col-xxl-5 col-lg-6">
                            <div className="mb-3 d-flex align-items-center">
                              <div className="w-100">
                                <select
                                  className="form-select"
                                  name="invoiceRoundOffType"
                                  value={formData.invoiceRoundOffType}
                                  onChange={handleInputChange}
                                  disabled={!formData.invoiceRoundOff}
                                >
                                  <option value="up">Round Up</option>
                                  <option value="down">Round Down</option>
                                  <option value="nearest">Round to Nearest</option>
                                </select>
                              </div>
                              <div className="status-toggle modal-status ms-3">
                                <input
                                  type="checkbox"
                                  id="invoiceRoundOff"
                                  name="invoiceRoundOff"
                                  className="check"
                                  checked={formData.invoiceRoundOff}
                                  onChange={handleInputChange}
                                />
                                <label htmlFor="invoiceRoundOff" className="checktoggle"></label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Show Company Details */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-7 col-lg-6">
                            <div className="mb-3">
                              <h6>Show Company Details</h6>
                              <p>Display company information on invoices</p>
                            </div>
                          </div>
                          <div className="col-xxl-5 col-lg-6">
                            <div className="mb-3">
                              <div className="status-toggle modal-status">
                                <input
                                  type="checkbox"
                                  id="showCompanyDetails"
                                  name="showCompanyDetails"
                                  className="check"
                                  checked={formData.showCompanyDetails}
                                  onChange={handleInputChange}
                                />
                                <label htmlFor="showCompanyDetails" className="checktoggle"></label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Invoice Header Terms */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-7 col-lg-6">
                            <div className="mb-3">
                              <h6>Invoice Header Terms</h6>
                              <p>Text to display at the top of invoices</p>
                            </div>
                          </div>
                          <div className="col-xxl-5 col-lg-6">
                            <div className="mb-3">
                              <textarea
                                rows={4}
                                className="form-control"
                                name="invoiceHeaderTerms"
                                value={formData.invoiceHeaderTerms}
                                onChange={handleInputChange}
                                placeholder="Enter header terms..."
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Invoice Footer Terms */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-7 col-lg-6">
                            <div className="mb-3">
                              <h6>Invoice Footer Terms</h6>
                              <p>Text to display at the bottom of invoices</p>
                            </div>
                          </div>
                          <div className="col-xxl-5 col-lg-6">
                            <div className="mb-3">
                              <textarea
                                rows={4}
                                className="form-control"
                                name="invoiceFooterTerms"
                                value={formData.invoiceFooterTerms}
                                onChange={handleInputChange}
                                placeholder="Enter footer terms..."
                              ></textarea>
                            </div>
                          </div>
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
    </div>
  );
};

export default InvoiceSettings;
