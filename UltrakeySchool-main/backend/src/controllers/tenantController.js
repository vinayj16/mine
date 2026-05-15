import tenantService from '../services/tenantService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'suspended', 'trial', 'expired', 'pending'];
const VALID_SUBSCRIPTION_TYPES = ['free', 'basic', 'premium', 'enterprise', 'custom'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NAME_LENGTH = 200;
const MAX_DOMAIN_LENGTH = 100;
const MAX_EMAIL_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;
const MAX_ADDRESS_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 1000;
const MIN_USER_LIMIT = 1;
const MAX_USER_LIMIT = 100000;

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

// Helper function to validate email
const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    return 'Email must not exceed ' + MAX_EMAIL_LENGTH + ' characters';
  }
  return null;
};

// Helper function to validate phone
const validatePhone = (phone) => {
  if (!phone) return null;
  const phoneRegex = /^[+]?[\d\s\-()]+$/;
  if (!phoneRegex.test(phone)) {
    return 'Invalid phone number format';
  }
  if (phone.length > MAX_PHONE_LENGTH) {
    return 'Phone number must not exceed ' + MAX_PHONE_LENGTH + ' characters';
  }
  return null;
};

// Helper function to validate domain
const validateDomain = (domain) => {
  if (!domain) return 'Domain is required';
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
  if (!domainRegex.test(domain)) {
    return 'Invalid domain format';
  }
  if (domain.length > MAX_DOMAIN_LENGTH) {
    return 'Domain must not exceed ' + MAX_DOMAIN_LENGTH + ' characters';
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

/**
 * Get all tenants (admin only)
 */
const getTenants = async (req, res) => {
  try {
    logger.info('Fetching all tenants');
    
    const { page, limit, search, status, subscriptionType, sortBy, sortOrder } = req.query;
    
    // Validation
    const errors = [];
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (subscriptionType && !VALID_SUBSCRIPTION_TYPES.includes(subscriptionType)) {
      errors.push('Invalid subscription type. Must be one of: ' + VALID_SUBSCRIPTION_TYPES.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: ' + VALID_SORT_ORDERS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const tenants = await tenantService.getTenants({
      page: pageNum,
      limit: limitNum,
      search,
      status,
      subscriptionType,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    });

    logger.info('Tenants fetched successfully:', { count: tenants.data.length });
    return successResponse(res, {
      tenants: tenants.data,
      pagination: tenants.pagination
    }, 'Tenants retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tenants:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Create new tenant
 */
const createTenant = async (req, res) => {
  try {
    logger.info('Creating tenant');
    
    const { name, domain, email, phone, contactPerson, subscriptionType, userLimit, status } = req.body;
    
    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Tenant name is required');
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    const domainError = validateDomain(domain);
    if (domainError) errors.push(domainError);
    
    const emailError = validateEmail(email);
    if (emailError) errors.push(emailError);
    
    if (phone) {
      const phoneError = validatePhone(phone);
      if (phoneError) errors.push(phoneError);
    }
    
    if (contactPerson && contactPerson.length > MAX_NAME_LENGTH) {
      errors.push('Contact person name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (subscriptionType && !VALID_SUBSCRIPTION_TYPES.includes(subscriptionType)) {
      errors.push('Invalid subscription type. Must be one of: ' + VALID_SUBSCRIPTION_TYPES.join(', '));
    }
    
    if (userLimit !== undefined) {
      if (typeof userLimit !== 'number' || userLimit < MIN_USER_LIMIT || userLimit > MAX_USER_LIMIT) {
        errors.push('User limit must be between ' + MIN_USER_LIMIT + ' and ' + MAX_USER_LIMIT);
      }
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const tenant = await tenantService.createTenant(req.body);

    logger.info('Tenant created successfully:', { tenantId: tenant._id, name, domain });
    return createdResponse(res, tenant, 'Tenant created successfully');
  } catch (error) {
    logger.error('Error creating tenant:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get tenant details
 */
const getTenantById = async (req, res) => {
  try {
    logger.info('Fetching tenant by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Tenant ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const tenant = await tenantService.getTenantById(id);

    if (!tenant) {
      return notFoundResponse(res, 'Tenant not found');
    }

    logger.info('Tenant fetched successfully:', { tenantId: id });
    return successResponse(res, tenant, 'Tenant retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tenant:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Update tenant
 */
const updateTenant = async (req, res) => {
  try {
    logger.info('Updating tenant');
    
    const { id } = req.params;
    const { name, domain, email, phone, subscriptionType, userLimit, status } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Tenant ID');
    if (idError) errors.push(idError);
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Tenant name cannot be empty');
      } else if (name.length > MAX_NAME_LENGTH) {
        errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (domain !== undefined) {
      const domainError = validateDomain(domain);
      if (domainError) errors.push(domainError);
    }
    
    if (email !== undefined) {
      const emailError = validateEmail(email);
      if (emailError) errors.push(emailError);
    }
    
    if (phone !== undefined) {
      const phoneError = validatePhone(phone);
      if (phoneError) errors.push(phoneError);
    }
    
    if (subscriptionType !== undefined && !VALID_SUBSCRIPTION_TYPES.includes(subscriptionType)) {
      errors.push('Invalid subscription type. Must be one of: ' + VALID_SUBSCRIPTION_TYPES.join(', '));
    }
    
    if (userLimit !== undefined) {
      if (typeof userLimit !== 'number' || userLimit < MIN_USER_LIMIT || userLimit > MAX_USER_LIMIT) {
        errors.push('User limit must be between ' + MIN_USER_LIMIT + ' and ' + MAX_USER_LIMIT);
      }
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const tenant = await tenantService.updateTenant(id, req.body);

    if (!tenant) {
      return notFoundResponse(res, 'Tenant not found');
    }

    logger.info('Tenant updated successfully:', { tenantId: id });
    return successResponse(res, tenant, 'Tenant updated successfully');
  } catch (error) {
    logger.error('Error updating tenant:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Delete tenant
 */
const deleteTenant = async (req, res) => {
  try {
    logger.info('Deleting tenant');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Tenant ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    await tenantService.deleteTenant(id);

    logger.info('Tenant deleted successfully:', { tenantId: id });
    return successResponse(res, null, 'Tenant deleted successfully');
  } catch (error) {
    logger.error('Error deleting tenant:', error);
    return errorResponse(res, error.message);
  }
};


/**
 * Get tenant by domain
 */
const getTenantByDomain = async (req, res) => {
  try {
    logger.info('Fetching tenant by domain');
    
    const { domain } = req.params;
    
    // Validation
    const errors = [];
    
    const domainError = validateDomain(domain);
    if (domainError) errors.push(domainError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const tenant = await tenantService.getTenantByDomain(domain);

    if (!tenant) {
      return notFoundResponse(res, 'Tenant not found');
    }

    logger.info('Tenant fetched by domain successfully:', { domain });
    return successResponse(res, tenant, 'Tenant retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tenant by domain:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Update tenant status
 */
const updateTenantStatus = async (req, res) => {
  try {
    logger.info('Updating tenant status');
    
    const { id } = req.params;
    const { status } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Tenant ID');
    if (idError) errors.push(idError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const tenant = await tenantService.updateTenantStatus(id, status);

    if (!tenant) {
      return notFoundResponse(res, 'Tenant not found');
    }

    logger.info('Tenant status updated successfully:', { tenantId: id, status });
    return successResponse(res, tenant, 'Tenant status updated successfully');
  } catch (error) {
    logger.error('Error updating tenant status:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Update tenant subscription
 */
const updateTenantSubscription = async (req, res) => {
  try {
    logger.info('Updating tenant subscription');
    
    const { id } = req.params;
    const { subscriptionType, userLimit, expiryDate } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Tenant ID');
    if (idError) errors.push(idError);
    
    if (!subscriptionType) {
      errors.push('Subscription type is required');
    } else if (!VALID_SUBSCRIPTION_TYPES.includes(subscriptionType)) {
      errors.push('Invalid subscription type. Must be one of: ' + VALID_SUBSCRIPTION_TYPES.join(', '));
    }
    
    if (userLimit !== undefined) {
      if (typeof userLimit !== 'number' || userLimit < MIN_USER_LIMIT || userLimit > MAX_USER_LIMIT) {
        errors.push('User limit must be between ' + MIN_USER_LIMIT + ' and ' + MAX_USER_LIMIT);
      }
    }
    
    if (expiryDate) {
      const expiryDateError = validateDate(expiryDate, 'Expiry date');
      if (expiryDateError) errors.push(expiryDateError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const tenant = await tenantService.updateTenantSubscription(id, req.body);

    if (!tenant) {
      return notFoundResponse(res, 'Tenant not found');
    }

    logger.info('Tenant subscription updated successfully:', { tenantId: id, subscriptionType });
    return successResponse(res, tenant, 'Tenant subscription updated successfully');
  } catch (error) {
    logger.error('Error updating tenant subscription:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get tenants by status
 */
const getTenantsByStatus = async (req, res) => {
  try {
    logger.info('Fetching tenants by status');
    
    const { status } = req.params;
    
    // Validation
    const errors = [];
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const tenants = await tenantService.getTenantsByStatus(status);

    logger.info('Tenants fetched by status successfully:', { status, count: tenants.length });
    return successResponse(res, tenants, 'Tenants retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tenants by status:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get tenants by subscription type
 */
const getTenantsBySubscription = async (req, res) => {
  try {
    logger.info('Fetching tenants by subscription type');
    
    const { subscriptionType } = req.params;
    
    // Validation
    const errors = [];
    
    if (!subscriptionType) {
      errors.push('Subscription type is required');
    } else if (!VALID_SUBSCRIPTION_TYPES.includes(subscriptionType)) {
      errors.push('Invalid subscription type. Must be one of: ' + VALID_SUBSCRIPTION_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const tenants = await tenantService.getTenantsBySubscription(subscriptionType);

    logger.info('Tenants fetched by subscription successfully:', { subscriptionType, count: tenants.length });
    return successResponse(res, tenants, 'Tenants retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tenants by subscription:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Suspend tenant
 */
const suspendTenant = async (req, res) => {
  try {
    logger.info('Suspending tenant');
    
    const { id } = req.params;
    const { reason } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Tenant ID');
    if (idError) errors.push(idError);
    
    if (reason && reason.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const tenant = await tenantService.suspendTenant(id, reason);

    if (!tenant) {
      return notFoundResponse(res, 'Tenant not found');
    }

    logger.info('Tenant suspended successfully:', { tenantId: id });
    return successResponse(res, tenant, 'Tenant suspended successfully');
  } catch (error) {
    logger.error('Error suspending tenant:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Activate tenant
 */
const activateTenant = async (req, res) => {
  try {
    logger.info('Activating tenant');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Tenant ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const tenant = await tenantService.activateTenant(id);

    if (!tenant) {
      return notFoundResponse(res, 'Tenant not found');
    }

    logger.info('Tenant activated successfully:', { tenantId: id });
    return successResponse(res, tenant, 'Tenant activated successfully');
  } catch (error) {
    logger.error('Error activating tenant:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get tenant statistics
 */
const getTenantStatistics = async (req, res) => {
  try {
    logger.info('Fetching tenant statistics');
    
    const statistics = await tenantService.getTenantStatistics();

    logger.info('Tenant statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tenant statistics:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get tenant usage analytics
 */
const getTenantUsageAnalytics = async (req, res) => {
  try {
    logger.info('Fetching tenant usage analytics');
    
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Tenant ID');
    if (idError) errors.push(idError);
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        errors.push('Start date must be before end date');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const analytics = await tenantService.getTenantUsageAnalytics(id, { startDate, endDate });

    if (!analytics) {
      return notFoundResponse(res, 'Tenant not found');
    }

    logger.info('Tenant usage analytics fetched successfully:', { tenantId: id });
    return successResponse(res, analytics, 'Usage analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tenant usage analytics:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Bulk update tenant status
 */
const bulkUpdateStatus = async (req, res) => {
  try {
    logger.info('Bulk updating tenant status');
    
    const { tenantIds, status } = req.body;
    
    // Validation
    const errors = [];
    
    if (!tenantIds || !Array.isArray(tenantIds)) {
      errors.push('Tenant IDs must be an array');
    } else if (tenantIds.length === 0) {
      errors.push('Tenant IDs array cannot be empty');
    } else if (tenantIds.length > 100) {
      errors.push('Cannot update more than 100 tenants at once');
    } else {
      for (const id of tenantIds) {
        const idError = validateObjectId(id, 'Tenant ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await tenantService.bulkUpdateStatus(tenantIds, status);

    logger.info('Tenant status bulk updated successfully:', { count: result.modifiedCount, status });
    return successResponse(res, result, 'Tenants status updated successfully');
  } catch (error) {
    logger.error('Error bulk updating tenant status:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Bulk delete tenants
 */
const bulkDeleteTenants = async (req, res) => {
  try {
    logger.info('Bulk deleting tenants');
    
    const { tenantIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!tenantIds || !Array.isArray(tenantIds)) {
      errors.push('Tenant IDs must be an array');
    } else if (tenantIds.length === 0) {
      errors.push('Tenant IDs array cannot be empty');
    } else if (tenantIds.length > 100) {
      errors.push('Cannot delete more than 100 tenants at once');
    } else {
      for (const id of tenantIds) {
        const idError = validateObjectId(id, 'Tenant ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await tenantService.bulkDeleteTenants(tenantIds);

    logger.info('Tenants bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Tenants deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting tenants:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Export tenants
 */
const exportTenants = async (req, res) => {
  try {
    logger.info('Exporting tenants');
    
    const { format, status, subscriptionType } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (subscriptionType && !VALID_SUBSCRIPTION_TYPES.includes(subscriptionType)) {
      errors.push('Invalid subscription type. Must be one of: ' + VALID_SUBSCRIPTION_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const exportData = await tenantService.exportTenants({
      format: format.toLowerCase(),
      status,
      subscriptionType
    });

    logger.info('Tenants exported successfully:', { format });
    return successResponse(res, exportData, 'Tenants exported successfully');
  } catch (error) {
    logger.error('Error exporting tenants:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Search tenants
 */
const searchTenants = async (req, res) => {
  try {
    logger.info('Searching tenants');
    
    const { q } = req.query;
    
    // Validation
    const errors = [];
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const tenants = await tenantService.searchTenants(q);

    logger.info('Tenants searched successfully:', { query: q, count: tenants.length });
    return successResponse(res, tenants, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching tenants:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get expiring tenants
 */
const getExpiringTenants = async (req, res) => {
  try {
    logger.info('Fetching expiring tenants');
    
    const { days } = req.query;
    
    // Validation
    const errors = [];
    
    const daysNum = parseInt(days) || 30;
    if (daysNum < 1 || daysNum > 365) {
      errors.push('Days must be between 1 and 365');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const tenants = await tenantService.getExpiringTenants(daysNum);

    logger.info('Expiring tenants fetched successfully:', { days: daysNum, count: tenants.length });
    return successResponse(res, tenants, 'Expiring tenants retrieved successfully');
  } catch (error) {
    logger.error('Error fetching expiring tenants:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Renew tenant subscription
 */
const renewTenantSubscription = async (req, res) => {
  try {
    logger.info('Renewing tenant subscription');
    
    const { id } = req.params;
    const { duration, subscriptionType } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Tenant ID');
    if (idError) errors.push(idError);
    
    if (!duration) {
      errors.push('Duration is required');
    } else if (typeof duration !== 'number' || duration < 1 || duration > 60) {
      errors.push('Duration must be between 1 and 60 months');
    }
    
    if (subscriptionType && !VALID_SUBSCRIPTION_TYPES.includes(subscriptionType)) {
      errors.push('Invalid subscription type. Must be one of: ' + VALID_SUBSCRIPTION_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const tenant = await tenantService.renewTenantSubscription(id, req.body);

    if (!tenant) {
      return notFoundResponse(res, 'Tenant not found');
    }

    logger.info('Tenant subscription renewed successfully:', { tenantId: id, duration });
    return successResponse(res, tenant, 'Tenant subscription renewed successfully');
  } catch (error) {
    logger.error('Error renewing tenant subscription:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getTenants,
  createTenant,
  getTenantById,
  updateTenant,
  deleteTenant,
  getTenantByDomain,
  updateTenantStatus,
  updateTenantSubscription,
  getTenantsByStatus,
  getTenantsBySubscription,
  suspendTenant,
  activateTenant,
  getTenantStatistics,
  getTenantUsageAnalytics,
  bulkUpdateStatus,
  bulkDeleteTenants,
  exportTenants,
  searchTenants,
  getExpiringTenants,
  renewTenantSubscription
};
