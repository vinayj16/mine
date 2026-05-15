import apiKeyService from '../services/apiKeyService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid API key statuses
const VALID_STATUSES = ['active', 'inactive', 'revoked', 'expired'];

// Valid permission scopes
const VALID_SCOPES = ['read', 'write', 'delete', 'admin', 'all'];

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
 * Get institution ID from request
 */
const getInstitutionId = (req) => req.user?.institutionId || req.body?.institutionId;

const createApiKey = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const institutionId = getInstitutionId(req);
    const { name, description, permissions, expiresAt, rateLimit, ipWhitelist } = req.body;

    // Validate required fields
    const errors = [];
    if (!name || name.trim().length < 3) {
      errors.push({ field: 'name', message: 'Name is required and must be at least 3 characters' });
    }
    if (!ownerId) {
      errors.push({ field: 'owner', message: 'Owner ID is required' });
    }

    // Validate permissions if provided
    if (permissions && Array.isArray(permissions)) {
      const invalidPerms = permissions.filter(p => !VALID_SCOPES.includes(p));
      if (invalidPerms.length > 0) {
        errors.push({ field: 'permissions', message: 'Invalid permissions: ' + invalidPerms.join(', ') });
      }
    }

    // Validate expiresAt if provided
    if (expiresAt) {
      const expiry = new Date(expiresAt);
      if (isNaN(expiry.getTime()) || expiry < new Date()) {
        errors.push({ field: 'expiresAt', message: 'Expiry date must be a valid future date' });
      }
    }

    // Validate rateLimit if provided
    if (rateLimit && (isNaN(rateLimit) || rateLimit < 1 || rateLimit > 10000)) {
      errors.push({ field: 'rateLimit', message: 'Rate limit must be between 1 and 10000 requests per hour' });
    }

    // Validate ipWhitelist if provided
    if (ipWhitelist && Array.isArray(ipWhitelist)) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
      const invalidIPs = ipWhitelist.filter(ip => !ipRegex.test(ip));
      if (invalidIPs.length > 0) {
        errors.push({ field: 'ipWhitelist', message: 'Invalid IP addresses: ' + invalidIPs.join(', ') });
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const payload = {
      owner: ownerId,
      institution: institutionId,
      ...req.body
    };

    logger.info(`Creating API key for owner ${ownerId}`);
    const apiKey = await apiKeyService.createApiKey(payload);

    return createdResponse(res, apiKey, 'API key created successfully');
  } catch (error) {
    logger.error('Error creating API key:', error);
    return errorResponse(res, 'Error creating API key', 500);
  }
};

const listApiKeys = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { page = 1, limit = 15, status = 'active', search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Validate status
    if (status && !VALID_STATUSES.includes(status)) {
      return validationErrorResponse(res, [{ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') }]);
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

    logger.info(`Fetching API keys for owner ${ownerId}`);
    const result = await apiKeyService.listApiKeys(ownerId, { 
      page: pageNum, 
      limit: limitNum, 
      status, 
      search,
      sortBy,
      sortOrder
    });

    return successResponse(res, result.apiKeys, 'API keys fetched successfully', {
      pagination: result.pagination,
      filters: { status, search }
    });
  } catch (error) {
    logger.error('Error fetching API keys:', error);
    return errorResponse(res, 'Error fetching API keys', 500);
  }
};

const getApiKey = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { id } = req.params;

    // Validate ID
    const validation = validateObjectId(id, 'apiKeyId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info(`Fetching API key ${id}`);
    const apiKey = await apiKeyService.getApiKeyById(id, ownerId);

    if (!apiKey) {
      return notFoundResponse(res, 'API key not found');
    }

    return successResponse(res, apiKey, 'API key fetched successfully');
  } catch (error) {
    logger.error('Error fetching API key:', error);
    return errorResponse(res, 'Error fetching API key', 500);
  }
};

const regenerateApiKey = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    // Validate ID
    const validation = validateObjectId(id, 'apiKeyId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info(`Regenerating API key ${id}`);
    const apiKey = await apiKeyService.regenerateApiKey(id, ownerId, reason);

    if (!apiKey) {
      return notFoundResponse(res, 'API key not found');
    }

    return successResponse(res, apiKey, 'API key regenerated successfully');
  } catch (error) {
    logger.error('Error regenerating API key:', error);
    return errorResponse(res, 'Error regenerating API key', 500);
  }
};

const deleteApiKey = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { id } = req.params;

    // Validate ID
    const validation = validateObjectId(id, 'apiKeyId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info(`Revoking API key ${id}`);
    const result = await apiKeyService.deleteApiKey(id, ownerId);

    if (!result) {
      return notFoundResponse(res, 'API key not found');
    }

    return successResponse(res, null, 'API key revoked successfully');
  } catch (error) {
    logger.error('Error revoking API key:', error);
    return errorResponse(res, 'Error revoking API key', 500);
  }
};

const validateKey = async (req, res) => {
  try {
    if (!req.apiKey) {
      logger.warn('API key validation failed - no key provided');
      return errorResponse(res, 'API key validation failed', 401);
    }

    logger.info(`API key validated: ${req.apiKey.id}`);
    return successResponse(res, {
      id: req.apiKey.id,
      permissions: req.apiKey.permissions,
      rateLimit: req.apiKey.rateLimit,
      expiresAt: req.apiKey.expiresAt
    }, 'API key is valid');
  } catch (error) {
    logger.error('Error validating API key:', error);
    return errorResponse(res, 'Error validating API key', 500);
  }
};


/**
 * Update API key
 */
const updateApiKey = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { id } = req.params;
    const { name, description, permissions, rateLimit, ipWhitelist, status } = req.body;

    // Validate ID
    const validation = validateObjectId(id, 'apiKeyId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate fields
    const errors = [];
    if (permissions && Array.isArray(permissions)) {
      const invalidPerms = permissions.filter(p => !VALID_SCOPES.includes(p));
      if (invalidPerms.length > 0) {
        errors.push({ field: 'permissions', message: 'Invalid permissions: ' + invalidPerms.join(', ') });
      }
    }
    if (rateLimit && (isNaN(rateLimit) || rateLimit < 1 || rateLimit > 10000)) {
      errors.push({ field: 'rateLimit', message: 'Rate limit must be between 1 and 10000 requests per hour' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Updating API key ${id}`);
    const apiKey = await apiKeyService.updateApiKey(id, ownerId, { name, description, permissions, rateLimit, ipWhitelist, status });

    if (!apiKey) {
      return notFoundResponse(res, 'API key not found');
    }

    return successResponse(res, apiKey, 'API key updated successfully');
  } catch (error) {
    logger.error('Error updating API key:', error);
    return errorResponse(res, 'Error updating API key', 500);
  }
};

/**
 * Get API key usage statistics
 */
const getApiKeyUsage = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { id } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Validate ID
    const validation = validateObjectId(id, 'apiKeyId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
      }
    }

    // Validate groupBy
    const validGroupBy = ['hour', 'day', 'week', 'month'];
    if (!validGroupBy.includes(groupBy)) {
      return validationErrorResponse(res, [{ field: 'groupBy', message: 'groupBy must be one of: ' + validGroupBy.join(', ') }]);
    }

    logger.info(`Fetching usage statistics for API key ${id}`);
    const usage = await apiKeyService.getApiKeyUsage(id, ownerId, { startDate, endDate, groupBy });

    if (!usage) {
      return notFoundResponse(res, 'API key not found');
    }

    return successResponse(res, usage, 'API key usage statistics fetched successfully');
  } catch (error) {
    logger.error('Error fetching API key usage:', error);
    return errorResponse(res, 'Error fetching API key usage', 500);
  }
};

/**
 * Rotate API key
 */
const rotateApiKey = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { id } = req.params;
    const { gracePeriodHours = 24 } = req.body;

    // Validate ID
    const validation = validateObjectId(id, 'apiKeyId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate grace period
    const gracePeriod = parseInt(gracePeriodHours);
    if (isNaN(gracePeriod) || gracePeriod < 0 || gracePeriod > 168) {
      return validationErrorResponse(res, [{ field: 'gracePeriodHours', message: 'Grace period must be between 0 and 168 hours (7 days)' }]);
    }

    logger.info(`Rotating API key ${id} with ${gracePeriod} hour grace period`);
    const result = await apiKeyService.rotateApiKey(id, ownerId, gracePeriod);

    if (!result) {
      return notFoundResponse(res, 'API key not found');
    }

    return successResponse(res, result, 'API key rotated successfully. Old key will remain valid during grace period.');
  } catch (error) {
    logger.error('Error rotating API key:', error);
    return errorResponse(res, 'Error rotating API key', 500);
  }
};

/**
 * Bulk revoke API keys
 */
const bulkRevokeApiKeys = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { apiKeyIds, reason } = req.body;

    // Validate apiKeyIds
    if (!apiKeyIds || !Array.isArray(apiKeyIds) || apiKeyIds.length === 0) {
      return validationErrorResponse(res, [{ field: 'apiKeyIds', message: 'apiKeyIds must be a non-empty array' }]);
    }

    if (apiKeyIds.length > 50) {
      return validationErrorResponse(res, [{ field: 'apiKeyIds', message: 'Maximum 50 API keys can be revoked at once' }]);
    }

    // Validate all IDs
    const invalidIds = apiKeyIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return validationErrorResponse(res, [{ field: 'apiKeyIds', message: 'One or more API key IDs are invalid' }]);
    }

    logger.info(`Bulk revoking ${apiKeyIds.length} API keys`);
    const result = await apiKeyService.bulkRevokeApiKeys(apiKeyIds, ownerId, reason);

    return successResponse(res, result, `${result.revoked} API keys revoked successfully`);
  } catch (error) {
    logger.error('Error bulk revoking API keys:', error);
    return errorResponse(res, 'Error bulk revoking API keys', 500);
  }
};

/**
 * Get API key audit log
 */
const getApiKeyAuditLog = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { id } = req.params;
    const { page = 1, limit = 20, action, startDate, endDate } = req.query;

    // Validate ID
    const validation = validateObjectId(id, 'apiKeyId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
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

    // Validate action if provided
    const validActions = ['created', 'updated', 'regenerated', 'revoked', 'used', 'failed'];
    if (action && !validActions.includes(action)) {
      return validationErrorResponse(res, [{ field: 'action', message: 'Action must be one of: ' + validActions.join(', ') }]);
    }

    logger.info(`Fetching audit log for API key ${id}`);
    const result = await apiKeyService.getApiKeyAuditLog(id, ownerId, { 
      page: pageNum, 
      limit: limitNum, 
      action, 
      startDate, 
      endDate 
    });

    if (!result) {
      return notFoundResponse(res, 'API key not found');
    }

    return successResponse(res, result.logs, 'API key audit log fetched successfully', {
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error fetching API key audit log:', error);
    return errorResponse(res, 'Error fetching API key audit log', 500);
  }
};

/**
 * Test API key
 */
const testApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || apiKey.length < 32) {
      return validationErrorResponse(res, [{ field: 'apiKey', message: 'Valid API key is required' }]);
    }

    logger.info('Testing API key');
    const result = await apiKeyService.testApiKey(apiKey);

    return successResponse(res, result, 'API key test completed');
  } catch (error) {
    logger.error('Error testing API key:', error);
    return errorResponse(res, 'Error testing API key', 500);
  }
};

/**
 * Get API key statistics
 */
const getApiKeyStatistics = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { startDate, endDate } = req.query;

    // Validate date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
      }
    }

    logger.info(`Fetching API key statistics for owner ${ownerId}`);
    const stats = await apiKeyService.getApiKeyStatistics(ownerId, { startDate, endDate });

    return successResponse(res, stats, 'API key statistics fetched successfully');
  } catch (error) {
    logger.error('Error fetching API key statistics:', error);
    return errorResponse(res, 'Error fetching API key statistics', 500);
  }
};


export default {
  createApiKey,
  listApiKeys,
  getApiKey,
  regenerateApiKey,
  deleteApiKey,
  validateKey,
  updateApiKey,
  getApiKeyUsage,
  rotateApiKey,
  bulkRevokeApiKeys,
  getApiKeyAuditLog,
  testApiKey,
  getApiKeyStatistics
};
