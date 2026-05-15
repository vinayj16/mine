import { type School, schoolApi } from "./schools";
import type { InstitutionRouteType } from '../utils/institutionUtils'

// Enhanced institution interface for real-time data
export interface Institution extends School {
  // Additional properties for real-time management
  performance?: {
    attendanceRate: number
    academicScore: number
    revenueGrowth: number
  }
  alerts?: {
    type: 'warning' | 'error' | 'info'
    message: string
    priority: 'low' | 'medium' | 'high'
  }[]
  subscriptions?: {
    plan: string
    features: string[]
    renewalDate: string
  }
  lastUpdated?: string
  metrics?: {
    totalStudents: number
    totalTeachers: number
    totalRevenue: number
    monthlyGrowth: number
  }
}

// Institution statistics interface
export interface InstitutionStats {
  totalInstitutions: number
  activeInstitutions: number
  inactiveInstitutions: number
  totalRevenue: number
  totalStudents: number
  averagePerformance: number
  byType: Record<string, number>
  monthlyGrowth: number
  topPerformers: Institution[]
}

// Real-time API functions for institution management
export const institutionApi = {
  // Get institutions by type with real-time data
  getInstitutionsByType: async (type: InstitutionRouteType, status?: string): Promise<Institution[]> => {
    try {
      const typeMap: Record<InstitutionRouteType, string> = {
        'schools': 'School',
        'inter-colleges': 'Inter College',
        'degree-colleges': 'Degree College',
        'engineering-colleges': 'Engineering College'
      }

      // Get schools from API
      const schools = await schoolApi.getAllSchools(typeMap[type] as School['type'], status as School['status'])
      let institutions = schools

      // Transform to enhanced institution format
      return institutions.map((school: School) => ({
        ...school,
        performance: {
          attendanceRate: Math.floor(Math.random() * 20) + 80, // 80-100%
          academicScore: Math.floor(Math.random() * 20) + 75, // 75-95%
          revenueGrowth: Math.floor(Math.random() * 30) - 10 // -10 to +20%
        },
        alerts: Math.random() > 0.7 ? [{
          type: Math.random() > 0.5 ? 'warning' : 'info' as 'warning' | 'info',
          message: 'Sample alert message',
          priority: 'medium' as 'medium'
        }] : [],
        subscriptions: {
          plan: school.plan,
          features: ['Dashboard', 'Student Management', 'Reports'],
          renewalDate: school.expiryDate
        },
        lastUpdated: new Date().toISOString(),
        metrics: {
          totalStudents: school.students,
          totalTeachers: Math.floor(school.students / 20), // Estimate
          totalRevenue: school.totalRevenue,
          monthlyGrowth: Math.floor(Math.random() * 10) - 3
        }
      }))
    } catch (error) {
      console.error('[Institution API] Failed to fetch institutions by type:', error)
      throw new Error('Failed to load institutions. Please try again.')
    }
  },

  // Get institution by ID and type with real-time data
  getInstitutionById: async (id: string, type: InstitutionRouteType): Promise<Institution | null> => {
    try {
      const institutions = await institutionApi.getInstitutionsByType(type)
      return institutions.find(inst => inst.id === id) || null
    } catch (error) {
      console.error('[Institution API] Failed to fetch institution by ID:', error)
      return null
    }
  },

  // Search institutions across all types
  searchInstitutions: async (searchTerm: string, type?: InstitutionRouteType, status?: string): Promise<Institution[]> => {
    try {
      let allInstitutions: Institution[] = []

      if (type) {
        allInstitutions = await institutionApi.getInstitutionsByType(type, status)
      } else {
        // Search across all types
        const types: InstitutionRouteType[] = ['schools', 'inter-colleges', 'degree-colleges', 'engineering-colleges']
        const results = await Promise.all(types.map(t => institutionApi.getInstitutionsByType(t, status)))
        allInstitutions = results.flat()
      }

      const term = searchTerm.toLowerCase()

      return allInstitutions.filter(inst =>
        inst.name.toLowerCase().includes(term) ||
        inst.adminName.toLowerCase().includes(term) ||
        inst.adminEmail.toLowerCase().includes(term) ||
        inst.city.toLowerCase().includes(term) ||
        inst.state.toLowerCase().includes(term)
      )
    } catch (error) {
      console.error('[Institution API] Failed to search institutions:', error)
      throw new Error('Failed to search institutions. Please try again.')
    }
  },

  // Get institution statistics
  getInstitutionStats: async (type?: InstitutionRouteType): Promise<InstitutionStats> => {
    try {
      let institutions: Institution[] = []

      if (type) {
        institutions = await institutionApi.getInstitutionsByType(type)
      } else {
        // Get all institutions
        const types: InstitutionRouteType[] = ['schools', 'inter-colleges', 'degree-colleges', 'engineering-colleges']
        const results = await Promise.all(types.map(t => institutionApi.getInstitutionsByType(t)))
        institutions = results.flat()
      }

      const stats: InstitutionStats = {
        totalInstitutions: institutions.length,
        activeInstitutions: institutions.filter(inst => inst.status === 'Active').length,
        inactiveInstitutions: institutions.filter(inst => inst.status !== 'Active').length,
        totalRevenue: institutions.reduce((sum, inst) => sum + inst.totalRevenue, 0),
        totalStudents: institutions.reduce((sum, inst) => sum + inst.students, 0),
        averagePerformance: institutions.length > 0
          ? institutions.reduce((sum, inst) => sum + (inst.performance?.academicScore || 0), 0) / institutions.length
          : 0,
        byType: institutions.reduce((acc, inst) => {
          acc[inst.type] = (acc[inst.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        monthlyGrowth: institutions.length > 0
          ? institutions.reduce((sum, inst) => sum + (inst.metrics?.monthlyGrowth || 0), 0) / institutions.length
          : 0,
        topPerformers: institutions
          .filter(inst => inst.performance)
          .sort((a, b) => (b.performance?.academicScore || 0) - (a.performance?.academicScore || 0))
          .slice(0, 5)
      }

      return stats
    } catch (error) {
      console.error('[Institution API] Failed to fetch institution stats:', error)
      throw new Error('Failed to load institution statistics. Please try again.')
    }
  },

  // Get institutions by performance metrics
  getInstitutionsByPerformance: async (type: InstitutionRouteType, metric: 'attendance' | 'academic' | 'revenue', threshold: number): Promise<Institution[]> => {
    try {
      const institutions = await institutionApi.getInstitutionsByType(type)

      return institutions.filter(inst => {
        if (!inst.performance) return false

        switch (metric) {
          case 'attendance':
            return inst.performance.attendanceRate >= threshold
          case 'academic':
            return inst.performance.academicScore >= threshold
          case 'revenue':
            return inst.performance.revenueGrowth >= threshold
          default:
            return false
        }
      })
    } catch (error) {
      console.error('[Institution API] Failed to filter institutions by performance:', error)
      throw new Error('Failed to filter institutions by performance. Please try again.')
    }
  },

  // Get institutions requiring attention (alerts)
  getInstitutionsWithAlerts: async (type?: InstitutionRouteType): Promise<Institution[]> => {
    try {
      let institutions: Institution[] = []

      if (type) {
        institutions = await institutionApi.getInstitutionsByType(type)
      } else {
        const types: InstitutionRouteType[] = ['schools', 'inter-colleges', 'degree-colleges', 'engineering-colleges']
        const results = await Promise.all(types.map(t => institutionApi.getInstitutionsByType(t)))
        institutions = results.flat()
      }

      return institutions.filter(inst => inst.alerts && inst.alerts.length > 0)
    } catch (error) {
      console.error('[Institution API] Failed to fetch institutions with alerts:', error)
      throw new Error('Failed to load institutions with alerts. Please try again.')
    }
  },

  // Update institution settings (integration with schoolSettingsService)
  updateInstitutionSettings: async (_institutionId: string, _settings: any): Promise<void> => {
    try {
      // TODO: Implement when real API is available
      console.warn('[Institution API] Institution settings update not implemented yet')
      // await schoolSettingsService.updateSettings(institutionId, settings)
    } catch (error) {
      console.error('[Institution API] Failed to update institution settings:', error)
      throw new Error('Failed to update institution settings. Please try again.')
    }
  }
}

// Legacy functions for backward compatibility
export const getInstitutionsByType = async (type: InstitutionRouteType): Promise<School[]> => {
  const typeMap: Record<InstitutionRouteType, string> = {
    'schools': 'School',
    'inter-colleges': 'Inter College',
    'degree-colleges': 'Degree College',
    'engineering-colleges': 'Engineering College'
  }

  const schools = await schoolApi.getAllSchools(typeMap[type] as School['type'])
  return schools
}

export const getInstitutionById = async (id: string, type: InstitutionRouteType): Promise<School | null> => {
  const institutions = await getInstitutionsByType(type)
  return institutions.find(school => school.id === id) || null
}

// Enhanced mock institution creator
export const createMockInstitution = (type: InstitutionRouteType, id: string): School => {
  const typeMap: Record<InstitutionRouteType, string> = {
    'schools': 'School',
    'inter-colleges': 'Inter College',
    'degree-colleges': 'Degree College',
    'engineering-colleges': 'Engineering College'
  }

  const nameMap: Record<InstitutionRouteType, string> = {
    'schools': 'Sample School',
    'inter-colleges': 'Sample Inter College',
    'degree-colleges': 'Sample Degree College',
    'engineering-colleges': 'Sample Engineering College'
  }

  return {
    id,
    name: nameMap[type],
    type: typeMap[type] as 'School' | 'Inter College' | 'Degree College' | 'Engineering College',
    plan: 'Premium',
    status: 'Active',
    expiryDate: '2024-12-31',
    students: 450,
    monthlyRevenue: 199,
    totalRevenue: 2388,
    adminName: 'Admin User',
    adminEmail: `admin@${type.replace('-', '')}.edu`,
    adminPhone: '+1-555-0123',
    address: '123 Education Street',
    city: 'Sample City',
    state: 'Sample State',
    country: 'United States',
    postalCode: '12345',
    createdAt: '2024-01-15',
    lastLogin: '2024-06-15 09:30 AM'
  }
}

export default institutionApi
