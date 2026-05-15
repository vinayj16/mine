import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { SIDEBAR_MENUS } from '../config/sidebar-menus';
import PageHeader from '../components/layout/PageHeader';

const AdminLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['MAIN']));
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userRole = user?.role?.toLowerCase() || 'admin';
  const adminMenu = SIDEBAR_MENUS[userRole] || SIDEBAR_MENUS.ADMIN;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionTitle)) {
        newSet.delete(sectionTitle);
      } else {
        newSet.add(sectionTitle);
      }
      return newSet;
    });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  const sidebarWidth = isSidebarCollapsed ? 80 : 280;

  const renderMenuItem = (item: { label: string; path: string; icon: string; badge?: string }, isCollapsed: boolean) => {
    
    return (
      <NavLink
        key={item.path}
        to={item.path}
        style={({ isActive }) => ({
          display: 'flex',
          alignItems: 'center',
          padding: isCollapsed ? '0.65rem' : '0.55rem 0.75rem',
          margin: '0.15rem 0',
          borderRadius: '0.5rem',
          color: isActive ? '#6366f1' : '#374151',
          textDecoration: 'none',
          fontSize: '0.825rem',
          backgroundColor: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
          transition: 'all 0.15s',
          position: 'relative',
          fontWeight: isActive ? 600 : 400,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        })}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (!el.style.backgroundColor.includes('rgba')) {
            el.style.backgroundColor = '#f1f5f9';
            el.style.color = '#1e293b';
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (!el.style.backgroundColor.includes('rgba')) {
            el.style.backgroundColor = 'transparent';
            el.style.color = '#374151';
          }
        }}
        onClick={closeMobileSidebar}
        title={isCollapsed ? item.label : ''}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 3,
                height: '70%',
                backgroundColor: '#6366f1',
                borderRadius: '0 2px 2px 0',
              }} />
            )}
            <i className={item.icon} style={{
              fontSize: isCollapsed ? '1.2rem' : '1rem',
              width: isCollapsed ? 'auto' : '1.25rem',
              flexShrink: 0,
              color: isActive ? '#6366f1' : '#6b7280',
            }}></i>
            {!isCollapsed && (
              <span style={{ marginLeft: '0.6rem' }}>{item.label}</span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      {/* Desktop Sidebar */}
      <aside
        className={`sidebar admin-sidebar`}
        style={{
          width: sidebarWidth,
          background: 'white',
          borderRight: '1px solid #e2e8f0',
          height: '100vh',
          position: 'sticky',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '1px 0 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Sidebar Header */}
        <div style={{
          padding: '1.25rem 1rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <i className="ti ti-school" style={{ fontSize: '1.25rem', color: 'white' }} />
            </div>
            {!isSidebarCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <h6 style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  Admin Panel
                </h6>
                <small style={{
                  color: '#94a3b8',
                  fontSize: '0.7rem',
                }}>
                  School Management
                </small>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '0.375rem',
              padding: '0.5rem',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginLeft: 'auto',
            }}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <i className={`ti ${isSidebarCollapsed ? 'ti-chevron-right' : 'ti-chevron-left'}`} style={{ fontSize: '1rem' }} />
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem 0.5rem',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
        }}>
          {adminMenu.map((section) => (
            <div key={section.title} style={{ marginBottom: '1rem' }}>
              {/* Section Title */}
              {!isSidebarCollapsed && (
                <div
                  onClick={() => toggleSection(section.title)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'color 0.2s',
                  }}
                >
                  <span>{section.title}</span>
                  <i className={`ti ${expandedSections.has(section.title) ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: '0.75rem' }} />
                </div>
              )}
              {/* Menu Items */}
              <div style={{ display: expandedSections.has(section.title) || isSidebarCollapsed ? 'block' : 'none' }}>
                {section.items.map((item) => renderMenuItem(item, isSidebarCollapsed))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{
          padding: isSidebarCollapsed ? '0.75rem 0.5rem' : '0.75rem 1rem',
          borderTop: '1px solid #e2e8f0',
          flexShrink: 0,
        }}>
          {!isSidebarCollapsed && (
            <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Version 1.0.0</small>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={closeMobileSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <aside
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: 280,
            background: 'white',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '4px 0 12px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.2s ease-out',
          }}
        >
          {/* Mobile Header */}
          <div style={{
            padding: '1.25rem 1rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <i className="ti ti-school" style={{ fontSize: '1.25rem', color: 'white' }} />
              </div>
              <div>
                <h6 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                  Admin Panel
                </h6>
                <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                  School Management
                </small>
              </div>
            </div>
            <button
              onClick={closeMobileSidebar}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.5rem',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <i className="ti ti-x" style={{ fontSize: '1.25rem' }} />
            </button>
          </div>

          {/* Mobile Menu */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.5rem' }}>
            {adminMenu.map((section) => (
              <div key={section.title} style={{ marginBottom: '1rem' }}>
                <div
                  onClick={() => toggleSection(section.title)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{section.title}</span>
                  <i className={`ti ${expandedSections.has(section.title) ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: '0.75rem' }} />
                </div>
                <div style={{ display: expandedSections.has(section.title) ? 'block' : 'none' }}>
                  {section.items.map((item) => renderMenuItem(item, false))}
                </div>
              </div>
            ))}
          </nav>
        </aside>
      )}

       {/* Main Content */}
       <div
         style={{
           flex: 1,
           display: 'flex',
           flexDirection: 'column',
           minWidth: 0,
           height: '100vh',
           overflow: 'hidden',
         }}
       >
        {/* Header */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              left: sidebarWidth,
              right: 0,
              zIndex: 100,
              backgroundColor: 'white',
              borderBottom: '1px solid #e2e8f0',
              padding: '0 1rem',
              transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div className="d-flex justify-content-between align-items-center" style={{ height: '64px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <button
                 onClick={toggleMobileSidebar}
                 style={{
                   background: '#f8fafc',
                   border: '1px solid #e2e8f0',
                   borderRadius: '0.375rem',
                   padding: '0.5rem 0.75rem',
                   cursor: 'pointer',
                   color: '#64748b',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                 }}
                 className="d-lg-none"
                 title="Toggle Menu"
               >
                 <i className="ti ti-menu-2" style={{ fontSize: '1.25rem' }} />
               </button>
               <PageHeader showBreadcrumbs={true} />
              </div>

             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
               </select>

               <button
                 style={{
                   background: 'transparent',
                   border: 'none',
                   padding: '0.5rem',
                   cursor: 'pointer',
                   color: '#64748b',
                   position: 'relative',
                 }}
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

               <div style={{ position: 'relative' }}>
                 <button
                   onClick={() => {
                     const dropdown = document.getElementById('admin-profile-dropdown');
                     if (dropdown) {
                       dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                     }
                   }}
                   style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.5rem',
                     background: 'transparent',
                     border: 'none',
                     padding: '0.25rem',
                     cursor: 'pointer',
                     borderRadius: '0.375rem',
                   }}
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
                     {initials}
                   </div>
                   <i className="ti ti-chevron-down" style={{ fontSize: '0.875rem', color: '#64748b' }} />
                 </button>
                 <div
                   id="admin-profile-dropdown"
                   style={{
                     position: 'absolute',
                     top: '100%',
                     right: 0,
                     marginTop: '0.5rem',
                     background: 'white',
                     borderRadius: '0.5rem',
                     boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                     minWidth: '180px',
                     display: 'none',
                     zIndex: 1000,
                     border: '1px solid #e2e8f0',
                   }}
                 >
                   <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                     <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                       {user?.name || 'Admin User'}
                     </div>
                     <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                       {user?.email || 'admin@school.com'}
                     </div>
                   </div>
                   <button
                     onClick={() => navigate('/dashboard/admin/profile-settings')}
                     style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: '0.5rem',
                       width: '100%',
                       padding: '0.75rem 1rem',
                       background: 'transparent',
                       border: 'none',
                       cursor: 'pointer',
                       color: '#374151',
                       fontSize: '0.875rem',
                       textAlign: 'left',
                     }}
                   >
                     <i className="ti ti-user" /> Profile Settings
                   </button>
                   <button
                     onClick={handleLogout}
                     style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: '0.5rem',
                       width: '100%',
                       padding: '0.75rem 1rem',
                       background: 'transparent',
                       border: 'none',
                       cursor: 'pointer',
                       color: '#dc2626',
                       fontSize: '0.875rem',
                       textAlign: 'left',
                     }}
                   >
                     <i className="ti ti-logout" /> Logout
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>

        {/* Page Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '1.5rem',
            backgroundColor: '#f8fafc',
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;