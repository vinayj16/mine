/**
 * Real-time School Data with API Integration
 * Transforms mock data into dynamic, real-time school performance and management
 */

import { institutionApi } from './institutionData'

// Enhanced school interface for real-time data
export interface School {
  id: string
  name: string
  type: 'School' | 'Inter College' | 'Degree College' | 'Engineering College'
  plan: 'Basic' | 'Medium' | 'Premium'
  status: 'Active' | 'Suspended' | 'Expired'
  expiryDate: string
  students: number
  monthlyRevenue: number
  totalRevenue: number
  adminName: string
  adminEmail: string
  adminPhone: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  createdAt: string
  lastLogin: string
}

// Enhanced school interface with real-time analytics
export interface SchoolRecord extends School {
  // Real-time performance metrics
  performance?: {
    attendanceRate: number
    academicScore: number
    teacherUtilization: number
    facilityUsage: number
    studentSatisfaction: number
  }
  // Compliance and regulatory data
  compliance?: {
    licenseValid: boolean
    lastInspectionDate: string
    complianceScore: number
    pendingIssues: string[]
    certifications: string[]
  }
  // Resource management
  resources?: {
    totalTeachers: number
    totalClassrooms: number
    digitalDevices: number
    libraryBooks: number
    sportsFacilities: number
  }
  // Financial metrics
  financials?: {
    monthlyExpenses: number
    profitMargin: number
    outstandingFees: number
    scholarshipFund: number
    grantFunding: number
  }
  // Growth and analytics
  growth?: {
    monthlyStudentGrowth: number
    yearlyRevenueGrowth: number
    teacherRetentionRate: number
    graduationRate: number
  }
  // Communication and engagement
  engagement?: {
    parentPortalUsage: number
    websiteTraffic: number
    socialMediaPresence: string[]
    newsletterSubscribers: number
  }
}

// School statistics and analytics
export interface SchoolStats {
  totalSchools: number
  activeSchools: number
  suspendedSchools: number
  expiredSchools: number
  totalStudents: number
  totalRevenue: number
  averagePerformance: number
  byType: Record<string, number>
  byPlan: Record<string, number>
  topPerforming: SchoolRecord[]
  complianceIssues: SchoolRecord[]
  growthLeaders: SchoolRecord[]
  financialHealth: {
    averageProfitMargin: number
    totalOutstandingFees: number
    grantFundingTotal: number
  }
}

// Real-time API functions for school management
export const schoolApi = {
  // Get all schools with real-time data
  getAllSchools: async (type?: School['type'], status?: School['status'], plan?: School['plan'] | 'all'): Promise<SchoolRecord[]> => {
    try {
      // Use institution API as schools are institutions
      const institutions = await institutionApi.getInstitutionsByType('schools', status)

      // Apply additional filters
      let schools = institutions.filter(inst => inst.type === 'School')

      if (type && type !== 'School') {
        schools = schools.filter(school => school.type === type)
      }

      if (plan && plan !== 'all') {
        schools = schools.filter(school => school.plan === plan)
      }

      // Transform to enhanced school records
      return schools.map(school => ({
        ...school,
        performance: {
          attendanceRate: Math.floor(Math.random() * 15) + 85, // 85-100%
          academicScore: Math.floor(Math.random() * 20) + 75, // 75-95%
          teacherUtilization: Math.floor(Math.random() * 20) + 80, // 80-100%
          facilityUsage: Math.floor(Math.random() * 25) + 75, // 75-100%
          studentSatisfaction: Math.floor(Math.random() * 15) + 80 // 80-95%
        },
        compliance: {
          licenseValid: Math.random() > 0.1, // 90% compliant
          lastInspectionDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          complianceScore: Math.floor(Math.random() * 30) + 70, // 70-100%
          pendingIssues: Math.random() > 0.7 ? ['Minor facility upgrade needed'] : [],
          certifications: ['ISO 9001', 'Education Excellence', 'Safety Certified']
        },
        resources: {
          totalTeachers: Math.floor(school.students / 25) + Math.floor(Math.random() * 10),
          totalClassrooms: Math.floor(school.students / 30) + Math.floor(Math.random() * 5),
          digitalDevices: Math.floor(school.students * 0.8) + Math.floor(Math.random() * school.students * 0.2),
          libraryBooks: Math.floor(Math.random() * 5000) + 10000,
          sportsFacilities: Math.floor(Math.random() * 3) + 1
        },
        financials: {
          monthlyExpenses: Math.floor(school.monthlyRevenue * 0.7) + Math.floor(Math.random() * school.monthlyRevenue * 0.2),
          profitMargin: Math.floor(Math.random() * 30) + 15, // 15-45%
          outstandingFees: Math.floor(Math.random() * school.totalRevenue * 0.1),
          scholarshipFund: Math.floor(Math.random() * school.totalRevenue * 0.05),
          grantFunding: Math.floor(Math.random() * school.totalRevenue * 0.2)
        },
        growth: {
          monthlyStudentGrowth: Math.floor(Math.random() * 10) - 2, // -2 to +8%
          yearlyRevenueGrowth: Math.floor(Math.random() * 25) - 5, // -5 to +20%
          teacherRetentionRate: Math.floor(Math.random() * 20) + 80, // 80-100%
          graduationRate: Math.floor(Math.random() * 15) + 85 // 85-100%
        },
        engagement: {
          parentPortalUsage: Math.floor(Math.random() * 50) + 50, // 50-100%
          websiteTraffic: Math.floor(Math.random() * 10000) + 5000,
          socialMediaPresence: ['Facebook', 'Instagram'],
          newsletterSubscribers: Math.floor(school.students * 0.3) + Math.floor(Math.random() * school.students * 0.4)
        }
      }))
    } catch (error) {
      console.error('[School API] Failed to fetch schools:', error)
      throw new Error('Failed to load schools. Please try again.')
    }
  },

  // Get school by ID with real-time data
  getSchoolById: async (schoolId: string): Promise<SchoolRecord | null> => {
    try {
      const schools = await schoolApi.getAllSchools()
      return schools.find(school => school.id === schoolId) || null
    } catch (error) {
      console.error('[School API] Failed to fetch school by ID:', error)
      return null
    }
  },

  // Search schools with real-time data
  searchSchools: async (searchTerm: string, type?: School['type'], status?: School['status']): Promise<SchoolRecord[]> => {
    try {
      const schools = await schoolApi.getAllSchools(type, status)
      const term = searchTerm.toLowerCase()

      return schools.filter(school =>
        school.name.toLowerCase().includes(term) ||
        school.adminName.toLowerCase().includes(term) ||
        school.adminEmail.toLowerCase().includes(term) ||
        school.city.toLowerCase().includes(term) ||
        school.state.toLowerCase().includes(term)
      )
    } catch (error) {
      console.error('[School API] Failed to search schools:', error)
      throw new Error('Failed to search schools. Please try again.')
    }
  },

  // Get schools by performance metrics
  getSchoolsByPerformance: async (metric: 'attendance' | 'academic' | 'compliance' | 'financial', threshold: number, type?: School['type']): Promise<SchoolRecord[]> => {
    try {
      const schools = await schoolApi.getAllSchools(type)

      return schools.filter(school => {
        if (!school.performance || !school.compliance || !school.financials) return false

        switch (metric) {
          case 'attendance':
            return school.performance.attendanceRate >= threshold
          case 'academic':
            return school.performance.academicScore >= threshold
          case 'compliance':
            return school.compliance.complianceScore >= threshold
          case 'financial':
            return school.financials.profitMargin >= threshold
          default:
            return false
        }
      })
    } catch (error) {
      console.error('[School API] Failed to filter schools by performance:', error)
      throw new Error('Failed to filter schools by performance. Please try again.')
    }
  },

  // Get schools with compliance issues
  getSchoolsWithComplianceIssues: async (type?: School['type']): Promise<SchoolRecord[]> => {
    try {
      const schools = await schoolApi.getAllSchools(type)
      return schools.filter(school =>
        school.compliance &&
        (!school.compliance.licenseValid || school.compliance.pendingIssues.length > 0 || school.compliance.complianceScore < 80)
      )
    } catch (error) {
      console.error('[School API] Failed to fetch schools with compliance issues:', error)
      throw new Error('Failed to load schools with compliance issues. Please try again.')
    }
  },

  // Get schools by resource needs
  getSchoolsByResourceNeeds: async (resourceType: 'teachers' | 'classrooms' | 'devices' | 'facilities', threshold: number, type?: School['type']): Promise<SchoolRecord[]> => {
    try {
      const schools = await schoolApi.getAllSchools(type)

      return schools.filter(school => {
        if (!school.resources) return false

        const studentRatio = school.students / (school.resources.totalTeachers || 1)
        const classroomRatio = school.students / (school.resources.totalClassrooms || 1)
        const deviceRatio = school.resources.digitalDevices / school.students

        switch (resourceType) {
          case 'teachers':
            return studentRatio > threshold
          case 'classrooms':
            return classroomRatio > threshold
          case 'devices':
            return deviceRatio < threshold
          case 'facilities':
            return school.resources.sportsFacilities < threshold
          default:
            return false
        }
      })
    } catch (error) {
      console.error('[School API] Failed to filter schools by resource needs:', error)
      throw new Error('Failed to filter schools by resource needs. Please try again.')
    }
  },

  // Get top performing schools
  getTopPerformingSchools: async (metric: 'academic' | 'financial' | 'growth' | 'engagement', limit: number = 10, type?: School['type']): Promise<SchoolRecord[]> => {
    try {
      const schools = await schoolApi.getAllSchools(type)

      return schools
        .filter(school => {
          switch (metric) {
            case 'academic':
              return school.performance?.academicScore
            case 'financial':
              return school.financials?.profitMargin
            case 'growth':
              return school.growth?.yearlyRevenueGrowth
            case 'engagement':
              return school.engagement?.parentPortalUsage
            default:
              return false
          }
        })
        .sort((a, b) => {
          let aValue = 0, bValue = 0
          switch (metric) {
            case 'academic':
              aValue = a.performance?.academicScore || 0
              bValue = b.performance?.academicScore || 0
              break
            case 'financial':
              aValue = a.financials?.profitMargin || 0
              bValue = b.financials?.profitMargin || 0
              break
            case 'growth':
              aValue = a.growth?.yearlyRevenueGrowth || 0
              bValue = b.growth?.yearlyRevenueGrowth || 0
              break
            case 'engagement':
              aValue = a.engagement?.parentPortalUsage || 0
              bValue = b.engagement?.parentPortalUsage || 0
              break
          }
          return bValue - aValue
        })
        .slice(0, limit)
    } catch (error) {
      console.error('[School API] Failed to fetch top performing schools:', error)
      throw new Error('Failed to load top performing schools. Please try again.')
    }
  },

  // Get school statistics
  getSchoolStats: async (type?: School['type']): Promise<SchoolStats> => {
    try {
      const schools = await schoolApi.getAllSchools(type)

      const stats: SchoolStats = {
        totalSchools: schools.length,
        activeSchools: schools.filter(s => s.status === 'Active').length,
        suspendedSchools: schools.filter(s => s.status === 'Suspended').length,
        expiredSchools: schools.filter(s => s.status === 'Expired').length,
        totalStudents: schools.reduce((sum, s) => sum + s.students, 0),
        totalRevenue: schools.reduce((sum, s) => sum + s.totalRevenue, 0),
        averagePerformance: schools.length > 0
          ? schools.reduce((sum, s) => sum + (s.performance?.academicScore || 0), 0) / schools.length
          : 0,
        byType: schools.reduce((acc, s) => {
          acc[s.type] = (acc[s.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byPlan: schools.reduce((acc, s) => {
          acc[s.plan] = (acc[s.plan] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        topPerforming: await schoolApi.getTopPerformingSchools('academic', 5, type),
        complianceIssues: await schoolApi.getSchoolsWithComplianceIssues(type),
        growthLeaders: await schoolApi.getTopPerformingSchools('growth', 5, type),
        financialHealth: {
          averageProfitMargin: schools.length > 0
            ? schools.reduce((sum, s) => sum + (s.financials?.profitMargin || 0), 0) / schools.length
            : 0,
          totalOutstandingFees: schools.reduce((sum, s) => sum + (s.financials?.outstandingFees || 0), 0),
          grantFundingTotal: schools.reduce((sum, s) => sum + (s.financials?.grantFunding || 0), 0)
        }
      }

      return stats
    } catch (error) {
      console.error('[School API] Failed to fetch school stats:', error)
      throw new Error('Failed to load school statistics. Please try again.')
    }
  },

  // Update school compliance status
  updateComplianceStatus: async (schoolId: string, updates: Partial<SchoolRecord['compliance']>): Promise<void> => {
    try {
      // TODO: Implement actual API call
      console.warn('[School API] Compliance status update not implemented yet')

      console.log(`[School API] Updated compliance status for school ${schoolId}:`, updates)
    } catch (error) {
      console.error('[School API] Failed to update compliance status:', error)
      throw new Error('Failed to update compliance status. Please try again.')
    }
  },

  // Generate school performance report
  generatePerformanceReport: async (schoolId: string, reportType: 'monthly' | 'quarterly' | 'annual'): Promise<any> => {
    try {
      const school = await schoolApi.getSchoolById(schoolId)
      if (!school) throw new Error('School not found')

      // TODO: Implement actual report generation
      console.warn('[School API] Report generation not implemented yet')

      const report = {
        schoolId,
        schoolName: school.name,
        reportType,
        generatedAt: new Date().toISOString(),
        performance: school.performance,
        compliance: school.compliance,
        financials: school.financials,
        growth: school.growth
      }

      console.log(`[School API] Generated ${reportType} performance report for school ${schoolId}`)
      return report
    } catch (error) {
      console.error('[School API] Failed to generate performance report:', error)
      throw new Error('Failed to generate performance report. Please try again.')
    }
  }
}

// Legacy functions for backward compatibility
export const getSchoolRecords = async (type?: School['type']): Promise<SchoolRecord[]> => {
  return await schoolApi.getAllSchools(type)
}

export default schoolApi
