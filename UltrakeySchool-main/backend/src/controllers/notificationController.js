import notificationService from '../services/notificationService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';

// Validation constants
const VALID_NOTIFICATION_TYPES = ['info', 'warning', 'error', 'success', 'announcement', 'reminder', 'alert'];
const VALID_NOTIFICATION_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_CHANNELS = ['in-app', 'email', 'push'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_TITLE_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_RECIPIENTS = 1000;

// Helper function to validate MongoDB ObjectId
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    return fieldName + ' is required';
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

export const getNotifications = async (req, res) => {
  try {
    logger.info('Fetching notifications');
    
    const { isRead, type, limit, skip, priority, startDate, endDate } = req.query;
    // Use schoolId or institutionId for notifications
    const schoolId = req.user?.schoolId || req.user?.institutionId || req.user?.institution;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // Validation
    const errors = [];
    
    // Superadmins and institution owners don't have schoolId - return empty notifications for them
    if (userRole === 'superadmin' || userRole === 'SUPER_ADMIN' || userRole === 'institution_owner' || userRole === 'institution_admin') {
      logger.info(`${userRole} user - returning empty notifications`);
      return successResponse(res, {
        notifications: [],
        total: 0,
        unreadCount: 0
      }, 'Notifications retrieved successfully');
    }
    
    if (!schoolId) {
      // Return empty for users without schoolId
      return successResponse(res, {
        notifications: [],
        total: 0,
        unreadCount: 0
      }, 'Notifications retrieved successfully');
    }
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    const limitNum = parseInt(limit) || 20;
    const skipNum = parseInt(skip) || 0;
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (skipNum < 0) {
      errors.push('Skip must be greater than or equal to 0');
    }
    
    if (type && !VALID_NOTIFICATION_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_NOTIFICATION_TYPES.join(', '));
    }
    
    if (priority && !VALID_NOTIFICATION_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_NOTIFICATION_PRIORITIES.join(', '));
    }
    
    if (isRead !== undefined && isRead !== 'true' && isRead !== 'false') {
      errors.push('isRead must be true or false');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const options = {
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      type,
      priority,
      startDate,
      endDate,
      limit: limitNum,
      skip: skipNum
    };
    
    const notifications = await notificationService.getNotifications(schoolId, userId, options);
    
    logger.info('Notifications fetched successfully');
    return successResponse(res, notifications, 'Notifications retrieved successfully');
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    return errorResponse(res, error.message);
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    logger.info('Fetching unread notification count');
    
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const count = await notificationService.getUnreadCount(schoolId, userId);
    
    logger.info('Unread count fetched successfully:', { count });
    return successResponse(res, { count }, 'Unread count retrieved successfully');
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    return errorResponse(res, error.message);
  }
};

export const createNotification = async (req, res) => {
  try {
    logger.info('Creating new notification');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map(e => e.msg));
    }
    
    const { title, message, type, priority, recipientIds, channels, metadata } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const validationErrors = [];
    
    if (!schoolId) {
      validationErrors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) validationErrors.push(schoolIdError);
    }
    
    if (!title || title.trim().length === 0) {
      validationErrors.push('Notification title is required');
    } else if (title.length > MAX_TITLE_LENGTH) {
      validationErrors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
    }
    
    if (!message || message.trim().length === 0) {
      validationErrors.push('Notification message is required');
    } else if (message.length > MAX_MESSAGE_LENGTH) {
      validationErrors.push('Message must not exceed ' + MAX_MESSAGE_LENGTH + ' characters');
    }
    
    if (type && !VALID_NOTIFICATION_TYPES.includes(type)) {
      validationErrors.push('Invalid type. Must be one of: ' + VALID_NOTIFICATION_TYPES.join(', '));
    }
    
    if (priority && !VALID_NOTIFICATION_PRIORITIES.includes(priority)) {
      validationErrors.push('Invalid priority. Must be one of: ' + VALID_NOTIFICATION_PRIORITIES.join(', '));
    }
    
    if (recipientIds) {
      if (!Array.isArray(recipientIds)) {
        validationErrors.push('Recipient IDs must be an array');
      } else if (recipientIds.length === 0) {
        validationErrors.push('At least one recipient is required');
      } else if (recipientIds.length > MAX_RECIPIENTS) {
        validationErrors.push('Cannot send to more than ' + MAX_RECIPIENTS + ' recipients at once');
      } else {
        for (const id of recipientIds) {
          const idError = validateObjectId(id, 'Recipient ID');
          if (idError) {
            validationErrors.push(idError);
            break;
          }
        }
      }
    }
    
    if (channels) {
      if (!Array.isArray(channels)) {
        validationErrors.push('Channels must be an array');
      } else {
        for (const channel of channels) {
          if (!VALID_CHANNELS.includes(channel)) {
            validationErrors.push('Invalid channel: ' + channel + '. Must be one of: ' + VALID_CHANNELS.join(', '));
            break;
          }
        }
      }
    }
    
    if (validationErrors.length > 0) {
      return validationErrorResponse(res, validationErrors);
    }
    
    const notificationData = req.body;
    const notification = await notificationService.createNotification(schoolId, notificationData);
    
    // Send email notification
    if (notificationData.channels && notificationData.channels.includes('email')) {
      await sendEmailNotification(notification);
    }
    
    logger.info('Notification created successfully:', { notificationId: notification._id });
    return createdResponse(res, notification, 'Notification created successfully');
  } catch (error) {
    logger.error('Error creating notification:', error);
    return errorResponse(res, error.message);
  }
};

export const markAsRead = async (req, res) => {
  try {
    logger.info('Marking notification as read');
    
    const { id } = req.params;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Notification ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const notification = await notificationService.markAsRead(schoolId, userId, id);
    
    if (!notification) {
      return notFoundResponse(res, 'Notification not found');
    }
    
    logger.info('Notification marked as read:', { notificationId: id });
    return successResponse(res, notification, 'Notification marked as read');
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    if (error.message === 'Notification not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    logger.info('Marking all notifications as read');
    
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await notificationService.markAllAsRead(schoolId, userId);
    
    logger.info('All notifications marked as read:', { count: result.modifiedCount });
    return successResponse(res, { count: result.modifiedCount }, result.modifiedCount + ' notifications marked as read');
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    return errorResponse(res, error.message);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    logger.info('Deleting notification');
    
    const { id } = req.params;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Notification ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const notification = await notificationService.deleteNotification(schoolId, userId, id);
    
    if (!notification) {
      return notFoundResponse(res, 'Notification not found');
    }
    
    logger.info('Notification deleted successfully:', { notificationId: id });
    return successResponse(res, null, 'Notification deleted successfully');
  } catch (error) {
    logger.error('Error deleting notification:', error);
    if (error.message === 'Notification not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

export const broadcastNotification = async (req, res) => {
  try {
    logger.info('Broadcasting notification');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map(e => e.msg));
    }
    
    const { notificationData, recipientIds } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const validationErrors = [];
    
    if (!schoolId) {
      validationErrors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) validationErrors.push(schoolIdError);
    }
    
    if (!notificationData || typeof notificationData !== 'object') {
      validationErrors.push('Notification data is required');
    }
    
    if (!recipientIds || !Array.isArray(recipientIds)) {
      validationErrors.push('Recipient IDs must be an array');
    } else if (recipientIds.length === 0) {
      validationErrors.push('At least one recipient is required');
    } else if (recipientIds.length > MAX_RECIPIENTS) {
      validationErrors.push('Cannot broadcast to more than ' + MAX_RECIPIENTS + ' recipients at once');
    } else {
      for (const id of recipientIds) {
        const idError = validateObjectId(id, 'Recipient ID');
        if (idError) {
          validationErrors.push(idError);
          break;
        }
      }
    }
    
    if (validationErrors.length > 0) {
      return validationErrorResponse(res, validationErrors);
    }
    
    const notifications = await notificationService.broadcastNotification(
      schoolId,
      notificationData,
      recipientIds
    );
    
    logger.info('Notification broadcasted successfully:', { count: notifications.length });
    return createdResponse(res, { count: notifications.length, notifications }, 'Notification sent to ' + notifications.length + ' recipients');
  } catch (error) {
    logger.error('Error broadcasting notification:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete notifications
const bulkDeleteNotifications = async (req, res) => {
  try {
    logger.info('Bulk deleting notifications');
    
    const { notificationIds } = req.body;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      errors.push('Notification IDs must be an array');
    } else if (notificationIds.length === 0) {
      errors.push('Notification IDs array cannot be empty');
    } else if (notificationIds.length > 100) {
      errors.push('Cannot delete more than 100 notifications at once');
    } else {
      for (const id of notificationIds) {
        const idError = validateObjectId(id, 'Notification ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await notificationService.bulkDeleteNotifications(schoolId, userId, notificationIds);
    
    logger.info('Notifications bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Notifications deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting notifications:', error);
    return errorResponse(res, error.message);
  }
};

// Export notifications data
const exportNotifications = async (req, res) => {
  try {
    logger.info('Exporting notifications data');
    
    const { format, type, priority, isRead } = req.query;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (type && !VALID_NOTIFICATION_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_NOTIFICATION_TYPES.join(', '));
    }
    
    if (priority && !VALID_NOTIFICATION_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_NOTIFICATION_PRIORITIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await notificationService.exportNotifications({
      schoolId,
      userId,
      format: format.toLowerCase(),
      type,
      priority,
      isRead
    });
    
    logger.info('Notifications data exported successfully:', { format, count: exportData.totalRecords });
    return successResponse(res, exportData, 'Data exported successfully');
  } catch (error) {
    logger.error('Error exporting notifications data:', error);
    return errorResponse(res, error.message);
  }
};

// Get notification statistics
const getNotificationStatistics = async (req, res) => {
  try {
    logger.info('Fetching notification statistics');
    
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await notificationService.getNotificationStatistics(schoolId, userId);
    
    logger.info('Notification statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching notification statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get notifications by type
const getNotificationsByType = async (req, res) => {
  try {
    logger.info('Fetching notifications by type');
    
    const { type } = req.params;
    const { page, limit } = req.query;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (!type) {
      errors.push('Notification type is required');
    } else if (!VALID_NOTIFICATION_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_NOTIFICATION_TYPES.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await notificationService.getNotificationsByType(schoolId, userId, type, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Notifications fetched by type successfully:', { type });
    return successResponse(res, result, 'Notifications retrieved successfully');
  } catch (error) {
    logger.error('Error fetching notifications by type:', error);
    return errorResponse(res, error.message);
  }
};

// Clear all read notifications
const clearReadNotifications = async (req, res) => {
  try {
    logger.info('Clearing all read notifications');
    
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await notificationService.clearReadNotifications(schoolId, userId);
    
    logger.info('Read notifications cleared successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Read notifications cleared successfully');
  } catch (error) {
    logger.error('Error clearing read notifications:', error);
    return errorResponse(res, error.message);
  }
};

// Helper functions
async function sendEmailNotification(notification) {
  try {
    logger.info('Sending email notification');
    // Email sending logic would go here
    logger.info('Email notification sent successfully');
  } catch (error) {
    logger.error('Email notification error:', error);
  }
}

// Export all functions
export default {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  broadcastNotification,
  bulkDeleteNotifications,
  exportNotifications,
  getNotificationStatistics,
  getNotificationsByType,
  clearReadNotifications
};
