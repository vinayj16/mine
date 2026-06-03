import apiClient from '../api/client'
import type { ReactNode } from 'react'
// Enhanced student interfaces
export interface StudentRecord extends StudentSummary {
  // Academic performance
  academic?: {
    gpa: number
    rank: number
    totalStudents: number
    attendanceRate: number
    performanceTrend: 'improving' | 'stable' | 'declining'
  }
  // Financial status
  financial?: {
    outstandingFees: number
    paymentHistory: {
      date: string
      amount: number
      type: string
    }[]
  }
  // Behavioral metrics
  behavior?: {
    disciplinaryIncidents: number
    lastIncident?: string
    participationScore: number
    peerRating: number
  }
  // Health and medical
  health?: {
    allergies: string[]
    medications: string[]
    emergencyContact: {
      name: string
      relation: string
      phone: string
    }
    medicalConditions: string[]
  }
  // Extracurricular activities
  activities?: {
    sports: string[]
    clubs: string[]
    achievements: string[]
    leadershipRoles: string[]
  }
  // Digital engagement
  digital?: {
    portalLogins: number
    lastLogin: string
    appUsage: number
    onlineAssessments: number
  }
}

export interface StudentProfile extends StudentRecord {
  // Enhanced with detailed information
  personalInfo: {
    bloodGroup: string
    religion: string
    caste: string
    category: string
    motherTongue: string
    languages: string[]
    nationality: string
    aadharNumber?: string
    passportNumber?: string
    state: string
    city: string
    pincode: string
    country: string
  }
  family: {
    father: {
      name: string
      occupation: string
      phone: string
      email: string
      avatar: string
    }
    mother: {
      name: string
      occupation: string
      phone: string
      email: string
      avatar: string
    }
    guardians: Array<{
      name: string
      relation: string
      phone: string
      email: string
      avatar: string
    }>
    siblings: Array<{
      name: string
      classLabel: string
      avatar: string
    }>
  }
  address: {
    current: string
    permanent: string
    street: string
    city: string
    state: string
    country: string
    postalCode: string
    pincode: string
  }
  previousSchool?: {
    name: string
    address: string
    board: string
    percentage: number
  }
  documents: Array<{
    type: string
    name: string
    url: string
    verified: boolean
  }>
  transport?: {
    route: string
    busNumber: string
    pickupPoint: string
    fee: number
  }
  hostel?: {
    name: string
    room: string
    fee: number
  }
  bankDetails?: {
    bankName: string
    accountNumber: string
    ifscCode: string
    branch: string
  }
  primaryContact?: {
    phone: string
    email: string
  }
  siblings?: Array<{
    classLabel: ReactNode
    avatar: string | undefined
    id: string
    name: string
    relation: string
    class?: string
  }>
  basicInfo?: Array<{
    label: string
    value: string
  }>
  email?: string
  phone?: string
  gender: string
  dateOfBirth: string
  religion?: string
  caste?: string
  bloodGroup?: string
  height?: string
  weight?: string
  medicalHistory?: string[]
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  section?: string
  joinedOn?: string
  dob?: string
}

// Student statistics and analytics
export interface StudentStats {
  totalStudents: number
  activeStudents: number
  inactiveStudents: number
  averageAttendance: number
  averageGPA: number
  totalOutstandingFees: number
  disciplinaryIncidents: number
  byClass: Record<string, number>
  bySection: Record<string, number>
  byGender: Record<string, number>
  topPerformers: StudentRecord[]
  attendanceLeaders: StudentRecord[]
  feeDefaulters: StudentRecord[]
  performanceTrends: {
    improving: number
    stable: number
    declining: number
  }
}

// Real-time API functions for student management
export const studentApi = {
  // Get all students with real-time data
  getAllStudents: async (institutionId?: string, filters?: {
    class?: string
    section?: string
    status?: 'Active' | 'Inactive'
    gender?: string
  }): Promise<StudentRecord[]> => {
    try {
      const params: any = {}
      if (institutionId) params.institutionId = institutionId
      if (filters?.class) params.class = filters.class
      if (filters?.section) params.section = filters.section
      if (filters?.status) params.status = filters.status
      if (filters?.gender) params.gender = filters.gender
      const response = await apiClient.get('/students', { params })
      return response.data.data || []
    } catch (error) {
      console.error('[Student API] Failed to fetch students:', error)
      throw new Error('Failed to load students. Please try again.')
    }
  },

  // Get student by ID with full profile
  getStudentById: async (studentId: string, institutionId?: string): Promise<StudentProfile | null> => {
    try {
      const response = await apiClient.get(`/students/${studentId}`, { params: { institutionId } })
      return response.data.data || null
    } catch (error) {
      console.error('[Student API] Failed to fetch student profile:', error)
      return null
    }
  },

  // Search students with real-time data
  searchStudents: async (searchTerm: string, institutionId?: string): Promise<StudentRecord[]> => {
    try {
      const response = await apiClient.get('/students', { params: { search: searchTerm, institutionId } })
      return response.data.data || []
    } catch (error) {
      console.error('[Student API] Failed to search students:', error)
      throw new Error('Failed to search students. Please try again.')
    }
  },

  // Get students by academic performance
  getStudentsByPerformance: async (minGPA: number, institutionId?: string): Promise<StudentRecord[]> => {
    try {
      const response = await apiClient.get('/students', { params: { minGPA, institutionId } })
      return response.data.data || []
    } catch (error) {
      console.error('[Student API] Failed to filter students by performance:', error)
      throw new Error('Failed to filter students by performance. Please try again.')
    }
  },

  // Get students by attendance
  getStudentsByAttendance: async (minAttendance: number, institutionId?: string): Promise<StudentRecord[]> => {
    try {
      const response = await apiClient.get('/students', { params: { minAttendance, institutionId } })
      return response.data.data || []
    } catch (error) {
      console.error('[Student API] Failed to filter students by attendance:', error)
      throw new Error('Failed to filter students by attendance. Please try again.')
    }
  },

  // Get students with outstanding fees
  getStudentsWithOutstandingFees: async (institutionId?: string): Promise<StudentRecord[]> => {
    try {
      const response = await apiClient.get('/students', { params: { outstandingFees: true, institutionId } })
      return response.data.data || []
    } catch (error) {
      console.error('[Student API] Failed to fetch students with outstanding fees:', error)
      throw new Error('Failed to load students with outstanding fees. Please try again.')
    }
  },

  // Update student information
  updateStudent: async (studentId: string, updates: Partial<StudentRecord>, institutionId?: string): Promise<void> => {
    try {
      await apiClient.put(`/students/${studentId}`, updates, { params: { institutionId } })
    } catch (error) {
      console.error('[Student API] Failed to update student:', error)
      throw new Error('Failed to update student. Please try again.')
    }
  },

  // Get student timetable
  getStudentTimetable: async (studentId: string, institutionId?: string): Promise<StudentTimeTableDay[]> => {
    try {
      const response = await apiClient.get(`/timetable/student/${studentId}`, { params: { institutionId } })
      return response.data.data || []
    } catch (error) {
      console.error('[Student API] Failed to fetch student timetable:', error)
      throw new Error('Failed to load student timetable. Please try again.')
    }
  },

  // Get student attendance
  getStudentAttendance: async (studentId: string, institutionId?: string): Promise<{
    summary: StudentAttendanceSummary[]
    monthly: StudentAttendanceMatrixRow[]
  }> => {
    try {
      const response = await apiClient.get(`/students/${studentId}/attendance`, { params: { institutionId } })
      return response.data.data || { summary: [], monthly: [] }
    } catch (error) {
      console.error('[Student API] Failed to fetch student attendance:', error)
      throw new Error('Failed to load student attendance. Please try again.')
    }
  },

  // Get student fees
  getStudentFees: async (studentId: string, institutionId?: string): Promise<StudentFeeRecord[]> => {
    try {
      const response = await apiClient.get(`/students/${studentId}/fees`, { params: { institutionId } })
      return response.data.data || []
    } catch (error) {
      console.error('[Student API] Failed to fetch student fees:', error)
      throw new Error('Failed to load student fees. Please try again.')
    }
  },

  // Get student exam results
  getStudentExamResults: async (studentId: string, institutionId?: string): Promise<StudentExamResult[]> => {
    try {
      const response = await apiClient.get(`/students/${studentId}/results`, { params: { institutionId } })
      return response.data.data || []
    } catch (error) {
      console.error('[Student API] Failed to fetch student exam results:', error)
      throw new Error('Failed to load student exam results. Please try again.')
    }
  },

  // Get student library books
  getStudentLibraryBooks: async (studentId: string, institutionId?: string): Promise<StudentLibraryBook[]> => {
    try {
      const response = await apiClient.get(`/students/${studentId}/library`, { params: { institutionId } })
      return response.data.data || []
    } catch (error) {
      console.error('[Student API] Failed to fetch student library books:', error)
      throw new Error('Failed to load student library books. Please try again.')
    }
  },

  // Get student leave records
  getStudentLeaveRecords: async (studentId: string, institutionId?: string): Promise<{
    summary: StudentLeaveSummaryItem[]
    records: StudentLeaveRecord[]
  }> => {
    try {
      const response = await apiClient.get(`/students/${studentId}/leaves`, { params: { institutionId } })
      return response.data.data || { summary: [], records: [] }
    } catch (error) {
      console.error('[Student API] Failed to fetch student leave records:', error)
      throw new Error('Failed to load student leave records. Please try again.')
    }
  },

  // Generate student report
  generateStudentReport: async (studentId: string, reportType: 'academic' | 'attendance' | 'financial' | 'comprehensive', institutionId?: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/students/${studentId}/report`, { params: { reportType, institutionId } })
      return response.data.data
    } catch (error) {
      console.error('[Student API] Failed to generate student report:', error)
      throw new Error('Failed to generate student report. Please try again.')
    }
  },

  // Get student statistics
  getStudentStats: async (institutionId?: string): Promise<StudentStats> => {
    try {
      const response = await apiClient.get('/students/stats', { params: { institutionId } })
      return response.data.data
    } catch (error) {
      console.error('[Student API] Failed to fetch student stats:', error)
      throw new Error('Failed to load student statistics. Please try again.')
    }
  }
}

// Legacy interfaces and data for backward compatibility
export type StudentSummary = {
  admissionNo: string
  rollNo: string
  name: string
  classLabel: string
  section?: string
  gender: string
  status: 'Active' | 'Inactive'
  joinedOn?: string
  dob?: string
  avatar: string
}

export const studentSummaries: StudentSummary[] = [
  {
    admissionNo: 'AD9892434',
    rollNo: '35013',
    name: 'Janet Daniel',
    classLabel: 'III',
    section: 'A',
    gender: 'Female',
    status: 'Active',
    joinedOn: '10 Jan 2015',
    dob: '25 Jan 2008',
    avatar: '/assets/img/students/student-09.webp',
  },
  {
    admissionNo: 'AD9892433',
    rollNo: '35012',
    name: 'Joann Michael',
    classLabel: 'IV',
    section: 'B',
    gender: 'Male',
    status: 'Active',
    joinedOn: '19 Aug 2014',
    dob: '08 Mar 2008',
    avatar: '/assets/img/students/student-10.webp',
  },
  {
    admissionNo: 'AD9892432',
    rollNo: '35011',
    name: 'Kathleen Dison',
    classLabel: 'III',
    section: 'A',
    gender: 'Female',
    status: 'Active',
    joinedOn: '05 Dec 2017',
    dob: '12 Sep 2009',
    avatar: '/assets/img/students/student-11.webp',
  },
  {
    admissionNo: 'AD9892431',
    rollNo: '35010',
    name: 'Lisa Gourley',
    classLabel: 'II',
    section: 'B',
    gender: 'Female',
    status: 'Inactive',
    joinedOn: '13 May 2017',
    dob: '26 Nov 2009',
    avatar: '/assets/img/students/student-12.webp',
  },
  {
    admissionNo: 'AD9892430',
    rollNo: '35009',
    name: 'Ralph Claudia',
    classLabel: 'II',
    section: 'B',
    gender: 'Male',
    status: 'Active',
    joinedOn: '02 Jul 2016',
    dob: '30 Jan 2010',
    avatar: '/assets/img/students/student-09.webp',
  },
  {
    admissionNo: 'AD9892429',
    rollNo: '35008',
    name: 'Clara William',
    classLabel: 'V',
    section: 'C',
    gender: 'Female',
    status: 'Active',
    joinedOn: '12 Apr 2016',
    dob: '14 Apr 2008',
    avatar: '/assets/img/students/student-10.webp',
  },
  {
    admissionNo: 'AD9892428',
    rollNo: '35007',
    name: 'Francis Bacon',
    classLabel: 'III',
    section: 'A',
    gender: 'Male',
    status: 'Active',
    joinedOn: '10 Aug 2015',
    dob: '04 Feb 2009',
    avatar: '/assets/img/students/student-11.webp',
  },
  {
    admissionNo: 'AD9892427',
    rollNo: '35006',
    name: 'Philip Jason',
    classLabel: 'IV',
    section: 'B',
    gender: 'Male',
    status: 'Active',
    joinedOn: '08 Nov 2015',
    dob: '19 May 2009',
    avatar: '/assets/img/students/student-12.webp',
  },
]

// Legacy data structures for backward compatibility
export const studentProfile = {
  admissionNo: 'AD1256589',
  rollNo: '35013',
  name: 'Janet Daniel',
  classLabel: 'III, A',
  status: 'Active',
  avatar: '/assets/img/students/student-09.webp',
  primaryContact: {
    phone: '+1 46548 84498',
    email: 'janetdaniel@example.com',
  },
  siblings: [
    { name: 'Ralph Claudia', classLabel: 'III, B', avatar: '/assets/img/students/student-10.webp' },
    { name: 'Julie Scott', classLabel: 'V, A', avatar: '/assets/img/students/student-11.webp' },
  ],
  hostel: {
    name: 'HI-Hostel, Floor',
    room: 'Room No : 25',
  },
  transport: {
    route: 'Newyork',
    busNumber: 'AM 54548',
    pickupPoint: 'Cincinatti',
  },
  basicInfo: [
    { label: 'Gender', value: 'Female' },
    { label: 'Date Of Birth', value: '25 Jan 2008' },
    { label: 'Blood Group', value: 'O +ve' },
    { label: 'Color', value: 'Red' },
    { label: 'Religion', value: 'Christianity' },
    { label: 'Caste', value: 'Catholic' },
    { label: 'Category', value: 'OBC' },
    { label: 'Mother Tongue', value: 'English' },
    { label: 'Languages', value: 'English, Spanish' },
    { label: 'Nationality', value: 'American' },
    { label: 'State', value: 'California' },
    { label: 'City', value: 'Los Angeles' },
    { label: 'Pincode', value: '90001' },
    { label: 'Country', value: 'USA' },
    { label: 'Emergency Contact', value: '1234567890' },
  ],
  parents: [
    {
      name: 'Jerald Vicinius',
      relation: 'Father',
      phone: '+1 45545 46464',
      email: 'jerald@example.com',
      avatar: '/assets/img/parents/parent-01.webp',
    },
    {
      name: 'Roberta Webber',
      relation: 'Mother',
      phone: '+1 46499 24357',
      email: 'roberta@example.com',
      avatar: '/assets/img/parents/parent-02.webp',
    },
    {
      name: 'Jerald Vicinius',
      relation: 'Guardian',
      phone: '+1 45545 46464',
      email: 'guardian@example.com',
      avatar: '/assets/img/parents/parent-05.webp',
    },
  ],
  documents: [
    { label: 'BirthCertificate.pdf' },
    { label: 'Transfer Certificate.pdf' },
  ],
  addresses: {
    current: '3495 Red Hawk Road, Buffalo Lake, MN 55314',
    permanent: '3495 Red Hawk Road, Buffalo Lake, MN 55314',
  },
  previousSchool: {
    name: 'Oxford Matriculation, USA',
    address: '1852 Barnes Avenue, Cincinnati, OH 45202',
  },
  bank: {
    name: 'Bank of America',
    branch: 'Cincinnati',
    ifsc: 'BOA83209832',
  },
  medical: {
    allergies: ['Rashes'],
    medications: '-',
  },
  loginCredentials: [
    { role: 'Parent', username: 'parent53', password: 'parent@53' },
    { role: 'Student', username: 'student20', password: 'stdt@53' },
  ],
}

export type StudentTimeTableSession = {
  time: string
  subject: string
  colorClass: string
  teacher: { name: string; avatar: string }
}

export type StudentTimeTableDay = {
  day: string
  sessions: StudentTimeTableSession[]
}

export const studentTimeTable: StudentTimeTableDay[] = [
  {
    day: 'Monday',
    sessions: [
      {
        time: '09:00 - 09:45 AM',
        subject: 'Subject : Maths',
        colorClass: 'bg-transparent-danger',
        teacher: { name: 'Jacquelin', avatar: '/assets/img/teachers/teacher-07.jpg' },
      },
      {
        time: '09:45 - 10:30 AM',
        subject: 'Subject : English',
        colorClass: 'bg-transparent-primary',
        teacher: { name: 'Hellana', avatar: '/assets/img/teachers/teacher-03.jpg' },
      },
      {
        time: '10:45 - 11:30 AM',
        subject: 'Subject : Computer',
        colorClass: 'bg-transparent-success',
        teacher: { name: 'Daniel', avatar: '/assets/img/teachers/teacher-02.jpg' },
      },
      {
        time: '11:30 - 12:15 PM',
        subject: 'Subject : Spanish',
        colorClass: 'bg-transparent-pending',
        teacher: { name: 'Erickson', avatar: '/assets/img/teachers/teacher-03.jpg' },
      },
      {
        time: '01:30 - 02:15 PM',
        subject: 'Subject : Science',
        colorClass: 'bg-transparent-info',
        teacher: { name: 'Morgan', avatar: '/assets/img/teachers/teacher-05.jpg' },
      },
      {
        time: '02:15 - 03:00 PM',
        subject: 'Subject : Chemistry',
        colorClass: 'bg-transparent-light',
        teacher: { name: 'Aaron', avatar: '/assets/img/teachers/teacher-06.jpg' },
      },
      {
        time: '03:15 - 04:00 PM',
        subject: 'Subject : Physics',
        colorClass: 'bg-transparent-warning',
        teacher: { name: 'Teresa', avatar: '/assets/img/teachers/teacher-01.jpg' },
      },
    ],
  },
  {
    day: 'Tuesday',
    sessions: [
      {
        time: '09:00 - 09:45 AM',
        subject: 'Subject : Spanish',
        colorClass: 'bg-transparent-pending',
        teacher: { name: 'Erickson', avatar: '/assets/img/teachers/teacher-03.jpg' },
      },
      {
        time: '09:45 - 10:30 AM',
        subject: 'Subject : Physics',
        colorClass: 'bg-transparent-warning',
        teacher: { name: 'Teresa', avatar: '/assets/img/teachers/teacher-01.jpg' },
      },
      {
        time: '10:45 - 11:30 AM',
        subject: 'Subject : Chemistry',
        colorClass: 'bg-transparent-light',
        teacher: { name: 'Rosie', avatar: '/assets/img/teachers/teacher-06.jpg' },
      },
      {
        time: '11:30 - 12:15 PM',
        subject: 'Subject : Computer',
        colorClass: 'bg-transparent-success',
        teacher: { name: 'Daniel', avatar: '/assets/img/teachers/teacher-02.jpg' },
      },
      {
        time: '01:30 - 02:15 PM',
        subject: 'Subject : Science',
        colorClass: 'bg-transparent-info',
        teacher: { name: 'Morgan', avatar: '/assets/img/teachers/teacher-05.jpg' },
      },
      {
        time: '02:15 - 03:00 PM',
        subject: 'Subject : Maths',
        colorClass: 'bg-transparent-danger',
        teacher: { name: 'Erickson', avatar: '/assets/img/teachers/teacher-04.jpg' },
      },
      {
        time: '03:15 - 04:00 PM',
        subject: 'Subject : English',
        colorClass: 'bg-transparent-primary',
        teacher: { name: 'Hellana', avatar: '/assets/img/teachers/teacher-03.jpg' },
      },
    ],
  },
  {
    day: 'Wednesday',
    sessions: [
      {
        time: '09:00 - 09:45 AM',
        subject: 'Subject : Maths',
        colorClass: 'bg-transparent-danger',
        teacher: { name: 'Erickson', avatar: '/assets/img/teachers/teacher-04.jpg' },
      },
      {
        time: '09:45 - 10:30 AM',
        subject: 'Subject : English',
        colorClass: 'bg-transparent-primary',
        teacher: { name: 'Hellana', avatar: '/assets/img/teachers/teacher-03.jpg' },
      },
      {
        time: '10:45 - 11:30 AM',
        subject: 'Subject : Spanish',
        colorClass: 'bg-transparent-pending',
        teacher: { name: 'Erickson', avatar: '/assets/img/teachers/teacher-03.jpg' },
      },
      {
        time: '11:30 - 12:15 PM',
        subject: 'Subject : Computer',
        colorClass: 'bg-transparent-success',
        teacher: { name: 'Daniel', avatar: '/assets/img/teachers/teacher-02.jpg' },
      },
      {
        time: '01:30 - 02:15 PM',
        subject: 'Subject : Science',
        colorClass: 'bg-transparent-info',
        teacher: { name: 'Morgan', avatar: '/assets/img/teachers/teacher-05.jpg' },
      },
      {
        time: '02:15 - 03:00 PM',
        subject: 'Subject : Chemistry',
        colorClass: 'bg-transparent-light',
        teacher: { name: 'Rosie', avatar: '/assets/img/teachers/teacher-06.jpg' },
      },
    ],
  },
  {
    day: 'Thursday',
    sessions: [
      {
        time: '09:00 - 09:45 AM',
        subject: 'Subject : English',
        colorClass: 'bg-transparent-primary',
        teacher: { name: 'Hellana', avatar: '/assets/img/teachers/teacher-03.jpg' },
      },
      {
        time: '09:45 - 10:30 AM',
        subject: 'Subject : Maths',
        colorClass: 'bg-transparent-danger',
        teacher: { name: 'Erickson', avatar: '/assets/img/teachers/teacher-04.jpg' },
      },
      {
        time: '10:45 - 11:30 AM',
        subject: 'Subject : Science',
        colorClass: 'bg-transparent-info',
        teacher: { name: 'Morgan', avatar: '/assets/img/teachers/teacher-05.jpg' },
      },
      {
        time: '11:30 - 12:15 PM',
        subject: 'Subject : Chemistry',
        colorClass: 'bg-transparent-light',
        teacher: { name: 'Rosie', avatar: '/assets/img/teachers/teacher-06.jpg' },
      },
      {
        time: '01:30 - 02:15 PM',
        subject: 'Subject : Computer',
        colorClass: 'bg-transparent-success',
        teacher: { name: 'Daniel', avatar: '/assets/img/teachers/teacher-02.jpg' },
      },
      {
        time: '02:15 - 03:00 PM',
        subject: 'Subject : Spanish',
        colorClass: 'bg-transparent-pending',
        teacher: { name: 'Erickson', avatar: '/assets/img/teachers/teacher-03.jpg' },
      },
    ],
  },
  {
    day: 'Friday',
    sessions: [
      {
        time: '09:00 - 09:45 AM',
        subject: 'Subject : Computer',
        colorClass: 'bg-transparent-success',
        teacher: { name: 'Daniel', avatar: '/assets/img/teachers/teacher-02.jpg' },
      },
      {
        time: '09:45 - 10:30 AM',
        subject: 'Subject : English',
        colorClass: 'bg-transparent-primary',
        teacher: { name: 'Hellana', avatar: '/assets/img/teachers/teacher-03.jpg' },
      },
      {
        time: '10:45 - 11:30 AM',
        subject: 'Subject : Chemistry',
        colorClass: 'bg-transparent-light',
        teacher: { name: 'Rosie', avatar: '/assets/img/teachers/teacher-06.jpg' },
      },
      {
        time: '11:30 - 12:15 PM',
        subject: 'Subject : Maths',
        colorClass: 'bg-transparent-danger',
        teacher: { name: 'Erickson', avatar: '/assets/img/teachers/teacher-04.jpg' },
      },
      {
        time: '01:30 - 02:15 PM',
        subject: 'Subject : Science',
        colorClass: 'bg-transparent-info',
        teacher: { name: 'Morgan', avatar: '/assets/img/teachers/teacher-05.jpg' },
      },
      {
        time: '02:15 - 03:00 PM',
        subject: 'Subject : Spanish',
        colorClass: 'bg-transparent-pending',
        teacher: { name: 'Erickson', avatar: '/assets/img/teachers/teacher-03.jpg' },
      },
    ],
  },
]

export type StudentLeaveSummaryItem = {
  label: string
  total: number
  used: number
  available: number
}

export const studentLeaveSummary: StudentLeaveSummaryItem[] = [
  { label: 'Medical Leave', total: 10, used: 5, available: 5 },
  { label: 'Casual Leave', total: 12, used: 1, available: 11 },
  { label: 'Maternity Leave', total: 10, used: 0, available: 10 },
  { label: 'Paternity Leave', total: 0, used: 0, available: 0 },
]

export type StudentLeaveRecord = {
  type: string
  dateRange: string
  days: number
  appliedOn: string
  status: 'Approved' | 'Pending' | 'Rejected'
}

export const studentLeaveRecords: StudentLeaveRecord[] = [
  { type: 'Medical Leave', dateRange: '05 May 2024 - 09 May 2024', days: 5, appliedOn: '05 May 2024', status: 'Approved' },
  { type: 'Casual Leave', dateRange: '07 May 2024 - 07 May 2024', days: 1, appliedOn: '07 May 2024', status: 'Approved' },
  { type: 'Special Leave', dateRange: '09 May 2024 - 09 May 2024', days: 1, appliedOn: '09 May 2024', status: 'Pending' },
  { type: 'Casual Leave', dateRange: '08 May 2024 - 08 May 2024', days: 1, appliedOn: '04 May 2024', status: 'Approved' },
  { type: 'Medical Leave', dateRange: '08 May 2024 - 11 May 2024', days: 4, appliedOn: '08 May 2024', status: 'Pending' },
  { type: 'Casual Leave', dateRange: '20 May 2024 - 20 May 2024', days: 1, appliedOn: '19 May 2024', status: 'Pending' },
]

export type StudentAttendanceSummary = {
  label: string
  value: string
  icon: string
  color: 'primary' | 'danger' | 'info' | 'warning'
}

export const studentAttendanceSummary: StudentAttendanceSummary[] = [
  { label: 'Present', value: '265', icon: 'ti ti-user-check', color: 'primary' },
  { label: 'Absent', value: '05', icon: 'ti ti-user-x', color: 'danger' },
  { label: 'Half Day', value: '01', icon: 'ti ti-calendar-event', color: 'info' },
  { label: 'Late', value: '12', icon: 'ti ti-clock-x', color: 'warning' },
]

export const studentAttendanceMonths = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']

export type StudentAttendanceMatrixRow = {
  day: string
  months: Record<(typeof studentAttendanceMonths)[number], 'present' | 'absent' | 'late' | 'holiday' | 'half' | ''>
}

export const studentAttendanceMatrix: StudentAttendanceMatrixRow[] = [
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

export type StudentFeeRecord = {
  group: string
  code: string
  dueDate: string
  amount: number
  status: 'Paid' | 'Unpaid'
  refId: string
  mode: string
  paidOn: string
  discount: string
  fine: number
}

export const studentFees: StudentFeeRecord[] = [
  { group: 'Class 1 General (Admission Fees)', code: 'admission-fees', dueDate: '25 Mar 2024', amount: 2000, status: 'Paid', refId: '#435454', mode: 'Cash', paidOn: '25 Jan 2024', discount: '10%', fine: 200 },
  { group: 'Class 1 General (Mar month Fees)', code: 'mar-month-fees', dueDate: '10 Apr 2024', amount: 2500, status: 'Paid', refId: '#435453', mode: 'Cash', paidOn: '03 Apr 2024', discount: '10%', fine: 0 },
  { group: 'Class 1 General (Apr month Fees)', code: 'apr-month-fees', dueDate: '10 May 2024', amount: 2500, status: 'Paid', refId: '#435453', mode: 'Cash', paidOn: '03 Apr 2024', discount: '10%', fine: 0 },
  { group: 'Class 1 General (May month Fees)', code: 'may-month-fees', dueDate: '10 Jun 2024', amount: 2500, status: 'Paid', refId: '#435451', mode: 'Cash', paidOn: '02 Jun 2024', discount: '10%', fine: 200 },
  { group: 'Class 1 General (Jun month Fees)', code: 'jun-month-fees', dueDate: '10 Jul 2024', amount: 2500, status: 'Paid', refId: '#435450', mode: 'Cash', paidOn: '05 Jul 2024', discount: '10%', fine: 200 },
  { group: 'Class 1 General (Jul month Fees)', code: 'jul-month-fees', dueDate: '10 Aug 2024', amount: 2500, status: 'Paid', refId: '#435449', mode: 'Cash', paidOn: '01 Aug 2024', discount: '10%', fine: 200 },
  { group: 'Class 1 General (Dec month Fees)', code: 'dec-month-fees', dueDate: '10 Jan 2024', amount: 2500, status: 'Paid', refId: '#435443', mode: 'Cash', paidOn: '05 Jan 2024', discount: '10%', fine: 0 },
  { group: 'Class 1 General (Jan month Fees)', code: 'jan-month-fees', dueDate: '10 Feb 2024', amount: 2000, status: 'Paid', refId: '#435443', mode: 'Cash', paidOn: '01 Feb 2024', discount: '10%', fine: 200 },
]

export type StudentExamResult = {
  title: string
  summary: {
    rank: string
    total: string
    obtained: string
    percentage: string
    result: string
  }
  subjects: {
    name: string
    max: number
    min: number
    obtained: number
    status: 'Pass' | 'Fail'
  }[]
}

export const studentExamResults: StudentExamResult[] = [
  {
    title: 'Monthly Test (May)',
    summary: { rank: '30', total: '500', obtained: '395', percentage: '79.50', result: 'Pass' },
    subjects: [
      { name: 'English (150)', max: 100, min: 35, obtained: 65, status: 'Pass' },
      { name: 'Mathematics (214)', max: 100, min: 35, obtained: 73, status: 'Pass' },
      { name: 'Physics (120)', max: 100, min: 35, obtained: 55, status: 'Pass' },
      { name: 'Chemistry (110)', max: 100, min: 35, obtained: 90, status: 'Pass' },
      { name: 'Spanish (140)', max: 100, min: 35, obtained: 88, status: 'Pass' },
    ],
  },
  {
    title: 'Monthly Test (Apr)',
    summary: { rank: '30', total: '500', obtained: '400', percentage: '80.50', result: 'Pass' },
    subjects: [
      { name: 'English (150)', max: 100, min: 35, obtained: 59, status: 'Pass' },
      { name: 'Mathematics (214)', max: 100, min: 35, obtained: 69, status: 'Pass' },
      { name: 'Physics (120)', max: 100, min: 35, obtained: 79, status: 'Pass' },
      { name: 'Chemistry (110)', max: 100, min: 35, obtained: 89, status: 'Pass' },
      { name: 'Spanish (140)', max: 100, min: 35, obtained: 99, status: 'Pass' },
    ],
  },
  {
    title: 'Monthly Test (Mar)',
    summary: { rank: '30', total: '500', obtained: '250', percentage: '50.00', result: 'Fail' },
    subjects: [
      { name: 'English (150)', max: 100, min: 35, obtained: 40, status: 'Pass' },
      { name: 'Mathematics (214)', max: 100, min: 35, obtained: 45, status: 'Pass' },
      { name: 'Physics (120)', max: 100, min: 35, obtained: 30, status: 'Pass' },
      { name: 'Chemistry (110)', max: 100, min: 35, obtained: 28, status: 'Pass' },
      { name: 'Spanish (140)', max: 100, min: 35, obtained: 50, status: 'Pass' },
    ],
  },
]

export type StudentLibraryBook = {
  title: string
  cover: string
  takenOn: string
  dueDate: string
}

export const studentLibraryBooks: StudentLibraryBook[] = [
  { title: 'The Small-Town Library', cover: '/assets/img/books/book-01.jpg', takenOn: '25 Jan 2024', dueDate: '25 Jan 2024' },
  { title: 'Apex Time', cover: '/assets/img/books/book-02.jpg', takenOn: '22 Jan 2024', dueDate: '25 Jan 2024' },
  { title: 'The Cobalt Guitar', cover: '/assets/img/books/book-03.jpg', takenOn: '30 Jan 2024', dueDate: '10 Feb 2024' },
  { title: 'Shard and the Tomb', cover: '/assets/img/books/book-04.jpg', takenOn: '10 Feb 2024', dueDate: '20 Feb 2024' },
  { title: 'Shard and the Tomb 2', cover: '/assets/img/books/book-05.jpg', takenOn: '12 Feb 2024', dueDate: '22 Feb 2024' },
  { title: 'Plague of Fear', cover: '/assets/img/books/book-06.jpg', takenOn: '15 Feb 2024', dueDate: '25 Feb 2024' },
]

export default studentApi