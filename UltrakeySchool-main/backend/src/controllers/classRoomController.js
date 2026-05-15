import classRoomService from '../services/classRoomService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid classroom statuses
const VALID_STATUSES = ['available', 'occupied', 'maintenance', 'reserved', 'inactive'];

// Valid room types
const VALID_ROOM_TYPES = ['classroom', 'laboratory', 'library', 'auditorium', 'computer_lab', 'sports_hall', 'conference_room', 'staff_room'];

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { field: fieldName, message: 'Invalid ' + fieldName + ' format' } };
  }
  return { valid: true };
};

const createClassRoom = async (req, res) => {
  try {
    const { roomNo, capacity, status, roomType, building, floor, institutionId } = req.body;

    // Validate required fields
    const errors = [];
    if (!roomNo || roomNo.trim().length < 1) {
      errors.push({ field: 'roomNo', message: 'Room number is required' });
    }
    if (!capacity || isNaN(capacity) || capacity < 1 || capacity > 500) {
      errors.push({ field: 'capacity', message: 'Capacity must be between 1 and 500' });
    }
    if (!institutionId) {
      errors.push({ field: 'institutionId', message: 'Institution ID is required' });
    } else {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }
    if (roomType && !VALID_ROOM_TYPES.includes(roomType)) {
      errors.push({ field: 'roomType', message: 'Room type must be one of: ' + VALID_ROOM_TYPES.join(', ') });
    }
    if (floor && (isNaN(floor) || floor < -5 || floor > 100)) {
      errors.push({ field: 'floor', message: 'Floor must be between -5 and 100' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const roomData = {
      ...req.body,
      metadata: { createdBy: req.user?.id || 'system' }
    };

    logger.info('Creating classroom: ' + roomNo + ' in building ' + (building || 'N/A'));
    const room = await classRoomService.createClassRoom(roomData);
    
    return createdResponse(res, room, 'Class room created successfully');
  } catch (error) {
    logger.error('Error creating classroom:', error);
    return errorResponse(res, error.message, 400);
  }
};

const getClassRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const validation = validateObjectId(id, 'classRoomId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Fetching classroom by ID: ' + id);
    const room = await classRoomService.getClassRoomById(id);
    
    if (!room) {
      return notFoundResponse(res, 'Class room not found');
    }

    return successResponse(res, room, 'Class room fetched successfully');
  } catch (error) {
    logger.error('Error fetching classroom by ID:', error);
    return errorResponse(res, 'Failed to fetch class room', 500);
  }
};

const getClassRoomByRoomId = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId || roomId.trim().length === 0) {
      return validationErrorResponse(res, [{ field: 'roomId', message: 'Room ID is required' }]);
    }

    logger.info('Fetching classroom by roomId: ' + roomId);
    const room = await classRoomService.getClassRoomByRoomId(roomId);
    
    if (!room) {
      return notFoundResponse(res, 'Class room not found');
    }

    return successResponse(res, room, 'Class room fetched successfully');
  } catch (error) {
    logger.error('Error fetching classroom by roomId:', error);
    return errorResponse(res, 'Failed to fetch class room', 500);
  }
};

const getAllClassRooms = async (req, res) => {
  try {
    const { roomNo, capacity, status, roomType, building, floor, academicYear, institutionId, search, page = 1, limit = 20, sortBy = 'roomNo', sortOrder = 'asc' } = req.query;

    // Validate pagination
    const errors = [];
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({ field: 'page', message: 'Page must be a positive integer' });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    // Validate roomType if provided
    if (roomType && !VALID_ROOM_TYPES.includes(roomType)) {
      errors.push({ field: 'roomType', message: 'Room type must be one of: ' + VALID_ROOM_TYPES.join(', ') });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate capacity if provided
    if (capacity && (isNaN(capacity) || parseInt(capacity) < 1)) {
      errors.push({ field: 'capacity', message: 'Capacity must be a positive number' });
    }

    // Validate floor if provided
    if (floor && (isNaN(floor) || parseInt(floor) < -5 || parseInt(floor) > 100)) {
      errors.push({ field: 'floor', message: 'Floor must be between -5 and 100' });
    }

    // Validate sortOrder
    if (!['asc', 'desc'].includes(sortOrder)) {
      errors.push({ field: 'sortOrder', message: 'Sort order must be asc or desc' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = {
      roomNo,
      capacity: capacity ? parseInt(capacity) : undefined,
      status,
      roomType,
      building,
      floor: floor ? parseInt(floor) : undefined,
      academicYear,
      institutionId,
      search
    };
    const options = { page: pageNum, limit: limitNum, sortBy, sortOrder };

    logger.info('Fetching all classrooms with filters');
    const result = await classRoomService.getAllClassRooms(filters, options);
    
    return successResponse(res, result.rooms, 'Class rooms fetched successfully', {
      pagination: result.pagination,
      filters: filters
    });
  } catch (error) {
    logger.error('Error fetching all classrooms:', error);
    return errorResponse(res, 'Failed to fetch class rooms', 500);
  }
};

const updateClassRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { capacity, status, roomType, floor } = req.body;

    // Validate ID
    const errors = [];
    const validation = validateObjectId(id, 'classRoomId');
    if (!validation.valid) {
      errors.push(validation.error);
    }

    // Validate fields if provided
    if (capacity && (isNaN(capacity) || capacity < 1 || capacity > 500)) {
      errors.push({ field: 'capacity', message: 'Capacity must be between 1 and 500' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }
    if (roomType && !VALID_ROOM_TYPES.includes(roomType)) {
      errors.push({ field: 'roomType', message: 'Room type must be one of: ' + VALID_ROOM_TYPES.join(', ') });
    }
    if (floor && (isNaN(floor) || floor < -5 || floor > 100)) {
      errors.push({ field: 'floor', message: 'Floor must be between -5 and 100' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const updateData = { ...req.body, 'metadata.updatedBy': req.user?.id || 'system' };

    logger.info('Updating classroom: ' + id);
    const room = await classRoomService.updateClassRoom(id, updateData);
    
    if (!room) {
      return notFoundResponse(res, 'Class room not found');
    }

    return successResponse(res, room, 'Class room updated successfully');
  } catch (error) {
    logger.error('Error updating classroom:', error);
    return errorResponse(res, error.message, 400);
  }
};

const deleteClassRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const validation = validateObjectId(id, 'classRoomId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Deleting classroom: ' + id);
    const result = await classRoomService.deleteClassRoom(id);
    
    if (!result) {
      return notFoundResponse(res, 'Class room not found');
    }

    return successResponse(res, null, 'Class room deleted successfully');
  } catch (error) {
    logger.error('Error deleting classroom:', error);
    return errorResponse(res, error.message, 400);
  }
};

const getClassRoomsByInstitution = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { academicYear } = req.query;

    // Validate institutionId
    const validation = validateObjectId(institutionId, 'institutionId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Fetching classrooms for institution: ' + institutionId);
    const rooms = await classRoomService.getClassRoomsByInstitution(institutionId, academicYear);
    
    return successResponse(res, rooms, 'Class rooms fetched successfully', {
      institutionId,
      academicYear: academicYear || 'all'
    });
  } catch (error) {
    logger.error('Error fetching classrooms by institution:', error);
    return errorResponse(res, 'Failed to fetch class rooms', 500);
  }
};

const getClassRoomsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { institutionId } = req.query;

    // Validate status
    const errors = [];
    if (!VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching classrooms by status: ' + status);
    const rooms = await classRoomService.getClassRoomsByStatus(status, institutionId);
    
    return successResponse(res, rooms, 'Class rooms fetched successfully', {
      status,
      institutionId: institutionId || 'all'
    });
  } catch (error) {
    logger.error('Error fetching classrooms by status:', error);
    return errorResponse(res, 'Failed to fetch class rooms', 500);
  }
};

const getAvailableClassRooms = async (req, res) => {
  try {
    const { institutionId, minCapacity } = req.query;

    // Validate institutionId if provided
    const errors = [];
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate minCapacity if provided
    if (minCapacity && (isNaN(minCapacity) || parseInt(minCapacity) < 1)) {
      errors.push({ field: 'minCapacity', message: 'Minimum capacity must be a positive number' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching available classrooms');
    const rooms = await classRoomService.getAvailableClassRooms(institutionId, minCapacity ? parseInt(minCapacity) : undefined);
    
    return successResponse(res, rooms, 'Available class rooms fetched successfully', {
      minCapacity: minCapacity || 'any'
    });
  } catch (error) {
    logger.error('Error fetching available classrooms:', error);
    return errorResponse(res, 'Failed to fetch available class rooms', 500);
  }
};

const getClassRoomsByBuilding = async (req, res) => {
  try {
    const { building } = req.params;
    const { institutionId } = req.query;

    // Validate building
    const errors = [];
    if (!building || building.trim().length === 0) {
      errors.push({ field: 'building', message: 'Building name is required' });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching classrooms for building: ' + building);
    const rooms = await classRoomService.getClassRoomsByBuilding(building, institutionId);
    
    return successResponse(res, rooms, 'Class rooms fetched successfully', {
      building
    });
  } catch (error) {
    logger.error('Error fetching classrooms by building:', error);
    return errorResponse(res, 'Failed to fetch class rooms', 500);
  }
};

const getClassRoomsByFloor = async (req, res) => {
  try {
    const { floor } = req.params;
    const { building, institutionId } = req.query;

    // Validate floor
    const errors = [];
    const floorNum = parseInt(floor);
    if (isNaN(floorNum) || floorNum < -5 || floorNum > 100) {
      errors.push({ field: 'floor', message: 'Floor must be between -5 and 100' });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching classrooms for floor: ' + floorNum);
    const rooms = await classRoomService.getClassRoomsByFloor(floorNum, building, institutionId);
    
    return successResponse(res, rooms, 'Class rooms fetched successfully', {
      floor: floorNum,
      building: building || 'all'
    });
  } catch (error) {
    logger.error('Error fetching classrooms by floor:', error);
    return errorResponse(res, 'Failed to fetch class rooms', 500);
  }
};

const assignClassToRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { classId } = req.body;
    const userId = req.user?.id || 'system';

    // Validate IDs
    const errors = [];
    const roomValidation = validateObjectId(id, 'classRoomId');
    if (!roomValidation.valid) {
      errors.push(roomValidation.error);
    }
    if (!classId) {
      errors.push({ field: 'classId', message: 'Class ID is required' });
    } else {
      const classValidation = validateObjectId(classId, 'classId');
      if (!classValidation.valid) {
        errors.push(classValidation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Assigning class ' + classId + ' to room ' + id);
    const room = await classRoomService.assignClassToRoom(id, classId, userId);
    
    if (!room) {
      return notFoundResponse(res, 'Class room not found');
    }

    return successResponse(res, room, 'Class assigned to room successfully');
  } catch (error) {
    logger.error('Error assigning class to room:', error);
    return errorResponse(res, error.message, 400);
  }
};

const unassignClassFromRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    // Validate ID
    const validation = validateObjectId(id, 'classRoomId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Unassigning class from room: ' + id);
    const room = await classRoomService.unassignClassFromRoom(id, userId);
    
    if (!room) {
      return notFoundResponse(res, 'Class room not found');
    }

    return successResponse(res, room, 'Class unassigned from room successfully');
  } catch (error) {
    logger.error('Error unassigning class from room:', error);
    return errorResponse(res, error.message, 400);
  }
};

const updateOccupancy = async (req, res) => {
  try {
    const { id } = req.params;
    const { occupancy } = req.body;

    // Validate ID and occupancy
    const errors = [];
    const validation = validateObjectId(id, 'classRoomId');
    if (!validation.valid) {
      errors.push(validation.error);
    }
    if (occupancy === undefined || occupancy === null) {
      errors.push({ field: 'occupancy', message: 'Occupancy is required' });
    } else if (isNaN(occupancy) || occupancy < 0 || occupancy > 500) {
      errors.push({ field: 'occupancy', message: 'Occupancy must be between 0 and 500' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Updating occupancy for room: ' + id);
    const room = await classRoomService.updateOccupancy(id, occupancy);
    
    if (!room) {
      return notFoundResponse(res, 'Class room not found');
    }

    return successResponse(res, room, 'Room occupancy updated successfully');
  } catch (error) {
    logger.error('Error updating occupancy:', error);
    return errorResponse(res, error.message, 400);
  }
};

const addMaintenanceSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, description, type } = req.body;

    // Validate ID
    const errors = [];
    const validation = validateObjectId(id, 'classRoomId');
    if (!validation.valid) {
      errors.push(validation.error);
    }

    // Validate maintenance schedule fields
    if (!startDate) {
      errors.push({ field: 'startDate', message: 'Start date is required' });
    } else if (isNaN(new Date(startDate).getTime())) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
    if (!endDate) {
      errors.push({ field: 'endDate', message: 'End date is required' });
    } else if (isNaN(new Date(endDate).getTime())) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.push({ field: 'dateRange', message: 'Start date must be before end date' });
    }
    if (!description || description.trim().length < 5) {
      errors.push({ field: 'description', message: 'Description is required and must be at least 5 characters' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Adding maintenance schedule for room: ' + id);
    const room = await classRoomService.addMaintenanceSchedule(id, req.body);
    
    if (!room) {
      return notFoundResponse(res, 'Class room not found');
    }

    return successResponse(res, room, 'Maintenance schedule added successfully');
  } catch (error) {
    logger.error('Error adding maintenance schedule:', error);
    return errorResponse(res, error.message, 400);
  }
};

const getClassRoomStatistics = async (req, res) => {
  try {
    const { institutionId, academicYear } = req.query;

    // Validate institutionId if provided
    const errors = [];
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching classroom statistics');
    const statistics = await classRoomService.getClassRoomStatistics(institutionId, academicYear);

    return successResponse(res, statistics, 'Class room statistics fetched successfully', {
      institutionId: institutionId || 'all',
      academicYear: academicYear || 'all'
    });
  } catch (error) {
    logger.error('Error fetching classroom statistics:', error);
    return errorResponse(res, 'Failed to fetch statistics', 500);
  }
};

const bulkUpdateStatus = async (req, res) => {
  try {
    const { roomIds, status } = req.body;
    const userId = req.user?.id || 'system';

    // Validate roomIds
    const errors = [];
    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      errors.push({ field: 'roomIds', message: 'roomIds must be a non-empty array' });
    } else if (roomIds.length > 100) {
      errors.push({ field: 'roomIds', message: 'Maximum 100 rooms allowed per request' });
    } else {
      roomIds.forEach((id, index) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ field: 'roomIds[' + index + ']', message: 'Invalid room ID' });
        }
      });
    }

    // Validate status
    if (!status) {
      errors.push({ field: 'status', message: 'Status is required' });
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Bulk updating status for ' + roomIds.length + ' classrooms');
    const result = await classRoomService.bulkUpdateStatus(roomIds, status, userId);
    
    return successResponse(res, result, roomIds.length + ' class rooms status updated successfully');
  } catch (error) {
    logger.error('Error bulk updating status:', error);
    return errorResponse(res, error.message, 400);
  }
};

const searchClassRooms = async (req, res) => {
  try {
    const { q, institutionId } = req.query;

    // Validate search query
    const errors = [];
    if (!q || q.trim().length === 0) {
      errors.push({ field: 'q', message: 'Search query is required' });
    } else if (q.trim().length < 2) {
      errors.push({ field: 'q', message: 'Search query must be at least 2 characters' });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Searching classrooms with query: ' + q);
    const rooms = await classRoomService.searchClassRooms(q, institutionId);
    
    return successResponse(res, rooms, 'Search completed successfully', {
      query: q,
      resultCount: rooms.length
    });
  } catch (error) {
    logger.error('Error searching classrooms:', error);
    return errorResponse(res, 'Failed to search class rooms', 500);
  }
};

/**
 * Export classrooms data
 */
const exportClassRooms = async (req, res) => {
  try {
    const { format = 'json', institutionId, status, roomType, building } = req.query;

    // Validate format
    const validFormats = ['json', 'csv', 'xlsx', 'pdf'];
    const errors = [];
    if (!validFormats.includes(format)) {
      errors.push({ field: 'format', message: 'Format must be one of: ' + validFormats.join(', ') });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    // Validate roomType if provided
    if (roomType && !VALID_ROOM_TYPES.includes(roomType)) {
      errors.push({ field: 'roomType', message: 'Room type must be one of: ' + VALID_ROOM_TYPES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Exporting classrooms data in format: ' + format);
    const data = await classRoomService.exportClassRooms({ institutionId, status, roomType, building, format });

    if (format === 'json') {
      return successResponse(res, data, 'Class rooms exported successfully', {
        format,
        recordCount: data.length
      });
    }

    return errorResponse(res, 'Export format ' + format + ' not yet implemented', 501);
  } catch (error) {
    logger.error('Error exporting classrooms:', error);
    return errorResponse(res, 'Failed to export class rooms', 500);
  }
};

/**
 * Get classroom utilization report
 */
const getClassRoomUtilization = async (req, res) => {
  try {
    const { institutionId, building, startDate, endDate } = req.query;

    // Validate institutionId if provided
    const errors = [];
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate date range if provided
    if (startDate && endDate) {
      if (isNaN(new Date(startDate).getTime()) || isNaN(new Date(endDate).getTime())) {
        errors.push({ field: 'dateRange', message: 'Invalid date format' });
      } else if (new Date(startDate) > new Date(endDate)) {
        errors.push({ field: 'dateRange', message: 'Start date must be before end date' });
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching classroom utilization report');
    const utilization = await classRoomService.getClassRoomUtilization({ institutionId, building, startDate, endDate });

    return successResponse(res, utilization, 'Utilization report generated successfully', {
      filters: { institutionId, building, startDate, endDate }
    });
  } catch (error) {
    logger.error('Error fetching utilization report:', error);
    return errorResponse(res, 'Failed to generate utilization report', 500);
  }
};

/**
 * Get classroom capacity analysis
 */
const getClassRoomCapacityAnalysis = async (req, res) => {
  try {
    const { institutionId, threshold = 80 } = req.query;

    // Validate threshold
    const errors = [];
    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum) || thresholdNum < 0 || thresholdNum > 100) {
      errors.push({ field: 'threshold', message: 'Threshold must be between 0 and 100' });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Generating classroom capacity analysis with threshold: ' + thresholdNum + '%');
    const analysis = await classRoomService.getClassRoomCapacityAnalysis({ institutionId, threshold: thresholdNum });

    return successResponse(res, analysis, 'Capacity analysis generated successfully', {
      threshold: thresholdNum
    });
  } catch (error) {
    logger.error('Error generating capacity analysis:', error);
    return errorResponse(res, 'Failed to generate capacity analysis', 500);
  }
};

/**
 * Bulk delete classrooms
 */
const bulkDeleteClassRooms = async (req, res) => {
  try {
    const { roomIds } = req.body;

    // Validate roomIds
    const errors = [];
    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      errors.push({ field: 'roomIds', message: 'roomIds must be a non-empty array' });
    } else if (roomIds.length > 100) {
      errors.push({ field: 'roomIds', message: 'Maximum 100 rooms allowed per request' });
    } else {
      roomIds.forEach((id, index) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ field: 'roomIds[' + index + ']', message: 'Invalid room ID' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Bulk deleting ' + roomIds.length + ' classrooms');
    const result = await classRoomService.bulkDeleteClassRooms(roomIds);

    return successResponse(res, result, result.deletedCount + ' class rooms deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting classrooms:', error);
    return errorResponse(res, 'Failed to bulk delete class rooms', 500);
  }
};

/**
 * Get classrooms by room type
 */
const getClassRoomsByType = async (req, res) => {
  try {
    const { roomType } = req.params;
    const { institutionId, page = 1, limit = 20 } = req.query;

    // Validate roomType
    const errors = [];
    if (!VALID_ROOM_TYPES.includes(roomType)) {
      errors.push({ field: 'roomType', message: 'Room type must be one of: ' + VALID_ROOM_TYPES.join(', ') });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
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

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching classrooms by type: ' + roomType);
    const result = await classRoomService.getClassRoomsByType(roomType, { institutionId, page: pageNum, limit: limitNum });

    return successResponse(res, result.rooms, 'Class rooms fetched successfully', {
      pagination: result.pagination,
      roomType
    });
  } catch (error) {
    logger.error('Error fetching classrooms by type:', error);
    return errorResponse(res, 'Failed to fetch class rooms', 500);
  }
};

/**
 * Get maintenance schedule for classrooms
 */
const getMaintenanceSchedule = async (req, res) => {
  try {
    const { institutionId, startDate, endDate, status } = req.query;

    // Validate institutionId if provided
    const errors = [];
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate date range if provided
    if (startDate && endDate) {
      if (isNaN(new Date(startDate).getTime()) || isNaN(new Date(endDate).getTime())) {
        errors.push({ field: 'dateRange', message: 'Invalid date format' });
      } else if (new Date(startDate) > new Date(endDate)) {
        errors.push({ field: 'dateRange', message: 'Start date must be before end date' });
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching maintenance schedule');
    const schedule = await classRoomService.getMaintenanceSchedule({ institutionId, startDate, endDate, status });

    return successResponse(res, schedule, 'Maintenance schedule fetched successfully', {
      filters: { institutionId, startDate, endDate, status }
    });
  } catch (error) {
    logger.error('Error fetching maintenance schedule:', error);
    return errorResponse(res, 'Failed to fetch maintenance schedule', 500);
  }
};

/**
 * Get classroom analytics
 */
const getClassRoomAnalytics = async (req, res) => {
  try {
    const { institutionId, groupBy = 'status' } = req.query;

    // Validate groupBy
    const validGroupBy = ['status', 'roomType', 'building', 'floor'];
    const errors = [];
    if (!validGroupBy.includes(groupBy)) {
      errors.push({ field: 'groupBy', message: 'groupBy must be one of: ' + validGroupBy.join(', ') });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching classroom analytics grouped by: ' + groupBy);
    const analytics = await classRoomService.getClassRoomAnalytics({ institutionId, groupBy });

    return successResponse(res, analytics, 'Class room analytics fetched successfully', {
      groupBy
    });
  } catch (error) {
    logger.error('Error fetching classroom analytics:', error);
    return errorResponse(res, 'Failed to fetch analytics', 500);
  }
};


export default {
  createClassRoom,
  getClassRoomById,
  getClassRoomByRoomId,
  getAllClassRooms,
  updateClassRoom,
  deleteClassRoom,
  getClassRoomsByInstitution,
  getClassRoomsByStatus,
  getAvailableClassRooms,
  getClassRoomsByBuilding,
  getClassRoomsByFloor,
  assignClassToRoom,
  unassignClassFromRoom,
  updateOccupancy,
  addMaintenanceSchedule,
  getClassRoomStatistics,
  bulkUpdateStatus,
  searchClassRooms,
  exportClassRooms,
  getClassRoomUtilization,
  getClassRoomCapacityAnalysis,
  bulkDeleteClassRooms,
  getClassRoomsByType,
  getMaintenanceSchedule,
  getClassRoomAnalytics
};
