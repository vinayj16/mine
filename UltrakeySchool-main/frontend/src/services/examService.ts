import apiService, { type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

// Types
export interface Exam {
  id: string;
  name: string;
  subject: string;
  class: string;
  date: string;
  duration: number;
  totalMarks: number;
  startTime: string;
  endTime: string;
  examType: 'mid_term' | 'final' | 'practical' | 'assignment';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamInput {
  name: string;
  subject: string;
  class: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  examType: 'mid_term' | 'final' | 'practical' | 'assignment';
}

export interface UpdateExamInput extends Partial<CreateExamInput> {
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ExamFilters {
  page?: number;
  limit?: number;
  search?: string;
  class?: string;
  subject?: string;
  examType?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExamStatistics {
  total: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  upcomingExams: number;
}

// API Functions
export const examService = {
  // Get all exams with pagination and filters
  async getAll(filters: ExamFilters = {}): Promise<PaginatedResponse<Exam>> {
    const params: Record<string, string> = {
      page: String(filters.page || 1),
      limit: String(filters.limit || 10),
    };
    
    if (filters.search) params.search = filters.search;
    if (filters.class) params.class = filters.class;
    if (filters.subject) params.subject = filters.subject;
    if (filters.examType) params.examType = filters.examType;
    if (filters.status) params.status = filters.status;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const response: ApiResponse<PaginatedResponse<Exam>> = await apiService.get(
      API_ENDPOINTS.EXAMS.LIST,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exams');
    }
    
    return response.data;
  },

  // Get single exam by ID
  async getById(id: string): Promise<Exam> {
    const response: ApiResponse<Exam> = await apiService.get(
      API_ENDPOINTS.EXAMS.DETAIL(id)
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exam');
    }
    
    return response.data;
  },

  // Create new exam
  async create(data: CreateExamInput): Promise<Exam> {
    const response: ApiResponse<Exam> = await apiService.post(
      API_ENDPOINTS.EXAMS.CREATE,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create exam');
    }
    
    return response.data;
  },

  // Update existing exam
  async update(id: string, data: UpdateExamInput): Promise<Exam> {
    const response: ApiResponse<Exam> = await apiService.put(
      API_ENDPOINTS.EXAMS.UPDATE(id),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update exam');
    }
    
    return response.data;
  },

  // Delete exam
  async delete(id: string): Promise<void> {
    const response: ApiResponse<void> = await apiService.delete(
      API_ENDPOINTS.EXAMS.DELETE(id)
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete exam');
    }
  },

  // Bulk delete exams
  async bulkDelete(ids: string[]): Promise<void> {
    const response: ApiResponse<void> = await apiService.post(
      `${API_ENDPOINTS.EXAMS.LIST}/bulk-delete`,
      { ids }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to bulk delete exams');
    }
  },

  // Search exams
  async search(query: string): Promise<Exam[]> {
    const response: ApiResponse<Exam[]> = await apiService.get(
      API_ENDPOINTS.EXAMS.LIST,
      { search: query }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to search exams');
    }
    
    return response.data;
  },

  // Get exams by class
  async getByClass(classId: string): Promise<Exam[]> {
    const response: ApiResponse<Exam[]> = await apiService.get(
      `${API_ENDPOINTS.EXAMS.LIST}/class/${classId}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exams by class');
    }
    
    return response.data;
  },

  // Get exams by subject
  async getBySubject(subjectId: string): Promise<Exam[]> {
    const response: ApiResponse<Exam[]> = await apiService.get(
      `${API_ENDPOINTS.EXAMS.LIST}/subject/${subjectId}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exams by subject');
    }
    
    return response.data;
  },

  // Get exam schedules
  async getSchedules(params?: Record<string, string>): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      API_ENDPOINTS.EXAMS.SCHEDULES,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exam schedules');
    }
    
    return response.data;
  },

  // Get exam results
  async getResults(examId: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `${API_ENDPOINTS.EXAMS.DETAIL(examId)}/results`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exam results');
    }
    
    return response.data;
  },

  // Get exam attendance
  async getAttendance(examId: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `${API_ENDPOINTS.EXAMS.DETAIL(examId)}/attendance`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exam attendance');
    }
    
    return response.data;
  },

  // Update exam status
  async updateStatus(examId: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'): Promise<Exam> {
    const response: ApiResponse<Exam> = await apiService.patch(
      `${API_ENDPOINTS.EXAMS.DETAIL(examId)}/status`,
      { status }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update exam status');
    }
    
    return response.data;
  },

  // Export exams to CSV
  async exportCSV(filters: ExamFilters = {}): Promise<Blob> {
    const params: Record<string, string> = { format: 'csv' };
    
    if (filters.search) params.search = filters.search;
    if (filters.class) params.class = filters.class;
    if (filters.subject) params.subject = filters.subject;
    if (filters.examType) params.examType = filters.examType;
    if (filters.status) params.status = filters.status;
    
    const response: ApiResponse<Blob> = await apiService.get(
      `${API_ENDPOINTS.EXAMS.LIST}/export`,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to export exams to CSV');
    }
    
    return response.data;
  },

  // Export exams to PDF
  async exportPDF(filters: ExamFilters = {}): Promise<Blob> {
    const params: Record<string, string> = { format: 'pdf' };
    
    if (filters.search) params.search = filters.search;
    if (filters.class) params.class = filters.class;
    if (filters.subject) params.subject = filters.subject;
    if (filters.examType) params.examType = filters.examType;
    if (filters.status) params.status = filters.status;
    
    const response: ApiResponse<Blob> = await apiService.get(
      `${API_ENDPOINTS.EXAMS.LIST}/export`,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to export exams to PDF');
    }
    
    return response.data;
  },

  // Get exam statistics
  async getStatistics(): Promise<ExamStatistics> {
    const response: ApiResponse<ExamStatistics> = await apiService.get(
      `${API_ENDPOINTS.EXAMS.LIST}/statistics`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exam statistics');
    }
    
    return response.data;
  },
};

export default examService;
