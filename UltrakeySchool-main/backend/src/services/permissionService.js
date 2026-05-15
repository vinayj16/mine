import Permission from '../models/Permission.js';
import User from '../models/User.js';

const ROLE_HIERARCHY = {
  'superadmin': 100,
  'admin': 80,
  'teacher': 60,
  'staff': 50,
  'parent': 40,
  'guardian': 30,
  'student': 20
};

const PLAN_MODULES = {
  'basic': ['DASHBOARD', 'STUDENTS', 'ATTENDANCE', 'CLASSES'],
  'medium': ['DASHBOARD', 'STUDENTS', 'ATTENDANCE', 'CLASSES', 'TEACHERS', 'FEES', 'EXAMS', 'LIBRARY'],
  'premium': ['DASHBOARD', 'STUDENTS', 'ATTENDANCE', 'CLASSES', 'TEACHERS', 'FEES', 'EXAMS', 'LIBRARY', 'HOSTEL', 'TRANSPORT', 'ANALYTICS', 'REPORTS']
};

const ROLE_PERMISSIONS = {
  'superadmin': ['*'],
  'admin': [
    'view_dashboard', 'manage_students', 'manage_teachers', 'manage_staff',
    'manage_classes', 'manage_fees', 'manage_exams', 'manage_library',
    'manage_hostel', 'manage_transport', 'view_reports', 'manage_settings'
  ],
  'teacher': [
    'view_dashboard', 'view_students', 'mark_attendance', 'manage_grades',
    'view_classes', 'view_exams', 'view_library'
  ],
  'staff': [
    'view_dashboard', 'view_students', 'mark_attendance'
  ],
  'parent': [
    'view_dashboard', 'view_own_children', 'view_fees', 'view_results', 'apply_leave'
  ],
  'guardian': [
    'view_dashboard', 'view_own_wards', 'view_fees', 'view_results'
  ],
  'student': [
    'view_dashboard', 'view_own_profile', 'view_own_results', 'view_own_fees', 'view_timetable'
  ]
};

const permissionService = {
  getAllPermissions: async (filters = {}) => {
    const query = {};
    
    if (filters.category) query.category = filters.category;
    if (filters.module) query.module = filters.module;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    const permissions = await Permission.find(query).sort({ category: 1, name: 1 });
    return permissions;
  },

  getPermissionById: async (id) => {
    const permission = await Permission.findById(id);
    if (!permission) {
      throw new Error('Permission not found');
    }
    return permission;
  },

  createPermission: async (data) => {
    const existingPermission = await Permission.findOne({ key: data.key });
    if (existingPermission) {
      throw new Error('Permission with this key already exists');
    }

    const permission = new Permission(data);
    await permission.save();
    return permission;
  },

  updatePermission: async (id, data) => {
    const permission = await Permission.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!permission) {
      throw new Error('Permission not found');
    }
    return permission;
  },

  deletePermission: async (id) => {
    const permission = await Permission.findByIdAndDelete(id);
    if (!permission) {
      throw new Error('Permission not found');
    }
    return permission;
  },

  checkUserPermission: async (userId, permissionKey) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'superadmin') {
      return { allowed: true, reason: 'Superadmin has all permissions' };
    }

    if (user.permissions && user.permissions.includes('*')) {
      return { allowed: true, reason: 'User has wildcard permission' };
    }

    if (user.permissions && user.permissions.includes(permissionKey)) {
      return { allowed: true, reason: 'User has explicit permission' };
    }

    const rolePermissions = ROLE_PERMISSIONS[user.role.toLowerCase()] || [];
    if (rolePermissions.includes('*') || rolePermissions.includes(permissionKey)) {
      return { allowed: true, reason: 'Role has permission' };
    }

    return { allowed: false, reason: 'Permission denied' };
  },

  checkUserModule: async (userId, moduleName) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'superadmin') {
      return { allowed: true, reason: 'Superadmin has access to all modules' };
    }

    const moduleUpper = moduleName.toUpperCase();

    if (user.modules && user.modules.length > 0) {
      const hasModule = user.modules.some(m => m.toUpperCase() === moduleUpper);
      return { 
        allowed: hasModule, 
        reason: hasModule ? 'User has module access' : 'Module not available in user modules' 
      };
    }

    const planModules = PLAN_MODULES[user.plan.toLowerCase()] || PLAN_MODULES['basic'];
    const hasModule = planModules.includes(moduleUpper);
    
    return { 
      allowed: hasModule, 
      reason: hasModule ? 'Module available in plan' : `Module not available in ${user.plan} plan` 
    };
  },

  checkUserRole: async (userId, requiredRole) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const userLevel = ROLE_HIERARCHY[user.role.toLowerCase()] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole.toLowerCase()] || 0;

    return {
      allowed: userLevel >= requiredLevel,
      reason: userLevel >= requiredLevel ? 'User has required role level' : 'Insufficient role level'
    };
  },

  getUserPermissions: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'superadmin') {
      return { permissions: ['*'], source: 'superadmin' };
    }

    if (user.permissions && user.permissions.length > 0) {
      return { permissions: user.permissions, source: 'user' };
    }

    const rolePermissions = ROLE_PERMISSIONS[user.role.toLowerCase()] || [];
    return { permissions: rolePermissions, source: 'role' };
  },

  getUserModules: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'superadmin') {
      const allModules = Object.values(PLAN_MODULES).flat().filter((v, i, a) => a.indexOf(v) === i);
      return { modules: allModules, source: 'superadmin' };
    }

    if (user.modules && user.modules.length > 0) {
      return { modules: user.modules, source: 'user' };
    }

    const planModules = PLAN_MODULES[user.plan.toLowerCase()] || PLAN_MODULES['basic'];
    return { modules: planModules, source: 'plan' };
  },

  assignPermissionsToUser: async (userId, permissions) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { permissions },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  assignModulesToUser: async (userId, modules) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { modules },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  updateUserRole: async (userId, role) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  updateUserPlan: async (userId, plan) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { plan },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
};

export default permissionService;
