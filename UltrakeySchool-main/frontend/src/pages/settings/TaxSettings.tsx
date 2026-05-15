import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface TaxType {
  name: string;
  displayName: string;
  rate: number;
  enabled: boolean;
  description: string;
}

interface TaxSettings {
  defaultTaxType: string;
  enableTax: boolean;
  taxTypes: TaxType[];
  compoundTax: boolean;
  taxExemptionEnabled: boolean;
  taxExemptionThreshold: number;
}

const TaxSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<TaxSettings>({
    defaultTaxType: 'vat',
    enableTax: false,
    taxTypes: [
      { name: 'vat', displayName: 'VAT (Value Added Tax)', rate: 0, enabled: false, description: 'Standard VAT rate' },
      { name: 'gst', displayName: 'GST (Goods and Services Tax)', rate: 0, enabled: false, description: 'Unified GST rate' },
      { name: 'sales', displayName: 'Sales Tax', rate: 0, enabled: false, description: 'State/local sales tax' },
      { name: 'service', displayName: 'Service Tax', rate: 0, enabled: false, description: 'Tax on services' }
    ],
    compoundTax: false,
    taxExemptionEnabled: false,
    taxExemptionThreshold: 0
  });

  const institutionId = '507f1f77bcf86cd799439011';

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/settings', {
        params: {
          institutionId,
          type: 'tax'
        }
      });

      if (response.data.success && response.data.data) {
        const taxData = response.data.data.data || response.data.data;
        if (taxData.taxTypes) {
          setSettings(taxData);
        }
      }
    } catch (err: any) {
      console.error('Error fetching tax settings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load tax settings';
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

    // Validation
    if (settings.enableTax) {
      const enabledTaxes = settings.taxTypes.filter(t => t.enabled);
      if (enabledTaxes.length === 0) {
        toast.error('Please enable at least one tax type');
        return;
      }

      for (const tax of enabledTaxes) {
        if (tax.rate < 0 || tax.rate > 100) {
          toast.error(`${tax.displayName} rate must be between 0 and 100`);
          return;
        }
      }
    }

    try {
      setSaving(true);

      const response = await apiClient.put('/settings', {
        institutionId,
        type: 'tax',
        data: settings
      });

      if (response.data.success) {
        toast.success('Tax settings updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating tax settings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update tax settings';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleTaxTypeChange = (index: number, field: keyof TaxType, value: any) => {
    const updatedTaxTypes = [...settings.taxTypes];
    updatedTaxTypes[index] = {
      ...updatedTaxTypes[index],
      [field]: value
    };
    setSettings({ ...settings, taxTypes: updatedTaxTypes });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading tax settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="page-title mb-1">Tax Settings</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">Tax Settings</li>
          </ol>
        </nav>
        <div className="card mt-3">
          <div className="card-body">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="ti ti-alert-circle me-2 fs-4"></i>
              <div className="flex-grow-1">
                <h5 className="alert-heading">Error Loading Tax Settings</h5>
                <p className="mb-0">{error}</p>
              </div>
              <button className="btn btn-outline-danger ms-3" onClick={fetchSettings}>
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
      <h3 className="page-title mb-1">Tax Settings</h3>
      <nav>
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active">Tax Settings</li>
        </ol>
      </nav>

      <div className="card mt-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Tax Configuration</h5>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.enableTax}
              onChange={(e) => setSettings({ ...settings, enableTax: e.target.checked })}
              id="enableTax"
            />
            <label className="form-check-label" htmlFor="enableTax">
              Enable Tax
            </label>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* TAX TYPES */}
            <h6 className="mb-3">
              <i className="ti ti-receipt-tax me-1"></i>Tax Types
            </h6>
            <div className="row g-3 mb-4">
              {settings.taxTypes.map((taxType, index) => (
                <div key={taxType.name} className="col-md-6">
                  <div className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-1">{taxType.displayName}</h6>
                        <small className="text-muted">{taxType.description}</small>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={taxType.enabled}
                          onChange={(e) => handleTaxTypeChange(index, 'enabled', e.target.checked)}
                          id={`enable-${taxType.name}`}
                          disabled={!settings.enableTax}
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        value={taxType.rate}
                        onChange={(e) => handleTaxTypeChange(index, 'rate', Number(e.target.value))}
                        min="0"
                        max="100"
                        step="0.01"
                        disabled={!settings.enableTax || !taxType.enabled}
                        placeholder="0.00"
                      />
                      <span className="input-group-text">%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DEFAULT TAX TYPE */}
            <div className="mb-4">
              <label className="form-label">
                <i className="ti ti-star me-1"></i>Default Tax Type
              </label>
              <select
                className="form-select"
                value={settings.defaultTaxType}
                onChange={(e) => setSettings({ ...settings, defaultTaxType: e.target.value })}
                disabled={!settings.enableTax}
              >
                {settings.taxTypes.filter(t => t.enabled).map(taxType => (
                  <option key={taxType.name} value={taxType.name}>
                    {taxType.displayName}
                  </option>
                ))}
                {settings.taxTypes.filter(t => t.enabled).length === 0 && (
                  <option value="">No tax types enabled</option>
                )}
              </select>
              <small className="text-muted">This tax will be applied by default on transactions</small>
            </div>

            {/* ADVANCED SETTINGS */}
            <h6 className="mb-3">
              <i className="ti ti-settings me-1"></i>Advanced Settings
            </h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.compoundTax}
                    onChange={(e) => setSettings({ ...settings, compoundTax: e.target.checked })}
                    id="compoundTax"
                    disabled={!settings.enableTax}
                  />
                  <label className="form-check-label" htmlFor="compoundTax">
                    Enable Compound Tax
                  </label>
                </div>
                <small className="text-muted d-block ms-4">
                  Apply tax on top of other taxes (tax on tax)
                </small>
              </div>
              <div className="col-md-6">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.taxExemptionEnabled}
                    onChange={(e) => setSettings({ ...settings, taxExemptionEnabled: e.target.checked })}
                    id="taxExemption"
                    disabled={!settings.enableTax}
                  />
                  <label className="form-check-label" htmlFor="taxExemption">
                    Enable Tax Exemption
                  </label>
                </div>
                <small className="text-muted d-block ms-4">
                  Allow tax exemption for eligible transactions
                </small>
              </div>
            </div>

            {/* TAX EXEMPTION THRESHOLD */}
            {settings.taxExemptionEnabled && (
              <div className="mb-4">
                <label className="form-label">
                  <i className="ti ti-discount me-1"></i>Tax Exemption Threshold
                </label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.taxExemptionThreshold}
                    onChange={(e) => setSettings({ ...settings, taxExemptionThreshold: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                    disabled={!settings.enableTax}
                    placeholder="0.00"
                  />
                </div>
                <small className="text-muted">
                  Transactions below this amount will be exempt from tax
                </small>
              </div>
            )}

            {/* TAX CALCULATION PREVIEW */}
            {settings.enableTax && settings.taxTypes.some(t => t.enabled) && (
              <div className="alert alert-info">
                <h6 className="alert-heading">
                  <i className="ti ti-calculator me-1"></i>Tax Calculation Preview
                </h6>
                <p className="mb-2">Example: $100.00 base amount</p>
                <ul className="mb-0">
                  {settings.taxTypes.filter(t => t.enabled).map(tax => (
                    <li key={tax.name}>
                      {tax.displayName}: ${(100 * tax.rate / 100).toFixed(2)} ({tax.rate}%)
                    </li>
                  ))}
                  <li className="fw-bold mt-2">
                    Total Tax: ${settings.taxTypes.filter(t => t.enabled).reduce((sum, tax) => sum + (100 * tax.rate / 100), 0).toFixed(2)}
                  </li>
                  <li className="fw-bold">
                    Final Amount: ${(100 + settings.taxTypes.filter(t => t.enabled).reduce((sum, tax) => sum + (100 * tax.rate / 100), 0)).toFixed(2)}
                  </li>
                </ul>
              </div>
            )}

            {/* ACTIONS */}
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check me-1"></i>Save Tax Settings
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={fetchSettings}
              >
                <i className="ti ti-refresh me-1"></i>Reset
              </button>
            </div>
          </form>

          {/* INFO ALERT */}
          <div className="alert alert-warning mt-4">
            <h6 className="alert-heading">
              <i className="ti ti-info-circle me-1"></i>Important Information
            </h6>
            <ul className="mb-0">
              <li>Tax rates are applied to fee payments and transactions</li>
              <li>Ensure tax rates comply with local regulations</li>
              <li>Changes to tax settings will affect new transactions only</li>
              <li>Consult with a tax professional for accurate tax configuration</li>
              <li>Keep records of all tax rate changes for audit purposes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxSettings;
