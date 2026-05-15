// Import required models and services
import Teacher from '../models/Teacher.js';
import teacherService from '../services/teacherService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'on_leave', 'suspended', 'terminated', 'retired'];
const VALID_GENDERS = ['male', 'female', 'other'];
const VALID_LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];
const VALID_LEAVE_TYPES = ['sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid', 'other'];
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'partially_paid', 'overdue', 'cancelled'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;
const MAX_ADDRESS_LENGTH = 500;
const MAX_EMPLOYEE_ID_LENGTH = 50;
const MAX_REASON_LENGTH = 500;
const MIN_SALARY = 0;
const MAX_SALARY = 10000000;

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

// Helper function to validate email
const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    return 'Email must not exceed ' + MAX_EMAIL_LENGTH + ' characters';
  }
  return null;
};

// Helper function to validate phone
const validatePhone = (phone) => {
  if (!phone) return null;
  const phoneRegex = /^[+]?[\d\s\-()]+$/;
  if (!phoneRegex.test(phone)) {
    return 'Invalid phone number format';
  }
  if (phone.length > MAX_PHONE_LENGTH) {
    return 'Phone number must not exceed ' + MAX_PHONE_LENGTH + ' characters';
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
  if (start >= end) {
    return 'Start date must be before end date';
  }
  return null;
};

// CRUD Operations - List all teachers
export const getAllTeachers = async (req, res) => {
  try {
    logger.info('Fetching all teachers');
    
    const { schoolId, page, limit, search, department, subject, status, gender, sortBy, sortOrder } = req.query;
    
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
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (department) {
      const departmentError = validateObjectId(department, 'Department ID');
      if (departmentError) errors.push(departmentError);
    }
    
    if (subject) {
      const subjectError = validateObjectId(subject, 'Subject ID');
      if (subjectError) errors.push(subjectError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (gender && !VALID_GENDERS.includes(gender)) {
      errors.push('Invalid gender. Must be one of: ' + VALID_GENDERS.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: ' + VALID_SORT_ORDERS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = {};
    
    if (schoolId) {
      query.schoolId = schoolId;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department) {
      query.departmentId = department;
    }
    
    if (subject) {
      query.subjects = subject;
    }
    
    if (status) {
      query.status = status;
    } else {
      query.isActive = true;
    }
    
    if (gender) {
      query.gender = gender;
    }
    
    const skip = (pageNum - 1) * limitNum;
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    const [teachers, total] = await Promise.all([
      Teacher.find(query)
        .populate('departmentId', 'name code')
        .populate('subjects', 'name code')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      Teacher.countDocuments(query)
    ]);
    
    logger.info('Teachers fetched successfully:', { count: teachers.length });
    return successResponse(res, {
      teachers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Teachers retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teachers:', error);
    return errorResponse(res, error.message);
  }
};

// CRUD Operations - Get teacher by ID
export const getTeacherById = async (req, res) => {
  try {
    logger.info('Fetching teacher by ID');
    
    const { id } = req.params;
    const { schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Teacher ID');
    if (idError) errors.push(idError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { _id: id };
    if (schoolId) {
      query.schoolId = schoolId;
    }
    
    const teacher = await Teacher.findOne(query)
      .populate('departmentId', 'name code')
      .populate('designationId', 'name code')
      .populate('subjects', 'name code')
      .populate('classes.classId', 'name grade')
      .populate('classes.sectionId', 'name')
      .populate('classes.subjectId', 'name code');
    
    if (!teacher) {
      return notFoundResponse(res, 'Teacher not found');
    }
    
    logger.info('Teacher fetched successfully:', { teacherId: id });
    return successResponse(res, teacher, 'Teacher retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teacher:', error);
    return errorResponse(res, error.message);
  }
};

// CRUD Operations - Create new teacher
export const createTeacher = async (req, res) => {
  try {
    logger.info('Creating teacher');
    
    const { firstName, lastName, email, phone, employeeId, gender, dateOfBirth, joiningDate, schoolId, departmentId } = req.body;
    
    // Validation
    const errors = [];
    
    if (!firstName || firstName.trim().length === 0) {
      errors.push('First name is required');
    } else if (firstName.length > MAX_NAME_LENGTH) {
      errors.push('First name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (!lastName || lastName.trim().length === 0) {
      errors.push('Last name is required');
    } else if (lastName.length > MAX_NAME_LENGTH) {
      errors.push('Last name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    const emailError = validateEmail(email);
    if (emailError) errors.push(emailError);
    
    if (phone) {
      const phoneError = validatePhone(phone);
      if (phoneError) errors.push(phoneError);
    }
    
    if (employeeId && employeeId.length > MAX_EMPLOYEE_ID_LENGTH) {
      errors.push('Employee ID must not exceed ' + MAX_EMPLOYEE_ID_LENGTH + ' characters');
    }
    
    if (gender && !VALID_GENDERS.includes(gender)) {
      errors.push('Invalid gender. Must be one of: ' + VALID_GENDERS.join(', '));
    }
    
    if (dateOfBirth) {
      const dobError = validateDate(dateOfBirth, 'Date of birth');
      if (dobError) errors.push(dobError);
    }
    
    if (joiningDate) {
      const joiningDateError = validateDate(joiningDate, 'Joining date');
      if (joiningDateError) errors.push(joiningDateError);
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (departmentId) {
      const departmentIdError = validateObjectId(departmentId, 'Department ID');
      if (departmentIdError) errors.push(departmentIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Check if teacher with same email already exists
    const existingTeacher = await Teacher.findOne({ email: email });
    if (existingTeacher) {
      return validationErrorResponse(res, ['Teacher with this email already exists']);
    }
    
    // Check if employee ID already exists
    if (employeeId) {
      const existingEmployeeId = await Teacher.findOne({ employeeId: employeeId });
      if (existingEmployeeId) {
        return validationErrorResponse(res, ['Teacher with this employee ID already exists']);
      }
    }
    
    const teacher = await Teacher.create(req.body);
    
    logger.info('Teacher created successfully:', { teacherId: teacher._id, email });
    return createdResponse(res, teacher, 'Teacher created successfully');
  } catch (error) {
    logger.error('Error creating teacher:', error);
    return errorResponse(res, error.message);
  }
};

// CRUD Operations - Update teacher
export const updateTeacher = async (req, res) => {
  try {
    logger.info('Updating teacher');
    
    const { id } = req.params;
    const { firstName, lastName, email, phone, employeeId, gender, status } = req.body;
    const { schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Teacher ID');
    if (idError) errors.push(idError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (firstName !== undefined) {
      if (!firstName || firstName.trim().length === 0) {
        errors.push('First name cannot be empty');
      } else if (firstName.length > MAX_NAME_LENGTH) {
        errors.push('First name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (lastName !== undefined) {
      if (!lastName || lastName.trim().length === 0) {
        errors.push('Last name cannot be empty');
      } else if (lastName.length > MAX_NAME_LENGTH) {
        errors.push('Last name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (email !== undefined) {
      const emailError = validateEmail(email);
      if (emailError) errors.push(emailError);
    }
    
    if (phone !== undefined) {
      const phoneError = validatePhone(phone);
      if (phoneError) errors.push(phoneError);
    }
    
    if (employeeId !== undefined && employeeId.length > MAX_EMPLOYEE_ID_LENGTH) {
      errors.push('Employee ID must not exceed ' + MAX_EMPLOYEE_ID_LENGTH + ' characters');
    }
    
    if (gender !== undefined && !VALID_GENDERS.includes(gender)) {
      errors.push('Invalid gender. Must be one of: ' + VALID_GENDERS.join(', '));
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { _id: id };
    if (schoolId) {
      query.schoolId = schoolId;
    }
    
    const teacher = await Teacher.findOne(query);
    if (!teacher) {
      return notFoundResponse(res, 'Teacher not found');
    }
    
    // Check if email is being changed and if it's already taken
    if (email && email !== teacher.email) {
      const existingEmail = await Teacher.findOne({ email: email, _id: { $ne: id } });
      if (existingEmail) {
        return validationErrorResponse(res, ['Email already in use']);
      }
    }
    
    // Check if employee ID is being changed and if it's already taken
    if (employeeId && employeeId !== teacher.employeeId) {
      const existingEmployeeId = await Teacher.findOne({ employeeId: employeeId, _id: { $ne: id } });
      if (existingEmployeeId) {
        return validationErrorResponse(res, ['Employee ID already in use']);
      }
    }
    
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('departmentId', 'name code')
      .populate('subjects', 'name code');
    
    logger.info('Teacher updated successfully:', { teacherId: id });
    return successResponse(res, updatedTeacher, 'Teacher updated successfully');
  } catch (error) {
    logger.error('Error updating teacher:', error);
    return errorResponse(res, error.message);
  }
};

// CRUD Operations - Delete teacher
export const deleteTeacher = async (req, res) => {
  try {
    logger.info('Deleting teacher');
    
    const { id } = req.params;
    const { schoolId, hardDelete } = req.query;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Teacher ID');
    if (idError) errors.push(idError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { _id: id };
    if (schoolId) {
      query.schoolId = schoolId;
    }
    
    const teacher = await Teacher.findOne(query);
    if (!teacher) {
      return notFoundResponse(res, 'Teacher not found');
    }
    
    if (hardDelete === 'true') {
      await Teacher.findByIdAndDelete(id);
      logger.info('Teacher permanently deleted:', { teacherId: id });
      return successResponse(res, null, 'Teacher permanently deleted');
    } else {
      teacher.isActive = false;
      teacher.status = 'inactive';
      await teacher.save();
      logger.info('Teacher soft deleted:', { teacherId: id });
      return successResponse(res, teacher, 'Teacher deleted successfully');
    }
  } catch (error) {
    logger.error('Error deleting teacher:', error);
    return errorResponse(res, error.message);
  }
};

export const getTeacherDetails = async (req, res) => {
  try {
    logger.info('Fetching teacher details');
    
    const { teacherId } = req.params;
    const { schoolId } = req.user;
    
    // Validation
    const errors = [];
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const teacher = await teacherService.getTeacherDetails(teacherId, schoolId);
    
    if (!teacher) {
      return notFoundResponse(res, 'Teacher not found');
    }
    
    logger.info('Teacher details fetched successfully:', { teacherId });
    return successResponse(res, teacher, 'Teacher details retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teacher details:', error);
    return errorResponse(res, error.message);
  }
};

export const getTeacherRoutine = async (req, res) => {
  try {
    logger.info('Fetching teacher routine');
    
    const { teacherId } = req.params;
    const { schoolId } = req.user;
    const { academicYear, term, dayOfWeek } = req.query;
    
    // Validation
    const errors = [];
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (dayOfWeek && !['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(dayOfWeek.toLowerCase())) {
      errors.push('Invalid day of week');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const routine = await teacherService.getTeacherRoutine(teacherId, schoolId, {
      academicYear,
      term,
      dayOfWeek
    });
    
    logger.info('Teacher routine fetched successfully:', { teacherId });
    return successResponse(res, routine, 'Teacher routine retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teacher routine:', error);
    return errorResponse(res, error.message);
  }
};

export const getTeacherLeaves = async (req, res) => {
  try {
    logger.info('Fetching teacher leaves');
    
    const { teacherId } = req.params;
    const { schoolId } = req.user;
    const { status, leaveType, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (status && !VALID_LEAVE_STATUSES.includes(status)) {
      errors.push('Invalid leave status. Must be one of: ' + VALID_LEAVE_STATUSES.join(', '));
    }
    
    if (leaveType && !VALID_LEAVE_TYPES.includes(leaveType)) {
      errors.push('Invalid leave type. Must be one of: ' + VALID_LEAVE_TYPES.join(', '));
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
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const leaves = await teacherService.getTeacherLeaves(teacherId, schoolId, {
      status,
      leaveType,
      startDate,
      endDate
    });
    
    logger.info('Teacher leaves fetched successfully:', { teacherId, count: leaves.length });
    return successResponse(res, leaves, 'Teacher leaves retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teacher leaves:', error);
    return errorResponse(res, error.message);
  }
};

export const applyLeave = async (req, res) => {
  try {
    logger.info('Applying leave for teacher');
    
    const { teacherId } = req.params;
    const { schoolId } = req.user;
    const { leaveType, startDate, endDate, reason } = req.body;
    
    // Validation
    const errors = [];
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!leaveType) {
      errors.push('Leave type is required');
    } else if (!VALID_LEAVE_TYPES.includes(leaveType)) {
      errors.push('Invalid leave type. Must be one of: ' + VALID_LEAVE_TYPES.join(', '));
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
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    if (reason && reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const leave = await teacherService.applyLeave(teacherId, schoolId, req.body);
    
    logger.info('Leave applied successfully:', { teacherId, leaveId: leave._id });
    return createdResponse(res, leave, 'Leave application submitted successfully');
  } catch (error) {
    logger.error('Error applying leave:', error);
    return errorResponse(res, error.message);
  }
};

export const reviewLeave = async (req, res) => {
  try {
    logger.info('Reviewing leave');
    
    const { leaveId } = req.params;
    const { schoolId, userId } = req.user;
    const { status, remarks } = req.body;
    
    // Validation
    const errors = [];
    
    const leaveIdError = validateObjectId(leaveId, 'Leave ID');
    if (leaveIdError) errors.push(leaveIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_LEAVE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_LEAVE_STATUSES.join(', '));
    }
    
    if (remarks && remarks.length > MAX_REASON_LENGTH) {
      errors.push('Remarks must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const leave = await teacherService.reviewLeave(leaveId, schoolId, req.body, userId);
    
    if (!leave) {
      return notFoundResponse(res, 'Leave not found');
    }
    
    logger.info('Leave reviewed successfully:', { leaveId, status });
    return successResponse(res, leave, 'Leave reviewed successfully');
  } catch (error) {
    logger.error('Error reviewing leave:', error);
    return errorResponse(res, error.message);
  }
};

export const getTeacherAttendance = async (req, res) => {
  try {
    logger.info('Fetching teacher attendance');
    
    const { teacherId } = req.params;
    const { schoolId } = req.user;
    const { startDate, endDate, status, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
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
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    const limitNum = parseInt(limit) || 100;
    if (limitNum < 1 || limitNum > 1000) {
      errors.push('Limit must be between 1 and 1000');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const attendance = await teacherService.getTeacherAttendance(teacherId, schoolId, {
      startDate,
      endDate,
      status,
      limit: limitNum
    });
    
    logger.info('Teacher attendance fetched successfully:', { teacherId });
    return successResponse(res, attendance, 'Teacher attendance retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teacher attendance:', error);
    return errorResponse(res, error.message);
  }
};

export const getTeacherSalary = async (req, res) => {
  try {
    logger.info('Fetching teacher salary');
    
    const { teacherId } = req.params;
    const { schoolId } = req.user;
    const { month, year, paymentStatus, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (month && (parseInt(month) < 1 || parseInt(month) > 12)) {
      errors.push('Month must be between 1 and 12');
    }
    
    if (year && (parseInt(year) < 1900 || parseInt(year) > 2100)) {
      errors.push('Invalid year');
    }
    
    if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      errors.push('Invalid payment status. Must be one of: ' + VALID_PAYMENT_STATUSES.join(', '));
    }
    
    const limitNum = parseInt(limit) || 100;
    if (limitNum < 1 || limitNum > 1000) {
      errors.push('Limit must be between 1 and 1000');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const salary = await teacherService.getTeacherSalary(teacherId, schoolId, {
      month,
      year,
      paymentStatus,
      limit: limitNum
    });
    
    logger.info('Teacher salary fetched successfully:', { teacherId });
    return successResponse(res, salary, 'Teacher salary retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teacher salary:', error);
    return errorResponse(res, error.message);
  }
};

export const createSalary = async (req, res) => {
  try {
    logger.info('Creating salary record');
    
    const { teacherId } = req.params;
    const { schoolId } = req.user;
    const { month, year, basicSalary, allowances, deductions } = req.body;
    
    // Validation
    const errors = [];
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!month) {
      errors.push('Month is required');
    } else if (parseInt(month) < 1 || parseInt(month) > 12) {
      errors.push('Month must be between 1 and 12');
    }
    
    if (!year) {
      errors.push('Year is required');
    } else if (parseInt(year) < 1900 || parseInt(year) > 2100) {
      errors.push('Invalid year');
    }
    
    if (!basicSalary) {
      errors.push('Basic salary is required');
    } else if (typeof basicSalary !== 'number' || basicSalary < MIN_SALARY || basicSalary > MAX_SALARY) {
      errors.push('Basic salary must be between ' + MIN_SALARY + ' and ' + MAX_SALARY);
    }
    
    if (allowances !== undefined && typeof allowances !== 'number') {
      errors.push('Allowances must be a number');
    }
    
    if (deductions !== undefined && typeof deductions !== 'number') {
      errors.push('Deductions must be a number');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const salary = await teacherService.createSalary(teacherId, schoolId, req.body);
    
    logger.info('Salary record created successfully:', { teacherId, salaryId: salary._id });
    return createdResponse(res, salary, 'Salary record created successfully');
  } catch (error) {
    logger.error('Error creating salary record:', error);
    return errorResponse(res, error.message);
  }
};

export const updateSalaryStatus = async (req, res) => {
  try {
    logger.info('Updating salary status');
    
    const { salaryId } = req.params;
    const { schoolId } = req.user;
    const { paymentStatus } = req.body;
    
    // Validation
    const errors = [];
    
    const salaryIdError = validateObjectId(salaryId, 'Salary ID');
    if (salaryIdError) errors.push(salaryIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!paymentStatus) {
      errors.push('Payment status is required');
    } else if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      errors.push('Invalid payment status. Must be one of: ' + VALID_PAYMENT_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const salary = await teacherService.updateSalaryStatus(salaryId, schoolId, req.body);
    
    if (!salary) {
      return notFoundResponse(res, 'Salary record not found');
    }
    
    logger.info('Salary status updated successfully:', { salaryId, paymentStatus });
    return successResponse(res, salary, 'Salary status updated successfully');
  } catch (error) {
    logger.error('Error updating salary status:', error);
    return errorResponse(res, error.message);
  }
};

export const getTeacherLibraryRecords = async (req, res) => {
  try {
    logger.info('Fetching teacher library records');
    
    const { teacherId } = req.params;
    const { schoolId } = req.user;
    const { status } = req.query;
    
    // Validation
    const errors = [];
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const library = await teacherService.getTeacherLibraryRecords(teacherId, schoolId, {
      status
    });
    
    logger.info('Teacher library records fetched successfully:', { teacherId });
    return successResponse(res, library, 'Teacher library records retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teacher library records:', error);
    return errorResponse(res, error.message);
  }
};

export const getTeacherDashboardData = async (req, res) => {
  try {
    logger.info('Fetching teacher dashboard data');
    
    const { teacherId } = req.params;
    const { schoolId } = req.user;
    
    // Validation
    const errors = [];
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const dashboardData = await teacherService.getTeacherDashboardData(teacherId, schoolId);
    
    logger.info('Teacher dashboard data fetched successfully:', { teacherId });
    return successResponse(res, dashboardData, 'Teacher dashboard data retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teacher dashboard data:', error);
    return errorResponse(res, error.message);
  }
};

export const getTeacherSidebarData = async (req, res) => {
  try {
    logger.info('Fetching teacher sidebar data');
    
    const { teacherId } = req.params;
    const { schoolId } = req.user;
    
    // Validation
    const errors = [];
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const sidebarData = await teacherService.getTeacherSidebarData(teacherId, schoolId);
    
    logger.info('Teacher sidebar data fetched successfully:', { teacherId });
    return successResponse(res, sidebarData, 'Teacher sidebar data retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teacher sidebar data:', error);
    return errorResponse(res, error.message);
  }
};


// Get teachers by department
const getTeachersByDepartment = async (req, res) => {
  try {
    logger.info('Fetching teachers by department');
    
    const { departmentId } = req.params;
    const { schoolId, status } = req.query;
    
    // Validation
    const errors = [];
    
    const departmentIdError = validateObjectId(departmentId, 'Department ID');
    if (departmentIdError) errors.push(departmentIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { departmentId: departmentId };
    if (schoolId) query.schoolId = schoolId;
    if (status) query.status = status;
    else query.isActive = true;
    
    const teachers = await Teacher.find(query)
      .populate('departmentId', 'name code')
      .populate('subjects', 'name code')
      .sort({ firstName: 1 });
    
    logger.info('Teachers by department fetched successfully:', { departmentId, count: teachers.length });
    return successResponse(res, teachers, 'Teachers retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teachers by department:', error);
    return errorResponse(res, error.message);
  }
};

// Get teachers by subject
const getTeachersBySubject = async (req, res) => {
  try {
    logger.info('Fetching teachers by subject');
    
    const { subjectId } = req.params;
    const { schoolId, status } = req.query;
    
    // Validation
    const errors = [];
    
    const subjectIdError = validateObjectId(subjectId, 'Subject ID');
    if (subjectIdError) errors.push(subjectIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { subjects: subjectId };
    if (schoolId) query.schoolId = schoolId;
    if (status) query.status = status;
    else query.isActive = true;
    
    const teachers = await Teacher.find(query)
      .populate('departmentId', 'name code')
      .populate('subjects', 'name code')
      .sort({ firstName: 1 });
    
    logger.info('Teachers by subject fetched successfully:', { subjectId, count: teachers.length });
    return successResponse(res, teachers, 'Teachers retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teachers by subject:', error);
    return errorResponse(res, error.message);
  }
};

// Update teacher status
const updateTeacherStatus = async (req, res) => {
  try {
    logger.info('Updating teacher status');
    
    const { id } = req.params;
    const { status } = req.body;
    const { schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Teacher ID');
    if (idError) errors.push(idError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { _id: id };
    if (schoolId) query.schoolId = schoolId;
    
    const teacher = await Teacher.findOneAndUpdate(
      query,
      { status: status, isActive: status === 'active' },
      { new: true }
    ).populate('departmentId', 'name code');
    
    if (!teacher) {
      return notFoundResponse(res, 'Teacher not found');
    }
    
    logger.info('Teacher status updated successfully:', { teacherId: id, status });
    return successResponse(res, teacher, 'Teacher status updated successfully');
  } catch (error) {
    logger.error('Error updating teacher status:', error);
    return errorResponse(res, error.message);
  }
};

// Assign subjects to teacher
const assignSubjects = async (req, res) => {
  try {
    logger.info('Assigning subjects to teacher');
    
    const { id } = req.params;
    const { subjectIds } = req.body;
    const { schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Teacher ID');
    if (idError) errors.push(idError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!subjectIds || !Array.isArray(subjectIds)) {
      errors.push('Subject IDs must be an array');
    } else if (subjectIds.length === 0) {
      errors.push('Subject IDs array cannot be empty');
    } else {
      for (const subjectId of subjectIds) {
        const subjectIdError = validateObjectId(subjectId, 'Subject ID');
        if (subjectIdError) {
          errors.push(subjectIdError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { _id: id };
    if (schoolId) query.schoolId = schoolId;
    
    const teacher = await Teacher.findOneAndUpdate(
      query,
      { subjects: subjectIds },
      { new: true }
    ).populate('subjects', 'name code');
    
    if (!teacher) {
      return notFoundResponse(res, 'Teacher not found');
    }
    
    logger.info('Subjects assigned to teacher successfully:', { teacherId: id, count: subjectIds.length });
    return successResponse(res, teacher, 'Subjects assigned successfully');
  } catch (error) {
    logger.error('Error assigning subjects to teacher:', error);
    return errorResponse(res, error.message);
  }
};

// Assign classes to teacher
const assignClasses = async (req, res) => {
  try {
    logger.info('Assigning classes to teacher');
    
    const { id } = req.params;
    const { classes } = req.body;
    const { schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Teacher ID');
    if (idError) errors.push(idError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!classes || !Array.isArray(classes)) {
      errors.push('Classes must be an array');
    } else if (classes.length === 0) {
      errors.push('Classes array cannot be empty');
    } else {
      for (const classItem of classes) {
        if (!classItem.classId) {
          errors.push('Each class must have a classId');
          break;
        }
        const classIdError = validateObjectId(classItem.classId, 'Class ID');
        if (classIdError) {
          errors.push(classIdError);
          break;
        }
        if (classItem.subjectId) {
          const subjectIdError = validateObjectId(classItem.subjectId, 'Subject ID');
          if (subjectIdError) {
            errors.push(subjectIdError);
            break;
          }
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { _id: id };
    if (schoolId) query.schoolId = schoolId;
    
    const teacher = await Teacher.findOneAndUpdate(
      query,
      { classes: classes },
      { new: true }
    )
      .populate('classes.classId', 'name grade')
      .populate('classes.sectionId', 'name')
      .populate('classes.subjectId', 'name code');
    
    if (!teacher) {
      return notFoundResponse(res, 'Teacher not found');
    }
    
    logger.info('Classes assigned to teacher successfully:', { teacherId: id, count: classes.length });
    return successResponse(res, teacher, 'Classes assigned successfully');
  } catch (error) {
    logger.error('Error assigning classes to teacher:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update status
const bulkUpdateStatus = async (req, res) => {
  try {
    logger.info('Bulk updating teacher status');
    
    const { teacherIds, status } = req.body;
    const { schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!teacherIds || !Array.isArray(teacherIds)) {
      errors.push('Teacher IDs must be an array');
    } else if (teacherIds.length === 0) {
      errors.push('Teacher IDs array cannot be empty');
    } else if (teacherIds.length > 100) {
      errors.push('Cannot update more than 100 teachers at once');
    } else {
      for (const id of teacherIds) {
        const idError = validateObjectId(id, 'Teacher ID');
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
    
    const query = { _id: { $in: teacherIds } };
    if (schoolId) query.schoolId = schoolId;
    
    const result = await Teacher.updateMany(
      query,
      { status: status, isActive: status === 'active' }
    );
    
    logger.info('Teacher status bulk updated successfully:', { count: result.modifiedCount, status });
    return successResponse(res, { modifiedCount: result.modifiedCount }, 'Teachers status updated successfully');
  } catch (error) {
    logger.error('Error bulk updating teacher status:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete teachers
const bulkDeleteTeachers = async (req, res) => {
  try {
    logger.info('Bulk deleting teachers');
    
    const { teacherIds } = req.body;
    const { schoolId, hardDelete } = req.query;
    
    // Validation
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!teacherIds || !Array.isArray(teacherIds)) {
      errors.push('Teacher IDs must be an array');
    } else if (teacherIds.length === 0) {
      errors.push('Teacher IDs array cannot be empty');
    } else if (teacherIds.length > 100) {
      errors.push('Cannot delete more than 100 teachers at once');
    } else {
      for (const id of teacherIds) {
        const idError = validateObjectId(id, 'Teacher ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { _id: { $in: teacherIds } };
    if (schoolId) query.schoolId = schoolId;
    
    let result;
    if (hardDelete === 'true') {
      result = await Teacher.deleteMany(query);
      logger.info('Teachers permanently deleted:', { count: result.deletedCount });
      return successResponse(res, { deletedCount: result.deletedCount }, 'Teachers permanently deleted');
    } else {
      result = await Teacher.updateMany(query, { isActive: false, status: 'inactive' });
      logger.info('Teachers soft deleted:', { count: result.modifiedCount });
      return successResponse(res, { modifiedCount: result.modifiedCount }, 'Teachers deleted successfully');
    }
  } catch (error) {
    logger.error('Error bulk deleting teachers:', error);
    return errorResponse(res, error.message);
  }
};

// Export teachers
const exportTeachers = async (req, res) => {
  try {
    logger.info('Exporting teachers');
    
    const { format, schoolId, department, subject, status } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (department) {
      const departmentError = validateObjectId(department, 'Department ID');
      if (departmentError) errors.push(departmentError);
    }
    
    if (subject) {
      const subjectError = validateObjectId(subject, 'Subject ID');
      if (subjectError) errors.push(subjectError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = {};
    if (schoolId) query.schoolId = schoolId;
    if (department) query.departmentId = department;
    if (subject) query.subjects = subject;
    if (status) query.status = status;
    else query.isActive = true;
    
    const teachers = await Teacher.find(query)
      .populate('departmentId', 'name code')
      .populate('subjects', 'name code')
      .sort({ firstName: 1 });
    
    const exportData = {
      format: format.toLowerCase(),
      data: teachers,
      count: teachers.length,
      exportedAt: new Date().toISOString()
    };
    
    logger.info('Teachers exported successfully:', { format, count: teachers.length });
    return successResponse(res, exportData, 'Teachers exported successfully');
  } catch (error) {
    logger.error('Error exporting teachers:', error);
    return errorResponse(res, error.message);
  }
};

// Get teacher statistics
const getTeacherStatistics = async (req, res) => {
  try {
    logger.info('Fetching teacher statistics');
    
    const { schoolId, departmentId } = req.query;
    
    // Validation
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (departmentId) {
      const departmentIdError = validateObjectId(departmentId, 'Department ID');
      if (departmentIdError) errors.push(departmentIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = {};
    if (schoolId) query.schoolId = schoolId;
    if (departmentId) query.departmentId = departmentId;
    
    const [total, active, inactive, byDepartment, byGender] = await Promise.all([
      Teacher.countDocuments(query),
      Teacher.countDocuments({ ...query, status: 'active' }),
      Teacher.countDocuments({ ...query, status: 'inactive' }),
      Teacher.aggregate([
        { $match: query },
        { $group: { _id: '$departmentId', count: { $sum: 1 } } }
      ]),
      Teacher.aggregate([
        { $match: query },
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ])
    ]);
    
    const statistics = {
      total,
      active,
      inactive,
      byDepartment,
      byGender
    };
    
    logger.info('Teacher statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teacher statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Search teachers
const searchTeachers = async (req, res) => {
  try {
    logger.info('Searching teachers');
    
    const { q, schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = {
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { employeeId: { $regex: q, $options: 'i' } }
      ]
    };
    
    if (schoolId) query.schoolId = schoolId;
    
    const teachers = await Teacher.find(query)
      .populate('departmentId', 'name code')
      .populate('subjects', 'name code')
      .limit(50)
      .sort({ firstName: 1 });
    
    logger.info('Teachers searched successfully:', { query: q, count: teachers.length });
    return successResponse(res, teachers, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching teachers:', error);
    return errorResponse(res, error.message);
  }
};

// Get teacher performance analytics
const getTeacherPerformanceAnalytics = async (req, res) => {
  try {
    logger.info('Fetching teacher performance analytics');
    
    const { teacherId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await teacherService.getTeacherPerformanceAnalytics(teacherId, {
      startDate,
      endDate
    });
    
    logger.info('Teacher performance analytics fetched successfully:', { teacherId });
    return successResponse(res, analytics, 'Performance analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching teacher performance analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherDetails,
  getTeacherRoutine,
  getTeacherLeaves,
  applyLeave,
  reviewLeave,
  getTeacherAttendance,
  getTeacherSalary,
  createSalary,
  updateSalaryStatus,
  getTeacherLibraryRecords,
  getTeacherDashboardData,
  getTeacherSidebarData,
  getTeachersByDepartment,
  getTeachersBySubject,
  updateTeacherStatus,
  assignSubjects,
  assignClasses,
  bulkUpdateStatus,
  bulkDeleteTeachers,
  exportTeachers,
  getTeacherStatistics,
  searchTeachers,
  getTeacherPerformanceAnalytics
};
