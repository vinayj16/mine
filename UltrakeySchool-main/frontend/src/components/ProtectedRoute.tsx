import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { getRoleBasedDashboard } from '../utils/permissions'
import { LoadingSpinner } from './common/LoadingSpinner'
import '../styles/protected-route.css'

import { isModuleEnabledForPlan } from '../config/modules'

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

const UPGRADE_BASE_URLS: Record<string, string> = {
  superadmin: '/super-admin/institutions',
  institution_admin: '/dashboard/institute-admin/subscription',
  admin: '/dashboard/institute-admin/subscription',
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  element,
  requiredRole,
  requiredRoles,
  requiredModule,
  requiredModules,
  requiredPermissions: _requiredPermissions,
  requiredPlan,
  loadingComponent
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

  // Check plan requirements
  if (requiredPlan && user.role !== 'superadmin') {
    const userPlan = (user as any).plan || localStorage.getItem('userPlan') || 'basic';
    if (!isModuleEnabledForPlan(requiredPlan, userPlan)) {
      const baseUrl = UPGRADE_BASE_URLS[user.role] || '/dashboard/institute-admin/subscription';
      return <Navigate to={baseUrl} state={{ upgradeRequired: true, requiredPlan, message: `This feature requires a ${requiredPlan.toUpperCase()} plan. Please upgrade to continue.` }} replace />
    }
  }

  // Check module-based plan restrictions
  if (requiredModule && user.role !== 'superadmin') {
    const userPlan = (user as any).plan || localStorage.getItem('userPlan') || 'basic';
    if (!isModuleEnabledForPlan(requiredModule, userPlan)) {
      const requiredPlanName = { basic: 'MEDIUM', medium: 'PREMIUM', premium: 'PREMIUM' }[userPlan as string] || 'PREMIUM';
      const baseUrl = UPGRADE_BASE_URLS[user.role] || '/dashboard/institute-admin/subscription';
      return <Navigate to={baseUrl} state={{ upgradeRequired: true, requiredModule, message: `This module requires a ${requiredPlanName} plan. Please upgrade to continue.` }} replace />
    }
  }

  if (requiredModules && user.role !== 'superadmin') {
    const userPlan = (user as any).plan || localStorage.getItem('userPlan') || 'basic';
    for (const mod of requiredModules) {
      if (!isModuleEnabledForPlan(mod, userPlan)) {
        const baseUrl = UPGRADE_BASE_URLS[user.role] || '/dashboard/institute-admin/subscription';
        return <Navigate to={baseUrl} state={{ upgradeRequired: true, requiredModule: mod, message: `One or more features require a higher plan. Please upgrade to continue.` }} replace />
      }
    }
  }

  // Check role requirements
  if (requiredRole || requiredRoles) {
    const storedRole = localStorage.getItem('userRole')?.toLowerCase() || '';
    const userRole = user?.role?.toLowerCase() || storedRole || 'superadmin';

    // Super admin bypasses all role checks
    if (userRole === 'superadmin' || userRole === 'super_admin') {
      if (element) return <>{element}</>
      return <>{children}</>
    }

    const allowedRoles = requiredRoles 
      ? requiredRoles.map(r => r.toLowerCase())
      : requiredRole 
        ? [requiredRole.toLowerCase()]
        : []
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      if (allowedRoles.includes('superadmin')) {
        console.log('[ProtectedRoute] Allowing access for role:', userRole);
      } else {
        const adminRoles = ['institution_admin', 'institutionowner', 'institutionadmin', 'admin'];
        if (adminRoles.includes(userRole) && allowedRoles.some(r => adminRoles.includes(r))) {
          console.log('[ProtectedRoute] Allowing admin access for role:', userRole);
        } else {
          const redirectTo = getRoleBasedDashboard(userRole);
          return <Navigate to={redirectTo} replace />
        }
      }
    }
  }

  if (element) return <>{element}</>
  return <>{children}</>
}

export default ProtectedRoute