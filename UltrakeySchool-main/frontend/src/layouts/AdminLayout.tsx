import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { SIDEBAR_MENUS } from '../config/sidebar-menus';
import type { MenuItem, MenuSection } from '../config/sidebar-menus';
import Header from '../components/layout/Header';
import PageHeader from '../components/layout/PageHeader';

const AdminLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { user } = useAuth();
  const { isDarkMode } = useThemeStore();

  const userRole = user?.role?.toLowerCase() || 'admin';
  const adminMenu = SIDEBAR_MENUS[userRole] || SIDEBAR_MENUS.ADMIN;

  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileView(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const sectionTitles = adminMenu.map(s => s.title);
    setExpandedSections(prev => {
      const merged = new Set([...prev, ...sectionTitles]);
      return Array.from(merged);
    });
  }, [adminMenu]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const toggleSidebar = () => {
    if (isMobileView) setIsMobileOpen(prev => !prev);
    else setIsCollapsed(prev => !prev);
  };

  const closeMobile = () => setIsMobileOpen(false);

  const sidebarWidth = isMobileView ? 0 : (isCollapsed ? 80 : 280);
  const collapsedView = isCollapsed && !isMobileView;

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item, idx) => {
      const hasChildren = item.children && item.children.length > 0;
      const itemKey = item.label;
      const isExpanded = expandedSections.includes(itemKey);

      if (hasChildren) {
        return (
          <div key={idx}>
            <div
              onClick={() => !collapsedView && toggleSection(itemKey)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: collapsedView ? '0.65rem' : '0.55rem 1rem',
                margin: '0.1rem 0.5rem',
                borderRadius: '0.5rem',
                color: isDarkMode ? '#a1a1aa' : '#374151',
                cursor: collapsedView ? 'default' : 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.15s',
              }}
              title={collapsedView ? item.label : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <i className={item.icon} style={{
                  fontSize: collapsedView ? '1.2rem' : '1rem',
                  width: collapsedView ? 'auto' : '1.25rem',
                  flexShrink: 0, color: isDarkMode ? '#71717a' : '#6b7280',
                }}></i>
                {!collapsedView && <span>{item.label}</span>}
              </div>
              {!collapsedView && (
                <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'}`}
                  style={{ fontSize: '0.65rem', color: isDarkMode ? '#71717a' : '#94a3b8' }}></i>
              )}
            </div>
            {(isExpanded || collapsedView) && (
              <div>
                {item.children!.map((child, cIdx) => (
                  <NavLink
                    key={cIdx}
                    to={child.path}
                    onClick={() => isMobileView && closeMobile()}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center',
                      padding: collapsedView ? '0.6rem' : '0.45rem 1rem 0.45rem 2.5rem',
                      margin: '0.1rem 0.5rem',
                      borderRadius: '0.5rem',
                      color: isActive ? '#6366f1' : (isDarkMode ? '#a1a1aa' : '#374151'),
                      textDecoration: 'none', fontSize: '0.82rem',
                      fontWeight: isActive ? 600 : 400,
                      backgroundColor: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                      position: 'relative',
                      transition: 'all 0.15s',
                    })}
                    title={collapsedView ? child.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div style={{
                            position: 'absolute', left: 0, top: '50%',
                            transform: 'translateY(-50%)',
                            width: 3, height: '60%',
                            backgroundColor: '#6366f1',
                            borderRadius: '0 2px 2px 0',
                          }} />
                        )}
                        <i className={child.icon} style={{
                          fontSize: collapsedView ? '1.1rem' : '0.9rem',
                          width: collapsedView ? 'auto' : '1.1rem',
                          flexShrink: 0,
                          color: isActive ? '#6366f1' : (isDarkMode ? '#71717a' : '#6b7280'),
                        }}></i>
                        {!collapsedView && (
                          <span style={{ marginLeft: '0.5rem' }}>{child.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      }

      return (
        <NavLink
          key={idx}
          to={item.path}
          onClick={() => isMobileView && closeMobile()}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center',
            padding: collapsedView ? '0.65rem' : '0.55rem 1rem',
            margin: '0.1rem 0.5rem',
            borderRadius: '0.5rem',
            color: isActive ? '#6366f1' : (isDarkMode ? '#a1a1aa' : '#374151'),
            textDecoration: 'none', fontSize: '0.85rem',
            fontWeight: isActive ? 600 : 400,
            backgroundColor: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
            justifyContent: collapsedView ? 'center' : 'flex-start',
            position: 'relative',
            transition: 'all 0.15s',
          })}
          title={collapsedView ? item.label : undefined}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3, height: '65%',
                  backgroundColor: '#6366f1',
                  borderRadius: '0 2px 2px 0',
                }} />
              )}
              <i className={item.icon} style={{
                fontSize: collapsedView ? '1.2rem' : '1rem',
                width: collapsedView ? 'auto' : '1.25rem',
                flexShrink: 0,
                color: isActive ? '#6366f1' : (isDarkMode ? '#71717a' : '#6b7280'),
              }}></i>
              {!collapsedView && (
                <span style={{ marginLeft: '0.65rem' }}>{item.label}</span>
              )}
            </>
          )}
        </NavLink>
      );
    });
  };

  const renderSection = (section: MenuSection) => {
    const isExpanded = expandedSections.includes(section.title);

    return (
      <div key={section.title} style={{ marginBottom: '0.25rem' }}>
        {!collapsedView && (
          <div
            onClick={() => toggleSection(section.title)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.4rem 1rem',
              color: isDarkMode ? '#a1a1aa' : '#475569', fontSize: '0.68rem',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
              cursor: 'pointer', userSelect: 'none',
            }}
          >
            <span>{section.title}</span>
            <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'}`}
              style={{ fontSize: '0.65rem' }}></i>
          </div>
        )}
        {(isExpanded || collapsedView) && (
          <div>
            {renderMenuItems(section.items)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="layout-root admin-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      {/* Desktop Sidebar - Fixed position like SuperAdmin */}
      <div
        className="sidebar admin-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: collapsedView ? '80px' : '280px',
          borderRight: isDarkMode ? '1px solid #2a2a32' : '1px solid #e2e8f0',
          backgroundColor: isDarkMode ? '#18181c' : '#ffffff',
          boxShadow: isDarkMode ? '2px 0 8px rgba(0,0,0,0.3)' : '2px 0 8px rgba(0,0,0,0.06)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar Header - Gradient like current design */}
        <div style={{
          padding: collapsedView ? '0.75rem' : '1.25rem 1rem',
          background: isDarkMode
            ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)'
            : 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsedView ? 'center' : 'space-between',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 60,
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }} />
          <div style={{
            position: 'absolute', bottom: -30, left: -10,
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: collapsedView ? 36 : 40,
              height: collapsedView ? 36 : 40,
              borderRadius: '0.5rem',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <i className="ti ti-school" style={{ fontSize: collapsedView ? '1.1rem' : '1.25rem', color: 'white' }} />
            </div>
            {!collapsedView && (
              <div style={{ overflow: 'hidden' }}>
                <h6 style={{
                  margin: 0, fontSize: '0.9rem', fontWeight: 700,
                  color: 'white', whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  letterSpacing: '0.2px',
                }}>
                  UltrakeyEdu
                </h6>
                <small style={{
                  color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem',
                  letterSpacing: '0.3px',
                }}>
                  School Management
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable menu */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.5rem 0' }}
          className="sidebar-scroll">
          {adminMenu.map(section => renderSection(section))}
        </div>

        {/* Footer */}
        {!collapsedView && (
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: isDarkMode ? '1px solid #2a2a32' : '1px solid #e2e8f0',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <small style={{ color: '#94a3b8', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <i className="ti ti-shield-check" style={{ fontSize: '0.68rem' }} />
                v1.0.0
              </small>
              <small style={{ color: isDarkMode ? '#71717a' : '#94a3b8', fontSize: '0.65rem' }}>UltrakeyEdu</small>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <aside
          style={{
            position: 'fixed', left: 0, top: 0, bottom: 0, width: 280,
            background: isDarkMode ? '#18181c' : 'white',
            zIndex: 1000, display: 'flex', flexDirection: 'column',
            boxShadow: '4px 0 12px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.2s ease-out',
          }}
        >
          <div style={{
            padding: '1.25rem 1rem',
            background: isDarkMode
              ? 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '0.5rem',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ti ti-school" style={{ fontSize: '1.25rem', color: 'white' }} />
              </div>
              <div>
                <h6 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                  Admin Panel
                </h6>
                <small style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem' }}>
                  School Management
                </small>
              </div>
            </div>
            <button
              onClick={closeMobile}
              style={{
                background: 'transparent', border: 'none',
                padding: '0.5rem', cursor: 'pointer', color: 'white',
              }}
            >
              <i className="ti ti-x" style={{ fontSize: '1.25rem' }} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0', marginTop: 0 }}>
            {adminMenu.map(section => renderSection(section))}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Header toggleSidebar={toggleSidebar} />

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', marginTop: '60px' }}>
          <PageHeader showBreadcrumbs={true} />
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
