import ptmService from '../services/ptmService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['available', 'booked', 'completed', 'cancelled', 'rescheduled'];
const VALID_MEETING_MODES = ['in-person', 'online', 'hybrid'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NOTES_LENGTH = 2000;
const MAX_REASON_LENGTH = 500;

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

// Helper function to validate time format (HH:MM)
const validateTime = (time, fieldName = 'Time') => {
  if (!time) return null; // Time is optional
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return fieldName + ' must be in HH:MM format';
  }
  return null;
};

// Get PTM slots
const getPTMSlots = async (req, res) => {
  try {
    logger.info('Fetching PTM slots');
    
    const { date, teacherId, status, page, limit } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (date) {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (teacherId) {
      const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
      if (teacherIdError) errors.push(teacherIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const slots = await ptmService.getPTMSlots(schoolId, {
      date,
      teacherId,
      status,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('PTM slots fetched successfully');
    return successResponse(res, {
      slots: slots.data,
      pagination: slots.pagination
    }, 'PTM slots retrieved successfully');
  } catch (error) {
    logger.error('Error fetching PTM slots:', error);
    return errorResponse(res, error.message);
  }
};

// Create PTM slots
const createPTMSlots = async (req, res) => {
  try {
    logger.info('Creating PTM slots');
    
    const { teacherId, date, startTime, endTime, slotDuration, meetingMode, venue, maxBookings } = req.body;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.userId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (!date) {
      errors.push('Date is required');
    } else {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (!startTime) {
      errors.push('Start time is required');
    } else {
      const startTimeError = validateTime(startTime, 'Start time');
      if (startTimeError) errors.push(startTimeError);
    }
    
    if (!endTime) {
      errors.push('End time is required');
    } else {
      const endTimeError = validateTime(endTime, 'End time');
      if (endTimeError) errors.push(endTimeError);
    }
    
    if (slotDuration !== undefined) {
      if (typeof slotDuration !== 'number' || slotDuration < 5 || slotDuration > 120) {
        errors.push('Slot duration must be between 5 and 120 minutes');
      }
    }
    
    if (meetingMode && !VALID_MEETING_MODES.includes(meetingMode)) {
      errors.push('Invalid meeting mode. Must be one of: ' + VALID_MEETING_MODES.join(', '));
    }
    
    if (maxBookings !== undefined) {
      if (typeof maxBookings !== 'number' || maxBookings < 1 || maxBookings > 50) {
        errors.push('Max bookings must be between 1 and 50');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const slots = await ptmService.createPTMSlots(schoolId, req.body, userId);
    
    logger.info('PTM slots created successfully:', { count: slots.length });
    return createdResponse(res, slots, 'PTM slots created successfully');
  } catch (error) {
    logger.error('Error creating PTM slots:', error);
    return errorResponse(res, error.message);
  }
};

// Get PTM slot by ID
const getPTMSlotById = async (req, res) => {
  try {
    logger.info('Fetching PTM slot by ID');
    
    const { id } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'PTM Slot ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const slot = await ptmService.getPTMSlotById(schoolId, id);
    
    if (!slot) {
      return notFoundResponse(res, 'PTM slot not found');
    }
    
    logger.info('PTM slot fetched successfully:', { slotId: id });
    return successResponse(res, slot, 'PTM slot retrieved successfully');
  } catch (error) {
    logger.error('Error fetching PTM slot:', error);
    if (error.message.includes('not found')) {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

// Update PTM slot
const updatePTMSlot = async (req, res) => {
  try {
    logger.info('Updating PTM slot');
    
    const { id } = req.params;
    const { date, startTime, endTime, meetingMode, venue, maxBookings, status } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'PTM Slot ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
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
    
    if (meetingMode !== undefined && !VALID_MEETING_MODES.includes(meetingMode)) {
      errors.push('Invalid meeting mode. Must be one of: ' + VALID_MEETING_MODES.join(', '));
    }
    
    if (maxBookings !== undefined) {
      if (typeof maxBookings !== 'number' || maxBookings < 1 || maxBookings > 50) {
        errors.push('Max bookings must be between 1 and 50');
      }
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const slot = await ptmService.updatePTMSlot(schoolId, id, req.body);
    
    if (!slot) {
      return notFoundResponse(res, 'PTM slot not found');
    }
    
    logger.info('PTM slot updated successfully:', { slotId: id });
    return successResponse(res, slot, 'PTM slot updated successfully');
  } catch (error) {
    logger.error('Error updating PTM slot:', error);
    return errorResponse(res, error.message);
  }
};

// Delete PTM slot
const deletePTMSlot = async (req, res) => {
  try {
    logger.info('Deleting PTM slot');
    
    const { id } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'PTM Slot ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await ptmService.deletePTMSlot(schoolId, id);
    
    logger.info('PTM slot deleted successfully:', { slotId: id });
    return successResponse(res, null, 'PTM slot deleted successfully');
  } catch (error) {
    logger.error('Error deleting PTM slot:', error);
    return errorResponse(res, error.message);
  }
};

// Book PTM slot
const bookPTMSlot = async (req, res) => {
  try {
    logger.info('Booking PTM slot');
    
    const { id } = req.params;
    const { studentId, parentId, notes } = req.body;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.userId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'PTM Slot ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (parentId) {
      const parentIdError = validateObjectId(parentId, 'Parent ID');
      if (parentIdError) errors.push(parentIdError);
    }
    
    if (notes && notes.length > MAX_NOTES_LENGTH) {
      errors.push('Notes must not exceed ' + MAX_NOTES_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const booking = await ptmService.bookPTMSlot(schoolId, id, userId, req.body);
    
    logger.info('PTM slot booked successfully:', { slotId: id, studentId });
    return successResponse(res, booking, 'PTM slot booked successfully');
  } catch (error) {
    logger.error('Error booking PTM slot:', error);
    return errorResponse(res, error.message);
  }
};

// Cancel PTM booking
const cancelPTMBooking = async (req, res) => {
  try {
    logger.info('Cancelling PTM booking');
    
    const { id } = req.params;
    const { reason } = req.body;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.userId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'PTM Slot ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (reason && reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const slot = await ptmService.cancelPTMBooking(schoolId, id, userId, req.body);
    
    logger.info('PTM booking cancelled successfully:', { slotId: id });
    return successResponse(res, slot, 'PTM booking cancelled successfully');
  } catch (error) {
    logger.error('Error cancelling PTM booking:', error);
    return errorResponse(res, error.message);
  }
};

// Schedule video meeting for PTM
const scheduleVideoMeeting = async (req, res) => {
  try {
    logger.info('Scheduling video meeting for PTM');
    
    const { id } = req.params;
    const { meetingLink, meetingPlatform } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'PTM Slot ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (!meetingLink || meetingLink.trim().length === 0) {
      errors.push('Meeting link is required');
    } else {
      try {
        new URL(meetingLink);
      } catch (e) {
        errors.push('Invalid meeting link format');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const slot = await ptmService.scheduleVideoMeeting(schoolId, id, req.body);
    
    logger.info('Video meeting scheduled successfully:', { slotId: id });
    return successResponse(res, slot, 'Video meeting scheduled successfully');
  } catch (error) {
    logger.error('Error scheduling video meeting:', error);
    return errorResponse(res, error.message);
  }
};

// Send PTM reminder
const sendPTMReminder = async (req, res) => {
  try {
    logger.info('Sending PTM reminder');
    
    const { id } = req.params;
    const { reminderType } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'PTM Slot ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await ptmService.sendPTMReminder(schoolId, id, req.body);
    
    logger.info('PTM reminder sent successfully:', { slotId: id });
    return successResponse(res, null, 'PTM reminder sent successfully');
  } catch (error) {
    logger.error('Error sending PTM reminder:', error);
    return errorResponse(res, error.message);
  }
};

// Send automated reminders
const sendAutomatedReminders = async (req, res) => {
  try {
    logger.info('Sending automated PTM reminders');
    
    const { hoursBeforeMeeting } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    const hours = parseInt(hoursBeforeMeeting) || 24;
    
    if (hours < 1 || hours > 168) {
      errors.push('Hours before meeting must be between 1 and 168 (7 days)');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const count = await ptmService.sendAutomatedReminders(schoolId, hours);
    
    logger.info('Automated PTM reminders sent successfully:', { count });
    return successResponse(res, { count }, count + ' reminder(s) sent successfully');
  } catch (error) {
    logger.error('Error sending automated PTM reminders:', error);
    return errorResponse(res, error.message);
  }
};

// Get PTM statistics
const getPTMStatistics = async (req, res) => {
  try {
    logger.info('Fetching PTM statistics');
    
    const { startDate, endDate } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    const dateRangeErrors = validateDateRange(startDate, endDate);
    errors.push(...dateRangeErrors);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await ptmService.getPTMStatistics(schoolId, { startDate, endDate });
    
    logger.info('PTM statistics fetched successfully');
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching PTM statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Complete PTM slot
const completePTMSlot = async (req, res) => {
  try {
    logger.info('Completing PTM slot');
    
    const { id } = req.params;
    const { feedback, notes, attendanceStatus } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'PTM Slot ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (notes && notes.length > MAX_NOTES_LENGTH) {
      errors.push('Notes must not exceed ' + MAX_NOTES_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const slot = await ptmService.completePTMSlot(schoolId, id, req.body);
    
    logger.info('PTM slot completed successfully:', { slotId: id });
    return successResponse(res, slot, 'PTM slot completed successfully');
  } catch (error) {
    logger.error('Error completing PTM slot:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete PTM slots
const bulkDeletePTMSlots = async (req, res) => {
  try {
    logger.info('Bulk deleting PTM slots');
    
    const { slotIds } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (!slotIds || !Array.isArray(slotIds)) {
      errors.push('Slot IDs must be an array');
    } else if (slotIds.length === 0) {
      errors.push('Slot IDs array cannot be empty');
    } else if (slotIds.length > 100) {
      errors.push('Cannot delete more than 100 slots at once');
    } else {
      for (const id of slotIds) {
        const idError = validateObjectId(id, 'PTM Slot ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await ptmService.bulkDeletePTMSlots(schoolId, slotIds);
    
    logger.info('PTM slots bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'PTM slots deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting PTM slots:', error);
    return errorResponse(res, error.message);
  }
};

// Get PTM slots by teacher
const getPTMSlotsByTeacher = async (req, res) => {
  try {
    logger.info('Fetching PTM slots by teacher');
    
    const { teacherId } = req.params;
    const { page, limit, status, startDate, endDate } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (!schoolId) {
      errors.push('School ID is required');
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
    
    const dateRangeErrors = validateDateRange(startDate, endDate);
    errors.push(...dateRangeErrors);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await ptmService.getPTMSlotsByTeacher(schoolId, teacherId, {
      page: pageNum,
      limit: limitNum,
      status,
      startDate,
      endDate
    });
    
    logger.info('PTM slots fetched by teacher successfully:', { teacherId });
    return successResponse(res, result, 'PTM slots retrieved successfully');
  } catch (error) {
    logger.error('Error fetching PTM slots by teacher:', error);
    return errorResponse(res, error.message);
  }
};

// Get PTM bookings by parent
const getPTMBookingsByParent = async (req, res) => {
  try {
    logger.info('Fetching PTM bookings by parent');
    
    const { parentId } = req.params;
    const { page, limit, status } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const parentIdError = validateObjectId(parentId, 'Parent ID');
    if (parentIdError) errors.push(parentIdError);
    
    if (!schoolId) {
      errors.push('School ID is required');
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
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await ptmService.getPTMBookingsByParent(schoolId, parentId, {
      page: pageNum,
      limit: limitNum,
      status
    });
    
    logger.info('PTM bookings fetched by parent successfully:', { parentId });
    return successResponse(res, result, 'PTM bookings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching PTM bookings by parent:', error);
    return errorResponse(res, error.message);
  }
};

// Get available PTM slots
const getAvailablePTMSlots = async (req, res) => {
  try {
    logger.info('Fetching available PTM slots');
    
    const { teacherId, date, startDate, endDate } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (teacherId) {
      const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
      if (teacherIdError) errors.push(teacherIdError);
    }
    
    if (date) {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    const dateRangeErrors = validateDateRange(startDate, endDate);
    errors.push(...dateRangeErrors);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const slots = await ptmService.getAvailablePTMSlots(schoolId, {
      teacherId,
      date,
      startDate,
      endDate
    });
    
    logger.info('Available PTM slots fetched successfully:', { count: slots.length });
    return successResponse(res, slots, 'Available PTM slots retrieved successfully');
  } catch (error) {
    logger.error('Error fetching available PTM slots:', error);
    return errorResponse(res, error.message);
  }
};

// Reschedule PTM slot
const reschedulePTMSlot = async (req, res) => {
  try {
    logger.info('Rescheduling PTM slot');
    
    const { id } = req.params;
    const { newDate, newStartTime, newEndTime, reason } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'PTM Slot ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (!newDate) {
      errors.push('New date is required');
    } else {
      const dateError = validateDate(newDate, 'New date');
      if (dateError) errors.push(dateError);
    }
    
    if (!newStartTime) {
      errors.push('New start time is required');
    } else {
      const startTimeError = validateTime(newStartTime, 'New start time');
      if (startTimeError) errors.push(startTimeError);
    }
    
    if (!newEndTime) {
      errors.push('New end time is required');
    } else {
      const endTimeError = validateTime(newEndTime, 'New end time');
      if (endTimeError) errors.push(endTimeError);
    }
    
    if (reason && reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const slot = await ptmService.reschedulePTMSlot(schoolId, id, req.body);
    
    logger.info('PTM slot rescheduled successfully:', { slotId: id });
    return successResponse(res, slot, 'PTM slot rescheduled successfully');
  } catch (error) {
    logger.error('Error rescheduling PTM slot:', error);
    return errorResponse(res, error.message);
  }
};

// Export PTM data
const exportPTMData = async (req, res) => {
  try {
    logger.info('Exporting PTM data');
    
    const { format, startDate, endDate, teacherId, status } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    const dateRangeErrors = validateDateRange(startDate, endDate);
    errors.push(...dateRangeErrors);
    
    if (teacherId) {
      const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
      if (teacherIdError) errors.push(teacherIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await ptmService.exportPTMData(schoolId, {
      format: format.toLowerCase(),
      startDate,
      endDate,
      teacherId,
      status
    });
    
    logger.info('PTM data exported successfully:', { format });
    return successResponse(res, exportData, 'Data exported successfully');
  } catch (error) {
    logger.error('Error exporting PTM data:', error);
    return errorResponse(res, error.message);
  }
};

// Get PTM attendance report
const getPTMAttendanceReport = async (req, res) => {
  try {
    logger.info('Fetching PTM attendance report');
    
    const { startDate, endDate, teacherId, classId } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    const dateRangeErrors = validateDateRange(startDate, endDate);
    errors.push(...dateRangeErrors);
    
    if (teacherId) {
      const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
      if (teacherIdError) errors.push(teacherIdError);
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const report = await ptmService.getPTMAttendanceReport(schoolId, {
      startDate,
      endDate,
      teacherId,
      classId
    });
    
    logger.info('PTM attendance report fetched successfully');
    return successResponse(res, report, 'Attendance report retrieved successfully');
  } catch (error) {
    logger.error('Error fetching PTM attendance report:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getPTMSlots,
  createPTMSlots,
  getPTMSlotById,
  updatePTMSlot,
  deletePTMSlot,
  bookPTMSlot,
  cancelPTMBooking,
  scheduleVideoMeeting,
  sendPTMReminder,
  sendAutomatedReminders,
  getPTMStatistics,
  completePTMSlot,
  bulkDeletePTMSlots,
  getPTMSlotsByTeacher,
  getPTMBookingsByParent,
  getAvailablePTMSlots,
  reschedulePTMSlot,
  exportPTMData,
  getPTMAttendanceReport
};
