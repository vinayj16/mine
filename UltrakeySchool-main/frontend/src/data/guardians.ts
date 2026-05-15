/**
 * Real-time Guardian Data with API Integration
 * Transforms mock data into dynamic, real-time guardian management
 */

import { guardianService, type GuardianListParams } from '../services/guardianService'

export interface GuardianRecord {
  _id: string
  id: string
  name: string
  addedOn: string
  email: string
  phone: string
  avatar: string
  status: 'active' | 'inactive' | 'suspended'
  children: GuardianChildRecord[]
  createdAt: string
  updatedAt?: string
}

export interface GuardianChildRecord {
  name: string
  classLabel: string
  section: string
  avatar: string
  studentId?: string
  relationship?: {
    type?: string
    isPrimary?: boolean
    isEmergency?: boolean
  }
  isActive?: boolean
}

// Helper function to extract class label from class data
const extractClassLabel = (classData: any): string => {
  if (!classData) return 'Unknown'
  
  if (typeof classData === 'object' && classData.name) {
    return classData.name
  }
  
  if (typeof classData === 'string') {
    return classData
  }
  
  return 'Unknown'
}

// Real-time API functions for guardian management
export const guardianApi = {
  // Get all guardians with real-time data
  getAllGuardians: async (schoolId?: string, params: GuardianListParams = {}): Promise<GuardianRecord[]> => {
    try {
      if (!schoolId) {
        // For demo purposes, return empty array if no schoolId provided
        console.warn('[Guardian API] School ID required for fetching guardians')
        return []
      }

      const response = await guardianService.listForSchool(schoolId, params)
      
      // Transform API data to match our interface
      return response.guardians.map(guardian => ({
        _id: guardian._id,
        id: guardian.guardianId,
        name: `${guardian.firstName} ${guardian.lastName}`,
        addedOn: guardian.createdAt,
        email: guardian.email,
        phone: guardian.phone,
        avatar: guardian.avatar || '/assets/img/parents/default.jpg',
        status: guardian.status || 'active',
        children: guardian.children?.map(child => ({
          name: (child.studentId?.firstName && child.studentId?.lastName) 
            ? `${child.studentId.firstName} ${child.studentId.lastName}`
            : 'Unknown Student',
          classLabel: extractClassLabel(child.studentId?.classId),
          section: 'A', // Default section since it's not in the API
          avatar: child.studentId?.avatar || '/assets/img/students/default.jpg',
          studentId: child.studentId?._id || child.studentId?.studentId,
          relationship: child.relationship,
          isActive: child.isActive
        })) || [],
        createdAt: guardian.createdAt,
        updatedAt: guardian.updatedAt
      }))
    } catch (error) {
      console.error('[Guardian API] Failed to fetch guardians:', error)
      throw new Error('Failed to load guardians. Please try again.')
    }
  },

  // Get guardian by ID with real-time data
  getGuardianById: async (guardianId: string, schoolId?: string): Promise<GuardianRecord | null> => {
    try {
      if (!schoolId) {
        console.warn('[Guardian API] School ID required for fetching guardian')
        return null
      }

      const response = await guardianService.listForSchool(schoolId, { search: guardianId })
      const guardian = response.guardians.find(g => g.guardianId === guardianId || g._id === guardianId)
      
      if (!guardian) return null
      
      return {
        _id: guardian._id,
        id: guardian.guardianId,
        name: `${guardian.firstName} ${guardian.lastName}`,
        addedOn: guardian.createdAt,
        email: guardian.email,
        phone: guardian.phone,
        avatar: guardian.avatar || '/assets/img/parents/default.jpg',
        status: guardian.status || 'active',
        children: guardian.children?.map(child => ({
          name: (child.studentId?.firstName && child.studentId?.lastName) 
            ? `${child.studentId.firstName} ${child.studentId.lastName}`
            : 'Unknown Student',
          classLabel: extractClassLabel(child.studentId?.classId),
          section: 'A', // Default section since it's not in the API
          avatar: child.studentId?.avatar || '/assets/img/students/default.jpg',
          studentId: child.studentId?._id || child.studentId?.studentId,
          relationship: child.relationship,
          isActive: child.isActive
        })) || [],
        createdAt: guardian.createdAt,
        updatedAt: guardian.updatedAt
      }
    } catch (error) {
      console.error('[Guardian API] Failed to fetch guardian:', error)
      return null
    }
  },

  // Filter guardians by status
  getGuardiansByStatus: async (status: string, schoolId?: string): Promise<GuardianRecord[]> => {
    try {
      const response = await guardianService.listForSchool(schoolId!, { status })
      
      return response.guardians.map(guardian => ({
        _id: guardian._id,
        id: guardian.guardianId,
        name: `${guardian.firstName} ${guardian.lastName}`,
        addedOn: guardian.createdAt,
        email: guardian.email,
        phone: guardian.phone,
        avatar: guardian.avatar || '/assets/img/parents/default.jpg',
        status: guardian.status || 'active',
        children: guardian.children?.map(child => ({
          name: (child.studentId?.firstName && child.studentId?.lastName) 
            ? `${child.studentId.firstName} ${child.studentId.lastName}`
            : 'Unknown Student',
          classLabel: extractClassLabel(child.studentId?.classId),
          section: 'A', // Default section since it's not in the API
          avatar: child.studentId?.avatar || '/assets/img/students/default.jpg',
          studentId: child.studentId?._id || child.studentId?.studentId,
          relationship: child.relationship,
          isActive: child.isActive
        })) || [],
        createdAt: guardian.createdAt,
        updatedAt: guardian.updatedAt
      }))
    } catch (error) {
      console.error('[Guardian API] Failed to filter guardians by status:', error)
      throw new Error('Failed to filter guardians. Please try again.')
    }
  },

  // Search guardians
  searchGuardians: async (searchTerm: string, schoolId?: string): Promise<GuardianRecord[]> => {
    try {
      if (!schoolId) {
        console.warn('[Guardian API] School ID required for searching guardians')
        return []
      }

      const response = await guardianService.listForSchool(schoolId, { search: searchTerm })
      
      return response.guardians.map(guardian => ({
        _id: guardian._id,
        id: guardian.guardianId,
        name: `${guardian.firstName} ${guardian.lastName}`,
        addedOn: guardian.createdAt,
        email: guardian.email,
        phone: guardian.phone,
        avatar: guardian.avatar || '/assets/img/parents/default.jpg',
        status: guardian.status || 'active',
        children: guardian.children?.map(child => ({
          name: (child.studentId?.firstName && child.studentId?.lastName) 
            ? `${child.studentId.firstName} ${child.studentId.lastName}`
            : 'Unknown Student',
          classLabel: extractClassLabel(child.studentId?.classId),
          section: 'A', // Default section since it's not in the API
          avatar: child.studentId?.avatar || '/assets/img/students/default.jpg',
          studentId: child.studentId?._id || child.studentId?.studentId,
          relationship: child.relationship,
          isActive: child.isActive
        })) || [],
        createdAt: guardian.createdAt,
        updatedAt: guardian.updatedAt
      }))
    } catch (error) {
      console.error('[Guardian API] Failed to search guardians:', error)
      throw new Error('Failed to search guardians. Please try again.')
    }
  },

  // Get guardian children
  getGuardianChildren: async (guardianId: string, schoolId?: string): Promise<GuardianChildRecord[]> => {
    try {
      const guardian = await guardianApi.getGuardianById(guardianId, schoolId)
      return guardian?.children || []
    } catch (error) {
      console.error('[Guardian API] Failed to fetch guardian children:', error)
      return []
    }
  },

  // Get guardians by class
  getGuardiansByClass: async (classId: string, schoolId?: string): Promise<GuardianRecord[]> => {
    try {
      if (!schoolId) {
        console.warn('[Guardian API] School ID required for fetching guardians by class')
        return []
      }

      const response = await guardianService.listForSchool(schoolId)
      
      // Filter guardians who have children in the specified class
      return response.guardians
        .filter(guardian => 
          guardian.children?.some(child => 
            typeof child.studentId?.classId === 'object' 
              ? child.studentId.classId?._id === classId
              : child.studentId?.classId === classId
          )
        )
        .map(guardian => ({
          _id: guardian._id,
          id: guardian.guardianId,
          name: `${guardian.firstName} ${guardian.lastName}`,
          addedOn: guardian.createdAt,
          email: guardian.email,
          phone: guardian.phone,
          avatar: guardian.avatar || '/assets/img/parents/default.jpg',
          status: guardian.status || 'active',
          children: guardian.children?.map(child => ({
            name: (child.studentId?.firstName && child.studentId?.lastName) 
              ? `${child.studentId.firstName} ${child.studentId.lastName}`
              : 'Unknown Student',
            classLabel: extractClassLabel(child.studentId?.classId),
            section: 'A', // Default section since it's not in the API
            avatar: child.studentId?.avatar || '/assets/img/students/default.jpg',
            studentId: child.studentId?._id || child.studentId?.studentId,
            relationship: child.relationship,
            isActive: child.isActive
          })) || [],
          createdAt: guardian.createdAt,
          updatedAt: guardian.updatedAt
        }))
    } catch (error) {
      console.error('[Guardian API] Failed to fetch guardians by class:', error)
      throw new Error('Failed to fetch guardians by class. Please try again.')
    }
  },

  // Get guardian statistics
  getGuardianStats: async (schoolId?: string): Promise<{
    total: number
    active: number
    inactive: number
    suspended: number
    totalChildren: number
  }> => {
    try {
      if (!schoolId) {
        return {
          total: 0,
          active: 0,
          inactive: 0,
          suspended: 0,
          totalChildren: 0
        }
      }

      const response = await guardianService.listForSchool(schoolId, { limit: 1000 })
      const guardians = response.guardians
      
      const stats = {
        total: guardians.length,
        active: guardians.filter(g => g.status === 'active').length,
        inactive: guardians.filter(g => g.status === 'inactive').length,
        suspended: guardians.filter(g => g.status === 'suspended').length,
        totalChildren: guardians.reduce((total, guardian) => total + (guardian.children?.length || 0), 0)
      }
      
      return stats
    } catch (error) {
      console.error('[Guardian API] Failed to fetch guardian stats:', error)
      throw new Error('Failed to fetch guardian statistics. Please try again.')
    }
  }
}

// Legacy function for backward compatibility
export const getGuardianRecords = async (schoolId?: string): Promise<GuardianRecord[]> => {
  return await guardianApi.getAllGuardians(schoolId)
}

export default guardianApi

