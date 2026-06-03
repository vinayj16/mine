import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { getRoleBasedDashboard } from '../utils/permissions';

const RoleBasedDashboardRedirect: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError('User not authenticated');
      setReady(true);
      return;
    }
    const dashboardPath = getRoleBasedDashboard(user.role);
    if (dashboardPath && dashboardPath !== '/') {
      navigate(dashboardPath, { replace: true });
    } else {
      setError(`No dashboard configured for role: ${user.role}`);
    }
    setReady(true);
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <i className="ti ti-alert-triangle fs-1 text-danger mb-3"></i>
          <h5>Redirect Error</h5>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/login'}>Go to Login</button>
        </div>
      </div>
    );
  }

  return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Redirecting...</span></div></div>;
};

export default RoleBasedDashboardRedirect;
