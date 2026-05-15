/**
 * Role-Based Permissions Configuration
 * Defines what each role can access and perform in the system
 */

export const ROLE_PERMISSIONS = {
  // SUPER_ADMIN - Full system access, can manage all institutions
  superadmin: {
    label: 'Super Admin',
    description: 'Full system access across all institutions',
    dashboards: ['/super-admin/dashboard'],
    permissions: [
      'institutions.create',
      'institutions.read',
      'institutions.update',
      'institutions.delete',
      'institutions.view_users',
      'institutions.manage_subscriptions',
      'institutions.manage_modules',
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      'users.view_all',
      'settings.platform',
      'settings.system',
      'reports.all',
      'analytics.all',
      'support.manage',
      'agents.manage',
      'branches.manage',
      'transactions.view_all',
      'invoices.view_all'
    ],
    modules: ['*'],
    canAccessAllInstitutions: true
  },

  // INSTITUTION_OWNER - Owns and manages their institution
  institution_owner: {
    label: 'Institution Owner',
    description: 'Owns and manages their institution',
    dashboards: ['/dashboard/institute-admin'],
    permissions: [
      'institution.read',
      'institution.update',
      'institution.manage_settings',
      'institution.manage_subscription',
      'institution.manage_modules',
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      'users.view_institution',
      'staff.manage',
      'teachers.manage',
      'students.manage',
      'parents.manage',
      'finance.manage',
      'fees.manage',
      'attendance.manage',
      'exams.manage',
      'reports.institution',
      'analytics.institution',
      'transport.manage',
      'hostel.manage',
      'library.manage',
      'hr.manage'
    ],
    modules: ['*'],
    canAccessAllInstitutions: false
  },

  // INSTITUTION_ADMIN - Institution-level administrator
  institution_admin: {
    label: 'Institution Admin',
    description: 'Manages institution settings and operations',
    dashboards: ['/dashboard/main'],
    permissions: [
      'institution.read',
      'institution.update',
      'institution.manage_settings',
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      'users.view_institution',
      'staff.manage',
      'teachers.manage',
      'students.manage',
      'parents.manage',
      'finance.manage',
      'fees.manage',
      'attendance.manage',
      'exams.manage',
      'reports.institution',
      'analytics.institution',
      'transport.manage',
      'hostel.manage',
      'library.manage',
      'hr.manage',
      'departments.manage',
      'designations.manage',
      'leaves.manage',
      'payroll.manage'
    ],
    modules: ['*'],
    canAccessAllInstitutions: false
  },

  // ADMIN - Institution Administration
  admin: {
    label: 'Administration',
    description: 'Institution administration staff access',
    dashboards: ['/dashboard/admin'],
    permissions: [
      'users.read',
      'users.update',
      'users.view_institution',
      'staff.manage',
      'teachers.manage',
      'students.manage',
      'parents.manage',
      'finance.manage',
      'fees.manage',
      'attendance.manage',
      'exams.manage',
      'reports.institution',
      'transport.manage',
      'library.manage',
      'departments.manage',
      'designations.manage',
      'leaves.manage',
      'payroll.manage',
      'school.settings'
    ],
    modules: ['academic', 'finance', 'attendance', 'exams', 'reports', 'transport', 'library', 'hr'],
    canAccessAllInstitutions: false
  },

  // PRINCIPAL - School principal
  principal: {
    label: 'Principal',
    description: 'School management and oversight',
    dashboards: ['/dashboard/principal'],
    permissions: [
      'users.read',
      'users.view_institution',
      'teachers.manage',
      'students.manage',
      'attendance.manage',
      'exams.manage',
      'reports.institution',
      'analytics.institution',
      'finance.view',
      'fees.view',
      'transport.manage',
      'library.manage',
      'school.settings'
    ],
    modules: ['academic', 'attendance', 'exams', 'reports', 'analytics', 'transport', 'library'],
    canAccessAllInstitutions: false
  },

  // TEACHER - Teaching staff
  teacher: {
    label: 'Teacher',
    description: 'Teaching staff access',
    dashboards: ['/dashboard/teacher'],
    permissions: [
      'students.read',
      'students.view_class',
      'attendance.manage_class',
      'exams.manage_class',
      'grades.manage',
      'homework.manage',
      'reports.class',
      'library.manage',
      'attendance.view_own'
    ],
    modules: ['academic', 'attendance', 'exams', 'library'],
    canAccessAllInstitutions: false
  },

  // STUDENT - Students
  student: {
    label: 'Student',
    description: 'Student access',
    dashboards: ['/dashboard/student'],
    permissions: [
      'profile.manage',
      'attendance.view_own',
      'exams.view_own',
      'grades.view_own',
      'fees.view_own',
      'library.manage',
      'transport.view_own',
      'homework.view',
      'assignments.view'
    ],
    modules: ['academic', 'attendance', 'exams', 'library', 'transport'],
    canAccessAllInstitutions: false
  },

  // PARENT - Parents/guardians
  parent: {
    label: 'Parent',
    description: 'Parent access to child data',
    dashboards: ['/dashboard/parent'],
    permissions: [
      'children.view',
      'children.attendance_view',
      'children.exams_view',
      'children.grades_view',
      'children.fees_view',
      'communication.view',
      'transport.view_children'
    ],
    modules: ['academic', 'attendance', 'exams', 'communication', 'transport'],
    canAccessAllInstitutions: false
  },

  // STAFF_MEMBER - General staff
  staff_member: {
    label: 'Staff Member',
    description: 'General staff access',
    dashboards: ['/dashboard/staff'],
    permissions: [
      'profile.manage',
      'attendance.view_own',
      'tasks.view',
      'tasks.manage',
      'documents.view_own',
      'documents.manage_own',
      'salary.view_own',
      'leave.manage_own',
      'communication.view'
    ],
    modules: ['attendance', 'tasks', 'documents', 'hr', 'communication'],
    canAccessAllInstitutions: false
  },

  // ACCOUNTANT - Financial management
  accountant: {
    label: 'Accountant',
    description: 'Financial management access',
    dashboards: ['/dashboard/finance'],
    permissions: [
      'finance.manage',
      'fees.manage',
      'fees.collect',
      'invoices.manage',
      'expenses.manage',
      'reports.finance',
      'transactions.view_institution',
      'salary.manage',
      'payroll.manage'
    ],
    modules: ['finance', 'fees', 'reports', 'hr'],
    canAccessAllInstitutions: false
  },

  // HR_MANAGER - Human resources
  hr_manager: {
    label: 'HR Manager',
    description: 'Human resources management',
    dashboards: ['/dashboard/hr'],
    permissions: [
      'staff.manage',
      'staff.view_all',
      'departments.manage',
      'designations.manage',
      'leaves.manage',
      'leaves.approve',
      'payroll.manage',
      'salary.manage',
      'documents.manage',
      'reports.hr'
    ],
    modules: ['hr', 'staff', 'reports'],
    canAccessAllInstitutions: false
  },

  // LIBRARIAN - Library management
  librarian: {
    label: 'Librarian',
    description: 'Library management access',
    dashboards: ['/dashboard/library'],
    permissions: [
      'library.manage',
      'books.manage',
      'members.manage',
      'issues.manage',
      'returns.manage',
      'reports.library'
    ],
    modules: ['library', 'reports'],
    canAccessAllInstitutions: false
  },

  // TRANSPORT_MANAGER - Transport operations
  transport_manager: {
    label: 'Transport Manager',
    description: 'Transport operations management',
    dashboards: ['/dashboard/transport'],
    permissions: [
      'transport.manage',
      'vehicles.manage',
      'routes.manage',
      'drivers.manage',
      'assignments.manage',
      'fees.manage',
      'reports.transport'
    ],
    modules: ['transport', 'fees', 'reports'],
    canAccessAllInstitutions: false
  },

  // HOSTEL_WARDEN - Hostel management
  hostel_warden: {
    label: 'Hostel Warden',
    description: 'Hostel management access',
    dashboards: ['/dashboard/hostel'],
    permissions: [
      'hostel.manage',
      'rooms.manage',
      'allocations.manage',
      'students.view_hostel',
      'complaints.manage',
      'visitors.manage',
      'reports.hostel'
    ],
    modules: ['hostel', 'reports'],
    canAccessAllInstitutions: false
  },

  // AGENT - Agent access
  agent: {
    label: 'Agent',
    description: 'Agent access for admissions',
    dashboards: ['/agent'],
    permissions: [
      'admissions.manage',
      'students.create',
      'fees.collect',
      'reports.agent'
    ],
    modules: ['admissions', 'fees', 'reports'],
    canAccessAllInstitutions: false
  }
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role, permission) => {
  const roleConfig = ROLE_PERMISSIONS[role.toLowerCase()];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission) || roleConfig.permissions.includes('*');
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role) => {
  const roleConfig = ROLE_PERMISSIONS[role.toLowerCase()];
  return roleConfig ? roleConfig.permissions : [];
};

/**
 * Check if a role can access a specific module
 */
export const canAccessModule = (role, module) => {
  const roleConfig = ROLE_PERMISSIONS[role.toLowerCase()];
  if (!roleConfig) return false;
  return roleConfig.modules.includes('*') || roleConfig.modules.includes(module);
};

/**
 * Get dashboard paths for a role
 */
export const getRoleDashboards = (role) => {
  const roleConfig = ROLE_PERMISSIONS[role.toLowerCase()];
  return roleConfig ? roleConfig.dashboards : [];
};

export default ROLE_PERMISSIONS;
