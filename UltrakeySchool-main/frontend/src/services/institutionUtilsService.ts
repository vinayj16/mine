import apiService from './api';
import type { InstitutionAPIType, InstitutionRouteType } from '../utils/institutionUtils';
import { routeTypeToAPIType } from '../utils/institutionUtils';

export interface Institution {
  _id: string;
  name: string;
  shortName?: string;
  type: InstitutionAPIType;
  category: string;
  accreditation?: string[];
  established: number;
  description?: string;
  contact: {
    email: string;
    phone: string;
    alternatePhone?: string;
    website?: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  principalName: string;
  principalEmail: string;
  principalPhone: string;
  subscription: {
    planId: 'basic' | 'medium' | 'premium';
    planName: string;
    status: 'active' | 'expired' | 'cancelled' | 'suspended' | 'trial';
    startDate: string;
    endDate: string;
    monthlyCost: number;
  };
  features: {
    maxUsers: number;
    maxStudents: number;
    maxTeachers: number;
    storageLimit: number;
  };
  analytics?: {
    totalStudents: number;
    totalTeachers: number;
    totalStaff: number;
    activeUsers: number;
  };
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionFilters {
  type?: InstitutionAPIType;
  category?: string;
  status?: string;
  subscriptionStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InstitutionListResponse {
  success: boolean;
  data: Institution[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InstitutionResponse {
  success: boolean;
  data: Institution;
}

const institutionUtilsService = {
  /**
   * Get all institutions with optional filters
   * @param filters - Filter options
   * @returns List of institutions
   */
  async getInstitutions(filters?: InstitutionFilters): Promise<InstitutionListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.type) params.append('type', filters.type);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.subscriptionStatus) params.append('subscriptionStatus', filters.subscriptionStatus);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiService.get<InstitutionListResponse>(`/institutions/working?${params.toString()}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch institutions');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to fetch institutions:', error);
      throw error;
    }
  },

  /**
   * Get institutions by route type (converts to API type)
   * @param routeType - Frontend route type
   * @param filters - Additional filters
   * @returns List of institutions
   */
  async getInstitutionsByRouteType(
    routeType: InstitutionRouteType,
    filters?: Omit<InstitutionFilters, 'type'>
  ): Promise<InstitutionListResponse> {
    const apiType = routeTypeToAPIType(routeType);
    return this.getInstitutions({ ...filters, type: apiType });
  },

  /**
   * Get single institution by ID
   * @param id - Institution ID
   * @returns Institution details
   */
  async getInstitutionById(id: string): Promise<InstitutionResponse> {
    try {
      const response = await apiService.get<InstitutionResponse>(`/institutions/working/${id}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch institution');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to fetch institution:', error);
      throw error;
    }
  },

  /**
   * Create new institution
   * @param data - Institution data
   * @returns Created institution
   */
  async createInstitution(data: Partial<Institution>): Promise<InstitutionResponse> {
    try {
      const response = await apiService.post<InstitutionResponse>('/institutions/working', data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create institution');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to create institution:', error);
      throw error;
    }
  },

  /**
   * Update institution
   * @param id - Institution ID
   * @param data - Updated data
   * @returns Updated institution
   */
  async updateInstitution(id: string, data: Partial<Institution>): Promise<InstitutionResponse> {
    try {
      const response = await apiService.put<InstitutionResponse>(`/institutions/working/${id}`, data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update institution');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to update institution:', error);
      throw error;
    }
  },

  /**
   * Delete institution
   * @param id - Institution ID
   * @returns Success response
   */
  async deleteInstitution(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(`/institutions/working/${id}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete institution');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to delete institution:', error);
      throw error;
    }
  },

  /**
   * Search institutions
   * @param query - Search query
   * @param filters - Additional filters
   * @returns Search results
   */
  async searchInstitutions(
    query: string,
    filters?: Omit<InstitutionFilters, 'search'>
  ): Promise<InstitutionListResponse> {
    return this.getInstitutions({ ...filters, search: query });
  },

  /**
   * Get institutions by type (API type)
   * @param type - Institution API type
   * @returns List of institutions
   */
  async getInstitutionsByType(type: InstitutionAPIType): Promise<InstitutionListResponse> {
    try {
      const response = await apiService.get<InstitutionListResponse>(`/institutions/type/${type}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch institutions by type');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to fetch institutions by type:', error);
      throw error;
    }
  },

  /**
   * Get institutions by category
   * @param category - Institution category
   * @returns List of institutions
   */
  async getInstitutionsByCategory(category: string): Promise<InstitutionListResponse> {
    try {
      const response = await apiService.get<InstitutionListResponse>(`/institutions/category/${category}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch institutions by category');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to fetch institutions by category:', error);
      throw error;
    }
  },

  /**
   * Get institutions by subscription status
   * @param status - Subscription status
   * @returns List of institutions
   */
  async getInstitutionsBySubscriptionStatus(
    status: string
  ): Promise<InstitutionListResponse> {
    try {
      const response = await apiService.get<InstitutionListResponse>(`/institutions/subscription-status/${status}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch institutions by subscription status');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to fetch institutions by subscription status:', error);
      throw error;
    }
  },

  /**
   * Get expiring subscriptions
   * @param days - Number of days to check
   * @returns List of institutions with expiring subscriptions
   */
  async getExpiringSubscriptions(days: number = 30): Promise<InstitutionListResponse> {
    try {
      const response = await apiService.get<InstitutionListResponse>(`/institutions/expiring-subscriptions?days=${days}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch expiring subscriptions');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to fetch expiring subscriptions:', error);
      throw error;
    }
  },

  /**
   * Get institution metrics
   * @param id - Institution ID
   * @returns Institution metrics
   */
  async getInstitutionMetrics(id: string): Promise<Record<string, unknown>> {
    try {
      const response = await apiService.get<Record<string, unknown>>(`/institutions/${id}/metrics`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch institution metrics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to fetch institution metrics:', error);
      throw error;
    }
  },

  /**
   * Suspend institution
   * @param id - Institution ID
   * @returns Success response
   */
  async suspendInstitution(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(`/institutions/${id}/suspend`, {});
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to suspend institution');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to suspend institution:', error);
      throw error;
    }
  },

  /**
   * Activate institution
   * @param id - Institution ID
   * @returns Success response
   */
  async activateInstitution(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(`/institutions/${id}/activate`, {});
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to activate institution');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to activate institution:', error);
      throw error;
    }
  },

  /**
   * Update subscription
   * @param id - Institution ID
   * @param subscriptionData - Subscription data
   * @returns Updated institution
   */
  async updateSubscription(id: string, subscriptionData: Record<string, unknown>): Promise<InstitutionResponse> {
    try {
      const response = await apiService.put<InstitutionResponse>(`/institutions/${id}/subscription`, subscriptionData);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update subscription');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to update subscription:', error);
      throw error;
    }
  },

  /**
   * Get dashboard stats
   * @returns Dashboard statistics
   */
  async getDashboardStats(): Promise<Record<string, unknown>> {
    try {
      const response = await apiService.get<Record<string, unknown>>('/institutions/dashboard/stats');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch dashboard stats');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Institution Utils] Failed to fetch dashboard stats:', error);
      throw error;
    }
  }
};

export default institutionUtilsService;
