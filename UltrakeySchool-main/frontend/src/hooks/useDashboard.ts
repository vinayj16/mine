/**
 * React Hooks for Dashboard Management with Real-time API Integration
 * Provides easy-to-use hooks for dashboard operations with loading states and error handling
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { dashboardApi, type DashboardAccessEntry, type DashboardKpi, getDashboardPreviewEntry } from '../data/dashboardAccessData'

// Hook for getting dashboard data by role
export const useDashboardData = (role: string) => {
  const [dashboardData, setDashboardData] = useState<DashboardAccessEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    if (!role) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await dashboardApi.getDashboardData(role)
      setDashboardData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const refreshDashboardData = useCallback(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    dashboardData,
    loading,
    error,
    refreshDashboardData
  }
}

// Hook for getting KPIs by role
export const useDashboardKpis = (role: string) => {
  const [kpis, setKpis] = useState<DashboardKpi[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKpis = useCallback(async () => {
    if (!role) return
    
    setLoading(true)
    setError(null)
    
    try {
      const dashboardData = await dashboardApi.getDashboardData(role)
      setKpis(dashboardData?.kpis || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load KPIs'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    fetchKpis()
  }, [fetchKpis])

  const refreshKpis = useCallback(() => {
    fetchKpis()
  }, [fetchKpis])

  return {
    kpis,
    loading,
    error,
    refreshKpis
  }
}

// Hook for dashboard preview entry (legacy support)
export const useDashboardPreviewEntry = (previewId: string) => {
  const [entry, setEntry] = useState<DashboardAccessEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEntry = useCallback(async () => {
    if (!previewId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await getDashboardPreviewEntry(previewId)
      setEntry(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard preview'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [previewId])

  useEffect(() => {
    fetchEntry()
  }, [fetchEntry])

  const refreshEntry = useCallback(() => {
    fetchEntry()
  }, [fetchEntry])

  return {
    entry,
    loading,
    error,
    refreshEntry
  }
}

// Hook for real-time KPI updates (polling)
export const useRealTimeKpis = (role: string, pollInterval: number = 30000) => {
  const { kpis, loading, error, refreshKpis } = useDashboardKpis(role)

  useEffect(() => {
    if (!role) return

    const interval = setInterval(() => {
      refreshKpis()
    }, pollInterval)

    return () => clearInterval(interval)
  }, [role, pollInterval, refreshKpis])

  return {
    kpis,
    loading,
    error,
    refreshKpis
  }
}

// Hook for dashboard statistics
export const useDashboardStats = () => {
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch multiple stats in parallel
      const [
        institutions,
        regions,
        employees,
        revenue,
        books,
        vehicles
      ] = await Promise.all([
        dashboardApi.getInstitutionCount(),
        dashboardApi.getActiveRegions(),
        dashboardApi.getEmployeeCount(),
        dashboardApi.getRevenue(),
        dashboardApi.getBookCount(),
        dashboardApi.getActiveVehiclesCount()
      ])

      setStats({
        institutions,
        regions,
        employees,
        revenue,
        books,
        vehicles
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard stats'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const refreshStats = useCallback(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refreshStats
  }
}

// Combined hook for complete dashboard management
export const useDashboardManagement = (role: string) => {
  const dashboardData = useDashboardData(role)
  const kpis = useDashboardKpis(role)
  const stats = useDashboardStats()

  // Refresh all data
  const refreshAllData = useCallback(() => {
    dashboardData.refreshDashboardData()
    kpis.refreshKpis()
    stats.refreshStats()
  }, [dashboardData.refreshDashboardData, kpis.refreshKpis, stats.refreshStats])

  return {
    // Data
    dashboardData: dashboardData.dashboardData,
    kpis: kpis.kpis,
    stats: stats.stats,
    
    // Loading states
    loading: dashboardData.loading || kpis.loading || stats.loading,
    
    // Errors
    error: dashboardData.error || kpis.error || stats.error,
    
    // Refresh functions
    refreshAllData,
    refreshDashboardData: dashboardData.refreshDashboardData,
    refreshKpis: kpis.refreshKpis,
    refreshStats: stats.refreshStats
  }
}

// Hook for dashboard role switching
export const useDashboardRoleSwitch = () => {
  const [currentRole, setCurrentRole] = useState<string>('')
  const dashboardData = useDashboardData(currentRole)

  const switchRole = useCallback((newRole: string) => {
    setCurrentRole(newRole)
  }, [])

  return {
    currentRole,
    switchRole,
    dashboardData: dashboardData.dashboardData,
    loading: dashboardData.loading,
    error: dashboardData.error,
    refreshDashboardData: dashboardData.refreshDashboardData
  }
}
