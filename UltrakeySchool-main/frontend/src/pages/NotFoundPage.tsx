import React, { useEffect, useState } from 'react';

const NotFoundPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dashboardPath, setDashboardPath] = useState('/login');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const role = localStorage.getItem('userRole');
    if (userStr && role) {
      setIsAuthenticated(true);
      const roleMap: Record<string, string> = {
        superadmin: '/super-admin/dashboard',
        institution_admin: '/dashboard/main',
        admin: '/dashboard/admin',
        principal: '/dashboard/principal',
        teacher: '/dashboard/teacher',
        student: '/dashboard/student',
        parent: '/dashboard/parent',
      };
      setDashboardPath(roleMap[role.toLowerCase()] || '/dashboard');
    }
  }, []);

  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <div className="text-center p-5">
        <i className="ti ti-alert-triangle fs-48 text-warning mb-4 d-block"></i>
        <h1 className="display-1 fw-bold text-muted mb-2">404</h1>
        <h2 className="mb-3">Page Not Found</h2>
        <p className="text-muted mb-4">The page you are looking for does not exist or has been moved.</p>
        <a href={dashboardPath} className="btn btn-primary btn-lg">
          <i className="ti ti-dashboard me-2"></i>Go to Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFoundPage;