import religionService from '../services/religionService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'archived'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_DISPLAY_ORDER = 9999;

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

// Create religion
const createReligion = async (req, res) => {
  try {
    logger.info('Creating religion');
    
    const { name, description, status, displayOrder, institutionId } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Religion name is required');
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (displayOrder !== undefined) {
      if (typeof displayOrder !== 'number' || displayOrder < 0 || displayOrder > MAX_DISPLAY_ORDER) {
        errors.push('Display order must be between 0 and ' + MAX_DISPLAY_ORDER);
      }
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const religionData = {
      ...req.body,
      metadata: { createdBy: userId || 'system' }
    };
    
    const religion = await religionService.createReligion(religionData);
    
    logger.info('Religion created successfully:', { religionId: religion._id, name });
    return createdResponse(res, religion, 'Religion created successfully');
  } catch (error) {
    logger.error('Error creating religion:', error);
    return errorResponse(res, error.message);
  }
};

// Get religion by ID
const getReligionById = async (req, res) => {
  try {
    logger.info('Fetching religion by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Religion ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const religion = await religionService.getReligionById(id);
    
    if (!religion) {
      return notFoundResponse(res, 'Religion not found');
    }
    
    logger.info('Religion fetched successfully:', { religionId: id });
    return successResponse(res, religion, 'Religion retrieved successfully');
  } catch (error) {
    logger.error('Error fetching religion:', error);
    return errorResponse(res, error.message);
  }
};

// Get all religions
const getAllReligions = async (req, res) => {
  try {
    logger.info('Fetching all religions');
    
    const { status, institutionId, search, page, limit, sortBy, sortOrder } = req.query;
    
    // Validation
    const errors = [];
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
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
    
    const filters = { status, institutionId, search };
    const options = {
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'displayOrder',
      sortOrder: sortOrder || 'asc'
    };
    
    const result = await religionService.getAllReligions(filters, options);
    
    logger.info('Religions fetched successfully');
    return successResponse(res, {
      religions: result.religions,
      pagination: result.pagination
    }, 'Religions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching religions:', error);
    return errorResponse(res, error.message);
  }
};

// Update religion
const updateReligion = async (req, res) => {
  try {
    logger.info('Updating religion');
    
    const { id } = req.params;
    const { name, description, status, displayOrder } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Religion ID');
    if (idError) errors.push(idError);
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Religion name cannot be empty');
      } else if (name.length > MAX_NAME_LENGTH) {
        errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (displayOrder !== undefined) {
      if (typeof displayOrder !== 'number' || displayOrder < 0 || displayOrder > MAX_DISPLAY_ORDER) {
        errors.push('Display order must be between 0 and ' + MAX_DISPLAY_ORDER);
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updateData = { ...req.body, 'metadata.updatedBy': userId || 'system' };
    const religion = await religionService.updateReligion(id, updateData);
    
    if (!religion) {
      return notFoundResponse(res, 'Religion not found');
    }
    
    logger.info('Religion updated successfully:', { religionId: id });
    return successResponse(res, religion, 'Religion updated successfully');
  } catch (error) {
    logger.error('Error updating religion:', error);
    return errorResponse(res, error.message);
  }
};

// Delete religion
const deleteReligion = async (req, res) => {
  try {
    logger.info('Deleting religion');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Religion ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await religionService.deleteReligion(id);
    
    logger.info('Religion deleted successfully:', { religionId: id });
    return successResponse(res, null, 'Religion deleted successfully');
  } catch (error) {
    logger.error('Error deleting religion:', error);
    return errorResponse(res, error.message);
  }
};

// Get religions by status
const getReligionsByStatus = async (req, res) => {
  try {
    logger.info('Fetching religions by status');
    
    const { status } = req.params;
    const { institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const religions = await religionService.getReligionsByStatus(status, institutionId);
    
    logger.info('Religions fetched by status successfully:', { status, count: religions.length });
    return successResponse(res, religions, 'Religions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching religions by status:', error);
    return errorResponse(res, error.message);
  }
};

// Get religions by institution
const getReligionsByInstitution = async (req, res) => {
  try {
    logger.info('Fetching religions by institution');
    
    const { institutionId } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const religions = await religionService.getReligionsByInstitution(institutionId);
    
    logger.info('Religions fetched by institution successfully:', { institutionId, count: religions.length });
    return successResponse(res, religions, 'Religions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching religions by institution:', error);
    return errorResponse(res, error.message);
  }
};

// Update status
const updateStatus = async (req, res) => {
  try {
    logger.info('Updating religion status');
    
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Religion ID');
    if (idError) errors.push(idError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const religion = await religionService.updateStatus(id, status, userId || 'system');
    
    if (!religion) {
      return notFoundResponse(res, 'Religion not found');
    }
    
    logger.info('Religion status updated successfully:', { religionId: id, status });
    return successResponse(res, religion, 'Religion status updated successfully');
  } catch (error) {
    logger.error('Error updating religion status:', error);
    return errorResponse(res, error.message);
  }
};

// Update display order
const updateDisplayOrder = async (req, res) => {
  try {
    logger.info('Updating religion display order');
    
    const { id } = req.params;
    const { displayOrder } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Religion ID');
    if (idError) errors.push(idError);
    
    if (displayOrder === undefined || displayOrder === null) {
      errors.push('Display order is required');
    } else if (typeof displayOrder !== 'number' || displayOrder < 0 || displayOrder > MAX_DISPLAY_ORDER) {
      errors.push('Display order must be between 0 and ' + MAX_DISPLAY_ORDER);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const religion = await religionService.updateDisplayOrder(id, displayOrder);
    
    if (!religion) {
      return notFoundResponse(res, 'Religion not found');
    }
    
    logger.info('Religion display order updated successfully:', { religionId: id, displayOrder });
    return successResponse(res, religion, 'Display order updated successfully');
  } catch (error) {
    logger.error('Error updating religion display order:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update status
const bulkUpdateStatus = async (req, res) => {
  try {
    logger.info('Bulk updating religion status');
    
    const { religionIds, status } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!religionIds || !Array.isArray(religionIds)) {
      errors.push('Religion IDs must be an array');
    } else if (religionIds.length === 0) {
      errors.push('Religion IDs array cannot be empty');
    } else if (religionIds.length > 100) {
      errors.push('Cannot update more than 100 religions at once');
    } else {
      for (const id of religionIds) {
        const idError = validateObjectId(id, 'Religion ID');
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
    
    const result = await religionService.bulkUpdateStatus(religionIds, status, userId || 'system');
    
    logger.info('Religion status bulk updated successfully:', { count: result.modifiedCount, status });
    return successResponse(res, result, 'Religions status updated successfully');
  } catch (error) {
    logger.error('Error bulk updating religion status:', error);
    return errorResponse(res, error.message);
  }
};

// Get religion statistics
const getReligionStatistics = async (req, res) => {
  try {
    logger.info('Fetching religion statistics');
    
    const { institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await religionService.getReligionStatistics(institutionId);
    
    logger.info('Religion statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching religion statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Search religions
const searchReligions = async (req, res) => {
  try {
    logger.info('Searching religions');
    
    const { q, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const religions = await religionService.searchReligions(q, institutionId);
    
    logger.info('Religions searched successfully:', { query: q, count: religions.length });
    return successResponse(res, religions, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching religions:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete religions
const bulkDeleteReligions = async (req, res) => {
  try {
    logger.info('Bulk deleting religions');
    
    const { religionIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!religionIds || !Array.isArray(religionIds)) {
      errors.push('Religion IDs must be an array');
    } else if (religionIds.length === 0) {
      errors.push('Religion IDs array cannot be empty');
    } else if (religionIds.length > 100) {
      errors.push('Cannot delete more than 100 religions at once');
    } else {
      for (const id of religionIds) {
        const idError = validateObjectId(id, 'Religion ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await religionService.bulkDeleteReligions(religionIds);
    
    logger.info('Religions bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Religions deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting religions:', error);
    return errorResponse(res, error.message);
  }
};

// Export religions
const exportReligions = async (req, res) => {
  try {
    logger.info('Exporting religions');
    
    const { format, status, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await religionService.exportReligions({
      format: format.toLowerCase(),
      status,
      institutionId
    });
    
    logger.info('Religions exported successfully:', { format });
    return successResponse(res, exportData, 'Religions exported successfully');
  } catch (error) {
    logger.error('Error exporting religions:', error);
    return errorResponse(res, error.message);
  }
};

// Import religions
const importReligions = async (req, res) => {
  try {
    logger.info('Importing religions');
    
    const { religions, overwrite } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!religions || !Array.isArray(religions)) {
      errors.push('Religions must be an array');
    } else if (religions.length === 0) {
      errors.push('Religions array cannot be empty');
    } else if (religions.length > 500) {
      errors.push('Cannot import more than 500 religions at once');
    } else {
      for (let i = 0; i < religions.length; i++) {
        const religion = religions[i];
        if (!religion.name || religion.name.trim().length === 0) {
          errors.push('Religion ' + (i + 1) + ': Name is required');
          break;
        }
        if (religion.name.length > MAX_NAME_LENGTH) {
          errors.push('Religion ' + (i + 1) + ': Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
          break;
        }
      }
    }
    
    if (overwrite !== undefined && typeof overwrite !== 'boolean') {
      errors.push('overwrite must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await religionService.importReligions(religions, userId || 'system', overwrite);
    
    logger.info('Religions imported successfully:', { imported: result.importedCount, skipped: result.skippedCount });
    return successResponse(res, result, 'Religions imported successfully');
  } catch (error) {
    logger.error('Error importing religions:', error);
    return errorResponse(res, error.message);
  }
};

// Reorder religions
const reorderReligions = async (req, res) => {
  try {
    logger.info('Reordering religions');
    
    const { religionOrders } = req.body;
    
    // Validation
    const errors = [];
    
    if (!religionOrders || !Array.isArray(religionOrders)) {
      errors.push('Religion orders must be an array');
    } else if (religionOrders.length === 0) {
      errors.push('Religion orders array cannot be empty');
    } else if (religionOrders.length > 100) {
      errors.push('Cannot reorder more than 100 religions at once');
    } else {
      for (const item of religionOrders) {
        if (!item.id) {
          errors.push('Each religion order must have an id');
          break;
        }
        const idError = validateObjectId(item.id, 'Religion ID');
        if (idError) {
          errors.push(idError);
          break;
        }
        if (item.displayOrder === undefined || typeof item.displayOrder !== 'number') {
          errors.push('Each religion order must have a valid displayOrder');
          break;
        }
        if (item.displayOrder < 0 || item.displayOrder > MAX_DISPLAY_ORDER) {
          errors.push('Display order must be between 0 and ' + MAX_DISPLAY_ORDER);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await religionService.reorderReligions(religionOrders);
    
    logger.info('Religions reordered successfully:', { count: result.modifiedCount });
    return successResponse(res, result, 'Religions reordered successfully');
  } catch (error) {
    logger.error('Error reordering religions:', error);
    return errorResponse(res, error.message);
  }
};

// Get active religions
const getActiveReligions = async (req, res) => {
  try {
    logger.info('Fetching active religions');
    
    const { institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const religions = await religionService.getReligionsByStatus('active', institutionId);
    
    logger.info('Active religions fetched successfully:', { count: religions.length });
    return successResponse(res, religions, 'Active religions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching active religions:', error);
    return errorResponse(res, error.message);
  }
};

// Duplicate religion
const duplicateReligion = async (req, res) => {
  try {
    logger.info('Duplicating religion');
    
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Religion ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const religion = await religionService.duplicateReligion(id, userId || 'system');
    
    logger.info('Religion duplicated successfully:', { originalId: id, newId: religion._id });
    return createdResponse(res, religion, 'Religion duplicated successfully');
  } catch (error) {
    logger.error('Error duplicating religion:', error);
    return errorResponse(res, error.message);
  }
};

// Archive religion
const archiveReligion = async (req, res) => {
  try {
    logger.info('Archiving religion');
    
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Religion ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const religion = await religionService.updateStatus(id, 'archived', userId || 'system');
    
    if (!religion) {
      return notFoundResponse(res, 'Religion not found');
    }
    
    logger.info('Religion archived successfully:', { religionId: id });
    return successResponse(res, religion, 'Religion archived successfully');
  } catch (error) {
    logger.error('Error archiving religion:', error);
    return errorResponse(res, error.message);
  }
};

// Restore archived religion
const restoreReligion = async (req, res) => {
  try {
    logger.info('Restoring archived religion');
    
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Religion ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const religion = await religionService.updateStatus(id, 'active', userId || 'system');
    
    if (!religion) {
      return notFoundResponse(res, 'Religion not found');
    }
    
    logger.info('Religion restored successfully:', { religionId: id });
    return successResponse(res, religion, 'Religion restored successfully');
  } catch (error) {
    logger.error('Error restoring religion:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createReligion,
  getReligionById,
  getAllReligions,
  updateReligion,
  deleteReligion,
  getReligionsByStatus,
  getReligionsByInstitution,
  updateStatus,
  updateDisplayOrder,
  bulkUpdateStatus,
  getReligionStatistics,
  searchReligions,
  bulkDeleteReligions,
  exportReligions,
  importReligions,
  reorderReligions,
  getActiveReligions,
  duplicateReligion,
  archiveReligion,
  restoreReligion
};
