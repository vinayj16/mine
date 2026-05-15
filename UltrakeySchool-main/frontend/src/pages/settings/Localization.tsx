import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface LocalizationSettings {
  timezone: string;
  dateFormat: string;
  timeFormat: '12' | '24';
  currency: {
    code: string;
    symbol: string;
    position: 'before' | 'after';
  };
  language: string;
}

const Localization: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LocalizationSettings>({
    timezone: 'UTC',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24',
    currency: {
      code: 'USD',
      symbol: '$',
      position: 'before'
    },
    language: 'en'
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/settings', {
        params: {
          institutionId: '507f1f77bcf86cd799439011'
        }
      });

      if (response.data.success) {
        const data = response.data.data;
        setFormData({
          timezone: data.timezone || 'UTC',
          dateFormat: data.dateFormat || 'DD/MM/YYYY',
          timeFormat: data.timeFormat || '24',
          currency: data.currency || {
            code: 'USD',
            symbol: '$',
            position: 'before'
          },
          language: data.language || 'en'
        });
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load localization settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      const response = await apiClient.put('/settings/localization', {
        institutionId: '507f1f77bcf86cd799439011',
        ...formData
      });

      if (response.data.success) {
        toast.success('Localization settings updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating settings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update localization settings';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof LocalizationSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCurrencyChange = (field: keyof LocalizationSettings['currency'], value: string) => {
    setFormData(prev => ({
      ...prev,
      currency: {
        ...prev.currency,
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading localization settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="page-title mb-1">Localization Settings</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">Localization</li>
          </ol>
        </nav>

        <div className="card mt-3">
          <div className="card-body">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="ti ti-alert-circle me-2 fs-4"></i>
              <div className="flex-grow-1">
                <h5 className="alert-heading">Error Loading Localization Settings</h5>
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

  return (
    <div>
      <h3 className="page-title mb-1">Localization Settings</h3>
      <nav>
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active">Localization</li>
        </ol>
      </nav>

      <div className="card mt-3">
        <div className="card-header">
          <h5 className="mb-0">Regional & Language Settings</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* LANGUAGE */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">
                    <i className="ti ti-language me-1"></i>Language
                  </label>
                  <select
                    className="form-select"
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish (Español)</option>
                    <option value="fr">French (Français)</option>
                    <option value="de">German (Deutsch)</option>
                    <option value="ar">Arabic (العربية)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="zh">Chinese (中文)</option>
                    <option value="ja">Japanese (日本語)</option>
                    <option value="pt">Portuguese (Português)</option>
                    <option value="ru">Russian (Русский)</option>
                  </select>
                  <small className="text-muted">Select the default language for the system</small>
                </div>
              </div>

              {/* TIMEZONE */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">
                    <i className="ti ti-world me-1"></i>Timezone
                  </label>
                  <select
                    className="form-select"
                    value={formData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">EST - Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">CST - Central Time (US & Canada)</option>
                    <option value="America/Denver">MST - Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">PST - Pacific Time (US & Canada)</option>
                    <option value="Europe/London">GMT - London</option>
                    <option value="Europe/Paris">CET - Paris, Berlin</option>
                    <option value="Asia/Dubai">GST - Dubai</option>
                    <option value="Asia/Kolkata">IST - India Standard Time</option>
                    <option value="Asia/Shanghai">CST - China Standard Time</option>
                    <option value="Asia/Tokyo">JST - Japan Standard Time</option>
                    <option value="Australia/Sydney">AEST - Sydney</option>
                  </select>
                  <small className="text-muted">Select your local timezone</small>
                </div>
              </div>

              {/* DATE FORMAT */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">
                    <i className="ti ti-calendar me-1"></i>Date Format
                  </label>
                  <select
                    className="form-select"
                    value={formData.dateFormat}
                    onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY (31-12-2024)</option>
                    <option value="MM-DD-YYYY">MM-DD-YYYY (12-31-2024)</option>
                  </select>
                  <small className="text-muted">Choose how dates are displayed</small>
                </div>
              </div>

              {/* TIME FORMAT */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">
                    <i className="ti ti-clock me-1"></i>Time Format
                  </label>
                  <select
                    className="form-select"
                    value={formData.timeFormat}
                    onChange={(e) => handleInputChange('timeFormat', e.target.value as '12' | '24')}
                  >
                    <option value="12">12-hour (01:30 PM)</option>
                    <option value="24">24-hour (13:30)</option>
                  </select>
                  <small className="text-muted">Choose time display format</small>
                </div>
              </div>

              {/* CURRENCY CODE */}
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">
                    <i className="ti ti-currency-dollar me-1"></i>Currency Code
                  </label>
                  <select
                    className="form-select"
                    value={formData.currency.code}
                    onChange={(e) => handleCurrencyChange('code', e.target.value)}
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
              </div>

              {/* CURRENCY SYMBOL */}
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Currency Symbol</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.currency.symbol}
                    onChange={(e) => handleCurrencyChange('symbol', e.target.value)}
                    placeholder="$"
                    maxLength={3}
                  />
                </div>
              </div>

              {/* CURRENCY POSITION */}
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Symbol Position</label>
                  <select
                    className="form-select"
                    value={formData.currency.position}
                    onChange={(e) => handleCurrencyChange('position', e.target.value)}
                  >
                    <option value="before">Before ($100)</option>
                    <option value="after">After (100$)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* PREVIEW */}
            <div className="alert alert-info mt-3">
              <h6 className="alert-heading">
                <i className="ti ti-eye me-1"></i>Preview
              </h6>
              <div className="row">
                <div className="col-md-6">
                  <p className="mb-1">
                    <strong>Date:</strong> {new Date().toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="mb-1">
                    <strong>Time:</strong> {new Date().toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: formData.timeFormat === '12'
                    })}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="mb-1">
                    <strong>Currency:</strong> {formData.currency.position === 'before' 
                      ? `${formData.currency.symbol}100.00` 
                      : `100.00${formData.currency.symbol}`}
                  </p>
                  <p className="mb-1">
                    <strong>Language:</strong> {formData.language.toUpperCase()}
                  </p>
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
                    <i className="ti ti-check me-1"></i>Save Settings
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={fetchSettings}
                disabled={saving}
              >
                <i className="ti ti-refresh me-1"></i>Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Localization;
