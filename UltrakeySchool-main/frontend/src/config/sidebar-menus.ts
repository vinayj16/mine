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
        {
          label: "Pending Requests",
          path: "/super-admin/pending-requests",
          icon: "ti ti-clock",
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
          path: "/dashboard/main/analytics",
          icon: "ti ti-chart-line",
        },
        {
          label: "Finance",
          path: "/dashboard/main/finance",
          icon: "ti ti-wallet",
        },
        {
          label: "Subscription",
          path: "/dashboard/main/subscription",
          icon: "ti ti-crown",
        },
      ],
    },
    {
      title: "PEOPLES",
      items: [
        { label: "Create User Credentials", path: "/dashboard/main/create-credentials", icon: "ti ti-user-check" },
        { label: "Members List", path: "/dashboard/main/users", icon: "ti ti-users-group" },
        { label: "Students", path: "/dashboard/admin/students", icon: "ti ti-users" },
        { label: "Teachers", path: "/dashboard/admin/teachers", icon: "ti ti-chalkboard-user" },
        { label: "Parents", path: "/dashboard/admin/parents", icon: "ti ti-users-group" },
      ],
    },
    {
      title: "ACADEMIC",
      items: [
        { label: "Classes", path: "/dashboard/admin/classes", icon: "ti ti-building" },
        { label: "Sections", path: "/dashboard/admin/sections", icon: "ti ti-layout-rows" },
        { label: "Subjects", path: "/dashboard/admin/subjects", icon: "ti ti-book-2" },
        { label: "Timetable", path: "/dashboard/admin/academic/routine", icon: "ti ti-calendar-time" },
        { label: "Classroom", path: "/dashboard/admin/classroom", icon: "ti ti-school" },
      ],
    },
    {
      title: "FINANCE & PAYROLL",
      items: [
        { label: "Salaries", path: "/dashboard/main/salaries", icon: "ti ti-wallet" },
        { label: "Payroll", path: "/dashboard/main/payroll", icon: "ti ti-report-money" },
        { label: "Budgets", path: "/dashboard/main/budgets", icon: "ti ti-chart-bar" },
      ],
    },
    {
      title: "TRANSPORT MANAGEMENT",
      items: [
        { label: "Routes", path: "/dashboard/main/transport/routes", icon: "ti ti-route" },
        { label: "Vehicles", path: "/dashboard/main/transport/vehicles", icon: "ti ti-car" },
        { label: "Drivers", path: "/dashboard/main/transport/drivers", icon: "ti ti-steering-wheel" },
        { label: "Pickup Points", path: "/dashboard/main/transport/pickup-points", icon: "ti ti-map-pin" },
        { label: "Vehicle Maintenance", path: "/dashboard/main/transport/vehicle-maintenance", icon: "ti ti-tool" },
      ],
    },
    {
      title: "SETTINGS",
      items: [
        {
          label: "Institution Settings",
          path: "/dashboard/main/settings",
          icon: "ti ti-settings",
        },
      ],
    },
    {
      title: "APPLICATIONS",
      items: [APPLICATIONS_MENU],
    },
  ],

  // STUDENT - Academic and personal access
  STUDENT: [
    {
      title: "MAIN",
      items: [
        {
          label: "Student Dashboard",
          path: "/dashboard/student",
          icon: "ti ti-dashboard",
        },
        APPLICATIONS_MENU,
      ],
    },
    {
      title: "ACADEMIC",
      items: [
        {
          label: "My Timetable",
          path: "/dashboard/student/timetable",
          icon: "ti ti-calendar",
        },
        {
          label: "My Results",
          path: "/dashboard/student/results",
          icon: "ti ti-receipt",
        },
        {
          label: "Homework",
          path: "/dashboard/student/homework",
          icon: "ti ti-pencil",
        },
        {
          label: "Syllabus",
          path: "/dashboard/student/syllabus",
          icon: "ti ti-file-text",
        },
      ],
    },
    {
      title: "PERSONAL",
      items: [
        {
          label: "My Profile",
          path: "/dashboard/student/profile",
          icon: "ti ti-user",
        },
        {
          label: "My Attendance",
          path: "/dashboard/student/attendance",
          icon: "ti ti-checklist",
        },
        {
          label: "My Fees",
          path: "/dashboard/student/fees",
          icon: "ti ti-cash",
        },
        {
          label: "Library",
          path: "/dashboard/student/library",
          icon: "ti ti-book",
        },
      ],
    },
    {
      title: "EXAMINATIONS",
      items: [
        {
          label: "Exams",
          path: "/dashboard/student/exams",
          icon: "ti ti-pencil",
        },
        {
          label: "Grades",
          path: "/dashboard/student/grades",
          icon: "ti ti-star",
        },
      ],
    },
    {
      title: "TRANSPORT",
      items: [
        {
          label: "Transport",
          path: "/dashboard/student/transport",
          icon: "ti ti-car",
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
      title: "PTM",
      items: [
        {
          label: "My PTM Slots",
          path: "/dashboard/teacher/ptm",
          icon: "ti ti-calendar-time",
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
          path: "/dashboard/teacher/routine",
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
          label: "My Leaves",
          path: "/dashboard/teacher/leaves",
          icon: "ti ti-calendar-off",
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
      title: "PERSONAL",
      items: [
        {
          label: "My Profile",
          path: "/dashboard/staff/profile",
          icon: "ti ti-user",
        },
        {
          label: "Tasks",
          path: "/dashboard/staff/tasks",
          icon: "ti ti-checklist",
        },
        {
          label: "Leaves",
          path: "/dashboard/staff/leaves",
          icon: "ti ti-calendar-off",
        },
        {
          label: "Attendance",
          path: "/attendance/staff",
          icon: "ti ti-clock",
        },
        {
          label: "Notifications",
          path: "/dashboard/staff/notifications",
          icon: "ti ti-bell",
        },
      ],
    },
    {
      title: "APPLICATIONS",
      items: [APPLICATIONS_MENU],
    },
  ],

  // PARENT - Child/children data only (loads once via useMemo)
  PARENT: [
    {
      title: "MAIN",
      items: [
        {
          label: "Parent Dashboard",
          path: "/dashboard/parent",
          icon: "ti ti-dashboard",
        },
      ],
    },
    {
      title: "MY CHILDREN",
      items: [
        {
          label: "All Children",
          path: "/dashboard/parent",
          icon: "ti ti-users",
        },
        {
          label: "Fees & Payments",
          path: "/dashboard/parent/child/fees/select",
          icon: "ti ti-coin",
        },
        {
          label: "Timetable",
          path: "/dashboard/parent/child/timetable/select",
          icon: "ti ti-calendar",
        },
        {
          label: "Attendance",
          path: "/dashboard/parent/child/attendance/select",
          icon: "ti ti-checklist",
        },
        {
          label: "Grades & Results",
          path: "/dashboard/parent/child/results/select",
          icon: "ti ti-report",
        },
        {
          label: "Library",
          path: "/dashboard/parent/child/library/select",
          icon: "ti ti-books",
        },
      ],
    },
    {
      title: "HOSTEL MANAGEMENT",
      items: [
        {
          label: "Hostels",
          path: "/dashboard/parent/hostel/hostels",
          icon: "ti ti-building-community",
        },
        {
          label: "View Rooms",
          path: "/dashboard/parent/hostel/rooms",
          icon: "ti ti-door",
        },
        {
          label: "Room Types",
          path: "/dashboard/parent/hostel/room-types",
          icon: "ti ti-category",
        },
        {
          label: "Allocation",
          path: "/dashboard/parent/hostel/my-allocation",
          icon: "ti ti-bed",
        },
        {
          label: "Fee Status",
          path: "/dashboard/parent/hostel/fees",
          icon: "ti ti-coin",
        },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        {
          label: "PTM Slots",
          path: "/dashboard/parent/ptm",
          icon: "ti ti-calendar-time",
        },
      ],
    },
    {
      title: "ANNOUNCEMENTS",
      items: [
        {
          label: "Notice Board",
          path: "/notice-board",
          icon: "ti ti-bell",
        },
        {
          label: "Events",
          path: "/events",
          icon: "ti ti-calendar-event",
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
          path: "/dashboard/accountant",
          icon: "ti ti-dashboard",
        },
        APPLICATIONS_MENU,
      ],
    },
    {
      title: "SUBSCRIPTION",
      items: [
        {
          label: "Buy Subscription",
          path: "/dashboard/main/subscription",
          icon: "ti ti-crown",
        },
      ],
    },
    {
      title: "FEES COLLECTION",
      items: [
        { label: "Fee Groups", path: "/dashboard/accountant/fees-group", icon: "ti ti-list" },
        { label: "Fee Types", path: "/dashboard/accountant/fees-type", icon: "ti ti-list" },
        { label: "Fee Masters", path: "/dashboard/accountant/fees-master", icon: "ti ti-list" },
        { label: "Fee Assignment", path: "/dashboard/accountant/fees-assign", icon: "ti ti-list" },
        { label: "Collect Fees", path: "/dashboard/accountant/collect-fees", icon: "ti ti-cash" },
      ],
    },
    {
      title: "ACCOUNTS",
      items: [
        { label: "Invoices", path: "/dashboard/accountant/invoices", icon: "ti ti-file-invoice" },
        { label: "Transactions", path: "/dashboard/accountant/transactions", icon: "ti ti-arrows-exchange" },
        { label: "Expenses", path: "/accounts/expenses", icon: "ti ti-receipt" },
        { label: "Income", path: "/accounts/income", icon: "ti ti-cash" },
        { label: "Expense Categories", path: "/accounts/expense-categories", icon: "ti ti-category" },
      ],
    },
    {
      title: "FINANCE & PAYROLL",
      items: [
        { label: "Salaries", path: "/dashboard/accountant/salaries", icon: "ti ti-wallet" },
        { label: "Payroll", path: "/dashboard/accountant/payroll", icon: "ti ti-report-money" },
        { label: "Budgets", path: "/dashboard/accountant/budgets", icon: "ti ti-chart-bar" },
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
        { label: "Staffs", path: "/dashboard/hr/staffs", icon: "ti ti-users" },
        { label: "Staff Documents", path: "/dashboard/hr/documents", icon: "ti ti-file" },
        { label: "Staff Overview", path: "/dashboard/hr/overview", icon: "ti ti-chart-bar" },
        { label: "Inventory", path: "/dashboard/hr/inventory", icon: "ti ti-archive" },
        { label: "Email Logs", path: "/dashboard/hr/emails", icon: "ti ti-mail" },
      ],
    },
  ],

  // PRINCIPAL - Leadership and oversight
  PRINCIPAL: [
    {
      title: "MAIN",
      items: [
        { label: "Dashboard", path: "/dashboard/principal", icon: "ti ti-dashboard" },
        { label: "Subscription", path: "/dashboard/main/subscription", icon: "ti ti-crown" },
        { label: "Analytics", path: "/dashboard/principal/analytics", icon: "ti ti-chart-line" },
      ],
    },
    {
      title: "APPLICATIONS",
      items: [
        { label: "Calendar", path: "/dashboard/principal/applications/calendar", icon: "ti ti-calendar" },
        { label: "Chat", path: "/dashboard/principal/applications/chat", icon: "ti ti-message" },
        { label: "Call", path: "/dashboard/principal/applications/call", icon: "ti ti-phone" },
        { label: "Notes", path: "/dashboard/principal/applications/notes", icon: "ti ti-notes" },
        { label: "Todo", path: "/dashboard/principal/applications/todo", icon: "ti ti-checklist" },
        { label: "Email", path: "/dashboard/principal/applications/email", icon: "ti ti-mail" },
        { label: "File Manager", path: "/dashboard/principal/applications/file-manager", icon: "ti ti-files" },
      ],
    },
    {
      title: "PEOPLES",
      items: [
        { label: "Students", path: "/dashboard/principal/students", icon: "ti ti-users" },
        { label: "Teachers", path: "/dashboard/principal/teachers", icon: "ti ti-user-check" },
        { label: "Parents", path: "/dashboard/principal/parents", icon: "ti ti-users-group" },
        { label: "Guardians", path: "/dashboard/principal/guardians", icon: "ti ti-shield" },
      ],
    },
    {
      title: "ACADEMIC",
      items: [
        { label: "Classes", path: "/dashboard/principal/classes", icon: "ti ti-building" },
        { label: "Sections", path: "/dashboard/principal/sections", icon: "ti ti-layout-kanban" },
        { label: "Subjects", path: "/dashboard/principal/subjects", icon: "ti ti-book-2" },
        { label: "Syllabus", path: "/dashboard/principal/syllabus", icon: "ti ti-book" },
        { label: "Classroom", path: "/dashboard/principal/classroom", icon: "ti ti-school" },
        { label: "Class Routine", path: "/dashboard/principal/class-routine", icon: "ti ti-calendar-time" },
        { label: "Timetable", path: "/dashboard/principal/timetable", icon: "ti ti-clock" },
        { label: "Homework", path: "/dashboard/principal/homework", icon: "ti ti-edit" },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        { label: "Fees Collection", path: "/dashboard/principal/fees-collection", icon: "ti ti-currency-rupee" },
        { label: "Library", path: "/dashboard/principal/library", icon: "ti ti-books" },
        { label: "Sports", path: "/dashboard/principal/sports", icon: "ti ti-ball" },
      ],
    },
    {
      title: "HOSTEL MANAGEMENT",
      items: [
        { label: "Hostels", path: "/dashboard/principal/hostel/hostels", icon: "ti ti-building-community" },
        { label: "Manage Rooms", path: "/dashboard/principal/hostel/rooms", icon: "ti ti-door" },
        { label: "Room Types", path: "/dashboard/principal/hostel/room-types", icon: "ti ti-category" },
        { label: "Fee Collection", path: "/dashboard/principal/hostel/fees", icon: "ti ti-cash" },
        { label: "Payment History", path: "/dashboard/principal/hostel/payments", icon: "ti ti-history" },
        { label: "Reports", path: "/dashboard/principal/hostel/reports", icon: "ti ti-report-analytics" },
      ],
    },
    {
      title: "ATTENDANCE",
      items: [
        { label: "Student Attendance", path: "/dashboard/principal/attendance/student", icon: "ti ti-calendar-check" },
        { label: "Teacher Attendance", path: "/dashboard/principal/attendance/teacher", icon: "ti ti-user-check" },
      ],
    },
    {
      title: "EXAMINATIONS",
      items: [
        { label: "Exam", path: "/dashboard/principal/exams", icon: "ti ti-file-text" },
        { label: "Schedule", path: "/dashboard/principal/exam-schedule", icon: "ti ti-calendar-event" },
        { label: "Grades", path: "/dashboard/principal/grades", icon: "ti ti-award" },
        { label: "Results", path: "/dashboard/principal/exams/results", icon: "ti ti-certificate" },
      ],
    },
    {
      title: "ANNOUNCEMENTS",
      items: [
        { label: "Notice Board", path: "/dashboard/principal/notice-board", icon: "ti ti-speakerphone" },
        { label: "Events", path: "/dashboard/principal/events", icon: "ti ti-calendar-event" },
      ],
    },
    {
      title: "REPORTS",
      items: [
        { label: "Attendance Report", path: "/dashboard/principal/reports/attendance", icon: "ti ti-report-analytics" },
        { label: "Student Report", path: "/dashboard/principal/reports/students", icon: "ti ti-users" },
        { label: "Grade Report", path: "/dashboard/principal/reports/grades", icon: "ti ti-chart-bar" },
        { label: "Fees Report", path: "/dashboard/principal/fees-report", icon: "ti ti-file-invoice" },
      ],
    },
    {
      title: "SETTINGS",
      items: [
        { label: "Profile", path: "/dashboard/principal/profile", icon: "ti ti-user" },
        { label: "Notifications", path: "/dashboard/principal/notifications", icon: "ti ti-bell" },
        { label: "School Settings", path: "/dashboard/principal/school-settings", icon: "ti ti-settings" },
        { label: "Institution Settings", path: "/dashboard/principal/institution-settings", icon: "ti ti-building-gear" },
      ],
    },
    {
      title: "FINANCE & PAYROLL",
      items: [
        { label: "Salaries", path: "/dashboard/principal/salaries", icon: "ti ti-wallet" },
        { label: "Payroll", path: "/dashboard/principal/payroll", icon: "ti ti-report-money" },
        { label: "Budgets", path: "/dashboard/principal/budgets", icon: "ti ti-chart-bar" },
      ],
    },
  ],

  // LIBRARIAN - Library management
  LIBRARIAN: [
    {
      title: "MAIN",
      items: [
        {
          label: "Library Dashboard",
          path: "/dashboard/library",
          icon: "ti ti-dashboard",
        },
        APPLICATIONS_MENU,
      ],
    },
    {
      title: "LIBRARY MANAGEMENT",
      items: [
        {
          label: "Members",
          path: "/dashboard/library/members",
          icon: "ti ti-users",
        },
        {
          label: "Books",
          path: "/dashboard/library/books",
          icon: "ti ti-book",
        },
        {
          label: "Issue Book",
          path: "/dashboard/library/issue",
          icon: "ti ti-arrow-up-right",
        },
        {
          label: "Return Book",
          path: "/dashboard/library/return",
          icon: "ti ti-arrow-down-left",
        },
      ],
    },
  ],

  // HOSTEL_WARDEN - Hostel management focused
  HOSTEL_WARDEN: [
    {
      title: "MAIN",
      items: [
        {
          label: "Hostel Dashboard",
          path: "/dashboard/hostel",
          icon: "ti ti-building-community",
        },
        APPLICATIONS_MENU,
      ],
    },
    {
      title: "HOSTEL MANAGEMENT",
      items: [
        { label: "Hostels", path: "/dashboard/hostel/hostels", icon: "ti ti-building-community" },
        { label: "Manage Rooms", path: "/dashboard/hostel/rooms", icon: "ti ti-door" },
        { label: "Room Types", path: "/dashboard/hostel/room-types", icon: "ti ti-category" },
        { label: "Fee Collection", path: "/dashboard/hostel/fees", icon: "ti ti-cash" },
        { label: "Payment History", path: "/dashboard/hostel/payments", icon: "ti ti-history" },
        { label: "Reports", path: "/dashboard/hostel/reports", icon: "ti ti-report-analytics" },
      ],
    },
  ],

  // TRANSPORT_MANAGER - Transport management focused
  TRANSPORT_MANAGER: [
    {
      title: "MAIN",
      items: [
        {
          label: "Transport Dashboard",
          path: "/dashboard/transport",
          icon: "ti ti-car",
        },
        APPLICATIONS_MENU,
      ],
    },
    {
      title: "TRANSPORT MANAGEMENT",
      items: [
        { label: "Routes", path: "/dashboard/transport/routes", icon: "ti ti-route" },
        { label: "Vehicles", path: "/dashboard/transport/vehicles", icon: "ti ti-truck" },
        { label: "Drivers", path: "/dashboard/transport/drivers", icon: "ti ti-steering-wheel" },
        { label: "Pickup Points", path: "/dashboard/transport/pickup-points", icon: "ti ti-map-pin" },
        { label: "Assign Vehicle", path: "/dashboard/transport/assign", icon: "ti ti-truck-delivery" },
        { label: "Vehicle Maintenance", path: "/dashboard/transport/vehicle-maintenance", icon: "ti ti-tool" },
        { label: "Reports", path: "/dashboard/transport/reports", icon: "ti ti-report-analytics" },
      ],
    },
  ],

  // ADMIN - General administrative access
  ADMIN: [
    {
      title: "MAIN",
      items: [
        {
          label: "Admin Dashboard",
          path: "/dashboard/admin",
          icon: "ti ti-dashboard",
        },
        {
          label: "Subscription",
          path: "/dashboard/main/subscription",
          icon: "ti ti-crown",
        },
        {
          label: "Settings",
          path: "/dashboard/admin/settings",
          icon: "ti ti-settings",
        },
        {
          label: "Institution Settings",
          path: "/dashboard/admin/settings/institution",
          icon: "ti ti-building-gear",
        },
        {
          label: "Analytics",
          path: "/dashboard/admin/analytics",
          icon: "ti ti-chart-line",
        },
      ],
    },
    {
      title: "PEOPLES",
      items: [
        { label: "Students", path: "/dashboard/admin/students", icon: "ti ti-users" },
        { label: "Teachers", path: "/dashboard/admin/teachers", icon: "ti ti-chalkboard-user" },
        { label: "Parents", path: "/dashboard/admin/parents", icon: "ti ti-users-group" },
        { label: "Staff", path: "/dashboard/admin/staff", icon: "ti ti-user-check" },
      ],
    },
    {
      title: "ACADEMIC",
      items: [
        { label: "Classes", path: "/dashboard/admin/classes", icon: "ti ti-building" },
        { label: "Sections", path: "/dashboard/admin/sections", icon: "ti ti-layout-rows" },
        { label: "Subjects", path: "/dashboard/admin/subjects", icon: "ti ti-book-2" },
      ],
    },
    {
      title: "FEES",
      items: [
        { label: "Fees Collection", path: "/dashboard/admin/fees", icon: "ti ti-cash" },
        { label: "Fees Report", path: "/dashboard/admin/fees-report", icon: "ti ti-file" },
      ],
    },
    {
      title: "PARENT-TEACHER",
      items: [
        { label: "PTM Management", path: "/dashboard/admin/ptm", icon: "ti ti-calendar-time" },
      ],
    },
    {
      title: "HOSTEL MANAGEMENT",
      items: [
        { label: "Hostels", path: "/dashboard/admin/hostel/hostels", icon: "ti ti-building-community" },
        { label: "Manage Rooms", path: "/dashboard/admin/hostel/rooms", icon: "ti ti-door" },
        { label: "Room Types", path: "/dashboard/admin/hostel/room-types", icon: "ti ti-category" },
        { label: "Fee Collection", path: "/dashboard/admin/hostel/fees", icon: "ti ti-cash" },
        { label: "Payment History", path: "/dashboard/admin/hostel/payments", icon: "ti ti-history" },
        { label: "Reports", path: "/dashboard/admin/hostel/reports", icon: "ti ti-report-analytics" },
      ],
    },
    {
      title: "FINANCE & PAYROLL",
      items: [
        { label: "Salaries", path: "/dashboard/admin/salaries", icon: "ti ti-wallet" },
        { label: "Payroll", path: "/dashboard/admin/payroll", icon: "ti ti-report-money" },
        { label: "Budgets", path: "/dashboard/admin/budgets", icon: "ti ti-chart-bar" },
      ],
    },
    {
      title: "TRANSPORT MANAGEMENT",
      items: [
        { label: "Routes", path: "/dashboard/admin/transport", icon: "ti ti-route" },
        { label: "Vehicles", path: "/dashboard/admin/transport/vehicles", icon: "ti ti-car" },
        { label: "Drivers", path: "/dashboard/admin/transport/drivers", icon: "ti ti-steering-wheel" },
        { label: "Pickup Points", path: "/dashboard/admin/transport/pickup-points", icon: "ti ti-map-pin" },
        { label: "Vehicle Maintenance", path: "/dashboard/admin/transport/vehicle-maintenance", icon: "ti ti-tool" },
      ],
    },
    {
      title: "APPLICATIONS",
      items: [APPLICATIONS_MENU],
    },
  ],

  // AGENT - Institution creation and management focused
  AGENT: [
    {
      title: "MAIN",
      items: [
        {
          label: "Agent Dashboard",
          path: "/agent",
          icon: "ti ti-dashboard",
        },
        {
          label: "Commissions",
          path: "/agent/commissions",
          icon: "ti ti-cash",
        },
        {
          label: "Performance",
          path: "/agent/performance",
          icon: "ti ti-chart-line",
        },
      ],
    },
    {
      title: "INSTITUTIONS",
      items: [
        {
          label: "Create Institution",
          path: "/agent/institutions/add",
          icon: "ti ti-plus",
        },
        {
          label: "Manage Institutions",
          path: "/agent/institutions",
          icon: "ti ti-building",
        },
      ],
    },
    {
      title: "SETTINGS",
      items: [
        {
          label: "Profile",
          path: "/agent/profile",
          icon: "ti ti-user",
        },
        {
          label: "Settings",
          path: "/agent/settings",
          icon: "ti ti-settings",
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

// Role ID normalization and menu retrieval
export const getSidebarMenu = (roleId: string): MenuSection[] => {
  if (!roleId) return SIDEBAR_MENUS.INSTITUTION_ADMIN;

  const normalizedRole = roleId.toLowerCase().replace(/[_\s-]+/g, "_");

  // Priority role mappings
  const roleMappings: Record<string, string> = {
    superadmin: "SUPER_ADMIN",
    institutionadmin: "INSTITUTION_ADMIN",
    institution_admin: "INSTITUTION_ADMIN",
    admin: "ADMIN",
    teacher: "TEACHER",
    student: "STUDENT",
    parent: "PARENT",
    accountant: "ACCOUNTANT",
    hr: "HR",
    hr_manager: "HR",
    hrmanager: "HR",
    principal: "PRINCIPAL",
    librarian: "LIBRARIAN",
    agent: "AGENT",
    staff: "STAFF",
    staff_member: "STAFF",
    transport_manager: "TRANSPORT_MANAGER",
    transportmanager: "TRANSPORT_MANAGER",
    hostel_warden: "HOSTEL_WARDEN",
    hostelwarden: "HOSTEL_WARDEN",
  };

  const mappedRole = roleMappings[normalizedRole] || normalizedRole.toUpperCase();
  
  if (SIDEBAR_MENUS[mappedRole]) {
    return SIDEBAR_MENUS[mappedRole];
  }

  // Fallback check for exact role match
  if (SIDEBAR_MENUS[roleId]) {
    return SIDEBAR_MENUS[roleId];
  }

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
