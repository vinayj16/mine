import apiService from './api';

export interface Permission {
  _id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  resource: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  modules: string[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionCheckRequest {
  userId: string;
  permission: string;
  resource?: string;
}

export interface PermissionCheckResponse {
  hasPermission: boolean;
  reason?: string;
}

const permissionsService = {
  /**
   * Get all permissions
   */
  getAllPermissions: async (): Promise<Permission[]> => {
    try {
      const response = await apiService.get<Permission[]>('/permissions');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch permissions');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permissions Service] Failed to fetch permissions:', error);
      throw error;
    }
  },

  /**
   * Get permission by ID
   */
  getPermissionById: async (id: string): Promise<Permission> => {
    try {
      const response = await apiService.get<Permission>(`/permissions/${id}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch permission');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permissions Service] Failed to fetch permission:', error);
      throw error;
    }
  },

  /**
   * Create new permission
   */
  createPermission: async (data: Partial<Permission>): Promise<Permission> => {
    try {
      const response = await apiService.post<Permission>('/permissions', data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create permission');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permissions Service] Failed to create permission:', error);
      throw error;
    }
  },

  /**
   * Update permission
   */
  updatePermission: async (id: string, data: Partial<Permission>): Promise<Permission> => {
    try {
      const response = await apiService.put<Permission>(`/permissions/${id}`, data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update permission');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permissions Service] Failed to update permission:', error);
      throw error;
    }
  },

  /**
   * Delete permission
   */
  deletePermission: async (id: string): Promise<void> => {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(`/permissions/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete permission');
      }
    } catch (error) {
      console.error('[Permissions Service] Failed to delete permission:', error);
      throw error;
    }
  },

  /**
   * Check if user has permission
   */
  checkPermission: async (data: PermissionCheckRequest): Promise<PermissionCheckResponse> => {
    try {
      const response = await apiService.post<PermissionCheckResponse>('/permissions/check', data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to check permission');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permissions Service] Failed to check permission:', error);
      throw error;
    }
  },

  /**
   * Get all roles
   */
  getAllRoles: async (): Promise<Role[]> => {
    try {
      const response = await apiService.get<Role[]>('/roles');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch roles');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permissions Service] Failed to fetch roles:', error);
      throw error;
    }
  },

  /**
   * Get role by ID
   */
  getRoleById: async (id: string): Promise<Role> => {
    try {
      const response = await apiService.get<Role>(`/roles/${id}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch role');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permissions Service] Failed to fetch role:', error);
      throw error;
    }
  },

  /**
   * Create new role
   */
  createRole: async (data: Partial<Role>): Promise<Role> => {
    try {
      const response = await apiService.post<Role>('/roles', data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create role');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permissions Service] Failed to create role:', error);
      throw error;
    }
  },

  /**
   * Update role
   */
  updateRole: async (id: string, data: Partial<Role>): Promise<Role> => {
    try {
      const response = await apiService.put<Role>(`/roles/${id}`, data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update role');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permissions Service] Failed to update role:', error);
      throw error;
    }
  },

  /**
   * Delete role
   */
  deleteRole: async (id: string): Promise<void> => {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(`/roles/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete role');
      }
    } catch (error) {
      console.error('[Permissions Service] Failed to delete role:', error);
      throw error;
    }
  },

  /**
   * Get permissions for a specific role
   */
  getRolePermissions: async (roleId: string): Promise<Permission[]> => {
    try {
      const response = await apiService.get<Permission[]>(`/roles/${roleId}/permissions`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch role permissions');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permissions Service] Failed to fetch role permissions:', error);
      throw error;
    }
  },

  /**
   * Assign permissions to role
   */
  assignPermissionsToRole: async (roleId: string, permissionIds: string[]): Promise<Role> => {
    try {
      const response = await apiService.post<Role>(`/roles/${roleId}/permissions`, { permissionIds });
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to assign permissions to role');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permissions Service] Failed to assign permissions to role:', error);
      throw error;
    }
  },

  /**
   * Remove permissions from role
   */
  removePermissionsFromRole: async (roleId: string, permissionIds: string[]): Promise<Role> => {
    try {
      const response = await apiService.delete<Role>(`/roles/${roleId}/permissions`, { permissionIds });
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to remove permissions from role');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Permissions Service] Failed to remove permissions from role:', error);
      throw error;
    }
  }
};

export default permissionsService;
