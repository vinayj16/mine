import homeWorkService from '../services/homeWorkService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['pending', 'submitted', 'graded', 'overdue', 'draft', 'published'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_SUBMISSION_STATUSES = ['not_submitted', 'submitted', 'late', 'graded', 'resubmit'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
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

const createHomeWork = async (req, res, next) => {
  try {
    logger.info('Creating homework');
    
    const { schoolId } = req.params;
    const { title, description, classId, subjectId, teacherId, dueDate, assignedDate, maxMarks, attachments, priority, status } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > 200) {
      errors.push('Title must not exceed 200 characters');
    }
    
    if (description && description.length > 2000) {
      errors.push('Description must not exceed 2000 characters');
    }
    
    const classIdError = validateObjectId(classId, 'Class ID');
    if (classIdError) errors.push(classIdError);
    
    const subjectIdError = validateObjectId(subjectId, 'Subject ID');
    if (subjectIdError) errors.push(subjectIdError);
    
    if (teacherId) {
      const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
      if (teacherIdError) errors.push(teacherIdError);
    }
    
    const dueDateError = validateDate(dueDate, 'Due date');
    if (dueDateError) errors.push(dueDateError);
    
    if (assignedDate) {
      const assignedDateError = validateDate(assignedDate, 'Assigned date');
      if (assignedDateError) {
        errors.push(assignedDateError);
      } else if (dueDate) {
        const rangeError = validateDateRange(assignedDate, dueDate);
        if (rangeError) errors.push(rangeError);
      }
    }
    
    if (maxMarks !== undefined) {
      const maxMarksNum = parseFloat(maxMarks);
      if (isNaN(maxMarksNum) || maxMarksNum < 0) {
        errors.push('Max marks must be a non-negative number');
      } else if (maxMarksNum > 1000) {
        errors.push('Max marks must not exceed 1000');
      }
    }
    
    if (attachments && Array.isArray(attachments)) {
      if (attachments.length > 10) {
        errors.push('Cannot attach more than 10 files');
      }
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const homeWork = await homeWorkService.createHomeWork(schoolId, req.body);
    
    logger.info('Homework created successfully:', { homeWorkId: homeWork._id });
    return createdResponse(res, homeWork, 'Homework created successfully');
  } catch (error) {
    logger.error('Error creating homework:', error);
    next(error);
  }
};

const getHomeWorks = async (req, res, next) => {
  try {
    logger.info('Fetching all homework');
    
    const { schoolId } = req.params;
    const { classId, subjectId, teacherId, status, priority, page, limit, sortBy, sortOrder, search, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (subjectId) {
      const subjectIdError = validateObjectId(subjectId, 'Subject ID');
      if (subjectIdError) errors.push(subjectIdError);
    }
    
    if (teacherId) {
      const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
      if (teacherIdError) errors.push(teacherIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
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
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: asc, desc, ascending, descending, 1, -1');
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = {};
    if (classId) filters.classId = classId;
    if (subjectId) filters.subjectId = subjectId;
    if (teacherId) filters.teacherId = teacherId;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (search) filters.search = search;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const options = {
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };
    
    const result = await homeWorkService.getHomeWorks(schoolId, filters, options);
    
    logger.info('Homework fetched successfully');
    return successResponse(res, result, 'Homework retrieved successfully');
  } catch (error) {
    logger.error('Error fetching homework:', error);
    next(error);
  }
};

const getHomeWorkById = async (req, res, next) => {
  try {
    logger.info('Fetching homework by ID');
    
    const { schoolId, homeWorkId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const homeWorkIdError = validateObjectId(homeWorkId, 'Homework ID');
    if (homeWorkIdError) errors.push(homeWorkIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const homeWork = await homeWorkService.getHomeWorkById(homeWorkId, schoolId);
    
    if (!homeWork) {
      return notFoundResponse(res, 'Homework not found');
    }
    
    logger.info('Homework fetched successfully:', { homeWorkId });
    return successResponse(res, homeWork, 'Homework retrieved successfully');
  } catch (error) {
    logger.error('Error fetching homework:', error);
    next(error);
  }
};

const updateHomeWork = async (req, res, next) => {
  try {
    logger.info('Updating homework');
    
    const { schoolId, homeWorkId } = req.params;
    const { title, description, dueDate, assignedDate, maxMarks, priority, status } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const homeWorkIdError = validateObjectId(homeWorkId, 'Homework ID');
    if (homeWorkIdError) errors.push(homeWorkIdError);
    
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        errors.push('Title cannot be empty');
      } else if (title.length > 200) {
        errors.push('Title must not exceed 200 characters');
      }
    }
    
    if (description !== undefined && description.length > 2000) {
      errors.push('Description must not exceed 2000 characters');
    }
    
    if (dueDate !== undefined) {
      const dueDateError = validateDate(dueDate, 'Due date');
      if (dueDateError) errors.push(dueDateError);
    }
    
    if (assignedDate !== undefined) {
      const assignedDateError = validateDate(assignedDate, 'Assigned date');
      if (assignedDateError) {
        errors.push(assignedDateError);
      } else if (dueDate) {
        const rangeError = validateDateRange(assignedDate, dueDate);
        if (rangeError) errors.push(rangeError);
      }
    }
    
    if (maxMarks !== undefined) {
      const maxMarksNum = parseFloat(maxMarks);
      if (isNaN(maxMarksNum) || maxMarksNum < 0) {
        errors.push('Max marks must be a non-negative number');
      } else if (maxMarksNum > 1000) {
        errors.push('Max marks must not exceed 1000');
      }
    }
    
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const homeWork = await homeWorkService.updateHomeWork(homeWorkId, schoolId, req.body);
    
    if (!homeWork) {
      return notFoundResponse(res, 'Homework not found');
    }
    
    logger.info('Homework updated successfully:', { homeWorkId });
    return successResponse(res, homeWork, 'Homework updated successfully');
  } catch (error) {
    logger.error('Error updating homework:', error);
    next(error);
  }
};

const deleteHomeWork = async (req, res, next) => {
  try {
    logger.info('Deleting homework');
    
    const { schoolId, homeWorkId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const homeWorkIdError = validateObjectId(homeWorkId, 'Homework ID');
    if (homeWorkIdError) errors.push(homeWorkIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const homeWork = await homeWorkService.deleteHomeWork(homeWorkId, schoolId);
    
    if (!homeWork) {
      return notFoundResponse(res, 'Homework not found');
    }
    
    logger.info('Homework deleted successfully:', { homeWorkId });
    return successResponse(res, null, 'Homework deleted successfully');
  } catch (error) {
    logger.error('Error deleting homework:', error);
    next(error);
  }
};

const getHomeWorksByClass = async (req, res, next) => {
  try {
    logger.info('Fetching homework by class');
    
    const { schoolId, classId } = req.params;
    const { page, limit, status } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const classIdError = validateObjectId(classId, 'Class ID');
    if (classIdError) errors.push(classIdError);
    
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
    
    const homeWorks = await homeWorkService.getHomeWorksByClass(schoolId, classId, { page: pageNum, limit: limitNum, status });
    
    logger.info('Homework fetched successfully for class:', { classId });
    return successResponse(res, homeWorks, 'Homework retrieved successfully');
  } catch (error) {
    logger.error('Error fetching homework by class:', error);
    next(error);
  }
};

const getHomeWorksByTeacher = async (req, res, next) => {
  try {
    logger.info('Fetching homework by teacher');
    
    const { schoolId, teacherId } = req.params;
    const { page, limit, status } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
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
    
    const homeWorks = await homeWorkService.getHomeWorksByTeacher(schoolId, teacherId, { page: pageNum, limit: limitNum, status });
    
    logger.info('Homework fetched successfully for teacher:', { teacherId });
    return successResponse(res, homeWorks, 'Homework retrieved successfully');
  } catch (error) {
    logger.error('Error fetching homework by teacher:', error);
    next(error);
  }
};

const getHomeWorksBySubject = async (req, res, next) => {
  try {
    logger.info('Fetching homework by subject');
    
    const { schoolId, subjectId } = req.params;
    const { page, limit, status } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const subjectIdError = validateObjectId(subjectId, 'Subject ID');
    if (subjectIdError) errors.push(subjectIdError);
    
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
    
    const homeWorks = await homeWorkService.getHomeWorksBySubject(schoolId, subjectId, { page: pageNum, limit: limitNum, status });
    
    logger.info('Homework fetched successfully for subject:', { subjectId });
    return successResponse(res, homeWorks, 'Homework retrieved successfully');
  } catch (error) {
    logger.error('Error fetching homework by subject:', error);
    next(error);
  }
};

const getPendingHomeWorks = async (req, res, next) => {
  try {
    logger.info('Fetching pending homework');
    
    const { schoolId } = req.params;
    const { classId, studentId, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
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
    
    const homeWorks = await homeWorkService.getPendingHomeWorks(schoolId, { classId, studentId, page: pageNum, limit: limitNum });
    
    logger.info('Pending homework fetched successfully');
    return successResponse(res, homeWorks, 'Pending homework retrieved successfully');
  } catch (error) {
    logger.error('Error fetching pending homework:', error);
    next(error);
  }
};

const submitHomeWork = async (req, res, next) => {
  try {
    logger.info('Submitting homework');
    
    const { schoolId, homeWorkId } = req.params;
    const { studentId, submissionText, attachments, submittedAt } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const homeWorkIdError = validateObjectId(homeWorkId, 'Homework ID');
    if (homeWorkIdError) errors.push(homeWorkIdError);
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (!submissionText || submissionText.trim().length === 0) {
      errors.push('Submission text is required');
    } else if (submissionText.length > 5000) {
      errors.push('Submission text must not exceed 5000 characters');
    }
    
    if (attachments && Array.isArray(attachments)) {
      if (attachments.length > 10) {
        errors.push('Cannot attach more than 10 files');
      }
    }
    
    if (submittedAt) {
      const submittedAtError = validateDate(submittedAt, 'Submitted at');
      if (submittedAtError) errors.push(submittedAtError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const { studentId: sid, ...submissionData } = req.body;
    const homeWork = await homeWorkService.submitHomeWork(homeWorkId, schoolId, studentId, submissionData);
    
    if (!homeWork) {
      return notFoundResponse(res, 'Homework not found');
    }
    
    logger.info('Homework submitted successfully:', { homeWorkId, studentId });
    return successResponse(res, homeWork, 'Homework submitted successfully');
  } catch (error) {
    logger.error('Error submitting homework:', error);
    next(error);
  }
};

const gradeSubmission = async (req, res, next) => {
  try {
    logger.info('Grading homework submission');
    
    const { schoolId, homeWorkId } = req.params;
    const { studentId, marks, feedback, gradedBy } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const homeWorkIdError = validateObjectId(homeWorkId, 'Homework ID');
    if (homeWorkIdError) errors.push(homeWorkIdError);
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (marks === undefined || marks === null) {
      errors.push('Marks is required');
    } else {
      const marksNum = parseFloat(marks);
      if (isNaN(marksNum) || marksNum < 0) {
        errors.push('Marks must be a non-negative number');
      } else if (marksNum > 1000) {
        errors.push('Marks must not exceed 1000');
      }
    }
    
    if (feedback && feedback.length > 2000) {
      errors.push('Feedback must not exceed 2000 characters');
    }
    
    if (gradedBy) {
      const gradedByError = validateObjectId(gradedBy, 'Graded by');
      if (gradedByError) errors.push(gradedByError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const { studentId: sid, ...gradeData } = req.body;
    const homeWork = await homeWorkService.gradeSubmission(homeWorkId, schoolId, studentId, gradeData);
    
    if (!homeWork) {
      return notFoundResponse(res, 'Homework or submission not found');
    }
    
    logger.info('Submission graded successfully:', { homeWorkId, studentId });
    return successResponse(res, homeWork, 'Submission graded successfully');
  } catch (error) {
    logger.error('Error grading submission:', error);
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    logger.info('Fetching homework analytics');
    
    const { schoolId } = req.params;
    const { classId, teacherId, subjectId, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (teacherId) {
      const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
      if (teacherIdError) errors.push(teacherIdError);
    }
    
    if (subjectId) {
      const subjectIdError = validateObjectId(subjectId, 'Subject ID');
      if (subjectIdError) errors.push(subjectIdError);
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
    
    const analytics = await homeWorkService.getAnalytics(schoolId, { classId, teacherId, subjectId, startDate, endDate });
    
    logger.info('Homework analytics fetched successfully');
    return successResponse(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching homework analytics:', error);
    next(error);
  }
};

const getOverdueHomeWorks = async (req, res, next) => {
  try {
    logger.info('Fetching overdue homework');
    
    const { schoolId } = req.params;
    const { classId, studentId, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
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
    
    const homeWorks = await homeWorkService.getOverdueHomeWorks(schoolId, { classId, studentId, page: pageNum, limit: limitNum });
    
    logger.info('Overdue homework fetched successfully');
    return successResponse(res, homeWorks, 'Overdue homework retrieved successfully');
  } catch (error) {
    logger.error('Error fetching overdue homework:', error);
    next(error);
  }
};

const bulkDeleteHomeWorks = async (req, res, next) => {
  try {
    logger.info('Bulk deleting homework');
    
    const { schoolId } = req.params;
    const { homeWorkIds } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!homeWorkIds || !Array.isArray(homeWorkIds) || homeWorkIds.length === 0) {
      errors.push('Homework IDs array is required and must not be empty');
    } else {
      if (homeWorkIds.length > 100) {
        errors.push('Cannot delete more than 100 homework at once');
      }
      
      for (let i = 0; i < Math.min(homeWorkIds.length, 10); i++) {
        const idError = validateObjectId(homeWorkIds[i], 'Homework ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await homeWorkService.bulkDeleteHomeWorks(schoolId, homeWorkIds);
    
    logger.info('Homework deleted successfully:', { count: result.deletedCount });
    return successResponse(res, result, 'Homework deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting homework:', error);
    next(error);
  }
};

const exportHomeWorks = async (req, res, next) => {
  try {
    logger.info('Exporting homework');
    
    const { schoolId } = req.params;
    const { format, classId, subjectId, status, startDate, endDate } = req.query;
    
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
    
    if (subjectId) {
      const subjectIdError = validateObjectId(subjectId, 'Subject ID');
      if (subjectIdError) errors.push(subjectIdError);
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
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await homeWorkService.exportHomeWorks(schoolId, format.toLowerCase(), { classId, subjectId, status, startDate, endDate });
    
    logger.info('Homework exported successfully:', { format });
    return successResponse(res, exportData, 'Homework exported successfully');
  } catch (error) {
    logger.error('Error exporting homework:', error);
    next(error);
  }
};

const getSubmissionsByStudent = async (req, res, next) => {
  try {
    logger.info('Fetching submissions by student');
    
    const { schoolId, studentId } = req.params;
    const { status, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (status && !VALID_SUBMISSION_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_SUBMISSION_STATUSES.join(', '));
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
    
    const submissions = await homeWorkService.getSubmissionsByStudent(schoolId, studentId, { status, page: pageNum, limit: limitNum });
    
    logger.info('Submissions fetched successfully for student:', { studentId });
    return successResponse(res, submissions, 'Submissions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching submissions by student:', error);
    next(error);
  }
};

const getSubmissionStatistics = async (req, res, next) => {
  try {
    logger.info('Fetching submission statistics');
    
    const { schoolId, homeWorkId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const homeWorkIdError = validateObjectId(homeWorkId, 'Homework ID');
    if (homeWorkIdError) errors.push(homeWorkIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await homeWorkService.getSubmissionStatistics(schoolId, homeWorkId);
    
    logger.info('Submission statistics fetched successfully:', { homeWorkId });
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching submission statistics:', error);
    next(error);
  }
};


export default {
  createHomeWork,
  getHomeWorks,
  getHomeWorkById,
  updateHomeWork,
  deleteHomeWork,
  getHomeWorksByClass,
  getHomeWorksByTeacher,
  getHomeWorksBySubject,
  getPendingHomeWorks,
  submitHomeWork,
  gradeSubmission,
  getAnalytics,
  getOverdueHomeWorks,
  bulkDeleteHomeWorks,
  exportHomeWorks,
  getSubmissionsByStudent,
  getSubmissionStatistics
};
