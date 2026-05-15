import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Gateway {
  name: string;
  displayName: string;
  description: string;
  logo: string;
  isEnabled: boolean;
  isConnected: boolean;
}

const PaymentGateways: React.FC = () => {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGatewaySettings();
  }, []);

  const fetchGatewaySettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/payment-gateway/settings');
      if (response.data.success) {
        setGateways(response.data.data?.settings?.gateways || []);
      } else {
        setError(response.data.message || 'Failed to load payment gateway settings');
      }
    } catch (err: any) {
      console.error('Error fetching payment gateway settings:', err);
      setError(err.response?.data?.message ?? err.message ?? 'Failed to load payment gateway settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGateway = async (gatewayName: string, currentStatus: boolean) => {
    try {
      const response = await apiClient.patch(`/payment-gateway/settings/${gatewayName}/toggle`, {
        isEnabled: !currentStatus
      });
      
      if (response.data.success) {
        setGateways(prev => prev.map(g => 
          g.name === gatewayName ? { ...g, isEnabled: !currentStatus } : g
        ));
        toast.success(`Gateway ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      } else {
        toast.error(response.data.message || 'Failed to toggle gateway');
      }
    } catch (err: any) {
      console.error('Error toggling gateway:', err);
      toast.error(err.response?.data?.message || 'Failed to toggle gateway');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.put('/payment-gateway/settings', {
        gateways
      });
      
      if (response.data.success) {
        toast.success('Payment gateway settings saved successfully');
      } else {
        toast.error(response.data.message || 'Failed to save settings');
      }
    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast.error(err.response?.data?.message || 'Failed to save settings');
    }
  };

  return (
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Financial Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><a href="/">Dashboard</a></li>
              <li className="breadcrumb-item"><a href="javascript:void(0);">Settings</a></li>
              <li className="breadcrumb-item active" aria-current="page">Financial Settings</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon" 
              data-bs-toggle="tooltip" 
              data-bs-placement="top" 
              title="Refresh"
              onClick={fetchGatewaySettings}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-xxl-2 col-xl-3">
          <div className="pt-3 d-flex flex-column list-group mb-4">
            <a href="/payment-gateways" className="d-block rounded p-2 active">Payment Gateway</a>
            <a href="/tax-rates" className="d-block rounded p-2">Tax Rates</a>
          </div>
        </div>
        <div className="col-xxl-10 col-xl-9">
          <div className="border-start ps-3">
            <form onSubmit={handleSave}>
              <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
                <div className="mb-3">
                  <h5 className="mb-1">Payment Gateways</h5>
                  <p>Payments Settings Configuration</p>
                </div>
                <div className="mb-3">
                  <a href="/email" className="btn btn-outline-light bg-white btn-icon me-2">
                    <i className="ti ti-mail-share"></i>
                  </a>
                  <button className="btn btn-light me-2" type="button" onClick={() => fetchGatewaySettings()}>Cancel</button>
                  <button className="btn btn-primary" type="submit">Save</button>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger mb-3">
                  <i className="ti ti-alert-circle me-2" />
                  {error}
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-danger ms-3"
                    onClick={fetchGatewaySettings}
                  >
                    Retry
                  </button>
                </div>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading payment gateways...</p>
                </div>
              ) : gateways.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-credit-card-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
                  <p className="mt-3 text-muted">No payment gateways configured</p>
                </div>
              ) : (
                <div className="row">
                  {gateways.map((gateway) => (
                    <div key={gateway.name} className="col-xxl-4 col-xl-6 d-flex">
                      <div className="card flex-fill">
                        <div className="card-header d-flex align-items-center justify-content-between border-0 mb-3 pb-0">
                          <span className="d-inline-flex align-items-center justify-content-center border rounded p-2">
                            <img src={gateway.logo} alt={gateway.displayName} />
                          </span>
                          <div className="d-flex align-items-center">
                            <span className={`badge ${gateway.isConnected ? 'bg-transparent-success text-success' : 'bg-transparent-dark text-dark'} me-2`}>
                              {gateway.isConnected ? 'Connected' : 'Not Connected'}
                            </span>
                            <div className="status-toggle modal-status">
                              <input 
                                type="checkbox" 
                                id={`gateway-${gateway.name}`} 
                                className="check" 
                                checked={gateway.isEnabled}
                                onChange={() => handleToggleGateway(gateway.name, gateway.isEnabled)}
                              />
                              <label htmlFor={`gateway-${gateway.name}`} className="checktoggle"></label>
                            </div>
                          </div>
                        </div>
                        <div className="card-body pt-0">
                          <p>{gateway.description}</p>
                        </div>
                        <div className="card-footer">
                          <button 
                            type="button"
                            className="btn btn-outline-light d-flex justify-content-center align-items-center fw-semibold" 
                            data-bs-toggle="modal" 
                            data-bs-target="#connect_payment"
                          >
                            <i className="ti ti-tool me-2"></i>
                            {gateway.isConnected ? 'View Integration' : 'Connect Now'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateways;
