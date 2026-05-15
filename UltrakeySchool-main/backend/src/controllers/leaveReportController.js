import Student from '../models/Student.js';
import StudentLeave from '../models/StudentLeave.js';
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Define leave type limits (can be made configurable per school)
const LEAVE_LIMITS = {
  sick: 10,
  casual: 12,
  emergency: 10,
  other: 10
};

// Validation constants
const VALID_LEAVE_TYPES = ['sick', 'casual', 'emergency', 'other'];
const VALID_LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];

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

// Helper function to validate academic year format
const validateAcademicYear = (year) => {
  if (!year) {
    return null; // Academic year is optional
  }
  const yearRegex = /^\d{4}-\d{4}$/;
  if (!yearRegex.test(year)) {
    return 'Invalid academic year format. Expected format: YYYY-YYYY';
  }
  const [startYear, endYear] = year.split('-').map(Number);
  if (endYear !== startYear + 1) {
    return 'Academic year end must be one year after start';
  }
  return null;
};

const getLeaveReport = async (req, res) => {
  try {
    logger.info('Fetching leave report');
    
    const { schoolId } = req.params;
    const { classId, section, academicYear } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (section && section.length > 10) {
      errors.push('Section must not exceed 10 characters');
    }
    
    if (academicYear) {
      const yearError = validateAcademicYear(academicYear);
      if (yearError) errors.push(yearError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Build student filter
    const studentFilter = { schoolId, isActive: true };
    if (classId) studentFilter.classId = classId;
    if (section) studentFilter.section = section;
    
    // Get all students
    const students = await Student.find(studentFilter)
      .select('admissionNumber firstName lastName rollNumber avatar classId section')
      .sort({ admissionNumber: 1 });
    
    // Get current academic year date range
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear + '-04-01'); // April 1st
    const endDate = new Date((currentYear + 1) + '-03-31'); // March 31st next year
    
    // Get all approved leaves for these students in the academic year
    const studentIds = students.map(s => s._id);
    const leaves = await StudentLeave.find({
      schoolId,
      studentId: { $in: studentIds },
      status: 'approved',
      startDate: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate leave summary for each student
    const leaveReport = students.map(student => {
      const studentLeaves = leaves.filter(
        leave => leave.studentId.toString() === student._id.toString()
      );
      
      // Calculate used leaves by type
      const leaveSummary = {
        sick: { used: 0, available: LEAVE_LIMITS.sick },
        casual: { used: 0, available: LEAVE_LIMITS.casual },
        emergency: { used: 0, available: LEAVE_LIMITS.emergency },
        other: { used: 0, available: LEAVE_LIMITS.other }
      };
      
      studentLeaves.forEach(leave => {
        if (leaveSummary[leave.leaveType]) {
          leaveSummary[leave.leaveType].used += leave.totalDays;
        }
      });
      
      // Calculate available leaves
      Object.keys(leaveSummary).forEach(type => {
        leaveSummary[type].available = Math.max(
          0,
          LEAVE_LIMITS[type] - leaveSummary[type].used
        );
      });
      
      return {
        _id: student._id,
        admissionNumber: student.admissionNumber,
        studentName: student.firstName + ' ' + student.lastName,
        rollNumber: student.rollNumber,
        avatar: student.avatar,
        classId: student.classId,
        section: student.section,
        medicalLeave: leaveSummary.sick,
        casualLeave: leaveSummary.casual,
        emergencyLeave: leaveSummary.emergency,
        specialLeave: leaveSummary.other
      };
    });
    
    logger.info('Leave report fetched successfully:', { schoolId, count: leaveReport.length });
    return successResponse(res, { leaveReport, limits: LEAVE_LIMITS }, 'Leave report retrieved successfully');
  } catch (error) {
    logger.error('Error fetching leave report:', error);
    return errorResponse(res, error.message);
  }
};


const getStudentLeaveSummary = async (req, res) => {
  try {
    logger.info('Fetching student leave summary');
    
    const { studentId } = req.params;
    const { academicYear } = req.query;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (academicYear) {
      const yearError = validateAcademicYear(academicYear);
      if (yearError) errors.push(yearError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const student = await Student.findById(studentId)
      .select('admissionNumber firstName lastName rollNumber avatar schoolId');
    
    if (!student) {
      return notFoundResponse(res, 'Student not found');
    }
    
    // Get current academic year date range
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear + '-04-01');
    const endDate = new Date((currentYear + 1) + '-03-31');
    
    // Get all leaves for this student
    const leaves = await StudentLeave.find({
      studentId,
      schoolId: student.schoolId,
      startDate: { $gte: startDate, $lte: endDate }
    }).sort({ startDate: -1 });
    
    // Calculate summary
    const leaveSummary = {
      sick: { used: 0, available: LEAVE_LIMITS.sick, leaves: [] },
      casual: { used: 0, available: LEAVE_LIMITS.casual, leaves: [] },
      emergency: { used: 0, available: LEAVE_LIMITS.emergency, leaves: [] },
      other: { used: 0, available: LEAVE_LIMITS.other, leaves: [] }
    };
    
    leaves.forEach(leave => {
      if (leaveSummary[leave.leaveType]) {
        if (leave.status === 'approved') {
          leaveSummary[leave.leaveType].used += leave.totalDays;
        }
        leaveSummary[leave.leaveType].leaves.push({
          _id: leave._id,
          startDate: leave.startDate,
          endDate: leave.endDate,
          totalDays: leave.totalDays,
          reason: leave.reason,
          status: leave.status,
          appliedDate: leave.appliedDate
        });
      }
    });
    
    // Calculate available
    Object.keys(leaveSummary).forEach(type => {
      leaveSummary[type].available = Math.max(
        0,
        LEAVE_LIMITS[type] - leaveSummary[type].used
      );
    });
    
    const result = {
      student: {
        _id: student._id,
        admissionNumber: student.admissionNumber,
        name: student.firstName + ' ' + student.lastName,
        rollNumber: student.rollNumber,
        avatar: student.avatar
      },
      summary: leaveSummary,
      limits: LEAVE_LIMITS
    };
    
    logger.info('Student leave summary fetched successfully:', { studentId });
    return successResponse(res, result, 'Leave summary retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student leave summary:', error);
    return errorResponse(res, error.message);
  }
};

// Get leave statistics
const getLeaveStatistics = async (req, res) => {
  try {
    logger.info('Fetching leave statistics');
    
    const { schoolId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (startDate) {
      const dateError = validateDate(startDate, 'Start date');
      if (dateError) errors.push(dateError);
    }
    
    if (endDate) {
      const dateError = validateDate(endDate, 'End date');
      if (dateError) errors.push(dateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Get current academic year date range if not provided
    const currentYear = new Date().getFullYear();
    const defaultStartDate = new Date(currentYear + '-04-01');
    const defaultEndDate = new Date((currentYear + 1) + '-03-31');
    
    const dateFilter = {
      startDate: {
        $gte: startDate ? new Date(startDate) : defaultStartDate,
        $lte: endDate ? new Date(endDate) : defaultEndDate
      }
    };
    
    const [totalLeaves, approvedLeaves, pendingLeaves, rejectedLeaves, leavesByType] = await Promise.all([
      StudentLeave.countDocuments({ schoolId, ...dateFilter }),
      StudentLeave.countDocuments({ schoolId, status: 'approved', ...dateFilter }),
      StudentLeave.countDocuments({ schoolId, status: 'pending', ...dateFilter }),
      StudentLeave.countDocuments({ schoolId, status: 'rejected', ...dateFilter }),
      StudentLeave.aggregate([
        { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), ...dateFilter } },
        { $group: { _id: '$leaveType', count: { $sum: 1 }, totalDays: { $sum: '$totalDays' } } }
      ])
    ]);
    
    const statistics = {
      totalLeaves,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
      leavesByType: leavesByType.reduce((acc, item) => {
        acc[item._id] = { count: item.count, totalDays: item.totalDays };
        return acc;
      }, {})
    };
    
    logger.info('Leave statistics fetched successfully:', { schoolId });
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching leave statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get leave analytics
const getLeaveAnalytics = async (req, res) => {
  try {
    logger.info('Fetching leave analytics');
    
    const { schoolId } = req.params;
    const { groupBy, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const validGroupBy = ['day', 'week', 'month', 'type', 'status', 'class'];
    if (groupBy && !validGroupBy.includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (startDate) {
      const dateError = validateDate(startDate, 'Start date');
      if (dateError) errors.push(dateError);
    }
    
    if (endDate) {
      const dateError = validateDate(endDate, 'End date');
      if (dateError) errors.push(dateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const currentYear = new Date().getFullYear();
    const defaultStartDate = new Date(currentYear + '-04-01');
    const defaultEndDate = new Date((currentYear + 1) + '-03-31');
    
    const matchQuery = {
      schoolId: new mongoose.Types.ObjectId(schoolId),
      startDate: {
        $gte: startDate ? new Date(startDate) : defaultStartDate,
        $lte: endDate ? new Date(endDate) : defaultEndDate
      }
    };
    
    let groupByField;
    switch (groupBy) {
      case 'day':
        groupByField = { $dateToString: { format: '%Y-%m-%d', date: '$startDate' } };
        break;
      case 'week':
        groupByField = { $week: '$startDate' };
        break;
      case 'month':
        groupByField = { $dateToString: { format: '%Y-%m', date: '$startDate' } };
        break;
      case 'type':
        groupByField = '$leaveType';
        break;
      case 'status':
        groupByField = '$status';
        break;
      case 'class':
        groupByField = '$classId';
        break;
      default:
        groupByField = { $dateToString: { format: '%Y-%m', date: '$startDate' } };
    }
    
    const analytics = await StudentLeave.aggregate([
      { $match: matchQuery },
      { $group: { _id: groupByField, count: { $sum: 1 }, totalDays: { $sum: '$totalDays' } } },
      { $sort: { _id: 1 } }
    ]);
    
    logger.info('Leave analytics fetched successfully:', { schoolId });
    return successResponse(res, { groupBy: groupBy || 'month', analytics }, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching leave analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Export leave report
const exportLeaveReport = async (req, res) => {
  try {
    logger.info('Exporting leave report');
    
    const { schoolId } = req.params;
    const { format, classId, section, leaveType, status } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (leaveType && !VALID_LEAVE_TYPES.includes(leaveType)) {
      errors.push('Invalid leave type');
    }
    
    if (status && !VALID_LEAVE_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { schoolId };
    if (leaveType) query.leaveType = leaveType;
    if (status) query.status = status;
    
    const leaves = await StudentLeave.find(query)
      .populate('studentId', 'admissionNumber firstName lastName rollNumber classId section')
      .sort({ startDate: -1 })
      .lean();
    
    const exportData = {
      format: format.toLowerCase(),
      data: leaves,
      count: leaves.length
    };
    
    logger.info('Leave report exported successfully:', { schoolId, format });
    return successResponse(res, exportData, 'Leave report exported successfully');
  } catch (error) {
    logger.error('Error exporting leave report:', error);
    return errorResponse(res, error.message);
  }
};

// Get students with excessive leaves
const getStudentsWithExcessiveLeaves = async (req, res) => {
  try {
    logger.info('Fetching students with excessive leaves');
    
    const { schoolId } = req.params;
    const { threshold, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const thresholdNum = parseInt(threshold) || 15;
    if (thresholdNum < 1 || thresholdNum > 100) {
      errors.push('Threshold must be between 1 and 100');
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
    
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear + '-04-01');
    const endDate = new Date((currentYear + 1) + '-03-31');
    
    const excessiveLeaves = await StudentLeave.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
          status: 'approved',
          startDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$studentId',
          totalDays: { $sum: '$totalDays' },
          leaveCount: { $sum: 1 }
        }
      },
      {
        $match: {
          totalDays: { $gte: thresholdNum }
        }
      },
      {
        $sort: { totalDays: -1 }
      },
      {
        $skip: (pageNum - 1) * limitNum
      },
      {
        $limit: limitNum
      }
    ]);
    
    const studentIds = excessiveLeaves.map(item => item._id);
    const students = await Student.find({ _id: { $in: studentIds } })
      .select('admissionNumber firstName lastName rollNumber classId section avatar');
    
    const result = excessiveLeaves.map(leave => {
      const student = students.find(s => s._id.toString() === leave._id.toString());
      return {
        student: student ? {
          _id: student._id,
          admissionNumber: student.admissionNumber,
          name: student.firstName + ' ' + student.lastName,
          rollNumber: student.rollNumber,
          classId: student.classId,
          section: student.section,
          avatar: student.avatar
        } : null,
        totalDays: leave.totalDays,
        leaveCount: leave.leaveCount
      };
    });
    
    logger.info('Students with excessive leaves fetched successfully:', { schoolId, threshold: thresholdNum });
    return successResponse(res, { students: result, threshold: thresholdNum }, 'Excessive leaves report retrieved successfully');
  } catch (error) {
    logger.error('Error fetching students with excessive leaves:', error);
    return errorResponse(res, error.message);
  }
};

// Get leave trends
const getLeaveTrends = async (req, res) => {
  try {
    logger.info('Fetching leave trends');
    
    const { schoolId } = req.params;
    const { period } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const validPeriods = ['week', 'month', 'quarter', 'year'];
    if (period && !validPeriods.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + validPeriods.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const selectedPeriod = period || 'month';
    const currentDate = new Date();
    let startDate;
    
    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(currentDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    const trends = await StudentLeave.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
          startDate: { $gte: startDate, $lte: currentDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$startDate' } },
            type: '$leaveType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);
    
    logger.info('Leave trends fetched successfully:', { schoolId, period: selectedPeriod });
    return successResponse(res, { period: selectedPeriod, trends }, 'Leave trends retrieved successfully');
  } catch (error) {
    logger.error('Error fetching leave trends:', error);
    return errorResponse(res, error.message);
  }
};

// Get class-wise leave summary
const getClassWiseLeaveSummary = async (req, res) => {
  try {
    logger.info('Fetching class-wise leave summary');
    
    const { schoolId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear + '-04-01');
    const endDate = new Date((currentYear + 1) + '-03-31');
    
    const classWiseSummary = await StudentLeave.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
          status: 'approved',
          startDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $group: {
          _id: {
            classId: '$student.classId',
            section: '$student.section'
          },
          totalLeaves: { $sum: 1 },
          totalDays: { $sum: '$totalDays' },
          studentCount: { $addToSet: '$studentId' }
        }
      },
      {
        $project: {
          _id: 0,
          classId: '$_id.classId',
          section: '$_id.section',
          totalLeaves: 1,
          totalDays: 1,
          studentCount: { $size: '$studentCount' }
        }
      },
      {
        $sort: { classId: 1, section: 1 }
      }
    ]);
    
    logger.info('Class-wise leave summary fetched successfully:', { schoolId });
    return successResponse(res, classWiseSummary, 'Class-wise summary retrieved successfully');
  } catch (error) {
    logger.error('Error fetching class-wise leave summary:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getLeaveReport,
  getStudentLeaveSummary,
  getLeaveStatistics,
  getLeaveAnalytics,
  exportLeaveReport,
  getStudentsWithExcessiveLeaves,
  getLeaveTrends,
  getClassWiseLeaveSummary
};
