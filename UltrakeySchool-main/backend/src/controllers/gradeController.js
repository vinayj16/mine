import gradeService from '../services/gradeService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'archived'];
const VALID_SORT_ORDERS = ['asc', 'desc', 'ascending', 'descending', '1', '-1'];
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

// Helper function to validate academic year format (YYYY-YYYY)
const validateAcademicYear = (year) => {
  if (!year) return null;
  const yearRegex = /^\d{4}-\d{4}$/;
  if (!yearRegex.test(year)) {
    return 'Invalid academic year format. Expected YYYY-YYYY';
  }
  const [startYear, endYear] = year.split('-').map(Number);
  if (endYear !== startYear + 1) {
    return 'Academic year end must be one year after start';
  }
  return null;
};

const createGrade = async (req, res) => {
  try {
    logger.info('Creating grade');
    
    const { gradeId, grade, description, minMarks, maxMarks, gradePoints, institutionId, academicYear, displayOrder } = req.body;
    
    // Validation
    const errors = [];
    
    if (!gradeId || gradeId.trim().length === 0) {
      errors.push('Grade ID is required');
    } else if (gradeId.length > 50) {
      errors.push('Grade ID must not exceed 50 characters');
    }
    
    if (!grade || grade.trim().length === 0) {
      errors.push('Grade is required');
    } else if (grade.length > 10) {
      errors.push('Grade must not exceed 10 characters');
    }
    
    if (description && description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
    
    if (minMarks === undefined || minMarks === null) {
      errors.push('Minimum marks is required');
    } else {
      const minMarksNum = parseFloat(minMarks);
      if (isNaN(minMarksNum) || minMarksNum < 0) {
        errors.push('Minimum marks must be a non-negative number');
      } else if (minMarksNum > 100) {
        errors.push('Minimum marks must not exceed 100');
      }
    }
    
    if (maxMarks === undefined || maxMarks === null) {
      errors.push('Maximum marks is required');
    } else {
      const maxMarksNum = parseFloat(maxMarks);
      if (isNaN(maxMarksNum) || maxMarksNum < 0) {
        errors.push('Maximum marks must be a non-negative number');
      } else if (maxMarksNum > 100) {
        errors.push('Maximum marks must not exceed 100');
      }
    }
    
    if (minMarks !== undefined && maxMarks !== undefined) {
      if (parseFloat(minMarks) > parseFloat(maxMarks)) {
        errors.push('Minimum marks cannot be greater than maximum marks');
      }
    }
    
    if (gradePoints !== undefined) {
      const gradePointsNum = parseFloat(gradePoints);
      if (isNaN(gradePointsNum) || gradePointsNum < 0) {
        errors.push('Grade points must be a non-negative number');
      } else if (gradePointsNum > 10) {
        errors.push('Grade points must not exceed 10');
      }
    }
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (displayOrder !== undefined) {
      const displayOrderNum = parseInt(displayOrder);
      if (isNaN(displayOrderNum) || displayOrderNum < 0) {
        errors.push('Display order must be a non-negative integer');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const gradeData = await gradeService.createGrade({
      ...req.body,
      metadata: { createdBy: req.user?.id }
    });
    
    logger.info('Grade created successfully:', { gradeId: gradeData._id });
    return createdResponse(res, gradeData, 'Grade created successfully');
  } catch (error) {
    logger.error('Error creating grade:', error);
    return errorResponse(res, error.message);
  }
};

const getGradeById = async (req, res) => {
  try {
    logger.info('Fetching grade by ID');
    
    const { id } = req.params;
    
    // Validation
    const idError = validateObjectId(id, 'Grade ID');
    if (idError) {
      return validationErrorResponse(res, [idError]);
    }
    
    const grade = await gradeService.getGradeById(id);
    
    if (!grade) {
      return notFoundResponse(res, 'Grade not found');
    }
    
    logger.info('Grade fetched successfully:', { gradeId: id });
    return successResponse(res, grade, 'Grade retrieved successfully');
  } catch (error) {
    logger.error('Error fetching grade:', error);
    return errorResponse(res, error.message);
  }
};

const getGradeByGradeId = async (req, res) => {
  try {
    logger.info('Fetching grade by grade ID');
    
    const { gradeId } = req.params;
    
    // Validation
    if (!gradeId || gradeId.trim().length === 0) {
      return validationErrorResponse(res, ['Grade ID is required']);
    }
    
    const grade = await gradeService.getGradeByGradeId(gradeId);
    
    if (!grade) {
      return notFoundResponse(res, 'Grade not found');
    }
    
    logger.info('Grade fetched successfully:', { gradeId });
    return successResponse(res, grade, 'Grade retrieved successfully');
  } catch (error) {
    logger.error('Error fetching grade:', error);
    return errorResponse(res, error.message);
  }
};

const getAllGrades = async (req, res) => {
  try {
    logger.info('Fetching all grades');
    
    const { institutionId, academicYear, status, grade, minPoints, maxPoints, search, page, limit, sortBy, sortOrder } = req.query;
    
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
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (minPoints !== undefined) {
      const minPointsNum = parseFloat(minPoints);
      if (isNaN(minPointsNum) || minPointsNum < 0) {
        errors.push('Minimum points must be a non-negative number');
      }
    }
    
    if (maxPoints !== undefined) {
      const maxPointsNum = parseFloat(maxPoints);
      if (isNaN(maxPointsNum) || maxPointsNum < 0) {
        errors.push('Maximum points must be a non-negative number');
      }
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
    
    const result = await gradeService.getAllGrades(
      { institutionId, academicYear, status, grade, minPoints: parseInt(minPoints), maxPoints: parseInt(maxPoints), search },
      { page: pageNum, limit: limitNum, sortBy, sortOrder }
    );
    
    logger.info('Grades fetched successfully');
    return successResponse(res, result, 'Grades retrieved successfully');
  } catch (error) {
    logger.error('Error fetching grades:', error);
    return errorResponse(res, error.message);
  }
};

const updateGrade = async (req, res) => {
  try {
    logger.info('Updating grade');
    
    const { id } = req.params;
    const { gradeId, grade, description, minMarks, maxMarks, gradePoints, institutionId, academicYear, displayOrder, status } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Grade ID');
    if (idError) errors.push(idError);
    
    if (gradeId !== undefined) {
      if (!gradeId || gradeId.trim().length === 0) {
        errors.push('Grade ID cannot be empty');
      } else if (gradeId.length > 50) {
        errors.push('Grade ID must not exceed 50 characters');
      }
    }
    
    if (grade !== undefined) {
      if (!grade || grade.trim().length === 0) {
        errors.push('Grade cannot be empty');
      } else if (grade.length > 10) {
        errors.push('Grade must not exceed 10 characters');
      }
    }
    
    if (description !== undefined && description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
    
    if (minMarks !== undefined) {
      const minMarksNum = parseFloat(minMarks);
      if (isNaN(minMarksNum) || minMarksNum < 0) {
        errors.push('Minimum marks must be a non-negative number');
      } else if (minMarksNum > 100) {
        errors.push('Minimum marks must not exceed 100');
      }
    }
    
    if (maxMarks !== undefined) {
      const maxMarksNum = parseFloat(maxMarks);
      if (isNaN(maxMarksNum) || maxMarksNum < 0) {
        errors.push('Maximum marks must be a non-negative number');
      } else if (maxMarksNum > 100) {
        errors.push('Maximum marks must not exceed 100');
      }
    }
    
    if (minMarks !== undefined && maxMarks !== undefined) {
      if (parseFloat(minMarks) > parseFloat(maxMarks)) {
        errors.push('Minimum marks cannot be greater than maximum marks');
      }
    }
    
    if (gradePoints !== undefined) {
      const gradePointsNum = parseFloat(gradePoints);
      if (isNaN(gradePointsNum) || gradePointsNum < 0) {
        errors.push('Grade points must be a non-negative number');
      } else if (gradePointsNum > 10) {
        errors.push('Grade points must not exceed 10');
      }
    }
    
    if (institutionId !== undefined) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (academicYear !== undefined) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (displayOrder !== undefined) {
      const displayOrderNum = parseInt(displayOrder);
      if (isNaN(displayOrderNum) || displayOrderNum < 0) {
        errors.push('Display order must be a non-negative integer');
      }
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updatedGrade = await gradeService.updateGrade(id, {
      ...req.body,
      metadata: { updatedBy: req.user?.id }
    });
    
    if (!updatedGrade) {
      return notFoundResponse(res, 'Grade not found');
    }
    
    logger.info('Grade updated successfully:', { gradeId: id });
    return successResponse(res, updatedGrade, 'Grade updated successfully');
  } catch (error) {
    logger.error('Error updating grade:', error);
    return errorResponse(res, error.message);
  }
};

const deleteGrade = async (req, res) => {
  try {
    logger.info('Deleting grade');
    
    const { id } = req.params;
    
    // Validation
    const idError = validateObjectId(id, 'Grade ID');
    if (idError) {
      return validationErrorResponse(res, [idError]);
    }
    
    const deletedGrade = await gradeService.deleteGrade(id);
    
    if (!deletedGrade) {
      return notFoundResponse(res, 'Grade not found');
    }
    
    logger.info('Grade deleted successfully:', { gradeId: id });
    return successResponse(res, null, 'Grade deleted successfully');
  } catch (error) {
    logger.error('Error deleting grade:', error);
    return errorResponse(res, error.message);
  }
};

const updateStatus = async (req, res) => {
  try {
    logger.info('Updating grade status');
    
    const { id } = req.params;
    const { status } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Grade ID');
    if (idError) errors.push(idError);
    
    if (!status || status.trim().length === 0) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updatedGrade = await gradeService.updateStatus(id, status);
    
    if (!updatedGrade) {
      return notFoundResponse(res, 'Grade not found');
    }
    
    logger.info('Grade status updated successfully:', { gradeId: id, status });
    return successResponse(res, updatedGrade, 'Grade status updated successfully');
  } catch (error) {
    logger.error('Error updating grade status:', error);
    return errorResponse(res, error.message);
  }
};

const getGradesByInstitution = async (req, res) => {
  try {
    logger.info('Fetching grades by institution');
    
    const { institutionId } = req.params;
    const { academicYear, status, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
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
    
    const result = await gradeService.getGradesByInstitution(institutionId, academicYear, status, { page: pageNum, limit: limitNum });
    
    logger.info('Grades fetched successfully for institution:', { institutionId });
    return successResponse(res, result, 'Grades retrieved successfully');
  } catch (error) {
    logger.error('Error fetching grades by institution:', error);
    return errorResponse(res, error.message);
  }
};

const getGradesByStatus = async (req, res) => {
  try {
    logger.info('Fetching grades by status');
    
    const { status } = req.params;
    const { institutionId, academicYear, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!status || status.trim().length === 0) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
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
    
    const result = await gradeService.getGradesByStatus(status, institutionId, academicYear, { page: pageNum, limit: limitNum });
    
    logger.info('Grades fetched successfully by status:', { status });
    return successResponse(res, result, 'Grades retrieved successfully');
  } catch (error) {
    logger.error('Error fetching grades by status:', error);
    return errorResponse(res, error.message);
  }
};

const getGradeByMarks = async (req, res) => {
  try {
    logger.info('Fetching grade by marks');
    
    const { marks, institutionId, academicYear } = req.query;
    
    // Validation
    const errors = [];
    
    if (marks === undefined || marks === null || marks === '') {
      errors.push('Marks is required');
    } else {
      const marksNum = parseFloat(marks);
      if (isNaN(marksNum)) {
        errors.push('Marks must be a valid number');
      } else if (marksNum < 0) {
        errors.push('Marks must be a non-negative number');
      } else if (marksNum > 100) {
        errors.push('Marks must not exceed 100');
      }
    }
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
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
    
    const grade = await gradeService.getGradeByMarks(parseFloat(marks), institutionId, academicYear);
    
    if (!grade) {
      return notFoundResponse(res, 'No grade found for the given marks');
    }
    
    logger.info('Grade fetched successfully by marks:', { marks });
    return successResponse(res, grade, 'Grade retrieved successfully');
  } catch (error) {
    logger.error('Error fetching grade by marks:', error);
    return errorResponse(res, error.message);
  }
};

const bulkUpdateStatus = async (req, res) => {
  try {
    logger.info('Bulk updating grade statuses');
    
    const { gradeIds, status } = req.body;
    
    // Validation
    const errors = [];
    
    if (!gradeIds || !Array.isArray(gradeIds) || gradeIds.length === 0) {
      errors.push('Grade IDs array is required and must not be empty');
    } else {
      if (gradeIds.length > 100) {
        errors.push('Cannot update more than 100 grades at once');
      }
      
      for (let i = 0; i < gradeIds.length; i++) {
        const idError = validateObjectId(gradeIds[i], 'Grade ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!status || status.trim().length === 0) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await gradeService.bulkUpdateStatus(gradeIds, status);
    
    logger.info('Grades status updated successfully:', { count: result.modifiedCount });
    return successResponse(res, result, 'Grades status updated successfully');
  } catch (error) {
    logger.error('Error bulk updating grade statuses:', error);
    return errorResponse(res, error.message);
  }
};

const updateDisplayOrder = async (req, res) => {
  try {
    logger.info('Updating grade display order');
    
    const { id } = req.params;
    const { displayOrder } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Grade ID');
    if (idError) errors.push(idError);
    
    if (displayOrder === undefined || displayOrder === null) {
      errors.push('Display order is required');
    } else {
      const displayOrderNum = parseInt(displayOrder);
      if (isNaN(displayOrderNum) || displayOrderNum < 0) {
        errors.push('Display order must be a non-negative integer');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updatedGrade = await gradeService.updateDisplayOrder(id, displayOrder);
    
    if (!updatedGrade) {
      return notFoundResponse(res, 'Grade not found');
    }
    
    logger.info('Grade display order updated successfully:', { gradeId: id, displayOrder });
    return successResponse(res, updatedGrade, 'Grade display order updated successfully');
  } catch (error) {
    logger.error('Error updating grade display order:', error);
    return errorResponse(res, error.message);
  }
};

const getGradeStatistics = async (req, res) => {
  try {
    logger.info('Fetching grade statistics');
    
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
    
    const statistics = await gradeService.getGradeStatistics(institutionId, academicYear);
    
    logger.info('Grade statistics fetched successfully');
    return successResponse(res, statistics, 'Grade statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching grade statistics:', error);
    return errorResponse(res, error.message);
  }
};

const searchGrades = async (req, res) => {
  try {
    logger.info('Searching grades');
    
    const { q, institutionId, academicYear, status, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query (q) is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
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
    
    const result = await gradeService.searchGrades(q, institutionId, academicYear, status, { page: pageNum, limit: limitNum });
    
    logger.info('Grades search completed successfully');
    return successResponse(res, result, 'Grades retrieved successfully');
  } catch (error) {
    logger.error('Error searching grades:', error);
    return errorResponse(res, error.message);
  }
};

const bulkDeleteGrades = async (req, res) => {
  try {
    logger.info('Bulk deleting grades');
    
    const { gradeIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!gradeIds || !Array.isArray(gradeIds) || gradeIds.length === 0) {
      errors.push('Grade IDs array is required and must not be empty');
    } else {
      if (gradeIds.length > 100) {
        errors.push('Cannot delete more than 100 grades at once');
      }
      
      for (let i = 0; i < gradeIds.length; i++) {
        const idError = validateObjectId(gradeIds[i], 'Grade ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await gradeService.bulkDeleteGrades(gradeIds);
    
    logger.info('Grades deleted successfully:', { count: result.deletedCount });
    return successResponse(res, result, 'Grades deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting grades:', error);
    return errorResponse(res, error.message);
  }
};

const exportGrades = async (req, res) => {
  try {
    logger.info('Exporting grades');
    
    const { format, institutionId, academicYear, status } = req.query;
    
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
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await gradeService.exportGrades(format.toLowerCase(), { institutionId, academicYear, status });
    
    logger.info('Grades exported successfully:', { format });
    return successResponse(res, exportData, 'Grades exported successfully');
  } catch (error) {
    logger.error('Error exporting grades:', error);
    return errorResponse(res, error.message);
  }
};

export default {
  createGrade,
  getGradeById,
  getGradeByGradeId,
  getAllGrades,
  updateGrade,
  deleteGrade,
  updateStatus,
  getGradesByInstitution,
  getGradesByStatus,
  getGradeByMarks,
  bulkUpdateStatus,
  updateDisplayOrder,
  getGradeStatistics,
  searchGrades,
  bulkDeleteGrades,
  exportGrades
};
