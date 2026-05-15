import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface LocalizationSettings {
  language: string;
  languageSwitcher: boolean;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  financialYear: string;
  startingMonth: string;
  currency: string;
  currencySymbol: string;
  currencyPosition: string;
  decimalSeparator: string;
  thousandSeparator: string;
  countryRestriction: string;
  allowedFileTypes: string[];
  maxFileSize: number;
}

const Localization: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<LocalizationSettings>({
    language: 'English',
    languageSwitcher: false,
    timezone: 'UTC',
    dateFormat: 'DD MMM YYYY',
    timeFormat: '12',
    financialYear: '2024',
    startingMonth: 'January',
    currency: 'USD',
    currencySymbol: '$',
    currencyPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    countryRestriction: 'allow_all',
    allowedFileTypes: ['JPG', 'GIF', 'PNG'],
    maxFileSize: 5000,
  });

  useEffect(() => {
    fetchLocalizationSettings();
  }, []);

  const fetchLocalizationSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/localization');

      if (response.data.success) {
        setFormData(response.data.data || formData);
      }
    } catch (err: any) {
      console.error('Error fetching localization settings:', err);
      toast.error(err.response?.data?.message || 'Failed to load localization settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileTypesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const types = value.split(',').map(t => t.trim()).filter(t => t);
    setFormData(prev => ({ ...prev, allowedFileTypes: types }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const response = await apiClient.put('/settings/localization', formData);

      if (response.data.success) {
        toast.success('Localization settings updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating localization settings:', err);
      toast.error(err.response?.data?.message || 'Failed to update localization settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchLocalizationSettings();
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
              onClick={fetchLocalizationSettings}
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
              <Link to="/company-settings" className="d-block rounded p-2">
                Company Settings
              </Link>
              <Link to="/localization" className="d-block rounded p-2 active">
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
            <div className="border-start ps-3">
              <form onSubmit={handleSubmit}>
                <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
                  <div className="mb-3">
                    <h5 className="mb-1">Localization</h5>
                    <p>Collection of settings for user environment</p>
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
                    {/* Basic Information */}
                    <div className="card">
                      <div className="card-header p-3">
                        <h5>Basic Information</h5>
                      </div>
                      <div className="card-body p-3 pb-0">
                        <div className="d-block d-xl-flex align-items-end">
                          <div className="mb-3 flex-fill me-xl-3 me-0">
                            <label className="form-label">Language</label>
                            <select
                              className="form-select"
                              name="language"
                              value={formData.language}
                              onChange={handleChange}
                            >
                              <option value="English">English</option>
                              <option value="Spanish">Spanish</option>
                              <option value="French">French</option>
                              <option value="German">German</option>
                              <option value="Chinese">Chinese</option>
                              <option value="Arabic">Arabic</option>
                            </select>
                          </div>
                          <div className="mb-3 flex-fill">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="status-title">
                                <h5>Language Switcher</h5>
                                <p>To display in all pages</p>
                              </div>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  name="languageSwitcher"
                                  checked={formData.languageSwitcher}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-xl-4">
                            <div className="mb-3">
                              <label className="form-label">Timezone</label>
                              <select
                                className="form-select"
                                name="timezone"
                                value={formData.timezone}
                                onChange={handleChange}
                              >
                                <option value="UTC">UTC</option>
                                <option value="UTC+5:30">UTC+5:30 (IST)</option>
                                <option value="UTC-5:00">UTC-5:00 (EST)</option>
                                <option value="UTC-8:00">UTC-8:00 (PST)</option>
                                <option value="UTC+1:00">UTC+1:00 (CET)</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-xl-4">
                            <div className="mb-3">
                              <label className="form-label">Date Format</label>
                              <select
                                className="form-select"
                                name="dateFormat"
                                value={formData.dateFormat}
                                onChange={handleChange}
                              >
                                <option value="DD MMM YYYY">01 Jan 2024</option>
                                <option value="MMM DD YYYY">Jan 01 2024</option>
                                <option value="YYYY MMM DD">2024 Jan 01</option>
                                <option value="DD/MM/YYYY">01/01/2024</option>
                                <option value="MM/DD/YYYY">01/01/2024</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-xl-4">
                            <div className="mb-3">
                              <label className="form-label">Time Format</label>
                              <select
                                className="form-select"
                                name="timeFormat"
                                value={formData.timeFormat}
                                onChange={handleChange}
                              >
                                <option value="12">12 Hours</option>
                                <option value="24">24 Hours</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-xl-4">
                            <div className="mb-3">
                              <label className="form-label">Financial Year</label>
                              <select
                                className="form-select"
                                name="financialYear"
                                value={formData.financialYear}
                                onChange={handleChange}
                              >
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                                <option value="2025">2025</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-xl-4">
                            <div className="mb-3">
                              <label className="form-label">Starting Month</label>
                              <select
                                className="form-select"
                                name="startingMonth"
                                value={formData.startingMonth}
                                onChange={handleChange}
                              >
                                <option value="January">January</option>
                                <option value="February">February</option>
                                <option value="March">March</option>
                                <option value="April">April</option>
                                <option value="May">May</option>
                                <option value="June">June</option>
                                <option value="July">July</option>
                                <option value="August">August</option>
                                <option value="September">September</option>
                                <option value="October">October</option>
                                <option value="November">November</option>
                                <option value="December">December</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Currency Settings */}
                    <div className="card">
                      <div className="card-header p-3">
                        <h5>Currency Settings</h5>
                      </div>
                      <div className="card-body p-3 pb-0">
                        <div className="row">
                          <div className="col-xl-4">
                            <div className="mb-3">
                              <label className="form-label">Currency</label>
                              <select
                                className="form-select"
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                              >
                                <option value="USD">United States Dollar (USD)</option>
                                <option value="INR">Indian Rupee (INR)</option>
                                <option value="EUR">Euro (EUR)</option>
                                <option value="GBP">British Pound (GBP)</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-xl-4">
                            <div className="mb-3">
                              <label className="form-label">Currency Symbol</label>
                              <select
                                className="form-select"
                                name="currencySymbol"
                                value={formData.currencySymbol}
                                onChange={handleChange}
                              >
                                <option value="$">$ (Dollar)</option>
                                <option value="₹">₹ (Rupee)</option>
                                <option value="€">€ (Euro)</option>
                                <option value="£">£ (Pound)</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-xl-4">
                            <div className="mb-3">
                              <label className="form-label">Currency Position</label>
                              <select
                                className="form-select"
                                name="currencyPosition"
                                value={formData.currencyPosition}
                                onChange={handleChange}
                              >
                                <option value="before">$100 (Before)</option>
                                <option value="after">100$ (After)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-xl-4">
                            <div className="mb-3">
                              <label className="form-label">Decimal Separator</label>
                              <select
                                className="form-select"
                                name="decimalSeparator"
                                value={formData.decimalSeparator}
                                onChange={handleChange}
                              >
                                <option value=".">. (Dot)</option>
                                <option value=",">, (Comma)</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-xl-4">
                            <div className="mb-3">
                              <label className="form-label">Thousand Separator</label>
                              <select
                                className="form-select"
                                name="thousandSeparator"
                                value={formData.thousandSeparator}
                                onChange={handleChange}
                              >
                                <option value=",">, (Comma)</option>
                                <option value=".">. (Dot)</option>
                                <option value=" "> (Space)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Country Settings */}
                    <div className="card">
                      <div className="card-header p-3">
                        <h5>Country Settings</h5>
                      </div>
                      <div className="card-body p-3 pb-0">
                        <div className="row align-items-center">
                          <div className="col-xl-8">
                            <div className="mb-3">
                              <h6>Country Restriction</h6>
                              <p>Select restricted countries</p>
                            </div>
                          </div>
                          <div className="col-xl-4">
                            <div className="mb-3">
                              <select
                                className="form-select"
                                name="countryRestriction"
                                value={formData.countryRestriction}
                                onChange={handleChange}
                              >
                                <option value="allow_all">Allow All Countries</option>
                                <option value="deny_all">Deny All Countries</option>
                                <option value="custom">Custom Selection</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* File Settings */}
                    <div className="card">
                      <div className="card-header p-3">
                        <h5>File Settings</h5>
                      </div>
                      <div className="card-body p-3 pb-0">
                        <div className="row align-items-center mb-2">
                          <div className="col-xl-8">
                            <div className="mb-3">
                              <h6>Allowed Files</h6>
                              <p>Enter file extensions separated by commas</p>
                            </div>
                          </div>
                          <div className="col-xl-4">
                            <div className="mb-3">
                              <input
                                className="form-control"
                                type="text"
                                value={formData.allowedFileTypes.join(', ')}
                                onChange={handleFileTypesChange}
                                placeholder="JPG, PNG, PDF"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-xl-8">
                            <div className="mb-3">
                              <h6>Maximum File Size</h6>
                              <p>Select max size of files (in MB)</p>
                            </div>
                          </div>
                          <div className="col-xl-4">
                            <div className="mb-3">
                              <select
                                className="form-select"
                                name="maxFileSize"
                                value={formData.maxFileSize}
                                onChange={handleChange}
                              >
                                <option value="1000">1000 MB</option>
                                <option value="2000">2000 MB</option>
                                <option value="5000">5000 MB</option>
                                <option value="10000">10000 MB</option>
                              </select>
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
      )}
    </div>
  );
};

export default Localization;
