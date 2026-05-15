// Note: authService is located in ../api/authService.ts
export { default as authService } from '../api/authService';
export { studentService } from './studentService';
export { teacherService } from './teacherService';
export { classService } from './classService';
export { attendanceService } from './attendanceService';
export { examService } from './examService';
export { default as noticeService } from './noticeService';
export { feeService } from './feeService';
export { homeworkService } from './homeworkService';
export { subjectService } from './subjectService';
export { libraryService } from './libraryService';
export { hostelService } from './hostelService';
export { timetableService } from './timetableService';
export { default as eventService } from './eventService';
export { statisticsService } from './statisticsService';
export { notificationService } from './notificationService';
export { permissionService } from './permissionService';
export { roleService } from './roleService';
export { default as settingsService } from './settingsService';
export { transportAssignmentService } from './transportAssignmentService';
export { transportService } from './transportService';
export { transportReportService, type TransportReport, type TransportStatistics } from './transportReportService';
export { pickupPointService } from './pickupPointService';
export { driverService } from './driverService';
export { notesService } from './notesService';
export { reportsService } from './reportsService';
export { dsrService } from './dsrService';
export { dashboardService } from './dashboardService';
export { institutionRegistrationService } from './institutionRegistrationService';

// Export apiClient as both apiService and apiClient for backward compatibility
import apiClientDefault from './api';
export { apiClientDefault as apiService };
export { apiClientDefault as apiClient };
export default apiClientDefault;
