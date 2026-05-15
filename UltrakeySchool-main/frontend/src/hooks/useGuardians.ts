/**
 * React Hooks for Guardian Management with Real-time API Integration
 * Provides easy-to-use hooks for guardian operations with loading states and error handling
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { guardianApi, type GuardianRecord, type GuardianChildRecord } from '../data/guardians'

// Hook for getting all guardians with real-time data
export const useGuardians = (schoolId?: string, params: any = {}) => {
  const [guardians, setGuardians] = useState<GuardianRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGuardians = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await guardianApi.getAllGuardians(schoolId, params)
      setGuardians(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load guardians'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [schoolId, params])

  useEffect(() => {
    fetchGuardians()
  }, [fetchGuardians])

  const refreshGuardians = useCallback(() => {
    fetchGuardians()
  }, [fetchGuardians])

  return {
    guardians,
    loading,
    error,
    refreshGuardians
  }
}

// Hook for getting a single guardian by ID
export const useGuardian = (guardianId: string, schoolId?: string) => {
  const [guardian, setGuardian] = useState<GuardianRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGuardian = useCallback(async () => {
    if (!guardianId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await guardianApi.getGuardianById(guardianId, schoolId)
      setGuardian(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load guardian'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [guardianId, schoolId])

  useEffect(() => {
    fetchGuardian()
  }, [fetchGuardian])

  const refreshGuardian = useCallback(() => {
    fetchGuardian()
  }, [fetchGuardian])

  return {
    guardian,
    loading,
    error,
    refreshGuardian
  }
}

// Hook for guardian CRUD operations
export const useGuardianActions = () => {
  const [loading, setLoading] = useState(false)

  const searchGuardians = useCallback(async (searchTerm: string, schoolId?: string) => {
    setLoading(true)
    
    try {
      const results = await guardianApi.searchGuardians(searchTerm, schoolId)
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search guardians'
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getGuardiansByStatus = useCallback(async (status: string, schoolId?: string) => {
    setLoading(true)
    
    try {
      const results = await guardianApi.getGuardiansByStatus(status, schoolId)
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter guardians'
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getGuardiansByClass = useCallback(async (classId: string, schoolId?: string) => {
    setLoading(true)
    
    try {
      const results = await guardianApi.getGuardiansByClass(classId, schoolId)
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch guardians by class'
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    searchGuardians,
    getGuardiansByStatus,
    getGuardiansByClass,
    loading
  }
}

// Hook for guardian children
export const useGuardianChildren = (guardianId: string, schoolId?: string) => {
  const [children, setChildren] = useState<GuardianChildRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChildren = useCallback(async () => {
    if (!guardianId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await guardianApi.getGuardianChildren(guardianId, schoolId)
      setChildren(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load guardian children'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [guardianId, schoolId])

  useEffect(() => {
    fetchChildren()
  }, [fetchChildren])

  const refreshChildren = useCallback(() => {
    fetchChildren()
  }, [fetchChildren])

  return {
    children,
    loading,
    error,
    refreshChildren
  }
}

// Hook for guardian statistics
export const useGuardianStats = (schoolId?: string) => {
  const [stats, setStats] = useState<{
    total: number
    active: number
    inactive: number
    suspended: number
    totalChildren: number
  }>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    totalChildren: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await guardianApi.getGuardianStats(schoolId)
      setStats(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load guardian statistics'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [schoolId])

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

// Combined hook for complete guardian management
export const useGuardianManagement = (schoolId?: string) => {
  const guardians = useGuardians(schoolId)
  const guardianActions = useGuardianActions()
  const stats = useGuardianStats(schoolId)

  // Refresh all data
  const refreshAllData = useCallback(() => {
    guardians.refreshGuardians()
    stats.refreshStats()
  }, [guardians.refreshGuardians, stats.refreshStats])

  return {
    // Data
    guardians: guardians.guardians,
    stats: stats.stats,
    
    // Loading states
    loading: guardians.loading || guardianActions.loading || stats.loading,
    
    // Errors
    error: guardians.error || stats.error,
    
    // Actions
    searchGuardians: guardianActions.searchGuardians,
    getGuardiansByStatus: guardianActions.getGuardiansByStatus,
    getGuardiansByClass: guardianActions.getGuardiansByClass,
    
    // Refresh
    refreshAllData,
    refreshGuardians: guardians.refreshGuardians,
    refreshStats: stats.refreshStats
  }
}

// Hook for guardian filtering and searching
export const useGuardianFilters = (schoolId?: string) => {
  const [filteredGuardians, setFilteredGuardians] = useState<GuardianRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFilter, setCurrentFilter] = useState<{
    type: 'all' | 'status' | 'search' | 'class'
    value: string
  }>({ type: 'all', value: '' })

  const applyFilter = useCallback(async (type: 'all' | 'status' | 'search' | 'class', value: string) => {
    setLoading(true)
    setError(null)
    setCurrentFilter({ type, value })
    
    try {
      let results: GuardianRecord[] = []
      
      switch (type) {
        case 'all':
          results = await guardianApi.getAllGuardians(schoolId)
          break
        case 'status':
          results = await guardianApi.getGuardiansByStatus(value, schoolId)
          break
        case 'search':
          results = await guardianApi.searchGuardians(value, schoolId)
          break
        case 'class':
          results = await guardianApi.getGuardiansByClass(value, schoolId)
          break
      }
      
      setFilteredGuardians(results)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter guardians'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [schoolId])

  const clearFilter = useCallback(() => {
    setCurrentFilter({ type: 'all', value: '' })
    applyFilter('all', '')
  }, [applyFilter])

  useEffect(() => {
    applyFilter('all', '')
  }, [applyFilter])

  return {
    filteredGuardians,
    loading,
    error,
    currentFilter,
    applyFilter,
    clearFilter
  }
}
