import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

// Types
export interface Subject {
  _id: string;
  name: string;
  code: string;
  description: string;
  class: string;
  teacher: string;
  credits: number;
  semester: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectInput {
  institutionId: string | undefined;
  name: string;
  code: string;
  description: string;
  class: string;
  teacher: string;
  credits: number;
  semester: string;
  schoolId?: string;
  department?: string;
}

export interface UpdateSubjectInput extends Partial<CreateSubjectInput> {
  isActive?: boolean;
}

export interface SubjectFilters {
  institutionId: string | undefined;
  page?: number;
  limit?: number;
  search?: string;
  class?: string;
  teacher?: string;
  semester?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  schoolId?: string;
}

export interface PaginatedResponse<T> {
  subjects?: T[];
  data?: T[] | { subjects: T[] };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// API Functions
export const subjectService = {
  // Get all subjects with pagination and filters
  async getAll(filters: SubjectFilters = {
    institutionId: undefined
  }): Promise<PaginatedResponse<Subject>> {
    try {
      // Get schoolId from localStorage if not provided
      const schoolId = filters.schoolId || filters.institutionId || localStorage.getItem('schoolId') || localStorage.getItem('institutionId') || '';
      
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 100,
        ...(schoolId && { schoolId }),
        ...(filters.institutionId && { institutionId: filters.institutionId }),
        ...(filters.search && { search: filters.search }),
        ...(filters.class && { class: filters.class }),
        ...(filters.teacher && { teacher: filters.teacher }),
        ...(filters.semester && { semester: filters.semester }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      };

      const response = await apiService.get<any>(
        API_ENDPOINTS.SUBJECTS.LIST,
        params
      );
      
      console.log('[Subject Service] Raw response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch subjects');
      }
      
      // Handle both { data: { subjects: [...] } } and { data: subjects: [...] } formats
      let subjects: Subject[] = [];
      let total = 0;
      
      if (response.data?.subjects && Array.isArray(response.data.subjects)) {
        subjects = response.data.subjects;
        total = response.data.total || subjects.length;
      } else if (Array.isArray(response.data)) {
        subjects = response.data;
        total = subjects.length;
      }
      
      return {
        subjects,
        total,
        page: response.data?.page || 1,
        limit: response.data?.limit || 100,
        totalPages: response.data?.totalPages || Math.ceil(total / (response.data?.limit || 100))
      };
    } catch (error) {
      console.error('[Subject Service] Failed to fetch subjects:', error);
      throw error;
    }
  },

  // Get single subject by ID
  async getById(id: string): Promise<Subject> {
    try {
      const response = await apiService.get<Subject>(
        API_ENDPOINTS.SUBJECTS.DETAIL(id)
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch subject');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to fetch subject:', error);
      throw error;
    }
  },

  // Create new subject
  async create(data: CreateSubjectInput): Promise<Subject> {
    try {
      // Get schoolId from data or localStorage
      const schoolId = data.schoolId || data.institutionId || localStorage.getItem('schoolId') || localStorage.getItem('institutionId') || '';
      
      const response = await apiService.post<Subject>(
        API_ENDPOINTS.SUBJECTS.CREATE(schoolId),
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create subject');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to create subject:', error);
      throw error;
    }
  },

  // Update existing subject
  async update(id: string, data: UpdateSubjectInput): Promise<Subject> {
    try {
      // Get schoolId from localStorage or use default
      const schoolId = localStorage.getItem('schoolId') || localStorage.getItem('institutionId') || '';
      
      const response = await apiService.put<Subject>(
        API_ENDPOINTS.SUBJECTS.UPDATE(schoolId ? `${schoolId}/${id}` : id),
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update subject');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to update subject:', error);
      throw error;
    }
  },

  // Delete subject
  async delete(id: string): Promise<void> {
    try {
      // Get schoolId from localStorage or use default
      const schoolId = localStorage.getItem('schoolId') || localStorage.getItem('institutionId') || '';
      
      const response = await apiService.delete<{ success: boolean; message: string }>(
        API_ENDPOINTS.SUBJECTS.DELETE(schoolId ? `${schoolId}/${id}` : id)
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete subject');
      }
    } catch (error) {
      console.error('[Subject Service] Failed to delete subject:', error);
      throw error;
    }
  },

  // Bulk delete subjects
  async bulkDelete(ids: string[]): Promise<void> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `${API_ENDPOINTS.SUBJECTS.LIST}/bulk-delete`,
        { ids }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to bulk delete subjects');
      }
    } catch (error) {
      console.error('[Subject Service] Failed to bulk delete subjects:', error);
      throw error;
    }
  },

  // Search subjects
  async search(query: string): Promise<Subject[]> {
    try {
      const response = await apiService.get<Subject[]>(
        API_ENDPOINTS.SUBJECTS.LIST,
        { search: query }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to search subjects');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to search subjects:', error);
      throw error;
    }
  },

  // Get subjects by class
  async getByClass(classId: string): Promise<Subject[]> {
    try {
      const response = await apiService.get<Subject[]>(
        `${API_ENDPOINTS.SUBJECTS.LIST}/class/${classId}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch subjects by class');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to fetch subjects by class:', error);
      throw error;
    }
  },

  // Get subjects by teacher
  async getByTeacher(teacherId: string): Promise<Subject[]> {
    try {
      const response = await apiService.get<Subject[]>(
        `${API_ENDPOINTS.SUBJECTS.LIST}/teacher/${teacherId}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch subjects by teacher');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to fetch subjects by teacher:', error);
      throw error;
    }
  },

  // Get subjects by semester
  async getBySemester(semester: string): Promise<Subject[]> {
    try {
      const response = await apiService.get<Subject[]>(
        `${API_ENDPOINTS.SUBJECTS.LIST}/semester/${semester}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch subjects by semester');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to fetch subjects by semester:', error);
      throw error;
    }
  },

  // Get subject assignments
  async getAssignments(subjectId: string): Promise<Record<string, unknown>[]> {
    try {
      const response = await apiService.get<Record<string, unknown>[]>(
        `${API_ENDPOINTS.SUBJECTS.DETAIL(subjectId)}/assignments`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch subject assignments');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to fetch subject assignments:', error);
      throw error;
    }
  },

  // Get subject exams
  async getExams(subjectId: string): Promise<Record<string, unknown>[]> {
    try {
      const response = await apiService.get<Record<string, unknown>[]>(
        `${API_ENDPOINTS.SUBJECTS.DETAIL(subjectId)}/exams`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch subject exams');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to fetch subject exams:', error);
      throw error;
    }
  },

  // Get subject materials
  async getMaterials(subjectId: string): Promise<Record<string, unknown>[]> {
    try {
      const response = await apiService.get<Record<string, unknown>[]>(
        `${API_ENDPOINTS.SUBJECTS.DETAIL(subjectId)}/materials`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch subject materials');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to fetch subject materials:', error);
      throw error;
    }
  },

  // Activate/deactivate subject
  async toggleActive(subjectId: string, isActive: boolean): Promise<Subject> {
    try {
      const response = await apiService.patch<Subject>(
        `${API_ENDPOINTS.SUBJECTS.DETAIL(subjectId)}/active`,
        { isActive }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to toggle subject active status');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to toggle subject active status:', error);
      throw error;
    }
  },

  // Export subjects to CSV
  async exportCSV(filters: SubjectFilters = {
    institutionId: undefined
  }): Promise<Blob> {
    try {
      const params = { ...filters, format: 'csv' };
      const response = await apiService.get<Blob>(
        `${API_ENDPOINTS.SUBJECTS.LIST}/export`,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to export subjects as CSV');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to export subjects as CSV:', error);
      throw error;
    }
  },

  // Export subjects to PDF
  async exportPDF(filters: SubjectFilters = {
    institutionId: undefined
  }): Promise<Blob> {
    try {
      const params = { ...filters, format: 'pdf' };
      const response = await apiService.get<Blob>(
        `${API_ENDPOINTS.SUBJECTS.LIST}/export`,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to export subjects as PDF');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to export subjects as PDF:', error);
      throw error;
    }
  },

  // Get subject statistics
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byClass: { class: string; count: number }[];
    byTeacher: { teacher: string; count: number }[];
  }> {
    try {
      const response = await apiService.get<{
        total: number;
        active: number;
        inactive: number;
        byClass: { class: string; count: number }[];
        byTeacher: { teacher: string; count: number }[];
      }>(`${API_ENDPOINTS.SUBJECTS.LIST}/statistics`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch subject statistics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Subject Service] Failed to fetch subject statistics:', error);
      throw error;
    }
  },
};

export default subjectService;
