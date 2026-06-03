import React, { useState, useEffect, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { getSidebarMenu } from '../config/sidebar-menus'
import type { MenuItem, MenuSection } from '../config/sidebar-menus'
import { getImageUrl } from '../utils/imageUtils'

interface RoleSidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  onMobileClose?: () => void
  className?: string
  showUserInfo?: boolean
  isMobileOpen?: boolean
}

const RoleSidebar: React.FC<RoleSidebarProps> = ({
  collapsed = false,
  onMobileClose,
  onCollapse,
  className = '',
  showUserInfo = true,
  isMobileOpen = false,
}) => {
  const location = useLocation()
  const { user } = useAuth()
  const { isDarkMode } = useThemeStore()

  const menu = useMemo(() => {
    return user ? getSidebarMenu(user.role) : []
  }, [user?.role])

  const [isMobileView, setIsMobileView] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  useEffect(() => {
    const sectionTitles = menu.map(s => s.title)
    setExpandedSections(prev => {
      const merged = new Set([...prev, ...sectionTitles])
      return Array.from(merged)
    })
  }, [menu])

  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const transform = isMobileView
    ? (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)')
    : 'translateX(0)'

  const renderMenuItems = (items: MenuItem[], collapsedView: boolean) => {
    return items.map((item, idx) => {
      const hasChildren = item.children && item.children.length > 0
      const itemKey = item.label
      const isExpanded = expandedSections.includes(itemKey)

      if (hasChildren) {
        return (
          <div key={idx}>
            <div
              onClick={() => toggleSection(itemKey)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: collapsedView && !isMobileView ? '0.65rem' : '0.55rem 1rem',
                margin: '0.1rem 0.5rem',
                borderRadius: '0.5rem',
                color: isDarkMode ? '#a1a1aa' : '#374151',
                cursor: 'pointer', fontSize: '0.85rem',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <i className={item.icon} style={{
                  fontSize: collapsedView && !isMobileView ? '1.2rem' : '1rem',
                  width: collapsedView && !isMobileView ? 'auto' : '1.25rem',
                  flexShrink: 0, color: isDarkMode ? '#71717a' : '#6b7280',
                }}></i>
                {(!collapsedView || isMobileView) && <span>{item.label}</span>}
              </div>
              {(!collapsedView || isMobileView) && (
                <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'}`}
                  style={{ fontSize: '0.65rem', color: isDarkMode ? '#71717a' : '#94a3b8' }}></i>
              )}
            </div>
            {(isExpanded || (collapsedView && !isMobileView)) && (
              <div>
                {item.children!.map((child, cIdx) => (
                  <NavLink
                    key={cIdx}
                    to={child.path}
          onClick={() => isMobileView && onMobileClose?.()}
          style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center',
                      padding: collapsedView && !isMobileView ? '0.6rem' : '0.45rem 1rem 0.45rem 2.5rem',
                      margin: '0.1rem 0.5rem',
                      borderRadius: '0.5rem',
                      color: isActive ? '#6366f1' : (isDarkMode ? '#a1a1aa' : '#374151'),
                      textDecoration: 'none', fontSize: '0.82rem',
                      fontWeight: isActive ? 600 : 400,
                      backgroundColor: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                      position: 'relative',
                      transition: 'all 0.15s',
                    })}
                    title={collapsedView && !isMobileView ? child.label : undefined}
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
                          fontSize: collapsedView && !isMobileView ? '1.1rem' : '0.9rem',
                          width: collapsedView && !isMobileView ? 'auto' : '1.1rem',
                          flexShrink: 0,
                          color: isActive ? '#6366f1' : (isDarkMode ? '#71717a' : '#6b7280'),
                        }}></i>
                        {(!collapsedView || isMobileView) && (
                          <span style={{ marginLeft: '0.5rem' }}>{child.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )
      }

      return (
        <NavLink
          key={idx}
          to={item.path}
          onClick={() => isMobileView && onMobileClose?.()}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center',
            padding: collapsedView && !isMobileView ? '0.65rem' : '0.55rem 1rem',
            margin: '0.1rem 0.5rem',
            borderRadius: '0.5rem',
            color: isActive ? '#6366f1' : (isDarkMode ? '#a1a1aa' : '#374151'),
            textDecoration: 'none', fontSize: '0.85rem',
            fontWeight: isActive ? 600 : 400,
            backgroundColor: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
            justifyContent: collapsedView && !isMobileView ? 'center' : 'flex-start',
            position: 'relative',
            transition: 'all 0.15s',
          })}
          title={collapsedView && !isMobileView ? item.label : undefined}
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
                fontSize: collapsedView && !isMobileView ? '1.2rem' : '1rem',
                width: collapsedView && !isMobileView ? 'auto' : '1.25rem',
                flexShrink: 0,
                color: isActive ? '#6366f1' : (isDarkMode ? '#71717a' : '#6b7280'),
              }}></i>
              {(!collapsedView || isMobileView) && (
                <span style={{ marginLeft: '0.65rem' }}>{item.label}</span>
              )}
            </>
          )}
        </NavLink>
      )
    })
  }

  const renderSection = (section: MenuSection, idx: number) => {
    const isExpanded = expandedSections.includes(section.title)
    const collapsedView = collapsed && !isMobileView

    return (
      <div key={idx} style={{ marginBottom: '0.25rem' }}>
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
            {renderMenuItems(section.items, collapsedView)}
          </div>
        )}
      </div>
    )
  }

  return (
    <>

      <div
        className={`${className}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: isMobileView ? 280 : (collapsed ? '80px' : '280px'),
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
          padding: collapsed && !isMobileView ? '0.75rem' : '1rem 1.25rem',
          borderBottom: isDarkMode ? '1px solid #2a2a32' : '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobileView ? 'center' : 'space-between',
          gap: '0.75rem',
          flexShrink: 0,
          minHeight: 60,
        }}>
          <div style={{ display: 'flex', flexDirection: collapsed && !isMobileView ? 'row' : 'column', alignItems: 'center', gap: collapsed && !isMobileView ? '0' : '0.5rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              backgroundColor: isDarkMode ? '#4f46e5' : '#6366f1', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'white', flexShrink: 0,
              overflow: 'hidden'
            }}>
              {user?.avatar || user?.photo ? (
                <img src={getImageUrl(user.avatar || user.photo)} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = 'none'; img.parentElement && (img.parentElement.innerHTML = '<i class="ti ti-building-bank" style="font-size:1rem"></i>'); }} />
              ) : (
                <i className="ti ti-building-bank" style={{ fontSize: '1rem' }}></i>
              )}
            </div>
            {(!collapsed || isMobileView) && showUserInfo && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: isDarkMode ? '#e4e4e7' : '#1e293b', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: '0.68rem', textTransform: 'capitalize' }}>
                  {(user?.role || '').replace(/_/g, ' ')}
                </div>
              </div>
            )}
          </div>
          {isMobileView && (
            <button
              onClick={() => onMobileClose?.()}
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
          {menu.map((section, idx) => renderSection(section, idx))}
        </div>

        {/* Footer */}
        {(!collapsed || isMobileView) && (
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: isDarkMode ? '1px solid #2a2a32' : '1px solid #e2e8f0',
            flexShrink: 0,
          }}>
            <small style={{ color: isDarkMode ? '#a1a1aa' : '#94a3b8', fontSize: '0.68rem' }}>
              {user?.institutionName || 'UltrakeyEdu'}
            </small>
          </div>
        )}
      </div>
    </>
  )
}

export default RoleSidebar
