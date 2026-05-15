import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

export interface StudentReportParams {
  academic_year?: string;
  term?: string;
  subject?: string;
}

export interface StudentReport {
  _id: string;
  studentId: string;
  studentName: string;
  academicYear: string;
  term?: string;
  attendance: {
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  grades: {
    subject: string;
    grade: string;
    marks: number;
    maxMarks: number;
    percentage: number;
  }[];
  behavior?: {
    rating: string;
    comments: string;
  };
  overallPerformance: {
    average: number;
    rank?: number;
    grade: string;
  };
  generatedAt: string;
}

export interface ReportResponse {
  success: boolean;
  data: StudentReport;
}

export const reportsService = {
  async getStudentReport(studentId: string, params?: StudentReportParams): Promise<ReportResponse> {
    try {
      const response = await apiService.get<ReportResponse>(
        API_ENDPOINTS.REPORTS.STUDENT(studentId),
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch student report');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Reports Service] Failed to fetch student report:', error);
      throw error;
    }
  },
};

export default reportsService;
