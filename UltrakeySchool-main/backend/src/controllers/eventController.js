import eventService from '../services/eventService.js';
import Event from '../models/Event.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_EVENT_TYPES = ['academic', 'sports', 'cultural', 'holiday', 'meeting', 'exam', 'workshop', 'seminar', 'conference', 'other'];
const VALID_EVENT_STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_VISIBILITY = ['public', 'private', 'staff_only', 'student_only'];

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
  if (start > end) {
    return 'Start date must be before end date';
  }
  return null;
};

// Helper function to validate time format (HH:MM)
const validateTime = (timeString, fieldName = 'Time') => {
  if (!timeString) return null;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(timeString)) {
    return 'Invalid ' + fieldName + ' format. Expected HH:MM';
  }
  return null;
};

const createEvent = async (req, res, next) => {
  try {
    logger.info('Creating event');
    
    // Support both route param and body schoolId
    const schoolId = req.params.schoolId || req.body.schoolId;
    const { title, description, eventType, startDate, endDate, startTime, endTime, location, priority, visibility, maxAttendees, color } = req.body;

    // Validation
    const errors = [];
    
    // schoolId is optional for global users (superadmin, agents)
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > 200) {
      errors.push('Title must not exceed 200 characters');
    }
    
    if (description && description.length > 2000) {
      errors.push('Description must not exceed 2000 characters');
    }
    
    if (!eventType) {
      errors.push('Event type is required');
    } else if (!VALID_EVENT_TYPES.includes(eventType)) {
      // If eventType is not in the list, default to 'other'
      logger.warn(`Invalid event type: ${eventType}, defaulting to 'other'`);
    }
    
    if (!startDate) {
      errors.push('Start date is required');
    } else {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (!endDate) {
      errors.push('End date is required');
    } else {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (startTime) {
      const startTimeError = validateTime(startTime, 'Start time');
      if (startTimeError) errors.push(startTimeError);
    }
    
    if (endTime) {
      const endTimeError = validateTime(endTime, 'End time');
      if (endTimeError) errors.push(endTimeError);
    }
    
    if (location && location.length > 300) {
      errors.push('Location must not exceed 300 characters');
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (visibility && !VALID_VISIBILITY.includes(visibility)) {
      errors.push('Invalid visibility. Must be one of: ' + VALID_VISIBILITY.join(', '));
    }
    
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      errors.push('Invalid color format. Must be a hex color code (e.g., #1A6FA8)');
    }
    
    if (maxAttendees !== undefined) {
      const maxAttendeesNum = parseInt(maxAttendees);
      if (isNaN(maxAttendeesNum) || maxAttendeesNum < 1) {
        errors.push('Max attendees must be a positive number');
      } else if (maxAttendeesNum > 10000) {
        errors.push('Max attendees must not exceed 10000');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    // Default eventType to 'other' if not in valid list
    const eventData = {
      ...req.body,
      eventType: VALID_EVENT_TYPES.includes(eventType) ? eventType : 'other'
    };

    const event = await eventService.createEvent(schoolId, eventData);
    
    logger.info('Event created successfully:', { eventId: event._id });
    return createdResponse(res, event, 'Event created successfully');
  } catch (error) {
    logger.error('Error creating event:', error);
    return errorResponse(res, error.message);
  }
};

const getEvents = async (req, res, next) => {
  try {
    logger.info('Fetching events');
    
    // Accept schoolId from query params OR route params
    const schoolId = req.params.schoolId || req.query.schoolId;
    const { eventType, status, priority, visibility, startDate, endDate, page, limit, search } = req.query;
    
    // Validation - make schoolId optional for query param calls
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (eventType && !VALID_EVENT_TYPES.includes(eventType)) {
      errors.push('Invalid event type. Must be one of: ' + VALID_EVENT_TYPES.join(', '));
    }
    
    if (status && !VALID_EVENT_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EVENT_STATUSES.join(', '));
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (visibility && !VALID_VISIBILITY.includes(visibility)) {
      errors.push('Invalid visibility. Must be one of: ' + VALID_VISIBILITY.join(', '));
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
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = { page: pageNum, limit: limitNum };
    if (eventType) filters.eventType = eventType;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (visibility) filters.visibility = visibility;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (search) filters.search = search;
    
    const events = await eventService.getEvents(schoolId, filters);
    
    logger.info('Events fetched successfully');
    return successResponse(res, events, 'Events retrieved successfully');
  } catch (error) {
    logger.error('Error fetching events:', error);
    return errorResponse(res, error.message);
  }
};

const getEventById = async (req, res, next) => {
  try {
    logger.info('Fetching event by ID');
    
    const { schoolId, eventId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const eventIdError = validateObjectId(eventId, 'Event ID');
    if (eventIdError) errors.push(eventIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const event = await eventService.getEventById(eventId, schoolId);
    
    if (!event) {
      return notFoundResponse(res, 'Event not found');
    }
    
    logger.info('Event fetched successfully:', { eventId });
    return successResponse(res, event, 'Event retrieved successfully');
  } catch (error) {
    logger.error('Error fetching event:', error);
    return errorResponse(res, error.message);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    logger.info('Updating event');
    
    // Support both route param and body schoolId
    const schoolId = req.params.schoolId || req.body.schoolId;
    const { eventId } = req.params;
    const { title, description, eventType, startDate, endDate, startTime, endTime, location, status, priority, visibility, maxAttendees, color } = req.body;
    
    // Validation
    const errors = [];
    
    // schoolId is optional for global users
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    const eventIdError = validateObjectId(eventId, 'Event ID');
    if (eventIdError) errors.push(eventIdError);
    
    if (title !== undefined) {
      if (title.trim().length === 0) {
        errors.push('Title cannot be empty');
      } else if (title.length > 200) {
        errors.push('Title must not exceed 200 characters');
      }
    }
    
    if (description !== undefined && description.length > 2000) {
      errors.push('Description must not exceed 2000 characters');
    }
    
    if (eventType && !VALID_EVENT_TYPES.includes(eventType)) {
      errors.push('Invalid event type. Must be one of: ' + VALID_EVENT_TYPES.join(', '));
    }
    
    if (status && !VALID_EVENT_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EVENT_STATUSES.join(', '));
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
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (startTime) {
      const startTimeError = validateTime(startTime, 'Start time');
      if (startTimeError) errors.push(startTimeError);
    }
    
    if (endTime) {
      const endTimeError = validateTime(endTime, 'End time');
      if (endTimeError) errors.push(endTimeError);
    }
    
    if (location !== undefined && location.length > 300) {
      errors.push('Location must not exceed 300 characters');
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (visibility && !VALID_VISIBILITY.includes(visibility)) {
      errors.push('Invalid visibility. Must be one of: ' + VALID_VISIBILITY.join(', '));
    }
    
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      errors.push('Invalid color format. Must be a hex color code (e.g., #1A6FA8)');
    }
    
    if (maxAttendees !== undefined) {
      const maxAttendeesNum = parseInt(maxAttendees);
      if (isNaN(maxAttendeesNum) || maxAttendeesNum < 1) {
        errors.push('Max attendees must be a positive number');
      } else if (maxAttendeesNum > 10000) {
        errors.push('Max attendees must not exceed 10000');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const event = await eventService.updateEvent(eventId, schoolId, req.body);
    
    if (!event) {
      return notFoundResponse(res, 'Event not found');
    }
    
    logger.info('Event updated successfully:', { eventId });
    return successResponse(res, event, 'Event updated successfully');
  } catch (error) {
    logger.error('Error updating event:', error);
    return errorResponse(res, error.message);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    logger.info('Deleting event');
    
    // Support both route param and body schoolId
    const schoolId = req.params.schoolId || req.body.schoolId;
    const { eventId } = req.params;
    
    // Validation
    const errors = [];
    
    // schoolId is optional for global users
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    const eventIdError = validateObjectId(eventId, 'Event ID');
    if (eventIdError) errors.push(eventIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await eventService.deleteEvent(eventId, schoolId);
    
    if (!result) {
      return notFoundResponse(res, 'Event not found');
    }
    
    logger.info('Event deleted successfully:', { eventId });
    return successResponse(res, null, 'Event deleted successfully');
  } catch (error) {
    logger.error('Error deleting event:', error);
    return errorResponse(res, error.message);
  }
};

const getUpcomingEvents = async (req, res, next) => {
  try {
    logger.info('Fetching upcoming events');
    
    const { schoolId } = req.params;
    const { limit, days } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const limitNum = parseInt(limit) || 20;
    const daysNum = parseInt(days) || 30;
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (daysNum < 1 || daysNum > 365) {
      errors.push('Days must be between 1 and 365');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const events = await eventService.getUpcomingEvents(schoolId, { limit: limitNum, days: daysNum });
    
    logger.info('Upcoming events fetched successfully');
    return successResponse(res, events, 'Upcoming events retrieved successfully');
  } catch (error) {
    logger.error('Error fetching upcoming events:', error);
    return errorResponse(res, error.message);
  }
};

const getEventsByType = async (req, res, next) => {
  try {
    logger.info('Fetching events by type');
    
    const { schoolId, eventType } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!eventType) {
      errors.push('Event type is required');
    } else if (!VALID_EVENT_TYPES.includes(eventType)) {
      errors.push('Invalid event type. Must be one of: ' + VALID_EVENT_TYPES.join(', '));
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
    
    const events = await eventService.getEventsByType(schoolId, eventType, { page: pageNum, limit: limitNum });
    
    logger.info('Events by type fetched successfully:', { eventType });
    return successResponse(res, events, 'Events retrieved successfully');
  } catch (error) {
    logger.error('Error fetching events by type:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk Operations
const bulkUpdateEvents = async (req, res) => {
  try {
    logger.info('Bulk updating events');
    
    const { schoolId } = req.params;
    const { eventIds, updates } = req.body;

    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      errors.push('Event IDs array is required and must not be empty');
    }
    
    if (eventIds && eventIds.length > 100) {
      errors.push('Cannot update more than 100 events at once');
    }
    
    if (eventIds) {
      for (let i = 0; i < eventIds.length; i++) {
        const idError = validateObjectId(eventIds[i], 'Event ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates object is required');
    }
    
    if (updates && updates.status && !VALID_EVENT_STATUSES.includes(updates.status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EVENT_STATUSES.join(', '));
    }
    
    if (updates && updates.priority && !VALID_PRIORITIES.includes(updates.priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (updates && updates.visibility && !VALID_VISIBILITY.includes(updates.visibility)) {
      errors.push('Invalid visibility. Must be one of: ' + VALID_VISIBILITY.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await Event.updateMany(
      { _id: { $in: eventIds }, schoolId: new mongoose.Types.ObjectId(schoolId) },
      { $set: updates }
    );

    logger.info('Events bulk updated successfully:', { count: result.modifiedCount });
    return successResponse(res, {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    }, 'Events updated successfully');
  } catch (error) {
    logger.error('Error bulk updating events:', error);
    return errorResponse(res, error.message);
  }
};

const bulkDeleteEvents = async (req, res) => {
  try {
    logger.info('Bulk deleting events');
    
    const { schoolId } = req.params;
    const { eventIds } = req.body;

    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      errors.push('Event IDs array is required and must not be empty');
    }
    
    if (eventIds && eventIds.length > 100) {
      errors.push('Cannot delete more than 100 events at once');
    }
    
    if (eventIds) {
      for (let i = 0; i < eventIds.length; i++) {
        const idError = validateObjectId(eventIds[i], 'Event ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await Event.deleteMany({
      _id: { $in: eventIds },
      schoolId: new mongoose.Types.ObjectId(schoolId)
    });

    logger.info('Events bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, {
      deletedCount: result.deletedCount
    }, 'Events deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting events:', error);
    return errorResponse(res, error.message);
  }
};

// Export Events
const exportEvents = async (req, res) => {
  try {
    logger.info('Exporting events');
    
    const { schoolId } = req.params;
    const { format, eventType, status, startDate, endDate } = req.query;

    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const validFormats = ['json', 'csv', 'xlsx', 'pdf'];
    if (!format) {
      errors.push('Format is required');
    } else if (!validFormats.includes(format)) {
      errors.push('Invalid format. Must be one of: ' + validFormats.join(', '));
    }
    
    if (eventType && !VALID_EVENT_TYPES.includes(eventType)) {
      errors.push('Invalid event type. Must be one of: ' + VALID_EVENT_TYPES.join(', '));
    }
    
    if (status && !VALID_EVENT_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EVENT_STATUSES.join(', '));
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
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = { schoolId: new mongoose.Types.ObjectId(schoolId) };
    if (eventType) filters.eventType = eventType;
    if (status) filters.status = status;
    if (startDate || endDate) {
      filters.startDate = {};
      if (startDate) filters.startDate.$gte = new Date(startDate);
      if (endDate) filters.startDate.$lte = new Date(endDate);
    }

    const events = await Event.find(filters).lean();

    logger.info('Events exported successfully:', { format, count: events.length });
    return successResponse(res, {
      format,
      count: events.length,
      data: events,
      exportedAt: new Date()
    }, 'Events exported successfully');
  } catch (error) {
    logger.error('Error exporting events:', error);
    return errorResponse(res, error.message);
  }
};

// Statistics
const getEventStatistics = async (req, res) => {
  try {
    logger.info('Fetching event statistics');
    
    const { schoolId } = req.params;
    const { startDate, endDate } = req.query;

    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const dateFilter = { schoolId: new mongoose.Types.ObjectId(schoolId) };
    if (startDate || endDate) {
      dateFilter.startDate = {};
      if (startDate) dateFilter.startDate.$gte = new Date(startDate);
      if (endDate) dateFilter.startDate.$lte = new Date(endDate);
    }

    const statistics = await Event.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          scheduledEvents: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
          ongoingEvents: { $sum: { $cond: [{ $eq: ['$status', 'ongoing'] }, 1, 0] } },
          completedEvents: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledEvents: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          postponedEvents: { $sum: { $cond: [{ $eq: ['$status', 'postponed'] }, 1, 0] } },
          academicEvents: { $sum: { $cond: [{ $eq: ['$eventType', 'academic'] }, 1, 0] } },
          sportsEvents: { $sum: { $cond: [{ $eq: ['$eventType', 'sports'] }, 1, 0] } },
          culturalEvents: { $sum: { $cond: [{ $eq: ['$eventType', 'cultural'] }, 1, 0] } },
          highPriorityEvents: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          urgentEvents: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } }
        }
      }
    ]);

    const stats = statistics[0] || {
      totalEvents: 0,
      scheduledEvents: 0,
      ongoingEvents: 0,
      completedEvents: 0,
      cancelledEvents: 0,
      postponedEvents: 0,
      academicEvents: 0,
      sportsEvents: 0,
      culturalEvents: 0,
      highPriorityEvents: 0,
      urgentEvents: 0
    };

    logger.info('Event statistics fetched successfully');
    return successResponse(res, stats, 'Event statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching event statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Analytics
const getEventAnalytics = async (req, res) => {
  try {
    logger.info('Fetching event analytics');
    
    const { schoolId } = req.params;
    const { groupBy, startDate, endDate } = req.query;

    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const validGroupBy = ['day', 'week', 'month', 'year', 'eventType', 'status', 'priority'];
    if (!groupBy) {
      errors.push('GroupBy parameter is required');
    } else if (!validGroupBy.includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
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
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const dateFilter = { schoolId: new mongoose.Types.ObjectId(schoolId) };
    if (startDate || endDate) {
      dateFilter.startDate = {};
      if (startDate) dateFilter.startDate.$gte = new Date(startDate);
      if (endDate) dateFilter.startDate.$lte = new Date(endDate);
    }

    let groupByField;
    if (groupBy === 'day') {
      groupByField = { $dateToString: { format: '%Y-%m-%d', date: '$startDate' } };
    } else if (groupBy === 'week') {
      groupByField = { $dateToString: { format: '%Y-W%V', date: '$startDate' } };
    } else if (groupBy === 'month') {
      groupByField = { $dateToString: { format: '%Y-%m', date: '$startDate' } };
    } else if (groupBy === 'year') {
      groupByField = { $dateToString: { format: '%Y', date: '$startDate' } };
    } else {
      groupByField = '$' + groupBy;
    }

    const analytics = await Event.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupByField,
          count: { $sum: 1 },
          events: { $push: { title: '$title', startDate: '$startDate', status: '$status' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    logger.info('Event analytics fetched successfully:', { groupBy });
    return successResponse(res, analytics, 'Event analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching event analytics:', error);
    return errorResponse(res, error.message);
  }
};


export default {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getEventsByType,
  bulkUpdateEvents,
  bulkDeleteEvents,
  exportEvents,
  getEventStatistics,
  getEventAnalytics
};
