import classService from '../services/classService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid class statuses
const VALID_STATUSES = ['active', 'inactive', 'archived', 'pending'];

// Valid academic years format
const ACADEMIC_YEAR_REGEX = /^\d{4}-\d{4}$/;

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
 * Validate academic year format
 */
const validateAcademicYear = (year) => {
  if (!year) return true;
  return ACADEMIC_YEAR_REGEX.test(year);
};

const createClass = async (req, res) => {
  try {
    console.log('[createClass] Body:', req.body);
    const { name, section, capacity, classTeacher, status } = req.body;
    console.log('[createClass] name:', name, 'section:', section);
    
    // Get institutionId from JWT token or body
    const institutionId = req.user?.institutionId || req.user?.institution || req.body.institutionId;
    console.log('[createClass] institutionId:', institutionId);
    let academicYear = req.body.academicYear;
    
    // Default to current academic year if not provided
    if (!academicYear) {
      const currentYear = new Date().getFullYear();
      academicYear = `${currentYear}-${currentYear + 1}`;
    }

// Validate required fields
    const errors = [];
    if (!name || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Class name is required and must be at least 2 characters' });
    }
    // Allow string institutionId (not just ObjectIds)
    if (!institutionId) {
      errors.push({ field: 'institutionId', message: 'Institution ID is required' });
    }
    if (capacity && (isNaN(capacity) || capacity < 1 || capacity > 500)) {
      errors.push({ field: 'capacity', message: 'Capacity must be between 1 and 500' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
}
    if (errors.length > 0) {
      console.log('[createClass] Validation errors:', errors);
      return validationErrorResponse(res, errors);
    }

    // Generate classId if not provided
    let classId = req.body.classId;
    if (!classId) {
      const currentYear = new Date().getFullYear();
      const year = currentYear.toString().slice(-2);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      classId = `CL${year}${random}`;
    }

    const classData = {
      ...req.body,
      classId,
      academicYear,
      institutionId: institutionId,
      institution: institutionId,
      // Fix: Only set classTeacher if it's a valid ObjectId, otherwise null
      classTeacher: req.body.classTeacher && req.body.classTeacher !== 'TBD' ? req.body.classTeacher : null,
      metadata: {
        createdBy: req.user?.id || 'system'
      }
    };

    logger.info(`Creating class: ${name} for institution ${institutionId}`);
    const newClass = await classService.createClass(classData);
    
    return createdResponse(res, newClass, 'Class created successfully');
  } catch (error) {
    logger.error('Error creating class:', error);
    return errorResponse(res, error.message, 400);
  }
};

const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const validation = validateObjectId(id, 'classId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Fetching class by ID: ' + id);
    const classDoc = await classService.getClassById(id);
    
    if (!classDoc) {
      return notFoundResponse(res, 'Class not found');
    }

    return successResponse(res, classDoc, 'Class fetched successfully');
  } catch (error) {
    logger.error('Error fetching class by ID:', error);
    return errorResponse(res, 'Failed to fetch class', 500);
  }
};

const getClassByClassId = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!classId || classId.trim().length === 0) {
      return validationErrorResponse(res, [{ field: 'classId', message: 'Class ID is required' }]);
    }

    logger.info('Fetching class by classId: ' + classId);
    const classDoc = await classService.getClassByClassId(classId);
    
    if (!classDoc) {
      return notFoundResponse(res, 'Class not found');
    }

    return successResponse(res, classDoc, 'Class fetched successfully');
  } catch (error) {
    logger.error('Error fetching class by classId:', error);
    return errorResponse(res, 'Failed to fetch class', 500);
  }
};

const getAllClasses = async (req, res) => {
  try {
    const { name, section, status, academicYear, institutionId: queryInstitutionId, institutionCode: queryInstitutionCode, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Get institutionId from JWT token if not provided in query
    const userInstitutionId = req.user?.institution || req.user?.institutionId;
    const institutionId = queryInstitutionId || userInstitutionId;
    const institutionCode = queryInstitutionCode || req.user?.institutionCode;
    
    console.log('[getAllClasses] Query institutionId:', queryInstitutionId);
    console.log('[getAllClasses] User institutionId:', userInstitutionId);
    console.log('[getAllClasses] Using institutionId:', institutionId);

    // Validate pagination
    const errors = [];
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({ field: 'page', message: 'Page must be a positive integer' });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 1000' });
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    // Validate academicYear if provided
    if (academicYear && !validateAcademicYear(academicYear)) {
      errors.push({ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' });
    }

    // Validate institutionId if provided (only for valid ObjectIds)
    if (institutionId && institutionId.match(/^[0-9a-fA-F]{24}$/)) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    // Validate sortOrder
    if (!['asc', 'desc'].includes(sortOrder)) {
      errors.push({ field: 'sortOrder', message: 'Sort order must be asc or desc' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = { name, section, status, academicYear, institutionId, institutionCode, search };
    const options = { page: pageNum, limit: limitNum, sortBy, sortOrder };

    logger.info('Fetching all classes with filters', { institutionId, institutionCode, userInstitutionId });
    const result = await classService.getAllClasses(filters, options);
    
    return successResponse(res, {
      data: result.classes,
      meta: result.pagination
    }, 'Classes fetched successfully');
  } catch (error) {
    logger.error('Error fetching all classes:', error);
    return errorResponse(res, 'Failed to fetch classes', 500);
  }
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, section, capacity, academicYear, status, classTeacher } = req.body;

    // Validate ID
    const errors = [];
    const validation = validateObjectId(id, 'classId');
    if (!validation.valid) {
      errors.push(validation.error);
    }

    // Validate fields if provided
    if (name && name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Class name must be at least 2 characters' });
    }
    if (academicYear && !validateAcademicYear(academicYear)) {
      errors.push({ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' });
    }
    if (capacity && (isNaN(capacity) || capacity < 1 || capacity > 500)) {
      errors.push({ field: 'capacity', message: 'Capacity must be between 1 and 500' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }
    if (classTeacher) {
      const teacherValidation = validateObjectId(classTeacher, 'classTeacher');
      if (!teacherValidation.valid) {
        errors.push(teacherValidation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const updateData = {
      ...req.body,
      'metadata.updatedBy': req.user?.id || 'system'
    };

    logger.info('Updating class: ' + id);
    const updatedClass = await classService.updateClass(id, updateData);
    
    if (!updatedClass) {
      return notFoundResponse(res, 'Class not found');
    }

    return successResponse(res, updatedClass, 'Class updated successfully');
  } catch (error) {
    logger.error('Error updating class:', error);
    return errorResponse(res, error.message, 400);
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const validation = validateObjectId(id, 'classId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Deleting class: ' + id);
    const result = await classService.deleteClass(id);
    
    if (!result) {
      return notFoundResponse(res, 'Class not found');
    }

    return successResponse(res, null, 'Class deleted successfully');
  } catch (error) {
    logger.error('Error deleting class:', error);
    return errorResponse(res, error.message, 400);
  }
};

const getClassesByInstitution = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { academicYear } = req.query;

    // Validate institutionId
    const errors = [];
    const validation = validateObjectId(institutionId, 'institutionId');
    if (!validation.valid) {
      errors.push(validation.error);
    }

    // Validate academicYear if provided
    if (academicYear && !validateAcademicYear(academicYear)) {
      errors.push({ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching classes for institution: ' + institutionId);
    const classes = await classService.getClassesByInstitution(institutionId, academicYear);
    
    return successResponse(res, classes, 'Classes fetched successfully', {
      institutionId,
      academicYear: academicYear || 'all'
    });
  } catch (error) {
    logger.error('Error fetching classes by institution:', error);
    return errorResponse(res, 'Failed to fetch classes', 500);
  }
};

const getClassesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { institutionId } = req.query;

    // Validate status
    const errors = [];
    if (!VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching classes by status: ' + status);
    const classes = await classService.getClassesByStatus(status, institutionId);
    
    return successResponse(res, classes, 'Classes fetched successfully', {
      status,
      institutionId: institutionId || 'all'
    });
  } catch (error) {
    logger.error('Error fetching classes by status:', error);
    return errorResponse(res, 'Failed to fetch classes', 500);
  }
};

const getClassStatistics = async (req, res) => {
  try {
    const { institutionId, academicYear } = req.query;

    // Validate institutionId if provided
    const errors = [];
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
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

    logger.info('Fetching class statistics');
    const statistics = await classService.getClassStatistics(institutionId, academicYear);

    return successResponse(res, statistics, 'Class statistics fetched successfully', {
      institutionId: institutionId || 'all',
      academicYear: academicYear || 'all'
    });
  } catch (error) {
    logger.error('Error fetching class statistics:', error);
    return errorResponse(res, 'Failed to fetch statistics', 500);
  }
};

const updateStudentCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { count } = req.body;

    // Validate ID and count
    const errors = [];
    const validation = validateObjectId(id, 'classId');
    if (!validation.valid) {
      errors.push(validation.error);
    }
    if (count === undefined || count === null) {
      errors.push({ field: 'count', message: 'Student count is required' });
    } else if (isNaN(count) || count < 0 || count > 1000) {
      errors.push({ field: 'count', message: 'Student count must be between 0 and 1000' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Updating student count for class: ' + id);
    const updatedClass = await classService.updateStudentCount(id, count);

    if (!updatedClass) {
      return notFoundResponse(res, 'Class not found');
    }

    return successResponse(res, updatedClass, 'Student count updated successfully');
  } catch (error) {
    logger.error('Error updating student count:', error);
    return errorResponse(res, error.message, 400);
  }
};

const updateSubjectCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { count } = req.body;

    // Validate ID and count
    const errors = [];
    const validation = validateObjectId(id, 'classId');
    if (!validation.valid) {
      errors.push(validation.error);
    }
    if (count === undefined || count === null) {
      errors.push({ field: 'count', message: 'Subject count is required' });
    } else if (isNaN(count) || count < 0 || count > 50) {
      errors.push({ field: 'count', message: 'Subject count must be between 0 and 50' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Updating subject count for class: ' + id);
    const updatedClass = await classService.updateSubjectCount(id, count);

    if (!updatedClass) {
      return notFoundResponse(res, 'Class not found');
    }

    return successResponse(res, updatedClass, 'Subject count updated successfully');
  } catch (error) {
    logger.error('Error updating subject count:', error);
    return errorResponse(res, error.message, 400);
  }
};

const assignClassTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;
    const userId = req.user?.id || 'system';

    // Validate IDs
    const errors = [];
    const classValidation = validateObjectId(id, 'classId');
    if (!classValidation.valid) {
      errors.push(classValidation.error);
    }
    if (!teacherId) {
      errors.push({ field: 'teacherId', message: 'Teacher ID is required' });
    } else {
      const teacherValidation = validateObjectId(teacherId, 'teacherId');
      if (!teacherValidation.valid) {
        errors.push(teacherValidation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Assigning teacher ' + teacherId + ' to class ' + id);
    const updatedClass = await classService.assignClassTeacher(id, teacherId, userId);
    
    if (!updatedClass) {
      return notFoundResponse(res, 'Class not found');
    }

    return successResponse(res, updatedClass, 'Class teacher assigned successfully');
  } catch (error) {
    logger.error('Error assigning class teacher:', error);
    return errorResponse(res, error.message, 400);
  }
};

const getClassesByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Validate teacherId
    const validation = validateObjectId(teacherId, 'teacherId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Fetching classes for teacher: ' + teacherId);
    const classes = await classService.getClassesByTeacher(teacherId);

    return successResponse(res, classes, 'Classes fetched successfully', {
      teacherId
    });
  } catch (error) {
    logger.error('Error fetching classes by teacher:', error);
    return errorResponse(res, 'Failed to fetch classes', 500);
  }
};

const bulkUpdateStatus = async (req, res) => {
  try {
    const { classIds, status } = req.body;
    const userId = req.user?.id || 'system';

    // Validate classIds
    const errors = [];
    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      errors.push({ field: 'classIds', message: 'classIds must be a non-empty array' });
    } else if (classIds.length > 100) {
      errors.push({ field: 'classIds', message: 'Maximum 100 classes allowed per request' });
    } else {
      classIds.forEach((id, index) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ field: 'classIds[' + index + ']', message: 'Invalid class ID' });
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

    logger.info('Bulk updating status for ' + classIds.length + ' classes');
    const result = await classService.bulkUpdateStatus(classIds, status, userId);
    
    return successResponse(res, result, classIds.length + ' classes status updated successfully');
  } catch (error) {
    logger.error('Error bulk updating status:', error);
    return errorResponse(res, error.message, 400);
  }
};

const searchClasses = async (req, res) => {
  try {
    const { q, institutionId } = req.query;

    // Validate search query
    const errors = [];
    if (!q || q.trim().length === 0) {
      errors.push({ field: 'q', message: 'Search query is required' });
    } else if (q.trim().length < 2) {
      errors.push({ field: 'q', message: 'Search query must be at least 2 characters' });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Searching classes with query: ' + q);
    const classes = await classService.searchClasses(q, institutionId);
    
    return successResponse(res, classes, 'Search completed successfully', {
      query: q,
      resultCount: classes.length
    });
  } catch (error) {
    logger.error('Error searching classes:', error);
    return errorResponse(res, 'Failed to search classes', 500);
  }
};

/**
 * Export classes data
 */
const exportClasses = async (req, res) => {
  try {
    const { format = 'json', institutionId, academicYear, status } = req.query;

    // Validate format
    const validFormats = ['json', 'csv', 'xlsx', 'pdf'];
    const errors = [];
    if (!validFormats.includes(format)) {
      errors.push({ field: 'format', message: 'Format must be one of: ' + validFormats.join(', ') });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
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

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Exporting classes data in format: ' + format);
    const data = await classService.exportClasses({ institutionId, academicYear, status, format });

    if (format === 'json') {
      return successResponse(res, data, 'Classes exported successfully', {
        format,
        recordCount: data.length
      });
    }

    return errorResponse(res, 'Export format ' + format + ' not yet implemented', 501);
  } catch (error) {
    logger.error('Error exporting classes:', error);
    return errorResponse(res, 'Failed to export classes', 500);
  }
};

/**
 * Get class analytics
 */
const getClassAnalytics = async (req, res) => {
  try {
    const { institutionId, academicYear, groupBy = 'status' } = req.query;

    // Validate groupBy
    const validGroupBy = ['status', 'academicYear', 'institution', 'capacity'];
    const errors = [];
    if (!validGroupBy.includes(groupBy)) {
      errors.push({ field: 'groupBy', message: 'groupBy must be one of: ' + validGroupBy.join(', ') });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
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

    logger.info('Fetching class analytics grouped by: ' + groupBy);
    const analytics = await classService.getClassAnalytics({ institutionId, academicYear, groupBy });

    return successResponse(res, analytics, 'Class analytics fetched successfully', {
      groupBy,
      filters: { institutionId, academicYear }
    });
  } catch (error) {
    logger.error('Error fetching class analytics:', error);
    return errorResponse(res, 'Failed to fetch analytics', 500);
  }
};

/**
 * Get class capacity report
 */
const getClassCapacityReport = async (req, res) => {
  try {
    const { institutionId, academicYear, threshold = 80 } = req.query;

    // Validate threshold
    const errors = [];
    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum) || thresholdNum < 0 || thresholdNum > 100) {
      errors.push({ field: 'threshold', message: 'Threshold must be between 0 and 100' });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
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

    logger.info('Generating class capacity report with threshold: ' + thresholdNum + '%');
    const report = await classService.getClassCapacityReport({ institutionId, academicYear, threshold: thresholdNum });

    return successResponse(res, report, 'Class capacity report generated successfully', {
      threshold: thresholdNum,
      filters: { institutionId, academicYear }
    });
  } catch (error) {
    logger.error('Error generating capacity report:', error);
    return errorResponse(res, 'Failed to generate capacity report', 500);
  }
};

/**
 * Bulk assign teachers to classes
 */
const bulkAssignTeachers = async (req, res) => {
  try {
    const { assignments } = req.body;
    const userId = req.user?.id || 'system';

    // Validate assignments
    const errors = [];
    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      errors.push({ field: 'assignments', message: 'assignments must be a non-empty array' });
    } else if (assignments.length > 100) {
      errors.push({ field: 'assignments', message: 'Maximum 100 assignments allowed per request' });
    } else {
      assignments.forEach((assignment, index) => {
        if (!assignment.classId || !mongoose.Types.ObjectId.isValid(assignment.classId)) {
          errors.push({ field: 'assignments[' + index + '].classId', message: 'Invalid class ID' });
        }
        if (!assignment.teacherId || !mongoose.Types.ObjectId.isValid(assignment.teacherId)) {
          errors.push({ field: 'assignments[' + index + '].teacherId', message: 'Invalid teacher ID' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Bulk assigning teachers to ' + assignments.length + ' classes');
    const result = await classService.bulkAssignTeachers(assignments, userId);

    return successResponse(res, result, result.successful + ' teachers assigned successfully');
  } catch (error) {
    logger.error('Error bulk assigning teachers:', error);
    return errorResponse(res, 'Failed to bulk assign teachers', 500);
  }
};

/**
 * Bulk delete classes
 */
const bulkDeleteClasses = async (req, res) => {
  try {
    const { classIds } = req.body;

    // Validate classIds
    const errors = [];
    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      errors.push({ field: 'classIds', message: 'classIds must be a non-empty array' });
    } else if (classIds.length > 100) {
      errors.push({ field: 'classIds', message: 'Maximum 100 classes allowed per request' });
    } else {
      classIds.forEach((id, index) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ field: 'classIds[' + index + ']', message: 'Invalid class ID' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Bulk deleting ' + classIds.length + ' classes');
    const result = await classService.bulkDeleteClasses(classIds);

    return successResponse(res, result, result.deletedCount + ' classes deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting classes:', error);
    return errorResponse(res, 'Failed to bulk delete classes', 500);
  }
};

/**
 * Get classes by academic year
 */
const getClassesByAcademicYear = async (req, res) => {
  try {
    const { academicYear } = req.params;
    const { institutionId, status, page = 1, limit = 20 } = req.query;

    // Validate academicYear
    const errors = [];
    if (!validateAcademicYear(academicYear)) {
      errors.push({ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
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

    logger.info('Fetching classes for academic year: ' + academicYear);
    const result = await classService.getClassesByAcademicYear(academicYear, { institutionId, status, page: pageNum, limit: limitNum });

    return successResponse(res, result.classes, 'Classes fetched successfully', {
      pagination: result.pagination,
      academicYear
    });
  } catch (error) {
    logger.error('Error fetching classes by academic year:', error);
    return errorResponse(res, 'Failed to fetch classes', 500);
  }
};

/**
 * Get class enrollment trends
 */
const getClassEnrollmentTrends = async (req, res) => {
  try {
    const { institutionId, startYear, endYear } = req.query;

    // Validate years
    const errors = [];
    if (startYear && !validateAcademicYear(startYear)) {
      errors.push({ field: 'startYear', message: 'Start year must be in format YYYY-YYYY' });
    }
    if (endYear && !validateAcademicYear(endYear)) {
      errors.push({ field: 'endYear', message: 'End year must be in format YYYY-YYYY' });
    }

    // Validate institutionId if provided
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching class enrollment trends');
    const trends = await classService.getClassEnrollmentTrends({ institutionId, startYear, endYear });

    return successResponse(res, trends, 'Enrollment trends fetched successfully', {
      filters: { institutionId, startYear, endYear }
    });
  } catch (error) {
    logger.error('Error fetching enrollment trends:', error);
    return errorResponse(res, 'Failed to fetch enrollment trends', 500);
  }
};


export default {
  createClass,
  getClassById,
  getClassByClassId,
  getAllClasses,
  updateClass,
  deleteClass,
  getClassesByInstitution,
  getClassesByStatus,
  getClassStatistics,
  updateStudentCount,
  updateSubjectCount,
  assignClassTeacher,
  getClassesByTeacher,
  bulkUpdateStatus,
  searchClasses,
  exportClasses,
  getClassAnalytics,
  getClassCapacityReport,
  bulkAssignTeachers,
  bulkDeleteClasses,
  getClassesByAcademicYear,
  getClassEnrollmentTrends
};
