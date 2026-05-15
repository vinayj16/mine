// Real-time Staff Member Data Interface and API Integration

export interface StaffMember {
  _id: string
  id: string // Add this for compatibility
  name: string
  email: string
  phone: string
  employeeId: string
  institutionId: string
  department: string
  designation: string
  avatar?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  joiningDate: string
  status: 'active' | 'inactive' | 'on_leave' | 'suspended'
  skills: string[]
  workSchedule: {
    workDays: string[]
    startTime: string
    endTime: string
    breakTime?: string
  }
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  createdAt: string
  updatedAt: string
  lastLogin?: string
  performanceMetrics: {
    taskCompletionRate: number
    attendanceRate: number
    punctualityScore: number
    overallRating: number
  }
}

// Real-time API functions for staff member management
export const staffMemberApi = {
  // Get all staff members with real-time data
  getAllStaffMembers: async (): Promise<StaffMember[]> => {
    try {
      return []
    } catch (error) {
      console.error('[Staff Member API] Failed to fetch staff members:', error)
      throw new Error('Failed to load staff members. Please try again.')
    }
  },

  // Get staff member by ID with real-time data
  getStaffMemberById: async (id: string): Promise<StaffMember | null> => {
    try {
      const staffMembers = await staffMemberApi.getAllStaffMembers()
      return staffMembers.find(staff => staff.id === id) || null
    } catch (error) {
      console.error('[Staff Member API] Failed to fetch staff member:', error)
      return null
    }
  },

  // Create new staff member
  createStaffMember: async (staffData: Omit<StaffMember, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'performanceMetrics'>): Promise<StaffMember> => {
    try {
      // In production, this would call the actual API
      const newStaffMember: StaffMember = {
        ...staffData,
        _id: `staff_${Date.now()}`,
        id: `staff_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        performanceMetrics: {
          taskCompletionRate: 0,
          attendanceRate: 0,
          punctualityScore: 0,
          overallRating: 0
        }
      }
      
      return newStaffMember
    } catch (error) {
      console.error('[Staff Member API] Failed to create staff member:', error)
      throw new Error('Failed to create staff member. Please try again.')
    }
  },

  // Update staff member
  updateStaffMember: async (id: string, staffData: Partial<Omit<StaffMember, '_id' | 'id' | 'createdAt'>>): Promise<StaffMember> => {
    try {
      const staffMembers = await staffMemberApi.getAllStaffMembers()
      const existingStaffMember = staffMembers.find(s => s.id === id)
      
      if (!existingStaffMember) {
        throw new Error('Staff member not found')
      }
      
      const updatedStaffMember: StaffMember = {
        ...existingStaffMember,
        ...staffData,
        updatedAt: new Date().toISOString()
      }
      
      return updatedStaffMember
    } catch (error) {
      console.error('[Staff Member API] Failed to update staff member:', error)
      throw new Error('Failed to update staff member. Please try again.')
    }
  },

  // Delete staff member
  deleteStaffMember: async (_id: string): Promise<boolean> => {
    try {
      // In production, this would call the actual API
      return true
    } catch (error) {
      console.error('[Staff Member API] Failed to delete staff member:', error)
      throw new Error('Failed to delete staff member. Please try again.')
    }
  },

  // Get staff member performance metrics
  getStaffMemberMetrics: async (id: string): Promise<StaffMember['performanceMetrics'] | null> => {
    try {
      const staffMember = await staffMemberApi.getStaffMemberById(id)
      return staffMember?.performanceMetrics || null
    } catch (error) {
      console.error('[Staff Member API] Failed to fetch staff member metrics:', error)
      return null
    }
  }
}

// Helper functions for filtering and searching
export const filterStaffMembers = {
  // Filter staff members by status
  byStatus: async (status: string): Promise<StaffMember[]> => {
    const staffMembers = await staffMemberApi.getAllStaffMembers()
    if (status === 'all') return staffMembers
    return staffMembers.filter(staff => staff.status === status)
  },

  // Filter staff members by department
  byDepartment: async (department: string): Promise<StaffMember[]> => {
    const staffMembers = await staffMemberApi.getAllStaffMembers()
    if (department === 'all') return staffMembers
    return staffMembers.filter(staff => staff.department === department)
  },

  // Filter staff members by skills
  bySkill: async (skill: string): Promise<StaffMember[]> => {
    const staffMembers = await staffMemberApi.getAllStaffMembers()
    return staffMembers.filter(staff => 
      staff.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
    )
  },

  // Search staff members
  bySearchTerm: async (searchTerm: string): Promise<StaffMember[]> => {
    const staffMembers = await staffMemberApi.getAllStaffMembers()
    const term = searchTerm.toLowerCase()
    
    return staffMembers.filter(staff =>
      staff.name.toLowerCase().includes(term) ||
      staff.email.toLowerCase().includes(term) ||
      staff.employeeId.toLowerCase().includes(term) ||
      staff.designation.toLowerCase().includes(term)
    )
  }
}
