import fileManagerService from '../services/fileManagerService.js';
import FileManager from '../models/FileManager.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_ITEM_TYPES = ['file', 'folder', 'document', 'image', 'video', 'audio', 'archive', 'other'];
const VALID_FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'zip', 'rar'];
const VALID_SORT_FIELDS = ['name', 'size', 'createdAt', 'updatedAt', 'type'];
const VALID_SORT_ORDERS = ['asc', 'desc', 'ascending', 'descending', '1', '-1'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

// Helper function to validate MongoDB ObjectId
const validateObjectId = (id, fieldName = 'ID', allowString = false) => {
  if (!id) {
    return fieldName + ' is required';
  }
  // Allow string IDs (non-MongoDB) for ownerId and similar fields
  if (allowString && typeof id === 'string') {
    return null;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate file size
const validateFileSize = (size) => {
  if (size === undefined || size === null) return null;
  const sizeNum = parseInt(size);
  if (isNaN(sizeNum) || sizeNum < 0) {
    return 'File size must be a non-negative number';
  }
  if (sizeNum > MAX_FILE_SIZE) {
    return 'File size must not exceed 100MB';
  }
  return null;
};

const createItem = async (req, res) => {
  try {
    logger.info('Creating file manager item');
    
    const { name, type, parentId, ownerId, institutionId, size, mimeType, path } = req.body;
    
    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Name is required');
    } else if (name.length > 255) {
      errors.push('Name must not exceed 255 characters');
    }
    
    if (!type) {
      errors.push('Type is required');
    } else if (!VALID_ITEM_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_ITEM_TYPES.join(', '));
    }
    
    if (parentId) {
      const parentIdError = validateObjectId(parentId, 'Parent ID');
      if (parentIdError) errors.push(parentIdError);
    }
    
    if (!ownerId) {
      errors.push('Owner ID is required');
    } else {
      // Allow both string IDs and ObjectIds for flexibility
      if (typeof ownerId !== 'string' || ownerId.trim().length === 0) {
        errors.push('Owner ID must be a non-empty string');
      }
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID', true);
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (size !== undefined) {
      const sizeError = validateFileSize(size);
      if (sizeError) errors.push(sizeError);
    }
    
    if (mimeType && mimeType.length > 100) {
      errors.push('MIME type must not exceed 100 characters');
    }
    
    if (path && path.length > 1000) {
      errors.push('Path must not exceed 1000 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const item = await fileManagerService.createItem(req.body);
    
    logger.info('File manager item created successfully:', { itemId: item._id });
    return createdResponse(res, item, 'Item created successfully');
  } catch (error) {
    logger.error('Error creating file manager item:', error);
    return errorResponse(res, error.message);
  }
};

const getItemById = async (req, res) => {
  try {
    logger.info('Fetching file manager item by ID');
    
    const { id } = req.params;
    
    // Validation
    const idError = validateObjectId(id, 'Item ID');
    if (idError) {
      return validationErrorResponse(res, [idError]);
    }
    
    const item = await fileManagerService.getItemById(id);
    
    if (!item) {
      return notFoundResponse(res, 'Item not found');
    }
    
    logger.info('File manager item fetched successfully:', { itemId: id });
    return successResponse(res, item, 'Item retrieved successfully');
  } catch (error) {
    logger.error('Error fetching file manager item:', error);
    return errorResponse(res, error.message);
  }
};

const getAllItems = async (req, res) => {
  try {
    logger.info('Fetching all file manager items');
    
    const { ownerId, institutionId, parentId, type, isFavorite, isDeleted, page, limit, sortBy, sortOrder, search } = req.query;
    
    // Validation
    const errors = [];
    
    if (ownerId) {
      // Allow both string IDs and ObjectIds for flexibility
      if (typeof ownerId !== 'string' || ownerId.trim().length === 0) {
        errors.push('Owner ID must be a non-empty string');
      }
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID', true);
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (parentId) {
      const parentIdError = validateObjectId(parentId, 'Parent ID');
      if (parentIdError) errors.push(parentIdError);
    }
    
    if (type && !VALID_ITEM_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_ITEM_TYPES.join(', '));
    }
    
    if (isFavorite !== undefined && typeof isFavorite !== 'boolean' && isFavorite !== 'true' && isFavorite !== 'false') {
      errors.push('isFavorite must be a boolean value');
    }
    
    if (isDeleted !== undefined && typeof isDeleted !== 'boolean' && isDeleted !== 'true' && isDeleted !== 'false') {
      errors.push('isDeleted must be a boolean value');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (sortBy && !VALID_SORT_FIELDS.includes(sortBy)) {
      errors.push('Invalid sortBy. Must be one of: ' + VALID_SORT_FIELDS.join(', '));
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
    
    const result = await fileManagerService.getAllItems(req.query);
    
    logger.info('File manager items fetched successfully');
    return successResponse(res, result, 'Items retrieved successfully');
  } catch (error) {
    logger.error('Error fetching file manager items:', error);
    return errorResponse(res, error.message);
  }
};

const updateItem = async (req, res) => {
  try {
    logger.info('Updating file manager item');
    
    const { id } = req.params;
    const { name, type, size, mimeType } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Item ID');
    if (idError) errors.push(idError);
    
    if (name !== undefined) {
      if (name.trim().length === 0) {
        errors.push('Name cannot be empty');
      } else if (name.length > 255) {
        errors.push('Name must not exceed 255 characters');
      }
    }
    
    if (type && !VALID_ITEM_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_ITEM_TYPES.join(', '));
    }
    
    if (size !== undefined) {
      const sizeError = validateFileSize(size);
      if (sizeError) errors.push(sizeError);
    }
    
    if (mimeType && mimeType.length > 100) {
      errors.push('MIME type must not exceed 100 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const item = await fileManagerService.updateItem(id, req.body);
    
    if (!item) {
      return notFoundResponse(res, 'Item not found');
    }
    
    logger.info('File manager item updated successfully:', { itemId: id });
    return successResponse(res, item, 'Item updated successfully');
  } catch (error) {
    logger.error('Error updating file manager item:', error);
    return errorResponse(res, error.message);
  }
};

const deleteItem = async (req, res) => {
  try {
    logger.info('Deleting file manager item');
    
    const { id } = req.params;
    
    // Validation
    const idError = validateObjectId(id, 'Item ID');
    if (idError) {
      return validationErrorResponse(res, [idError]);
    }
    
    const result = await fileManagerService.deleteItem(id);
    
    if (!result) {
      return notFoundResponse(res, 'Item not found');
    }
    
    logger.info('File manager item deleted successfully:', { itemId: id });
    return successResponse(res, null, 'Item deleted successfully');
  } catch (error) {
    logger.error('Error deleting file manager item:', error);
    return errorResponse(res, error.message);
  }
};

const moveToTrash = async (req, res) => {
  try {
    logger.info('Moving item to trash');
    
    const { id } = req.params;
    
    // Validation
    const idError = validateObjectId(id, 'Item ID');
    if (idError) {
      return validationErrorResponse(res, [idError]);
    }
    
    const item = await fileManagerService.moveToTrash(id);
    
    if (!item) {
      return notFoundResponse(res, 'Item not found');
    }
    
    logger.info('Item moved to trash successfully:', { itemId: id });
    return successResponse(res, item, 'Item moved to trash successfully');
  } catch (error) {
    logger.error('Error moving item to trash:', error);
    return errorResponse(res, error.message);
  }
};

const restoreItem = async (req, res) => {
  try {
    logger.info('Restoring item from trash');
    
    const { id } = req.params;
    
    // Validation
    const idError = validateObjectId(id, 'Item ID');
    if (idError) {
      return validationErrorResponse(res, [idError]);
    }
    
    const item = await fileManagerService.restoreItem(id);
    
    if (!item) {
      return notFoundResponse(res, 'Item not found');
    }
    
    logger.info('Item restored successfully:', { itemId: id });
    return successResponse(res, item, 'Item restored successfully');
  } catch (error) {
    logger.error('Error restoring item:', error);
    return errorResponse(res, error.message);
  }
};

const toggleFavorite = async (req, res) => {
  try {
    logger.info('Toggling item favorite status');
    
    const { id } = req.params;
    
    // Validation
    const idError = validateObjectId(id, 'Item ID');
    if (idError) {
      return validationErrorResponse(res, [idError]);
    }
    
    const item = await fileManagerService.toggleFavorite(id);
    
    if (!item) {
      return notFoundResponse(res, 'Item not found');
    }
    
    logger.info('Item favorite status toggled successfully:', { itemId: id, isFavorite: item.isFavorite });
    return successResponse(res, item, 'Favorite status updated successfully');
  } catch (error) {
    logger.error('Error toggling favorite status:', error);
    return errorResponse(res, error.message);
  }
};

const shareItem = async (req, res) => {
  try {
    logger.info('Sharing item');
    
    const { id } = req.params;
    const { userIds } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Item ID');
    if (idError) errors.push(idError);
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      errors.push('User IDs array is required and must not be empty');
    }
    
    if (userIds && userIds.length > 100) {
      errors.push('Cannot share with more than 100 users at once');
    }
    
    if (userIds) {
      for (let i = 0; i < Math.min(userIds.length, 10); i++) {
        const userIdError = validateObjectId(userIds[i], 'User ID at index ' + i);
        if (userIdError) {
          errors.push(userIdError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const item = await fileManagerService.shareItem(id, userIds);
    
    if (!item) {
      return notFoundResponse(res, 'Item not found');
    }
    
    logger.info('Item shared successfully:', { itemId: id, userCount: userIds.length });
    return successResponse(res, item, 'Item shared successfully');
  } catch (error) {
    logger.error('Error sharing item:', error);
    return errorResponse(res, error.message);
  }
};

const unshareItem = async (req, res) => {
  try {
    logger.info('Unsharing item');
    
    const { id } = req.params;
    const { userIds } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Item ID');
    if (idError) errors.push(idError);
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      errors.push('User IDs array is required and must not be empty');
    }
    
    if (userIds && userIds.length > 100) {
      errors.push('Cannot unshare from more than 100 users at once');
    }
    
    if (userIds) {
      for (let i = 0; i < Math.min(userIds.length, 10); i++) {
        const userIdError = validateObjectId(userIds[i], 'User ID at index ' + i);
        if (userIdError) {
          errors.push(userIdError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const item = await fileManagerService.unshareItem(id, userIds);
    
    if (!item) {
      return notFoundResponse(res, 'Item not found');
    }
    
    logger.info('Item unshared successfully:', { itemId: id, userCount: userIds.length });
    return successResponse(res, item, 'Item unshared successfully');
  } catch (error) {
    logger.error('Error unsharing item:', error);
    return errorResponse(res, error.message);
  }
};

const moveItem = async (req, res) => {
  try {
    logger.info('Moving item');
    
    const { id } = req.params;
    const { newParentId } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Item ID');
    if (idError) errors.push(idError);
    
    if (newParentId) {
      const newParentIdError = validateObjectId(newParentId, 'New parent ID');
      if (newParentIdError) errors.push(newParentIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const item = await fileManagerService.moveItem(id, newParentId);
    
    if (!item) {
      return notFoundResponse(res, 'Item not found');
    }
    
    logger.info('Item moved successfully:', { itemId: id, newParentId });
    return successResponse(res, item, 'Item moved successfully');
  } catch (error) {
    logger.error('Error moving item:', error);
    return errorResponse(res, error.message);
  }
};

const copyItem = async (req, res) => {
  try {
    logger.info('Copying item');
    
    const { id } = req.params;
    const { newParentId } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Item ID');
    if (idError) errors.push(idError);
    
    if (newParentId) {
      const newParentIdError = validateObjectId(newParentId, 'New parent ID');
      if (newParentIdError) errors.push(newParentIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const item = await fileManagerService.copyItem(id, newParentId);
    
    if (!item) {
      return notFoundResponse(res, 'Item not found');
    }
    
    logger.info('Item copied successfully:', { itemId: id, newItemId: item._id });
    return successResponse(res, item, 'Item copied successfully');
  } catch (error) {
    logger.error('Error copying item:', error);
    return errorResponse(res, error.message);
  }
};

const getStorageInfo = async (req, res) => {
  try {
    logger.info('Fetching storage info');
    
    const { ownerId, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (ownerId) {
      // Allow both string IDs and ObjectIds for flexibility
      if (typeof ownerId !== 'string' || ownerId.trim().length === 0) {
        errors.push('Owner ID must be a non-empty string');
      }
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID', true);
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const info = await fileManagerService.getStorageInfo(ownerId, institutionId);
    
    logger.info('Storage info fetched successfully');
    return successResponse(res, info, 'Storage info retrieved successfully');
  } catch (error) {
    logger.error('Error fetching storage info:', error);
    return errorResponse(res, error.message);
  }
};

const getStatistics = async (req, res) => {
  try {
    logger.info('Fetching file manager statistics');
    
    const { ownerId, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (ownerId) {
      // Allow both string IDs and ObjectIds for flexibility
      if (typeof ownerId !== 'string' || ownerId.trim().length === 0) {
        errors.push('Owner ID must be a non-empty string');
      }
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID', true);
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await fileManagerService.getStatistics(ownerId, institutionId);
    
    logger.info('File manager statistics fetched successfully');
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching statistics:', error);
    return errorResponse(res, error.message);
  }
};

const getRecentItems = async (req, res) => {
  try {
    logger.info('Fetching recent items');
    
    const { ownerId, institutionId, days, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (ownerId) {
      const ownerIdError = validateObjectId(ownerId, 'Owner ID', true);
      if (ownerIdError) errors.push(ownerIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID', true);
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (days !== undefined) {
      const daysNum = parseInt(days);
      if (isNaN(daysNum) || daysNum < 1) {
        errors.push('Days must be a positive number');
      } else if (daysNum > 365) {
        errors.push('Days must not exceed 365');
      }
    }
    
    const limitNum = parseInt(limit) || 20;
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const items = await fileManagerService.getRecentItems(ownerId, institutionId, days);
    
    logger.info('Recent items fetched successfully');
    return successResponse(res, items, 'Recent items retrieved successfully');
  } catch (error) {
    logger.error('Error fetching recent items:', error);
    return errorResponse(res, error.message);
  }
};

const searchItems = async (req, res) => {
  try {
    logger.info('Searching items');
    
    const { search, ownerId, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!search || search.trim().length === 0) {
      errors.push('Search query is required');
    } else if (search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (ownerId) {
      const ownerIdError = validateObjectId(ownerId, 'Owner ID', true);
      if (ownerIdError) errors.push(ownerIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID', true);
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const items = await fileManagerService.searchItems(search, ownerId, institutionId);
    
    logger.info('Items search completed successfully');
    return successResponse(res, items, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching items:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk Operations
const bulkDeleteItems = async (req, res) => {
  try {
    logger.info('Bulk deleting items');
    
    const { itemIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      errors.push('Item IDs array is required and must not be empty');
    }
    
    if (itemIds && itemIds.length > 100) {
      errors.push('Cannot delete more than 100 items at once');
    }
    
    if (itemIds) {
      for (let i = 0; i < itemIds.length; i++) {
        const idError = validateObjectId(itemIds[i], 'Item ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await FileManager.deleteMany({ _id: { $in: itemIds } });
    
    logger.info('Items bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, {
      deletedCount: result.deletedCount
    }, 'Items deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting items:', error);
    return errorResponse(res, error.message);
  }
};

const bulkMoveToTrash = async (req, res) => {
  try {
    logger.info('Bulk moving items to trash');
    
    const { itemIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      errors.push('Item IDs array is required and must not be empty');
    }
    
    if (itemIds && itemIds.length > 100) {
      errors.push('Cannot move more than 100 items at once');
    }
    
    if (itemIds) {
      for (let i = 0; i < itemIds.length; i++) {
        const idError = validateObjectId(itemIds[i], 'Item ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await FileManager.updateMany(
      { _id: { $in: itemIds } },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    
    logger.info('Items bulk moved to trash successfully:', { count: result.modifiedCount });
    return successResponse(res, {
      modifiedCount: result.modifiedCount
    }, 'Items moved to trash successfully');
  } catch (error) {
    logger.error('Error bulk moving items to trash:', error);
    return errorResponse(res, error.message);
  }
};

// Export Items
const exportItems = async (req, res) => {
  try {
    logger.info('Exporting items');
    
    const { format, ownerId, institutionId, type } = req.query;
    
    // Validation
    const errors = [];
    
    const validFormats = ['json', 'csv', 'xlsx'];
    if (!format) {
      errors.push('Format is required');
    } else if (!validFormats.includes(format)) {
      errors.push('Invalid format. Must be one of: ' + validFormats.join(', '));
    }
    
    if (ownerId) {
      const ownerIdError = validateObjectId(ownerId, 'Owner ID', true);
      if (ownerIdError) errors.push(ownerIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID', true);
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (type && !VALID_ITEM_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_ITEM_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = {};
    if (ownerId) filters.ownerId = new mongoose.Types.ObjectId(ownerId);
    if (institutionId) filters.institutionId = new mongoose.Types.ObjectId(institutionId);
    if (type) filters.type = type;
    
    const items = await FileManager.find(filters).lean();
    
    logger.info('Items exported successfully:', { format, count: items.length });
    return successResponse(res, {
      format,
      count: items.length,
      data: items,
      exportedAt: new Date()
    }, 'Items exported successfully');
  } catch (error) {
    logger.error('Error exporting items:', error);
    return errorResponse(res, error.message);
  }
};


export {
  createItem,
  getItemById,
  getAllItems,
  updateItem,
  deleteItem,
  moveToTrash,
  restoreItem,
  toggleFavorite,
  shareItem,
  unshareItem,
  moveItem,
  copyItem,
  getStorageInfo,
  getStatistics,
  getRecentItems,
  searchItems,
  bulkDeleteItems,
  bulkMoveToTrash,
  exportItems
};
