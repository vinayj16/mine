import apiService from './api';

export interface AcademicReason {
  _id: string;
  schoolId: string;
  role: 'Teacher' | 'Student' | 'Staff' | 'Parent';
  reason: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high';
  description?: string;
  status: boolean;
  usageCount?: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAcademicReasonDto {
  role: string;
  reason: string;
  category?: string;
  severity?: string;
  description?: string;
  status?: boolean;
}

export interface UpdateAcademicReasonDto {
  role?: string;
  reason?: string;
  category?: string;
  severity?: string;
  description?: string;
  status?: boolean;
}

export interface AcademicReasonFilters {
  role?: string;
  category?: string;
  severity?: string;
  status?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const academicReasonService = {
  // Get all academic reasons for a school
  getAll: async (schoolId: string, filters?: AcademicReasonFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      
      const queryString = params.toString();
      const url = `/academic-reasons/schools/${schoolId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiService.get<{ success: boolean; data: AcademicReason[]; pagination?: Record<string, unknown> }>(url);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch academic reasons');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching academic reasons:', error);
      throw error;
    }
  },

  // Get academic reason by ID
  getById: async (schoolId: string, reasonId: string) => {
    try {
      const response = await apiService.get<{ success: boolean; data: AcademicReason }>(
        `/academic-reasons/schools/${schoolId}/${reasonId}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch academic reason');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching academic reason:', error);
      throw error;
    }
  },

  // Create new academic reason
  create: async (schoolId: string, data: CreateAcademicReasonDto) => {
    try {
      const response = await apiService.post<{ success: boolean; data: AcademicReason; message: string }>(
        `/academic-reasons/schools/${schoolId}`,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch academic reasons by role');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating academic reason:', error);
      throw error;
    }
  },

  // Update academic reason
  update: async (schoolId: string, reasonId: string, data: UpdateAcademicReasonDto) => {
    try {
      const response = await apiService.put<{ success: boolean; data: AcademicReason; message: string }>(
        `/academic-reasons/schools/${schoolId}/${reasonId}`,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch academic reasons by category');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating academic reason:', error);
      throw error;
    }
  },

  // Delete academic reason
  delete: async (schoolId: string, reasonId: string) => {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        `/academic-reasons/schools/${schoolId}/${reasonId}`
      );
      
      if (!response.success) {
        throw new Error('Failed to delete academic reason');
      }
      
      return response;
    } catch (error) {
      console.error('Error deleting academic reason:', error);
      throw error;
    }
  },

  // Get reasons by role
  getByRole: async (schoolId: string, role: string) => {
    try {
      const response = await apiService.get<{ success: boolean; data: AcademicReason[] }>(
        `/academic-reasons/schools/${schoolId}/role/${role}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to search academic reasons');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching academic reasons by role:', error);
      throw error;
    }
  },

  // Get reasons by category
  getByCategory: async (schoolId: string, category: string) => {
    try {
      const response = await apiService.get<{ success: boolean; data: AcademicReason[] }>(
        `/academic-reasons/schools/${schoolId}/category/${category}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch analytics');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching academic reasons by category:', error);
      throw error;
    }
  },

  // Search academic reasons
  search: async (schoolId: string, query: string) => {
    try {
      const response = await apiService.get<{ success: boolean; data: AcademicReason[] }>(
        `/academic-reasons/schools/${schoolId}/search?q=${encodeURIComponent(query)}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to search academic reasons');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error searching academic reasons:', error);
      throw error;
    }
  },

  // Get analytics
  getAnalytics: async (schoolId: string) => {
    try {
      const response = await apiService.get<{ success: boolean; data: Record<string, unknown> }>(
        `/academic-reasons/schools/${schoolId}/analytics`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch analytics');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  // Increment usage count
  incrementUsage: async (schoolId: string, reasonId: string) => {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `/academic-reasons/schools/${schoolId}/${reasonId}/increment-usage`,
        {}
      );
      
      if (!response.success) {
        throw new Error('Failed to increment usage');
      }
      
      return response;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  }
};

export default academicReasonService;
