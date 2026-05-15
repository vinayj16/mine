import examScheduleService from '../services/examScheduleService.js';
import ExamSchedule from '../models/ExamSchedule.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'];
const VALID_SORT_ORDERS = ['asc', 'desc', 'ascending', 'descending', '1', '-1'];

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

// Helper function to validate time format (HH:MM)
const validateTime = (timeString, fieldName = 'Time') => {
  if (!timeString) return null;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(timeString)) {
    return 'Invalid ' + fieldName + ' format. Expected HH:MM';
  }
  return null;
};

// Helper function to validate academic year format (YYYY-YYYY)
const validateAcademicYear = (year) => {
  if (!year) return null;
  const yearRegex = /^\d{4}-\d{4}$/;
  if (!yearRegex.test(year)) {
    return 'Invalid academic year format. Expected YYYY-YYYY';
  }
  const [startYear, endYear] = year.split('-').map(Number);
  if (endYear !== startYear + 1) {
    return 'Academic year end must be one year after start';
  }
  return null;
};

const createExamSchedule = async (req, res) => {
  try {
    logger.info('Creating exam schedule');
    
    const { institutionId, classId, subject, examName, examDate, startTime, endTime, duration, roomNo, invigilatorId, academicYear, totalMarks } = req.body;

    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (!classId) {
      errors.push('Class ID is required');
    } else {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (!subject || subject.trim().length === 0) {
      errors.push('Subject is required');
    } else if (subject.length > 200) {
      errors.push('Subject must not exceed 200 characters');
    }
    
    if (!examName || examName.trim().length === 0) {
      errors.push('Exam name is required');
    } else if (examName.length > 200) {
      errors.push('Exam name must not exceed 200 characters');
    }
    
    if (!examDate) {
      errors.push('Exam date is required');
    } else {
      const examDateError = validateDate(examDate, 'Exam date');
      if (examDateError) errors.push(examDateError);
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
    
    if (duration !== undefined) {
      const durationNum = parseInt(duration);
      if (isNaN(durationNum) || durationNum < 1) {
        errors.push('Duration must be a positive number (in minutes)');
      } else if (durationNum > 600) {
        errors.push('Duration must not exceed 600 minutes (10 hours)');
      }
    }
    
    if (!roomNo || roomNo.trim().length === 0) {
      errors.push('Room number is required');
    } else if (roomNo.length > 50) {
      errors.push('Room number must not exceed 50 characters');
    }
    
    if (invigilatorId) {
      const invigilatorIdError = validateObjectId(invigilatorId, 'Invigilator ID');
      if (invigilatorIdError) errors.push(invigilatorIdError);
    }
    
    if (!academicYear) {
      errors.push('Academic year is required');
    } else {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (totalMarks !== undefined) {
      const totalMarksNum = parseFloat(totalMarks);
      if (isNaN(totalMarksNum) || totalMarksNum <= 0) {
        errors.push('Total marks must be a positive number');
      } else if (totalMarksNum > 1000) {
        errors.push('Total marks must not exceed 1000');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const schedule = await examScheduleService.createExamSchedule({
      ...req.body,
      metadata: { createdBy: req.user?.id }
    });
    
    logger.info('Exam schedule created successfully:', { scheduleId: schedule._id });
    return createdResponse(res, schedule, 'Exam schedule created successfully');
  } catch (error) {
    logger.error('Error creating exam schedule:', error);
    return errorResponse(res, error.message);
  }
};

const getExamScheduleById = async (req, res) => {
  try {
    logger.info('Fetching exam schedule by ID');
    
    const { id } = req.params;
    
    // Validation
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) {
      return validationErrorResponse(res, [idError]);
    }
    
    const schedule = await examScheduleService.getExamScheduleById(id);
    
    if (!schedule) {
      return notFoundResponse(res, 'Exam schedule not found');
    }
    
    logger.info('Exam schedule fetched successfully:', { scheduleId: id });
    return successResponse(res, schedule, 'Exam schedule retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam schedule:', error);
    return errorResponse(res, error.message);
  }
};

const getExamScheduleByScheduleId = async (req, res) => {
  try {
    logger.info('Fetching exam schedule by schedule ID');
    
    const { scheduleId } = req.params;
    
    // Validation
    if (!scheduleId || scheduleId.trim().length === 0) {
      return validationErrorResponse(res, ['Schedule ID is required']);
    }
    
    const schedule = await examScheduleService.getExamScheduleByScheduleId(scheduleId);
    
    if (!schedule) {
      return notFoundResponse(res, 'Exam schedule not found');
    }
    
    logger.info('Exam schedule fetched successfully:', { scheduleId });
    return successResponse(res, schedule, 'Exam schedule retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam schedule:', error);
    return errorResponse(res, error.message);
  }
};

const getAllExamSchedules = async (req, res) => {
  try {
    logger.info('Fetching all exam schedules');
    
    const { institutionId, academicYear, status, classId, subject, examName, examDate, roomNo, search, page, limit, sortBy, sortOrder } = req.query;
    
    // Validation
    const errors = [];
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (examDate) {
      const examDateError = validateDate(examDate, 'Exam date');
      if (examDateError) errors.push(examDateError);
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
      errors.push('Invalid sort order. Must be one of: asc, desc, ascending, descending, 1, -1');
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await examScheduleService.getAllExamSchedules(
      { institutionId, academicYear, status, classId, subject, examName, examDate, roomNo, search },
      { page: pageNum, limit: limitNum, sortBy, sortOrder }
    );
    
    logger.info('Exam schedules fetched successfully');
    return successResponse(res, result, 'Exam schedules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam schedules:', error);
    return errorResponse(res, error.message);
  }
};

const updateExamSchedule = async (req, res) => {
  try {
    logger.info('Updating exam schedule');
    
    const { id } = req.params;
    const { classId, subject, examName, examDate, startTime, endTime, duration, roomNo, invigilatorId, academicYear, totalMarks, status } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (subject !== undefined) {
      if (subject.trim().length === 0) {
        errors.push('Subject cannot be empty');
      } else if (subject.length > 200) {
        errors.push('Subject must not exceed 200 characters');
      }
    }
    
    if (examName !== undefined) {
      if (examName.trim().length === 0) {
        errors.push('Exam name cannot be empty');
      } else if (examName.length > 200) {
        errors.push('Exam name must not exceed 200 characters');
      }
    }
    
    if (examDate) {
      const examDateError = validateDate(examDate, 'Exam date');
      if (examDateError) errors.push(examDateError);
    }
    
    if (startTime) {
      const startTimeError = validateTime(startTime, 'Start time');
      if (startTimeError) errors.push(startTimeError);
    }
    
    if (endTime) {
      const endTimeError = validateTime(endTime, 'End time');
      if (endTimeError) errors.push(endTimeError);
    }
    
    if (duration !== undefined) {
      const durationNum = parseInt(duration);
      if (isNaN(durationNum) || durationNum < 1) {
        errors.push('Duration must be a positive number (in minutes)');
      } else if (durationNum > 600) {
        errors.push('Duration must not exceed 600 minutes (10 hours)');
      }
    }
    
    if (roomNo !== undefined) {
      if (roomNo.trim().length === 0) {
        errors.push('Room number cannot be empty');
      } else if (roomNo.length > 50) {
        errors.push('Room number must not exceed 50 characters');
      }
    }
    
    if (invigilatorId) {
      const invigilatorIdError = validateObjectId(invigilatorId, 'Invigilator ID');
      if (invigilatorIdError) errors.push(invigilatorIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (totalMarks !== undefined) {
      const totalMarksNum = parseFloat(totalMarks);
      if (isNaN(totalMarksNum) || totalMarksNum <= 0) {
        errors.push('Total marks must be a positive number');
      } else if (totalMarksNum > 1000) {
        errors.push('Total marks must not exceed 1000');
      }
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schedule = await examScheduleService.updateExamSchedule(id, {
      ...req.body,
      metadata: { updatedBy: req.user?.id }
    });
    
    if (!schedule) {
      return notFoundResponse(res, 'Exam schedule not found');
    }
    
    logger.info('Exam schedule updated successfully:', { scheduleId: id });
    return successResponse(res, schedule, 'Exam schedule updated successfully');
  } catch (error) {
    logger.error('Error updating exam schedule:', error);
    return errorResponse(res, error.message);
  }
};

const deleteExamSchedule = async (req, res) => {
  try {
    logger.info('Deleting exam schedule');
    
    const { id } = req.params;
    
    // Validation
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) {
      return validationErrorResponse(res, [idError]);
    }
    
    const result = await examScheduleService.deleteExamSchedule(id);
    
    if (!result) {
      return notFoundResponse(res, 'Exam schedule not found');
    }
    
    logger.info('Exam schedule deleted successfully:', { scheduleId: id });
    return successResponse(res, null, 'Exam schedule deleted successfully');
  } catch (error) {
    logger.error('Error deleting exam schedule:', error);
    return errorResponse(res, error.message);
  }
};

const updateStatus = async (req, res) => {
  try {
    logger.info('Updating exam schedule status');
    
    const { id } = req.params;
    const { status } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schedule = await examScheduleService.updateStatus(id, status);
    
    if (!schedule) {
      return notFoundResponse(res, 'Exam schedule not found');
    }
    
    logger.info('Exam schedule status updated successfully:', { scheduleId: id, status });
    return successResponse(res, schedule, 'Status updated successfully');
  } catch (error) {
    logger.error('Error updating exam schedule status:', error);
    return errorResponse(res, error.message);
  }
};

const getExamSchedulesByClass = async (req, res) => {
  try {
    logger.info('Fetching exam schedules by class');
    
    const { classId } = req.params;
    const { academicYear, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const classIdError = validateObjectId(classId, 'Class ID');
    if (classIdError) errors.push(classIdError);
    
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
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schedules = await examScheduleService.getExamSchedulesByClass(classId, academicYear, { page: pageNum, limit: limitNum });
    
    logger.info('Exam schedules by class fetched successfully:', { classId });
    return successResponse(res, schedules, 'Exam schedules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam schedules by class:', error);
    return errorResponse(res, error.message);
  }
};

const getExamSchedulesByDate = async (req, res) => {
  try {
    logger.info('Fetching exam schedules by date');
    
    const { date } = req.params;
    const { institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    const dateError = validateDate(date, 'Date');
    if (dateError) errors.push(dateError);
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schedules = await examScheduleService.getExamSchedulesByDate(date, institutionId);
    
    logger.info('Exam schedules by date fetched successfully:', { date });
    return successResponse(res, schedules, 'Exam schedules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam schedules by date:', error);
    return errorResponse(res, error.message);
  }
};

const getExamSchedulesByRoom = async (req, res) => {
  try {
    logger.info('Fetching exam schedules by room');
    
    const { roomNo } = req.params;
    const { institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!roomNo || roomNo.trim().length === 0) {
      errors.push('Room number is required');
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schedules = await examScheduleService.getExamSchedulesByRoom(roomNo, institutionId);
    
    logger.info('Exam schedules by room fetched successfully:', { roomNo });
    return successResponse(res, schedules, 'Exam schedules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam schedules by room:', error);
    return errorResponse(res, error.message);
  }
};

const getExamSchedulesByInvigilator = async (req, res) => {
  try {
    logger.info('Fetching exam schedules by invigilator');
    
    const { invigilatorId } = req.params;
    
    // Validation
    const invigilatorIdError = validateObjectId(invigilatorId, 'Invigilator ID');
    if (invigilatorIdError) {
      return validationErrorResponse(res, [invigilatorIdError]);
    }
    
    const schedules = await examScheduleService.getExamSchedulesByInvigilator(invigilatorId);
    
    logger.info('Exam schedules by invigilator fetched successfully:', { invigilatorId });
    return successResponse(res, schedules, 'Exam schedules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam schedules by invigilator:', error);
    return errorResponse(res, error.message);
  }
};

const bulkUpdateStatus = async (req, res) => {
  try {
    logger.info('Bulk updating exam schedule status');
    
    const { scheduleIds, status } = req.body;
    
    // Validation
    const errors = [];
    
    if (!Array.isArray(scheduleIds) || scheduleIds.length === 0) {
      errors.push('Schedule IDs array is required and must not be empty');
    }
    
    if (scheduleIds && scheduleIds.length > 100) {
      errors.push('Cannot update more than 100 schedules at once');
    }
    
    if (scheduleIds) {
      for (let i = 0; i < scheduleIds.length; i++) {
        const idError = validateObjectId(scheduleIds[i], 'Schedule ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await examScheduleService.bulkUpdateStatus(scheduleIds, status);
    
    logger.info('Exam schedules bulk status updated successfully:', { count: result.modifiedCount });
    return successResponse(res, result, 'Schedules updated successfully');
  } catch (error) {
    logger.error('Error bulk updating exam schedule status:', error);
    return errorResponse(res, error.message);
  }
};

const getExamScheduleStatistics = async (req, res) => {
  try {
    logger.info('Fetching exam schedule statistics');
    
    const { institutionId, academicYear } = req.query;
    
    // Validation
    const errors = [];
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await examScheduleService.getExamScheduleStatistics(institutionId, academicYear);
    
    logger.info('Exam schedule statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam schedule statistics:', error);
    return errorResponse(res, error.message);
  }
};

const searchExamSchedules = async (req, res) => {
  try {
    logger.info('Searching exam schedules');
    
    const { q, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schedules = await examScheduleService.searchExamSchedules(q, institutionId);
    
    logger.info('Exam schedules search completed successfully');
    return successResponse(res, schedules, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching exam schedules:', error);
    return errorResponse(res, error.message);
  }
};

const checkRoomAvailability = async (req, res) => {
  try {
    logger.info('Checking room availability');
    
    const { roomNo, examDate, startTime, endTime, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!roomNo || roomNo.trim().length === 0) {
      errors.push('Room number is required');
    }
    
    if (!examDate) {
      errors.push('Exam date is required');
    } else {
      const examDateError = validateDate(examDate, 'Exam date');
      if (examDateError) errors.push(examDateError);
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
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const isAvailable = await examScheduleService.checkRoomAvailability(roomNo, examDate, startTime, endTime, institutionId);
    
    logger.info('Room availability checked successfully:', { roomNo, isAvailable });
    return successResponse(res, { isAvailable }, 'Room availability checked successfully');
  } catch (error) {
    logger.error('Error checking room availability:', error);
    return errorResponse(res, error.message);
  }
};

// Export Exam Schedules
const exportExamSchedules = async (req, res) => {
  try {
    logger.info('Exporting exam schedules');
    
    const { format, institutionId, academicYear, status, classId } = req.query;

    // Validation
    const errors = [];
    
    const validFormats = ['json', 'csv', 'xlsx', 'pdf'];
    if (!format) {
      errors.push('Format is required');
    } else if (!validFormats.includes(format)) {
      errors.push('Invalid format. Must be one of: ' + validFormats.join(', '));
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = {};
    if (institutionId) filters.institutionId = new mongoose.Types.ObjectId(institutionId);
    if (classId) filters.classId = new mongoose.Types.ObjectId(classId);
    if (academicYear) filters.academicYear = academicYear;
    if (status) filters.status = status;

    const schedules = await ExamSchedule.find(filters).lean();

    logger.info('Exam schedules exported successfully:', { format, count: schedules.length });
    return successResponse(res, {
      format,
      count: schedules.length,
      data: schedules,
      exportedAt: new Date()
    }, 'Exam schedules exported successfully');
  } catch (error) {
    logger.error('Error exporting exam schedules:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk Delete
const bulkDeleteExamSchedules = async (req, res) => {
  try {
    logger.info('Bulk deleting exam schedules');
    
    const { scheduleIds } = req.body;

    // Validation
    const errors = [];
    
    if (!Array.isArray(scheduleIds) || scheduleIds.length === 0) {
      errors.push('Schedule IDs array is required and must not be empty');
    }
    
    if (scheduleIds && scheduleIds.length > 100) {
      errors.push('Cannot delete more than 100 schedules at once');
    }
    
    if (scheduleIds) {
      for (let i = 0; i < scheduleIds.length; i++) {
        const idError = validateObjectId(scheduleIds[i], 'Schedule ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await ExamSchedule.deleteMany({
      _id: { $in: scheduleIds }
    });

    logger.info('Exam schedules bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, {
      deletedCount: result.deletedCount
    }, 'Exam schedules deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting exam schedules:', error);
    return errorResponse(res, error.message);
  }
};

export default {
  createExamSchedule,
  getExamScheduleById,
  getExamScheduleByScheduleId,
  getAllExamSchedules,
  updateExamSchedule,
  deleteExamSchedule,
  updateStatus,
  getExamSchedulesByClass,
  getExamSchedulesByDate,
  getExamSchedulesByRoom,
  getExamSchedulesByInvigilator,
  bulkUpdateStatus,
  getExamScheduleStatistics,
  searchExamSchedules,
  checkRoomAvailability,
  exportExamSchedules,
  bulkDeleteExamSchedules
};
