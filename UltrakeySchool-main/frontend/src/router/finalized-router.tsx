import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

// Layout Components
import MainLayout from "../layouts/MainLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import InstitutionLayout from "../layouts/InstitutionLayout";
import AgentLayout from "../layouts/AgentLayout";
import AdminLayout from "../layouts/AdminLayout";
import TransportLayout from "../layouts/TransportLayout";
import RoleBasedDashboardRedirect from "../components/RoleBasedDashboardRedirect";

// Auth Pages
import LoginPage from "../pages/Authentication/Login/Login";
import RegisterPage from "../pages/Authentication/Login/Register/Register";
import ForgotPasswordPage from "../pages/Authentication/Login/ForgotPassword/ForgotPassword";

// Super Admin Pages
import AddInstitutionPage from "../pages/superadmin/AddInstitutionPage";
import InstitutionsManagementPage from "../pages/superadmin/InstitutionsManagementPage";
import InstitutionsDetailsPage from "../pages/superadmin/InstitutionsDetailsPage";
import InstitutionsEditPage from "../pages/superadmin/InstitutionsEditPage";
import InstitutionsUpgradePage from "../pages/superadmin/InstitutionsUpgradePage";
import InstitutionsAdminManagementPage from "../pages/superadmin/InstitutionsAdminManagementPage";
import InstitutionsSchoolsPage from "../pages/superadmin/InstitutionsSchoolsPage";
import InstitutionsInterCollegesPage from "../pages/superadmin/InstitutionsInterCollegesPage";
import InstitutionsDegreeCollegesPage from "../pages/superadmin/InstitutionsDegreeCollegesPage";
import InstitutionsEngineeringCollegesPage from "../pages/superadmin/InstitutionsEngineeringCollegesPage";
import BranchesMonitoringPage from "../pages/superadmin/BranchesMonitoringPage";
import BranchDetailsPage from "../pages/superadmin/BranchDetailsPage";
import BranchEditPage from "../pages/superadmin/BranchEditPage";
import BranchStudentsPage from "../pages/superadmin/BranchStudentsPage";
import TransactionDetailsPage from "../pages/superadmin/TransactionDetailsPage";
import InvoiceDetailsPage from "../pages/superadmin/InvoiceDetailsPage";
import RevenueAnalyticsPage from "../pages/superadmin/RevenueAnalyticsPage";
import MembershipsManagementPage from "../pages/superadmin/MembershipsManagementPage";
import SupportTicketsPage from "../pages/superadmin/SupportTicketsPage";
import ModulesControlPage from "../pages/superadmin/ModulesControlPage";
import PendingRequestsPage from "../pages/superadmin/PendingRequestsPage";
import CreateCredentialsPage from "../pages/superadmin/CreateCredentialsPage";
import SuperAdminDashboard from "../pages/superadmin/SuperAdminDashboard";
import PlatformSettingsPage from "../pages/superadmin/PlatformSettingsPage";
import AgentsManagementPage from "../pages/superadmin/AgentsManagementPage";
import AddAgentPage from "../pages/superadmin/AddAgentPage";
import AgentAnalyticsPage from "../pages/superadmin/AgentAnalyticsPage";
import AllDataPage from "../pages/superadmin/AllDataPage";
import MaintenancePage from "../pages/superadmin/MaintenancePage";
import ImpersonatePage from "../pages/superadmin/ImpersonatePage";
import TransactionsManagementPage from "../pages/superadmin/TransactionsManagementPage";
import PlatformUsersPage from "../pages/superadmin/PlatformUsersPage";
import AnalyticsReportsPage from "../pages/superadmin/AnalyticsReportsPage";
import AuditLogsPage from "../pages/superadmin/AuditLogsPage";
import SubscriptionApprovalPage from "../pages/superadmin/SubscriptionApprovalPage";
import SuperAdminAnalyticsPage from "../pages/superadmin/AnalyticsPage";

// Application Pages
import FileManagerPage from "../pages/Applications/FileManager";
import NotesPage from "../pages/Applications/Notes";
import TodoPage from "../pages/Applications/Todo";
import CalendarPage from "../pages/Applications/Calendar";
import CallPage from "../pages/Applications/Call";
import ChatPage from "../pages/Applications/Chat";
import EmailPage from "../pages/Applications/Email";

// Institution User Management Pages
import InstitutionPendingRequestsPage from "../pages/user-management/PendingRequestsPage";

// Institution Fees Pages
import InstitutionCreateCredentialsPage from "../pages/user-management/InstitutionCreateCredentialsPage";

// Institution Academic Pages
import ClassesPage from "../pages/academic/ClassesPage";
import ClassSectionPage from "../pages/academic/ClassSectionPage";
import ClassSubjectPage from "../pages/academic/ClassSubjectPage";
import ClassRoomPage from "../pages/academic/ClassRoomPage";
import ClassRoutinePage from "../pages/academic/ClassRoutinePage";
import ClassHomeWorkPage from "../pages/academic/ClassHomeWorkPage";
import ScheduleClassesPage from "../pages/academic/ScheduleClassesPage";
import ExamPage from "../pages/academic/ExamPage";
import ExamSchedulePage from "../pages/academic/ExamSchedulePage";
import GradePage from "../pages/academic/GradePage";
import ClassTimeTablePage from "../pages/academic/ClassTimeTablePage";
import ExamAttendancePage from "../pages/academic/ExamAttendancePage";
import ExamResultsPage from "../pages/academic/ExamResultsPage";

// Institution Student Pages
import StudentListPage from "../pages/students/StudentListPage";
import StudentAdd from "../pages/students/StudentAdd";
import StudentPromotionPage from "../pages/students/StudentPromotionPage";
import StudentTimeTablePage from "../pages/students/StudentTimeTablePage";
import StudentLeavesPage from "../pages/students/StudentLeavesPage";
import StudentFeesPage from "../pages/students/StudentFeesPage";
import StudentResultPage from "../pages/students/StudentResultPage";
import StudentLibraryPage from "../pages/students/StudentLibraryPage";

// Institution Teacher Pages
import TeacherListPage from "../pages/teachers/TeacherListPage";
import TeacherAddPage from "../pages/teachers/TeacherAddPage";
import TeacherRoutinePage from "../pages/teachers/TeacherRoutinePage";
import TeacherLeavesPage from "../pages/teachers/TeacherLeavesPage";
import TeacherSalaryPage from "../pages/teachers/TeacherSalaryPage";
import TeacherLibraryPage from "../pages/teachers/TeacherLibraryPage";

// Institution Parent Pages
import ParentListPage from "../pages/parents/ParentListPage";
import ParentDetailsPage from "../pages/parents/ParentDetailsPage";
import GuardianListPage from "../pages/guardians/GuardianListPage";

// Institution Fees Pages
import FeesGroupPage from "../pages/fees/FeesGroupPage";
import FeesTypePage from "../pages/fees/FeesTypePage";
import FeesMasterPage from "../pages/fees/FeesMasterPage";
import FeesAssignPage from "../pages/fees/FeesAssignPage";

// Institution Library Pages
import LibraryMembersPage from "../pages/library/LibraryMembersPage";
import LibraryBooksPage from "../pages/library/LibraryBooksPage";
import LibraryIssueBookPage from "../pages/library/LibraryIssueBookPage";
import LibraryReturnPage from "../pages/library/LibraryReturnPage";

// Institution Sports
import SportsPage from "../pages/sports/SportsPage";

// Institution Hostel Pages
import HostelRoomsPage from "../pages/hostel/HostelRoomsPage";
import HostelRoomTypesPage from "../pages/hostel/HostelRoomTypesPage";
import HostelReportPage from "../pages/hostel/HostelReportPage";

// Institution Transport Pages
import TransportRoutesPage from "../pages/transport/TransportRoutesPage";
import TransportPickupPointsPage from "../pages/transport/TransportPickupPointsPage";
import TransportVehiclePage from "../pages/transport/TransportVehiclePage";
import TransportVehicleDriversPage from "../pages/transport/TransportVehicleDriversPage";
import TransportAssignVehiclePage from "../pages/transport/TransportAssignVehiclePage";
import TransportReportPage from "../pages/transport/TransportReportPage";

// Institution Attendance Pages
import StudentAttendancePage from "../pages/attendance/StudentAttendancePage";
import StaffAttendancePage from "../pages/attendance/StaffAttendancePage";

// Institution hrM Pages
import StaffsPage from "../pages/hrm/StaffsPage";
import StaffDocumentsPage from "../pages/hrm/StaffDocumentsPage";
import StaffOverviewPage from "../pages/overview/StaffOverviewPage";
import DepartmentsPage from "../pages/hrm/DepartmentsPage";
import DesignationsPage from "../pages/hrm/DesignationsPage";
import LeavesPage from "../pages/hrm/LeavesPage";
import ApprovalsPage from "../pages/hrm/ApprovalsPage";
import HolidaysPage from "../pages/hrm/HolidaysPage";
import PayrollPage from "../pages/hrm/PayrollPage";

// Institution Finance Pages
import ExpensesPage from "../pages/finance/ExpensesPage";
import ExpensesCategoryPage from "../pages/finance/ExpensesCategoryPage";
import IncomePage from "../pages/finance/IncomePage";
import InvoicesPage from "../pages/finance/InvoicesPage";
import TransactionsPage from "../pages/finance/TransactionsPage";

// Institution Announcements
import NoticeBoardPage from "../pages/announcements/NoticeBoardPage";
import EventsPage from "../pages/announcements/EventsPage";

// Institution Reports
import AttendanceReportPage from "../pages/reports/AttendanceReportPage";
import ClassReportPage from "../pages/reports/ClassReportPage";
import StudentReportPage from "../pages/reports/StudentReportPage";
import GradeReportPage from "../pages/reports/GradeReportPage";
import LeaveReportPage from "../pages/reports/LeaveReportPage";
import FeesReportPage from "../pages/reports/FeesReportPage";

// Institution Users/Roles
import UsersPage from "../pages/users/UsersPage";
import RolesPermissionsPage from "../pages/users/RolesPermissionsPage";
import DeleteAccountPage from "../pages/users/DeleteAccountPage";

// Institution Support
import TicketsPage from "../pages/support/TicketsPage";

// Admin Pages
import InstitutionSettingsPage from "../pages/dashboard/InstituteAdmin/InstitutionSettingsPage";
import AdminDashboard from "../pages/dashboard/Admin/AdminDashboard";
import AdminAddStudentPage from "../pages/dashboard/Admin/AdminAddStudentPage";
import AdminFeesPage from "../pages/dashboard/Admin/AdminFeesPage";
import AdminStudentManagementPage from "../pages/dashboard/Admin/AdminStudentManagementPage";
import AdminTeacherManagementPage from "../pages/dashboard/Admin/AdminTeacherManagementPage";
import AdminAcademicPage from "../pages/dashboard/Admin/AdminAcademicPage";
import AdminAttendancePage from "../pages/dashboard/Admin/AdminAttendancePage";
import AdminExaminationsPage from "../pages/dashboard/Admin/AdminExaminationsPage";
import AdminLibraryPage from "../pages/dashboard/Admin/AdminLibraryPage";
import AdminReportsPage from "../pages/dashboard/Admin/AdminReportsPage";
import AdminStudentAttendancePage from "../pages/dashboard/Admin/AdminStudentAttendancePage";
import AdminTeacherAttendancePage from "../pages/dashboard/Admin/AdminTeacherAttendancePage";
import AdminLibraryMembersPage from "../pages/dashboard/Admin/AdminLibraryMembersPage";
import AdminLibraryBooksPage from "../pages/dashboard/Admin/AdminLibraryBooksPage";
import AdminSportsPage from "../pages/dashboard/Admin/AdminSportsPage";
import AdminExamPage from "../pages/dashboard/Admin/AdminExamPage";
import AdminExamSchedulePage from "../pages/dashboard/Admin/AdminExamSchedulePage";
import AdminGradesPage from "../pages/dashboard/Admin/AdminGradesPage";
import AdminResultsPage from "../pages/dashboard/Admin/AdminResultsPage";
import AdminProfileSettingsPage from "../pages/dashboard/Admin/AdminProfileSettingsPage";
import AdminNotificationsPage from "../pages/dashboard/Admin/AdminNotificationsPage";
import AdminSchoolSettingsPage from "../pages/dashboard/Admin/AdminSchoolSettingsPage";
import AdminUserDirectoryPage from "../pages/dashboard/Admin/AdminUserDirectoryPage";
import AdminPendingRequestsPage from "../pages/dashboard/Admin/AdminPendingRequestsPage";
import AdminCreateCredentialsPage from "../pages/dashboard/Admin/AdminCreateCredentialsPage";
import PrincipalAnalyticsPage from "../pages/dashboard/Principal/PrincipalAnalyticsPage";
import FinancePage from "../pages/dashboard/FinancePage";
import StudentsOverviewPage from "../pages/overview/StudentsOverviewPage";
import TeachersOverviewPage from "../pages/overview/TeachersOverviewPage";
import ParentsOverviewPage from "../pages/overview/ParentsOverviewPage";

// Teacher Pages
import TeacherDashboardPage from "../pages/dashboard/TeacherDashboardPage";

// Student Pages
import StudentDashboardPage from "../pages/dashboard/Student/StudentDashboard";

// Parent Pages
import ParentDashboardPage from "../pages/dashboard/Parent/ParentDashboardPage";

// Staff Pages
import StaffDashboardPage from "../pages/dashboard/Staff/StaffDashboard";
import StaffProfilePage from "../pages/staff/ProfilePage";
import TasksPage from "../pages/staff/TasksPage";
import LeavePage from "../pages/staff/LeavePage";
import MessagesPage from "../pages/communication/MessagesPage";

// Accountant Pages
import AccountantDashboardPage from "../pages/dashboard/Accountant/AccountantDashboardPage";
import FeeCollectionPage from "../pages/dashboard/Accountant/FeeCollectionPage";

// Librarian Pages
import LibrarianDashboardPage from "../pages/dashboard/LibraryDashboardPage";

// Transport Manager Pages
import TransportManagerDashboardPage from "../pages/dashboard/TransportDashboardPage";

// Agent Pages
import AgentDashboard from "../pages/agent/AgentDashboard";
import AgentInstitutionsPage from "../pages/agent/AgentInstitutionsPage";
import AgentAddInstitutionPage from "../pages/agent/AgentAddInstitutionPage";
import AgentCommissionsPage from "../pages/agent/AgentCommissionsPage";
import AgentPerformancePage from "../pages/agent/AgentPerformancePage";
import AgentProfilePage from "../pages/agent/AgentProfilePage";
import AgentSettingsPage from "../pages/agent/AgentSettingsPage";
import AgentInstitutionDetailsPage from "../pages/agent/AgentInstitutionDetailsPage";
import AgentInstitutionEditPage from "../pages/agent/AgentInstitutionEditPage";

// Other Pages
import ProfileSettingsPage from "../pages/Generasettings/ProfileSettings";
import SecuritySettingsPage from "../pages/Generasettings/SecuritySettings";
import HomePage from "../HomePage";
import NotificationsSettingsPage from "../pages/Generasettings/NotificationsSettings";
import UserSettingsPage from "../pages/settings/UserSettingsPage";

// Protected Route Component
import ProtectedRoute from "../components/ProtectedRoute";
import AdminStudentReportPage from "../pages/dashboard/Admin/AdminStudentReportPage";
import AdminAttendanceReportPage from "../pages/dashboard/Admin/AdminAttendanceReportPage";
import AdminFeesReportPage from "../pages/dashboard/Admin/AdminFeesReportPage";
import AdminGradeReportPage from "../pages/dashboard/Admin/AdminGradeReportPage";
import ClassSyllabusPage from "../pages/academic/ClassSyllabusPage";
import AlertsPage from "../pages/superadmin/AlertsPage";
import AgentDetailsPage from "../pages/superadmin/AgentDetailsPage";
import EditAgentPage from "../pages/superadmin/EditAgentPage";
import InstituteSetupPage from "../pages/superadmin/InstitutionSetupPage";
import InstitutionManagementPage from "../pages/superadmin/InstitutionManagementPage";
import InstitutionDashboard from "../pages/dashboard/InstituteAdmin/InstituteAdminDashboardPage";
import InstituteAnalyticsDashboardPage from "../pages/dashboard/InstituteAdmin/InstituteAnalyticsDashboardPage";
import InstituteFinanceDashboardPage from "../pages/dashboard/InstituteAdmin/InstituteFinanceDashboardPage";
import UserDirectoryPage from "../pages/dashboard/InstituteAdmin/UserDirectoryPage";
import PrincipalDashboard from "../pages/dashboard/Principal/PrincipalDashboard";
import CollectFeesPage from "../pages/fees/CollectFeesPage";
import SubscriptionPage from "../pages/dashboard/InstituteAdmin/SubscriptionPage";

// Create finalized router
const router = createBrowserRouter([
  // Root - Home Page
  {
    path: "/",
    element: <HomePage />,
  },

  // Authentication Routes (no layout)
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },

  // Settings Routes (accessible from sidebar with InstitutionLayout)
  {
    path: "/settings",
    element: (
      <ProtectedRoute
        requiredRoles={[
          "institution_owner",
          "institutionowner",
          "institution_admin",
          "institutionadmin",
          "admin",
          "admin",
          "principal",
          "teacher",
          "teacher",
          "student",
          "student",
          "parent",
          "parent",
          "staff",
          "staff",
          "accountant",
          "accountant",
          "hr",
          "hr",
          "librarian",
          "librarian",
          "transportmanager",
          "transport_manager",
          "hostelwarden",
          "hostel_warden",
        ]}
        element={<InstitutionLayout />}
      />
    ),
    children: [
      { index: true, element: <UserSettingsPage /> },
      { path: "profile", element: <ProfileSettingsPage /> },
      { path: "security", element: <SecuritySettingsPage /> },
      { path: "notifications", element: <NotificationsSettingsPage /> },
    ],
  },

  // Super Admin Routes (SEPARATE LAYOUT)
  {
    path: "/super-admin",
    element: <SuperAdminLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/super-admin/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<SuperAdminDashboard />}
          />
        ),
      },
      {
        path: "institutions/add",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<AddInstitutionPage />}
          />
        ),
      },
      {
        path: "institutions",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<InstitutionsManagementPage />}
          />
        ),
      },
      {
        path: "institutions/:id",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<InstitutionsDetailsPage />}
          />
        ),
      },
      {
        path: "institutions/:id/edit",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<InstitutionsEditPage />}
          />
        ),
      },
      {
        path: "institutions/:id/upgrade",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<InstitutionsUpgradePage />}
          />
        ),
      },
      {
        path: "institutions/:id/admin",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<InstitutionsAdminManagementPage />}
          />
        ),
      },
      // Institution type routes
      {
        path: "institutions/schools",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<InstitutionsSchoolsPage />}
          />
        ),
      },
      {
        path: "institutions/inter-colleges",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<InstitutionsInterCollegesPage />}
          />
        ),
      },
      {
        path: "institutions/degree-colleges",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<InstitutionsDegreeCollegesPage />}
          />
        ),
      },
      {
        path: "institutions/engineering-colleges",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<InstitutionsEngineeringCollegesPage />}
          />
        ),
      },
      {
        path: "institutions/engineering",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<InstitutionsManagementPage />}
          />
        ),
      },
      {
        path: "institution-setup",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<InstituteSetupPage />}
          />
        ),
      },
      {
        path: "institution-management",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<InstitutionManagementPage />}
          />
        ),
      },
      {
        path: "user-setup",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<CreateCredentialsPage />}
          />
        ),
      },
      {
        path: "create-credentials",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<CreateCredentialsPage />}
          />
        ),
      },
      {
        path: "branches",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<BranchesMonitoringPage />}
          />
        ),
      },
      {
        path: "branches/:id",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<BranchDetailsPage />}
          />
        ),
      },
      {
        path: "branches/:id/edit",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<BranchEditPage />}
          />
        ),
      },
      {
        path: "branches/:id/students",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<BranchStudentsPage />}
          />
        ),
      },
      {
        path: "impersonate",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<ImpersonatePage />}
          />
        ),
      },
      {
        path: "transactions",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<TransactionsManagementPage />}
          />
        ),
      },
      {
        path: "transactions/:id",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<TransactionDetailsPage />}
          />
        ),
      },
      {
        path: "transactions/:id/invoice",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<InvoiceDetailsPage />}
          />
        ),
      },
      {
        path: "subscription-approvals",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<SubscriptionApprovalPage />}
          />
        ),
      },
      {
        path: "revenue",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<RevenueAnalyticsPage />}
          />
        ),
      },
      {
        path: "analytics/revenue",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<RevenueAnalyticsPage />}
          />
        ),
      },
      {
        path: "analytics",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<SuperAdminAnalyticsPage />}
          />
        ),
      },
      {
        path: "analytics-reports",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<AnalyticsReportsPage />}
          />
        ),
      },
      {
        path: "audit-logs",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<AuditLogsPage />}
          />
        ),
      },
      {
        path: "platform-users",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<PlatformUsersPage />}
          />
        ),
      },
      {
        path: "agents",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<AgentsManagementPage />}
          />
        ),
      },
      {
        path: "agents/add",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<AddAgentPage />}
          />
        ),
      },
      {
        path: "agents/:id",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<AgentDetailsPage />}
          />
        ),
      },
      {
        path: "agents/:id/edit",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<EditAgentPage />}
          />
        ),
      },
      {
        path: "agent-analytics",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<AgentAnalyticsPage />}
          />
        ),
      },
      {
        path: "all-data",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<AllDataPage />}
          />
        ),
      },
      {
        path: "memberships",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<MembershipsManagementPage />}
          />
        ),
      },
      {
        path: "tickets",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<SupportTicketsPage />}
          />
        ),
      },
      {
        path: "modules",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<ModulesControlPage />}
          />
        ),
      },
      {
        path: "pending-requests",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<PendingRequestsPage />}
          />
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<PlatformSettingsPage />}
          />
        ),
      },
      {
        path: "alerts",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<AlertsPage />}
          />
        ),
      },
      {
        path: "maintenance",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<MaintenancePage />}
          />
        ),
      },
      // Applications Routes for Super Admin
      {
        path: "apps",
        children: [
          {
            path: "calendar",
            element: (
              <ProtectedRoute
                requiredRoles={["superadmin"]}
                element={<CalendarPage />}
              />
            ),
          },
          {
            path: "call",
            element: (
              <ProtectedRoute
                requiredRoles={["superadmin"]}
                element={<CallPage />}
              />
            ),
          },
          {
            path: "chat",
            element: (
              <ProtectedRoute
                requiredRoles={["superadmin"]}
                element={<ChatPage />}
              />
            ),
          },
          {
            path: "email",
            element: (
              <ProtectedRoute
                requiredRoles={["superadmin"]}
                element={<EmailPage />}
              />
            ),
          },
          {
            path: "file-manager",
            element: (
              <ProtectedRoute
                requiredRoles={["superadmin"]}
                element={<FileManagerPage />}
              />
            ),
          },
          {
            path: "notes",
            element: (
              <ProtectedRoute
                requiredRoles={["superadmin"]}
                element={<NotesPage />}
              />
            ),
          },
          {
            path: "todo",
            element: (
              <ProtectedRoute
                requiredRoles={["superadmin"]}
                element={<TodoPage />}
              />
            ),
          },
        ],
      },
      // Fallback route for unmatched paths
      {
        path: "*",
        element: (
          <ProtectedRoute
            requiredRoles={["superadmin"]}
            element={<SuperAdminDashboard />}
          />
        ),
      },
    ],
  },

  // Institution Layout Routes — auth guard is in InstitutionLayout, no per-route ProtectedRoute needed
  {
    path: "/institution",
    element: <InstitutionLayout />,
    children: [
      { index: true, element: <InstitutionDashboard /> },
      { path: "dashboard", element: <InstitutionDashboard /> },
      { path: "analytics", element: <InstituteAnalyticsDashboardPage /> },
      { path: "finance", element: <InstituteFinanceDashboardPage /> },
      { path: "subscription", element: <SubscriptionPage /> },
      { path: "overview/teaching", element: <TeachersOverviewPage /> },
      { path: "overview/students", element: <StudentsOverviewPage /> },
      { path: "overview/parents", element: <ParentsOverviewPage /> },
      // User Management
      { path: "pending-requests", element: <InstitutionPendingRequestsPage /> },
      {
        path: "create-credentials",
        element: <InstitutionCreateCredentialsPage />,
      },
      { path: "users", element: <UserDirectoryPage /> },
      // Academic
      { path: "academic/classes", element: <ClassesPage /> },
      { path: "academic/sections", element: <ClassSectionPage /> },
      { path: "academic/subjects", element: <ClassSubjectPage /> },
      { path: "academic/syllabus", element: <ClassSyllabusPage /> },
      { path: "academic/classrooms", element: <ClassRoomPage /> },
      { path: "academic/class-routine", element: <ClassRoutinePage /> },
      { path: "academic/homework", element: <ClassHomeWorkPage /> },
      // Students
      { path: "students", element: <StudentListPage /> },
      { path: "students/add", element: <StudentAdd /> },
      { path: "students/promotion", element: <StudentPromotionPage /> },
      { path: "students/timetable", element: <StudentTimeTablePage /> },
      { path: "students/leaves", element: <StudentLeavesPage /> },
      { path: "students/fees", element: <StudentFeesPage /> },
      { path: "students/results", element: <StudentResultPage /> },
      { path: "students/library", element: <StudentLibraryPage /> },
      // Teachers
      { path: "teachers", element: <TeacherListPage /> },
      { path: "teachers/add", element: <TeacherAddPage /> },
      { path: "teachers/routine", element: <TeacherRoutinePage /> },
      { path: "teachers/leaves", element: <TeacherLeavesPage /> },
      { path: "teachers/salary", element: <TeacherSalaryPage /> },
      { path: "teachers/library", element: <TeacherLibraryPage /> },
      // Parents & Guardians
      { path: "parents", element: <ParentListPage /> },
      { path: "parents/details", element: <ParentDetailsPage /> },
      { path: "guardians", element: <GuardianListPage /> },
      // Fees
      { path: "fees/collection", element: <CollectFeesPage /> },
      { path: "fees/groups", element: <FeesGroupPage /> },
      { path: "fees/types", element: <FeesTypePage /> },
      { path: "fees/masters", element: <FeesMasterPage /> },
      { path: "fees/assignment", element: <FeesAssignPage /> },
      { path: "fees/collect", element: <CollectFeesPage /> },
      // Library
      { path: "library/members", element: <LibraryMembersPage /> },
      { path: "library/books", element: <LibraryBooksPage /> },
      { path: "library/issue", element: <LibraryIssueBookPage /> },
      { path: "library/return", element: <LibraryReturnPage /> },
      // Sports
      { path: "sports", element: <SportsPage /> },
      // Transport
      { path: "transport/routes", element: <TransportRoutesPage /> },
      {
        path: "transport/pickup-points",
        element: <TransportPickupPointsPage />,
      },
      { path: "transport/vehicles", element: <TransportVehiclePage /> },
      { path: "transport/drivers", element: <TransportVehicleDriversPage /> },
      { path: "transport/assign", element: <TransportAssignVehiclePage /> },
      { path: "transport/reports", element: <TransportReportPage /> },
      // Hostel
      { path: "hostel", element: <HostelRoomsPage /> },
      { path: "hostel/rooms", element: <HostelRoomsPage /> },
      { path: "hostel/room-types", element: <HostelRoomTypesPage /> },
      { path: "hostel/reports", element: <HostelReportPage /> },
      { path: "hostel/hostels", element: <HostelRoomsPage /> },
      { path: "hostel/fees", element: <CollectFeesPage /> },
      { path: "hostel/payments", element: <CollectFeesPage /> },
      // Attendance
      { path: "attendance/students", element: <StudentAttendancePage /> },
      { path: "attendance/staff", element: <StaffAttendancePage /> },
      // Examinations
      { path: "exams", element: <ExamPage /> },
      { path: "exams/schedule", element: <ExamSchedulePage /> },
      { path: "exams/grades", element: <GradePage /> },
      { path: "exams/attendance", element: <ExamAttendancePage /> },
      { path: "exams/results", element: <ExamResultsPage /> },
      // hrM
      { path: "hrm/staffs", element: <StaffsPage /> },
      { path: "hrm/staffs/overview", element: <StaffOverviewPage /> },
      { path: "hrm/staffs/documents", element: <StaffDocumentsPage /> },
      { path: "hrm/departments", element: <DepartmentsPage /> },
      { path: "hrm/designations", element: <DesignationsPage /> },
      { path: "hrm/leaves", element: <LeavesPage /> },
      { path: "hrm/approvals", element: <ApprovalsPage /> },
      { path: "hrm/holidays", element: <HolidaysPage /> },
      { path: "hrm/payroll", element: <PayrollPage /> },
      // Finance & Accounts
      { path: "accounts/expenses", element: <ExpensesPage /> },
      {
        path: "accounts/expense-categories",
        element: <ExpensesCategoryPage />,
      },
      { path: "accounts/income", element: <IncomePage /> },
      { path: "accounts/invoices", element: <InvoicesPage /> },
      { path: "accounts/transactions", element: <TransactionsPage /> },
      // Announcements
      { path: "notice-board", element: <NoticeBoardPage /> },
      { path: "events", element: <EventsPage /> },
      // Reports
      { path: "reports/attendance", element: <AttendanceReportPage /> },
      { path: "reports/class", element: <ClassReportPage /> },
      { path: "reports/student", element: <StudentReportPage /> },
      { path: "reports/grade", element: <GradeReportPage /> },
      { path: "reports/leave", element: <LeaveReportPage /> },
      { path: "reports/fees", element: <FeesReportPage /> },
      // User Management (branches/roles)
      { path: "branches", element: <StudentsOverviewPage /> },
      { path: "all-users", element: <UserDirectoryPage /> },
      { path: "roles", element: <RolesPermissionsPage /> },
      { path: "delete-requests", element: <DeleteAccountPage /> },
      // Support
      { path: "support/tickets", element: <TicketsPage /> },
      // Applications
      { path: "apps/applications", element: <InstitutionDashboard /> },
      { path: "apps/calendar", element: <CalendarPage /> },
      { path: "apps/call", element: <CallPage /> },
      { path: "apps/chat", element: <ChatPage /> },
      { path: "apps/email", element: <EmailPage /> },
      { path: "apps/file-manager", element: <FileManagerPage /> },
      { path: "apps/notes", element: <NotesPage /> },
      { path: "apps/todo", element: <TodoPage /> },
      // Settings - Unified Institution Settings Page
      { path: "settings", element: <InstitutionSettingsPage /> },
      { path: "settings/modules", element: <InstitutionSettingsPage /> },
      { path: "settings/profile", element: <InstitutionSettingsPage /> },
      { path: "settings/security", element: <InstitutionSettingsPage /> },
      { path: "settings/notifications", element: <InstitutionSettingsPage /> },
      { path: "settings/company", element: <InstitutionSettingsPage /> },
      { path: "settings/localization", element: <InstitutionSettingsPage /> },
      { path: "settings/email", element: <InstitutionSettingsPage /> },
      { path: "settings/sms", element: <InstitutionSettingsPage /> },
      { path: "settings/payment", element: <InstitutionSettingsPage /> },
      { path: "settings/tax", element: <InstitutionSettingsPage /> },
      { path: "settings/school", element: <InstitutionSettingsPage /> },
      { path: "settings/storage", element: <InstitutionSettingsPage /> },
      { path: "parents/:id", element: <ParentDetailsPage /> },
    ],
  },

  // Agent Routes (Standalone - at root level)
  {
    path: "/agent",
    element: (
      <ProtectedRoute
        requiredRoles={["agent", "agent"]}
        element={<AgentLayout />}
      />
    ),
    children: [
      {
        index: true,
        element: <AgentDashboard />,
      },
      {
        path: "institutions",
        element: <AgentInstitutionsPage />,
      },
      {
        path: "institutions/:id",
        element: <AgentInstitutionDetailsPage />,
      },
      {
        path: "institutions/:id/edit",
        element: <AgentInstitutionEditPage />,
      },
      {
        path: "institutions/add",
        element: <AgentAddInstitutionPage />,
      },
      {
        path: "add-institution",
        element: <AgentAddInstitutionPage />,
      },
      {
        path: "commissions",
        element: <AgentCommissionsPage />,
      },
      {
        path: "performance",
        element: <AgentPerformancePage />,
      },
      {
        path: "profile",
        element: <AgentProfilePage />,
      },
      {
        path: "settings",
        element: <AgentSettingsPage />,
      },
      {
        path: "applications/chat",
        element: <ChatPage />,
      },
      {
        path: "applications/call",
        element: <CallPage />,
      },
      {
        path: "applications/calendar",
        element: <CalendarPage />,
      },
      {
        path: "applications/notes",
        element: <NotesPage />,
      },
      {
        path: "applications/email",
        element: <EmailPage />,
      },
      {
        path: "applications/file-manager",
        element: <FileManagerPage />,
      },
      {
        path: "applications/todo",
        element: <TodoPage />,
      },
    ],
  },

  // Transport Layout Routes (standalone)
  {
    path: "/transport",
    element: (
      <ProtectedRoute
        requiredRoles={["transportmanager", "transport_manager"]}
        element={<TransportLayout />}
      />
    ),
    children: [
      { index: true, element: <TransportManagerDashboardPage /> },
      { path: "routes", element: <TransportRoutesPage /> },
      { path: "vehicles", element: <TransportVehiclePage /> },
      { path: "drivers", element: <TransportVehicleDriversPage /> },
      { path: "pickup-points", element: <TransportPickupPointsPage /> },
      { path: "assign", element: <TransportAssignVehiclePage /> },
      { path: "reports", element: <TransportReportPage /> },
    ],
  },

  // Transport Routes — for transport_manager (MainLayout via /dashboard) + principal fallback
  {
    path: "/transport",
    element: (
      <ProtectedRoute
        requiredRoles={["principal", "transport_manager", "transportmanager"]}
        element={<InstitutionLayout />}
      />
    ),
    children: [
      { index: true, element: <TransportManagerDashboardPage /> },
      { path: "routes", element: <TransportRoutesPage /> },
      { path: "pickup-points", element: <TransportPickupPointsPage /> },
      { path: "vehicles", element: <TransportVehiclePage /> },
      { path: "drivers", element: <TransportVehicleDriversPage /> },
      { path: "assign", element: <TransportAssignVehiclePage /> },
      { path: "reports", element: <TransportReportPage /> },
    ],
  },

  // Hostel Layout Routes (standalone)
  {
    path: "/hostel",
    element: (
      <ProtectedRoute
        requiredRoles={["hostelwarden", "hostel_warden", "principal"]}
        element={<InstitutionLayout />}
      />
    ),
    children: [
      { index: true, element: <HostelRoomsPage /> },
      { path: "rooms", element: <HostelRoomsPage /> },
      { path: "room-types", element: <HostelRoomTypesPage /> },
      { path: "reports", element: <HostelReportPage /> },
    ],
  },

  // Fees Layout Routes (standalone)
  {
    path: "/fees",
    element: (
      <ProtectedRoute
        requiredRoles={["accountant", "principal", "admin"]}
        element={<InstitutionLayout />}
      />
    ),
    children: [
      { index: true, element: <CollectFeesPage /> },
      { path: "collection", element: <CollectFeesPage /> },
      { path: "groups", element: <FeesGroupPage /> },
      { path: "types", element: <FeesTypePage /> },
      { path: "masters", element: <FeesMasterPage /> },
      { path: "assignment", element: <FeesAssignPage /> },
      { path: "reports", element: <FeesReportPage /> },
    ],
  },

  // Institution Layout Routes — auth guard is in InstitutionLayout, no per-route ProtectedRoute needed
  {
    path: "/dashboard",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute
            requiredRoles={[
              "institutionowner",
              "institutionowner",
              "institutionowner",
              "institutionadmin",
              "institutionadmin",
              "admin",
              "admin",
            ]}
            element={<RoleBasedDashboardRedirect />}
          />
        ),
      },
      {
        path: "main",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "institutionowner",
              "institution_admin",
              "institutionadmin",
              "admin",
            ]}
            element={<InstitutionDashboard />}
          />
        ),
      },
      // Principal routes - inherits MainLayout from parent /dashboard
      {
        path: "principal",
        element: (
          <ProtectedRoute
            requiredRoles={["principal", "principal"]}
            element={<Outlet />}
          />
        ),
        children: [
          { index: true, element: <PrincipalDashboard /> },
          // MAIN
          { path: "analytics", element: <PrincipalAnalyticsPage /> },
          { path: "finance", element: <FinancePage /> },
          { path: "teaching-overview", element: <TeachersOverviewPage /> },
          { path: "student-overview", element: <StudentsOverviewPage /> },
          { path: "student-overview", element: <StudentsOverviewPage /> },
          // ACADEMIC
          { path: "classes", element: <ClassesPage /> },
          { path: "sections", element: <ClassSectionPage /> },
          { path: "subjects", element: <ClassSubjectPage /> },
          { path: "classroom", element: <ClassRoomPage /> },
          { path: "homework", element: <ClassHomeWorkPage /> },
          // PEOPLES
          { path: "students", element: <StudentListPage /> },
          { path: "students/add", element: <StudentAdd /> },
          { path: "teachers", element: <TeacherListPage /> },
          { path: "parents", element: <ParentsOverviewPage /> },
          // FEES
          { path: "fees-collection", element: <CollectFeesPage /> },
          { path: "fees-report", element: <FeesReportPage /> },
          // TRANSPORT MANAGEMENT
          {
            path: "transport/analytics",
            element: <InstituteAnalyticsDashboardPage />,
          },
          { path: "transport/revenue", element: <FinancePage /> },
          // ATTENDANCE
          { path: "attendance/student", element: <AdminAttendancePage /> },
          { path: "attendance/staff", element: <StaffAttendancePage /> },
          // LIBRARY
          { path: "library", element: <AdminLibraryPage /> },
          { path: "library/members", element: <AdminLibraryMembersPage /> },
          // TRANSPORT
          { path: "transport/routes", element: <TransportRoutesPage /> },
          {
            path: "transport/pickup-points",
            element: <TransportPickupPointsPage />,
          },
          { path: "transport/vehicles", element: <TransportVehiclePage /> },
          {
            path: "transport/drivers",
            element: <TransportVehicleDriversPage />,
          },
          { path: "transport/assign", element: <TransportAssignVehiclePage /> },
          { path: "transport/reports", element: <TransportReportPage /> },
          // HOSTEL
          { path: "hostel/rooms", element: <HostelRoomsPage /> },
          { path: "hostel/room-types", element: <HostelRoomTypesPage /> },
          { path: "hostel/reports", element: <HostelReportPage /> },
          // NOTICE & EVENTS
          { path: "notice-board", element: <NoticeBoardPage /> },
          { path: "events", element: <EventsPage /> },
          // SETTINGS (rendered inside MainLayout for principal)
          { path: "settings", element: <ProfileSettingsPage /> },
          { path: "settings/profile", element: <ProfileSettingsPage /> },
          { path: "settings/security", element: <SecuritySettingsPage /> },
          {
            path: "settings/notifications",
            element: <NotificationsSettingsPage />,
          },
        ],
      },
      // Teacher routes - inherits MainLayout from parent /dashboard
      {
        path: "teacher",
        element: (
          <ProtectedRoute
            requiredRoles={["teacher", "teacher"]}
            element={<Outlet />}
          />
        ),
        children: [
          { index: true, element: <TeacherDashboardPage /> },
          { path: "classes", element: <ClassesPage /> },
          { path: "subjects", element: <ClassSubjectPage /> },
          { path: "syllabus", element: <ClassSyllabusPage /> },
          { path: "classrooms", element: <ClassRoomPage /> },
          { path: "class-routine", element: <ClassRoutinePage /> },
          { path: "timetable", element: <ClassTimeTablePage /> },
          { path: "homework", element: <ClassHomeWorkPage /> },
          { path: "students", element: <StudentListPage /> },
          { path: "attendance", element: <AdminAttendancePage /> },
          { path: "exams", element: <AdminExaminationsPage /> },
          { path: "grades", element: <GradePage /> },
          { path: "salary", element: <TeacherSalaryPage /> },
          { path: "library", element: <TeacherLibraryPage /> },
        ],
      },
      // Student routes - inherits MainLayout from parent /dashboard
      {
        path: "student",
        element: (
          <ProtectedRoute
            requiredRoles={["student", "student"]}
            element={<Outlet />}
          />
        ),
        children: [
          { index: true, element: <StudentDashboardPage /> },
          { path: "subjects", element: <ClassSubjectPage /> },
          { path: "timetable", element: <ClassTimeTablePage /> },
          { path: "homework", element: <ClassHomeWorkPage /> },
          { path: "syllabus", element: <ClassSyllabusPage /> },
          { path: "leaves", element: <StudentLeavesPage /> },
          { path: "library", element: <StudentLibraryPage /> },
          { path: "attendance", element: <StudentAttendancePage /> },
          { path: "exams/schedule", element: <ExamSchedulePage /> },
          { path: "exams/results", element: <ExamResultsPage /> },
          { path: "fees", element: <StudentFeesPage /> },
        ],
      },
      // Parent routes - inherits MainLayout from parent /dashboard
      {
        path: "parent",
        element: (
          <ProtectedRoute
            requiredRoles={["parent", "parent"]}
            element={<Outlet />}
          />
        ),
        children: [
          { index: true, element: <ParentDashboardPage /> },
          { path: "attendance", element: <StudentAttendancePage /> },
          { path: "homework", element: <ClassHomeWorkPage /> },
          { path: "exams/results", element: <ExamResultsPage /> },
          { path: "fees", element: <StudentFeesPage /> },
          { path: "messages", element: <ChatPage /> },
        ],
      },
      // Staff and other single-role routes below
      {
        path: "staff",
        element: (
          <ProtectedRoute
            requiredRoles={["staff", "staff_member"]}
            element={<MainLayout />}
          />
        ),
        children: [
          { index: true, element: <StaffDashboardPage /> },
          { path: "dashboard", element: <StaffDashboardPage /> },
          { path: "attendance", element: <StaffAttendancePage /> },
          { path: "attendance-report", element: <AttendanceReportPage /> },
          { path: "profile", element: <StaffProfilePage /> },
          { path: "documents", element: <StaffDocumentsPage /> },
          { path: "tasks", element: <TasksPage /> },
          { path: "leave", element: <LeavePage /> },
        ],
      },
      {
        path: "accountant",
        element: (
          <ProtectedRoute
            requiredRoles={["accountant", "accountant"]}
            element={<MainLayout />}
          />
        ),
        children: [
          { index: true, element: <AccountantDashboardPage /> },
          { path: "fee-collection", element: <FeeCollectionPage /> },
          { path: "fees-collection", element: <AccountantDashboardPage /> },
          { path: "fees-groups", element: <FeesGroupPage /> },
          { path: "fees-master", element: <FeesMasterPage /> },
          { path: "fees-type", element: <FeesTypePage /> },
          { path: "collect-fees", element: <CollectFeesPage /> },
          { path: "fees-assign", element: <FeesAssignPage /> },
          { path: "transactions", element: <TransactionsPage /> },
          { path: "invoices", element: <InvoicesPage /> },
          { path: "expenses", element: <ExpensesPage /> },
          { path: "income", element: <IncomePage /> },
        ],
      },
      {
        path: "librarian",
        element: (
          <ProtectedRoute
            requiredRoles={["librarian", "librarian"]}
            element={<MainLayout />}
          />
        ),
        children: [{ index: true, element: <LibrarianDashboardPage /> }],
      },
      {
        path: "institute-admin",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "institutionowner",
              "institution_admin",
              "institutionadmin",
              "admin",
            ]}
            element={<InstitutionDashboard />}
          />
        ),
      },
      {
        path: "analytics",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "institutionowner",
              "institution_admin",
              "institutionadmin",
              "admin",
            ]}
            element={<InstituteAnalyticsDashboardPage />}
          />
        ),
      },
      {
        path: "finance",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "institutionowner",
              "institution_admin",
              "institutionadmin",
              "admin",
            ]}
            element={<FinancePage />}
          />
        ),
      },
      {
        path: "subscription",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "institutionowner",
              "institution_admin",
              "institutionadmin",
              "admin",
            ]}
            element={<SubscriptionPage />}
          />
        ),
      },
      {
        path: "overview/students",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "institutionowner",
              "institutionowner",
              "institutionowner",
              "institutionadmin",
              "institutionadmin",
              "admin",
              "admin",
            ]}
            element={<StudentsOverviewPage />}
          />
        ),
      },
      {
        path: "overview/teachers",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "institutionowner",
              "institutionowner",
              "institutionowner",
              "institutionadmin",
              "institutionadmin",
              "admin",
              "admin",
            ]}
            element={<TeachersOverviewPage />}
          />
        ),
      },
      {
        path: "overview/parents",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "institutionowner",
              "institutionowner",
              "institutionowner",
              "institutionadmin",
              "institutionadmin",
              "admin",
              "admin",
            ]}
            element={<ParentsOverviewPage />}
          />
        ),
      },
      // Shared routes - nested under MainLayout for teachers/students/parents/staff
      {
        path: "notice-board",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "teacher",
              "teacher",
              "student",
              "student",
              "parent",
              "parent",
              "staff",
              "staff_member",
            ]}
            element={<MainLayout />}
          />
        ),
        children: [{ index: true, element: <NoticeBoardPage /> }],
      },
      {
        path: "events",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "teacher",
              "teacher",
              "student",
              "student",
              "parent",
              "parent",
              "staff",
              "staff_member",
            ]}
            element={<MainLayout />}
          />
        ),
        children: [{ index: true, element: <EventsPage /> }],
      },
      {
        path: "reports/attendance",
        element: (
          <ProtectedRoute
            requiredRoles={["teacher", "teacher", "admin", "admin"]}
            element={<MainLayout />}
          />
        ),
        children: [{ index: true, element: <AttendanceReportPage /> }],
      },
      {
        path: "reports/grade",
        element: (
          <ProtectedRoute
            requiredRoles={["teacher", "teacher", "admin", "admin"]}
            element={<MainLayout />}
          />
        ),
        children: [{ index: true, element: <GradeReportPage /> }],
      },
      // Application Routes Section
      {
        path: "applications",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute
                requiredRoles={[
                  "SUPER_admin",
                  "institutionadmin",
                  "admin",
                  "teacher",
                  "student",
                  "parent",
                  "staff",
                  "principal",
                  "accountant",
                  "hr",
                  "librarian",
                  "transportmanager",
                  "hostelwarden",
                  "agent",
                ]}
                element={<CalendarPage />}
              />
            ),
          },
          {
            path: "calendar",
            element: (
              <ProtectedRoute
                requiredRoles={[
                  "SUPER_admin",
                  "institutionadmin",
                  "admin",
                  "teacher",
                  "student",
                  "parent",
                  "staff",
                  "principal",
                  "accountant",
                  "hr",
                  "librarian",
                  "transportmanager",
                  "hostelwarden",
                  "agent",
                ]}
                element={<CalendarPage />}
              />
            ),
          },
          {
            path: "call",
            element: (
              <ProtectedRoute
                requiredRoles={[
                  "SUPER_admin",
                  "institutionadmin",
                  "admin",
                  "teacher",
                  "student",
                  "parent",
                  "staff",
                  "principal",
                  "accountant",
                  "hr",
                  "librarian",
                  "transportmanager",
                  "hostelwarden",
                  "agent",
                ]}
                element={<CallPage />}
              />
            ),
          },
          {
            path: "chat",
            element: (
              <ProtectedRoute
                requiredRoles={[
                  "SUPER_admin",
                  "institutionadmin",
                  "admin",
                  "teacher",
                  "student",
                  "parent",
                  "staff",
                  "principal",
                  "accountant",
                  "hr",
                  "librarian",
                  "transportmanager",
                  "hostelwarden",
                  "agent",
                ]}
                element={<ChatPage />}
              />
            ),
          },
          {
            path: "email",
            element: (
              <ProtectedRoute
                requiredRoles={[
                  "SUPER_admin",
                  "institutionadmin",
                  "admin",
                  "teacher",
                  "student",
                  "parent",
                  "staff",
                  "principal",
                  "accountant",
                  "hr",
                  "librarian",
                  "transportmanager",
                  "hostelwarden",
                  "agent",
                ]}
                element={<EmailPage />}
              />
            ),
          },
          {
            path: "file-manager",
            element: (
              <ProtectedRoute
                requiredRoles={[
                  "SUPER_admin",
                  "institutionadmin",
                  "admin",
                  "teacher",
                  "student",
                  "parent",
                  "staff",
                  "principal",
                  "accountant",
                  "hr",
                  "librarian",
                  "transportmanager",
                  "hostelwarden",
                  "agent",
                ]}
                element={<FileManagerPage />}
              />
            ),
          },
          {
            path: "notes",
            element: (
              <ProtectedRoute
                requiredRoles={[
                  "SUPER_admin",
                  "institutionadmin",
                  "admin",
                  "teacher",
                  "student",
                  "parent",
                  "staff",
                  "principal",
                  "accountant",
                  "hr",
                  "librarian",
                  "transportmanager",
                  "hostelwarden",
                  "agent",
                ]}
                element={<NotesPage />}
              />
            ),
          },
          {
            path: "todo",
            element: (
              <ProtectedRoute
                requiredRoles={[
                  "SUPER_admin",
                  "institutionadmin",
                  "admin",
                  "teacher",
                  "student",
                  "parent",
                  "staff",
                  "principal",
                  "accountant",
                  "hr",
                  "librarian",
                  "transportmanager",
                  "hostelwarden",
                  "agent",
                ]}
                element={<TodoPage />}
              />
            ),
          },
        ],
      },
      {
        path: "user-management",
        children: [
          {
            path: "directory",
            element: (
              <ProtectedRoute
                requiredRoles={["institutionadmin", "institutionadmin"]}
                element={<UserDirectoryPage />}
              />
            ),
          },
          {
            path: "create-credentials",
            element: (
              <ProtectedRoute
                requiredRoles={["institutionadmin", "institutionadmin"]}
                element={<CreateCredentialsPage />}
              />
            ),
          },
        ],
      },
    ],
  },

  // hr Routes (MainLayout)
  {
    path: "/dashboard/hr",
    element: (
      <ProtectedRoute requiredRoles={["hr", "hr"]} element={<MainLayout />} />
    ),
    children: [{ index: true, element: <StaffDashboardPage /> }],
  },

  // Root level hr routes
  {
    path: "/staffs",
    element: (
      <ProtectedRoute requiredRoles={["hr", "hr"]} element={<MainLayout />} />
    ),
    children: [
      { index: true, element: <StaffsPage /> },
      { path: "documents", element: <StaffsPage /> },
    ],
  },
  {
    path: "/departments",
    element: (
      <ProtectedRoute requiredRoles={["hr", "hr"]} element={<MainLayout />} />
    ),
    children: [{ index: true, element: <DepartmentsPage /> }],
  },
  {
    path: "/designations",
    element: (
      <ProtectedRoute requiredRoles={["hr", "hr"]} element={<MainLayout />} />
    ),
    children: [{ index: true, element: <DesignationsPage /> }],
  },
  {
    path: "/staff-leaves",
    element: (
      <ProtectedRoute requiredRoles={["hr", "hr"]} element={<MainLayout />} />
    ),
    children: [{ index: true, element: <LeavesPage /> }],
  },
  {
    path: "/approvals",
    element: (
      <ProtectedRoute requiredRoles={["hr", "hr"]} element={<MainLayout />} />
    ),
    children: [{ index: true, element: <ApprovalsPage /> }],
  },
  {
    path: "/holidays",
    element: (
      <ProtectedRoute requiredRoles={["hr", "hr"]} element={<MainLayout />} />
    ),
    children: [{ index: true, element: <HolidaysPage /> }],
  },
  {
    path: "/payroll",
    element: (
      <ProtectedRoute requiredRoles={["hr", "hr"]} element={<MainLayout />} />
    ),
    children: [{ index: true, element: <PayrollPage /> }],
  },

  // Accountant Routes
  {
    path: "accountant",
    element: (
      <ProtectedRoute
        requiredRoles={["accountant", "accountant"]}
        element={<MainLayout />}
      />
    ),
    children: [
      { index: true, element: <AccountantDashboardPage /> },
      { path: "fees-collection", element: <AccountantDashboardPage /> },
      { path: "fees-groups", element: <FeesGroupPage /> },
      { path: "fees-master", element: <FeesMasterPage /> },
      { path: "fees-type", element: <FeesTypePage /> },
      { path: "collect-fees", element: <CollectFeesPage /> },
      { path: "fees-assign", element: <FeesAssignPage /> },
      { path: "transactions", element: <TransactionsPage /> },
      { path: "invoices", element: <InvoicesPage /> },
      { path: "expenses", element: <ExpensesPage /> },
      { path: "income", element: <IncomePage /> },
    ],
  },
  {
    path: "/accounts",
    element: (
      <ProtectedRoute
        requiredRoles={["accountant", "accountant"]}
        element={<MainLayout />}
      />
    ),
    children: [
      { path: "expenses", element: <ExpensesPage /> },
      { path: "expense-categories", element: <ExpensesCategoryPage /> },
      { path: "income", element: <IncomePage /> },
      { path: "invoices", element: <InvoicesPage /> },
      { path: "transactions", element: <TransactionsPage /> },
    ],
  },

  // Student Root Routes
  {
    path: "/class-subject",
    element: (
      <ProtectedRoute
        requiredRoles={["student", "student"]}
        element={<MainLayout />}
      />
    ),
    children: [{ index: true, element: <ClassSubjectPage /> }],
  },
  {
    path: "/class-timetable",
    element: (
      <ProtectedRoute
        requiredRoles={["student", "student"]}
        element={<MainLayout />}
      />
    ),
    children: [{ index: true, element: <ClassTimeTablePage /> }],
  },
  {
    path: "/exam-results",
    element: (
      <ProtectedRoute
        requiredRoles={["student", "student", "parent", "parent"]}
        element={<MainLayout />}
      />
    ),
    children: [{ index: true, element: <ExamResultsPage /> }],
  },
  {
    path: "/exam-schedule",
    element: (
      <ProtectedRoute
        requiredRoles={["student", "student"]}
        element={<MainLayout />}
      />
    ),
    children: [{ index: true, element: <ExamSchedulePage /> }],
  },
  {
    path: "/homework",
    element: (
      <ProtectedRoute
        requiredRoles={["student", "student", "parent", "parent"]}
        element={<MainLayout />}
      />
    ),
    children: [{ index: true, element: <ClassHomeWorkPage /> }],
  },
  {
    path: "/syllabus",
    element: (
      <ProtectedRoute
        requiredRoles={["student", "student"]}
        element={<MainLayout />}
      />
    ),
    children: [{ index: true, element: <ClassSyllabusPage /> }],
  },
  {
    path: "/students",
    element: (
      <ProtectedRoute
        requiredRoles={["student", "student"]}
        element={<MainLayout />}
      />
    ),
    children: [
      { path: "timetable", element: <ClassTimeTablePage /> },
      { path: "leaves", element: <StudentLeavesPage /> },
      { path: "library", element: <StudentLibraryPage /> },
      { path: "fees", element: <StudentFeesPage /> },
    ],
  },
  {
    path: "/attendance",
    element: (
      <ProtectedRoute
        requiredRoles={["student", "student", "parent", "parent", "hr", "hr"]}
        element={<MainLayout />}
      />
    ),
    children: [
      { path: "student", element: <StudentAttendancePage /> },
      { path: "staff", element: <StaffAttendancePage /> },
    ],
  },
  {
    path: "/messages",
    element: (
      <ProtectedRoute
        requiredRoles={[
          "parent",
          "parent",
          "teacher",
          "teacher",
          "staff",
          "staff_member",
        ]}
        element={<MainLayout />}
      />
    ),
    children: [{ index: true, element: <MessagesPage /> }],
  },
  {
    path: "/reports",
    element: (
      <ProtectedRoute
        requiredRoles={[
          "teacher",
          "teacher",
          "hr",
          "hr",
          "accountant",
          "accountant",
        ]}
        element={<MainLayout />}
      />
    ),
    children: [
      { path: "attendance", element: <AttendanceReportPage /> },
      { path: "grade", element: <GradeReportPage /> },
      { path: "fees", element: <FeesReportPage /> },
    ],
  },

  // Global Routes for All Users
  {
    path: "/notice-board",
    element: (
      <ProtectedRoute
        requiredRoles={[
          "teacher",
          "teacher",
          "student",
          "student",
          "parent",
          "parent",
          "staff",
          "staff_member",
        ]}
        element={<MainLayout />}
      />
    ),
    children: [{ index: true, element: <NoticeBoardPage /> }],
  },
  {
    path: "/events",
    element: (
      <ProtectedRoute
        requiredRoles={[
          "teacher",
          "teacher",
          "student",
          "student",
          "parent",
          "parent",
          "staff",
          "staff_member",
        ]}
        element={<MainLayout />}
      />
    ),
    children: [{ index: true, element: <EventsPage /> }],
  },

  // Admin Routes (SEPARATE LAYOUT WITH SIDEBAR)
  {
    path: "/dashboard/admin",
    element: (
      <ProtectedRoute
        requiredRoles={[
          "admin",
          "institutionowner",
          "institutionadmin",
          "superadmin",
        ]}
        element={<AdminLayout />}
      />
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: "analytics",
        element: <InstituteAnalyticsDashboardPage />,
      },
      {
        path: "finance",
        element: <FinancePage />,
      },
      {
        path: "students",
        element: <AdminStudentManagementPage />,
      },
      {
        path: "students/list",
        element: <AdminStudentManagementPage />,
      },
      {
        path: "students/add",
        element: <AdminAddStudentPage />,
      },
      {
        path: "teachers",
        element: <AdminTeacherManagementPage />,
      },
      {
        path: "teachers/add",
        element: <AdminTeacherManagementPage />,
      },
      {
        path: "teachers/list",
        element: <AdminTeacherManagementPage />,
      },
      {
        path: "parents",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<ParentsOverviewPage />}
          />
        ),
      },
      {
        path: "fees",
        element: <AdminFeesPage />,
        children: [
          {
            path: "collect",
            element: <CollectFeesPage />,
          },
        ],
      },
      {
        path: "academic",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "institution_owner",
              "institutionadmin",
              "admin",
              "teacher",
              "principal",
              "student",
              "parent",
            ]}
            element={<AdminAcademicPage />}
          />
        ),
      },
      {
        path: "attendance",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminAttendancePage />}
          />
        ),
      },
      {
        path: "examinations",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminExaminationsPage />}
          />
        ),
      },
      {
        path: "library",
        element: <AdminLibraryPage />,
      },
      {
        path: "reports",
        element: <AdminReportsPage />,
      },
      {
        path: "attendance-report",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminAttendanceReportPage />}
          />
        ),
      },
      {
        path: "student-report",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminStudentReportPage />}
          />
        ),
      },
      {
        path: "grade-report",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminGradeReportPage />}
          />
        ),
      },
      {
        path: "fees-report",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminFeesReportPage />}
          />
        ),
      },
      {
        path: "notice-board",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "admin",
              "institutionowner",
              "institutionadmin",
              "staff",
              "staff_member",
            ]}
            element={<NoticeBoardPage />}
          />
        ),
      },
      {
        path: "events",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "admin",
              "institutionowner",
              "institutionadmin",
              "staff",
              "staff_member",
            ]}
            element={<EventsPage />}
          />
        ),
      },
      {
        path: "student-attendance",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminStudentAttendancePage />}
          />
        ),
      },
      {
        path: "teacher-attendance",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminTeacherAttendancePage />}
          />
        ),
      },
      {
        path: "library-members",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminLibraryMembersPage />}
          />
        ),
      },
      {
        path: "library-books",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminLibraryBooksPage />}
          />
        ),
      },
      {
        path: "sports",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminSportsPage />}
          />
        ),
      },
      {
        path: "exam",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminExamPage />}
          />
        ),
      },
      {
        path: "exam-schedule",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminExamSchedulePage />}
          />
        ),
      },
      {
        path: "grades",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminGradesPage />}
          />
        ),
      },
      {
        path: "results",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminResultsPage />}
          />
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminProfileSettingsPage />}
          />
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminProfileSettingsPage />}
          />
        ),
      },
      {
        path: "notifications",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminNotificationsPage />}
          />
        ),
      },
      {
        path: "school-settings",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminSchoolSettingsPage />}
          />
        ),
      },
      {
        path: "user-management",
        element: <AdminUserDirectoryPage />,
      },
      {
        path: "pending-requests",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminPendingRequestsPage />}
          />
        ),
      },
      {
        path: "create-credentials",
        element: <AdminCreateCredentialsPage />,
      },
      {
        path: "classes",
        element: <AdminAcademicPage />,
      },
      {
        path: "promotions",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminExaminationsPage />}
          />
        ),
      },
      {
        path: "library/members",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminLibraryMembersPage />}
          />
        ),
      },
      {
        path: "library/books",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<AdminLibraryBooksPage />}
          />
        ),
      },
      {
        path: "transport",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<TransportRoutesPage />}
          />
        ),
      },
      {
        path: "transport/vehicles",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<TransportVehiclePage />}
          />
        ),
      },
      {
        path: "transport/drivers",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<TransportVehicleDriversPage />}
          />
        ),
      },
      {
        path: "transport/pickup-points",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<TransportPickupPointsPage />}
          />
        ),
      },
      {
        path: "transport/assign",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<TransportAssignVehiclePage />}
          />
        ),
      },
      {
        path: "transport/reports",
        element: (
          <ProtectedRoute
            requiredRoles={["admin", "institutionowner", "institutionadmin"]}
            element={<TransportReportPage />}
          />
        ),
      },
      // Academic routes
      {
        path: "classes",
        element: <ClassesPage />,
      },
      {
        path: "sections",
        element: <ClassesPage />,
      },
      {
        path: "subjects",
        element: <ClassSubjectPage />,
      },
      {
        path: "classrooms",
        element: <ClassRoomPage />,
      },
      {
        path: "class-routine",
        element: <ScheduleClassesPage />,
      },
      {
        path: "homework",
        element: <ClassHomeWorkPage />,
      },
      {
        path: "exam-grades",
        element: <AdminGradesPage />,
      },
      {
        path: "upload-grades",
        element: <AdminGradesPage />,
      },
      // Fees routes
      {
        path: "fees/groups",
        element: <AdminFeesPage />,
      },
      {
        path: "fees/types",
        element: <AdminFeesPage />,
      },
      {
        path: "fees/masters",
        element: <AdminFeesPage />,
      },
      {
        path: "fees/collect",
        element: <AdminFeesPage />,
      },
      {
        path: "fees/assignment",
        element: <AdminFeesPage />,
      },
      {
        path: "homework",
        element: <AdminAcademicPage />,
      },
    ],
  },

  // Catch all route for 404
  {
    path: "*",
    element: (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "4rem", margin: "0", color: "#6366f1" }}>404</h1>
        <h2 style={{ fontSize: "2rem", margin: "1rem 0", color: "#374151" }}>
          Page Not Found
        </h2>
        <p
          style={{ fontSize: "1.2rem", margin: "0 0 2rem 0", color: "#6b7280" }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/login"
          style={{
            display: "inline-block",
            padding: "0.75rem 2rem",
            backgroundColor: "#6366f1",
            color: "white",
            textDecoration: "none",
            borderRadius: "0.5rem",
            fontSize: "1rem",
            fontWeight: "500",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#4f46e5")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#6366f1")
          }
        >
          Go to Login
        </a>
        <p
          style={{
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            fontSize: "0.875rem",
            color: "#9ca3af",
          }}
        >
          Copyright © 2026 - Ultrakey
        </p>
      </div>
    ),
  },
]);

export default router;
