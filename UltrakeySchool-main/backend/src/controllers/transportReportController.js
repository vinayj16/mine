import transportReportService from '../services/transportReportService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_REPORT_TYPES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom', 'vehicle_usage', 'route_performance', 'fuel_consumption', 'maintenance', 'attendance', 'financial'];
const VALID_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
const VALID_PERIODS = ['day', 'week', 'month', 'quarter', 'year', 'custom'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_NAME_LENGTH = 200;

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
  if (start >= end) {
    return 'Start date must be before end date';
  }
  return null;
};

const getAllReports = async (req, res) => {
  try {
    logger.info('Fetching all transport reports');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { reportType, status, period, startDate, endDate, page, limit, sortBy, sortOrder } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (reportType && !VALID_REPORT_TYPES.includes(reportType)) {
      errors.push('Invalid report type. Must be one of: ' + VALID_REPORT_TYPES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (period && !VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
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
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: ' + VALID_SORT_ORDERS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = {
      reportType,
      status,
      period,
      startDate,
      endDate,
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };
    
    const result = await transportReportService.getAllReports(institutionId, filters);
    
    logger.info('Transport reports fetched successfully:', { institutionId, count: result.data?.length || 0 });
    return successResponse(res, result, 'Transport reports retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport reports:', error);
    return errorResponse(res, error.message);
  }
};

const getReportById = async (req, res) => {
  try {
    logger.info('Fetching transport report by ID');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Report ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const report = await transportReportService.getReportById(id, institutionId);
    
    if (!report) {
      return notFoundResponse(res, 'Transport report not found');
    }
    
    logger.info('Transport report fetched successfully:', { id });
    return successResponse(res, report, 'Transport report retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport report:', error);
    return errorResponse(res, error.message);
  }
};

const generateReport = async (req, res) => {
  try {
    logger.info('Generating transport report');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { reportType, period, startDate, endDate, name, description, parameters } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!reportType) {
      errors.push('Report type is required');
    } else if (!VALID_REPORT_TYPES.includes(reportType)) {
      errors.push('Invalid report type. Must be one of: ' + VALID_REPORT_TYPES.join(', '));
    }
    
    if (period && !VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
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
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    if (name && name.length > MAX_NAME_LENGTH) {
      errors.push('Report name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (parameters && typeof parameters !== 'object') {
      errors.push('Parameters must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const report = await transportReportService.generateReport(institutionId, req.body);
    
    logger.info('Transport report generation started:', { reportId: report._id, reportType });
    return createdResponse(res, report, 'Report generation started');
  } catch (error) {
    logger.error('Error generating transport report:', error);
    return errorResponse(res, error.message);
  }
};

const updateReport = async (req, res) => {
  try {
    logger.info('Updating transport report');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    const { name, description, status } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Report ID');
    if (idError) errors.push(idError);
    
    if (name && name.length > MAX_NAME_LENGTH) {
      errors.push('Report name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const report = await transportReportService.updateReport(id, institutionId, req.body);
    
    if (!report) {
      return notFoundResponse(res, 'Transport report not found');
    }
    
    logger.info('Transport report updated successfully:', { id });
    return successResponse(res, report, 'Report updated successfully');
  } catch (error) {
    logger.error('Error updating transport report:', error);
    return errorResponse(res, error.message);
  }
};

const deleteReport = async (req, res) => {
  try {
    logger.info('Deleting transport report');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Report ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportReportService.deleteReport(id, institutionId);
    
    if (!result) {
      return notFoundResponse(res, 'Transport report not found');
    }
    
    logger.info('Transport report deleted successfully:', { id });
    return successResponse(res, null, 'Report deleted successfully');
  } catch (error) {
    logger.error('Error deleting transport report:', error);
    return errorResponse(res, error.message);
  }
};

const bulkDeleteReports = async (req, res) => {
  try {
    logger.info('Bulk deleting transport reports');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { ids } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      errors.push('Report IDs array is required and must not be empty');
    } else {
      for (let i = 0; i < ids.length; i++) {
        const idError = validateObjectId(ids[i], 'Report ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportReportService.bulkDeleteReports(ids, institutionId);
    
    logger.info('Transport reports bulk deleted successfully:', { count: result.modifiedCount || result.deletedCount || 0 });
    return successResponse(res, result, result.modifiedCount + ' report(s) deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting transport reports:', error);
    return errorResponse(res, error.message);
  }
};

const getTransportStatistics = async (req, res) => {
  try {
    logger.info('Fetching transport statistics');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await transportReportService.getTransportStatistics(institutionId, { startDate, endDate });
    
    logger.info('Transport statistics fetched successfully');
    return successResponse(res, statistics, 'Transport statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport statistics:', error);
    return errorResponse(res, error.message);
  }
};

const getReportsByType = async (req, res) => {
  try {
    logger.info('Fetching transport reports by type');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { reportType } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!reportType) {
      errors.push('Report type is required');
    } else if (!VALID_REPORT_TYPES.includes(reportType)) {
      errors.push('Invalid report type. Must be one of: ' + VALID_REPORT_TYPES.join(', '));
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
    
    const result = await transportReportService.getReportsByType(reportType, institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Transport reports by type fetched successfully:', { reportType });
    return successResponse(res, result, 'Reports retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport reports by type:', error);
    return errorResponse(res, error.message);
  }
};

const searchReports = async (req, res) => {
  try {
    logger.info('Searching transport reports');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { searchTerm, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!searchTerm || searchTerm.trim().length === 0) {
      errors.push('Search term is required');
    } else if (searchTerm.length > 200) {
      errors.push('Search term must not exceed 200 characters');
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
    
    const result = await transportReportService.searchReports(institutionId, searchTerm, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Transport reports searched successfully:', { searchTerm });
    return successResponse(res, result, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching transport reports:', error);
    return errorResponse(res, error.message);
  }
};


const getReportsByStatus = async (req, res) => {
  try {
    logger.info('Fetching transport reports by status');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { status } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
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
    
    const result = await transportReportService.getReportsByStatus(status, institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Transport reports by status fetched successfully:', { status });
    return successResponse(res, result, 'Reports retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport reports by status:', error);
    return errorResponse(res, error.message);
  }
};

const updateReportStatus = async (req, res) => {
  try {
    logger.info('Updating transport report status');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    const { status } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Report ID');
    if (idError) errors.push(idError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const report = await transportReportService.updateReportStatus(id, institutionId, status);
    
    if (!report) {
      return notFoundResponse(res, 'Transport report not found');
    }
    
    logger.info('Transport report status updated successfully:', { id, status });
    return successResponse(res, report, 'Report status updated successfully');
  } catch (error) {
    logger.error('Error updating transport report status:', error);
    return errorResponse(res, error.message);
  }
};

const exportReport = async (req, res) => {
  try {
    logger.info('Exporting transport report');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { id } = req.params;
    const { format } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Report ID');
    if (idError) errors.push(idError);
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await transportReportService.exportReport(id, institutionId, format.toLowerCase());
    
    if (!exportData) {
      return notFoundResponse(res, 'Transport report not found');
    }
    
    logger.info('Transport report exported successfully:', { id, format });
    return successResponse(res, exportData, 'Report exported successfully');
  } catch (error) {
    logger.error('Error exporting transport report:', error);
    return errorResponse(res, error.message);
  }
};

const bulkExportReports = async (req, res) => {
  try {
    logger.info('Bulk exporting transport reports');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { ids, format } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      errors.push('Report IDs array is required and must not be empty');
    } else {
      for (let i = 0; i < ids.length; i++) {
        const idError = validateObjectId(ids[i], 'Report ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await transportReportService.bulkExportReports(ids, institutionId, format.toLowerCase());
    
    logger.info('Transport reports bulk exported successfully:', { count: ids.length, format });
    return successResponse(res, exportData, 'Reports exported successfully');
  } catch (error) {
    logger.error('Error bulk exporting transport reports:', error);
    return errorResponse(res, error.message);
  }
};

const scheduleReport = async (req, res) => {
  try {
    logger.info('Scheduling transport report');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { reportType, frequency, schedule, recipients, parameters } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!reportType) {
      errors.push('Report type is required');
    } else if (!VALID_REPORT_TYPES.includes(reportType)) {
      errors.push('Invalid report type. Must be one of: ' + VALID_REPORT_TYPES.join(', '));
    }
    
    if (!frequency) {
      errors.push('Frequency is required');
    }
    
    if (recipients && Array.isArray(recipients)) {
      recipients.forEach((email, index) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
          errors.push('Invalid email at index ' + index);
        }
      });
    }
    
    if (parameters && typeof parameters !== 'object') {
      errors.push('Parameters must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const scheduledReport = await transportReportService.scheduleReport(institutionId, req.body);
    
    logger.info('Transport report scheduled successfully:', { reportType, frequency });
    return createdResponse(res, scheduledReport, 'Report scheduled successfully');
  } catch (error) {
    logger.error('Error scheduling transport report:', error);
    return errorResponse(res, error.message);
  }
};

const getScheduledReports = async (req, res) => {
  try {
    logger.info('Fetching scheduled transport reports');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
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
    
    const result = await transportReportService.getScheduledReports(institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Scheduled transport reports fetched successfully');
    return successResponse(res, result, 'Scheduled reports retrieved successfully');
  } catch (error) {
    logger.error('Error fetching scheduled transport reports:', error);
    return errorResponse(res, error.message);
  }
};

const cancelScheduledReport = async (req, res) => {
  try {
    logger.info('Cancelling scheduled transport report');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Scheduled Report ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportReportService.cancelScheduledReport(id, institutionId);
    
    if (!result) {
      return notFoundResponse(res, 'Scheduled report not found');
    }
    
    logger.info('Scheduled transport report cancelled successfully:', { id });
    return successResponse(res, null, 'Scheduled report cancelled successfully');
  } catch (error) {
    logger.error('Error cancelling scheduled transport report:', error);
    return errorResponse(res, error.message);
  }
};

const getReportAnalytics = async (req, res) => {
  try {
    logger.info('Fetching transport report analytics');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { startDate, endDate, groupBy } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    const validGroupBy = ['type', 'status', 'period', 'day', 'week', 'month'];
    const groupByValue = groupBy || 'type';
    
    if (!validGroupBy.includes(groupByValue)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await transportReportService.getReportAnalytics(institutionId, {
      startDate,
      endDate,
      groupBy: groupByValue
    });
    
    logger.info('Transport report analytics fetched successfully');
    return successResponse(res, analytics, 'Report analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport report analytics:', error);
    return errorResponse(res, error.message);
  }
};

const getCompletedReports = async (req, res) => {
  try {
    logger.info('Fetching completed transport reports');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
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
    
    const result = await transportReportService.getCompletedReports(institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Completed transport reports fetched successfully');
    return successResponse(res, result, 'Completed reports retrieved successfully');
  } catch (error) {
    logger.error('Error fetching completed transport reports:', error);
    return errorResponse(res, error.message);
  }
};

const getPendingReports = async (req, res) => {
  try {
    logger.info('Fetching pending transport reports');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
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
    
    const result = await transportReportService.getPendingReports(institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Pending transport reports fetched successfully');
    return successResponse(res, result, 'Pending reports retrieved successfully');
  } catch (error) {
    logger.error('Error fetching pending transport reports:', error);
    return errorResponse(res, error.message);
  }
};

const regenerateReport = async (req, res) => {
  try {
    logger.info('Regenerating transport report');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Report ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const report = await transportReportService.regenerateReport(id, institutionId);
    
    if (!report) {
      return notFoundResponse(res, 'Transport report not found');
    }
    
    logger.info('Transport report regeneration started:', { id });
    return successResponse(res, report, 'Report regeneration started');
  } catch (error) {
    logger.error('Error regenerating transport report:', error);
    return errorResponse(res, error.message);
  }
};

const shareReport = async (req, res) => {
  try {
    logger.info('Sharing transport report');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    const { recipients, message } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Report ID');
    if (idError) errors.push(idError);
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      errors.push('Recipients array is required and must not be empty');
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      recipients.forEach((email, index) => {
        if (!emailPattern.test(email)) {
          errors.push('Invalid email at index ' + index);
        }
      });
    }
    
    if (message && message.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Message must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportReportService.shareReport(id, institutionId, req.body);
    
    if (!result) {
      return notFoundResponse(res, 'Transport report not found');
    }
    
    logger.info('Transport report shared successfully:', { id, recipientCount: recipients.length });
    return successResponse(res, result, 'Report shared successfully');
  } catch (error) {
    logger.error('Error sharing transport report:', error);
    return errorResponse(res, error.message);
  }
};

const getReportHistory = async (req, res) => {
  try {
    logger.info('Fetching transport report history');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Report ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const history = await transportReportService.getReportHistory(id, institutionId);
    
    if (!history) {
      return notFoundResponse(res, 'Report history not found');
    }
    
    logger.info('Transport report history fetched successfully:', { id });
    return successResponse(res, history, 'Report history retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport report history:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getAllReports,
  getReportById,
  generateReport,
  updateReport,
  deleteReport,
  bulkDeleteReports,
  getTransportStatistics,
  getReportsByType,
  searchReports,
  getReportsByStatus,
  updateReportStatus,
  exportReport,
  bulkExportReports,
  scheduleReport,
  getScheduledReports,
  cancelScheduledReport,
  getReportAnalytics,
  getCompletedReports,
  getPendingReports,
  regenerateReport,
  shareReport,
  getReportHistory
};
