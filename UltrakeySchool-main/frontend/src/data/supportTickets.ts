// Enhanced ticket interfaces
export interface SupportTicket {
  id: string
  subject: string
  description: string
  category: 'technical' | 'billing' | 'academic' | 'general' | 'feature' | 'bug'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
  user: {
    id: string
    name: string
    email: string
    role: string
    avatar: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
    role: string
    avatar: string
  }
  createdAt: string
  updatedAt: string
  dueDate?: string
  resolvedAt?: string
  resolution?: string
  tags: string[]
  attachments: Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
  }>
  comments: Array<{
    id: string
    author: {
      id: string
      name: string
      email: string
      role: string
      avatar: string
    }
    content: string
    createdAt: string
    isInternal: boolean
  }>
  satisfaction?: {
    rating: number
    feedback: string
    submittedAt: string
  }
  metadata: {
    source: 'portal' | 'email' | 'api' | 'phone'
    userAgent?: string
    ipAddress?: string
    browser?: string
    platform?: string
  }
}

export interface TicketStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
  averageResolutionTime: number
  averageResponseTime: number
  satisfactionRating: number
  byCategory: Record<string, number>
  byPriority: Record<string, number>
  byStatus: Record<string, number>
  byAgent: Record<string, number>
  trendingIssues: Array<{
    subject: string
    count: number
    category: string
  }>
}

export interface TicketFilter {
  status?: string[]
  priority?: string[]
  category?: string[]
  assignedTo?: string[]
  dateRange?: {
    start: string
    end: string
  }
  search?: string
}

export interface AgentPerformance {
  agentId: string
  agentName: string
  totalTickets: number
  resolvedTickets: number
  averageResolutionTime: number
  averageResponseTime: number
  satisfactionRating: number
  currentWorkload: number
  efficiency: number
}

// Real-time API functions for ticket management
export const supportTicketApi = {
  // Get all tickets with real-time data
  getAllTickets: async (schoolId?: string, filters?: TicketFilter): Promise<SupportTicket[]> => {
    try {
      if (!schoolId) {
        console.warn('[Support Ticket API] School ID required for fetching tickets')
        return []
      }

      // TODO: Replace with actual API call
      console.warn('[Support Ticket API] Real-time ticket fetch not implemented yet, using enhanced mock data')

      // Apply filters
      let filteredTickets: any[] | PromiseLike<SupportTicket[]> = []
      if (filters?.status && filters.status.length > 0) {
        filteredTickets = filteredTickets.filter(t => filters.status!.includes(t.status))
      }
      if (filters?.priority && filters.priority.length > 0) {
        filteredTickets = filteredTickets.filter(t => filters.priority!.includes(t.priority))
      }
      if (filters?.category && filters.category.length > 0) {
        filteredTickets = filteredTickets.filter(t => filters.category!.includes(t.category))
      }
      if (filters?.assignedTo && filters.assignedTo.length > 0) {
        filteredTickets = filteredTickets.filter(t => t.assignedTo && filters.assignedTo!.includes(t.assignedTo.id))
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase()
        filteredTickets = filteredTickets.filter(t =>
          t.subject.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.user.name.toLowerCase().includes(search) ||
          t.user.email.toLowerCase().includes(search)
        )
      }

      return filteredTickets
    } catch (error) {
      console.error('[Support Ticket API] Failed to fetch tickets:', error)
      throw new Error('Failed to load support tickets. Please try again.')
    }
  },

  // Get ticket by ID
  getTicketById: async (ticketId: string, schoolId?: string): Promise<SupportTicket | null> => {
    try {
      const tickets = await supportTicketApi.getAllTickets(schoolId)
      return tickets.find(t => t.id === ticketId) || null
    } catch (error) {
      console.error('[Support Ticket API] Failed to fetch ticket:', error)
      return null
    }
  },

  // Create new ticket
  createTicket: async (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>, schoolId?: string): Promise<SupportTicket> => {
    try {
      if (!schoolId) {
        console.warn('[Support Ticket API] School ID required for creating ticket')
        throw new Error('School ID required')
      }

      // TODO: Implement actual API call
      console.warn('[Support Ticket API] Ticket creation not implemented yet')

      const newTicket: SupportTicket = {
        ...ticket,
        id: `TCK-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      console.log(`[Support Ticket API] Created ticket ${newTicket.id} for school ${schoolId}`)
      return newTicket
    } catch (error) {
      console.error('[Support Ticket API] Failed to create ticket:', error)
      throw new Error('Failed to create support ticket. Please try again.')
    }
  },

  // Update ticket
  updateTicket: async (ticketId: string, updates: Partial<SupportTicket>, schoolId?: string): Promise<void> => {
    try {
      if (!schoolId) {
        console.warn('[Support Ticket API] School ID required for updating ticket')
        return
      }

      // TODO: Implement actual API call
      console.warn('[Support Ticket API] Ticket update not implemented yet')

      console.log(`[Support Ticket API] Updated ticket ${ticketId}:`, updates)
    } catch (error) {
      console.error('[Support Ticket API] Failed to update ticket:', error)
      throw new Error('Failed to update support ticket. Please try again.')
    }
  },

  // Add comment to ticket
  addComment: async (ticketId: string, comment: Omit<SupportTicket['comments'][0], 'id' | 'createdAt'>, schoolId?: string): Promise<void> => {
    try {
      if (!schoolId) {
        console.warn('[Support Ticket API] School ID required for adding comment')
        return
      }

      // TODO: Implement actual API call
      console.warn('[Support Ticket API] Comment addition not implemented yet')

      console.log(`[Support Ticket API] Added comment to ticket ${ticketId}:`, comment)
    } catch (error) {
      console.error('[Support Ticket API] Failed to add comment:', error)
      throw new Error('Failed to add comment. Please try again.')
    }
  },

  // Assign ticket to agent
  assignTicket: async (ticketId: string, agentId: string, schoolId?: string): Promise<void> => {
    try {
      if (!schoolId) {
        console.warn('[Support Ticket API] School ID required for assigning ticket')
        return
      }

      // TODO: Implement actual API call
      console.warn('[Support Ticket API] Ticket assignment not implemented yet')

      console.log(`[Support Ticket API] Assigned ticket ${ticketId} to agent ${agentId}`)
    } catch (error) {
      console.error('[Support Ticket API] Failed to assign ticket:', error)
      throw new Error('Failed to assign ticket. Please try again.')
    }
  },

  // Resolve ticket
  resolveTicket: async (ticketId: string, resolution: string, schoolId?: string): Promise<void> => {
    try {
      if (!schoolId) {
        console.warn('[Support Ticket API] School ID required for resolving ticket')
        return
      }

      // TODO: Implement actual API call
      console.warn('[Support Ticket API] Ticket resolution not implemented yet')

      console.log(`[Support Ticket API] Resolved ticket ${ticketId} with resolution:`, resolution)
    } catch (error) {
      console.error('[Support Ticket API] Failed to resolve ticket:', error)
      throw new Error('Failed to resolve ticket. Please try again.')
    }
  },

  // Get ticket statistics
  getTicketStats: async (schoolId?: string): Promise<TicketStats> => {
    try {
      const tickets = await supportTicketApi.getAllTickets(schoolId)

      const stats: TicketStats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length,
        averageResolutionTime: 4.5, // hours (mock data)
        averageResponseTime: 1.2, // hours (mock data)
        satisfactionRating: 4.3, // out of 5 (mock data)
        byCategory: tickets.reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byPriority: tickets.reduce((acc, t) => {
          acc[t.priority] = (acc[t.priority] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byStatus: tickets.reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byAgent: tickets.reduce((acc, t) => {
          if (t.assignedTo) {
            acc[t.assignedTo.name] = (acc[t.assignedTo.name] || 0) + 1
          }
          return acc
        }, {} as Record<string, number>),
        trendingIssues: [
          { subject: 'Login issues', count: 15, category: 'technical' },
          { subject: 'Invoice generation', count: 8, category: 'billing' },
          { subject: 'Portal access', count: 6, category: 'technical' }
        ]
      }

      return stats
    } catch (error) {
      console.error('[Support Ticket API] Failed to fetch ticket stats:', error)
      throw new Error('Failed to load ticket statistics. Please try again.')
    }
  },

  // Get agent performance metrics
  getAgentPerformance: async (_schoolId?: string): Promise<AgentPerformance[]> => {
    try {
      // TODO: Implement actual API call
      console.warn('[Support Ticket API] Agent performance not implemented yet')
      return []
    } catch (error) {
      console.error('[Support Ticket API] Failed to fetch agent performance:', error)
      throw new Error('Failed to load agent performance. Please try again.')
    }
  },

  // Search tickets
  searchTickets: async (searchTerm: string, schoolId?: string): Promise<SupportTicket[]> => {
    try {
      return await supportTicketApi.getAllTickets(schoolId, { search: searchTerm })
    } catch (error) {
      console.error('[Support Ticket API] Failed to search tickets:', error)
      throw new Error('Failed to search tickets. Please try again.')
    }
  },

  // Get tickets by user
  getTicketsByUser: async (userId: string, schoolId?: string): Promise<SupportTicket[]> => {
    try {
      const tickets = await supportTicketApi.getAllTickets(schoolId)
      return tickets.filter(t => t.user.id === userId)
    } catch (error) {
      console.error('[Support Ticket API] Failed to fetch user tickets:', error)
      throw new Error('Failed to load user tickets. Please try again.')
    }
  },

  // Get tickets by agent
  getTicketsByAgent: async (agentId: string, schoolId?: string): Promise<SupportTicket[]> => {
    try {
      const tickets = await supportTicketApi.getAllTickets(schoolId)
      return tickets.filter(t => t.assignedTo?.id === agentId)
    } catch (error) {
      console.error('[Support Ticket API] Failed to fetch agent tickets:', error)
      throw new Error('Failed to load agent tickets. Please try again.')
    }
  },

  // Submit satisfaction rating
  submitSatisfaction: async (ticketId: string, rating: number, feedback?: string, schoolId?: string): Promise<void> => {
    try {
      if (!schoolId) {
        console.warn('[Support Ticket API] School ID required for submitting satisfaction')
        return
      }

      // TODO: Implement actual API call
      console.warn('[Support Ticket API] Satisfaction submission not implemented yet')

      console.log(`[Support Ticket API] Submitted satisfaction for ticket ${ticketId}:`, { rating, feedback })
    } catch (error) {
      console.error('[Support Ticket API] Failed to submit satisfaction:', error)
      throw new Error('Failed to submit satisfaction rating. Please try again.')
    }
  }
}

export default supportTicketApi
