import apiService from './api';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  status: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  dateOfBirth?: string;
  gender?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
  preferences?: any; // Allow any preferences structure
}

const userProfileService = {
  // Get current user profile - use agent profile endpoint
  getProfile: async (): Promise<UserProfile> => {
    try {
      // Try agent profile endpoint first
      const response = await apiService.get<UserProfile>('/agents/profile/me');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch profile');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Profile Service] Failed to fetch profile:', error);
      throw error;
    }
  },

  // Update current user profile
  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const response = await apiService.put<UserProfile>('/agents/profile/me', data);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update profile');
      }
      
      return response.data;
    } catch (error) {
      console.error('[User Profile Service] Failed to update profile:', error);
      throw error;
    }
  },

  // Get user permissions
  getPermissions: async (): Promise<string[]> => {
    try {
      const response = await apiService.get<{ permissions: string[] }>('/agents/profile/me/permissions');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch permissions');
      }
      
      return response.data.permissions;
    } catch (error) {
      console.error('[User Profile Service] Failed to fetch permissions:', error);
      throw error;
    }
  }
};

export default userProfileService;
