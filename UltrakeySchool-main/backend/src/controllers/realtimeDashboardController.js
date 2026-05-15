import realtimeDashboardService from '../services/realtimeDashboardService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_ROLES = ['super-admin', 'admin', 'teacher', 'student', 'parent', 'staff'];
const VALID_WIDGET_TYPES = ['attendance', 'fees', 'exams', 'announcements', 'events', 'performance', 'library', 'transport', 'custom'];
const VALID_TIME_RANGES = ['today', 'week', 'month', 'quarter', 'year', 'custom'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];

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

// Helper function to validate date format
const validateDate = (date, fieldName = 'Date') => {
  if (!date) return null; // Date is optional
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  const errors = [];
  
  if (startDate) {
    const startDateError = validateDate(startDate, 'Start date');
    if (startDateError) errors.push(startDateError);
  }
  
  if (endDate) {
    const endDateError = validateDate(endDate, 'End date');
    if (endDateError) errors.push(endDateError);
  }
  
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push('Start date must be before end date');
  }
  
  return errors;
};

// Refresh user dashboard
const refreshDashboard = async (req, res) => {
  try {
    logger.info('Refreshing user dashboard');
    
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!userRole) {
      errors.push('User role is required');
    } else if (!VALID_ROLES.includes(userRole)) {
      errors.push('Invalid user role. Must be one of: ' + VALID_ROLES.join(', '));
    }
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const dashboardData = await realtimeDashboardService.refreshUserDashboard(userId, userRole, tenantId);
    
    logger.info('User dashboard refreshed successfully:', { userId });
    return successResponse(res, dashboardData, 'Dashboard refreshed successfully');
  } catch (error) {
    logger.error('Error refreshing user dashboard:', error);
    return errorResponse(res, error.message);
  }
};

// Refresh institution dashboard
const refreshInstitutionDashboard = async (req, res) => {
  try {
    logger.info('Refreshing institution dashboard');
    
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const dashboardData = await realtimeDashboardService.refreshInstitutionDashboard(tenantId);
    
    logger.info('Institution dashboard refreshed successfully:', { tenantId });
    return successResponse(res, dashboardData, 'Institution dashboard refreshed successfully');
  } catch (error) {
    logger.error('Error refreshing institution dashboard:', error);
    return errorResponse(res, error.message);
  }
};

// Update attendance statistics
const updateAttendanceStats = async (req, res) => {
  try {
    logger.info('Updating attendance statistics');
    
    const { date, classId, presentCount, absentCount, lateCount } = req.body;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (date) {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (presentCount !== undefined) {
      if (typeof presentCount !== 'number' || presentCount < 0) {
        errors.push('Present count must be a non-negative number');
      }
    }
    
    if (absentCount !== undefined) {
      if (typeof absentCount !== 'number' || absentCount < 0) {
        errors.push('Absent count must be a non-negative number');
      }
    }
    
    if (lateCount !== undefined) {
      if (typeof lateCount !== 'number' || lateCount < 0) {
        errors.push('Late count must be a non-negative number');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await realtimeDashboardService.updateAttendanceStats(tenantId, req.body);
    
    logger.info('Attendance statistics updated successfully');
    return successResponse(res, null, 'Attendance statistics updated successfully');
  } catch (error) {
    logger.error('Error updating attendance statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Update fee statistics
const updateFeeStats = async (req, res) => {
  try {
    logger.info('Updating fee statistics');
    
    const { totalCollected, totalPending, totalOverdue } = req.body;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (totalCollected !== undefined) {
      if (typeof totalCollected !== 'number' || totalCollected < 0) {
        errors.push('Total collected must be a non-negative number');
      }
    }
    
    if (totalPending !== undefined) {
      if (typeof totalPending !== 'number' || totalPending < 0) {
        errors.push('Total pending must be a non-negative number');
      }
    }
    
    if (totalOverdue !== undefined) {
      if (typeof totalOverdue !== 'number' || totalOverdue < 0) {
        errors.push('Total overdue must be a non-negative number');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await realtimeDashboardService.updateFeeStats(tenantId, req.body);
    
    logger.info('Fee statistics updated successfully');
    return successResponse(res, null, 'Fee statistics updated successfully');
  } catch (error) {
    logger.error('Error updating fee statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Update exam statistics
const updateExamStats = async (req, res) => {
  try {
    logger.info('Updating exam statistics');
    
    const { examId, totalStudents, completedCount, pendingCount, averageScore } = req.body;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (examId) {
      const examIdError = validateObjectId(examId, 'Exam ID');
      if (examIdError) errors.push(examIdError);
    }
    
    if (totalStudents !== undefined) {
      if (typeof totalStudents !== 'number' || totalStudents < 0) {
        errors.push('Total students must be a non-negative number');
      }
    }
    
    if (completedCount !== undefined) {
      if (typeof completedCount !== 'number' || completedCount < 0) {
        errors.push('Completed count must be a non-negative number');
      }
    }
    
    if (pendingCount !== undefined) {
      if (typeof pendingCount !== 'number' || pendingCount < 0) {
        errors.push('Pending count must be a non-negative number');
      }
    }
    
    if (averageScore !== undefined) {
      if (typeof averageScore !== 'number' || averageScore < 0 || averageScore > 100) {
        errors.push('Average score must be between 0 and 100');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await realtimeDashboardService.updateExamStats(tenantId, req.body);
    
    logger.info('Exam statistics updated successfully');
    return successResponse(res, null, 'Exam statistics updated successfully');
  } catch (error) {
    logger.error('Error updating exam statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Send custom statistics update
const sendStatsUpdate = async (req, res) => {
  try {
    logger.info('Sending custom statistics update');
    
    const { userId, statsData } = req.body;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!statsData) {
      errors.push('Stats data is required');
    } else if (typeof statsData !== 'object') {
      errors.push('Stats data must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await realtimeDashboardService.sendStatsUpdate(userId, statsData);
    
    logger.info('Custom statistics update sent successfully:', { userId });
    return successResponse(res, null, 'Statistics update sent successfully');
  } catch (error) {
    logger.error('Error sending custom statistics update:', error);
    return errorResponse(res, error.message);
  }
};

// Get dashboard widgets
const getDashboardWidgets = async (req, res) => {
  try {
    logger.info('Fetching dashboard widgets');
    
    const { widgetType } = req.query;
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!userRole) {
      errors.push('User role is required');
    }
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (widgetType && !VALID_WIDGET_TYPES.includes(widgetType)) {
      errors.push('Invalid widget type. Must be one of: ' + VALID_WIDGET_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const widgets = await realtimeDashboardService.getDashboardWidgets(userId, userRole, tenantId, widgetType);
    
    logger.info('Dashboard widgets fetched successfully:', { userId, widgetType });
    return successResponse(res, widgets, 'Dashboard widgets retrieved successfully');
  } catch (error) {
    logger.error('Error fetching dashboard widgets:', error);
    return errorResponse(res, error.message);
  }
};

// Get real-time analytics
const getRealtimeAnalytics = async (req, res) => {
  try {
    logger.info('Fetching real-time analytics');
    
    const { timeRange, startDate, endDate } = req.query;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (timeRange && !VALID_TIME_RANGES.includes(timeRange)) {
      errors.push('Invalid time range. Must be one of: ' + VALID_TIME_RANGES.join(', '));
    }
    
    if (timeRange === 'custom') {
      const dateRangeErrors = validateDateRange(startDate, endDate);
      errors.push(...dateRangeErrors);
      
      if (!startDate || !endDate) {
        errors.push('Start date and end date are required for custom time range');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await realtimeDashboardService.getRealtimeAnalytics(tenantId, {
      timeRange,
      startDate,
      endDate
    });
    
    logger.info('Real-time analytics fetched successfully');
    return successResponse(res, analytics, 'Real-time analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching real-time analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Get live activity feed
const getLiveActivityFeed = async (req, res) => {
  try {
    logger.info('Fetching live activity feed');
    
    const { limit } = req.query;
    const userId = req.user?._id;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    const limitNum = parseInt(limit) || 50;
    
    if (limitNum < 1 || limitNum > 200) {
      errors.push('Limit must be between 1 and 200');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const activities = await realtimeDashboardService.getLiveActivityFeed(userId, tenantId, limitNum);
    
    logger.info('Live activity feed fetched successfully:', { count: activities.length });
    return successResponse(res, activities, 'Live activity feed retrieved successfully');
  } catch (error) {
    logger.error('Error fetching live activity feed:', error);
    return errorResponse(res, error.message);
  }
};

// Get dashboard notifications
const getDashboardNotifications = async (req, res) => {
  try {
    logger.info('Fetching dashboard notifications');
    
    const { unreadOnly } = req.query;
    const userId = req.user?._id;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const notifications = await realtimeDashboardService.getDashboardNotifications(
      userId,
      tenantId,
      unreadOnly === 'true'
    );
    
    logger.info('Dashboard notifications fetched successfully:', { count: notifications.length });
    return successResponse(res, notifications, 'Dashboard notifications retrieved successfully');
  } catch (error) {
    logger.error('Error fetching dashboard notifications:', error);
    return errorResponse(res, error.message);
  }
};

// Broadcast dashboard update
const broadcastDashboardUpdate = async (req, res) => {
  try {
    logger.info('Broadcasting dashboard update');
    
    const { updateType, updateData, targetRoles, targetUsers } = req.body;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (!updateType || updateType.trim().length === 0) {
      errors.push('Update type is required');
    }
    
    if (!updateData) {
      errors.push('Update data is required');
    } else if (typeof updateData !== 'object') {
      errors.push('Update data must be an object');
    }
    
    if (targetRoles && !Array.isArray(targetRoles)) {
      errors.push('Target roles must be an array');
    } else if (targetRoles) {
      for (const role of targetRoles) {
        if (!VALID_ROLES.includes(role)) {
          errors.push('Invalid target role: ' + role);
          break;
        }
      }
    }
    
    if (targetUsers && !Array.isArray(targetUsers)) {
      errors.push('Target users must be an array');
    } else if (targetUsers) {
      for (const userId of targetUsers) {
        const userIdError = validateObjectId(userId, 'Target user ID');
        if (userIdError) {
          errors.push(userIdError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await realtimeDashboardService.broadcastDashboardUpdate(tenantId, {
      updateType,
      updateData,
      targetRoles,
      targetUsers
    });
    
    logger.info('Dashboard update broadcasted successfully:', { updateType });
    return successResponse(res, null, 'Dashboard update broadcasted successfully');
  } catch (error) {
    logger.error('Error broadcasting dashboard update:', error);
    return errorResponse(res, error.message);
  }
};

// Get dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    logger.info('Fetching dashboard summary');
    
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!userRole) {
      errors.push('User role is required');
    }
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const summary = await realtimeDashboardService.getDashboardSummary(userId, userRole, tenantId);
    
    logger.info('Dashboard summary fetched successfully');
    return successResponse(res, summary, 'Dashboard summary retrieved successfully');
  } catch (error) {
    logger.error('Error fetching dashboard summary:', error);
    return errorResponse(res, error.message);
  }
};

// Get performance metrics
const getPerformanceMetrics = async (req, res) => {
  try {
    logger.info('Fetching performance metrics');
    
    const { metricType, timeRange } = req.query;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (timeRange && !VALID_TIME_RANGES.includes(timeRange)) {
      errors.push('Invalid time range. Must be one of: ' + VALID_TIME_RANGES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const metrics = await realtimeDashboardService.getPerformanceMetrics(tenantId, {
      metricType,
      timeRange
    });
    
    logger.info('Performance metrics fetched successfully');
    return successResponse(res, metrics, 'Performance metrics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    return errorResponse(res, error.message);
  }
};

// Export dashboard data
const exportDashboardData = async (req, res) => {
  try {
    logger.info('Exporting dashboard data');
    
    const { format, widgetType, startDate, endDate } = req.query;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (widgetType && !VALID_WIDGET_TYPES.includes(widgetType)) {
      errors.push('Invalid widget type. Must be one of: ' + VALID_WIDGET_TYPES.join(', '));
    }
    
    const dateRangeErrors = validateDateRange(startDate, endDate);
    errors.push(...dateRangeErrors);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await realtimeDashboardService.exportDashboardData(tenantId, {
      format: format.toLowerCase(),
      widgetType,
      startDate,
      endDate
    });
    
    logger.info('Dashboard data exported successfully:', { format });
    return successResponse(res, exportData, 'Dashboard data exported successfully');
  } catch (error) {
    logger.error('Error exporting dashboard data:', error);
    return errorResponse(res, error.message);
  }
};

// Get widget configuration
const getWidgetConfiguration = async (req, res) => {
  try {
    logger.info('Fetching widget configuration');
    
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!userRole) {
      errors.push('User role is required');
    }
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const configuration = await realtimeDashboardService.getWidgetConfiguration(userId, userRole, tenantId);
    
    logger.info('Widget configuration fetched successfully');
    return successResponse(res, configuration, 'Widget configuration retrieved successfully');
  } catch (error) {
    logger.error('Error fetching widget configuration:', error);
    return errorResponse(res, error.message);
  }
};

// Update widget configuration
const updateWidgetConfiguration = async (req, res) => {
  try {
    logger.info('Updating widget configuration');
    
    const { widgets, layout } = req.body;
    const userId = req.user?._id;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (widgets && !Array.isArray(widgets)) {
      errors.push('Widgets must be an array');
    } else if (widgets) {
      for (const widget of widgets) {
        if (widget.type && !VALID_WIDGET_TYPES.includes(widget.type)) {
          errors.push('Invalid widget type: ' + widget.type);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const configuration = await realtimeDashboardService.updateWidgetConfiguration(userId, tenantId, {
      widgets,
      layout
    });
    
    logger.info('Widget configuration updated successfully:', { userId });
    return successResponse(res, configuration, 'Widget configuration updated successfully');
  } catch (error) {
    logger.error('Error updating widget configuration:', error);
    return errorResponse(res, error.message);
  }
};

// Get system health status
const getSystemHealthStatus = async (req, res) => {
  try {
    logger.info('Fetching system health status');
    
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const healthStatus = await realtimeDashboardService.getSystemHealthStatus(tenantId);
    
    logger.info('System health status fetched successfully');
    return successResponse(res, healthStatus, 'System health status retrieved successfully');
  } catch (error) {
    logger.error('Error fetching system health status:', error);
    return errorResponse(res, error.message);
  }
};

// Get active users count
const getActiveUsersCount = async (req, res) => {
  try {
    logger.info('Fetching active users count');
    
    const { timeWindow } = req.query;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    const timeWindowNum = parseInt(timeWindow) || 15;
    
    if (timeWindowNum < 1 || timeWindowNum > 1440) {
      errors.push('Time window must be between 1 and 1440 minutes (24 hours)');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const activeUsers = await realtimeDashboardService.getActiveUsersCount(tenantId, timeWindowNum);
    
    logger.info('Active users count fetched successfully:', { count: activeUsers.count });
    return successResponse(res, activeUsers, 'Active users count retrieved successfully');
  } catch (error) {
    logger.error('Error fetching active users count:', error);
    return errorResponse(res, error.message);
  }
};

// Get trending topics
const getTrendingTopics = async (req, res) => {
  try {
    logger.info('Fetching trending topics');
    
    const { limit } = req.query;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    const limitNum = parseInt(limit) || 10;
    
    if (limitNum < 1 || limitNum > 50) {
      errors.push('Limit must be between 1 and 50');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const topics = await realtimeDashboardService.getTrendingTopics(tenantId, limitNum);
    
    logger.info('Trending topics fetched successfully:', { count: topics.length });
    return successResponse(res, topics, 'Trending topics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching trending topics:', error);
    return errorResponse(res, error.message);
  }
};

// Reset dashboard to default
const resetDashboardToDefault = async (req, res) => {
  try {
    logger.info('Resetting dashboard to default');
    
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const tenantId = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!userRole) {
      errors.push('User role is required');
    }
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const defaultConfig = await realtimeDashboardService.resetDashboardToDefault(userId, userRole, tenantId);
    
    logger.info('Dashboard reset to default successfully:', { userId });
    return successResponse(res, defaultConfig, 'Dashboard reset to default successfully');
  } catch (error) {
    logger.error('Error resetting dashboard to default:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  refreshDashboard,
  refreshInstitutionDashboard,
  updateAttendanceStats,
  updateFeeStats,
  updateExamStats,
  sendStatsUpdate,
  getDashboardWidgets,
  getRealtimeAnalytics,
  getLiveActivityFeed,
  getDashboardNotifications,
  broadcastDashboardUpdate,
  getDashboardSummary,
  getPerformanceMetrics,
  exportDashboardData,
  getWidgetConfiguration,
  updateWidgetConfiguration,
  getSystemHealthStatus,
  getActiveUsersCount,
  getTrendingTopics,
  resetDashboardToDefault
};
