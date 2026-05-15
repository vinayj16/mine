import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  description?: string;
  status: 'active' | 'inactive';
  type: 'inclusive' | 'exclusive';
}

const formatRate = (rate: number) => `${rate.toFixed(2)}%`;

const TaxRates: React.FC = () => {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const fetchTaxRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/finance/tax-rates');
      if (response.data.success) {
        const payload = response.data.data?.rates ?? [];
        setTaxRates(payload.map((rate: any) => ({
          id: rate._id ?? rate.id,
          name: rate.name,
          rate: rate.rate,
          description: rate.description,
          status: rate.status ?? 'active',
          type: rate.type ?? 'exclusive'
        })));
      } else {
        setError(response.data.message || 'Failed to load tax rates');
      }
    } catch (err: any) {
      console.error('Error fetching tax rates:', err);
      setError(err.response?.data?.message ?? err.message ?? 'Failed to load tax rates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Financial Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <a href="javascript:void(0);">Settings</a>
              </li>
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
              onClick={fetchTaxRates}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-xxl-2 col-xl-3">
          <div className="pt-3 d-flex flex-column list-group mb-4">
            <a href="/payment-gateways" className="d-block rounded p-2">Payment Gateway</a>
            <a href="/tax-rates" className="d-block rounded active p-2">Tax Rates</a>
          </div>
        </div>
        <div className="col-xxl-10 col-xl-9">
          <div className="border-start ps-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
              <div className="mb-3">
                <h5 className="mb-1">Tax Rates</h5>
                <p>Configure institution-specific tax rates.</p>
              </div>
              <div className="mb-3">
                <button 
                  className="btn btn-outline-light bg-white btn-icon me-2" 
                  data-bs-toggle="modal" 
                  data-bs-target="#add_tax_rate"
                >
                  <i className="ti ti-plus"></i>
                </button>
                <button className="btn btn-light me-2" type="button">Cancel</button>
                <button className="btn btn-primary" type="button">Save</button>
              </div>
            </div>
            <div className="table-responsive">
              {error && (
                <div className="alert alert-danger mb-3">
                  <i className="ti ti-alert-circle me-2" />
                  {error}
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-danger ms-3"
                    onClick={fetchTaxRates}
                  >
                    Retry
                  </button>
                </div>
              )}
              <table className="table table-borderless mb-0">
                <thead>
                  <tr>
                    <th>Tax Name</th>
                    <th>Rate</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 text-muted">Loading tax rates...</p>
                      </td>
                    </tr>
                  ) : taxRates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        <i className="ti ti-percentage" style={{ fontSize: '48px', color: '#ccc' }}></i>
                        <p className="mt-3 text-muted">No tax rates configured yet</p>
                      </td>
                    </tr>
                  ) : (
                    taxRates.map(tax => (
                      <tr key={tax.id}>
                        <td>{tax.name}</td>
                        <td>{formatRate(tax.rate)}</td>
                        <td>{tax.type}</td>
                        <td>
                          <span className={`badge badge-soft-${tax.status === 'active' ? 'success' : 'danger'} d-inline-flex align-items-center`}>
                            <i className="ti ti-circle-filled fs-5 me-1"></i>
                            {tax.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{tax.description ?? '—'}</td>
                        <td className="text-end">
                          <div className="btn-group" role="group">
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-secondary"
                              data-bs-toggle="modal"
                              data-bs-target="#edit_tax_rate"
                            >
                              <i className="ti ti-edit"></i>
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-danger"
                              data-bs-toggle="modal"
                              data-bs-target="#delete-modal"
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxRates;
