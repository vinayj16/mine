import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

export interface DeleteAccountRequest {
  _id: string;
  userId: string;
  name: string;
  email: string;
  image: string;
  requisitionDate: string;
  deleteRequestDate: string;
  status: 'pending' | 'confirmed' | 'rejected';
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  _id: string;
  name: string;
  permissions: string[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const userService = {
  // Delete Account Requests
  async getDeleteAccountRequests(params?: Record<string, unknown>): Promise<DeleteAccountRequest[]> {
    try {
      const response = await apiService.get<DeleteAccountRequest[]>('/users/delete-requests', params);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch delete account requests');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to fetch delete account requests:', error);
      throw error;
    }
  },

  async createDeleteAccountRequest(data: Partial<DeleteAccountRequest>): Promise<DeleteAccountRequest> {
    try {
      const response = await apiService.post<DeleteAccountRequest>('/users/delete-requests', data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create delete account request');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to create delete account request:', error);
      throw error;
    }
  },

  async confirmDeleteRequest(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.patch<{ success: boolean; message: string }>(
        `/users/delete-requests/${id}/confirm`,
        {}
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to confirm delete request');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to confirm delete request:', error);
      throw error;
    }
  },

  async rejectDeleteRequest(id: string, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.patch<{ success: boolean; message: string }>(
        `/users/delete-requests/${id}/reject`,
        { reason }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to reject delete request');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to reject delete request:', error);
      throw error;
    }
  },

  async deleteDeleteRequest(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        `/users/delete-requests/${id}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete delete request');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to delete delete request:', error);
      throw error;
    }
  },

  async bulkConfirmDeleteRequests(ids: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        '/users/delete-requests/bulk-confirm',
        { ids }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to bulk confirm delete requests');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to bulk confirm delete requests:', error);
      throw error;
    }
  },

  async bulkRejectDeleteRequests(ids: string[], reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        '/users/delete-requests/bulk-reject',
        { ids, reason }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to bulk reject delete requests');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to bulk reject delete requests:', error);
      throw error;
    }
  },

  // User Management
  async getUsers(params?: Record<string, unknown>): Promise<User[]> {
    try {
      const response = await apiService.get<User[]>('/users', params);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch users');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to fetch users:', error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiService.get<User>(API_ENDPOINTS.AUTH.PROFILE);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch current user');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to fetch current user:', error);
      throw error;
    }
  },

  async updateCurrentUser(data: Record<string, unknown>): Promise<User> {
    try {
      const response = await apiService.put<User>(API_ENDPOINTS.AUTH.PROFILE, data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update current user');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to update current user:', error);
      throw error;
    }
  },

  async getUserById(id: string): Promise<User> {
    try {
      const response = await apiService.get<User>(`/users/${id}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch user');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to fetch user:', error);
      throw error;
    }
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const response = await apiService.put<User>(`/users/${id}`, data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update user');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to update user:', error);
      throw error;
    }
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(`/users/${id}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete user');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to delete user:', error);
      throw error;
    }
  },

  // Roles
  async getRoles(params?: Record<string, unknown>): Promise<Role[]> {
    try {
      const response = await apiService.get<Role[]>('/roles', params);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch roles');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to fetch roles:', error);
      throw error;
    }
  },

  async createRole(data: Partial<Role>): Promise<Role> {
    try {
      const response = await apiService.post<Role>('/roles', data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create role');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to create role:', error);
      throw error;
    }
  },

  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    try {
      const response = await apiService.put<Role>(`/roles/${id}`, data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update role');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to update role:', error);
      throw error;
    }
  },

  async deleteRole(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(`/roles/${id}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete role');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to delete role:', error);
      throw error;
    }
  },

  // Permissions
  async getPermissions(params?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    try {
      const response = await apiService.get<Record<string, unknown>[]>('/permissions', params);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch permissions');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to fetch permissions:', error);
      throw error;
    }
  },

  async updatePermissions(data: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.put<{ success: boolean; message: string }>('/permissions', data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update permissions');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Service] Failed to update permissions:', error);
      throw error;
    }
  },
};

export default userService;
