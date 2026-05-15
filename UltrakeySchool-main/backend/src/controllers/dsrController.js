
import gdprSettingsService from '../services/gdprSettingsService.js';
import DataExportRequest from '../models/DataExportRequest.js';
import DataErasureRequest from '../models/DataErasureRequest.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse, forbiddenResponse } from '../utils/apiResponse.js';
import jobService from '../services/jobService.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf', 'xml'];
const VALID_REQUEST_TYPES = ['full', 'partial', 'specific'];
const VALID_EXPORT_STATUSES = ['pending', 'verified', 'processing', 'completed', 'failed', 'expired'];
const VALID_ERASURE_STATUSES = ['pending', 'verified', 'under_review', 'approved', 'rejected', 'completed', 'failed'];
const VALID_DATA_CATEGORIES = ['personal', 'academic', 'financial', 'attendance', 'medical', 'communication', 'all'];
const VALID_AUDIT_ACTIONS = ['export_request', 'erasure_request', 'data_access', 'data_modification', 'consent_change', 'settings_update'];

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

// Data Export Controllers
const createDataExportRequest = async (req, res) => {
  try {
    logger.info('Creating data export request');
    
    const userId = req.user.id;
    const institutionId = req.user.institutionId || req.body.institutionId;
    const schoolId = req.user.schoolId || req.body.schoolId;
    
    const {
      requestType = 'full',
      format = 'json'
    } = req.body;
    const requestedDataInput = req.body.requestedData;
    const requestedData = Array.isArray(requestedDataInput)
      ? requestedDataInput
      : requestedDataInput
        ? [requestedDataInput]
        : ['all'];
    const filters = req.body.filters || {};

    // Validation
    const errors = [];
    
    if (!userId) {
      errors.push('User ID is required');
    }
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!VALID_REQUEST_TYPES.includes(requestType)) {
      errors.push('Invalid request type. Must be one of: ' + VALID_REQUEST_TYPES.join(', '));
    }
    
    if (!VALID_EXPORT_FORMATS.includes(format)) {
      errors.push('Invalid format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    const dataError = validateArray(requestedData, VALID_DATA_CATEGORIES, 'Requested data');
    if (dataError) errors.push(dataError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const exportRequest = await gdprSettingsService.createDataExportRequest(
      userId,
      institutionId,
      { requestType, requestedData, format, filters, schoolId }
    );

    jobService.addReportJob('data_export', { requestId: exportRequest._id.toString() })
      .catch((error) => {
        logger.error('Failed to queue export job:', {
          institutionId,
          requestId: exportRequest._id,
          error: error.message
        });
      });

    logger.info('Data export request created successfully:', { requestId: exportRequest._id });
    return createdResponse(res, exportRequest, 'Data export request created successfully');
  } catch (error) {
    logger.error('Error creating data export request:', error);
    return errorResponse(res, error.message);
  }
};

const getDataExportRequests = async (req, res) => {
  try {
    logger.info('Fetching data export requests');
    
    const userId = req.user.id;
    const institutionId = req.user.institutionId || req.query.institutionId;
    const { status, limit, page } = req.query;

    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (status && !VALID_EXPORT_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EXPORT_STATUSES.join(', '));
    }
    
    const limitNum = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = { status, limit: limitNum, page: pageNum };
    const requests = await gdprSettingsService.getDataExportRequests(
      userId,
      institutionId,
      filters
    );

    logger.info('Data export requests fetched successfully');
    return successResponse(res, requests, 'Data export requests retrieved successfully');
  } catch (error) {
    logger.error('Error fetching data export requests:', error);
    return errorResponse(res, error.message);
  }
};

const verifyDataExportRequest = async (req, res) => {
  try {
    logger.info('Verifying data export request');
    
    const { requestId } = req.params;
    const { verificationToken } = req.body;

    // Validation
    const errors = [];
    
    const requestIdError = validateObjectId(requestId, 'Request ID');
    if (requestIdError) errors.push(requestIdError);
    
    if (!verificationToken || verificationToken.trim().length === 0) {
      errors.push('Verification token is required');
    }
    
    if (verificationToken && verificationToken.length < 6) {
      errors.push('Verification token must be at least 6 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const request = await gdprSettingsService.verifyDataExportRequest(
      requestId,
      verificationToken
    );

    logger.info('Data export request verified successfully:', { requestId });
    return successResponse(res, request, 'Data export request verified successfully');
  } catch (error) {
    logger.error('Error verifying data export request:', error);
    return errorResponse(res, error.message);
  }
};

const completeDataExportRequest = async (req, res) => {
  try {
    logger.info('Completing data export request');
    
    const { requestId } = req.params;
    const { fileUrl } = req.body;
    const processedBy = req.user.id;

    // Validation
    const errors = [];
    
    const requestIdError = validateObjectId(requestId, 'Request ID');
    if (requestIdError) errors.push(requestIdError);
    
    if (!fileUrl || fileUrl.trim().length === 0) {
      errors.push('File URL is required');
    }
    
    if (fileUrl && !fileUrl.match(/^https?:\/\/.+/)) {
      errors.push('Invalid file URL format');
    }
    
    if (!processedBy) {
      errors.push('Processed by user ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const request = await gdprSettingsService.completeDataExportRequest(
      requestId,
      fileUrl,
      processedBy
    );

    logger.info('Data export request completed successfully:', { requestId });
    return successResponse(res, request, 'Data export request completed successfully');
  } catch (error) {
    logger.error('Error completing data export request:', error);
    return errorResponse(res, error.message);
  }
};

const getDataExportStatus = async (req, res) => {
  try {
    logger.info('Fetching data export status');
    
    const { requestId } = req.params;
    
    // Validation
    const requestIdError = validateObjectId(requestId, 'Request ID');
    if (requestIdError) {
      return validationErrorResponse(res, [requestIdError]);
    }
    
    const request = await DataExportRequest.findById(requestId).lean();

    if (!request) {
      return notFoundResponse(res, 'Export request not found');
    }

    const isOwner = request.userId?.toString() === req.user.id;
    const isInstitutionAdmin = ['superadmin', 'institution_admin', 'admin'].includes(req.user.role);

    if (!isOwner && !isInstitutionAdmin) {
      return forbiddenResponse(res, 'You do not have access to this export request');
    }

    const payload = {
      id: request._id,
      status: request.status,
      fileUrl: request.fileUrl,
      reason: request.reason,
      verifiedAt: request.verifiedAt,
      processedAt: request.processedAt,
      exports: request.exports,
      metadata: {
        createdAt: request.createdAt,
        filters: request.filters,
        format: request.format,
        requestedData: request.requestedData
      }
    };

    logger.info('Data export status fetched successfully:', { requestId });
    return successResponse(res, payload, 'Export request status retrieved successfully');
  } catch (error) {
    logger.error('Error fetching export status:', error);
    return errorResponse(res, error.message);
  }
};

// Data Erasure Controllers
const createDataErasureRequest = async (req, res) => {
  try {
    logger.info('Creating data erasure request');
    
    const userId = req.user.id;
    const institutionId = req.user.institutionId || req.body.institutionId;
    
    const {
      requestType = 'full',
      requestedData = ['personal'],
      reason
    } = req.body;

    // Validation
    const errors = [];
    
    if (!userId) {
      errors.push('User ID is required');
    }
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (!reason || reason.trim().length === 0) {
      errors.push('Reason is required');
    } else if (reason.trim().length < 10) {
      errors.push('Reason must be at least 10 characters long');
    } else if (reason.length > 1000) {
      errors.push('Reason must not exceed 1000 characters');
    }
    
    if (!VALID_REQUEST_TYPES.includes(requestType)) {
      errors.push('Invalid request type. Must be one of: ' + VALID_REQUEST_TYPES.join(', '));
    }
    
    const dataError = validateArray(requestedData, VALID_DATA_CATEGORIES, 'Requested data');
    if (dataError) errors.push(dataError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const erasureRequest = await gdprSettingsService.createDataErasureRequest(
      userId,
      institutionId,
      { requestType, requestedData, reason }
    );

    logger.info('Data erasure request created successfully:', { requestId: erasureRequest._id });
    return createdResponse(res, erasureRequest, 'Data erasure request created successfully');
  } catch (error) {
    logger.error('Error creating data erasure request:', error);
    return errorResponse(res, error.message);
  }
};

const getDataErasureRequests = async (req, res) => {
  try {
    logger.info('Fetching data erasure requests');
    
    const userId = req.user.id;
    const institutionId = req.user.institutionId || req.query.institutionId;
    const { status, limit, page } = req.query;

    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (status && !VALID_ERASURE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ERASURE_STATUSES.join(', '));
    }
    
    const limitNum = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = { status, limit: limitNum, page: pageNum };
    const requests = await gdprSettingsService.getDataErasureRequests(
      userId,
      institutionId,
      filters
    );

    logger.info('Data erasure requests fetched successfully');
    return successResponse(res, requests, 'Data erasure requests retrieved successfully');
  } catch (error) {
    logger.error('Error fetching data erasure requests:', error);
    return errorResponse(res, error.message);
  }
};

const verifyDataErasureRequest = async (req, res) => {
  try {
    logger.info('Verifying data erasure request');
    
    const { requestId } = req.params;
    const { verificationToken } = req.body;

    // Validation
    const errors = [];
    
    const requestIdError = validateObjectId(requestId, 'Request ID');
    if (requestIdError) errors.push(requestIdError);
    
    if (!verificationToken || verificationToken.trim().length === 0) {
      errors.push('Verification token is required');
    }
    
    if (verificationToken && verificationToken.length < 6) {
      errors.push('Verification token must be at least 6 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const request = await gdprSettingsService.verifyDataErasureRequest(
      requestId,
      verificationToken
    );

    logger.info('Data erasure request verified successfully:', { requestId });
    return successResponse(res, request, 'Data erasure request verified successfully');
  } catch (error) {
    logger.error('Error verifying data erasure request:', error);
    return errorResponse(res, error.message);
  }
};

const reviewDataErasureRequest = async (req, res) => {
  try {
    logger.info('Reviewing data erasure request');
    
    const { requestId } = req.params;
    const { approved, reason } = req.body;
    const reviewedBy = req.user.id;

    // Validation
    const errors = [];
    
    const requestIdError = validateObjectId(requestId, 'Request ID');
    if (requestIdError) errors.push(requestIdError);
    
    if (typeof approved !== 'boolean') {
      errors.push('Approved field is required and must be a boolean');
    }
    
    if (approved === false && (!reason || reason.trim().length === 0)) {
      errors.push('Reason is required when rejecting a request');
    }
    
    if (reason && reason.length > 1000) {
      errors.push('Reason must not exceed 1000 characters');
    }
    
    if (!reviewedBy) {
      errors.push('Reviewer user ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const request = await gdprSettingsService.reviewDataErasureRequest(
      requestId,
      approved,
      reviewedBy,
      reason
    );

    const message = approved ? 'Data erasure request approved' : 'Data erasure request rejected';
    logger.info(message + ':', { requestId });
    return successResponse(res, request, message);
  } catch (error) {
    logger.error('Error reviewing data erasure request:', error);
    return errorResponse(res, error.message);
  }
};

const completeDataErasureRequest = async (req, res) => {
  try {
    logger.info('Completing data erasure request');
    
    const { requestId } = req.params;
    const { dataBackup } = req.body;
    const completedBy = req.user.id;

    // Validation
    const errors = [];
    
    const requestIdError = validateObjectId(requestId, 'Request ID');
    if (requestIdError) errors.push(requestIdError);
    
    if (!completedBy) {
      errors.push('Completed by user ID is required');
    }
    
    if (dataBackup && typeof dataBackup !== 'string') {
      errors.push('Data backup must be a string');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const request = await gdprSettingsService.completeDataErasureRequest(
      requestId,
      dataBackup,
      completedBy
    );

    logger.info('Data erasure request completed successfully:', { requestId });
    return successResponse(res, request, 'Data erasure request completed successfully');
  } catch (error) {
    logger.error('Error completing data erasure request:', error);
    return errorResponse(res, error.message);
  }
};

// Audit Log Controllers
const getAuditLogs = async (req, res) => {
  try {
    logger.info('Fetching audit logs');
    
    const institutionId = req.user.institutionId || req.query.institutionId;
    const { userId, action, dateFrom, dateTo, limit, page } = req.query;

    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (action && !VALID_AUDIT_ACTIONS.includes(action)) {
      errors.push('Invalid action. Must be one of: ' + VALID_AUDIT_ACTIONS.join(', '));
    }
    
    if (dateFrom) {
      const dateFromError = validateDate(dateFrom, 'Date from');
      if (dateFromError) errors.push(dateFromError);
    }
    
    if (dateTo) {
      const dateToError = validateDate(dateTo, 'Date to');
      if (dateToError) errors.push(dateToError);
    }
    
    if (dateFrom && dateTo) {
      const rangeError = validateDateRange(dateFrom, dateTo);
      if (rangeError) errors.push(rangeError);
    }
    
    const limitNum = parseInt(limit) || 50;
    const pageNum = parseInt(page) || 1;
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = {
      userId,
      action,
      dateFrom,
      dateTo,
      limit: limitNum,
      page: pageNum
    };

    const logs = await gdprSettingsService.getAuditLogs(
      institutionId,
      filters
    );

    logger.info('Audit logs fetched successfully');
    return successResponse(res, logs, 'Audit logs retrieved successfully');
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    return errorResponse(res, error.message);
  }
};

// Data Retention Controllers
const checkDataRetentionCompliance = async (req, res) => {
  try {
    logger.info('Checking data retention compliance');
    
    const institutionId = req.user.institutionId || req.query.institutionId;

    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const compliance = await gdprSettingsService.checkDataRetentionCompliance(
      institutionId
    );

    logger.info('Data retention compliance checked successfully');
    return successResponse(res, compliance, 'Data retention compliance status retrieved successfully');
  } catch (error) {
    logger.error('Error checking data retention compliance:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk Operations
const bulkUpdateExportRequests = async (req, res) => {
  try {
    logger.info('Bulk updating export requests');
    
    const { requestIds, updates } = req.body;

    // Validation
    const errors = [];
    
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      errors.push('Request IDs array is required and must not be empty');
    }
    
    if (requestIds && requestIds.length > 100) {
      errors.push('Cannot update more than 100 requests at once');
    }
    
    if (requestIds) {
      for (let i = 0; i < requestIds.length; i++) {
        const idError = validateObjectId(requestIds[i], 'Request ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates object is required');
    }
    
    if (updates && updates.status && !VALID_EXPORT_STATUSES.includes(updates.status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EXPORT_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await DataExportRequest.updateMany(
      { _id: { $in: requestIds } },
      { $set: updates }
    );

    logger.info('Export requests bulk updated successfully:', { count: result.modifiedCount });
    return successResponse(res, {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    }, 'Export requests updated successfully');
  } catch (error) {
    logger.error('Error bulk updating export requests:', error);
    return errorResponse(res, error.message);
  }
};

const bulkUpdateErasureRequests = async (req, res) => {
  try {
    logger.info('Bulk updating erasure requests');
    
    const { requestIds, updates } = req.body;

    // Validation
    const errors = [];
    
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      errors.push('Request IDs array is required and must not be empty');
    }
    
    if (requestIds && requestIds.length > 100) {
      errors.push('Cannot update more than 100 requests at once');
    }
    
    if (requestIds) {
      for (let i = 0; i < requestIds.length; i++) {
        const idError = validateObjectId(requestIds[i], 'Request ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates object is required');
    }
    
    if (updates && updates.status && !VALID_ERASURE_STATUSES.includes(updates.status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ERASURE_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await DataErasureRequest.updateMany(
      { _id: { $in: requestIds } },
      { $set: updates }
    );

    logger.info('Erasure requests bulk updated successfully:', { count: result.modifiedCount });
    return successResponse(res, {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    }, 'Erasure requests updated successfully');
  } catch (error) {
    logger.error('Error bulk updating erasure requests:', error);
    return errorResponse(res, error.message);
  }
};

// Statistics
const getExportStatistics = async (req, res) => {
  try {
    logger.info('Fetching export statistics');
    
    const institutionId = req.user.institutionId || req.query.institutionId;
    const { startDate, endDate } = req.query;

    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
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
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const statistics = await DataExportRequest.aggregate([
      { $match: { institutionId: new mongoose.Types.ObjectId(institutionId), ...dateFilter } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          verifiedRequests: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
          processingRequests: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          failedRequests: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          expiredRequests: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } }
        }
      }
    ]);

    const stats = statistics[0] || {
      totalRequests: 0,
      pendingRequests: 0,
      verifiedRequests: 0,
      processingRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      expiredRequests: 0
    };

    logger.info('Export statistics fetched successfully');
    return successResponse(res, stats, 'Export statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching export statistics:', error);
    return errorResponse(res, error.message);
  }
};

const getErasureStatistics = async (req, res) => {
  try {
    logger.info('Fetching erasure statistics');
    
    const institutionId = req.user.institutionId || req.query.institutionId;
    const { startDate, endDate } = req.query;

    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
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
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const statistics = await DataErasureRequest.aggregate([
      { $match: { institutionId: new mongoose.Types.ObjectId(institutionId), ...dateFilter } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          verifiedRequests: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
          underReviewRequests: { $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] } },
          approvedRequests: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejectedRequests: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          failedRequests: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      }
    ]);

    const stats = statistics[0] || {
      totalRequests: 0,
      pendingRequests: 0,
      verifiedRequests: 0,
      underReviewRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      completedRequests: 0,
      failedRequests: 0
    };

    logger.info('Erasure statistics fetched successfully');
    return successResponse(res, stats, 'Erasure statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching erasure statistics:', error);
    return errorResponse(res, error.message);
  }
};


export {
  createDataExportRequest,
  getDataExportRequests,
  verifyDataExportRequest,
  completeDataExportRequest,
  getDataExportStatus,
  createDataErasureRequest,
  getDataErasureRequests,
  verifyDataErasureRequest,
  reviewDataErasureRequest,
  completeDataErasureRequest,
  getAuditLogs,
  checkDataRetentionCompliance,
  bulkUpdateExportRequests,
  bulkUpdateErasureRequests,
  getExportStatistics,
  getErasureStatistics
};

export default {
  createDataExportRequest,
  getDataExportRequests,
  verifyDataExportRequest,
  completeDataExportRequest,
  getDataExportStatus,
  createDataErasureRequest,
  getDataErasureRequests,
  verifyDataErasureRequest,
  reviewDataErasureRequest,
  completeDataErasureRequest,
  getAuditLogs,
  checkDataRetentionCompliance,
  bulkUpdateExportRequests,
  bulkUpdateErasureRequests,
  getExportStatistics,
  getErasureStatistics
};
