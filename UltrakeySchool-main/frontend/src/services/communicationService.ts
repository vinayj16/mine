import apiService from './api.js';

export interface Message {
  messageId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  messageType: string;
  attachments: any[];
  institutionId: string;
  timestamp: string;
  status: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  lastMessage: Message;
  unreadCount: number;
  timestamp: string;
}

export interface InstitutionMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
  class?: string;
  section?: string;
}

export interface EmailRequest {
  recipientEmails: string[];
  subject: string;
  message: string;
  attachments?: any[];
  priority?: 'low' | 'normal' | 'high';
}

export interface MessageRequest {
  recipientId: string;
  message: string;
  messageType?: 'text' | 'file' | 'image';
  attachments?: any[];
}

export interface BroadcastRequest {
  message: string;
  targetRoles?: string[];
  messageType?: 'announcement' | 'alert' | 'notice';
  priority?: 'low' | 'normal' | 'high';
}

export interface EmailResponse {
  success: boolean;
  message: string;
  data: {
    sent: Array<{
      email: string;
      status: string;
      recipientName: string;
    }>;
    failed: Array<{
      email: string;
      status: string;
      error: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  };
}

export interface MessageResponse {
  success: boolean;
  message: string;
  data: Message;
}

export interface MembersResponse {
  success: boolean;
  data: {
    members: InstitutionMember[];
    groupedMembers: Record<string, InstitutionMember[]>;
    total: number;
    summary: Array<{
      role: string;
      count: number;
    }>;
  };
}

export interface ConversationsResponse {
  success: boolean;
  data: {
    conversations: Conversation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export interface MessagesResponse {
  success: boolean;
  data: {
    messages: Message[];
    otherUser: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export interface CommunicationStatistics {
  totalMessages: number;
  totalEmails: number;
  totalBroadcasts: number;
  activeConversations: number;
  period: string;
  breakdown: {
    byRole: Record<string, number>;
    byDay: Array<{
      date: string;
      messages: number;
      emails: number;
    }>;
  };
}

class CommunicationService {
  private baseUrl = '/api/v1/communication';

  // Send email within institution
  async sendEmail(emailData: EmailRequest): Promise<EmailResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/email/send`, emailData);
      return response.data as EmailResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send email');
    }
  }

  // Get institution members for communication
  async getInstitutionMembers(options: {
    role?: string;
    search?: string;
  } = {}): Promise<MembersResponse> {
    try {
      const params = new URLSearchParams();
      if (options.role) params.append('role', options.role);
      if (options.search) params.append('search', options.search);

      const response = await apiService.get(`${this.baseUrl}/members?${params.toString()}`);
      return response.data as MembersResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch members');
    }
  }

  // Send internal message/chat
  async sendMessage(messageData: MessageRequest): Promise<MessageResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/message/send`, messageData);
      return response.data as MessageResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  }

  // Get conversation history with specific user
  async getConversation(
    userId: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<MessagesResponse> {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await apiService.get(
        `${this.baseUrl}/messages/${userId}?${params.toString()}`
      );
      return response.data as MessagesResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch conversation');
    }
  }

  // Get all conversations for current user
  async getConversations(options: {
    page?: number;
    limit?: number;
  } = {}): Promise<ConversationsResponse> {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await apiService.get(
        `${this.baseUrl}/conversations?${params.toString()}`
      );
      return response.data as ConversationsResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }

  // Send broadcast message to institution members
  async sendBroadcast(broadcastData: BroadcastRequest) {
    try {
      const response = await apiService.post(`${this.baseUrl}/broadcast`, broadcastData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send broadcast');
    }
  }

  // Get communication statistics
  async getStatistics(options: {
    period?: string; // Number of days
  } = {}): Promise<CommunicationStatistics> {
    try {
      const params = new URLSearchParams();
      if (options.period) params.append('period', options.period);

      const response = await apiService.get(
        `${this.baseUrl}/statistics?${params.toString()}`
      );
      return response.data as CommunicationStatistics;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }

  // Mark messages as read
  async markAsRead(messageIds: string[]) {
    try {
      const response = await apiService.post(`${this.baseUrl}/messages/read`, {
        messageIds
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark messages as read');
    }
  }

  // Delete message
  async deleteMessage(messageId: string) {
    try {
      const response = await apiService.delete(`${this.baseUrl}/messages/${messageId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete message');
    }
  }

  // Search messages
  async searchMessages(query: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await apiService.get(
        `${this.baseUrl}/messages/search?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search messages');
    }
  }

  // Get unread messages count
  async getUnreadCount(): Promise<{ count: number }> {
    try {
      const response = await apiService.get(`${this.baseUrl}/messages/unread/count`);
      return response.data as { count: number };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get unread count');
    }
  }

  // Upload attachment for message
  async uploadAttachment(file: File): Promise<{ url: string; name: string; type: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiService.post(`${this.baseUrl}/attachments/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } as any);
      return response.data as { url: string; name: string; type: string };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload attachment');
    }
  }

  // Get message attachments
  async getAttachments(messageId: string) {
    try {
      const response = await apiService.get(`${this.baseUrl}/messages/${messageId}/attachments`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get attachments');
    }
  }

  // Block/unblock user
  async toggleBlock(userId: string, action: 'block' | 'unblock') {
    try {
      const response = await apiService.post(`${this.baseUrl}/users/${userId}/${action}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || `Failed to ${action} user`);
    }
  }

  // Get blocked users
  async getBlockedUsers() {
    try {
      const response = await apiService.get(`${this.baseUrl}/users/blocked`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get blocked users');
    }
  }
}

export default new CommunicationService();
