import organizationService from '../services/organizationService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_ORG_TYPES = ['school', 'college', 'university', 'institute', 'training-center', 'corporate'];
const VALID_ORG_STATUSES = ['active', 'inactive', 'suspended', 'pending'];
const VALID_SUBSCRIPTION_PLANS = ['free', 'basic', 'standard', 'premium', 'enterprise'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_CODE_LENGTH = 50;
const MAX_ADDRESS_LENGTH = 500;

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
  return null;
};

// Helper function to validate phone
const validatePhone = (phone) => {
  if (!phone) return null;
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return 'Invalid phone number format';
  }
  return null;
};

// Helper function to validate date
const validateDate = (date, fieldName = 'Date') => {
  if (!date) {
    return fieldName + ' is required';
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return 'Start date must be before end date';
    }
  }
  return null;
};

const create = async (req, res) => {
  try {
    logger.info('Creating new organization');
    
    const { name, code, type, email, phone, address, description, subscription } = req.body;
    
    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Organization name is required');
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (!code || code.trim().length === 0) {
      errors.push('Organization code is required');
    } else if (code.length > MAX_CODE_LENGTH) {
      errors.push('Code must not exceed ' + MAX_CODE_LENGTH + ' characters');
    } else if (!/^[A-Z0-9_-]+$/i.test(code)) {
      errors.push('Code can only contain letters, numbers, hyphens, and underscores');
    }
    
    if (!type) {
      errors.push('Organization type is required');
    } else if (!VALID_ORG_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_ORG_TYPES.join(', '));
    }
    
    if (email) {
      const emailError = validateEmail(email);
      if (emailError) errors.push(emailError);
    }
    
    if (phone) {
      const phoneError = validatePhone(phone);
      if (phoneError) errors.push(phoneError);
    }
    
    if (address && address.length > MAX_ADDRESS_LENGTH) {
      errors.push('Address must not exceed ' + MAX_ADDRESS_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (subscription) {
      if (subscription.plan && !VALID_SUBSCRIPTION_PLANS.includes(subscription.plan)) {
        errors.push('Invalid subscription plan. Must be one of: ' + VALID_SUBSCRIPTION_PLANS.join(', '));
      }
      
      if (subscription.startDate) {
        const startDateError = validateDate(subscription.startDate, 'Subscription start date');
        if (startDateError) errors.push(startDateError);
      }
      
      if (subscription.endDate) {
        const endDateError = validateDate(subscription.endDate, 'Subscription end date');
        if (endDateError) errors.push(endDateError);
      }
      
      if (subscription.startDate && subscription.endDate) {
        const dateRangeError = validateDateRange(subscription.startDate, subscription.endDate);
        if (dateRangeError) errors.push(dateRangeError);
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const org = await organizationService.create(req.body);
    
    logger.info('Organization created successfully:', { orgId: org._id });
    return createdResponse(res, org, 'Organization created successfully');
  } catch (error) {
    logger.error('Error creating organization:', error);
    return errorResponse(res, error.message);
  }
};

const findAll = async (req, res) => {
  try {
    logger.info('Fetching all organizations');
    
    const { type, isActive, status, page, limit, search } = req.query;
    
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
    
    if (type && !VALID_ORG_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_ORG_TYPES.join(', '));
    }
    
    if (status && !VALID_ORG_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ORG_STATUSES.join(', '));
    }
    
    if (isActive !== undefined && isActive !== 'true' && isActive !== 'false') {
      errors.push('isActive must be true or false');
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    const orgs = await organizationService.findAll(filters, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Organizations fetched successfully');
    return successResponse(res, orgs, 'Organizations retrieved successfully');
  } catch (error) {
    logger.error('Error fetching organizations:', error);
    return errorResponse(res, error.message);
  }
};

const findById = async (req, res) => {
  try {
    logger.info('Fetching organization by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Organization ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const org = await organizationService.findById(id);
    
    if (!org) {
      return notFoundResponse(res, 'Organization not found');
    }
    
    logger.info('Organization fetched successfully:', { orgId: id });
    return successResponse(res, org, 'Organization retrieved successfully');
  } catch (error) {
    logger.error('Error fetching organization:', error);
    return errorResponse(res, error.message);
  }
};

const findByCode = async (req, res) => {
  try {
    logger.info('Fetching organization by code');
    
    const { code } = req.params;
    
    // Validation
    const errors = [];
    
    if (!code || code.trim().length === 0) {
      errors.push('Organization code is required');
    } else if (code.length > MAX_CODE_LENGTH) {
      errors.push('Code must not exceed ' + MAX_CODE_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const org = await organizationService.findByCode(code);
    
    if (!org) {
      return notFoundResponse(res, 'Organization not found');
    }
    
    logger.info('Organization fetched successfully by code:', { code });
    return successResponse(res, org, 'Organization retrieved successfully');
  } catch (error) {
    logger.error('Error fetching organization by code:', error);
    return errorResponse(res, error.message);
  }
};

const update = async (req, res) => {
  try {
    logger.info('Updating organization');
    
    const { id } = req.params;
    const { name, code, type, email, phone, address, description, status } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Organization ID');
    if (idError) errors.push(idError);
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Organization name cannot be empty');
      } else if (name.length > MAX_NAME_LENGTH) {
        errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (code !== undefined) {
      if (!code || code.trim().length === 0) {
        errors.push('Organization code cannot be empty');
      } else if (code.length > MAX_CODE_LENGTH) {
        errors.push('Code must not exceed ' + MAX_CODE_LENGTH + ' characters');
      } else if (!/^[A-Z0-9_-]+$/i.test(code)) {
        errors.push('Code can only contain letters, numbers, hyphens, and underscores');
      }
    }
    
    if (type !== undefined && !VALID_ORG_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_ORG_TYPES.join(', '));
    }
    
    if (status !== undefined && !VALID_ORG_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ORG_STATUSES.join(', '));
    }
    
    if (email !== undefined) {
      const emailError = validateEmail(email);
      if (emailError) errors.push(emailError);
    }
    
    if (phone !== undefined) {
      const phoneError = validatePhone(phone);
      if (phoneError) errors.push(phoneError);
    }
    
    if (address !== undefined && address.length > MAX_ADDRESS_LENGTH) {
      errors.push('Address must not exceed ' + MAX_ADDRESS_LENGTH + ' characters');
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const org = await organizationService.update(id, req.body);
    
    if (!org) {
      return notFoundResponse(res, 'Organization not found');
    }
    
    logger.info('Organization updated successfully:', { orgId: id });
    return successResponse(res, org, 'Organization updated successfully');
  } catch (error) {
    logger.error('Error updating organization:', error);
    return errorResponse(res, error.message);
  }
};

const deleteOrg = async (req, res) => {
  try {
    logger.info('Deleting organization');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Organization ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await organizationService.delete(id);
    
    logger.info('Organization deleted successfully:', { orgId: id });
    return successResponse(res, null, 'Organization deleted successfully');
  } catch (error) {
    logger.error('Error deleting organization:', error);
    return errorResponse(res, error.message);
  }
};

const updateSubscription = async (req, res) => {
  try {
    logger.info('Updating organization subscription');
    
    const { id } = req.params;
    const { plan, startDate, endDate } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Organization ID');
    if (idError) errors.push(idError);
    
    if (!plan) {
      errors.push('Subscription plan is required');
    } else if (!VALID_SUBSCRIPTION_PLANS.includes(plan)) {
      errors.push('Invalid subscription plan. Must be one of: ' + VALID_SUBSCRIPTION_PLANS.join(', '));
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
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const org = await organizationService.updateSubscription(id, plan, startDate, endDate);
    
    if (!org) {
      return notFoundResponse(res, 'Organization not found');
    }
    
    logger.info('Organization subscription updated successfully:', { orgId: id, plan });
    return successResponse(res, org, 'Subscription updated successfully');
  } catch (error) {
    logger.error('Error updating organization subscription:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk operations
const bulkUpdateOrganizations = async (req, res) => {
  try {
    logger.info('Bulk updating organizations');
    
    const { organizationIds, updateData } = req.body;
    
    // Validation
    const errors = [];
    
    if (!organizationIds || !Array.isArray(organizationIds)) {
      errors.push('Organization IDs must be an array');
    } else if (organizationIds.length === 0) {
      errors.push('Organization IDs array cannot be empty');
    } else if (organizationIds.length > 100) {
      errors.push('Cannot update more than 100 organizations at once');
    } else {
      for (const id of organizationIds) {
        const idError = validateObjectId(id, 'Organization ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!updateData || typeof updateData !== 'object') {
      errors.push('Update data is required');
    }
    
    if (updateData?.status && !VALID_ORG_STATUSES.includes(updateData.status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ORG_STATUSES.join(', '));
    }
    
    if (updateData?.type && !VALID_ORG_TYPES.includes(updateData.type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_ORG_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await organizationService.bulkUpdate(organizationIds, updateData);
    
    logger.info('Organizations bulk updated successfully:', { count: result.modifiedCount });
    return successResponse(res, {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    }, 'Organizations updated successfully');
  } catch (error) {
    logger.error('Error bulk updating organizations:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete organizations
const bulkDeleteOrganizations = async (req, res) => {
  try {
    logger.info('Bulk deleting organizations');
    
    const { organizationIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!organizationIds || !Array.isArray(organizationIds)) {
      errors.push('Organization IDs must be an array');
    } else if (organizationIds.length === 0) {
      errors.push('Organization IDs array cannot be empty');
    } else if (organizationIds.length > 100) {
      errors.push('Cannot delete more than 100 organizations at once');
    } else {
      for (const id of organizationIds) {
        const idError = validateObjectId(id, 'Organization ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await organizationService.bulkDelete(organizationIds);
    
    logger.info('Organizations bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, {
      deletedCount: result.deletedCount
    }, 'Organizations deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting organizations:', error);
    return errorResponse(res, error.message);
  }
};

// Export organizations data
const exportOrganizations = async (req, res) => {
  try {
    logger.info('Exporting organizations data');
    
    const { format, type, status, isActive } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (type && !VALID_ORG_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_ORG_TYPES.join(', '));
    }
    
    if (status && !VALID_ORG_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ORG_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await organizationService.exportOrganizations({
      format: format.toLowerCase(),
      type,
      status,
      isActive: isActive === 'true'
    });
    
    logger.info('Organizations data exported successfully:', { format, count: exportData.totalRecords });
    return successResponse(res, exportData, 'Data exported successfully');
  } catch (error) {
    logger.error('Error exporting organizations data:', error);
    return errorResponse(res, error.message);
  }
};

// Get organization statistics
const getOrganizationStatistics = async (req, res) => {
  try {
    logger.info('Fetching organization statistics');
    
    const { type } = req.query;
    
    // Validation
    const errors = [];
    
    if (type && !VALID_ORG_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_ORG_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await organizationService.getStatistics(type);
    
    logger.info('Organization statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching organization statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get organization analytics
const getOrganizationAnalytics = async (req, res) => {
  try {
    logger.info('Fetching organization analytics');
    
    const { startDate, endDate, groupBy } = req.query;
    
    // Validation
    const errors = [];
    
    const validGroupBy = ['day', 'week', 'month', 'year', 'type'];
    if (groupBy && !validGroupBy.includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await organizationService.getAnalytics({
      startDate,
      endDate,
      groupBy
    });
    
    logger.info('Organization analytics fetched successfully');
    return successResponse(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching organization analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Activate organization
const activateOrganization = async (req, res) => {
  try {
    logger.info('Activating organization');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Organization ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const org = await organizationService.activate(id);
    
    if (!org) {
      return notFoundResponse(res, 'Organization not found');
    }
    
    logger.info('Organization activated successfully:', { orgId: id });
    return successResponse(res, org, 'Organization activated successfully');
  } catch (error) {
    logger.error('Error activating organization:', error);
    return errorResponse(res, error.message);
  }
};

// Deactivate organization
const deactivateOrganization = async (req, res) => {
  try {
    logger.info('Deactivating organization');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Organization ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const org = await organizationService.deactivate(id);
    
    if (!org) {
      return notFoundResponse(res, 'Organization not found');
    }
    
    logger.info('Organization deactivated successfully:', { orgId: id });
    return successResponse(res, org, 'Organization deactivated successfully');
  } catch (error) {
    logger.error('Error deactivating organization:', error);
    return errorResponse(res, error.message);
  }
};

// Search organizations
const searchOrganizations = async (req, res) => {
  try {
    logger.info('Searching organizations');
    
    const { query, page, limit, type, status } = req.query;
    
    // Validation
    const errors = [];
    
    if (!query || query.trim().length === 0) {
      errors.push('Search query is required');
    } else if (query.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (type && !VALID_ORG_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_ORG_TYPES.join(', '));
    }
    
    if (status && !VALID_ORG_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ORG_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await organizationService.search({
      query,
      page: pageNum,
      limit: limitNum,
      type,
      status
    });
    
    logger.info('Organizations search completed:', { query, count: result.organizations?.length || 0 });
    return successResponse(res, result, 'Search completed successfully');
  } catch (error) {
    logger.error('Error searching organizations:', error);
    return errorResponse(res, error.message);
  }
};

// Get organizations by type
const getOrganizationsByType = async (req, res) => {
  try {
    logger.info('Fetching organizations by type');
    
    const { type } = req.params;
    const { page, limit, status } = req.query;
    
    // Validation
    const errors = [];
    
    if (!type) {
      errors.push('Organization type is required');
    } else if (!VALID_ORG_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_ORG_TYPES.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (status && !VALID_ORG_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ORG_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await organizationService.getByType(type, {
      page: pageNum,
      limit: limitNum,
      status
    });
    
    logger.info('Organizations fetched by type successfully:', { type });
    return successResponse(res, result, 'Organizations retrieved successfully');
  } catch (error) {
    logger.error('Error fetching organizations by type:', error);
    return errorResponse(res, error.message);
  }
};

// Get subscription expiring soon
const getExpiringSubscriptions = async (req, res) => {
  try {
    logger.info('Fetching organizations with expiring subscriptions');
    
    const { days, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const daysNum = parseInt(days) || 30;
    
    if (daysNum < 1 || daysNum > 365) {
      errors.push('Days must be between 1 and 365');
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
    
    const result = await organizationService.getExpiringSubscriptions({
      days: daysNum,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Organizations with expiring subscriptions fetched successfully');
    return successResponse(res, result, 'Organizations retrieved successfully');
  } catch (error) {
    logger.error('Error fetching organizations with expiring subscriptions:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  create,
  findAll,
  findById,
  findByCode,
  update,
  deleteOrg,
  updateSubscription,
  bulkUpdateOrganizations,
  bulkDeleteOrganizations,
  exportOrganizations,
  getOrganizationStatistics,
  getOrganizationAnalytics,
  activateOrganization,
  deactivateOrganization,
  searchOrganizations,
  getOrganizationsByType,
  getExpiringSubscriptions
};
