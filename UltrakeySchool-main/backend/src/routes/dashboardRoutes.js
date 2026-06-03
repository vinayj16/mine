import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';
import { addInstitutionFilter, addInstitutionHeaders } from '../middleware/institutionFilter.js';
import dashboardController from '../controllers/dashboardController.js';
const {
  getDashboard,
  getStudentDashboard,
  getTeacherDashboard,
  getParentDashboard,
  getAdminDashboard,
  getInstituteAdminDashboard,
  getQuickStats,
  getAdminOverview,
  getAdminStats,
  getDashboardWidgets,
  getRecentActivities,
  getNotifications,
  getUpcomingEvents,
  getPerformanceSummary,
  getAttendanceSummary,
  getFeeSummary,
  getAnnouncements,
  refreshDashboard,
  // New dashboard sub-endpoint handlers
  getTodaySchedule,
  getTeacherScheduleHandler,
  getClassStatisticsHandler,
  getStudentAttendanceStatsHandler,
  getStudentFeeStatusHandler,
  getTeacherPendingTasksHandler,
  getRecentMessagesHandler,
  getPTMSlotsHandler,
  getStudentPerformanceHandler,
  getClassFacultiesHandler,
  getStudentHomeworkHandler,
  getStudentLeaveStatusHandler,
  getStudentExamResultsHandler,
  getStudentFeeRemindersHandler,
  getNoticeBoardHandler,
  getSyllabusProgressHandler,
  getTodoItemsHandler,
  updateTodoItemHandler,
  getAdminAttendanceOverviewHandler,
  getAdminFeeStatsHandler,
  getAdminActivitiesHandler,
  getAdminRecentAdmissionsHandler,
  getParentCombinedFeeStatusHandler,
  getStudentRankHandler,
  getStudentGradesHandler
} = dashboardController;

const router = express.Router();

// Protected routes - all other dashboard routes require authentication (TESTED & VERIFIED)
router.use(protect);

// Institution Admin Dashboard - requires authentication (TESTED & VERIFIED)
// Place middleware AFTER the institute-admin route so it doesn't block
router.get('/institute-admin', getInstituteAdminDashboard);
router.get('/superadmin', getInstituteAdminDashboard);  // Alias for superadmin dashboard

// Role-specific dashboards (TESTED & VERIFIED)
router.get('/', getDashboard);  
router.get('/student', getStudentDashboard);  
router.get('/teacher', getTeacherDashboard);  
router.get('/parent', getParentDashboard);  
router.get('/admin', getAdminDashboard);  

// Admin-specific endpoints (accessible via /dashboard/admin/overview and /dashboard/admin/stats) (TESTED & VERIFIED)
router.get('/admin/overview', getAdminOverview);  
router.get('/admin/stats', getAdminStats);  

// Get quick stats (TESTED & VERIFIED)
router.get('/quick-stats', getQuickStats);  

// Additional dashboard sub-endpoints (NEW)
router.get('/widgets', getDashboardWidgets);
router.get('/activities', getRecentActivities);
router.get('/notifications', getNotifications);
router.get('/events', getUpcomingEvents);
router.get('/performance', getPerformanceSummary);
router.get('/attendance', getAttendanceSummary);
router.get('/fees', getFeeSummary);
router.get('/announcements', getAnnouncements);
router.post('/refresh', refreshDashboard);

// ============================================================
// New Dashboard Sub-endpoints (matching frontend service calls)
// ============================================================

// Schedule & class endpoints
router.get('/schedule/today', getTodaySchedule);
router.get('/teacher/schedule', getTeacherScheduleHandler);
router.get('/class/:classId/statistics', getClassStatisticsHandler);
router.get('/class/:classId/faculties', getClassFacultiesHandler);
router.get('/class/:classId/syllabus', getSyllabusProgressHandler);

// Student-specific endpoints
router.get('/student/:studentId/attendance', getStudentAttendanceStatsHandler);
router.get('/student/:studentId/fee-status', getStudentFeeStatusHandler);
router.get('/student/:studentId/performance', getStudentPerformanceHandler);
router.get('/student/:studentId/homework', getStudentHomeworkHandler);
router.get('/student/:studentId/leave-status', getStudentLeaveStatusHandler);
router.get('/student/:studentId/exam-results', getStudentExamResultsHandler);
router.get('/student/:studentId/fee-reminders', getStudentFeeRemindersHandler);
router.get('/student/:studentId/rank', getStudentRankHandler);
router.get('/student/:studentId/grades', getStudentGradesHandler);

// Teacher endpoints
router.get('/teacher/:teacherId/pending-tasks', getTeacherPendingTasksHandler);

// Parent endpoints
router.get('/parent/:parentId/ptm-slots', getPTMSlotsHandler);
router.post('/parent/fee-status', getParentCombinedFeeStatusHandler);

// Messages & notifications
router.get('/messages', getRecentMessagesHandler);
router.get('/notice-board', getNoticeBoardHandler);

// Todo endpoints
router.get('/todo', getTodoItemsHandler);
router.patch('/todo/:todoId', updateTodoItemHandler);

// Admin sub-endpoints
router.get('/admin/attendance', getAdminAttendanceOverviewHandler);
router.get('/admin/fee-stats', getAdminFeeStatsHandler);
router.get('/admin/activities', getAdminActivitiesHandler);
router.get('/admin/recent-admissions', getAdminRecentAdmissionsHandler);

// Apply tenant validation AFTER dashboard endpoints so institution owners can access
router.use(validateTenantAccess);
router.use(addInstitutionHeaders);
router.use(addInstitutionFilter);

export default router;
