import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useThemeStore } from '../../store/themeStore'
import { useAuth } from '../../store/authStore'
import { getImageUrl } from '../../utils/imageUtils'

interface InstitutionAdminSidebarProps {
  isCollapsed?: boolean
  setCollapsed?: (collapsed: boolean) => void
  isMobileOpen?: boolean
  setIsMobileOpen?: (open: boolean) => void
}

const sections = [
  {
    key: 'main', title: 'MAIN',
    items: [
      { to: '/dashboard/main', label: 'Main Dashboard', icon: 'ti ti-layout-dashboard', end: true },
      { to: '/dashboard/main/analytics', label: 'Analytics', icon: 'ti ti-chart-line' },
      { to: '/dashboard/main/finance', label: 'Finance', icon: 'ti ti-currency-rupee' },
      { to: '/dashboard/main/subscription', label: 'Subscription', icon: 'ti ti-crown' },
    ]
  },
  {
    key: 'user-mgmt', title: 'USER MANAGEMENT',
    items: [
      { to: '/dashboard/main/create-credentials', label: 'Create User Credentials', icon: 'ti ti-user-plus' },
      { to: '/dashboard/main/users', label: 'Members List', icon: 'ti ti-users-group' },
    ]
  },
  {
    key: 'finance-payroll', title: 'FINANCE & PAYROLL',
    items: [
      { to: '/dashboard/main/salaries', label: 'Salaries', icon: 'ti ti-wallet' },
      { to: '/dashboard/main/payroll', label: 'Payroll', icon: 'ti ti-report-money' },
      { to: '/dashboard/main/budgets', label: 'Budgets', icon: 'ti ti-chart-bar' },
    ]
  },
  {
    key: 'transport', title: 'TRANSPORT MANAGEMENT',
    items: [
      { to: '/dashboard/main/transport/routes', label: 'Routes', icon: 'ti ti-route' },
      { to: '/dashboard/main/transport/vehicles', label: 'Vehicles', icon: 'ti ti-bus' },
      { to: '/dashboard/main/transport/drivers', label: 'Drivers', icon: 'ti ti-steering-wheel' },
      { to: '/dashboard/main/transport/pickup-points', label: 'Pickup Points', icon: 'ti ti-map-pin' },
      { to: '/dashboard/main/transport/vehicle-maintenance', label: 'Vehicle Maintenance', icon: 'ti ti-tool' },
      { to: '/dashboard/main/transport/assign', label: 'Assign Vehicle', icon: 'ti ti-transfer' },
      { to: '/dashboard/main/transport/reports', label: 'Reports', icon: 'ti ti-report-analytics' },
    ]
  },
  {
    key: 'settings', title: 'SETTINGS',
    items: [
      { to: '/dashboard/main/settings', label: 'Institution Settings', icon: 'ti ti-settings', end: true },
    ]
  },
  {
    key: 'applications', title: 'APPLICATIONS',
    items: [
      { to: '/dashboard/applications/calendar', label: 'Calendar', icon: 'ti ti-calendar' },
      { to: '/dashboard/applications/call', label: 'Call', icon: 'ti ti-phone' },
      { to: '/dashboard/applications/chat', label: 'Chat', icon: 'ti ti-message' },
      { to: '/dashboard/applications/email', label: 'Email', icon: 'ti ti-mail' },
      { to: '/dashboard/applications/file-manager', label: 'File Manager', icon: 'ti ti-folder' },
      { to: '/dashboard/applications/notes', label: 'Notes', icon: 'ti ti-note' },
      { to: '/dashboard/applications/todo', label: 'Todo', icon: 'ti ti-checklist' },
    ]
  },
]

const InstitutionAdminSidebar: React.FC<InstitutionAdminSidebarProps> = ({
  isCollapsed = false,
  setCollapsed,
  isMobileOpen = false,
  setIsMobileOpen,
}) => {
  const { isDarkMode } = useThemeStore()
  const { user } = useAuth()
  const allKeys = sections.map(s => s.key)
  const [expandedSections, setExpandedSections] = useState<string[]>(allKeys)
  const [isMobileView, setIsMobileView] = useState(false)

  React.useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const toggleSection = (key: string) => {
    setExpandedSections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const width = isCollapsed ? 80 : 280
  const transform = isMobileView
    ? (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)')
    : 'translateX(0)'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: isMobileView ? 280 : (isCollapsed ? '80px' : '280px'),
        borderRight: isDarkMode ? '1px solid #2a2a32' : '1px solid #e2e8f0',
        backgroundColor: isDarkMode ? '#18181c' : '#ffffff',
        boxShadow: isDarkMode ? '2px 0 8px rgba(0,0,0,0.3)' : '2px 0 8px rgba(0,0,0,0.06)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        transform,
        transition: isMobileView
          ? 'transform 0.3s cubic-bezier(0.4,0,0.2,1)'
          : 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}
    >
      {/* Logo / Brand header */}
      <div style={{
        padding: isCollapsed && !isMobileView ? '0.75rem' : '0.75rem 1rem',
        borderBottom: isDarkMode ? '1px solid #2a2a32' : '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed && !isMobileView ? 'center' : 'space-between',
        gap: '0.5rem',
        flexShrink: 0,
        minHeight: 48,
      }}>
        <div style={{ display: 'flex', flexDirection: isCollapsed && !isMobileView ? 'row' : 'column', alignItems: 'center', gap: isCollapsed && !isMobileView ? '0' : '0.35rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            backgroundColor: '#6366f1', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', flexShrink: 0,
            overflow: 'hidden'
          }}>
            {user?.avatar || user?.photo ? (
              <img src={getImageUrl(user.avatar || user.photo)} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = 'none'; img.parentElement && (img.parentElement.innerHTML = '<i class="ti ti-building-bank" style="font-size:0.85rem"></i>'); }} />
            ) : (
              <i className="ti ti-building-bank" style={{ fontSize: '0.85rem' }}></i>
            )}
          </div>
          {(!isCollapsed || isMobileView) && (
            <div style={{ color: isDarkMode ? '#a1a1aa' : '#94a3b8', fontSize: '0.72rem' }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Portal</span>
            </div>
          )}
        </div>
        {isMobileView && (
          <button
            onClick={() => setIsMobileOpen?.(false)}
            style={{
              background: 'transparent', border: 'none',
              color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: '1.1rem', cursor: 'pointer',
              padding: '0.3rem', borderRadius: '0.375rem',
            }}
          >
            <i className="ti ti-x"></i>
          </button>
        )}
      </div>

      {/* Scrollable menu */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.5rem 0' }}
        className="sidebar-scroll">
        {sections.map(section => {
          const isExpanded = expandedSections.includes(section.key)
          return (
            <div key={section.key} style={{ marginBottom: '0.25rem' }}>
              {(!isCollapsed || isMobileView) && (
                <div
                  onClick={() => toggleSection(section.key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.4rem 1rem', color: isDarkMode ? '#a1a1aa' : '#94a3b8', fontSize: '0.68rem',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                    cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  <span>{section.title}</span>
                  <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'}`}
                    style={{ fontSize: '0.65rem' }}></i>
                </div>
              )}

              {(isExpanded || (isCollapsed && !isMobileView)) && (
                <div>
                  {section.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={'end' in item ? item.end : false}
                      onClick={() => isMobileView && setIsMobileOpen?.(false)}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        padding: isCollapsed && !isMobileView ? '0.65rem' : '0.55rem 1rem',
                        margin: '0.1rem 0.5rem',
                        borderRadius: '0.5rem',
                        color: isActive ? '#6366f1' : (isDarkMode ? '#a1a1aa' : '#374151'),
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 600 : 400,
                        backgroundColor: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                        transition: 'all 0.15s',
                        justifyContent: isCollapsed && !isMobileView ? 'center' : 'flex-start',
                        position: 'relative',
                      })}
                      title={isCollapsed && !isMobileView ? item.label : undefined}
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
                            fontSize: isCollapsed && !isMobileView ? '1.2rem' : '1rem',
                            width: isCollapsed && !isMobileView ? 'auto' : '1.25rem',
                            flexShrink: 0,
                            color: isActive ? '#6366f1' : (isDarkMode ? '#71717a' : '#6b7280'),
                          }}></i>
                          {(!isCollapsed || isMobileView) && (
                            <span style={{ marginLeft: '0.65rem' }}>{item.label}</span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {(!isCollapsed || isMobileView) && (
        <div style={{
          padding: '0.75rem 1rem',
          borderTop: isDarkMode ? '1px solid #2a2a32' : '1px solid #e2e8f0',
          flexShrink: 0,
        }}>
          <small style={{ color: isDarkMode ? '#71717a' : '#94a3b8', fontSize: '0.68rem' }}>Institution Management Portal</small>
        </div>
      )}
    </div>
  )
}

export default InstitutionAdminSidebar
