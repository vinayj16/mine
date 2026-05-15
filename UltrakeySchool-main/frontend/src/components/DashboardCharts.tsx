import React, { useEffect, useState, useRef } from 'react';
import { isAuthenticated } from '../utils/auth';
import ChartLoader from '../utils/chartLoader';

interface DashboardChartsProps {
  className?: string;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const initializeCharts = async () => {
      try {
        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;
        
        setIsLoading(true);
        setError(null);

        // Check if user is authenticated
        if (!isAuthenticated()) {
          setError('Please log in to view dashboard charts');
          setIsLoading(false);
          return;
        }

        // Initialize charts based on user role
        await ChartLoader.loadDashboardCharts();

        // Check if request was aborted
        if (signal.aborted) {
          console.log('Charts initialization was aborted');
          return;
        }

        setIsLoading(false);

      } catch (err: any) {
        // Don't show error if request was aborted
        if (err.name !== 'AbortError') {
          console.error('Failed to initialize charts:', err);
          setError(err instanceof Error ? err.message : 'Failed to load charts');
        }
        setIsLoading(false);
      }
    };

    initializeCharts();

    // Cleanup function
    return () => {
      // Abort any ongoing chart initialization
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Reset state to prevent memory leaks
      setError(null);
      setIsLoading(false);
      
      console.log('DashboardCharts: Cleanup completed');
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`dashboard-charts-loading ${className || ''}`}>
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-muted mb-0">Loading dashboard charts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dashboard-charts-error ${className || ''}`}>
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '400px' }}>
          <i className="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
          <h5 className="text-danger mb-2">Error Loading Charts</h5>
          <p className="text-muted text-center mb-4">{error}</p>
          <button className="btn btn-outline-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-charts ${className || ''}`}>
      {/* Charts will be rendered by ChartLoader into specific containers */}
      <div className="row">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Performance Analytics</h5>
            </div>
            <div className="card-body">
              <div id="performance_chart" style={{ minHeight: '350px' }}>
                {/* Chart will be rendered here */}
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Student Statistics</h5>
            </div>
            <div className="card-body">
              <div id="student_statistics_chart" style={{ minHeight: '350px' }}>
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
              <h5 className="card-title mb-0">Revenue Analytics</h5>
            </div>
            <div className="card-body">
              <div id="revenue_chart" style={{ minHeight: '350px' }}>
                {/* Chart will be rendered here */}
              </div>
            </div>
          </div>
        </div>
        
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
      </div>

      <div className="row mt-4">
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
        
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Churn Rate</h5>
            </div>
            <div className="card-body">
              <div id="churn_rate_chart" style={{ minHeight: '350px' }}>
                {/* Chart will be rendered here */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;