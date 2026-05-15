import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import SuperAdminLayout from '../layouts/SuperAdminLayout'
import DashboardPage from '../pages/dashboard/InstituteAdmin/InstituteAdminDashboardPage'
import SuperAdminDashboard from '../pages/superadmin/SuperAdminDashboard'
import SchoolsManagementPage from '../pages/superadmin/InstitutionsManagementPage'
import TransactionsManagementPage from '../pages/superadmin/TransactionsManagementPage'
import InstitutionsDetailsPage from '../pages/superadmin/InstitutionsDetailsPage'
import InstitutionsEditPage from '../pages/superadmin/InstitutionsEditPage'
import InstitutionsUpgradePage from '../pages/superadmin/InstitutionsUpgradePage'
import PlatformSettingsPage from '../pages/superadmin/PlatformSettingsPage'
import ModulesControlPage from '../pages/superadmin/ModulesControlPage'
import MembershipPlans from '../pages/MembershipPlans/MembershipPlans'
import MembershipAddons from '../pages/MembershipPlans/MembershipAddons'
import MembershipTransactions from '../pages/MembershipPlans/MembershipTransactions'

// School Admin Pages
import UsersPage from '../pages/users/UsersPage'
import RolesPage from '../pages/users/RolesPage'
import PermissionsPage from '../pages/users/PermissionsPage'
import RolesPermissionsPage from '../pages/users/RolesPermissionsPage'

// Settings pages
import CompanyInfo from '../pages/settings/CompanyInfo'
import EmailConfig from '../pages/settings/EmailConfig'
import SmsConfig from '../pages/settings/SmsConfig'
import PaymentGateway from '../pages/settings/PaymentGateway'
import TaxSettings from '../pages/settings/TaxSettings'
import SchoolSettings from '../pages/settings/SchoolSettings'
import StorageSettings from '../pages/settings/StorageSettings'

// Support
import SupportTickets from '../pages/support/SupportTickets'

// HRM
import StaffsPage from '../pages/hrm/StaffsPage'
import DepartmentsPage from '../pages/hrm/DepartmentsPage'
import DesignationsPage from '../pages/hrm/DesignationsPage'
import LeavesPage from '../pages/hrm/LeavesPage'
import ApprovalsPage from '../pages/hrm/ApprovalsPage'
import HolidaysPage from '../pages/hrm/HolidaysPage'
import PayrollPage from '../pages/hrm/PayrollPage'

// Authentication Pages
import Login from '../pages/Authentication/Login/Login'
import Register from '../pages/Authentication/Login/Register/Register'
import ForgotPassword from '../pages/Authentication/Login/ForgotPassword/ForgotPassword'

// Management
import SportsPage from '../pages/management/SportsPage'

// Admin Dashboard Pages
import AdminDashboard from '../pages/dashboard/Admin/AdminDashboard'
import AdminStudentManagementPage from '../pages/dashboard/Admin/AdminStudentManagementPage'
import AdminTeacherManagementPage from '../pages/dashboard/Admin/AdminTeacherManagementPage'
import AdminAttendancePage from '../pages/dashboard/Admin/AdminAttendancePage'
import AdminExaminationsPage from '../pages/dashboard/Admin/AdminExaminationsPage'
import AdminFeesPage from '../pages/dashboard/Admin/AdminFeesPage'

// Accountant Pages
import AccountantDashboardPage from '../pages/dashboard/Accountant/AccountantDashboardPage'
import SubscriptionPage from '../pages/dashboard/Accountant/SubscriptionPage'
import ApplicationsPage from '../pages/dashboard/Accountant/ApplicationsPage'
import FeeCollectionPage from '../pages/dashboard/Accountant/FeeCollectionPage'

// People
import TeacherSalaryPage from '../pages/people/TeacherSalaryPage'

const router = createBrowserRouter([
  // Authentication Routes
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },

  // Default route - redirect to login
  {
    path: '/',
    element: <Login />
  },
  
  // Super Admin Routes with layout
  {
    path: '/super-admin',
    element: <SuperAdminLayout />,
    children: [
      { index: true, element: <SuperAdminDashboard /> },
      { path: 'dashboard', element: <SuperAdminDashboard /> },
      { path: 'schools', element: <SchoolsManagementPage /> },
      { path: 'schools/:id', element: <InstitutionsDetailsPage /> },
      { path: 'schools/:id/edit', element: <InstitutionsEditPage /> },
      { path: 'schools/:id/upgrade', element: <InstitutionsUpgradePage /> },
      { path: 'transactions', element: <TransactionsManagementPage /> },
      { path: 'membership-plans', element: <MembershipPlans /> },
      { path: 'membership-addons', element: <MembershipAddons /> },
      { path: 'membership-transactions', element: <MembershipTransactions /> },
      { path: 'institutions/add', element: <Navigate to="/super-admin/schools" /> },
      { path: 'analytics', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'institutions/inter-colleges', element: <Navigate to="/super-admin/schools" /> },
      { path: 'institutions/degree-colleges', element: <Navigate to="/super-admin/schools" /> },
      { path: 'branches', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'impersonate', element: <Navigate to="/super-admin/schools" /> },
      { path: 'memberships', element: <MembershipPlans /> },
      { path: 'revenue', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'alerts', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'analytics-reports', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'modules', element: <ModulesControlPage /> },
      { path: 'users', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'tickets', element: <SupportTickets /> },
      { path: 'audit-logs', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'settings', element: <PlatformSettingsPage /> },
      { path: 'maintenance', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'applications/calendar', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'applications/call', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'applications/chat', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'applications/email', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'applications/file-manager', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'applications/notes', element: <Navigate to="/super-admin/dashboard" /> },
      { path: 'applications/todo', element: <Navigate to="/super-admin/dashboard" /> },
    ]
  },

  // School Admin Routes (MAIN LAYOUT)
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'students', element: <Navigate to="/dashboard" /> },
      { path: 'teachers', element: <Navigate to="/dashboard"/> },
      { path: 'parents', element: <Navigate to="/dashboard" /> },
      { path: 'exams', element: <Navigate to="/dashboard" /> },
      { path: 'fees', element: <Navigate to="/dashboard"/> },
      { path: 'library', element: <Navigate to="/dashboard" /> },
      { path: 'reports', element: <Navigate to="/dashboard" /> },

      // Staff routes
      { path: 'staff', element: <Navigate to="/dashboard"/> },
      { path: 'attendance/staff', element: <Navigate to="/dashboard" /> },
      { path: 'notice-board', element: <Navigate to="/dashboard" /> },
      { path: 'events', element: <Navigate to="/dashboard" /> },
      { path: 'messages', element: <Navigate to="/dashboard" /> },
      { path: 'reports/attendance', element: <Navigate to="/dashboard" /> },

      // Users / Permissions
      { path: 'users', element: <UsersPage /> },
      { path: 'users/roles', element: <RolesPage /> },
      { path: 'users/permissions', element: <PermissionsPage /> },
      { path: 'roles-permission', element: <RolesPermissionsPage /> },

      // Support
      { path: 'support/tickets', element: <SupportTickets /> },
      { path: 'tickets', element: <SupportTickets /> },

      // Settings subsections
      { path: 'settings/company', element: <CompanyInfo /> },
      { path: 'settings/email', element: <EmailConfig /> },
      { path: 'settings/sms', element: <SmsConfig /> },
      { path: 'settings/payment-gateways', element: <PaymentGateway /> },
      { path: 'settings/tax', element: <TaxSettings /> },
      { path: 'settings/school', element: <SchoolSettings /> },
      { path: 'settings/storage', element: <StorageSettings /> },

      // Sidebar alias routes (match existing links)
      { path: 'company-settings', element: <CompanyInfo /> },
      { path: 'localization', element: <Navigate to="/dashboard" /> },
      { path: 'prefixes', element: <Navigate to="/dashboard" /> },
      { path: 'preferences', element: <Navigate to="/dashboard" /> },
      { path: 'social-authentication', element: <Navigate to="/dashboard" /> },
      { path: 'language', element: <Navigate to="/dashboard" /> },
      { path: 'email-settings', element: <EmailConfig /> },
      { path: 'sms-settings', element: <SmsConfig /> },
      { path: 'payment-gateways', element: <PaymentGateway /> },
      { path: 'tax-rates', element: <TaxSettings /> },
      { path: 'school-settings', element: <SchoolSettings /> },
      { path: 'storage', element: <StorageSettings /> },

      // HRM
      { path: 'staffs', element: <StaffsPage /> },
      { path: 'departments', element: <DepartmentsPage /> },
      { path: 'designations', element: <DesignationsPage /> },
      { path: 'leaves', element: <LeavesPage /> },
      { path: 'approvals', element: <ApprovalsPage /> },
      { path: 'holidays', element: <HolidaysPage /> },
      { path: 'payroll', element: <PayrollPage /> },

      // Management / People
      { path: 'management/sports', element: <SportsPage /> },
      { path: 'people/teacher-salaries', element: <TeacherSalaryPage /> },
    ]
  },

  // Admin Dashboard Routes
  {
    path: '/dashboard/admin',
    element: <MainLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'students', element: <AdminStudentManagementPage /> },
      { path: 'teachers', element: <AdminTeacherManagementPage /> },
      { path: 'attendance', element: <AdminAttendancePage /> },
      { path: 'exams', element: <AdminExaminationsPage /> },
      { path: 'fees', element: <AdminFeesPage /> },
    ]
  },

  // Accountant Dashboard Routes
  {
    path: '/dashboard/accountant',
    element: <MainLayout />,
    children: [
      { index: true, element: <AccountantDashboardPage /> },
      { path: 'subscription', element: <SubscriptionPage /> },
      { path: 'applications', element: <ApplicationsPage /> },
      { path: 'fee-collection', element: <FeeCollectionPage /> },
    ]
  },

  // Catch-all route for 404 - MUST BE LAST
  {
    path: '*',
    element: <Navigate to="/login"/>
  }
])

export default router
