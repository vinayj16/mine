import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

// Layout Components
import MainLayout from "../layouts/MainLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import InstitutionLayout from "../layouts/InstitutionLayout";
import AgentLayout from "../layouts/AgentLayout";
import AdminLayout from "../layouts/AdminLayout";
import TransportLayout from "../layouts/TransportLayout";
import RoleBasedDashboardRedirect from "../components/RoleBasedDashboardRedirect";
import UnderMaintenance from "../pages/Under Maintenance/UnderMaintenance";
import NotFoundPage from "../pages/NotFoundPage";

// Auth Pages
import LoginPage from "../pages/Authentication/Login/Login";
import RegisterPage from "../pages/Authentication/Login/Register/Register";
import ForgotPasswordPage from "../pages/Authentication/Login/ForgotPassword/ForgotPassword";
import PrivacyPolicyPage from "../pages/Authentication/PrivacyPolicyPage";
import TermsConditionsPage from "../pages/Authentication/TermsConditionsPage";

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
import ClassDetailPage from "../pages/academic/ClassDetailPage";
import ExamAttendancePage from "../pages/academic/ExamAttendancePage";
import ExamResultsPage from "../pages/academic/ExamResultsPage";

// Institution Student Pages
import StudentListPage from "../pages/students/StudentListPage";
import StudentAdd from "../pages/students/StudentAdd";
import StudentPromotionPage from "../pages/students/StudentPromotionPage";
import StudentLeavesPage from "../pages/students/StudentLeavesPage";
import StudentFeesPage from "../pages/students/StudentFeesPage";
import StudentLibraryPage from "../pages/students/StudentLibraryPage";

// Student Dashboard Pages
import StudentOwnTimeTablePage from "../pages/dashboard/Student/StudentOwnTimeTablePage";
import StudentOwnResultsPage from "../pages/dashboard/Student/StudentOwnResultsPage";
import StudentOwnGenericPage from "../pages/dashboard/Student/StudentOwnGenericPage";

// Institution Teacher Pages
import TeacherListPage from "../pages/teachers/TeacherListPage";
import TeacherAddPage from "../pages/teachers/TeacherAddPage";
import TeacherRoutinePage from "../pages/teachers/TeacherRoutinePage";
import TeacherDetailsPage from "../pages/teachers/TeacherDetailsPage";
import TeacherLeavesPage from "../pages/teachers/TeacherLeavesPage";
import TeacherSalaryPage from "../pages/teachers/TeacherSalaryPage";
import TeacherLibraryPage from "../pages/teachers/TeacherLibraryPage";
import TeacherTransportFeesPage from "../pages/teachers/TeacherTransportFeesPage";

// Parent Child View Pages
import StudentDetailsPage from "../pages/students/StudentDetailsPage";
import StudentTimeTablePage from "../pages/students/StudentTimeTablePage";
import StudentResultPage from "../pages/students/StudentResultPage";

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

// PTM Pages
import ParentPTMPage from "../pages/ptm/ParentPTMPage";
import TeacherPTMPage from "../pages/ptm/TeacherPTMPage";
import AdminPTMPage from "../pages/ptm/AdminPTMPage";

// Institution Hostel Pages
import HostelRoomsPage from "../pages/hostel/HostelRoomsPage";
import HostelRoomTypesPage from "../pages/hostel/HostelRoomTypesPage";
import HostelReportPage from "../pages/hostel/HostelReportPage";
import HostelListPage from "../pages/hostel/HostelListPage";
import FeesPage from "../pages/hostel/FeesPage";
import PaymentsPage from "../pages/hostel/PaymentsPage";

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
import TeacherAttendancePage from "../pages/attendance/TeacherAttendancePage";

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
import SalariesPage from "../pages/finance/SalariesPage";
import BudgetsPage from "../pages/finance/BudgetsPage";
import InventoryPage from "../pages/hr/InventoryPage";
import HREmailLogsPage from "../pages/hr/HREmailLogsPage";
import VehicleMaintenancePage from "../pages/transport/VehicleMaintenancePage";

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
import RolesPermissionsPage from "../pages/users/RolesPermissionsPage";
import DeleteAccountPage from "../pages/users/DeleteAccountPage";

// Institution Support
import TicketsPage from "../pages/support/TicketsPage";

// Admin Pages
import InstitutionSettingsPage from "../pages/dashboard/InstituteAdmin/InstitutionSettingsPage";
import InstitutionBrandingSettings from "../pages/dashboard/InstituteAdmin/InstitutionBrandingSettings";
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
import AdminStaffPage from "../pages/dashboard/Admin/AdminStaffPage";
import AdminPendingRequestsPage from "../pages/dashboard/Admin/AdminPendingRequestsPage";
import AdminCreateCredentialsPage from "../pages/dashboard/Admin/AdminCreateCredentialsPage";
import PrincipalAnalyticsPage from "../pages/dashboard/Principal/PrincipalAnalyticsPage";
import FinancePage from "../pages/dashboard/FinancePage";
// import StudentsOverviewPage from "../pages/overview/StudentsOverviewPage";
// import TeachersOverviewPage from "../pages/overview/TeachersOverviewPage";
import ParentsOverviewPage from "../pages/overview/ParentsOverviewPage";

// Teacher Pages
import TeacherDashboardPage from "../pages/dashboard/TeacherDashboardPage";

// Student Pages
import StudentDashboardPage from "../pages/dashboard/Student/StudentDashboard";

// Parent Pages
import ParentDashboardPage from "../pages/dashboard/Parent/ParentDashboardPage";
import ParentChildActivityPage from "../pages/dashboard/Parent/ParentChildActivityPage";

// Staff Pages
import StaffDashboardPage from "../pages/dashboard/Staff/StaffDashboard";
import StaffProfilePage from "../pages/staff/ProfilePage";
import TasksPage from "../pages/staff/TasksPage";
import LeavePage from "../pages/staff/LeavePage";
import StaffNotificationsPage from "../pages/staff/StaffNotificationsPage";
import MessagesPage from "../pages/communication/MessagesPage";

// Accountant Pages
import AccountantDashboardPage from "../pages/dashboard/Accountant/AccountantDashboardPage";
import AccountantFeesPage from "../pages/dashboard/Accountant/AccountantFeesPage";
import FeeCollectionPage from "../pages/dashboard/Accountant/FeeCollectionPage";

// Librarian Pages
import LibrarianDashboardPage from "../pages/dashboard/LibraryDashboardPage";
import HRDashboardPage from "../pages/dashboard/Hr/HRDashboardPage";
import HostelDashboardPage from "../pages/dashboard/HostelDashboardPage";

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
import ResultsListPage from "../pages/dashboard/Results/ResultsListPage";
import InactivityMonitor from "../components/common/InactivityMonitor";

// PTM Router - picks the right PTM component based on user role
import { useAuthStore } from "../store/authStore";

const PTMRouter = () => {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();
  if (role === "parent" || role === "guardian") return <ParentPTMPage />;
  if (role === "teacher") return <TeacherPTMPage />;
  if (role === "admin" || role === "institution_admin" || role === "institutionadmin" || role === "principal") return <AdminPTMPage />;
  return <Navigate to="/dashboard" replace />;
};

// Global Root Layout to handle cross-cutting concerns like inactivity monitoring
const RootLayout = () => {
  return (
    <>
      <InactivityMonitor />
      <Outlet />
    </>
  );
};

// Create finalized router
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // Root - Home Page
      {
        path: "/",
        element: <HomePage />,
      },
      // Generic Results Page
      {
        path: "dashboard/results",
        element: <ProtectedRoute requiredRoles={["principal", "admin", "institution_admin", "institutionadmin", "institutionowner"]} element={<MainLayout />} />,
        children: [
          { index: true, element: <ResultsListPage /> }
        ]
      },
      // Backwards-compatible redirect: support legacy `/transport` path
      {
        path: "transport",
        element: <Navigate to="/dashboard/transport" replace />,
      },
      // Backwards-compatible redirects for transport apps paths
      {
        path: "transport/apps",
        element: <Navigate to="/dashboard/transport/apps" replace />,
      },
      {
        path: "transport/apps/:app",
        element: <Navigate to="/dashboard/transport/apps/:app" replace />,
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
      {
        path: "/privacy",
        element: <PrivacyPolicyPage />,
      },
      {
        path: "/terms",
        element: <TermsConditionsPage />,
      },
      // PTM Route - role-based rendering
      {
        path: "/ptm",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "parent",
              "parent",
              "teacher",
              "teacher",
              "admin",
              "admin",
              "institution_admin",
              "institutionadmin",
              "principal",
            ]}
            element={<PTMRouter />}
          />
        ),
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
        element: <SuperAdminLayout/>,
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
            path: "profile",
            element: (
              <ProtectedRoute
                requiredRoles={["superadmin"]}
                element={<ProfileSettingsPage />}
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
          {
            path: "profile",
            element: (
              <ProtectedRoute requiredRoles={["superadmin"]} element={<ProfileSettingsPage />} />
            ),
          },
          {
            path: "settings",
            element: (
              <ProtectedRoute requiredRoles={["superadmin"]} element={<NotificationsSettingsPage />} />
            ),
          },
        ],
      },
      {
        path: "departments",
        element: (
          <ProtectedRoute requiredRoles={["hr", "hr_manager", "hrmanager"]} element={<MainLayout />} />
        ),
        children: [{ index: true, element: <DepartmentsPage /> }],
      },
      {
        path: "designations",
        element: (
          <ProtectedRoute requiredRoles={["hr", "hr_manager", "hrmanager"]} element={<MainLayout />} />
        ),
        children: [{ index: true, element: <DesignationsPage /> }],
      },
      {
        path: "staff-leaves",
        element: (
          <ProtectedRoute requiredRoles={["hr", "hr_manager", "hrmanager"]} element={<MainLayout />} />
        ),
        children: [{ index: true, element: <LeavesPage /> }],
      },
      {
        path: "approvals",
        element: (
          <ProtectedRoute requiredRoles={["hr", "hr_manager", "hrmanager"]} element={<MainLayout />} />
        ),
        children: [{ index: true, element: <ApprovalsPage /> }],
      },
      {
        path: "holidays",
        element: (
          <ProtectedRoute requiredRoles={["hr", "hr_manager", "hrmanager"]} element={<MainLayout />} />
        ),
        children: [{ index: true, element: <HolidaysPage /> }],
      },
      {
        path: "payroll",
        element: (
          <ProtectedRoute requiredRoles={["hr", "hr_manager", "hrmanager"]} element={<MainLayout />} />
        ),
        children: [{ index: true, element: <PayrollPage /> }],
      },

      {
        path: "accounts",
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
        path: "class-subject",
        element: (
          <ProtectedRoute
            requiredRoles={["student", "student"]}
            element={<MainLayout />}
          />
        ),
        children: [{ index: true, element: <ClassSubjectPage /> }],
      },
      {
        path: "class-timetable",
        element: (
          <ProtectedRoute
            requiredRoles={["student", "student"]}
            element={<MainLayout />}
          />
        ),
        children: [{ index: true, element: <ClassTimeTablePage /> }],
      },
      {
        path: "exam-results",
        element: (
          <ProtectedRoute
            requiredRoles={["student", "student", "parent", "parent"]}
            element={<MainLayout />}
          />
        ),
        children: [{ index: true, element: <ExamResultsPage /> }],
      },
      {
        path: "exam-schedule",
        element: (
          <ProtectedRoute
            requiredRoles={["student", "student"]}
            element={<MainLayout />}
          />
        ),
        children: [{ index: true, element: <ExamSchedulePage /> }],
      },
      {
        path: "homework",
        element: (
          <ProtectedRoute
            requiredRoles={["student", "student", "parent", "parent"]}
            element={<MainLayout />}
          />
        ),
        children: [{ index: true, element: <ClassHomeWorkPage /> }],
      },
      {
        path: "syllabus",
        element: (
          <ProtectedRoute
            requiredRoles={["student", "student"]}
            element={<MainLayout />}
          />
        ),
        children: [{ index: true, element: <ClassSyllabusPage /> }],
      },
      {
        path: "students",
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
        path: "attendance",
        element: (
          <ProtectedRoute
            requiredRoles={["student", "parent", "staff", "staff_member", "hr", "hr_manager", "hrmanager"]}
            element={<MainLayout />}
          />
        ),
        children: [
          { path: "student", element: <StudentAttendancePage /> },
          { path: "staff", element: <StaffAttendancePage /> },
        ],
      },
      {
        path: "messages",
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
        path: "reports",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "teacher",
              "hr",
              "hr_manager",
              "hrmanager",
              "accountant",
              "student",
              "parent",
              "staff",
              "staff_member",
              "librarian",
              "transportmanager",
              "transport_manager",
              "hostelwarden",
              "hostel_warden",
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

      // Applications nested dashboard routes (resolves 404 for sidebars)
      {
        path: "dashboard/applications",
        element: (
          <ProtectedRoute
            requiredRoles={[
              "superadmin",
              "institutionowner",
              "institution_owner",
              "institutionadmin",
              "institution_admin",
              "admin",
              "principal",
              "teacher",
              "student",
              "parent",
              "staff",
              "staff_member",
              "accountant",
              "hr",
              "hr_manager",
              "hrmanager",
              "librarian",
              "transportmanager",
              "transport_manager",
              "hostelwarden",
              "hostel_warden",
            ]}
            element={<MainLayout />}
          />
        ),
        children: [
          { path: "calendar", element: <CalendarPage /> },
          { path: "call", element: <CallPage /> },
          { path: "chat", element: <ChatPage /> },
          { path: "email", element: <EmailPage /> },
          { path: "file-manager", element: <FileManagerPage /> },
          { path: "notes", element: <NotesPage /> },
          { path: "todo", element: <TodoPage /> },
        ],
      },

      // Global Routes for All Users
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

      // Role-Based Dashboards
      {
        path: "dashboard",
        element: <RoleBasedDashboardRedirect />,
      },
      {
        path: "dashboard/teacher",
        element: <ProtectedRoute requiredRoles={["teacher"]} element={<MainLayout />} />,
        children: [
          { index: true, element: <TeacherDashboardPage /> },
          { path: "list", element: <TeacherListPage /> },
          { path: "add", element: <TeacherAddPage /> },
          { path: "routine", element: <TeacherRoutinePage /> },
          { path: "details", element: <TeacherDetailsPage /> },
          { path: "leaves", element: <TeacherLeavesPage /> },
          { path: "salary", element: <TeacherSalaryPage /> },
          { path: "library", element: <TeacherLibraryPage /> },
          { path: "classes", element: <ClassesPage /> },
          { path: "classes/:id", element: <ClassDetailPage /> },
          { path: "subjects", element: <ClassSubjectPage /> },
          { path: "syllabus", element: <ClassSyllabusPage /> },
          { path: "classrooms", element: <ClassRoomPage /> },
          { path: "class-routine", element: <ClassRoutinePage /> },
          { path: "timetable", element: <ClassTimeTablePage /> },
          { path: "homework", element: <ClassHomeWorkPage /> },
          { path: "students", element: <StudentListPage /> },
          { path: "students/add", element: <StudentAdd /> },
          { path: "attendance", element: <StudentAttendancePage /> },
          { path: "exams", element: <ExamPage /> },
          { path: "grades", element: <GradePage /> },
          { path: "transport-fees", element: <TeacherTransportFeesPage /> },
          { path: "profile", element: <StaffProfilePage /> },
          { path: "ptm", element: <TeacherPTMPage /> }
        ]
      },
      {
        path: "dashboard/student",
        element: <ProtectedRoute requiredRoles={["student"]} element={<MainLayout />} />,
        children: [
          { index: true, element: <StudentDashboardPage /> },
          { path: "list", element: <StudentListPage /> },
          { path: "add", element: <StudentAdd /> },
          { path: "promotions", element: <StudentPromotionPage /> },
          { path: "timetable", element: <StudentOwnTimeTablePage /> },
          { path: "results", element: <StudentOwnResultsPage /> },
          { path: "homework", element: <StudentOwnGenericPage /> },
          { path: "syllabus", element: <StudentOwnGenericPage /> },
          { path: "profile", element: <StudentOwnGenericPage /> },
          { path: "attendance", element: <StudentAttendancePage /> },
          { path: "fees", element: <StudentFeesPage /> },
          { path: "library", element: <StudentLibraryPage /> },
          { path: "exams", element: <StudentOwnGenericPage /> },
          { path: "grades", element: <StudentOwnGenericPage /> },
          { path: "transport", element: <StudentOwnGenericPage /> }
        ]
      },
      {
        path: "dashboard/parent",
        element: <ProtectedRoute requiredRoles={["parent", "guardian"]} element={<MainLayout />} />,
        children: [
          { index: true, element: <ParentDashboardPage /> },
          { path: "list", element: <ParentListPage /> },
          { path: "details/:id", element: <ParentDetailsPage /> },
          { path: "guardians", element: <GuardianListPage /> },
          { path: "ptm", element: <ParentPTMPage /> },
          { path: "profile", element: <ProfileSettingsPage /> },
          { path: "settings", element: <NotificationsSettingsPage /> },
          // Child selector pages (from sidebar) — MUST be before child/:id to match first
          { path: "child/:activity/select", element: <ParentChildActivityPage /> },
          // Parent child activity picker pages
          { path: "activity/:activity", element: <ParentChildActivityPage /> },
          // Child list overview
          { path: "children", element: <ParentDashboardPage /> },
          // Child-specific views for parents
          { path: "child/:id", element: <StudentDetailsPage /> },
          { path: "child/:id/timetable", element: <StudentTimeTablePage /> },
          { path: "child/:id/results", element: <StudentResultPage /> },
          { path: "child/:id/fees", element: <StudentFeesPage /> },
          { path: "child/:id/attendance", element: <StudentLeavesPage /> },
          { path: "child/:id/library", element: <StudentLibraryPage /> },
          // HOSTEL MANAGEMENT Routes for Parent
          { path: "hostel/hostels", element: <HostelListPage /> },
          { path: "hostel/rooms", element: <HostelRoomsPage /> },
          { path: "hostel/room-types", element: <HostelRoomTypesPage /> },
          { path: "hostel/my-allocation", element: <HostelRoomsPage /> },
          { path: "hostel/fees", element: <FeesPage /> }
        ]
      },
      {
        path: "dashboard/staff",
        element: <ProtectedRoute requiredRoles={["staff", "staff_member"]} element={<MainLayout />} />,
        children: [
          { index: true, element: <StaffDashboardPage /> },
          { path: "profile", element: <StaffProfilePage /> },
          { path: "tasks", element: <TasksPage /> },
          { path: "leaves", element: <LeavePage /> },
          { path: "notifications", element: <StaffNotificationsPage /> },
          { path: "settings", element: <NotificationsSettingsPage /> }
        ]
      },
      {
        path: "dashboard/hr",
        element: <ProtectedRoute requiredRoles={["hr", "hr_manager", "hrmanager"]} element={<MainLayout />} />,
        children: [
          { index: true, element: <HRDashboardPage /> },
          { path: "staffs", element: <StaffsPage /> },
          { path: "documents", element: <StaffDocumentsPage /> },
          { path: "overview", element: <StaffOverviewPage /> },
          { path: "inventory", element: <InventoryPage /> },
          { path: "emails", element: <HREmailLogsPage /> },
          { path: "profile", element: <StaffProfilePage /> }
        ]
      },
      {
        path: "dashboard/accountant",
        element: <ProtectedRoute requiredRoles={["accountant"]} element={<MainLayout />} />,
        children: [
          { index: true, element: <AccountantDashboardPage /> },
          { path: "fees", element: <AccountantFeesPage /> },
          { path: "collect-fees", element: <FeeCollectionPage /> },
          { path: "fees-group", element: <FeesGroupPage /> },
          { path: "fees-type", element: <FeesTypePage /> },
          { path: "fees-master", element: <FeesMasterPage /> },
          { path: "fees-assign", element: <FeesAssignPage /> },
          { path: "salaries", element: <SalariesPage /> },
          { path: "payroll", element: <PayrollPage /> },
          { path: "budgets", element: <BudgetsPage /> },
          { path: "invoices", element: <InvoicesPage /> },
          { path: "transactions", element: <TransactionsPage /> },
          { path: "profile", element: <StaffProfilePage /> }
        ]
      },
      {
        path: "dashboard/finance",
        element: <Navigate to="/dashboard/accountant" replace />,
      },
      {
        path: "dashboard/library",
        element: <ProtectedRoute requiredRoles={["librarian"]} element={<MainLayout />} />,
        children: [
          { index: true, element: <LibrarianDashboardPage /> },
          { path: "members", element: <LibraryMembersPage /> },
          { path: "books", element: <LibraryBooksPage /> },
          { path: "issue", element: <LibraryIssueBookPage /> },
          { path: "return", element: <LibraryReturnPage /> },
          { path: "profile", element: <StaffProfilePage /> }
        ]
      },
      {
        path: "dashboard/transport",
        element: <ProtectedRoute requiredRoles={["transportmanager", "transport_manager"]} element={<TransportLayout />} />,
        children: [
          { index: true, element: <TransportManagerDashboardPage /> },
          { path: "routes", element: <TransportRoutesPage /> },
          { path: "pickup-points", element: <TransportPickupPointsPage /> },
          { path: "vehicles", element: <TransportVehiclePage /> },
          { path: "drivers", element: <TransportVehicleDriversPage /> },
          { path: "assign", element: <TransportAssignVehiclePage /> },
          { path: "reports", element: <TransportReportPage /> },
          { path: "vehicle-maintenance", element: <VehicleMaintenancePage /> },
          { path: "profile", element: <StaffProfilePage /> }
        ]
      },
      {
        path: "dashboard/hostel",
        element: <ProtectedRoute requiredRoles={["hostelwarden", "hostel_warden"]} element={<MainLayout />} />,
        children: [
          { index: true, element: <HostelDashboardPage /> },
          { path: "rooms", element: <HostelRoomsPage /> },
          { path: "hostels", element: <HostelListPage /> },
          { path: "room-types", element: <HostelRoomTypesPage /> },
          { path: "fees", element: <FeesPage /> },
          { path: "payments", element: <PaymentsPage /> },
          { path: "reports", element: <HostelReportPage /> },
          { path: "profile", element: <StaffProfilePage /> }
        ]
      },
      {
        path: "dashboard/principal",
        element: <ProtectedRoute requiredRoles={["principal"]} element={<MainLayout />} />,
        children: [
          { index: true, element: <PrincipalDashboard /> },
          { path: "analytics", element: <PrincipalAnalyticsPage /> },
          // PEOPLES
          { path: "students", element: <StudentListPage /> },
          { path: "students/add", element: <StudentAdd /> },
          { path: "teachers", element: <TeacherListPage /> },
          { path: "parents", element: <ParentListPage /> },
          { path: "guardians", element: <GuardianListPage /> },
          // ACADEMIC
          { path: "classes", element: <ClassesPage /> },
          { path: "classes/:id", element: <ClassDetailPage /> },
          { path: "sections", element: <ClassSectionPage /> },
          { path: "subjects", element: <ClassSubjectPage /> },
          { path: "syllabus", element: <ClassSyllabusPage /> },
          { path: "classroom", element: <ClassRoomPage /> },
          { path: "class-routine", element: <ClassRoutinePage /> },
          { path: "timetable", element: <ClassTimeTablePage /> },
          { path: "homework", element: <ClassHomeWorkPage /> },
          // MANAGEMENT
          { path: "fees-collection", element: <FeeCollectionPage /> },
          { path: "library", element: <LibraryBooksPage /> },
          { path: "sports", element: <SportsPage /> },
          // ATTENDANCE
          { path: "attendance/student", element: <StudentAttendancePage /> },
          { path: "attendance/teacher", element: <TeacherAttendancePage /> },
          // EXAMINATIONS
          { path: "exams", element: <ExamPage /> },
          { path: "exam-schedule", element: <ExamSchedulePage /> },
          { path: "grades", element: <GradePage /> },
          { path: "exams/results", element: <ExamResultsPage /> },
          // ANNOUNCEMENTS
          { path: "notice-board", element: <NoticeBoardPage /> },
          { path: "events", element: <EventsPage /> },
          // REPORTS
          { path: "reports/attendance", element: <AttendanceReportPage /> },
          { path: "reports/students", element: <StudentReportPage /> },
          { path: "reports/grades", element: <GradeReportPage /> },
          { path: "fees-report", element: <FeesReportPage /> },
          // SETTINGS
          { path: "profile", element: <ProfileSettingsPage /> },
          { path: "settings", element: <NotificationsSettingsPage /> },
          { path: "notifications", element: <NotificationsSettingsPage /> },
          { path: "school-settings", element: <AdminSchoolSettingsPage /> },
          // HOSTEL MANAGEMENT Routes for Principal
          { path: "hostel/hostels", element: <HostelListPage /> },
          { path: "hostel/rooms", element: <HostelRoomsPage /> },
          { path: "hostel/room-types", element: <HostelRoomTypesPage /> },
          { path: "hostel/fees", element: <FeesPage /> },
          { path: "hostel/payments", element: <PaymentsPage /> },
          { path: "hostel/reports", element: <HostelReportPage /> },
          // Comprehensive Institution Settings
          { path: "institution-settings", element: <InstitutionBrandingSettings /> },
          // FINANCE & PAYROLL
          { path: "salaries", element: <SalariesPage /> },
          { path: "payroll", element: <PayrollPage /> },
          { path: "budgets", element: <BudgetsPage /> },
          // APPLICATIONS
          { path: "applications/calendar", element: <CalendarPage /> },
          { path: "applications/chat", element: <ChatPage /> },
          { path: "applications/call", element: <CallPage /> },
          { path: "applications/notes", element: <NotesPage /> },
          { path: "applications/todo", element: <TodoPage /> },
          { path: "applications/email", element: <EmailPage /> },
          { path: "applications/file-manager", element: <FileManagerPage /> }
        ]
      },
      {
        path: "dashboard/main",
        element: <ProtectedRoute requiredRoles={["institutionadmin", "institution_admin", "admin", "accountant", "principal"]} element={<MainLayout />} />,
        children: [
          { index: true, element: <InstitutionDashboard /> },
          { path: "analytics", element: <InstituteAnalyticsDashboardPage /> },
          { path: "finance", element: <InstituteFinanceDashboardPage /> },
          { path: "users", element: <UserDirectoryPage /> },
          { path: "subscription", element: <SubscriptionPage /> },
          { path: "settings/*", element: <InstitutionBrandingSettings /> },
          { path: "branding", element: <InstitutionBrandingSettings /> },
          { path: "profile", element: <ProfileSettingsPage /> },
          { path: "pending-requests", element: <InstitutionPendingRequestsPage /> },
          { path: "create-credentials", element: <InstitutionCreateCredentialsPage /> },
          { path: "salaries", element: <SalariesPage /> },
          { path: "payroll", element: <PayrollPage /> },
          { path: "budgets", element: <BudgetsPage /> },
          { path: "transport", element: <TransportRoutesPage /> },
          { path: "transport/routes", element: <TransportRoutesPage /> },
          { path: "transport/vehicles", element: <TransportVehiclePage /> },
          { path: "transport/drivers", element: <TransportVehicleDriversPage /> },
          { path: "transport/pickup-points", element: <TransportPickupPointsPage /> },
          { path: "transport/vehicle-maintenance", element: <VehicleMaintenancePage /> },
          { path: "transport/assign", element: <TransportAssignVehiclePage /> },
          { path: "transport/reports", element: <TransportReportPage /> }
        ]
      },

      // Agent Routes
      {
        path: "agent",
        element: <ProtectedRoute requiredRoles={["agent"]} element={<AgentLayout />} />,
        children: [
          { index: true, element: <AgentDashboard /> },
          { path: "institutions", element: <AgentInstitutionsPage /> },
          { path: "institutions/add", element: <AgentAddInstitutionPage /> },
          { path: "institutions/:id", element: <AgentInstitutionDetailsPage /> },
          { path: "institutions/:id/edit", element: <AgentInstitutionEditPage /> },
          { path: "commissions", element: <AgentCommissionsPage /> },
          { path: "performance", element: <AgentPerformancePage /> },
          { path: "profile", element: <AgentProfilePage /> },
          { path: "settings", element: <AgentSettingsPage /> },

          // Agent applications
          { path: "applications/chat", element: <ChatPage /> },
          { path: "applications/call", element: <CallPage /> },
          { path: "applications/calendar", element: <CalendarPage /> },
          { path: "applications/notes", element: <NotesPage /> },
          { path: "applications/email", element: <EmailPage /> },
          { path: "applications/file-manager", element: <FileManagerPage /> },
          { path: "applications/todo", element: <TodoPage /> },
        ]
      },

      // Admin Routes (SEPARATE LAYOUT WITH SIDEBAR)
      {
        path: "dashboard/admin",
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
            path: "sports",
            element: <SportsPage />,
          },
          {
            path: "support/tickets",
            element: <TicketsPage />,
          },
          {
            path: "roles-permissions",
            element: <RolesPermissionsPage />,
          },
          {
            path: "delete-account",
            element: <DeleteAccountPage />,
          },
          {
            path: "finance",
            element: <FinancePage />,
          },
          {
            path: "salaries",
            element: <SalariesPage />,
          },
          {
            path: "payroll",
            element: <PayrollPage />,
          },
          {
            path: "budgets",
            element: <BudgetsPage />,
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
            path: "classes",
            element: <ClassesPage />,
          },
          {
            path: "sections",
            element: <ClassSectionPage />,
          },
          {
            path: "subjects",
            element: <ClassSubjectPage />,
          },
          {
            path: "classroom",
            element: <ClassRoomPage />,
          },
          {
            path: "staff",
            element: <AdminStaffPage />,
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
            children: [
              { path: "sections", element: <ClassSectionPage /> },
              { path: "routine", element: <ClassRoutinePage /> },
              { path: "exams", element: <ExamPage /> },
              { path: "grades", element: <GradePage /> },
              { path: "exam-attendance", element: <ExamAttendancePage /> }
            ]
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
            children: [
              { path: "class", element: <ClassReportPage /> },
              { path: "student", element: <StudentReportPage /> },
              { path: "leave", element: <LeaveReportPage /> }
            ]
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
          {
            path: "transport/vehicle-maintenance",
            element: (
              <ProtectedRoute
                requiredRoles={["admin", "institutionowner", "institutionadmin"]}
                element={<VehicleMaintenancePage />}
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
          {
            path: "ptm",
            element: (
              <ProtectedRoute
                requiredRoles={["admin", "institutionowner", "institutionadmin"]}
                element={<AdminPTMPage />}
              />
            ),
          },
          // Hostel Management Routes for Admin
          {
            path: "hostel/hostels",
            element: (
              <ProtectedRoute
                requiredRoles={["admin", "institutionowner", "institutionadmin"]}
                element={<HostelListPage />}
              />
            ),
          },
          {
            path: "hostel/rooms",
            element: (
              <ProtectedRoute
                requiredRoles={["admin", "institutionowner", "institutionadmin"]}
                element={<HostelRoomsPage />}
              />
            ),
          },
          {
            path: "hostel/room-types",
            element: (
              <ProtectedRoute
                requiredRoles={["admin", "institutionowner", "institutionadmin"]}
                element={<HostelRoomTypesPage />}
              />
            ),
          },
          {
            path: "hostel/fees",
            element: (
              <ProtectedRoute
                requiredRoles={["admin", "institutionowner", "institutionadmin"]}
                element={<FeesPage />}
              />
            ),
          },
          {
            path: "hostel/payments",
            element: (
              <ProtectedRoute
                requiredRoles={["admin", "institutionowner", "institutionadmin"]}
                element={<PaymentsPage />}
              />
            ),
          },
          {
            path: "hostel/reports",
            element: (
              <ProtectedRoute
                requiredRoles={["admin", "institutionowner", "institutionadmin"]}
                element={<HostelReportPage />}
              />
            ),
          },
          // Comprehensive Institution Settings (logo, payment gateway, email config, support email)
          {
            path: "settings/institution",
            element: (
              <ProtectedRoute
                requiredRoles={["admin", "institutionowner", "institutionadmin"]}
                element={<InstitutionSettingsPage />}
              />
            ),
          },
        ],
      },

      // Under Maintenance

      {
        path: "under-maintenance",
        element: <UnderMaintenance />,
      },

      // Unauthorized route — redirect to login
      {
        path: "unauthorized",
        element: <Navigate to="/login" replace />
      },

      // Catch all route — show 404 page
      {
        path: "*",
        element: <NotFoundPage />
      },
    ]
  }
]
);
// eslint-disable-next-line react-refresh/only-export-components
export default router;


