import studentAttendanceService from '../services/studentAttendanceService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['present', 'absent', 'late', 'excused', 'half_day', 'sick', 'leave'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_REASON_LENGTH = 500;
const MAX_NOTES_LENGTH = 1000;
const MIN_THRESHOLD = 0;
const MAX_THRESHOLD = 100;

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
  const errors = [];
  
  if (startDate) {
    const startError = validateDate(startDate, 'Start date');
    if (startError) errors.push(startError);
  }
  
  if (endDate) {
    const endError = validateDate(endDate, 'End date');
    if (endError) errors.push(endError);
  }
  
  if (startDate && endDate && !errors.length) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      errors.push('Start date must be before or equal to end date');
    }
  }
  
  return errors;
};

// Helper function to validate academic year format
const validateAcademicYear = (year) => {
  if (!year) return null;
  
  const yearPattern = /^\d{4}-\d{4}$/;
  if (!yearPattern.test(year)) {
    return 'Invalid academic year format. Expected format: YYYY-YYYY (e.g., 2023-2024)';
  }
  
  const [startYear, endYear] = year.split('-').map(Number);
  if (endYear !== startYear + 1) {
    return 'Academic year end must be one year after start year';
  }
  
  return null;
};

// Mark attendance
const markAttendance = async (req, res) => {
  try {
    logger.info('Marking attendance');
    
    const { studentId, date, status, reason, notes, classId, institutionId, academicYear } = req.body;
    
    // Validation
    const errors = [];
    
    if (!studentId) {
      errors.push('Student ID is required');
    } else {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (!date) {
      errors.push('Date is required');
    } else {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (!status || status.trim().length === 0) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (reason && reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (notes && notes.length > MAX_NOTES_LENGTH) {
      errors.push('Notes must not exceed ' + MAX_NOTES_LENGTH + ' characters');
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
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
    
    const attendance = await studentAttendanceService.markAttendance(req.body);
    
    logger.info('Attendance marked successfully:', { studentId, date, status });
    return createdResponse(res, attendance, 'Attendance marked successfully');
  } catch (error) {
    logger.error('Error marking attendance:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Bulk mark attendance
const bulkMarkAttendance = async (req, res) => {
  try {
    logger.info('Bulk marking attendance');
    
    const { attendanceRecords } = req.body;
    
    // Validation
    const errors = [];
    
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      errors.push('Attendance records must be an array');
    } else if (attendanceRecords.length === 0) {
      errors.push('Attendance records array cannot be empty');
    } else if (attendanceRecords.length > 500) {
      errors.push('Cannot mark more than 500 attendance records at once');
    } else {
      for (let i = 0; i < attendanceRecords.length; i++) {
        const record = attendanceRecords[i];
        
        if (!record.studentId) {
          errors.push('Record ' + (i + 1) + ': Student ID is required');
          break;
        }
        
        const studentIdError = validateObjectId(record.studentId, 'Student ID');
        if (studentIdError) {
          errors.push('Record ' + (i + 1) + ': ' + studentIdError);
          break;
        }
        
        if (!record.date) {
          errors.push('Record ' + (i + 1) + ': Date is required');
          break;
        }
        
        if (!record.status) {
          errors.push('Record ' + (i + 1) + ': Status is required');
          break;
        } else if (!VALID_STATUSES.includes(record.status)) {
          errors.push('Record ' + (i + 1) + ': Invalid status');
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await studentAttendanceService.bulkMarkAttendance(attendanceRecords);
    
    logger.info('Bulk attendance marked successfully:', { count: attendanceRecords.length });
    return createdResponse(res, result, 'Bulk attendance marked successfully');
  } catch (error) {
    logger.error('Error bulk marking attendance:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Get attendance by ID
const getAttendanceById = async (req, res) => {
  try {
    logger.info('Fetching attendance by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Attendance ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const attendance = await studentAttendanceService.getAttendanceById(id);
    
    if (!attendance) {
      return notFoundResponse(res, 'Attendance record not found');
    }
    
    logger.info('Attendance fetched successfully:', { attendanceId: id });
    return successResponse(res, attendance, 'Attendance record retrieved successfully');
  } catch (error) {
    logger.error('Error fetching attendance:', error);
    return errorResponse(res, error.message);
  }
};

// Get attendance by date
const getAttendanceByDate = async (req, res) => {
  try {
    logger.info('Fetching attendance by date');
    
    const { date } = req.params;
    const { classId, institutionId, status } = req.query;
    
    // Validation
    const errors = [];
    
    if (!date) {
      errors.push('Date is required');
    } else {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const records = await studentAttendanceService.getAttendanceByDate(date, req.query);
    
    logger.info('Attendance fetched by date successfully:', { date, count: records.length });
    return successResponse(res, records, 'Attendance records retrieved successfully');
  } catch (error) {
    logger.error('Error fetching attendance by date:', error);
    return errorResponse(res, error.message);
  }
};

// Get student attendance
const getStudentAttendance = async (req, res) => {
  try {
    logger.info('Fetching student attendance');
    
    const { studentId } = req.params;
    const { startDate, endDate, academicYear, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    const dateErrors = validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      errors.push(...dateErrors);
    }
    
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
    
    const result = await studentAttendanceService.getStudentAttendance(studentId, req.query);
    
    logger.info('Student attendance fetched successfully:', { studentId });
    return successResponse(res, result, 'Student attendance retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student attendance:', error);
    return errorResponse(res, error.message);
  }
};

// Get all attendance
const getAllAttendance = async (req, res) => {
  try {
    logger.info('Fetching all attendance');
    
    const { institutionId, classId, status, startDate, endDate, academicYear, page, limit, sortBy, sortOrder } = req.query;
    
    // Validation
    const errors = [];
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    const dateErrors = validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      errors.push(...dateErrors);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: ' + VALID_SORT_ORDERS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await studentAttendanceService.getAllAttendance(req.query);
    
    logger.info('All attendance fetched successfully');
    return successResponse(res, result, 'Attendance records retrieved successfully');
  } catch (error) {
    logger.error('Error fetching all attendance:', error);
    return errorResponse(res, error.message);
  }
};

// Update attendance
const updateAttendance = async (req, res) => {
  try {
    logger.info('Updating attendance');
    
    const { id } = req.params;
    const { status, reason, notes, modifiedBy, modifiedByName } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Attendance ID');
    if (idError) errors.push(idError);
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (reason !== undefined && reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (notes !== undefined && notes.length > MAX_NOTES_LENGTH) {
      errors.push('Notes must not exceed ' + MAX_NOTES_LENGTH + ' characters');
    }
    
    if (modifiedBy) {
      const modifiedByError = validateObjectId(modifiedBy, 'Modified by ID');
      if (modifiedByError) errors.push(modifiedByError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const { modifiedBy: modBy, modifiedByName: modByName, ...updateData } = req.body;
    const attendance = await studentAttendanceService.updateAttendance(
      id,
      updateData,
      modBy,
      modByName
    );
    
    if (!attendance) {
      return notFoundResponse(res, 'Attendance record not found');
    }
    
    logger.info('Attendance updated successfully:', { attendanceId: id });
    return successResponse(res, attendance, 'Attendance record updated successfully');
  } catch (error) {
    logger.error('Error updating attendance:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Delete attendance
const deleteAttendance = async (req, res) => {
  try {
    logger.info('Deleting attendance');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Attendance ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const attendance = await studentAttendanceService.deleteAttendance(id);
    
    if (!attendance) {
      return notFoundResponse(res, 'Attendance record not found');
    }
    
    logger.info('Attendance deleted successfully:', { attendanceId: id });
    return successResponse(res, null, 'Attendance record deleted successfully');
  } catch (error) {
    logger.error('Error deleting attendance:', error);
    return errorResponse(res, error.message);
  }
};

// Get attendance statistics
const getAttendanceStatistics = async (req, res) => {
  try {
    logger.info('Fetching attendance statistics');
    
    const { institutionId, classId, academicYear, startDate, endDate } = req.query;
    
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
    
    const dateErrors = validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      errors.push(...dateErrors);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await studentAttendanceService.getAttendanceStatistics(req.query);
    
    logger.info('Attendance statistics fetched successfully');
    return successResponse(res, stats, 'Attendance statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching attendance statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get student attendance percentage
const getStudentAttendancePercentage = async (req, res) => {
  try {
    logger.info('Fetching student attendance percentage');
    
    const { studentId } = req.params;
    const { academicYear, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await studentAttendanceService.getStudentAttendancePercentage(
      studentId,
      academicYear,
      institutionId
    );
    
    logger.info('Student attendance percentage fetched successfully:', { studentId });
    return successResponse(res, stats, 'Student attendance percentage retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student attendance percentage:', error);
    return errorResponse(res, error.message);
  }
};

// Get class attendance report
const getClassAttendanceReport = async (req, res) => {
  try {
    logger.info('Fetching class attendance report');
    
    const { className, section, date } = req.params;
    const { institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!className || className.trim().length === 0) {
      errors.push('Class name is required');
    }
    
    if (!section || section.trim().length === 0) {
      errors.push('Section is required');
    }
    
    if (!date) {
      errors.push('Date is required');
    } else {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const report = await studentAttendanceService.getClassAttendanceReport(
      className,
      section,
      date,
      institutionId
    );
    
    logger.info('Class attendance report fetched successfully:', { className, section, date });
    return successResponse(res, report, 'Class attendance report retrieved successfully');
  } catch (error) {
    logger.error('Error fetching class attendance report:', error);
    return errorResponse(res, error.message);
  }
};

// Get defaulters list
const getDefaultersList = async (req, res) => {
  try {
    logger.info('Fetching defaulters list');
    
    const { institutionId, academicYear, threshold } = req.query;
    
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
    
    const thresholdNum = threshold ? parseFloat(threshold) : 75;
    
    if (isNaN(thresholdNum) || thresholdNum < MIN_THRESHOLD || thresholdNum > MAX_THRESHOLD) {
      errors.push('Threshold must be between ' + MIN_THRESHOLD + ' and ' + MAX_THRESHOLD);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const defaulters = await studentAttendanceService.getDefaultersList(
      institutionId,
      academicYear,
      thresholdNum
    );
    
    logger.info('Defaulters list fetched successfully:', { threshold: thresholdNum, count: defaulters.length });
    return successResponse(res, defaulters, 'Defaulters list retrieved successfully');
  } catch (error) {
    logger.error('Error fetching defaulters list:', error);
    return errorResponse(res, error.message);
  }
};

// Get monthly attendance report
const getMonthlyAttendanceReport = async (req, res) => {
  try {
    logger.info('Fetching monthly attendance report');
    
    const { institutionId, academicYear, month, year } = req.query;
    
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
    
    if (!month) {
      errors.push('Month is required');
    } else {
      const monthNum = parseInt(month);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        errors.push('Month must be between 1 and 12');
      }
    }
    
    if (!year) {
      errors.push('Year is required');
    } else {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        errors.push('Year must be between 2000 and 2100');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const report = await studentAttendanceService.getMonthlyAttendanceReport(
      institutionId,
      academicYear,
      parseInt(month),
      parseInt(year)
    );
    
    logger.info('Monthly attendance report fetched successfully:', { month, year });
    return successResponse(res, report, 'Monthly attendance report retrieved successfully');
  } catch (error) {
    logger.error('Error fetching monthly attendance report:', error);
    return errorResponse(res, error.message);
  }
};

// Get attendance by status
const getAttendanceByStatus = async (req, res) => {
  try {
    logger.info('Fetching attendance by status');
    
    const { status } = req.params;
    const { institutionId, classId, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    const dateErrors = validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      errors.push(...dateErrors);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const records = await studentAttendanceService.getAttendanceByStatus(status, req.query);
    
    logger.info('Attendance fetched by status successfully:', { status, count: records.length });
    return successResponse(res, records, 'Attendance records retrieved successfully');
  } catch (error) {
    logger.error('Error fetching attendance by status:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete attendance
const bulkDeleteAttendance = async (req, res) => {
  try {
    logger.info('Bulk deleting attendance');
    
    const { attendanceIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!attendanceIds || !Array.isArray(attendanceIds)) {
      errors.push('Attendance IDs must be an array');
    } else if (attendanceIds.length === 0) {
      errors.push('Attendance IDs array cannot be empty');
    } else if (attendanceIds.length > 500) {
      errors.push('Cannot delete more than 500 attendance records at once');
    } else {
      for (const id of attendanceIds) {
        const idError = validateObjectId(id, 'Attendance ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await studentAttendanceService.bulkDeleteAttendance(attendanceIds);
    
    logger.info('Attendance bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Attendance records deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting attendance:', error);
    return errorResponse(res, error.message);
  }
};

// Export attendance
const exportAttendance = async (req, res) => {
  try {
    logger.info('Exporting attendance');
    
    const { format, institutionId, classId, status, startDate, endDate, academicYear } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    const dateErrors = validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      errors.push(...dateErrors);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await studentAttendanceService.exportAttendance({
      format: format.toLowerCase(),
      institutionId,
      classId,
      status,
      startDate,
      endDate,
      academicYear
    });
    
    logger.info('Attendance exported successfully:', { format });
    return successResponse(res, exportData, 'Attendance exported successfully');
  } catch (error) {
    logger.error('Error exporting attendance:', error);
    return errorResponse(res, error.message);
  }
};

// Get attendance trends
const getAttendanceTrends = async (req, res) => {
  try {
    logger.info('Fetching attendance trends');
    
    const { institutionId, classId, studentId, days } = req.query;
    
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
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    const daysNum = parseInt(days) || 30;
    
    if (daysNum < 1 || daysNum > 365) {
      errors.push('Days must be between 1 and 365');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const trends = await studentAttendanceService.getAttendanceTrends({
      institutionId,
      classId,
      studentId,
      days: daysNum
    });
    
    logger.info('Attendance trends fetched successfully:', { days: daysNum });
    return successResponse(res, trends, 'Attendance trends retrieved successfully');
  } catch (error) {
    logger.error('Error fetching attendance trends:', error);
    return errorResponse(res, error.message);
  }
};

// Get attendance summary
const getAttendanceSummary = async (req, res) => {
  try {
    logger.info('Fetching attendance summary');
    
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
    
    const summary = await studentAttendanceService.getAttendanceSummary({
      institutionId,
      academicYear
    });
    
    logger.info('Attendance summary fetched successfully');
    return successResponse(res, summary, 'Attendance summary retrieved successfully');
  } catch (error) {
    logger.error('Error fetching attendance summary:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  markAttendance,
  bulkMarkAttendance,
  getAttendanceById,
  getAttendanceByDate,
  getStudentAttendance,
  getAllAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStatistics,
  getStudentAttendancePercentage,
  getClassAttendanceReport,
  getDefaultersList,
  getMonthlyAttendanceReport,
  getAttendanceByStatus,
  bulkDeleteAttendance,
  exportAttendance,
  getAttendanceTrends,
  getAttendanceSummary
};
