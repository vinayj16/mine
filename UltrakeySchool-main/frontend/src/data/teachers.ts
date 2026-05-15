/**
 * Real-time Teacher Data with API Integration
 * Transforms mock data into dynamic, real-time teacher performance and management
 */

// Note: hrmService import removed as it's not exported from hrmData

// Enhanced teacher interfaces
export interface TeacherRecord extends TeacherSummary {
  // Performance metrics
  performance?: {
    studentSatisfaction: number
    classAverage: number
    attendanceRate: number
    punctualityRate: number
    teachingEfficiency: number
    parentFeedback: number
  }
  // Academic achievements
  academics?: {
    qualifications: string[]
    certifications: string[]
    specializations: string[]
    publications: number
    research: string[]
  }
  // Workload
  workload?: {
    totalClasses: number
    totalStudents: number
    weeklyHours: number
    extracurricularActivities: string[]
  }
  // Financial
  financial?: {
    currentSalary: number
    lastIncrement: string
    bonus: number
    deductions: number
  }
}

export interface TeacherProfileData extends TeacherRecord {
  // Enhanced personal information
  personalInfo: {
    gender: string
    bloodGroup: string
    dateOfBirth: string
    maritalStatus: string
    nationality: string
    languages: string[]
    emergencyContact: {
      name: string
      relation: string
      phone: string
    }
  }
  // Professional details
  professional: {
    employeeId: string
    department: string
    designation: string
    experience: number
    previousEmployers: Array<{
      name: string
      period: string
      role: string
    }>
  }
  // Documents and verification
  documents: Array<{
    type: string
    name: string
    url: string
    verified: boolean
    expiryDate?: string
  }>
  // Bank and payroll
  payroll: {
    bankName: string
    accountNumber: string
    ifscCode: string
    panNumber: string
    aadharNumber: string
  }
  // Contact details
  contact: {
    phone: string
    email: string
    address: {
      current: string
      permanent: string
    }
  }
  // Transport and accommodation
  logistics?: {
    transport: {
      route: string
      busNumber: string
      pickupPoint: string
    }
    hostel?: {
      name: string
      room: string
      fee: number
    }
  }
}

// Teacher statistics and analytics
export interface TeacherStats {
  totalTeachers: number
  activeTeachers: number
  inactiveTeachers: number
  averageExperience: number
  averageSatisfaction: number
  averageSalary: number
  bySubject: Record<string, number>
  byDepartment: Record<string, number>
  byExperience: Record<string, number>
  topPerformers: TeacherRecord[]
  attendanceLeaders: TeacherRecord[]
  salaryDistribution: {
    min: number
    max: number
    average: number
  }
}

// Real-time API functions for teacher management
export const teacherApi = {
  // Get all teachers with real-time data
  getAllTeachers: async (schoolId?: string, filters?: {
    subject?: string
    status?: 'Active' | 'Inactive'
    department?: string
  }): Promise<TeacherRecord[]> => {
    try {
      if (!schoolId) {
        console.warn('[Teacher API] School ID required for fetching teachers')
        return []
      }

      // TODO: Replace with actual API call
      console.warn('[Teacher API] Real-time teacher fetch not implemented yet, using enhanced mock data')

      // Enhance existing mock data
      const enhancedTeachers = teacherRecords.map(teacher => ({
        ...teacher,
        performance: {
          studentSatisfaction: Math.floor(Math.random() * 20 + 80), // 80-100
          classAverage: Math.floor(Math.random() * 15 + 75), // 75-90
          attendanceRate: Math.floor(Math.random() * 10 + 90), // 90-100
          punctualityRate: Math.floor(Math.random() * 5 + 95), // 95-100
          teachingEfficiency: Math.floor(Math.random() * 20 + 80), // 80-100
          parentFeedback: Math.floor(Math.random() * 25 + 75) // 75-100
        },
        academics: {
          qualifications: ['B.Ed', 'M.Ed'],
          certifications: ['Teaching Excellence'],
          specializations: [teacher.subject],
          publications: Math.floor(Math.random() * 5),
          research: ['Educational Psychology', 'Pedagogy']
        },
        workload: {
          totalClasses: Math.floor(Math.random() * 8) + 4, // 4-12 classes
          totalStudents: Math.floor(Math.random() * 150) + 50, // 50-200 students
          weeklyHours: Math.floor(Math.random() * 20) + 30, // 30-50 hours
          extracurricularActivities: Math.random() > 0.5 ? ['Sports Coach', 'Drama Club'] : []
        },
        financial: {
          currentSalary: Math.floor(Math.random() * 20000) + 30000, // 30k-50k
          lastIncrement: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          bonus: Math.floor(Math.random() * 5000),
          deductions: Math.floor(Math.random() * 2000)
        }
      }))

      // Apply filters
      let filteredTeachers = enhancedTeachers
      if (filters?.subject) {
        filteredTeachers = filteredTeachers.filter(t => t.subject === filters.subject)
      }
      if (filters?.status) {
        filteredTeachers = filteredTeachers.filter(t => t.status === filters.status)
      }
      if (filters?.department) {
        filteredTeachers = filteredTeachers.filter(t => t.classLabel.includes(filters.department!))
      }

      return filteredTeachers
    } catch (error) {
      console.error('[Teacher API] Failed to fetch teachers:', error)
      throw new Error('Failed to load teachers. Please try again.')
    }
  },

  // Get teacher by ID with full profile
  getTeacherById: async (teacherId: string, schoolId?: string): Promise<TeacherProfile | null> => {
    try {
      const teachers = await teacherApi.getAllTeachers(schoolId)
      const teacher = teachers.find(t => t.id === teacherId)
      if (!teacher) return null

      // Create comprehensive profile
      const profile: TeacherProfileData = {
        ...teacher,
        personalInfo: {
          gender: 'Female',
          bloodGroup: 'O +ve',
          dateOfBirth: '25 Jan 1992',
          maritalStatus: 'Single',
          nationality: 'American',
          languages: ['English', 'Spanish'],
          emergencyContact: {
            name: 'Emergency Contact',
            relation: 'Sibling',
            phone: '+1-555-0123'
          }
        },
        professional: {
          employeeId: teacher.id,
          department: 'Academic',
          designation: 'Senior Teacher',
          experience: Math.floor(Math.random() * 10) + 2, // 2-12 years
          previousEmployers: [
            { name: 'Previous School', period: '2018-2020', role: 'Teacher' }
          ]
        },
        documents: [
          { type: 'Resume', name: 'resume.pdf', url: '/documents/resume.pdf', verified: true },
          { type: 'Teaching Certificate', name: 'certificate.pdf', url: '/documents/cert.pdf', verified: true }
        ],
        payroll: {
          bankName: 'Bank of America',
          accountNumber: '1234567890',
          ifscCode: 'BOFAUS3N',
          panNumber: 'PAN123456',
          aadharNumber: '1234-5678-9012'
        },
        contact: {
          phone: teacher.phone,
          email: teacher.email,
          address: {
            current: '123 Main Street, City, State 12345',
            permanent: '123 Main Street, City, State 12345'
          }
        },
        logistics: {
          transport: {
            route: 'Route A',
            busNumber: 'BUS-001',
            pickupPoint: 'Main Gate'
          },
          hostel: {
            name: 'Teacher Hostel',
            room: 'Room 101',
            fee: 1000
          }
        }
      }

      return profile as unknown as TeacherProfile
    } catch (error) {
      console.error('[Teacher API] Failed to fetch teacher profile:', error)
      return null
    }
  },

  // Get teacher statistics
  getTeacherStats: async (schoolId?: string): Promise<TeacherStats> => {
    try {
      const teachers = await teacherApi.getAllTeachers(schoolId)

      const stats: TeacherStats = {
        totalTeachers: teachers.length,
        activeTeachers: teachers.filter(t => t.status === 'Active').length,
        inactiveTeachers: teachers.filter(t => t.status === 'Inactive').length,
        averageExperience: teachers.length > 0
          ? teachers.reduce((sum, t) => sum + (t.academics?.specializations.length || 0), 0) / teachers.length
          : 0,
        averageSatisfaction: teachers.length > 0
          ? teachers.reduce((sum, t) => sum + (t.performance?.studentSatisfaction || 0), 0) / teachers.length
          : 0,
        averageSalary: teachers.length > 0
          ? teachers.reduce((sum, t) => sum + (t.financial?.currentSalary || 0), 0) / teachers.length
          : 0,
        bySubject: teachers.reduce((acc, t) => {
          acc[t.subject] = (acc[t.subject] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byDepartment: teachers.reduce((acc, t) => {
          const dept = t.classLabel.split(' ')[0]
          acc[dept] = (acc[dept] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byExperience: teachers.reduce((acc, t) => {
          const exp = t.academics?.specializations.length || 0
          const range = exp < 3 ? '0-2' : exp < 5 ? '3-5' : exp < 10 ? '6-10' : '10+'
          acc[range] = (acc[range] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        topPerformers: teachers
          .filter(t => t.performance?.studentSatisfaction)
          .sort((a, b) => (b.performance?.studentSatisfaction || 0) - (a.performance?.studentSatisfaction || 0))
          .slice(0, 10),
        attendanceLeaders: teachers
          .filter(t => t.performance?.attendanceRate)
          .sort((a, b) => (b.performance?.attendanceRate || 0) - (a.performance?.attendanceRate || 0))
          .slice(0, 10),
        salaryDistribution: teachers.length > 0 ? {
          min: Math.min(...teachers.map(t => t.financial?.currentSalary || 0)),
          max: Math.max(...teachers.map(t => t.financial?.currentSalary || 0)),
          average: teachers.reduce((sum, t) => sum + (t.financial?.currentSalary || 0), 0) / teachers.length
        } : { min: 0, max: 0, average: 0 }
      }

      return stats
    } catch (error) {
      console.error('[Teacher API] Failed to fetch teacher stats:', error)
      throw new Error('Failed to load teacher statistics. Please try again.')
    }
  },

  // Get teacher routine
  getTeacherRoutine: async (_teacherId: string, _schoolId?: string): Promise<TeacherRoutineDay[]> => {
    try {
      return teacherRoutine
    } catch (error) {
      console.error('[Teacher API] Failed to fetch teacher routine:', error)
      throw new Error('Failed to load teacher routine. Please try again.')
    }
  },

  // Get teacher attendance
  getTeacherAttendance: async (_teacherId: string, _schoolId?: string): Promise<{
    summary: AttendanceSummaryStat[]
    monthly: AttendanceMatrixRow[]
  }> => {
    try {
      return {
        summary: teacherAttendanceSummary,
        monthly: teacherAttendanceMatrix
      }
    } catch (error) {
      console.error('[Teacher API] Failed to fetch teacher attendance:', error)
      throw new Error('Failed to load teacher attendance. Please try again.')
    }
  },

  // Get teacher salary history
  getTeacherSalaryHistory: async (_teacherId: string, _schoolId?: string): Promise<{
    summary: TeacherSalarySummaryItem[]
    history: TeacherSalaryRecord[]
  }> => {
    try {
      return {
        summary: teacherSalarySummary,
        history: teacherSalaryHistory
      }
    } catch (error) {
      console.error('[Teacher API] Failed to fetch teacher salary history:', error)
      throw new Error('Failed to load teacher salary history. Please try again.')
    }
  },

  // Get teacher library books
  getTeacherLibraryBooks: async (_teacherId: string, _schoolId?: string): Promise<TeacherLibraryBook[]> => {
    try {
      return teacherLibraryBooks
    } catch (error) {
      console.error('[Teacher API] Failed to fetch teacher library books:', error)
      throw new Error('Failed to load teacher library books. Please try again.')
    }
  },

  // Get teacher leave records
  getTeacherLeaveRecords: async (_teacherId: string, _schoolId?: string): Promise<{
    summary: TeacherLeaveSummaryItem[]
    records: TeacherLeaveRecord[]
  }> => {
    try {
      return {
        summary: teacherLeaveSummary,
        records: teacherLeaveRecords
      }
    } catch (error) {
      console.error('[Teacher API] Failed to fetch teacher leave records:', error)
      throw new Error('Failed to load teacher leave records. Please try again.')
    }
  },

  // Update teacher information
  updateTeacher: async (teacherId: string, updates: Partial<TeacherRecord>, schoolId?: string): Promise<void> => {
    try {
      if (!schoolId) {
        console.warn('[Teacher API] School ID required for updating teacher')
        return
      }

      // TODO: Implement actual API call
      console.warn('[Teacher API] Teacher update not implemented yet')

      console.log(`[Teacher API] Updated teacher ${teacherId}:`, updates)
    } catch (error) {
      console.error('[Teacher API] Failed to update teacher:', error)
      throw new Error('Failed to update teacher. Please try again.')
    }
  }
}

// Legacy interfaces and data for backward compatibility
export type TeacherSummary = {
  id: string
  name: string
  classLabel: string
  subject: string
  email: string
  phone: string
  status: 'Active' | 'Inactive'
  joinedOn: string
  avatar: string
}

export const teacherRecords: TeacherSummary[] = [
  {
    id: 'T849127',
    name: 'Teresa',
    classLabel: 'III A',
    subject: 'Physics',
    email: 'teresa@example.com',
    phone: '+1 82392 37359',
    status: 'Active',
    joinedOn: '25 Mar 2024',
    avatar: '/assets/img/teachers/teacher-01.jpg',
  },
  {
    id: 'T849126',
    name: 'Daniel',
    classLabel: 'II (A)',
    subject: 'Computer',
    email: 'daniel@example.com',
    phone: '+1 56752 86742',
    status: 'Active',
    joinedOn: '28 Mar 2024',
    avatar: '/assets/img/teachers/teacher-02.jpg',
  },
  {
    id: 'T849125',
    name: 'Hellana',
    classLabel: 'VI (A)',
    subject: 'English',
    email: 'hellana@example.com',
    phone: '+1 23566 52683',
    status: 'Inactive',
    joinedOn: '11 Apr 2024',
    avatar: '/assets/img/teachers/teacher-03.jpg',
  },
  {
    id: 'T849124',
    name: 'Erickson',
    classLabel: 'VI (B), V (A)',
    subject: 'Mathematics',
    email: 'erickson@example.com',
    phone: '+1 65442 76533',
    status: 'Active',
    joinedOn: '19 Apr 2024',
    avatar: '/assets/img/teachers/teacher-04.jpg',
  },
  {
    id: 'T849123',
    name: 'Morgan',
    classLabel: 'III (B)',
    subject: 'History',
    email: 'morgan@example.com',
    phone: '+1 12345 98765',
    status: 'Active',
    joinedOn: '02 May 2024',
    avatar: '/assets/img/teachers/teacher-05.jpg',
  },
  {
    id: 'T849122',
    name: 'Rosie',
    classLabel: 'IV (C)',
    subject: 'Science',
    email: 'rosie@example.com',
    phone: '+1 98765 54321',
    status: 'Active',
    joinedOn: '18 May 2024',
    avatar: '/assets/img/teachers/teacher-06.jpg',
  },
]

// Legacy TeacherProfile interface for backward compatibility
export type TeacherProfile = {
  id: string
  name: string
  joinedOn: string
  avatar: string
  basicInfo: { label: string; value: string }[]
  contact: { phone: string; email: string; address: { current: string; permanent: string } }
  panNumber: string
  hostel: { name: string; room: string }
  transport: { route: string; busNumber: string; pickupPoint: string }
  profileDetails: { label: string; value: string }[]
  documents: Array<{ type: string; name: string; url: string; verified: boolean; expiryDate?: string }>
  addresses: { current: string; permanent: string }
  previousSchool: { name: string; address: string; phone: string }
  bank: { name: string; branch: string; ifsc: string }
  work: { contractType: string; shift: string; location: string }
  socialLinks: { label: string; value: string }[]
}

export const teacherProfile: TeacherProfile = {
  id: 'T849127',
  name: 'Teresa',
  joinedOn: '25 May 2024',
  avatar: '/assets/img/teachers/teacher-01.jpg',
  basicInfo: [
    { label: 'Class & Section', value: 'III, A' },
    { label: 'Subject', value: 'Physics' },
    { label: 'Gender', value: 'Female' },
    { label: 'Blood Group', value: 'O +ve' },
    { label: 'House', value: 'Red' },
    { label: 'Language Known', value: 'English' },
    { label: 'Languages', value: 'English, Spanish' },
  ],
  contact: {
    phone: '+1 46548 84498',
    email: 'teresa@example.com',
    address: {
      current: '3495 Red Hawk Road, Buffalo Lake, MN 55314',
      permanent: '3495 Red Hawk Road, Buffalo Lake, MN 55314'
    }
  },
  panNumber: '343445954908',
  hostel: {
    name: 'HI-Hostel, Floor',
    room: 'Room No : 25',
  },
  transport: {
    route: 'Newyork',
    busNumber: 'AM 54548',
    pickupPoint: 'Cincinatti',
  },
  profileDetails: [
    { label: 'Father\'s Name', value: 'Francis Saviour' },
    { label: 'Mother Name', value: 'Stella Bruce' },
    { label: 'DOB', value: '25 Jan 1992' },
    { label: 'Marital Status', value: 'Single' },
    { label: 'Qualification', value: 'MBA' },
    { label: 'Experience', value: '2 Years' },
  ],
  documents: [
    { type: 'Resume', name: 'resume.pdf', url: '/documents/resume.pdf', verified: true },
    { type: 'Teaching Certificate', name: 'certificate.pdf', url: '/documents/cert.pdf', verified: true }
  ],
  addresses: {
    current: '3495 Red Hawk Road, Buffalo Lake, MN 55314',
    permanent: '3495 Red Hawk Road, Buffalo Lake, MN 55314',
  },
  previousSchool: {
    name: 'Oxford Matriculation, USA',
    address: '1852 Barnes Avenue, Cincinnati, OH 45202',
    phone: '+1 35676 45556',
  },
  bank: {
    name: 'Bank of America',
    branch: 'Cincinnati',
    ifsc: 'BOA83209832',
  },
  work: {
    contractType: 'Permanent',
    shift: 'Morning',
    location: '2nd Floor',
  },
  socialLinks: [
    { label: 'Facebook', value: 'www.facebook.com' },
    { label: 'Twitter', value: 'www.twitter.com' },
    { label: 'LinkedIn', value: 'www.linkedin.com' },
    { label: 'YouTube', value: 'www.youtube.com' },
    { label: 'Instagram', value: 'www.instagram.com' },
  ],
}

export type TeacherRoutineDay = {
  day: string
  sessions: {
    room: string
    classLabel: string
    subject: string
    time: string
  }[]
}

export const teacherRoutine: TeacherRoutineDay[] = [
  {
    day: 'Monday',
    sessions: [
      { room: 'Room No : 104', classLabel: 'Class : III, A', subject: 'Subject : Spanish', time: '09:45 - 10:30 AM' },
      { room: 'Room No : 104', classLabel: 'Class : III, A', subject: 'Subject : Spanish', time: '11:30 - 12:15 AM' },
      { room: 'Room No : 108', classLabel: 'Class : IV, B', subject: 'Subject : Spanish', time: '02:15 - 03:00 PM' },
    ],
  },
  {
    day: 'Tuesday',
    sessions: [
      { room: 'Room No : 104', classLabel: 'Class : III, A', subject: 'Subject : Spanish', time: '09:45 - 10:30 AM' },
      { room: 'Room No : 106', classLabel: 'Class : IV, A', subject: 'Subject : English', time: '10:45 - 11:30 AM' },
      { room: 'Room No : 108', classLabel: 'Class : I, A', subject: 'Subject : Spanish', time: '03:15 - 04:00 PM' },
    ],
  },
  {
    day: 'Wednesday',
    sessions: [
      { room: 'Room No : 104', classLabel: 'Class : III, A', subject: 'Subject : Spanish', time: '09:45 - 10:30 AM' },
      { room: 'Room No : 107', classLabel: 'Class : V, A', subject: 'Subject : English', time: '11:30 - 12:15 AM' },
      { room: 'Room No : 108', classLabel: 'Class : IV, B', subject: 'Subject : Spanish', time: '02:15 - 03:00 PM' },
    ],
  },
  {
    day: 'Thursday',
    sessions: [
      { room: 'Room No : 104', classLabel: 'Class : III, A', subject: 'Subject : Spanish', time: '09:45 - 10:30 AM' },
      { room: 'Room No : 106', classLabel: 'Class : IV, A', subject: 'Subject : English', time: '10:45 - 11:30 AM' },
      { room: 'Room No : 108', classLabel: 'Class : I, A', subject: 'Subject : Spanish', time: '03:15 - 04:00 PM' },
    ],
  },
  {
    day: 'Friday',
    sessions: [
      { room: 'Room No : 104', classLabel: 'Class : III, A', subject: 'Subject : Spanish', time: '09:45 - 10:30 AM' },
      { room: 'Room No : 107', classLabel: 'Class : V, A', subject: 'Subject : English', time: '11:30 - 12:15 AM' },
      { room: 'Room No : 106', classLabel: 'Class : IV, A', subject: 'Subject : English', time: '02:15 - 03:00 PM' },
    ],
  },
]

export type TeacherLeaveSummaryItem = {
  label: string
  total: number
  used: number
  available: number
}

export type TeacherLeaveRecord = {
  type: string
  dateRange: string
  days: number
  appliedOn: string
  status: 'Approved' | 'Pending' | 'Rejected'
}

export const teacherLeaveSummary: TeacherLeaveSummaryItem[] = [
  { label: 'Medical Leave', total: 10, used: 5, available: 5 },
  { label: 'Casual Leave', total: 12, used: 1, available: 11 },
  { label: 'Maternity Leave', total: 10, used: 0, available: 10 },
  { label: 'Paternity Leave', total: 0, used: 0, available: 0 },
]

export const teacherLeaveRecords: TeacherLeaveRecord[] = [
  { type: 'Medical Leave', dateRange: '05 May 2024 - 09 May 2024', days: 5, appliedOn: '05 May 2024', status: 'Approved' },
  { type: 'Casual Leave', dateRange: '07 May 2024 - 07 May 2024', days: 1, appliedOn: '07 May 2024', status: 'Approved' },
  { type: 'Special Leave', dateRange: '09 May 2024 - 09 May 2024', days: 1, appliedOn: '09 May 2024', status: 'Pending' },
  { type: 'Casual Leave', dateRange: '08 May 2024 - 08 May 2024', days: 1, appliedOn: '04 May 2024', status: 'Approved' },
  { type: 'Medical Leave', dateRange: '08 May 2024 - 11 May 2024', days: 4, appliedOn: '08 May 2024', status: 'Pending' },
  { type: 'Casual Leave', dateRange: '20 May 2024 - 20 May 2024', days: 1, appliedOn: '19 May 2024', status: 'Pending' },
]

export type AttendanceSummaryStat = {
  label: string
  value: string
  icon: string
  color: 'primary' | 'danger' | 'info' | 'warning'
}

export const teacherAttendanceSummary: AttendanceSummaryStat[] = [
  { label: 'Total Present', value: '265', icon: 'ti ti-user-check', color: 'primary' },
  { label: 'Total Absent', value: '05', icon: 'ti ti-user-x', color: 'danger' },
  { label: 'Half Day', value: '01', icon: 'ti ti-calendar-event', color: 'info' },
  { label: 'Late', value: '12', icon: 'ti ti-clock-x', color: 'warning' },
]

export const teacherAttendanceMonths = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']

export type AttendanceMatrixRow = {
  day: string
  months: Record<(typeof teacherAttendanceMonths)[number], 'present' | 'absent' | 'late' | 'half' | 'holiday' | ''>
}

export const teacherAttendanceMatrix: AttendanceMatrixRow[] = [
  {
    day: '01',
    months: { Jun: 'present', Jul: 'present', Aug: 'present', Sep: 'present', Oct: 'present', Nov: 'present', Dec: 'present', Jan: 'present', Feb: 'present', Mar: '', Apr: '', May: '' },
  },
  {
    day: '02',
    months: { Jun: 'present', Jul: 'present', Aug: 'present', Sep: 'present', Oct: 'present', Nov: 'present', Dec: 'present', Jan: 'present', Feb: 'present', Mar: '', Apr: '', May: '' },
  },
  {
    day: '03',
    months: { Jun: 'present', Jul: 'absent', Aug: 'present', Sep: 'present', Oct: 'present', Nov: 'present', Dec: 'present', Jan: 'present', Feb: 'absent', Mar: '', Apr: '', May: '' },
  },
  {
    day: '04',
    months: { Jun: 'present', Jul: 'present', Aug: 'present', Sep: 'present', Oct: 'present', Nov: 'present', Dec: 'present', Jan: 'present', Feb: 'present', Mar: '', Apr: '', May: '' },
  },
  {
    day: '05',
    months: { Jun: 'present', Jul: 'late', Aug: 'present', Sep: 'present', Oct: 'present', Nov: 'present', Dec: 'present', Jan: 'present', Feb: 'present', Mar: '', Apr: '', May: '' },
  },
]

export type TeacherSalarySummaryItem = {
  label: string
  value: string
  icon: string
  color: 'secondary' | 'success' | 'warning'
}

export const teacherSalarySummary: TeacherSalarySummaryItem[] = [
  { label: 'Total Net Salary', value: '$5,55,410', icon: 'ti ti-user-dollar', color: 'secondary' },
  { label: 'Total Gross Salary', value: '$5,58,380', icon: 'ti ti-moneybag', color: 'success' },
  { label: 'Total Deduction', value: '$2,500', icon: 'ti ti-arrow-big-down-lines', color: 'warning' },
]

export type TeacherSalaryRecord = {
  id: string
  period: string
  paymentDate: string
  method: string
  netSalary: string
}

export const teacherSalaryHistory: TeacherSalaryRecord[] = [
  { id: '8198', period: 'Apr - 2024', paymentDate: '04 May 2024', method: 'Cash', netSalary: '$20,000' },
  { id: '8197', period: 'Mar - 2024', paymentDate: '05 Apr 2024', method: 'Cheque', netSalary: '$19,000' },
  { id: '8196', period: 'Feb - 2024', paymentDate: '05 Mar 2024', method: 'Cash', netSalary: '$19,500' },
  { id: '8195', period: 'Jan - 2024', paymentDate: '06 Feb 2024', method: 'Cash', netSalary: '$20,000' },
  { id: '8194', period: 'Dec - 2023', paymentDate: '03 Jan 2024', method: 'Cheque', netSalary: '$19,480' },
  { id: '8193', period: 'Nov - 2023', paymentDate: '05 Dec 2023', method: 'Cheque', netSalary: '$19,480' },
  { id: '8192', period: 'Oct - 2023', paymentDate: '03 Nov 2023', method: 'Cheque', netSalary: '$19,480' },
  { id: '8191', period: 'Sep - 2023', paymentDate: '04 Oct 2023', method: 'Cheque', netSalary: '$18,000' },
  { id: '8190', period: 'Aug - 2023', paymentDate: '06 Sep 2023', method: 'Cheque', netSalary: '$20,000' },
]

export type TeacherLibraryBook = {
  title: string
  cover: string
  takenOn: string
  dueDate: string
}

export const teacherLibraryBooks: TeacherLibraryBook[] = [
  { title: 'The Small-Town Library', cover: '/assets/img/books/book-01.jpg', takenOn: '25 Jan 2024', dueDate: '25 Jan 2024' },
  { title: 'Apex Time', cover: '/assets/img/books/book-02.jpg', takenOn: '22 Jan 2024', dueDate: '25 Jan 2024' },
  { title: 'The Cobalt Guitar', cover: '/assets/img/books/book-03.jpg', takenOn: '30 Jan 2024', dueDate: '10 Feb 2024' },
  { title: 'Shard and the Tomb', cover: '/assets/img/books/book-04.jpg', takenOn: '10 Feb 2024', dueDate: '20 Feb 2024' },
  { title: 'Shard and the Tomb 2', cover: '/assets/img/books/book-05.jpg', takenOn: '12 Feb 2024', dueDate: '22 Feb 2024' },
  { title: 'Plague of Fear', cover: '/assets/img/books/book-06.jpg', takenOn: '15 Feb 2024', dueDate: '25 Feb 2024' },
]

export default teacherApi

