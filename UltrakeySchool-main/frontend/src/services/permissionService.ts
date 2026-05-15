import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Permission {
  _id: string;
  name: string;
  key: string;
  description?: string;
  module: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionsListResponse {
  success: boolean;
  data: Permission[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PermissionResponse {
  success: boolean;
  data: Permission;
}

export interface CheckPermissionResponse {
  success: boolean;
  data: {
    hasPermission: boolean;
    permission?: Permission;
  };
}

export const permissionService = {
  async getAll(params?: Record<string, unknown>): Promise<PermissionsListResponse> {
    try {
      const response = await apiService.get<PermissionsListResponse>(
        API_ENDPOINTS.PERMISSIONS.LIST,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch permissions');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permission Service] Failed to fetch permissions:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<PermissionResponse> {
    try {
      const response = await apiService.get<PermissionResponse>(
        `${API_ENDPOINTS.PERMISSIONS.LIST}/${id}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch permission');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permission Service] Failed to fetch permission:', error);
      throw error;
    }
  },

  async create(data: Partial<Permission>): Promise<PermissionResponse> {
    try {
      const response = await apiService.post<PermissionResponse>(
        API_ENDPOINTS.PERMISSIONS.LIST,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create permission');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permission Service] Failed to create permission:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<Permission>): Promise<PermissionResponse> {
    try {
      const response = await apiService.put<PermissionResponse>(
        `${API_ENDPOINTS.PERMISSIONS.LIST}/${id}`,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update permission');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permission Service] Failed to update permission:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        `${API_ENDPOINTS.PERMISSIONS.LIST}/${id}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete permission');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permission Service] Failed to delete permission:', error);
      throw error;
    }
  },

  async checkPermission(userId: string, permissionKey: string): Promise<CheckPermissionResponse> {
    try {
      const response = await apiService.get<CheckPermissionResponse>(
        API_ENDPOINTS.PERMISSIONS.CHECK,
        { userId, permissionKey }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to check permission');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permission Service] Failed to check permission:', error);
      throw error;
    }
  },

  async getUserPermissions(userId: string): Promise<PermissionsListResponse> {
    try {
      const response = await apiService.get<PermissionsListResponse>(
        `${API_ENDPOINTS.PERMISSIONS.LIST}/user/${userId}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch user permissions');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permission Service] Failed to fetch user permissions:', error);
      throw error;
    }
  },

  async assignPermissions(userId: string, permissions: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        API_ENDPOINTS.PERMISSIONS.ASSIGN,
        { userId, permissions }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to assign permissions');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permission Service] Failed to assign permissions:', error);
      throw error;
    }
  },
};

export default permissionService;
