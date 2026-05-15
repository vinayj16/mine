import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import PageHeader from '../components/layout/PageHeader';
import '../styles/sidebar.css';

const TransportLayout: React.FC = () => {
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
        console.log('[TransportLayout] Failed to restore mock user');
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        navigate('/login', { state: { from: location }, replace: true });
      } else if (user.role !== 'transport_manager' && user.role !== 'TRANSPORT_MANAGER' && user.role !== 'transportmanager' && user.role !== 'principal') {
        navigate('/unauthorized', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, navigate, location]);

  if (isLoading) {
    return <LoadingSpinner message="Loading Transport Dashboard..." fullPage />;
  }

  if (!isAuthenticated || !user) {
    return <LoadingSpinner message="Loading Transport Dashboard..." fullPage />;
  }

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'TM';

  const handleLogout = async () => {
    await store.logout();
    navigate('/login', { replace: true });
  };

  const sidebarItems = [
    {
      title: 'TRANSPORT',
      items: [
        { label: 'Dashboard', path: '/transport', icon: 'ti ti-layout-dashboard', end: true },
        { label: 'Routes', path: '/transport/routes', icon: 'ti ti-route' },
        { label: 'Vehicles', path: '/transport/vehicles', icon: 'ti ti-bus' },
        { label: 'Drivers', path: '/transport/drivers', icon: 'ti ti-steering-wheel' },
        { label: 'Pickup Points', path: '/transport/pickup-points', icon: 'ti ti-map-pin' },
        { label: 'Assign Vehicle', path: '/transport/assign', icon: 'ti ti-transfer' },
        { label: 'Reports', path: '/transport/reports', icon: 'ti ti-report' },
      ]
    },
    {
      title: 'APPLICATIONS',
      items: [
        { label: 'Chat', path: '/dashboard/applications/chat', icon: 'ti ti-brand-hipchat' },
        { label: 'Calendar', path: '/dashboard/applications/calendar', icon: 'ti ti-calendar' },
        { label: 'Notes', path: '/dashboard/applications/notes', icon: 'ti ti-note' },
        { label: 'Email', path: '/dashboard/applications/email', icon: 'ti ti-mail' },
      ]
    },
    {
      title: 'MY ACCOUNT',
      items: [
        { label: 'Profile', path: '/settings/profile', icon: 'ti ti-user' },
        { label: 'Settings', path: '/settings', icon: 'ti ti-settings' },
      ]
    }
  ];

  return (
    <div className="main-wrapper">
      {/* Sidebar */}
      <div
        className={`sidebar role-sidebar transport ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: isCollapsed ? '80px' : '280px',
          backgroundColor: '#ffffff',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 1000,
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: isCollapsed ? '1rem' : '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          flexShrink: 0,
        }}>
          {!isCollapsed && (
            <div className="d-flex align-items-center">
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                backgroundColor: '#6366f1', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'white', marginRight: 10, flexShrink: 0,
              }}>
                <i className="ti ti-bus" style={{ fontSize: '1.1rem' }}></i>
              </div>
              <div>
                <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.2 }}>
                  Transport Manager
                </div>
                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Management Portal</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'transparent', border: 'none', color: '#64748b',
              fontSize: '1.1rem', cursor: 'pointer', padding: '0.4rem',
              borderRadius: '0.375rem', transition: 'all 0.2s',
              width: isCollapsed ? '100%' : 'auto',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#1e293b'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <i className={`ti ${isCollapsed ? 'ti-menu-2' : 'ti-arrow-left'}`}></i>
          </button>
        </div>

        {/* Menu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isCollapsed ? '0.75rem 0.5rem' : '0.75rem' }}>
          {sidebarItems.map((section, sectionIndex) => (
            <div key={sectionIndex} style={{ marginBottom: '0.5rem' }}>
              {!isCollapsed && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.35rem 0.75rem', color: '#94a3b8', fontSize: '0.7rem',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  cursor: 'pointer', borderRadius: '0.375rem', marginBottom: '0.25rem',
                }}>
                  <span>{section.title}</span>
                </div>
              )}

              {section.items.map((item, itemIndex) => {
                const isActive = item.end 
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
                
                return (
                  <a
                    key={itemIndex}
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.path);
                      if (window.innerWidth < 1024) {
                        setIsMobileOpen(false);
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center',
                      padding: isCollapsed ? '0.65rem' : '0.55rem 0.75rem',
                      margin: '0.15rem 0', borderRadius: '0.5rem',
                      color: isActive ? '#6366f1' : '#475569',
                      textDecoration: 'none', fontSize: '0.825rem',
                      backgroundColor: isActive ? '#eef2ff' : 'transparent',
                      transition: 'all 0.15s', position: 'relative',
                      fontWeight: isActive ? 600 : 400,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                        e.currentTarget.style.color = '#1e293b';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#475569';
                      }
                    }}
                    title={isCollapsed ? item.label : ''}
                  >
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: 0, top: '50%',
                        transform: 'translateY(-50%)', width: 3, height: '70%',
                        backgroundColor: '#6366f1', borderRadius: '0 2px 2px 0',
                      }} />
                    )}
                    <i className={item.icon} style={{
                      fontSize: isCollapsed ? '1.2rem' : '1rem',
                      width: isCollapsed ? 'auto' : '1.25rem',
                      flexShrink: 0,
                    }}></i>
                    {!isCollapsed && (
                      <span style={{ marginLeft: '0.6rem' }}>{item.label}</span>
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: isCollapsed ? '0.75rem 0.5rem' : '0.75rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
        }}>
          {!isCollapsed && (
            <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>Transport Management Portal</small>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        />
      )}

      {/* Mobile Menu Toggle */}
      <button
        className="d-lg-none"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 1100,
          backgroundColor: '#ffffff', color: '#1e293b', border: '1px solid #e2e8f0',
          borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <i className="ti ti-menu-2"></i>
      </button>

      {/* Main Content */}
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
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #6366f1 100%)',
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
                      {user?.name || 'Transport Manager'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      {user?.email || 'transport@institution.com'}
                    </div>
                  </li>
                  <li>
                    <button
                      className="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                      onClick={() => navigate('/settings/profile')}
                      style={{ fontSize: '0.875rem', color: '#374151' }}
                    >
                      <i className="ti ti-user" /> My Profile
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                      onClick={() => navigate('/settings')}
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

export default TransportLayout;
