import driverService from '../services/driverService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid driver statuses
const VALID_STATUSES = ['active', 'inactive', 'on_leave', 'suspended', 'terminated'];

// Phone validation regex (international format)
const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/;

// License number validation regex
const LICENSE_REGEX = /^[A-Z0-9\-]+$/i;

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
 * Validate phone format
 */
const validatePhone = (phone) => {
  return PHONE_REGEX.test(phone) && phone.length >= 10 && phone.length <= 20;
};

/**
 * Validate license number
 */
const validateLicense = (license) => {
  return LICENSE_REGEX.test(license) && license.length >= 5 && license.length <= 30;
};

/**
 * Get all drivers
 */
const getAllDrivers = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { status, name, page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    // Validate institutionId
    const errors = [];
    if (!institutionId) {
      errors.push({ field: 'institutionId', message: 'Institution ID is required' });
    } else {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
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

    // Validate sortOrder
    if (!['asc', 'desc'].includes(sortOrder)) {
      errors.push({ field: 'sortOrder', message: 'Sort order must be asc or desc' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = { status, name };
    
    logger.info('Fetching all drivers for institution: ' + institutionId);
    const result = await driverService.getAllDrivers(institutionId, filters, {
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder
    });
    
    return successResponse(res, result.drivers, 'Drivers fetched successfully', {
      pagination: result.pagination,
      filters
    });
  } catch (error) {
    logger.error('Error fetching all drivers:', error);
    return errorResponse(res, 'Failed to fetch drivers', 500);
  }
};

/**
 * Get driver by ID
 */
const getDriverById = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { id } = req.params;
    
    // Validate IDs
    const errors = [];
    if (!institutionId) {
      errors.push({ field: 'institutionId', message: 'Institution ID is required' });
    } else {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    const driverValidation = validateObjectId(id, 'driverId');
    if (!driverValidation.valid) {
      errors.push(driverValidation.error);
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    logger.info('Fetching driver by ID: ' + id);
    const driver = await driverService.getDriverById(id, institutionId);
    
    if (!driver) {
      return notFoundResponse(res, 'Driver not found');
    }

    return successResponse(res, driver, 'Driver fetched successfully');
  } catch (error) {
    logger.error('Error fetching driver by ID:', error);
    return errorResponse(res, 'Failed to fetch driver', 500);
  }
};

/**
 * Create driver
 */
const createDriver = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { name, phone, email, licenseNumber, licenseExpiry, address, status } = req.body;
    
    // Validate required fields
    const errors = [];
    if (!institutionId) {
      errors.push({ field: 'institutionId', message: 'Institution ID is required' });
    } else {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (!name || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Driver name is required and must be at least 2 characters' });
    } else if (name.length > 100) {
      errors.push({ field: 'name', message: 'Driver name cannot exceed 100 characters' });
    }
    if (!phone) {
      errors.push({ field: 'phone', message: 'Phone number is required' });
    } else if (!validatePhone(phone)) {
      errors.push({ field: 'phone', message: 'Invalid phone format (10-20 digits)' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
    if (!licenseNumber) {
      errors.push({ field: 'licenseNumber', message: 'License number is required' });
    } else if (!validateLicense(licenseNumber)) {
      errors.push({ field: 'licenseNumber', message: 'Invalid license number format (5-30 alphanumeric characters)' });
    }
    if (!licenseExpiry) {
      errors.push({ field: 'licenseExpiry', message: 'License expiry date is required' });
    } else if (isNaN(new Date(licenseExpiry).getTime())) {
      errors.push({ field: 'licenseExpiry', message: 'Invalid license expiry date format' });
    } else if (new Date(licenseExpiry) < new Date()) {
      errors.push({ field: 'licenseExpiry', message: 'License expiry date must be in the future' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    logger.info('Creating driver: ' + name);
    const driver = await driverService.createDriver(institutionId, req.body);
    
    return createdResponse(res, driver, 'Driver created successfully');
  } catch (error) {
    logger.error('Error creating driver:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Update driver
 */
const updateDriver = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    const { name, phone, email, licenseNumber, licenseExpiry, status } = req.body;
    
    // Validate IDs
    const errors = [];
    if (!institutionId) {
      errors.push({ field: 'institutionId', message: 'Institution ID is required' });
    } else {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    const driverValidation = validateObjectId(id, 'driverId');
    if (!driverValidation.valid) {
      errors.push(driverValidation.error);
    }

    // Validate fields if provided
    if (name && name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Driver name must be at least 2 characters' });
    } else if (name && name.length > 100) {
      errors.push({ field: 'name', message: 'Driver name cannot exceed 100 characters' });
    }
    if (phone && !validatePhone(phone)) {
      errors.push({ field: 'phone', message: 'Invalid phone format (10-20 digits)' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
    if (licenseNumber && !validateLicense(licenseNumber)) {
      errors.push({ field: 'licenseNumber', message: 'Invalid license number format (5-30 alphanumeric characters)' });
    }
    if (licenseExpiry && isNaN(new Date(licenseExpiry).getTime())) {
      errors.push({ field: 'licenseExpiry', message: 'Invalid license expiry date format' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    logger.info('Updating driver: ' + id);
    const driver = await driverService.updateDriver(id, institutionId, req.body);
    
    if (!driver) {
      return notFoundResponse(res, 'Driver not found');
    }

    return successResponse(res, driver, 'Driver updated successfully');
  } catch (error) {
    logger.error('Error updating driver:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Delete driver
 */
const deleteDriver = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { id } = req.params;
    
    // Validate IDs
    const errors = [];
    if (!institutionId) {
      errors.push({ field: 'institutionId', message: 'Institution ID is required' });
    } else {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    const driverValidation = validateObjectId(id, 'driverId');
    if (!driverValidation.valid) {
      errors.push(driverValidation.error);
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    logger.info('Deleting driver: ' + id);
    const result = await driverService.deleteDriver(id, institutionId);
    
    if (!result) {
      return notFoundResponse(res, 'Driver not found');
    }

    return successResponse(res, null, 'Driver deleted successfully');
  } catch (error) {
    logger.error('Error deleting driver:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Bulk delete drivers
 */
const bulkDeleteDrivers = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { ids } = req.body;
    
    // Validate institutionId
    const errors = [];
    if (!institutionId) {
      errors.push({ field: 'institutionId', message: 'Institution ID is required' });
    } else {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate ids
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      errors.push({ field: 'ids', message: 'Driver IDs must be a non-empty array' });
    } else if (ids.length > 100) {
      errors.push({ field: 'ids', message: 'Maximum 100 drivers allowed per request' });
    } else {
      ids.forEach((id, index) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ field: 'ids[' + index + ']', message: 'Invalid driver ID' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    logger.info('Bulk deleting ' + ids.length + ' drivers');
    const result = await driverService.bulkDeleteDrivers(ids, institutionId);
    
    return successResponse(res, result, result.modifiedCount + ' driver(s) deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting drivers:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Get active drivers
 */
const getActiveDrivers = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    // Validate institutionId
    if (!institutionId) {
      return validationErrorResponse(res, [{ field: 'institutionId', message: 'Institution ID is required' }]);
    }

    const validation = validateObjectId(institutionId, 'institutionId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }
    
    logger.info('Fetching active drivers for institution: ' + institutionId);
    const drivers = await driverService.getActiveDrivers(institutionId);
    
    return successResponse(res, drivers, 'Active drivers fetched successfully');
  } catch (error) {
    logger.error('Error fetching active drivers:', error);
    return errorResponse(res, 'Failed to fetch active drivers', 500);
  }
};

/**
 * Search drivers
 */
const searchDrivers = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { searchTerm } = req.query;
    
    // Validate institutionId and searchTerm
    const errors = [];
    if (!institutionId) {
      errors.push({ field: 'institutionId', message: 'Institution ID is required' });
    } else {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (!searchTerm || searchTerm.trim().length < 2) {
      errors.push({ field: 'searchTerm', message: 'Search term is required and must be at least 2 characters' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    logger.info('Searching drivers with term: ' + searchTerm);
    const drivers = await driverService.searchDrivers(institutionId, searchTerm);
    
    return successResponse(res, drivers, 'Search completed successfully', {
      searchTerm,
      resultCount: drivers.length
    });
  } catch (error) {
    logger.error('Error searching drivers:', error);
    return errorResponse(res, 'Failed to search drivers', 500);
  }
};

/**
 * Get driver statistics
 */
const getDriverStatistics = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    // Validate institutionId
    if (!institutionId) {
      return validationErrorResponse(res, [{ field: 'institutionId', message: 'Institution ID is required' }]);
    }

    const validation = validateObjectId(institutionId, 'institutionId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }
    
    logger.info('Fetching driver statistics for institution: ' + institutionId);
    const statistics = await driverService.getDriverStatistics(institutionId);
    
    return successResponse(res, statistics, 'Driver statistics fetched successfully');
  } catch (error) {
    logger.error('Error fetching driver statistics:', error);
    return errorResponse(res, 'Failed to fetch driver statistics', 500);
  }
};

/**
 * Get drivers with expiring licenses
 */
const getDriversWithExpiringLicenses = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { days = 30 } = req.query;

    // Validate institutionId
    const errors = [];
    if (!institutionId) {
      errors.push({ field: 'institutionId', message: 'Institution ID is required' });
    } else {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate days
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      errors.push({ field: 'days', message: 'Days must be between 1 and 365' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching drivers with licenses expiring in ' + daysNum + ' days');
    const drivers = await driverService.getDriversWithExpiringLicenses(institutionId, daysNum);

    return successResponse(res, drivers, 'Drivers with expiring licenses fetched successfully', {
      days: daysNum,
      count: drivers.length
    });
  } catch (error) {
    logger.error('Error fetching drivers with expiring licenses:', error);
    return errorResponse(res, 'Failed to fetch drivers with expiring licenses', 500);
  }
};

/**
 * Assign driver to vehicle
 */
const assignDriverToVehicle = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    const { vehicleId } = req.body;

    // Validate IDs
    const errors = [];
    if (!institutionId) {
      errors.push({ field: 'institutionId', message: 'Institution ID is required' });
    } else {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    const driverValidation = validateObjectId(id, 'driverId');
    if (!driverValidation.valid) {
      errors.push(driverValidation.error);
    }
    if (!vehicleId) {
      errors.push({ field: 'vehicleId', message: 'Vehicle ID is required' });
    } else {
      const vehicleValidation = validateObjectId(vehicleId, 'vehicleId');
      if (!vehicleValidation.valid) {
        errors.push(vehicleValidation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Assigning driver ' + id + ' to vehicle ' + vehicleId);
    const driver = await driverService.assignDriverToVehicle(id, vehicleId, institutionId);

    if (!driver) {
      return notFoundResponse(res, 'Driver not found');
    }

    return successResponse(res, driver, 'Driver assigned to vehicle successfully');
  } catch (error) {
    logger.error('Error assigning driver to vehicle:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Export drivers
 */
const exportDrivers = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { format = 'json', status } = req.query;

    // Validate format
    const validFormats = ['json', 'csv', 'xlsx'];
    const errors = [];
    if (!validFormats.includes(format)) {
      errors.push({ field: 'format', message: 'Format must be one of: ' + validFormats.join(', ') });
    }

    // Validate institutionId
    if (!institutionId) {
      errors.push({ field: 'institutionId', message: 'Institution ID is required' });
    } else {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Exporting drivers in format: ' + format);
    const data = await driverService.exportDrivers(institutionId, { status, format });

    if (format === 'json') {
      return successResponse(res, data, 'Drivers exported successfully', {
        format,
        recordCount: data.length
      });
    }

    return errorResponse(res, 'Export format ' + format + ' not yet implemented', 501);
  } catch (error) {
    logger.error('Error exporting drivers:', error);
    return errorResponse(res, 'Failed to export drivers', 500);
  }
};


export default {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  bulkDeleteDrivers,
  getActiveDrivers,
  searchDrivers,
  getDriverStatistics,
  getDriversWithExpiringLicenses,
  assignDriverToVehicle,
  exportDrivers
};
