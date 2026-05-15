import scheduleService from '../services/scheduleService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_TYPES = ['class', 'exam', 'meeting', 'event', 'activity', 'assignment', 'holiday', 'other'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'];
const VALID_RECURRENCE_TYPES = ['none', 'daily', 'weekly', 'monthly', 'yearly'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf', 'ical'];
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_LOCATION_LENGTH = 200;

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

// Helper function to validate time format (HH:MM)
const validateTime = (time, fieldName = 'Time') => {
  if (!time) {
    return fieldName + ' is required';
  }
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return 'Invalid ' + fieldName + ' format. Expected HH:MM';
  }
  return null;
};

// Get all schedules
export const getSchedules = async (req, res) => {
  try {
    logger.info('Fetching schedules');
    
    const {
      type,
      priority,
      status,
      search,
      limit,
      skip,
      page,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      schoolId
    } = req.query;

    const userSchoolId = req.user?.schoolId || schoolId;
    
    // Validation
    const errors = [];
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skipNum = parseInt(skip) || (pageNum - 1) * limitNum;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (type && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (startDate && endDate) {
      const dateErrors = validateDateRange(startDate, endDate);
      errors.push(...dateErrors);
    }
    
    if (userSchoolId) {
      const schoolIdError = validateObjectId(userSchoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const options = {
      type,
      priority,
      status,
      search,
      limit: limitNum,
      skip: skipNum,
      sortBy: sortBy || 'date',
      sortOrder: sortOrder || 'asc'
    };

    if (startDate && endDate) {
      options.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    const result = await scheduleService.getSchedules(userSchoolId, options);
    
    logger.info('Schedules fetched successfully');
    return successResponse(res, {
      schedules: result.schedules || result,
      pagination: result.pagination || {
        page: pageNum,
        limit: limitNum,
        total: result.length || 0
      }
    }, 'Schedules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching schedules:', error);
    return errorResponse(res, error.message);
  }
};

// Get schedule by ID
export const getScheduleById = async (req, res) => {
  try {
    logger.info('Fetching schedule by ID');
    
    const { id } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const schedule = await scheduleService.getScheduleById(schoolId, id);
    
    if (!schedule) {
      return notFoundResponse(res, 'Schedule not found');
    }
    
    logger.info('Schedule fetched successfully:', { scheduleId: id });
    return successResponse(res, schedule, 'Schedule retrieved successfully');
  } catch (error) {
    logger.error('Error fetching schedule:', error);
    if (error.message === 'Schedule not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

// Get user schedules
export const getUserSchedules = async (req, res) => {
  try {
    logger.info('Fetching user schedules');
    
    const { userId } = req.params;
    const { status, limit, page, startDate, endDate } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
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
    
    if (startDate && endDate) {
      const dateErrors = validateDateRange(startDate, endDate);
      errors.push(...dateErrors);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const options = {
      status,
      limit: limitNum,
      page: pageNum
    };

    if (startDate && endDate) {
      options.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    const result = await scheduleService.getUserSchedules(schoolId, userId, options);
    
    logger.info('User schedules fetched successfully:', { userId, count: result.schedules?.length || result.length });
    return successResponse(res, {
      schedules: result.schedules || result,
      pagination: result.pagination
    }, 'User schedules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user schedules:', error);
    return errorResponse(res, error.message);
  }
};

// Create schedule
export const createSchedule = async (req, res) => {
  try {
    logger.info('Creating schedule');
    
    const schoolId = req.user?.schoolId;
    const { title, description, type, priority, status, date, startTime, endTime, location, participants, recurrence } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (!type) {
      errors.push('Type is required');
    } else if (!VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    const dateError = validateDate(date, 'Date');
    if (dateError) errors.push(dateError);
    
    if (startTime) {
      const startTimeError = validateTime(startTime, 'Start time');
      if (startTimeError) errors.push(startTimeError);
    }
    
    if (endTime) {
      const endTimeError = validateTime(endTime, 'End time');
      if (endTimeError) errors.push(endTimeError);
    }
    
    if (location && location.length > MAX_LOCATION_LENGTH) {
      errors.push('Location must not exceed ' + MAX_LOCATION_LENGTH + ' characters');
    }
    
    if (participants) {
      if (!Array.isArray(participants)) {
        errors.push('Participants must be an array');
      } else {
        for (const participantId of participants) {
          const participantError = validateObjectId(participantId, 'Participant ID');
          if (participantError) {
            errors.push(participantError);
            break;
          }
        }
      }
    }
    
    if (recurrence && !VALID_RECURRENCE_TYPES.includes(recurrence)) {
      errors.push('Invalid recurrence type. Must be one of: ' + VALID_RECURRENCE_TYPES.join(', '));
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const scheduleData = {
      ...req.body,
      metadata: { createdBy: userId || 'system' }
    };

    const schedule = await scheduleService.createSchedule(schoolId, scheduleData);
    
    logger.info('Schedule created successfully:', { scheduleId: schedule._id, title });
    return createdResponse(res, schedule, 'Schedule created successfully');
  } catch (error) {
    logger.error('Error creating schedule:', error);
    return errorResponse(res, error.message);
  }
};

// Update schedule
export const updateSchedule = async (req, res) => {
  try {
    logger.info('Updating schedule');
    
    const { id } = req.params;
    const schoolId = req.user?.schoolId;
    const { title, description, type, priority, status, date, startTime, endTime, location, recurrence } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        errors.push('Title cannot be empty');
      } else if (title.length > MAX_TITLE_LENGTH) {
        errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (type !== undefined && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (date !== undefined) {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (startTime !== undefined) {
      const startTimeError = validateTime(startTime, 'Start time');
      if (startTimeError) errors.push(startTimeError);
    }
    
    if (endTime !== undefined) {
      const endTimeError = validateTime(endTime, 'End time');
      if (endTimeError) errors.push(endTimeError);
    }
    
    if (location !== undefined && location.length > MAX_LOCATION_LENGTH) {
      errors.push('Location must not exceed ' + MAX_LOCATION_LENGTH + ' characters');
    }
    
    if (recurrence !== undefined && !VALID_RECURRENCE_TYPES.includes(recurrence)) {
      errors.push('Invalid recurrence type. Must be one of: ' + VALID_RECURRENCE_TYPES.join(', '));
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const updateData = { ...req.body, 'metadata.updatedBy': userId || 'system' };
    const schedule = await scheduleService.updateSchedule(schoolId, id, updateData);
    
    if (!schedule) {
      return notFoundResponse(res, 'Schedule not found');
    }
    
    logger.info('Schedule updated successfully:', { scheduleId: id });
    return successResponse(res, schedule, 'Schedule updated successfully');
  } catch (error) {
    logger.error('Error updating schedule:', error);
    if (error.message === 'Schedule not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

// Delete schedule
export const deleteSchedule = async (req, res) => {
  try {
    logger.info('Deleting schedule');
    
    const { id } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    await scheduleService.deleteSchedule(schoolId, id);
    
    logger.info('Schedule deleted successfully:', { scheduleId: id });
    return successResponse(res, null, 'Schedule deleted successfully');
  } catch (error) {
    logger.error('Error deleting schedule:', error);
    if (error.message === 'Schedule not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

// Set reminder
export const setReminder = async (req, res) => {
  try {
    logger.info('Setting reminder for schedule');
    
    const { id } = req.params;
    const { reminderTime } = req.body;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    const reminderError = validateDate(reminderTime, 'Reminder time');
    if (reminderError) errors.push(reminderError);
    
    if (reminderTime && new Date(reminderTime) < new Date()) {
      errors.push('Reminder time must be in the future');
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const schedule = await scheduleService.setReminder(schoolId, id, userId, new Date(reminderTime));
    
    if (!schedule) {
      return notFoundResponse(res, 'Schedule not found');
    }
    
    logger.info('Reminder set successfully:', { scheduleId: id, reminderTime });
    return successResponse(res, schedule, 'Reminder set successfully');
  } catch (error) {
    logger.error('Error setting reminder:', error);
    if (error.message === 'Schedule not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

// Add participant
export const addParticipant = async (req, res) => {
  try {
    logger.info('Adding participant to schedule');
    
    const { id } = req.params;
    const { userId } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const schedule = await scheduleService.addParticipant(schoolId, id, userId);
    
    if (!schedule) {
      return notFoundResponse(res, 'Schedule not found');
    }
    
    logger.info('Participant added successfully:', { scheduleId: id, userId });
    return successResponse(res, schedule, 'Participant added successfully');
  } catch (error) {
    logger.error('Error adding participant:', error);
    if (error.message.includes('not found')) {
      return notFoundResponse(res, error.message);
    }
    if (error.message.includes('already')) {
      return errorResponse(res, error.message, 400);
    }
    return errorResponse(res, error.message);
  }
};

// Remove participant
export const removeParticipant = async (req, res) => {
  try {
    logger.info('Removing participant from schedule');
    
    const { id, userId } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const schedule = await scheduleService.removeParticipant(schoolId, id, userId);
    
    if (!schedule) {
      return notFoundResponse(res, 'Schedule not found');
    }
    
    logger.info('Participant removed successfully:', { scheduleId: id, userId });
    return successResponse(res, schedule, 'Participant removed successfully');
  } catch (error) {
    logger.error('Error removing participant:', error);
    if (error.message === 'Schedule not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

// Get upcoming schedules
export const getUpcomingSchedules = async (req, res) => {
  try {
    logger.info('Fetching upcoming schedules');
    
    const { limit, page, type, priority } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (type && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await scheduleService.getUpcomingSchedules(schoolId, limitNum, { type, priority });
    
    logger.info('Upcoming schedules fetched successfully:', { count: result.schedules?.length || result.length });
    return successResponse(res, {
      schedules: result.schedules || result,
      pagination: result.pagination
    }, 'Upcoming schedules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching upcoming schedules:', error);
    return errorResponse(res, error.message);
  }
};


// Get schedules by type
const getSchedulesByType = async (req, res) => {
  try {
    logger.info('Fetching schedules by type');
    
    const { type } = req.params;
    const { status, page, limit } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!type) {
      errors.push('Type is required');
    } else if (!VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
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
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await scheduleService.getSchedulesByType(schoolId, type, { status, page: pageNum, limit: limitNum });
    
    logger.info('Schedules fetched by type successfully:', { type, count: result.schedules?.length || result.length });
    return successResponse(res, {
      schedules: result.schedules || result,
      pagination: result.pagination
    }, 'Schedules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching schedules by type:', error);
    return errorResponse(res, error.message);
  }
};

// Get schedules by priority
const getSchedulesByPriority = async (req, res) => {
  try {
    logger.info('Fetching schedules by priority');
    
    const { priority } = req.params;
    const { status, page, limit } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!priority) {
      errors.push('Priority is required');
    } else if (!VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
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
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await scheduleService.getSchedulesByPriority(schoolId, priority, { status, page: pageNum, limit: limitNum });
    
    logger.info('Schedules fetched by priority successfully:', { priority, count: result.schedules?.length || result.length });
    return successResponse(res, {
      schedules: result.schedules || result,
      pagination: result.pagination
    }, 'Schedules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching schedules by priority:', error);
    return errorResponse(res, error.message);
  }
};

// Get schedules by status
const getSchedulesByStatus = async (req, res) => {
  try {
    logger.info('Fetching schedules by status');
    
    const { status } = req.params;
    const { type, page, limit } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (type && !VALID_TYPES.includes(type)) {
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
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await scheduleService.getSchedulesByStatus(schoolId, status, { type, page: pageNum, limit: limitNum });
    
    logger.info('Schedules fetched by status successfully:', { status, count: result.schedules?.length || result.length });
    return successResponse(res, {
      schedules: result.schedules || result,
      pagination: result.pagination
    }, 'Schedules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching schedules by status:', error);
    return errorResponse(res, error.message);
  }
};

// Update schedule status
const updateScheduleStatus = async (req, res) => {
  try {
    logger.info('Updating schedule status');
    
    const { id } = req.params;
    const { status } = req.body;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schedule = await scheduleService.updateScheduleStatus(schoolId, id, status, userId || 'system');
    
    if (!schedule) {
      return notFoundResponse(res, 'Schedule not found');
    }
    
    logger.info('Schedule status updated successfully:', { scheduleId: id, status });
    return successResponse(res, schedule, 'Schedule status updated successfully');
  } catch (error) {
    logger.error('Error updating schedule status:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update schedules
const bulkUpdateSchedules = async (req, res) => {
  try {
    logger.info('Bulk updating schedules');
    
    const { scheduleIds, updates } = req.body;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!scheduleIds || !Array.isArray(scheduleIds)) {
      errors.push('Schedule IDs must be an array');
    } else if (scheduleIds.length === 0) {
      errors.push('Schedule IDs array cannot be empty');
    } else if (scheduleIds.length > 100) {
      errors.push('Cannot update more than 100 schedules at once');
    } else {
      for (const id of scheduleIds) {
        const idError = validateObjectId(id, 'Schedule ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates must be an object');
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updateData = { ...updates, 'metadata.updatedBy': userId || 'system' };
    const result = await scheduleService.bulkUpdateSchedules(schoolId, scheduleIds, updateData);
    
    logger.info('Schedules bulk updated successfully:', { count: result.modifiedCount });
    return successResponse(res, result, 'Schedules updated successfully');
  } catch (error) {
    logger.error('Error bulk updating schedules:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete schedules
const bulkDeleteSchedules = async (req, res) => {
  try {
    logger.info('Bulk deleting schedules');
    
    const { scheduleIds } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!scheduleIds || !Array.isArray(scheduleIds)) {
      errors.push('Schedule IDs must be an array');
    } else if (scheduleIds.length === 0) {
      errors.push('Schedule IDs array cannot be empty');
    } else if (scheduleIds.length > 100) {
      errors.push('Cannot delete more than 100 schedules at once');
    } else {
      for (const id of scheduleIds) {
        const idError = validateObjectId(id, 'Schedule ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await scheduleService.bulkDeleteSchedules(schoolId, scheduleIds);
    
    logger.info('Schedules bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Schedules deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting schedules:', error);
    return errorResponse(res, error.message);
  }
};

// Export schedules
const exportSchedules = async (req, res) => {
  try {
    logger.info('Exporting schedules');
    
    const { format, type, priority, status, startDate, endDate } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (type && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (startDate && endDate) {
      const dateErrors = validateDateRange(startDate, endDate);
      errors.push(...dateErrors);
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await scheduleService.exportSchedules(schoolId, {
      format: format.toLowerCase(),
      type,
      priority,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });
    
    logger.info('Schedules exported successfully:', { format });
    return successResponse(res, exportData, 'Schedules exported successfully');
  } catch (error) {
    logger.error('Error exporting schedules:', error);
    return errorResponse(res, error.message);
  }
};

// Get schedule statistics
const getScheduleStatistics = async (req, res) => {
  try {
    logger.info('Fetching schedule statistics');
    
    const { startDate, endDate } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (startDate && endDate) {
      const dateErrors = validateDateRange(startDate, endDate);
      errors.push(...dateErrors);
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await scheduleService.getScheduleStatistics(schoolId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });
    
    logger.info('Schedule statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching schedule statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get schedule analytics
const getScheduleAnalytics = async (req, res) => {
  try {
    logger.info('Fetching schedule analytics');
    
    const { startDate, endDate, groupBy } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (startDate && endDate) {
      const dateErrors = validateDateRange(startDate, endDate);
      errors.push(...dateErrors);
    }
    
    if (groupBy && !['day', 'week', 'month', 'year', 'type', 'priority', 'status'].includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: day, week, month, year, type, priority, status');
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await scheduleService.getScheduleAnalytics(schoolId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      groupBy: groupBy || 'type'
    });
    
    logger.info('Schedule analytics fetched successfully');
    return successResponse(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching schedule analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Search schedules
const searchSchedules = async (req, res) => {
  try {
    logger.info('Searching schedules');
    
    const { q, type, priority, status } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (type && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schedules = await scheduleService.searchSchedules(schoolId, q, { type, priority, status });
    
    logger.info('Schedules searched successfully:', { query: q, count: schedules.length });
    return successResponse(res, schedules, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching schedules:', error);
    return errorResponse(res, error.message);
  }
};

// Clone schedule
const cloneSchedule = async (req, res) => {
  try {
    logger.info('Cloning schedule');
    
    const { id } = req.params;
    const { date } = req.body;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    if (date) {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schedule = await scheduleService.cloneSchedule(schoolId, id, date ? new Date(date) : undefined, userId || 'system');
    
    logger.info('Schedule cloned successfully:', { originalId: id, newId: schedule._id });
    return createdResponse(res, schedule, 'Schedule cloned successfully');
  } catch (error) {
    logger.error('Error cloning schedule:', error);
    return errorResponse(res, error.message);
  }
};

// Get conflicting schedules
const getConflictingSchedules = async (req, res) => {
  try {
    logger.info('Fetching conflicting schedules');
    
    const { date, startTime, endTime, participants } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const dateError = validateDate(date, 'Date');
    if (dateError) errors.push(dateError);
    
    const startTimeError = validateTime(startTime, 'Start time');
    if (startTimeError) errors.push(startTimeError);
    
    const endTimeError = validateTime(endTime, 'End time');
    if (endTimeError) errors.push(endTimeError);
    
    if (!participants) {
      errors.push('Participants are required');
    } else {
      try {
        const participantIds = JSON.parse(participants);
        if (!Array.isArray(participantIds)) {
          errors.push('Participants must be an array');
        } else {
          for (const participantId of participantIds) {
            const participantError = validateObjectId(participantId, 'Participant ID');
            if (participantError) {
              errors.push(participantError);
              break;
            }
          }
        }
      } catch (e) {
        errors.push('Invalid participants format');
      }
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const participantIds = JSON.parse(participants);
    const conflicts = await scheduleService.getConflictingSchedules(schoolId, {
      date: new Date(date),
      startTime,
      endTime,
      participants: participantIds
    });
    
    logger.info('Conflicting schedules fetched successfully:', { count: conflicts.length });
    return successResponse(res, conflicts, 'Conflicting schedules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching conflicting schedules:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk add participants
const bulkAddParticipants = async (req, res) => {
  try {
    logger.info('Bulk adding participants to schedule');
    
    const { id } = req.params;
    const { userIds } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    if (!userIds || !Array.isArray(userIds)) {
      errors.push('User IDs must be an array');
    } else if (userIds.length === 0) {
      errors.push('User IDs array cannot be empty');
    } else if (userIds.length > 100) {
      errors.push('Cannot add more than 100 participants at once');
    } else {
      for (const userId of userIds) {
        const userIdError = validateObjectId(userId, 'User ID');
        if (userIdError) {
          errors.push(userIdError);
          break;
        }
      }
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schedule = await scheduleService.bulkAddParticipants(schoolId, id, userIds);
    
    logger.info('Participants bulk added successfully:', { scheduleId: id, count: userIds.length });
    return successResponse(res, schedule, 'Participants added successfully');
  } catch (error) {
    logger.error('Error bulk adding participants:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getSchedules,
  getScheduleById,
  getUserSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  setReminder,
  addParticipant,
  removeParticipant,
  getUpcomingSchedules,
  getSchedulesByType,
  getSchedulesByPriority,
  getSchedulesByStatus,
  updateScheduleStatus,
  bulkUpdateSchedules,
  bulkDeleteSchedules,
  exportSchedules,
  getScheduleStatistics,
  getScheduleAnalytics,
  searchSchedules,
  cloneSchedule,
  getConflictingSchedules,
  bulkAddParticipants
};
