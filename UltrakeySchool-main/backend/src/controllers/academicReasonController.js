/**
 * Academic Reason Controller
 * Manages academic reasons for various roles and categories
 * (e.g., absence reasons, late arrival reasons, leave reasons)
 */

import academicReasonService from '../services/academicReasonService.js';
import ApiResponse from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Validate school ID
 */
const validateSchoolId = (schoolId) => {
  if (!schoolId) {
    throw new Error('School ID is required');
  }
  // Add MongoDB ObjectId validation if needed
  if (!/^[0-9a-fA-F]{24}$/.test(schoolId)) {
    throw new Error('Invalid school ID format');
  }
  return schoolId;
};

/**
 * Validate reason ID
 */
const validateReasonId = (reasonId) => {
  if (!reasonId) {
    throw new Error('Reason ID is required');
  }
  if (!/^[0-9a-fA-F]{24}$/.test(reasonId)) {
    throw new Error('Invalid reason ID format');
  }
  return reasonId;
};

/**
 * Validate reason data
 */
const validateReasonData = (data) => {
  const errors = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (data.title && data.title.length > 200) {
    errors.push('Title must not exceed 200 characters');
  }
  
  if (!data.role) {
    errors.push('Role is required');
  }
  
  if (!data.category) {
    errors.push('Category is required');
  }
  
  const validRoles = ['STUDENT', 'TEACHER', 'STAFF', 'ALL'];
  if (data.role && !validRoles.includes(data.role.toUpperCase())) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`);
  }
  
  const validCategories = ['ABSENCE', 'LATE_ARRIVAL', 'LEAVE', 'EARLY_DEPARTURE', 'OTHER'];
  if (data.category && !validCategories.includes(data.category.toUpperCase())) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }
  
  const validSeverities = ['LOW', 'MEDIUM', 'HIGH'];
  if (data.severity && !validSeverities.includes(data.severity.toUpperCase())) {
    errors.push(`Severity must be one of: ${validSeverities.join(', ')}`);
  }
  
  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.details = errors;
    throw error;
  }
  
  return true;
};

/**
 * Create a new academic reason
 * @route POST /api/v1/schools/:schoolId/academic-reasons
 */
const createReason = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const userId = req.user?.id || 'system';
    
    // Validate request body
    validateReasonData(req.body);
    
    const reason = await academicReasonService.createReason(schoolId, req.body, userId);
    
    logger.info('Academic reason created', {
      schoolId,
      reasonId: reason._id,
      userId,
      role: reason.role,
      category: reason.category
    });
    
    return ApiResponse.created(
      res,
      'Academic reason created successfully',
      reason
    );
  } catch (error) {
    logger.error('Error creating academic reason:', error);
    if (error.details) {
      return ApiResponse.badRequest(res, error.message, error.details);
    }
    next(error);
  }
};

/**
 * Get all academic reasons with filtering and pagination
 * @route GET /api/v1/schools/:schoolId/academic-reasons
 */
const getReasons = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const { 
      role, 
      category, 
      severity, 
      status,
      search,
      page, 
      limit, 
      sortBy, 
      sortOrder 
    } = req.query;

    // Build filters
    const filters = {};
    if (role) filters.role = role.toUpperCase();
    if (category) filters.category = category.toUpperCase();
    if (severity) filters.severity = severity.toUpperCase();
    if (status) filters.status = status;
    if (search) filters.search = search;

    // Build options
    const options = {
      page: Math.max(1, parseInt(page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit) || 20)),
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };

    const result = await academicReasonService.getReasons(schoolId, filters, options);

    logger.info('Academic reasons retrieved', {
      schoolId,
      userId: req.user?.id,
      filters,
      count: result.reasons.length,
      total: result.pagination.total
    });

    return ApiResponse.success(
      res,
      'Academic reasons retrieved successfully',
      {
        reasons: result.reasons,
        pagination: result.pagination,
        filters: filters
      }
    );
  } catch (error) {
    logger.error('Error getting academic reasons:', error);
    next(error);
  }
};

/**
 * Get academic reason by ID
 * @route GET /api/v1/schools/:schoolId/academic-reasons/:reasonId
 */
const getReasonById = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const reasonId = validateReasonId(req.params.reasonId);
    
    const reason = await academicReasonService.getReasonById(reasonId, schoolId);

    if (!reason) {
      return ApiResponse.notFound(res, 'Academic reason not found');
    }

    logger.info('Academic reason retrieved', {
      schoolId,
      reasonId,
      userId: req.user?.id
    });

    return ApiResponse.success(
      res,
      'Academic reason retrieved successfully',
      reason
    );
  } catch (error) {
    logger.error('Error getting academic reason by ID:', error);
    next(error);
  }
};

/**
 * Update academic reason
 * @route PUT /api/v1/schools/:schoolId/academic-reasons/:reasonId
 */
const updateReason = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const reasonId = validateReasonId(req.params.reasonId);
    const userId = req.user?.id || 'system';
    
    // Validate update data (partial validation)
    if (req.body.title !== undefined) {
      if (!req.body.title || req.body.title.trim().length === 0) {
        return ApiResponse.badRequest(res, 'Title cannot be empty');
      }
      if (req.body.title.length > 200) {
        return ApiResponse.badRequest(res, 'Title must not exceed 200 characters');
      }
    }
    
    const reason = await academicReasonService.updateReason(reasonId, schoolId, req.body, userId);

    if (!reason) {
      return ApiResponse.notFound(res, 'Academic reason not found');
    }

    logger.info('Academic reason updated', {
      schoolId,
      reasonId,
      userId,
      updates: Object.keys(req.body)
    });

    return ApiResponse.success(
      res,
      'Academic reason updated successfully',
      reason
    );
  } catch (error) {
    logger.error('Error updating academic reason:', error);
    next(error);
  }
};

/**
 * Delete academic reason
 * @route DELETE /api/v1/schools/:schoolId/academic-reasons/:reasonId
 */
const deleteReason = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const reasonId = validateReasonId(req.params.reasonId);
    
    const reason = await academicReasonService.deleteReason(reasonId, schoolId);

    if (!reason) {
      return ApiResponse.notFound(res, 'Academic reason not found');
    }

    logger.info('Academic reason deleted', {
      schoolId,
      reasonId,
      userId: req.user?.id,
      title: reason.title
    });

    return ApiResponse.success(
      res,
      'Academic reason deleted successfully',
      { id: reasonId, title: reason.title }
    );
  } catch (error) {
    logger.error('Error deleting academic reason:', error);
    next(error);
  }
};

/**
 * Bulk delete academic reasons
 * @route POST /api/v1/schools/:schoolId/academic-reasons/bulk-delete
 */
const bulkDeleteReasons = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const { reasonIds } = req.body;
    
    if (!reasonIds || !Array.isArray(reasonIds) || reasonIds.length === 0) {
      return ApiResponse.badRequest(res, 'Reason IDs array is required');
    }
    
    // Validate all IDs
    reasonIds.forEach(id => validateReasonId(id));
    
    const result = await academicReasonService.bulkDeleteReasons(reasonIds, schoolId);

    logger.info('Bulk delete academic reasons', {
      schoolId,
      userId: req.user?.id,
      count: result.deletedCount
    });

    return ApiResponse.success(
      res,
      `Successfully deleted ${result.deletedCount} academic reason(s)`,
      {
        deletedCount: result.deletedCount,
        requestedCount: reasonIds.length
      }
    );
  } catch (error) {
    logger.error('Error bulk deleting academic reasons:', error);
    next(error);
  }
};

/**
 * Get reasons by role
 * @route GET /api/v1/schools/:schoolId/academic-reasons/role/:role
 */
const getReasonsByRole = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const { role } = req.params;
    
    if (!role) {
      return ApiResponse.badRequest(res, 'Role parameter is required');
    }
    
    const reasons = await academicReasonService.getReasonsByRole(schoolId, role.toUpperCase());

    logger.info('Academic reasons retrieved by role', {
      schoolId,
      role,
      userId: req.user?.id,
      count: reasons.length
    });

    return ApiResponse.success(
      res,
      `Academic reasons for ${role} retrieved successfully`,
      {
        role: role.toUpperCase(),
        reasons,
        count: reasons.length
      }
    );
  } catch (error) {
    logger.error('Error getting reasons by role:', error);
    next(error);
  }
};

/**
 * Get reasons by category
 * @route GET /api/v1/schools/:schoolId/academic-reasons/category/:category
 */
const getReasonsByCategory = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const { category } = req.params;
    
    if (!category) {
      return ApiResponse.badRequest(res, 'Category parameter is required');
    }
    
    const reasons = await academicReasonService.getReasonsByCategory(schoolId, category.toUpperCase());

    logger.info('Academic reasons retrieved by category', {
      schoolId,
      category,
      userId: req.user?.id,
      count: reasons.length
    });

    return ApiResponse.success(
      res,
      `Academic reasons for ${category} retrieved successfully`,
      {
        category: category.toUpperCase(),
        reasons,
        count: reasons.length
      }
    );
  } catch (error) {
    logger.error('Error getting reasons by category:', error);
    next(error);
  }
};

/**
 * Search reasons
 * @route GET /api/v1/schools/:schoolId/academic-reasons/search
 */
const searchReasons = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const { q, limit, role, category } = req.query;
    
    if (!q || q.trim().length === 0) {
      return ApiResponse.badRequest(res, 'Search query (q) is required');
    }
    
    if (q.length < 2) {
      return ApiResponse.badRequest(res, 'Search query must be at least 2 characters');
    }

    const searchLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const filters = {};
    if (role) filters.role = role.toUpperCase();
    if (category) filters.category = category.toUpperCase();

    const reasons = await academicReasonService.searchReasons(
      schoolId,
      q.trim(),
      searchLimit,
      filters
    );

    logger.info('Academic reasons searched', {
      schoolId,
      query: q,
      userId: req.user?.id,
      count: reasons.length,
      filters
    });

    return ApiResponse.success(
      res,
      'Search completed successfully',
      {
        query: q,
        filters,
        reasons,
        count: reasons.length
      }
    );
  } catch (error) {
    logger.error('Error searching reasons:', error);
    next(error);
  }
};

/**
 * Get analytics
 * @route GET /api/v1/schools/:schoolId/academic-reasons/analytics
 */
const getAnalytics = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const analytics = await academicReasonService.getAnalytics(schoolId);

    logger.info('Academic reasons analytics retrieved', {
      schoolId,
      userId: req.user?.id,
      totalReasons: analytics.totalReasons
    });

    return ApiResponse.success(
      res,
      'Analytics retrieved successfully',
      analytics
    );
  } catch (error) {
    logger.error('Error getting analytics:', error);
    next(error);
  }
};

/**
 * Increment usage count
 * @route POST /api/v1/schools/:schoolId/academic-reasons/:reasonId/increment-usage
 */
const incrementUsage = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const reasonId = validateReasonId(req.params.reasonId);
    
    const reason = await academicReasonService.incrementUsage(reasonId, schoolId);

    if (!reason) {
      return ApiResponse.notFound(res, 'Academic reason not found');
    }

    logger.info('Academic reason usage incremented', {
      schoolId,
      reasonId,
      userId: req.user?.id,
      newCount: reason.usageCount
    });

    return ApiResponse.success(
      res,
      'Usage count incremented successfully',
      {
        id: reason._id,
        title: reason.title,
        usageCount: reason.usageCount
      }
    );
  } catch (error) {
    logger.error('Error incrementing usage:', error);
    next(error);
  }
};

/**
 * Toggle reason status (active/inactive)
 * @route PATCH /api/v1/schools/:schoolId/academic-reasons/:reasonId/toggle-status
 */
const toggleStatus = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const reasonId = validateReasonId(req.params.reasonId);
    
    const reason = await academicReasonService.toggleStatus(reasonId, schoolId);

    if (!reason) {
      return ApiResponse.notFound(res, 'Academic reason not found');
    }

    logger.info('Academic reason status toggled', {
      schoolId,
      reasonId,
      userId: req.user?.id,
      newStatus: reason.status
    });

    return ApiResponse.success(
      res,
      `Reason ${reason.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      {
        id: reason._id,
        title: reason.title,
        status: reason.status
      }
    );
  } catch (error) {
    logger.error('Error toggling status:', error);
    next(error);
  }
};

/**
 * Get most used reasons
 * @route GET /api/v1/schools/:schoolId/academic-reasons/most-used
 */
const getMostUsedReasons = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const { limit, role, category } = req.query;
    
    const resultLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const filters = {};
    if (role) filters.role = role.toUpperCase();
    if (category) filters.category = category.toUpperCase();

    const reasons = await academicReasonService.getMostUsedReasons(
      schoolId,
      resultLimit,
      filters
    );

    logger.info('Most used academic reasons retrieved', {
      schoolId,
      userId: req.user?.id,
      count: reasons.length,
      filters
    });

    return ApiResponse.success(
      res,
      'Most used reasons retrieved successfully',
      {
        reasons,
        count: reasons.length,
        filters
      }
    );
  } catch (error) {
    logger.error('Error getting most used reasons:', error);
    next(error);
  }
};

/**
 * Export reasons to CSV
 * @route GET /api/v1/schools/:schoolId/academic-reasons/export
 */
const exportReasons = async (req, res, next) => {
  try {
    const schoolId = validateSchoolId(req.params.schoolId);
    const { role, category, status } = req.query;
    
    const filters = {};
    if (role) filters.role = role.toUpperCase();
    if (category) filters.category = category.toUpperCase();
    if (status) filters.status = status;

    const csvData = await academicReasonService.exportToCSV(schoolId, filters);

    logger.info('Academic reasons exported', {
      schoolId,
      userId: req.user?.id,
      filters
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=academic-reasons-${Date.now()}.csv`);
    
    return res.send(csvData);
  } catch (error) {
    logger.error('Error exporting reasons:', error);
    next(error);
  }
};

export default {
  createReason,
  getReasons,
  getReasonById,
  updateReason,
  deleteReason,
  bulkDeleteReasons,
  getReasonsByRole,
  getReasonsByCategory,
  searchReasons,
  getAnalytics,
  incrementUsage,
  toggleStatus,
  getMostUsedReasons,
  exportReasons
};
