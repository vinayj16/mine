import transportRouteService from '../services/transportRouteService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'suspended', 'maintenance'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_NAME_LENGTH = 200;
const MAX_ROUTE_NUMBER_LENGTH = 50;

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
const validateCoordinates = (lat, lng) => {
  const errors = [];
  if (lat !== undefined && lat !== null) {
    const latitude = parseFloat(lat);
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      errors.push('Latitude must be between -90 and 90');
    }
  }
  if (lng !== undefined && lng !== null) {
    const longitude = parseFloat(lng);
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      errors.push('Longitude must be between -180 and 180');
    }
  }
  return errors;
};

const getAllRoutes = async (req, res) => {
  try {
    logger.info('Fetching all transport routes');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { status, name, page, limit, sortBy, sortOrder } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (name && name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: ' + VALID_SORT_ORDERS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = {
      status,
      name,
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };
    
    const result = await transportRouteService.getAllRoutes(institutionId, filters);
    
    logger.info('Transport routes fetched successfully:', { institutionId, count: result.data?.length || 0 });
    return successResponse(res, result, 'Transport routes retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport routes:', error);
    return errorResponse(res, error.message);
  }
};

const getRouteById = async (req, res) => {
  try {
    logger.info('Fetching transport route by ID');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Route ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const route = await transportRouteService.getRouteById(id, institutionId);
    
    if (!route) {
      return notFoundResponse(res, 'Transport route not found');
    }
    
    logger.info('Transport route fetched successfully:', { id });
    return successResponse(res, route, 'Transport route retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport route:', error);
    return errorResponse(res, error.message);
  }
};

const createRoute = async (req, res) => {
  try {
    logger.info('Creating transport route');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { name, routeNumber, startPoint, endPoint, stops, distance, estimatedDuration, status, description } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!name || name.trim().length === 0) {
      errors.push('Route name is required');
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push('Route name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (routeNumber && routeNumber.length > MAX_ROUTE_NUMBER_LENGTH) {
      errors.push('Route number must not exceed ' + MAX_ROUTE_NUMBER_LENGTH + ' characters');
    }
    
    if (!startPoint || startPoint.trim().length === 0) {
      errors.push('Start point is required');
    }
    
    if (!endPoint || endPoint.trim().length === 0) {
      errors.push('End point is required');
    }
    
    if (stops && Array.isArray(stops)) {
      stops.forEach((stop, index) => {
        if (stop.coordinates) {
          const coordErrors = validateCoordinates(stop.coordinates.latitude, stop.coordinates.longitude);
          if (coordErrors.length > 0) {
            errors.push('Stop ' + index + ': ' + coordErrors.join(', '));
          }
        }
      });
    }
    
    if (distance !== undefined) {
      const dist = parseFloat(distance);
      if (isNaN(dist) || dist < 0) {
        errors.push('Distance must be a positive number');
      }
    }
    
    if (estimatedDuration !== undefined) {
      const duration = parseInt(estimatedDuration);
      if (isNaN(duration) || duration < 0) {
        errors.push('Estimated duration must be a positive number');
      }
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const route = await transportRouteService.createRoute(institutionId, req.body);
    
    logger.info('Transport route created successfully:', { routeId: route._id });
    return createdResponse(res, route, 'Route created successfully');
  } catch (error) {
    logger.error('Error creating transport route:', error);
    return errorResponse(res, error.message);
  }
};

const updateRoute = async (req, res) => {
  try {
    logger.info('Updating transport route');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    const { name, routeNumber, stops, distance, estimatedDuration, status, description } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Route ID');
    if (idError) errors.push(idError);
    
    if (name && name.length > MAX_NAME_LENGTH) {
      errors.push('Route name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (routeNumber && routeNumber.length > MAX_ROUTE_NUMBER_LENGTH) {
      errors.push('Route number must not exceed ' + MAX_ROUTE_NUMBER_LENGTH + ' characters');
    }
    
    if (stops && Array.isArray(stops)) {
      stops.forEach((stop, index) => {
        if (stop.coordinates) {
          const coordErrors = validateCoordinates(stop.coordinates.latitude, stop.coordinates.longitude);
          if (coordErrors.length > 0) {
            errors.push('Stop ' + index + ': ' + coordErrors.join(', '));
          }
        }
      });
    }
    
    if (distance !== undefined) {
      const dist = parseFloat(distance);
      if (isNaN(dist) || dist < 0) {
        errors.push('Distance must be a positive number');
      }
    }
    
    if (estimatedDuration !== undefined) {
      const duration = parseInt(estimatedDuration);
      if (isNaN(duration) || duration < 0) {
        errors.push('Estimated duration must be a positive number');
      }
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const route = await transportRouteService.updateRoute(id, institutionId, req.body);
    
    if (!route) {
      return notFoundResponse(res, 'Transport route not found');
    }
    
    logger.info('Transport route updated successfully:', { id });
    return successResponse(res, route, 'Route updated successfully');
  } catch (error) {
    logger.error('Error updating transport route:', error);
    return errorResponse(res, error.message);
  }
};

const deleteRoute = async (req, res) => {
  try {
    logger.info('Deleting transport route');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Route ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportRouteService.deleteRoute(id, institutionId);
    
    if (!result) {
      return notFoundResponse(res, 'Transport route not found');
    }
    
    logger.info('Transport route deleted successfully:', { id });
    return successResponse(res, null, 'Route deleted successfully');
  } catch (error) {
    logger.error('Error deleting transport route:', error);
    return errorResponse(res, error.message);
  }
};

const bulkDeleteRoutes = async (req, res) => {
  try {
    logger.info('Bulk deleting transport routes');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { ids } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      errors.push('Route IDs array is required and must not be empty');
    } else {
      for (let i = 0; i < ids.length; i++) {
        const idError = validateObjectId(ids[i], 'Route ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportRouteService.bulkDeleteRoutes(ids, institutionId);
    
    logger.info('Transport routes bulk deleted successfully:', { count: result.modifiedCount || result.deletedCount || 0 });
    return successResponse(res, result, result.modifiedCount + ' route(s) deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting transport routes:', error);
    return errorResponse(res, error.message);
  }
};

const getActiveRoutes = async (req, res) => {
  try {
    logger.info('Fetching active transport routes');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
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
    
    const result = await transportRouteService.getActiveRoutes(institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Active transport routes fetched successfully');
    return successResponse(res, result, 'Active routes retrieved successfully');
  } catch (error) {
    logger.error('Error fetching active transport routes:', error);
    return errorResponse(res, error.message);
  }
};


const getRoutesByStatus = async (req, res) => {
  try {
    logger.info('Fetching transport routes by status');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { status } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
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
    
    const result = await transportRouteService.getRoutesByStatus(status, institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Transport routes by status fetched successfully:', { status });
    return successResponse(res, result, 'Routes retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport routes by status:', error);
    return errorResponse(res, error.message);
  }
};

const updateRouteStatus = async (req, res) => {
  try {
    logger.info('Updating transport route status');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    const { status } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Route ID');
    if (idError) errors.push(idError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const route = await transportRouteService.updateRouteStatus(id, institutionId, status);
    
    if (!route) {
      return notFoundResponse(res, 'Transport route not found');
    }
    
    logger.info('Transport route status updated successfully:', { id, status });
    return successResponse(res, route, 'Route status updated successfully');
  } catch (error) {
    logger.error('Error updating transport route status:', error);
    return errorResponse(res, error.message);
  }
};

const searchRoutes = async (req, res) => {
  try {
    logger.info('Searching transport routes');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { q, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
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
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportRouteService.searchRoutes(institutionId, q, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Transport routes searched successfully:', { query: q });
    return successResponse(res, result, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching transport routes:', error);
    return errorResponse(res, error.message);
  }
};

const getRouteStatistics = async (req, res) => {
  try {
    logger.info('Fetching transport route statistics');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await transportRouteService.getRouteStatistics(institutionId);
    
    logger.info('Transport route statistics fetched successfully');
    return successResponse(res, stats, 'Route statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport route statistics:', error);
    return errorResponse(res, error.message);
  }
};

const getRouteAnalytics = async (req, res) => {
  try {
    logger.info('Fetching transport route analytics');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { groupBy } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const validGroupBy = ['status', 'distance', 'duration', 'stops'];
    const groupByValue = groupBy || 'status';
    
    if (!validGroupBy.includes(groupByValue)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await transportRouteService.getRouteAnalytics(institutionId, groupByValue);
    
    logger.info('Transport route analytics fetched successfully');
    return successResponse(res, analytics, 'Route analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport route analytics:', error);
    return errorResponse(res, error.message);
  }
};

const exportRoutes = async (req, res) => {
  try {
    logger.info('Exporting transport routes');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { format, status } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await transportRouteService.exportRoutes(institutionId, {
      format: format.toLowerCase(),
      status
    });
    
    logger.info('Transport routes exported successfully:', { format });
    return successResponse(res, exportData, 'Routes exported successfully');
  } catch (error) {
    logger.error('Error exporting transport routes:', error);
    return errorResponse(res, error.message);
  }
};

const bulkUpdateRoutes = async (req, res) => {
  try {
    logger.info('Bulk updating transport routes');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { ids, updates } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      errors.push('Route IDs array is required and must not be empty');
    } else {
      for (let i = 0; i < ids.length; i++) {
        const idError = validateObjectId(ids[i], 'Route ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates object is required');
    } else {
      if (updates.status && !VALID_STATUSES.includes(updates.status)) {
        errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
      }
      
      if (updates.distance !== undefined) {
        const dist = parseFloat(updates.distance);
        if (isNaN(dist) || dist < 0) {
          errors.push('Distance must be a positive number');
        }
      }
      
      if (updates.estimatedDuration !== undefined) {
        const duration = parseInt(updates.estimatedDuration);
        if (isNaN(duration) || duration < 0) {
          errors.push('Estimated duration must be a positive number');
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportRouteService.bulkUpdateRoutes(ids, institutionId, updates);
    
    logger.info('Transport routes bulk updated successfully:', { count: result.modifiedCount || 0 });
    return successResponse(res, result, result.modifiedCount + ' route(s) updated successfully');
  } catch (error) {
    logger.error('Error bulk updating transport routes:', error);
    return errorResponse(res, error.message);
  }
};

const addStopToRoute = async (req, res) => {
  try {
    logger.info('Adding stop to transport route');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    const { name, coordinates, arrivalTime, departureTime, sequence } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Route ID');
    if (idError) errors.push(idError);
    
    if (!name || name.trim().length === 0) {
      errors.push('Stop name is required');
    }
    
    if (coordinates) {
      const coordErrors = validateCoordinates(coordinates.latitude, coordinates.longitude);
      if (coordErrors.length > 0) {
        errors.push.apply(errors, coordErrors);
      }
    }
    
    if (sequence !== undefined) {
      const seq = parseInt(sequence);
      if (isNaN(seq) || seq < 0) {
        errors.push('Sequence must be a positive number');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const route = await transportRouteService.addStopToRoute(id, institutionId, req.body);
    
    if (!route) {
      return notFoundResponse(res, 'Transport route not found');
    }
    
    logger.info('Stop added to transport route successfully:', { id, stopName: name });
    return successResponse(res, route, 'Stop added to route successfully');
  } catch (error) {
    logger.error('Error adding stop to transport route:', error);
    return errorResponse(res, error.message);
  }
};

const removeStopFromRoute = async (req, res) => {
  try {
    logger.info('Removing stop from transport route');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id, stopId } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Route ID');
    if (idError) errors.push(idError);
    
    const stopIdError = validateObjectId(stopId, 'Stop ID');
    if (stopIdError) errors.push(stopIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const route = await transportRouteService.removeStopFromRoute(id, stopId, institutionId);
    
    if (!route) {
      return notFoundResponse(res, 'Transport route or stop not found');
    }
    
    logger.info('Stop removed from transport route successfully:', { id, stopId });
    return successResponse(res, route, 'Stop removed from route successfully');
  } catch (error) {
    logger.error('Error removing stop from transport route:', error);
    return errorResponse(res, error.message);
  }
};

const updateRouteStop = async (req, res) => {
  try {
    logger.info('Updating transport route stop');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id, stopId } = req.params;
    const { name, coordinates, arrivalTime, departureTime, sequence } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Route ID');
    if (idError) errors.push(idError);
    
    const stopIdError = validateObjectId(stopId, 'Stop ID');
    if (stopIdError) errors.push(stopIdError);
    
    if (name && name.trim().length === 0) {
      errors.push('Stop name cannot be empty');
    }
    
    if (coordinates) {
      const coordErrors = validateCoordinates(coordinates.latitude, coordinates.longitude);
      if (coordErrors.length > 0) {
        errors.push.apply(errors, coordErrors);
      }
    }
    
    if (sequence !== undefined) {
      const seq = parseInt(sequence);
      if (isNaN(seq) || seq < 0) {
        errors.push('Sequence must be a positive number');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const route = await transportRouteService.updateRouteStop(id, stopId, institutionId, req.body);
    
    if (!route) {
      return notFoundResponse(res, 'Transport route or stop not found');
    }
    
    logger.info('Transport route stop updated successfully:', { id, stopId });
    return successResponse(res, route, 'Route stop updated successfully');
  } catch (error) {
    logger.error('Error updating transport route stop:', error);
    return errorResponse(res, error.message);
  }
};

const getRouteStops = async (req, res) => {
  try {
    logger.info('Fetching transport route stops');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Route ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stops = await transportRouteService.getRouteStops(id, institutionId);
    
    if (!stops) {
      return notFoundResponse(res, 'Transport route not found');
    }
    
    logger.info('Transport route stops fetched successfully:', { id });
    return successResponse(res, stops, 'Route stops retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport route stops:', error);
    return errorResponse(res, error.message);
  }
};

const optimizeRoute = async (req, res) => {
  try {
    logger.info('Optimizing transport route');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    const { optimizationCriteria } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Route ID');
    if (idError) errors.push(idError);
    
    const validCriteria = ['distance', 'time', 'stops'];
    const criteria = optimizationCriteria || 'distance';
    
    if (!validCriteria.includes(criteria)) {
      errors.push('Invalid optimization criteria. Must be one of: ' + validCriteria.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const route = await transportRouteService.optimizeRoute(id, institutionId, criteria);
    
    if (!route) {
      return notFoundResponse(res, 'Transport route not found');
    }
    
    logger.info('Transport route optimized successfully:', { id, criteria });
    return successResponse(res, route, 'Route optimized successfully');
  } catch (error) {
    logger.error('Error optimizing transport route:', error);
    return errorResponse(res, error.message);
  }
};

const duplicateRoute = async (req, res) => {
  try {
    logger.info('Duplicating transport route');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    const { newName } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Route ID');
    if (idError) errors.push(idError);
    
    if (newName && newName.length > MAX_NAME_LENGTH) {
      errors.push('New route name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const route = await transportRouteService.duplicateRoute(id, institutionId, newName);
    
    if (!route) {
      return notFoundResponse(res, 'Transport route not found');
    }
    
    logger.info('Transport route duplicated successfully:', { originalId: id, newId: route._id });
    return createdResponse(res, route, 'Route duplicated successfully');
  } catch (error) {
    logger.error('Error duplicating transport route:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  bulkDeleteRoutes,
  getActiveRoutes,
  getRoutesByStatus,
  updateRouteStatus,
  searchRoutes,
  getRouteStatistics,
  getRouteAnalytics,
  exportRoutes,
  bulkUpdateRoutes,
  addStopToRoute,
  removeStopFromRoute,
  updateRouteStop,
  getRouteStops,
  optimizeRoute,
  duplicateRoute
};
