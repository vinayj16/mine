import statisticService from '../services/statisticService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATISTIC_TYPES = ['student', 'teacher', 'attendance', 'finance', 'exam', 'library', 'transport', 'hostel', 'inventory', 'other'];
const VALID_PERIODS = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_HISTORY_LIMIT = 365;

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
  const errors = [];
  
  if (startDate) {
    const startError = validateDate(startDate, 'Start date');
    if (startError) errors.push(startError);
  }
  
  if (endDate) {
    const endError = validateDate(endDate, 'End date');
    if (endError) errors.push(endError);
  }
  
  if (startDate && endDate && !errors.length) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      errors.push('Start date must be before or equal to end date');
    }
  }
  
  return errors;
};

// Get statistic by ID
export const getStatistic = async (req, res) => {
  try {
    logger.info('Fetching statistic by ID');
    
    const { statId } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const statIdError = validateObjectId(statId, 'Statistic ID');
    if (statIdError) errors.push(statIdError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stat = await statisticService.getStatistic(schoolId, statId);
    
    if (!stat) {
      return notFoundResponse(res, 'Statistic not found');
    }
    
    logger.info('Statistic fetched successfully:', { statId });
    return successResponse(res, stat, 'Statistic retrieved successfully');
  } catch (error) {
    logger.error('Error fetching statistic:', error);
    return errorResponse(res, error.message);
  }
};

// Get all statistics
export const getAllStatistics = async (req, res) => {
  try {
    logger.info('Fetching all statistics');
    
    const { type, period, page, limit, sortBy, sortOrder } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (type && !VALID_STATISTIC_TYPES.includes(type)) {
      errors.push('Invalid statistic type. Must be one of: ' + VALID_STATISTIC_TYPES.join(', '));
    }
    
    if (period && !VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: ' + VALID_SORT_ORDERS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = { type, period };
    const options = {
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };
    
    const stats = await statisticService.getAllStatistics(schoolId, filters, options);
    
    logger.info('Statistics fetched successfully:', { count: stats.length });
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Refresh statistic
export const refreshStatistic = async (req, res) => {
  try {
    logger.info('Refreshing statistic');
    
    const { statId } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const statIdError = validateObjectId(statId, 'Statistic ID');
    if (statIdError) errors.push(statIdError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stat = await statisticService.calculateAndSaveStatistic(schoolId, statId);
    
    if (!stat) {
      return notFoundResponse(res, 'Statistic not found');
    }
    
    logger.info('Statistic refreshed successfully:', { statId });
    return successResponse(res, stat, 'Statistic refreshed successfully');
  } catch (error) {
    logger.error('Error refreshing statistic:', error);
    return errorResponse(res, error.message);
  }
};

// Refresh all statistics
export const refreshAllStatistics = async (req, res) => {
  try {
    logger.info('Refreshing all statistics');
    
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await statisticService.refreshAllStatistics(schoolId);
    
    logger.info('All statistics refreshed successfully:', { count: stats.length });
    return successResponse(res, stats, stats.length + ' statistics refreshed successfully');
  } catch (error) {
    logger.error('Error refreshing all statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Acknowledge alert
export const acknowledgeAlert = async (req, res) => {
  try {
    logger.info('Acknowledging alert');
    
    const { statId, alertId } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const statIdError = validateObjectId(statId, 'Statistic ID');
    if (statIdError) errors.push(statIdError);
    
    const alertIdError = validateObjectId(alertId, 'Alert ID');
    if (alertIdError) errors.push(alertIdError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stat = await statisticService.acknowledgeAlert(schoolId, statId, alertId);
    
    if (!stat) {
      return notFoundResponse(res, 'Statistic or alert not found');
    }
    
    logger.info('Alert acknowledged successfully:', { statId, alertId });
    return successResponse(res, stat, 'Alert acknowledged successfully');
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    if (error.message.includes('not found')) {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

// Get statistic history
export const getStatisticHistory = async (req, res) => {
  try {
    logger.info('Fetching statistic history');
    
    const { statId } = req.params;
    const { limit, startDate, endDate } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const statIdError = validateObjectId(statId, 'Statistic ID');
    if (statIdError) errors.push(statIdError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    const limitNum = parseInt(limit) || 30;
    
    if (limitNum < 1 || limitNum > MAX_HISTORY_LIMIT) {
      errors.push('Limit must be between 1 and ' + MAX_HISTORY_LIMIT);
    }
    
    const dateErrors = validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      errors.push(...dateErrors);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const history = await statisticService.getStatisticHistory(
      schoolId,
      statId,
      limitNum,
      startDate,
      endDate
    );
    
    logger.info('Statistic history fetched successfully:', { statId, count: history.length });
    return successResponse(res, history, 'Statistic history retrieved successfully');
  } catch (error) {
    logger.error('Error fetching statistic history:', error);
    return errorResponse(res, error.message);
  }
};

// Get statistics by type
const getStatisticsByType = async (req, res) => {
  try {
    logger.info('Fetching statistics by type');
    
    const { type } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!type) {
      errors.push('Statistic type is required');
    } else if (!VALID_STATISTIC_TYPES.includes(type)) {
      errors.push('Invalid statistic type. Must be one of: ' + VALID_STATISTIC_TYPES.join(', '));
    }
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await statisticService.getStatisticsByType(schoolId, type);
    
    logger.info('Statistics fetched by type successfully:', { type, count: stats.length });
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching statistics by type:', error);
    return errorResponse(res, error.message);
  }
};

// Get statistics by period
const getStatisticsByPeriod = async (req, res) => {
  try {
    logger.info('Fetching statistics by period');
    
    const { period } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!period) {
      errors.push('Period is required');
    } else if (!VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
    }
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await statisticService.getStatisticsByPeriod(schoolId, period);
    
    logger.info('Statistics fetched by period successfully:', { period, count: stats.length });
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching statistics by period:', error);
    return errorResponse(res, error.message);
  }
};

// Get statistics summary
const getStatisticsSummary = async (req, res) => {
  try {
    logger.info('Fetching statistics summary');
    
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const summary = await statisticService.getStatisticsSummary(schoolId);
    
    logger.info('Statistics summary fetched successfully');
    return successResponse(res, summary, 'Statistics summary retrieved successfully');
  } catch (error) {
    logger.error('Error fetching statistics summary:', error);
    return errorResponse(res, error.message);
  }
};

// Get trending statistics
const getTrendingStatistics = async (req, res) => {
  try {
    logger.info('Fetching trending statistics');
    
    const { days } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    const daysNum = parseInt(days) || 7;
    
    if (daysNum < 1 || daysNum > 365) {
      errors.push('Days must be between 1 and 365');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await statisticService.getTrendingStatistics(schoolId, daysNum);
    
    logger.info('Trending statistics fetched successfully:', { days: daysNum });
    return successResponse(res, stats, 'Trending statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching trending statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Compare statistics
const compareStatistics = async (req, res) => {
  try {
    logger.info('Comparing statistics');
    
    const { statIds } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!statIds || !Array.isArray(statIds)) {
      errors.push('Statistic IDs must be an array');
    } else if (statIds.length < 2) {
      errors.push('At least 2 statistic IDs are required for comparison');
    } else if (statIds.length > 10) {
      errors.push('Cannot compare more than 10 statistics at once');
    } else {
      for (const id of statIds) {
        const idError = validateObjectId(id, 'Statistic ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const comparison = await statisticService.compareStatistics(schoolId, statIds);
    
    logger.info('Statistics compared successfully:', { count: statIds.length });
    return successResponse(res, comparison, 'Statistics compared successfully');
  } catch (error) {
    logger.error('Error comparing statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get statistics for date range
const getStatisticsForDateRange = async (req, res) => {
  try {
    logger.info('Fetching statistics for date range');
    
    const { startDate, endDate, type } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!startDate) {
      errors.push('Start date is required');
    }
    
    if (!endDate) {
      errors.push('End date is required');
    }
    
    const dateErrors = validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      errors.push(...dateErrors);
    }
    
    if (type && !VALID_STATISTIC_TYPES.includes(type)) {
      errors.push('Invalid statistic type. Must be one of: ' + VALID_STATISTIC_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await statisticService.getStatisticsForDateRange(schoolId, startDate, endDate, type);
    
    logger.info('Statistics fetched for date range successfully:', { startDate, endDate, count: stats.length });
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching statistics for date range:', error);
    return errorResponse(res, error.message);
  }
};

// Export statistics
const exportStatistics = async (req, res) => {
  try {
    logger.info('Exporting statistics');
    
    const { format, type, period, startDate, endDate } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (type && !VALID_STATISTIC_TYPES.includes(type)) {
      errors.push('Invalid statistic type. Must be one of: ' + VALID_STATISTIC_TYPES.join(', '));
    }
    
    if (period && !VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
    }
    
    const dateErrors = validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      errors.push(...dateErrors);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await statisticService.exportStatistics({
      schoolId,
      format: format.toLowerCase(),
      type,
      period,
      startDate,
      endDate
    });
    
    logger.info('Statistics exported successfully:', { format });
    return successResponse(res, exportData, 'Statistics exported successfully');
  } catch (error) {
    logger.error('Error exporting statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get alerts
const getAlerts = async (req, res) => {
  try {
    logger.info('Fetching alerts');
    
    const { acknowledged } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (acknowledged !== undefined && acknowledged !== 'true' && acknowledged !== 'false') {
      errors.push('Acknowledged must be true or false');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const acknowledgedBool = acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined;
    const alerts = await statisticService.getAlerts(schoolId, acknowledgedBool);
    
    logger.info('Alerts fetched successfully:', { count: alerts.length });
    return successResponse(res, alerts, 'Alerts retrieved successfully');
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk acknowledge alerts
const bulkAcknowledgeAlerts = async (req, res) => {
  try {
    logger.info('Bulk acknowledging alerts');
    
    const { alertIds } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!alertIds || !Array.isArray(alertIds)) {
      errors.push('Alert IDs must be an array');
    } else if (alertIds.length === 0) {
      errors.push('Alert IDs array cannot be empty');
    } else if (alertIds.length > 100) {
      errors.push('Cannot acknowledge more than 100 alerts at once');
    } else {
      for (const id of alertIds) {
        const idError = validateObjectId(id, 'Alert ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await statisticService.bulkAcknowledgeAlerts(schoolId, alertIds);
    
    logger.info('Alerts bulk acknowledged successfully:', { count: result.modifiedCount });
    return successResponse(res, { modifiedCount: result.modifiedCount }, 'Alerts acknowledged successfully');
  } catch (error) {
    logger.error('Error bulk acknowledging alerts:', error);
    return errorResponse(res, error.message);
  }
};

// Get statistics analytics
const getStatisticsAnalytics = async (req, res) => {
  try {
    logger.info('Fetching statistics analytics');
    
    const { groupBy, startDate, endDate } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    const validGroupBy = ['type', 'period', 'day', 'week', 'month', 'year'];
    if (groupBy && !validGroupBy.includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    const dateErrors = validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      errors.push(...dateErrors);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await statisticService.getStatisticsAnalytics(
      schoolId,
      groupBy || 'type',
      startDate,
      endDate
    );
    
    logger.info('Statistics analytics fetched successfully');
    return successResponse(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching statistics analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Delete statistic
const deleteStatistic = async (req, res) => {
  try {
    logger.info('Deleting statistic');
    
    const { statId } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const statIdError = validateObjectId(statId, 'Statistic ID');
    if (statIdError) errors.push(statIdError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await statisticService.deleteStatistic(schoolId, statId);
    
    logger.info('Statistic deleted successfully:', { statId });
    return successResponse(res, null, 'Statistic deleted successfully');
  } catch (error) {
    logger.error('Error deleting statistic:', error);
    if (error.message.includes('not found')) {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

// Bulk delete statistics
const bulkDeleteStatistics = async (req, res) => {
  try {
    logger.info('Bulk deleting statistics');
    
    const { statIds } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!statIds || !Array.isArray(statIds)) {
      errors.push('Statistic IDs must be an array');
    } else if (statIds.length === 0) {
      errors.push('Statistic IDs array cannot be empty');
    } else if (statIds.length > 100) {
      errors.push('Cannot delete more than 100 statistics at once');
    } else {
      for (const id of statIds) {
        const idError = validateObjectId(id, 'Statistic ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await statisticService.bulkDeleteStatistics(schoolId, statIds);
    
    logger.info('Statistics bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Statistics deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getStatistic,
  getAllStatistics,
  refreshStatistic,
  refreshAllStatistics,
  acknowledgeAlert,
  getStatisticHistory,
  getStatisticsByType,
  getStatisticsByPeriod,
  getStatisticsSummary,
  getTrendingStatistics,
  compareStatistics,
  getStatisticsForDateRange,
  exportStatistics,
  getAlerts,
  bulkAcknowledgeAlerts,
  getStatisticsAnalytics,
  deleteStatistic,
  bulkDeleteStatistics
};
