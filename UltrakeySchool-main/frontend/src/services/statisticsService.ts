import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

export interface DashboardStatistics {
  students: {
    total: number;
    active: number;
    inactive: number;
  };
  teachers: {
    total: number;
    active: number;
    inactive: number;
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  fees: {
    collected: number;
    pending: number;
    overdue: number;
  };
}

export interface StudentStatistics {
  total: number;
  byGrade: { grade: string; count: number }[];
  byGender: { gender: string; count: number }[];
  enrollmentTrend: { month: string; count: number }[];
}

export interface TeacherStatistics {
  total: number;
  byDepartment: { department: string; count: number }[];
  byQualification: { qualification: string; count: number }[];
  averageExperience: number;
}

export interface AttendanceStatistics {
  overall: {
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  byClass: { class: string; percentage: number }[];
  trend: { date: string; percentage: number }[];
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardStatistics;
}

export interface StudentStatsResponse {
  success: boolean;
  data: StudentStatistics;
}

export interface TeacherStatsResponse {
  success: boolean;
  data: TeacherStatistics;
}

export interface AttendanceStatsResponse {
  success: boolean;
  data: AttendanceStatistics;
}

export const statisticsService = {
  async getDashboard(): Promise<DashboardResponse> {
    try {
      const response = await apiService.get<DashboardResponse>(
        API_ENDPOINTS.STATISTICS.DASHBOARD
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch dashboard statistics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Statistics Service] Failed to fetch dashboard statistics:', error);
      throw error;
    }
  },

  async getStudentStats(params?: Record<string, unknown>): Promise<StudentStatsResponse> {
    try {
      const response = await apiService.get<StudentStatsResponse>(
        API_ENDPOINTS.STATISTICS.STUDENTS,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch student statistics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Statistics Service] Failed to fetch student statistics:', error);
      throw error;
    }
  },

  async getTeacherStats(params?: Record<string, unknown>): Promise<TeacherStatsResponse> {
    try {
      const response = await apiService.get<TeacherStatsResponse>(
        API_ENDPOINTS.STATISTICS.TEACHERS,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch teacher statistics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Statistics Service] Failed to fetch teacher statistics:', error);
      throw error;
    }
  },

  async getAttendanceStats(params?: Record<string, unknown>): Promise<AttendanceStatsResponse> {
    try {
      const response = await apiService.get<AttendanceStatsResponse>(
        API_ENDPOINTS.STATISTICS.ATTENDANCE,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch attendance statistics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Statistics Service] Failed to fetch attendance statistics:', error);
      throw error;
    }
  },
};

export default statisticsService;
