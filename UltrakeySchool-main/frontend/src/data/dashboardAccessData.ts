import { dashboardService, type StudentDashboardData, type TeacherDashboardData, type ParentDashboardData, type AdminDashboardData } from '../services/dashboardService'
import institutionService from '../services/institutionService'

export interface DashboardKpi {
  label: string
  value: string
  note?: string
}

export interface DashboardAccessEntry {
  previewId: string
  role: string
  title: string
  description: string
  route: string
  badge?: string
  kpis: DashboardKpi[]
  permissions: string[]
  startingPoint: string
}

// Real-time API functions for dashboard data
export const dashboardApi = {
  // Get dashboard data based on user role
  getDashboardData: async (role: string): Promise<DashboardAccessEntry | null> => {
    try {
      let dashboardData: any
      let kpis: DashboardKpi[] = []

      switch (role.toLowerCase()) {
        case 'superadmin':
        case 'super_admin':
          dashboardData = await dashboardService.getAdminDashboard()
          kpis = await dashboardApi.getSuperAdminKpis(dashboardData)
          break
        case 'institution_admin':
          dashboardData = await dashboardService.getAdminDashboard()
          kpis = await dashboardApi.getInstitutionAdminKpis(dashboardData)
          break
        case 'admin':
        case 'school_admin':
          dashboardData = await dashboardService.getAdminDashboard()
          kpis = await dashboardApi.getAdminKpis(dashboardData)
          break
        case 'principal':
          dashboardData = await dashboardService.getAdminDashboard()
          kpis = await dashboardApi.getPrincipalKpis(dashboardData)
          break
        case 'teacher':
          dashboardData = await dashboardService.getTeacherDashboard()
          kpis = await dashboardApi.getTeacherKpis(dashboardData)
          break
        case 'student':
          dashboardData = await dashboardService.getStudentDashboard()
          kpis = await dashboardApi.getStudentKpis(dashboardData)
          break
        case 'parent':
          dashboardData = await dashboardService.getParentDashboard()
          kpis = await dashboardApi.getParentKpis(dashboardData)
          break
        case 'accountant':
          dashboardData = await dashboardService.getAdminDashboard()
          kpis = await dashboardApi.getAccountantKpis(dashboardData)
          break
        case 'hr_manager':
          dashboardData = await dashboardService.getAdminDashboard()
          kpis = await dashboardApi.getHrManagerKpis(dashboardData)
          break
        case 'librarian':
          dashboardData = await dashboardService.getAdminDashboard()
          kpis = await dashboardApi.getLibrarianKpis(dashboardData)
          break
        case 'transport_manager':
          dashboardData = await dashboardService.getAdminDashboard()
          kpis = await dashboardApi.getTransportManagerKpis(dashboardData)
          break
        case 'hostel_warden':
          dashboardData = await dashboardService.getAdminDashboard()
          kpis = await dashboardApi.getHostelWardenKpis(dashboardData)
          break
        case 'principal':
          dashboardData = await dashboardService.getAdminDashboard()
          kpis = await dashboardApi.getPrincipalKpis(dashboardData)
          break
        case 'agent':
          dashboardData = await dashboardService.getAdminDashboard()
          kpis = await dashboardApi.getAgentKpis(dashboardData)
          break
        case 'staff_member':
          dashboardData = await dashboardService.getAdminDashboard()
          kpis = await dashboardApi.getStaffMemberKpis(dashboardData)
          break
        default:
          return null
      }

      return dashboardApi.createDashboardEntry(role, kpis)
    } catch (error) {
      console.error('[Dashboard API] Failed to fetch dashboard data:', error)
      throw new Error('Failed to load dashboard data. Please try again.')
    }
  },

  // Get KPIs for Super Admin
  getSuperAdminKpis: async (_data: AdminDashboardData): Promise<DashboardKpi[]> => {
    const institutions = await dashboardApi.getInstitutionCount()

    return [
      { label: 'Institutions', value: institutions.toString(), note: 'Total' }
    ]
  },

  // Get KPIs for Institution Admin
  getInstitutionAdminKpis: async (data: AdminDashboardData): Promise<DashboardKpi[]> => {
    return [
      { label: 'Students', value: data.overview.totalStudents.toLocaleString(), note: 'Active' },
      { label: 'Teachers', value: data.overview.totalTeachers.toLocaleString(), note: 'Trained' },
      { label: 'Attendance', value: data.overview.attendanceToday.percentage, note: 'Daily average' }
    ]
  },

  // Get KPIs for Admin
  getAdminKpis: async (data: AdminDashboardData): Promise<DashboardKpi[]> => {
    return [
      { label: 'Attendance', value: data.overview.attendanceToday.percentage, note: 'Weekly' },
      { label: 'Pending fees', value: `$${(data.overview.pendingFees / 1000).toFixed(1)}K`, note: 'Follow up' }
    ]
  },

  // Get KPIs for Principal
  getPrincipalKpis: async (_data: AdminDashboardData): Promise<DashboardKpi[]> => {
    return []
  },

  // Get KPIs for Teacher
  getTeacherKpis: async (data: TeacherDashboardData): Promise<DashboardKpi[]> => {
    const schedule = data.todaySchedule || []
    const pendingTasks = data.pendingTasks || []

    return [
      { label: 'Classes today', value: schedule.length.toString(), note: 'Scheduled' },
      { label: 'Pending submissions', value: pendingTasks.length.toString(), note: 'Last 72h' }
    ]
  },

  // Get KPIs for Student
  getStudentKpis: async (data: StudentDashboardData): Promise<DashboardKpi[]> => {
    return [
      { label: 'Attendance', value: data.quickStats.attendance, note: 'Current term' }
    ]
  },

  // Get KPIs for Parent
  getParentKpis: async (data: ParentDashboardData): Promise<DashboardKpi[]> => {
    return [
      { label: 'Children tracked', value: data.children.length.toString(), note: 'Total' },
      { label: 'Fees due', value: `$${(data.feeStatus.pendingAmount / 1000).toFixed(0)}`, note: 'This month' }
    ]
  },

  // Get KPIs for Accountant
  getAccountantKpis: async (_data: AdminDashboardData): Promise<DashboardKpi[]> => {
    const revenue = await dashboardApi.getRevenue()

    return [
      { label: 'Revenue', value: `$${(revenue / 1000).toFixed(0)}K`, note: 'This cycle' }
    ]
  },

  // Get KPIs for HR Manager
  getHrManagerKpis: async (_data: AdminDashboardData): Promise<DashboardKpi[]> => {
    return []
  },

  // Get KPIs for Librarian
  getLibrarianKpis: async (_data: AdminDashboardData): Promise<DashboardKpi[]> => {
    return []
  },

  // Get KPIs for Transport Manager
  getTransportManagerKpis: async (_data: AdminDashboardData): Promise<DashboardKpi[]> => {
    return []
  },

  // Get KPIs for Hostel Warden
  getHostelWardenKpis: async (_data: AdminDashboardData): Promise<DashboardKpi[]> => {
    return []
  },

  // Get KPIs for Staff Member
  getStaffMemberKpis: async (_data: AdminDashboardData): Promise<DashboardKpi[]> => {
    return []
  },

  // Get KPIs for Agent
  getAgentKpis: async (_data: AdminDashboardData): Promise<DashboardKpi[]> => {
    const institutionsCreated = await dashboardApi.getInstitutionCount()

    return [
      { label: 'Institutions created', value: institutionsCreated.toString(), note: 'Total' }
    ]
  },

  // Create dashboard entry with real-time data
  createDashboardEntry: (role: string, kpis: DashboardKpi[]): DashboardAccessEntry => {
    const roleConfigs: Record<string, Omit<DashboardAccessEntry, 'kpis'>> = {
      'superadmin': {
        previewId: 'super-admin',
        role: 'SUPER_ADMIN',
        title: 'Enterprise Command Center',
        description: 'Monitor every institution, brand, and financial stream from one pane of glass.',
        route: '/super-admin/dashboard',
        badge: 'System View',
        permissions: ['institutions.*', 'transactions.*', 'analytics.*', 'settings.*'],
        startingPoint: 'Start with Institutions > Branch Monitoring, then drill into Analytics once the health metrics stabilize.'
      },
      'institution_admin': {
        previewId: 'institution-admin',
        role: 'INSTITUTION_ADMIN',
        title: 'Institution Analytics',
        description: 'Track student growth, budget health, and compliance for your institution-wide operations.',
        route: '/dashboard/main',
        badge: 'Institution View',
        permissions: ['students.*', 'teachers.*', 'fees.*', 'attendance.*', 'reports.*'],
        startingPoint: 'Verify the Main Dashboard widgets, then navigate to Finance Cockpit to preview dues and receipts.'
      },
      'admin': {
        previewId: 'admin',
        role: 'admin',
        title: 'Administration',
        description: 'Manage institution-level classes, attendance, and administrative dashboards in one place.',
        route: '/dashboard/main',
        badge: 'Administration',
        permissions: ['school.*', 'classes.*', 'attendance.*', 'communication.*'],
        startingPoint: 'Head to Classes/Sections to adjust schedules, then open Attendance Trends to validate compliance.'
      },
      'principal': {
        previewId: 'principal',
        role: 'PRINCIPAL',
        title: 'Leadership Board',
        description: 'High-level snapshot across academics, staff health, and communications for your campus.',
        route: '/principal',
        badge: 'Leadership',
        permissions: ['school.*', 'announcements.*', 'reports.*'],
        startingPoint: 'Review Student Overview + Teacher Intelligence to align messaging before crafting communications.'
      },
      'teacher': {
        previewId: 'teacher',
        role: 'TEACHER',
        title: 'Teacher Intelligence',
        description: 'Live class load, assignment queue, and performance check for your subjects.',
        route: '/dashboard/teacher',
        badge: 'Academics',
        permissions: ['classes.*', 'assignments.*', 'grades.*'],
        startingPoint: 'Open the class-by-class dashboard, then click into Learner Snapshot for homework and exam cues.'
      },
      'student': {
        previewId: 'student',
        role: 'STUDENT',
        title: 'Learner Snapshot',
        description: 'GPA, attendance, upcoming exams, and homework summaries in one card.',
        route: '/dashboard/student',
        badge: 'Student View',
        permissions: ['profile.*', 'subjects.view', 'homework.view'],
        startingPoint: 'Navigate to Homework + Timetable to plan the week, then check Fees for pending dues.'
      },
      'parent': {
        previewId: 'parent',
        role: 'PARENT',
        title: 'Guardian Overview',
        description: 'Track children grades, attendance, and fee status without logging into each account separately.',
        route: '/dashboard/parent',
        badge: 'Family',
        permissions: ['children.*', 'grades.view', 'fees.view'],
        startingPoint: 'Start with Children Summary, then jump to Finance Cockpit for each child outstanding invoices.'
      },
      'accountant': {
        previewId: 'accountant',
        role: 'ACCOUNTANT',
        title: 'Finance Cockpit',
        description: 'Revenue, dues, and payments status with live reconciliation pulls.',
        route: '/dashboard/finance',
        badge: 'Finance',
        permissions: ['finance.*', 'fees.*', 'reports.financial'],
        startingPoint: 'Launch Finance Dashboard, then switch to Transactions to verify reconciliations.'
      },
      'hr_manager': {
        previewId: 'hr-manager',
        role: 'HR_MANAGER',
        title: 'People Pulse',
        description: 'Hiring, leaves, and payroll readiness shown in one HR dashboard.',
        route: '/dashboard/hr',
        badge: 'People',
        permissions: ['hr.*', 'employees.*', 'leave.*'],
        startingPoint: 'Open Staff Listing, verify onboarding statuses, then review Leave Requests for approvals.'
      },
      'librarian': {
        previewId: 'librarian',
        role: 'LIBRARIAN',
        title: 'Library Board',
        description: 'Books, borrowings, and member activity insights from the digital library console.',
        route: '/dashboard/library',
        badge: 'Library',
        permissions: ['library.*', 'books.*', 'borrowing.*'],
        startingPoint: 'Start with Inventory, then open Borrowings to track due books and member activity.'
      },
      'transport_manager': {
        previewId: 'transport-manager',
        role: 'TRANSPORT_MANAGER',
        title: 'Transport Map',
        description: 'Route coverage, vehicle health, and passenger counts in a single glance.',
        route: '/transport',
        badge: 'Transport',
        permissions: ['transport.*', 'vehicles.*', 'routes.*'],
        startingPoint: 'Check Vehicles > Assignments, then open Routes to confirm route health and driver availability.'
      },
      'hostel_warden': {
        previewId: 'hostel-warden',
        role: 'HOSTEL_WARDEN',
        title: 'Hostel Control',
        description: 'Occupancy, maintenance, and safety stats keep your dormitories secure.',
        route: '/dashboard/hostel',
        badge: 'Hostel',
        permissions: ['hostel.*', 'rooms.*', 'maintenance.*'],
        startingPoint: 'Start with Room Allocation, then visit Maintenance to clear pending tickets.'
      },
      'staff_member': {
        previewId: 'staff-member',
        role: 'STAFF_MEMBER',
        title: 'Staff Hub',
        description: 'Tasks, attendance, and announcements tailored for non-teaching staff.',
        route: '/staff',
        badge: 'Staff',
        permissions: ['tasks.*', 'attendance.*', 'announcements.view'],
        startingPoint: 'Open Tasks and Attendance to check your schedule, then read latest announcements.'
      },
      'agent': {
        previewId: 'agent',
        role: 'AGENT',
        title: 'Agent Dashboard',
        description: 'Institution creation and management agent portal with analytics.',
        route: '/dashboard/agent',
        badge: 'Agent',
        permissions: ['institutions.*', 'user-management.*'],
        startingPoint: 'Start with Institution Management, then review Analytics for performance metrics.'
      }
    }

    const config = roleConfigs[role.toLowerCase()] || roleConfigs['admin']

    return { ...config, kpis }
  },

  // Helper API functions (these would call actual backend endpoints)
  getInstitutionCount: async (): Promise<number> => {
    try {
      const result = await institutionService.getInstitutions({ page: 1, limit: 1 })
      return result.pagination.total
    } catch (e) {
      console.warn('[Dashboard API] Failed to fetch institution count:', e)
      return 0
    }
  },

  getRevenue: async (): Promise<number> => {
    try {
      const report = await institutionService.getRevenueReport()
      const total =
        (report as any)?.totalRevenue ??
        (report as any)?.summary?.totalRevenue ??
        (report as any)?.revenue?.total ??
        0
      return typeof total === 'number' ? total : 0
    } catch (e) {
      console.warn('[Dashboard API] Failed to fetch revenue:', e)
      return 0
    }
  }
}

// Legacy function for backward compatibility
export const getDashboardPreviewEntry = async (previewId: string): Promise<DashboardAccessEntry | null> => {
  const roleMap: Record<string, string> = {
    'super-admin': 'superadmin',
    'institution-admin': 'institution_admin',
    'school-admin': 'admin',
    'principal': 'principal',
    'teacher': 'teacher',
    'student': 'student',
    'parent': 'parent',
    'accountant': 'accountant',
    'hr-manager': 'hr_manager',
    'librarian': 'librarian',
    'transport-manager': 'transport_manager',
    'hostel-warden': 'hostel_warden',
    'staff-member': 'staff_member'
  }

  const role = roleMap[previewId]
  if (!role) return null

  return await dashboardApi.getDashboardData(role)
}

export default dashboardApi
