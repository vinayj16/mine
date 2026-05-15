import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolesListResponse {
  success: boolean;
  data: Role[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoleResponse {
  success: boolean;
  data: Role;
}

export const roleService = {
  async getAll(params?: Record<string, unknown>): Promise<RolesListResponse> {
    try {
      const response = await apiService.get<RolesListResponse>(
        API_ENDPOINTS.ROLES.LIST,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch roles');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Role Service] Failed to fetch roles:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<RoleResponse> {
    try {
      const response = await apiService.get<RoleResponse>(
        API_ENDPOINTS.ROLES.DETAIL(id)
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch role');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Role Service] Failed to fetch role:', error);
      throw error;
    }
  },

  async create(data: Partial<Role>): Promise<RoleResponse> {
    try {
      const response = await apiService.post<RoleResponse>(
        API_ENDPOINTS.ROLES.CREATE,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create role');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Role Service] Failed to create role:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<Role>): Promise<RoleResponse> {
    try {
      const response = await apiService.put<RoleResponse>(
        API_ENDPOINTS.ROLES.UPDATE(id),
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update role');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Role Service] Failed to update role:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        API_ENDPOINTS.ROLES.DELETE(id)
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete role');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Role Service] Failed to delete role:', error);
      throw error;
    }
  },

  async assignPermissions(roleId: string, permissions: string[]): Promise<RoleResponse> {
    try {
      const response = await apiService.post<RoleResponse>(
        `${API_ENDPOINTS.ROLES.LIST}/${roleId}/permissions`,
        { permissions }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to assign permissions');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Role Service] Failed to assign permissions:', error);
      throw error;
    }
  },
};

export default roleService;
