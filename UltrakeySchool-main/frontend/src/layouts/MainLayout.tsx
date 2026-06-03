import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import { useAuth } from '../store/authStore'
import { canAccessRoute } from '../utils/permissions'
import Header from '../components/layout/Header'
import PageHeader from '../components/layout/PageHeader'
import RoleSidebar from '../components/RoleSidebar'
import RoleDashboardGuard from '../components/RoleDashboardGuard'
import AIAssistantPanel from '../components/student/AIAssistantPanel'
import { useAIAssistantStore } from '../store/aiAssistantStore'

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
  const { isOpen: aiIsOpen, close: aiClose, open: aiOpen } = useAIAssistantStore()

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

  // Define toggle functions before early returns (needed by useEffect below)
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

  // Apply body classes for sidebar state (must be before early returns)
  useEffect(() => {
    document.body.classList.toggle('mini-sidebar', isSidebarCollapsed && !isMobileSidebarOpen)
    document.body.classList.toggle('mobile-menu-open', isMobileSidebarOpen)
  }, [isSidebarCollapsed, isMobileSidebarOpen])

  // Check if user is authenticated
  if (!user) {
    console.log('[MainLayout] No user found, redirecting to login')
    navigate('/login', { replace: true })
    return null
  }

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
        <Header toggleSidebar={toggleSidebar} />
        <div className="main-container">
          <RoleSidebar 
            collapsed={isSidebarCollapsed}
            onCollapse={setIsSidebarCollapsed}
            onMobileClose={closeMobileSidebar}
            isMobileOpen={isMobileSidebarOpen}
          />
          <main 
            className="page-wrapper" 
            role="main"
            id="main-content"
            style={{ 
              marginLeft: isMobileSidebarOpen ? '0' : (isSidebarCollapsed ? '80px' : '280px'),
              transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
              width: isMobileSidebarOpen ? '100%' : `calc(100% - ${isSidebarCollapsed ? 80 : 280}px)`
            }}
          >
            <div className="content">
              <PageHeader showBreadcrumbs={true} />
              <RoleDashboardGuard>
                <Outlet />
              </RoleDashboardGuard>
            </div>
          </main>
        </div>

        {/* AI Assistant — globally visible for all authenticated users */}
        {aiIsOpen && (
          <AIAssistantPanel
            onClose={() => aiClose()}
            userName={user?.name || 'User'}
          />
        )}
        {!aiIsOpen && (
          <button
            onClick={() => aiOpen()}
            className="btn btn-primary rounded-circle position-fixed"
            style={{
              bottom: '30px',
              right: '30px',
              width: '60px',
              height: '60px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}
            title="Open AI Assistant"
          >
            <i className="ti ti-sparkles"></i>
          </button>
        )}

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