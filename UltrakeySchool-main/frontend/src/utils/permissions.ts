import { MODULES, isModuleEnabledForPlan, type Module } from '../config/modules';
import { getSidebarMenu } from '../config/sidebar-menus';

const getRoleById = (id: string): { label: string; description: string } | undefined => {
  // Mock role data - in a real app this would come from a database or config
  const roles: Record<string, { label: string; description: string }> = {
    'superadmin': { label: 'Super Admin', description: 'Full system access' },
    'super_admin': { label: 'Super Admin', description: 'Full system access' },
    'institution_admin': { label: 'Institution Admin', description: 'Manages institution settings' },
    'admin': { label: 'Admin', description: 'Administrative access' },
    'principal': { label: 'Principal', description: 'School management' },
    'teacher': { label: 'Teacher', description: 'Teaching staff' },
    'student': { label: 'Student', description: 'Student access' },
    'parent': { label: 'Parent', description: 'Parent access' },
    'hostel':{label: 'hostel', description: 'hostel access'},
    'transport':{label: 'transport', description: 'transportaccess'},
    'agent':{label: 'Agent', description: 'agent access'},
  };
  return roles[id.toLowerCase()];
};

const canRoleAccessModule = (_roleId: string, _moduleKey: string) => true;

const getModuleByRoute = (routePath: string): Module | undefined => {
  return MODULES.find(m => m.allowedRoutes.some(r => routePath.startsWith(r)));
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string;
  institutionId?: string;
  institutionData?: {
    id: string;
    name: string;
    instituteCode: string;
    type: string;
    status: string;
    logo?: string;
    contact?: {
      email?: string;
      phone?: string;
      address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
      };
    };
  };
  plan?: 'basic' | 'medium' | 'premium';
  enabledModules?: string[];
  permissions?: string[];
  modules?: string[];
  avatar?: string;
}

/**
 * Get role-specific dashboard path
 */
export const getRoleBasedDashboard = (role?: string): string => {
  if (!role) {
    return '/';
  }

  // TEMPORARY FIX: Force SUPER_ADMIN to go to super-admin dashboard
  if (role === 'SUPER_ADMIN' || role === 'super_admin' || role === 'superadmin') {
    return '/super-admin/dashboard';
  }

  const normalizedRole = role.toLowerCase().replace(/[_\s]+/g, '_');
  
  const dashboardMap: Record<string, string> = {
    // Super Admin
    'superadmin': '/super-admin/dashboard',



    // Institution Admin
    'institution_admin': '/dashboard/main',
    'institution-admin': '/dashboard/main',
    'school-admin': '/dashboard/main',

    // Admin Dashboard (separate from institution admin)
    'admin': '/dashboard/admin',

    // Agent
    'agent': '/agent',

    // Academic Roles
    'teacher': '/dashboard/teacher',
    'student': '/dashboard/student',
    'parent': '/dashboard/parent',
    'principal': '/dashboard/principal',

    // Staff Roles
    'staff': '/dashboard/staff',
    'staff_member': '/dashboard/staff',
    'staff-member': '/dashboard/staff',
    'accountant': '/dashboard/finance',
    'hr': '/dashboard/hr',
    'hr_manager': '/dashboard/hr',
    'hr-manager': '/dashboard/hr',
    'librarian': '/dashboard/library',
    'transport_manager': '/transport',
    'transport-manager': '/transport',
    'hostel_warden': '/dashboard/hostel',
    'hostel-warden': '/dashboard/hostel',
  };

  // Handle uppercase role names (TEACHER, STUDENT, PRINCIPAL, etc.)
  const upperRole = role?.toUpperCase();
  if (upperRole === 'TEACHER') return '/dashboard/teacher';
  if (upperRole === 'STUDENT') return '/dashboard/student';
  if (upperRole === 'PARENT') return '/dashboard/parent';
  if (upperRole === 'PRINCIPAL') return '/dashboard/principal';
  if (upperRole === 'SUPER_ADMIN') return '/super-admin/dashboard';
  if (upperRole === 'ADMIN') return '/dashboard/admin';

  const dashboardPath = dashboardMap[normalizedRole] || '/dashboard/principal';
  
  return dashboardPath;
};

const MODULE_MAP: Record<string, Module> = MODULES.reduce((acc, module) => {
  acc[module.key.toUpperCase()] = module;
  if (module.legacyKey) {
    acc[module.legacyKey] = module;
  }
  return acc;
}, {} as Record<string, Module>);

const normalizeModuleKey = (moduleKey: string): string | null => {
  if (!moduleKey) return null;
  const keyUpper = moduleKey.toUpperCase();

  if (MODULE_MAP[keyUpper]) return keyUpper;

  const foundKey = Object.keys(MODULE_MAP).find(k => k.toLowerCase() === moduleKey.toLowerCase());
  if (foundKey) return foundKey;

  if (keyUpper.endsWith('S')) {
    const singular = keyUpper.slice(0, -1);
    if (MODULE_MAP[singular]) return singular;
  }

  const plural = `${keyUpper}S`;
  if (MODULE_MAP[plural]) return plural;

  return null;
};

export const canAccessModule = (user: User | null, moduleKey: string): boolean => {
  if (!user) return false;

  const normalizedRole = user.role.toLowerCase();
  if (normalizedRole === 'superadmin' || normalizedRole === 'super_admin') {
    return true;
  }

  const normalized = normalizeModuleKey(moduleKey);
  if (!normalized) return false;

  const module = MODULE_MAP[normalized];
  if (!module) return false;

  if (user.plan && !isModuleEnabledForPlan(module.key, user.plan)) {
    return false;
  }

  if (user.enabledModules && !user.enabledModules.some(m => m.toUpperCase() === module.key.toUpperCase())) {
    return false;
  }

  return canRoleAccessModule(user.role, module.key);
};

export const canAccessRoute = (user: User | null, routePath: string): boolean => {
  if (!user || !user.role) {
    console.log('[canAccessRoute] No user or role found, denying access')
    return false;
  }

  try {
    const normalizedRole = user.role.toLowerCase();
    if (normalizedRole === 'superadmin' || normalizedRole === 'super_admin') {
      return true;
    }

    // Allow Institution Admin access to all dashboard routes
    if (normalizedRole === 'institution_admin' || normalizedRole === 'institutionadmin') {
      if (routePath.startsWith('/dashboard/') || routePath.startsWith('/institution/')) {
        console.log('[canAccessRoute] Institution Admin accessing dashboard route, allowing access:', routePath)
        return true;
      }
    }

  const module = getModuleByRoute(routePath);
  if (!module) {
    return true;
  }

  if (user.plan && !isModuleEnabledForPlan(module.key, user.plan)) {
    return false;
  }

  if (user.enabledModules && !user.enabledModules.some(m => m.toUpperCase() === module.key.toUpperCase())) {
    return false;
  }

  return canRoleAccessModule(user.role, module.key);
  } catch (error) {
    console.error('[canAccessRoute] Error checking route access:', error);
    return false;
  }
};

export const canPerformAction = (user: User | null, action: string): boolean => {
  if (!user) return false;

  const normalizedRole = user.role.toLowerCase();
  if (normalizedRole === 'superadmin' || normalizedRole === 'super_admin') {
    return true;
  }

  if (user.permissions) {
    return user.permissions.includes(action) || user.permissions.includes('*');
  }

  return false;
};

export const getUpgradeMessage = (moduleKey: string, currentPlan: string): string => {
  const normalized = normalizeModuleKey(moduleKey);
  const module = normalized ? MODULE_MAP[normalized] : undefined;
  if (!module) return 'This feature is not available';

  const requiredPlans = ['basic', 'medium', 'premium', 'enterprise'];
  const currentPlanIndex = requiredPlans.indexOf(currentPlan as any);

  if (currentPlanIndex === -1) {
    return 'This feature requires a Premium plan';
  }

  if (currentPlanIndex === requiredPlans.length - 1) {
    return 'You already have access to this feature';
  }

  const nextPlan = requiredPlans[currentPlanIndex + 1];
  return `This feature requires a ${nextPlan.toUpperCase()} plan`;
};

export const shouldShowUpgradePrompt = (user: User | null, moduleKey: string): boolean => {
  if (!user) return false;

  const normalizedRole = user.role.toLowerCase();
  if (normalizedRole === 'superadmin' || normalizedRole === 'super_admin') {
    return false;
  }

  const normalized = normalizeModuleKey(moduleKey);
  if (!normalized) return true;
  const module = MODULE_MAP[normalized];
  if (!module) return true;

  return user.plan ? !isModuleEnabledForPlan(module.key, user.plan) : true;
};

export const getAccessibleRoutes = (user: User | null): string[] => {
  if (!user) return [];

  const normalizedRole = user.role.toLowerCase();
  if (normalizedRole === 'superadmin' || normalizedRole === 'super_admin') {
    return MODULES.map(module => module.allowedRoutes[0] || module.key);
  }

  return MODULES
    .filter(module => canAccessModule(user, module.key))
    .map(module => module.allowedRoutes[0] || module.key);
};

export const getVisibleModules = (user: User | null): Record<string, Module> => {
  if (!user) return {};

  const normalizedRole = user.role.toLowerCase();
  if (normalizedRole === 'superadmin' || normalizedRole === 'super_admin') {
    return MODULES.reduce((acc, module) => {
      acc[module.key] = module;
      return acc;
    }, {} as Record<string, Module>);
  }

  const visibleModules: Record<string, Module> = {};

  MODULES.forEach(module => {
    if (canAccessModule(user, module.key)) {
      visibleModules[module.key] = module;
    }
  });

  return visibleModules;
};

export const filterMenuItems = (user: User | null, menuItems: any[]): any[] => {
  if (!user) return [];

  return menuItems.filter(item => {
    if (!item.route) return true;

    return canAccessRoute(user, item.route);
  });
};

export const getMenuForRole = (roleId: string) => {
  return getSidebarMenu(roleId);
};

export const hasRole = (user: User | null, roleId: string): boolean => {
  if (!user) return false;
  return user.role.toLowerCase() === roleId.toLowerCase();
};

export const hasAnyRole = (user: User | null, roleIds: string[]): boolean => {
  if (!user) return false;
  const normalizedRole = user.role.toLowerCase();
  return roleIds.some(roleId => normalizedRole === roleId.toLowerCase());
};

export const canManageUsers = (user: User | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, ['institution_admin', 'admin', 'superadmin', 'super_admin', 'institution_owner']);
};

export const canAccessUserManagement = (user: User | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, ['institution_admin', 'admin', 'superadmin', 'super_admin', 'institution_owner']);
};

export const canAccessSettings = (user: User | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, ['institution_admin', 'admin', 'superadmin', 'super_admin', 'institution_owner']);
};

export const canViewAllReports = (user: User | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, ['institution_admin', 'admin', 'superadmin', 'super_admin', 'institution_owner']);
};

export const isAdmin
 = (user: User | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, ['institution_admin', 'admin']);
};

export const isStaffRole = (user: User | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, ['accountant', 'hr', 'hr_manager', 'librarian', 'transport_manager', 'hostel_warden']);
};

export const isTopLevelUser = (user: User | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, ['superadmin', 'super_admin', 'institution_admin', 'institution_owner']);
};

export const getRoleDisplayName = (roleId: string): string => {
  const role = getRoleById(roleId);
  return role?.label || roleId;
};

export const getRoleDescription = (roleId: string): string => {
  const role = getRoleById(roleId);
  return role?.description || '';
};

export const filterRoutesByRole = (routes: string[], roleId: string): string[] => {
  const mockUser: User = {
    id: '',
    name: '',
    email: '',
    role: roleId,
    plan: 'premium',
    enabledModules: []
  };
  const accessibleRoutes = getAccessibleRoutes(mockUser);
  return routes.filter(route => accessibleRoutes.includes(route));
};
