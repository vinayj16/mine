import scholarshipService from '../services/scholarshipService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_TYPES = ['merit', 'need-based', 'sports', 'academic', 'minority', 'government', 'private', 'other'];
const VALID_STATUSES = ['active', 'inactive', 'expired', 'suspended'];
const VALID_APPLICATION_STATUSES = ['pending', 'under-review', 'approved', 'rejected', 'disbursed', 'cancelled'];
const VALID_ELIGIBILITY_CRITERIA = ['gpa', 'income', 'category', 'sports', 'attendance', 'marks'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MIN_AMOUNT = 0;
const MAX_AMOUNT = 10000000;

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
const validateDate = (date, fieldName = 'Date') => {
  if (!date) {
    return fieldName + ' is required';
  }
  if (isNaN(Date.parse(date))) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  const errors = [];
  
  const startError = validateDate(startDate, 'Start date');
  if (startError) errors.push(startError);
  
  const endError = validateDate(endDate, 'End date');
  if (endError) errors.push(endError);
  
  if (errors.length === 0 && new Date(startDate) > new Date(endDate)) {
    errors.push('Start date must be before end date');
  }
  
  return errors;
};

// Create Scholarship
const createScholarship = async (req, res) => {
  try {
    logger.info('Creating scholarship');
    
    const { name, description, type, amount, eligibilityCriteria, startDate, endDate, status, maxRecipients } = req.body;
    const tenant = req.user?.tenant;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Scholarship name is required');
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (!type) {
      errors.push('Type is required');
    } else if (!VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (!amount && amount !== 0) {
      errors.push('Amount is required');
    } else if (typeof amount !== 'number' || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      errors.push('Amount must be between ' + MIN_AMOUNT + ' and ' + MAX_AMOUNT);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (startDate && endDate) {
      const dateErrors = validateDateRange(startDate, endDate);
      errors.push(...dateErrors);
    }
    
    if (maxRecipients !== undefined) {
      if (typeof maxRecipients !== 'number' || maxRecipients < 1 || maxRecipients > 10000) {
        errors.push('Max recipients must be between 1 and 10000');
      }
    }
    
    if (eligibilityCriteria && typeof eligibilityCriteria === 'object') {
      for (const key in eligibilityCriteria) {
        if (!VALID_ELIGIBILITY_CRITERIA.includes(key)) {
          errors.push('Invalid eligibility criteria: ' + key);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const scholarshipData = {
      ...req.body,
      metadata: { createdBy: userId || 'system' }
    };
    
    const scholarship = await scholarshipService.createScholarship(scholarshipData, tenant);
    
    logger.info('Scholarship created successfully:', { scholarshipId: scholarship._id, name });
    return createdResponse(res, scholarship, 'Scholarship created successfully');
  } catch (error) {
    logger.error('Error creating scholarship:', error);
    return errorResponse(res, error.message);
  }
};

// Get Scholarships
const getScholarships = async (req, res) => {
  try {
    logger.info('Fetching scholarships');
    
    const { type, status, search, page, limit, sortBy, sortOrder } = req.query;
    const tenant = req.user?.tenant;
    
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
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const queryParams = {
      type,
      status,
      search,
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };
    
    const result = await scholarshipService.getScholarships(tenant, queryParams);
    
    logger.info('Scholarships fetched successfully');
    return successResponse(res, {
      scholarships: result.scholarships || result,
      pagination: result.pagination
    }, 'Scholarships fetched successfully');
  } catch (error) {
    logger.error('Error fetching scholarships:', error);
    return errorResponse(res, error.message);
  }
};

// Get Scholarship by ID
const getScholarshipById = async (req, res) => {
  try {
    logger.info('Fetching scholarship by ID');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Scholarship ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const scholarship = await scholarshipService.getScholarshipById(id, tenant);
    
    if (!scholarship) {
      return notFoundResponse(res, 'Scholarship not found');
    }
    
    logger.info('Scholarship fetched successfully:', { scholarshipId: id });
    return successResponse(res, scholarship, 'Scholarship fetched successfully');
  } catch (error) {
    logger.error('Error fetching scholarship:', error);
    if (error.message.includes('not found')) {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

// Update Scholarship
const updateScholarship = async (req, res) => {
  try {
    logger.info('Updating scholarship');
    
    const { id } = req.params;
    const { name, description, type, amount, status, maxRecipients } = req.body;
    const tenant = req.user?.tenant;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Scholarship ID');
    if (idError) errors.push(idError);
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Scholarship name cannot be empty');
      } else if (name.length > MAX_NAME_LENGTH) {
        errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (type !== undefined && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
        errors.push('Amount must be between ' + MIN_AMOUNT + ' and ' + MAX_AMOUNT);
      }
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (maxRecipients !== undefined) {
      if (typeof maxRecipients !== 'number' || maxRecipients < 1 || maxRecipients > 10000) {
        errors.push('Max recipients must be between 1 and 10000');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updateData = { ...req.body, 'metadata.updatedBy': userId || 'system' };
    const scholarship = await scholarshipService.updateScholarship(id, tenant, updateData);
    
    if (!scholarship) {
      return notFoundResponse(res, 'Scholarship not found');
    }
    
    logger.info('Scholarship updated successfully:', { scholarshipId: id });
    return successResponse(res, scholarship, 'Scholarship updated successfully');
  } catch (error) {
    logger.error('Error updating scholarship:', error);
    return errorResponse(res, error.message);
  }
};

// Delete Scholarship
const deleteScholarship = async (req, res) => {
  try {
    logger.info('Deleting scholarship');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Scholarship ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await scholarshipService.deleteScholarship(id, tenant);
    
    logger.info('Scholarship deleted successfully:', { scholarshipId: id });
    return successResponse(res, null, 'Scholarship deleted successfully');
  } catch (error) {
    logger.error('Error deleting scholarship:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createScholarship,
  getScholarships,
  getScholarshipById,
  updateScholarship,
  deleteScholarship
};
