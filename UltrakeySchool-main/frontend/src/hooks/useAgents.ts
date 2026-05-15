/**
 * React Hooks for Agent Management with Real-time API Integration
 * Provides easy-to-use hooks for agent operations with loading states and error handling
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { agentApi, filterAgents, institutionApi, type Agent, type Institution } from '../data/agents'

// Hook for getting all agents with real-time data
export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await agentApi.getAllAgents()
      setAgents(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load agents'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const refreshAgents = useCallback(() => {
    fetchAgents()
  }, [fetchAgents])

  return {
    agents,
    loading,
    error,
    refreshAgents
  }
}

// Hook for getting a single agent by ID
export const useAgent = (id: string) => {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAgent = useCallback(async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await agentApi.getAgentById(id)
      setAgent(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load agent'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAgent()
  }, [fetchAgent])

  const refreshAgent = useCallback(() => {
    fetchAgent()
  }, [fetchAgent])

  return {
    agent,
    loading,
    error,
    refreshAgent
  }
}

// Hook for agent CRUD operations
export const useAgentActions = () => {
  const [loading, setLoading] = useState(false)

  const createAgent = useCallback(async (agentData: Omit<Agent, 'id' | '_id' | 'joinDate' | 'institutionsCreated' | 'institutions' | 'totalRevenue' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true)
    
    try {
      const newAgent = await agentApi.createAgent(agentData)
      toast.success('Agent created successfully!')
      return newAgent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create agent'
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateAgent = useCallback(async (id: string, agentData: Partial<Omit<Agent, 'id' | '_id' | 'joinDate' | 'institutionsCreated' | 'institutions' | 'totalRevenue' | 'createdAt' | 'updatedAt'>>) => {
    setLoading(true)
    
    try {
      const updatedAgent = await agentApi.updateAgent(id, agentData)
      toast.success('Agent updated successfully!')
      return updatedAgent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update agent'
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteAgent = useCallback(async (id: string) => {
    setLoading(true)
    
    try {
      await agentApi.deleteAgent(id)
      toast.success('Agent deleted successfully!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete agent'
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkUpdateStatus = useCallback(async (ids: string[], status: 'Active' | 'Suspended' | 'Inactive') => {
    setLoading(true)
    
    try {
      await agentApi.bulkUpdateStatus(ids, status)
      toast.success(`Agent statuses updated to ${status}!`)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update agent statuses'
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createAgent,
    updateAgent,
    deleteAgent,
    bulkUpdateStatus,
    loading
  }
}

// Hook for filtering and searching agents
export const useAgentFilters = () => {
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filterByStatus = useCallback(async (status: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await filterAgents.byStatus(status)
      setFilteredAgents(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter agents'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const filterByPerformance = useCallback(async (performance: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await filterAgents.byPerformance(performance)
      setFilteredAgents(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter agents'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const searchAgents = useCallback(async (searchTerm: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await filterAgents.bySearchTerm(searchTerm)
      setFilteredAgents(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search agents'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    filteredAgents,
    loading,
    error,
    filterByStatus,
    filterByPerformance,
    searchAgents
  }
}

// Hook for institutions data
export const useInstitutions = () => {
  const [institutions, setInstitutions] = useState<(Institution & { agentName: string; agentId: string })[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInstitutions = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await institutionApi.getAllInstitutions()
      setInstitutions(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load institutions'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInstitutions()
  }, [fetchInstitutions])

  const refreshInstitutions = useCallback(() => {
    fetchInstitutions()
  }, [fetchInstitutions])

  return {
    institutions,
    loading,
    error,
    refreshInstitutions
  }
}

// Combined hook for complete agent management
export const useAgentManagement = () => {
  const agents = useAgents()
  const agentActions = useAgentActions()
  const agentFilters = useAgentFilters()
  const institutions = useInstitutions()

  // Refresh all data after actions
  const refreshAllData = useCallback(() => {
    agents.refreshAgents()
    institutions.refreshInstitutions()
  }, [agents.refreshAgents, institutions.refreshInstitutions])

  return {
    // Data
    agents: agents.agents,
    institutions: institutions.institutions,
    filteredAgents: agentFilters.filteredAgents,
    
    // Loading states
    loading: agents.loading || agentActions.loading || agentFilters.loading || institutions.loading,
    
    // Errors
    error: agents.error || agentFilters.error || institutions.error,
    
    // Actions
    createAgent: agentActions.createAgent,
    updateAgent: agentActions.updateAgent,
    deleteAgent: agentActions.deleteAgent,
    bulkUpdateStatus: agentActions.bulkUpdateStatus,
    
    // Filters
    filterByStatus: agentFilters.filterByStatus,
    filterByPerformance: agentFilters.filterByPerformance,
    searchAgents: agentFilters.searchAgents,
    
    // Refresh
    refreshAllData,
    refreshAgents: agents.refreshAgents,
    refreshInstitutions: institutions.refreshInstitutions
  }
}
