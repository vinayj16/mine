import { MODULES, isModuleEnabledForPlan, type Module } from '../config/modules';
import { getSidebarMenu } from '../config/sidebar-menus';
import { getRoleById as getRoleFromConfig, canRoleAccessModule as canAccessModuleForRole } from '../config/roles';
import { getDashboardConfig } from '../config/roleDashboardConfig';

const getRoleById = (id: string): { label: string; description: string } | undefined => {
  const role = getRoleFromConfig(id);
  if (role) return { label: role.displayName, description: role.description };
  const fallback: Record<string, { label: string; description: string }> = {
    'hostel': { label: 'Hostel', description: 'Hostel access' },
    'transport': { label: 'Transport', description: 'Transport access' },
    'staff': { label: 'Staff', description: 'Staff access' },
    'staff_member': { label: 'Staff', description: 'Staff access' },
    'librarian': { label: 'Librarian', description: 'Library access' },
    'accountant': { label: 'Accountant', description: 'Financial access' },
    'hr': { label: 'HR', description: 'HR access' },
    'hr_manager': { label: 'HR Manager', description: 'HR access' },
  };
  return fallback[id.toLowerCase()];
};

const canRoleAccessModule = (roleId: string, moduleKey: string): boolean => {
  return canAccessModuleForRole(roleId, moduleKey);
};

const getModuleByRoute = (routePath: string): Module | undefined => {
  return MODULES.find(m => m.allowedRoutes.some(r => routePath.startsWith(r)));
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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
  photo?: string;
}

/**
 * Get role-specific dashboard path
 */
export const getRoleBasedDashboard = (role?: string): string => {
  if (!role) return '/';

  const dashboardConfig = getDashboardConfig(role);
  if (dashboardConfig?.defaultRoute) return dashboardConfig.defaultRoute;

  const normalizedRole = role.toLowerCase().replace(/[_\s]+/g, '_');

  const dashboardMap: Record<string, string> = {
    'superadmin': '/super-admin/dashboard',
    'institution_admin': '/dashboard/main',
    'admin': '/dashboard/admin',
    'agent': '/agent',
    'teacher': '/dashboard/teacher',
    'student': '/dashboard/student',
    'parent': '/dashboard/parent',
    'guardian': '/dashboard/parent',
    'principal': '/dashboard/principal',
    'staff': '/dashboard/staff',
    'accountant': '/dashboard/accountant',
    'hr': '/dashboard/hr',
    'librarian': '/dashboard/library',
    'transport_manager': '/transport',
    'hostel_warden': '/dashboard/hostel',
  };

  const upperRole = role.toUpperCase();
  const upperMap: Record<string, string> = {
    'TEACHER': '/dashboard/teacher',
    'STUDENT': '/dashboard/student',
    'PARENT': '/dashboard/parent',
    'PRINCIPAL': '/dashboard/principal',
    'SUPER_ADMIN': '/super-admin/dashboard',
    'ADMIN': '/dashboard/admin',
  };
  if (upperMap[upperRole]) return upperMap[upperRole];

  return dashboardMap[normalizedRole] || '/dashboard/principal';
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

    // Cross-dashboard navigation protection — allow shared routes
    const routeLower = routePath.toLowerCase();
    const isSharedRoute = 
      routeLower.startsWith('/dashboard/applications') || 
      routeLower.startsWith('/notice-board') || 
      routeLower.startsWith('/events') ||
      routeLower.includes('/dashboard/applications/') ||
      routeLower.includes('calendar');
    if (isSharedRoute) {
      return true;
    }

    if (normalizedRole === 'student') {
      // Block student access to non-student dashboard routes (shared routes already allowed above)
      if (routeLower.startsWith('/dashboard/') && !routeLower.startsWith('/dashboard/student')) {
        console.warn(`[Security Guard] Blocked student user from accessing ${routePath}`);
        return false;
      }
    } else if (normalizedRole === 'parent') {
      if (routeLower.startsWith('/dashboard/') && !routeLower.startsWith('/dashboard/parent')) {
        console.warn(`[Security Guard] Blocked parent user from accessing ${routePath}`);
        return false;
      }
    } else if (normalizedRole === 'teacher') {
      if (routeLower.startsWith('/dashboard/') && !routeLower.startsWith('/dashboard/teacher')) {
        console.warn(`[Security Guard] Blocked teacher user from accessing ${routePath}`);
        return false;
      }
    } else if (normalizedRole === 'principal') {
      if (routeLower.startsWith('/dashboard/') && !routeLower.startsWith('/dashboard/principal')) {
        console.warn(`[Security Guard] Blocked principal user from accessing ${routePath}`);
        return false;
      }
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
