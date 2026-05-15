// Real-time Agent Data Interface and API Integration
// This file now provides type definitions and real API integration

export interface Institution {
  _id: string
  name: string
  type: string
  location: string
  establishedDate: string
  status: 'Active' | 'Inactive' | 'Pending'
  revenue: number
  agentId?: string
  agentName?: string
  createdAt: string
  updatedAt: string
}

export interface Agent {
  _id: string
  id: string // Add this for compatibility
  name: string
  email: string
  phone: string
  status: 'Active' | 'Suspended' | 'Inactive'
  joinDate: string
  lastLogin?: string
  institutionsCreated: number
  institutions: Institution[]
  totalRevenue: number
  commissionRate: number
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  performance: 'Excellent' | 'Good' | 'Average' | 'Poor'
  notes: string
  createdAt: string
  updatedAt: string
  createdBy?: {
    name: string
    email: string
  }
  updatedBy?: {
    name: string
    email: string
  }
}

// Import the real agent service for API integration
import agentService, { type Agent as AgentServiceType } from '../services/agentService'
import institutionService from '../services/institutionService'

// Real-time API functions for agent management
export const agentApi = {
  // Get all agents with real-time data
  getAllAgents: async (): Promise<Agent[]> => {
    try {
      const agents = await agentService.getAll()
      
      // Transform API data to match our interface
      return agents.map((agent: { _id: any; createdAt: any }) => ({
        ...agent,
        id: agent._id,
        joinDate: agent.createdAt,
        institutionsCreated: 0, // Will be populated from institutions API
        institutions: [], // Will be populated from institutions API
        totalRevenue: 0, // Will be calculated from institutions
        lastLogin: undefined // Will be updated from auth service
      }))
    } catch (error) {
      console.error('[Agent API] Failed to fetch agents:', error)
      throw new Error('Failed to load agents. Please try again.')
    }
  },

  // Get agent by ID with real-time data
  getAgentById: async (id: string): Promise<Agent | null> => {
    try {
      const agent = await agentService.getById(id)
      
      return {
        ...agent,
        id: agent._id,
        joinDate: agent.createdAt,
        institutionsCreated: 0,
        institutions: [],
        totalRevenue: 0,
        lastLogin: undefined
      }
    } catch (error) {
      console.error('[Agent API] Failed to fetch agent:', error)
      return null
    }
  },

  // Create new agent
  createAgent: async (agentData: Omit<Agent, 'id' | '_id' | 'joinDate' | 'institutionsCreated' | 'institutions' | 'totalRevenue' | 'createdAt' | 'updatedAt'>): Promise<Agent> => {
    try {
      const newAgent = await agentService.create({
        name: agentData.name,
        email: agentData.email,
        phone: agentData.phone,
        address: agentData.address,
        city: agentData.city,
        state: agentData.state,
        country: agentData.country,
        postalCode: agentData.postalCode,
        commissionRate: agentData.commissionRate,
        status: agentData.status,
        notes: agentData.notes
      })

      return {
        ...newAgent,
        id: newAgent._id,
        joinDate: newAgent.createdAt,
        institutionsCreated: 0,
        institutions: [],
        totalRevenue: 0,
        lastLogin: undefined
      }
    } catch (error) {
      console.error('[Agent API] Failed to create agent:', error)
      throw new Error('Failed to create agent. Please try again.')
    }
  },

  // Update agent
  updateAgent: async (id: string, agentData: Partial<Omit<Agent, 'id' | '_id' | 'joinDate' | 'institutionsCreated' | 'institutions' | 'totalRevenue' | 'createdAt' | 'updatedAt'>>): Promise<Agent> => {
    try {
      const updatedAgent = await agentService.update(id, {
        name: agentData.name,
        email: agentData.email,
        phone: agentData.phone,
        address: agentData.address,
        city: agentData.city,
        state: agentData.state,
        country: agentData.country,
        postalCode: agentData.postalCode,
        commissionRate: agentData.commissionRate,
        status: agentData.status,
        notes: agentData.notes
      })

      return {
        ...updatedAgent,
        id: updatedAgent._id,
        joinDate: updatedAgent.createdAt,
        institutionsCreated: 0,
        institutions: [],
        totalRevenue: 0,
        lastLogin: undefined
      }
    } catch (error) {
      console.error('[Agent API] Failed to update agent:', error)
      throw new Error('Failed to update agent. Please try again.')
    }
  },

  // Delete agent
  deleteAgent: async (id: string): Promise<boolean> => {
    try {
      await agentService.delete(id)
      return true
    } catch (error) {
      console.error('[Agent API] Failed to delete agent:', error)
      throw new Error('Failed to delete agent. Please try again.')
    }
  },

  // Bulk update agent status
  bulkUpdateStatus: async (ids: string[], status: 'Active' | 'Suspended' | 'Inactive'): Promise<boolean> => {
    try {
      await agentService.bulkUpdateStatus(ids, status)
      return true
    } catch (error) {
      console.error('[Agent API] Failed to bulk update agent status:', error)
      throw new Error('Failed to update agent statuses. Please try again.')
    }
  }
}

// Helper functions for filtering and searching (work with real-time data)
export const filterAgents = {
  // Filter agents by status
  byStatus: async (status: string): Promise<Agent[]> => {
    const agents = await agentApi.getAllAgents()
    if (status === 'all') return agents
    return agents.filter(agent => agent.status === status)
  },

  // Filter agents by performance
  byPerformance: async (performance: string): Promise<Agent[]> => {
    const agents = await agentApi.getAllAgents()
    if (performance === 'all') return agents
    return agents.filter(agent => agent.performance === performance)
  },

  // Search agents
  bySearchTerm: async (searchTerm: string): Promise<Agent[]> => {
    const agents = await agentApi.getAllAgents()
    const term = searchTerm.toLowerCase()
    
    return agents.filter(agent =>
      agent.name.toLowerCase().includes(term) ||
      agent.email.toLowerCase().includes(term) ||
      agent.phone.includes(term) ||
      agent.city.toLowerCase().includes(term) ||
      agent.state.toLowerCase().includes(term)
    )
  }
}

// Institution management with real-time data
export const institutionApi = {
  // Get all institutions from all agents
  getAllInstitutions: async (): Promise<(Institution & { agentName: string; agentId: string })[]> => {
    try {
      // Fetch institutions via the real institutions API (paginated)
      const result = await institutionService.getInstitutions({ page: 1, limit: 100 })
      const institutions = result.institutions || []

      return institutions
        .map((inst: any) => ({
          _id: inst._id,
          name: inst.name,
          type: inst.type,
          location: `${inst?.contact?.address?.city || ''}${inst?.contact?.address?.state ? `, ${inst.contact.address.state}` : ''}`.trim() || '—',
          establishedDate: inst.subscription?.startDate || inst.createdAt,
          status: (inst.status || 'Active') as Institution['status'],
          revenue: inst?.subscription?.monthlyCost || 0,
          createdAt: inst.createdAt,
          updatedAt: inst.updatedAt,
          // Fallbacks for UI expectations
          agentId: inst?.agentId || '—',
          agentName: inst?.agentName || '—'
        }))
        .sort((a, b) => new Date(b.establishedDate).getTime() - new Date(a.establishedDate).getTime())
    } catch (error) {
      console.error('[Institution API] Failed to fetch institutions:', error)
      return []
    }
  }
}

// Export types for use in components
export type { AgentServiceType }
