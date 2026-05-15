/**
 * Unified Sidebar Menu Configuration
 * Clean, deduplicated menu structure with proper paths and features
 */

export interface MenuSection {
  title: string;
  icon?: string;
  items: MenuItem[];
}

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
  children?: MenuItem[];
}

// Reusable menu components
const APPLICATIONS_MENU: MenuItem = {
  label: "Applications",
  path: "/dashboard/applications/calendar",
  icon: "ti ti-apps",
  children: [
    {
      label: "Calendar",
      path: "/dashboard/applications/calendar",
      icon: "ti ti-calendar",
    },
    {
      label: "Call",
      path: "/dashboard/applications/call",
      icon: "ti ti-phone",
    },
    {
      label: "Chat",
      path: "/dashboard/applications/chat",
      icon: "ti ti-message",
    },
    {
      label: "Email",
      path: "/dashboard/applications/email",
      icon: "ti ti-mail",
    },
    {
      label: "File Manager",
      path: "/dashboard/applications/file-manager",
      icon: "ti ti-folder",
    },
    {
      label: "Notes",
      path: "/dashboard/applications/notes",
      icon: "ti ti-note",
    },
    {
      label: "Todo",
      path: "/dashboard/applications/todo",
      icon: "ti ti-checklist",
    },
  ],
};

export const SIDEBAR_MENUS: Record<string, MenuSection[]> = {
  // SUPER_ADMIN - Full Platform Control
  SUPER_ADMIN: [
    {
      title: "QUICK ACTIONS",
      items: [
        {
          label: "Add Institution",
          path: "/super-admin/institutions/add",
          icon: "ti ti-plus",
        },
      ],
    },
    {
      title: "MAIN",
      items: [
        {
          label: "Dashboard",
          path: "/super-admin/dashboard",
          icon: "ti ti-layout-dashboard",
        },
        {
          label: "Platform Analytics",
          path: "/super-admin/analytics",
          icon: "ti ti-chart-line",
        },
      ],
    },
    {
      title: "INSTITUTION MANAGEMENT",
      items: [
        {
          label: "Schools",
          path: "/super-admin/institutions/schools",
          icon: "ti ti-school",
        },
        {
          label: "Inter Colleges",
          path: "/super-admin/institutions/inter-colleges",
          icon: "ti ti-building-community",
        },
        {
          label: "Degree Colleges",
          path: "/super-admin/institutions/degree-colleges",
          icon: "ti ti-building",
        },
        {
          label: "Engineering Colleges",
          path: "/super-admin/institutions/engineering-colleges",
          icon: "ti ti-building-factory",
        },
        {
          label: "Branches Monitoring",
          path: "/super-admin/branches",
          icon: "ti ti-git-branch",
        },
        {
          label: "Impersonate Institution",
          path: "/super-admin/impersonate",
          icon: "ti ti-user-switch",
        },
      ],
    },
    {
      title: "SUBSCRIPTIONS & BILLING",
      items: [
        {
          label: "Subscription Plans",
          path: "/super-admin/memberships",
          icon: "ti ti-crown",
        },
        {
          label: "Pending Approvals",
          path: "/super-admin/subscription-approvals",
          icon: "ti ti-check-circle",
        },
        {
          label: "Transactions",
          path: "/super-admin/transactions",
          icon: "ti ti-report-money",
        },
        {
          label: "Revenue Analytics",
          path: "/super-admin/revenue",
          icon: "ti ti-currency-rupee",
        },
        {
          label: "Expiry & Alerts",
          path: "/super-admin/alerts",
          icon: "ti ti-alert-triangle",
        },
      ],
    },
    {
      title: "TRANSPORT MANAGEMENT",
      items: [
        {
          label: "Transport Analytics",
          path: "/super-admin/transport/analytics",
          icon: "ti ti-chart-line",
        },
        {
          label: "Transport Revenue",
          path: "/super-admin/transport/revenue",
          icon: "ti ti-cash",
        },
        {
          label: "Transport Reports",
          path: "/super-admin/transport/reports",
          icon: "ti ti-file",
        },
      ],
    },
    {
      title: "ANALYTICS & REPORTS",
      items: [
        {
          label: "Analytics & Reports",
          path: "/super-admin/analytics-reports",
          icon: "ti ti-chart-bar",
        },
      ],
    },
    {
      title: "MODULE & ACCESS CONTROL",
      items: [
        {
          label: "Modules Control",
          path: "/super-admin/modules",
          icon: "ti ti-puzzle",
        },
      ],
    },
    {
      title: "USER & SUPPORT",
      items: [
        {
          label: "Platform Users",
          path: "/super-admin/platform-users",
          icon: "ti ti-users",
        },
        {
          label: "Support Tickets",
          path: "/super-admin/tickets",
          icon: "ti ti-ticket",
        },
      ],
    },
    {
      title: "SETTINGS",
      items: [
        {
          label: "Platform Settings",
          path: "/super-admin/settings",
          icon: "ti ti-settings",
        },
        // These are routed via Platform Settings currently
        {
          label: "Security Settings",
          path: "/super-admin/settings",
          icon: "ti ti-lock",
        },
        {
          label: "Email Configuration",
          path: "/super-admin/settings",
          icon: "ti ti-mail",
        },
        {
          label: "SMS Configuration",
          path: "/super-admin/settings",
          icon: "ti ti-message",
        },
        {
          label: "Payment Gateway",
          path: "/super-admin/settings",
          icon: "ti ti-credit-card",
        },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        {
          label: "Audit Logs",
          path: "/super-admin/audit-logs",
          icon: "ti ti-shield-check",
        },
        {
          label: "Maintenance Mode",
          path: "/super-admin/maintenance",
          icon: "ti ti-tool",
        },
        APPLICATIONS_MENU,
      ],
    },
  ],

  // INSTITUTION_ADMIN - Full School Access
  INSTITUTION_ADMIN: [
    {
      title: "MAIN",
      items: [
        {
          label: "Main Dashboard",
          path: "/dashboard/main",
          icon: "ti ti-dashboard",
        },
        {
          label: "Analytics",
          path: "/institution/analytics",
          icon: "ti ti-chart-line",
        },
        {
          label: "Finance",
          path: "/institution/finance",
          icon: "ti ti-wallet",
        },
        {
          label: "Subscription",
          path: "/institution/subscription",
          icon: "ti ti-crown",
        },
        {
          label: "Teaching Overview",
          path: "/institution/overview/teaching",
          icon: "ti ti-chalkboard",
        },
        {
          label: "Student Overview",
          path: "/institution/overview/students",
          icon: "ti ti-user",
        },
        {
          label: "Parent Overview",
          path: "/institution/overview/parents",
          icon: "ti ti-users-group",
        },
      ],
    },
    {
      title: "USER MANAGEMENT",
      items: [
        {
          label: "Create User Credentials",
          path: "/institution/create-credentials",
          icon: "ti ti-user-check",
        },
        {
          label: "Members List",
          path: "/institution/users",
          icon: "ti ti-users-group",
        },
      ],
    },
    {
      title: "ACADEMIC",
      items: [
        {
          label: "Classes",
          path: "/institution/academic/classes",
          icon: "ti ti-building",
        },
        {
          label: "Sections",
          path: "/institution/academic/sections",
          icon: "ti ti-layout-kanban",
        },
        {
          label: "Subjects",
          path: "/institution/academic/subjects",
          icon: "ti ti-book-2",
        },
        {
          label: "Syllabus",
          path: "/institution/academic/syllabus",
          icon: "ti ti-file-text",
        },
        {
          label: "Classroom",
          path: "/institution/academic/classrooms",
          icon: "ti ti-door",
        },
        {
          label: "Class Routine",
          path: "/institution/academic/class-routine",
          icon: "ti ti-calendar",
        },
        {
          label: "Homework",
          path: "/institution/academic/homework",
          icon: "ti ti-pencil",
        },
      ],
    },
    {
      title: "PEOPLES",
      items: [
        {
          label: "Students",
          path: "/institution/students",
          icon: "ti ti-users",
          children: [
            {
              label: "Student List",
              path: "/institution/students",
              icon: "ti ti-list",
            },
            {
              label: "Add Student",
              path: "/institution/students/add",
              icon: "ti ti-user-plus",
            },
            {
              label: "Promotion",
              path: "/institution/students/promotion",
              icon: "ti ti-arrow-up",
            },
            {
              label: "Timetable",
              path: "/institution/students/timetable",
              icon: "ti ti-calendar",
            },
            {
              label: "Leaves",
              path: "/institution/students/leaves",
              icon: "ti ti-calendar-off",
            },
            {
              label: "Fees",
              path: "/institution/students/fees",
              icon: "ti ti-cash",
            },
            {
              label: "Results",
              path: "/institution/students/results",
              icon: "ti ti-receipt",
            },
            {
              label: "Library",
              path: "/institution/students/library",
              icon: "ti ti-book",
            },
          ],
        },
        {
          label: "Teachers",
          path: "/institution/teachers",
          icon: "ti ti-chalkboard-user",
          children: [
            {
              label: "Teacher List",
              path: "/institution/teachers",
              icon: "ti ti-list",
            },
            {
              label: "Teacher Routine",
              path: "/institution/teachers/routine",
              icon: "ti ti-calendar",
            },
            {
              label: "Leaves",
              path: "/institution/teachers/leaves",
              icon: "ti ti-calendar-off",
            },
            {
              label: "Salary",
              path: "/institution/teachers/salary",
              icon: "ti ti-cash",
            },
            {
              label: "Library",
              path: "/institution/teachers/library",
              icon: "ti ti-book",
            },
          ],
        },
        {
          label: "Parents",
          path: "/institution/parents",
          icon: "ti ti-users-group",
          children: [
            {
              label: "Parent List",
              path: "/institution/parents",
              icon: "ti ti-list",
            },
            {
              label: "Parent Details",
              path: "/institution/parents/:id",
              icon: "ti ti-user",
            },
          ],
        },
        {
          label: "Guardians",
          path: "/institution/guardians",
          icon: "ti ti-user-shield",
        },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        {
          label: "Fees Collection",
          path: "/institution/fees/collect",
          icon: "ti ti-cash",
          children: [
            {
              label: "Fee Groups",
              path: "/institution/fees/groups",
              icon: "ti ti-list",
            },
            {
              label: "Fee Types",
              path: "/institution/fees/types",
              icon: "ti ti-list",
            },
            {
              label: "Fee Masters",
              path: "/institution/fees/masters",
              icon: "ti ti-list",
            },
            {
              label: "Fee Assignment",
              path: "/institution/fees/assignment",
              icon: "ti ti-list",
            },
            {
              label: "Collect Fees",
              path: "/institution/fees/collect",
              icon: "ti ti-cash",
            },
            {
              label: "Transport Fees",
              path: "/institution/fees/transport",
              icon: "ti ti-car",
            },
          ],
        },
        {
          label: "Library",
          path: "/institution/library/members",
          icon: "ti ti-book-2",
          children: [
            {
              label: "Members",
              path: "/institution/library/members",
              icon: "ti ti-users",
            },
            {
              label: "Books",
              path: "/institution/library/books",
              icon: "ti ti-book",
            },
            {
              label: "Issue Book",
              path: "/institution/library/issue",
              icon: "ti ti-arrow-up-right",
            },
            {
              label: "Return Book",
              path: "/institution/library/return",
              icon: "ti ti-arrow-down-left",
            },
          ],
        },
        {
          label: "Sports",
          path: "/institution/sports",
          icon: "ti ti-ball-basketball",
        },
        {
          label: "Hostel",
          path: "/dashboard/hostel/hostels",
          icon: "ti ti-building",
          children: [
            {
              label: "Hostel Dashboard",
              path: "/dashboard/hostel",
              icon: "ti ti-layout-dashboard",
            },
            {
              label: "Hostel List",
              path: "/dashboard/hostel/hostels",
              icon: "ti ti-list",
            },
            {
              label: "Rooms",
              path: "/dashboard/hostel/rooms",
              icon: "ti ti-door",
            },
            {
              label: "Hostel Fees",
              path: "/dashboard/hostel/fees",
              icon: "ti ti-cash",
            },
            {
              label: "Payment History",
              path: "/dashboard/hostel/payments",
              icon: "ti ti-history",
            },
          ],
        },
        {
          label: "Transport",
          path: "/institution/transport",
          icon: "ti ti-car",
          children: [
            {
              label: "Routes",
              path: "/institution/transport/routes",
              icon: "ti ti-list",
            },
            {
              label: "Pickup Points",
              path: "/institution/transport/pickup-points",
              icon: "ti ti-map-pin",
            },
            {
              label: "Vehicles",
              path: "/institution/transport/vehicles",
              icon: "ti ti-car",
            },
            {
              label: "Drivers",
              path: "/institution/transport/drivers",
              icon: "ti ti-users",
            },
            {
              label: "Assign Vehicle",
              path: "/institution/transport/assign",
              icon: "ti ti-link",
            },
            {
              label: "Reports",
              path: "/institution/transport/reports",
              icon: "ti ti-file",
            },
          ],
        },
      ],
    },
    {
      title: "ATTENDANCE",
      items: [
        {
          label: "Student Attendance",
          path: "/institution/attendance/students",
          icon: "ti ti-checklist",
        },
        {
          label: "Staff Attendance",
          path: "/institution/attendance/staff",
          icon: "ti ti-checklist",
        },
      ],
    },
    {
      title: "EXAMINATIONS",
      items: [
        { label: "Exam", path: "/institution/exams", icon: "ti ti-pencil" },
        {
          label: "Schedule",
          path: "/institution/exams/schedule",
          icon: "ti ti-calendar",
        },
        {
          label: "Grades",
          path: "/institution/exams/grades",
          icon: "ti ti-star",
        },
        {
          label: "Exam Attendance",
          path: "/institution/exams/attendance",
          icon: "ti ti-checklist",
        },
        {
          label: "Results",
          path: "/institution/exams/results",
          icon: "ti ti-receipt",
        },
      ],
    },
    {
      title: "HRM",
      items: [
        {
          label: "Staffs",
          path: "/institution/hrm/staffs",
          icon: "ti ti-users",
        },
        {
          label: "Staff Overview",
          path: "/institution/hrm/staffs/overview",
          icon: "ti ti-chart-bar",
        },
        {
          label: "Staff Documents",
          path: "/institution/hrm/staffs/documents",
          icon: "ti ti-files",
        },
        {
          label: "Departments",
          path: "/institution/hrm/departments",
          icon: "ti ti-building",
        },
        {
          label: "Designations",
          path: "/institution/hrm/designations",
          icon: "ti ti-badge",
        },
        {
          label: "Leaves",
          path: "/institution/hrm/leaves",
          icon: "ti ti-calendar-off",
        },
        {
          label: "Approvals",
          path: "/institution/hrm/approvals",
          icon: "ti ti-check",
        },
        {
          label: "Holidays",
          path: "/institution/hrm/holidays",
          icon: "ti ti-calendar-holiday",
        },
        {
          label: "Payroll",
          path: "/institution/hrm/payroll",
          icon: "ti ti-cash",
        },
      ],
    },
    {
      title: "FINANCE & ACCOUNTS",
      items: [
        {
          label: "Expenses",
          path: "/institution/accounts/expenses",
          icon: "ti ti-receipt",
        },
        {
          label: "Expense Categories",
          path: "/institution/accounts/expense-categories",
          icon: "ti ti-list",
        },
        {
          label: "Income",
          path: "/institution/accounts/income",
          icon: "ti ti-cash",
        },
        {
          label: "Invoices",
          path: "/institution/accounts/invoices",
          icon: "ti ti-receipt-2",
        },
        {
          label: "Transactions",
          path: "/institution/accounts/transactions",
          icon: "ti ti-transfer-in",
        },
      ],
    },
    {
      title: "ANNOUNCEMENTS",
      items: [
        {
          label: "Notice Board",
          path: "/institution/notice-board",
          icon: "ti ti-bell",
        },
        {
          label: "Events",
          path: "/institution/events",
          icon: "ti ti-calendar-event",
        },
      ],
    },
    {
      title: "REPORTS",
      items: [
        {
          label: "Attendance Report",
          path: "/institution/reports/attendance",
          icon: "ti ti-file",
        },
        {
          label: "Class Report",
          path: "/institution/reports/class",
          icon: "ti ti-file",
        },
        {
          label: "Student Report",
          path: "/institution/reports/student",
          icon: "ti ti-file",
        },
        {
          label: "Grade Report",
          path: "/institution/reports/grade",
          icon: "ti ti-file",
        },
        {
          label: "Leave Report",
          path: "/institution/reports/leave",
          icon: "ti ti-file",
        },
        {
          label: "Fees Report",
          path: "/institution/reports/fees",
          icon: "ti ti-file",
        },
      ],
    },
    {
      title: "USER MANAGEMENT",
      items: [
        {
          label: "Branches",
          path: "/institution/branches",
          icon: "ti ti-building-factory-2",
        },
        {
          label: "Members List",
          path: "/institution/users",
          icon: "ti ti-users-group",
        },
        {
          label: "Roles & Permissions",
          path: "/institution/roles",
          icon: "ti ti-lock",
        },
        {
          label: "Delete Account Requests",
          path: "/institution/delete-requests",
          icon: "ti ti-trash",
        },
      ],
    },
    {
      title: "SUPPORT",
      items: [
        {
          label: "Support Tickets",
          path: "/institution/support/tickets",
          icon: "ti ti-ticket",
        },
      ],
    },
    {
      title: "APPLICATIONS",
      items: [APPLICATIONS_MENU],
    },
    {
      title: "SETTINGS",
      items: [
        {
          label: "Module Activation",
          path: "/institution/settings/modules",
          icon: "ti ti-puzzle",
        },
        {
          label: "Profile",
          path: "/institution/settings/profile",
          icon: "ti ti-user",
        },
        {
          label: "Security",
          path: "/institution/settings/security",
          icon: "ti ti-lock",
        },
        {
          label: "Notifications",
          path: "/institution/settings/notifications",
          icon: "ti ti-bell",
        },
        {
          label: "Company Info",
          path: "/institution/settings/company",
          icon: "ti ti-building",
        },
        {
          label: "Localization",
          path: "/institution/settings/localization",
          icon: "ti ti-globe",
        },
        {
          label: "Email Config",
          path: "/institution/settings/email",
          icon: "ti ti-mail",
        },
        {
          label: "SMS Config",
          path: "/institution/settings/sms",
          icon: "ti ti-messages",
        },
        {
          label: "Payment Gateway",
          path: "/institution/settings/payment",
          icon: "ti ti-credit-card",
        },
        {
          label: "Tax Settings",
          path: "/institution/settings/tax",
          icon: "ti ti-receipt",
        },
        {
          label: "School Settings",
          path: "/institution/settings/school",
          icon: "ti ti-building",
        },
        {
          label: "Storage Settings",
          path: "/institution/settings/storage",
          icon: "ti ti-cloud",
        },
      ],
    },
  ],

  // ADMINISTRATION - Institution Administration
  ADMIN: [
    {
      title: "MAIN",
      items: [
        {
          label: "Administration Dashboard",
          path: "/dashboard/admin",
          icon: "ti ti-dashboard",
        },
        {
          label: "Settings",
          path: "/dashboard/admin/settings",
          icon: "ti ti-settings",
        },
        {
          label: "Analytics",
          path: "/dashboard/admin/analytics",
          icon: "ti ti-chart-line",
        },
        {
          label: "Finance",
          path: "/dashboard/admin/finance",
          icon: "ti ti-wallet",
        },
      ],
    },
    {
      title: "USER MANAGEMENT",
      items: [
        { label: "Students", path: "/admin/students", icon: "ti ti-users" },
        {
          label: "Teachers",
          path: "/admin/teachers",
          icon: "ti ti-chalkboard-user",
        },
        { label: "Parents", path: "/admin/parents", icon: "ti ti-users-group" },
        { label: "Staff", path: "/admin/staff", icon: "ti ti-user-check" },
      ],
    },
    {
      title: "ACADEMIC",
      items: [
        {
          label: "Classes",
          path: "/admin/academic/classes",
          icon: "ti ti-building",
        },
        {
          label: "Subjects",
          path: "/admin/academic/subjects",
          icon: "ti ti-book-2",
        },
        { label: "Exams", path: "/admin/exams", icon: "ti ti-pencil" },
        {
          label: "Attendance",
          path: "/admin/attendance",
          icon: "ti ti-checklist",
        },
      ],
    },
    {
      title: "FINANCE",
      items: [
        { label: "Fees", path: "/admin/fees", icon: "ti ti-cash" },
        { label: "Accounts", path: "/admin/accounts", icon: "ti ti-receipt" },
        { label: "Reports", path: "/admin/reports", icon: "ti ti-file" },
      ],
    },
    {
      title: "SETTINGS",
      items: [
        {
          label: "Institution Settings",
          path: "/admin/settings",
          icon: "ti ti-settings",
        },
        { label: "User Management", path: "/admin/users", icon: "ti ti-users" },
      ],
    },
  ],

  // TEACHER - Academic and class-specific access
  TEACHER: [
    {
      title: "MAIN",
      items: [
        {
          label: "Teacher Dashboard",
          path: "/dashboard/teacher",
          icon: "ti ti-dashboard",
        },
        APPLICATIONS_MENU,
      ],
    },
    {
      title: "ACADEMIC",
      items: [
        {
          label: "Classes",
          path: "/dashboard/teacher/classes",
          icon: "ti ti-building",
        },
        {
          label: "Subjects",
          path: "/dashboard/teacher/subjects",
          icon: "ti ti-book-2",
        },
        {
          label: "Syllabus",
          path: "/dashboard/teacher/syllabus",
          icon: "ti ti-file-text",
        },
        {
          label: "Classroom",
          path: "/dashboard/teacher/classrooms",
          icon: "ti ti-door",
        },
        {
          label: "Class Routine",
          path: "/dashboard/teacher/class-routine",
          icon: "ti ti-calendar",
        },
        {
          label: "Class Timetable",
          path: "/dashboard/teacher/timetable",
          icon: "ti ti-clock",
        },
        {
          label: "Homework",
          path: "/dashboard/teacher/homework",
          icon: "ti ti-pencil",
        },
      ],
    },
    {
      title: "PEOPLES",
      items: [
        {
          label: "Students",
          path: "/dashboard/teacher/students",
          icon: "ti ti-users",
        },
        {
          label: "Teacher Routine",
          path: "/dashboard/teacher/attendance",
          icon: "ti ti-calendar",
        },
      ],
    },
    {
      title: "PERSONAL",
      items: [
        {
          label: "My Salary",
          path: "/dashboard/teacher/salary",
          icon: "ti ti-cash",
        },
        {
          label: "Library",
          path: "/dashboard/teacher/library",
          icon: "ti ti-book",
        },
        {
          label: "Transport Fees",
          path: "/dashboard/teacher/transport-fees",
          icon: "ti ti-car",
        },
      ],
    },
    {
      title: "ATTENDANCE",
      items: [
        {
          label: "Student Attendance",
          path: "/dashboard/teacher/attendance",
          icon: "ti ti-checklist",
        },
      ],
    },
    {
      title: "EXAMINATIONS",
      items: [
        {
          label: "Exam",
          path: "/dashboard/teacher/exams",
          icon: "ti ti-pencil",
        },
        {
          label: "Schedule",
          path: "/dashboard/teacher/exams",
          icon: "ti ti-calendar",
        },
        {
          label: "Grades",
          path: "/dashboard/teacher/grades",
          icon: "ti ti-star",
        },
      ],
    },
    {
      title: "ANNOUNCEMENTS",
      items: [
        { label: "Notice Board", path: "/notice-board", icon: "ti ti-bell" },
        { label: "Events", path: "/events", icon: "ti ti-calendar-event" },
      ],
    },
    {
      title: "REPORTS",
      items: [
        {
          label: "Attendance Report",
          path: "/reports/attendance",
          icon: "ti ti-file",
        },
        { label: "Grade Report", path: "/reports/grade", icon: "ti ti-file" },
      ],
    },
  ],

  // STAFF - Exact menu structure as requested by user
  STAFF: [
    {
      title: "MAIN",
      items: [
        {
          label: "Staff Dashboard",
          path: "/dashboard/staff",
          icon: "ti ti-dashboard",
        },
      ],
    },
    {
      title: "ATTENDANCE",
      items: [
        {
          label: "My Attendance",
          path: "/dashboard/staff/attendance",
          icon: "ti ti-checklist",
        },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        {
          label: "Notice Board",
          path: "/notice-board",
          icon: "ti ti-clipboard-data",
        },
        { label: "Events", path: "/events", icon: "ti ti-calendar-event" },
        { label: "Messages", path: "/messages", icon: "ti ti-mail" },
      ],
    },
    {
      title: "REPORTS",
      items: [
        {
          label: "Attendance Report",
          path: "/dashboard/staff/attendance-report",
          icon: "ti ti-file",
        },
      ],
    },
  ],

  // PARENT - Child/children data only
  PARENT: [
    {
      title: "MAIN",
      items: [
        {
          label: "Parent Dashboard",
          path: "/dashboard/parent",
          icon: "ti ti-dashboard",
        },
        APPLICATIONS_MENU,
      ],
    },
    {
      title: "CHILD ATTENDANCE",
      items: [
        {
          label: "Attendance",
          path: "/attendance/student",
          icon: "ti ti-checklist",
        },
      ],
    },
    {
      title: "ACADEMIC",
      items: [
        { label: "Homework", path: "/homework", icon: "ti ti-pencil" },
        { label: "Exam Results", path: "/exam-results", icon: "ti ti-receipt" },
      ],
    },
    {
      title: "FEES",
      items: [
        { label: "Fee Status", path: "/students/fees", icon: "ti ti-cash" },
        {
          label: "Transport Fees",
          path: "/students/transport-fees",
          icon: "ti ti-car",
        },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        { label: "Notice Board", path: "/notice-board", icon: "ti ti-bell" },
        { label: "Events", path: "/events", icon: "ti ti-calendar-event" },
        {
          label: "Teacher Communication",
          path: "/messages",
          icon: "ti ti-message",
        },
      ],
    },
  ],

  // ACCOUNTANT - Finance focused
  ACCOUNTANT: [
    {
      title: "MAIN",
      items: [
        {
          label: "Finance Dashboard",
          path: "/dashboard/finance",
          icon: "ti ti-dashboard",
        },
        {
          label: "Subscription",
          path: "/institution/subscription",
          icon: "ti ti-crown",
        },
        {
          label: "Applications",
          path: "/applications/calendar",
          icon: "ti ti-apps",
          children: [
            {
              label: "Calendar",
              path: "/applications/calendar",
              icon: "ti ti-calendar",
            },
            {
              label: "Chat",
              path: "/applications/chat",
              icon: "ti ti-message",
            },
            { label: "Email", path: "/applications/email", icon: "ti ti-mail" },
            { label: "Notes", path: "/applications/notes", icon: "ti ti-note" },
          ],
        },
      ],
    },
    {
      title: "FEES COLLECTION",
      items: [
        { label: "Fee Groups", path: "/fees/group", icon: "ti ti-list" },
        { label: "Fee Types", path: "/fees/type", icon: "ti ti-list" },
        { label: "Create Fees", path: "/fees/master", icon: "ti ti-plus" },
        { label: "Fee Masters", path: "/fees/master", icon: "ti ti-list" },
        { label: "Fee Assignment", path: "/fees/assign", icon: "ti ti-list" },
        { label: "Collect Fees", path: "/fees/collect", icon: "ti ti-cash" },
      ],
    },
    {
      title: "TRANSPORT FEES",
      items: [
        {
          label: "Transport Dashboard",
          path: "/transport/fees",
          icon: "ti ti-layout-dashboard",
        },
        {
          label: "Transport Fee Collection",
          path: "/transport/fees/collect",
          icon: "ti ti-cash",
        },
        {
          label: "Transport Fee Reports",
          path: "/transport/fees/reports",
          icon: "ti ti-file",
        },
        {
          label: "Student Transport Fees",
          path: "/transport/fees/students",
          icon: "ti ti-users",
        },
      ],
    },
    {
      title: "FINANCE & ACCOUNTS",
      items: [
        {
          label: "Expenses",
          path: "/accounts/expenses",
          icon: "ti ti-receipt",
        },
        {
          label: "Expense Categories",
          path: "/accounts/expense-categories",
          icon: "ti ti-list",
        },
        { label: "Income", path: "/accounts/income", icon: "ti ti-cash" },
        {
          label: "Invoices",
          path: "/accounts/invoices",
          icon: "ti ti-receipt-2",
        },
        {
          label: "Transactions",
          path: "/accounts/transactions",
          icon: "ti ti-transfer-in",
        },
      ],
    },
    {
      title: "REPORTS",
      items: [
        { label: "Fees Report", path: "/reports/fees", icon: "ti ti-file" },
        {
          label: "Transport Fees Report",
          path: "/reports/transport-fees",
          icon: "ti ti-file",
        },
      ],
    },
  ],

  // HR - Staff and payroll focused
  HR: [
    {
      title: "MAIN",
      items: [
        {
          label: "HR Dashboard",
          path: "/dashboard/hr",
          icon: "ti ti-dashboard",
        },
        APPLICATIONS_MENU,
      ],
    },
    {
      title: "HRM",
      items: [
        { label: "Staffs", path: "/staffs", icon: "ti ti-users" },
        { label: "Departments", path: "/departments", icon: "ti ti-building" },
        { label: "Designations", path: "/designations", icon: "ti ti-badge" },
        { label: "Leaves", path: "/staff-leaves", icon: "ti ti-calendar-off" },
        { label: "Leave Approvals", path: "/approvals", icon: "ti ti-check" },
        {
          label: "Holidays",
          path: "/holidays",
          icon: "ti ti-calendar-holiday",
        },
        {
          label: "Staff Documents",
          path: "/staffs/documents",
          icon: "ti ti-file",
        },
        { label: "Payroll", path: "/payroll", icon: "ti ti-cash" },
      ],
    },
    {
      title: "ATTENDANCE",
      items: [
        {
          label: "Staff Attendance",
          path: "/attendance/staff",
          icon: "ti ti-checklist",
        },
      ],
    },
    {
      title: "REPORTS",
      items: [
        {
          label: "Attendance Report",
          path: "/reports/attendance",
          icon: "ti ti-file",
        },
      ],
    },
  ],

  // PRINCIPAL - Leadership and oversight
  PRINCIPAL: [
    {
      title: "MAIN",
      items: [
        {
          label: "Principal Dashboard",
          path: "/dashboard/principal",
          icon: "ti ti-dashboard",
        },
        {
          label: "Leadership Overview",
          path: "/principal/overview",
          icon: "ti ti-chart-line",
        },
      ],
    },
    {
      title: "ACADEMICS",
      items: [
        {
          label: "Classes",
          path: "/principal/academic/classes",
          icon: "ti ti-building",
        },
        {
          label: "Subjects",
          path: "/principal/academic/subjects",
          icon: "ti ti-book-2",
        },
        { label: "Exams", path: "/principal/exams", icon: "ti ti-pencil" },
        { label: "Results", path: "/principal/results", icon: "ti ti-receipt" },
      ],
    },
    {
      title: "PEOPLE",
      items: [
        { label: "Students", path: "/principal/students", icon: "ti ti-users" },
        {
          label: "Teachers",
          path: "/principal/teachers",
          icon: "ti ti-chalkboard-user",
        },
        {
          label: "Parents",
          path: "/principal/parents",
          icon: "ti ti-users-group",
        },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        {
          label: "Notice Board",
          path: "/principal/notice-board",
          icon: "ti ti-bell",
        },
        {
          label: "Events",
          path: "/principal/events",
          icon: "ti ti-calendar-event",
        },
      ],
    },
    {
      title: "REPORTS",
      items: [
        {
          label: "Academic Reports",
          path: "/principal/reports/academic",
          icon: "ti ti-file",
        },
        {
          label: "Attendance Reports",
          path: "/principal/reports/attendance",
          icon: "ti ti-file-text",
        },
      ],
    },
  ],

  // AGENT - Institution creation and management focused
  AGENT: [
    {
      title: "MAIN",
      items: [
        {
          label: "Agent Dashboard",
          path: "/dashboard/agent",
          icon: "ti ti-dashboard",
        },
        APPLICATIONS_MENU,
      ],
    },
    {
      title: "INSTITUTIONS",
      items: [
        {
          label: "Create Institution",
          path: "/agent/institutions/create",
          icon: "ti ti-plus",
        },
        {
          label: "Manage Institutions",
          path: "/agent/institutions",
          icon: "ti ti-building",
        },
        {
          label: "Institution Reports",
          path: "/agent/reports",
          icon: "ti ti-file",
        },
      ],
    },
  ],

  // STAFF_MEMBER - General staff access
  STAFF_MEMBER: [
    {
      title: "MAIN",
      items: [
        {
          label: "Staff Dashboard",
          path: "/dashboard/staff",
          icon: "ti ti-dashboard",
        },
        APPLICATIONS_MENU,
      ],
    },
    {
      title: "PERSONAL",
      items: [
        { label: "My Profile", path: "/staff/profile", icon: "ti ti-user" },
        {
          label: "My Schedule",
          path: "/staff/schedule",
          icon: "ti ti-calendar",
        },
        {
          label: "My Attendance",
          path: "/staff/attendance",
          icon: "ti ti-checklist",
        },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        {
          label: "Notice Board",
          path: "/staff/notice-board",
          icon: "ti ti-bell",
        },
        { label: "Messages", path: "/staff/messages", icon: "ti ti-message" },
      ],
    },
  ],
};

// Add lowercase mappings for compatibility
SIDEBAR_MENUS.superadmin = SIDEBAR_MENUS.SUPER_ADMIN;
SIDEBAR_MENUS.institution_admin = SIDEBAR_MENUS.INSTITUTION_ADMIN;
SIDEBAR_MENUS.school_admin = SIDEBAR_MENUS.ADMIN; // Alias for backwards compatibility
SIDEBAR_MENUS.teacher = SIDEBAR_MENUS.TEACHER;
SIDEBAR_MENUS.student = SIDEBAR_MENUS.STUDENT;
SIDEBAR_MENUS.parent = SIDEBAR_MENUS.PARENT;
SIDEBAR_MENUS.accountant = SIDEBAR_MENUS.ACCOUNTANT;
SIDEBAR_MENUS.hr = SIDEBAR_MENUS.HR;
SIDEBAR_MENUS.agent = SIDEBAR_MENUS.AGENT;
SIDEBAR_MENUS.admin = SIDEBAR_MENUS.ADMIN;
SIDEBAR_MENUS.staff = SIDEBAR_MENUS.STAFF;
SIDEBAR_MENUS.principal = SIDEBAR_MENUS.PRINCIPAL;
SIDEBAR_MENUS.staff_member = SIDEBAR_MENUS.STAFF_MEMBER;
SIDEBAR_MENUS.transport_manager = [
  {
    title: "TRANSPORT",
    items: [
      {
        label: "Dashboard",
        path: "/transport",
        icon: "ti ti-layout-dashboard",
      },
      { label: "Routes", path: "/transport/routes", icon: "ti ti-list" },
      {
        label: "Pickup Points",
        path: "/transport/pickup-points",
        icon: "ti ti-map-pin",
      },
      { label: "Vehicles", path: "/transport/vehicles", icon: "ti ti-car" },
      { label: "Drivers", path: "/transport/drivers", icon: "ti ti-users" },
      {
        label: "Assign Vehicle",
        path: "/transport/assign",
        icon: "ti ti-link",
      },
      { label: "Reports", path: "/transport/reports", icon: "ti ti-file" },
    ],
  },
  {
    title: "APPLICATIONS",
    items: [
      {
        label: "Chat",
        path: "/dashboard/applications/chat",
        icon: "ti ti-brand-hipchat",
      },
      {
        label: "Calendar",
        path: "/dashboard/applications/calendar",
        icon: "ti ti-calendar",
      },
      {
        label: "Notes",
        path: "/dashboard/applications/notes",
        icon: "ti ti-note",
      },
      {
        label: "Email",
        path: "/dashboard/applications/email",
        icon: "ti ti-mail",
      },
      {
        label: "File Manager",
        path: "/dashboard/applications/file-manager",
        icon: "ti ti-folder",
      },
      {
        label: "Todo",
        path: "/dashboard/applications/todo",
        icon: "ti ti-checklist",
      },
    ],
  },
  {
    title: "MY ACCOUNT",
    items: [
      {
        label: "Profile",
        path: "/transport/settings/profile",
        icon: "ti ti-user",
      },
      {
        label: "Settings",
        path: "/transport/settings",
        icon: "ti ti-settings",
      },
    ],
  },
];
SIDEBAR_MENUS.hostel_warden = [
  {
    title: "HOSTEL",
    items: [
      { label: "Dashboard", path: "/dashboard/hostel", icon: "ti ti-home" },
      { label: "Rooms", path: "/dashboard/hostel/rooms", icon: "ti ti-door" },
      {
        label: "Hostel List",
        path: "/dashboard/hostel/hostels",
        icon: "ti ti-building",
      },
    ],
  },
  {
    title: "PAYMENTS",
    items: [
      {
        label: "Hostel Fees",
        path: "/dashboard/hostel/fees",
        icon: "ti ti-cash",
      },
      {
        label: "Payment History",
        path: "/dashboard/hostel/payments",
        icon: "ti ti-history",
      },
    ],
  },
  {
    title: "APPLICATIONS",
    items: [
      {
        label: "Chat",
        path: "/dashboard/applications/chat",
        icon: "ti ti-brand-hipchat",
      },
      {
        label: "Calendar",
        path: "/dashboard/applications/calendar",
        icon: "ti ti-calendar",
      },
      {
        label: "Notes",
        path: "/dashboard/applications/notes",
        icon: "ti ti-note",
      },
      {
        label: "Email",
        path: "/dashboard/applications/email",
        icon: "ti ti-mail",
      },
      {
        label: "File Manager",
        path: "/dashboard/applications/file-manager",
        icon: "ti ti-folder",
      },
      {
        label: "Todo",
        path: "/dashboard/applications/todo",
        icon: "ti ti-checklist",
      },
    ],
  },
  {
    title: "MY ACCOUNT",
    items: [
      {
        label: "Profile",
        path: "/dashboard/hostel/profile",
        icon: "ti ti-user",
      },
      {
        label: "Settings",
        path: "/dashboard/hostel/settings",
        icon: "ti ti-settings",
      },
    ],
  },
];

SIDEBAR_MENUS.transportmanager = SIDEBAR_MENUS.transport_manager;

SIDEBAR_MENUS.TRANSPORT_MANAGER = SIDEBAR_MENUS.transport_manager;

SIDEBAR_MENUS.principal = [
  {
    title: "MAIN",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard/principal",
        icon: "ti ti-layout-dashboard",
      },
      {
        label: "Settings",
        path: "/dashboard/principal/settings",
        icon: "ti ti-settings",
      },
      {
        label: "Profile",
        path: "/dashboard/principal/settings/profile",
        icon: "ti ti-user",
      },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      {
        label: "Analytics",
        path: "/dashboard/principal/analytics",
        icon: "ti ti-chart-line",
      },
      {
        label: "Finance Overview",
        path: "/dashboard/principal/finance",
        icon: "ti ti-wallet",
      },
      {
        label: "Teaching Overview",
        path: "/dashboard/principal/teaching-overview",
        icon: "ti ti-chalkboard",
      },
      {
        label: "Student Overview",
        path: "/dashboard/principal/student-overview",
        icon: "ti ti-user",
      },
    ],
  },
  {
    title: "ACADEMIC",
    items: [
      {
        label: "Classes",
        path: "/dashboard/principal/classes",
        icon: "ti ti-building",
      },
      {
        label: "Sections",
        path: "/dashboard/principal/sections",
        icon: "ti ti-layout-kanban",
      },
      {
        label: "Subjects",
        path: "/dashboard/principal/subjects",
        icon: "ti ti-book-2",
      },
      {
        label: "Classroom",
        path: "/dashboard/principal/classroom",
        icon: "ti ti-door",
      },
      {
        label: "Homework",
        path: "/dashboard/principal/homework",
        icon: "ti ti-pencil",
      },
    ],
  },
  {
    title: "PEOPLES",
    items: [
      {
        label: "Students",
        path: "/dashboard/principal/students",
        icon: "ti ti-users",
      },
      {
        label: "Add Student",
        path: "/dashboard/principal/students/add",
        icon: "ti ti-user-plus",
      },
      {
        label: "Teachers",
        path: "/dashboard/principal/teachers",
        icon: "ti ti-chalkboard-user",
      },
      {
        label: "Parents",
        path: "/dashboard/principal/parents",
        icon: "ti ti-users-group",
      },
    ],
  },
  {
    title: "FEES",
    items: [
      {
        label: "Fees Collection",
        path: "/dashboard/principal/fees-collection",
        icon: "ti ti-cash",
      },
      {
        label: "Fees Report",
        path: "/dashboard/principal/fees-report",
        icon: "ti ti-report-money",
      },
    ],
  },
  {
    title: "TRANSPORT",
    items: [
      {
        label: "Transport Routes",
        path: "/dashboard/principal/transport/routes",
        icon: "ti ti-route",
      },
      {
        label: "Pickup Points",
        path: "/dashboard/principal/transport/pickup-points",
        icon: "ti ti-map-pin",
      },
      {
        label: "Vehicles",
        path: "/dashboard/principal/transport/vehicles",
        icon: "ti ti-bus",
      },
      {
        label: "Drivers",
        path: "/dashboard/principal/transport/drivers",
        icon: "ti ti-steering-wheel",
      },
      {
        label: "Assign Vehicle",
        path: "/dashboard/principal/transport/assign",
        icon: "ti ti-transfer",
      },
      {
        label: "Transport Report",
        path: "/dashboard/principal/transport/reports",
        icon: "ti ti-report",
      },
    ],
  },
  {
    title: "HOSTEL",
    items: [
      {
        label: "Rooms",
        path: "/dashboard/principal/hostel/rooms",
        icon: "ti ti-door",
      },
      {
        label: "Room Types",
        path: "/dashboard/principal/hostel/room-types",
        icon: "ti ti-layout-grid",
      },
      {
        label: "Hostel Reports",
        path: "/dashboard/principal/hostel/reports",
        icon: "ti ti-report",
      },
    ],
  },
  {
    title: "ATTENDANCE",
    items: [
      {
        label: "Student Attendance",
        path: "/dashboard/principal/attendance/student",
        icon: "ti ti-user-check",
      },
      {
        label: "Staff Attendance",
        path: "/dashboard/principal/attendance/staff",
        icon: "ti ti-clipboard-check",
      },
    ],
  },
  {
    title: "LIBRARY",
    items: [
      {
        label: "Library",
        path: "/dashboard/principal/library",
        icon: "ti ti-book",
      },
      {
        label: "Library Members",
        path: "/dashboard/principal/library/members",
        icon: "ti ti-users",
      },
    ],
  },
  {
    title: "NOTICE",
    items: [
      {
        label: "Notice Board",
        path: "/dashboard/principal/notice-board",
        icon: "ti ti-speakerphone",
      },
      {
        label: "Events",
        path: "/dashboard/principal/events",
        icon: "ti ti-calendar-event",
      },
    ],
  },
];

// Accountant Menu - Finance focused
SIDEBAR_MENUS.ACCOUNTANT = [
  {
    title: "MAIN",
    items: [
      {
        label: "Dashboard",
        path: "/accountant",
        icon: "ti ti-layout-dashboard",
      },
      {
        label: "Subscription",
        path: "/accountant/subscription",
        icon: "ti ti-credit-card",
      },
      {
        label: "Applications",
        path: "/accountant/applications",
        icon: "ti ti-apps",
      },
    ],
  },
  {
    title: "FINANCE",
    items: [
      {
        label: "Fees Collection",
        path: "/accountant/fees-collection",
        icon: "ti ti-cash",
      },
      {
        label: "Fee Collection",
        path: "/accountant/fee-collection",
        icon: "ti ti-money",
      },
      {
        label: "Fees Groups",
        path: "/accountant/fees-groups",
        icon: "ti ti-files",
      },
      {
        label: "Fees Master",
        path: "/accountant/fees-master",
        icon: "ti ti-plus-circle",
      },
      {
        label: "Fees Type",
        path: "/accountant/fees-type",
        icon: "ti ti-category",
      },
      {
        label: "Collect Fees",
        path: "/accountant/collect-fees",
        icon: "ti ti-money",
      },
      {
        label: "Fees Assign",
        path: "/accountant/fees-assign",
        icon: "ti ti-file-invoice",
      },
    ],
  },
  {
    title: "TRANSACTIONS",
    items: [
      {
        label: "Transactions",
        path: "/accountant/transactions",
        icon: "ti ti-history",
      },
      {
        label: "Invoices",
        path: "/accountant/invoices",
        icon: "ti ti-file-invoice",
      },
      {
        label: "Expenses",
        path: "/accountant/expenses",
        icon: "ti ti-shopping-cart",
      },
      { label: "Income", path: "/accountant/income", icon: "ti ti-wallet" },
    ],
  },
];

SIDEBAR_MENUS.ADMIN = [
  {
    title: "MAIN",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard/admin",
        icon: "ti ti-layout-dashboard",
      },
      {
        label: "Settings",
        path: "/dashboard/admin/settings",
        icon: "ti ti-settings",
      },
      {
        label: "Analytics",
        path: "/dashboard/admin/analytics",
        icon: "ti ti-chart-line",
      },
      {
        label: "Finance",
        path: "/dashboard/admin/finance",
        icon: "ti ti-wallet",
      },
    ],
  },
  {
    title: "STUDENTS",
    items: [
      {
        label: "Student List",
        path: "/dashboard/admin/students",
        icon: "ti ti-users",
      },
      {
        label: "Add Student",
        path: "/dashboard/admin/students/add",
        icon: "ti ti-user-plus",
      },
      {
        label: "Student Attendance",
        path: "/dashboard/admin/student-attendance",
        icon: "ti ti-calendar-check",
      },
      {
        label: "Student Reports",
        path: "/dashboard/admin/student-report",
        icon: "ti ti-file-description",
      },
    ],
  },
  {
    title: "TEACHERS",
    items: [
      {
        label: "Teacher List",
        path: "/dashboard/admin/teachers",
        icon: "ti ti-chalkboard-user",
      },
      {
        label: "Add Teacher",
        path: "/dashboard/admin/teachers/add",
        icon: "ti ti-user-plus",
      },
      {
        label: "Teacher Attendance",
        path: "/dashboard/admin/teacher-attendance",
        icon: "ti ti-calendar-check",
      },
    ],
  },
  {
    title: "ACADEMIC",
    items: [
      {
        label: "Classes",
        path: "/dashboard/admin/classes",
        icon: "ti ti-building",
      },
      {
        label: "Sections",
        path: "/dashboard/admin/sections",
        icon: "ti ti-layout-rows",
      },
      {
        label: "Subjects",
        path: "/dashboard/admin/subjects",
        icon: "ti ti-book-2",
      },
      {
        label: "Classrooms",
        path: "/dashboard/admin/classrooms",
        icon: "ti ti-door",
      },
      {
        label: "Class Routine",
        path: "/dashboard/admin/class-routine",
        icon: "ti ti-calendar-time",
      },
      {
        label: "Homework",
        path: "/dashboard/admin/homework",
        icon: "ti ti-pencil",
      },
      {
        label: "Examinations",
        path: "/dashboard/admin/examinations",
        icon: "ti ti-pencil",
      },
      {
        label: "Exam Schedule",
        path: "/dashboard/admin/exam-schedule",
        icon: "ti ti-calendar",
      },
      {
        label: "Exam Grades",
        path: "/dashboard/admin/exam-grades",
        icon: "ti ti-star",
      },
      {
        label: "Upload Grades",
        path: "/dashboard/admin/upload-grades",
        icon: "ti ti-upload",
      },
      {
        label: "Results",
        path: "/dashboard/admin/results",
        icon: "ti ti-receipt",
      },
      {
        label: "Promotions",
        path: "/dashboard/admin/promotions",
        icon: "ti ti-arrow-up",
      },
    ],
  },
  {
    title: "FEES",
    items: [
      {
        label: "Fee Groups",
        path: "/dashboard/admin/fees/groups",
        icon: "ti ti-stack",
      },
      {
        label: "Fee Types",
        path: "/dashboard/admin/fees/types",
        icon: "ti ti-tag",
      },
      {
        label: "Fee Masters",
        path: "/dashboard/admin/fees/masters",
        icon: "ti ti-file-invoice",
      },
      {
        label: "Fee Assignment",
        path: "/dashboard/admin/fees/assignment",
        icon: "ti ti-clipboard-list",
      },
      {
        label: "Collect Fees",
        path: "/dashboard/admin/fees/collect",
        icon: "ti ti-credit-card",
      },
      {
        label: "Fees Collection",
        path: "/dashboard/admin/fees",
        icon: "ti ti-coin",
      },
      {
        label: "Fees Report",
        path: "/dashboard/admin/fees-report",
        icon: "ti ti-report-money",
      },
      {
        label: "Transport Fees",
        path: "/dashboard/admin/transport-fees",
        icon: "ti ti-car",
      },
    ],
  },
  {
    title: "ATTENDANCE",
    items: [
      {
        label: "Student Attendance",
        path: "/dashboard/admin/student-attendance",
        icon: "ti ti-users",
      },
      {
        label: "Staff Attendance",
        path: "/dashboard/admin/attendance",
        icon: "ti ti-users",
      },
      {
        label: "Attendance Report",
        path: "/dashboard/admin/attendance-report",
        icon: "ti ti-file",
      },
    ],
  },
  {
    title: "LIBRARY",
    items: [
      {
        label: "Library",
        path: "/dashboard/admin/library",
        icon: "ti ti-book",
      },
      {
        label: "Members",
        path: "/dashboard/admin/library-members",
        icon: "ti ti-users",
      },
      {
        label: "Books",
        path: "/dashboard/admin/library-books",
        icon: "ti ti-book",
      },
    ],
  },
  {
    title: "HOSTEL",
    items: [
      {
        label: "Hostel Dashboard",
        path: "/dashboard/hostel",
        icon: "ti ti-home",
      },
      {
        label: "Hostel List",
        path: "/dashboard/hostel/hostels",
        icon: "ti ti-list",
      },
      { label: "Rooms", path: "/dashboard/hostel/rooms", icon: "ti ti-door" },
      {
        label: "Hostel Fees",
        path: "/dashboard/hostel/fees",
        icon: "ti ti-cash",
      },
      {
        label: "Payment History",
        path: "/dashboard/hostel/payments",
        icon: "ti ti-history",
      },
    ],
  },
  {
    title: "TRANSPORT",
    items: [
      {
        label: "Routes",
        path: "/institution/transport/routes",
        icon: "ti ti-route",
      },
      {
        label: "Vehicles",
        path: "/institution/transport/vehicles",
        icon: "ti ti-car",
      },
      {
        label: "Drivers",
        path: "/institution/transport/drivers",
        icon: "ti ti-users",
      },
    ],
  },
  {
    title: "SPORTS",
    items: [
      {
        label: "Sports",
        path: "/dashboard/admin/sports",
        icon: "ti ti-ball-basketball",
      },
    ],
  },
  {
    title: "REPORTS",
    items: [
      {
        label: "Reports",
        path: "/dashboard/admin/reports",
        icon: "ti ti-file",
      },
      {
        label: "Grade Report",
        path: "/dashboard/admin/grade-report",
        icon: "ti ti-star",
      },
    ],
  },
  {
    title: "USER MANAGEMENT",
    items: [
      {
        label: "User Directory",
        path: "/dashboard/admin/user-management",
        icon: "ti ti-users",
      },
      {
        label: "Create Credentials",
        path: "/dashboard/admin/create-credentials",
        icon: "ti ti-key",
      },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      {
        label: "School Settings",
        path: "/dashboard/admin/school-settings",
        icon: "ti ti-settings",
      },
      {
        label: "Profile Settings",
        path: "/dashboard/admin/settings",
        icon: "ti ti-user",
      },
      {
        label: "Notifications",
        path: "/dashboard/admin/notifications",
        icon: "ti ti-bell",
      },
    ],
  },
];

// Helper functions
export const getSidebarMenu = (roleId: string): MenuSection[] => {
  if (!roleId) return SIDEBAR_MENUS.INSTITUTION_ADMIN;

  // Normalize role ID to handle variations
  const normalizedRole = roleId.toLowerCase().replace(/[_\s-]+/g, "_");

  // Try exact match first
  if (SIDEBAR_MENUS[roleId]) {
    return SIDEBAR_MENUS[roleId];
  }

  // Try normalized match
  if (SIDEBAR_MENUS[normalizedRole]) {
    return SIDEBAR_MENUS[normalizedRole];
  }

  // Handle common role variations
  const roleMappings: Record<string, string> = {
    staff_member: "staff",
    staffmember: "staff",
    "staff-member": "staff",
    institution_admin: "INSTITUTION_ADMIN",
    institutionadmin: "INSTITUTION_ADMIN",
    "institution-admin": "INSTITUTION_ADMIN",
    super_admin: "SUPER_ADMIN",
    superadmin: "SUPER_ADMIN",
    "super-admin": "SUPER_ADMIN",
    hr_manager: "HR",
    hrmanager: "HR",
    "hr-manager": "HR",
    transport_manager: "transport_manager",
    transportmanager: "transport_manager",
    "transport-manager": "transport_manager",
    hostel_warden: "hostel_warden",
    hostelwarden: "hostel_warden",
    "hostel-warden": "hostel_warden",
  };

  const mappedRole = roleMappings[normalizedRole];
  if (mappedRole && SIDEBAR_MENUS[mappedRole]) {
    return SIDEBAR_MENUS[mappedRole];
  }

  // Default to institution admin if no match
  return SIDEBAR_MENUS.INSTITUTION_ADMIN;
};

export const getFlatMenuItems = (roleId: string): string[] => {
  const menu = getSidebarMenu(roleId);
  const items: string[] = [];

  const flatten = (menuItems: MenuItem[]) => {
    menuItems.forEach((item) => {
      items.push(item.path);
      if (item.children) {
        flatten(item.children);
      }
    });
  };

  menu.forEach((section) => flatten(section.items));
  return items;
};
