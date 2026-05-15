/**
 * React Hooks for HR Management with Real-time API Integration
 * Provides easy-to-use hooks for HR operations with loading states and error handling
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import hrmService, { type HrmStaff as Staff, type HrmDepartment as Department, type HrmDesignation as Designation, type HrmLeaveRecord as LeaveRecord } from '../services/hrmService'

// Hook for getting all staff with real-time data
export const useStaff = (department?: string, status?: string) => {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await hrmService.listStaff({ department, status })
      setStaff(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load staff'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [department, status])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const refreshStaff = useCallback(() => {
    fetchStaff()
  }, [fetchStaff])

  return {
    staff,
    loading,
    error,
    refreshStaff
  }
}

// Hook for getting a single staff member by ID
export const useStaffMember = (staffId: string) => {
  const [staffMember, setStaffMember] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStaffMember = useCallback(async () => {
    if (!staffId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await hrmService.getStaffById(staffId)
      setStaffMember(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load staff member'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [staffId])

  useEffect(() => {
    fetchStaffMember()
  }, [fetchStaffMember])

  const refreshStaffMember = useCallback(() => {
    fetchStaffMember()
  }, [fetchStaffMember])

  return {
    staffMember,
    loading,
    error,
    refreshStaffMember
  }
}

// Hook for staff search
export const useStaffSearch = () => {
  const [searchResults, setSearchResults] = useState<Staff[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchStaff = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const results = await hrmService.listStaff({ search: searchTerm })
      setSearchResults(results)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search staff'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchResults([])
    setError(null)
  }, [])

  return {
    searchResults,
    loading,
    error,
    searchStaff,
    clearSearch
  }
}

// Hook for departments
export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDepartments = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await hrmService.listDepartments()
      setDepartments(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load departments'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const refreshDepartments = useCallback(() => {
    fetchDepartments()
  }, [fetchDepartments])

  return {
    departments,
    loading,
    error,
    refreshDepartments
  }
}

// Hook for designations
export const useDesignations = (department?: string, status?: string) => {
  const [designations, setDesignations] = useState<Designation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDesignations = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await hrmService.listDesignations({ department, status })
      setDesignations(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load designations'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [department, status])

  useEffect(() => {
    fetchDesignations()
  }, [fetchDesignations])

  const refreshDesignations = useCallback(() => {
    fetchDesignations()
  }, [fetchDesignations])

  // Designation CRUD operations
  const createDesignation = useCallback(async (data: Omit<Designation, 'designationId' | 'staffCount' | 'avgSalary'>) => {
    try {
      const newDesignation = await hrmService.createDesignation(data as any)
      setDesignations(prev => [...prev, newDesignation])
      toast.success('Designation created successfully')
      return newDesignation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create designation'
      toast.error(errorMessage)
      throw err
    }
  }, [])

  const updateDesignation = useCallback(async (designationId: string, data: Partial<Designation>) => {
    try {
      const updatedDesignation = await hrmService.updateDesignation(designationId, data as any)
      setDesignations(prev => prev.map(d => d.designationId === designationId ? updatedDesignation : d))
      toast.success('Designation updated successfully')
      return updatedDesignation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update designation'
      toast.error(errorMessage)
      throw err
    }
  }, [])

  const deleteDesignation = useCallback(async (designationId: string) => {
    try {
      await hrmService.deleteDesignation(designationId)
      setDesignations(prev => prev.filter(d => d.designationId !== designationId))
      toast.success('Designation deleted successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete designation'
      toast.error(errorMessage)
      throw err
    }
  }, [])

  return {
    designations,
    loading,
    error,
    refreshDesignations,
    createDesignation,
    updateDesignation,
    deleteDesignation
  }
}

// Hook for leave records
export const useLeaveRecords = (status?: string, staffId?: string) => {
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaveRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await hrmService.listLeaveRecords({ status, staffId })
      setLeaveRecords(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leave records'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [status, staffId])

  useEffect(() => {
    fetchLeaveRecords()
  }, [fetchLeaveRecords])

  const refreshLeaveRecords = useCallback(() => {
    fetchLeaveRecords()
  }, [fetchLeaveRecords])

  return {
    leaveRecords,
    loading,
    error,
    refreshLeaveRecords
  }
}

// Hook for HR statistics
export const useHRStats = () => {
  const [stats, setStats] = useState<{
    totalStaff: number
    activeStaff: number
    onLeaveStaff: number
    totalDepartments: number
    totalDesignations: number
    pendingLeaves: number
    approvedLeaves: number
  }>({
    totalStaff: 0,
    activeStaff: 0,
    onLeaveStaff: 0,
    totalDepartments: 0,
    totalDesignations: 0,
    pendingLeaves: 0,
    approvedLeaves: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await hrmService.getStats()
      setStats(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load HR statistics'
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

// Combined hook for complete HR management
export const useHRManagement = (department?: string, status?: string) => {
  const staff = useStaff(department, status)
  const departments = useDepartments()
  const designations = useDesignations(department, status)
  const leaveRecords = useLeaveRecords(status)
  const stats = useHRStats()

  // Refresh all data
  const refreshAllData = useCallback(() => {
    staff.refreshStaff()
    departments.refreshDepartments()
    designations.refreshDesignations()
    leaveRecords.refreshLeaveRecords()
    stats.refreshStats()
  }, [staff.refreshStaff, departments.refreshDepartments, designations.refreshDesignations, leaveRecords.refreshLeaveRecords, stats.refreshStats])

  return {
    // Data
    staff: staff.staff,
    departments: departments.departments,
    designations: designations.designations,
    leaveRecords: leaveRecords.leaveRecords,
    stats: stats.stats,
    
    // Loading states
    loading: staff.loading || departments.loading || designations.loading || leaveRecords.loading || stats.loading,
    
    // Errors
    error: staff.error || departments.error || designations.error || leaveRecords.error || stats.error,
    
    // Actions
    createDesignation: designations.createDesignation,
    updateDesignation: designations.updateDesignation,
    deleteDesignation: designations.deleteDesignation,
    
    // Refresh
    refreshAllData,
    refreshStaff: staff.refreshStaff,
    refreshDepartments: departments.refreshDepartments,
    refreshDesignations: designations.refreshDesignations,
    refreshLeaveRecords: leaveRecords.refreshLeaveRecords,
    refreshStats: stats.refreshStats
  }
}

// Hook for HR filtering and searching
export const useHRFilters = () => {
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFilter, setCurrentFilter] = useState<{
    department?: string
    status?: string
    searchTerm?: string
  }>({})

  const applyFilter = useCallback(async (filters: {
    department?: string
    status?: string
    searchTerm?: string
  }) => {
    setLoading(true)
    setError(null)
    setCurrentFilter(filters)
    
    try {
      let results: Staff[] = []
      
      if (filters.searchTerm) {
        results = await hrmService.listStaff({ search: filters.searchTerm })
      } else {
        results = await hrmService.listStaff({ department: filters.department, status: filters.status })
      }
      
      setFilteredStaff(results)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter staff'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearFilter = useCallback(() => {
    setCurrentFilter({})
    applyFilter({})
  }, [applyFilter])

  useEffect(() => {
    applyFilter({})
  }, [applyFilter])

  return {
    filteredStaff,
    loading,
    error,
    currentFilter,
    applyFilter,
    clearFilter
  }
}
