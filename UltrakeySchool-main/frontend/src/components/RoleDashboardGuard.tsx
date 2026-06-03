import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { getRoleBasedDashboard } from '../utils/permissions';

/**
 * Keeps users on their role dashboard until logout.
 * Redirects if they manually navigate to another role's dashboard URL.
 */
const RoleDashboardGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user?.role) return;

    const role = (user.role || localStorage.getItem('userRole') || '').toLowerCase();
    const home = getRoleBasedDashboard(role);
    const path = location.pathname.toLowerCase();

    const dashboardPrefixes: Record<string, string[]> = {
      accountant: ['/dashboard/accountant', '/accounts'],
      student: ['/dashboard/student', '/student'],
      teacher: ['/dashboard/teacher'],
      hr_manager: ['/dashboard/hr', '/hrm'],
      hr: ['/dashboard/hr', '/hrm'],
      transport_manager: ['/dashboard/transport', '/transport'],
      hostel_warden: ['/dashboard/hostel', '/hostel'],
      librarian: ['/dashboard/library', '/library'],
      admin: ['/dashboard/admin'],
      principal: ['/dashboard/principal'],
      superadmin: ['/super-admin'],
    };

    const allowedPrefixes = dashboardPrefixes[role.replace(/-/g, '_')] || [home];

    const isOtherRoleDashboard = Object.entries(dashboardPrefixes).some(([r, prefixes]) => {
      if (r === role.replace(/-/g, '_')) return false;
      return prefixes.some((p) => path.startsWith(p));
    });

    if (isOtherRoleDashboard) {
      navigate(home, { replace: true });
    }
  }, [location.pathname, user?.role, isAuthenticated, navigate]);

  return <>{children}</>;
};

export default RoleDashboardGuard;
