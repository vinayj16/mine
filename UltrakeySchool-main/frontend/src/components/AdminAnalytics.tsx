import React, { useEffect, useState, useRef } from 'react';
import ChartLoader from '../utils/chartLoader';
import { isAuthenticated, isAdmin } from '../utils/auth';
import { apiService } from '../services/api';

interface AdminAnalyticsProps {
  className?: string;
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const initializeAdminAnalytics = async () => {
      try {
        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;
        
        setIsLoading(true);
        setError(null);

        // Check if user is authenticated and has admin role
        if (!isAuthenticated()) {
          setError('Please log in to view admin analytics');
          setIsLoading(false);
          return;
        }

        if (!isAdmin()) {
          setError('Access denied. Admin privileges required.');
          setIsLoading(false);
          return;
        }

        // Fetch admin-specific analytics data with abort signal
        const [growthData, planData, churnData, renewalData, revenueData] = await Promise.all([
          apiService.get('/analytics/institution-growth', { period: 'monthly' }),
          apiService.get('/analytics/plan-distribution'),
          apiService.get('/analytics/churn-rate'),
          apiService.get('/analytics/renewal-rate'),
          apiService.get('/analytics/revenue', { period: 'monthly' })
        ]);

        // Check if request was aborted
        if (signal.aborted) {
          console.log('Analytics request was aborted');
          return;
        }

        setAnalyticsData({
          growth: growthData.success ? growthData.data : null,
          plans: planData.success ? planData.data : null,
          churn: churnData.success ? churnData.data : null,
          renewal: renewalData.success ? renewalData.data : null,
          revenue: revenueData.success ? revenueData.data : null
        });

        // Initialize admin-specific charts
        await ChartLoader.loadAdminAnalytics();
        setIsLoading(false);

      } catch (err: any) {
        // Don't show error if request was aborted
        if (err.name !== 'AbortError') {
          console.error('Failed to initialize admin analytics:', err);
          setError(err instanceof Error ? err.message : 'Failed to load admin analytics');
        }
        setIsLoading(false);
      }
    };

    initializeAdminAnalytics();

    // Cleanup function
    return () => {
      // Abort any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Reset state to prevent memory leaks
      setAnalyticsData(null);
      setError(null);
      setIsLoading(false);
      
      console.log('AdminAnalytics: Cleanup completed');
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`admin-analytics-loading ${className || ''}`}>
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-muted mb-0">Loading admin analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`admin-analytics-error ${className || ''}`}>
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '400px' }}>
          <i className="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
          <h5 className="text-danger mb-2">Error Loading Analytics</h5>
          <p className="text-muted text-center mb-4">{error}</p>
          <button className="btn btn-outline-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-analytics ${className || ''}`}>
      {/* Admin Analytics Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Super Admin Analytics</h2>
            <div className="text-muted">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2">Total Institutions</h6>
                  <h4 className="mb-0">
                    {analyticsData?.growth ? analyticsData.growth.reduce((sum: number, item: any) => sum + (item.count || 0), 0) : '0'}
                  </h4>
                </div>
                <div className="avatar-sm bg-primary rounded-circle">
                  <i className="fas fa-school text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2">Active Plans</h6>
                  <h4 className="mb-0">
                    {analyticsData?.plans ? analyticsData.plans.length : '0'}
                  </h4>
                </div>
                <div className="avatar-sm bg-success rounded-circle">
                  <i className="fas fa-chart-pie text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2">Churn Rate</h6>
                  <h4 className="mb-0 text-danger">
                    {analyticsData?.churn ? `${analyticsData.churn.overallRate || 0}%` : '0%'}
                  </h4>
                </div>
                <div className="avatar-sm bg-danger rounded-circle">
                  <i className="fas fa-arrow-down text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2">Renewal Rate</h6>
                  <h4 className="mb-0 text-success">
                    {analyticsData?.renewal ? `${analyticsData.renewal.overallRate || 0}%` : '0%'}
                  </h4>
                </div>
                <div className="avatar-sm bg-warning rounded-circle">
                  <i className="fas fa-sync text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="row">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Institution Growth</h5>
            </div>
            <div className="card-body">
              <div id="institution_growth_chart" style={{ minHeight: '350px' }}>
                {/* Chart will be rendered here */}
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Plan Distribution</h5>
            </div>
            <div className="card-body">
              <div id="plan_distribution_chart" style={{ minHeight: '350px' }}>
                {/* Chart will be rendered here */}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Churn Rate Analysis</h5>
            </div>
            <div className="card-body">
              <div id="churn_rate_chart" style={{ minHeight: '350px' }}>
                {/* Chart will be rendered here */}
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Revenue Analytics</h5>
            </div>
            <div className="card-body">
              <div id="revenue_chart" style={{ minHeight: '350px' }}>
                {/* Chart will be rendered here */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics Data */}
      {analyticsData && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Detailed Analytics</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-4">
                    <h6>Plan Breakdown</h6>
                    {analyticsData.plans ? (
                      <ul className="list-unstyled">
                        {analyticsData.plans.map((plan: any, index: number) => (
                          <li key={index} className="mb-2">
                            <span className="badge bg-primary me-2">{plan.plan || 'Unknown'}</span>
                            <span className="text-muted">{plan.count || 0} institutions</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted">No plan data available</p>
                    )}
                  </div>
                  
                  <div className="col-lg-4">
                    <h6>Churn Details</h6>
                    {analyticsData.churn ? (
                      <div>
                        <p className="text-muted mb-1">Overall Rate: <strong>{analyticsData.churn.overallRate || 0}%</strong></p>
                        <p className="text-muted mb-0">Monthly Average: <strong>{analyticsData.churn.monthlyAverage || 0}%</strong></p>
                      </div>
                    ) : (
                      <p className="text-muted">No churn data available</p>
                    )}
                  </div>
                  
                  <div className="col-lg-4">
                    <h6>Renewal Insights</h6>
                    {analyticsData.renewal ? (
                      <div>
                        <p className="text-muted mb-1">Overall Rate: <strong>{analyticsData.renewal.overallRate || 0}%</strong></p>
                        <p className="text-muted mb-0">Trend: <strong>{analyticsData.renewal.trend || 'Stable'}</strong></p>
                      </div>
                    ) : (
                      <p className="text-muted">No renewal data available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;