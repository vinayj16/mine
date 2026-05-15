import { apiClient } from '../api/client';

interface AdminAnalyticsResponse {
  success: boolean;
  data: {
    admissions: any;
    attendance: any;
    fees: any;
    staff: any;
    complaints: any;
  };
}

interface SectionAnalyticsResponse {
  success: boolean;
  data: any;
}

interface ReminderResponse {
  success: boolean;
  message: string;
}

class AdminAnalyticsService {
  /**
   * Get comprehensive admin analytics dashboard data
   */
  async getAdminAnalytics(period: string = 'month'): Promise<AdminAnalyticsResponse> {
    const response = await apiClient.get(`/analytics/admin/dashboard?period=${period}`);
    return response.data as AdminAnalyticsResponse;
  }

  /**
   * Get admissions analytics only
   */
  async getAdmissionsAnalytics(period: string = 'month'): Promise<SectionAnalyticsResponse> {
    const response = await apiClient.get(`/analytics/admin/admissions?period=${period}`);
    return response.data as SectionAnalyticsResponse;
  }

  /**
   * Get attendance analytics only
   */
  async getAttendanceAnalytics(period: string = 'month'): Promise<SectionAnalyticsResponse> {
    const response = await apiClient.get(`/analytics/admin/attendance?period=${period}`);
    return response.data as SectionAnalyticsResponse;
  }

  /**
   * Get fees analytics only
   */
  async getFeesAnalytics(period: string = 'month'): Promise<SectionAnalyticsResponse> {
    const response = await apiClient.get(`/analytics/admin/fees?period=${period}`);
    return response.data as SectionAnalyticsResponse;
  }

  /**
   * Get staff analytics only
   */
  async getStaffAnalytics(period: string = 'month'): Promise<SectionAnalyticsResponse> {
    const response = await apiClient.get(`/analytics/admin/staff?period=${period}`);
    return response.data as SectionAnalyticsResponse;
  }

  /**
   * Get complaints analytics only
   */
  async getComplaintsAnalytics(period: string = 'month'): Promise<SectionAnalyticsResponse> {
    const response = await apiClient.get(`/analytics/admin/complaints?period=${period}`);
    return response.data as SectionAnalyticsResponse;
  }

  /**
   * Send fee reminders to overdue students
   */
  async sendFeeReminders(studentIds?: string[]): Promise<ReminderResponse> {
    const response = await apiClient.post('/analytics/admin/fees/send-reminders', { studentIds });
    return response.data as ReminderResponse;
  }
}

export default new AdminAnalyticsService();

