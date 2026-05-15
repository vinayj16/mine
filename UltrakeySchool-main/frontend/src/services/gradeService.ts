import apiService, { type ApiResponse } from './api';

export interface Grade {
  id: string;
  gradeId?: string;
  grade: string;
  marksFrom: number;
  marksTo: number;
  points: number;
  percentage: string;
  status: 'Active' | 'Inactive';
  description?: string;
  institutionId?: string;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGradeInput {
  grade: string;
  marksFrom: number;
  marksTo: number;
  points: number;
  status: 'Active' | 'Inactive';
  description?: string;
  institutionId?: string;
  displayOrder?: number;
}

export interface UpdateGradeInput extends Partial<CreateGradeInput> {}

export interface GradeFilters {
  page?: number;
  limit?: number;
  search?: string;
  institutionId?: string;
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

export const gradeService = {
  async getAll(filters: GradeFilters = {}): Promise<PaginatedResponse<Grade>> {
    const params: Record<string, string> = {
      page: String(filters.page || 1),
      limit: String(filters.limit || 10),
    };
    
    if (filters.search) params.search = filters.search;
    if (filters.institutionId) params.institutionId = filters.institutionId;
    if (filters.status) params.status = filters.status;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const response: ApiResponse<PaginatedResponse<Grade>> = await apiService.get(
      'grades',
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch grades');
    }
    
    return response.data;
  },

  async getById(id: string): Promise<Grade> {
    const response: ApiResponse<Grade> = await apiService.get(`grades/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch grade');
    }
    
    return response.data;
  },

  async create(data: CreateGradeInput): Promise<Grade> {
    const gradeData = {
      ...data,
      percentage: `${data.marksFrom}% - ${data.marksTo}%`
    };

    const response: ApiResponse<Grade> = await apiService.post('grades', gradeData);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create grade');
    }
    
    return response.data;
  },

  async update(id: string, data: UpdateGradeInput): Promise<Grade> {
    const gradeData = data.marksFrom && data.marksTo 
      ? { ...data, percentage: `${data.marksFrom}% - ${data.marksTo}%` }
      : data;

    const response: ApiResponse<Grade> = await apiService.put(`grades/${id}`, gradeData);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update grade');
    }
    
    return response.data;
  },

  async delete(id: string): Promise<void> {
    const response: ApiResponse<void> = await apiService.delete(`grades/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete grade');
    }
  },

  async getByMarks(marks: number, institutionId?: string): Promise<Grade | null> {
    const params: Record<string, string> = { marks: String(marks) };
    if (institutionId) params.institutionId = institutionId;

    const response: ApiResponse<Grade> = await apiService.get('/grades/by-marks', params);
    
    if (!response.success) {
      return null;
    }
    
    return response.data || null;
  },

  async getStatistics(institutionId?: string): Promise<any> {
    const params: Record<string, string> = {};
    if (institutionId) params.institutionId = institutionId;

    const response: ApiResponse<any> = await apiService.get('/grades/statistics', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch grade statistics');
    }
    
    return response.data;
  },
};

export default gradeService;
