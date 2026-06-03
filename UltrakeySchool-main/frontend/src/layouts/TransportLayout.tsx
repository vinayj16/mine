import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import Header from '../components/layout/Header';
import '../styles/sidebar.css';

const TransportLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const sidebarWidth = isCollapsed ? 80 : 280;

  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
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

  const sidebarItems = [
    {
      title: 'TRANSPORT',
      items: [
        { label: 'Dashboard', path: '/dashboard/transport', icon: 'ti ti-layout-dashboard', end: true },
        { label: 'Routes', path: '/dashboard/transport/routes', icon: 'ti ti-route' },
        { label: 'Vehicles', path: '/dashboard/transport/vehicles', icon: 'ti ti-bus' },
        { label: 'Drivers', path: '/dashboard/transport/drivers', icon: 'ti ti-steering-wheel' },
        { label: 'Pickup Points', path: '/dashboard/transport/pickup-points', icon: 'ti ti-map-pin' },
        { label: 'Assign Vehicle', path: '/dashboard/transport/assign', icon: 'ti ti-transfer' },
        { label: 'Reports', path: '/dashboard/transport/reports', icon: 'ti ti-report' },
        { label: 'Vehicle Maintenance', path: '/dashboard/transport/vehicle-maintenance', icon: 'ti ti-tool' },

      ]
    },
    {
      title: 'APPLICATIONS',
      items: [
        { label: 'Calendar', path: 'apps/calendar', icon: 'ti ti-calendar' },
        { label: 'Call', path: 'apps/call', icon: 'ti ti-phone' },
        { label: 'Chat', path: 'apps/chat', icon: 'ti ti-message' },
        { label: 'Email', path: 'apps/email', icon: 'ti ti-mail' },
        { label: 'File Manager', path: 'apps/file-manager', icon: 'ti ti-folder' },
        { label: 'Notes', path: 'apps/notes', icon: 'ti ti-notes' },
        { label: 'Todo', path: 'apps/todo', icon: 'ti ti-checklist' },
      ]
    },
    {
      title: 'MY ACCOUNT',
      items: [
        { label: 'Profile', path: 'settings/profile', icon: 'ti ti-user' },
        { label: 'Settings', path: 'settings', icon: 'ti ti-settings' },
      ]
    }
  ];

  return (
    <div className="main-wrapper">
      {/* Sidebar */}
      <div
        className={`app-sidebar sidebar role-sidebar transport sidebar-bg-default ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: isCollapsed ? '80px' : '280px',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 1000,
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: isMobileView
            ? isMobileOpen ? 'translateX(0)' : 'translateX(-100%)'
            : 'translateX(0)'
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
    </div>
  );
};

export default TransportLayout;
