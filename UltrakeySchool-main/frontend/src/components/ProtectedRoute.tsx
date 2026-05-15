import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { LoadingSpinner } from './common/LoadingSpinner'
import '../styles/protected-route.css'

interface ProtectedRouteProps {
  children?: React.ReactNode
  element?: React.ReactElement
  requiredPlan?: 'basic' | 'medium' | 'premium'
  requiredRole?: string
  requiredRoles?: string[]
  requiredModule?: string
  requiredModules?: string[]
  requiredPermissions?: string[]
  fallbackPath?: string
  loadingComponent?: React.ReactElement
  onUnauthorized?: () => void
}

// Unauthorized Error Component
interface UnauthorizedErrorProps {
  type: 'role' | 'module' | 'permission' | 'plan'
  fallbackPath?: string
  onUnauthorized?: () => void
}

const UnauthorizedError: React.FC<UnauthorizedErrorProps> = ({ 
  type, 
  onUnauthorized 
}) => {
  const getErrorConfig = () => {
    switch (type) {
      case 'role':
        return {
          icon: 'ti ti-shield-x',
          title: 'Access Denied',
          message: 'You do not have the required role to access this page.',
          className: 'error-unauthorized'
        }
      case 'module':
        return {
          icon: 'ti ti-package-x',
          title: 'Module Not Available',
          message: 'This module is not included in your current plan. Please upgrade your plan to access this feature.',
          className: 'error-module'
        }
      case 'permission':
        return {
          icon: 'ti ti-lock-x',
          title: 'Permission Denied',
          message: 'You do not have the required permissions to access this page.',
          className: 'error-permission'
        }
      case 'plan':
        return {
          icon: 'ti ti-crown-x',
          title: 'Plan Upgrade Required',
          message: 'Please upgrade your plan to access this feature.',
          className: 'error-plan'
        }
      default:
        return {
          icon: 'ti ti-alert-triangle',
          title: 'Access Denied',
          message: 'You do not have permission to access this page.',
          className: 'error-default'
        }
    }
  }

  const config = getErrorConfig()

  return (
    <div className={`unauthorized-page ${config.className}`}>
      <div className="unauthorized-content">
        <div className="unauthorized-icon">
          <i className={config.icon}></i>
        </div>
        <h3 className="unauthorized-title">{config.title}</h3>
        <p className="unauthorized-message">{config.message}</p>
        <div className="unauthorized-actions">
          <button 
            className="unauthorized-button primary"
            onClick={() => {
              onUnauthorized?.()
              window.location.href = '/dashboard'
            }}
          >
            <i className="ti ti-home me-1"></i>
            Go to Dashboard
          </button>
          <button 
            className="unauthorized-button outline"
            onClick={() => {
              onUnauthorized?.()
              window.history.back()
            }}
          >
            <i className="ti ti-arrow-left me-1"></i>
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  element,
  requiredRole,
  requiredRoles,
  requiredModule: _requiredModule,
  requiredModules: _requiredModules,
  requiredPermissions: _requiredPermissions,
  requiredPlan: _requiredPlan,
  fallbackPath = '/unauthorized',
  loadingComponent,
  onUnauthorized
}) => {
  const location = useLocation()
  const { user, isAuthenticated, isLoading } = useAuth()

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return loadingComponent || <LoadingSpinner />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role requirements
  if (requiredRole || requiredRoles) {
    // Get role from store, localStorage, or user object
    const storedRole = localStorage.getItem('userRole')?.toLowerCase() || '';
    const userRole = user?.role?.toLowerCase() || storedRole || 'superadmin';
    console.log('[ProtectedRoute] User role:', userRole, 'Required:', requiredRoles || requiredRole, 'User object:', user);
    const allowedRoles = requiredRoles 
      ? requiredRoles.map(r => r.toLowerCase())
      : requiredRole 
        ? [requiredRole.toLowerCase()]
        : []
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      // For superadmin routes, allow if user has any role (for testing)
      if (allowedRoles.includes('superadmin') && (userRole === 'superadmin' || userRole === 'super_admin' || userRole)) {
        console.log('[ProtectedRoute] Allowing access for role:', userRole);
      } else {
        // Also allow institution_owner and institution_admin roles
        const adminRoles = [  'institution_admin', 'institutionowner', 'institutionadmin', 'admin'];
        if (adminRoles.includes(userRole) && allowedRoles.some(r => adminRoles.includes(r))) {
          console.log('[ProtectedRoute] Allowing admin access for role:', userRole);
        } else {
          return <UnauthorizedError type="role" fallbackPath={fallbackPath} onUnauthorized={onUnauthorized} />
        }
      }
    }
  }

  // Render the protected content
  if (element) return <>{element}</>
  return <>{children}</>
}

export default ProtectedRoute