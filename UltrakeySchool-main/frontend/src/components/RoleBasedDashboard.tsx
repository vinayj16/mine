import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../store/authStore'
import { apiClient } from '../api/client'
import { LoadingSpinner, ErrorMessage, EmptyState } from './common/LoadingSpinner'
import DashboardCharts from './DashboardCharts'
import AdminAnalytics from './AdminAnalytics'
import '../styles/role-based-dashboard.css'

const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)

  // Fetch dashboard data based on user role
  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch dashboard data based on user role
      const response = await apiClient.get(`/dashboard/${user.role?.toLowerCase()}`)
      
      if (response.data?.success) {
        setDashboardData(response.data.data)
        console.log('Dashboard data loaded:', response.data.data)
      } else {
        setError(response.data?.message || 'Failed to load dashboard data')
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Retry function
  const handleRetry = () => {
    fetchDashboardData()
  }

  // Refresh function
  const handleRefresh = () => {
    if (user) {
      fetchDashboardData()
    }
  }

  // Fetch data on component mount and user changes
  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner 
          message="Loading dashboard..." 
          fullPage 
          variant="primary" 
        />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={handleRetry}
        variant="danger"
        icon="ti ti-alert-circle"
        title="Dashboard Error"
      />
    )
  }

  // No user state
  if (!user) {
    return (
      <EmptyState 
        title="User Not Found"
        message="Please log in to access your dashboard"
        icon={<i className="ti ti-user-off"></i>}
        action={{
          label: "Go to Login",
          onClick: () => window.location.href = '/login'
        }}
      />
    )
  }

  // Render dashboard based on user role
  const renderDashboard = () => {
    const role = user?.role?.toLowerCase()

    switch (role) {
      case 'superadmin':
      case 'super_admin':
        return (
          <div className="role-dashboard">
            <div className="dashboard-header">
              <div className="dashboard-welcome">
                <h1 className="dashboard-title">
                  <i className="ti ti-shield me-2"></i>
                  Super Admin Dashboard
                </h1>
                <p className="dashboard-subtitle">
                  Welcome back, {user?.name}
                </p>
              </div>
              <div className="dashboard-actions">
                <button className="btn btn-outline-primary" onClick={handleRefresh}>
                  <i className="ti ti-refresh me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
            <div className="dashboard-content">
              <AdminAnalytics />
            </div>
          </div>
        )
      
      case 'admin':
        return (
          <div className="role-dashboard">
            <div className="dashboard-header">
              <div className="dashboard-welcome">
                <h1 className="dashboard-title">
                  <i className="ti ti-user-check me-2"></i>
                  Admin Dashboard
                </h1>
                <p className="dashboard-subtitle">
                  Welcome back, {user?.name}
                </p>
              </div>
              <div className="dashboard-actions">
                <button className="btn btn-outline-primary" onClick={handleRefresh}>
                  <i className="ti ti-refresh me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
            <div className="dashboard-content">
              <DashboardCharts />
              {dashboardData && (
                <div className="dashboard-stats">
                  <div className="stats-grid">
                    {Object.entries(dashboardData.stats || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="stat-card">
                        <div className="stat-icon">
                          <i className={`ti ti-${getStatIcon(key)}`}></i>
                        </div>
                        <div className="stat-content">
                          <h3 className="stat-value">{value}</h3>
                          <p className="stat-label">{formatStatLabel(key)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'teacher':
        return (
          <div className="role-dashboard">
            <div className="dashboard-header">
              <div className="dashboard-welcome">
                <h1 className="dashboard-title">
                  <i className="ti ti-chalkboard me-2"></i>
                  Teacher Dashboard
                </h1>
                <p className="dashboard-subtitle">
                  Welcome back, {user?.name}
                </p>
              </div>
              <div className="dashboard-actions">
                <button className="btn btn-outline-primary" onClick={handleRefresh}>
                  <i className="ti ti-refresh me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
            <div className="dashboard-content">
              <DashboardCharts />
              {dashboardData && (
                <div className="dashboard-stats">
                  <div className="stats-grid">
                    {Object.entries(dashboardData.stats || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="stat-card">
                        <div className="stat-icon">
                          <i className={`ti ti-${getStatIcon(key)}`}></i>
                        </div>
                        <div className="stat-content">
                          <h3 className="stat-value">{value}</h3>
                          <p className="stat-label">{formatStatLabel(key)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'student':
        return (
          <div className="role-dashboard">
            <div className="dashboard-header">
              <div className="dashboard-welcome">
                <h1 className="dashboard-title">
                  <i className="ti ti-graduation-cap me-2"></i>
                  Student Dashboard
                </h1>
                <p className="dashboard-subtitle">
                  Welcome back, {user?.name}
                </p>
              </div>
              <div className="dashboard-actions">
                <button className="btn btn-outline-primary" onClick={handleRefresh}>
                  <i className="ti ti-refresh me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
            <div className="dashboard-content">
              <DashboardCharts />
              {dashboardData && (
                <div className="dashboard-stats">
                  <div className="stats-grid">
                    {Object.entries(dashboardData.stats || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="stat-card">
                        <div className="stat-icon">
                          <i className={`ti ti-${getStatIcon(key)}`}></i>
                        </div>
                        <div className="stat-content">
                          <h3 className="stat-value">{value}</h3>
                          <p className="stat-label">{formatStatLabel(key)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'parent':
        return (
          <div className="role-dashboard">
            <div className="dashboard-header">
              <div className="dashboard-welcome">
                <h1 className="dashboard-title">
                  <i className="ti ti-users me-2"></i>
                  Parent Dashboard
                </h1>
                <p className="dashboard-subtitle">
                  Welcome back, {user?.name}
                </p>
              </div>
              <div className="dashboard-actions">
                <button className="btn btn-outline-primary" onClick={handleRefresh}>
                  <i className="ti ti-refresh me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
            <div className="dashboard-content">
              <DashboardCharts />
              {dashboardData && (
                <div className="dashboard-stats">
                  <div className="stats-grid">
                    {Object.entries(dashboardData.stats || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="stat-card">
                        <div className="stat-icon">
                          <i className={`ti ti-${getStatIcon(key)}`}></i>
                        </div>
                        <div className="stat-content">
                          <h3 className="stat-value">{value}</h3>
                          <p className="stat-label">{formatStatLabel(key)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      
       default:
         return (
           <div className="role-dashboard">
             <div className="dashboard-header">
               <div className="dashboard-welcome">
                 <h1 className="dashboard-title">
                   <i className="ti ti-dashboard me-2"></i>
                   Dashboard
                 </h1>
                 <p className="dashboard-subtitle">
                   Welcome back, {user?.name}
                 </p>
               </div>
             </div>
             <div className="dashboard-content">
               <EmptyState 
                 title="Dashboard Not Available"
                 message={`Dashboard is not configured for your role: ${user?.role}`}
                 icon={<i className="ti ti-settings"></i>}
                 action={{
                   label: "Contact Support",
                   onClick: () => window.location.href = '/support'
                 }}
               />
             </div>
           </div>
         )
     }
   }
 // Helper functions
 const getStatIcon = (key: string): string => {
   const iconMap: Record<string, string> = {
     students: 'users',
     teachers: 'chalkboard',
     courses: 'book',
     attendance: 'check',
     grades: 'chart-bar',
     assignments: 'file-text',
     revenue: 'currency-dollar',
     notifications: 'bell',
     events: 'calendar',
     performance: 'trending-up'
   }
   return iconMap[key] || 'chart-bar'
  const formatStatLabel = (key: string): string => {
    return key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }
      
  export default RoleBasedDashboard
