import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageHeader from '../components/layout/PageHeader';
import '../styles/admin-sidebar.css';

interface AgentSidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const AgentSidebarContext = createContext<AgentSidebarContextType | undefined>(undefined);

export const useAgentSidebar = () => {
  const context = useContext(AgentSidebarContext);
  if (!context) {
    throw new Error('useAgentSidebar must be used within AgentLayout');
  }
  return context;
};

const AgentLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [applicationsOpen, setApplicationsOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('mini-sidebar', sidebarCollapsed);
    document.body.classList.toggle('mobile-menu-open', isMobileOpen);
  }, [sidebarCollapsed, isMobileOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/agent/applications')) {
      setApplicationsOpen(true);
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  const mainNavItems = [
    { path: '/agent', label: 'Dashboard', icon: 'ti-home' },
    { path: '/agent/institutions', label: 'Institutions', icon: 'ti-building' },
    { path: '/agent/institutions/add', label: 'Add Institution', icon: 'ti-plus' },
    { path: '/agent/commissions', label: 'Commissions', icon: 'ti-credit-card' },
    { path: '/agent/performance', label: 'Performance', icon: 'ti-chart-bar' },
  ];

  const accountItems = [
    { path: '/agent/profile', label: 'Profile', icon: 'ti-user' },
    { path: '/agent/settings', label: 'Settings', icon: 'ti-settings' },
  ];

  const applicationItems = [
    { path: '/agent/applications/chat', label: 'Chat', icon: 'ti-message' },
    { path: '/agent/applications/call', label: 'Call', icon: 'ti-phone' },
    { path: '/agent/applications/calendar', label: 'Calendar', icon: 'ti-calendar' },
    { path: '/agent/applications/notes', label: 'Notes', icon: 'ti-note' },
    { path: '/agent/applications/email', label: 'Email', icon: 'ti-mail' },
    { path: '/agent/applications/file-manager', label: 'File Manager', icon: 'ti-folder' },
    { path: '/agent/applications/todo', label: 'Todo', icon: 'ti-checklist' },
  ];

  const sidebarContextValue: AgentSidebarContextType = {
    isCollapsed: sidebarCollapsed,
    toggleSidebar
  };

  const isActivePath = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <AgentSidebarContext.Provider value={sidebarContextValue}>
      <div className="main-wrapper">
        <Header toggleSidebar={toggleSidebar} />
        
        <div className="main-container">
          <aside className={`sidebar agent-sidebar ${sidebarCollapsed ? 'mini-sidebar' : ''} ${isMobileOpen ? 'mobile-sidebar open' : ''}`}>
            <div className="sidebar-inner">
              <div className="sidebar-header">
                <div className="d-flex align-items-center">
                  <div className="avatar avatar-md bg-primary rounded-circle d-flex align-items-center justify-content-center">
                    <i className="ti ti-users text-white"></i>
                  </div>
                  {!sidebarCollapsed && (
                    <div className="ms-3 user-info">
                      <h6 className="mb-0 fw-semibold">Agent Portal</h6>
                      <small className="text-muted">Management</small>
                    </div>
                  )}
                </div>
                <button 
                  className="btn btn-sm btn-link text-muted p-0 d-none d-lg-block"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  <i className={`ti ${sidebarCollapsed ? 'ti-chevron-right' : 'ti-chevron-left'}`} />
                </button>
              </div>
              
              <div id="sidebar-menu" className="sidebar-menu">
                <ul className="list-unstyled components mb-0">
                  {/* Main Navigation */}
                  {mainNavItems.map(item => (
                    <li key={item.path} className={isActivePath(item.path) ? 'active' : ''}>
                      <Link to={item.path} className="nav-link d-flex align-items-center" onClick={closeMobileSidebar}>
                        <i className={`ti ${item.icon}`}></i>
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  ))}
                  
                  {/* Applications Dropdown */}
                  <li className="submenu-main">
                    <button 
                      className={`nav-link d-flex align-items-center justify-content-between w-100 ${applicationsOpen ? 'active' : ''}`}
                      onClick={() => !sidebarCollapsed && setApplicationsOpen(!applicationsOpen)}
                    >
                      <span className="d-flex align-items-center">
                        <i className="ti ti-apps"></i>
                        {!sidebarCollapsed && <span>Applications</span>}
                      </span>
                      {!sidebarCollapsed && (
                        <i className={`ti ${applicationsOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`}></i>
                      )}
                    </button>
                    {!sidebarCollapsed && applicationsOpen && (
                      <ul className="list-unstyled submenu-items">
                        {applicationItems.map(item => (
                          <li key={item.path} className={isActivePath(item.path) ? 'active' : ''}>
                            <Link to={item.path} className="nav-link" onClick={closeMobileSidebar}>
                              <i className={`ti ${item.icon}`}></i>
                              <span>{item.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                  
                  {/* Divider */}
                  {!sidebarCollapsed && <li className="nav-divider"><hr className="my-2" /></li>}
                  
                  {/* Account Section */}
                  {accountItems.map(item => (
                    <li key={item.path} className={isActivePath(item.path) ? 'active' : ''}>
                      <Link to={item.path} className="nav-link d-flex align-items-center" onClick={closeMobileSidebar}>
                        <i className={`ti ${item.icon}`}></i>
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {isMobileOpen && (
            <div className="sidebar-overlay" onClick={closeMobileSidebar} />
          )}

          <main className="page-wrapper">
            <div className="content container-fluid">
              <PageHeader showBreadcrumbs={true} />
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AgentSidebarContext.Provider>
  );
};

export default AgentLayout;
