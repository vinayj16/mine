import apiService, { type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

// Types
export interface Class {
  id?: string;
  _id?: string;
  classId?: string;
  name: string;
  section: string;
  classTeacher?: string;
  totalStudents?: number;
  students?: number;
  subjects?: string[];
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  academicYear?: string;
  institutionId?: string;
  institution?: string;
}

export interface CreateClassInput {
  name: string;
  section: string;
  classTeacher: string;
  subjects: string[];
}

export interface UpdateClassInput extends Partial<CreateClassInput> {}

export interface ClassFilters {
  page?: number;
  limit?: number;
  search?: string;
  classTeacher?: string;
  institutionId?: string;
  institutionCode?: string;
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

export interface ClassStatistics {
  total: number;
  byTeacher: { teacher: string; count: number }[];
  averageStudents: number;
}

// API Functions
export const classService = {
  // Get all classes with pagination and filters
  async getAll(filters: ClassFilters = {}): Promise<PaginatedResponse<Class>> {
    const params: Record<string, string> = {
      page: String(filters.page || 1),
      limit: String(filters.limit || 10),
    };
    
    if (filters.search) params.search = filters.search;
    if (filters.classTeacher) params.classTeacher = filters.classTeacher;
    if (filters.institutionId) params.institutionId = filters.institutionId;
    if (filters.institutionCode) params.institutionCode = filters.institutionCode;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const response: ApiResponse<PaginatedResponse<Class>> = await apiService.get(
      API_ENDPOINTS.CLASSES.LIST,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch classes');
    }
    
    return response.data;
  },

  // Get single class by ID
  async getById(id: string): Promise<Class> {
    const response: ApiResponse<Class> = await apiService.get(
      API_ENDPOINTS.CLASSES.DETAIL(id)
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch class');
    }
    
    return response.data;
  },

  // Create new class
  async create(data: CreateClassInput): Promise<Class> {
    const response: ApiResponse<Class> = await apiService.post(
      API_ENDPOINTS.CLASSES.CREATE,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create class');
    }
    
    return response.data;
  },

  // Update existing class
  async update(id: string, data: UpdateClassInput): Promise<Class> {
    const response: ApiResponse<Class> = await apiService.put(
      API_ENDPOINTS.CLASSES.UPDATE(id),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update class');
    }
    
    return response.data;
  },

  // Delete class
  async delete(id: string): Promise<void> {
    const response: ApiResponse<void> = await apiService.delete(
      API_ENDPOINTS.CLASSES.DELETE(id)
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete class');
    }
  },

  // Bulk delete classes
  async bulkDelete(ids: string[]): Promise<void> {
    const response: ApiResponse<void> = await apiService.post(
      `${API_ENDPOINTS.CLASSES.LIST}/bulk-delete`,
      { ids }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to bulk delete classes');
    }
  },

  // Search classes
  async search(query: string): Promise<Class[]> {
    const response: ApiResponse<Class[]> = await apiService.get(
      API_ENDPOINTS.CLASSES.LIST,
      { search: query }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to search classes');
    }
    
    return response.data;
  },

  // Get classes by teacher
  async getByTeacher(teacherId: string): Promise<Class[]> {
    const response: ApiResponse<Class[]> = await apiService.get(
      `${API_ENDPOINTS.CLASSES.LIST}/teacher/${teacherId}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch teacher classes');
    }
    
    return response.data;
  },

  // Get class students
  async getStudents(id: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `${API_ENDPOINTS.CLASSES.DETAIL(id)}/students`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch class students');
    }
    
    return response.data;
  },

  // Get class subjects
  async getSubjects(id: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `${API_ENDPOINTS.CLASSES.DETAIL(id)}/subjects`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch class subjects');
    }
    
    return response.data;
  },

  // Get class timetable
  async getTimetable(id: string): Promise<Record<string, unknown>[]> {
    const response: ApiResponse<Record<string, unknown>[]> = await apiService.get(
      `${API_ENDPOINTS.CLASSES.DETAIL(id)}/timetable`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch class timetable');
    }
    
    return response.data;
  },

  // Export classes to CSV
  async exportCSV(filters: ClassFilters = {}): Promise<Blob> {
    const params: Record<string, string> = { format: 'csv' };
    
    if (filters.search) params.search = filters.search;
    if (filters.classTeacher) params.classTeacher = filters.classTeacher;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;
    
    const response: ApiResponse<Blob> = await apiService.get(
      `${API_ENDPOINTS.CLASSES.LIST}/export`,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to export CSV');
    }
    
    return response.data;
  },

  // Export classes to PDF
  async exportPDF(filters: ClassFilters = {}): Promise<Blob> {
    const params: Record<string, string> = { format: 'pdf' };
    
    if (filters.search) params.search = filters.search;
    if (filters.classTeacher) params.classTeacher = filters.classTeacher;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;
    
    const response: ApiResponse<Blob> = await apiService.get(
      `${API_ENDPOINTS.CLASSES.LIST}/export`,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to export PDF');
    }
    
    return response.data;
  },

  // Get class statistics
  async getStatistics(): Promise<ClassStatistics> {
    const response: ApiResponse<ClassStatistics> = await apiService.get(
      `${API_ENDPOINTS.CLASSES.LIST}/statistics`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch statistics');
    }
    
    return response.data;
  },
};

export default classService;
