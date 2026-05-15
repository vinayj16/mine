import { Employee, Leave, Recruitment, PerformanceReview, Training } from '../models/hr.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse, badRequestResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_EMPLOYEE_STATUSES = ['active', 'inactive', 'on_leave', 'terminated', 'suspended'];
const VALID_LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];
const VALID_LEAVE_TYPES = ['sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid', 'compensatory'];
const VALID_RECRUITMENT_STATUSES = ['draft', 'published', 'closed', 'cancelled'];
const VALID_REVIEW_STATUSES = ['pending', 'completed', 'cancelled'];
const VALID_TRAINING_STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled'];

// Helper function to validate MongoDB ObjectId
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) return fieldName + ' is required';
  if (!mongoose.Types.ObjectId.isValid(id)) return 'Invalid ' + fieldName + ' format';
  return null;
};

// Helper function to validate date
const validateDate = (date, fieldName = 'Date') => {
  if (!date) return fieldName + ' is required';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid ' + fieldName + ' format';
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  if (new Date(startDate) > new Date(endDate)) return 'Start date cannot be after end date';
  return null;
};

// Helper function to validate email
const validateEmail = (email) => {
  if (!email || email.trim().length === 0) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email format';
  return null;
};

// ============ EMPLOYEE CONTROLLER FUNCTIONS ============

const createEmployee = async (req, res) => {
  try {
    logger.info('Creating employee');
    const { employeeId, user, department, designation, joiningDate, salary, status } = req.body;
    const errors = [];
    
    if (!employeeId || employeeId.trim().length === 0) errors.push('Employee ID is required');
    else if (employeeId.length > 50) errors.push('Employee ID must not exceed 50 characters');
    const userIdError = validateObjectId(user, 'User ID');
    if (userIdError) errors.push(userIdError);
    if (!department || department.trim().length === 0) errors.push('Department is required');
    if (!designation || designation.trim().length === 0) errors.push('Designation is required');
    if (joiningDate) {
      const dateError = validateDate(joiningDate, 'Joining date');
      if (dateError) errors.push(dateError);
    }
    if (salary !== undefined && (isNaN(parseFloat(salary)) || parseFloat(salary) < 0)) errors.push('Salary must be a non-negative number');
    if (status && !VALID_EMPLOYEE_STATUSES.includes(status)) errors.push('Invalid status');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const employee = new Employee({ ...req.body, institution: req.tenantId });
    await employee.save();
    await employee.populate('user', 'name email role');
    
    logger.info('Employee created successfully:', { employeeId: employee._id });
    return createdResponse(res, employee, 'Employee created successfully');
  } catch (error) {
    logger.error('Error creating employee:', error);
    return errorResponse(res, error.message);
  }
};

const getAllEmployees = async (req, res) => {
  try {
    logger.info('Fetching all employees');
    const { page, limit, department, status, search } = req.query;
    const errors = [];
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (status && !VALID_EMPLOYEE_STATUSES.includes(status)) errors.push('Invalid status');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const query = { institution: req.tenantId };
    if (department) query.department = department;
    if (status) query.status = status;
    if (search) query.$or = [{ employeeId: new RegExp(search, 'i') }, { designation: new RegExp(search, 'i') }];
    
    const skip = (pageNum - 1) * limitNum;
    const [employees, total] = await Promise.all([
      Employee.find(query).populate('user', 'name email role').populate('reportingTo', 'name').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Employee.countDocuments(query)
    ]);
    
    logger.info('Employees fetched successfully');
    return successResponse(res, { employees, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'Employees retrieved successfully');
  } catch (error) {
    logger.error('Error fetching employees:', error);
    return errorResponse(res, error.message);
  }
};

const getEmployeeById = async (req, res) => {
  try {
    logger.info('Fetching employee by ID');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Employee ID');
    if (idError) errors.push(idError);
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const employee = await Employee.findOne({ _id: req.params.id, institution: req.tenantId }).populate('user', 'name email role').populate('reportingTo', 'name');
    if (!employee) return notFoundResponse(res, 'Employee not found');
    
    logger.info('Employee fetched successfully:', { employeeId: req.params.id });
    return successResponse(res, employee, 'Employee retrieved successfully');
  } catch (error) {
    logger.error('Error fetching employee:', error);
    return errorResponse(res, error.message);
  }
};

const updateEmployee = async (req, res) => {
  try {
    logger.info('Updating employee');
    const { status, salary } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Employee ID');
    if (idError) errors.push(idError);
    if (status !== undefined && !VALID_EMPLOYEE_STATUSES.includes(status)) errors.push('Invalid status');
    if (salary !== undefined && (isNaN(parseFloat(salary)) || parseFloat(salary) < 0)) errors.push('Salary must be a non-negative number');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const employee = await Employee.findOneAndUpdate({ _id: req.params.id, institution: req.tenantId }, req.body, { new: true, runValidators: true }).populate('user', 'name email role');
    if (!employee) return notFoundResponse(res, 'Employee not found');
    
    logger.info('Employee updated successfully:', { employeeId: req.params.id });
    return successResponse(res, employee, 'Employee updated successfully');
  } catch (error) {
    logger.error('Error updating employee:', error);
    return errorResponse(res, error.message);
  }
};

const updateEmployeePerformance = async (req, res) => {
  try {
    logger.info('Updating employee performance');
    const { currentRating, lastReviewDate, nextReviewDate } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Employee ID');
    if (idError) errors.push(idError);
    if (currentRating !== undefined && (isNaN(parseFloat(currentRating)) || parseFloat(currentRating) < 0 || parseFloat(currentRating) > 5)) errors.push('Rating must be between 0 and 5');
    if (lastReviewDate) {
      const dateError = validateDate(lastReviewDate, 'Last review date');
      if (dateError) errors.push(dateError);
    }
    if (nextReviewDate) {
      const dateError = validateDate(nextReviewDate, 'Next review date');
      if (dateError) errors.push(dateError);
    }
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const employee = await Employee.findOneAndUpdate({ _id: req.params.id, institution: req.tenantId }, { 'performance.currentRating': currentRating, 'performance.lastReviewDate': lastReviewDate, 'performance.nextReviewDate': nextReviewDate }, { new: true });
    if (!employee) return notFoundResponse(res, 'Employee not found');
    
    logger.info('Employee performance updated successfully:', { employeeId: req.params.id });
    return successResponse(res, employee, 'Employee performance updated successfully');
  } catch (error) {
    logger.error('Error updating employee performance:', error);
    return errorResponse(res, error.message);
  }
};

// ============ LEAVE CONTROLLER FUNCTIONS ============

const applyLeave = async (req, res) => {
  try {
    logger.info('Applying for leave');
    const { leaveType, startDate, endDate, reason, totalDays } = req.body;
    const errors = [];
    if (!leaveType || !VALID_LEAVE_TYPES.includes(leaveType)) errors.push('Invalid leave type');
    const startDateError = validateDate(startDate, 'Start date');
    if (startDateError) errors.push(startDateError);
    const endDateError = validateDate(endDate, 'End date');
    if (endDateError) errors.push(endDateError);
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    if (!reason || reason.trim().length === 0) errors.push('Reason is required');
    else if (reason.length > 1000) errors.push('Reason must not exceed 1000 characters');
    if (totalDays !== undefined && (isNaN(parseInt(totalDays)) || parseInt(totalDays) < 1)) errors.push('Total days must be at least 1');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const leave = new Leave({ ...req.body, employee: req.user?.id, institution: req.tenantId });
    await leave.save();
    
    logger.info('Leave application submitted successfully:', { leaveId: leave._id });
    return createdResponse(res, leave, 'Leave application submitted successfully');
  } catch (error) {
    logger.error('Error applying for leave:', error);
    return errorResponse(res, error.message);
  }
};

const getAllLeaves = async (req, res) => {
  try {
    logger.info('Fetching all leaves');
    const { page, limit, employee, status, leaveType } = req.query;
    const errors = [];
    if (employee) {
      const employeeIdError = validateObjectId(employee, 'Employee ID');
      if (employeeIdError) errors.push(employeeIdError);
    }
    if (status && !VALID_LEAVE_STATUSES.includes(status)) errors.push('Invalid status');
    if (leaveType && !VALID_LEAVE_TYPES.includes(leaveType)) errors.push('Invalid leave type');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const query = { institution: req.tenantId };
    if (req.user?.role !== 'hr_manager' && req.user?.role !== 'superadmin') query.employee = req.user?.id;
    else if (employee) query.employee = employee;
    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    
    const skip = (pageNum - 1) * limitNum;
    const [leaves, total] = await Promise.all([
      Leave.find(query).populate('employee', 'name email').populate('approvedBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Leave.countDocuments(query)
    ]);
    
    logger.info('Leaves fetched successfully');
    return successResponse(res, { leaves, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'Leave applications retrieved successfully');
  } catch (error) {
    logger.error('Error fetching leaves:', error);
    return errorResponse(res, error.message);
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    logger.info('Updating leave status');
    const { status, rejectionReason, comments } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Leave ID');
    if (idError) errors.push(idError);
    if (!status || !VALID_LEAVE_STATUSES.includes(status)) errors.push('Invalid status');
    if (status === 'rejected' && (!rejectionReason || rejectionReason.trim().length === 0)) errors.push('Rejection reason is required');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const leave = await Leave.findOne({ _id: req.params.id, institution: req.tenantId });
    if (!leave) return notFoundResponse(res, 'Leave application not found');
    
    leave.status = status;
    leave.approvedBy = req.user?.id;
    leave.approvedDate = new Date();
    if (status === 'rejected' && rejectionReason) leave.rejectionReason = rejectionReason;
    if (comments) leave.comments.push({ user: req.user?.id, comment: comments });
    await leave.save();
    
    logger.info('Leave status updated successfully:', { leaveId: req.params.id, status });
    return successResponse(res, leave, 'Leave application ' + status + ' successfully');
  } catch (error) {
    logger.error('Error updating leave status:', error);
    return errorResponse(res, error.message);
  }
};

// ============ RECRUITMENT CONTROLLER FUNCTIONS ============

const createRecruitment = async (req, res) => {
  try {
    logger.info('Creating job posting');
    const { title, description, department, positions, deadline, status } = req.body;
    const errors = [];
    if (!title || title.trim().length === 0) errors.push('Title is required');
    else if (title.length > 200) errors.push('Title must not exceed 200 characters');
    if (!description || description.trim().length === 0) errors.push('Description is required');
    if (!department || department.trim().length === 0) errors.push('Department is required');
    if (positions !== undefined && (isNaN(parseInt(positions)) || parseInt(positions) < 1)) errors.push('Positions must be at least 1');
    if (deadline) {
      const dateError = validateDate(deadline, 'Deadline');
      if (dateError) errors.push(dateError);
    }
    if (status && !VALID_RECRUITMENT_STATUSES.includes(status)) errors.push('Invalid status');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const recruitment = new Recruitment({ ...req.body, institution: req.tenantId, postedBy: req.user?.id });
    await recruitment.save();
    
    logger.info('Job posting created successfully:', { recruitmentId: recruitment._id });
    return createdResponse(res, recruitment, 'Job posting created successfully');
  } catch (error) {
    logger.error('Error creating job posting:', error);
    return errorResponse(res, error.message);
  }
};

const getAllRecruitments = async (req, res) => {
  try {
    logger.info('Fetching all job postings');
    const { status, department, page, limit } = req.query;
    const errors = [];
    if (status && !VALID_RECRUITMENT_STATUSES.includes(status)) errors.push('Invalid status');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const query = { institution: req.tenantId };
    if (status) query.status = status;
    if (department) query.department = department;
    
    const skip = (pageNum - 1) * limitNum;
    const [recruitments, total] = await Promise.all([
      Recruitment.find(query).populate('postedBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Recruitment.countDocuments(query)
    ]);
    
    logger.info('Job postings fetched successfully');
    return successResponse(res, { recruitments, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'Job postings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching job postings:', error);
    return errorResponse(res, error.message);
  }
};

const applyForJob = async (req, res) => {
  try {
    logger.info('Applying for job');
    const { resume, coverLetter } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Job ID');
    if (idError) errors.push(idError);
    if (!resume || resume.trim().length === 0) errors.push('Resume is required');
    if (coverLetter && coverLetter.length > 2000) errors.push('Cover letter must not exceed 2000 characters');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const recruitment = await Recruitment.findOne({ _id: req.params.id, institution: req.tenantId, status: 'published' });
    if (!recruitment) return notFoundResponse(res, 'Job posting not found or not active');
    
    const existingApplication = recruitment.applicants.find(app => app.user.toString() === req.user?.id);
    if (existingApplication) return badRequestResponse(res, 'You have already applied for this position');
    
    recruitment.applicants.push({ user: req.user?.id, resume, coverLetter });
    await recruitment.save();
    
    logger.info('Job application submitted successfully:', { recruitmentId: req.params.id });
    return successResponse(res, null, 'Job application submitted successfully');
  } catch (error) {
    logger.error('Error applying for job:', error);
    return errorResponse(res, error.message);
  }
};

// ============ PERFORMANCE REVIEW CONTROLLER FUNCTIONS ============

const createPerformanceReview = async (req, res) => {
  try {
    logger.info('Creating performance review');
    const { employee, reviewer, reviewPeriod, overallRating, status } = req.body;
    const errors = [];
    const employeeIdError = validateObjectId(employee, 'Employee ID');
    if (employeeIdError) errors.push(employeeIdError);
    const reviewerIdError = validateObjectId(reviewer, 'Reviewer ID');
    if (reviewerIdError) errors.push(reviewerIdError);
    if (!reviewPeriod || reviewPeriod.trim().length === 0) errors.push('Review period is required');
    if (overallRating !== undefined && (isNaN(parseFloat(overallRating)) || parseFloat(overallRating) < 0 || parseFloat(overallRating) > 5)) errors.push('Overall rating must be between 0 and 5');
    if (status && !VALID_REVIEW_STATUSES.includes(status)) errors.push('Invalid status');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const performanceReview = new PerformanceReview({ ...req.body, institution: req.tenantId });
    await performanceReview.save();
    
    logger.info('Performance review created successfully:', { reviewId: performanceReview._id });
    return createdResponse(res, performanceReview, 'Performance review created successfully');
  } catch (error) {
    logger.error('Error creating performance review:', error);
    return errorResponse(res, error.message);
  }
};

const getAllPerformanceReviews = async (req, res) => {
  try {
    logger.info('Fetching all performance reviews');
    const { employee, status, page, limit } = req.query;
    const errors = [];
    if (employee) {
      const employeeIdError = validateObjectId(employee, 'Employee ID');
      if (employeeIdError) errors.push(employeeIdError);
    }
    if (status && !VALID_REVIEW_STATUSES.includes(status)) errors.push('Invalid status');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const query = { institution: req.tenantId };
    if (req.user?.role !== 'hr_manager' && req.user?.role !== 'superadmin') query.employee = req.user?.id;
    else if (employee) query.employee = employee;
    if (status) query.status = status;
    
    const skip = (pageNum - 1) * limitNum;
    const [reviews, total] = await Promise.all([
      PerformanceReview.find(query).populate('employee', 'name').populate('reviewer', 'name').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      PerformanceReview.countDocuments(query)
    ]);
    
    logger.info('Performance reviews fetched successfully');
    return successResponse(res, { reviews, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'Performance reviews retrieved successfully');
  } catch (error) {
    logger.error('Error fetching performance reviews:', error);
    return errorResponse(res, error.message);
  }
};

// ============ TRAINING CONTROLLER FUNCTIONS ============

const createTraining = async (req, res) => {
  try {
    logger.info('Creating training program');
    const { title, description, category, startDate, endDate, capacity, status } = req.body;
    const errors = [];
    if (!title || title.trim().length === 0) errors.push('Title is required');
    else if (title.length > 200) errors.push('Title must not exceed 200 characters');
    if (!description || description.trim().length === 0) errors.push('Description is required');
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
    if (capacity !== undefined && (isNaN(parseInt(capacity)) || parseInt(capacity) < 1)) errors.push('Capacity must be at least 1');
    if (status && !VALID_TRAINING_STATUSES.includes(status)) errors.push('Invalid status');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const training = new Training({ ...req.body, institution: req.tenantId, createdBy: req.user?.id });
    await training.save();
    
    logger.info('Training program created successfully:', { trainingId: training._id });
    return createdResponse(res, training, 'Training program created successfully');
  } catch (error) {
    logger.error('Error creating training program:', error);
    return errorResponse(res, error.message);
  }
};

const getAllTrainings = async (req, res) => {
  try {
    logger.info('Fetching all training programs');
    const { status, category, page, limit } = req.query;
    const errors = [];
    if (status && !VALID_TRAINING_STATUSES.includes(status)) errors.push('Invalid status');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const query = { institution: req.tenantId };
    if (status) query.status = status;
    if (category) query.category = category;
    
    const skip = (pageNum - 1) * limitNum;
    const [trainings, total] = await Promise.all([
      Training.find(query).populate('createdBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Training.countDocuments(query)
    ]);
    
    logger.info('Training programs fetched successfully');
    return successResponse(res, { trainings, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'Training programs retrieved successfully');
  } catch (error) {
    logger.error('Error fetching training programs:', error);
    return errorResponse(res, error.message);
  }
};

const enrollInTraining = async (req, res) => {
  try {
    logger.info('Enrolling in training');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Training ID');
    if (idError) errors.push(idError);
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const training = await Training.findOne({ _id: req.params.id, institution: req.tenantId });
    if (!training) return notFoundResponse(res, 'Training program not found');
    
    const existingEnrollment = training.enrolled.find(enroll => enroll.employee.toString() === req.user?.id);
    if (existingEnrollment) return badRequestResponse(res, 'You are already enrolled in this training');
    
    if (training.capacity && training.enrolled.length >= training.capacity) return badRequestResponse(res, 'Training program is full');
    
    training.enrolled.push({ employee: req.user?.id });
    await training.save();
    
    logger.info('Enrolled in training successfully:', { trainingId: req.params.id });
    return successResponse(res, null, 'Successfully enrolled in training program');
  } catch (error) {
    logger.error('Error enrolling in training:', error);
    return errorResponse(res, error.message);
  }
};

export default {
  createEmployee, getAllEmployees, getEmployeeById, updateEmployee, updateEmployeePerformance,
  applyLeave, getAllLeaves, updateLeaveStatus,
  createRecruitment, getAllRecruitments, applyForJob,
  createPerformanceReview, getAllPerformanceReviews,
  createTraining, getAllTrainings, enrollInTraining
};
