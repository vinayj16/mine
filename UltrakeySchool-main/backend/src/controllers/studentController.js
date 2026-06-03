import studentService from '../services/studentService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import User from '../models/User.js';

// Validation constants
const VALID_LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];
const VALID_ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused', 'half_day', 'sick', 'leave'];
const VALID_FEE_STATUSES = ['paid', 'unpaid', 'partial', 'overdue', 'waived'];
const VALID_RESULT_STATUSES = ['published', 'draft', 'pending'];
const VALID_LIBRARY_STATUSES = ['issued', 'returned', 'overdue', 'lost'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_REASON_LENGTH = 500;
const MAX_NOTES_LENGTH = 1000;

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
  
  const yearPattern = /^\d{4}[-\/]\d{4}$/;
  if (!yearPattern.test(year)) {
    return 'Invalid academic year format. Expected format: YYYY-YYYY or YYYY/YYYY (e.g., 2023-2024)';
  }
  
  const normalized = year.replace('/', '-');
  const [startYear, endYear] = normalized.split('-').map(Number);
  if (endYear !== startYear + 1) {
    return 'Academic year end must be one year after start year';
  }
  
  return null;
};

// Get student details
const getStudentDetails = async (req, res) => {
  try {
    logger.info('Fetching student details');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const student = await studentService.getStudentDetails(studentId, institutionId);
    
    if (!student) {
      return notFoundResponse(res, 'Student not found');
    }
    
    logger.info('Student details fetched successfully:', { studentId });
    return successResponse(res, student, 'Student details retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student details:', error);
    return errorResponse(res, error.message);
  }
};

// Get student timetable
const getStudentTimetable = async (req, res) => {
  try {
    logger.info('Fetching student timetable');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    if (!studentId) {
      errors.push('Student ID is required');
    } else {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    let timetable = await studentService.getStudentTimetable(studentId, institutionId);
    
    // If no timetable exists, create sample data (only if student exists)
    if (timetable && timetable.length === 0) {
      logger.info('No timetable found, creating sample data');
      timetable = await studentService.createSampleTimetable(studentId, institutionId);
    }
    
    logger.info('Student timetable fetched successfully:', { studentId });
    return successResponse(res, timetable, 'Student timetable retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student timetable:', error);
    return errorResponse(res, error.message);
  }
};

// Get student leaves
const getStudentLeaves = async (req, res) => {
  try {
    logger.info('Fetching student leaves');
    
    let { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    const { status, startDate, endDate } = req.query;
    const userRole = req.user?.role;
    
    // For students, always use their own ID - no override allowed
    if (userRole === 'student') {
      const Student = (await import('../models/Student.js')).default;
      const student = await Student.findOne({ userId: req.user.id || req.user._id });
      if (student) {
        studentId = student._id;
      } else {
        studentId = req.user.id || req.user._id;
      }
    }
    // For teachers, check if they are the class teacher of the student
    else if (userRole === 'teacher') {
      const Student = (await import('../models/Student.js')).default;
      const Teacher = (await import('../models/Teacher.js')).default;
      const Class = (await import('../models/Class.js')).default;
      
      const teacher = await Teacher.findOne({ userId: req.user.id || req.user._id });
      if (teacher) {
        // Get classes where this teacher is the class teacher
        const classes = await Class.find({ classTeacher: teacher._id }).select('_id');
        const classIds = classes.map(c => c._id);
        
        // Check if the requested student belongs to any of these classes
        const student = await Student.findOne({ _id: studentId, classId: { $in: classIds } });
        if (!student) {
          // If not class teacher, check if teacher teaches any subject to this student
          // For now, allow teachers to view all student leaves in their school
          // This can be refined later based on subject assignments
        }
      }
    }
    // For parents, only show their own children's leaves
    else if (userRole === 'parent') {
      const Student = (await import('../models/Student.js')).default;
      const student = await Student.findOne({ _id: studentId, parentId: req.user.id || req.user._id });
      if (!student) {
        return errorResponse(res, 'You can only view leaves for your own children', 403);
      }
    }
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (status && !VALID_LEAVE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_LEAVE_STATUSES.join(', '));
    }
    
    const dateErrors = validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      errors.push(...dateErrors);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const leaves = await studentService.getStudentLeaves(studentId, institutionId, {
      status,
      startDate,
      endDate
    });
    
    logger.info('Student leaves fetched successfully:', { studentId, count: leaves.length });
    return successResponse(res, leaves, 'Student leaves retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student leaves:', error);
    return errorResponse(res, error.message);
  }
};

// Apply leave
const applyLeave = async (req, res) => {
  try {
    logger.info('Applying leave for student');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    const userId = req.user?.userId;
    const { startDate, endDate, reason, leaveType } = req.body;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (!startDate) {
      errors.push('Start date is required');
    }
    
    if (!endDate) {
      errors.push('End date is required');
    }
    
    const dateErrors = validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      errors.push(...dateErrors);
    }
    
    if (!reason || reason.trim().length === 0) {
      errors.push('Reason is required');
    } else if (reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (leaveType && leaveType.trim().length === 0) {
      errors.push('Leave type cannot be empty');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const leave = await studentService.applyLeave(studentId, institutionId, req.body, userId);
    
    logger.info('Leave applied successfully:', { studentId, leaveId: leave._id });
    return createdResponse(res, leave, 'Leave application submitted successfully');
  } catch (error) {
    logger.error('Error applying leave:', error);
    return errorResponse(res, error.message);
  }
};

// Review leave
const reviewLeave = async (req, res) => {
  try {
    logger.info('Reviewing leave');
    
    const { leaveId } = req.params;
    const institutionId = req.user?.institutionId;
    const userId = req.user?.userId;
    const { status, reviewNotes } = req.body;
    
    // Validation
    const errors = [];
    
    const leaveIdError = validateObjectId(leaveId, 'Leave ID');
    if (leaveIdError) errors.push(leaveIdError);
    

    
    if (!status || status.trim().length === 0) {
      errors.push('Status is required');
    } else if (!VALID_LEAVE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_LEAVE_STATUSES.join(', '));
    }
    
    if (reviewNotes && reviewNotes.length > MAX_NOTES_LENGTH) {
      errors.push('Review notes must not exceed ' + MAX_NOTES_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const leave = await studentService.reviewLeave(leaveId, institutionId, req.body, userId);
    
    if (!leave) {
      return notFoundResponse(res, 'Leave application not found');
    }
    
    logger.info('Leave reviewed successfully:', { leaveId, status });
    return successResponse(res, leave, 'Leave reviewed successfully');
  } catch (error) {
    logger.error('Error reviewing leave:', error);
    return errorResponse(res, error.message);
  }
};

// Get student attendance
const getStudentAttendance = async (req, res) => {
  try {
    logger.info('Fetching student attendance');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    const { startDate, endDate, status, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (status && !VALID_ATTENDANCE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ATTENDANCE_STATUSES.join(', '));
    }
    
    const dateErrors = validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      errors.push(...dateErrors);
    }
    
    const limitNum = parseInt(limit) || 50;
    
    if (limitNum < 1 || limitNum > 365) {
      errors.push('Limit must be between 1 and 365');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const attendance = await studentService.getStudentAttendance(studentId, institutionId, {
      startDate,
      endDate,
      status,
      limit: limitNum
    });
    
    logger.info('Student attendance fetched successfully:', { studentId });
    return successResponse(res, attendance, 'Student attendance retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student attendance:', error);
    return errorResponse(res, error.message);
  }
};

// Get student fees
const getStudentFees = async (req, res) => {
  try {
    logger.info('Fetching student fees');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    const { status, feeType, academicYear } = req.query;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (status && !VALID_FEE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_FEE_STATUSES.join(', '));
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const fees = await studentService.getStudentFees(studentId, institutionId, {
      status,
      feeType,
      academicYear
    });
    
    logger.info('Student fees fetched successfully:', { studentId });
    return successResponse(res, fees, 'Student fees retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student fees:', error);
    return errorResponse(res, error.message);
  }
};

// Get student results
const getStudentResults = async (req, res) => {
  try {
    logger.info('Fetching student results');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    const { academicYear, term, status } = req.query;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (status && !VALID_RESULT_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_RESULT_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    logger.info('DEBUG getStudentResults:', { studentId, institutionId: institutionId?.toString?.(), academicYear, instType: typeof institutionId });
    const results = await studentService.getStudentResults(studentId, institutionId, {
      academicYear,
      term,
      status
    });
    
    logger.info('Student results fetched successfully:', { studentId, count: results?.length });
    return successResponse(res, results, 'Student results retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student results:', error);
    return errorResponse(res, error.message);
  }
};

// Get student library records
const getStudentLibraryRecords = async (req, res) => {
  try {
    logger.info('Fetching student library records');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    const { status } = req.query;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (status && !VALID_LIBRARY_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_LIBRARY_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const library = await studentService.getStudentLibraryRecords(studentId, institutionId, {
      status
    });
    
    logger.info('Student library records fetched successfully:', { studentId });
    return successResponse(res, library, 'Student library records retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student library records:', error);
    return errorResponse(res, error.message);
  }
};

// Get student dashboard data
const getStudentDashboardData = async (req, res) => {
  try {
    logger.info('Fetching student dashboard data');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const dashboardData = await studentService.getStudentDashboardData(studentId, institutionId);
    
    logger.info('Student dashboard data fetched successfully:', { studentId });
    return successResponse(res, dashboardData, 'Student dashboard data retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student dashboard data:', error);
    return errorResponse(res, error.message);
  }
};

// Get student sidebar data
const getStudentSidebarData = async (req, res) => {
  try {
    logger.info('Fetching student sidebar data');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const sidebarData = await studentService.getStudentSidebarData(studentId, institutionId);
    
    logger.info('Student sidebar data fetched successfully:', { studentId });
    return successResponse(res, sidebarData, 'Student sidebar data retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student sidebar data:', error);
    return errorResponse(res, error.message);
  }
};

// Get student performance summary
const getStudentPerformanceSummary = async (req, res) => {
  try {
    logger.info('Fetching student performance summary');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    const { academicYear } = req.query;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const summary = await studentService.getStudentPerformanceSummary(studentId, institutionId, academicYear);
    
    logger.info('Student performance summary fetched successfully:', { studentId });
    return successResponse(res, summary, 'Student performance summary retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student performance summary:', error);
    return errorResponse(res, error.message);
  }
};

// Get student homework
const getStudentHomework = async (req, res) => {
  try {
    logger.info('Fetching student homework');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    const { status, subject, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    const dateErrors = validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      errors.push(...dateErrors);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const homework = await studentService.getStudentHomework(studentId, institutionId, {
      status,
      subject,
      startDate,
      endDate
    });
    
    logger.info('Student homework fetched successfully:', { studentId });
    return successResponse(res, homework, 'Student homework retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student homework:', error);
    return errorResponse(res, error.message);
  }
};

// Get student exams
const getStudentExams = async (req, res) => {
  try {
    logger.info('Fetching student exams');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    const { academicYear, term, status } = req.query;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exams = await studentService.getStudentExams(studentId, institutionId, {
      academicYear,
      term,
      status
    });
    
    logger.info('Student exams fetched successfully:', { studentId });
    return successResponse(res, exams, 'Student exams retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student exams:', error);
    return errorResponse(res, error.message);
  }
};

// Get student notifications
const getStudentNotifications = async (req, res) => {
  try {
    logger.info('Fetching student notifications');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    const { isRead, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (isRead !== undefined && isRead !== 'true' && isRead !== 'false') {
      errors.push('isRead must be true or false');
    }
    
    const limitNum = parseInt(limit) || 50;
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const notifications = await studentService.getStudentNotifications(studentId, institutionId, {
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      limit: limitNum
    });
    
    logger.info('Student notifications fetched successfully:', { studentId });
    return successResponse(res, notifications, 'Student notifications retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student notifications:', error);
    return errorResponse(res, error.message);
  }
};

// Export student data
const exportStudentData = async (req, res) => {
  try {
    logger.info('Exporting student data');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    const { format, dataType } = req.query;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    const validDataTypes = ['all', 'attendance', 'fees', 'results', 'library', 'homework', 'exams'];
    if (dataType && !validDataTypes.includes(dataType)) {
      errors.push('Invalid data type. Must be one of: ' + validDataTypes.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await studentService.exportStudentData(studentId, institutionId, {
      format: format.toLowerCase(),
      dataType: dataType || 'all'
    });
    
    logger.info('Student data exported successfully:', { studentId, format });
    return successResponse(res, exportData, 'Student data exported successfully');
  } catch (error) {
    logger.error('Error exporting student data:', error);
    return errorResponse(res, error.message);
  }
};

// Get student profile completeness
const getStudentProfileCompleteness = async (req, res) => {
  try {
    logger.info('Fetching student profile completeness');
    
    const { studentId } = req.params;
    const institutionId = req.user?.institutionId;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    

    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const completeness = await studentService.getStudentProfileCompleteness(studentId, institutionId);
    
    logger.info('Student profile completeness fetched successfully:', { studentId });
    return successResponse(res, completeness, 'Student profile completeness retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student profile completeness:', error);
    return errorResponse(res, error.message);
  }
};

// Get logged-in student's profile (fallback to User collection if no Student record exists)
const getMyStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    // First try to find in Student collection by userId
    let student = await Student.findOne({ userId })
      .populate('classId', 'name grade')
      .populate('sectionId', 'name');

    if (!student) {
      // Fallback: try finding by _id (legacy students stored directly in Student collection)
      student = await Student.findById(userId)
        .populate('classId', 'name grade')
        .populate('sectionId', 'name');
    }

    if (student) {
      // If the student record exists, return it
      return successResponse(res, student, 'Student profile retrieved successfully');
    }

    // Fallback: build student-like object from User collection
    const user = await User.findById(userId).select('name email phone role class section rollNumber admissionNumber gender dateOfBirth status avatar institutionId').lean();
    
    if (!user) {
      return notFoundResponse(res, 'Student profile not found for this user');
    }

    // Auto-create Student document from User data so subsequent API calls work
    const nameParts = (user.name || '').split(' ');
    const { default: Class } = await import('../models/Class.js');
    const { default: Section } = await import('../models/Section.js');
    let classDoc = null;
    if (user.class) {
      classDoc = await Class.findOne({ name: user.class, institutionId: user.institutionId }).lean();
    }
    let sectionDoc = null;
    if (user.section && classDoc?._id) {
      sectionDoc = await Section.findOne({ name: user.section, classId: classDoc._id }).lean();
    }

    // Normalize gender - handle 'Not Specified' and other invalid values
    const normalizedGender = ['male', 'female', 'other'].includes(user.gender) ? user.gender : 'male';

    // Get current academic year
    const currentYear = new Date().getFullYear();
    const academicYear = currentYear + '-' + (currentYear + 1);

    // If no class found by name, find the first class in the institution as fallback
    if (!classDoc && user.institutionId) {
      classDoc = await Class.findOne({ institutionId: user.institutionId }).sort({ name: 1 }).lean();
    }

    const newStudent = await Student.create({
      userId: user._id,
      firstName: nameParts[0] || user.name || 'Student',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user.email || `${user._id}@student.local`,
      phone: user.phone || '',
      admissionNumber: user.admissionNumber || `STU${Date.now()}`,
      rollNumber: user.rollNumber || '',
      gender: normalizedGender,
      dateOfBirth: user.dateOfBirth || new Date('2000-01-01'),
      academicYear,
      status: user.status || 'active',
      isActive: user.status !== 'inactive',
      institutionId: user.institutionId,
      classId: classDoc?._id,
      sectionId: sectionDoc?._id,
    });

    const populated = await Student.findById(newStudent._id)
      .populate('classId', 'name grade')
      .populate('sectionId', 'name');

    return successResponse(res, populated, 'Student profile created and retrieved successfully');
  } catch (error) {
    logger.error('Error fetching my student profile:', error);
    return errorResponse(res, error.message);
  }
};

export default {
  getStudentDetails,
  getStudentTimetable,
  getStudentLeaves,
  applyLeave,
  reviewLeave,
  getStudentAttendance,
  getStudentFees,
  getStudentResults,
  getStudentLibraryRecords,
  getStudentDashboardData,
  getStudentSidebarData,
  getStudentPerformanceSummary,
  getStudentHomework,
  getStudentExams,
  getStudentNotifications,
  exportStudentData,
  getStudentProfileCompleteness,
  getMyStudentProfile
};
