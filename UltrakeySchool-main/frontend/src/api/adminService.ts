// API Service for School Admin modules
// This file provides standardized API integration for all School Admin pages

import apiClient from './client';

// Generic API service class
export class AdminApiService {
  // Generic GET request with error handling
  static async getData<T>(endpoint: string, params?: any): Promise<T | null> {
    try {
      const response = await apiClient.get(endpoint, { params });
      return response.data.data || null;
    } catch (error: any) {
      this.handleError(error, `GET ${endpoint}`);
      return null;
    }
  }

  // Generic POST request with error handling
  static async postData<T>(endpoint: string, data?: any): Promise<T | null> {
    try {
      const response = await apiClient.post(endpoint, data);
      return response.data.data || null;
    } catch (error: any) {
      this.handleError(error, `POST ${endpoint}`);
      return null;
    }
  }

  // Generic PUT request with error handling
  static async putData<T>(endpoint: string, data?: any): Promise<T | null> {
    try {
      const response = await apiClient.put(endpoint, data);
      return response.data.data || null;
    } catch (error: any) {
      this.handleError(error, `PUT ${endpoint}`);
      return null;
    }
  }

  // Generic DELETE request with error handling
  static async deleteData<T>(endpoint: string): Promise<T | null> {
    try {
      const response = await apiClient.delete(endpoint);
      return response.data.data || null;
    } catch (error: any) {
      this.handleError(error, `DELETE ${endpoint}`);
      return null;
    }
  }

  // Export data (Excel/PDF)
  static async exportData(endpoint: string, params: any, filename: string): Promise<void> {
    try {
      const response = await apiClient.get(endpoint, {
        params: { ...params, format: 'excel' },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data as unknown as Blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      this.handleError(error, `EXPORT ${endpoint}`);
    }
  }

  // Error handling
  private static handleError(error: any, operation: string): void {
    console.error(`[API Error] ${operation}:`, error);
    
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
      return;
    }
    
    if (error.response?.status === 403) {
      console.error('Access forbidden: You do not have permission for this operation');
    }
    
    if (error.response?.status === 404) {
      console.error('API endpoint not found. Please check the server configuration.');
    }
    
    if (error.response?.status === 500) {
      console.error('Server error: Please try again later.');
    }
  }
}

// Specific API services for different modules

export class AttendanceApiService {
  // Teacher Attendance
  static async getTeacherOverview(date: string, department?: string) {
    return AdminApiService.getData('/attendance/teacher/overview', { date, department });
  }

  static async getTeacherList(date: string, department?: string) {
    return AdminApiService.getData('/attendance/teacher/list', { date, department });
  }

  static async getTeacherDepartmentWise(date: string) {
    return AdminApiService.getData('/attendance/teacher/department-wise', { date });
  }

  static async getTeacherWeeklyTrend(department?: string) {
    return AdminApiService.getData('/attendance/teacher/weekly-trend', { department });
  }

  static async markTeacherAttendance(date: string, department?: string) {
    return AdminApiService.getData('/attendance/teacher/mark-attendance', { date, department });
  }

  static async exportTeacherAttendance(params: any, filename: string) {
    return AdminApiService.exportData('/attendance/teacher/export', params, filename);
  }

  // Student Attendance
  static async getStudentOverview(date: string, grade?: string, section?: string) {
    return AdminApiService.getData('/attendance/student/overview', { date, grade, section });
  }

  static async getStudentList(date: string, grade?: string, section?: string) {
    return AdminApiService.getData('/attendance/student/list', { date, grade, section });
  }

  static async getClassWiseAttendance(date: string) {
    return AdminApiService.getData('/attendance/student/class-wise', { date });
  }

  static async getStudentWeeklyTrend(grade?: string) {
    return AdminApiService.getData('/attendance/student/weekly-trend', { grade });
  }

  static async markStudentAttendance(date: string, grade?: string, section?: string) {
    return AdminApiService.getData('/attendance/student/mark-attendance', { date, grade, section });
  }

  static async exportStudentAttendance(params: any, filename: string) {
    return AdminApiService.exportData('/attendance/student/export', params, filename);
  }
}

export class LibraryApiService {
  // Library Members
  static async getMemberOverview() {
    return AdminApiService.getData('/library/members/overview');
  }

  static async getMemberList(type?: string, search?: string) {
    return AdminApiService.getData('/library/members/list', { type, search });
  }

  static async getMemberTypes() {
    return AdminApiService.getData('/library/members/types');
  }

  static async getMemberMonthlyTrend() {
    return AdminApiService.getData('/library/members/monthly-trend');
  }

  static async addMember(data: any) {
    return AdminApiService.postData('/library/members', data);
  }

  static async updateMember(id: string, data: any) {
    return AdminApiService.putData(`/library/members/${id}`, data);
  }

  static async deleteMember(id: string) {
    return AdminApiService.deleteData(`/library/members/${id}`);
  }

  static async exportMembers(params: any, filename: string) {
    return AdminApiService.exportData('/library/members/export', params, filename);
  }

  // Library Books
  static async getBookOverview() {
    return AdminApiService.getData('/library/books/overview');
  }

  static async getBookList(category?: string, search?: string) {
    return AdminApiService.getData('/library/books/list', { category, search });
  }

  static async getBookCategories() {
    return AdminApiService.getData('/library/books/categories');
  }

  static async getBookStatus() {
    return AdminApiService.getData('/library/books/status');
  }

  static async getBookMonthlyTrend() {
    return AdminApiService.getData('/library/books/monthly-trend');
  }

  static async addBook(data: any) {
    return AdminApiService.postData('/library/books', data);
  }

  static async updateBook(id: string, data: any) {
    return AdminApiService.putData(`/library/books/${id}`, data);
  }

  static async deleteBook(id: string) {
    return AdminApiService.deleteData(`/library/books/${id}`);
  }

  static async issueBook(data: any) {
    return AdminApiService.postData('/library/books/issue', data);
  }

  static async returnBook(data: any) {
    return AdminApiService.postData('/library/books/return', data);
  }

  static async exportBooks(params: any, filename: string) {
    return AdminApiService.exportData('/library/books/export', params, filename);
  }
}

export class SportsApiService {
  static async getSportsOverview() {
    return AdminApiService.getData('/sports/overview');
  }

  static async getSportsList(category?: string) {
    return AdminApiService.getData('/sports/list', { category });
  }

  static async getSportsEvents() {
    return AdminApiService.getData('/sports/events');
  }

  static async getSportsFacilities() {
    return AdminApiService.getData('/sports/facilities');
  }

  static async getSportsPerformance() {
    return AdminApiService.getData('/sports/performance');
  }

  static async addSport(data: any) {
    return AdminApiService.postData('/sports', data);
  }

  static async updateSport(id: string, data: any) {
    return AdminApiService.putData(`/sports/${id}`, data);
  }

  static async deleteSport(id: string) {
    return AdminApiService.deleteData(`/sports/${id}`);
  }

  static async addEvent(data: any) {
    return AdminApiService.postData('/sports/events', data);
  }

  static async updateEvent(id: string, data: any) {
    return AdminApiService.putData(`/sports/events/${id}`, data);
  }

  static async deleteEvent(id: string) {
    return AdminApiService.deleteData(`/sports/events/${id}`);
  }

  static async exportSports(params: any, filename: string) {
    return AdminApiService.exportData('/sports/export', params, filename);
  }
}

export class ReportsApiService {
  // Attendance Reports
  static async getAttendanceReport(params: any) {
    return AdminApiService.getData('/reports/attendance', params);
  }

  // Student Reports
  static async getStudentReport(params: any) {
    return AdminApiService.getData('/reports/student', params);
  }

  // Grade Reports
  static async getGradeReport(params: any) {
    return AdminApiService.getData('/reports/grade', params);
  }

  // Fees Reports
  static async getFeesReport(params: any) {
    return AdminApiService.getData('/reports/fees', params);
  }

  // Export Reports
  static async exportAttendanceReport(params: any, filename: string) {
    return AdminApiService.exportData('/reports/attendance/export', params, filename);
  }

  static async exportStudentReport(params: any, filename: string) {
    return AdminApiService.exportData('/reports/student/export', params, filename);
  }

  static async exportGradeReport(params: any, filename: string) {
    return AdminApiService.exportData('/reports/grade/export', params, filename);
  }

  static async exportFeesReport(params: any, filename: string) {
    return AdminApiService.exportData('/reports/fees/export', params, filename);
  }
}

export class AnnouncementsApiService {
  // Notice Board
  static async getNotices(params?: any) {
    return AdminApiService.getData('/announcements/notices', params);
  }

  static async addNotice(data: any) {
    return AdminApiService.postData('/announcements/notices', data);
  }

  static async updateNotice(id: string, data: any) {
    return AdminApiService.putData(`/announcements/notices/${id}`, data);
  }

  static async deleteNotice(id: string) {
    return AdminApiService.deleteData(`/announcements/notices/${id}`);
  }

  static async getNoticeCategories() {
    return AdminApiService.getData('/announcements/notices/categories');
  }

  static async getNoticeMonthlyTrend() {
    return AdminApiService.getData('/announcements/notices/monthly-trend');
  }

  static async exportNotices(params: any, filename: string) {
    return AdminApiService.exportData('/announcements/notices/export', params, filename);
  }

  // Events
  static async getEvents(params?: any) {
    return AdminApiService.getData('/announcements/events', params);
  }

  static async addEvent(data: any) {
    return AdminApiService.postData('/announcements/events', data);
  }

  static async updateEvent(id: string, data: any) {
    return AdminApiService.putData(`/announcements/events/${id}`, data);
  }

  static async deleteEvent(id: string) {
    return AdminApiService.deleteData(`/announcements/events/${id}`);
  }

  static async getEventTypes() {
    return AdminApiService.getData('/announcements/events/types');
  }

  static async getEventMonthlyTrend() {
    return AdminApiService.getData('/announcements/events/monthly-trend');
  }

  static async getVenueUtilization() {
    return AdminApiService.getData('/announcements/events/venue-utilization');
  }

  static async exportEvents(params: any, filename: string) {
    return AdminApiService.exportData('/announcements/events/export', params, filename);
  }
}

export class StudentManagementApiService {
  // Student List
  static async getStudentOverview() {
    return AdminApiService.getData('/students/overview');
  }

  static async getStudentList(grade?: string, status?: string, search?: string) {
    return AdminApiService.getData('/students/list', { grade, status, search });
  }

  static async getGradeDistribution() {
    return AdminApiService.getData('/students/grade-distribution');
  }

  static async getGenderDistribution() {
    return AdminApiService.getData('/students/gender-distribution');
  }

  static async getAttendanceStats() {
    return AdminApiService.getData('/students/attendance-stats');
  }

  static async addStudent(data: any) {
    return AdminApiService.postData('/students', data);
  }

  static async updateStudent(id: string, data: any) {
    return AdminApiService.putData(`/students/${id}`, data);
  }

  static async deleteStudent(id: string) {
    return AdminApiService.deleteData(`/students/${id}`);
  }

  static async exportStudents(params: any, filename: string) {
    return AdminApiService.exportData('/students/export', params, filename);
  }

  // Admissions
  static async getAdmissionOverview() {
    return AdminApiService.getData('/admissions/overview');
  }

  static async getAdmissionApplications(grade?: string, status?: string) {
    return AdminApiService.getData('/admissions/applications', { grade, status });
  }

  static async getGradeAvailability() {
    return AdminApiService.getData('/admissions/grade-availability');
  }

  static async addAdmission(data: any) {
    return AdminApiService.postData('/admissions', data);
  }

  static async updateAdmission(id: string, data: any) {
    return AdminApiService.putData(`/admissions/${id}`, data);
  }

  static async approveAdmission(id: string) {
    return AdminApiService.putData(`/admissions/${id}/approve`);
  }

  static async rejectAdmission(id: string, reason: string) {
    return AdminApiService.putData(`/admissions/${id}/reject`, { reason });
  }

  // Promotions
  static async getPromotionOverview() {
    return AdminApiService.getData('/promotions/overview');
  }

  static async getPromotionList(grade?: string, status?: string) {
    return AdminApiService.getData('/promotions/list', { grade, status });
  }

  static async getGradeWisePromotion() {
    return AdminApiService.getData('/promotions/grade-wise');
  }

  static async getPromotionCriteria() {
    return AdminApiService.getData('/promotions/criteria');
  }

  static async processPromotions(data: any) {
    return AdminApiService.postData('/promotions/process', data);
  }

  static async promoteStudent(id: string, data: any) {
    return AdminApiService.putData(`/promotions/${id}/promote`, data);
  }

  static async retainStudent(id: string, reason: string) {
    return AdminApiService.putData(`/promotions/${id}/retain`, { reason });
  }

  static async generatePromotionCertificates(data: any) {
    return AdminApiService.postData('/promotions/certificates', data);
  }

  static async exportPromotions(params: any, filename: string) {
    return AdminApiService.exportData('/promotions/export', params, filename);
  }
}

export class ExaminationsApiService {
  static async getExaminationOverview() {
    return AdminApiService.getData('/examinations/overview');
  }

  static async getExaminationList(params?: any) {
    return AdminApiService.getData('/examinations/list', params);
  }

  static async getExaminationSchedule(grade?: string) {
    return AdminApiService.getData('/examinations/schedule', { grade });
  }
  
  static async getGradeWiseExams() {
    return AdminApiService.getData('/examinations/grade-wise');
  }

  static async addExamination(data: any) {
    return AdminApiService.postData('/examinations', data);
  }

  static async updateExamination(id: string, data: any) {
    return AdminApiService.putData(`/examinations/${id}`, data);
  }

  static async deleteExamination(id: string) {
    return AdminApiService.deleteData(`/examinations/${id}`);
  }

  static async publishResults(id: string) {
    return AdminApiService.putData(`/examinations/${id}/publish`);
  }

  static async exportExaminations(params: any, filename: string) {
    return AdminApiService.exportData('/examinations/export', params, filename);
  }

  // Results
  static async getResultsOverview() {
    return AdminApiService.getData('/results/overview');
  }

  static async getResultsList(params?: any) {
    return AdminApiService.getData('/results/list', params);
  }

  static async getClassWiseResults() {
    return AdminApiService.getData('/results/class-wise');
  }

  static async getSubjectWiseResults() {
    return AdminApiService.getData('/results/subject-wise');
  }

  static async getTopPerformers(limit?: number) {
    return AdminApiService.getData('/results/top-performers', { limit });
  }

  static async exportResults(params: any, filename: string) {
    return AdminApiService.exportData('/results/export', params, filename);
  }

  // Exams (alias for examination methods)
  static async getExamOverview() {
    return AdminApiService.getData('/examinations/overview');
  }

  static async getExamList(params?: any) {
    return AdminApiService.getData('/examinations/list', params);
  }

  static async getExamSchedule(params?: any) {
    return AdminApiService.getData('/examinations/schedule', params);
  }

  static async getExamTypes() {
    return AdminApiService.getData('/examinations/types');
  }

  static async getGradeDistribution() {
    return AdminApiService.getData('/results/grade-distribution');
  }

  // Grades
  static async getGradesOverview() {
    return AdminApiService.getData('/grades/overview');
  }

  static async getGradesList(params?: any) {
    return AdminApiService.getData('/grades/list', params);
  }

  static async exportGrades(params: any, filename: string) {
    return AdminApiService.exportData('/grades/export', params, filename);
  }

  // Schedule specific methods
  static async getScheduleOverview() {
    return AdminApiService.getData('/examinations/schedule/overview');
  }

  static async getScheduleList(date?: string, grade?: string) {
    return AdminApiService.getData('/examinations/schedule/list', { date, grade });
  }

  static async getCalendarEvents(month?: string) {
    return AdminApiService.getData('/examinations/schedule/calendar', { month });
  }

  static async getWeeklySchedule() {
    return AdminApiService.getData('/examinations/schedule/weekly');
  }
}

export default AdminApiService;

