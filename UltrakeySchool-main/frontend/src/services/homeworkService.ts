import apiService, { type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Homework {
  _id: string;
  id: string;
  title: string;
  description: string;
  subject: string;
  subjectName?: string;
  classId: string;
  className?: string;
  teacherId: string;
  teacherName?: string;
  dueDate: string;
  assignedDate: string;
  totalMarks?: number;
  attachments?: string[];
  status: 'assigned' | 'submitted' | 'graded' | 'overdue';
  institutionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName?: string;
  submittedDate: string;
  attachments?: string[];
  notes?: string;
  marksObtained?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late' | 'rejected';
  gradedBy?: string;
  gradedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHomeworkInput {
  title: string;
  description: string;
  subject: string;
  classId: string;
  dueDate: string;
  assignedDate?: string;
  totalMarks?: number;
  attachments?: string[];
}

export interface UpdateHomeworkInput extends Partial<CreateHomeworkInput> {
  status?: 'assigned' | 'submitted' | 'graded' | 'overdue';
}

export interface SubmitHomeworkInput {
  notes?: string;
  attachments?: File[];
}

export interface HomeworkFilters {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  subject?: string;
  teacherId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  institutionId?: string;
}

export interface PaginatedHomeworkResponse {
  homeworks?: Homework[];
  homeWorks?: Homework[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const homeworkService = {
  async getAll(params?: HomeworkFilters): Promise<PaginatedHomeworkResponse> {
    const queryParams: Record<string, string> = {};
    
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.search) queryParams.search = params.search;
    if (params?.classId) queryParams.classId = params.classId;
    if (params?.subject) queryParams.subjectId = params.subject;
    if (params?.teacherId) queryParams.teacherId = params.teacherId;
    if (params?.status) queryParams.status = params.status;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;
    if (params?.institutionId) queryParams.institutionId = params.institutionId;
    
    const response: ApiResponse<any> = await apiService.get(
      API_ENDPOINTS.HOMEWORK.LIST,
      queryParams
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch homework');
    }
    
    const data = response.data;
    return {
      homeworks: data.homeWorks || data.homeworks || [],
      total: data.total || data.pagination?.total || 0,
      page: data.page || data.pagination?.page || 1,
      limit: data.limit || data.pagination?.limit || 20,
      totalPages: data.totalPages || data.pagination?.pages || 0
    };
  },

  async getById(id: string): Promise<Homework> {
    const response: ApiResponse<Homework> = await apiService.get(
      API_ENDPOINTS.HOMEWORK.DETAIL(id)
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch homework');
    }
    
    return response.data;
  },

  async create(data: CreateHomeworkInput): Promise<Homework> {
    const { subject, ...rest } = data;
    const response: ApiResponse<Homework> = await apiService.post(
      API_ENDPOINTS.HOMEWORK.CREATE,
      { ...rest, subjectId: subject }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create homework');
    }
    
    return response.data;
  },

  async update(id: string, data: UpdateHomeworkInput): Promise<Homework> {
    const { subject, ...rest } = data;
    const response: ApiResponse<Homework> = await apiService.put(
      API_ENDPOINTS.HOMEWORK.UPDATE(id),
      { ...rest, subjectId: subject }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update homework');
    }
    
    return response.data;
  },

  async delete(id: string): Promise<void> {
    const response: ApiResponse<void> = await apiService.delete(
      API_ENDPOINTS.HOMEWORK.DELETE(id)
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete homework');
    }
  },

  async submit(homeworkId: string, formData: FormData): Promise<HomeworkSubmission> {
    // Note: For FormData uploads, we need to use fetch directly or handle multipart/form-data
    // The apiService.post method will handle this automatically
    const response: ApiResponse<HomeworkSubmission> = await apiService.post(
      API_ENDPOINTS.HOMEWORK.SUBMIT(homeworkId),
      formData
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to submit homework');
    }
    
    return response.data;
  },
};

export default homeworkService;
