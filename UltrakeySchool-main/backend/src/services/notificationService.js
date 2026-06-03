import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendNotificationToUser } from './socketService.js';

class NotificationService {
  // Build query filter using tenant ID (stored in institutionId field)
  _buildTenantFilter(tenantId) {
    const filter = { isActive: true };
    if (tenantId) {
      filter.institutionId = tenantId;
    }
    return filter;
  }

  async getNotifications(tenantId, userId, options = {}) {
    const {
      isRead,
      type,
      limit = 20,
      skip = 0
    } = options;

    const query = {
      ...this._buildTenantFilter(tenantId),
      recipientId: userId
    };

    if (isRead !== undefined) {
      query.isRead = isRead;
    }

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formatted = notifications.map(this.formatNotification);
    
    return {
      notifications: formatted,
      total: formatted.length,
      unreadCount: formatted.filter(n => !n.isRead).length
    };
  }

  async getUnreadCount(tenantId, userId) {
    const query = {
      ...this._buildTenantFilter(tenantId),
      recipientId: userId,
      isRead: false
    };

    const count = await Notification.countDocuments(query);

    return count;
  }

  async createNotification(tenantId, notificationData) {
    const {
      recipientId,
      recipientIds,
      type,
      title,
      message,
      actionUrl,
      actionText,
      senderId,
      metadata,
      expiresAt,
      priority
    } = notificationData;

    let sender = null;
    if (senderId) {
      const senderUser = await User.findById(senderId).select('name profileImage').lean();
      if (senderUser) {
        sender = {
          userId: senderUser._id,
          name: senderUser.name,
          avatar: senderUser.profileImage || '/assets/img/placeholder-avatar.webp'
        };
      }
    }

    // Handle multiple recipients by creating individual notifications
    const targetRecipients = recipientIds && recipientIds.length > 0
      ? recipientIds
      : recipientId ? [recipientId] : [];

    if (targetRecipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    // Create notifications for all recipients
    const notifications = targetRecipients.map(recId => ({
      institutionId: tenantId,
      recipientId: recId,
      type: type || 'info',
      title,
      message,
      actionUrl,
      actionText,
      sender,
      metadata: metadata || {},
      priority: priority || 'medium',
      expiresAt
    }));

    const result = await Notification.insertMany(notifications);
    const formatted = result.map(n => this.formatNotification(n.toObject()));

    // Send real-time socket notification to each recipient
    formatted.forEach(notif => {
      if (notif.recipientId) {
        sendNotificationToUser(notif.recipientId, notif);
      }
    });

    return formatted.length === 1 ? formatted[0] : formatted;
  }

  async markAsRead(tenantId, userId, notificationId) {
    const filter = {
      _id: notificationId,
      recipientId: userId
    };
    if (tenantId) {
      filter.institutionId = tenantId;
    }

    const notification = await Notification.findOneAndUpdate(
      filter,
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.formatNotification(notification.toObject());
  }

  async markAllAsRead(tenantId, userId) {
    const filter = {
      recipientId: userId,
      isRead: false,
      isActive: true
    };
    if (tenantId) {
      filter.institutionId = tenantId;
    }

    const result = await Notification.updateMany(
      filter,
      { $set: { isRead: true } }
    );

    return result;
  }

  async deleteNotification(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipientId: userId
      },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.formatNotification(notification.toObject());
  }

  async clearReadNotifications(tenantId, userId) {
    const result = await Notification.deleteMany({
      recipientId: userId,
      isRead: true
    });
    return result;
  }

  async broadcastNotification(tenantId, notificationData, recipientIds) {
    const notifications = recipientIds.map(recipientId => ({
      institutionId: tenantId,
      recipientId,
      type: notificationData.type || 'info',
      title: notificationData.title,
      message: notificationData.message,
      actionUrl: notificationData.actionUrl,
      actionText: notificationData.actionText,
      sender: notificationData.senderId ? { userId: notificationData.senderId } : undefined,
      metadata: notificationData.metadata || {},
      expiresAt: notificationData.expiresAt,
      priority: notificationData.priority || 'medium'
    }));

    const result = await Notification.insertMany(notifications);
    const formatted = result.map(n => this.formatNotification(n.toObject()));

    // Send real-time socket notification to each recipient
    formatted.forEach(notif => {
      if (notif.recipientId) {
        sendNotificationToUser(notif.recipientId, notif);
      }
    });

    return formatted;
  }

  formatNotification(notification) {
    return {
      id: notification._id ? notification._id.toString() : notification.id,
      _id: notification._id ? notification._id.toString() : notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt,
      createdAt: notification.createdAt,
      isRead: notification.isRead,
      read: notification.isRead,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      priority: notification.priority || 'medium',
      recipientId: notification.recipientId ? notification.recipientId.toString() : undefined,
      sender: notification.sender ? {
        id: notification.sender.userId?.toString(),
        name: notification.sender.name,
        avatar: notification.sender.avatar
      } : null
    };
  }
}

export default new NotificationService();