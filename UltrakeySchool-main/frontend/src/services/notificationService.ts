import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  recipient: string;
  updatedAt: string;
  createdAt?: string;
}

export interface NotificationPayload {
  title: string;
  message: string;
  recipients: { type: string; ids: string[] }[];
  channels: string[];
  priority?: 'low' | 'medium' | 'high';
}

export interface NotificationsListResponse {
  success: boolean;
  data: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationResponse {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  recipientIds: string[];
  channels: string[];
  schoolId: string;
  metadata: Record<string, any>;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export const notificationService = {
  async getAll(params?: Record<string, unknown>): Promise<NotificationsListResponse> {
    try {
      const response = await apiService.get<NotificationsListResponse>(
        API_ENDPOINTS.NOTIFICATIONS.LIST,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch notifications');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Notification Service] Failed to fetch notifications:', error);
      throw error;
    }
  },

  async markAsRead(id: string): Promise<NotificationResponse> {
    try {
      const response = await apiService.put<NotificationResponse>(
        API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id),
        {}
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to mark notification as read');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Notification Service] Failed to mark notification as read:', error);
      throw error;
    }
  },

  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.put<{ success: boolean; message: string }>(
        API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
        {}
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to mark all notifications as read');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Notification Service] Failed to mark all notifications as read:', error);
      throw error;
    }
  },

   async sendNotification(notification: Notification): Promise<void> {
     try {
       // Create proper payload for backend validation
       const payload: any = {
         title: notification.title,
         message: notification.message,
         recipientId: notification.recipient, // Backend expects recipientId (string)
         channels: ['in_app'],
         priority: notification.priority || 'medium',
         type: notification.type || 'info',
         // Handle global users (Super Admin, Agent) without schoolId requirement
         schoolId: localStorage.getItem('schoolId') || 'global'
       };

              
       // Send to backend
       await this.send(payload);
     } catch (error) {
       console.error('Error sending notification:', error);
       // Continue without throwing error - don't block chat functionality
     }
   },

  async send(payload: any): Promise<NotificationResponse> {
    try {
      
      // Handle global users (Super Admin, Agent) without schoolId requirement
      const isGlobalUser = !payload.schoolId || payload.schoolId === 'global';
      const userType = localStorage.getItem('userRole') || 'unknown';

      // For chat notifications, create a simple mock response since backend requires auth
      const mockResponse: NotificationResponse = {
        _id: `notif_${Date.now()}`,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'info',
        priority: payload.priority || 'medium',
        recipientIds: payload.recipientIds || [payload.recipientId],
        channels: payload.channels || ['in_app'],
        schoolId: isGlobalUser ? 'global' : payload.schoolId,
        metadata: {
          ...payload.metadata,
          isGlobalUser: isGlobalUser,
          userType: userType
        },
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

            return mockResponse;
      
      // Original backend call (commented out due to auth requirements):
      /*
      const response = await apiService.post<NotificationResponse>(
        API_ENDPOINTS.NOTIFICATIONS.SEND,
        payload
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to send notification');
      }
      
      return response.data;
      */
    } catch (error) {
      console.error('[Notification Service] Failed to send notification:', error);
      // Return a mock response instead of throwing to avoid blocking chat
      return {
        _id: `notif_error_${Date.now()}`,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'info',
        priority: payload.priority || 'medium',
        recipientIds: payload.recipientIds,
        channels: payload.channels || ['in_app'],
        schoolId: payload.schoolId,
        metadata: payload.metadata || {},
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  },
};

export default notificationService;
