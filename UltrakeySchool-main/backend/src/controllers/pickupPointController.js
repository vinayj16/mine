import pickupPointService from '../services/pickupPointService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'maintenance', 'closed'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NAME_LENGTH = 200;
const MAX_ADDRESS_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 1000;

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

// Helper function to validate coordinates
const validateCoordinates = (latitude, longitude) => {
  const errors = [];
  
  if (latitude === undefined || latitude === null) {
    errors.push('Latitude is required');
  } else if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    errors.push('Latitude must be between -90 and 90');
  }
  
  if (longitude === undefined || longitude === null) {
    errors.push('Longitude is required');
  } else if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    errors.push('Longitude must be between -180 and 180');
  }
  
  return errors;
};

// Helper function to validate time format (HH:MM)
const validateTime = (time, fieldName = 'Time') => {
  if (!time) return null; // Time is optional
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return fieldName + ' must be in HH:MM format';
  }
  return null;
};

const getAllPickupPoints = async (req, res) => {
  try {
    logger.info('Fetching all pickup points');
    
    const { status, routeId, page, limit, search } = req.query;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
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
    
    if (routeId) {
      const routeIdError = validateObjectId(routeId, 'Route ID');
      if (routeIdError) errors.push(routeIdError);
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = { status, routeId, search };
    const result = await pickupPointService.getAllPickupPoints(institutionId, filters, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Pickup points fetched successfully');
    return successResponse(res, result, 'Pickup points retrieved successfully');
  } catch (error) {
    logger.error('Error fetching pickup points:', error);
    return errorResponse(res, error.message);
  }
};

const getPickupPointById = async (req, res) => {
  try {
    logger.info('Fetching pickup point by ID');
    
    const { id } = req.params;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Pickup Point ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const pickupPoint = await pickupPointService.getPickupPointById(id, institutionId);
    
    if (!pickupPoint) {
      return notFoundResponse(res, 'Pickup point not found');
    }
    
    logger.info('Pickup point fetched successfully:', { pickupPointId: id });
    return successResponse(res, pickupPoint, 'Pickup point retrieved successfully');
  } catch (error) {
    logger.error('Error fetching pickup point:', error);
    if (error.message.includes('not found')) {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

const createPickupPoint = async (req, res) => {
  try {
    logger.info('Creating pickup point');
    
    const { name, address, latitude, longitude, routeId, status, pickupTime, dropTime, capacity, description } = req.body;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!name || name.trim().length === 0) {
      errors.push('Pickup point name is required');
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (!address || address.trim().length === 0) {
      errors.push('Address is required');
    } else if (address.length > MAX_ADDRESS_LENGTH) {
      errors.push('Address must not exceed ' + MAX_ADDRESS_LENGTH + ' characters');
    }
    
    // Validate coordinates - make optional
    const coordErrors = validateCoordinates(latitude, longitude);
    if (coordErrors.length > 0) {
      // Only add coordinate errors if coordinates ARE provided but invalid
      if (latitude !== undefined && longitude !== undefined) {
        errors.push(...coordErrors);
      } else {
        // Provide defaults if not provided
        req.body.latitude = 0;
        req.body.longitude = 0;
      }
    }
    
    if (routeId) {
      const routeIdError = validateObjectId(routeId, 'Route ID');
      if (routeIdError) errors.push(routeIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (pickupTime) {
      const pickupTimeError = validateTime(pickupTime, 'Pickup time');
      if (pickupTimeError) errors.push(pickupTimeError);
    }
    
    if (dropTime) {
      const dropTimeError = validateTime(dropTime, 'Drop time');
      if (dropTimeError) errors.push(dropTimeError);
    }
    
    if (capacity !== undefined) {
      if (typeof capacity !== 'number' || capacity < 1 || capacity > 1000) {
        errors.push('Capacity must be between 1 and 1000');
      }
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const pickupPoint = await pickupPointService.createPickupPoint(institutionId, req.body);
    
    logger.info('Pickup point created successfully:', { pickupPointId: pickupPoint._id });
    return createdResponse(res, pickupPoint, 'Pickup point created successfully');
  } catch (error) {
    logger.error('Error creating pickup point:', error);
    return errorResponse(res, error.message);
  }
};

const updatePickupPoint = async (req, res) => {
  try {
    logger.info('Updating pickup point');
    
    const { id } = req.params;
    const { name, address, latitude, longitude, routeId, status, pickupTime, dropTime, capacity, description } = req.body;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Pickup Point ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Pickup point name cannot be empty');
      } else if (name.length > MAX_NAME_LENGTH) {
        errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (address !== undefined) {
      if (!address || address.trim().length === 0) {
        errors.push('Address cannot be empty');
      } else if (address.length > MAX_ADDRESS_LENGTH) {
        errors.push('Address must not exceed ' + MAX_ADDRESS_LENGTH + ' characters');
      }
    }
    
    if (latitude !== undefined || longitude !== undefined) {
      const coordErrors = validateCoordinates(
        latitude !== undefined ? latitude : req.body.latitude,
        longitude !== undefined ? longitude : req.body.longitude
      );
      errors.push(...coordErrors);
    }
    
    if (routeId !== undefined) {
      const routeIdError = validateObjectId(routeId, 'Route ID');
      if (routeIdError) errors.push(routeIdError);
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (pickupTime !== undefined) {
      const pickupTimeError = validateTime(pickupTime, 'Pickup time');
      if (pickupTimeError) errors.push(pickupTimeError);
    }
    
    if (dropTime !== undefined) {
      const dropTimeError = validateTime(dropTime, 'Drop time');
      if (dropTimeError) errors.push(dropTimeError);
    }
    
    if (capacity !== undefined) {
      if (typeof capacity !== 'number' || capacity < 1 || capacity > 1000) {
        errors.push('Capacity must be between 1 and 1000');
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const pickupPoint = await pickupPointService.updatePickupPoint(id, institutionId, req.body);
    
    if (!pickupPoint) {
      return notFoundResponse(res, 'Pickup point not found');
    }
    
    logger.info('Pickup point updated successfully:', { pickupPointId: id });
    return successResponse(res, pickupPoint, 'Pickup point updated successfully');
  } catch (error) {
    logger.error('Error updating pickup point:', error);
    return errorResponse(res, error.message);
  }
};

const deletePickupPoint = async (req, res) => {
  try {
    logger.info('Deleting pickup point');
    
    const { id } = req.params;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Pickup Point ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await pickupPointService.deletePickupPoint(id, institutionId);
    
    logger.info('Pickup point deleted successfully:', { pickupPointId: id });
    return successResponse(res, null, 'Pickup point deleted successfully');
  } catch (error) {
    logger.error('Error deleting pickup point:', error);
    return errorResponse(res, error.message);
  }
};

const bulkDeletePickupPoints = async (req, res) => {
  try {
    logger.info('Bulk deleting pickup points');
    
    const { ids } = req.body;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!ids || !Array.isArray(ids)) {
      errors.push('Pickup point IDs must be an array');
    } else if (ids.length === 0) {
      errors.push('Pickup point IDs array cannot be empty');
    } else if (ids.length > 100) {
      errors.push('Cannot delete more than 100 pickup points at once');
    } else {
      for (const id of ids) {
        const idError = validateObjectId(id, 'Pickup Point ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await pickupPointService.bulkDeletePickupPoints(ids, institutionId);
    
    logger.info('Pickup points bulk deleted successfully:', { count: result.modifiedCount });
    return successResponse(res, { deletedCount: result.modifiedCount }, result.modifiedCount + ' pickup point(s) deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting pickup points:', error);
    return errorResponse(res, error.message);
  }
};

const getPickupPointsByRoute = async (req, res) => {
  try {
    logger.info('Fetching pickup points by route');
    
    const { routeId } = req.params;
    const { page, limit } = req.query;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    const routeIdError = validateObjectId(routeId, 'Route ID');
    if (routeIdError) errors.push(routeIdError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
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
    
    const result = await pickupPointService.getPickupPointsByRoute(routeId, institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Pickup points fetched by route successfully:', { routeId });
    return successResponse(res, result, 'Pickup points retrieved successfully');
  } catch (error) {
    logger.error('Error fetching pickup points by route:', error);
    return errorResponse(res, error.message);
  }
};

const getPickupPointStatistics = async (req, res) => {
  try {
    logger.info('Fetching pickup point statistics');
    
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await pickupPointService.getPickupPointStatistics(institutionId);
    
    logger.info('Pickup point statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching pickup point statistics:', error);
    return errorResponse(res, error.message);
  }
};

const exportPickupPoints = async (req, res) => {
  try {
    logger.info('Exporting pickup points data');
    
    const { format, status, routeId } = req.query;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (routeId) {
      const routeIdError = validateObjectId(routeId, 'Route ID');
      if (routeIdError) errors.push(routeIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await pickupPointService.exportPickupPoints(institutionId, {
      format: format.toLowerCase(),
      status,
      routeId
    });
    
    logger.info('Pickup points data exported successfully:', { format });
    return successResponse(res, exportData, 'Data exported successfully');
  } catch (error) {
    logger.error('Error exporting pickup points data:', error);
    return errorResponse(res, error.message);
  }
};

const getNearbyPickupPoints = async (req, res) => {
  try {
    logger.info('Fetching nearby pickup points');
    
    const { latitude, longitude, radius } = req.query;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    const coordErrors = validateCoordinates(lat, lng);
    errors.push(...coordErrors);
    
    const radiusNum = parseFloat(radius) || 5;
    if (radiusNum < 0.1 || radiusNum > 100) {
      errors.push('Radius must be between 0.1 and 100 kilometers');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const pickupPoints = await pickupPointService.getNearbyPickupPoints(institutionId, lat, lng, radiusNum);
    
    logger.info('Nearby pickup points fetched successfully:', { latitude: lat, longitude: lng, radius: radiusNum });
    return successResponse(res, pickupPoints, 'Nearby pickup points retrieved successfully');
  } catch (error) {
    logger.error('Error fetching nearby pickup points:', error);
    return errorResponse(res, error.message);
  }
};

const updatePickupPointStatus = async (req, res) => {
  try {
    logger.info('Updating pickup point status');
    
    const { id } = req.params;
    const { status } = req.body;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Pickup Point ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const pickupPoint = await pickupPointService.updatePickupPointStatus(id, institutionId, status);
    
    if (!pickupPoint) {
      return notFoundResponse(res, 'Pickup point not found');
    }
    
    logger.info('Pickup point status updated successfully:', { pickupPointId: id, status });
    return successResponse(res, pickupPoint, 'Pickup point status updated successfully');
  } catch (error) {
    logger.error('Error updating pickup point status:', error);
    return errorResponse(res, error.message);
  }
};

const getPickupPointsByStatus = async (req, res) => {
  try {
    logger.info('Fetching pickup points by status');
    
    const { status } = req.params;
    const { page, limit } = req.query;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
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
    
    const result = await pickupPointService.getPickupPointsByStatus(status, institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Pickup points fetched by status successfully:', { status });
    return successResponse(res, result, 'Pickup points retrieved successfully');
  } catch (error) {
    logger.error('Error fetching pickup points by status:', error);
    return errorResponse(res, error.message);
  }
};

const assignStudentsToPickupPoint = async (req, res) => {
  try {
    logger.info('Assigning students to pickup point');
    
    const { id } = req.params;
    const { studentIds } = req.body;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Pickup Point ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!studentIds || !Array.isArray(studentIds)) {
      errors.push('Student IDs must be an array');
    } else if (studentIds.length === 0) {
      errors.push('At least one student ID is required');
    } else if (studentIds.length > 100) {
      errors.push('Cannot assign more than 100 students at once');
    } else {
      for (const studentId of studentIds) {
        const studentIdError = validateObjectId(studentId, 'Student ID');
        if (studentIdError) {
          errors.push(studentIdError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await pickupPointService.assignStudentsToPickupPoint(id, institutionId, studentIds);
    
    if (!result) {
      return notFoundResponse(res, 'Pickup point not found');
    }
    
    logger.info('Students assigned to pickup point successfully:', { pickupPointId: id, count: studentIds.length });
    return successResponse(res, result, 'Students assigned successfully');
  } catch (error) {
    logger.error('Error assigning students to pickup point:', error);
    return errorResponse(res, error.message);
  }
};

const getPickupPointCapacity = async (req, res) => {
  try {
    logger.info('Fetching pickup point capacity information');
    
    const { id } = req.params;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Pickup Point ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const capacityInfo = await pickupPointService.getPickupPointCapacity(id, institutionId);
    
    if (!capacityInfo) {
      return notFoundResponse(res, 'Pickup point not found');
    }
    
    logger.info('Pickup point capacity information fetched successfully:', { pickupPointId: id });
    return successResponse(res, capacityInfo, 'Capacity information retrieved successfully');
  } catch (error) {
    logger.error('Error fetching pickup point capacity:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getAllPickupPoints,
  getPickupPointById,
  createPickupPoint,
  updatePickupPoint,
  deletePickupPoint,
  bulkDeletePickupPoints,
  getPickupPointsByRoute,
  getPickupPointStatistics,
  exportPickupPoints,
  getNearbyPickupPoints,
  updatePickupPointStatus,
  getPickupPointsByStatus,
  assignStudentsToPickupPoint,
  getPickupPointCapacity
};
