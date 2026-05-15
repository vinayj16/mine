import { NavLink } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useState, useEffect, useRef } from 'react';
import '../styles/sidebar.css';

const iconMap: Record<string, string> = {
  dashboard: 'ti ti-home',
  users: 'ti ti-users',
  book: 'ti ti-book',
  check: 'ti ti-check-square',
  dollar: 'ti ti-currency-dollar',
  settings: 'ti ti-settings',
  chart: 'ti ti-chart-bar',
  calendar: 'ti ti-calendar',
  bus: 'ti ti-truck',
  default: 'ti ti-grid-dots',
};

function getIcon(icon: string) {
  return iconMap[icon] || iconMap.default;
}

interface SidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  mobileOnly?: boolean;
}

export default function Sidebar({ 
  onClose, 
  collapsed = false, 
  onCollapse,
  mobileOnly = false 
}: SidebarProps) {
  const { getNavigationItems, getRoleDisplayName, user } = useAuth();
  const navItems = getNavigationItems();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [window.location.pathname]);

  const toggleCollapse = () => {
    if (onCollapse) {
      onCollapse(!collapsed);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Mobile Menu Toggle */}
      <div className="mobile-menu-toggle d-lg-none" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="btn btn-outline-secondary"
          style={{ fontSize: '1.2rem' }}
        >
          <i className={isMobileMenuOpen ? 'ti ti-x' : 'ti ti-menu-2'}></i>
        </button>
      </div>

      {/* Brand */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
              UltrakeySchool
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {getRoleDisplayName()}
            </p>
          </div>
          {!mobileOnly && (
            <button
              onClick={toggleCollapse}
              className="btn btn-sm btn-outline-secondary d-none d-md-block"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <i className={collapsed ? 'ti ti-menu-2' : 'ti ti-chevron-left'}></i>
            </button>
          )}
        </div>
      </div>

      {/* Navigation - Desktop */}
      <nav 
        ref={sidebarRef}
        style={{ 
          flex: 1, 
          padding: '12px 8px', 
          overflowY: 'auto',
          display: isMobileMenuOpen ? 'none' : 'block'
        }} 
      >
        {navItems.map((item: { label: string; path: string; icon: string }) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              onClose?.();
              setIsMobileMenuOpen(false);
            }}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--primary)' : 'var(--text)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              marginBottom: 2,
              transition: 'all 0.15s',
            })}
          >
            <i className={getIcon(item.icon)}></i>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info - Desktop */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        display: isMobileMenuOpen ? 'none' : 'block'
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text)' }}>
          {user?.name || user?.email || 'User'}
        </div>
        <div>{user?.email}</div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-overlay d-lg-none" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-nav-content">
            <div className="mobile-nav-header">
              <h3 style={{ color: 'var(--primary)', marginBottom: 16 }}>Menu</h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn btn-sm btn-outline-secondary"
                style={{ position: 'absolute', top: 12, right: 12 }}
              >
                <i className="ti ti-x"></i>
              </button>
            </div>
            {navItems.map((item: { label: string; path: string; icon: string }) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-nav-item"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--primary)' : 'var(--text)',
                })}
              >
                <i className={getIcon(item.icon)}></i>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
