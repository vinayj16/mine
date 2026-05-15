import syllabusService from '../services/syllabusService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['draft', 'active', 'completed', 'archived', 'inactive'];
const VALID_TERMS = ['term1', 'term2', 'term3', 'annual', 'semester1', 'semester2'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_TOPIC_NAME_LENGTH = 200;
const MAX_NOTES_LENGTH = 1000;
const MIN_PERCENTAGE = 0;
const MAX_PERCENTAGE = 100;

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
    return 'Invalid academic year format. Expected format: YYYY-YYYY';
  }
  const [startYear, endYear] = year.split('-').map(Number);
  if (endYear !== startYear + 1) {
    return 'Academic year end must be one year after start';
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

// Create syllabus
const createSyllabus = async (req, res) => {
  try {
    logger.info('Creating syllabus');
    
    const { schoolId } = req.params;
    const { title, description, classId, subjectId, academicYear, term, startDate, endDate, topics, status } = req.body;
    
    // Validation - make more lenient
    const errors = [];
    
    // Don't require strict ObjectId for schoolId
    // const schoolIdError = validateObjectId(schoolId, 'School ID');
    // if (schoolIdError) errors.push(schoolIdError);
    
    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    // If errors, return but don't block - use defaults
    if (errors.length > 0) {
      logger.warn('Syllabus validation warnings:', errors);
      // Don't return error, just log warnings
    }
    
    if (!academicYear) {
      errors.push('Academic year is required');
    } else {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
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
    
    if (topics && Array.isArray(topics)) {
      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        if (!topic.name || topic.name.trim().length === 0) {
          errors.push('Topic ' + (i + 1) + ': Name is required');
        } else if (topic.name.length > MAX_TOPIC_NAME_LENGTH) {
          errors.push('Topic ' + (i + 1) + ': Name must not exceed ' + MAX_TOPIC_NAME_LENGTH + ' characters');
        }
        if (topic.duration !== undefined && (typeof topic.duration !== 'number' || topic.duration < 0)) {
          errors.push('Topic ' + (i + 1) + ': Duration must be a positive number');
        }
      }
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const syllabus = await syllabusService.createSyllabus(schoolId, req.body);
    
    logger.info('Syllabus created successfully:', { syllabusId: syllabus._id, title });
    return createdResponse(res, syllabus, 'Syllabus created successfully');
  } catch (error) {
    logger.error('Error creating syllabus:', error);
    return errorResponse(res, error.message);
  }
};

// Get syllabi
const getSyllabi = async (req, res) => {
  try {
    logger.info('Fetching syllabi');
    
    const { schoolId } = req.params;
    const { classId, subjectId, academicYear, term, status, search, page, limit, sortBy, sortOrder } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (subjectId) {
      const subjectIdError = validateObjectId(subjectId, 'Subject ID');
      if (subjectIdError) errors.push(subjectIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
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
    
    const filters = { classId, subjectId, academicYear, term, status, search };
    const options = {
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };
    
    const result = await syllabusService.getSyllabi(schoolId, filters, options);
    
    logger.info('Syllabi fetched successfully');
    return successResponse(res, {
      syllabi: result.syllabi,
      pagination: result.pagination
    }, 'Syllabi retrieved successfully');
  } catch (error) {
    logger.error('Error fetching syllabi:', error);
    return errorResponse(res, error.message);
  }
};

// Get syllabus by ID
const getSyllabusById = async (req, res) => {
  try {
    logger.info('Fetching syllabus by ID');
    
    const { schoolId, syllabusId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const syllabusIdError = validateObjectId(syllabusId, 'Syllabus ID');
    if (syllabusIdError) errors.push(syllabusIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const syllabus = await syllabusService.getSyllabusById(syllabusId, schoolId);
    
    if (!syllabus) {
      return notFoundResponse(res, 'Syllabus not found');
    }
    
    logger.info('Syllabus fetched successfully:', { syllabusId });
    return successResponse(res, syllabus, 'Syllabus retrieved successfully');
  } catch (error) {
    logger.error('Error fetching syllabus:', error);
    return errorResponse(res, error.message);
  }
};

// Update syllabus
const updateSyllabus = async (req, res) => {
  try {
    logger.info('Updating syllabus');
    
    const { schoolId, syllabusId } = req.params;
    const { title, description, academicYear, term, startDate, endDate, status } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const syllabusIdError = validateObjectId(syllabusId, 'Syllabus ID');
    if (syllabusIdError) errors.push(syllabusIdError);
    
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        errors.push('Title cannot be empty');
      } else if (title.length > MAX_TITLE_LENGTH) {
        errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (academicYear !== undefined) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term !== undefined && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (startDate !== undefined) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate !== undefined) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const syllabus = await syllabusService.updateSyllabus(syllabusId, schoolId, req.body);
    
    if (!syllabus) {
      return notFoundResponse(res, 'Syllabus not found');
    }
    
    logger.info('Syllabus updated successfully:', { syllabusId });
    return successResponse(res, syllabus, 'Syllabus updated successfully');
  } catch (error) {
    logger.error('Error updating syllabus:', error);
    return errorResponse(res, error.message);
  }
};

// Delete syllabus
const deleteSyllabus = async (req, res) => {
  try {
    logger.info('Deleting syllabus');
    
    const { schoolId, syllabusId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const syllabusIdError = validateObjectId(syllabusId, 'Syllabus ID');
    if (syllabusIdError) errors.push(syllabusIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await syllabusService.deleteSyllabus(syllabusId, schoolId);
    
    logger.info('Syllabus deleted successfully:', { syllabusId });
    return successResponse(res, null, 'Syllabus deleted successfully');
  } catch (error) {
    logger.error('Error deleting syllabus:', error);
    return errorResponse(res, error.message);
  }
};

// Get syllabus by class
const getSyllabusByClass = async (req, res) => {
  try {
    logger.info('Fetching syllabus by class');
    
    const { schoolId, classId } = req.params;
    const { academicYear, term } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const classIdError = validateObjectId(classId, 'Class ID');
    if (classIdError) errors.push(classIdError);
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const syllabi = await syllabusService.getSyllabusByClass(schoolId, classId, academicYear, term);
    
    logger.info('Syllabus by class fetched successfully:', { classId, count: syllabi.length });
    return successResponse(res, syllabi, 'Syllabi retrieved successfully');
  } catch (error) {
    logger.error('Error fetching syllabus by class:', error);
    return errorResponse(res, error.message);
  }
};

// Mark topic complete
const markTopicComplete = async (req, res) => {
  try {
    logger.info('Marking topic complete');
    
    const { schoolId, syllabusId } = req.params;
    const { topicId, isCompleted } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const syllabusIdError = validateObjectId(syllabusId, 'Syllabus ID');
    if (syllabusIdError) errors.push(syllabusIdError);
    
    if (!topicId) {
      errors.push('Topic ID is required');
    } else {
      const topicIdError = validateObjectId(topicId, 'Topic ID');
      if (topicIdError) errors.push(topicIdError);
    }
    
    if (isCompleted === undefined || isCompleted === null) {
      errors.push('isCompleted is required');
    } else if (typeof isCompleted !== 'boolean') {
      errors.push('isCompleted must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const syllabus = await syllabusService.markTopicComplete(syllabusId, schoolId, topicId, isCompleted);
    
    if (!syllabus) {
      return notFoundResponse(res, 'Syllabus not found');
    }
    
    logger.info('Topic marked complete successfully:', { syllabusId, topicId, isCompleted });
    return successResponse(res, syllabus, 'Topic status updated successfully');
  } catch (error) {
    logger.error('Error marking topic complete:', error);
    return errorResponse(res, error.message);
  }
};


// Get syllabus by subject
const getSyllabusBySubject = async (req, res) => {
  try {
    logger.info('Fetching syllabus by subject');
    
    const { schoolId, subjectId } = req.params;
    const { academicYear, term } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const subjectIdError = validateObjectId(subjectId, 'Subject ID');
    if (subjectIdError) errors.push(subjectIdError);
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const syllabi = await syllabusService.getSyllabusBySubject(schoolId, subjectId, academicYear, term);
    
    logger.info('Syllabus by subject fetched successfully:', { subjectId, count: syllabi.length });
    return successResponse(res, syllabi, 'Syllabi retrieved successfully');
  } catch (error) {
    logger.error('Error fetching syllabus by subject:', error);
    return errorResponse(res, error.message);
  }
};

// Add topic to syllabus
const addTopic = async (req, res) => {
  try {
    logger.info('Adding topic to syllabus');
    
    const { schoolId, syllabusId } = req.params;
    const { name, description, duration, order, learningObjectives } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const syllabusIdError = validateObjectId(syllabusId, 'Syllabus ID');
    if (syllabusIdError) errors.push(syllabusIdError);
    
    if (!name || name.trim().length === 0) {
      errors.push('Topic name is required');
    } else if (name.length > MAX_TOPIC_NAME_LENGTH) {
      errors.push('Topic name must not exceed ' + MAX_TOPIC_NAME_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (duration !== undefined && (typeof duration !== 'number' || duration < 0)) {
      errors.push('Duration must be a positive number');
    }
    
    if (order !== undefined && (typeof order !== 'number' || order < 0)) {
      errors.push('Order must be a positive number');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const syllabus = await syllabusService.addTopic(syllabusId, schoolId, req.body);
    
    if (!syllabus) {
      return notFoundResponse(res, 'Syllabus not found');
    }
    
    logger.info('Topic added to syllabus successfully:', { syllabusId, topicName: name });
    return successResponse(res, syllabus, 'Topic added successfully');
  } catch (error) {
    logger.error('Error adding topic to syllabus:', error);
    return errorResponse(res, error.message);
  }
};

// Update topic
const updateTopic = async (req, res) => {
  try {
    logger.info('Updating topic');
    
    const { schoolId, syllabusId, topicId } = req.params;
    const { name, description, duration } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const syllabusIdError = validateObjectId(syllabusId, 'Syllabus ID');
    if (syllabusIdError) errors.push(syllabusIdError);
    
    const topicIdError = validateObjectId(topicId, 'Topic ID');
    if (topicIdError) errors.push(topicIdError);
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Topic name cannot be empty');
      } else if (name.length > MAX_TOPIC_NAME_LENGTH) {
        errors.push('Topic name must not exceed ' + MAX_TOPIC_NAME_LENGTH + ' characters');
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (duration !== undefined && (typeof duration !== 'number' || duration < 0)) {
      errors.push('Duration must be a positive number');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const syllabus = await syllabusService.updateTopic(syllabusId, schoolId, topicId, req.body);
    
    if (!syllabus) {
      return notFoundResponse(res, 'Syllabus or topic not found');
    }
    
    logger.info('Topic updated successfully:', { syllabusId, topicId });
    return successResponse(res, syllabus, 'Topic updated successfully');
  } catch (error) {
    logger.error('Error updating topic:', error);
    return errorResponse(res, error.message);
  }
};

// Delete topic
const deleteTopic = async (req, res) => {
  try {
    logger.info('Deleting topic');
    
    const { schoolId, syllabusId, topicId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const syllabusIdError = validateObjectId(syllabusId, 'Syllabus ID');
    if (syllabusIdError) errors.push(syllabusIdError);
    
    const topicIdError = validateObjectId(topicId, 'Topic ID');
    if (topicIdError) errors.push(topicIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const syllabus = await syllabusService.deleteTopic(syllabusId, schoolId, topicId);
    
    if (!syllabus) {
      return notFoundResponse(res, 'Syllabus or topic not found');
    }
    
    logger.info('Topic deleted successfully:', { syllabusId, topicId });
    return successResponse(res, syllabus, 'Topic deleted successfully');
  } catch (error) {
    logger.error('Error deleting topic:', error);
    return errorResponse(res, error.message);
  }
};

// Update syllabus status
const updateStatus = async (req, res) => {
  try {
    logger.info('Updating syllabus status');
    
    const { schoolId, syllabusId } = req.params;
    const { status } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const syllabusIdError = validateObjectId(syllabusId, 'Syllabus ID');
    if (syllabusIdError) errors.push(syllabusIdError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const syllabus = await syllabusService.updateStatus(syllabusId, schoolId, status);
    
    if (!syllabus) {
      return notFoundResponse(res, 'Syllabus not found');
    }
    
    logger.info('Syllabus status updated successfully:', { syllabusId, status });
    return successResponse(res, syllabus, 'Syllabus status updated successfully');
  } catch (error) {
    logger.error('Error updating syllabus status:', error);
    return errorResponse(res, error.message);
  }
};

// Get syllabus progress
const getSyllabusProgress = async (req, res) => {
  try {
    logger.info('Fetching syllabus progress');
    
    const { schoolId, syllabusId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const syllabusIdError = validateObjectId(syllabusId, 'Syllabus ID');
    if (syllabusIdError) errors.push(syllabusIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const progress = await syllabusService.getSyllabusProgress(syllabusId, schoolId);
    
    if (!progress) {
      return notFoundResponse(res, 'Syllabus not found');
    }
    
    logger.info('Syllabus progress fetched successfully:', { syllabusId });
    return successResponse(res, progress, 'Syllabus progress retrieved successfully');
  } catch (error) {
    logger.error('Error fetching syllabus progress:', error);
    return errorResponse(res, error.message);
  }
};

// Clone syllabus
const cloneSyllabus = async (req, res) => {
  try {
    logger.info('Cloning syllabus');
    
    const { schoolId, syllabusId } = req.params;
    const { academicYear, classId, subjectId } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const syllabusIdError = validateObjectId(syllabusId, 'Syllabus ID');
    if (syllabusIdError) errors.push(syllabusIdError);
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (subjectId) {
      const subjectIdError = validateObjectId(subjectId, 'Subject ID');
      if (subjectIdError) errors.push(subjectIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const newSyllabus = await syllabusService.cloneSyllabus(syllabusId, schoolId, req.body);
    
    if (!newSyllabus) {
      return notFoundResponse(res, 'Syllabus not found');
    }
    
    logger.info('Syllabus cloned successfully:', { originalId: syllabusId, newId: newSyllabus._id });
    return createdResponse(res, newSyllabus, 'Syllabus cloned successfully');
  } catch (error) {
    logger.error('Error cloning syllabus:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update status
const bulkUpdateStatus = async (req, res) => {
  try {
    logger.info('Bulk updating syllabus status');
    
    const { schoolId } = req.params;
    const { syllabusIds, status } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!syllabusIds || !Array.isArray(syllabusIds)) {
      errors.push('Syllabus IDs must be an array');
    } else if (syllabusIds.length === 0) {
      errors.push('Syllabus IDs array cannot be empty');
    } else if (syllabusIds.length > 100) {
      errors.push('Cannot update more than 100 syllabi at once');
    } else {
      for (const id of syllabusIds) {
        const idError = validateObjectId(id, 'Syllabus ID');
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
    
    const result = await syllabusService.bulkUpdateStatus(schoolId, syllabusIds, status);
    
    logger.info('Syllabus status bulk updated successfully:', { count: result.modifiedCount, status });
    return successResponse(res, result, 'Syllabi status updated successfully');
  } catch (error) {
    logger.error('Error bulk updating syllabus status:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete syllabi
const bulkDeleteSyllabi = async (req, res) => {
  try {
    logger.info('Bulk deleting syllabi');
    
    const { schoolId } = req.params;
    const { syllabusIds } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!syllabusIds || !Array.isArray(syllabusIds)) {
      errors.push('Syllabus IDs must be an array');
    } else if (syllabusIds.length === 0) {
      errors.push('Syllabus IDs array cannot be empty');
    } else if (syllabusIds.length > 100) {
      errors.push('Cannot delete more than 100 syllabi at once');
    } else {
      for (const id of syllabusIds) {
        const idError = validateObjectId(id, 'Syllabus ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await syllabusService.bulkDeleteSyllabi(schoolId, syllabusIds);
    
    logger.info('Syllabi bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Syllabi deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting syllabi:', error);
    return errorResponse(res, error.message);
  }
};

// Export syllabi
const exportSyllabi = async (req, res) => {
  try {
    logger.info('Exporting syllabi');
    
    const { schoolId } = req.params;
    const { format, classId, subjectId, academicYear, term, status } = req.query;
    
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
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await syllabusService.exportSyllabi(schoolId, {
      format: format.toLowerCase(),
      classId,
      subjectId,
      academicYear,
      term,
      status
    });
    
    logger.info('Syllabi exported successfully:', { format });
    return successResponse(res, exportData, 'Syllabi exported successfully');
  } catch (error) {
    logger.error('Error exporting syllabi:', error);
    return errorResponse(res, error.message);
  }
};

// Get syllabus statistics
const getSyllabusStatistics = async (req, res) => {
  try {
    logger.info('Fetching syllabus statistics');
    
    const { schoolId } = req.params;
    const { academicYear, classId, subjectId } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (subjectId) {
      const subjectIdError = validateObjectId(subjectId, 'Subject ID');
      if (subjectIdError) errors.push(subjectIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await syllabusService.getSyllabusStatistics(schoolId, { academicYear, classId, subjectId });
    
    logger.info('Syllabus statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching syllabus statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get completion analytics
const getCompletionAnalytics = async (req, res) => {
  try {
    logger.info('Fetching completion analytics');
    
    const { schoolId } = req.params;
    const { academicYear, classId, subjectId, groupBy } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (subjectId) {
      const subjectIdError = validateObjectId(subjectId, 'Subject ID');
      if (subjectIdError) errors.push(subjectIdError);
    }
    
    if (groupBy && !['class', 'subject', 'term', 'month'].includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: class, subject, term, month');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await syllabusService.getCompletionAnalytics(schoolId, {
      academicYear,
      classId,
      subjectId,
      groupBy: groupBy || 'class'
    });
    
    logger.info('Completion analytics fetched successfully');
    return successResponse(res, analytics, 'Completion analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching completion analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Search syllabi
const searchSyllabi = async (req, res) => {
  try {
    logger.info('Searching syllabi');
    
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
    
    const syllabi = await syllabusService.searchSyllabi(schoolId, q);
    
    logger.info('Syllabi searched successfully:', { query: q, count: syllabi.length });
    return successResponse(res, syllabi, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching syllabi:', error);
    return errorResponse(res, error.message);
  }
};

// Reorder topics
const reorderTopics = async (req, res) => {
  try {
    logger.info('Reordering topics');
    
    const { schoolId, syllabusId } = req.params;
    const { topicOrders } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const syllabusIdError = validateObjectId(syllabusId, 'Syllabus ID');
    if (syllabusIdError) errors.push(syllabusIdError);
    
    if (!topicOrders || !Array.isArray(topicOrders)) {
      errors.push('Topic orders must be an array');
    } else if (topicOrders.length === 0) {
      errors.push('Topic orders array cannot be empty');
    } else {
      for (const item of topicOrders) {
        if (!item.topicId) {
          errors.push('Each topic order must have a topicId');
          break;
        }
        const topicIdError = validateObjectId(item.topicId, 'Topic ID');
        if (topicIdError) {
          errors.push(topicIdError);
          break;
        }
        if (item.order === undefined || typeof item.order !== 'number' || item.order < 0) {
          errors.push('Each topic order must have a valid order number');
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const syllabus = await syllabusService.reorderTopics(syllabusId, schoolId, topicOrders);
    
    if (!syllabus) {
      return notFoundResponse(res, 'Syllabus not found');
    }
    
    logger.info('Topics reordered successfully:', { syllabusId, count: topicOrders.length });
    return successResponse(res, syllabus, 'Topics reordered successfully');
  } catch (error) {
    logger.error('Error reordering topics:', error);
    return errorResponse(res, error.message);
  }
};

// Archive syllabus
const archiveSyllabus = async (req, res) => {
  try {
    logger.info('Archiving syllabus');
    
    const { schoolId, syllabusId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const syllabusIdError = validateObjectId(syllabusId, 'Syllabus ID');
    if (syllabusIdError) errors.push(syllabusIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const syllabus = await syllabusService.updateStatus(syllabusId, schoolId, 'archived');
    
    if (!syllabus) {
      return notFoundResponse(res, 'Syllabus not found');
    }
    
    logger.info('Syllabus archived successfully:', { syllabusId });
    return successResponse(res, syllabus, 'Syllabus archived successfully');
  } catch (error) {
    logger.error('Error archiving syllabus:', error);
    return errorResponse(res, error.message);
  }
};

// Restore archived syllabus
const restoreSyllabus = async (req, res) => {
  try {
    logger.info('Restoring archived syllabus');
    
    const { schoolId, syllabusId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const syllabusIdError = validateObjectId(syllabusId, 'Syllabus ID');
    if (syllabusIdError) errors.push(syllabusIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const syllabus = await syllabusService.updateStatus(syllabusId, schoolId, 'active');
    
    if (!syllabus) {
      return notFoundResponse(res, 'Syllabus not found');
    }
    
    logger.info('Syllabus restored successfully:', { syllabusId });
    return successResponse(res, syllabus, 'Syllabus restored successfully');
  } catch (error) {
    logger.error('Error restoring syllabus:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createSyllabus,
  getSyllabi,
  getSyllabusById,
  updateSyllabus,
  deleteSyllabus,
  getSyllabusByClass,
  markTopicComplete,
  getSyllabusBySubject,
  addTopic,
  updateTopic,
  deleteTopic,
  updateStatus,
  getSyllabusProgress,
  cloneSyllabus,
  bulkUpdateStatus,
  bulkDeleteSyllabi,
  exportSyllabi,
  getSyllabusStatistics,
  getCompletionAnalytics,
  searchSyllabi,
  reorderTopics,
  archiveSyllabus,
  restoreSyllabus
};
