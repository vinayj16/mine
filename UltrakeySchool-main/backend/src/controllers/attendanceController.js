import attendanceService from '../services/attendanceService.js';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid attendance statuses
const VALID_STATUSES = ['present', 'absent', 'late', 'excused', 'half_day'];

// Valid user types
const VALID_USER_TYPES = ['student', 'teacher', 'staff'];

// Valid date ranges
const VALID_DATE_RANGES = ['today', 'yesterday', 'week', 'month', 'custom'];

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

export const getAttendanceStats = async (req, res) => {
  try {
    const { dateRange = 'today', startDate, endDate, classId, userType } = req.query;
    const schoolId = req.user.schoolId;

    // Validate dateRange
    if (!VALID_DATE_RANGES.includes(dateRange)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Date range must be one of: ' + VALID_DATE_RANGES.join(', ') }]);
    }

    // Validate custom date range
    if (dateRange === 'custom') {
      if (!startDate || !endDate) {
        return validationErrorResponse(res, [{ field: 'dateRange', message: 'startDate and endDate are required for custom range' }]);
      }
      if (!validateDate(startDate) || !validateDate(endDate)) {
        return validationErrorResponse(res, [{ field: 'dateRange', message: 'Invalid date format' }]);
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        return validationErrorResponse(res, [{ field: 'dateRange', message: 'startDate must be before endDate' }]);
      }
    }

    // Validate classId if provided
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }
    }

    // Validate userType if provided
    if (userType && !VALID_USER_TYPES.includes(userType)) {
      return validationErrorResponse(res, [{ field: 'userType', message: 'User type must be one of: ' + VALID_USER_TYPES.join(', ') }]);
    }

    logger.info(`Fetching attendance stats for school ${schoolId}, range: ${dateRange}`);
    const stats = await attendanceService.getAttendanceStats(schoolId, dateRange, { startDate, endDate, classId, userType });

    return successResponse(res, stats, 'Attendance statistics fetched successfully', {
      dateRange,
      filters: { classId, userType }
    });
  } catch (error) {
    logger.error('Error fetching attendance stats:', error);
    return errorResponse(res, 'Failed to fetch attendance statistics', 500);
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { userId, userType, status, remarks, date, location } = req.body;
    const schoolId = req.user.schoolId;
    const markedBy = req.user.id;

    // Validate required fields
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    } else {
      const validation = validateObjectId(userId, 'userId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (!userType || !VALID_USER_TYPES.includes(userType)) {
      errors.push({ field: 'userType', message: 'User type must be one of: ' + VALID_USER_TYPES.join(', ') });
    }
    if (!status || !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }
    if (date && !validateDate(date)) {
      errors.push({ field: 'date', message: 'Invalid date format' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Marking attendance for user ${userId}, status: ${status}`);
    const attendance = await attendanceService.markAttendance(
      schoolId,
      userId,
      userType,
      status,
      markedBy,
      remarks,
      date,
      location
    );

    return successResponse(res, attendance, 'Attendance marked successfully');
  } catch (error) {
    logger.error('Error marking attendance:', error);
    return errorResponse(res, 'Failed to mark attendance', 500);
  }
};

export const getAttendanceHistory = async (req, res) => {
  try {
    const { userId, userType, startDate, endDate, status, page = 1, limit = 20 } = req.query;
    const schoolId = req.user.schoolId;

    // Validate required fields
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    } else {
      const validation = validateObjectId(userId, 'userId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (!userType || !VALID_USER_TYPES.includes(userType)) {
      errors.push({ field: 'userType', message: 'User type must be one of: ' + VALID_USER_TYPES.join(', ') });
    }
    if (!startDate || !endDate) {
      errors.push({ field: 'dateRange', message: 'startDate and endDate are required' });
    } else if (!validateDate(startDate) || !validateDate(endDate)) {
      errors.push({ field: 'dateRange', message: 'Invalid date format' });
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        errors.push({ field: 'dateRange', message: 'startDate must be before endDate' });
      }
    }
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

    logger.info(`Fetching attendance history for user ${userId}`);
    const history = await attendanceService.getAttendanceHistory(
      schoolId,
      userId,
      userType,
      new Date(startDate),
      new Date(endDate),
      { status, page: pageNum, limit: limitNum }
    );

    return successResponse(res, history.data, 'Attendance history fetched successfully', {
      pagination: history.pagination,
      filters: { status }
    });
  } catch (error) {
    logger.error('Error fetching attendance history:', error);
    return errorResponse(res, 'Failed to fetch attendance history', 500);
  }
};

export const getBulkAttendance = async (req, res) => {
  try {
    const { userType, date, classId, sectionId, status } = req.query;
    const schoolId = req.user.schoolId;

    // Validate userType
    if (!userType || !VALID_USER_TYPES.includes(userType)) {
      return validationErrorResponse(res, [{ field: 'userType', message: 'User type must be one of: ' + VALID_USER_TYPES.join(', ') }]);
    }

    // Validate date if provided
    if (date && !validateDate(date)) {
      return validationErrorResponse(res, [{ field: 'date', message: 'Invalid date format' }]);
    }

    // Validate classId if provided
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }
    }

    // Validate sectionId if provided
    if (sectionId) {
      const validation = validateObjectId(sectionId, 'sectionId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return validationErrorResponse(res, [{ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') }]);
    }

    logger.info(`Fetching bulk attendance for ${userType}, date: ${date || 'today'}`);
    const attendance = await attendanceService.getBulkAttendance(
      schoolId,
      userType,
      new Date(date || Date.now()),
      { classId, sectionId, status }
    );

    return successResponse(res, attendance, 'Bulk attendance fetched successfully', {
      date: date || new Date().toISOString().split('T')[0],
      filters: { classId, sectionId, status }
    });
  } catch (error) {
    logger.error('Error fetching bulk attendance:', error);
    return errorResponse(res, 'Failed to fetch bulk attendance', 500);
  }
};

/**
 * Get attendance with summary
 */
export const getAttendanceWithSummary = async (req, res) => {
  try {
    const { classId, sectionId, date } = req.query;
    const schoolId = req.user.schoolId;

    // Validate classId
    if (!classId) {
      return validationErrorResponse(res, [{ field: 'classId', message: 'Class ID is required' }]);
    }
    const validation = validateObjectId(classId, 'classId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate sectionId if provided
    if (sectionId) {
      const sectionValidation = validateObjectId(sectionId, 'sectionId');
      if (!sectionValidation.valid) {
        return validationErrorResponse(res, [sectionValidation.error]);
      }
    }

    // Validate date if provided
    if (date && !validateDate(date)) {
      return validationErrorResponse(res, [{ field: 'date', message: 'Invalid date format' }]);
    }

    logger.info(`Fetching attendance with summary for class ${classId}`);
    const attendance = await attendanceService.getAttendanceWithSummary(
      schoolId,
      classId,
      sectionId,
      new Date(date || Date.now())
    );

    return successResponse(res, attendance, 'Attendance with summary fetched successfully', {
      date: date || new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    logger.error('Error fetching attendance with summary:', error);
    return errorResponse(res, 'Failed to fetch attendance', 500);
  }
};


/**
 * Bulk mark attendance
 */
export const bulkMarkAttendance = async (req, res) => {
  try {
    const { attendanceRecords, date } = req.body;
    const schoolId = req.user.schoolId;
    const markedBy = req.user.id;

    // Validate attendanceRecords
    if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return validationErrorResponse(res, [{ field: 'attendanceRecords', message: 'attendanceRecords must be a non-empty array' }]);
    }

    if (attendanceRecords.length > 500) {
      return validationErrorResponse(res, [{ field: 'attendanceRecords', message: 'Maximum 500 attendance records allowed per request' }]);
    }

    // Validate each record
    const errors = [];
    attendanceRecords.forEach((record, index) => {
      if (!record.userId || !mongoose.Types.ObjectId.isValid(record.userId)) {
        errors.push({ field: `attendanceRecords[${index}].userId`, message: 'Invalid user ID' });
      }
      if (!record.userType || !VALID_USER_TYPES.includes(record.userType)) {
        errors.push({ field: `attendanceRecords[${index}].userType`, message: 'Invalid user type' });
      }
      if (!record.status || !VALID_STATUSES.includes(record.status)) {
        errors.push({ field: `attendanceRecords[${index}].status`, message: 'Invalid status' });
      }
    });

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    // Validate date if provided
    if (date && !validateDate(date)) {
      return validationErrorResponse(res, [{ field: 'date', message: 'Invalid date format' }]);
    }

    logger.info(`Bulk marking attendance for ${attendanceRecords.length} records`);
    const result = await attendanceService.bulkMarkAttendance(
      schoolId,
      attendanceRecords,
      markedBy,
      date
    );

    return successResponse(res, result, `${result.successful} attendance records marked successfully`);
  } catch (error) {
    logger.error('Error bulk marking attendance:', error);
    return errorResponse(res, 'Failed to bulk mark attendance', 500);
  }
};

/**
 * Update attendance
 */
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const schoolId = req.user.schoolId;
    const updatedBy = req.user.id;

    // Validate ID
    const validation = validateObjectId(id, 'attendanceId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return validationErrorResponse(res, [{ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') }]);
    }

    logger.info(`Updating attendance record ${id}`);
    const attendance = await attendanceService.updateAttendance(
      id,
      schoolId,
      { status, remarks },
      updatedBy
    );

    if (!attendance) {
      return errorResponse(res, 'Attendance record not found', 404);
    }

    return successResponse(res, attendance, 'Attendance updated successfully');
  } catch (error) {
    logger.error('Error updating attendance:', error);
    return errorResponse(res, 'Failed to update attendance', 500);
  }
};

/**
 * Delete attendance
 */
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user.schoolId;

    // Validate ID
    const validation = validateObjectId(id, 'attendanceId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info(`Deleting attendance record ${id}`);
    const result = await attendanceService.deleteAttendance(id, schoolId);

    if (!result) {
      return errorResponse(res, 'Attendance record not found', 404);
    }

    return successResponse(res, null, 'Attendance deleted successfully');
  } catch (error) {
    logger.error('Error deleting attendance:', error);
    return errorResponse(res, 'Failed to delete attendance', 500);
  }
};

/**
 * Get attendance report
 */
export const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, classId, sectionId, userType, format = 'json' } = req.query;
    const schoolId = req.user.schoolId;

    // Validate required fields
    const errors = [];
    if (!startDate || !endDate) {
      errors.push({ field: 'dateRange', message: 'startDate and endDate are required' });
    } else if (!validateDate(startDate) || !validateDate(endDate)) {
      errors.push({ field: 'dateRange', message: 'Invalid date format' });
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        errors.push({ field: 'dateRange', message: 'startDate must be before endDate' });
      }
    }

    // Validate classId if provided
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate userType if provided
    if (userType && !VALID_USER_TYPES.includes(userType)) {
      errors.push({ field: 'userType', message: 'User type must be one of: ' + VALID_USER_TYPES.join(', ') });
    }

    // Validate format
    const validFormats = ['json', 'csv', 'xlsx', 'pdf'];
    if (!validFormats.includes(format)) {
      errors.push({ field: 'format', message: 'Format must be one of: ' + validFormats.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Generating attendance report from ${startDate} to ${endDate}`);
    const report = await attendanceService.getAttendanceReport(
      schoolId,
      new Date(startDate),
      new Date(endDate),
      { classId, sectionId, userType, format }
    );

    // TODO: Implement CSV/XLSX/PDF conversion
    if (format === 'json') {
      return successResponse(res, report, 'Attendance report generated successfully', {
        format,
        dateRange: { startDate, endDate }
      });
    }

    return errorResponse(res, `Export format ${format} not yet implemented`, 501);
  } catch (error) {
    logger.error('Error generating attendance report:', error);
    return errorResponse(res, 'Failed to generate attendance report', 500);
  }
};

/**
 * Get attendance percentage
 */
export const getAttendancePercentage = async (req, res) => {
  try {
    const { userId, userType, startDate, endDate } = req.query;
    const schoolId = req.user.schoolId;

    // Validate required fields
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    } else {
      const validation = validateObjectId(userId, 'userId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (!userType || !VALID_USER_TYPES.includes(userType)) {
      errors.push({ field: 'userType', message: 'User type must be one of: ' + VALID_USER_TYPES.join(', ') });
    }
    if (!startDate || !endDate) {
      errors.push({ field: 'dateRange', message: 'startDate and endDate are required' });
    } else if (!validateDate(startDate) || !validateDate(endDate)) {
      errors.push({ field: 'dateRange', message: 'Invalid date format' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Calculating attendance percentage for user ${userId}`);
    const percentage = await attendanceService.getAttendancePercentage(
      schoolId,
      userId,
      userType,
      new Date(startDate),
      new Date(endDate)
    );

    return successResponse(res, percentage, 'Attendance percentage calculated successfully');
  } catch (error) {
    logger.error('Error calculating attendance percentage:', error);
    return errorResponse(res, 'Failed to calculate attendance percentage', 500);
  }
};

/**
 * Get low attendance users
 */
export const getLowAttendanceUsers = async (req, res) => {
  try {
    const { threshold = 75, userType, classId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const schoolId = req.user.schoolId;

    // Validate threshold
    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum) || thresholdNum < 0 || thresholdNum > 100) {
      return validationErrorResponse(res, [{ field: 'threshold', message: 'Threshold must be between 0 and 100' }]);
    }

    // Validate userType if provided
    if (userType && !VALID_USER_TYPES.includes(userType)) {
      return validationErrorResponse(res, [{ field: 'userType', message: 'User type must be one of: ' + VALID_USER_TYPES.join(', ') }]);
    }

    // Validate classId if provided
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }
    }

    // Validate date range if provided
    if (startDate && endDate) {
      if (!validateDate(startDate) || !validateDate(endDate)) {
        return validationErrorResponse(res, [{ field: 'dateRange', message: 'Invalid date format' }]);
      }
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

    logger.info(`Fetching users with attendance below ${thresholdNum}%`);
    const result = await attendanceService.getLowAttendanceUsers(
      schoolId,
      thresholdNum,
      { userType, classId, startDate, endDate, page: pageNum, limit: limitNum }
    );

    return successResponse(res, result.users, 'Low attendance users fetched successfully', {
      pagination: result.pagination,
      threshold: thresholdNum
    });
  } catch (error) {
    logger.error('Error fetching low attendance users:', error);
    return errorResponse(res, 'Failed to fetch low attendance users', 500);
  }
};


export default {
  getAttendanceStats,
  markAttendance,
  getAttendanceHistory,
  getBulkAttendance,
  getAttendanceWithSummary,
  bulkMarkAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceReport,
  getAttendancePercentage,
  getLowAttendanceUsers
};
