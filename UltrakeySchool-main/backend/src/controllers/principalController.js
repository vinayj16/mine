import { Announcement, Event, Report } from '../models/principal.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_ANNOUNCEMENT_STATUSES = ['draft', 'published', 'archived', 'scheduled'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_TARGET_AUDIENCES = ['all', 'students', 'teachers', 'parents', 'staff', 'specific'];
const VALID_EVENT_STATUSES = ['planned', 'ongoing', 'completed', 'cancelled', 'postponed'];
const VALID_EVENT_TYPES = ['academic', 'sports', 'cultural', 'meeting', 'workshop', 'seminar', 'conference', 'celebration', 'other'];
const VALID_REPORT_TYPES = ['academic', 'attendance', 'financial', 'performance', 'administrative', 'custom'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_CONTENT_LENGTH = 10000;

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

// Helper function to validate date format
const validateDate = (date, fieldName = 'Date') => {
  if (!date) return null; // Date is optional
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  const errors = [];
  
  if (startDate) {
    const startDateError = validateDate(startDate, 'Start date');
    if (startDateError) errors.push(startDateError);
  }
  
  if (endDate) {
    const endDateError = validateDate(endDate, 'End date');
    if (endDateError) errors.push(endDateError);
  }
  
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push('Start date must be before end date');
  }
  
  return errors;
};

// ==================== ANNOUNCEMENT CONTROLLER ====================

// Create announcement
const createAnnouncement = async (req, res) => {
  try {
    logger.info('Creating announcement');
    
    const { title, content, priority, targetAudience, status, scheduledDate, expiryDate } = req.body;
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
    }
    
    if (!content || content.trim().length === 0) {
      errors.push('Content is required');
    } else if (content.length > MAX_CONTENT_LENGTH) {
      errors.push('Content must not exceed ' + MAX_CONTENT_LENGTH + ' characters');
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (targetAudience && !VALID_TARGET_AUDIENCES.includes(targetAudience)) {
      errors.push('Invalid target audience. Must be one of: ' + VALID_TARGET_AUDIENCES.join(', '));
    }
    
    if (status && !VALID_ANNOUNCEMENT_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ANNOUNCEMENT_STATUSES.join(', '));
    }
    
    if (scheduledDate) {
      const scheduledDateError = validateDate(scheduledDate, 'Scheduled date');
      if (scheduledDateError) errors.push(scheduledDateError);
    }
    
    if (expiryDate) {
      const expiryDateError = validateDate(expiryDate, 'Expiry date');
      if (expiryDateError) errors.push(expiryDateError);
    }
    
    if (scheduledDate && expiryDate && new Date(scheduledDate) > new Date(expiryDate)) {
      errors.push('Scheduled date must be before expiry date');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const announcement = new Announcement({
      ...req.body,
      institution: tenantId,
      createdBy: userId
    });
    
    await announcement.save();
    
    logger.info('Announcement created successfully:', { announcementId: announcement._id, title });
    return createdResponse(res, announcement, 'Announcement created successfully');
  } catch (error) {
    logger.error('Error creating announcement:', error);
    return errorResponse(res, error.message);
  }
};

// Get all announcements
const getAllAnnouncements = async (req, res) => {
  try {
    logger.info('Fetching all announcements');
    
    const { page, limit, status, priority, targetAudience, search } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
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
    
    if (status && !VALID_ANNOUNCEMENT_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ANNOUNCEMENT_STATUSES.join(', '));
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (targetAudience && !VALID_TARGET_AUDIENCES.includes(targetAudience)) {
      errors.push('Invalid target audience. Must be one of: ' + VALID_TARGET_AUDIENCES.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Build query
    const query = { institution: tenantId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (targetAudience) query.targetAudience = targetAudience;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (pageNum - 1) * limitNum;
    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Announcement.countDocuments(query);
    
    logger.info('Announcements fetched successfully');
    return successResponse(res, {
      announcements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Announcements retrieved successfully');
  } catch (error) {
    logger.error('Error fetching announcements:', error);
    return errorResponse(res, error.message);
  }
};

// Get announcement by ID
const getAnnouncementById = async (req, res) => {
  try {
    logger.info('Fetching announcement by ID');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Announcement ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const announcement = await Announcement.findOne({
      _id: id,
      institution: tenantId
    }).populate('createdBy', 'name email');
    
    if (!announcement) {
      return notFoundResponse(res, 'Announcement not found');
    }
    
    logger.info('Announcement fetched successfully:', { announcementId: id });
    return successResponse(res, announcement, 'Announcement retrieved successfully');
  } catch (error) {
    logger.error('Error fetching announcement:', error);
    return errorResponse(res, error.message);
  }
};

// Update announcement
const updateAnnouncement = async (req, res) => {
  try {
    logger.info('Updating announcement');
    
    const { id } = req.params;
    const { title, content, priority, targetAudience, status, scheduledDate, expiryDate } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Announcement ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        errors.push('Title cannot be empty');
      } else if (title.length > MAX_TITLE_LENGTH) {
        errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
      }
    }
    
    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        errors.push('Content cannot be empty');
      } else if (content.length > MAX_CONTENT_LENGTH) {
        errors.push('Content must not exceed ' + MAX_CONTENT_LENGTH + ' characters');
      }
    }
    
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (targetAudience !== undefined && !VALID_TARGET_AUDIENCES.includes(targetAudience)) {
      errors.push('Invalid target audience. Must be one of: ' + VALID_TARGET_AUDIENCES.join(', '));
    }
    
    if (status !== undefined && !VALID_ANNOUNCEMENT_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ANNOUNCEMENT_STATUSES.join(', '));
    }
    
    if (scheduledDate !== undefined) {
      const scheduledDateError = validateDate(scheduledDate, 'Scheduled date');
      if (scheduledDateError) errors.push(scheduledDateError);
    }
    
    if (expiryDate !== undefined) {
      const expiryDateError = validateDate(expiryDate, 'Expiry date');
      if (expiryDateError) errors.push(expiryDateError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const announcement = await Announcement.findOneAndUpdate(
      { _id: id, institution: tenantId },
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    if (!announcement) {
      return notFoundResponse(res, 'Announcement not found');
    }
    
    logger.info('Announcement updated successfully:', { announcementId: id });
    return successResponse(res, announcement, 'Announcement updated successfully');
  } catch (error) {
    logger.error('Error updating announcement:', error);
    return errorResponse(res, error.message);
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
  try {
    logger.info('Deleting announcement');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Announcement ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const announcement = await Announcement.findOneAndDelete({
      _id: id,
      institution: tenantId
    });
    
    if (!announcement) {
      return notFoundResponse(res, 'Announcement not found');
    }
    
    logger.info('Announcement deleted successfully:', { announcementId: id });
    return successResponse(res, null, 'Announcement deleted successfully');
  } catch (error) {
    logger.error('Error deleting announcement:', error);
    return errorResponse(res, error.message);
  }
};

// Publish announcement
const publishAnnouncement = async (req, res) => {
  try {
    logger.info('Publishing announcement');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Announcement ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const announcement = await Announcement.findOneAndUpdate(
      { _id: id, institution: tenantId },
      {
        status: 'published',
        publishedDate: new Date(),
        publishedBy: userId
      },
      { new: true }
    ).populate('createdBy', 'name email');
    
    if (!announcement) {
      return notFoundResponse(res, 'Announcement not found');
    }
    
    logger.info('Announcement published successfully:', { announcementId: id });
    return successResponse(res, announcement, 'Announcement published successfully');
  } catch (error) {
    logger.error('Error publishing announcement:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete announcements
const bulkDeleteAnnouncements = async (req, res) => {
  try {
    logger.info('Bulk deleting announcements');
    
    const { announcementIds } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (!announcementIds || !Array.isArray(announcementIds)) {
      errors.push('Announcement IDs must be an array');
    } else if (announcementIds.length === 0) {
      errors.push('Announcement IDs array cannot be empty');
    } else if (announcementIds.length > 100) {
      errors.push('Cannot delete more than 100 announcements at once');
    } else {
      for (const id of announcementIds) {
        const idError = validateObjectId(id, 'Announcement ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await Announcement.deleteMany({
      _id: { $in: announcementIds },
      institution: tenantId
    });
    
    logger.info('Announcements bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Announcements deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting announcements:', error);
    return errorResponse(res, error.message);
  }
};

// ==================== EVENT CONTROLLER ====================

// Create event
const createEvent = async (req, res) => {
  try {
    logger.info('Creating event');
    
    const { title, description, type, status, date, startTime, endTime, venue, coordinator } = req.body;
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (type && !VALID_EVENT_TYPES.includes(type)) {
      errors.push('Invalid event type. Must be one of: ' + VALID_EVENT_TYPES.join(', '));
    }
    
    if (status && !VALID_EVENT_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EVENT_STATUSES.join(', '));
    }
    
    if (!date) {
      errors.push('Event date is required');
    } else {
      const dateError = validateDate(date, 'Event date');
      if (dateError) errors.push(dateError);
    }
    
    if (coordinator) {
      const coordinatorError = validateObjectId(coordinator, 'Coordinator ID');
      if (coordinatorError) errors.push(coordinatorError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const event = new Event({
      ...req.body,
      institution: tenantId,
      createdBy: userId
    });
    
    await event.save();
    
    logger.info('Event created successfully:', { eventId: event._id, title });
    return createdResponse(res, event, 'Event created successfully');
  } catch (error) {
    logger.error('Error creating event:', error);
    return errorResponse(res, error.message);
  }
};

// Get all events
const getAllEvents = async (req, res) => {
  try {
    logger.info('Fetching all events');
    
    const { page, limit, status, type, startDate, endDate, search } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
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
    
    if (status && !VALID_EVENT_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EVENT_STATUSES.join(', '));
    }
    
    if (type && !VALID_EVENT_TYPES.includes(type)) {
      errors.push('Invalid event type. Must be one of: ' + VALID_EVENT_TYPES.join(', '));
    }
    
    const dateRangeErrors = validateDateRange(startDate, endDate);
    errors.push(...dateRangeErrors);
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Build query
    const query = { institution: tenantId };
    if (status) query.status = status;
    if (type) query.type = type;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (pageNum - 1) * limitNum;
    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .populate('coordinator', 'name email')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Event.countDocuments(query);
    
    logger.info('Events fetched successfully');
    return successResponse(res, {
      events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Events retrieved successfully');
  } catch (error) {
    logger.error('Error fetching events:', error);
    return errorResponse(res, error.message);
  }
};

// Get event by ID
const getEventById = async (req, res) => {
  try {
    logger.info('Fetching event by ID');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Event ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const event = await Event.findOne({
      _id: id,
      institution: tenantId
    })
      .populate('createdBy', 'name email')
      .populate('coordinator', 'name email');
    
    if (!event) {
      return notFoundResponse(res, 'Event not found');
    }
    
    logger.info('Event fetched successfully:', { eventId: id });
    return successResponse(res, event, 'Event retrieved successfully');
  } catch (error) {
    logger.error('Error fetching event:', error);
    return errorResponse(res, error.message);
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    logger.info('Updating event');
    
    const { id } = req.params;
    const { title, description, type, status, date, coordinator } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Event ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
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
    
    if (type !== undefined && !VALID_EVENT_TYPES.includes(type)) {
      errors.push('Invalid event type. Must be one of: ' + VALID_EVENT_TYPES.join(', '));
    }
    
    if (status !== undefined && !VALID_EVENT_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EVENT_STATUSES.join(', '));
    }
    
    if (date !== undefined) {
      const dateError = validateDate(date, 'Event date');
      if (dateError) errors.push(dateError);
    }
    
    if (coordinator !== undefined) {
      const coordinatorError = validateObjectId(coordinator, 'Coordinator ID');
      if (coordinatorError) errors.push(coordinatorError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const event = await Event.findOneAndUpdate(
      { _id: id, institution: tenantId },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('coordinator', 'name email');
    
    if (!event) {
      return notFoundResponse(res, 'Event not found');
    }
    
    logger.info('Event updated successfully:', { eventId: id });
    return successResponse(res, event, 'Event updated successfully');
  } catch (error) {
    logger.error('Error updating event:', error);
    return errorResponse(res, error.message);
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    logger.info('Deleting event');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Event ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const event = await Event.findOneAndDelete({
      _id: id,
      institution: tenantId
    });
    
    if (!event) {
      return notFoundResponse(res, 'Event not found');
    }
    
    logger.info('Event deleted successfully:', { eventId: id });
    return successResponse(res, null, 'Event deleted successfully');
  } catch (error) {
    logger.error('Error deleting event:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete events
const bulkDeleteEvents = async (req, res) => {
  try {
    logger.info('Bulk deleting events');
    
    const { eventIds } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (!eventIds || !Array.isArray(eventIds)) {
      errors.push('Event IDs must be an array');
    } else if (eventIds.length === 0) {
      errors.push('Event IDs array cannot be empty');
    } else if (eventIds.length > 100) {
      errors.push('Cannot delete more than 100 events at once');
    } else {
      for (const id of eventIds) {
        const idError = validateObjectId(id, 'Event ID');
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
      institution: tenantId
    });
    
    logger.info('Events bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Events deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting events:', error);
    return errorResponse(res, error.message);
  }
};

// Get upcoming events
const getUpcomingEvents = async (req, res) => {
  try {
    logger.info('Fetching upcoming events');
    
    const { limit, type } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    const limitNum = parseInt(limit) || 10;
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (type && !VALID_EVENT_TYPES.includes(type)) {
      errors.push('Invalid event type. Must be one of: ' + VALID_EVENT_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = {
      institution: tenantId,
      date: { $gte: new Date() },
      status: { $in: ['planned', 'ongoing'] }
    };
    
    if (type) query.type = type;
    
    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .populate('coordinator', 'name email')
      .sort({ date: 1 })
      .limit(limitNum);
    
    logger.info('Upcoming events fetched successfully:', { count: events.length });
    return successResponse(res, events, 'Upcoming events retrieved successfully');
  } catch (error) {
    logger.error('Error fetching upcoming events:', error);
    return errorResponse(res, error.message);
  }
};


export default {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  bulkDeleteAnnouncements,
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  bulkDeleteEvents,
  getUpcomingEvents
};
