// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  API_VERSION: 'v1',
  TIMEOUT: 30000,
};

// Get full API URL
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  // Don't add /api/v1 prefix since apiClient already has it in baseURL
  return `${cleanEndpoint}`;
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: 'auth/login',
    REGISTER: 'auth/register',
    LOGOUT: 'auth/logout',
    PROFILE: 'auth/profile',
    REFRESH: 'auth/refresh-token',
    CHANGE_PASSWORD: 'auth/change-password',
  },
  
  // Students
  STUDENTS: {
    LIST: 'students',
    DETAIL: (id: string) => `students/${id}`,
    CREATE: 'students',
    UPDATE: (id: string) => `students/${id}`,
    DELETE: (id: string) => `students/${id}`,
  },
  
  // Teachers
  TEACHERS: {
    LIST: 'teachers',
    DETAIL: (id: string) => `teachers/${id}`,
    CREATE: 'teachers',
    UPDATE: (id: string) => `teachers/${id}`,
    DELETE: (id: string) => `teachers/${id}`,
  },
  
  // Classes
  CLASSES: {
    LIST: 'classes',
    DETAIL: (id: string) => `classes/${id}`,
    CREATE: 'classes',
    UPDATE: (id: string) => `classes/${id}`,
    DELETE: (id: string) => `classes/${id}`,
  },
  
  // Classrooms
  CLASSROOMS: {
    LIST: 'classrooms',
    DETAIL: (id: string) => `classrooms/${id}`,
    CREATE: 'classrooms',
    UPDATE: (id: string) => `classrooms/${id}`,
    DELETE: (id: string) => `classrooms/${id}`,
    STATISTICS: 'classrooms/statistics',
    AVAILABLE: 'classrooms/available',
  },
  
  // Attendance
  ATTENDANCE: {
    LIST: 'attendance',
    DETAIL: (id: string) => `attendance/${id}`,
    CREATE: 'attendance',
    UPDATE: (id: string) => `attendance/${id}`,
    MARK: 'attendance/mark',
    STUDENT: 'student-attendance',
    STUDENT_BULK: 'student-attendance/bulk',
  },
  
  // Fees
  FEES: {
    LIST: 'fees',
    DETAIL: (id: string) => `fees/${id}`,
    CREATE: 'fees',
    UPDATE: (id: string) => `fees/${id}`,
    DELETE: (id: string) => `fees/${id}`,
    INVOICES: 'fees/invoices',
    INVOICE: (id: string) => `fees/invoices/${id}`,
    PAY_INVOICE: (id: string) => `fees/invoices/${id}/pay`,
  },
  
  // Exams
  EXAMS: {
    LIST: 'exams',
    DETAIL: (id: string) => `exams/${id}`,
    CREATE: 'exams',
    UPDATE: (id: string) => `exams/${id}`,
    DELETE: (id: string) => `exams/${id}`,
    SCHEDULES: 'exam-schedules',
  },
  
  // Homework
  HOMEWORK: {
    LIST: 'homework',
    DETAIL: (id: string) => `homework/${id}`,
    CREATE: 'homework',
    UPDATE: (id: string) => `homework/${id}`,
    DELETE: (id: string) => `homework/${id}`,
    SUBMIT: (id: string) => `homework/${id}/submit`,
  },

  // Library
  LIBRARY: {
    BOOKS: {
      LIST: 'library/books',
      DETAIL: (id: string) => `library/books/${id}`,
      CREATE: 'library/books',
      UPDATE: (id: string) => `library/books/${id}`,
      DELETE: (id: string) => `library/books/${id}`,
    },
    AUTHORS: {
      LIST: 'library/authors',
      CREATE: 'library/authors',
    },
    CATEGORIES: {
      LIST: 'library/categories',
      CREATE: 'library/categories',
    },
    BORROWINGS: {
      LIST: 'library/borrowings',
      ISSUE: 'library/borrowings/issue',
      RETURN: (id: string) => `library/borrowings/${id}/return`,
      RENEW: (id: string) => `library/borrowings/${id}/renew`,
      MY_BORROWINGS: 'library/my-borrowings',
    },
    FINES: {
      LIST: 'library/fines',
      PAY: (id: string) => `library/fines/${id}/pay`,
    },
    DASHBOARD: 'library/dashboard',
    SEARCH: 'library/search',
  },

  // Hostel
  HOSTEL: {
    ROOMS: {
      LIST: 'hostel/rooms',
      DETAIL: (id: string) => `hostel/rooms/${id}`,
      CREATE: 'hostel/rooms',
      UPDATE: (id: string) => `hostel/rooms/${id}`,
      DELETE: (id: string) => `hostel/rooms/${id}`,
      AVAILABILITY: 'hostel/rooms/availability',
    },
    ALLOCATIONS: {
      LIST: 'hostel/allocations',
      CREATE: 'hostel/allocations',
      CHECKOUT: (id: string) => `hostel/allocations/${id}/checkout`,
      MY_ALLOCATION: 'hostel/my-allocation',
    },
    COMPLAINTS: {
      LIST: 'hostel/complaints',
      CREATE: 'hostel/complaints',
      UPDATE_STATUS: (id: string) => `hostel/complaints/${id}/status`,
    },
    VISITOR_LOGS: {
      LIST: 'hostel/visitor-logs',
      CHECK_IN: 'hostel/visitor-logs/check-in',
      CHECK_OUT: (id: string) => `hostel/visitor-logs/${id}/check-out`,
    },
    DASHBOARD: 'hostel/dashboard',
    MAINTENANCE: 'hostel/maintenance',
    INVENTORY: 'hostel/inventory',
  },
  
  // Subjects
  SUBJECTS: {
    LIST: 'subjects',
    DETAIL: (id: string) => `subjects/${id}`,
    CREATE: (schoolId: string) => `subjects/${schoolId}`,
    UPDATE: (id: string) => `subjects/${id}`,
    DELETE: (id: string) => `subjects/schools/${id}`,
  },
  
  // Syllabi
  SYLLABI: 'syllabi/schools/:schoolId',
  
  // Timetable
  TIMETABLE: {
    LIST: 'class-timetables',
    DETAIL: (id: string) => `class-timetables/${id}`,
    CREATE: 'class-timetables',
    UPDATE: (id: string) => `class-timetables/${id}`,
    DELETE: (id: string) => `class-timetables/${id}`,
  },
  
  // Notices
  NOTICES: {
    LIST: 'notices',
    DETAIL: (id: string) => `notices/${id}`,
    CREATE: 'notices',
    UPDATE: (id: string) => `notices/${id}`,
    DELETE: (id: string) => `notices/${id}`,
  },
  
  // Events
  EVENTS: {
    LIST: 'events',
    DETAIL: (id: string) => `events/${id}`,
    CREATE: 'events',
    UPDATE: (id: string) => `events/${id}`,
    DELETE: (id: string) => `events/${id}`,
  },
  
  // Calendar
  CALENDAR: {
    EVENTS: 'calendar/events',
    CREATE: 'calendar/events',
  },
  
  // Guardians
  GUARDIANS: {
    LIST: 'guardians',
    DETAIL: (id: string) => `guardians/${id}`,
    CREATE: 'guardians',
    UPDATE: (id: string) => `guardians/${id}`,
    DELETE: (id: string) => `guardians/${id}`,
  },
  
  // HRM
  HRM: {
    STAFF: 'hrm/staff',
    DEPARTMENTS: 'hrm/departments',
    DESIGNATIONS: 'hrm/designations',
    LEAVES: 'hrm/leaves',
    ATTENDANCE: 'hrm/attendance',
  },
  
  // Institutions
  INSTITUTIONS: {
    LIST: 'institutions',
    DETAIL: (id: string) => `institutions/${id}`,
    CREATE: 'institutions',
    UPDATE: (id: string) => `institutions/${id}`,
    DELETE: (id: string) => `institutions/${id}`,
  },

  // Agent Institutions - use agent-specific endpoints
  AGENT_INSTITUTIONS: {
    LIST: 'institutions/agent',
    DETAIL: (id: string) => `institutions/agent/${id}`,
    CREATE: 'institutions/agent',
    UPDATE: (id: string) => `institutions/agent/${id}`,
    DELETE: (id: string) => `institutions/agent/${id}`,
  },
  
  // Schools
  SCHOOLS: {
    LIST: 'schools',
    DETAIL: (id: string) => `schools/${id}`,
    CREATE: 'schools',
    UPDATE: (id: string) => `schools/${id}`,
    DELETE: (id: string) => `schools/${id}`,
  },
  
  // Support Tickets
  SUPPORT: {
    LIST: 'support-tickets',
    DETAIL: (id: string) => `support-tickets/${id}`,
    CREATE: 'support-tickets',
    UPDATE: (id: string) => `support-tickets/${id}`,
    DELETE: (id: string) => `support-tickets/${id}`,
  },
  
  // Settings
  SETTINGS: {
    BASE: 'settings',
    GENERAL: 'settings',
    SCHOOL: 'school-settings',
    UPDATE: 'settings',
    COMPANY: 'settings/company',
    COMPANY_IMAGES: 'settings/company/images',
    LOCALIZATION: 'settings/localization-settings',
    PREFIXES: 'settings/prefixes',
    PREFERENCES: 'settings/preferences-settings',
    MAINTENANCE: 'settings/maintenance',
    MAINTENANCE_TOGGLE: 'settings/maintenance/toggle',
    EMAIL_TEMPLATES: {
      LIST: 'settings/email-templates',
      CREATE: 'settings/email-templates',
      UPDATE: (id: string) => `settings/email-templates/${id}`,
      DELETE: (id: string) => `settings/email-templates/${id}`,
    },
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: 'notifications',
    MARK_READ: (id: string) => `notifications/${id}/read`,
    MARK_ALL_READ: 'notifications/read-all',
    SEND: 'notifications/send',
  },
  
  // File Manager
  FILES: {
    LIST: 'file-manager',
    UPLOAD: 'file-manager/upload',
    DELETE: (id: string) => `file-manager/${id}`,
  },
  
  // Emails
  EMAILS: {
    LIST: 'emails',
    SEND: 'emails/send',
    DETAIL: (id: string) => `emails/${id}`,
  },
  
  // Todos
  TODOS: {
    LIST: 'todos',
    CREATE: 'todos',
    UPDATE: (id: string) => `todos/${id}`,
    DELETE: (id: string) => `todos/${id}`,
  },
  
  // Notes
  NOTES: {
    LIST: 'notes',
    CREATE: 'notes',
    UPDATE: (id: string) => `notes/${id}`,
    DELETE: (id: string) => `notes/${id}`,
  },
  
  // Statistics
  STATISTICS: {
    DASHBOARD: 'statistics/dashboard',
    STUDENTS: 'statistics/students',
    TEACHERS: 'statistics/teachers',
    ATTENDANCE: 'statistics/attendance',
  },
  
  // Permissions
  PERMISSIONS: {
    LIST: 'permissions',
    CHECK: 'permissions/check',
    ASSIGN: 'permissions/assign',
  },
  
  // Roles
  ROLES: {
    LIST: 'roles',
    DETAIL: (id: string) => `roles/${id}`,
    CREATE: 'roles',
    UPDATE: (id: string) => `roles/${id}`,
    DELETE: (id: string) => `roles/${id}`,
  },
  
  // Menus
  MENUS: {
    LIST: 'menus',
    CUSTOMIZE: 'menus/customize',
  },

  // Reports
  REPORTS: {
    STUDENT: (id: string) => `reports/student/${id}`,
  },
  
  // Subscriptions
  SUBSCRIPTIONS: {
    LIST: 'subscriptions',
    DETAIL: (id: string) => `subscriptions/${id}`,
    CREATE: 'subscriptions',
    UPDATE: (id: string) => `subscriptions/${id}`,
  },
  
  // Transactions
  TRANSACTIONS: {
    LIST: 'transactions',
    DETAIL: (id: string) => `transactions/${id}`,
  },
  
  // Super Admin
  SUPER_ADMIN: {
    DASHBOARD: 'super-admin/dashboard',
    USERS: 'users',
    ANALYTICS: 'super-admin/analytics',
    AGENTS: 'super-admin/agents',
    AGENT_ANALYTICS: 'super-admin/agents/analytics',
    COMMISSIONS: 'super-admin/commissions',
    COMMISSION_SUMMARY: 'super-admin/commissions/summary',
  },

  // Transport
  TRANSPORT: {
    ASSIGNMENTS: 'transport/assignments',
    ASSIGNMENT_DETAIL: (id: string) => `transport/assignments/${id}`,
    BULK_DELETE: 'transport/assignments/bulk-delete',
    ASSIGNMENTS_BY_ROUTE: (routeId: string) => `transport/assignments/route/${routeId}`,
    ASSIGNMENTS_BY_VEHICLE: (vehicleId: string) => `transport/assignments/vehicle/${vehicleId}`,
    REPORTS: 'transport/reports',
    REPORT_DETAIL: (id: string) => `transport/reports/${id}`,
    BULK_DELETE_REPORTS: 'transport/reports/bulk-delete',
    STATISTICS: 'transport/reports/statistics',
    REPORTS_BY_TYPE: (reportType: string) => `transport/reports/type/${reportType}`,
    SEARCH_REPORTS: 'transport/reports/search',
    PICKUP_POINTS: 'transport/pickup-points',
    ROUTES: 'transport/routes',
    VEHICLES: 'transport/vehicles'
  },

  // Drivers
  DRIVERS: {
    LIST: 'drivers',
    DETAIL: (id: string) => `drivers/${id}`,
    CREATE: 'drivers',
    UPDATE: (id: string) => `drivers/${id}`,
    DELETE: (id: string) => `drivers/${id}`,
    BULK_DELETE: 'drivers/bulk-delete',
    ACTIVE: 'drivers/active',
    SEARCH: 'drivers/search',
    STATISTICS: 'drivers/statistics',
  },

  // Data Subject Rights (DSR)
  DSR: {
    DATA_EXPORT: 'dsr/data-export',
    VERIFY_DATA_EXPORT: (requestId: string) => `dsr/data-export/${requestId}/verify`,
    COMPLETE_DATA_EXPORT: (requestId: string) => `dsr/data-export/${requestId}/complete`,
    DATA_ERASURE: 'dsr/data-erasure',
    VERIFY_DATA_ERASURE: (requestId: string) => `dsr/data-erasure/${requestId}/verify`,
    REVIEW_DATA_ERASURE: (requestId: string) => `dsr/data-erasure/${requestId}/review`,
    COMPLETE_DATA_ERASURE: (requestId: string) => `dsr/data-erasure/${requestId}/complete`,
    AUDIT_LOGS: 'dsr/audit-logs',
    DATA_RETENTION_COMPLIANCE: 'dsr/data-retention/compliance',
  },

  // Agents
  AGENTS: {
    LIST: 'agents',
    DETAIL: (id: string) => `agents/${id}`,
    CREATE: 'agents',
    UPDATE: (id: string) => `agents/${id}`,
    DELETE: (id: string) => `agents/${id}`,
    STATISTICS: 'agents/statistics',
    ACTIVE: 'agents/active',
  },

  // File Upload
  UPLOAD: {
    SINGLE: 'upload/single',
    MULTIPLE: 'upload/multiple',
    PROFILE: (userId?: string) => userId ? `upload/profile/${userId}` : 'upload/profile',
    DOCUMENT: 'upload/document',
    PRESIGNED_URL: (key: string) => `upload/presigned/${key}`,
    DELETE: (key: string) => `upload/${key}`,
    METADATA: (key: string) => `upload/metadata/${key}`,
    LIST: 'upload/list',
    BULK_DELETE: 'upload/bulk-delete',
  },

  // Analytics
  ANALYTICS: {
    // Admin Analytics
    INSTITUTION_GROWTH: 'analytics/institution-growth',
    PLAN_DISTRIBUTION: 'analytics/plan-distribution',
    CHURN_RATE: 'analytics/churn-rate',
    RENEWAL_RATE: 'analytics/renewal-rate',
    REVENUE: 'analytics/revenue',
    
    // Student Analytics
    STUDENT: {
      PERFORMANCE: 'analytics/student/performance',
      ATTENDANCE: 'analytics/student/attendance',
      HOMEWORK: 'analytics/student/homework',
      EXAMS: 'analytics/student/exams',
    },
    
    // Teacher Analytics
    TEACHER: {
      PERFORMANCE: 'analytics/teacher/performance',
      ATTENDANCE: 'analytics/teacher/attendance',
      CLASSES: 'analytics/teacher/classes',
      EXAMS: 'analytics/teacher/exams',
    },
    
    // Dashboard Analytics
    DASHBOARD: {
      ACADEMIC: 'dashboard/academic',
      STATS: 'dashboard/stats',
      FINANCE: 'dashboard/finance',
      INSTITUTION: 'dashboard/institution',
      PLANS: 'dashboard/plans',
      CHURN: 'dashboard/churn',
    },
  },
};
