import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import { useAuth } from '../store/authStore'
import { canAccessRoute } from '../utils/permissions'
import Header from '../components/layout/Header'
import PageHeader from '../components/layout/PageHeader'
import RoleSidebar from '../components/RoleSidebar'

// Context for sharing sidebar state across components
interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
  toggleSidebar: () => void
  closeMobileSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within MainLayout')
  }
  return context
}

// Main Layout Component
const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Handle mobile sidebar state - must be before any conditional returns
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileSidebarOpen])

  // Check if user is authenticated
  if (!user) {
    console.log('[MainLayout] No user found, redirecting to login')
    navigate('/login', { replace: true })
    return null
  }

  // Check if user can access current route
  if (!canAccessRoute(user, location.pathname)) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="card text-center p-5">
          <div className="card-body">
            <div className="mb-4">
              <i className="ti ti-lock fs-1 text-warning mb-3"></i>
            </div>
            <h4 className="mb-3">Access Restricted</h4>
            <p className="text-muted mb-4">
              This module is not available for your role or plan.
              <br />
              Please contact your administrator for access.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileSidebarOpen(prev => !prev)
    } else {
      setIsSidebarCollapsed(prev => !prev)
    }
  }

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  // Apply body classes for sidebar state
  useEffect(() => {
    document.body.classList.toggle('mini-sidebar', isSidebarCollapsed && !isMobileSidebarOpen)
    document.body.classList.toggle('mobile-menu-open', isMobileSidebarOpen)
  }, [isSidebarCollapsed, isMobileSidebarOpen])

  const sidebarContextValue: SidebarContextType = {
    isCollapsed: isSidebarCollapsed,
    setIsCollapsed: setIsSidebarCollapsed,
    isMobileOpen: isMobileSidebarOpen,
    setIsMobileOpen: setIsMobileSidebarOpen,
    toggleSidebar,
    closeMobileSidebar
  }

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="main-wrapper">
        <Header />
        <div className="main-container">
          <RoleSidebar 
            collapsed={isSidebarCollapsed}
            onCollapse={setIsSidebarCollapsed}
            onMobileClose={closeMobileSidebar}
          />
          <main 
            className="page-wrapper" 
            role="main"
            id="main-content"
          >
            <div className="content">
              <PageHeader showBreadcrumbs={true} />
              <Outlet />
            </div>
          </main>
        </div>
        {/* Mobile sidebar overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={closeMobileSidebar}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                closeMobileSidebar()
              }
            }}
            aria-label="Close sidebar overlay"
          />
        )}
      </div>
    </SidebarContext.Provider>
  )
}

export default MainLayout