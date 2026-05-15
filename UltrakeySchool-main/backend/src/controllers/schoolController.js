import schoolService from '../services/schoolService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_TYPES = ['primary', 'secondary', 'high-school', 'college', 'university', 'institute', 'other'];
const VALID_CATEGORIES = ['public', 'private', 'charter', 'international', 'vocational'];
const VALID_STATUSES = ['active', 'inactive', 'suspended', 'pending', 'archived'];
const VALID_SUBSCRIPTION_STATUSES = ['active', 'expired', 'trial', 'cancelled', 'suspended'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NAME_LENGTH = 200;
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
  if (!email) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  return null;
};

// Helper function to validate phone
const validatePhone = (phone) => {
  if (!phone) {
    return null; // Phone is optional
  }
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  if (!phoneRegex.test(phone)) {
    return 'Invalid phone format';
  }
  return null;
};

// Create school
const createSchool = async (req, res) => {
  try {
    logger.info('Creating school');
    
    const { name, code, type, category, email, phone, address, status } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('School name is required');
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (!code || code.trim().length === 0) {
      errors.push('School code is required');
    } else if (code.length > MAX_CODE_LENGTH) {
      errors.push('Code must not exceed ' + MAX_CODE_LENGTH + ' characters');
    }
    
    if (!type) {
      errors.push('Type is required');
    } else if (!VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    const emailError = validateEmail(email);
    if (emailError) errors.push(emailError);
    
    const phoneError = validatePhone(phone);
    if (phoneError) errors.push(phoneError);
    
    if (address && address.length > MAX_ADDRESS_LENGTH) {
      errors.push('Address must not exceed ' + MAX_ADDRESS_LENGTH + ' characters');
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schoolData = {
      ...req.body,
      metadata: { createdBy: userId || 'system' }
    };
    
    const school = await schoolService.createSchool(schoolData);
    
    logger.info('School created successfully:', { schoolId: school._id, name });
    return createdResponse(res, school, 'School created successfully');
  } catch (error) {
    logger.error('Error creating school:', error);
    return errorResponse(res, error.message);
  }
};

// Get all schools
const getSchools = async (req, res) => {
  try {
    logger.info('Fetching schools');
    
    const { type, category, status, subscriptionStatus, search, page, limit, sortBy, sortOrder } = req.query;
    
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
    
    if (type && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (subscriptionStatus && !VALID_SUBSCRIPTION_STATUSES.includes(subscriptionStatus)) {
      errors.push('Invalid subscription status. Must be one of: ' + VALID_SUBSCRIPTION_STATUSES.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = {};
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (subscriptionStatus) filters['subscription.status'] = subscriptionStatus;
    if (search) filters.search = search;

    const options = {
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };

    const result = await schoolService.getSchools(filters, options);
    
    logger.info('Schools fetched successfully');
    return successResponse(res, {
      schools: result.schools || result,
      pagination: result.pagination
    }, 'Schools retrieved successfully');
  } catch (error) {
    logger.error('Error fetching schools:', error);
    return errorResponse(res, error.message);
  }
};

// Get school by ID
const getSchoolById = async (req, res) => {
  try {
    logger.info('Fetching school by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'School ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const school = await schoolService.getSchoolById(id);
    
    if (!school) {
      return notFoundResponse(res, 'School not found');
    }
    
    logger.info('School fetched successfully:', { schoolId: id });
    return successResponse(res, school, 'School retrieved successfully');
  } catch (error) {
    logger.error('Error fetching school:', error);
    return errorResponse(res, error.message);
  }
};

// Get school by code
const getSchoolByCode = async (req, res) => {
  try {
    logger.info('Fetching school by code');
    
    const { code } = req.params;
    
    // Validation
    const errors = [];
    
    if (!code || code.trim().length === 0) {
      errors.push('School code is required');
    } else if (code.length > MAX_CODE_LENGTH) {
      errors.push('Code must not exceed ' + MAX_CODE_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const school = await schoolService.getSchoolByCode(code);
    
    if (!school) {
      return notFoundResponse(res, 'School not found');
    }
    
    logger.info('School fetched by code successfully:', { code });
    return successResponse(res, school, 'School retrieved successfully');
  } catch (error) {
    logger.error('Error fetching school by code:', error);
    return errorResponse(res, error.message);
  }
};

// Update school
const updateSchool = async (req, res) => {
  try {
    logger.info('Updating school');
    
    const { id } = req.params;
    const { name, code, type, category, email, phone, address, status } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'School ID');
    if (idError) errors.push(idError);
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('School name cannot be empty');
      } else if (name.length > MAX_NAME_LENGTH) {
        errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (code !== undefined) {
      if (!code || code.trim().length === 0) {
        errors.push('School code cannot be empty');
      } else if (code.length > MAX_CODE_LENGTH) {
        errors.push('Code must not exceed ' + MAX_CODE_LENGTH + ' characters');
      }
    }
    
    if (type !== undefined && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
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
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updateData = { ...req.body, 'metadata.updatedBy': userId || 'system' };
    const school = await schoolService.updateSchool(id, updateData);
    
    if (!school) {
      return notFoundResponse(res, 'School not found');
    }
    
    logger.info('School updated successfully:', { schoolId: id });
    return successResponse(res, school, 'School updated successfully');
  } catch (error) {
    logger.error('Error updating school:', error);
    return errorResponse(res, error.message);
  }
};

// Delete school
const deleteSchool = async (req, res) => {
  try {
    logger.info('Deleting school');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'School ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await schoolService.deleteSchool(id);
    
    logger.info('School deleted successfully:', { schoolId: id });
    return successResponse(res, null, 'School deleted successfully');
  } catch (error) {
    logger.error('Error deleting school:', error);
    return errorResponse(res, error.message);
  }
};

// Get schools by type
const getSchoolsByType = async (req, res) => {
  try {
    logger.info('Fetching schools by type');
    
    const { type } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!type) {
      errors.push('Type is required');
    } else if (!VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
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
    
    const result = await schoolService.getSchoolsByType(type, { page: pageNum, limit: limitNum });
    
    logger.info('Schools fetched by type successfully:', { type, count: result.schools?.length || result.length });
    return successResponse(res, {
      schools: result.schools || result,
      pagination: result.pagination
    }, 'Schools retrieved successfully');
  } catch (error) {
    logger.error('Error fetching schools by type:', error);
    return errorResponse(res, error.message);
  }
};

// Get schools by category
const getSchoolsByCategory = async (req, res) => {
  try {
    logger.info('Fetching schools by category');
    
    const { category } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!category) {
      errors.push('Category is required');
    } else if (!VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
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
    
    const result = await schoolService.getSchoolsByCategory(category, { page: pageNum, limit: limitNum });
    
    logger.info('Schools fetched by category successfully:', { category, count: result.schools?.length || result.length });
    return successResponse(res, {
      schools: result.schools || result,
      pagination: result.pagination
    }, 'Schools retrieved successfully');
  } catch (error) {
    logger.error('Error fetching schools by category:', error);
    return errorResponse(res, error.message);
  }
};

// Search schools
const searchSchools = async (req, res) => {
  try {
    logger.info('Searching schools');
    
    const { q, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    const limitNum = parseInt(limit) || 20;
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schools = await schoolService.searchSchools(q, limitNum);
    
    logger.info('Schools searched successfully:', { query: q, count: schools.length });
    return successResponse(res, schools, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching schools:', error);
    return errorResponse(res, error.message);
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    logger.info('Fetching dashboard statistics');
    
    const stats = await schoolService.getDashboardStats();
    
    logger.info('Dashboard statistics fetched successfully');
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching dashboard statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get school metrics
const getSchoolMetrics = async (req, res) => {
  try {
    logger.info('Fetching school metrics');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'School ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const metrics = await schoolService.getSchoolMetrics(id);
    
    logger.info('School metrics fetched successfully:', { schoolId: id });
    return successResponse(res, metrics, 'Metrics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching school metrics:', error);
    return errorResponse(res, error.message);
  }
};

const getSubscriptionAnalytics = async (req, res) => {
    try {
      logger.info('Fetching subscription analytics');
      const analytics = await schoolService.getSubscriptionAnalytics();
      logger.info('Subscription analytics fetched successfully');
      return successResponse(res, analytics, 'Subscription analytics retrieved successfully');
    } catch (error) {
      logger.error('Error fetching subscription analytics:', error);
      return errorResponse(res, error.message);
    }
  };
  
  const getSchoolsBySubscriptionStatus = async (req, res) => {
    try {
      const { status } = req.params;
      logger.info(`Fetching schools by subscription status: ${status}`);
      const schools = await schoolService.getSchoolsBySubscriptionStatus(status);
      logger.info('Schools fetched successfully');
      return successResponse(res, schools, 'Schools retrieved successfully');
    } catch (error) {
      logger.error('Error fetching schools by subscription status:', error);
      return errorResponse(res, error.message);
    }
  };
  
  const getExpiringSubscriptions = async (req, res) => {
    try {
      const { days } = req.query;
      logger.info('Fetching expiring subscriptions');
      const schools = await schoolService.getSchoolsWithExpiringSubscriptions(days);
      logger.info('Expiring subscriptions fetched successfully');
      return successResponse(res, schools, 'Expiring subscriptions retrieved successfully');
    } catch (error) {
      logger.error('Error fetching expiring subscriptions:', error);
      return errorResponse(res, error.message);
    }
  };
  
  const getSchoolsByCity = async (req, res) => {
    try {
      const { city } = req.params;
      logger.info(`Fetching schools in city: ${city}`);
      const schools = await schoolService.getSchoolsByCity(city);
      logger.info('Schools fetched successfully');
      return successResponse(res, schools, 'Schools retrieved successfully');
    } catch (error) {
      logger.error('Error fetching schools by city:', error);
      return errorResponse(res, error.message);
    }
  };
  
  const getSchoolsByState = async (req, res) => {
    try {
      const { state } = req.params;
      logger.info(`Fetching schools in state: ${state}`);
      const schools = await schoolService.getSchoolsByState(state);
      logger.info('Schools fetched successfully');
      return successResponse(res, schools, 'Schools retrieved successfully');
    } catch (error) {
      logger.error('Error fetching schools by state:', error);
      return errorResponse(res, error.message);
    }
  };
  
  const getSchoolsByAccreditation = async (req, res) => {
    try {
      const { accreditation } = req.params;
      logger.info(`Fetching schools with accreditation: ${accreditation}`);
      const schools = await schoolService.getSchoolsByAccreditation(accreditation);
      logger.info('Schools fetched successfully');
      return successResponse(res, schools, 'Schools retrieved successfully');
    } catch (error) {
      logger.error('Error fetching schools by accreditation:', error);
      return errorResponse(res, error.message);
    }
  };
  
  const updateExpiredSubscriptions = async (req, res) => {
    try {
      logger.info('Updating expired subscriptions');
      const count = await schoolService.updateExpiredSubscriptions();
      logger.info(`${count} expired subscriptions updated`);
      return successResponse(res, { updatedCount: count }, `${count} expired subscriptions updated successfully.`);
    } catch (error) {
      logger.error('Error updating expired subscriptions:', error);
      return errorResponse(res, error.message);
    }
  };
  
  const getAdmins = async (req, res) => {
      return errorResponse(res, 'Not Implemented', 501);
  };
  
  const createAdmin = async (req, res) => {
      return errorResponse(res, 'Not Implemented', 501);
  };
  
  const updateAdmin = async (req, res) => {
      return errorResponse(res, 'Not Implemented', 501);
  };
  
  const deleteAdmin = async (req, res) => {
      return errorResponse(res, 'Not Implemented', 501);
  };
  
  const toggleAdminStatus = async (req, res) => {
      return errorResponse(res, 'Not Implemented', 501);
  };

// Export all functions
export default {
  createSchool,
  getSchools,
  getSchoolById,
  getSchoolByCode,
  updateSchool,
  deleteSchool,
  getSchoolsByType,
  getSchoolsByCategory,
  searchSchools,
  getDashboardStats,
  getSchoolMetrics,
  getSubscriptionAnalytics,
  getSchoolsBySubscriptionStatus,
  getExpiringSubscriptions,
  getSchoolsByCity,
  getSchoolsByState,
  getSchoolsByAccreditation,
  updateExpiredSubscriptions,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus
};
