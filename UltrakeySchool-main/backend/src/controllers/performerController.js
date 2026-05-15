import performerService from '../services/performerService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';

// Validation constants
const VALID_PERFORMER_TYPES = ['teacher', 'student'];
const VALID_PERIODS = ['current', 'monthly', 'quarterly', 'yearly', 'all-time'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;

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

// Helper function to validate score
const validateScore = (score, fieldName = 'Score') => {
  if (score === undefined || score === null) {
    return null; // Score is optional
  }
  if (typeof score !== 'number' || score < 0 || score > 100) {
    return fieldName + ' must be between 0 and 100';
  }
  return null;
};

/**
 * Get best performers for dashboard
 */
export const getBestPerformers = async (req, res) => {
  try {
    logger.info('Fetching best performers');
    
    const { limit, period, featured } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    const limitNum = parseInt(limit) || 5;
    
    if (limitNum < MIN_LIMIT || limitNum > MAX_LIMIT) {
      errors.push('Limit must be between ' + MIN_LIMIT + ' and ' + MAX_LIMIT);
    }
    
    if (period && !VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
    }
    
    if (featured !== undefined && featured !== 'true' && featured !== 'false') {
      errors.push('Featured must be true or false');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    let performers;
    
    if (featured === 'true') {
      performers = await performerService.getFeaturedPerformers(schoolId);
    } else {
      performers = await performerService.getBestPerformers(schoolId, {
        limit: limitNum,
        period: period || 'current'
      });
    }
    
    logger.info('Best performers fetched successfully');
    return successResponse(res, performers, 'Best performers retrieved successfully');
  } catch (error) {
    logger.error('Error fetching best performers:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get performers by type (teacher or student)
 */
export const getPerformersByType = async (req, res) => {
  try {
    logger.info('Fetching performers by type');
    
    const { type } = req.params;
    const { limit, period, page } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (!type) {
      errors.push('Performer type is required');
    } else if (!VALID_PERFORMER_TYPES.includes(type)) {
      errors.push('Invalid performer type. Must be one of: ' + VALID_PERFORMER_TYPES.join(', '));
    }
    
    const limitNum = parseInt(limit) || 10;
    const pageNum = parseInt(page) || 1;
    
    if (limitNum < MIN_LIMIT || limitNum > MAX_LIMIT) {
      errors.push('Limit must be between ' + MIN_LIMIT + ' and ' + MAX_LIMIT);
    }
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (period && !VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const performers = await performerService.getTopPerformersByType(
      schoolId,
      type,
      limitNum,
      period || 'current'
    );
    
    logger.info('Performers fetched by type successfully:', { type });
    return successResponse(res, performers, 'Performers retrieved successfully');
  } catch (error) {
    logger.error('Error fetching performers by type:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get performer details by ID
 */
export const getPerformerById = async (req, res) => {
  try {
    logger.info('Fetching performer by ID');
    
    const { id } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Performer ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const performer = await performerService.getPerformerById(schoolId, id);
    
    if (!performer) {
      return notFoundResponse(res, 'Performer not found');
    }
    
    logger.info('Performer fetched successfully:', { performerId: id });
    return successResponse(res, performer, 'Performer retrieved successfully');
  } catch (error) {
    logger.error('Error fetching performer:', error);
    if (error.message === 'Performer not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

/**
 * Create or update performer
 */
export const upsertPerformer = async (req, res) => {
  try {
    logger.info('Upserting performer');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map(e => e.msg));
    }
    
    const { userId, type, score, rank, achievements, metrics } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const validationErrors = [];
    
    if (!schoolId) {
      validationErrors.push('School ID is required');
    }
    
    if (!userId) {
      validationErrors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) validationErrors.push(userIdError);
    }
    
    if (!type) {
      validationErrors.push('Performer type is required');
    } else if (!VALID_PERFORMER_TYPES.includes(type)) {
      validationErrors.push('Invalid performer type. Must be one of: ' + VALID_PERFORMER_TYPES.join(', '));
    }
    
    if (score !== undefined) {
      const scoreError = validateScore(score);
      if (scoreError) validationErrors.push(scoreError);
    }
    
    if (rank !== undefined) {
      if (typeof rank !== 'number' || rank < 1) {
        validationErrors.push('Rank must be a positive number');
      }
    }
    
    if (achievements !== undefined && !Array.isArray(achievements)) {
      validationErrors.push('Achievements must be an array');
    }
    
    if (metrics !== undefined && (typeof metrics !== 'object' || Array.isArray(metrics))) {
      validationErrors.push('Metrics must be an object');
    }
    
    if (validationErrors.length > 0) {
      return validationErrorResponse(res, validationErrors);
    }
    
    const performerData = req.body;
    const performer = await performerService.upsertPerformer(schoolId, performerData);
    
    logger.info('Performer upserted successfully:', { performerId: performer._id });
    return successResponse(res, performer, 'Performer record saved successfully');
  } catch (error) {
    logger.error('Error upserting performer:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Calculate and update performer metrics
 */
export const calculateMetrics = async (req, res) => {
  try {
    logger.info('Calculating performer metrics');
    
    const { userId, type } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (!type) {
      errors.push('Performer type is required');
    } else if (!VALID_PERFORMER_TYPES.includes(type)) {
      errors.push('Invalid performer type. Must be one of: ' + VALID_PERFORMER_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const performer = await performerService.calculatePerformerMetrics(
      schoolId,
      userId,
      type
    );
    
    logger.info('Performer metrics calculated successfully:', { userId, type });
    return successResponse(res, performer, 'Performer metrics calculated successfully');
  } catch (error) {
    logger.error('Error calculating performer metrics:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Set featured performers
 */
export const setFeaturedPerformers = async (req, res) => {
  try {
    logger.info('Setting featured performers');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors.array().map(e => e.msg));
    }
    
    const { performerIds } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const validationErrors = [];
    
    if (!schoolId) {
      validationErrors.push('School ID is required');
    }
    
    if (!performerIds || !Array.isArray(performerIds)) {
      validationErrors.push('Performer IDs must be an array');
    } else if (performerIds.length === 0) {
      validationErrors.push('At least one performer ID is required');
    } else if (performerIds.length > 20) {
      validationErrors.push('Cannot feature more than 20 performers at once');
    } else {
      for (const id of performerIds) {
        const idError = validateObjectId(id, 'Performer ID');
        if (idError) {
          validationErrors.push(idError);
          break;
        }
      }
    }
    
    if (validationErrors.length > 0) {
      return validationErrorResponse(res, validationErrors);
    }
    
    const performers = await performerService.setFeaturedPerformers(
      schoolId,
      performerIds
    );
    
    logger.info('Featured performers updated successfully:', { count: performers.length });
    return successResponse(res, performers, 'Featured performers updated successfully');
  } catch (error) {
    logger.error('Error setting featured performers:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Delete performer record
 */
export const deletePerformer = async (req, res) => {
  try {
    logger.info('Deleting performer');
    
    const { id } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Performer ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const performer = await performerService.deletePerformer(schoolId, id);
    
    if (!performer) {
      return notFoundResponse(res, 'Performer not found');
    }
    
    logger.info('Performer deleted successfully:', { performerId: id });
    return successResponse(res, null, 'Performer deleted successfully');
  } catch (error) {
    logger.error('Error deleting performer:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Bulk update performers
 */
export const bulkUpdatePerformers = async (req, res) => {
  try {
    logger.info('Bulk updating performers');
    
    const { type, period } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (!type) {
      errors.push('Performer type is required');
    } else if (!VALID_PERFORMER_TYPES.includes(type)) {
      errors.push('Invalid performer type. Must be one of: ' + VALID_PERFORMER_TYPES.join(', '));
    }
    
    if (period && !VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const performers = await performerService.bulkUpdatePerformers(
      schoolId,
      type,
      period
    );
    
    logger.info('Performers bulk updated successfully:', { count: performers.length });
    return successResponse(res, {
      count: performers.length,
      performers
    }, performers.length + ' performers updated successfully');
  } catch (error) {
    logger.error('Error bulk updating performers:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get performer statistics
 */
export const getPerformerStatistics = async (req, res) => {
  try {
    logger.info('Fetching performer statistics');
    
    const { type, period } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (type && !VALID_PERFORMER_TYPES.includes(type)) {
      errors.push('Invalid performer type. Must be one of: ' + VALID_PERFORMER_TYPES.join(', '));
    }
    
    if (period && !VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await performerService.getPerformerStatistics(schoolId, type, period);
    
    logger.info('Performer statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching performer statistics:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Export performer data
 */
export const exportPerformers = async (req, res) => {
  try {
    logger.info('Exporting performer data');
    
    const { format, type, period } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (type && !VALID_PERFORMER_TYPES.includes(type)) {
      errors.push('Invalid performer type. Must be one of: ' + VALID_PERFORMER_TYPES.join(', '));
    }
    
    if (period && !VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await performerService.exportPerformers({
      schoolId,
      format: format.toLowerCase(),
      type,
      period
    });
    
    logger.info('Performer data exported successfully:', { format });
    return successResponse(res, exportData, 'Data exported successfully');
  } catch (error) {
    logger.error('Error exporting performer data:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get performer rankings
 */
export const getPerformerRankings = async (req, res) => {
  try {
    logger.info('Fetching performer rankings');
    
    const { type, period, page, limit } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (!type) {
      errors.push('Performer type is required');
    } else if (!VALID_PERFORMER_TYPES.includes(type)) {
      errors.push('Invalid performer type. Must be one of: ' + VALID_PERFORMER_TYPES.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < MIN_LIMIT || limitNum > MAX_LIMIT) {
      errors.push('Limit must be between ' + MIN_LIMIT + ' and ' + MAX_LIMIT);
    }
    
    if (period && !VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await performerService.getPerformerRankings({
      schoolId,
      type,
      period: period || 'current',
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Performer rankings fetched successfully');
    return successResponse(res, result, 'Rankings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching performer rankings:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get performer achievements
 */
export const getPerformerAchievements = async (req, res) => {
  try {
    logger.info('Fetching performer achievements');
    
    const { id } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Performer ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const achievements = await performerService.getPerformerAchievements(schoolId, id);
    
    logger.info('Performer achievements fetched successfully:', { performerId: id });
    return successResponse(res, achievements, 'Achievements retrieved successfully');
  } catch (error) {
    logger.error('Error fetching performer achievements:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Add achievement to performer
 */
export const addAchievement = async (req, res) => {
  try {
    logger.info('Adding achievement to performer');
    
    const { id } = req.params;
    const { title, description, date, category } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Performer ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (!title || title.trim().length === 0) {
      errors.push('Achievement title is required');
    } else if (title.length > 200) {
      errors.push('Title must not exceed 200 characters');
    }
    
    if (description && description.length > 1000) {
      errors.push('Description must not exceed 1000 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const performer = await performerService.addAchievement(schoolId, id, {
      title,
      description,
      date: date || new Date(),
      category
    });
    
    if (!performer) {
      return notFoundResponse(res, 'Performer not found');
    }
    
    logger.info('Achievement added successfully:', { performerId: id });
    return successResponse(res, performer, 'Achievement added successfully');
  } catch (error) {
    logger.error('Error adding achievement:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Remove achievement from performer
 */
export const removeAchievement = async (req, res) => {
  try {
    logger.info('Removing achievement from performer');
    
    const { id, achievementId } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Performer ID');
    if (idError) errors.push(idError);
    
    const achievementIdError = validateObjectId(achievementId, 'Achievement ID');
    if (achievementIdError) errors.push(achievementIdError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const performer = await performerService.removeAchievement(schoolId, id, achievementId);
    
    if (!performer) {
      return notFoundResponse(res, 'Performer or achievement not found');
    }
    
    logger.info('Achievement removed successfully:', { performerId: id, achievementId });
    return successResponse(res, performer, 'Achievement removed successfully');
  } catch (error) {
    logger.error('Error removing achievement:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Compare performers
 */
export const comparePerformers = async (req, res) => {
  try {
    logger.info('Comparing performers');
    
    const { performerIds } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (!performerIds || !Array.isArray(performerIds)) {
      errors.push('Performer IDs must be an array');
    } else if (performerIds.length < 2) {
      errors.push('At least 2 performers are required for comparison');
    } else if (performerIds.length > 10) {
      errors.push('Cannot compare more than 10 performers at once');
    } else {
      for (const id of performerIds) {
        const idError = validateObjectId(id, 'Performer ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const comparison = await performerService.comparePerformers(schoolId, performerIds);
    
    logger.info('Performers compared successfully:', { count: performerIds.length });
    return successResponse(res, comparison, 'Comparison completed successfully');
  } catch (error) {
    logger.error('Error comparing performers:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get performer trends
 */
export const getPerformerTrends = async (req, res) => {
  try {
    logger.info('Fetching performer trends');
    
    const { id } = req.params;
    const { period } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Performer ID');
    if (idError) errors.push(idError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (period && !VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const trends = await performerService.getPerformerTrends(schoolId, id, period || 'monthly');
    
    logger.info('Performer trends fetched successfully:', { performerId: id });
    return successResponse(res, trends, 'Trends retrieved successfully');
  } catch (error) {
    logger.error('Error fetching performer trends:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getBestPerformers,
  getPerformersByType,
  getPerformerById,
  upsertPerformer,
  calculateMetrics,
  setFeaturedPerformers,
  deletePerformer,
  bulkUpdatePerformers,
  getPerformerStatistics,
  exportPerformers,
  getPerformerRankings,
  getPerformerAchievements,
  addAchievement,
  removeAchievement,
  comparePerformers,
  getPerformerTrends
};
