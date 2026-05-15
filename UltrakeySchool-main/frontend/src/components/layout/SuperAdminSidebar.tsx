import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'

interface SuperAdminSidebarProps {
  isCollapsed?: boolean
  setCollapsed?: (collapsed: boolean) => void
  isMobileOpen?: boolean
  setIsMobileOpen?: (open: boolean) => void
}

const sections = [
  {
    key: 'main', title: 'MAIN',
    items: [
      { to: '/super-admin/dashboard', label: 'Dashboard', icon: 'ti ti-layout-dashboard' },
      { to: '/super-admin/analytics', label: 'Platform Analytics', icon: 'ti ti-chart-line' },
    ]
  },
  {
    key: 'institutions', title: 'INSTITUTION MANAGEMENT',
    items: [
      { to: '/super-admin/institutions', label: 'Institutions', icon: 'ti ti-building', end: true },
      { to: '/super-admin/institutions/schools', label: 'Schools', icon: 'ti ti-school' },
      { to: '/super-admin/institutions/inter-colleges', label: 'Inter Colleges', icon: 'ti ti-building-community' },
      { to: '/super-admin/institutions/degree-colleges', label: 'Degree Colleges', icon: 'ti ti-building' },
      { to: '/super-admin/institutions/engineering-colleges', label: 'Engineering Colleges', icon: 'ti ti-device-laptop' },
      { to: '/super-admin/branches', label: 'Branches Monitoring', icon: 'ti ti-git-branch' },
      { to: '/super-admin/impersonate', label: 'Impersonate Institution', icon: 'ti ti-user-switch' },
    ]
  },
  {
    key: 'billing', title: 'SUBSCRIPTIONS & BILLING',
    items: [
      { to: '/super-admin/memberships', label: 'Subscription Plans', icon: 'ti ti-crown' },
      { to: '/super-admin/transactions', label: 'Transactions', icon: 'ti ti-report-money' },
      { to: '/super-admin/revenue', label: 'Revenue Analytics', icon: 'ti ti-currency-rupee' },
      { to: '/super-admin/alerts', label: 'Expiry & Alerts', icon: 'ti ti-alert-triangle' },
    ]
  },
  {
    key: 'modules', title: 'MODULE & ACCESS CONTROL',
    items: [
      { to: '/super-admin/modules', label: 'Modules Control', icon: 'ti ti-puzzle' },
    ]
  },
  {
    key: 'users', title: 'USER & SUPPORT',
    items: [
      { to: '/super-admin/platform-users', label: 'Platform Users', icon: 'ti ti-users' },
      { to: '/super-admin/create-credentials', label: 'Create Credentials', icon: 'ti ti-user-plus' },
      { to: '/super-admin/pending-requests', label: 'Pending Requests', icon: 'ti ti-user-check' },
      { to: '/super-admin/tickets', label: 'Support / Tickets', icon: 'ti ti-ticket' },
    ]
  },
  {
    key: 'agents', title: 'AGENTS MANAGEMENT',
    items: [
      { to: '/super-admin/agents', label: 'All Agents', icon: 'ti ti-users-group' },
      { to: '/super-admin/agents/add', label: 'Add Agent', icon: 'ti ti-user-plus' },
      { to: '/super-admin/agent-analytics', label: 'Agent Analytics', icon: 'ti ti-chart-bar' },
    ]
  },
  {
    key: 'system', title: 'SYSTEM',
    items: [
      { to: '/super-admin/audit-logs', label: 'Audit Logs', icon: 'ti ti-shield-check' },
      { to: '/super-admin/all-data', label: 'All Data View', icon: 'ti ti-database' },
      { to: '/super-admin/analytics-reports', label: 'Reports', icon: 'ti ti-file-analytics' },
      { to: '/super-admin/settings', label: 'Platform Settings', icon: 'ti ti-settings' },
      { to: '/super-admin/maintenance', label: 'Maintenance Mode', icon: 'ti ti-tool' },
    ]
  },
  {
    key: 'apps', title: 'APPLICATIONS',
    items: [
      { to: '/super-admin/apps/calendar', label: 'Calendar', icon: 'ti ti-calendar' },
      { to: '/super-admin/apps/chat', label: 'Chat', icon: 'ti ti-message' },
      { to: '/super-admin/apps/call', label: 'Call', icon: 'ti ti-phone' },
      { to: '/super-admin/apps/email', label: 'Email', icon: 'ti ti-mail' },
      { to: '/super-admin/apps/file-manager', label: 'File Manager', icon: 'ti ti-folder' },
      { to: '/super-admin/apps/notes', label: 'Notes', icon: 'ti ti-note' },
      { to: '/super-admin/apps/todo', label: 'Todo', icon: 'ti ti-checklist' },
    ]
  },
]

const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  isCollapsed = false,
  isMobileOpen = false,
  setIsMobileOpen,
}) => {
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

  // On mobile: slide in/out. On desktop: always visible, width changes.
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
        width: isMobileView ? 280 : width,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
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
        padding: isCollapsed && !isMobileView ? '1rem' : '1rem 1.25rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed && !isMobileView ? 'center' : 'flex-start',
        gap: '0.75rem',
        flexShrink: 0,
        minHeight: 60,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          backgroundColor: '#3b82f6', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: 'white', flexShrink: 0,
        }}>
          <i className="ti ti-crown" style={{ fontSize: '1rem' }}></i>
        </div>
        {(!isCollapsed || isMobileView) && (
          <div>
            <div style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>
              Super Admin
            </div>
            <div style={{ color: '#64748b', fontSize: '0.68rem' }}>Platform Control</div>
          </div>
        )}
        {/* Mobile close button */}
        {isMobileView && (
          <button
            onClick={() => setIsMobileOpen?.(false)}
            style={{
              marginLeft: 'auto', background: 'transparent', border: 'none',
              color: '#64748b', fontSize: '1.1rem', cursor: 'pointer',
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
              {/* Section header — hidden when collapsed on desktop */}
              {(!isCollapsed || isMobileView) && (
                <div
                  onClick={() => toggleSection(section.key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.4rem 1rem', color: '#94a3b8', fontSize: '0.68rem',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                    cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  <span>{section.title}</span>
                  <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'}`}
                    style={{ fontSize: '0.65rem' }}></i>
                </div>
              )}

              {/* Items */}
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
                        color: isActive ? '#3b82f6' : '#374151',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 600 : 400,
                        backgroundColor: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
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
                              backgroundColor: '#3b82f6',
                              borderRadius: '0 2px 2px 0',
                            }} />
                          )}
                          <i className={item.icon} style={{
                            fontSize: isCollapsed && !isMobileView ? '1.2rem' : '1rem',
                            width: isCollapsed && !isMobileView ? 'auto' : '1.25rem',
                            flexShrink: 0,
                            color: isActive ? '#3b82f6' : '#6b7280',
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
          borderTop: '1px solid #e2e8f0',
          flexShrink: 0,
        }}>
          <small style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Platform Control Center</small>
        </div>
      )}
    </div>
  )
}

export default SuperAdminSidebar
