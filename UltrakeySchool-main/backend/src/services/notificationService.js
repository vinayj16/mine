import Notification from '../models/Notification.js';
import User from '../models/User.js';

class NotificationService {
  async getNotifications(schoolId, userId, options = {}) {
    const {
      isRead,
      type,
      limit = 20,
      skip = 0
    } = options;

    const query = {
      schoolId,
      recipientId: userId,
      isActive: true
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

    return notifications.map(this.formatNotification);
  }

  async getUnreadCount(schoolId, userId) {
    const count = await Notification.countDocuments({
      schoolId,
      recipientId: userId,
      isRead: false,
      isActive: true
    });

    return count;
  }

  async createNotification(schoolId, notificationData) {
    const {
      recipientId,
      type,
      title,
      message,
      actionUrl,
      actionText,
      senderId,
      metadata,
      expiresAt
    } = notificationData;

    let sender = null;
    if (senderId) {
      const senderUser = await User.findById(senderId).lean();
      if (senderUser) {
        sender = {
          userId: senderUser._id,
          name: senderUser.name,
          avatar: senderUser.profileImage || '/assets/img/placeholder-avatar.webp'
        };
      }
    }

    const notification = new Notification({
      schoolId,
      recipientId,
      type: type || 'info',
      title,
      message,
      actionUrl,
      actionText,
      sender,
      metadata: metadata || {},
      expiresAt
    });

    await notification.save();
    return this.formatNotification(notification.toObject());
  }

  async markAsRead(schoolId, userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        schoolId,
        recipientId: userId
      },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.formatNotification(notification.toObject());
  }

  async markAllAsRead(schoolId, userId) {
    const result = await Notification.updateMany(
      {
        schoolId,
        recipientId: userId,
        isRead: false,
        isActive: true
      },
      { $set: { isRead: true } }
    );

    return result;
  }

  async deleteNotification(schoolId, userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        schoolId,
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

  async broadcastNotification(schoolId, notificationData, recipientIds) {
    const notifications = recipientIds.map(recipientId => ({
      schoolId,
      recipientId,
      type: notificationData.type || 'info',
      title: notificationData.title,
      message: notificationData.message,
      actionUrl: notificationData.actionUrl,
      actionText: notificationData.actionText,
      metadata: notificationData.metadata || {},
      expiresAt: notificationData.expiresAt
    }));

    const result = await Notification.insertMany(notifications);
    return result.map(n => this.formatNotification(n.toObject()));
  }

  formatNotification(notification) {
    return {
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt,
      isRead: notification.isRead,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      sender: notification.sender ? {
        id: notification.sender.userId?.toString(),
        name: notification.sender.name,
        avatar: notification.sender.avatar
      } : null
    };
  }
}

export default new NotificationService();
