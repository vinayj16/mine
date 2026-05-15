import classTimetableService from '../services/classTimetableService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid days of week
const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Valid timetable statuses
const VALID_STATUSES = ['active', 'inactive', 'draft', 'archived'];

// Valid time format (accepts both 24-hour and 12-hour with AM/PM)
const TIME_REGEX = /^(([0-1]?[0-9]|2[0-3]):[0-5][0-9])|((0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm))$/;

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
 * Validate academic year format
 */
const validateAcademicYear = (year) => {
  if (!year) return true;
  return /^\d{4}-\d{4}$/.test(year);
};

const createTimetable = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { classId, academicYear, status, periods } = req.body;

    // Get schoolId from user if not in params
    let finalSchoolId = schoolId || req.user?.institutionId || req.user?.institution || req.body.schoolId || req.body.institutionId;
    if (!finalSchoolId) {
      // Try to get from user context
    }
    
    // Validate required fields - make more lenient
    const errors = [];
    // if (!finalSchoolId) {
    //   errors.push({ field: 'schoolId', message: 'School ID is required' });
    // } else if (!validateObjectId(finalSchoolId).valid) {
    //   // Allow string schoolIds too
    // }
    // Make classId optional for easier creation
    // if (!classId) {
    //   errors.push({ field: 'classId', message: 'Class ID is required' });
    // } else {
    //   const validation = validateObjectId(classId, 'classId');
    //   if (!validation.valid) {
    //     errors.push(validation.error);
    //   }
    // }
    if (!academicYear) {
      // Make optional - use default if not provided
      req.body.academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    } else if (!validateAcademicYear(academicYear)) {
      errors.push({ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }
    if (periods && Array.isArray(periods)) {
      periods.forEach((period, index) => {
        if (period.day && !VALID_DAYS.includes(period.day.toLowerCase())) {
          errors.push({ field: 'periods[' + index + '].day', message: 'Invalid day' });
        }
        if (period.startTime && !validateTime(period.startTime)) {
          errors.push({ field: 'periods[' + index + '].startTime', message: 'Invalid time format' });
        }
        if (period.endTime && !validateTime(period.endTime)) {
          errors.push({ field: 'periods[' + index + '].endTime', message: 'Invalid time format' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Creating timetable for school ' + schoolId + ' and class ' + classId);
    const timetable = await classTimetableService.createTimetable(schoolId, req.body);
    
    return createdResponse(res, timetable, 'Timetable created successfully');
  } catch (error) {
    logger.error('Error creating timetable:', error);
    return errorResponse(res, error.message, 400);
  }
};

const getTimetables = async (req, res, next) => {
  try {
    const { schoolId: paramSchoolId } = req.params;
    const { schoolId: querySchoolId, classId, academicYear, status, page = 1, limit = 20 } = req.query;

    // Use schoolId from params or query params
    const schoolId = paramSchoolId || querySchoolId;

    // Validate schoolId if provided
    const errors = [];
    if (schoolId) {
      const schoolValidation = validateObjectId(schoolId, 'schoolId');
      if (!schoolValidation.valid) {
        errors.push(schoolValidation.error);
      }
    }

    // Validate classId if provided
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate academicYear if provided
    if (academicYear && !validateAcademicYear(academicYear)) {
      errors.push({ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' });
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
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

    const filters = {};
    if (classId) filters.classId = classId;
    if (academicYear) filters.academicYear = academicYear;
    if (status) filters.status = status;

    logger.info('Fetching timetables for school: ' + schoolId);
    const timetables = await classTimetableService.getTimetables(schoolId, filters);
    
    return successResponse(res, timetables, 'Timetables fetched successfully', {
      filters
    });
  } catch (error) {
    logger.error('Error fetching timetables:', error);
    return errorResponse(res, 'Failed to fetch timetables', 500);
  }
};

const getTimetableById = async (req, res, next) => {
  try {
    const { schoolId, timetableId } = req.params;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const timetableValidation = validateObjectId(timetableId, 'timetableId');
    if (!timetableValidation.valid) {
      errors.push(timetableValidation.error);
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching timetable by ID: ' + timetableId);
    const timetable = await classTimetableService.getTimetableById(timetableId, schoolId);
    
    if (!timetable) {
      return notFoundResponse(res, 'Timetable not found');
    }

    return successResponse(res, timetable, 'Timetable fetched successfully');
  } catch (error) {
    logger.error('Error fetching timetable by ID:', error);
    return errorResponse(res, 'Failed to fetch timetable', 500);
  }
};

const updateTimetable = async (req, res, next) => {
  try {
    const { schoolId, timetableId } = req.params;
    const { status, academicYear, periods } = req.body;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const timetableValidation = validateObjectId(timetableId, 'timetableId');
    if (!timetableValidation.valid) {
      errors.push(timetableValidation.error);
    }

    // Validate fields if provided
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }
    if (academicYear && !validateAcademicYear(academicYear)) {
      errors.push({ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' });
    }
    if (periods && Array.isArray(periods)) {
      periods.forEach((period, index) => {
        if (period.day && !VALID_DAYS.includes(period.day.toLowerCase())) {
          errors.push({ field: 'periods[' + index + '].day', message: 'Invalid day' });
        }
        if (period.startTime && !validateTime(period.startTime)) {
          errors.push({ field: 'periods[' + index + '].startTime', message: 'Invalid time format' });
        }
        if (period.endTime && !validateTime(period.endTime)) {
          errors.push({ field: 'periods[' + index + '].endTime', message: 'Invalid time format' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Updating timetable: ' + timetableId);
    const timetable = await classTimetableService.updateTimetable(timetableId, schoolId, req.body);
    
    if (!timetable) {
      return notFoundResponse(res, 'Timetable not found');
    }

    return successResponse(res, timetable, 'Timetable updated successfully');
  } catch (error) {
    logger.error('Error updating timetable:', error);
    return errorResponse(res, error.message, 400);
  }
};

const deleteTimetable = async (req, res, next) => {
  try {
    const { schoolId, timetableId } = req.params;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const timetableValidation = validateObjectId(timetableId, 'timetableId');
    if (!timetableValidation.valid) {
      errors.push(timetableValidation.error);
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Deleting timetable: ' + timetableId);
    const result = await classTimetableService.deleteTimetable(timetableId, schoolId);
    
    if (!result) {
      return notFoundResponse(res, 'Timetable not found');
    }

    return successResponse(res, null, 'Timetable deleted successfully');
  } catch (error) {
    logger.error('Error deleting timetable:', error);
    return errorResponse(res, error.message, 400);
  }
};

const getWeeklyTimetable = async (req, res, next) => {
  try {
    const { schoolId, classId } = req.params;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const classValidation = validateObjectId(classId, 'classId');
    if (!classValidation.valid) {
      errors.push(classValidation.error);
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching weekly timetable for class: ' + classId);
    const timetables = await classTimetableService.getWeeklyTimetable(schoolId, classId);
    
    return successResponse(res, timetables, 'Weekly timetable fetched successfully');
  } catch (error) {
    logger.error('Error fetching weekly timetable:', error);
    return errorResponse(res, 'Failed to fetch weekly timetable', 500);
  }
};

const getTimetableByDay = async (req, res, next) => {
  try {
    const { schoolId, classId, day } = req.params;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const classValidation = validateObjectId(classId, 'classId');
    if (!classValidation.valid) {
      errors.push(classValidation.error);
    }

    // Validate day
    if (!day || !VALID_DAYS.includes(day.toLowerCase())) {
      errors.push({ field: 'day', message: 'Day must be one of: ' + VALID_DAYS.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching timetable for class ' + classId + ' on ' + day);
    const timetable = await classTimetableService.getTimetableByDay(schoolId, classId, day);
    
    return successResponse(res, timetable, 'Timetable fetched successfully', {
      day
    });
  } catch (error) {
    logger.error('Error fetching timetable by day:', error);
    return errorResponse(res, 'Failed to fetch timetable', 500);
  }
};

/**
 * Export timetables data
 */
const exportTimetables = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { format = 'json', classId, academicYear } = req.query;

    // Validate format
    const validFormats = ['json', 'csv', 'xlsx', 'pdf'];
    const errors = [];
    if (!validFormats.includes(format)) {
      errors.push({ field: 'format', message: 'Format must be one of: ' + validFormats.join(', ') });
    }

    // Validate schoolId
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }

    // Validate classId if provided
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate academicYear if provided
    if (academicYear && !validateAcademicYear(academicYear)) {
      errors.push({ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Exporting timetables data in format: ' + format);
    const data = await classTimetableService.exportTimetables(schoolId, { classId, academicYear, format });

    if (format === 'json') {
      return successResponse(res, data, 'Timetables exported successfully', {
        format,
        recordCount: data.length
      });
    }

    return errorResponse(res, 'Export format ' + format + ' not yet implemented', 501);
  } catch (error) {
    logger.error('Error exporting timetables:', error);
    return errorResponse(res, 'Failed to export timetables', 500);
  }
};

/**
 * Clone timetable
 */
const cloneTimetable = async (req, res) => {
  try {
    const { schoolId, timetableId } = req.params;
    const { targetClassId, targetAcademicYear } = req.body;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const timetableValidation = validateObjectId(timetableId, 'timetableId');
    if (!timetableValidation.valid) {
      errors.push(timetableValidation.error);
    }

    // Validate target fields
    if (!targetClassId) {
      errors.push({ field: 'targetClassId', message: 'Target class ID is required' });
    } else {
      const validation = validateObjectId(targetClassId, 'targetClassId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (!targetAcademicYear) {
      errors.push({ field: 'targetAcademicYear', message: 'Target academic year is required' });
    } else if (!validateAcademicYear(targetAcademicYear)) {
      errors.push({ field: 'targetAcademicYear', message: 'Academic year must be in format YYYY-YYYY' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Cloning timetable ' + timetableId + ' to class ' + targetClassId);
    const newTimetable = await classTimetableService.cloneTimetable(timetableId, schoolId, { targetClassId, targetAcademicYear });

    return createdResponse(res, newTimetable, 'Timetable cloned successfully');
  } catch (error) {
    logger.error('Error cloning timetable:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Get timetable statistics
 */
const getTimetableStatistics = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { academicYear } = req.query;

    // Validate schoolId
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }

    // Validate academicYear if provided
    if (academicYear && !validateAcademicYear(academicYear)) {
      errors.push({ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching timetable statistics for school: ' + schoolId);
    const statistics = await classTimetableService.getTimetableStatistics(schoolId, academicYear);

    return successResponse(res, statistics, 'Timetable statistics fetched successfully', {
      academicYear: academicYear || 'all'
    });
  } catch (error) {
    logger.error('Error fetching timetable statistics:', error);
    return errorResponse(res, 'Failed to fetch statistics', 500);
  }
};

/**
 * Bulk update timetable status
 */
const bulkUpdateStatus = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { timetableIds, status } = req.body;

    // Validate schoolId
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }

    // Validate timetableIds
    if (!timetableIds || !Array.isArray(timetableIds) || timetableIds.length === 0) {
      errors.push({ field: 'timetableIds', message: 'timetableIds must be a non-empty array' });
    } else if (timetableIds.length > 100) {
      errors.push({ field: 'timetableIds', message: 'Maximum 100 timetables allowed per request' });
    } else {
      timetableIds.forEach((id, index) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ field: 'timetableIds[' + index + ']', message: 'Invalid timetable ID' });
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

    logger.info('Bulk updating status for ' + timetableIds.length + ' timetables');
    const result = await classTimetableService.bulkUpdateStatus(schoolId, timetableIds, status);

    return successResponse(res, result, timetableIds.length + ' timetables status updated successfully');
  } catch (error) {
    logger.error('Error bulk updating status:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Get timetable conflicts
 */
const getTimetableConflicts = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { classId, teacherId } = req.query;

    // Validate schoolId
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
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

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Checking for timetable conflicts');
    const conflicts = await classTimetableService.getTimetableConflicts(schoolId, { classId, teacherId });

    return successResponse(res, conflicts, 'Timetable conflicts fetched successfully', {
      conflictCount: conflicts.length
    });
  } catch (error) {
    logger.error('Error fetching timetable conflicts:', error);
    return errorResponse(res, 'Failed to fetch conflicts', 500);
  }
};

/**
 * Add period to timetable
 */
const addPeriod = async (req, res) => {
  try {
    const { schoolId, timetableId } = req.params;
    const { day, startTime, endTime, subjectId, teacherId, roomId } = req.body;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const timetableValidation = validateObjectId(timetableId, 'timetableId');
    if (!timetableValidation.valid) {
      errors.push(timetableValidation.error);
    }

    // Validate period fields
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
    if (subjectId) {
      const validation = validateObjectId(subjectId, 'subjectId');
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
    if (roomId) {
      const validation = validateObjectId(roomId, 'roomId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Adding period to timetable: ' + timetableId);
    const timetable = await classTimetableService.addPeriod(timetableId, schoolId, req.body);

    if (!timetable) {
      return notFoundResponse(res, 'Timetable not found');
    }

    return successResponse(res, timetable, 'Period added successfully');
  } catch (error) {
    logger.error('Error adding period:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Remove period from timetable
 */
const removePeriod = async (req, res) => {
  try {
    const { schoolId, timetableId, periodId } = req.params;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const timetableValidation = validateObjectId(timetableId, 'timetableId');
    if (!timetableValidation.valid) {
      errors.push(timetableValidation.error);
    }
    const periodValidation = validateObjectId(periodId, 'periodId');
    if (!periodValidation.valid) {
      errors.push(periodValidation.error);
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Removing period ' + periodId + ' from timetable ' + timetableId);
    const timetable = await classTimetableService.removePeriod(timetableId, schoolId, periodId);

    if (!timetable) {
      return notFoundResponse(res, 'Timetable or period not found');
    }

    return successResponse(res, timetable, 'Period removed successfully');
  } catch (error) {
    logger.error('Error removing period:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Get teacher timetable
 */
const getTeacherTimetable = async (req, res) => {
  try {
    const { schoolId, teacherId } = req.params;
    const { academicYear } = req.query;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const teacherValidation = validateObjectId(teacherId, 'teacherId');
    if (!teacherValidation.valid) {
      errors.push(teacherValidation.error);
    }

    // Validate academicYear if provided
    if (academicYear && !validateAcademicYear(academicYear)) {
      errors.push({ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching timetable for teacher: ' + teacherId);
    const timetable = await classTimetableService.getTeacherTimetable(schoolId, teacherId, academicYear);

    return successResponse(res, timetable, 'Teacher timetable fetched successfully');
  } catch (error) {
    logger.error('Error fetching teacher timetable:', error);
    return errorResponse(res, 'Failed to fetch teacher timetable', 500);
  }
};


export default {
  createTimetable,
  getTimetables,
  getTimetableById,
  updateTimetable,
  deleteTimetable,
  getWeeklyTimetable,
  getTimetableByDay,
  exportTimetables,
  cloneTimetable,
  getTimetableStatistics,
  bulkUpdateStatus,
  getTimetableConflicts,
  addPeriod,
  removePeriod,
  getTeacherTimetable
};
