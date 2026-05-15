import apiService from './api.js';

export interface UserCreateRequest {
  institutionId: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  designation?: string;
  class?: string;
  section?: string;
}

export interface BulkUserCreateRequest {
  institutionId: string;
  users: UserCreateRequest[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  designation?: string;
  class?: string;
  section?: string;
  status: string;
  institutionId: string;
  institutionCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  temporaryPassword: string;
}

export interface BulkUserResponse {
  success: boolean;
  message: string;
  data: {
    created: CreatedUser[];
    errors: Array<{
      row: number;
      email: string;
      error: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  };
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    email: string;
    temporaryPassword: string;
  };
}

class UserManagementService {
  private baseUrl = '/api/v1/users';

  // Create single user
  async createUser(userData: UserCreateRequest) {
    try {
      const response = await apiService.post(`${this.baseUrl}/create`, userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
  }

  // Create multiple users
  async createBulkUsers(bulkData: BulkUserCreateRequest): Promise<BulkUserResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/create-bulk`, bulkData);
      return response.data as BulkUserResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create bulk users');
    }
  }

  // Get users by institution
  async getInstitutionUsers(
    institutionId: string,
    options: {
      role?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    try {
      const params = new URLSearchParams();
      if (options.role) params.append('role', options.role);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await apiService.get(
        `${this.baseUrl}/institution/${institutionId}?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  }

  // Get all users (with filters)
  async getUsers(options: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const params = new URLSearchParams();
      if (options.role) params.append('role', options.role);
      if (options.status) params.append('status', options.status);
      if (options.search) params.append('search', options.search);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await apiService.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  }

  // Update user
  async updateUser(userId: string, userData: Partial<User>) {
    try {
      const response = await apiService.put(`${this.baseUrl}/${userId}`, userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  }

  // Reset user password
  async resetUserPassword(userId: string): Promise<PasswordResetResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${userId}/reset-password`);
      return response.data as PasswordResetResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  }

  // Delete user
  async deleteUser(userId: string) {
    try {
      const response = await apiService.delete(`${this.baseUrl}/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await apiService.get(`${this.baseUrl}/${userId}`);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiService.get(`${this.baseUrl}/profile`);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
    }
  }

  // Update current user profile
  async updateProfile(userData: Partial<User>) {
    try {
      const response = await apiService.put(`${this.baseUrl}/profile`, userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string) {
    try {
      const response = await apiService.post(`${this.baseUrl}/change-password`, {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }

  // Get users by role
  async getUsersByRole(role: string, institutionId?: string) {
    try {
      const params = new URLSearchParams();
      params.append('role', role);
      if (institutionId) params.append('institutionId', institutionId);

      const response = await apiService.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users by role');
    }
  }

  // Search users
  async searchUsers(query: string, institutionId?: string) {
    try {
      const params = new URLSearchParams();
      params.append('search', query);
      if (institutionId) params.append('institutionId', institutionId);

      const response = await apiService.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search users');
    }
  }

  // Get user statistics
  async getUserStatistics(institutionId?: string) {
    try {
      const url = institutionId 
        ? `${this.baseUrl}/statistics?institutionId=${institutionId}`
        : `${this.baseUrl}/statistics`;
      
      const response = await apiService.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user statistics');
    }
  }

  // Export users
  async exportUsers(institutionId?: string, format: 'csv' | 'excel' = 'csv') {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (institutionId) params.append('institutionId', institutionId);

      const response = await apiService.get(`${this.baseUrl}/export?${params.toString()}`, {
        responseType: 'blob'
      } as any);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to export users');
    }
  }

  // Import users from CSV/Excel
  async importUsers(file: File, institutionId: string) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('institutionId', institutionId);

      const response = await apiService.post(`${this.baseUrl}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to import users');
    }
  }
}

export default new UserManagementService();
