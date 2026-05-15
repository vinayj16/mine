import api from './api';

export interface BlockedUser {
  _id: string;
  blockerId: string;
  blockedUserId: string;
  blockedRole?: string;
  reason: string;
  isActive: boolean;
  blockedUser?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface BlockRoleData {
  role: string;
  reason?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class ChatBlockService {
  // Block a specific user
  async blockUser(userId: string, reason?: string): Promise<ApiResponse<null>> {
    const response = await api.post(`/chat/block/${userId}`, { reason });
    return response.data as ApiResponse<null>;
  }

  // Unblock a specific user
  async unblockUser(userId: string): Promise<ApiResponse<null>> {
    const response = await api.post(`/chat/unblock/${userId}`);
    return response.data as ApiResponse<null>;
  }

  // Get list of blocked users
  async getBlockedUsers(): Promise<BlockedUser[]> {
    const response = await api.get('/chat/blocked-users');
    const apiResponse = response.data as ApiResponse<BlockedUser[]>;
    return apiResponse.data || [];
  }

  // Block users by role
  async blockByRole(role: string, reason?: string): Promise<ApiResponse<null>> {
    const response = await api.post(`/chat/block-role/${role}`, { reason });
    return response.data as ApiResponse<null>;
  }

  // Unblock users by role
  async unblockByRole(role: string): Promise<ApiResponse<null>> {
    const response = await api.post(`/chat/unblock-role/${role}`);
    return response.data as ApiResponse<null>;
  }

  // Check if a user is blocked
  async isUserBlocked(userId: string): Promise<boolean> {
    try {
      const blockedUsers = await this.getBlockedUsers();
      return blockedUsers.some(block => 
        block.blockedUserId === userId && block.isActive
      );
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      return false;
    }
  }

  // Check if a role is blocked
  async isRoleBlocked(role: string): Promise<boolean> {
    try {
      const blockedUsers = await this.getBlockedUsers();
      return blockedUsers.some(block => 
        block.blockedRole === role && block.isActive
      );
    } catch (error) {
      console.error('Error checking if role is blocked:', error);
      return false;
    }
  }
}

export default new ChatBlockService();
