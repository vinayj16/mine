import admin from 'firebase-admin';
import logger from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PushNotificationService {
  constructor() {
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      if (!serviceAccountPath) {
        logger.warn('Firebase service account not configured. Push notifications disabled.');
        return;
      }

      // Initialize Firebase Admin SDK
      const serviceAccount = require(path.resolve(serviceAccountPath));

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.messaging = admin.messaging();
      this.initialized = true;
      logger.info('Push notification service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize push notification service', {
        error: error.message,
      });
    }
  }

  async sendToDevice(deviceToken, notification, data = {}) {
    if (!this.initialized) {
      logger.warn('Push notification service not initialized.');
      return { success: false, error: 'Service not configured' };
    }

    try {
      const message = {
        token: deviceToken,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.send(message);

      logger.info('Push notification sent successfully', {
        deviceToken: deviceToken.substring(0, 20) + '...',
        messageId: response,
      });

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      logger.error('Failed to send push notification', {
        error: error.message,
        code: error.code,
      });

      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async sendToMultipleDevices(deviceTokens, notification, data = {}) {
    if (!this.initialized) {
      logger.warn('Push notification service not initialized.');
      return { success: false, error: 'Service not configured' };
    }

    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
        tokens: deviceTokens,
        android: {
          priority: 'high',
        },
      };

      const response = await this.messaging.sendMulticast(message);

      logger.info('Multicast push notification sent', {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      logger.error('Failed to send multicast push notification', {
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendToTopic(topic, notification, data = {}) {
    if (!this.initialized) {
      logger.warn('Push notification service not initialized.');
      return { success: false, error: 'Service not configured' };
    }

    try {
      const message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      };

      const response = await this.messaging.send(message);

      logger.info('Topic push notification sent', {
        topic,
        messageId: response,
      });

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      logger.error('Failed to send topic push notification', {
        topic,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async subscribeToTopic(deviceTokens, topic) {
    if (!this.initialized) {
      return { success: false, error: 'Service not configured' };
    }

    try {
      const response = await this.messaging.subscribeToTopic(deviceTokens, topic);

      logger.info('Devices subscribed to topic', {
        topic,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      logger.error('Failed to subscribe to topic', {
        topic,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async unsubscribeFromTopic(deviceTokens, topic) {
    if (!this.initialized) {
      return { success: false, error: 'Service not configured' };
    }

    try {
      const response = await this.messaging.unsubscribeFromTopic(deviceTokens, topic);

      logger.info('Devices unsubscribed from topic', {
        topic,
        successCount: response.successCount,
      });

      return {
        success: true,
        successCount: response.successCount,
      };
    } catch (error) {
      logger.error('Failed to unsubscribe from topic', {
        topic,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Predefined notification templates
  async sendAttendanceNotification(deviceToken, studentName, status, date) {
    return await this.sendToDevice(
      deviceToken,
      {
        title: 'Attendance Update',
        body: `${studentName} was marked ${status} on ${date}`,
      },
      {
        type: 'attendance',
        status,
        date,
      }
    );
  }

  async sendHomeworkNotification(deviceToken, subject, dueDate) {
    return await this.sendToDevice(
      deviceToken,
      {
        title: 'New Homework Assigned',
        body: `${subject} homework is due on ${dueDate}`,
      },
      {
        type: 'homework',
        subject,
        dueDate,
      }
    );
  }

  async sendExamNotification(deviceToken, examName, date, time) {
    return await this.sendToDevice(
      deviceToken,
      {
        title: 'Exam Reminder',
        body: `${examName} is scheduled on ${date} at ${time}`,
      },
      {
        type: 'exam',
        examName,
        date,
        time,
      }
    );
  }

  async sendFeeReminderNotification(deviceToken, amount, dueDate) {
    return await this.sendToDevice(
      deviceToken,
      {
        title: 'Fee Payment Reminder',
        body: `Fee payment of ₹${amount} is due by ${dueDate}`,
      },
      {
        type: 'fee',
        amount,
        dueDate,
      }
    );
  }

  async sendAnnouncementNotification(topic, title, message) {
    return await this.sendToTopic(
      topic,
      {
        title,
        body: message,
      },
      {
        type: 'announcement',
      }
    );
  }

  async sendEmergencyAlert(topic, message) {
    return await this.sendToTopic(
      topic,
      {
        title: '🚨 URGENT ALERT',
        body: message,
      },
      {
        type: 'emergency',
        priority: 'high',
      }
    );
  }
}

export default new PushNotificationService();
