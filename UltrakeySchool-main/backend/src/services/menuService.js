import MenuCustomizationRole from '../models/MenuCustomizationRole.js';
import User from '../models/User.js';
import * as roleService from './roleService.js';

const DEFAULT_MENUS = {
  super_admin: [
    {
      title: 'QUICK ACTIONS',
      order: 1,
      items: [
        {
          label: 'Add Institution',
          path: '/super-admin/institutions/add',
          icon: 'ti ti-plus',
          moduleKey: 'PLATFORM_ADMIN',
          analytics: { category: 'navigation', action: 'quick_action', label: 'add_institution' }
        }
      ]
    },
    {
      title: 'PLATFORM DASHBOARD',
      order: 2,
      items: [
        {
          label: 'Dashboard',
          path: '/super-admin/dashboard',
          icon: 'ti ti-layout-dashboard',
          moduleKey: 'PLATFORM_ADMIN',
          analytics: { category: 'navigation', action: 'dashboard' }
        },
        {
          label: 'Platform Analytics',
          path: '/super-admin/analytics',
          icon: 'ti ti-chart-line',
          moduleKey: 'PLATFORM_ADMIN',
          analytics: { category: 'navigation', action: 'analytics' }
        }
      ]
    },
    {
      title: 'SUBSCRIPTIONS & BILLING',
      order: 4,
      items: [
        {
          label: 'Plans & Pricing',
          path: '/super-admin/memberships',
          icon: 'ti ti-crown',
          moduleKey: 'MEMBERSHIP',
          analytics: { category: 'navigation', action: 'manage_plans' }
        },
        {
          label: 'Transactions',
          path: '/super-admin/transactions',
          icon: 'ti ti-report-money',
          moduleKey: 'MEMBERSHIP',
          analytics: { category: 'navigation', action: 'view_transactions' }
        }
      ]
    }
  ],
  admin: [
    {
      title: 'MAIN DASHBOARD',
      order: 1,
      items: [
        {
          label: 'Main Dashboard',
          path: '/dashboard/main',
          icon: 'ti ti-layout-dashboard',
          moduleKey: 'DASHBOARDS',
          analytics: { category: 'navigation', action: 'main_dashboard' }
        }
      ]
    },
    {
      title: 'PEOPLE MANAGEMENT',
      order: 3,
      items: [
        {
          label: 'Students',
          path: '/students',
          icon: 'ti ti-users',
          moduleKey: 'STUDENTS',
          analytics: { category: 'navigation', action: 'students' }
        },
        {
          label: 'Teachers',
          path: '/teachers',
          icon: 'ti ti-chalkboard-user',
          moduleKey: 'TEACHERS',
          analytics: { category: 'navigation', action: 'teachers' }
        }
      ]
    }
  ],
  teacher: [
    {
      title: 'MAIN',
      order: 1,
      items: [
        {
          label: 'Teacher Dashboard',
          path: '/dashboard/teacher',
          icon: 'ti ti-dashboard',
          moduleKey: 'DASHBOARDS',
          analytics: { category: 'navigation', action: 'teacher_dashboard' }
        }
      ]
    },
    {
      title: 'ACADEMIC',
      order: 2,
      items: [
        {
          label: 'Classes',
          path: '/class',
          icon: 'ti ti-building',
          moduleKey: 'ACADEMICS',
          analytics: { category: 'navigation', action: 'classes' }
        },
        {
          label: 'Students',
          path: '/students',
          icon: 'ti ti-users',
          moduleKey: 'STUDENTS',
          analytics: { category: 'navigation', action: 'students' }
        }
      ]
    }
  ],
  student: [
    {
      title: 'MAIN',
      order: 1,
      items: [
        {
          label: 'Student Dashboard',
          path: '/dashboard/student',
          icon: 'ti ti-dashboard',
          moduleKey: 'DASHBOARDS',
          analytics: { category: 'navigation', action: 'student_dashboard' }
        }
      ]
    },
    {
      title: 'ACADEMIC',
      order: 2,
      items: [
        {
          label: 'My Timetable',
          path: '/students/timetable',
          icon: 'ti ti-calendar-time',
          moduleKey: 'ACADEMICS',
          analytics: { category: 'navigation', action: 'timetable' }
        },
        {
          label: 'My Attendance',
          path: '/attendance/student',
          icon: 'ti ti-checklist',
          moduleKey: 'ATTENDANCE',
          analytics: { category: 'navigation', action: 'attendance' }
        }
      ]
    }
  ],
  parent: [
    {
      title: 'MAIN',
      order: 1,
      items: [
        {
          label: 'Parent Dashboard',
          path: '/dashboard/parent',
          icon: 'ti ti-dashboard',
          moduleKey: 'DASHBOARDS',
          analytics: { category: 'navigation', action: 'parent_dashboard' }
        }
      ]
    },
    {
      title: 'CHILDREN',
      order: 2,
      items: [
        {
          label: 'My Children',
          path: '/parents/children',
          icon: 'ti ti-users',
          moduleKey: 'STUDENTS',
          analytics: { category: 'navigation', action: 'children' }
        }
      ]
    }
  ],
  accountant: [
    {
      title: 'MAIN',
      order: 1,
      items: [
        {
          label: 'Finance Dashboard',
          path: '/dashboard/finance',
          icon: 'ti ti-dashboard',
          moduleKey: 'DASHBOARDS',
          analytics: { category: 'navigation', action: 'finance_dashboard' }
        }
      ]
    },
    {
      title: 'FINANCE',
      order: 2,
      items: [
        {
          label: 'Fees Collection',
          path: '/fees/collect',
          icon: 'ti ti-cash',
          moduleKey: 'FEES',
          analytics: { category: 'navigation', action: 'collect_fees' }
        },
        {
          label: 'Accounts',
          path: '/accounts/expenses',
          icon: 'ti ti-chart-pie',
          moduleKey: 'ACCOUNTS',
          analytics: { category: 'navigation', action: 'accounts' }
        }
      ]
    }
  ],
  hr: [
    {
      title: 'MAIN',
      order: 1,
      items: [
        {
          label: 'HR Dashboard',
          path: '/dashboard/hr',
          icon: 'ti ti-dashboard',
          moduleKey: 'DASHBOARDS',
          analytics: { category: 'navigation', action: 'hr_dashboard' }
        }
      ]
    },
    {
      title: 'HR MANAGEMENT',
      order: 2,
      items: [
        {
          label: 'Staff',
          path: '/staffs',
          icon: 'ti ti-users-group',
          moduleKey: 'HR_PAYROLL',
          analytics: { category: 'navigation', action: 'staff' }
        },
        {
          label: 'Payroll',
          path: '/payroll',
          icon: 'ti ti-cash',
          moduleKey: 'HR_PAYROLL',
          analytics: { category: 'navigation', action: 'payroll' }
        }
      ]
    }
  ],
  librarian: [
    {
      title: 'MAIN',
      order: 1,
      items: [
        {
          label: 'Library Dashboard',
          path: '/dashboard/library',
          icon: 'ti ti-dashboard',
          moduleKey: 'DASHBOARDS',
          analytics: { category: 'navigation', action: 'library_dashboard' }
        }
      ]
    },
    {
      title: 'LIBRARY',
      order: 2,
      items: [
        {
          label: 'Books',
          path: '/library/books',
          icon: 'ti ti-book',
          moduleKey: 'LIBRARY',
          analytics: { category: 'navigation', action: 'books' }
        },
        {
          label: 'Members',
          path: '/library/members',
          icon: 'ti ti-users',
          moduleKey: 'LIBRARY',
          analytics: { category: 'navigation', action: 'members' }
        }
      ]
    }
  ],
  transport_manager: [
    {
      title: 'MAIN',
      order: 1,
      items: [
        {
          label: 'Transport Dashboard',
          path: '/dashboard/transport',
          icon: 'ti ti-dashboard',
          moduleKey: 'DASHBOARDS',
          analytics: { category: 'navigation', action: 'transport_dashboard' }
        }
      ]
    },
    {
      title: 'TRANSPORT',
      order: 2,
      items: [
        {
          label: 'Routes',
          path: '/transport/routes',
          icon: 'ti ti-route',
          moduleKey: 'TRANSPORT',
          analytics: { category: 'navigation', action: 'routes' }
        },
        {
          label: 'Vehicles',
          path: '/transport/vehicles',
          icon: 'ti ti-car',
          moduleKey: 'TRANSPORT',
          analytics: { category: 'navigation', action: 'vehicles' }
        }
      ]
    }
  ],
  hostel_warden: [
    {
      title: 'MAIN',
      order: 1,
      items: [
        {
          label: 'Hostel Dashboard',
          path: '/dashboard/hostel',
          icon: 'ti ti-dashboard',
          moduleKey: 'DASHBOARDS',
          analytics: { category: 'navigation', action: 'hostel_dashboard' }
        }
      ]
    },
    {
      title: 'HOSTEL',
      order: 2,
      items: [
        {
          label: 'Rooms',
          path: '/hostel/rooms',
          icon: 'ti ti-door',
          moduleKey: 'HOSTEL',
          analytics: { category: 'navigation', action: 'rooms' }
        },
        {
          label: 'Residents',
          path: '/hostel/residents',
          icon: 'ti ti-users',
          moduleKey: 'HOSTEL',
          analytics: { category: 'navigation', action: 'residents' }
        }
      ]
    }
  ]
};

export const getMenuForRole = async (roleId, schoolId = null) => {
  let menuCustomization = await MenuCustomizationRole.findOne({ roleId, schoolId });
  
  if (!menuCustomization) {
    menuCustomization = await MenuCustomizationRole.findOne({ roleId, isDefault: true });
  }

  if (!menuCustomization) {
    return DEFAULT_MENUS[roleId] || [];
  }

  const filteredSections = menuCustomization.menuSections
    .filter(section => section.isVisible)
    .map(section => ({
      ...section.toObject(),
      items: section.items.filter(item => 
        item.isVisible && !menuCustomization.hiddenMenuItems.includes(item.path)
      )
    }))
    .sort((a, b) => a.order - b.order);

  return filteredSections;
};

export const getMenuForUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const role = await roleService.getRoleById(user.roleId);
  if (!role) {
    throw new Error('Invalid role');
  }

  let menuSections = await getMenuForRole(user.roleId, user.schoolId);

  const effectivePermissions = await roleService.getUserEffectivePermissions(userId);
  const allowedModules = user.allowedModules || role.allowedModules;

  menuSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.moduleKey && !allowedModules.includes(item.moduleKey)) {
        return false;
      }
      if (item.permission && !effectivePermissions[item.permission]) {
        return false;
      }
      return true;
    })
  })).filter(section => section.items.length > 0);

  return menuSections;
};

export const createDefaultMenuForRole = async (roleId, schoolId = null) => {
  const existingMenu = await MenuCustomizationRole.findOne({ roleId, schoolId });
  if (existingMenu) {
    return existingMenu;
  }

  const defaultMenu = DEFAULT_MENUS[roleId] || [];

  const menuCustomization = new MenuCustomizationRole({
    roleId,
    schoolId,
    menuSections: defaultMenu,
    hiddenMenuItems: [],
    customMenuItems: [],
    quickActions: [],
    isDefault: !schoolId
  });

  await menuCustomization.save();
  return menuCustomization;
};

export const updateMenuForRole = async (roleId, schoolId, menuData, userId) => {
  let menuCustomization = await MenuCustomizationRole.findOne({ roleId, schoolId });

  if (!menuCustomization) {
    menuCustomization = new MenuCustomizationRole({
      roleId,
      schoolId,
      isDefault: false
    });
  }

  if (menuData.menuSections) {
    menuCustomization.menuSections = menuData.menuSections;
  }

  if (menuData.hiddenMenuItems) {
    menuCustomization.hiddenMenuItems = menuData.hiddenMenuItems;
  }

  if (menuData.customMenuItems) {
    menuCustomization.customMenuItems = menuData.customMenuItems;
  }

  if (menuData.quickActions) {
    menuCustomization.quickActions = menuData.quickActions;
  }

  menuCustomization.lastModifiedBy = userId;
  await menuCustomization.save();

  return menuCustomization;
};

export const addCustomMenuItem = async (roleId, schoolId, menuItem, userId) => {
  let menuCustomization = await MenuCustomizationRole.findOne({ roleId, schoolId });

  if (!menuCustomization) {
    menuCustomization = await createDefaultMenuForRole(roleId, schoolId);
  }

  menuItem.isCustom = true;
  menuCustomization.customMenuItems.push(menuItem);
  menuCustomization.lastModifiedBy = userId;

  await menuCustomization.save();
  return menuCustomization;
};

export const removeCustomMenuItem = async (roleId, schoolId, menuItemPath, userId) => {
  const menuCustomization = await MenuCustomizationRole.findOne({ roleId, schoolId });

  if (!menuCustomization) {
    throw new Error('Menu customization not found');
  }

  menuCustomization.customMenuItems = menuCustomization.customMenuItems.filter(
    item => item.path !== menuItemPath
  );

  menuCustomization.lastModifiedBy = userId;
  await menuCustomization.save();

  return menuCustomization;
};

export const hideMenuItem = async (roleId, schoolId, menuItemPath, userId) => {
  let menuCustomization = await MenuCustomizationRole.findOne({ roleId, schoolId });

  if (!menuCustomization) {
    menuCustomization = await createDefaultMenuForRole(roleId, schoolId);
  }

  if (!menuCustomization.hiddenMenuItems.includes(menuItemPath)) {
    menuCustomization.hiddenMenuItems.push(menuItemPath);
  }

  menuCustomization.lastModifiedBy = userId;
  await menuCustomization.save();

  return menuCustomization;
};

export const showMenuItem = async (roleId, schoolId, menuItemPath, userId) => {
  const menuCustomization = await MenuCustomizationRole.findOne({ roleId, schoolId });

  if (!menuCustomization) {
    return null;
  }

  menuCustomization.hiddenMenuItems = menuCustomization.hiddenMenuItems.filter(
    path => path !== menuItemPath
  );

  menuCustomization.lastModifiedBy = userId;
  await menuCustomization.save();

  return menuCustomization;
};

export const reorderMenuSections = async (roleId, schoolId, sectionOrders, userId) => {
  const menuCustomization = await MenuCustomizationRole.findOne({ roleId, schoolId });

  if (!menuCustomization) {
    throw new Error('Menu customization not found');
  }

  sectionOrders.forEach(({ title, order }) => {
    const section = menuCustomization.menuSections.find(s => s.title === title);
    if (section) {
      section.order = order;
    }
  });

  menuCustomization.lastModifiedBy = userId;
  await menuCustomization.save();

  return menuCustomization;
};

export const addQuickAction = async (roleId, schoolId, quickAction, userId) => {
  let menuCustomization = await MenuCustomizationRole.findOne({ roleId, schoolId });

  if (!menuCustomization) {
    menuCustomization = await createDefaultMenuForRole(roleId, schoolId);
  }

  menuCustomization.quickActions.push(quickAction);
  menuCustomization.lastModifiedBy = userId;

  await menuCustomization.save();
  return menuCustomization;
};

export const removeQuickAction = async (roleId, schoolId, actionId, userId) => {
  const menuCustomization = await MenuCustomizationRole.findOne({ roleId, schoolId });

  if (!menuCustomization) {
    throw new Error('Menu customization not found');
  }

  menuCustomization.quickActions = menuCustomization.quickActions.filter(
    action => action.id !== actionId
  );

  menuCustomization.lastModifiedBy = userId;
  await menuCustomization.save();

  return menuCustomization;
};

export const resetMenuToDefault = async (roleId, schoolId, userId) => {
  await MenuCustomizationRole.deleteOne({ roleId, schoolId });
  return await createDefaultMenuForRole(roleId, schoolId);
};
