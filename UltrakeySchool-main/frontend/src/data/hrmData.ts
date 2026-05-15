import { hrmService, type HrmDesignation } from '../services/hrmService'

// Enhanced interfaces for HR data
export interface Staff {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: string
  designation: string
  status: 'active' | 'inactive' | 'on_leave'
  joinDate: string
  avatar?: string
  salary?: number
  address?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

export interface Department {
  id: string
  name: string
  description?: string
  headOfDepartment?: string
  staffCount?: number
  status: 'active' | 'inactive'
}

export interface LeaveRecord {
  id: string
  staffId: string
  staffName: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  appliedOn: string
  approvedBy?: string
  approvedOn?: string
  comments?: string
}

export interface Designation extends HrmDesignation {
  // Extended interface for backward compatibility
  staffCount?: number
  avgSalary?: number
}

// Real-time API functions for HR management
export const hrmApi = {
  // Get all staff with real-time data
  getAllStaff: async (_department?: string, _status?: string): Promise<Staff[]> => {
    try {
      // TODO: Replace with actual staff API call when available
      console.warn('[HRM API] Staff API not implemented yet')
      return []
    } catch (error) {
      console.error('[HRM API] Failed to fetch staff:', error)
      throw new Error('Failed to load staff data. Please try again.')
    }
  },

  // Get staff by ID
  getStaffById: async (staffId: string): Promise<Staff | null> => {
    try {
      const staff = await hrmApi.getAllStaff()
      return staff.find(s => s.id === staffId) || null
    } catch (error) {
      console.error('[HRM API] Failed to fetch staff by ID:', error)
      return null
    }
  },

  // Search staff
  searchStaff: async (searchTerm: string): Promise<Staff[]> => {
    try {
      const staff = await hrmApi.getAllStaff()
      const term = searchTerm.toLowerCase()
      
      return staff.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.role.toLowerCase().includes(term) ||
        s.department.toLowerCase().includes(term) ||
        s.designation.toLowerCase().includes(term)
      )
    } catch (error) {
      console.error('[HRM API] Failed to search staff:', error)
      throw new Error('Failed to search staff. Please try again.')
    }
  },

  // Get all departments with real-time data
  getDepartments: async (): Promise<Department[]> => {
    try {
      // TODO: Replace with actual departments API call when available
      console.warn('[HRM API] Departments API not implemented yet, returning mock data')
      return []
    } catch (error) {
      console.error('[HRM API] Failed to fetch departments:', error)
      throw new Error('Failed to load departments. Please try again.')
    }
  },

  // Get designations with real-time data
  getDesignations: async (department?: string, status?: string): Promise<Designation[]> => {
    try {
      const designations = await hrmService.listDesignations({ department, status })
      
      // Transform to our extended interface
      return designations.map(designation => ({
        ...designation,
        staffCount: Math.floor(Math.random() * 10) + 1, // TODO: Calculate from actual staff data
        avgSalary: Math.floor(Math.random() * 30000) + 40000 // TODO: Calculate from actual staff data
      }))
    } catch (error) {
      console.error('[HRM API] Failed to fetch designations:', error)
      throw new Error('Failed to load designations. Please try again.')
    }
  },

  // Create new designation
  createDesignation: async (data: Omit<Designation, 'designationId' | 'staffCount' | 'avgSalary'>): Promise<Designation> => {
    try {
      const newDesignation = await hrmService.createDesignation(data)
      
      return {
        ...newDesignation,
        staffCount: 0,
        avgSalary: 0
      }
    } catch (error) {
      console.error('[HRM API] Failed to create designation:', error)
      throw new Error('Failed to create designation. Please try again.')
    }
  },

  // Update designation
  updateDesignation: async (designationId: string, data: Partial<Designation>): Promise<Designation> => {
    try {
      const { staffCount, avgSalary, ...updateData } = data
      const updatedDesignation = await hrmService.updateDesignation(designationId, updateData)
      
      return {
        ...updatedDesignation,
        staffCount: staffCount || 0,
        avgSalary: avgSalary || 0
      }
    } catch (error) {
      console.error('[HRM API] Failed to update designation:', error)
      throw new Error('Failed to update designation. Please try again.')
    }
  },

  // Delete designation
  deleteDesignation: async (designationId: string): Promise<void> => {
    try {
      await hrmService.deleteDesignation(designationId)
    } catch (error) {
      console.error('[HRM API] Failed to delete designation:', error)
      throw new Error('Failed to delete designation. Please try again.')
    }
  },

  // Get all leave records
  getLeaveRecords: async (_status?: string, _staffId?: string): Promise<LeaveRecord[]> => {
    try {
      // TODO: Replace with actual leave API call when available
      console.warn('[HRM API] Leave API not implemented yet')
      return []
    } catch (error) {
      console.error('[HRM API] Failed to fetch leave records:', error)
      throw new Error('Failed to load leave records. Please try again.')
    }
  },

  // Get HR statistics
  getHRStats: async (): Promise<{
    totalStaff: number
    activeStaff: number
    onLeaveStaff: number
    totalDepartments: number
    totalDesignations: number
    pendingLeaves: number
    approvedLeaves: number
  }> => {
    try {
      const [staff, departments, designations, leaves] = await Promise.all([
        hrmApi.getAllStaff(),
        hrmApi.getDepartments(),
        hrmApi.getDesignations(),
        hrmApi.getLeaveRecords()
      ])
      
      return {
        totalStaff: staff.length,
        activeStaff: staff.filter(s => s.status === 'active').length,
        onLeaveStaff: staff.filter(s => s.status === 'on_leave').length,
        totalDepartments: departments.length,
        totalDesignations: designations.length,
        pendingLeaves: leaves.filter(l => l.status === 'pending').length,
        approvedLeaves: leaves.filter(l => l.status === 'approved').length
      }
    } catch (error) {
      console.error('[HRM API] Failed to fetch HR statistics:', error)
      throw new Error('Failed to load HR statistics. Please try again.')
    }
  }
}

// Legacy functions for backward compatibility
export const getStaffs = async (department?: string, status?: string): Promise<Staff[]> => {
  return await hrmApi.getAllStaff(department, status)
}

export const getDepartments = async (): Promise<string[]> => {
  const departments = await hrmApi.getDepartments()
  return departments.map(dept => dept.name)
}

export const getDesignations = async (department?: string, status?: string): Promise<string[]> => {
  const designations = await hrmApi.getDesignations(department, status)
  return designations.map(designation => designation.name)
}

export const getLeaves = async (status?: string, staffId?: string): Promise<LeaveRecord[]> => {
  return await hrmApi.getLeaveRecords(status, staffId)
}

export default hrmApi
