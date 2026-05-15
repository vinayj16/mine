import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Gateway {
  name: string;
  displayName: string;
  description?: string;
  logo?: string;
  isEnabled: boolean;
  isConnected: boolean;
  credentials?: {
    apiKey?: string;
    apiSecret?: string;
    merchantId?: string;
    publicKey?: string;
    webhookSecret?: string;
    environment: 'sandbox' | 'production';
  };
  settings?: {
    currency: string;
    acceptedPaymentMethods: string[];
    autoCapture: boolean;
    sendReceipt: boolean;
  };
  connectedAt?: string;
  lastUsed?: string;
}

interface PaymentGatewaySettings {
  _id: string;
  institutionId: string;
  gateways: Gateway[];
  defaultGateway?: string;
  isActive: boolean;
}

const PaymentGateway: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PaymentGatewaySettings | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/payment-gateway/settings');

      if (response.data.success) {
        setSettings(response.data.data.settings);
      }
    } catch (err: any) {
      console.error('Error fetching payment gateway settings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load payment gateway settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleGateway = async (gatewayName: string, isEnabled: boolean) => {
    try {
      const response = await apiClient.patch(
        `/payment-gateway/settings/${gatewayName}/toggle`,
        { isEnabled }
      );

      if (response.data.success) {
        fetchSettings();
        toast.success(`${gatewayName} ${isEnabled ? 'enabled' : 'disabled'} successfully`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle gateway');
    }
  };

  const handleSetDefault = async (gatewayName: string) => {
    try {
      setSaving(true);
      const response = await apiClient.put('/payment-gateway/settings', {
        defaultGateway: gatewayName
      });

      if (response.data.success) {
        setSettings(response.data.data.settings);
        toast.success(`${gatewayName} set as default gateway`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to set default gateway');
    } finally {
      setSaving(false);
    }
  };

  const getGatewayIcon = (name: string) => {
    const icons: Record<string, string> = {
      'stripe': 'ti-brand-stripe',
      'paypal': 'ti-brand-paypal',
      'razorpay': 'ti-currency-rupee',
      'payu': 'ti-credit-card',
      'bank-transfer': 'ti-building-bank',
      'cash-on-delivery': 'ti-cash'
    };
    return icons[name] || 'ti-credit-card';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading payment gateways...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="page-title mb-1">Payment Gateways</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">Payment Gateways</li>
          </ol>
        </nav>
        <div className="card mt-3">
          <div className="card-body">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="ti ti-alert-circle me-2 fs-4"></i>
              <div className="flex-grow-1">
                <h5 className="alert-heading">Error Loading Payment Gateways</h5>
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

  if (!settings) {
    return (
      <div>
        <h3 className="page-title mb-1">Payment Gateways</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">Payment Gateways</li>
          </ol>
        </nav>
        <div className="card mt-3">
          <div className="card-body text-center py-5">
            <i className="ti ti-database-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
            <p className="mt-2 text-muted">No payment gateway settings available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="page-title mb-1">Payment Gateways</h3>
      <nav>
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active">Payment Gateways</li>
        </ol>
      </nav>

      {settings.defaultGateway && (
        <div className="alert alert-info mt-3">
          <i className="ti ti-info-circle me-2"></i>
          Default Gateway: <strong>{settings.defaultGateway.toUpperCase()}</strong>
        </div>
      )}

      <div className="row mt-3">
        {settings.gateways && settings.gateways.length > 0 ? (
          settings.gateways.map((gateway) => (
            <div key={gateway.name} className="col-xl-4 col-md-6 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center">
                      <div className="avatar avatar-lg bg-primary-transparent rounded me-3">
                        <i className={`${getGatewayIcon(gateway.name)} fs-24`}></i>
                      </div>
                      <div>
                        <h5 className="mb-1">{gateway.displayName}</h5>
                        <small className="text-muted">{gateway.description || gateway.name}</small>
                      </div>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={gateway.isEnabled}
                        onChange={(e) => handleToggleGateway(gateway.name, e.target.checked)}
                        id={`toggle-${gateway.name}`}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Status:</span>
                      <span className={`badge ${gateway.isConnected ? 'bg-success' : 'bg-secondary'}`}>
                        {gateway.isConnected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    {gateway.credentials?.environment && (
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Environment:</span>
                        <span className={`badge ${gateway.credentials.environment === 'production' ? 'bg-primary' : 'bg-warning'}`}>
                          {gateway.credentials.environment}
                        </span>
                      </div>
                    )}
                    {gateway.settings?.currency && (
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Currency:</span>
                        <span>{gateway.settings.currency}</span>
                      </div>
                    )}
                    {gateway.lastUsed && (
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Last Used:</span>
                        <span>{new Date(gateway.lastUsed).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    {gateway.isEnabled && !gateway.isConnected && (
                      <button
                        className="btn btn-sm btn-primary flex-fill"
                        onClick={() => {
                          setSelectedGateway(gateway);
                          setShowConfigModal(true);
                        }}
                      >
                        <i className="ti ti-plug me-1"></i>Configure
                      </button>
                    )}
                    {gateway.isEnabled && gateway.isConnected && (
                      <button
                        className="btn btn-sm btn-outline-primary flex-fill"
                        onClick={() => handleSetDefault(gateway.name)}
                        disabled={settings.defaultGateway === gateway.name || saving}
                      >
                        {settings.defaultGateway === gateway.name ? (
                          <>
                            <i className="ti ti-check me-1"></i>Default
                          </>
                        ) : (
                          <>
                            <i className="ti ti-star me-1"></i>Set Default
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="ti ti-credit-card-off fs-48 text-muted"></i>
                <p className="mt-2 text-muted">No payment gateways configured</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Modal Placeholder */}
      {showConfigModal && selectedGateway && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Configure {selectedGateway.displayName}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowConfigModal(false);
                    setSelectedGateway(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted">
                  Gateway configuration requires API credentials. Please contact your administrator or refer to the {selectedGateway.displayName} documentation.
                </p>
                <div className="alert alert-info">
                  <i className="ti ti-info-circle me-2"></i>
                  Configuration is managed through the backend API for security purposes.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowConfigModal(false);
                    setSelectedGateway(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentGateway;
