import apiService from './api.js';

export interface EmailRequest {
  recipientEmails: string[];
  subject: string;
  message: string;
  attachments?: any[];
  priority?: 'low' | 'normal' | 'high';
}

export interface EmailResponse {
  success: boolean;
  message: string;
  data: {
    sent: Array<{ email: string; status: string; recipientName: string }>;
    failed: Array<{ email: string; status: string; error: string }>;
    summary: { total: number; successful: number; failed: number };
  };
}

class CommunicationService {
  private baseUrl = '/api/v1/communication';

  async sendEmail(emailData: EmailRequest): Promise<EmailResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/messages`, {
        type: 'email',
        subject: emailData.subject,
        content: emailData.message,
        recipients: emailData.recipientEmails,
        priority: emailData.priority || 'normal',
        attachments: emailData.attachments || []
      });
      return response.data as EmailResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send email');
    }
  }

  async sendMessage(messageData: { recipientId: string; message: string; messageType?: string; attachments?: any[] }) {
    try {
      const response = await apiService.post(`${this.baseUrl}/messages`, {
        type: 'chat',
        content: messageData.message,
        recipientId: messageData.recipientId,
        messageType: messageData.messageType || 'text',
        attachments: messageData.attachments || []
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  }

  async getMessages(params?: { page?: number; limit?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      const response = await apiService.get(`${this.baseUrl}/messages?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch messages');
    }
  }

  async markAsRead(messageId: string) {
    try {
      const response = await apiService.patch(`${this.baseUrl}/messages/${messageId}/read`, {});
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark message as read');
    }
  }

  async getChannels() {
    try {
      const response = await apiService.get(`${this.baseUrl}/channels`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch channels');
    }
  }

  async createChannel(data: { name: string; participants: string[]; type?: string }) {
    try {
      const response = await apiService.post(`${this.baseUrl}/channels`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create channel');
    }
  }

  async updateVisibility(data: { isVisibleToAgents?: boolean; isVisibleToSuperAdmin?: boolean }) {
    try {
      const response = await apiService.post(`${this.baseUrl}/visibility`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update visibility');
    }
  }

  async getVisibleUsers() {
    try {
      const response = await apiService.get(`${this.baseUrl}/visible-users`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch visible users');
    }
  }
}

export default new CommunicationService();
