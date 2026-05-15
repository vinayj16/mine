import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { getSidebarMenu } from '../config/sidebar-menus'
import type { MenuItem, MenuSection } from '../config/sidebar-menus'
import { useSidebar } from '../layouts/MainLayout'
import '../styles/sidebar.css'

interface RoleSidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  onMobileClose?: () => void
  className?: string
  showUserInfo?: boolean
  enableAnimations?: boolean
}

const RoleSidebar: React.FC<RoleSidebarProps> = ({
  collapsed = false,
  onMobileClose,
  onCollapse,
  className = '',
  showUserInfo = true,
  enableAnimations = true
}) => {
  const location = useLocation()
  const { user } = useAuth()
  const sidebarContext = useSidebar()

  // Memoize menu to prevent unnecessary recalculations
  const menu = useMemo(() => {
    return user ? getSidebarMenu(user.role) : []
  }, [user?.role])

  const [isMiniMode, setIsMiniMode] = useState<boolean>(collapsed)

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [isAnimating, setIsAnimating] = useState(false)

  // Update isMiniMode when collapsed prop changes
  useEffect(() => {
    setIsMiniMode(collapsed)
  }, [collapsed])

  // Auto-expand menu if any child is active - optimized with useCallback
  const updateExpandedItems = useCallback(() => {
    const newExpandedItems: Record<string, boolean> = {}

    menu.forEach(section => {
      section.items.forEach(item => {
        if (item.children && item.children.length > 0) {
          const hasActiveChild = item.children.some(child =>
            child.path === location.pathname ||
            (child.path && location.pathname.startsWith(child.path))
          )

          if (hasActiveChild) {
            newExpandedItems[item.label] = true
          }
        }
      })
    })

    // Use the return value to fix lint warning
    const updatedItems = setExpandedItems(prev => ({ ...prev, ...newExpandedItems }))
    return updatedItems
  }, [location.pathname, menu])

  // Enhanced close sidebar with better error handling
  const closeSidebar = useCallback(() => {
    try {
      // Close sidebar on mobile (React state)
      sidebarContext.closeMobileSidebar()

      // Close sidebar for template behavior (no jQuery dependency)
      if (typeof window !== 'undefined') {
        const mainWrapper = document.querySelector('.main-wrapper')
        const sidebarOverlay = document.querySelector('.sidebar-overlay')

        if (mainWrapper) {
          mainWrapper.classList.remove('slide-nav')
        }

        if (sidebarOverlay) {
          sidebarOverlay.classList.remove('opened')
        }

        document.documentElement.classList.remove('menu-opened')
      }
    } catch (error) {
      console.error('[RoleSidebar] Error closing sidebar:', error)
    }
  }, [sidebarContext])

  // Enhanced responsive handlers with debouncing
  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const shouldCloseOnMobile = window.innerWidth < 1024
    if (shouldCloseOnMobile) {
      closeSidebar()
    }
  }, [closeSidebar])

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    let resizeTimer: ReturnType<typeof setTimeout>
    const handleResizeDebounced = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(handleResize, 150)
    }
    
    window.addEventListener('resize', handleResizeDebounced)
    
    return () => {
      window.removeEventListener('resize', handleResizeDebounced)
      clearTimeout(resizeTimer)
    }
  }, [handleResize])

  // Desktop UX: when sidebar is in mini mode, hover expands it temporarily - enhanced
  const handleMouseEnter = useCallback(() => {
    if (typeof window === 'undefined') return
    if (window.innerWidth < 1024) return
    
    const isMini = collapsed || isMiniMode
    if (!isMini) {
      document.body.classList.add('expand-menu')
    }
  }, [collapsed, isMiniMode])

  const handleMouseLeave = useCallback(() => {
    if (typeof window === 'undefined') return
    if (window.innerWidth < 1024) return
    document.body.classList.remove('expand-menu')
  }, [isMiniMode])

  // Optimized toggle with animation support
  const toggleItem = useCallback((itemLabel: string) => {
    if (enableAnimations) {
      setIsAnimating(true)
    }

    setExpandedItems(prev => ({
      ...prev,
      [itemLabel]: !prev[itemLabel]
    }))

    // Reset animation state after a short delay
    if (enableAnimations) {
      setTimeout(() => setIsAnimating(false), 200)
    }
  }, [expandedItems, enableAnimations])

  const renderMenuItem = (item: MenuItem, itemKey: string) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems[itemKey]
    const isActive = item.path === location.pathname

    const linkStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: collapsed ? '10px' : '8px 12px',
      margin: '2px 0',
      color: isActive ? '#6366f1' : '#475569',
      backgroundColor: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
      textDecoration: 'none',
      fontSize: '0.825rem',
      fontWeight: isActive ? 600 : 400,
      borderRadius: '4px',
      transition: 'all 0.15s ease',
      borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
      justifyContent: collapsed ? 'center' : 'flex-start',
    }

    const hoverStyle: React.CSSProperties = {
      backgroundColor: isActive ? 'rgba(99, 102, 241, 0.08)' : '#f8fafc',
      color: '#1e293b'
    }

    return (
      <li key={itemKey} style={{ listStyle: 'none' }}>
        {hasChildren ? (
          <>
            <a
              href="javascript:void(0);"
              style={linkStyle}
              onClick={() => toggleItem(itemKey)}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, linkStyle)}
            >
              <i className={item.icon} style={{ fontSize: '1rem', width: '20px', textAlign: 'center', flexShrink: 0 }}></i>
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <i 
                    className={`ti ti-chevron-${isExpanded ? 'up' : 'down'}`} 
                    style={{ fontSize: '0.75rem', transition: 'transform 0.2s' }}
                  ></i>
                </>
              )}
            </a>
            <ul style={{ display: isExpanded && !collapsed ? 'block' : 'none', paddingLeft: '20px', margin: '2px 0' }}>
              {item.children?.map((child, idx) => (
                <li key={idx} style={{ listStyle: 'none' }}>
                  <NavLink
                    to={child.path}
                    style={({ isActive }) => ({
                      ...linkStyle,
                      paddingLeft: collapsed ? '10px' : '12px',
                      color: isActive ? '#6366f1' : '#64748b',
                      fontSize: '0.8rem',
                    })}
                    onClick={closeSidebar}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { backgroundColor: '#f1f5f9', color: '#1e293b' })}
                    onMouseLeave={(e) => {}}
                  >
                    <i className={child.icon} style={{ fontSize: '0.9rem', width: '18px', textAlign: 'center', flexShrink: 0 }}></i>
                    {!collapsed && (
                      <>
                        <span style={{ flex: 1 }}>{child.label}</span>
                        {child.badge && (
                          <span style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                            borderRadius: '10px'
                          }}>
                            {child.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <NavLink
            to={item.path}
            style={({ isActive }) => ({
              ...linkStyle,
              borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
            })}
            onClick={closeSidebar}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
            onMouseLeave={(e) => {}}
          >
            <i className={item.icon} style={{ fontSize: '1rem', width: '20px', textAlign: 'center', flexShrink: 0 }}></i>
            {!collapsed && (
              <>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        )}
      </li>
    )
  }

  const renderSection = (section: MenuSection, sectionIdx: number) => {
    return (
      <li key={sectionIdx} style={{ marginBottom: '4px' }}>
        {!collapsed && (
          <h6 
            className="submenu-hdr"
            style={{
              padding: '8px 12px',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#94a3b8',
              margin: '0 0 4px 0',
              borderBottom: '1px solid #f1f5f9'
            }}
          >
            <span>{section.title}</span>
          </h6>
        )}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {section.items.map((item, itemIdx) => renderMenuItem(item, `${sectionIdx}-${itemIdx}`))}
        </ul>
      </li>
    )
  }

  const handleCloseClick = useCallback(() => {
    sidebarContext.closeMobileSidebar()
    onCollapse?.(!collapsed)
  }, [sidebarContext, onCollapse, collapsed])

  return (
    <div
      className={`role-sidebar sidebar ${className} ${collapsed ? 'collapsed mini-sidebar' : ''} ${isAnimating ? 'animating' : ''} ${sidebarContext.isMobileOpen ? 'sidebar-mobile-open' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}
    >
      <div className="sidebar-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Fixed top area: close button + user/role card (does NOT scroll) */}
        <div className="sidebar-fixed-top">
          {/* Close Button - Only visible on mobile */}
          <button
            className="sidebar-close-btn"
            onClick={handleCloseClick}
            aria-label="Close sidebar"
            type="button"
          >
            <i className="ti ti-x"></i>
          </button>

          {/* School / User Info (fixed / standard) */}
          <div 
            className="d-flex align-items-center sidebar-school-info"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px', 
              marginBottom: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: 'white'
            }}
          >
            <div 
              className="d-flex align-items-center"
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <div 
                className="user-avatar"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '4px',
                  backgroundColor: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <i className="ti ti-building-bank" style={{ color: 'white', fontSize: '1.1rem' }}></i>
              </div>
              {(!collapsed || document.body.classList.contains('expand-menu')) && showUserInfo && (
                <div className="user-info">
                  <div className="user-name" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{user?.name || 'User'}</div>
                  <div className="user-role" style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>{user?.role || 'Role'}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll area: only the menu (and footer) scrolls */}
        <div className="sidebar-scroll slimscroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div id="sidebar-menu" className="sidebar-menu">
            {/* Menu Sections */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {menu.map((section, idx) => renderSection(section, idx))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleSidebar
