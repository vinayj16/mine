import feeReminderService from '../services/feeReminderService.js';
import FeeReminder from '../models/FeeReminder.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_CHANNELS = ['email', 'sms', 'whatsapp', 'push', 'all'];
const VALID_REMINDER_STATUSES = ['pending', 'sent', 'failed', 'scheduled', 'cancelled'];
const VALID_REMINDER_TYPES = ['overdue', 'upcoming', 'final', 'courtesy', 'custom'];
const VALID_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly'];

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

// Helper function to validate date
const validateDate = (dateString, fieldName = 'Date') => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    return 'Start date must be before end date';
  }
  return null;
};

// Helper function to validate array
const validateArray = (arr, validValues, fieldName = 'Field') => {
  if (!Array.isArray(arr)) return null;
  const invalid = arr.filter(item => !validValues.includes(item));
  if (invalid.length > 0) {
    return 'Invalid ' + fieldName + ' values: ' + invalid.join(', ');
  }
  return null;
};

// Send Fee Reminders
const sendFeeReminders = async (req, res) => {
  try {
    logger.info('Sending fee reminders');
    
    const { studentIds, channels, reminderType, message, scheduleDate } = req.body;
    const tenant = req.user.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant is required');
    }
    
    if (studentIds && Array.isArray(studentIds)) {
      if (studentIds.length === 0) {
        errors.push('Student IDs array cannot be empty');
      } else if (studentIds.length > 1000) {
        errors.push('Cannot send reminders to more than 1000 students at once');
      }
      
      for (let i = 0; i < Math.min(studentIds.length, 10); i++) {
        const idError = validateObjectId(studentIds[i], 'Student ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (channels) {
      if (!Array.isArray(channels)) {
        errors.push('Channels must be an array');
      } else {
        const channelsError = validateArray(channels, VALID_CHANNELS, 'Channels');
        if (channelsError) errors.push(channelsError);
      }
    }
    
    if (reminderType && !VALID_REMINDER_TYPES.includes(reminderType)) {
      errors.push('Invalid reminder type. Must be one of: ' + VALID_REMINDER_TYPES.join(', '));
    }
    
    if (message && message.length > 1000) {
      errors.push('Message must not exceed 1000 characters');
    }
    
    if (scheduleDate) {
      const scheduleDateError = validateDate(scheduleDate, 'Schedule date');
      if (scheduleDateError) errors.push(scheduleDateError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const results = await feeReminderService.sendFeeReminders(tenant, req.body);
    
    logger.info('Fee reminders sent successfully:', { count: results.sent || 0 });
    return successResponse(res, results, 'Fee reminders sent successfully');
  } catch (error) {
    logger.error('Error sending fee reminders:', error);
    return errorResponse(res, error.message);
  }
};

// Send Bulk Reminders
const sendBulkReminders = async (req, res) => {
  try {
    logger.info('Sending bulk fee reminders');
    
    const { studentIds, channels } = req.body;
    const tenant = req.user.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant is required');
    }
    
    if (!studentIds || !Array.isArray(studentIds)) {
      errors.push('Student IDs array is required');
    } else if (studentIds.length === 0) {
      errors.push('Student IDs array cannot be empty');
    } else if (studentIds.length > 1000) {
      errors.push('Cannot send reminders to more than 1000 students at once');
    }
    
    if (studentIds && Array.isArray(studentIds)) {
      for (let i = 0; i < Math.min(studentIds.length, 10); i++) {
        const idError = validateObjectId(studentIds[i], 'Student ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (channels) {
      if (!Array.isArray(channels)) {
        errors.push('Channels must be an array');
      } else {
        const channelsError = validateArray(channels, VALID_CHANNELS, 'Channels');
        if (channelsError) errors.push(channelsError);
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const results = await feeReminderService.sendBulkReminders(tenant, studentIds, { channels });
    
    logger.info('Bulk reminders sent successfully:', { count: results.sent || 0 });
    return successResponse(res, results, 'Bulk reminders sent successfully');
  } catch (error) {
    logger.error('Error sending bulk reminders:', error);
    return errorResponse(res, error.message);
  }
};

// Schedule Automatic Reminders
const scheduleAutomaticReminders = async (req, res) => {
  try {
    logger.info('Scheduling automatic fee reminders');
    
    const { frequency, channels, reminderType, daysBeforeDue, enabled } = req.body;
    const tenant = req.user.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant is required');
    }
    
    if (frequency && !VALID_FREQUENCIES.includes(frequency)) {
      errors.push('Invalid frequency. Must be one of: ' + VALID_FREQUENCIES.join(', '));
    }
    
    if (channels) {
      if (!Array.isArray(channels)) {
        errors.push('Channels must be an array');
      } else {
        const channelsError = validateArray(channels, VALID_CHANNELS, 'Channels');
        if (channelsError) errors.push(channelsError);
      }
    }
    
    if (reminderType && !VALID_REMINDER_TYPES.includes(reminderType)) {
      errors.push('Invalid reminder type. Must be one of: ' + VALID_REMINDER_TYPES.join(', '));
    }
    
    if (daysBeforeDue !== undefined) {
      const daysNum = parseInt(daysBeforeDue);
      if (isNaN(daysNum) || daysNum < 0) {
        errors.push('Days before due must be a non-negative number');
      } else if (daysNum > 365) {
        errors.push('Days before due must not exceed 365');
      }
    }
    
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      errors.push('Enabled must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await feeReminderService.scheduleAutomaticReminders(tenant, req.body);
    
    logger.info('Automatic reminders scheduled successfully');
    return successResponse(res, result, 'Automatic reminders scheduled successfully');
  } catch (error) {
    logger.error('Error scheduling automatic reminders:', error);
    return errorResponse(res, error.message);
  }
};

// Get Reminder Statistics
const getReminderStatistics = async (req, res) => {
  try {
    logger.info('Fetching reminder statistics');
    
    const { startDate, endDate, channel, status, reminderType } = req.query;
    const tenant = req.user.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant is required');
    }
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (channel && !VALID_CHANNELS.includes(channel)) {
      errors.push('Invalid channel. Must be one of: ' + VALID_CHANNELS.join(', '));
    }
    
    if (status && !VALID_REMINDER_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_REMINDER_STATUSES.join(', '));
    }
    
    if (reminderType && !VALID_REMINDER_TYPES.includes(reminderType)) {
      errors.push('Invalid reminder type. Must be one of: ' + VALID_REMINDER_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await feeReminderService.getReminderStatistics(tenant, req.query);
    
    logger.info('Reminder statistics fetched successfully');
    return successResponse(res, stats, 'Reminder statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching reminder statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get Reminder History
const getReminderHistory = async (req, res) => {
  try {
    logger.info('Fetching reminder history');
    
    const { studentId, startDate, endDate, status, channel, page, limit } = req.query;
    const tenant = req.user.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant is required');
    }
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (status && !VALID_REMINDER_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_REMINDER_STATUSES.join(', '));
    }
    
    if (channel && !VALID_CHANNELS.includes(channel)) {
      errors.push('Invalid channel. Must be one of: ' + VALID_CHANNELS.join(', '));
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
    
    const filters = { tenant, studentId, startDate, endDate, status, channel };
    const history = await FeeReminder.find(filters)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();
    
    const total = await FeeReminder.countDocuments(filters);
    
    logger.info('Reminder history fetched successfully');
    return successResponse(res, {
      reminders: history,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Reminder history retrieved successfully');
  } catch (error) {
    logger.error('Error fetching reminder history:', error);
    return errorResponse(res, error.message);
  }
};

// Cancel Scheduled Reminder
const cancelScheduledReminder = async (req, res) => {
  try {
    logger.info('Cancelling scheduled reminder');
    
    const { reminderId } = req.params;
    const tenant = req.user.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant is required');
    }
    
    const reminderIdError = validateObjectId(reminderId, 'Reminder ID');
    if (reminderIdError) errors.push(reminderIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const reminder = await FeeReminder.findOneAndUpdate(
      { _id: reminderId, tenant, status: 'scheduled' },
      { status: 'cancelled', cancelledAt: new Date() },
      { new: true }
    );
    
    if (!reminder) {
      return notFoundResponse(res, 'Scheduled reminder not found');
    }
    
    logger.info('Scheduled reminder cancelled successfully:', { reminderId });
    return successResponse(res, reminder, 'Reminder cancelled successfully');
  } catch (error) {
    logger.error('Error cancelling scheduled reminder:', error);
    return errorResponse(res, error.message);
  }
};

// Retry Failed Reminders
const retryFailedReminders = async (req, res) => {
  try {
    logger.info('Retrying failed reminders');
    
    const { reminderIds } = req.body;
    const tenant = req.user.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant is required');
    }
    
    if (!Array.isArray(reminderIds) || reminderIds.length === 0) {
      errors.push('Reminder IDs array is required and must not be empty');
    }
    
    if (reminderIds && reminderIds.length > 100) {
      errors.push('Cannot retry more than 100 reminders at once');
    }
    
    if (reminderIds) {
      for (let i = 0; i < reminderIds.length; i++) {
        const idError = validateObjectId(reminderIds[i], 'Reminder ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const results = await feeReminderService.retryFailedReminders(tenant, reminderIds);
    
    logger.info('Failed reminders retried successfully:', { count: results.retried || 0 });
    return successResponse(res, results, 'Failed reminders retried successfully');
  } catch (error) {
    logger.error('Error retrying failed reminders:', error);
    return errorResponse(res, error.message);
  }
};

// Export Reminder Data
const exportReminderData = async (req, res) => {
  try {
    logger.info('Exporting reminder data');
    
    const { format, startDate, endDate, status, channel } = req.query;
    const tenant = req.user.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant is required');
    }
    
    const validFormats = ['json', 'csv', 'xlsx'];
    if (!format) {
      errors.push('Format is required');
    } else if (!validFormats.includes(format)) {
      errors.push('Invalid format. Must be one of: ' + validFormats.join(', '));
    }
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (status && !VALID_REMINDER_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_REMINDER_STATUSES.join(', '));
    }
    
    if (channel && !VALID_CHANNELS.includes(channel)) {
      errors.push('Invalid channel. Must be one of: ' + VALID_CHANNELS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = { tenant };
    if (status) filters.status = status;
    if (channel) filters.channel = channel;
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }
    
    const reminders = await FeeReminder.find(filters).lean();
    
    logger.info('Reminder data exported successfully:', { format, count: reminders.length });
    return successResponse(res, {
      format,
      count: reminders.length,
      data: reminders,
      exportedAt: new Date()
    }, 'Reminder data exported successfully');
  } catch (error) {
    logger.error('Error exporting reminder data:', error);
    return errorResponse(res, error.message);
  }
};


export default {
  sendFeeReminders,
  sendBulkReminders,
  scheduleAutomaticReminders,
  getReminderStatistics,
  getReminderHistory,
  cancelScheduledReminder,
  retryFailedReminders,
  exportReminderData
};
