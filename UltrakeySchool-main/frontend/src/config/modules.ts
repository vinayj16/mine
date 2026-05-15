/**
 * Unified Module Configuration for EduManage Pro
 * Defines all available modules, their properties, and access controls
 */

export interface Module {
  key: string;
  legacyKey?: string;
  name: string;
  icon: string;
  description: string;
  category: 'core' | 'academic' | 'management' | 'finance' | 'operations' | 'communication' | 'reports' | 'settings' | 'billing';
  allowedRoutes: string[];
  defaultEnabledPlans: ('basic' | 'medium' | 'premium')[];
  isPremiumOnly?: boolean;
  isMediumOrHigher?: boolean;
  isSuperAdminOnly?: boolean;
  basicLimits?: string[];
  institutionTypes?: string[]; // Restrict module to specific institution types
}

export const MODULES: Module[] = [
  // MODULE 1: Dashboards
  {
    key: 'dashboards',
    legacyKey: 'DASHBOARD',
    name: 'Dashboards',
    icon: 'ti ti-layout-dashboard',
    description: 'Role-specific dashboard charts and operational metrics (Note: Different from Overview Analytics - this is for role-based operational views)',
    category: 'core',
    allowedRoutes: [
      '/dashboard/main',
      '/dashboard/analytics',
      '/dashboard/finance',
      '/dashboard/teacher',
      '/dashboard/student',
      '/dashboard/parent',
      '/dashboard/hr',
      '/dashboard/library',
      '/transport',
      '/dashboard/hostel'
    ],
    defaultEnabledPlans: ['basic', 'medium', 'premium']
  },

  // MODULE 2: Student Management
  {
    key: 'students',
    legacyKey: 'STUDENTS',
    name: 'Student Management',
    icon: 'ti ti-users',
    description: 'Complete student information management system',
    category: 'core',
    allowedRoutes: [
      '/students',
      '/students/add',
      '/students/:id',
      '/students/promotion',
      '/students/timetable',
      '/students/leaves',
      '/students/fees',
      '/students/results',
      '/students/library'
    ],
    defaultEnabledPlans: ['basic', 'medium', 'premium'],
    basicLimits: ['Limited to 100 students']
  },

  // MODULE 3: Parent & Guardian Management
  {
    key: 'parents',
    legacyKey: 'PARENTS',
    name: 'Parent & Guardian Management',
    icon: 'ti ti-user-heart',
    description: 'Parent and guardian information management',
    category: 'core',
    allowedRoutes: [
      '/parents',
      '/parents/:id',
      '/guardians'
    ],
    defaultEnabledPlans: ['basic', 'medium', 'premium']
  },

  // MODULE 4: Teacher Management
  {
    key: 'teachers',
    legacyKey: 'TEACHERS',
    name: 'Teacher Management',
    icon: 'ti ti-user-check',
    description: 'Teacher information and management system',
    category: 'core',
    allowedRoutes: [
      '/teachers',
      '/teachers/:id',
      '/teachers/routine',
      '/teachers/leaves',
      '/teachers/salary',
      '/teachers/library'
    ],
    defaultEnabledPlans: ['basic', 'medium', 'premium']
  },

  // MODULE 5: Academic Management
  {
    key: 'academics',
    legacyKey: 'ACADEMICS',
    name: 'Academic Management',
    icon: 'ti ti-book',
    description: 'Classes, subjects, syllabus, and curriculum management',
    category: 'academic',
    allowedRoutes: [
      '/class',
      '/class-section',
      '/class-subject',
      '/syllabus',
      '/classroom',
      '/class-routine',
      '/class-timetable',
      '/homework'
    ],
    defaultEnabledPlans: ['basic', 'medium', 'premium'],
    basicLimits: ['Limited to basic class management']
  },

  // MODULE 6: Attendance
  {
    key: 'attendance',
    legacyKey: 'ATTENDANCE',
    name: 'Attendance Management',
    icon: 'ti ti-calendar-check',
    description: 'Student, teacher, and staff attendance tracking (CRITICAL: Backend must enforce plan-based restrictions. Example: if (plan === \'basic\' && route !== \'/attendance/student\') deny(). Frontend restrictions alone are insufficient)',
    category: 'academic',
    allowedRoutes: [
      '/attendance/student',
      '/attendance/teacher',
      '/attendance/staff'
    ],
    defaultEnabledPlans: ['basic', 'medium', 'premium'],
    basicLimits: ['Basic plan: Student attendance only', 'Teacher & staff attendance require Medium+ plans (backend enforcement required)']
  },

  // MODULE 7: Exams & Results
  {
    key: 'exams',
    legacyKey: 'EXAMS',
    name: 'Exams & Results',
    icon: 'ti ti-file-text',
    description: 'Exam scheduling, grading, and result management',
    category: 'academic',
    allowedRoutes: [
      '/exam',
      '/exam-schedule',
      '/grades',
      '/exam-attendance',
      '/exam-results'
    ],
    defaultEnabledPlans: ['medium', 'premium'],
    isMediumOrHigher: true
  },

  // MODULE 8: Fees & Finance
  {
    key: 'fees',
    legacyKey: 'FEES',
    name: 'Fees & Finance',
    icon: 'ti ti-credit-card',
    description: 'Fee collection, invoicing, and financial management',
    category: 'finance',
    allowedRoutes: [
      '/fees/group',
      '/fees/type',
      '/fees/master',
      '/fees/assign',
      '/fees/collect'
    ],
    defaultEnabledPlans: ['medium', 'premium'],
    isMediumOrHigher: true
  },

  // MODULE 9: Accounts
  {
    key: 'accounts',
    legacyKey: 'ACCOUNTS',
    name: 'Accounts Management',
    icon: 'ti ti-chart-pie',
    description: 'Expenses, income, invoices, and transactions',
    category: 'finance',
    allowedRoutes: [
      '/accounts/expenses',
      '/accounts/expense-categories',
      '/accounts/income',
      '/accounts/invoices',
      '/accounts/transactions'
    ],
    defaultEnabledPlans: ['medium', 'premium'],
    isMediumOrHigher: true
  },

  // MODULE 10: Library
  {
    key: 'library',
    legacyKey: 'LIBRARY',
    name: 'Library Management',
    icon: 'ti ti-book-2',
    description: 'Book catalog, member management, and circulation',
    category: 'management',
    allowedRoutes: [
      '/library/members',
      '/library/books',
      '/library/issue',
      '/library/return'
    ],
    defaultEnabledPlans: ['medium', 'premium'],
    isMediumOrHigher: true
  },

  // MODULE 11: Transport
  {
    key: 'transport',
    legacyKey: 'TRANSPORT',
    name: 'Transport Management',
    icon: 'ti ti-car',
    description: 'Vehicle routing, pickup points, and driver management',
    category: 'operations',
    allowedRoutes: [
      '/transport',
      '/transport/routes',
      '/transport/pickup-points',
      '/transport/vehicles',
      '/transport/drivers',
      '/transport/assign',
      '/transport/reports'
    ],
    defaultEnabledPlans: ['premium'],
    isPremiumOnly: true
  },

  // MODULE 12: Hostel
  {
    key: 'hostel',
    legacyKey: 'HOSTEL',
    name: 'Hostel Management',
    icon: 'ti ti-building',
    description: 'Hostel facilities, rooms, and resident management',
    category: 'operations',
    allowedRoutes: [
      '/hostel/list',
      '/hostel/rooms',
      '/hostel/room-types',
      '/hostel/reports'
    ],
    defaultEnabledPlans: ['premium'],
    isPremiumOnly: true
  },

  // MODULE 13: HR & Payroll
  {
    key: 'hr',
    legacyKey: 'HR_PAYROLL',
    name: 'HR & Payroll',
    icon: 'ti ti-users-group',
    description: 'Staff management, payroll, and HR operations',
    category: 'management',
    allowedRoutes: [
      '/staffs',
      '/staffs/documents',
      '/departments',
      '/designations',
      '/staff-leaves',
      '/approvals',
      '/holidays',
      '/payroll'
    ],
    defaultEnabledPlans: ['premium'],
    isPremiumOnly: true
  },

  // MODULE 14: Communication
  {
    key: 'communication',
    legacyKey: 'COMMUNICATION',
    name: 'Communication',
    icon: 'ti ti-speakerphone',
    description: 'Notices, events, and school-wide announcements',
    category: 'communication',
    allowedRoutes: [
      '/notice-board',
      '/events'
    ],
    defaultEnabledPlans: ['basic', 'medium', 'premium']
  },

  // MODULE 15: Reports
  {
    key: 'reports',
    legacyKey: 'REPORTS',
    name: 'Reports',
    icon: 'ti ti-file-description',
    description: 'Comprehensive reporting and analytics (IMPORTANT: Plan-based restrictions in defaultEnabledPlans are different from role-based restrictions. Backend must enforce role restrictions separately. Example: /reports/class requires INSTITUTION_ADMIN role regardless of plan)',
    category: 'reports',
    allowedRoutes: [
      '/reports/attendance',
      '/reports/class',
      '/reports/student',
      '/reports/grade',
      '/reports/leave',
      '/reports/fees',
      '/reports/library'
    ],
    defaultEnabledPlans: ['basic', 'medium', 'premium'],
    basicLimits: ['Limited to basic reports', 'Class reports restricted to Institution Admin only (role-based, not plan-based)']
  },

  // MODULE 16: User & Role Management
  {
    key: 'users',
    legacyKey: 'USER_MANAGEMENT',
    name: 'User & Role Management',
    icon: 'ti ti-user-cog',
    description: 'User accounts, roles, and permission management (IMPORTANT: /branches route restricted to INSTITUTION_ADMIN only. Hierarchy: Platform → Institution → Branch → Users. Backend must enforce branch ownership and prevent admin from accessing branches)',
    category: 'settings',
    allowedRoutes: [
      '/branches',
      '/users',
      '/roles-permission',
      '/delete-requests'
    ],
    defaultEnabledPlans: ['basic', 'medium', 'premium']
  },

  // MODULE 17: Settings
  {
    key: 'settings',
    legacyKey: 'SETTINGS',
    name: 'Settings',
    icon: 'ti ti-settings',
    description: 'System configuration and school settings',
    category: 'settings',
    allowedRoutes: [
      '/settings/modules',
      '/settings/profile',
      '/settings/security',
      '/settings/notifications',
      '/settings/company',
      '/settings/localization',
      '/settings/email',
      '/settings/sms',
      '/settings/payment',
      '/settings/tax',
      '/settings/school',
      '/settings/storage'
    ],
    defaultEnabledPlans: ['basic', 'medium', 'premium'],
    basicLimits: ['Some settings locked by plan']
  },

  // MODULE 18: Membership & Billing (Super Admin Only)
  {
    key: 'membership',
    legacyKey: 'MEMBERSHIP',
    name: 'Membership & Billing',
    icon: 'ti ti-crown',
    description: 'Platform membership plans and billing management',
    category: 'billing',
    allowedRoutes: [
      '/super-admin/memberships',
      '/super-admin/transactions'
    ],
    defaultEnabledPlans: [], // Super Admin only, plan doesn't matter
    isSuperAdminOnly: true
  },

  // MODULE 19: Sports Management
  {
    key: 'sports',
    legacyKey: 'SPORTS',
    name: 'Sports Management',
    icon: 'ti ti-ball-basketball',
    description: 'Sports activities and team management',
    category: 'operations',
    allowedRoutes: [
      '/sports'
    ],
    defaultEnabledPlans: ['medium', 'premium'],
    isMediumOrHigher: true
  },

  // MODULE 20: Support Management
  {
    key: 'support',
    legacyKey: 'SUPPORT',
    name: 'Support Management',
    icon: 'ti ti-ticket',
    description: 'Support tickets and help desk management',
    category: 'communication',
    allowedRoutes: [
      '/support/tickets'
    ],
    defaultEnabledPlans: ['basic', 'medium', 'premium']
  },

  // MODULE 21: Communication Messages
  {
    key: 'messages',
    legacyKey: 'MESSAGES',
    name: 'Communication Messages',
    icon: 'ti ti-message-circle',
    description: 'Internal messaging and communication system',
    category: 'communication',
    allowedRoutes: [
      '/messages'
    ],
    defaultEnabledPlans: ['basic', 'medium', 'premium']
  },

  // MODULE 22: Overview Analytics
  {
    key: 'overview',
    legacyKey: 'OVERVIEW',
    name: 'Overview Analytics',
    icon: 'ti ti-chart-line',
    description: 'Institution-level summary analytics and comprehensive reporting (Note: Different from Dashboard Analytics - this is for institutional overview and summary statistics)',
    category: 'reports',
    allowedRoutes: [
      '/overview/teachers',
      '/overview/students',
      '/overview/parents'
    ],
    defaultEnabledPlans: ['medium', 'premium'],
    isMediumOrHigher: true
  },

  // MODULE 23: Platform Administration (Super Admin Only)
  {
    key: 'platform_admin',
    legacyKey: 'PLATFORM_ADMIN',
    name: 'Platform Administration',
    icon: 'ti ti-shield-check',
    description: 'Super Admin platform management and administration',
    category: 'settings',
    allowedRoutes: [
      '/super-admin/dashboard',
      '/super-admin/schools',
      '/super-admin/tickets',
      '/super-admin/analytics',
      '/super-admin/modules',
      '/super-admin/alerts',
      '/super-admin/audit-logs',
      '/super-admin/impersonate',
      '/super-admin/settings'
    ],
    defaultEnabledPlans: [], // Super Admin only, plan doesn't matter
    isSuperAdminOnly: true
  },

  // INTER COLLEGE SPECIFIC MODULES
  // MODULE 24: Inter College Academics
  {
    key: 'inter_academics',
    legacyKey: 'INTER_ACADEMICS',
    name: 'Inter College Academics',
    icon: 'ti ti-school',
    description: 'Intermediate college academic management (Years, Streams, Sections)',
    category: 'academic',
    allowedRoutes: [
      '/inter-years',
      '/inter-years/add',
      '/inter-years/:id',
      '/streams',
      '/streams/add',
      '/streams/:id',
      '/streams/:id/subjects'
    ],
    defaultEnabledPlans: ['medium', 'premium'],
    isMediumOrHigher: true,
    institutionTypes: ['INTER_COLLEGE']
  },

  // MODULE 25: Practicals & Labs
  {
    key: 'practicals',
    legacyKey: 'PRACTICALS',
    name: 'Practicals & Labs',
    icon: 'ti ti-flask',
    description: 'Practical exams, lab management, and practical attendance',
    category: 'academic',
    allowedRoutes: [
      '/practicals',
      '/practicals/schedule',
      '/practicals/attendance',
      '/practicals/marks',
      '/labs',
      '/labs/:id'
    ],
    defaultEnabledPlans: ['medium', 'premium'],
    isMediumOrHigher: true,
    institutionTypes: ['INTER_COLLEGE', 'DEGREE_COLLEGE']
  },

  // DEGREE COLLEGE SPECIFIC MODULES
  // MODULE 26: Departments
  {
    key: 'departments',
    legacyKey: 'DEPARTMENTS',
    name: 'Departments',
    icon: 'ti ti-building-factory',
    description: 'Department management and HOD assignments',
    category: 'academic',
    allowedRoutes: [
      '/departments',
      '/departments/add',
      '/departments/:id',
      '/departments/:id/faculty',
      '/departments/:id/courses'
    ],
    defaultEnabledPlans: ['medium', 'premium'],
    isMediumOrHigher: true,
    institutionTypes: ['DEGREE_COLLEGE']
  },

  // MODULE 27: Courses
  {
    key: 'courses',
    legacyKey: 'COURSES',
    name: 'Courses',
    icon: 'ti ti-book',
    description: 'Degree course management with credit system',
    category: 'academic',
    allowedRoutes: [
      '/courses',
      '/courses/add',
      '/courses/:id',
      '/courses/:id/semesters',
      '/courses/:id/students'
    ],
    defaultEnabledPlans: ['medium', 'premium'],
    isMediumOrHigher: true,
    institutionTypes: ['DEGREE_COLLEGE']
  },

  // MODULE 28: Semesters
  {
    key: 'semesters',
    legacyKey: 'SEMESTERS',
    name: 'Semesters',
    icon: 'ti ti-calendar-event',
    description: 'Semester management and subject allocation',
    category: 'academic',
    allowedRoutes: [
      '/semesters',
      '/semesters/add',
      '/semesters/:id',
      '/semesters/:id/subjects',
      '/semesters/:id/timetable',
      '/semesters/:id/exams'
    ],
    defaultEnabledPlans: ['medium', 'premium'],
    isMediumOrHigher: true,
    institutionTypes: ['DEGREE_COLLEGE']
  },

  // MODULE 29: Internal Assessments
  {
    key: 'internal_assessments',
    legacyKey: 'INTERNAL_ASSESSMENTS',
    name: 'Internal Assessments',
    icon: 'ti ti-clipboard-check',
    description: 'Internal exams, assignments, and assessment tracking',
    category: 'academic',
    allowedRoutes: [
      '/internal-assessments',
      '/internal-assessments/assignments',
      '/internal-assessments/mid-exams',
      '/internal-assessments/presentations',
      '/internal-assessments/marks'
    ],
    defaultEnabledPlans: ['medium', 'premium'],
    isMediumOrHigher: true,
    institutionTypes: ['DEGREE_COLLEGE']
  },

  // MODULE 30: Examinations (Degree College)
  {
    key: 'examinations',
    legacyKey: 'EXAMINATIONS',
    name: 'Examinations',
    icon: 'ti ti-file-text',
    description: 'University examination system with GPA/CGPA',
    category: 'academic',
    allowedRoutes: [
      '/examinations',
      '/examinations/hall-tickets',
      '/examinations/schedule',
      '/examinations/results',
      '/examinations/gpa-calculator',
      '/examinations/backlog',
      '/examinations/revaluation'
    ],
    defaultEnabledPlans: ['medium', 'premium'],
    isMediumOrHigher: true,
    institutionTypes: ['DEGREE_COLLEGE']
  },

  // MODULE 31: Placement
  {
    key: 'placement',
    legacyKey: 'PLACEMENT',
    name: 'Placement',
    icon: 'ti ti-briefcase',
    description: 'Campus placement and company management',
    category: 'operations',
    allowedRoutes: [
      '/placement',
      '/placement/companies',
      '/placement/drives',
      '/placement/students',
      '/placement/offers',
      '/placement/reports'
    ],
    defaultEnabledPlans: ['premium'],
    isPremiumOnly: true,
    institutionTypes: ['DEGREE_COLLEGE']
  },

  // MODULE 32: Research & Projects
  {
    key: 'research',
    legacyKey: 'RESEARCH',
    name: 'Research & Projects',
    icon: 'ti ti-microscope',
    description: 'Final year projects and research management',
    category: 'academic',
    allowedRoutes: [
      '/research',
      '/research/projects',
      '/research/guides',
      '/research/viva',
      '/research/publications'
    ],
    defaultEnabledPlans: ['premium'],
    isPremiumOnly: true,
    institutionTypes: ['DEGREE_COLLEGE']
  }
];

// Helper functions
export const getModuleByKey = (key: string): Module | undefined => {
  return MODULES.find(module => module.key === key);
};

export const getModulesByCategory = (category: Module['category']): Module[] => {
  return MODULES.filter(module => module.category === category);
};

export const getModulesByPlan = (plan: 'basic' | 'medium' | 'premium'): Module[] => {
  return MODULES.filter(module => 
    module.defaultEnabledPlans.includes(plan) || 
    module.isSuperAdminOnly
  );
};

export const isModuleEnabledForPlan = (moduleKey: string, plan: 'basic' | 'medium' | 'premium'): boolean => {
  const module = getModuleByKey(moduleKey);
  if (!module) return false;
  if (module.isSuperAdminOnly) return true; // Super Admin always has access
  return module.defaultEnabledPlans.includes(plan);
};

export const getModuleLimits = (moduleKey: string, plan: 'basic' | 'medium' | 'premium'): string[] => {
  const module = getModuleByKey(moduleKey);
  if (!module) return [];
  
  if (plan === 'basic' && module.basicLimits) {
    return module.basicLimits;
  }
  
  return [];
};

export const getModulesByInstitutionType = (institutionType: string): Module[] => {
  return MODULES.filter(module => 
    !module.institutionTypes || 
    module.institutionTypes.includes(institutionType)
  );
};

export const getModuleRoutes = (moduleKey: string): string[] => {
  const module = getModuleByKey(moduleKey);
  return module ? module.allowedRoutes : [];
};

export const isModuleSuperAdminOnly = (moduleKey: string): boolean => {
  const module = getModuleByKey(moduleKey);
  return module ? module.isSuperAdminOnly || false : false;
};

export const isModulePremiumOnly = (moduleKey: string): boolean => {
  const module = getModuleByKey(moduleKey);
  return module ? module.isPremiumOnly || false : false;
};

export const isModuleMediumOrHigher = (moduleKey: string): boolean => {
  const module = getModuleByKey(moduleKey);
  return module ? module.isMediumOrHigher || false : false;
};

export const getModuleCategories = (): Module['category'][] => {
  const categories = MODULES.map(module => module.category);
  return Array.from(new Set(categories)); // Remove duplicates
};

export const getModulesForComparison = (): Module[] => {
  return MODULES.map(module => ({
    ...module,
    // Add computed properties for comparison
    planLevel: module.isPremiumOnly ? 'Premium' : 
               module.isMediumOrHigher ? 'Medium+' : 
               module.isSuperAdminOnly ? 'Super Admin' : 'Basic+'
  }));
};

export const searchModules = (query: string): Module[] => {
  const lowerQuery = query.toLowerCase();
  return MODULES.filter(module => 
    module.name.toLowerCase().includes(lowerQuery) ||
    module.description.toLowerCase().includes(lowerQuery) ||
    module.key.toLowerCase().includes(lowerQuery)
  );
};
