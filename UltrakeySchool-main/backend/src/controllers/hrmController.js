import hrmService from '../services/hrmService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_EMPLOYMENT_STATUSES = ['active', 'inactive', 'on_leave', 'terminated', 'suspended'];
const VALID_EMPLOYEE_TYPES = ['full_time', 'part_time', 'contract', 'temporary', 'intern'];
const VALID_LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];
const VALID_LEAVE_TYPES = ['sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid'];
const VALID_DEPARTMENT_STATUSES = ['active', 'inactive'];

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

// ============ STAFF MANAGEMENT FUNCTIONS ============

const createStaff = async (req, res, next) => {
  try {
    logger.info('Creating staff');
    const { name, email, department, designation, employmentStatus, employeeType, salary, joiningDate } = req.body;
    const errors = [];
    if (!name || name.trim().length === 0) errors.push('Name is required');
    if (!email || email.trim().length === 0) errors.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
    if (department) {
      const deptError = validateObjectId(department, 'Department ID');
      if (deptError) errors.push(deptError);
    }
    if (employmentStatus && !VALID_EMPLOYMENT_STATUSES.includes(employmentStatus)) errors.push('Invalid employment status');
    if (employeeType && !VALID_EMPLOYEE_TYPES.includes(employeeType)) errors.push('Invalid employee type');
    if (salary !== undefined && (isNaN(parseFloat(salary)) || parseFloat(salary) < 0)) errors.push('Salary must be a non-negative number');
    if (joiningDate) {
      const dateError = validateDate(joiningDate, 'Joining date');
      if (dateError) errors.push(dateError);
    }
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const staff = await hrmService.createStaff(req.body);
    logger.info('Staff created successfully:', { staffId: staff._id });
    return createdResponse(res, staff, 'Staff created successfully');
  } catch (error) {
    logger.error('Error creating staff:', error);
    next(error);
  }
};

const getAllStaff = async (req, res, next) => {
  try {
    logger.info('Fetching all staff');
    const { department, designation, employmentStatus, employeeType, page, limit } = req.query;
    const errors = [];
    if (department) {
      const deptError = validateObjectId(department, 'Department ID');
      if (deptError) errors.push(deptError);
    }
    if (employmentStatus && !VALID_EMPLOYMENT_STATUSES.includes(employmentStatus)) errors.push('Invalid employment status');
    if (employeeType && !VALID_EMPLOYEE_TYPES.includes(employeeType)) errors.push('Invalid employee type');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const filters = { department, designation, employmentStatus, employeeType, page: pageNum, limit: limitNum };
    const staff = await hrmService.getAllStaff(filters);
    logger.info('Staff fetched successfully');
    return successResponse(res, staff, 'Staff retrieved successfully');
  } catch (error) {
    logger.error('Error fetching staff:', error);
    next(error);
  }
};

const getStaffById = async (req, res, next) => {
  try {
    logger.info('Fetching staff by ID');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Staff ID');
    if (idError) errors.push(idError);
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const staff = await hrmService.getStaffById(req.params.id);
    if (!staff) return notFoundResponse(res, 'Staff not found');
    
    logger.info('Staff fetched successfully:', { staffId: req.params.id });
    return successResponse(res, staff, 'Staff retrieved successfully');
  } catch (error) {
    logger.error('Error fetching staff:', error);
    next(error);
  }
};

const updateStaff = async (req, res, next) => {
  try {
    logger.info('Updating staff');
    const { employmentStatus, employeeType, salary } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Staff ID');
    if (idError) errors.push(idError);
    if (employmentStatus !== undefined && !VALID_EMPLOYMENT_STATUSES.includes(employmentStatus)) errors.push('Invalid employment status');
    if (employeeType !== undefined && !VALID_EMPLOYEE_TYPES.includes(employeeType)) errors.push('Invalid employee type');
    if (salary !== undefined && (isNaN(parseFloat(salary)) || parseFloat(salary) < 0)) errors.push('Salary must be a non-negative number');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const staff = await hrmService.updateStaff(req.params.id, req.body);
    if (!staff) return notFoundResponse(res, 'Staff not found');
    
    logger.info('Staff updated successfully:', { staffId: req.params.id });
    return successResponse(res, staff, 'Staff updated successfully');
  } catch (error) {
    logger.error('Error updating staff:', error);
    next(error);
  }
};

const deleteStaff = async (req, res, next) => {
  try {
    logger.info('Deleting staff');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Staff ID');
    if (idError) errors.push(idError);
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const staff = await hrmService.deleteStaff(req.params.id);
    if (!staff) return notFoundResponse(res, 'Staff not found');
    
    logger.info('Staff deleted successfully:', { staffId: req.params.id });
    return successResponse(res, null, 'Staff deleted successfully');
  } catch (error) {
    logger.error('Error deleting staff:', error);
    next(error);
  }
};

const searchStaff = async (req, res, next) => {
  try {
    logger.info('Searching staff');
    const { q, page, limit } = req.query;
    const errors = [];
    if (!q || q.trim().length === 0) errors.push('Search query is required');
    else if (q.length > 200) errors.push('Search query must not exceed 200 characters');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const staff = await hrmService.searchStaff(q, { page: pageNum, limit: limitNum });
    logger.info('Staff search completed successfully');
    return successResponse(res, staff, 'Staff retrieved successfully');
  } catch (error) {
    logger.error('Error searching staff:', error);
    next(error);
  }
};

const getStaffByDepartment = async (req, res, next) => {
  try {
    logger.info('Fetching staff by department');
    const errors = [];
    const deptError = validateObjectId(req.params.departmentId, 'Department ID');
    if (deptError) errors.push(deptError);
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const staff = await hrmService.getStaffByDepartment(req.params.departmentId);
    logger.info('Staff fetched successfully for department:', { departmentId: req.params.departmentId });
    return successResponse(res, staff, 'Staff retrieved successfully');
  } catch (error) {
    logger.error('Error fetching staff by department:', error);
    next(error);
  }
};

const updateSalary = async (req, res, next) => {
  try {
    logger.info('Updating staff salary');
    const { salary, effectiveDate } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Staff ID');
    if (idError) errors.push(idError);
    if (salary === undefined || salary === null) errors.push('Salary is required');
    else if (isNaN(parseFloat(salary)) || parseFloat(salary) < 0) errors.push('Salary must be a non-negative number');
    if (effectiveDate) {
      const dateError = validateDate(effectiveDate, 'Effective date');
      if (dateError) errors.push(dateError);
    }
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const staff = await hrmService.updateSalary(req.params.id, req.body);
    if (!staff) return notFoundResponse(res, 'Staff not found');
    
    logger.info('Salary updated successfully:', { staffId: req.params.id });
    return successResponse(res, staff, 'Salary updated successfully');
  } catch (error) {
    logger.error('Error updating salary:', error);
    next(error);
  }
};

const addAttendance = async (req, res, next) => {
  try {
    logger.info('Adding staff attendance');
    const { date, status } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Staff ID');
    if (idError) errors.push(idError);
    const dateError = validateDate(date, 'Date');
    if (dateError) errors.push(dateError);
    if (!status || status.trim().length === 0) errors.push('Status is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const staff = await hrmService.addAttendance(req.params.id, req.body);
    if (!staff) return notFoundResponse(res, 'Staff not found');
    
    logger.info('Attendance added successfully:', { staffId: req.params.id });
    return successResponse(res, staff, 'Attendance added successfully');
  } catch (error) {
    logger.error('Error adding attendance:', error);
    next(error);
  }
};

// ============ DEPARTMENT MANAGEMENT FUNCTIONS ============

const createDepartment = async (req, res, next) => {
  try {
    logger.info('Creating department');
    const { name, code, status } = req.body;
    const errors = [];
    if (!name || name.trim().length === 0) errors.push('Name is required');
    else if (name.length > 100) errors.push('Name must not exceed 100 characters');
    if (code && code.length > 20) errors.push('Code must not exceed 20 characters');
    if (status && !VALID_DEPARTMENT_STATUSES.includes(status)) errors.push('Invalid status');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const department = await hrmService.createDepartment(req.body);
    logger.info('Department created successfully:', { departmentId: department._id });
    return createdResponse(res, department, 'Department created successfully');
  } catch (error) {
    logger.error('Error creating department:', error);
    next(error);
  }
};

const getAllDepartments = async (req, res, next) => {
  try {
    logger.info('Fetching all departments');
    const { status, page, limit } = req.query;
    const errors = [];
    if (status && !VALID_DEPARTMENT_STATUSES.includes(status)) errors.push('Invalid status');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const departments = await hrmService.getAllDepartments({ status, page: pageNum, limit: limitNum });
    logger.info('Departments fetched successfully');
    return successResponse(res, departments, 'Departments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching departments:', error);
    next(error);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    logger.info('Fetching department by ID');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Department ID');
    if (idError) errors.push(idError);
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const department = await hrmService.getDepartmentById(req.params.id);
    if (!department) return notFoundResponse(res, 'Department not found');
    
    logger.info('Department fetched successfully:', { departmentId: req.params.id });
    return successResponse(res, department, 'Department retrieved successfully');
  } catch (error) {
    logger.error('Error fetching department:', error);
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    logger.info('Updating department');
    const { name, status } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Department ID');
    if (idError) errors.push(idError);
    if (name !== undefined && (!name || name.trim().length === 0)) errors.push('Name cannot be empty');
    if (status !== undefined && !VALID_DEPARTMENT_STATUSES.includes(status)) errors.push('Invalid status');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const department = await hrmService.updateDepartment(req.params.id, req.body);
    if (!department) return notFoundResponse(res, 'Department not found');
    
    logger.info('Department updated successfully:', { departmentId: req.params.id });
    return successResponse(res, department, 'Department updated successfully');
  } catch (error) {
    logger.error('Error updating department:', error);
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    logger.info('Deleting department');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Department ID');
    if (idError) errors.push(idError);
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const department = await hrmService.deleteDepartment(req.params.id);
    if (!department) return notFoundResponse(res, 'Department not found');
    
    logger.info('Department deleted successfully:', { departmentId: req.params.id });
    return successResponse(res, null, 'Department deleted successfully');
  } catch (error) {
    logger.error('Error deleting department:', error);
    next(error);
  }
};

// ============ DESIGNATION MANAGEMENT FUNCTIONS ============

const createDesignation = async (req, res, next) => {
  try {
    logger.info('Creating designation');
    const { name, department, status } = req.body;
    const errors = [];
    if (!name || name.trim().length === 0) errors.push('Name is required');
    else if (name.length > 100) errors.push('Name must not exceed 100 characters');
    if (department) {
      const deptError = validateObjectId(department, 'Department ID');
      if (deptError) errors.push(deptError);
    }
    if (status && !VALID_DEPARTMENT_STATUSES.includes(status)) errors.push('Invalid status');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const designation = await hrmService.createDesignation(req.body);
    logger.info('Designation created successfully:', { designationId: designation._id });
    return createdResponse(res, designation, 'Designation created successfully');
  } catch (error) {
    logger.error('Error creating designation:', error);
    next(error);
  }
};

const getAllDesignations = async (req, res, next) => {
  try {
    logger.info('Fetching all designations');
    const { department, status, page, limit } = req.query;
    const errors = [];
    if (department) {
      const deptError = validateObjectId(department, 'Department ID');
      if (deptError) errors.push(deptError);
    }
    if (status && !VALID_DEPARTMENT_STATUSES.includes(status)) errors.push('Invalid status');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const designations = await hrmService.getAllDesignations({ department, status, page: pageNum, limit: limitNum });
    logger.info('Designations fetched successfully');
    return successResponse(res, designations, 'Designations retrieved successfully');
  } catch (error) {
    logger.error('Error fetching designations:', error);
    next(error);
  }
};

const getDesignationById = async (req, res, next) => {
  try {
    logger.info('Fetching designation by ID');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Designation ID');
    if (idError) errors.push(idError);
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const designation = await hrmService.getDesignationById(req.params.id);
    if (!designation) return notFoundResponse(res, 'Designation not found');
    
    logger.info('Designation fetched successfully:', { designationId: req.params.id });
    return successResponse(res, designation, 'Designation retrieved successfully');
  } catch (error) {
    logger.error('Error fetching designation:', error);
    next(error);
  }
};

const updateDesignation = async (req, res, next) => {
  try {
    logger.info('Updating designation');
    const { name, status } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Designation ID');
    if (idError) errors.push(idError);
    if (name !== undefined && (!name || name.trim().length === 0)) errors.push('Name cannot be empty');
    if (status !== undefined && !VALID_DEPARTMENT_STATUSES.includes(status)) errors.push('Invalid status');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const designation = await hrmService.updateDesignation(req.params.id, req.body);
    if (!designation) return notFoundResponse(res, 'Designation not found');
    
    logger.info('Designation updated successfully:', { designationId: req.params.id });
    return successResponse(res, designation, 'Designation updated successfully');
  } catch (error) {
    logger.error('Error updating designation:', error);
    next(error);
  }
};

const deleteDesignation = async (req, res, next) => {
  try {
    logger.info('Deleting designation');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Designation ID');
    if (idError) errors.push(idError);
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const designation = await hrmService.deleteDesignation(req.params.id);
    if (!designation) return notFoundResponse(res, 'Designation not found');
    
    logger.info('Designation deleted successfully:', { designationId: req.params.id });
    return successResponse(res, null, 'Designation deleted successfully');
  } catch (error) {
    logger.error('Error deleting designation:', error);
    next(error);
  }
};

// ============ LEAVE MANAGEMENT FUNCTIONS ============

const createLeave = async (req, res, next) => {
  try {
    logger.info('Creating leave request');
    const { staffId, leaveType, startDate, endDate, reason } = req.body;
    const errors = [];
    const staffIdError = validateObjectId(staffId, 'Staff ID');
    if (staffIdError) errors.push(staffIdError);
    if (!leaveType || !VALID_LEAVE_TYPES.includes(leaveType)) errors.push('Invalid leave type');
    const startDateError = validateDate(startDate, 'Start date');
    if (startDateError) errors.push(startDateError);
    const endDateError = validateDate(endDate, 'End date');
    if (endDateError) errors.push(endDateError);
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) errors.push('Start date cannot be after end date');
    if (!reason || reason.trim().length === 0) errors.push('Reason is required');
    else if (reason.length > 1000) errors.push('Reason must not exceed 1000 characters');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const leave = await hrmService.createLeave(req.body);
    logger.info('Leave request created successfully:', { leaveId: leave._id });
    return createdResponse(res, leave, 'Leave request created successfully');
  } catch (error) {
    logger.error('Error creating leave request:', error);
    next(error);
  }
};

const getAllLeaves = async (req, res, next) => {
  try {
    logger.info('Fetching all leaves');
    const { staffId, status, leaveType, page, limit } = req.query;
    const errors = [];
    if (staffId) {
      const staffIdError = validateObjectId(staffId, 'Staff ID');
      if (staffIdError) errors.push(staffIdError);
    }
    if (status && !VALID_LEAVE_STATUSES.includes(status)) errors.push('Invalid status');
    if (leaveType && !VALID_LEAVE_TYPES.includes(leaveType)) errors.push('Invalid leave type');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const leaves = await hrmService.getAllLeaves({ staffId, status, leaveType, page: pageNum, limit: limitNum });
    logger.info('Leaves fetched successfully');
    return successResponse(res, leaves, 'Leaves retrieved successfully');
  } catch (error) {
    logger.error('Error fetching leaves:', error);
    next(error);
  }
};

const getLeaveById = async (req, res, next) => {
  try {
    logger.info('Fetching leave by ID');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Leave ID');
    if (idError) errors.push(idError);
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const leave = await hrmService.getLeaveById(req.params.id);
    if (!leave) return notFoundResponse(res, 'Leave not found');
    
    logger.info('Leave fetched successfully:', { leaveId: req.params.id });
    return successResponse(res, leave, 'Leave retrieved successfully');
  } catch (error) {
    logger.error('Error fetching leave:', error);
    next(error);
  }
};

const updateLeave = async (req, res, next) => {
  try {
    logger.info('Updating leave');
    const { status } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Leave ID');
    if (idError) errors.push(idError);
    if (status !== undefined && !VALID_LEAVE_STATUSES.includes(status)) errors.push('Invalid status');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const leave = await hrmService.updateLeave(req.params.id, req.body);
    if (!leave) return notFoundResponse(res, 'Leave not found');
    
    logger.info('Leave updated successfully:', { leaveId: req.params.id });
    return successResponse(res, leave, 'Leave updated successfully');
  } catch (error) {
    logger.error('Error updating leave:', error);
    next(error);
  }
};

const deleteLeave = async (req, res, next) => {
  try {
    logger.info('Deleting leave');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Leave ID');
    if (idError) errors.push(idError);
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const leave = await hrmService.deleteLeave(req.params.id);
    if (!leave) return notFoundResponse(res, 'Leave not found');
    
    logger.info('Leave deleted successfully:', { leaveId: req.params.id });
    return successResponse(res, null, 'Leave deleted successfully');
  } catch (error) {
    logger.error('Error deleting leave:', error);
    next(error);
  }
};

const approveLeave = async (req, res, next) => {
  try {
    logger.info('Approving leave');
    const { approvedBy } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Leave ID');
    if (idError) errors.push(idError);
    const approvedByError = validateObjectId(approvedBy, 'Approved by');
    if (approvedByError) errors.push(approvedByError);
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const leave = await hrmService.approveLeave(req.params.id, approvedBy);
    if (!leave) return notFoundResponse(res, 'Leave not found');
    
    logger.info('Leave approved successfully:', { leaveId: req.params.id });
    return successResponse(res, leave, 'Leave approved successfully');
  } catch (error) {
    logger.error('Error approving leave:', error);
    next(error);
  }
};

const rejectLeave = async (req, res, next) => {
  try {
    logger.info('Rejecting leave');
    const { approvedBy, comments } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Leave ID');
    if (idError) errors.push(idError);
    const approvedByError = validateObjectId(approvedBy, 'Approved by');
    if (approvedByError) errors.push(approvedByError);
    if (comments && comments.length > 1000) errors.push('Comments must not exceed 1000 characters');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const leave = await hrmService.rejectLeave(req.params.id, approvedBy, comments);
    if (!leave) return notFoundResponse(res, 'Leave not found');
    
    logger.info('Leave rejected successfully:', { leaveId: req.params.id });
    return successResponse(res, leave, 'Leave rejected successfully');
  } catch (error) {
    logger.error('Error rejecting leave:', error);
    next(error);
  }
};

const getPendingLeaves = async (req, res, next) => {
  try {
    logger.info('Fetching pending leaves');
    const { page, limit } = req.query;
    const errors = [];
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const leaves = await hrmService.getPendingLeaves({ page: pageNum, limit: limitNum });
    logger.info('Pending leaves fetched successfully');
    return successResponse(res, leaves, 'Pending leaves retrieved successfully');
  } catch (error) {
    logger.error('Error fetching pending leaves:', error);
    next(error);
  }
};

// ============ ANALYTICS & REPORTS FUNCTIONS ============

const getHRMStats = async (req, res, next) => {
  try {
    logger.info('Fetching HRM statistics');
    const stats = await hrmService.getHRMStats();
    logger.info('HRM statistics fetched successfully');
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching HRM statistics:', error);
    next(error);
  }
};

const getLeaveBalance = async (req, res, next) => {
  try {
    logger.info('Fetching leave balance');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Staff ID');
    if (idError) errors.push(idError);
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const balance = await hrmService.calculateLeaveBalance(req.params.id);
    if (!balance) return notFoundResponse(res, 'Staff not found');
    
    logger.info('Leave balance fetched successfully:', { staffId: req.params.id });
    return successResponse(res, balance, 'Leave balance retrieved successfully');
  } catch (error) {
    logger.error('Error fetching leave balance:', error);
    next(error);
  }
};

const getAttendanceSummary = async (req, res, next) => {
  try {
    logger.info('Fetching attendance summary');
    const { month } = req.query;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Staff ID');
    if (idError) errors.push(idError);
    if (!month || month.trim().length === 0) errors.push('Month parameter is required (format: YYYY-MM)');
    else if (!/^\d{4}-\d{2}$/.test(month)) errors.push('Invalid month format. Expected YYYY-MM');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const summary = await hrmService.getStaffAttendanceSummary(req.params.id, month);
    logger.info('Attendance summary fetched successfully:', { staffId: req.params.id, month });
    return successResponse(res, summary, 'Attendance summary retrieved successfully');
  } catch (error) {
    logger.error('Error fetching attendance summary:', error);
    next(error);
  }
};

const getPayrollReport = async (req, res, next) => {
  try {
    logger.info('Fetching payroll report');
    const { month } = req.query;
    const errors = [];
    if (!month || month.trim().length === 0) errors.push('Month parameter is required (format: YYYY-MM)');
    else if (!/^\d{4}-\d{2}$/.test(month)) errors.push('Invalid month format. Expected YYYY-MM');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const report = await hrmService.getPayrollReport(month);
    logger.info('Payroll report fetched successfully:', { month });
    return successResponse(res, report, 'Payroll report retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payroll report:', error);
    next(error);
  }
};

const getHRMDashboard = async (req, res, next) => {
  try {
    logger.info('Fetching HR dashboard data');
    const { institutionId } = req.user;
    
    const db = mongoose.connection.db;
    
    // Get real counts from database
    const totalEmployees = await db.collection('users').countDocuments({ 
      institutionId,
      role: { $in: ['teacher', 'accountant', 'hr_manager', 'librarian', 'transport_manager', 'hostel_warden', 'staff_member', 'principal'] }
    });
    
    const activeEmployees = await db.collection('users').countDocuments({ 
      institutionId,
      role: { $in: ['teacher', 'accountant', 'hr_manager', 'librarian', 'transport_manager', 'hostel_warden', 'staff_member', 'principal'] },
      status: 'active'
    });
    
    const onLeave = await db.collection('leaves').countDocuments({ 
      institutionId,
      status: 'approved',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    const newJoinersCount = await db.collection('users').countDocuments({ 
      institutionId,
      joiningDate: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
    });
    
    // Get department distribution
    const departmentStats = await db.collection('departments').aggregate([
      { $match: { institutionId } },
      { $group: { _id: '$name', count: { $sum: 1 } } }
    ]).toArray();
    
    // Get recent leave requests
    const leaveRequests = await db.collection('leaves').find({ 
      institutionId 
    }).sort({ createdAt: -1 }).limit(5).toArray();
    
    // Get recent users
    const newJoiners = await db.collection('users').find({ 
      institutionId,
      joiningDate: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
    }).limit(5).toArray();
    
    const dashboardData = {
      hrOverviewStats: [
        { label: 'Total Employees', value: totalEmployees, change: '+0%', icon: 'ti ti-users', color: '#4CAF50' },
        { label: 'Active Employees', value: activeEmployees, change: '+0%', icon: 'ti ti-user-check', color: '#2E7D32' },
        { label: 'On Leave', value: onLeave, change: '+0%', icon: 'ti ti-calendar-off', color: '#FF9800' },
        { label: 'New Joiners (Month)', value: newJoinersCount, change: '+0%', icon: 'ti ti-user-plus', color: '#4CAF50' }
      ],
      headcountTrend: departmentStats.map((d, i) => ({ 
        month: d._id?.substring(0, 3) || 'Dept', 
        count: d.count 
      })),
      departmentWiseEmployees: departmentStats.map(d => ({
        department: d._id || 'Unknown',
        count: d.count
      })),
      leaveRequests: leaveRequests.map(l => ({
        id: l._id?.toString() || '1',
        employee: l.employeeName || 'Staff Member',
        type: l.leaveType || 'Casual Leave',
        days: l.days || 1,
        status: l.status || 'pending',
        date: l.startDate
      })),
      upcomingInterviews: [],
      newJoiners: newJoiners.map(nj => ({
        id: nj._id?.toString() || '1',
        name: nj.name || 'New Joiner',
        position: nj.designation || 'Staff',
        department: nj.department || 'General',
        joinDate: nj.joiningDate
      })),
      quickActions: [
        { id: '1', title: 'Manage Employees', description: `${totalEmployees} total employees`, icon: 'ti ti-users', color: '#28a745' },
        { id: '2', title: 'Leave Management', description: `${leaveRequests.length} leave requests`, icon: 'ti ti-calendar', color: '#007bff' },
        { id: '3', title: 'Departments', description: `${departmentStats.length} departments`, icon: 'ti ti-building', color: '#17a2b8' }
      ]
    };
    
    logger.info('HR dashboard data fetched successfully');
    return successResponse(res, dashboardData, 'HR dashboard data retrieved successfully');
  } catch (error) {
    logger.error('Error fetching HR dashboard:', error);
    return errorResponse(res, error.message || 'Failed to fetch HR dashboard data');
  }
};

const getStaffInstitution = async (req, res, next) => {
  try {
    const { userId, institutionId, institutionData } = req.user;
    
    if (!institutionId && !institutionData) {
      return errorResponse(res, 'No institution data found');
    }

    // Return institution data from user object
    const institution = institutionData || {
      _id: institutionId,
      name: 'Unknown Institution',
      instituteCode: 'N/A'
    };

    return successResponse(res, institution, 'Institution data retrieved successfully');
  } catch (error) {
    logger.error('Error fetching staff institution:', error);
    return errorResponse(res, error.message || 'Failed to fetch institution data');
  }
};

export default {
  createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff, searchStaff, getStaffByDepartment, updateSalary, addAttendance,
  createDepartment, getAllDepartments, getDepartmentById, updateDepartment, deleteDepartment,
  createDesignation, getAllDesignations, getDesignationById, updateDesignation, deleteDesignation,
  createLeave, getAllLeaves, getLeaveById, updateLeave, deleteLeave, approveLeave, rejectLeave, getPendingLeaves,
  getHRMStats, getLeaveBalance, getAttendanceSummary, getPayrollReport, getHRMDashboard, getStaffInstitution
};
