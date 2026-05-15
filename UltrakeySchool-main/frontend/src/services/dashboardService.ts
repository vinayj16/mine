import apiService, { type ApiResponse } from './api';

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeStudents: number;
  attendanceToday: {
    present: number;
    percentage: string;
  };
  pendingFees: number;
  recentAdmissions: number;
}

export interface AttendanceStats {
  total: number;
  present: number;
  percentage: string;
}

export interface FeeStatus {
  status: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface StudentDashboardData {
  student: {
    id: string;
    name: string;
    class: string;
    section: string;
    rollNumber: string;
    avatar?: string;
  };
  quickStats: {
    attendance: string;
    pendingAssignments: number;
    feeStatus: string;
    unreadMessages: number;
  };
  todaySchedule: Record<string, unknown>[];
  pendingAssignments: Array<{
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    status: string;
  }>;
  feeStatus: FeeStatus;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
  }>;
}

export interface TeacherDashboardData {
  teacher: {
    id: string;
    name: string;
    department: string;
    classTeacher: string;
    avatar?: string;
  };
  quickStats: {
    studentsInClass: number;
    presentToday: number;
    pendingTasks: number;
    unreadMessages: number;
  };
  todaySchedule: Record<string, unknown>[];
  classStats: {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    attendancePercentage: string;
  };
  pendingTasks: Record<string, unknown>[];
  messages: Record<string, unknown>[];
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
  }>;
  recentActivities: Record<string, unknown>[];
}

export interface ParentDashboardData {
  parent: {
    id: string;
    childrenCount: number;
  };
  children: Array<{
    id: string;
    name: string;
    class: string;
    section: string;
    avatar?: string;
    attendance: string;
    grades: number;
    rank: number;
    totalStudents: number;
  }>;
  feeStatus: {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    status: string;
  };
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
  }>;
  messages: Record<string, unknown>[];
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
  }>;
  ptmSlots: Array<{
    id: string;
    teacher: string;
    date: string;
    time: string;
  }>;
}

export interface AdminDashboardData {
  overview: DashboardStats;
  attendanceOverview: Record<string, unknown>;
  feeStats: Record<string, unknown>;
  recentActivities: Record<string, unknown>[];
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
  }>;
}

export interface QuickStats {
  attendance?: string;
  pendingAssignments?: number;
  feeStatus?: string;
  unreadMessages?: number;
  studentsInClass?: number;
  presentToday?: number;
  pendingTasks?: number;
  totalStudents?: number;
  totalTeachers?: number;
  totalClasses?: number;
  activeStudents?: number;
  pendingFees?: number;
  recentAdmissions?: number;
}

class DashboardService {
  /**
   * Get dashboard data based on user role
   */
  async getDashboard(): Promise<StudentDashboardData | TeacherDashboardData | ParentDashboardData | AdminDashboardData> {
    const response: ApiResponse<StudentDashboardData | TeacherDashboardData | ParentDashboardData | AdminDashboardData> = 
      await apiService.get('/dashboard');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch dashboard');
    }
    
    return response.data;
  }

  /**
   * Get student dashboard
   */
  async getStudentDashboard(): Promise<StudentDashboardData> {
    const response: ApiResponse<StudentDashboardData> = await apiService.get('/dashboard/student');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch student dashboard');
    }
    
    return response.data;
  }

  /**
   * Get teacher dashboard
   */
  async getTeacherDashboard(): Promise<TeacherDashboardData> {
    const response: ApiResponse<TeacherDashboardData> = await apiService.get('/dashboard/teacher');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch teacher dashboard');
    }
    
    return response.data;
  }

  /**
   * Get parent dashboard
   */
  async getParentDashboard(): Promise<ParentDashboardData> {
    const response: ApiResponse<ParentDashboardData> = await apiService.get('/dashboard/parent');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch parent dashboard');
    }
    
    return response.data;
  }

  /**
   * Get admin dashboard
   */
  async getAdminDashboard(): Promise<AdminDashboardData> {
    const response: ApiResponse<AdminDashboardData> = await apiService.get('/dashboard/admin');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch admin dashboard');
    }
    
    return response.data;
  }

  /**
   * Get quick stats
   */
  async getQuickStats(): Promise<QuickStats> {
    const response: ApiResponse<QuickStats> = await apiService.get('/dashboard/quick-stats');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch quick stats');
    }
    
    return response.data;
  }

  /**
   * Get today's schedule for student
   */
  async getTodaySchedule(classId: string, sectionId: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/schedule/today`,
      { classId, sectionId }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch schedule');
    }
    
    return response.data;
  }

  /**
   * Get teacher's schedule for a specific date
   */
  async getTeacherSchedule(teacherId: string, date: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/teacher/schedule`,
      { teacherId, date }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch teacher schedule');
    }
    
    return response.data;
  }

  /**
   * Get class statistics for teacher
   */
  async getClassStatistics(classId: string): Promise<{
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    attendancePercentage: string;
  }> {
    const response: ApiResponse<{
      totalStudents: number;
      presentToday: number;
      absentToday: number;
      attendancePercentage: string;
    }> = await apiService.get(`/dashboard/class/${classId}/statistics`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch class statistics');
    }
    
    return response.data;
  }

  /**
   * Get student attendance stats
   */
  async getStudentAttendanceStats(studentId: string): Promise<AttendanceStats> {
    const response: ApiResponse<AttendanceStats> = await apiService.get(
      `/dashboard/student/${studentId}/attendance`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch attendance stats');
    }
    
    return response.data;
  }

  /**
   * Get student fee status
   */
  async getStudentFeeStatus(studentId: string): Promise<FeeStatus> {
    const response: ApiResponse<FeeStatus> = await apiService.get(
      `/dashboard/student/${studentId}/fee-status`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch fee status');
    }
    
    return response.data;
  }

  /**
   * Get teacher pending tasks
   */
  async getTeacherPendingTasks(teacherId: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/teacher/${teacherId}/pending-tasks`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch pending tasks');
    }
    
    return response.data;
  }

  /**
   * Get recent messages
   */
  async getRecentMessages(limit: number = 5): Promise<{
    messages: Record<string, unknown>[];
    unreadCount: number;
  }> {
    const response: ApiResponse<{
      messages: Record<string, unknown>[];
      unreadCount: number;
    }> = await apiService.get(`/dashboard/messages`, { limit: String(limit) });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch messages');
    }
    
    return response.data;
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit: number = 5): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/events`,
      { limit: String(limit) }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch events');
    }
    
    return response.data;
  }

  /**
   * Get recent notifications
   */
  async getRecentNotifications(limit: number = 5): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/notifications`,
      { limit: String(limit) }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch notifications');
    }
    
    return response.data;
  }

  /**
   * Get PTM slots for parent
   */
  async getPTMSlots(parentId: string, limit: number = 3): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/parent/${parentId}/ptm-slots`,
      { limit: String(limit) }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch PTM slots');
    }
    
    return response.data;
  }

  /**
   * Get student performance data
   */
  async getStudentPerformance(studentId: string): Promise<{
    performanceData: Record<string, unknown>[];
    trendData: Record<string, unknown>[];
    radarData: Record<string, unknown>[];
  }> {
    const response: ApiResponse<{
      performanceData: Record<string, unknown>[];
      trendData: Record<string, unknown>[];
      radarData: Record<string, unknown>[];
    }> = await apiService.get(`/dashboard/student/${studentId}/performance`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch performance data');
    }
    
    return response.data;
  }

  /**
   * Get class faculties
   */
  async getClassFaculties(classId: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/class/${classId}/faculties`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch faculties');
    }
    
    return response.data;
  }

  /**
   * Get student homework
   */
  async getStudentHomework(studentId: string, limit: number = 5): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/student/${studentId}/homework`,
      { limit: String(limit) }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch homework');
    }
    
    return response.data;
  }

  /**
   * Get student leave status
   */
  async getStudentLeaveStatus(studentId: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/student/${studentId}/leave-status`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch leave status');
    }
    
    return response.data;
  }

  /**
   * Get student exam results
   */
  async getStudentExamResults(studentId: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/student/${studentId}/exam-results`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exam results');
    }
    
    return response.data;
  }

  /**
   * Get fee reminders
   */
  async getFeeReminders(studentId: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/student/${studentId}/fee-reminders`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch fee reminders');
    }
    
    return response.data;
  }

  /**
   * Get notice board
   */
  async getNoticeBoard(limit: number = 5): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/notice-board`,
      { limit: String(limit) }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch notice board');
    }
    
    return response.data;
  }

  /**
   * Get syllabus progress
   */
  async getSyllabusProgress(classId: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/class/${classId}/syllabus`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch syllabus progress');
    }
    
    return response.data;
  }

  /**
   * Get todo items
   */
  async getTodoItems(limit: number = 5): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/todo`,
      { limit: String(limit) }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch todo items');
    }
    
    return response.data;
  }

  /**
   * Update todo item status
   */
  async updateTodoItem(todoId: string, completed: boolean): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.patch(
      `/dashboard/todo/${todoId}`,
      { completed }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update todo item');
    }
    
    return response.data;
  }

  /**
   * Get attendance overview for admin
   */
  async getAttendanceOverview(date: string): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      `/dashboard/admin/attendance`,
      { date }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch attendance overview');
    }
    
    return response.data;
  }

  /**
   * Get fee collection stats for admin
   */
  async getFeeCollectionStats(): Promise<Record<string, unknown>> {
    const response: ApiResponse<Record<string, unknown>> = await apiService.get(
      '/dashboard/admin/fee-stats'
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch fee stats');
    }
    
    return response.data;
  }

  /**
   * Get system recent activities for admin
   */
  async getSystemActivities(limit: number = 10): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `/dashboard/admin/activities`,
      { limit: String(limit) }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch system activities');
    }
    
    return response.data;
  }

  /**
   * Get recent admissions for admin
   */
  async getRecentAdmissions(days: number = 7): Promise<number> {
    const response: ApiResponse<number> = await apiService.get(
      `/dashboard/admin/recent-admissions`,
      { days: String(days) }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch recent admissions');
    }
    
    return response.data;
  }

  /**
   * Get combined fee status for parent (multiple children)
   */
  async getCombinedFeeStatus(studentIds: string[]): Promise<{
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    status: string;
  }> {
    const response: ApiResponse<{
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
      status: string;
    }> = await apiService.post('/dashboard/parent/fee-status', { studentIds });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch combined fee status');
    }
    
    return response.data;
  }

  /**
   * Get student rank in class
   */
  async getStudentRank(studentId: string, classId: string): Promise<{
    rank: number;
    total: number;
  }> {
    const response: ApiResponse<{
      rank: number;
      total: number;
    }> = await apiService.get(`/dashboard/student/${studentId}/rank`, { classId });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch student rank');
    }
    
    return response.data;
  }

  /**
   * Get average grades for student
   */
  async getAverageGrades(studentId: string): Promise<{
    average: number;
  }> {
    const response: ApiResponse<{
      average: number;
    }> = await apiService.get(`/dashboard/student/${studentId}/grades`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch average grades');
    }
    
    return response.data;
  }
}

export const dashboardService = new DashboardService();