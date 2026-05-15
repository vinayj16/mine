import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

// Types
export interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  qualification: string;
  experience: number;
  joinDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'on_leave';
  subjects: string[];
  classes: string[];
  photo?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  qualification: string;
  experience: number;
  joinDate: string;
  salary: number;
  subjects: string[];
  classes: string[];
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface UpdateTeacherInput extends Partial<CreateTeacherInput> {
  status?: 'active' | 'inactive' | 'on_leave';
}

export interface TeacherFilters {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  designation?: string;
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

// API Functions
export const teacherService = {
  // Get all teachers with pagination and filters
  async getAll(filters: TeacherFilters = {}): Promise<PaginatedResponse<Teacher>> {
    try {
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 10,
        ...(filters.search && { search: filters.search }),
        ...(filters.department && { department: filters.department }),
        ...(filters.designation && { designation: filters.designation }),
        ...(filters.status && { status: filters.status }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      };

      const response = await apiService.get<PaginatedResponse<Teacher>>(
        API_ENDPOINTS.TEACHERS.LIST,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch teachers');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Teacher Service] Failed to fetch teachers:', error);
      throw error;
    }
  },

  // Get single teacher by ID
  async getById(id: string): Promise<Teacher> {
    try {
      const response = await apiService.get<Teacher>(
        API_ENDPOINTS.TEACHERS.DETAIL(id)
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch teacher');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Teacher Service] Failed to fetch teacher:', error);
      throw error;
    }
  },

  // Create new teacher
  async create(data: CreateTeacherInput): Promise<Teacher> {
    try {
      const response = await apiService.post<Teacher>(
        API_ENDPOINTS.TEACHERS.CREATE,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create teacher');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Teacher Service] Failed to create teacher:', error);
      throw error;
    }
  },

  // Update existing teacher
  async update(id: string, data: UpdateTeacherInput): Promise<Teacher> {
    try {
      const response = await apiService.put<Teacher>(
        API_ENDPOINTS.TEACHERS.UPDATE(id),
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update teacher');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Teacher Service] Failed to update teacher:', error);
      throw error;
    }
  },

  // Delete teacher
  async delete(id: string): Promise<void> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        API_ENDPOINTS.TEACHERS.DELETE(id)
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete teacher');
      }
    } catch (error) {
      console.error('[Teacher Service] Failed to delete teacher:', error);
      throw error;
    }
  },

  // Search teachers
  async search(query: string): Promise<Teacher[]> {
    try {
      const response = await apiService.get<Teacher[]>(
        API_ENDPOINTS.TEACHERS.LIST,
        { search: query }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to search teachers');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Teacher Service] Failed to search teachers:', error);
      throw error;
    }
  },

  // Get teachers by department
  async getByDepartment(department: string): Promise<Teacher[]> {
    try {
      const response = await apiService.get<Teacher[]>(
        `${API_ENDPOINTS.TEACHERS.LIST}/department/${department}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch teachers by department');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Teacher Service] Failed to fetch teachers by department:', error);
      throw error;
    }
  },

  // Get teacher's classes
  async getClasses(id: string): Promise<Record<string, unknown>[]> {
    try {
      const response = await apiService.get<Record<string, unknown>[]>(
        `${API_ENDPOINTS.TEACHERS.DETAIL(id)}/classes`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch teacher classes');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Teacher Service] Failed to fetch teacher classes:', error);
      throw error;
    }
  },

  // Get teacher's subjects
  async getSubjects(id: string): Promise<Record<string, unknown>[]> {
    try {
      const response = await apiService.get<Record<string, unknown>[]>(
        `${API_ENDPOINTS.TEACHERS.DETAIL(id)}/subjects`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch teacher subjects');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Teacher Service] Failed to fetch teacher subjects:', error);
      throw error;
    }
  },

  // Get teacher's timetable
  async getTimetable(id: string): Promise<Record<string, unknown>[]> {
    try {
      const response = await apiService.get<Record<string, unknown>[]>(
        `${API_ENDPOINTS.TEACHERS.DETAIL(id)}/timetable`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch teacher timetable');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Teacher Service] Failed to fetch teacher timetable:', error);
      throw error;
    }
  },

  // Get teacher's leaves
  async getLeaves(id: string): Promise<Record<string, unknown>[]> {
    try {
      const response = await apiService.get<Record<string, unknown>[]>(
        `${API_ENDPOINTS.TEACHERS.DETAIL(id)}/leaves`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch teacher leaves');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Teacher Service] Failed to fetch teacher leaves:', error);
      throw error;
    }
  },

  // Apply for leave
  async applyLeave(id: string, leaveData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await apiService.post<Record<string, unknown>>(
        `${API_ENDPOINTS.TEACHERS.DETAIL(id)}/leaves`,
        leaveData
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to apply for leave');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Teacher Service] Failed to apply for leave:', error);
      throw error;
    }
  },

  // Get teacher statistics
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
    byDepartment: { department: string; count: number }[];
  }> {
    try {
      const response = await apiService.get<{
        total: number;
        active: number;
        inactive: number;
        onLeave: number;
        byDepartment: { department: string; count: number }[];
      }>(`${API_ENDPOINTS.TEACHERS.LIST}/statistics`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch teacher statistics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Teacher Service] Failed to fetch teacher statistics:', error);
      throw error;
    }
  },
};

export default teacherService;
