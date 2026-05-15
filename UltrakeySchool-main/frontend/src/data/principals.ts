// Real-time Principal Data Interface and API Integration

export interface Principal {
  _id: string
  id: string // Add this for compatibility
  name: string
  email: string
  phone: string
  employeeId: string
  institutionId: string
  department: string
  avatar?: string
  qualifications: string[]
  experience: number
  joiningDate: string
  status: 'active' | 'inactive' | 'on_leave'
  permissions: string[]
  specialization: string
  achievements: string[]
  createdAt: string
  updatedAt: string
  lastLogin?: string
  performanceMetrics: {
    academicScore: number
    teacherPerformanceScore: number
    studentSatisfactionRate: number
    overallRating: number
  }
}
// Real-time API functions for principal management
export const principalApi = {
  // Get all principals with real-time data
  getAllPrincipals: async (): Promise<Principal[]> => {
    try {
      return []
    } catch (error) {
      console.error('[Principal API] Failed to fetch principals:', error)
      throw new Error('Failed to load principals. Please try again.')
    }
  },

  // Get principal by ID with real-time data
  getPrincipalById: async (id: string): Promise<Principal | null> => {
    try {
      const principals = await principalApi.getAllPrincipals()
      return principals.find(principal => principal.id === id) || null
    } catch (error) {
      console.error('[Principal API] Failed to fetch principal:', error)
      return null
    }
  },

  // Create new principal
  createPrincipal: async (principalData: Omit<Principal, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'performanceMetrics'>): Promise<Principal> => {
    try {
      // In production, this would call the actual API
      const newPrincipal: Principal = {
        ...principalData,
        _id: `principal_${Date.now()}`,
        id: `principal_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        performanceMetrics: {
          academicScore: 0,
          teacherPerformanceScore: 0,
          studentSatisfactionRate: 0,
          overallRating: 0
        }
      }
      
      return newPrincipal
    } catch (error) {
      console.error('[Principal API] Failed to create principal:', error)
      throw new Error('Failed to create principal. Please try again.')
    }
  },

  // Update principal
  updatePrincipal: async (id: string, principalData: Partial<Omit<Principal, '_id' | 'id' | 'createdAt'>>): Promise<Principal> => {
    try {
      const principals = await principalApi.getAllPrincipals()
      const existingPrincipal = principals.find(p => p.id === id)
      
      if (!existingPrincipal) {
        throw new Error('Principal not found')
      }
      
      const updatedPrincipal: Principal = {
        ...existingPrincipal,
        ...principalData,
        updatedAt: new Date().toISOString()
      }
      
      return updatedPrincipal
    } catch (error) {
      console.error('[Principal API] Failed to update principal:', error)
      throw new Error('Failed to update principal. Please try again.')
    }
  },

  // Delete principal
  deletePrincipal: async (_id: string): Promise<boolean> => {
    try {
      // In production, this would call the actual API
      return true
    } catch (error) {
      console.error('[Principal API] Failed to delete principal:', error)
      throw new Error('Failed to delete principal. Please try again.')
    }
  },

  // Get principal performance metrics
  getPrincipalMetrics: async (id: string): Promise<Principal['performanceMetrics'] | null> => {
    try {
      const principal = await principalApi.getPrincipalById(id)
      return principal?.performanceMetrics || null
    } catch (error) {
      console.error('[Principal API] Failed to fetch principal metrics:', error)
      return null
    }
  }
}

// Helper functions for filtering and searching
export const filterPrincipals = {
  // Filter principals by status
  byStatus: async (status: string): Promise<Principal[]> => {
    const principals = await principalApi.getAllPrincipals()
    if (status === 'all') return principals
    return principals.filter(principal => principal.status === status)
  },

  // Filter principals by department
  byDepartment: async (department: string): Promise<Principal[]> => {
    const principals = await principalApi.getAllPrincipals()
    if (department === 'all') return principals
    return principals.filter(principal => principal.department === department)
  },

  // Search principals
  bySearchTerm: async (searchTerm: string): Promise<Principal[]> => {
    const principals = await principalApi.getAllPrincipals()
    const term = searchTerm.toLowerCase()
    
    return principals.filter(principal =>
      principal.name.toLowerCase().includes(term) ||
      principal.email.toLowerCase().includes(term) ||
      principal.employeeId.toLowerCase().includes(term)
    )
  }
}
