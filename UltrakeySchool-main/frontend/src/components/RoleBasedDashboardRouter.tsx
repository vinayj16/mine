import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { getRoleBasedDashboard } from '../utils/permissions'
import { LoadingSpinner, ErrorMessage } from './common/LoadingSpinner'
import '../styles/role-based-dashboard-router.css'

interface RoleBasedDashboardRouterProps {
  children?: React.ReactNode
  loadingComponent?: React.ReactNode
  showLoading?: boolean
}

const RoleBasedDashboardRouter: React.FC<RoleBasedDashboardRouterProps> = ({ 
  children, 
  loadingComponent,
  showLoading = true
}) => {
  const { user, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Enhanced dashboard redirection logic
  useEffect(() => {
    const performRedirect = async () => {
      if (!user || isRedirecting) {
        console.log('[RoleBasedDashboardRouter] No user or already redirecting')
        return
      }

      try {
        setIsRedirecting(true)
        setError(null)

        // Only redirect if user is authenticated and on root path
        if (user && location.pathname === '/') {
          const dashboardPath = getRoleBasedDashboard(user.role)
          console.log('[RoleBasedDashboardRouter] Redirecting to:', dashboardPath, 'for role:', user.role)
          
          if (dashboardPath !== '/') {
            navigate(dashboardPath, { replace: true })
          } else {
            console.log('[RoleBasedDashboardRouter] No dashboard path configured for role:', user.role)
            setError(`No dashboard configured for role: ${user.role}`)
          }
        } else {
          console.log('[RoleBasedDashboardRouter] User not on root path, no redirect needed')
        }
      } catch (err: any) {
        console.error('[RoleBasedDashboardRouter] Error during redirect:', err)
        setError(err.message || 'Failed to redirect to dashboard')
      } finally {
        setIsRedirecting(false)
      }
    }
    
    performRedirect()
  }, [user, location.pathname, navigate])

  // Enhanced loading state
  if (showLoading && (authLoading || isRedirecting)) {
    return (
      <div className="dashboard-router-loading">
        {loadingComponent || (
          <LoadingSpinner 
            message="Determining your dashboard..." 
            fullPage 
            variant="primary" 
          />
        )}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => {
          setError(null)
          window.location.reload()
        }}
        variant="danger"
        icon="ti ti-alert-triangle"
        title="Dashboard Redirect Error"
      />
    )
  }

  // No user state
  if (!user && !authLoading) {
    return (
      <div className="dashboard-router-loading">
        <ErrorMessage 
          message="Please log in to access your dashboard" 
          onRetry={() => window.location.href = '/login'}
          variant="warning"
          icon="ti ti-user-off"
          title="Authentication Required"
        />
      </div>
    )
  }

  return <>{children}</>
}

export default RoleBasedDashboardRouter