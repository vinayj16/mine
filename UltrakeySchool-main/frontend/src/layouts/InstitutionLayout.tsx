import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getRoleBasedDashboard } from '../utils/permissions';
import InstitutionAdminSidebar from '../components/layout/InstitutionAdminSidebar';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import Header from '../components/layout/Header';
import PageHeader from '../components/layout/PageHeader';

const InstitutionLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const sidebarWidth = isMobileView ? 0 : (isCollapsed ? 80 : 280);

  useEffect(() => {
    const onResize = () => setIsMobileView(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const store = useAuthStore();
  const user = store.user;
  const isAuthenticated = store.isAuthenticated;
  const isLoading = store.isLoading;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const isMockUser = token && token.startsWith('mock-jwt-token-');
    const storedUser = localStorage.getItem('user');
    
    // Restore mock user from localStorage if not in store
    if (isMockUser && !user && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        useAuthStore.setState({
          user: parsedUser,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } catch (e) {
        // Failed to restore mock user
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Only redirect after loading is complete
      if (!isAuthenticated || !user) {
        navigate('/login', { state: { from: location }, replace: true });
      } else if (user.role !== 'institution_admin' && user.role !== 'institution_owner' && user.role !== 'institutionowner' && user.role !== 'admin' && user.role !== 'ADMIN') {
        // Allow institution_owner to access - but not redirect to unauthorized
        // Just redirect to their dashboard instead
        if (user.role === 'hostel_warden' || user.role === 'HOSTEL_WARDEN' || user.role === 'hostel' || user.role === 'HOSTEL') {
          // Hostel warden should go to hostel dashboard
          navigate('/dashboard/hostel', { replace: true });
        } else if (user.role === 'transport_manager' || user.role === 'TRANSPORT_MANAGER' || user.role === 'transportmanager') {
          // Transport manager should stay on transport pages
          // Allow access to continue
        } else {
          navigate(getRoleBasedDashboard(user.role), { replace: true });
        }
      }
    }
  }, [isLoading, isAuthenticated, user, navigate, location]);

  if (isLoading) {
    return <LoadingSpinner message="Verifying access..." fullPage />;
  }

  if (!isAuthenticated || !user) {
    return <LoadingSpinner message="Verifying access..." fullPage />;
  }

  // Allow hostel warden, admin, transport manager, and other staff roles to access institution settings
  const allowedRoles = [
    'institution_admin', 'principal',   'institutionowner', 'admin', 'ADMIN',
    'hostel_warden', 'HOSTEL_WARDEN', 'hostel', 'HOSTEL',
    'transport_manager', 'TRANSPORT_MANAGER', 'transportmanager',
    'teacher', 'TEACHER', 'accountant', 'ACCOUNTANT'
  ];
  if (!allowedRoles.includes(user.role)) {
    return <LoadingSpinner message="Verifying access..." fullPage />;
  }

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'IA';

  const handleLogout = async () => {
    await store.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="main-wrapper">
      <InstitutionAdminSidebar
        isCollapsed={isCollapsed}
        setCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div
        className="page-wrapper"
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
          width: `calc(100% - ${sidebarWidth}px)`,
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
        }}
      >
        {/* Header Bar - Using Common Header Component */}
        <Header toggleSidebar={() => {
          if (window.innerWidth < 1024) {
            setIsMobileOpen(prev => !prev);
          } else {
            setIsCollapsed(prev => !prev);
          }
        }} />

        <div className="content" style={{ padding: '1.5rem' }}>
          <Outlet />
        </div>
      </div>
      {isMobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsMobileOpen(false);
            }
          }}
          aria-label="Close sidebar overlay"
        />
      )}
    </div>
  );
};

export default InstitutionLayout;

