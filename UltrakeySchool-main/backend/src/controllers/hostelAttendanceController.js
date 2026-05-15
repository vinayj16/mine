import hostelAttendanceService from '../services/hostelAttendanceService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['present', 'absent', 'late', 'on_leave', 'excused'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];

// Helper function to get institution ID
const getInstitutionId = (req) => req.user?.schoolId || req.user?.institutionId || req.tenantId;

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
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    return 'Start date cannot be after end date';
  }
  return null;
};

const recordAttendance = async (req, res, next) => {
  try {
    logger.info('Recording hostel attendance');
    
    const { roomId, studentId, date, status, remarks } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    const dateError = validateDate(date, 'Date');
    if (dateError) errors.push(dateError);
    
    if (!status || status.trim().length === 0) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (remarks && remarks.length > 500) {
      errors.push('Remarks must not exceed 500 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const attendance = await hostelAttendanceService.recordAttendance({
      institutionId: institution,
      roomId,
      studentId,
      date,
      status,
      remarks,
      recordedBy: req.user?.id
    });
    
    logger.info('Hostel attendance recorded successfully:', { attendanceId: attendance._id });
    return createdResponse(res, attendance, 'Attendance recorded successfully');
  } catch (error) {
    logger.error('Error recording hostel attendance:', error);
    next(error);
  }
};

const listAttendance = async (req, res, next) => {
  try {
    logger.info('Fetching hostel attendance records');
    
    const { roomId, date, studentId, status, page, limit, startDate, endDate } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (roomId) {
      const roomIdError = validateObjectId(roomId, 'Room ID');
      if (roomIdError) errors.push(roomIdError);
    }
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (date) {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
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
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const records = await hostelAttendanceService.getAttendance(
      roomId,
      institution,
      date,
      { studentId, status, page: pageNum, limit: limitNum, startDate, endDate }
    );
    
    logger.info('Hostel attendance records fetched successfully');
    return successResponse(res, records, 'Attendance records retrieved successfully');
  } catch (error) {
    logger.error('Error fetching hostel attendance:', error);
    next(error);
  }
};

const summaryAttendance = async (req, res, next) => {
  try {
    logger.info('Fetching hostel attendance summary');
    
    const { roomId, startDate, endDate } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (roomId) {
      const roomIdError = validateObjectId(roomId, 'Room ID');
      if (roomIdError) errors.push(roomIdError);
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
    
    const summary = await hostelAttendanceService.getRoomSummary(
      roomId,
      institution,
      startDate,
      endDate
    );
    
    logger.info('Hostel attendance summary fetched successfully');
    return successResponse(res, summary, 'Attendance summary retrieved successfully');
  } catch (error) {
    logger.error('Error fetching hostel attendance summary:', error);
    next(error);
  }
};

const recordWalkthrough = async (req, res, next) => {
  try {
    logger.info('Recording room walkthrough');
    
    const { roomId, notes, issues, cleanliness, maintenance } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    if (notes && typeof notes === 'object') {
      if (notes.general && notes.general.length > 1000) {
        errors.push('General notes must not exceed 1000 characters');
      }
      if (notes.issues && notes.issues.length > 1000) {
        errors.push('Issues notes must not exceed 1000 characters');
      }
    }
    
    if (cleanliness !== undefined) {
      const cleanlinessNum = parseInt(cleanliness);
      if (isNaN(cleanlinessNum) || cleanlinessNum < 1 || cleanlinessNum > 10) {
        errors.push('Cleanliness rating must be between 1 and 10');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const room = await hostelAttendanceService.recordRoomWalkthrough(
      roomId,
      institution,
      { notes, issues, cleanliness, maintenance },
      req.user?.id
    );
    
    if (!room) {
      return notFoundResponse(res, 'Room not found');
    }
    
    logger.info('Room walkthrough recorded successfully:', { roomId });
    return successResponse(res, room, 'Walkthrough recorded successfully');
  } catch (error) {
    logger.error('Error recording room walkthrough:', error);
    next(error);
  }
};

const getAttendanceByStudent = async (req, res, next) => {
  try {
    logger.info('Fetching attendance by student');
    
    const { studentId } = req.params;
    const { startDate, endDate, page, limit } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
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
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const attendance = await hostelAttendanceService.getAttendanceByStudent(
      studentId,
      institution,
      { startDate, endDate, page: pageNum, limit: limitNum }
    );
    
    logger.info('Attendance fetched successfully for student:', { studentId });
    return successResponse(res, attendance, 'Attendance retrieved successfully');
  } catch (error) {
    logger.error('Error fetching attendance by student:', error);
    next(error);
  }
};

const getAttendanceByRoom = async (req, res, next) => {
  try {
    logger.info('Fetching attendance by room');
    
    const { roomId } = req.params;
    const { date, status, page, limit } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    if (date) {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
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
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const attendance = await hostelAttendanceService.getAttendanceByRoom(
      roomId,
      institution,
      { date, status, page: pageNum, limit: limitNum }
    );
    
    logger.info('Attendance fetched successfully for room:', { roomId });
    return successResponse(res, attendance, 'Attendance retrieved successfully');
  } catch (error) {
    logger.error('Error fetching attendance by room:', error);
    next(error);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    logger.info('Updating hostel attendance');
    
    const { attendanceId } = req.params;
    const { status, remarks } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    const attendanceIdError = validateObjectId(attendanceId, 'Attendance ID');
    if (attendanceIdError) errors.push(attendanceIdError);
    
    if (status !== undefined) {
      if (!status || status.trim().length === 0) {
        errors.push('Status cannot be empty');
      } else if (!VALID_STATUSES.includes(status)) {
        errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
      }
    }
    
    if (remarks !== undefined && remarks.length > 500) {
      errors.push('Remarks must not exceed 500 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const attendance = await hostelAttendanceService.updateAttendance(
      attendanceId,
      institution,
      req.body
    );
    
    if (!attendance) {
      return notFoundResponse(res, 'Attendance record not found');
    }
    
    logger.info('Hostel attendance updated successfully:', { attendanceId });
    return successResponse(res, attendance, 'Attendance updated successfully');
  } catch (error) {
    logger.error('Error updating hostel attendance:', error);
    next(error);
  }
};

const deleteAttendance = async (req, res, next) => {
  try {
    logger.info('Deleting hostel attendance');
    
    const { attendanceId } = req.params;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    const attendanceIdError = validateObjectId(attendanceId, 'Attendance ID');
    if (attendanceIdError) errors.push(attendanceIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const attendance = await hostelAttendanceService.deleteAttendance(
      attendanceId,
      institution
    );
    
    if (!attendance) {
      return notFoundResponse(res, 'Attendance record not found');
    }
    
    logger.info('Hostel attendance deleted successfully:', { attendanceId });
    return successResponse(res, null, 'Attendance deleted successfully');
  } catch (error) {
    logger.error('Error deleting hostel attendance:', error);
    next(error);
  }
};

const getAttendanceStatistics = async (req, res, next) => {
  try {
    logger.info('Fetching hostel attendance statistics');
    
    const { roomId, startDate, endDate } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (roomId) {
      const roomIdError = validateObjectId(roomId, 'Room ID');
      if (roomIdError) errors.push(roomIdError);
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
    
    const statistics = await hostelAttendanceService.getAttendanceStatistics(
      institution,
      { roomId, startDate, endDate }
    );
    
    logger.info('Hostel attendance statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching hostel attendance statistics:', error);
    next(error);
  }
};

const bulkRecordAttendance = async (req, res, next) => {
  try {
    logger.info('Bulk recording hostel attendance');
    
    const { attendanceRecords } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      errors.push('Attendance records array is required and must not be empty');
    } else {
      if (attendanceRecords.length > 100) {
        errors.push('Cannot record more than 100 attendance records at once');
      }
      
      for (let i = 0; i < Math.min(attendanceRecords.length, 10); i++) {
        const record = attendanceRecords[i];
        
        if (!record.roomId) {
          errors.push('Room ID is required for record at index ' + i);
          break;
        }
        
        if (!record.studentId) {
          errors.push('Student ID is required for record at index ' + i);
          break;
        }
        
        if (!record.date) {
          errors.push('Date is required for record at index ' + i);
          break;
        }
        
        if (!record.status) {
          errors.push('Status is required for record at index ' + i);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await hostelAttendanceService.bulkRecordAttendance(
      institution,
      attendanceRecords,
      req.user?.id
    );
    
    logger.info('Hostel attendance recorded successfully:', { count: result.count });
    return createdResponse(res, result, 'Attendance records created successfully');
  } catch (error) {
    logger.error('Error bulk recording hostel attendance:', error);
    next(error);
  }
};

const exportAttendance = async (req, res, next) => {
  try {
    logger.info('Exporting hostel attendance');
    
    const { format, roomId, startDate, endDate, status } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (roomId) {
      const roomIdError = validateObjectId(roomId, 'Room ID');
      if (roomIdError) errors.push(roomIdError);
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
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await hostelAttendanceService.exportAttendance(
      institution,
      format.toLowerCase(),
      { roomId, startDate, endDate, status }
    );
    
    logger.info('Hostel attendance exported successfully:', { format });
    return successResponse(res, exportData, 'Attendance exported successfully');
  } catch (error) {
    logger.error('Error exporting hostel attendance:', error);
    next(error);
  }
};


export default {
  recordAttendance,
  listAttendance,
  summaryAttendance,
  recordWalkthrough,
  getAttendanceByStudent,
  getAttendanceByRoom,
  updateAttendance,
  deleteAttendance,
  getAttendanceStatistics,
  bulkRecordAttendance,
  exportAttendance
};
