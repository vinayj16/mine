// Role-based dashboard configuration

// Type definitions for dashboard items
type DashboardItem = {
  label: string;
  path: string;
  icon: string;
  canManageInstitution?: boolean;
  institutionId?: boolean;
  type?: string;
  roles?: string[];
  [key: string]: any;
};

type SidebarMenuItem = {
  label: string;
  path?: string;
  icon?: string;
  type?: string;
  roles?: string[];
};

type RoleKey = 'superadmin' | 'institution-admin' | 'principal' | 'admin' | 'teacher' | 'student' | 'parent' | 'accountant' | 'staff';

// Maps roles to their dashboard endpoints
export const roleDashboardConfig: Record<string, any> = {
  // Super Admin - Global
  superadmin: {
    dashboard: '/super-admin/dashboard',
    sidebar: 'super-admin',
    label: 'Super Admin',
    canManageInstitution: true
  },
  
  // Institution Admin - Manages institution operations
  institution_admin: {
    dashboard: '/dashboard/institute-admin', 
    sidebar: 'institution-admin',
    label: 'Institution Admin',
    institutionId: true,
    canManageInstitution: true
  },
  
  // Principal - Academic head
  principal: {
    dashboard: '/dashboard/principal',
    sidebar: 'principal',
    label: 'Principal',
    institutionId: true,
    canManageInstitution: false
  },
  
  // Admin - School level admin
  admin: {
    dashboard: '/dashboard/admin',
    sidebar: 'admin',
    label: 'Administrator',
    institutionId: true,
    canManageInstitution: false
  },
  
  // Teacher
  teacher: {
    dashboard: '/dashboard/teacher',
    sidebar: 'teacher',
    label: 'Teacher',
    institutionId: true,
    canManageInstitution: false
  },
  
  // Student
  student: {
    dashboard: '/dashboard/student',
    sidebar: 'student',
    label: 'Student',
    institutionId: true,
    canManageInstitution: false
  },
  
  // Parent
  parent: {
    dashboard: '/dashboard/parent',
    sidebar: 'parent',
    label: 'Parent',
    institutionId: true,
    canManageInstitution: false
  },
  
  // Accountant
  accountant: {
    dashboard: '/dashboard/accountant',
    sidebar: 'accountant',
    label: 'Accountant',
    institutionId: true,
    canManageInstitution: false
  },
  
  // HR Manager
  hr_manager: {
    dashboard: '/dashboard/hr',
    sidebar: 'hr',
    label: 'HR Manager',
    institutionId: true,
    canManageInstitution: false
  },

  // Staff
  staff: {
    dashboard: '/dashboard/staff',
    sidebar: 'staff',
    label: 'Staff',
    institutionId: true,
    canManageInstitution: false
  }
};

// Sidebar menu items per role
export const roleSidebarMenus = {
  'institution-admin': [
    { label: 'Main Dashboard', path: '/dashboard', icon: 'ti ti-home' },
    { label: 'Analytics', path: '/dashboard/analytics', icon: 'ti ti-chart-bar' },
    { label: 'Finance', path: '/dashboard/finance', icon: 'ti ti-money' },
    { label: 'USER MANAGEMENT', type: 'header' },
    { label: 'Create Credentials', path: '/dashboard/create-credentials', icon: 'ti ti-plus' },
    { label: 'User Directory', path: '/dashboard/users', icon: 'ti ti-list' },
    { label: 'ACADEMIC', type: 'header' },
    { label: 'Classes', path: '/dashboard/classes', icon: 'ti ti-book' },
    { label: 'Sections', path: '/dashboard/sections', icon: 'ti ti-list' },
    { label: 'Subjects', path: '/dashboard/subjects', icon: 'ti ti-notebook' },
    { label: 'Teachers', path: '/dashboard/teachers', icon: 'ti ti-user' },
    { label: 'Students', path: '/dashboard/students', icon: 'ti ti-users' },
    { label: 'Parents', path: '/dashboard/parents', icon: 'ti ti-user' },
    { label: 'ATTENDANCE', type: 'header' },
    { label: 'Student Attendance', path: '/dashboard/attendance', icon: 'ti ti-check' },
    { label: 'Staff Attendance', path: '/dashboard/staff-attendance', icon: 'ti ti-user-check' },
    { label: 'FEES', type: 'header' },
    { label: 'Fees Collection', path: '/dashboard/fees', icon: 'ti ti-dollar' },
    { label: 'FINANCE', type: 'header' },
    { label: 'Expenses', path: '/dashboard/expenses', icon: 'ti ti-minus' },
    { label: 'Income', path: '/dashboard/income', icon: 'ti ti-plus' },
    { label: 'REPORTS', type: 'header' },
    { label: 'Attendance Report', path: '/dashboard/reports/attendance', icon: 'ti ti-file' },
    { label: 'Fees Report', path: '/dashboard/reports/fees', icon: 'ti ti-file' },
  ],
  
  'principal': [
    { label: 'Main Dashboard', path: '/dashboard', icon: 'ti ti-home' },
    { label: 'Teaching Overview', path: '/dashboard/teaching', icon: 'ti ti-book' },
    { label: 'Student Overview', path: '/dashboard/students', icon: 'ti ti-users' },
    { label: 'Staff Overview', path: '/dashboard/staff', icon: 'ti ti-users' },
    { label: 'ACADEMIC', type: 'header' },
    { label: 'Classes', path: '/dashboard/classes', icon: 'ti ti-book' },
    { label: 'Sections', path: '/dashboard/sections', icon: 'ti ti-list' },
    { label: 'Subjects', path: '/dashboard/subjects', icon: 'ti ti-notebook' },
    { label: 'Syllabus', path: '/dashboard/syllabus', icon: 'ti ti-list' },
    { label: 'Class Routine', path: '/dashboard/routine', icon: 'ti ti-clock' },
    { label: 'Homework', path: '/dashboard/homework', icon: 'ti ti-home' },
    { label: 'ATTENDANCE', type: 'header' },
    { label: 'Student Attendance', path: '/dashboard/attendance', icon: 'ti ti-check' },
    { label: 'EXAMINATIONS', type: 'header' },
    { label: 'Exam', path: '/dashboard/exam', icon: 'ti ti-file' },
    { label: 'Grades', path: '/dashboard/grades', icon: 'ti ti-star' },
    { label: 'Results', path: '/dashboard/results', icon: 'ti ti-trophy' },
  ],
  
  'admin': [
    { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-home' },
    { label: 'USER MANAGEMENT', type: 'header' },
    { label: 'Students', path: '/dashboard/students', icon: 'ti ti-users' },
    { label: 'Teachers', path: '/dashboard/teachers', icon: 'ti ti-user' },
    { label: 'Parents', path: '/dashboard/parents', icon: 'ti ti-user' },
    { label: 'Staff', path: '/dashboard/staff', icon: 'ti ti-users' },
  ],
  
  'teacher': [
    { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-home' },
    { label: 'My Classes', path: '/dashboard/classes', icon: 'ti ti-book' },
    { label: 'Subjects', path: '/dashboard/subjects', icon: 'ti ti-notebook' },
    { label: 'Homework', path: '/dashboard/homework', icon: 'ti ti-home' },
    { label: 'Attendance', path: '/dashboard/attendance', icon: 'ti ti-check' },
    { label: 'Grades', path: '/dashboard/grades', icon: 'ti ti-star' },
  ],
  
  'student': [
    { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-home' },
    { label: 'My Subjects', path: '/dashboard/subjects', icon: 'ti ti-notebook' },
    { label: 'Homework', path: '/dashboard/homework', icon: 'ti ti-home' },
    { label: 'Attendance', path: '/dashboard/attendance', icon: 'ti ti-check' },
    { label: 'Grades', path: '/dashboard/grades', icon: 'ti ti-star' },
    { label: 'Fees', path: '/dashboard/fees', icon: 'ti ti-dollar' },
  ],
  
  'parent': [
    { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-home' },
    { label: 'My Children', path: '/dashboard/children', icon: 'ti ti-user' },
    { label: 'Attendance', path: '/dashboard/attendance', icon: 'ti ti-check' },
    { label: 'Homework', path: '/dashboard/homework', icon: 'ti ti-home' },
    { label: 'Grades', path: '/dashboard/grades', icon: 'ti ti-star' },
    { label: 'Fees', path: '/dashboard/fees', icon: 'ti ti-dollar' },
  ],
  
  'accountant': [
    { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-home' },
    { label: 'Fees Collection', path: '/dashboard/fees', icon: 'ti ti-dollar' },
    { label: 'Expenses', path: '/dashboard/expenses', icon: 'ti ti-minus' },
    { label: 'Income', path: '/dashboard/income', icon: 'ti ti-plus' },
    { label: 'Invoices', path: '/dashboard/invoices', icon: 'ti ti-file' },
  ],

  'staff': [
    { label: 'Dashboard', path: '/dashboard/staff', icon: 'ti ti-home' },
    { label: 'My Profile', path: '/staff/profile', icon: 'ti ti-user' },
    { label: 'Attendance', path: '/staff/attendance', icon: 'ti ti-check' },
    { label: 'Staff Directory', path: '/dashboard/staffs', icon: 'ti ti-users' },
  ]
};

// Get dashboard config by role
export const getDashboardConfig = (role: string): any => {
  const normalizedRole = role?.toLowerCase().replace(' ', '_');
  return roleDashboardConfig[normalizedRole] || roleDashboardConfig['admin'];
};

// Get sidebar menu by role
export const getSidebarMenu = (role: string): any => {
  const normalizedRole = role?.toLowerCase().replace(' ', '_');
  return roleSidebarMenus[normalizedRole] || roleSidebarMenus['admin'];
};

export default {
  roleDashboardConfig,
  roleSidebarMenus,
  getDashboardConfig,
  getSidebarMenu
};