import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Notification {
  _id: string;
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  isRead: boolean;
  recipient: string;
  recipientId: string;
  updatedAt: string;
  createdAt?: string;
  timestamp?: string;
}

export interface NotificationPayload {
  title: string;
  message: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high';
  recipientIds: string[];
  channels?: string[];
  metadata?: Record<string, any>;
}

export interface NotificationsListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface NotificationResponse {
  _id: string;
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  recipientIds: string[];
  recipientId: string;
  channels: string[];
  institutionId: string;
  metadata: Record<string, any>;
  read: boolean;
  isRead: boolean;
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

      // Backend returns { notifications, total, unreadCount } inside data
      return response.data || { notifications: [], total: 0, unreadCount: 0 };
    } catch (error) {
      console.error('[Notification Service] Failed to fetch notifications:', error);
      return { notifications: [], total: 0, unreadCount: 0 };
    }
  },

  async markAsRead(id: string): Promise<NotificationResponse> {
    try {
      const response = await apiService.put<NotificationResponse>(
        API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id),
        {}
      );

      return response.data as NotificationResponse;
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

      return response.data || { success: true, message: 'All marked as read' };
    } catch (error) {
      console.error('[Notification Service] Failed to mark all notifications as read:', error);
      throw error;
    }
  },

  async sendNotification(notification: Partial<NotificationPayload>): Promise<NotificationResponse> {
    const payload: NotificationPayload = {
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'info',
      priority: notification.priority || 'medium',
      recipientIds: notification.recipientIds || [],
      channels: notification.channels || ['in-app'],
      metadata: notification.metadata || {}
    };

    return this.send(payload);
  },

  async send(payload: NotificationPayload): Promise<NotificationResponse> {
    try {
      const response = await apiService.post<NotificationResponse>(
        API_ENDPOINTS.NOTIFICATIONS.SEND,
        payload
      );

      return response.data as NotificationResponse;
    } catch (error) {
      console.error('[Notification Service] Failed to send notification:', error);
      throw error;
    }
  },

  async create(payload: NotificationPayload): Promise<NotificationResponse> {
    try {
      const response = await apiService.post<NotificationResponse>(
        API_ENDPOINTS.NOTIFICATIONS.LIST,
        payload
      );

      return response.data as NotificationResponse;
    } catch (error) {
      console.error('[Notification Service] Failed to create notification:', error);
      throw error;
    }
  }
};

export default notificationService;