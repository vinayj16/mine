import subjectService from '../services/subjectService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_SUBJECT_TYPES = ['core', 'elective', 'optional', 'language', 'practical', 'theory', 'lab', 'other'];
const VALID_STATUSES = ['active', 'inactive', 'archived'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NAME_LENGTH = 100;
const MAX_CODE_LENGTH = 20;
const MAX_DESCRIPTION_LENGTH = 1000;
const MIN_CREDITS = 0;
const MAX_CREDITS = 20;

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

// Create subject
const createSubject = async (req, res) => {
  try {
    logger.info('Creating subject');
    
    // Get schoolId from params first, then body, then JWT
    let schoolId = req.params.schoolId || req.body.schoolId || req.body.institutionId;
    if (!schoolId) {
      schoolId = req.user?.institutionId || req.user?.institution;
    }
    
    const { name, code, type, department, credits, description, status } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!name || name.trim().length === 0) {
      errors.push('Subject name is required');
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push('Subject name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (!code || code.trim().length === 0) {
      errors.push('Subject code is required');
    } else if (code.length > MAX_CODE_LENGTH) {
      errors.push('Subject code must not exceed ' + MAX_CODE_LENGTH + ' characters');
    }
    
    if (type && !VALID_SUBJECT_TYPES.includes(type)) {
      errors.push('Invalid subject type. Must be one of: ' + VALID_SUBJECT_TYPES.join(', '));
    }
    
    // Allow non-ObjectId department (treat as department name)
    // if (department) {
    //   const departmentError = validateObjectId(department, 'Department ID');
    //   if (departmentError) errors.push(departmentError);
    // }
    
    if (credits !== undefined) {
      if (typeof credits !== 'number' || credits < MIN_CREDITS || credits > MAX_CREDITS) {
        errors.push('Credits must be between ' + MIN_CREDITS + ' and ' + MAX_CREDITS);
      }
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subject = await subjectService.createSubject(schoolId, req.body);
    
    logger.info('Subject created successfully:', { subjectId: subject._id, name });
    return createdResponse(res, subject, 'Subject created successfully');
  } catch (error) {
    logger.error('Error creating subject:', error);
    return errorResponse(res, error.message);
  }
};

// Get subjects
const getSubjects = async (req, res) => {
  try {
    logger.info('Fetching subjects');
    
    const { schoolId: paramSchoolId } = req.params;
    const { schoolId: querySchoolId, department, type, status, search, page, limit, sortBy, sortOrder } = req.query;
    
    // Use schoolId from params or query params
    const schoolId = paramSchoolId || querySchoolId;
    
    // Validation
    const errors = [];
    
    // Only validate schoolId if it's provided
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (department) {
      const departmentError = validateObjectId(department, 'Department ID');
      if (departmentError) errors.push(departmentError);
    }
    
    if (type && !VALID_SUBJECT_TYPES.includes(type)) {
      errors.push('Invalid subject type. Must be one of: ' + VALID_SUBJECT_TYPES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
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
    
    const filters = {};
    if (department) filters.department = department;
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (search) filters.search = search;
    
    const options = {
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'name',
      sortOrder: sortOrder || 'asc'
    };
    
    const result = await subjectService.getSubjects(schoolId, filters, options);
    
    logger.info('Subjects fetched successfully:', { count: result.subjects.length });
    return successResponse(res, {
      subjects: result.subjects,
      pagination: result.pagination
    }, 'Subjects retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subjects:', error);
    return errorResponse(res, error.message);
  }
};

// Get subject by ID
const getSubjectById = async (req, res) => {
  try {
    logger.info('Fetching subject by ID');
    
    const { schoolId, subjectId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const subjectIdError = validateObjectId(subjectId, 'Subject ID');
    if (subjectIdError) errors.push(subjectIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subject = await subjectService.getSubjectById(subjectId, schoolId);
    
    if (!subject) {
      return notFoundResponse(res, 'Subject not found');
    }
    
    logger.info('Subject fetched successfully:', { subjectId });
    return successResponse(res, subject, 'Subject retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subject:', error);
    return errorResponse(res, error.message);
  }
};

// Update subject
const updateSubject = async (req, res) => {
  try {
    logger.info('Updating subject');
    
    const { schoolId, subjectId } = req.params;
    const { name, code, type, department, credits, description, status } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const subjectIdError = validateObjectId(subjectId, 'Subject ID');
    if (subjectIdError) errors.push(subjectIdError);
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Subject name cannot be empty');
      } else if (name.length > MAX_NAME_LENGTH) {
        errors.push('Subject name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (code !== undefined) {
      if (!code || code.trim().length === 0) {
        errors.push('Subject code cannot be empty');
      } else if (code.length > MAX_CODE_LENGTH) {
        errors.push('Subject code must not exceed ' + MAX_CODE_LENGTH + ' characters');
      }
    }
    
    if (type !== undefined && !VALID_SUBJECT_TYPES.includes(type)) {
      errors.push('Invalid subject type. Must be one of: ' + VALID_SUBJECT_TYPES.join(', '));
    }
    
    if (department !== undefined && department !== null) {
      const departmentError = validateObjectId(department, 'Department ID');
      if (departmentError) errors.push(departmentError);
    }
    
    if (credits !== undefined) {
      if (typeof credits !== 'number' || credits < MIN_CREDITS || credits > MAX_CREDITS) {
        errors.push('Credits must be between ' + MIN_CREDITS + ' and ' + MAX_CREDITS);
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subject = await subjectService.updateSubject(subjectId, schoolId, req.body);
    
    if (!subject) {
      return notFoundResponse(res, 'Subject not found');
    }
    
    logger.info('Subject updated successfully:', { subjectId });
    return successResponse(res, subject, 'Subject updated successfully');
  } catch (error) {
    logger.error('Error updating subject:', error);
    return errorResponse(res, error.message);
  }
};

// Delete subject
const deleteSubject = async (req, res) => {
  try {
    logger.info('Deleting subject');
    
    const { schoolId, subjectId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const subjectIdError = validateObjectId(subjectId, 'Subject ID');
    if (subjectIdError) errors.push(subjectIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await subjectService.deleteSubject(subjectId, schoolId);
    
    if (!result) {
      return notFoundResponse(res, 'Subject not found');
    }
    
    logger.info('Subject deleted successfully:', { subjectId });
    return successResponse(res, null, 'Subject deleted successfully');
  } catch (error) {
    logger.error('Error deleting subject:', error);
    return errorResponse(res, error.message);
  }
};

// Get subjects by department
const getSubjectsByDepartment = async (req, res) => {
  try {
    logger.info('Fetching subjects by department');
    
    const { schoolId, department } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!department || department.trim().length === 0) {
      errors.push('Department is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subjects = await subjectService.getSubjectsByDepartment(schoolId, department);
    
    logger.info('Subjects fetched by department successfully:', { department, count: subjects.length });
    return successResponse(res, subjects, 'Subjects retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subjects by department:', error);
    return errorResponse(res, error.message);
  }
};

// Search subjects
const searchSubjects = async (req, res) => {
  try {
    logger.info('Searching subjects');
    
    const { schoolId } = req.params;
    const { q } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subjects = await subjectService.searchSubjects(schoolId, q);
    
    logger.info('Subjects searched successfully:', { query: q, count: subjects.length });
    return successResponse(res, subjects, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching subjects:', error);
    return errorResponse(res, error.message);
  }
};

// Get subjects by type
const getSubjectsByType = async (req, res) => {
  try {
    logger.info('Fetching subjects by type');
    
    const { schoolId, type } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!type) {
      errors.push('Subject type is required');
    } else if (!VALID_SUBJECT_TYPES.includes(type)) {
      errors.push('Invalid subject type. Must be one of: ' + VALID_SUBJECT_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subjects = await subjectService.getSubjectsByType(schoolId, type);
    
    logger.info('Subjects fetched by type successfully:', { type, count: subjects.length });
    return successResponse(res, subjects, 'Subjects retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subjects by type:', error);
    return errorResponse(res, error.message);
  }
};

// Get subjects by status
const getSubjectsByStatus = async (req, res) => {
  try {
    logger.info('Fetching subjects by status');
    
    const { schoolId, status } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subjects = await subjectService.getSubjectsByStatus(schoolId, status);
    
    logger.info('Subjects fetched by status successfully:', { status, count: subjects.length });
    return successResponse(res, subjects, 'Subjects retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subjects by status:', error);
    return errorResponse(res, error.message);
  }
};

// Update subject status
const updateSubjectStatus = async (req, res) => {
  try {
    logger.info('Updating subject status');
    
    const { schoolId, subjectId } = req.params;
    const { status } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const subjectIdError = validateObjectId(subjectId, 'Subject ID');
    if (subjectIdError) errors.push(subjectIdError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subject = await subjectService.updateSubject(subjectId, schoolId, { status });
    
    if (!subject) {
      return notFoundResponse(res, 'Subject not found');
    }
    
    logger.info('Subject status updated successfully:', { subjectId, status });
    return successResponse(res, subject, 'Subject status updated successfully');
  } catch (error) {
    logger.error('Error updating subject status:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update subjects
const bulkUpdateSubjects = async (req, res) => {
  try {
    logger.info('Bulk updating subjects');
    
    const { schoolId } = req.params;
    const { subjectIds, updates } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!subjectIds || !Array.isArray(subjectIds)) {
      errors.push('Subject IDs must be an array');
    } else if (subjectIds.length === 0) {
      errors.push('Subject IDs array cannot be empty');
    } else if (subjectIds.length > 100) {
      errors.push('Cannot update more than 100 subjects at once');
    } else {
      for (const id of subjectIds) {
        const idError = validateObjectId(id, 'Subject ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates must be an object');
    } else {
      if (updates.status !== undefined && !VALID_STATUSES.includes(updates.status)) {
        errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
      }
      if (updates.type !== undefined && !VALID_SUBJECT_TYPES.includes(updates.type)) {
        errors.push('Invalid subject type. Must be one of: ' + VALID_SUBJECT_TYPES.join(', '));
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await subjectService.bulkUpdateSubjects(schoolId, subjectIds, updates);
    
    logger.info('Subjects bulk updated successfully:', { count: result.modifiedCount });
    return successResponse(res, { modifiedCount: result.modifiedCount }, 'Subjects updated successfully');
  } catch (error) {
    logger.error('Error bulk updating subjects:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete subjects
const bulkDeleteSubjects = async (req, res) => {
  try {
    logger.info('Bulk deleting subjects');
    
    const { schoolId } = req.params;
    const { subjectIds } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!subjectIds || !Array.isArray(subjectIds)) {
      errors.push('Subject IDs must be an array');
    } else if (subjectIds.length === 0) {
      errors.push('Subject IDs array cannot be empty');
    } else if (subjectIds.length > 100) {
      errors.push('Cannot delete more than 100 subjects at once');
    } else {
      for (const id of subjectIds) {
        const idError = validateObjectId(id, 'Subject ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await subjectService.bulkDeleteSubjects(schoolId, subjectIds);
    
    logger.info('Subjects bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Subjects deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting subjects:', error);
    return errorResponse(res, error.message);
  }
};

// Get subject statistics
const getSubjectStatistics = async (req, res) => {
  try {
    logger.info('Fetching subject statistics');
    
    const { schoolId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await subjectService.getSubjectStatistics(schoolId);
    
    logger.info('Subject statistics fetched successfully');
    return successResponse(res, statistics, 'Subject statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subject statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Export subjects
const exportSubjects = async (req, res) => {
  try {
    logger.info('Exporting subjects');
    
    const { schoolId } = req.params;
    const { format, department, type, status } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (department) {
      const departmentError = validateObjectId(department, 'Department ID');
      if (departmentError) errors.push(departmentError);
    }
    
    if (type && !VALID_SUBJECT_TYPES.includes(type)) {
      errors.push('Invalid subject type. Must be one of: ' + VALID_SUBJECT_TYPES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await subjectService.exportSubjects(schoolId, {
      format: format.toLowerCase(),
      department,
      type,
      status
    });
    
    logger.info('Subjects exported successfully:', { format });
    return successResponse(res, exportData, 'Subjects exported successfully');
  } catch (error) {
    logger.error('Error exporting subjects:', error);
    return errorResponse(res, error.message);
  }
};

// Get active subjects
const getActiveSubjects = async (req, res) => {
  try {
    logger.info('Fetching active subjects');
    
    const { schoolId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subjects = await subjectService.getSubjectsByStatus(schoolId, 'active');
    
    logger.info('Active subjects fetched successfully:', { count: subjects.length });
    return successResponse(res, subjects, 'Active subjects retrieved successfully');
  } catch (error) {
    logger.error('Error fetching active subjects:', error);
    return errorResponse(res, error.message);
  }
};

// Archive subject
const archiveSubject = async (req, res) => {
  try {
    logger.info('Archiving subject');
    
    const { schoolId, subjectId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const subjectIdError = validateObjectId(subjectId, 'Subject ID');
    if (subjectIdError) errors.push(subjectIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subject = await subjectService.updateSubject(subjectId, schoolId, { status: 'archived' });
    
    if (!subject) {
      return notFoundResponse(res, 'Subject not found');
    }
    
    logger.info('Subject archived successfully:', { subjectId });
    return successResponse(res, subject, 'Subject archived successfully');
  } catch (error) {
    logger.error('Error archiving subject:', error);
    return errorResponse(res, error.message);
  }
};

// Restore archived subject
const restoreSubject = async (req, res) => {
  try {
    logger.info('Restoring archived subject');
    
    const { schoolId, subjectId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const subjectIdError = validateObjectId(subjectId, 'Subject ID');
    if (subjectIdError) errors.push(subjectIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subject = await subjectService.updateSubject(subjectId, schoolId, { status: 'active' });
    
    if (!subject) {
      return notFoundResponse(res, 'Subject not found');
    }
    
    logger.info('Subject restored successfully:', { subjectId });
    return successResponse(res, subject, 'Subject restored successfully');
  } catch (error) {
    logger.error('Error restoring subject:', error);
    return errorResponse(res, error.message);
  }
};

// Duplicate subject
const duplicateSubject = async (req, res) => {
  try {
    logger.info('Duplicating subject');
    
    const { schoolId, subjectId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const subjectIdError = validateObjectId(subjectId, 'Subject ID');
    if (subjectIdError) errors.push(subjectIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subject = await subjectService.duplicateSubject(subjectId, schoolId);
    
    if (!subject) {
      return notFoundResponse(res, 'Subject not found');
    }
    
    logger.info('Subject duplicated successfully:', { originalId: subjectId, newId: subject._id });
    return createdResponse(res, subject, 'Subject duplicated successfully');
  } catch (error) {
    logger.error('Error duplicating subject:', error);
    return errorResponse(res, error.message);
  }
};

// Get subject teachers
const getSubjectTeachers = async (req, res) => {
  try {
    logger.info('Fetching subject teachers');
    
    const { schoolId, subjectId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const subjectIdError = validateObjectId(subjectId, 'Subject ID');
    if (subjectIdError) errors.push(subjectIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const teachers = await subjectService.getSubjectTeachers(subjectId, schoolId);
    
    logger.info('Subject teachers fetched successfully:', { subjectId, count: teachers.length });
    return successResponse(res, teachers, 'Subject teachers retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subject teachers:', error);
    return errorResponse(res, error.message);
  }
};

// Get subject students
const getSubjectStudents = async (req, res) => {
  try {
    logger.info('Fetching subject students');
    
    const { schoolId, subjectId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const subjectIdError = validateObjectId(subjectId, 'Subject ID');
    if (subjectIdError) errors.push(subjectIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const students = await subjectService.getSubjectStudents(subjectId, schoolId);
    
    logger.info('Subject students fetched successfully:', { subjectId, count: students.length });
    return successResponse(res, students, 'Subject students retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subject students:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectsByDepartment,
  searchSubjects,
  getSubjectsByType,
  getSubjectsByStatus,
  updateSubjectStatus,
  bulkUpdateSubjects,
  bulkDeleteSubjects,
  getSubjectStatistics,
  exportSubjects,
  getActiveSubjects,
  archiveSubject,
  restoreSubject,
  duplicateSubject,
  getSubjectTeachers,
  getSubjectStudents
};
