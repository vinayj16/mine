import callLogService from '../services/callLogService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid call types
const VALID_CALL_TYPES = ['incoming', 'outgoing', 'missed', 'voicemail'];

// Valid call statuses
const VALID_CALL_STATUSES = ['completed', 'missed', 'rejected', 'busy', 'failed', 'no_answer'];

// Valid call purposes
const VALID_CALL_PURPOSES = ['inquiry', 'complaint', 'follow_up', 'admission', 'fee_payment', 'general', 'emergency'];

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { field: fieldName, message: `Invalid ${fieldName} format` } };
  }
  return { valid: true };
};

/**
 * Validate phone number
 */
const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate date
 */
const validateDate = (date) => {
  const d = new Date(date);
  return !isNaN(d.getTime());
};

/**
 * Validate date range
 */
const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end && !isNaN(start.getTime()) && !isNaN(end.getTime());
};

const createCallLog = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { callerPhone, receiverPhone, callType, status, duration, purpose, notes, userId } = req.body;
    const createdBy = req.user?.id;

    // Validate schoolId
    const validation = validateObjectId(schoolId, 'schoolId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate required fields
    const errors = [];
    if (!callerPhone || !validatePhone(callerPhone)) {
      errors.push({ field: 'callerPhone', message: 'Valid caller phone number is required' });
    }
    if (!receiverPhone || !validatePhone(receiverPhone)) {
      errors.push({ field: 'receiverPhone', message: 'Valid receiver phone number is required' });
    }
    if (!callType || !VALID_CALL_TYPES.includes(callType)) {
      errors.push({ field: 'callType', message: 'Call type must be one of: ' + VALID_CALL_TYPES.join(', ') });
    }
    if (!status || !VALID_CALL_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_CALL_STATUSES.join(', ') });
    }
    if (duration !== undefined && (isNaN(duration) || duration < 0)) {
      errors.push({ field: 'duration', message: 'Duration must be a non-negative number' });
    }
    if (purpose && !VALID_CALL_PURPOSES.includes(purpose)) {
      errors.push({ field: 'purpose', message: 'Purpose must be one of: ' + VALID_CALL_PURPOSES.join(', ') });
    }
    if (userId) {
      const userValidation = validateObjectId(userId, 'userId');
      if (!userValidation.valid) {
        errors.push(userValidation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Creating call log for school ${schoolId}`);
    const call = await callLogService.createCallLog(schoolId, {
      ...req.body,
      createdBy
    });

    return createdResponse(res, call, 'Call log created successfully');
  } catch (error) {
    logger.error('Error creating call log:', error);
    next(error);
  }
};

const getCallLogs = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { callType, status, purpose, startDate, endDate, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query;

    // Validate schoolId
    const validation = validateObjectId(schoolId, 'schoolId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate filters
    const errors = [];
    if (callType && !VALID_CALL_TYPES.includes(callType)) {
      errors.push({ field: 'callType', message: 'Call type must be one of: ' + VALID_CALL_TYPES.join(', ') });
    }
    if (status && !VALID_CALL_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_CALL_STATUSES.join(', ') });
    }
    if (purpose && !VALID_CALL_PURPOSES.includes(purpose)) {
      errors.push({ field: 'purpose', message: 'Purpose must be one of: ' + VALID_CALL_PURPOSES.join(', ') });
    }
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      errors.push({ field: 'dateRange', message: 'Invalid date range' });
    }

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({ field: 'page', message: 'Page must be a positive integer' });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = {};
    if (callType) filters.callType = callType;
    if (status) filters.status = status;
    if (purpose) filters.purpose = purpose;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (search) filters.search = search;

    logger.info(`Fetching call logs for school ${schoolId}`);
    const result = await callLogService.getCallLogs(schoolId, {
      ...filters,
      sortBy,
      sortOrder,
      page: pageNum,
      limit: limitNum
    });

    return successResponse(res, result.calls, 'Call logs fetched successfully', {
      pagination: result.pagination,
      filters
    });
  } catch (error) {
    logger.error('Error fetching call logs:', error);
    next(error);
  }
};

const getCallLogById = async (req, res, next) => {
  try {
    const { schoolId, callId } = req.params;

    // Validate IDs
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      return validationErrorResponse(res, [schoolValidation.error]);
    }
    const callValidation = validateObjectId(callId, 'callId');
    if (!callValidation.valid) {
      return validationErrorResponse(res, [callValidation.error]);
    }

    logger.info(`Fetching call log ${callId}`);
    const call = await callLogService.getCallLogById(callId, schoolId);

    if (!call) {
      return notFoundResponse(res, 'Call log not found');
    }

    return successResponse(res, call, 'Call log fetched successfully');
  } catch (error) {
    logger.error('Error fetching call log:', error);
    next(error);
  }
};

const getCallLogsByUser = async (req, res, next) => {
  try {
    const { schoolId, userId } = req.params;
    const { startDate, endDate, callType, status, page = 1, limit = 20 } = req.query;

    // Validate IDs
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      return validationErrorResponse(res, [schoolValidation.error]);
    }
    const userValidation = validateObjectId(userId, 'userId');
    if (!userValidation.valid) {
      return validationErrorResponse(res, [userValidation.error]);
    }

    // Validate filters
    const errors = [];
    if (callType && !VALID_CALL_TYPES.includes(callType)) {
      errors.push({ field: 'callType', message: 'Call type must be one of: ' + VALID_CALL_TYPES.join(', ') });
    }
    if (status && !VALID_CALL_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_CALL_STATUSES.join(', ') });
    }
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      errors.push({ field: 'dateRange', message: 'Invalid date range' });
    }

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({ field: 'page', message: 'Page must be a positive integer' });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Fetching call logs for user ${userId}`);
    const result = await callLogService.getCallLogsByUser(schoolId, userId, {
      startDate,
      endDate,
      callType,
      status,
      page: pageNum,
      limit: limitNum
    });

    return successResponse(res, result.calls, 'User call logs fetched successfully', {
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error fetching user call logs:', error);
    next(error);
  }
};

const getCallAnalytics = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Validate schoolId
    const validation = validateObjectId(schoolId, 'schoolId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate date range
    const errors = [];
    if (!startDate || !endDate) {
      errors.push({ field: 'dateRange', message: 'Start date and end date are required' });
    } else if (!validateDateRange(startDate, endDate)) {
      errors.push({ field: 'dateRange', message: 'Invalid date range' });
    }

    // Validate groupBy
    const validGroupBy = ['hour', 'day', 'week', 'month'];
    if (!validGroupBy.includes(groupBy)) {
      errors.push({ field: 'groupBy', message: 'groupBy must be one of: ' + validGroupBy.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Fetching call analytics for school ${schoolId}`);
    const analytics = await callLogService.getCallAnalytics(schoolId, startDate, endDate, { groupBy });

    return successResponse(res, analytics, 'Call analytics fetched successfully', {
      dateRange: { startDate, endDate },
      groupBy
    });
  } catch (error) {
    logger.error('Error fetching call analytics:', error);
    next(error);
  }
};


/**
 * Update call log
 */
const updateCallLog = async (req, res, next) => {
  try {
    const { schoolId, callId } = req.params;
    const { status, duration, notes, purpose } = req.body;
    const updatedBy = req.user?.id;

    // Validate IDs
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      return validationErrorResponse(res, [schoolValidation.error]);
    }
    const callValidation = validateObjectId(callId, 'callId');
    if (!callValidation.valid) {
      return validationErrorResponse(res, [callValidation.error]);
    }

    // Validate fields if provided
    const errors = [];
    if (status && !VALID_CALL_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_CALL_STATUSES.join(', ') });
    }
    if (duration !== undefined && (isNaN(duration) || duration < 0)) {
      errors.push({ field: 'duration', message: 'Duration must be a non-negative number' });
    }
    if (purpose && !VALID_CALL_PURPOSES.includes(purpose)) {
      errors.push({ field: 'purpose', message: 'Purpose must be one of: ' + VALID_CALL_PURPOSES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Updating call log ${callId}`);
    const call = await callLogService.updateCallLog(schoolId, callId, {
      status,
      duration,
      notes,
      purpose,
      updatedBy
    });

    if (!call) {
      return notFoundResponse(res, 'Call log not found');
    }

    return successResponse(res, call, 'Call log updated successfully');
  } catch (error) {
    logger.error('Error updating call log:', error);
    next(error);
  }
};

/**
 * Delete call log
 */
const deleteCallLog = async (req, res, next) => {
  try {
    const { schoolId, callId } = req.params;

    // Validate IDs
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      return validationErrorResponse(res, [schoolValidation.error]);
    }
    const callValidation = validateObjectId(callId, 'callId');
    if (!callValidation.valid) {
      return validationErrorResponse(res, [callValidation.error]);
    }

    logger.info(`Deleting call log ${callId}`);
    const result = await callLogService.deleteCallLog(schoolId, callId);

    if (!result) {
      return notFoundResponse(res, 'Call log not found');
    }

    return successResponse(res, null, 'Call log deleted successfully');
  } catch (error) {
    logger.error('Error deleting call log:', error);
    next(error);
  }
};

/**
 * Get call statistics
 */
const getCallStatistics = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { startDate, endDate, callType, purpose } = req.query;

    // Validate schoolId
    const validation = validateObjectId(schoolId, 'schoolId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate filters
    const errors = [];
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      errors.push({ field: 'dateRange', message: 'Invalid date range' });
    }
    if (callType && !VALID_CALL_TYPES.includes(callType)) {
      errors.push({ field: 'callType', message: 'Call type must be one of: ' + VALID_CALL_TYPES.join(', ') });
    }
    if (purpose && !VALID_CALL_PURPOSES.includes(purpose)) {
      errors.push({ field: 'purpose', message: 'Purpose must be one of: ' + VALID_CALL_PURPOSES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Fetching call statistics for school ${schoolId}`);
    const stats = await callLogService.getCallStatistics(schoolId, {
      startDate,
      endDate,
      callType,
      purpose
    });

    return successResponse(res, stats, 'Call statistics fetched successfully');
  } catch (error) {
    logger.error('Error fetching call statistics:', error);
    next(error);
  }
};

/**
 * Export call logs
 */
const exportCallLogs = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { startDate, endDate, format = 'json', callType, status } = req.query;

    // Validate schoolId
    const validation = validateObjectId(schoolId, 'schoolId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate date range
    const errors = [];
    if (!startDate || !endDate) {
      errors.push({ field: 'dateRange', message: 'Start date and end date are required' });
    } else if (!validateDateRange(startDate, endDate)) {
      errors.push({ field: 'dateRange', message: 'Invalid date range' });
    }

    // Validate format
    const validFormats = ['json', 'csv', 'xlsx'];
    if (!validFormats.includes(format)) {
      errors.push({ field: 'format', message: 'Format must be one of: ' + validFormats.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Exporting call logs for school ${schoolId} in ${format} format`);
    const data = await callLogService.exportCallLogs(schoolId, startDate, endDate, {
      format,
      callType,
      status
    });

    // TODO: Implement CSV/XLSX conversion
    if (format === 'json') {
      return successResponse(res, data, 'Call logs exported successfully', {
        format,
        dateRange: { startDate, endDate },
        exportedAt: new Date().toISOString()
      });
    }

    return errorResponse(res, `Export format ${format} not yet implemented`, 501);
  } catch (error) {
    logger.error('Error exporting call logs:', error);
    next(error);
  }
};

/**
 * Get missed calls
 */
const getMissedCalls = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    // Validate schoolId
    const validation = validateObjectId(schoolId, 'schoolId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate date range if provided
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Invalid date range' }]);
    }

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return validationErrorResponse(res, [{ field: 'page', message: 'Page must be a positive integer' }]);
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return validationErrorResponse(res, [{ field: 'limit', message: 'Limit must be between 1 and 100' }]);
    }

    logger.info(`Fetching missed calls for school ${schoolId}`);
    const result = await callLogService.getMissedCalls(schoolId, {
      startDate,
      endDate,
      page: pageNum,
      limit: limitNum
    });

    return successResponse(res, result.calls, 'Missed calls fetched successfully', {
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error fetching missed calls:', error);
    next(error);
  }
};

/**
 * Get call duration summary
 */
const getCallDurationSummary = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Validate schoolId
    const validation = validateObjectId(schoolId, 'schoolId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate date range
    const errors = [];
    if (!startDate || !endDate) {
      errors.push({ field: 'dateRange', message: 'Start date and end date are required' });
    } else if (!validateDateRange(startDate, endDate)) {
      errors.push({ field: 'dateRange', message: 'Invalid date range' });
    }

    // Validate groupBy
    const validGroupBy = ['day', 'week', 'month'];
    if (!validGroupBy.includes(groupBy)) {
      errors.push({ field: 'groupBy', message: 'groupBy must be one of: ' + validGroupBy.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Fetching call duration summary for school ${schoolId}`);
    const summary = await callLogService.getCallDurationSummary(schoolId, startDate, endDate, { groupBy });

    return successResponse(res, summary, 'Call duration summary fetched successfully');
  } catch (error) {
    logger.error('Error fetching call duration summary:', error);
    next(error);
  }
};


export default {
  createCallLog,
  getCallLogs,
  getCallLogById,
  getCallLogsByUser,
  getCallAnalytics,
  updateCallLog,
  deleteCallLog,
  getCallStatistics,
  exportCallLogs,
  getMissedCalls,
  getCallDurationSummary
};
