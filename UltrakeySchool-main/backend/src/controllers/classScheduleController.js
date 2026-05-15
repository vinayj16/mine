import classScheduleService from '../services/classScheduleService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid schedule statuses
const VALID_STATUSES = ['active', 'cancelled', 'completed', 'pending', 'rescheduled'];

// Valid days of week
const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Valid time format (HH:MM)
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

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
 * Validate time format
 */
const validateTime = (time) => {
  return TIME_REGEX.test(time);
};

/**
 * Validate time range
 */
const validateTimeRange = (startTime, endTime) => {
  if (!validateTime(startTime) || !validateTime(endTime)) {
    return false;
  }
  const start = startTime.split(':').map(Number);
  const end = endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  return startMinutes < endMinutes;
};

const createSchedule = async (req, res) => {
  try {
    const { classId, teacherId, subjectId, day, startTime, endTime, roomId, status, institutionId } = req.body;

    // Validate required fields
    const errors = [];
    if (!classId) {
      errors.push({ field: 'classId', message: 'Class ID is required' });
    } else {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (!teacherId) {
      errors.push({ field: 'teacherId', message: 'Teacher ID is required' });
    } else {
      const validation = validateObjectId(teacherId, 'teacherId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (subjectId) {
      const validation = validateObjectId(subjectId, 'subjectId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (!day) {
      errors.push({ field: 'day', message: 'Day is required' });
    } else if (!VALID_DAYS.includes(day.toLowerCase())) {
      errors.push({ field: 'day', message: 'Day must be one of: ' + VALID_DAYS.join(', ') });
    }
    if (!startTime) {
      errors.push({ field: 'startTime', message: 'Start time is required' });
    } else if (!validateTime(startTime)) {
      errors.push({ field: 'startTime', message: 'Start time must be in HH:MM format' });
    }
    if (!endTime) {
      errors.push({ field: 'endTime', message: 'End time is required' });
    } else if (!validateTime(endTime)) {
      errors.push({ field: 'endTime', message: 'End time must be in HH:MM format' });
    }
    if (startTime && endTime && !validateTimeRange(startTime, endTime)) {
      errors.push({ field: 'timeRange', message: 'Start time must be before end time' });
    }
    if (roomId) {
      const validation = validateObjectId(roomId, 'roomId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
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

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const scheduleData = {
      ...req.body,
      metadata: { createdBy: req.user?.id || 'system' }
    };

    logger.info('Creating schedule for class ' + classId + ' on ' + day);
    const schedule = await classScheduleService.createSchedule(scheduleData);
    
    return createdResponse(res, schedule, 'Schedule created successfully');
  } catch (error) {
    logger.error('Error creating schedule:', error);
    return errorResponse(res, error.message, 400);
  }
};

const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const validation = validateObjectId(id, 'scheduleId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Fetching schedule by ID: ' + id);
    const schedule = await classScheduleService.getScheduleById(id);
    
    if (!schedule) {
      return notFoundResponse(res, 'Schedule not found');
    }

    return successResponse(res, schedule, 'Schedule fetched successfully');
  } catch (error) {
    logger.error('Error fetching schedule by ID:', error);
    return errorResponse(res, 'Failed to fetch schedule', 500);
  }
};

const getAllSchedules = async (req, res) => {
  try {
    const { className, section, day, status, teacherId, classId, academicYear, institutionId, search, page = 1, limit = 20, sortBy = 'day', sortOrder = 'asc' } = req.query;

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

    // Validate day if provided
    if (day && !VALID_DAYS.includes(day.toLowerCase())) {
      errors.push({ field: 'day', message: 'Day must be one of: ' + VALID_DAYS.join(', ') });
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    // Validate teacherId if provided
    if (teacherId) {
      const validation = validateObjectId(teacherId, 'teacherId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate classId if provided
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate sortOrder
    if (!['asc', 'desc'].includes(sortOrder)) {
      errors.push({ field: 'sortOrder', message: 'Sort order must be asc or desc' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = { className, section, day, status, teacherId, classId, academicYear, institutionId, search };
    const options = { page: pageNum, limit: limitNum, sortBy, sortOrder };

    logger.info('Fetching all schedules with filters');
    const result = await classScheduleService.getAllSchedules(filters, options);
    
    return successResponse(res, result.schedules, 'Schedules fetched successfully', {
      pagination: result.pagination,
      filters: filters
    });
  } catch (error) {
    logger.error('Error fetching all schedules:', error);
    return errorResponse(res, 'Failed to fetch schedules', 500);
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, startTime, endTime, status, teacherId, classId, roomId } = req.body;

    // Validate ID
    const errors = [];
    const validation = validateObjectId(id, 'scheduleId');
    if (!validation.valid) {
      errors.push(validation.error);
    }

    // Validate fields if provided
    if (day && !VALID_DAYS.includes(day.toLowerCase())) {
      errors.push({ field: 'day', message: 'Day must be one of: ' + VALID_DAYS.join(', ') });
    }
    if (startTime && !validateTime(startTime)) {
      errors.push({ field: 'startTime', message: 'Start time must be in HH:MM format' });
    }
    if (endTime && !validateTime(endTime)) {
      errors.push({ field: 'endTime', message: 'End time must be in HH:MM format' });
    }
    if (startTime && endTime && !validateTimeRange(startTime, endTime)) {
      errors.push({ field: 'timeRange', message: 'Start time must be before end time' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }
    if (teacherId) {
      const teacherValidation = validateObjectId(teacherId, 'teacherId');
      if (!teacherValidation.valid) {
        errors.push(teacherValidation.error);
      }
    }
    if (classId) {
      const classValidation = validateObjectId(classId, 'classId');
      if (!classValidation.valid) {
        errors.push(classValidation.error);
      }
    }
    if (roomId) {
      const roomValidation = validateObjectId(roomId, 'roomId');
      if (!roomValidation.valid) {
        errors.push(roomValidation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const updateData = { ...req.body, 'metadata.updatedBy': req.user?.id || 'system' };

    logger.info('Updating schedule: ' + id);
    const schedule = await classScheduleService.updateSchedule(id, updateData);
    
    if (!schedule) {
      return notFoundResponse(res, 'Schedule not found');
    }

    return successResponse(res, schedule, 'Schedule updated successfully');
  } catch (error) {
    logger.error('Error updating schedule:', error);
    return errorResponse(res, error.message, 400);
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const validation = validateObjectId(id, 'scheduleId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Deleting schedule: ' + id);
    const result = await classScheduleService.deleteSchedule(id);
    
    if (!result) {
      return notFoundResponse(res, 'Schedule not found');
    }

    return successResponse(res, null, 'Schedule deleted successfully');
  } catch (error) {
    logger.error('Error deleting schedule:', error);
    return errorResponse(res, error.message, 400);
  }
};

const getSchedulesByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { day } = req.query;

    // Validate classId
    const errors = [];
    const validation = validateObjectId(classId, 'classId');
    if (!validation.valid) {
      errors.push(validation.error);
    }

    // Validate day if provided
    if (day && !VALID_DAYS.includes(day.toLowerCase())) {
      errors.push({ field: 'day', message: 'Day must be one of: ' + VALID_DAYS.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching schedules for class: ' + classId);
    const schedules = await classScheduleService.getSchedulesByClass(classId, day);
    
    return successResponse(res, schedules, 'Schedules fetched successfully', {
      classId,
      day: day || 'all'
    });
  } catch (error) {
    logger.error('Error fetching schedules by class:', error);
    return errorResponse(res, 'Failed to fetch schedules', 500);
  }
};

const getSchedulesByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { day } = req.query;

    // Validate teacherId
    const errors = [];
    const validation = validateObjectId(teacherId, 'teacherId');
    if (!validation.valid) {
      errors.push(validation.error);
    }

    // Validate day if provided
    if (day && !VALID_DAYS.includes(day.toLowerCase())) {
      errors.push({ field: 'day', message: 'Day must be one of: ' + VALID_DAYS.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching schedules for teacher: ' + teacherId);
    const schedules = await classScheduleService.getSchedulesByTeacher(teacherId, day);
    
    return successResponse(res, schedules, 'Schedules fetched successfully', {
      teacherId,
      day: day || 'all'
    });
  } catch (error) {
    logger.error('Error fetching schedules by teacher:', error);
    return errorResponse(res, 'Failed to fetch schedules', 500);
  }
};

const getSchedulesByDay = async (req, res) => {
  try {
    const { day } = req.params;
    const { institutionId } = req.query;

    // Validate day
    const errors = [];
    if (!VALID_DAYS.includes(day.toLowerCase())) {
      errors.push({ field: 'day', message: 'Day must be one of: ' + VALID_DAYS.join(', ') });
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

    logger.info('Fetching schedules for day: ' + day);
    const schedules = await classScheduleService.getSchedulesByDay(day, institutionId);
    
    return successResponse(res, schedules, 'Schedules fetched successfully', {
      day,
      institutionId: institutionId || 'all'
    });
  } catch (error) {
    logger.error('Error fetching schedules by day:', error);
    return errorResponse(res, 'Failed to fetch schedules', 500);
  }
};

const getWeeklySchedule = async (req, res) => {
  try {
    const { classId } = req.params;

    // Validate classId
    const validation = validateObjectId(classId, 'classId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Fetching weekly schedule for class: ' + classId);
    const schedule = await classScheduleService.getWeeklySchedule(classId);
    
    return successResponse(res, schedule, 'Weekly schedule fetched successfully');
  } catch (error) {
    logger.error('Error fetching weekly schedule:', error);
    return errorResponse(res, 'Failed to fetch weekly schedule', 500);
  }
};

const getTeacherWeeklySchedule = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Validate teacherId
    const validation = validateObjectId(teacherId, 'teacherId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Fetching weekly schedule for teacher: ' + teacherId);
    const schedule = await classScheduleService.getTeacherWeeklySchedule(teacherId);
    
    return successResponse(res, schedule, 'Teacher weekly schedule fetched successfully');
  } catch (error) {
    logger.error('Error fetching teacher weekly schedule:', error);
    return errorResponse(res, 'Failed to fetch teacher weekly schedule', 500);
  }
};

const getScheduleStatistics = async (req, res) => {
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

    logger.info('Fetching schedule statistics');
    const statistics = await classScheduleService.getScheduleStatistics(institutionId, academicYear);

    return successResponse(res, statistics, 'Schedule statistics fetched successfully', {
      institutionId: institutionId || 'all',
      academicYear: academicYear || 'all'
    });
  } catch (error) {
    logger.error('Error fetching schedule statistics:', error);
    return errorResponse(res, 'Failed to fetch statistics', 500);
  }
};

const cancelSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    // Validate ID
    const validation = validateObjectId(id, 'scheduleId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Cancelling schedule: ' + id);
    const schedule = await classScheduleService.cancelSchedule(id, userId);
    
    if (!schedule) {
      return notFoundResponse(res, 'Schedule not found');
    }

    return successResponse(res, schedule, 'Schedule cancelled successfully');
  } catch (error) {
    logger.error('Error cancelling schedule:', error);
    return errorResponse(res, error.message, 400);
  }
};

const searchSchedules = async (req, res) => {
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

    logger.info('Searching schedules with query: ' + q);
    const schedules = await classScheduleService.searchSchedules(q, institutionId);
    
    return successResponse(res, schedules, 'Search completed successfully', {
      query: q,
      resultCount: schedules.length
    });
  } catch (error) {
    logger.error('Error searching schedules:', error);
    return errorResponse(res, 'Failed to search schedules', 500);
  }
};

/**
 * Export schedules data
 */
const exportSchedules = async (req, res) => {
  try {
    const { format = 'json', institutionId, classId, teacherId, day, status } = req.query;

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

    // Validate classId if provided
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate teacherId if provided
    if (teacherId) {
      const validation = validateObjectId(teacherId, 'teacherId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate day if provided
    if (day && !VALID_DAYS.includes(day.toLowerCase())) {
      errors.push({ field: 'day', message: 'Day must be one of: ' + VALID_DAYS.join(', ') });
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Exporting schedules data in format: ' + format);
    const data = await classScheduleService.exportSchedules({ institutionId, classId, teacherId, day, status, format });

    if (format === 'json') {
      return successResponse(res, data, 'Schedules exported successfully', {
        format,
        recordCount: data.length
      });
    }

    return errorResponse(res, 'Export format ' + format + ' not yet implemented', 501);
  } catch (error) {
    logger.error('Error exporting schedules:', error);
    return errorResponse(res, 'Failed to export schedules', 500);
  }
};

/**
 * Get schedule conflicts
 */
const getScheduleConflicts = async (req, res) => {
  try {
    const { institutionId, teacherId, classId, roomId } = req.query;

    // Validate IDs if provided
    const errors = [];
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (teacherId) {
      const validation = validateObjectId(teacherId, 'teacherId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (roomId) {
      const validation = validateObjectId(roomId, 'roomId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Checking for schedule conflicts');
    const conflicts = await classScheduleService.getScheduleConflicts({ institutionId, teacherId, classId, roomId });

    return successResponse(res, conflicts, 'Schedule conflicts fetched successfully', {
      conflictCount: conflicts.length
    });
  } catch (error) {
    logger.error('Error fetching schedule conflicts:', error);
    return errorResponse(res, 'Failed to fetch schedule conflicts', 500);
  }
};

/**
 * Bulk create schedules
 */
const bulkCreateSchedules = async (req, res) => {
  try {
    const { schedules } = req.body;
    const userId = req.user?.id || 'system';

    // Validate schedules
    const errors = [];
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      errors.push({ field: 'schedules', message: 'schedules must be a non-empty array' });
    } else if (schedules.length > 100) {
      errors.push({ field: 'schedules', message: 'Maximum 100 schedules allowed per request' });
    } else {
      schedules.forEach((schedule, index) => {
        if (!schedule.classId || !mongoose.Types.ObjectId.isValid(schedule.classId)) {
          errors.push({ field: 'schedules[' + index + '].classId', message: 'Invalid class ID' });
        }
        if (!schedule.teacherId || !mongoose.Types.ObjectId.isValid(schedule.teacherId)) {
          errors.push({ field: 'schedules[' + index + '].teacherId', message: 'Invalid teacher ID' });
        }
        if (!schedule.day || !VALID_DAYS.includes(schedule.day.toLowerCase())) {
          errors.push({ field: 'schedules[' + index + '].day', message: 'Invalid day' });
        }
        if (!schedule.startTime || !validateTime(schedule.startTime)) {
          errors.push({ field: 'schedules[' + index + '].startTime', message: 'Invalid start time format' });
        }
        if (!schedule.endTime || !validateTime(schedule.endTime)) {
          errors.push({ field: 'schedules[' + index + '].endTime', message: 'Invalid end time format' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Bulk creating ' + schedules.length + ' schedules');
    const result = await classScheduleService.bulkCreateSchedules(schedules, userId);

    return createdResponse(res, result, result.successful + ' schedules created successfully');
  } catch (error) {
    logger.error('Error bulk creating schedules:', error);
    return errorResponse(res, 'Failed to bulk create schedules', 500);
  }
};

/**
 * Bulk delete schedules
 */
const bulkDeleteSchedules = async (req, res) => {
  try {
    const { scheduleIds } = req.body;

    // Validate scheduleIds
    const errors = [];
    if (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
      errors.push({ field: 'scheduleIds', message: 'scheduleIds must be a non-empty array' });
    } else if (scheduleIds.length > 100) {
      errors.push({ field: 'scheduleIds', message: 'Maximum 100 schedules allowed per request' });
    } else {
      scheduleIds.forEach((id, index) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ field: 'scheduleIds[' + index + ']', message: 'Invalid schedule ID' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Bulk deleting ' + scheduleIds.length + ' schedules');
    const result = await classScheduleService.bulkDeleteSchedules(scheduleIds);

    return successResponse(res, result, result.deletedCount + ' schedules deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting schedules:', error);
    return errorResponse(res, 'Failed to bulk delete schedules', 500);
  }
};

/**
 * Get schedule analytics
 */
const getScheduleAnalytics = async (req, res) => {
  try {
    const { institutionId, groupBy = 'day' } = req.query;

    // Validate groupBy
    const validGroupBy = ['day', 'teacher', 'class', 'status', 'subject'];
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

    logger.info('Fetching schedule analytics grouped by: ' + groupBy);
    const analytics = await classScheduleService.getScheduleAnalytics({ institutionId, groupBy });

    return successResponse(res, analytics, 'Schedule analytics fetched successfully', {
      groupBy
    });
  } catch (error) {
    logger.error('Error fetching schedule analytics:', error);
    return errorResponse(res, 'Failed to fetch analytics', 500);
  }
};

/**
 * Reschedule a class
 */
const rescheduleClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDay, newStartTime, newEndTime, reason } = req.body;
    const userId = req.user?.id || 'system';

    // Validate ID
    const errors = [];
    const validation = validateObjectId(id, 'scheduleId');
    if (!validation.valid) {
      errors.push(validation.error);
    }

    // Validate new schedule details
    if (!newDay) {
      errors.push({ field: 'newDay', message: 'New day is required' });
    } else if (!VALID_DAYS.includes(newDay.toLowerCase())) {
      errors.push({ field: 'newDay', message: 'Day must be one of: ' + VALID_DAYS.join(', ') });
    }
    if (!newStartTime) {
      errors.push({ field: 'newStartTime', message: 'New start time is required' });
    } else if (!validateTime(newStartTime)) {
      errors.push({ field: 'newStartTime', message: 'Start time must be in HH:MM format' });
    }
    if (!newEndTime) {
      errors.push({ field: 'newEndTime', message: 'New end time is required' });
    } else if (!validateTime(newEndTime)) {
      errors.push({ field: 'newEndTime', message: 'End time must be in HH:MM format' });
    }
    if (newStartTime && newEndTime && !validateTimeRange(newStartTime, newEndTime)) {
      errors.push({ field: 'timeRange', message: 'Start time must be before end time' });
    }
    if (!reason || reason.trim().length < 5) {
      errors.push({ field: 'reason', message: 'Reason is required and must be at least 5 characters' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Rescheduling class: ' + id);
    const schedule = await classScheduleService.rescheduleClass(id, { newDay, newStartTime, newEndTime, reason }, userId);

    if (!schedule) {
      return notFoundResponse(res, 'Schedule not found');
    }

    return successResponse(res, schedule, 'Class rescheduled successfully');
  } catch (error) {
    logger.error('Error rescheduling class:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Get teacher workload
 */
const getTeacherWorkload = async (req, res) => {
  try {
    const { institutionId, startDate, endDate } = req.query;

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

    logger.info('Fetching teacher workload report');
    const workload = await classScheduleService.getTeacherWorkload({ institutionId, startDate, endDate });

    return successResponse(res, workload, 'Teacher workload fetched successfully');
  } catch (error) {
    logger.error('Error fetching teacher workload:', error);
    return errorResponse(res, 'Failed to fetch teacher workload', 500);
  }
};


export default {
  createSchedule,
  getScheduleById,
  getAllSchedules,
  updateSchedule,
  deleteSchedule,
  getSchedulesByClass,
  getSchedulesByTeacher,
  getSchedulesByDay,
  getWeeklySchedule,
  getTeacherWeeklySchedule,
  getScheduleStatistics,
  cancelSchedule,
  searchSchedules,
  exportSchedules,
  getScheduleConflicts,
  bulkCreateSchedules,
  bulkDeleteSchedules,
  getScheduleAnalytics,
  rescheduleClass,
  getTeacherWorkload
};
