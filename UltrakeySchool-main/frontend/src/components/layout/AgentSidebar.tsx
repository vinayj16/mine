import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useThemeStore } from '../../store/themeStore'
import { useAuth } from '../../store/authStore'
import { getImageUrl } from '../../utils/imageUtils'

interface AgentSidebarProps {
  isCollapsed?: boolean
  setCollapsed?: (collapsed: boolean) => void
  isMobileOpen?: boolean
  setIsMobileOpen?: (open: boolean) => void
}

const sections = [
  {
    key: 'main', title: 'MAIN',
    items: [
      { to: '/agent', label: 'Dashboard', icon: 'ti ti-layout-dashboard', end: true },
      { to: '/agent/performance', label: 'Performance', icon: 'ti ti-chart-bar' },
    ]
  },
  {
    key: 'institutions', title: 'INSTITUTIONS',
    items: [
      { to: '/agent/institutions', label: 'Manage Institutions', icon: 'ti ti-building', end: true },
      { to: '/agent/institutions/add', label: 'Add Institution', icon: 'ti ti-plus' },
      { to: '/agent/commissions', label: 'Commissions', icon: 'ti ti-credit-card' },
    ]
  },
  {
    key: 'account', title: 'ACCOUNT',
    items: [
      { to: '/agent/profile', label: 'Profile', icon: 'ti ti-user' },
      { to: '/agent/settings', label: 'Settings', icon: 'ti ti-settings' },
    ]
  },
  {
    key: 'apps', title: 'APPLICATIONS',
    items: [
      { to: '/agent/applications/calendar', label: 'Calendar', icon: 'ti ti-calendar' },
      { to: '/agent/applications/chat', label: 'Chat', icon: 'ti ti-message' },
      { to: '/agent/applications/call', label: 'Call', icon: 'ti ti-phone' },
      { to: '/agent/applications/email', label: 'Email', icon: 'ti ti-mail' },
      { to: '/agent/applications/file-manager', label: 'File Manager', icon: 'ti ti-folder' },
      { to: '/agent/applications/notes', label: 'Notes', icon: 'ti ti-note' },
      { to: '/agent/applications/todo', label: 'Todo', icon: 'ti ti-checklist' },
    ]
  },
]

const AgentSidebar: React.FC<AgentSidebarProps> = ({
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

  // On mobile: slide in/out. On desktop: always visible, width changes.
  const transform = isMobileView
    ? (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)')
    : 'translateX(0)'

  return (
    <div
      className={`app-sidebar agent-sidebar ${isDarkMode ? 'bg-dark' : 'sidebar-bg-default'}`}
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
        padding: isCollapsed && !isMobileView ? '0.75rem' : '1rem 1.25rem',
        borderBottom: isDarkMode ? '1px solid #2a2a32' : '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed && !isMobileView ? 'center' : 'space-between',
        gap: '0.75rem',
        flexShrink: 0,
        minHeight: 60,
      }}>
        <div style={{ display: 'flex', flexDirection: isCollapsed && !isMobileView ? 'row' : 'column', alignItems: 'center', gap: isCollapsed && !isMobileView ? '0' : '0.5rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: '#3b82f6', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', flexShrink: 0,
            overflow: 'hidden'
          }}>
            {user?.avatar || user?.photo ? (
              <img src={getImageUrl(user.avatar || user.photo)} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            ) : (
              <i className="ti ti-users" style={{ fontSize: '1rem' }}></i>
            )}
          </div>
          {(!isCollapsed || isMobileView) && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: isDarkMode ? '#e4e4e7' : '#1e293b', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>
                Agent Portal
              </div>
              <div style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: '0.68rem' }}>Management</div>
            </div>
          )}
        </div>
        {/* Mobile close button */}
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
              {/* Section header — hidden when collapsed on desktop */}
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
                        color: isActive ? '#3b82f6' : (isDarkMode ? '#a1a1aa' : '#374151'),
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
                            color: isActive ? '#3b82f6' : (isDarkMode ? '#71717a' : '#6b7280'),
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
          <small style={{ color: isDarkMode ? '#71717a' : '#94a3b8', fontSize: '0.68rem' }}>Agent Control Center</small>
        </div>
      )}
    </div>
  )
}

export default AgentSidebar
