/**
 * Unified Role Configuration for EduManage Pro
 * Defines user roles, their permissions, and access levels
 */

export type UserRole = 'super_admin' | 'institution_admin' | 'admin' | 'teacher' | 'student' | 'parent' | 'accountant' | 'hr' | 'librarian' | 'transport_manager' | 'hostel_warden' | 'principal' | 'agent' | 'staff_member';

export interface Role {
  id: string;
  name: string;
  displayName: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  category: 'admin' | 'academic' | 'staff' | 'student' | 'parent';
  permissions: {
    [moduleId: string]: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
      manageUsers: boolean;
      manageSettings: boolean;
      viewReports: boolean;
      exportData: boolean;
      approve: boolean;
      manageFinance: boolean;
    };
  };
  defaultModules: string[];
  allowedModules: string[];
  readOnlyModules?: string[];
  canAccessAllModules: boolean;
  hierarchy: number; // Lower numbers have higher hierarchy
  allowedPlans: ('basic' | 'medium' | 'premium')[];
  isSuperAdminOnly?: boolean;
  enabled: boolean;
}

// Helper function to create permissions for a module
const createPermissions = (
  create: boolean,
  read: boolean,
  update: boolean,
  del: boolean,
  manageUsers: boolean = false,
  manageSettings: boolean = false,
  viewReports: boolean = false,
  exportData: boolean = false,
  approve: boolean = false,
  manageFinance: boolean = false
) => ({
  create,
  read,
  update,
  delete: del,
  manageUsers,
  manageSettings,
  viewReports,
  exportData,
  approve,
  manageFinance
});

// Define all roles
export const ROLES: Role[] = [
  // Super Admin (Platform Owner)
  {
    id: 'super_admin',
    name: 'Super Admin',
    displayName: 'Super Admin',
    label: 'Super Admin',
    icon: 'ti ti-crown',
    color: 'danger',
    description: 'Platform owner with complete control over all schools and billing',
    category: 'admin',
    permissions: {
      dashboard: createPermissions(true, true, true, true, true, true, true, true, true, true),
      academic: createPermissions(true, true, true, true, true, true, true, true, true, true),
      attendance: createPermissions(true, true, true, true, true, true, true, true, true, true),
      fees: createPermissions(true, true, true, true, true, true, true, true, true, true),
      hrm: createPermissions(true, true, true, true, true, true, true, true, true, true),
      library: createPermissions(true, true, true, true, true, true, true, true, true, true),
      transport: createPermissions(true, true, true, true, true, true, true, true, true, true),
      hostel: createPermissions(true, true, true, true, true, true, true, true, true, true),
      examination: createPermissions(true, true, true, true, true, true, true, true, true, true),
      communication: createPermissions(true, true, true, true, true, true, true, true, true, true),
      inventory: createPermissions(true, true, true, true, true, true, true, true, true, true),
      reports: createPermissions(true, true, true, true, true, true, true, true, true, true),
      settings: createPermissions(true, true, true, true, true, true, true, true, true, true),
      membership: createPermissions(true, true, true, true, true, true, true, true, true, true),
      'user-management': createPermissions(true, true, true, true, true, true, true, true, true, true),
      students: createPermissions(true, true, true, true, true, true, true, true, true, true),
      teachers: createPermissions(true, true, true, true, true, true, true, true, true, true),
      parents: createPermissions(true, true, true, true, true, true, true, true, true, true),
      staffs: createPermissions(true, true, true, true, true, true, true, true, true, true),
      departments: createPermissions(true, true, true, true, true, true, true, true, true, true),
      designations: createPermissions(true, true, true, true, true, true, true, true, true, true),
      leaves: createPermissions(true, true, true, true, true, true, true, true, true, true),
      approvals: createPermissions(true, true, true, true, true, true, true, true, true, true),
      holidays: createPermissions(true, true, true, true, true, true, true, true, true, true),
      payroll: createPermissions(true, true, true, true, true, true, true, true, true, true),
      accounts: createPermissions(true, true, true, true, true, true, true, true, true, true)
    },
    defaultModules: ['dashboard', 'membership', 'settings'],
    allowedModules: ['membership'], // Super Admin sees membership & billing primarily
    canAccessAllModules: true,
    hierarchy: 1,
    allowedPlans: ['basic', 'medium', 'premium'],
    isSuperAdminOnly: true,
    enabled: true
  },

  // Institution Admin (Institution Owner)
  {
    id: 'institution_admin',
    name: 'Institution Admin',
    displayName: 'Institution Admin',
    label: 'Institution Admin',
    icon: 'ti ti-building',
    color: 'primary',
    description: 'Institution owner with full control over institution management',
    category: 'admin',
    permissions: {
      dashboard: createPermissions(false, true, false, false, false, false, true, true, false, false),
      academic: createPermissions(true, true, true, true, false, false, true, true, true, false),
      attendance: createPermissions(true, true, true, true, false, false, true, true, true, false),
      fees: createPermissions(true, true, true, true, false, false, true, true, true, true),
      hrm: createPermissions(true, true, true, true, false, false, true, true, true, false),
      library: createPermissions(true, true, true, true, false, false, true, true, true, false),
      transport: createPermissions(true, true, true, true, false, false, true, true, true, false),
      hostel: createPermissions(true, true, true, true, false, false, true, true, true, false),
      examination: createPermissions(true, true, true, true, false, false, true, true, true, false),
      communication: createPermissions(true, true, true, true, false, false, true, true, true, false),
      inventory: createPermissions(true, true, true, true, false, false, true, true, true, false),
      reports: createPermissions(false, true, false, false, false, false, true, true, false, false),
      settings: createPermissions(false, true, true, false, false, true, false, false, false, false),
      'user-management': createPermissions(true, true, true, true, true, false, true, true, true, false),
      students: createPermissions(true, true, true, true, false, false, true, true, true, false),
      teachers: createPermissions(true, true, true, true, false, false, true, true, true, false),
      parents: createPermissions(true, true, true, true, false, false, true, true, true, false),
      staffs: createPermissions(true, true, true, true, false, false, true, true, true, false),
      departments: createPermissions(true, true, true, true, false, false, true, true, true, false),
      designations: createPermissions(true, true, true, true, false, false, true, true, true, false),
      leaves: createPermissions(true, true, true, true, false, false, true, true, true, false),
      approvals: createPermissions(true, true, true, true, false, false, true, true, true, false),
      holidays: createPermissions(true, true, true, true, false, false, true, true, true, false),
      payroll: createPermissions(true, true, true, true, false, false, true, true, true, true),
      accounts: createPermissions(true, true, true, true, false, false, true, true, true, true)
    },
    defaultModules: ['dashboard', 'academic', 'attendance', 'fees', 'hrm'],
    allowedModules: ['dashboard', 'user-management', 'students', 'teachers', 'attendance', 'exams', 'library', 'finance', 'reports'],
    canAccessAllModules: true,
    hierarchy: 2,
    allowedPlans: ['medium', 'premium'],
    enabled: true
  },

  // Admin (Administration)
  {
    id: 'admin',
    name: 'Admin',
    displayName: 'Administration',
    label: 'Admin',
    icon: 'ti ti-user-shield',
    color: 'primary',
    description: 'Administration staff with access to manage institution operations',
    category: 'admin',
    permissions: {
      dashboard: createPermissions(false, true, false, false, false, false, true, true, false, false),
      academic: createPermissions(true, true, true, true, false, false, true, true, true, false),
      attendance: createPermissions(true, true, true, true, false, false, true, true, true, false),
      fees: createPermissions(true, true, true, true, false, false, true, true, true, true),
      hrm: createPermissions(true, true, true, true, false, false, true, true, true, false),
      library: createPermissions(true, true, true, true, false, false, true, true, true, false),
      transport: createPermissions(true, true, true, true, false, false, true, true, true, false),
      hostel: createPermissions(true, true, true, true, false, false, true, true, true, false),
      examination: createPermissions(true, true, true, true, false, false, true, true, true, false),
      communication: createPermissions(true, true, true, true, false, false, true, true, true, false),
      inventory: createPermissions(true, true, true, true, false, false, true, true, true, false),
      reports: createPermissions(false, true, false, false, false, false, true, true, false, false),
      settings: createPermissions(false, true, true, false, false, true, false, false, false, false),
      students: createPermissions(true, true, true, true, false, false, true, true, true, false),
      teachers: createPermissions(true, true, true, true, false, false, true, true, true, false),
      parents: createPermissions(true, true, true, true, false, false, true, true, true, false),
      staffs: createPermissions(true, true, true, true, false, false, true, true, true, false),
      departments: createPermissions(true, true, true, true, false, false, true, true, true, false),
      designations: createPermissions(true, true, true, true, false, false, true, true, true, false),
      leaves: createPermissions(true, true, true, true, false, false, true, true, true, false),
      approvals: createPermissions(true, true, true, true, false, false, true, true, true, false),
      holidays: createPermissions(true, true, true, true, false, false, true, true, true, false),
      payroll: createPermissions(true, true, true, true, false, false, true, true, true, true),
      accounts: createPermissions(true, true, true, true, false, false, true, true, true, true)
    },
    defaultModules: ['dashboard', 'academic', 'attendance', 'fees', 'hrm'],
    allowedModules: [
      'dashboards', 'students', 'parents', 'teachers', 'academics', 
      'attendance', 'exams', 'fees', 'accounts', 'library', 'transport', 
      'hostel', 'hr', 'communication', 'reports', 'users', 'settings'
    ],
    canAccessAllModules: true,
    hierarchy: 3,
    allowedPlans: ['basic', 'medium', 'premium'],
    enabled: true
  },

  // Teacher
  {
    id: 'teacher',
    name: 'Teacher',
    displayName: 'Teacher',
    label: 'Teacher',
    icon: 'ti ti-user-check',
    color: 'info',
    description: 'Educational staff with access to academic and attendance functions',
    category: 'academic',
    permissions: {
      dashboard: createPermissions(false, true, false, false, false, false, true, true, false, false),
      academic: createPermissions(false, true, true, false, false, false, true, true, false, false),
      attendance: createPermissions(true, true, true, false, false, false, true, true, false, false),
      fees: createPermissions(false, true, false, false, false, false, true, true, false, false),
      examination: createPermissions(false, true, true, false, false, false, true, true, false, false),
      communication: createPermissions(true, true, true, true, false, false, true, true, false, false),
      reports: createPermissions(false, true, false, false, false, false, true, true, false, false),
      library: createPermissions(false, true, false, false, false, false, true, true, false, false),
      students: createPermissions(false, true, false, false, false, false, true, true, false, false),
      teachers: createPermissions(false, true, false, false, false, false, true, true, false, false)
    },
    defaultModules: ['dashboard', 'academic', 'attendance', 'examination', 'communication'],
    allowedModules: [
      'dashboards', 'students', 'teachers', 'academics', 'attendance', 
      'exams', 'communication', 'reports', 'library'
    ],
    readOnlyModules: ['teachers'], // Can view own profile only
    canAccessAllModules: false,
    hierarchy: 4,
    allowedPlans: ['basic', 'medium', 'premium'],
    enabled: true
  },

  // Student
  {
    id: 'student',
    name: 'Student',
    displayName: 'Student',
    label: 'Student',
    icon: 'ti ti-user',
    color: 'success',
    description: 'Learner with access to personal academic information',
    category: 'student',
    permissions: {
      dashboard: createPermissions(false, true, false, false, false, false, false, false, false, false),
      academic: createPermissions(false, true, false, false, false, false, false, false, false, false),
      attendance: createPermissions(false, true, false, false, false, false, false, false, false, false),
      fees: createPermissions(false, true, false, false, false, false, false, false, false, false),
      examination: createPermissions(false, true, false, false, false, false, false, false, false, false),
      communication: createPermissions(true, true, true, true, false, false, false, false, false, false),
      library: createPermissions(false, true, false, false, false, false, false, false, false, false),
      students: createPermissions(false, true, false, false, false, false, false, false, false, false)
    },
    defaultModules: ['dashboard', 'academic', 'attendance', 'examination', 'communication'],
    allowedModules: [
      'dashboards', 'students', 'academics', 'attendance', 
      'exams', 'communication', 'reports', 'library'
    ],
    readOnlyModules: ['students', 'academics', 'attendance', 'exams', 'reports'], // Read-only access to own data
    canAccessAllModules: false,
    hierarchy: 5,
    allowedPlans: ['basic', 'medium', 'premium'],
    enabled: true
  },

  // Parent
  {
    id: 'parent',
    name: 'Parent',
    displayName: 'Parent',
    label: 'Parent',
    icon: 'ti ti-user-heart',
    color: 'warning',
    description: 'Guardian with access to children\'s academic information',
    category: 'parent',
    permissions: {
      dashboard: createPermissions(false, true, false, false, false, false, false, false, false, false),
      academic: createPermissions(false, true, false, false, false, false, false, false, false, false),
      attendance: createPermissions(false, true, false, false, false, false, false, false, false, false),
      fees: createPermissions(false, true, false, false, false, false, false, false, false, false),
      examination: createPermissions(false, true, false, false, false, false, false, false, false, false),
      communication: createPermissions(true, true, true, true, false, false, false, false, false, false),
      library: createPermissions(false, true, false, false, false, false, false, false, false, false),
      students: createPermissions(false, true, false, false, false, false, false, false, false, false)
    },
    defaultModules: ['dashboard', 'academic', 'attendance', 'examination', 'communication'],
    allowedModules: [
      'dashboards', 'students', 'attendance', 'exams', 
      'communication', 'reports', 'fees'
    ],
    readOnlyModules: ['students', 'attendance', 'exams', 'reports', 'fees'], // Read-only access to children's data
    canAccessAllModules: false,
    hierarchy: 6,
    allowedPlans: ['medium', 'premium'], // Parents only in Medium+
    enabled: true
  },

  // Accountant
  {
    id: 'accountant',
    name: 'Accountant',
    displayName: 'Accountant',
    label: 'Accountant',
    icon: 'ti ti-calculator',
    color: 'secondary',
    description: 'Financial staff with access to fees and accounts',
    category: 'staff',
    permissions: {
      dashboard: createPermissions(false, true, false, false, false, false, true, true, false, false),
      fees: createPermissions(true, true, true, true, false, false, true, true, true, true),
      accounts: createPermissions(true, true, true, false, false, false, true, true, true, true),
      reports: createPermissions(false, true, false, false, false, false, true, true, false, false),
      students: createPermissions(false, true, false, false, false, false, false, false, false, false)
    },
    defaultModules: ['dashboard', 'fees', 'accounts', 'reports'],
    allowedModules: [
      'dashboards', 'students', 'fees', 'accounts', 'reports'
    ],
    canAccessAllModules: false,
    hierarchy: 7,
    allowedPlans: ['medium', 'premium'],
    enabled: true
  },

  // HR
  {
    id: 'hr',
    name: 'HR',
    displayName: 'HR Manager',
    label: 'HR Manager',
    icon: 'ti ti-users-group',
    color: 'purple',
    description: 'Human resources staff with access to staff and payroll',
    category: 'staff',
    permissions: {
      dashboard: createPermissions(false, true, false, false, false, false, true, true, false, false),
      hrm: createPermissions(true, true, true, false, true, false, true, true, true, false),
      staffs: createPermissions(true, true, true, false, true, false, true, true, true, false),
      departments: createPermissions(true, true, true, false, false, false, true, true, false, false),
      designations: createPermissions(true, true, true, false, false, false, true, true, false, false),
      leaves: createPermissions(true, true, true, false, false, false, true, true, true, false),
      approvals: createPermissions(true, true, true, false, false, false, true, true, true, false),
      holidays: createPermissions(true, true, true, false, false, false, true, true, false, false),
      payroll: createPermissions(true, true, true, false, false, false, true, true, false, true),
      attendance: createPermissions(false, true, false, false, false, false, true, true, false, false),
      reports: createPermissions(false, true, false, false, false, false, true, true, false, false)
    },
    defaultModules: ['dashboard', 'hrm', 'staffs', 'payroll'],
    allowedModules: [
      'dashboards', 'staffs', 'departments', 'designations', 'leaves', 
      'approvals', 'holidays', 'payroll', 'reports'
    ],
    canAccessAllModules: false,
    hierarchy: 8,
    allowedPlans: ['premium'],
    enabled: true
  },

  // Librarian
  {
    id: 'librarian',
    name: 'Librarian',
    displayName: 'Librarian',
    label: 'Librarian',
    icon: 'ti ti-book-2',
    color: 'indigo',
    description: 'Library staff with access to library management',
    category: 'staff',
    permissions: {
      dashboard: createPermissions(false, true, false, false, false, false, true, true, false, false),
      library: createPermissions(true, true, true, false, false, false, true, true, true, false),
      students: createPermissions(false, true, false, false, false, false, false, false, false, false),
      reports: createPermissions(false, true, false, false, false, false, true, true, false, false)
    },
    defaultModules: ['dashboard', 'library'],
    allowedModules: ['library', 'students', 'reports'],
    canAccessAllModules: false,
    hierarchy: 9,
    allowedPlans: ['medium', 'premium'],
    enabled: true
  },

  // Transport Manager
  {
    id: 'transport_manager',
    name: 'Transport Manager',
    displayName: 'Transport Manager',
    label: 'Transport Manager',
    icon: 'ti ti-car',
    color: 'orange',
    description: 'Transport staff with access to vehicle and route management',
    category: 'staff',
    permissions: {
      dashboard: createPermissions(false, true, false, false, false, false, true, true, false, false),
      transport: createPermissions(true, true, true, false, false, false, true, true, true, false),
      students: createPermissions(false, true, false, false, false, false, false, false, false, false),
      reports: createPermissions(false, true, false, false, false, false, true, true, false, false)
    },
    defaultModules: ['dashboard', 'transport'],
    allowedModules: ['transport', 'students', 'reports'],
    canAccessAllModules: false,
    hierarchy: 10,
    allowedPlans: ['premium'],
    enabled: true
  },

  // Hostel Warden
  {
    id: 'hostel_warden',
    name: 'Hostel Warden',
    displayName: 'Hostel Warden',
    label: 'Hostel Warden',
    icon: 'ti ti-building',
    color: 'teal',
    description: 'Hostel staff with access to facility and resident management',
    category: 'staff',
    permissions: {
      dashboard: createPermissions(false, true, false, false, false, false, true, true, false, false),
      hostel: createPermissions(true, true, true, false, false, false, true, true, true, false),
      students: createPermissions(false, true, false, false, false, false, false, false, false, false),
      reports: createPermissions(false, true, false, false, false, false, true, true, false, false)
    },
    defaultModules: ['dashboard', 'hostel'],
    allowedModules: ['hostel', 'students', 'reports'],
    canAccessAllModules: false,
    hierarchy: 11,
    allowedPlans: ['premium'],
    enabled: true
  },

  // Principal
  {
    id: 'principal',
    name: 'Principal',
    displayName: 'Principal',
    label: 'Principal',
    icon: 'ti ti-user-cog',
    color: 'warning',
    description: 'School principal with oversight over academics and staff',
    category: 'admin',
    permissions: {
      dashboard: createPermissions(false, true, false, false, false, false, true, true, false, false),
      academic: createPermissions(true, true, true, true, false, false, true, true, true, false),
      attendance: createPermissions(true, true, true, true, false, false, true, true, true, false),
      examination: createPermissions(true, true, true, true, false, false, true, true, true, false),
      communication: createPermissions(true, true, true, true, false, false, true, true, true, false),
      library: createPermissions(false, true, false, false, false, false, true, true, false, false),
      students: createPermissions(true, true, true, false, false, false, true, true, true, false),
      teachers: createPermissions(true, true, true, false, false, false, true, true, true, false),
      parents: createPermissions(false, true, false, false, false, false, true, true, false, false),
      reports: createPermissions(false, true, false, false, false, false, true, true, false, false)
    },
    defaultModules: ['dashboard', 'academic', 'attendance', 'examination', 'communication'],
    allowedModules: ['dashboard', 'students', 'teachers', 'academics', 'attendance', 'exams', 'communication', 'reports', 'library'],
    canAccessAllModules: false,
    hierarchy: 4,
    allowedPlans: ['medium', 'premium'],
    enabled: true
  },

  // Agent
  {
    id: 'agent',
    name: 'Agent',
    displayName: 'Agent',
    label: 'Agent',
    icon: 'ti ti-user-plus',
    color: 'info',
    description: 'Institution creation and management agent',
    category: 'admin',
    permissions: {
      dashboard: createPermissions(false, true, false, false, false, false, true, true, false, false),
      'user-management': createPermissions(true, true, true, true, true, false, true, true, true, false),
      institutions: createPermissions(true, true, true, false, false, false, true, true, true, false),
      reports: createPermissions(false, true, false, false, false, false, true, true, false, false)
    },
    defaultModules: ['dashboard', 'user-management'],
    allowedModules: ['dashboard', 'user-management', 'institutions', 'reports'],
    canAccessAllModules: false,
    hierarchy: 5,
    allowedPlans: ['premium'],
    enabled: true
  },

  // Staff Member
  {
    id: 'staff_member',
    name: 'Staff Member',
    displayName: 'Staff Member',
    label: 'Staff Member',
    icon: 'ti ti-user',
    color: 'secondary',
    description: 'General staff member with basic access',
    category: 'staff',
    permissions: {
      dashboard: createPermissions(false, true, false, false, false, false, true, true, false, false),
      attendance: createPermissions(false, true, false, false, false, false, true, true, false, false),
      communication: createPermissions(false, true, true, true, false, false, true, true, false, false),
      reports: createPermissions(false, true, false, false, false, false, true, true, false, false)
    },
    defaultModules: ['dashboard', 'attendance'],
    allowedModules: ['dashboard', 'attendance', 'communication', 'reports'],
    canAccessAllModules: false,
    hierarchy: 12,
    allowedPlans: ['basic', 'medium', 'premium'],
    enabled: true
  }
];

// Helper functions
export const getRoleById = (id: string): Role | undefined => {
  return ROLES.find(role => role.id === id);
};

export const getRoleByName = (name: string): Role | undefined => {
  return ROLES.find(role => role.name === name);
};

export const getRolesByCategory = (category: Role['category']): Role[] => {
  return ROLES.filter(role => role.category === category);
};

export const getRolesByPlan = (plan: 'basic' | 'medium' | 'premium'): Role[] => {
  return ROLES.filter(role => 
    role.allowedPlans.includes(plan) || role.isSuperAdminOnly
  );
};

export const canRoleAccessModule = (roleId: string, moduleKey: string): boolean => {
  const role = getRoleById(roleId);
  if (!role) return false;
  
  if (role.canAccessAllModules) return true;
  return role.allowedModules.includes(moduleKey);
};

export const isModuleReadOnlyForRole = (roleId: string, moduleKey: string): boolean => {
  const role = getRoleById(roleId);
  if (!role || !role.readOnlyModules) return false;
  return role.readOnlyModules.includes(moduleKey);
};

export const getRolePermissions = (roleId: string, moduleId?: string): Role['permissions'] | Role['permissions'][string] => {
  const role = getRoleById(roleId);
  if (!role) {
    return {
      create: false, read: false, update: false, delete: false,
      manageUsers: false, manageSettings: false, viewReports: false,
      exportData: false, approve: false, manageFinance: false
    };
  }
  
  if (moduleId) {
    return role.permissions[moduleId] || {
      create: false, read: false, update: false, delete: false,
      manageUsers: false, manageSettings: false, viewReports: false,
      exportData: false, approve: false, manageFinance: false
    };
  }
  
  return role.permissions;
};

export const canRolePerformAction = (roleId: string, moduleId: string, action: keyof Role['permissions'][string]): boolean => {
  const permissions = getRolePermissions(roleId, moduleId) as Role['permissions'][string];
  return permissions?.[action] || false;
};

export const getRoleHierarchy = (roleId: string): number => {
  const role = getRoleById(roleId);
  return role?.hierarchy || 999;
};

export const canRoleManageRole = (managerRoleId: string, targetRoleId: string): boolean => {
  const managerHierarchy = getRoleHierarchy(managerRoleId);
  const targetHierarchy = getRoleHierarchy(targetRoleId);
  return managerHierarchy < targetHierarchy; // Lower hierarchy number means higher authority
};
