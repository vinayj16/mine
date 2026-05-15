import transportService from '../services/transportService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import { getCache, setCache, deleteCachePattern } from '../config/redis.js';

// Validation constants
const VALID_VEHICLE_TYPES = ['bus', 'van', 'car', 'minibus', 'other'];
const VALID_VEHICLE_STATUSES = ['active', 'inactive', 'maintenance', 'retired'];
const VALID_ROUTE_STATUSES = ['active', 'inactive', 'suspended'];
const VALID_TRIP_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];
const VALID_MAINTENANCE_TYPES = ['routine', 'repair', 'inspection', 'emergency'];
const VALID_MAINTENANCE_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];
const VALID_FUEL_TYPES = ['petrol', 'diesel', 'cng', 'electric', 'hybrid'];
const VALID_PERIODS = ['day', 'week', 'month', 'quarter', 'year'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_NAME_LENGTH = 200;
const MAX_REGISTRATION_LENGTH = 50;
const MIN_CAPACITY = 1;
const MAX_CAPACITY = 100;
const MIN_FUEL_AMOUNT = 0;
const MAX_FUEL_AMOUNT = 10000;
const MIN_COST = 0;
const MAX_COST = 1000000;

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

// Helper function to validate date
const validateDate = (dateString, fieldName = 'Date') => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start >= end) {
    return 'Start date must be before end date';
  }
  return null;
};

// Vehicle Management
const createVehicle = async (req, res) => {
  try {
    logger.info('Creating vehicle');
    
    const { registrationNumber, vehicleType, capacity, model, manufacturer, status, description } = req.body;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (!registrationNumber || registrationNumber.trim().length === 0) {
      errors.push('Registration number is required');
    } else if (registrationNumber.length > MAX_REGISTRATION_LENGTH) {
      errors.push('Registration number must not exceed ' + MAX_REGISTRATION_LENGTH + ' characters');
    }
    
    if (!vehicleType) {
      errors.push('Vehicle type is required');
    } else if (!VALID_VEHICLE_TYPES.includes(vehicleType)) {
      errors.push('Invalid vehicle type. Must be one of: ' + VALID_VEHICLE_TYPES.join(', '));
    }
    
    if (capacity !== undefined) {
      const cap = parseInt(capacity);
      if (isNaN(cap) || cap < MIN_CAPACITY || cap > MAX_CAPACITY) {
        errors.push('Capacity must be between ' + MIN_CAPACITY + ' and ' + MAX_CAPACITY);
      }
    }
    
    if (model && model.length > MAX_NAME_LENGTH) {
      errors.push('Model must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (manufacturer && manufacturer.length > MAX_NAME_LENGTH) {
      errors.push('Manufacturer must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (status && !VALID_VEHICLE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_VEHICLE_STATUSES.join(', '));
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const vehicle = await transportService.createVehicle(req.body, tenant);
    
    logger.info('Vehicle created successfully:', { vehicleId: vehicle._id });
    return createdResponse(res, vehicle, 'Vehicle created successfully');
  } catch (error) {
    logger.error('Error creating vehicle:', error);
    return errorResponse(res, error.message);
  }
};

const getVehicles = async (req, res) => {
  try {
    logger.info('Fetching vehicles');
    
    const institutionId = req.user?.institutionId;
    const { vehicleType, status, page, limit, sortBy, sortOrder } = req.query;
    
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
    
    if (vehicleType && !VALID_VEHICLE_TYPES.includes(vehicleType)) {
      errors.push('Invalid vehicle type. Must be one of: ' + VALID_VEHICLE_TYPES.join(', '));
    }
    
    if (status && !VALID_VEHICLE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_VEHICLE_STATUSES.join(', '));
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    // Try to get from cache first
    const cacheKey = `vehicles:${institutionId}:${vehicleType || 'all'}:${status || 'all'}:${pageNum}:${limitNum}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.info('Vehicles retrieved from cache');
      return successResponse(res, cachedData, 'Vehicles retrieved successfully (cached)');
    }

    const vehicles = await transportService.getVehicles(institutionId, {
      vehicleType,
      status,
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder
    });

    // Cache the response for 5 minutes
    await setCache(cacheKey, vehicles, 300);

    logger.info('Vehicles fetched successfully');
    return successResponse(res, vehicles, 'Vehicles retrieved successfully');
  } catch (error) {
    logger.error('Error fetching vehicles:', error);
    return errorResponse(res, error.message);
  }
};

const getVehicleById = async (req, res) => {
  try {
    logger.info('Fetching vehicle by ID');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const idError = validateObjectId(id, 'Vehicle ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const vehicle = await transportService.getVehicleById(id, tenant);
    
    if (!vehicle) {
      return notFoundResponse(res, 'Vehicle not found');
    }
    
    logger.info('Vehicle fetched successfully:', { id });
    return successResponse(res, vehicle, 'Vehicle fetched successfully');
  } catch (error) {
    logger.error('Error fetching vehicle:', error);
    return errorResponse(res, error.message);
  }
};

const updateVehicle = async (req, res) => {
  try {
    logger.info('Updating vehicle');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    const { registrationNumber, vehicleType, capacity, model, manufacturer, status, description } = req.body;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const idError = validateObjectId(id, 'Vehicle ID');
    if (idError) errors.push(idError);
    
    if (registrationNumber && registrationNumber.length > MAX_REGISTRATION_LENGTH) {
      errors.push('Registration number must not exceed ' + MAX_REGISTRATION_LENGTH + ' characters');
    }
    
    if (vehicleType && !VALID_VEHICLE_TYPES.includes(vehicleType)) {
      errors.push('Invalid vehicle type. Must be one of: ' + VALID_VEHICLE_TYPES.join(', '));
    }
    
    if (capacity !== undefined) {
      const cap = parseInt(capacity);
      if (isNaN(cap) || cap < MIN_CAPACITY || cap > MAX_CAPACITY) {
        errors.push('Capacity must be between ' + MIN_CAPACITY + ' and ' + MAX_CAPACITY);
      }
    }
    
    if (model && model.length > MAX_NAME_LENGTH) {
      errors.push('Model must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (manufacturer && manufacturer.length > MAX_NAME_LENGTH) {
      errors.push('Manufacturer must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (status && !VALID_VEHICLE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_VEHICLE_STATUSES.join(', '));
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const vehicle = await transportService.updateVehicle(id, tenant, req.body);
    
    if (!vehicle) {
      return notFoundResponse(res, 'Vehicle not found');
    }
    
    logger.info('Vehicle updated successfully:', { id });
    return successResponse(res, vehicle, 'Vehicle updated successfully');
  } catch (error) {
    logger.error('Error updating vehicle:', error);
    return errorResponse(res, error.message);
  }
};

const deleteVehicle = async (req, res) => {
  try {
    logger.info('Deleting vehicle');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const idError = validateObjectId(id, 'Vehicle ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportService.deleteVehicle(id, tenant);
    
    if (!result) {
      return notFoundResponse(res, 'Vehicle not found');
    }
    
    logger.info('Vehicle deleted successfully:', { id });
    return successResponse(res, null, 'Vehicle deleted successfully');
  } catch (error) {
    logger.error('Error deleting vehicle:', error);
    return errorResponse(res, error.message);
  }
};


// Route Management
const createRoute = async (req, res) => {
  try {
    logger.info('Creating route');
    
    const { name, routeNumber, startPoint, endPoint, stops, distance, estimatedDuration, status, description } = req.body;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (!name || name.trim().length === 0) {
      errors.push('Route name is required');
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push('Route name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (routeNumber && routeNumber.length > 50) {
      errors.push('Route number must not exceed 50 characters');
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
    
    if (status && !VALID_ROUTE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ROUTE_STATUSES.join(', '));
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const route = await transportService.createRoute(req.body, tenant);
    
    logger.info('Route created successfully:', { routeId: route._id });
    return createdResponse(res, route, 'Route created successfully');
  } catch (error) {
    logger.error('Error creating route:', error);
    return errorResponse(res, error.message);
  }
};

const getRoutes = async (req, res) => {
  try {
    logger.info('Fetching routes');
    
    const institutionId = req.user?.institutionId;
    const { status, page, limit, sortBy, sortOrder } = req.query;
    
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
    
    if (status && !VALID_ROUTE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ROUTE_STATUSES.join(', '));
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: ' + VALID_SORT_ORDERS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = {
      status,
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };
    
    const result = await transportService.getRoutes(institutionId, filters);
    
    logger.info('Routes fetched successfully:', { count: result.routes?.length || 0 });
    return successResponse(res, result.routes, 'Routes fetched successfully', result.pagination);
  } catch (error) {
    logger.error('Error fetching routes:', error);
    return errorResponse(res, error.message);
  }
};

const getRouteById = async (req, res) => {
  try {
    logger.info('Fetching route by ID');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const idError = validateObjectId(id, 'Route ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const route = await transportService.getRouteById(id, tenant);
    
    if (!route) {
      return notFoundResponse(res, 'Route not found');
    }
    
    logger.info('Route fetched successfully:', { id });
    return successResponse(res, route, 'Route fetched successfully');
  } catch (error) {
    logger.error('Error fetching route:', error);
    return errorResponse(res, error.message);
  }
};

const updateRoute = async (req, res) => {
  try {
    logger.info('Updating route');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    const { name, stops, distance, estimatedDuration, status, description } = req.body;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const idError = validateObjectId(id, 'Route ID');
    if (idError) errors.push(idError);
    
    if (name && name.length > MAX_NAME_LENGTH) {
      errors.push('Route name must not exceed ' + MAX_NAME_LENGTH + ' characters');
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
    
    if (status && !VALID_ROUTE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ROUTE_STATUSES.join(', '));
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const route = await transportService.updateRoute(id, tenant, req.body);
    
    if (!route) {
      return notFoundResponse(res, 'Route not found');
    }
    
    logger.info('Route updated successfully:', { id });
    return successResponse(res, route, 'Route updated successfully');
  } catch (error) {
    logger.error('Error updating route:', error);
    return errorResponse(res, error.message);
  }
};

const deleteRoute = async (req, res) => {
  try {
    logger.info('Deleting route');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const idError = validateObjectId(id, 'Route ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportService.deleteRoute(id, tenant);
    
    if (!result) {
      return notFoundResponse(res, 'Route not found');
    }
    
    logger.info('Route deleted successfully:', { id });
    return successResponse(res, null, 'Route deleted successfully');
  } catch (error) {
    logger.error('Error deleting route:', error);
    return errorResponse(res, error.message);
  }
};


// Student Transport Assignment
const assignStudentToRoute = async (req, res) => {
  try {
    logger.info('Assigning student to route');
    
    const { studentId, routeId, pickupPointId, dropPointId } = req.body;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (!studentId) {
      errors.push('Student ID is required');
    } else {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (!routeId) {
      errors.push('Route ID is required');
    } else {
      const routeIdError = validateObjectId(routeId, 'Route ID');
      if (routeIdError) errors.push(routeIdError);
    }
    
    if (pickupPointId) {
      const pickupIdError = validateObjectId(pickupPointId, 'Pickup Point ID');
      if (pickupIdError) errors.push(pickupIdError);
    }
    
    if (dropPointId) {
      const dropIdError = validateObjectId(dropPointId, 'Drop Point ID');
      if (dropIdError) errors.push(dropIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const assignment = await transportService.assignStudentToRoute(req.body, tenant);
    
    logger.info('Student assigned to route successfully:', { studentId, routeId });
    return createdResponse(res, assignment, 'Student assigned to route successfully');
  } catch (error) {
    logger.error('Error assigning student to route:', error);
    return errorResponse(res, error.message);
  }
};

const getStudentTransports = async (req, res) => {
  try {
    logger.info('Fetching student transports');
    
    const tenant = req.user?.tenant;
    const { studentId, routeId, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (routeId) {
      const routeIdError = validateObjectId(routeId, 'Route ID');
      if (routeIdError) errors.push(routeIdError);
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
    
    const filters = {
      studentId,
      routeId,
      page: pageNum,
      limit: limitNum
    };
    
    const result = await transportService.getStudentTransports(tenant, filters);
    
    logger.info('Student transports fetched successfully:', { count: result.assignments?.length || 0 });
    return successResponse(res, result.assignments, 'Student transports fetched successfully', result.pagination);
  } catch (error) {
    logger.error('Error fetching student transports:', error);
    return errorResponse(res, error.message);
  }
};

const updateStudentTransport = async (req, res) => {
  try {
    logger.info('Updating student transport');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    const { routeId, pickupPointId, dropPointId } = req.body;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const idError = validateObjectId(id, 'Assignment ID');
    if (idError) errors.push(idError);
    
    if (routeId) {
      const routeIdError = validateObjectId(routeId, 'Route ID');
      if (routeIdError) errors.push(routeIdError);
    }
    
    if (pickupPointId) {
      const pickupIdError = validateObjectId(pickupPointId, 'Pickup Point ID');
      if (pickupIdError) errors.push(pickupIdError);
    }
    
    if (dropPointId) {
      const dropIdError = validateObjectId(dropPointId, 'Drop Point ID');
      if (dropIdError) errors.push(dropIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const assignment = await transportService.updateStudentTransport(id, tenant, req.body);
    
    if (!assignment) {
      return notFoundResponse(res, 'Student transport assignment not found');
    }
    
    logger.info('Student transport updated successfully:', { id });
    return successResponse(res, assignment, 'Student transport updated successfully');
  } catch (error) {
    logger.error('Error updating student transport:', error);
    return errorResponse(res, error.message);
  }
};

const deleteStudentTransport = async (req, res) => {
  try {
    logger.info('Deleting student transport');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const idError = validateObjectId(id, 'Assignment ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportService.deleteStudentTransport(id, tenant);
    
    if (!result) {
      return notFoundResponse(res, 'Student transport assignment not found');
    }
    
    logger.info('Student transport deleted successfully:', { id });
    return successResponse(res, null, 'Student transport deleted successfully');
  } catch (error) {
    logger.error('Error deleting student transport:', error);
    return errorResponse(res, error.message);
  }
};


// Trip Management
const createTrip = async (req, res) => {
  try {
    logger.info('Creating trip');
    
    const { routeId, vehicleId, driverId, scheduledDate, tripType, status } = req.body;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (!routeId) {
      errors.push('Route ID is required');
    } else {
      const routeIdError = validateObjectId(routeId, 'Route ID');
      if (routeIdError) errors.push(routeIdError);
    }
    
    if (!vehicleId) {
      errors.push('Vehicle ID is required');
    } else {
      const vehicleIdError = validateObjectId(vehicleId, 'Vehicle ID');
      if (vehicleIdError) errors.push(vehicleIdError);
    }
    
    if (driverId) {
      const driverIdError = validateObjectId(driverId, 'Driver ID');
      if (driverIdError) errors.push(driverIdError);
    }
    
    if (scheduledDate) {
      const dateError = validateDate(scheduledDate, 'Scheduled date');
      if (dateError) errors.push(dateError);
    }
    
    if (status && !VALID_TRIP_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_TRIP_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const trip = await transportService.createTrip(req.body, tenant);
    
    logger.info('Trip created successfully:', { tripId: trip._id, tripType });
    return createdResponse(res, trip, 'Trip created successfully');
  } catch (error) {
    logger.error('Error creating trip:', error);
    return errorResponse(res, error.message);
  }
};

const startTrip = async (req, res) => {
  try {
    logger.info('Starting trip');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    const { startTime, startLocation } = req.body;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const idError = validateObjectId(id, 'Trip ID');
    if (idError) errors.push(idError);
    
    if (startTime) {
      const dateError = validateDate(startTime, 'Start time');
      if (dateError) errors.push(dateError);
    }
    
    if (startLocation && startLocation.coordinates) {
      const coordErrors = validateCoordinates(startLocation.coordinates.latitude, startLocation.coordinates.longitude);
      if (coordErrors.length > 0) {
        errors.push.apply(errors, coordErrors);
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const trip = await transportService.startTrip(id, tenant, req.body);
    
    if (!trip) {
      return notFoundResponse(res, 'Trip not found');
    }
    
    logger.info('Trip started successfully:', { id });
    return successResponse(res, trip, 'Trip started successfully');
  } catch (error) {
    logger.error('Error starting trip:', error);
    return errorResponse(res, error.message);
  }
};

const completeTrip = async (req, res) => {
  try {
    logger.info('Completing trip');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    const { endTime, endLocation } = req.body;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const idError = validateObjectId(id, 'Trip ID');
    if (idError) errors.push(idError);
    
    if (endTime) {
      const dateError = validateDate(endTime, 'End time');
      if (dateError) errors.push(dateError);
    }
    
    if (endLocation && endLocation.coordinates) {
      const coordErrors = validateCoordinates(endLocation.coordinates.latitude, endLocation.coordinates.longitude);
      if (coordErrors.length > 0) {
        errors.push.apply(errors, coordErrors);
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const trip = await transportService.completeTrip(id, tenant, req.body);
    
    if (!trip) {
      return notFoundResponse(res, 'Trip not found');
    }
    
    logger.info('Trip completed successfully:', { id });
    return successResponse(res, trip, 'Trip completed successfully');
  } catch (error) {
    logger.error('Error completing trip:', error);
    return errorResponse(res, error.message);
  }
};

const cancelTrip = async (req, res) => {
  try {
    logger.info('Cancelling trip');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    const { reason } = req.body;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const idError = validateObjectId(id, 'Trip ID');
    if (idError) errors.push(idError);
    
    if (reason && reason.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const trip = await transportService.cancelTrip(id, tenant, reason);
    
    if (!trip) {
      return notFoundResponse(res, 'Trip not found');
    }
    
    logger.info('Trip cancelled successfully:', { id });
    return successResponse(res, trip, 'Trip cancelled successfully');
  } catch (error) {
    logger.error('Error cancelling trip:', error);
    return errorResponse(res, error.message);
  }
};

const getTrips = async (req, res) => {
  try {
    logger.info('Fetching trips');
    
    const tenant = req.user?.tenant;
    const { routeId, vehicleId, driverId, status, startDate, endDate, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (routeId) {
      const routeIdError = validateObjectId(routeId, 'Route ID');
      if (routeIdError) errors.push(routeIdError);
    }
    
    if (vehicleId) {
      const vehicleIdError = validateObjectId(vehicleId, 'Vehicle ID');
      if (vehicleIdError) errors.push(vehicleIdError);
    }
    
    if (driverId) {
      const driverIdError = validateObjectId(driverId, 'Driver ID');
      if (driverIdError) errors.push(driverIdError);
    }
    
    if (status && !VALID_TRIP_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_TRIP_STATUSES.join(', '));
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
    
    const filters = {
      routeId,
      vehicleId,
      driverId,
      status,
      startDate,
      endDate,
      page: pageNum,
      limit: limitNum
    };
    
    const result = await transportService.getTrips(tenant, filters);
    
    logger.info('Trips fetched successfully:', { count: result.trips?.length || 0 });
    return successResponse(res, result.trips, 'Trips fetched successfully', result.pagination);
  } catch (error) {
    logger.error('Error fetching trips:', error);
    return errorResponse(res, error.message);
  }
};

const getTripById = async (req, res) => {
  try {
    logger.info('Fetching trip by ID');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const idError = validateObjectId(id, 'Trip ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const trip = await transportService.getTripById(id, tenant);
    
    if (!trip) {
      return notFoundResponse(res, 'Trip not found');
    }
    
    logger.info('Trip fetched successfully:', { id });
    return successResponse(res, trip, 'Trip fetched successfully');
  } catch (error) {
    logger.error('Error fetching trip:', error);
    return errorResponse(res, error.message);
  }
};


// Maintenance Management
const createMaintenance = async (req, res) => {
  try {
    logger.info('Creating maintenance record');
    
    const { vehicleId, maintenanceType, description, scheduledDate, cost, status } = req.body;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (!vehicleId) {
      errors.push('Vehicle ID is required');
    } else {
      const vehicleIdError = validateObjectId(vehicleId, 'Vehicle ID');
      if (vehicleIdError) errors.push(vehicleIdError);
    }
    
    if (!maintenanceType) {
      errors.push('Maintenance type is required');
    } else if (!VALID_MAINTENANCE_TYPES.includes(maintenanceType)) {
      errors.push('Invalid maintenance type. Must be one of: ' + VALID_MAINTENANCE_TYPES.join(', '));
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (scheduledDate) {
      const dateError = validateDate(scheduledDate, 'Scheduled date');
      if (dateError) errors.push(dateError);
    }
    
    if (cost !== undefined) {
      const costValue = parseFloat(cost);
      if (isNaN(costValue) || costValue < MIN_COST || costValue > MAX_COST) {
        errors.push('Cost must be between ' + MIN_COST + ' and ' + MAX_COST);
      }
    }
    
    if (status && !VALID_MAINTENANCE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_MAINTENANCE_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const maintenance = await transportService.createMaintenance(req.body, tenant);
    
    logger.info('Maintenance record created successfully:', { maintenanceId: maintenance._id });
    return createdResponse(res, maintenance, 'Maintenance record created successfully');
  } catch (error) {
    logger.error('Error creating maintenance record:', error);
    return errorResponse(res, error.message);
  }
};

const getMaintenanceRecords = async (req, res) => {
  try {
    logger.info('Fetching maintenance records');
    
    const tenant = req.user?.tenant;
    const { vehicleId, maintenanceType, status, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (vehicleId) {
      const vehicleIdError = validateObjectId(vehicleId, 'Vehicle ID');
      if (vehicleIdError) errors.push(vehicleIdError);
    }
    
    if (maintenanceType && !VALID_MAINTENANCE_TYPES.includes(maintenanceType)) {
      errors.push('Invalid maintenance type. Must be one of: ' + VALID_MAINTENANCE_TYPES.join(', '));
    }
    
    if (status && !VALID_MAINTENANCE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_MAINTENANCE_STATUSES.join(', '));
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
    
    const filters = {
      vehicleId,
      maintenanceType,
      status,
      page: pageNum,
      limit: limitNum
    };
    
    const result = await transportService.getMaintenanceRecords(tenant, filters);
    
    logger.info('Maintenance records fetched successfully:', { count: result.records?.length || 0 });
    return successResponse(res, result.records, 'Maintenance records fetched successfully', result.pagination);
  } catch (error) {
    logger.error('Error fetching maintenance records:', error);
    return errorResponse(res, error.message);
  }
};

// Fuel Management
const addFuelRecord = async (req, res) => {
  try {
    logger.info('Adding fuel record');
    
    const { vehicleId, fuelType, quantity, cost, date, odometer } = req.body;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (!vehicleId) {
      errors.push('Vehicle ID is required');
    } else {
      const vehicleIdError = validateObjectId(vehicleId, 'Vehicle ID');
      if (vehicleIdError) errors.push(vehicleIdError);
    }
    
    if (!fuelType) {
      errors.push('Fuel type is required');
    } else if (!VALID_FUEL_TYPES.includes(fuelType)) {
      errors.push('Invalid fuel type. Must be one of: ' + VALID_FUEL_TYPES.join(', '));
    }
    
    if (!quantity) {
      errors.push('Fuel quantity is required');
    } else {
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty < MIN_FUEL_AMOUNT || qty > MAX_FUEL_AMOUNT) {
        errors.push('Quantity must be between ' + MIN_FUEL_AMOUNT + ' and ' + MAX_FUEL_AMOUNT);
      }
    }
    
    if (cost !== undefined) {
      const costValue = parseFloat(cost);
      if (isNaN(costValue) || costValue < MIN_COST || costValue > MAX_COST) {
        errors.push('Cost must be between ' + MIN_COST + ' and ' + MAX_COST);
      }
    }
    
    if (date) {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (odometer !== undefined) {
      const odometerValue = parseFloat(odometer);
      if (isNaN(odometerValue) || odometerValue < 0) {
        errors.push('Odometer reading must be a positive number');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const fuelRecord = await transportService.addFuelRecord(req.body, tenant);
    
    logger.info('Fuel record added successfully:', { fuelRecordId: fuelRecord._id });
    return createdResponse(res, fuelRecord, 'Fuel record added successfully');
  } catch (error) {
    logger.error('Error adding fuel record:', error);
    return errorResponse(res, error.message);
  }
};

const getFuelRecords = async (req, res) => {
  try {
    logger.info('Fetching fuel records');
    
    const tenant = req.user?.tenant;
    const { vehicleId, startDate, endDate, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (vehicleId) {
      const vehicleIdError = validateObjectId(vehicleId, 'Vehicle ID');
      if (vehicleIdError) errors.push(vehicleIdError);
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
    
    const filters = {
      vehicleId,
      startDate,
      endDate,
      page: pageNum,
      limit: limitNum
    };
    
    const result = await transportService.getFuelRecords(tenant, filters);
    
    logger.info('Fuel records fetched successfully:', { count: result.records?.length || 0 });
    return successResponse(res, result.records, 'Fuel records fetched successfully', result.pagination);
  } catch (error) {
    logger.error('Error fetching fuel records:', error);
    return errorResponse(res, error.message);
  }
};

// Statistics and Analytics
const getTransportStatistics = async (req, res) => {
  try {
    logger.info('Fetching transport statistics');
    
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await transportService.getTransportStatistics(tenant);
    
    logger.info('Transport statistics fetched successfully');
    return successResponse(res, stats, 'Transport statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport statistics:', error);
    return errorResponse(res, error.message);
  }
};

const getTransportAnalytics = async (req, res) => {
  try {
    logger.info('Fetching transport analytics');
    
    const tenant = req.user?.tenant;
    const { period, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const periodValue = period || 'month';
    if (!VALID_PERIODS.includes(periodValue)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
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
    
    const filters = {
      period: periodValue,
      startDate,
      endDate
    };
    
    const analytics = await transportService.getTransportAnalytics(tenant, filters);
    
    logger.info('Transport analytics fetched successfully');
    return successResponse(res, analytics, 'Transport analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Export functionality
const exportTransportData = async (req, res) => {
  try {
    logger.info('Exporting transport data');
    
    const tenant = req.user?.tenant;
    const { format, dataType, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    const validDataTypes = ['vehicles', 'routes', 'trips', 'maintenance', 'fuel', 'all'];
    const dataTypeValue = dataType || 'all';
    if (!validDataTypes.includes(dataTypeValue)) {
      errors.push('Invalid data type. Must be one of: ' + validDataTypes.join(', '));
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
    
    const exportData = await transportService.exportTransportData(tenant, {
      format: format.toLowerCase(),
      dataType: dataTypeValue,
      startDate,
      endDate
    });
    
    logger.info('Transport data exported successfully:', { format, dataType: dataTypeValue });
    return successResponse(res, exportData, 'Transport data exported successfully');
  } catch (error) {
    logger.error('Error exporting transport data:', error);
    return errorResponse(res, error.message);
  }
};

// Search functionality
const searchTransport = async (req, res) => {
  try {
    logger.info('Searching transport data');
    
    const tenant = req.user?.tenant;
    const { q, type, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    const validSearchTypes = ['vehicles', 'routes', 'students', 'all'];
    const searchType = type || 'all';
    if (!validSearchTypes.includes(searchType)) {
      errors.push('Invalid search type. Must be one of: ' + validSearchTypes.join(', '));
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
    
    const result = await transportService.searchTransport(tenant, q, {
      type: searchType,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Transport search completed successfully:', { query: q, type: searchType });
    return successResponse(res, result, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching transport data:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk operations
const bulkUpdateVehicles = async (req, res) => {
  try {
    logger.info('Bulk updating vehicles');
    
    const tenant = req.user?.tenant;
    const { ids, updates } = req.body;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      errors.push('Vehicle IDs array is required and must not be empty');
    } else {
      for (let i = 0; i < ids.length; i++) {
        const idError = validateObjectId(ids[i], 'Vehicle ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates object is required');
    } else {
      if (updates.status && !VALID_VEHICLE_STATUSES.includes(updates.status)) {
        errors.push('Invalid status. Must be one of: ' + VALID_VEHICLE_STATUSES.join(', '));
      }
      
      if (updates.vehicleType && !VALID_VEHICLE_TYPES.includes(updates.vehicleType)) {
        errors.push('Invalid vehicle type. Must be one of: ' + VALID_VEHICLE_TYPES.join(', '));
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportService.bulkUpdateVehicles(tenant, ids, updates);
    
    logger.info('Vehicles bulk updated successfully:', { count: result.modifiedCount || 0 });
    return successResponse(res, result, result.modifiedCount + ' vehicle(s) updated successfully');
  } catch (error) {
    logger.error('Error bulk updating vehicles:', error);
    return errorResponse(res, error.message);
  }
};

const bulkDeleteVehicles = async (req, res) => {
  try {
    logger.info('Bulk deleting vehicles');
    
    const tenant = req.user?.tenant;
    const { ids } = req.body;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      errors.push('Vehicle IDs array is required and must not be empty');
    } else {
      for (let i = 0; i < ids.length; i++) {
        const idError = validateObjectId(ids[i], 'Vehicle ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportService.bulkDeleteVehicles(tenant, ids);
    
    logger.info('Vehicles bulk deleted successfully:', { count: result.deletedCount || 0 });
    return successResponse(res, result, result.deletedCount + ' vehicle(s) deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting vehicles:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  assignStudentToRoute,
  getStudentTransports,
  updateStudentTransport,
  deleteStudentTransport,
  createTrip,
  startTrip,
  completeTrip,
  cancelTrip,
  getTrips,
  getTripById,
  createMaintenance,
  getMaintenanceRecords,
  addFuelRecord,
  getFuelRecords,
  getTransportStatistics,
  getTransportAnalytics,
  exportTransportData,
  searchTransport,
  bulkUpdateVehicles,
  bulkDeleteVehicles
};
