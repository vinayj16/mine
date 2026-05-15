import calendarService from '../services/calendarService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid entity types
const VALID_ENTITY_TYPES = ['exam', 'holiday', 'event', 'meeting', 'class', 'assignment', 'deadline'];

// Valid event statuses
const VALID_EVENT_STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'];

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { field: fieldName, message: `Invalid ${fieldName} format` } };
  }
  return { valid: true };
};

/**
 * Validate date
 */
const validateDate = (date) => {
  const d = new Date(date);
  return !isNaN(d.getTime());
};

/**
 * Validate date range
 */
const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end && !isNaN(start.getTime()) && !isNaN(end.getTime());
};

const getCalendarEvents = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { startDate, endDate, entityTypes, status, search, page = 1, limit = 50 } = req.query;
    
    // Validate schoolId
    const validation = validateObjectId(schoolId, 'schoolId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate required date range
    if (!startDate || !endDate) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Start date and end date are required' }]);
    }

    // Validate date range
    if (!validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Invalid date range. Start date must be before end date' }]);
    }

    // Validate entity types if provided
    if (entityTypes) {
      const types = entityTypes.split(',');
      const invalidTypes = types.filter(t => !VALID_ENTITY_TYPES.includes(t));
      if (invalidTypes.length > 0) {
        return validationErrorResponse(res, [{ field: 'entityTypes', message: 'Invalid entity types: ' + invalidTypes.join(', ') }]);
      }
    }

    // Validate status if provided
    if (status && !VALID_EVENT_STATUSES.includes(status)) {
      return validationErrorResponse(res, [{ field: 'status', message: 'Status must be one of: ' + VALID_EVENT_STATUSES.join(', ') }]);
    }

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return validationErrorResponse(res, [{ field: 'page', message: 'Page must be a positive integer' }]);
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return validationErrorResponse(res, [{ field: 'limit', message: 'Limit must be between 1 and 100' }]);
    }

    const filters = {};
    if (entityTypes) filters.entityTypes = entityTypes.split(',');
    if (status) filters.status = status;
    if (search) filters.search = search;

    logger.info(`Fetching calendar events for school ${schoolId} from ${startDate} to ${endDate}`);
    const result = await calendarService.getCalendarEvents(schoolId, startDate, endDate, {
      ...filters,
      page: pageNum,
      limit: limitNum
    });

    return successResponse(res, result.events, 'Calendar events fetched successfully', {
      pagination: result.pagination,
      dateRange: { startDate, endDate },
      filters
    });
  } catch (error) {
    logger.error('Error fetching calendar events:', error);
    next(error);
  }
};

const getCalendarAnalytics = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    // Validate schoolId
    const validation = validateObjectId(schoolId, 'schoolId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate required date range
    if (!startDate || !endDate) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Start date and end date are required' }]);
    }

    // Validate date range
    if (!validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Invalid date range. Start date must be before end date' }]);
    }

    // Validate groupBy
    const validGroupBy = ['day', 'week', 'month'];
    if (!validGroupBy.includes(groupBy)) {
      return validationErrorResponse(res, [{ field: 'groupBy', message: 'groupBy must be one of: ' + validGroupBy.join(', ') }]);
    }

    logger.info(`Fetching calendar analytics for school ${schoolId}`);
    const analytics = await calendarService.getCalendarAnalytics(schoolId, startDate, endDate, { groupBy });

    return successResponse(res, analytics, 'Calendar analytics fetched successfully', {
      dateRange: { startDate, endDate },
      groupBy
    });
  } catch (error) {
    logger.error('Error fetching calendar analytics:', error);
    next(error);
  }
};


/**
 * Create calendar event
 */
const createCalendarEvent = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { title, description, entityType, startDate, endDate, location, attendees, isAllDay } = req.body;
    const createdBy = req.user?.id;

    // Validate schoolId
    const validation = validateObjectId(schoolId, 'schoolId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate required fields
    const errors = [];
    if (!title || title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Title is required and must be at least 3 characters' });
    }
    if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
      errors.push({ field: 'entityType', message: 'Entity type must be one of: ' + VALID_ENTITY_TYPES.join(', ') });
    }
    if (!startDate || !validateDate(startDate)) {
      errors.push({ field: 'startDate', message: 'Valid start date is required' });
    }
    if (!endDate || !validateDate(endDate)) {
      errors.push({ field: 'endDate', message: 'Valid end date is required' });
    }
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      errors.push({ field: 'dateRange', message: 'Start date must be before end date' });
    }

    // Validate attendees if provided
    if (attendees && Array.isArray(attendees)) {
      const invalidAttendees = attendees.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidAttendees.length > 0) {
        errors.push({ field: 'attendees', message: 'One or more attendee IDs are invalid' });
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Creating calendar event for school ${schoolId}`);
    const event = await calendarService.createCalendarEvent(schoolId, {
      title,
      description,
      entityType,
      startDate,
      endDate,
      location,
      attendees,
      isAllDay,
      createdBy
    });

    return createdResponse(res, event, 'Calendar event created successfully');
  } catch (error) {
    logger.error('Error creating calendar event:', error);
    next(error);
  }
};

/**
 * Update calendar event
 */
const updateCalendarEvent = async (req, res, next) => {
  try {
    const { schoolId, eventId } = req.params;
    const { title, description, startDate, endDate, location, status } = req.body;
    const updatedBy = req.user?.id;

    // Validate IDs
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      return validationErrorResponse(res, [schoolValidation.error]);
    }
    const eventValidation = validateObjectId(eventId, 'eventId');
    if (!eventValidation.valid) {
      return validationErrorResponse(res, [eventValidation.error]);
    }

    // Validate fields if provided
    const errors = [];
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      errors.push({ field: 'dateRange', message: 'Start date must be before end date' });
    }
    if (status && !VALID_EVENT_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_EVENT_STATUSES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Updating calendar event ${eventId}`);
    const event = await calendarService.updateCalendarEvent(schoolId, eventId, {
      title,
      description,
      startDate,
      endDate,
      location,
      status,
      updatedBy
    });

    if (!event) {
      return notFoundResponse(res, 'Calendar event not found');
    }

    return successResponse(res, event, 'Calendar event updated successfully');
  } catch (error) {
    logger.error('Error updating calendar event:', error);
    next(error);
  }
};

/**
 * Delete calendar event
 */
const deleteCalendarEvent = async (req, res, next) => {
  try {
    const { schoolId, eventId } = req.params;

    // Validate IDs
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      return validationErrorResponse(res, [schoolValidation.error]);
    }
    const eventValidation = validateObjectId(eventId, 'eventId');
    if (!eventValidation.valid) {
      return validationErrorResponse(res, [eventValidation.error]);
    }

    logger.info(`Deleting calendar event ${eventId}`);
    const result = await calendarService.deleteCalendarEvent(schoolId, eventId);

    if (!result) {
      return notFoundResponse(res, 'Calendar event not found');
    }

    return successResponse(res, null, 'Calendar event deleted successfully');
  } catch (error) {
    logger.error('Error deleting calendar event:', error);
    next(error);
  }
};

/**
 * Get calendar event by ID
 */
const getCalendarEventById = async (req, res, next) => {
  try {
    const { schoolId, eventId } = req.params;

    // Validate IDs
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      return validationErrorResponse(res, [schoolValidation.error]);
    }
    const eventValidation = validateObjectId(eventId, 'eventId');
    if (!eventValidation.valid) {
      return validationErrorResponse(res, [eventValidation.error]);
    }

    logger.info(`Fetching calendar event ${eventId}`);
    const event = await calendarService.getCalendarEventById(schoolId, eventId);

    if (!event) {
      return notFoundResponse(res, 'Calendar event not found');
    }

    return successResponse(res, event, 'Calendar event fetched successfully');
  } catch (error) {
    logger.error('Error fetching calendar event:', error);
    next(error);
  }
};

/**
 * Get upcoming events
 */
const getUpcomingEvents = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { days = 7, entityTypes, limit = 10 } = req.query;

    // Validate schoolId
    const validation = validateObjectId(schoolId, 'schoolId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate days
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return validationErrorResponse(res, [{ field: 'days', message: 'Days must be between 1 and 365' }]);
    }

    // Validate limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return validationErrorResponse(res, [{ field: 'limit', message: 'Limit must be between 1 and 100' }]);
    }

    // Validate entity types if provided
    if (entityTypes) {
      const types = entityTypes.split(',');
      const invalidTypes = types.filter(t => !VALID_ENTITY_TYPES.includes(t));
      if (invalidTypes.length > 0) {
        return validationErrorResponse(res, [{ field: 'entityTypes', message: 'Invalid entity types: ' + invalidTypes.join(', ') }]);
      }
    }

    logger.info(`Fetching upcoming events for school ${schoolId}, next ${daysNum} days`);
    const events = await calendarService.getUpcomingEvents(schoolId, {
      days: daysNum,
      entityTypes: entityTypes ? entityTypes.split(',') : null,
      limit: limitNum
    });

    return successResponse(res, events, 'Upcoming events fetched successfully', {
      days: daysNum,
      limit: limitNum
    });
  } catch (error) {
    logger.error('Error fetching upcoming events:', error);
    next(error);
  }
};

/**
 * Export calendar events
 */
const exportCalendarEvents = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { startDate, endDate, format = 'json', entityTypes } = req.query;

    // Validate schoolId
    const validation = validateObjectId(schoolId, 'schoolId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate required date range
    if (!startDate || !endDate) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Start date and end date are required' }]);
    }

    // Validate date range
    if (!validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Invalid date range' }]);
    }

    // Validate format
    const validFormats = ['json', 'csv', 'ical', 'xlsx'];
    if (!validFormats.includes(format)) {
      return validationErrorResponse(res, [{ field: 'format', message: 'Format must be one of: ' + validFormats.join(', ') }]);
    }

    logger.info(`Exporting calendar events for school ${schoolId} in ${format} format`);
    const data = await calendarService.exportCalendarEvents(schoolId, startDate, endDate, {
      format,
      entityTypes: entityTypes ? entityTypes.split(',') : null
    });

    // TODO: Implement CSV/iCal/XLSX conversion
    if (format === 'json') {
      return successResponse(res, data, 'Calendar events exported successfully', {
        format,
        dateRange: { startDate, endDate },
        exportedAt: new Date().toISOString()
      });
    }

    return errorResponse(res, `Export format ${format} not yet implemented`, 501);
  } catch (error) {
    logger.error('Error exporting calendar events:', error);
    next(error);
  }
};

/**
 * Get calendar conflicts
 */
const getCalendarConflicts = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { startDate, endDate, resourceId } = req.query;

    // Validate schoolId
    const validation = validateObjectId(schoolId, 'schoolId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate date range
    if (!startDate || !endDate) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Start date and end date are required' }]);
    }
    if (!validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Invalid date range' }]);
    }

    // Validate resourceId if provided
    if (resourceId) {
      const resourceValidation = validateObjectId(resourceId, 'resourceId');
      if (!resourceValidation.valid) {
        return validationErrorResponse(res, [resourceValidation.error]);
      }
    }

    logger.info(`Checking calendar conflicts for school ${schoolId}`);
    const conflicts = await calendarService.getCalendarConflicts(schoolId, startDate, endDate, { resourceId });

    return successResponse(res, conflicts, 'Calendar conflicts checked successfully', {
      dateRange: { startDate, endDate },
      conflictCount: conflicts.length
    });
  } catch (error) {
    logger.error('Error checking calendar conflicts:', error);
    next(error);
  }
};


export default {
  getCalendarEvents,
  getCalendarAnalytics,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEventById,
  getUpcomingEvents,
  exportCalendarEvents,
  getCalendarConflicts
};
