import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import InstitutionAdminSidebar from '../components/layout/InstitutionAdminSidebar';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import PageHeader from '../components/layout/PageHeader';

const InstitutionLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const sidebarWidth = isCollapsed ? 80 : 280;
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
        console.log('[InstitutionLayout] Restored mock user from localStorage');
      } catch (e) {
        console.log('[InstitutionLayout] Failed to restore mock user');
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
          navigate('/unauthorized', { replace: true });
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
      <button
        className="d-lg-none"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 1100,
          backgroundColor: '#6366f1', color: 'white', border: 'none',
          borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
        }}
      >
        <i className="ti ti-menu-2"></i>
      </button>
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
        {/* Header Bar */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backgroundColor: 'white',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div className="d-flex justify-content-between align-items-center" style={{ height: '64px' }}>
            <PageHeader showBreadcrumbs={true} />
            
            <div className="d-flex align-items-center gap-3">
              <select
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  color: '#64748b',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                <option>2025 / 2026</option>
                <option>2024 / 2025</option>
              </select>

              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  position: 'relative',
                  borderRadius: '0.375rem',
                }}
                onClick={() => navigate('/notifications')}
              >
                <i className="ti ti-bell" style={{ fontSize: '1.25rem' }} />
                <span style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  backgroundColor: '#ef4444',
                  borderRadius: '50%',
                }} />
              </button>

              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  borderRadius: '0.375rem',
                }}
                onClick={() => navigate('/dashboard/applications/chat')}
              >
                <i className="ti ti-brand-hipchat" style={{ fontSize: '1.25rem' }} />
              </button>

              <div className="dropdown">
                <button
                  className="btn btn-link p-0"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '0.375rem',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}>
                    {userInitials}
                  </div>
                </button>
                <ul className="dropdown-menu dropdown-menu-end p-0 shadow-sm" style={{ borderRadius: '0.5rem', minWidth: '200px', border: '1px solid #e2e8f0' }}>
                  <li className="p-3 border-bottom">
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                      {user?.name || 'Institution Admin'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      {user?.email || 'admin@institution.com'}
                    </div>
                  </li>
                  <li>
                    <button
                      className="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                      onClick={() => navigate('/institution/settings/profile')}
                      style={{ fontSize: '0.875rem', color: '#374151' }}
                    >
                      <i className="ti ti-user" /> My Profile
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                      onClick={() => navigate('/institution/settings')}
                      style={{ fontSize: '0.875rem', color: '#374151' }}
                    >
                      <i className="ti ti-settings" /> Settings
                    </button>
                  </li>
                  <li className="border-top mt-2 pt-2">
                    <button
                      className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger"
                      onClick={handleLogout}
                      style={{ fontSize: '0.875rem' }}
                    >
                      <i className="ti ti-logout" /> Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="content" style={{ padding: '1.5rem' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default InstitutionLayout;
