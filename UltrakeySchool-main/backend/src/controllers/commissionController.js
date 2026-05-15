import commissionService from '../services/commissionService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid commission statuses
const VALID_STATUSES = ['pending', 'approved', 'paid', 'rejected', 'cancelled'];

// Valid commission types
const VALID_TYPES = ['referral', 'sales', 'enrollment', 'subscription', 'other'];

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { field: fieldName, message: 'Invalid ' + fieldName + ' format' } };
  }
  return { valid: true };
};

/**
 * Validate date
 */
const validateDate = (date) => {
  const d = new Date(date);
  return !isNaN(d.getTime());
};

/**
 * Validate amount
 */
const validateAmount = (amount) => {
  return !isNaN(amount) && amount >= 0;
};

const createCommission = async (req, res) => {
  try {
    const { agentId, amount, type, status, description, referenceId } = req.body;

    // Validate required fields
    const errors = [];
    if (!agentId) {
      errors.push({ field: 'agentId', message: 'Agent ID is required' });
    } else {
      const validation = validateObjectId(agentId, 'agentId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (amount === undefined || amount === null) {
      errors.push({ field: 'amount', message: 'Amount is required' });
    } else if (!validateAmount(amount)) {
      errors.push({ field: 'amount', message: 'Amount must be a non-negative number' });
    } else if (amount > 1000000) {
      errors.push({ field: 'amount', message: 'Amount cannot exceed 1,000,000' });
    }
    if (type && !VALID_TYPES.includes(type)) {
      errors.push({ field: 'type', message: 'Type must be one of: ' + VALID_TYPES.join(', ') });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }
    if (referenceId) {
      const validation = validateObjectId(referenceId, 'referenceId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Creating commission for agent: ' + agentId);
    const commission = await commissionService.createCommission({
      ...req.body,
      metadata: { createdBy: req.user?.id || 'system' }
    });
    
    return createdResponse(res, commission, 'Commission created successfully');
  } catch (error) {
    logger.error('Error creating commission:', error);
    return errorResponse(res, error.message, 400);
  }
};

const getCommissionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const validation = validateObjectId(id, 'commissionId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Fetching commission by ID: ' + id);
    const commission = await commissionService.getCommissionById(id);
    
    if (!commission) {
      return notFoundResponse(res, 'Commission not found');
    }

    return successResponse(res, commission, 'Commission fetched successfully');
  } catch (error) {
    logger.error('Error fetching commission by ID:', error);
    return errorResponse(res, 'Failed to fetch commission', 500);
  }
};

const getCommissionsByAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { status, startDate, endDate } = req.query;

    // Validate agentId
    const errors = [];
    const validation = validateObjectId(agentId, 'agentId');
    if (!validation.valid) {
      errors.push(validation.error);
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    // Validate date range if provided
    if (startDate && !validateDate(startDate)) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
    if (endDate && !validateDate(endDate)) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.push({ field: 'dateRange', message: 'Start date must be before end date' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching commissions for agent: ' + agentId);
    const commissions = await commissionService.getCommissionsByAgent(agentId, {
      status,
      startDate,
      endDate
    });
    
    return successResponse(res, commissions, 'Commissions fetched successfully', {
      agentId,
      filters: { status, startDate, endDate }
    });
  } catch (error) {
    logger.error('Error fetching commissions by agent:', error);
    return errorResponse(res, 'Failed to fetch commissions', 500);
  }
};

const getCommissionSummary = async (req, res) => {
  try {
    const { agentId } = req.params;

    // Validate agentId
    const validation = validateObjectId(agentId, 'agentId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Fetching commission summary for agent: ' + agentId);
    const summary = await commissionService.getCommissionSummary(agentId);
    
    return successResponse(res, summary, 'Commission summary fetched successfully');
  } catch (error) {
    logger.error('Error fetching commission summary:', error);
    return errorResponse(res, 'Failed to fetch commission summary', 500);
  }
};

const updateCommissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentData } = req.body;

    // Validate ID
    const errors = [];
    const validation = validateObjectId(id, 'commissionId');
    if (!validation.valid) {
      errors.push(validation.error);
    }

    // Validate status
    if (!status) {
      errors.push({ field: 'status', message: 'Status is required' });
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    // Validate paymentData if status is paid
    if (status === 'paid' && paymentData) {
      if (paymentData.amount && !validateAmount(paymentData.amount)) {
        errors.push({ field: 'paymentData.amount', message: 'Payment amount must be a non-negative number' });
      }
      if (paymentData.date && !validateDate(paymentData.date)) {
        errors.push({ field: 'paymentData.date', message: 'Invalid payment date format' });
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Updating commission status: ' + id + ' to ' + status);
    const commission = await commissionService.updateCommissionStatus(
      id,
      status,
      req.user?.id || 'system',
      paymentData
    );
    
    if (!commission) {
      return notFoundResponse(res, 'Commission not found');
    }

    return successResponse(res, commission, 'Commission status updated successfully');
  } catch (error) {
    logger.error('Error updating commission status:', error);
    return errorResponse(res, error.message, 400);
  }
};

const updateCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, status, description } = req.body;

    // Validate ID
    const errors = [];
    const validation = validateObjectId(id, 'commissionId');
    if (!validation.valid) {
      errors.push(validation.error);
    }

    // Validate fields if provided
    if (amount !== undefined && !validateAmount(amount)) {
      errors.push({ field: 'amount', message: 'Amount must be a non-negative number' });
    }
    if (amount && amount > 1000000) {
      errors.push({ field: 'amount', message: 'Amount cannot exceed 1,000,000' });
    }
    if (type && !VALID_TYPES.includes(type)) {
      errors.push({ field: 'type', message: 'Type must be one of: ' + VALID_TYPES.join(', ') });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Updating commission: ' + id);
    const commission = await commissionService.updateCommission(
      id,
      req.body,
      req.user?.id || 'system'
    );
    
    if (!commission) {
      return notFoundResponse(res, 'Commission not found');
    }

    return successResponse(res, commission, 'Commission updated successfully');
  } catch (error) {
    logger.error('Error updating commission:', error);
    return errorResponse(res, error.message, 400);
  }
};

const deleteCommission = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const validation = validateObjectId(id, 'commissionId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Deleting commission: ' + id);
    const commission = await commissionService.deleteCommission(id);
    
    if (!commission) {
      return notFoundResponse(res, 'Commission not found');
    }

    return successResponse(res, null, 'Commission deleted successfully');
  } catch (error) {
    logger.error('Error deleting commission:', error);
    return errorResponse(res, 'Failed to delete commission', 500);
  }
};

const getAllCommissions = async (req, res) => {
  try {
    const { agentId, status, startDate, endDate, type, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Validate pagination
    const errors = [];
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({ field: 'page', message: 'Page must be a positive integer' });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
    }

    // Validate agentId if provided
    if (agentId) {
      const validation = validateObjectId(agentId, 'agentId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    // Validate type if provided
    if (type && !VALID_TYPES.includes(type)) {
      errors.push({ field: 'type', message: 'Type must be one of: ' + VALID_TYPES.join(', ') });
    }

    // Validate date range if provided
    if (startDate && !validateDate(startDate)) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
    if (endDate && !validateDate(endDate)) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.push({ field: 'dateRange', message: 'Start date must be before end date' });
    }

    // Validate sortOrder
    if (!['asc', 'desc'].includes(sortOrder)) {
      errors.push({ field: 'sortOrder', message: 'Sort order must be asc or desc' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching all commissions with filters');
    const result = await commissionService.getAllCommissions(
      { agentId, status, startDate, endDate, type },
      { page: pageNum, limit: limitNum, sortBy, sortOrder }
    );
    
    return successResponse(res, result.data, 'Commissions fetched successfully', {
      pagination: result.pagination,
      filters: { agentId, status, startDate, endDate, type }
    });
  } catch (error) {
    logger.error('Error fetching all commissions:', error);
    return errorResponse(res, 'Failed to fetch commissions', 500);
  }
};

const getCommissionStatistics = async (req, res) => {
  try {
    const { agentId, startDate, endDate } = req.query;

    // Validate agentId if provided
    const errors = [];
    if (agentId) {
      const validation = validateObjectId(agentId, 'agentId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate date range if provided
    if (startDate && !validateDate(startDate)) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
    if (endDate && !validateDate(endDate)) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.push({ field: 'dateRange', message: 'Start date must be before end date' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching commission statistics');
    const statistics = await commissionService.getCommissionStatistics({ agentId, startDate, endDate });
    
    return successResponse(res, statistics, 'Commission statistics fetched successfully', {
      filters: { agentId, startDate, endDate }
    });
  } catch (error) {
    logger.error('Error fetching commission statistics:', error);
    return errorResponse(res, 'Failed to fetch statistics', 500);
  }
};

/**
 * Export commissions data
 */
const exportCommissions = async (req, res) => {
  try {
    const { format = 'json', agentId, status, startDate, endDate, type } = req.query;

    // Validate format
    const validFormats = ['json', 'csv', 'xlsx', 'pdf'];
    const errors = [];
    if (!validFormats.includes(format)) {
      errors.push({ field: 'format', message: 'Format must be one of: ' + validFormats.join(', ') });
    }

    // Validate agentId if provided
    if (agentId) {
      const validation = validateObjectId(agentId, 'agentId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    // Validate type if provided
    if (type && !VALID_TYPES.includes(type)) {
      errors.push({ field: 'type', message: 'Type must be one of: ' + VALID_TYPES.join(', ') });
    }

    // Validate date range if provided
    if (startDate && !validateDate(startDate)) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
    if (endDate && !validateDate(endDate)) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Exporting commissions data in format: ' + format);
    const data = await commissionService.exportCommissions({ agentId, status, startDate, endDate, type, format });

    if (format === 'json') {
      return successResponse(res, data, 'Commissions exported successfully', {
        format,
        recordCount: data.length
      });
    }

    return errorResponse(res, 'Export format ' + format + ' not yet implemented', 501);
  } catch (error) {
    logger.error('Error exporting commissions:', error);
    return errorResponse(res, 'Failed to export commissions', 500);
  }
};

/**
 * Bulk approve commissions
 */
const bulkApproveCommissions = async (req, res) => {
  try {
    const { commissionIds } = req.body;
    const userId = req.user?.id || 'system';

    // Validate commissionIds
    const errors = [];
    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      errors.push({ field: 'commissionIds', message: 'commissionIds must be a non-empty array' });
    } else if (commissionIds.length > 100) {
      errors.push({ field: 'commissionIds', message: 'Maximum 100 commissions allowed per request' });
    } else {
      commissionIds.forEach((id, index) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ field: 'commissionIds[' + index + ']', message: 'Invalid commission ID' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Bulk approving ' + commissionIds.length + ' commissions');
    const result = await commissionService.bulkApproveCommissions(commissionIds, userId);

    return successResponse(res, result, result.successful + ' commissions approved successfully');
  } catch (error) {
    logger.error('Error bulk approving commissions:', error);
    return errorResponse(res, 'Failed to bulk approve commissions', 500);
  }
};

/**
 * Bulk pay commissions
 */
const bulkPayCommissions = async (req, res) => {
  try {
    const { commissionIds, paymentData } = req.body;
    const userId = req.user?.id || 'system';

    // Validate commissionIds
    const errors = [];
    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      errors.push({ field: 'commissionIds', message: 'commissionIds must be a non-empty array' });
    } else if (commissionIds.length > 100) {
      errors.push({ field: 'commissionIds', message: 'Maximum 100 commissions allowed per request' });
    } else {
      commissionIds.forEach((id, index) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ field: 'commissionIds[' + index + ']', message: 'Invalid commission ID' });
        }
      });
    }

    // Validate paymentData
    if (paymentData) {
      if (paymentData.date && !validateDate(paymentData.date)) {
        errors.push({ field: 'paymentData.date', message: 'Invalid payment date format' });
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Bulk paying ' + commissionIds.length + ' commissions');
    const result = await commissionService.bulkPayCommissions(commissionIds, userId, paymentData);

    return successResponse(res, result, result.successful + ' commissions paid successfully');
  } catch (error) {
    logger.error('Error bulk paying commissions:', error);
    return errorResponse(res, 'Failed to bulk pay commissions', 500);
  }
};

/**
 * Get commission analytics
 */
const getCommissionAnalytics = async (req, res) => {
  try {
    const { agentId, groupBy = 'status', startDate, endDate } = req.query;

    // Validate groupBy
    const validGroupBy = ['status', 'type', 'agent', 'month'];
    const errors = [];
    if (!validGroupBy.includes(groupBy)) {
      errors.push({ field: 'groupBy', message: 'groupBy must be one of: ' + validGroupBy.join(', ') });
    }

    // Validate agentId if provided
    if (agentId) {
      const validation = validateObjectId(agentId, 'agentId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate date range if provided
    if (startDate && !validateDate(startDate)) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
    if (endDate && !validateDate(endDate)) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching commission analytics grouped by: ' + groupBy);
    const analytics = await commissionService.getCommissionAnalytics({ agentId, groupBy, startDate, endDate });

    return successResponse(res, analytics, 'Commission analytics fetched successfully', {
      groupBy,
      filters: { agentId, startDate, endDate }
    });
  } catch (error) {
    logger.error('Error fetching commission analytics:', error);
    return errorResponse(res, 'Failed to fetch analytics', 500);
  }
};

/**
 * Get top earning agents
 */
const getTopEarningAgents = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    // Validate limit
    const errors = [];
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
    }

    // Validate date range if provided
    if (startDate && !validateDate(startDate)) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
    if (endDate && !validateDate(endDate)) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching top ' + limitNum + ' earning agents');
    const agents = await commissionService.getTopEarningAgents({ limit: limitNum, startDate, endDate });

    return successResponse(res, agents, 'Top earning agents fetched successfully', {
      limit: limitNum
    });
  } catch (error) {
    logger.error('Error fetching top earning agents:', error);
    return errorResponse(res, 'Failed to fetch top earning agents', 500);
  }
};

/**
 * Calculate commission
 */
const calculateCommission = async (req, res) => {
  try {
    const { amount, type, agentId } = req.body;

    // Validate required fields
    const errors = [];
    if (amount === undefined || amount === null) {
      errors.push({ field: 'amount', message: 'Amount is required' });
    } else if (!validateAmount(amount)) {
      errors.push({ field: 'amount', message: 'Amount must be a non-negative number' });
    }
    if (!type) {
      errors.push({ field: 'type', message: 'Type is required' });
    } else if (!VALID_TYPES.includes(type)) {
      errors.push({ field: 'type', message: 'Type must be one of: ' + VALID_TYPES.join(', ') });
    }
    if (agentId) {
      const validation = validateObjectId(agentId, 'agentId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Calculating commission for amount: ' + amount + ' and type: ' + type);
    const calculation = await commissionService.calculateCommission({ amount, type, agentId });

    return successResponse(res, calculation, 'Commission calculated successfully');
  } catch (error) {
    logger.error('Error calculating commission:', error);
    return errorResponse(res, 'Failed to calculate commission', 500);
  }
};

/**
 * Get pending commissions
 */
const getPendingCommissions = async (req, res) => {
  try {
    const { agentId, page = 1, limit = 20 } = req.query;

    // Validate pagination
    const errors = [];
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({ field: 'page', message: 'Page must be a positive integer' });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
    }

    // Validate agentId if provided
    if (agentId) {
      const validation = validateObjectId(agentId, 'agentId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching pending commissions');
    const result = await commissionService.getPendingCommissions({ agentId, page: pageNum, limit: limitNum });

    return successResponse(res, result.data, 'Pending commissions fetched successfully', {
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error fetching pending commissions:', error);
    return errorResponse(res, 'Failed to fetch pending commissions', 500);
  }
};

/**
 * Get commission trends
 */
const getCommissionTrends = async (req, res) => {
  try {
    const { agentId, period = 'month', startDate, endDate } = req.query;

    // Validate period
    const validPeriods = ['day', 'week', 'month', 'quarter', 'year'];
    const errors = [];
    if (!validPeriods.includes(period)) {
      errors.push({ field: 'period', message: 'Period must be one of: ' + validPeriods.join(', ') });
    }

    // Validate agentId if provided
    if (agentId) {
      const validation = validateObjectId(agentId, 'agentId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate date range if provided
    if (startDate && !validateDate(startDate)) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
    if (endDate && !validateDate(endDate)) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching commission trends by ' + period);
    const trends = await commissionService.getCommissionTrends({ agentId, period, startDate, endDate });

    return successResponse(res, trends, 'Commission trends fetched successfully', {
      period
    });
  } catch (error) {
    logger.error('Error fetching commission trends:', error);
    return errorResponse(res, 'Failed to fetch commission trends', 500);
  }
};

/**
 * Download commission statement for agent
 */
const downloadCommissionStatement = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { startDate, endDate, status, format = 'pdf' } = req.query;

    // Validate agent ID
    const validation = validateObjectId(agentId, 'agentId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate query parameters
    const errors = [];
    if (startDate && !validateDate(startDate)) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
    if (endDate && !validateDate(endDate)) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Invalid status' });
    }
    if (!['pdf', 'excel'].includes(format)) {
      errors.push({ field: 'format', message: 'Format must be pdf or excel' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Generating commission statement for agent ${agentId}`);

    // Get commissions data
    const commissions = await commissionService.getCommissionsByAgent(agentId, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: status || undefined
    });

    // Get agent summary
    const summary = await commissionService.getCommissionSummary(agentId);

    if (format === 'excel') {
      // Generate Excel file (simplified version)
      const csvContent = [
        ['Institution Name', 'Type', 'Revenue', 'Commission Rate', 'Commission Amount', 'Status', 'Date'],
        ...commissions.map(c => [
          c.institutionName,
          c.institutionType,
          c.revenue,
          c.commissionRate + '%',
          c.commissionAmount,
          c.status,
          new Date(c.createdAt).toLocaleDateString()
        ])
      ].map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="commission-statement-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    } else {
      // Generate PDF (simplified version - would normally use a PDF library)
      const pdfContent = `
Commission Statement
==================
Agent ID: ${agentId}
Period: ${startDate || 'All time'} - ${endDate || 'Present'}
Generated: ${new Date().toLocaleDateString()}

Summary:
--------
Total Commission: ₹${summary.totalCommission || 0}
Pending: ₹${summary.pendingCommission || 0}
Approved: ₹${summary.approvedCommission || 0}
Paid: ₹${summary.paidCommission || 0}

Commission Details:
------------------
${commissions.map(c => `
${c.institutionName} (${c.institutionType})
Revenue: ₹${c.revenue}
Commission: ₹${c.commissionAmount} (${c.commissionRate}%)
Status: ${c.status}
Date: ${new Date(c.createdAt).toLocaleDateString()}
---
`).join('')}
      `;

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="commission-statement-${new Date().toISOString().split('T')[0]}.txt"`);
      return res.send(pdfContent);
    }
  } catch (error) {
    logger.error('Error downloading commission statement:', error);
    return errorResponse(res, 'Failed to download commission statement', 500);
  }
};

/**
 * Download commission receipt
 */
const downloadCommissionReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate commission ID
    const validation = validateObjectId(id, 'commissionId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info(`Generating commission receipt for commission ${id}`);

    // Get commission details
    const commission = await commissionService.getCommissionById(id);
    if (!commission) {
      return notFoundResponse(res, 'Commission not found');
    }

    // Generate receipt content
    const receiptContent = `
COMMISSION RECEIPT
==================

Receipt ID: ${commission._id}
Date: ${new Date().toLocaleDateString()}

Commission Details:
------------------
Institution: ${commission.institutionName}
Type: ${commission.institutionType}
Revenue: ₹${commission.revenue}
Commission Rate: ${commission.commissionRate}%
Commission Amount: ₹${commission.commissionAmount}
Status: ${commission.status}

${commission.paymentDate ? `
Payment Information:
-------------------
Payment Date: ${new Date(commission.paymentDate).toLocaleDateString()}
${commission.paymentMethod ? `Payment Method: ${commission.paymentMethod}` : ''}
${commission.paymentReference ? `Reference: ${commission.paymentReference}` : ''}
` : ''}

Created Date: ${new Date(commission.createdAt).toLocaleDateString()}
Last Updated: ${new Date(commission.updatedAt).toLocaleDateString()}

${commission.notes ? `Notes: ${commission.notes}` : ''}

==================
This is a computer-generated receipt.
    `;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="commission-receipt-${id}.txt"`);
    return res.send(receiptContent);
  } catch (error) {
    logger.error('Error downloading commission receipt:', error);
    return errorResponse(res, 'Failed to download commission receipt', 500);
  }
};

export {
  createCommission,
  getCommissionById,
  getCommissionsByAgent,
  getCommissionSummary,
  updateCommissionStatus,
  updateCommission,
  deleteCommission,
  getAllCommissions,
  getCommissionStatistics,
  exportCommissions,
  bulkApproveCommissions,
  bulkPayCommissions,
  getCommissionAnalytics,
  getTopEarningAgents,
  calculateCommission,
  getPendingCommissions,
  getCommissionTrends,
  downloadCommissionStatement,
  downloadCommissionReceipt
};

export default {
  createCommission,
  getCommissionById,
  getCommissionsByAgent,
  getCommissionSummary,
  updateCommissionStatus,
  updateCommission,
  deleteCommission,
  getAllCommissions,
  getCommissionStatistics,
  exportCommissions,
  bulkApproveCommissions,
  bulkPayCommissions,
  getCommissionAnalytics,
  getTopEarningAgents,
  calculateCommission,
  getPendingCommissions,
  getCommissionTrends,
  downloadCommissionStatement,
  downloadCommissionReceipt
};
