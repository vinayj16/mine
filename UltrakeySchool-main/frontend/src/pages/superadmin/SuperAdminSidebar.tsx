import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import '../../styles/sidebar.css';

interface SubMenuItem {
  to: string;
  label: string;
}

interface MenuItem {
  to?: string;
  label: string;
  icon: string;
  subItems?: SubMenuItem[];
}

interface MenuSection {
  section: string;
  items: MenuItem[];
}

interface SuperAdminSidebarProps {
  isCollapsed: boolean;
  setCollapsed: (isCollapsed: boolean) => void;
}

const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ isCollapsed, setCollapsed }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTabletOrSmaller, setIsTabletOrSmaller] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  });
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkBreakpoints = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobile(mobile);
      setIsTabletOrSmaller(width < 1024);
      if (mobile) {
        setCollapsed(true);
      }
    };

    checkBreakpoints();
    window.addEventListener('resize', checkBreakpoints);
    return () => window.removeEventListener('resize', checkBreakpoints);
  }, [setCollapsed]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (!isCollapsed && window.innerWidth < 1024) {
          setCollapsed(true);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCollapsed, setCollapsed]);

  const toggleSidebar = () => {
    setCollapsed(!isCollapsed);
    setOpenMenu(null);
  };

  const handleMenuClick = (label: string) => {
    if (!isCollapsed) {
      setOpenMenu(openMenu === label ? null : label);
    }
  };

  const menuItems: MenuSection[] = [
    {
      section: 'MAIN',
      items: [
        { to: '/super-admin/dashboard', label: 'Dashboard', icon: 'ti ti-layout-dashboard' },
        { to: '/super-admin/analytics', label: 'Platform Analytics', icon: 'ti ti-chart-line' },
      ],
    },
    {
      section: 'INSTITUTION MANAGEMENT',
      items: [
        { to: '/super-admin/pending-requests', label: 'Institution Requests', icon: 'ti ti-user-plus' },
        {
          label: 'Institutions',
          icon: 'ti ti-building-bank',
          subItems: [
            { to: '/super-admin/institutions/schools', label: 'Schools' },
            { to: '/super-admin/institutions/inter-colleges', label: 'Inter Colleges' },
            { to: '/super-admin/institutions/degree-colleges', label: 'Degree Colleges' },
            { to: '/super-admin/institutions/engineering-colleges', label: 'Engineering Colleges' },
          ],
        },
      ],
    },
    {
      section: 'SUBSCRIPTIONS & BILLING',
      items: [
        { to: '/super-admin/memberships', label: 'Subscription Plans', icon: 'ti ti-crown' },
        { to: '/super-admin/transactions', label: 'Transactions', icon: 'ti ti-report-money' },
        { to: '/super-admin/revenue', label: 'Revenue Analytics', icon: 'ti ti-chart-area-line' },
        { to: '/super-admin/alerts', label: 'Expiry & Alerts', icon: 'ti ti-alert-triangle' },
      ],
    },
    {
        section: 'ANALYTICS & REPORTS',
        items: [
            { to: '/super-admin/analytics-reports', label: 'Analytics & Reports', icon: 'ti ti-file-analytics' },
        ]
    },
    {
        section: 'MODULE & ACCESS CONTROL',
        items: [
            { to: '/super-admin/modules', label: 'Modules Control', icon: 'ti ti-puzzle' },
        ]
    },
    {
        section: 'USER & SUPPORT',
        items: [
            { to: '/super-admin/platform-users', label: 'Platform Users', icon: 'ti ti-users' },
            { to: '/super-admin/user-setup', label: 'Create Login Credentials', icon: 'ti ti-user-cog' },
            { to: '/super-admin/tickets', label: 'Support / Tickets', icon: 'ti ti-ticket' },
        ]
    },
    {
        section: 'SYSTEM',
        items: [
            { to: '/super-admin/audit-logs', label: 'Audit Logs', icon: 'ti ti-shield-check' },
            { to: '/super-admin/settings', label: 'Platform Settings', icon: 'ti ti-settings' },
            { to: '/super-admin/maintenance', label: 'Maintenance Mode', icon: 'ti ti-tool' },
        ]
    },
    {
        section: 'Applications',
        items: [
            { to: '/super-admin/apps/calendar', label: 'Calendar', icon: 'ti ti-calendar' },
            { to: '/super-admin/apps/call', label: 'Call', icon: 'ti ti-phone' },
            { to: '/super-admin/apps/chat', label: 'Chat', icon: 'ti ti-messages' },
            { to: '/super-admin/apps/file-manager', label: 'File Manager', icon: 'ti ti-folder' },
            { to: '/super-admin/apps/notes', label: 'Notes', icon: 'ti ti-notebook' },
            { to: '/super-admin/apps/todo', label: 'To Do', icon: 'ti ti-list-check' },
        ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {(!isCollapsed && isTabletOrSmaller) && (
        <div
          className={`sidebar-overlay ${isMobile ? 'mobile' : 'desktop'}`}
          onClick={toggleSidebar}
        />
      )}
      
      <div ref={sidebarRef} className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`} id="sidebar" style={{
        width: isCollapsed ? '70px' : '280px',
        transition: 'width 0.3s ease'
      }}>
        <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
          <i className={`ti ${isCollapsed ? 'ti-chevron-right' : 'ti-chevron-left'}`}></i>
        </button>
        
        <div className="sidebar-inner">
          <div id="sidebar-menu" className="sidebar-menu">
            <div className="sidebar-header">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg rounded me-3 bg-primary-transparent">
                  <i className="ti ti-crown" style={{ color: 'white', fontSize: '24px' }}></i>
                </div>
                {!isCollapsed && (
                  <div className="user-info">
                    <h6 className="user-name mb-0">Super Admin</h6>
                    <small className="user-role text-muted">System Admin</small>
                  </div>
                )}
              </div>
            </div>

            {!isCollapsed && (
                <div className="action-buttons my-4 px-3">
                    <Link to="/super-admin/institutions/schools" className="btn btn-primary w-100 d-flex align-items-center justify-content-center">
                        <i className="ti ti-list me-2"></i>Manage Institutions
                    </Link>
                </div>
            )}

            {menuItems.map(section => (
              <div key={section.section} className="sidebar-menu-section">
                {!isCollapsed && <div className="menu-section-title">{section.section}</div>}
                
                <div className="menu-items">
                  {section.items.map((item) => {
                    const isSubMenuOpen = openMenu === item.label;

                    if (item.subItems) {
                      return (
                        <div key={item.label} className="sidebar-menu-item">
                          <div
                            className={`menu-link has-submenu ${isSubMenuOpen ? 'active' : ''}`}
                            onClick={() => handleMenuClick(item.label)}
                            style={{ cursor: 'pointer' }}
                          >
                            <i className={`${item.icon} menu-icon`}></i>
                            {!isCollapsed && <span className="menu-label">{item.label}</span>}
                            {!isCollapsed && (
                              <i className={`ti ti-chevron-right submenu-arrow ${isSubMenuOpen ? 'open' : ''}`}></i>
                            )}
                          </div>
                          {!isCollapsed && (
                            <div className={`submenu ${isSubMenuOpen ? 'open' : ''}`}>
                              {item.subItems.map(subItem => (
                                <NavLink key={subItem.label} to={subItem.to} className={({ isActive }) => `submenu-link ${isActive ? 'active' : ''}`}>
                                  {subItem.label}
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={item.label} className="sidebar-menu-item">
                        <NavLink to={item.to || '#'} className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                          <i className={`${item.icon} menu-icon`}></i>
                          {!isCollapsed && <span className="menu-label">{item.label}</span>}
                        </NavLink>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SuperAdminSidebar;
