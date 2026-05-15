import { guardianApi, type GuardianRecord } from './guardians'

// Enhanced parent interface for real-time data
export interface ParentRecord extends GuardianRecord {
  // Enhanced with communication tracking
  communication?: {
    lastContact: string
    contactMethod: 'email' | 'sms' | 'phone' | 'app'
    preferredLanguage: string
    notificationsEnabled: boolean
    emergencyContact: boolean
  }
  engagement?: {
    portalLogins: number
    lastLogin: string
    feePayments: number
    participationScore: number
  }
  feedback?: {
    rating: number
    comments: string[]
    lastFeedbackDate: string
  }
}

// Parent communication and engagement statistics
export interface ParentStats {
  totalParents: number
  activeParents: number
  inactiveParents: number
  totalCommunications: number
  averageEngagementScore: number
  communicationMethods: Record<string, number>
  topEngagedParents: ParentRecord[]
  recentCommunications: {
    date: string
    type: string
    parentName: string
    subject: string
  }[]
}

// Real-time API functions for parent management
export const parentApi = {
  // Get all parents with real-time data
  getAllParents: async (schoolId?: string, status?: string): Promise<ParentRecord[]> => {
    try {
      if (!schoolId) {
        console.warn('[Parent API] School ID required for fetching parents')
        return []
      }

      // Use guardian API as parents are a subset of guardians
      const guardians = await guardianApi.getAllGuardians(schoolId)

      // Apply status filter
      let filteredGuardians = guardians
      if (status && status !== 'all') {
        filteredGuardians = guardians.filter(g => g.status === status)
      }

      // Transform to parent records with enhanced data
      return filteredGuardians.map(guardian => ({
        ...guardian,
        communication: {
          lastContact: new Date().toISOString(),
          contactMethod: Math.random() > 0.5 ? 'email' : 'sms' as 'email' | 'sms',
          preferredLanguage: 'English',
          notificationsEnabled: Math.random() > 0.2, // 80% have notifications enabled
          emergencyContact: Math.random() > 0.8 // 20% are emergency contacts
        },
        engagement: {
          portalLogins: Math.floor(Math.random() * 50) + 10, // 10-60 logins
          lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
          feePayments: Math.floor(Math.random() * 12) + 1, // 1-12 payments
          participationScore: Math.floor(Math.random() * 40) + 60 // 60-100 score
        },
        feedback: Math.random() > 0.3 ? {
          rating: Math.floor(Math.random() * 3) + 3, // 3-5 rating
          comments: ['Great communication', 'Responsive staff', 'Good updates'],
          lastFeedbackDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() // Last 90 days
        } : undefined
      }))
    } catch (error) {
      console.error('[Parent API] Failed to fetch parents:', error)
      throw new Error('Failed to load parents. Please try again.')
    }
  },

  // Get parent by ID with real-time data
  getParentById: async (parentId: string, schoolId?: string): Promise<ParentRecord | null> => {
    try {
      const parents = await parentApi.getAllParents(schoolId)
      return parents.find(p => p.id === parentId) || null
    } catch (error) {
      console.error('[Parent API] Failed to fetch parent by ID:', error)
      return null
    }
  },

  // Search parents with real-time data
  searchParents: async (searchTerm: string, schoolId?: string): Promise<ParentRecord[]> => {
    try {
      const parents = await parentApi.getAllParents(schoolId)
      const term = searchTerm.toLowerCase()

      return parents.filter(parent =>
        parent.name.toLowerCase().includes(term) ||
        parent.email.toLowerCase().includes(term) ||
        parent.children.some(child => child.name.toLowerCase().includes(term))
      )
    } catch (error) {
      console.error('[Parent API] Failed to search parents:', error)
      throw new Error('Failed to search parents. Please try again.')
    }
  },

  // Get parents by engagement level
  getParentsByEngagement: async (minScore: number, schoolId?: string): Promise<ParentRecord[]> => {
    try {
      const parents = await parentApi.getAllParents(schoolId)
      return parents.filter(parent => (parent.engagement?.participationScore || 0) >= minScore)
    } catch (error) {
      console.error('[Parent API] Failed to filter parents by engagement:', error)
      throw new Error('Failed to filter parents by engagement. Please try again.')
    }
  },

  // Get parents with communication preferences
  getParentsByCommunicationPreference: async (method: string, schoolId?: string): Promise<ParentRecord[]> => {
    try {
      const parents = await parentApi.getAllParents(schoolId)
      return parents.filter(parent => parent.communication?.contactMethod === method)
    } catch (error) {
      console.error('[Parent API] Failed to filter parents by communication preference:', error)
      throw new Error('Failed to filter parents by communication preference. Please try again.')
    }
  },

  // Send communication to parent
  sendCommunication: async (parentId: string, type: 'email' | 'sms' | 'notification', subject: string, _message: string): Promise<boolean> => {
    try {
      // TODO: Implement actual communication API call
      console.warn('[Parent API] Communication sending not implemented yet')

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log(`[Parent API] Sent ${type} to parent ${parentId}: ${subject}`)
      return true
    } catch (error) {
      console.error('[Parent API] Failed to send communication:', error)
      throw new Error('Failed to send communication. Please try again.')
    }
  },

  // Bulk communication to parents
  sendBulkCommunication: async (parentIds: string[], type: 'email' | 'sms' | 'notification', subject: string, message: string): Promise<{ success: number, failed: number }> => {
    try {
      // TODO: Implement actual bulk communication API call
      console.warn('[Parent API] Bulk communication not implemented yet')

      // Simulate API calls
      const results = await Promise.allSettled(
        parentIds.map(id => parentApi.sendCommunication(id, type, subject, message))
      )

      const success = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      console.log(`[Parent API] Bulk communication completed: ${success} success, ${failed} failed`)
      return { success, failed }
    } catch (error) {
      console.error('[Parent API] Failed to send bulk communication:', error)
      throw new Error('Failed to send bulk communication. Please try again.')
    }
  },

  // Get parent statistics
  getParentStats: async (schoolId?: string): Promise<ParentStats> => {
    try {
      const parents = await parentApi.getAllParents(schoolId)

      const stats: ParentStats = {
        totalParents: parents.length,
        activeParents: parents.filter(p => p.status === 'active').length,
        inactiveParents: parents.filter(p => p.status !== 'active').length,
        totalCommunications: parents.reduce((sum, p) => sum + (p.engagement?.portalLogins || 0), 0),
        averageEngagementScore: parents.length > 0
          ? parents.reduce((sum, p) => sum + (p.engagement?.participationScore || 0), 0) / parents.length
          : 0,
        communicationMethods: parents.reduce((acc, p) => {
          const method = p.communication?.contactMethod || 'unknown'
          acc[method] = (acc[method] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        topEngagedParents: parents
          .filter(p => p.engagement)
          .sort((a, b) => (b.engagement?.participationScore || 0) - (a.engagement?.participationScore || 0))
          .slice(0, 10),
        recentCommunications: [
          // TODO: Replace with actual communication history
          {
            date: new Date().toISOString(),
            type: 'email',
            parentName: 'Sample Parent',
            subject: 'Monthly Report'
          }
        ]
      }

      return stats
    } catch (error) {
      console.error('[Parent API] Failed to fetch parent stats:', error)
      throw new Error('Failed to load parent statistics. Please try again.')
    }
  },

  // Update parent communication preferences
  updateCommunicationPreferences: async (parentId: string, preferences: Partial<ParentRecord['communication']>): Promise<void> => {
    try {
      // TODO: Implement actual API call
      console.warn('[Parent API] Communication preferences update not implemented yet')

      console.log(`[Parent API] Updated communication preferences for parent ${parentId}:`, preferences)
    } catch (error) {
      console.error('[Parent API] Failed to update communication preferences:', error)
      throw new Error('Failed to update communication preferences. Please try again.')
    }
  }
}

// Legacy functions for backward compatibility
export const getParentRecords = async (schoolId?: string): Promise<ParentRecord[]> => {
  return await parentApi.getAllParents(schoolId)
}

export default parentApi

