import transportAssignmentService from '../services/transportAssignmentService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'pending', 'suspended', 'cancelled'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
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

// Helper function to validate academic year format (YYYY-YYYY)
const validateAcademicYear = (year) => {
  if (!year) return null;
  const yearPattern = /^\d{4}-\d{4}$/;
  if (!yearPattern.test(year)) {
    return 'Invalid academic year format. Expected format: YYYY-YYYY';
  }
  const [startYear, endYear] = year.split('-').map(Number);
  if (endYear !== startYear + 1) {
    return 'Academic year end must be one year after start';
  }
  return null;
};

const getAllAssignments = async (req, res) => {
  try {
    logger.info('Fetching all transport assignments');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { routeId, pickupPointId, vehicleId, driverId, status, academicYear, page, limit, sortBy, sortOrder } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (routeId) {
      const routeIdError = validateObjectId(routeId, 'Route ID');
      if (routeIdError) errors.push(routeIdError);
    }
    
    if (pickupPointId) {
      const pickupPointIdError = validateObjectId(pickupPointId, 'Pickup Point ID');
      if (pickupPointIdError) errors.push(pickupPointIdError);
    }
    
    if (vehicleId) {
      const vehicleIdError = validateObjectId(vehicleId, 'Vehicle ID');
      if (vehicleIdError) errors.push(vehicleIdError);
    }
    
    if (driverId) {
      const driverIdError = validateObjectId(driverId, 'Driver ID');
      if (driverIdError) errors.push(driverIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
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
      routeId,
      pickupPointId,
      vehicleId,
      driverId,
      status,
      academicYear,
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };
    
    const result = await transportAssignmentService.getAllAssignments(institutionId, filters);
    
    logger.info('Transport assignments fetched successfully:', { institutionId, count: result.data?.length || 0 });
    return successResponse(res, result, 'Transport assignments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport assignments:', error);
    return errorResponse(res, error.message);
  }
};

const getAssignmentById = async (req, res) => {
  try {
    logger.info('Fetching transport assignment by ID');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Assignment ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const assignment = await transportAssignmentService.getAssignmentById(id, institutionId);
    
    if (!assignment) {
      return notFoundResponse(res, 'Transport assignment not found');
    }
    
    logger.info('Transport assignment fetched successfully:', { id });
    return successResponse(res, assignment, 'Transport assignment retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport assignment:', error);
    return errorResponse(res, error.message);
  }
};

const createAssignment = async (req, res) => {
  try {
    logger.info('Creating transport assignment');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { routeId, vehicleId, driverId, pickupPointId, studentId, academicYear, status, effectiveDate, notes } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
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
    
    if (pickupPointId) {
      const pickupPointIdError = validateObjectId(pickupPointId, 'Pickup Point ID');
      if (pickupPointIdError) errors.push(pickupPointIdError);
    }
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (effectiveDate) {
      const date = new Date(effectiveDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid effective date format');
      }
    }
    
    if (notes && notes.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Notes must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const assignment = await transportAssignmentService.createAssignment(institutionId, req.body);
    
    logger.info('Transport assignment created successfully:', { id: assignment._id });
    return createdResponse(res, assignment, 'Vehicle assigned successfully');
  } catch (error) {
    logger.error('Error creating transport assignment:', error);
    return errorResponse(res, error.message);
  }
};

const updateAssignment = async (req, res) => {
  try {
    logger.info('Updating transport assignment');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    const { routeId, vehicleId, driverId, pickupPointId, studentId, academicYear, status, effectiveDate, notes } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Assignment ID');
    if (idError) errors.push(idError);
    
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
    
    if (pickupPointId) {
      const pickupPointIdError = validateObjectId(pickupPointId, 'Pickup Point ID');
      if (pickupPointIdError) errors.push(pickupPointIdError);
    }
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (effectiveDate) {
      const date = new Date(effectiveDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid effective date format');
      }
    }
    
    if (notes && notes.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Notes must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const assignment = await transportAssignmentService.updateAssignment(id, institutionId, req.body);
    
    if (!assignment) {
      return notFoundResponse(res, 'Transport assignment not found');
    }
    
    logger.info('Transport assignment updated successfully:', { id });
    return successResponse(res, assignment, 'Assignment updated successfully');
  } catch (error) {
    logger.error('Error updating transport assignment:', error);
    return errorResponse(res, error.message);
  }
};

const deleteAssignment = async (req, res) => {
  try {
    logger.info('Deleting transport assignment');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Assignment ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportAssignmentService.deleteAssignment(id, institutionId);
    
    if (!result) {
      return notFoundResponse(res, 'Transport assignment not found');
    }
    
    logger.info('Transport assignment deleted successfully:', { id });
    return successResponse(res, null, 'Assignment deleted successfully');
  } catch (error) {
    logger.error('Error deleting transport assignment:', error);
    return errorResponse(res, error.message);
  }
};

const bulkDeleteAssignments = async (req, res) => {
  try {
    logger.info('Bulk deleting transport assignments');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { ids } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      errors.push('Assignment IDs array is required and must not be empty');
    } else {
      for (let i = 0; i < ids.length; i++) {
        const idError = validateObjectId(ids[i], 'Assignment ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportAssignmentService.bulkDeleteAssignments(ids, institutionId);
    
    logger.info('Transport assignments bulk deleted successfully:', { count: result.modifiedCount || result.deletedCount || 0 });
    return successResponse(res, result, result.modifiedCount + ' assignment(s) deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting transport assignments:', error);
    return errorResponse(res, error.message);
  }
};

const getAssignmentsByRoute = async (req, res) => {
  try {
    logger.info('Fetching transport assignments by route');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { routeId } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const routeIdError = validateObjectId(routeId, 'Route ID');
    if (routeIdError) errors.push(routeIdError);
    
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
    
    const result = await transportAssignmentService.getAssignmentsByRoute(routeId, institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Transport assignments by route fetched successfully:', { routeId });
    return successResponse(res, result, 'Assignments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport assignments by route:', error);
    return errorResponse(res, error.message);
  }
};

const getAssignmentsByVehicle = async (req, res) => {
  try {
    logger.info('Fetching transport assignments by vehicle');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { vehicleId } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const vehicleIdError = validateObjectId(vehicleId, 'Vehicle ID');
    if (vehicleIdError) errors.push(vehicleIdError);
    
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
    
    const result = await transportAssignmentService.getAssignmentsByVehicle(vehicleId, institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Transport assignments by vehicle fetched successfully:', { vehicleId });
    return successResponse(res, result, 'Assignments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport assignments by vehicle:', error);
    return errorResponse(res, error.message);
  }
};


const getAssignmentsByDriver = async (req, res) => {
  try {
    logger.info('Fetching transport assignments by driver');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { driverId } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const driverIdError = validateObjectId(driverId, 'Driver ID');
    if (driverIdError) errors.push(driverIdError);
    
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
    
    const result = await transportAssignmentService.getAssignmentsByDriver(driverId, institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Transport assignments by driver fetched successfully:', { driverId });
    return successResponse(res, result, 'Assignments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport assignments by driver:', error);
    return errorResponse(res, error.message);
  }
};

const getAssignmentsByStudent = async (req, res) => {
  try {
    logger.info('Fetching transport assignments by student');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { studentId } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
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
    
    const result = await transportAssignmentService.getAssignmentsByStudent(studentId, institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Transport assignments by student fetched successfully:', { studentId });
    return successResponse(res, result, 'Assignments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport assignments by student:', error);
    return errorResponse(res, error.message);
  }
};

const getAssignmentsByPickupPoint = async (req, res) => {
  try {
    logger.info('Fetching transport assignments by pickup point');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { pickupPointId } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const pickupPointIdError = validateObjectId(pickupPointId, 'Pickup Point ID');
    if (pickupPointIdError) errors.push(pickupPointIdError);
    
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
    
    const result = await transportAssignmentService.getAssignmentsByPickupPoint(pickupPointId, institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Transport assignments by pickup point fetched successfully:', { pickupPointId });
    return successResponse(res, result, 'Assignments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport assignments by pickup point:', error);
    return errorResponse(res, error.message);
  }
};

const updateAssignmentStatus = async (req, res) => {
  try {
    logger.info('Updating transport assignment status');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    const { status } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Assignment ID');
    if (idError) errors.push(idError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const assignment = await transportAssignmentService.updateAssignmentStatus(id, institutionId, status);
    
    if (!assignment) {
      return notFoundResponse(res, 'Transport assignment not found');
    }
    
    logger.info('Transport assignment status updated successfully:', { id, status });
    return successResponse(res, assignment, 'Assignment status updated successfully');
  } catch (error) {
    logger.error('Error updating transport assignment status:', error);
    return errorResponse(res, error.message);
  }
};

const bulkUpdateAssignments = async (req, res) => {
  try {
    logger.info('Bulk updating transport assignments');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { ids, updates } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      errors.push('Assignment IDs array is required and must not be empty');
    } else {
      for (let i = 0; i < ids.length; i++) {
        const idError = validateObjectId(ids[i], 'Assignment ID at index ' + i);
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
      
      if (updates.routeId) {
        const routeIdError = validateObjectId(updates.routeId, 'Route ID');
        if (routeIdError) errors.push(routeIdError);
      }
      
      if (updates.vehicleId) {
        const vehicleIdError = validateObjectId(updates.vehicleId, 'Vehicle ID');
        if (vehicleIdError) errors.push(vehicleIdError);
      }
      
      if (updates.driverId) {
        const driverIdError = validateObjectId(updates.driverId, 'Driver ID');
        if (driverIdError) errors.push(driverIdError);
      }
      
      if (updates.academicYear) {
        const academicYearError = validateAcademicYear(updates.academicYear);
        if (academicYearError) errors.push(academicYearError);
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transportAssignmentService.bulkUpdateAssignments(ids, institutionId, updates);
    
    logger.info('Transport assignments bulk updated successfully:', { count: result.modifiedCount || 0 });
    return successResponse(res, result, result.modifiedCount + ' assignment(s) updated successfully');
  } catch (error) {
    logger.error('Error bulk updating transport assignments:', error);
    return errorResponse(res, error.message);
  }
};

const searchAssignments = async (req, res) => {
  try {
    logger.info('Searching transport assignments');
    
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
    
    const result = await transportAssignmentService.searchAssignments(institutionId, q, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Transport assignments searched successfully:', { query: q });
    return successResponse(res, result, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching transport assignments:', error);
    return errorResponse(res, error.message);
  }
};

const getStatistics = async (req, res) => {
  try {
    logger.info('Fetching transport assignment statistics');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { academicYear } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await transportAssignmentService.getStatistics(institutionId, academicYear);
    
    logger.info('Transport assignment statistics fetched successfully');
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport assignment statistics:', error);
    return errorResponse(res, error.message);
  }
};

const getAnalytics = async (req, res) => {
  try {
    logger.info('Fetching transport assignment analytics');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { groupBy, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const validGroupBy = ['route', 'vehicle', 'driver', 'status', 'month', 'year'];
    const groupByValue = groupBy || 'status';
    
    if (!validGroupBy.includes(groupByValue)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (startDate) {
      const date = new Date(startDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid start date format');
      }
    }
    
    if (endDate) {
      const date = new Date(endDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid end date format');
      }
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
    
    const analytics = await transportAssignmentService.getAnalytics(institutionId, {
      groupBy: groupByValue,
      startDate,
      endDate
    });
    
    logger.info('Transport assignment analytics fetched successfully');
    return successResponse(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport assignment analytics:', error);
    return errorResponse(res, error.message);
  }
};

const exportAssignments = async (req, res) => {
  try {
    logger.info('Exporting transport assignments');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { format, routeId, vehicleId, status, academicYear } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (routeId) {
      const routeIdError = validateObjectId(routeId, 'Route ID');
      if (routeIdError) errors.push(routeIdError);
    }
    
    if (vehicleId) {
      const vehicleIdError = validateObjectId(vehicleId, 'Vehicle ID');
      if (vehicleIdError) errors.push(vehicleIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await transportAssignmentService.exportAssignments(institutionId, {
      format: format.toLowerCase(),
      routeId,
      vehicleId,
      status,
      academicYear
    });
    
    logger.info('Transport assignments exported successfully:', { format });
    return successResponse(res, exportData, 'Assignments exported successfully');
  } catch (error) {
    logger.error('Error exporting transport assignments:', error);
    return errorResponse(res, error.message);
  }
};

const getActiveAssignments = async (req, res) => {
  try {
    logger.info('Fetching active transport assignments');
    
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
    
    const result = await transportAssignmentService.getActiveAssignments(institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Active transport assignments fetched successfully');
    return successResponse(res, result, 'Active assignments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching active transport assignments:', error);
    return errorResponse(res, error.message);
  }
};

const getAssignmentsByAcademicYear = async (req, res) => {
  try {
    logger.info('Fetching transport assignments by academic year');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { academicYear } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const academicYearError = validateAcademicYear(academicYear);
    if (academicYearError) errors.push(academicYearError);
    
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
    
    const result = await transportAssignmentService.getAssignmentsByAcademicYear(institutionId, academicYear, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Transport assignments by academic year fetched successfully:', { academicYear });
    return successResponse(res, result, 'Assignments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport assignments by academic year:', error);
    return errorResponse(res, error.message);
  }
};

const reassignVehicle = async (req, res) => {
  try {
    logger.info('Reassigning vehicle for transport assignment');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { id } = req.params;
    const { newVehicleId, newDriverId, effectiveDate, reason } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Assignment ID');
    if (idError) errors.push(idError);
    
    if (!newVehicleId) {
      errors.push('New vehicle ID is required');
    } else {
      const vehicleIdError = validateObjectId(newVehicleId, 'New vehicle ID');
      if (vehicleIdError) errors.push(vehicleIdError);
    }
    
    if (newDriverId) {
      const driverIdError = validateObjectId(newDriverId, 'New driver ID');
      if (driverIdError) errors.push(driverIdError);
    }
    
    if (effectiveDate) {
      const date = new Date(effectiveDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid effective date format');
      }
    }
    
    if (reason && reason.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const assignment = await transportAssignmentService.reassignVehicle(id, institutionId, req.body);
    
    if (!assignment) {
      return notFoundResponse(res, 'Transport assignment not found');
    }
    
    logger.info('Vehicle reassigned successfully:', { id, newVehicleId });
    return successResponse(res, assignment, 'Vehicle reassigned successfully');
  } catch (error) {
    logger.error('Error reassigning vehicle:', error);
    return errorResponse(res, error.message);
  }
};

const getAssignmentHistory = async (req, res) => {
  try {
    logger.info('Fetching transport assignment history');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const idError = validateObjectId(id, 'Assignment ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const history = await transportAssignmentService.getAssignmentHistory(id, institutionId);
    
    if (!history) {
      return notFoundResponse(res, 'Assignment history not found');
    }
    
    logger.info('Transport assignment history fetched successfully:', { id });
    return successResponse(res, history, 'Assignment history retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport assignment history:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  bulkDeleteAssignments,
  getAssignmentsByRoute,
  getAssignmentsByVehicle,
  getAssignmentsByDriver,
  getAssignmentsByStudent,
  getAssignmentsByPickupPoint,
  updateAssignmentStatus,
  bulkUpdateAssignments,
  searchAssignments,
  getStatistics,
  getAnalytics,
  exportAssignments,
  getActiveAssignments,
  getAssignmentsByAcademicYear,
  reassignVehicle,
  getAssignmentHistory
};
