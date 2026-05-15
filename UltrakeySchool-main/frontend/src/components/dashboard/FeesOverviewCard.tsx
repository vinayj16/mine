import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import '../common/LoadingSpinner.css';

interface FeesOverview {
  totalCollected: number;
  totalPending: number;
  totalExpected: number;
  collectionPercentage: number;
  currency: string;
}

const FeesOverviewCard = () => {
  const [overview, setOverview] = useState<FeesOverview>({
    totalCollected: 84500,
    totalPending: 12340,
    totalExpected: 96840,
    collectionPercentage: 87.2,
    currency: 'USD'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('this-month');

  useEffect(() => {
    fetchFeesOverview();
  }, [period]);

  const fetchFeesOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/fees/overview', {
        params: { period }
      });

      if (response.data.success && response.data.data) {
        setOverview(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching fees overview:', err);
      setError(err.response?.data?.message || 'Failed to fetch fees overview');
      
      // Fallback to hardcoded data if API fails
      setOverview({
        totalCollected: 84500,
        totalPending: 12340,
        totalExpected: 96840,
        collectionPercentage: 87.2,
        currency: 'USD'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: overview.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'this-month':
        return 'This Month';
      case 'this-term':
        return 'This Term';
      case 'this-year':
        return 'This Year';
      default:
        return 'This Month';
    }
  };

  return (
    <div className="card flex-fill">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h4 className="card-title mb-0">Fees Overview</h4>
        <div className="dropdown">
          <button 
            className="bg-white dropdown-toggle" 
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="ti ti-calendar-due me-1" />
            {getPeriodLabel()}
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <a 
                className="dropdown-item" 
                href="#"
                onClick={(e) => { e.preventDefault(); setPeriod('this-month'); }}
              >
                This Month
              </a>
            </li>
            <li>
              <a 
                className="dropdown-item" 
                href="#"
                onClick={(e) => { e.preventDefault(); setPeriod('this-term'); }}
              >
                This Term
              </a>
            </li>
            <li>
              <a 
                className="dropdown-item" 
                href="#"
                onClick={(e) => { e.preventDefault(); setPeriod('this-year'); }}
              >
                This Year
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger mb-0" role="alert">
            {error}
          </div>
        ) : (
          <>
            <div className="row g-3 mb-4">
              <div className="col-6">
                <div className="p-3 rounded bg-primary-transparent">
                  <p className="mb-1 text-muted">Total Collected</p>
                  <h4 className="mb-0">{formatCurrency(overview.totalCollected)}</h4>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 rounded bg-warning-transparent">
                  <p className="mb-1 text-muted">Pending</p>
                  <h4 className="mb-0">{formatCurrency(overview.totalPending)}</h4>
                </div>
              </div>
            </div>
            <p className="text-muted mb-1">Overall Collection</p>
            <div className="progress mb-2" style={{ height: '8px' }}>
              <div 
                className="progress-bar bg-primary" 
                role="progressbar" 
                style={{ width: `${overview.collectionPercentage}%` }}
                aria-valuenow={overview.collectionPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <small className="text-muted">
              {overview.collectionPercentage.toFixed(1)}% of total fees collected for {getPeriodLabel().toLowerCase()}
            </small>
          </>
        )}
      </div>
    </div>
  );
};

export default FeesOverviewCard;