import inventoryService from '../services/inventoryService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_ITEM_CATEGORIES = ['electronics', 'furniture', 'stationery', 'sports', 'laboratory', 'books', 'equipment', 'supplies', 'other'];
const VALID_ITEM_STATUSES = ['available', 'in-use', 'maintenance', 'damaged', 'disposed', 'reserved'];
const VALID_ADJUSTMENT_TYPES = ['purchase', 'sale', 'damage', 'loss', 'return', 'donation', 'transfer', 'correction'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const VALID_SORT_ORDERS = ['asc', 'desc'];

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

const getInstitutionId = (req) => req.user?.schoolId || req.user?.institutionId || req.tenantId;

const createInventoryItem = async (req, res) => {
  try {
    logger.info('Creating inventory item');
    
    const { name, category, quantity, unitPrice, minStockLevel, location, description } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Item name is required');
    } else if (name.length > 200) {
      errors.push('Item name must not exceed 200 characters');
    }
    
    if (category && !VALID_ITEM_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_ITEM_CATEGORIES.join(', '));
    }
    
    if (quantity !== undefined && quantity !== null) {
      const qtyNum = parseInt(quantity);
      if (isNaN(qtyNum) || qtyNum < 0) {
        errors.push('Quantity must be a non-negative number');
      }
    }
    
    if (unitPrice !== undefined && unitPrice !== null) {
      const priceNum = parseFloat(unitPrice);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.push('Unit price must be a non-negative number');
      }
    }
    
    if (minStockLevel !== undefined && minStockLevel !== null) {
      const minNum = parseInt(minStockLevel);
      if (isNaN(minNum) || minNum < 0) {
        errors.push('Minimum stock level must be a non-negative number');
      }
    }
    
    if (location && location.length > 200) {
      errors.push('Location must not exceed 200 characters');
    }
    
    if (description && description.length > 1000) {
      errors.push('Description must not exceed 1000 characters');
    }
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const item = await inventoryService.addItem({
      institutionId: institution,
      ...req.body
    });

    logger.info('Inventory item created successfully:', { itemId: item._id });
    return createdResponse(res, item, 'Inventory item created successfully');
  } catch (error) {
    logger.error('Error creating inventory item:', error);
    return errorResponse(res, error.message);
  }
};


const listInventory = async (req, res) => {
  try {
    logger.info('Fetching inventory items');
    
    const { category, status, page, limit, search, sortBy, sortOrder } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (category && !VALID_ITEM_CATEGORIES.includes(category)) {
      errors.push('Invalid category');
    }
    
    if (status && !VALID_ITEM_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be asc or desc');
    }
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const items = await inventoryService.listItems(institution, req.query);

    logger.info('Inventory items fetched successfully');
    return successResponse(res, items, 'Inventory items retrieved successfully');
  } catch (error) {
    logger.error('Error fetching inventory items:', error);
    return errorResponse(res, error.message);
  }
};


const updateInventoryItem = async (req, res) => {
  try {
    logger.info('Updating inventory item');
    
    const { id } = req.params;
    const { name, category, status, unitPrice, minStockLevel, location } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Item ID');
    if (idError) errors.push(idError);
    
    if (name !== undefined && (!name || name.trim().length === 0)) {
      errors.push('Item name cannot be empty');
    } else if (name && name.length > 200) {
      errors.push('Item name must not exceed 200 characters');
    }
    
    if (category && !VALID_ITEM_CATEGORIES.includes(category)) {
      errors.push('Invalid category');
    }
    
    if (status && !VALID_ITEM_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    if (unitPrice !== undefined && unitPrice !== null) {
      const priceNum = parseFloat(unitPrice);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.push('Unit price must be a non-negative number');
      }
    }
    
    if (minStockLevel !== undefined && minStockLevel !== null) {
      const minNum = parseInt(minStockLevel);
      if (isNaN(minNum) || minNum < 0) {
        errors.push('Minimum stock level must be a non-negative number');
      }
    }
    
    if (location && location.length > 200) {
      errors.push('Location must not exceed 200 characters');
    }
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const item = await inventoryService.updateItem(id, institution, req.body);
    
    if (!item) {
      return notFoundResponse(res, 'Inventory item not found');
    }

    logger.info('Inventory item updated successfully:', { itemId: id });
    return successResponse(res, item, 'Inventory item updated successfully');
  } catch (error) {
    logger.error('Error updating inventory item:', error);
    return errorResponse(res, error.message);
  }
};


const adjustInventory = async (req, res) => {
  try {
    logger.info('Adjusting inventory stock');
    
    const { id } = req.params;
    const { change, reason, adjustmentType } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Item ID');
    if (idError) errors.push(idError);
    
    if (change === undefined || change === null) {
      errors.push('Stock change amount is required');
    } else {
      const changeNum = parseInt(change);
      if (isNaN(changeNum)) {
        errors.push('Stock change must be a valid number');
      }
    }
    
    if (!reason || reason.trim().length === 0) {
      errors.push('Adjustment reason is required');
    } else if (reason.length > 500) {
      errors.push('Reason must not exceed 500 characters');
    }
    
    if (adjustmentType && !VALID_ADJUSTMENT_TYPES.includes(adjustmentType)) {
      errors.push('Invalid adjustment type. Must be one of: ' + VALID_ADJUSTMENT_TYPES.join(', '));
    }
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const item = await inventoryService.adjustStock(
      id,
      institution,
      change,
      reason,
      req.user?.id
    );
    
    if (!item) {
      return notFoundResponse(res, 'Inventory item not found');
    }

    logger.info('Inventory stock adjusted successfully:', { itemId: id, change });
    return successResponse(res, item, 'Stock adjusted successfully');
  } catch (error) {
    logger.error('Error adjusting inventory stock:', error);
    return errorResponse(res, error.message);
  }
};

// Get inventory item by ID
const getInventoryItemById = async (req, res) => {
  try {
    logger.info('Fetching inventory item by ID');
    
    const { id } = req.params;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Item ID');
    if (idError) errors.push(idError);
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const item = await inventoryService.getItemById(id, institution);
    
    if (!item) {
      return notFoundResponse(res, 'Inventory item not found');
    }
    
    logger.info('Inventory item fetched successfully:', { itemId: id });
    return successResponse(res, item, 'Inventory item retrieved successfully');
  } catch (error) {
    logger.error('Error fetching inventory item:', error);
    return errorResponse(res, error.message);
  }
};

// Delete inventory item
const deleteInventoryItem = async (req, res) => {
  try {
    logger.info('Deleting inventory item');
    
    const { id } = req.params;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Item ID');
    if (idError) errors.push(idError);
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const item = await inventoryService.deleteItem(id, institution);
    
    if (!item) {
      return notFoundResponse(res, 'Inventory item not found');
    }
    
    logger.info('Inventory item deleted successfully:', { itemId: id });
    return successResponse(res, null, 'Inventory item deleted successfully');
  } catch (error) {
    logger.error('Error deleting inventory item:', error);
    return errorResponse(res, error.message);
  }
};

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    logger.info('Fetching low stock items');
    
    const { page, limit } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await inventoryService.getLowStockItems(institution, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Low stock items fetched successfully');
    return successResponse(res, result, 'Low stock items retrieved successfully');
  } catch (error) {
    logger.error('Error fetching low stock items:', error);
    return errorResponse(res, error.message);
  }
};

// Get inventory statistics
const getInventoryStatistics = async (req, res) => {
  try {
    logger.info('Fetching inventory statistics');
    
    const institution = getInstitutionId(req);
    
    // Validation
    if (!institution) {
      return validationErrorResponse(res, ['Institution information is required']);
    }
    
    const statistics = await inventoryService.getInventoryStatistics(institution);
    
    logger.info('Inventory statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching inventory statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get stock history
const getStockHistory = async (req, res) => {
  try {
    logger.info('Fetching stock history');
    
    const { id } = req.params;
    const { page, limit, startDate, endDate } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Item ID');
    if (idError) errors.push(idError);
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (startDate) {
      const dateError = validateDate(startDate, 'Start date');
      if (dateError) errors.push(dateError);
    }
    
    if (endDate) {
      const dateError = validateDate(endDate, 'End date');
      if (dateError) errors.push(dateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await inventoryService.getStockHistory(id, institution, {
      page: pageNum,
      limit: limitNum,
      startDate,
      endDate
    });
    
    logger.info('Stock history fetched successfully:', { itemId: id });
    return successResponse(res, result, 'Stock history retrieved successfully');
  } catch (error) {
    logger.error('Error fetching stock history:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update inventory items
const bulkUpdateInventory = async (req, res) => {
  try {
    logger.info('Bulk updating inventory items');
    
    const { itemIds, updates } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      errors.push('Item IDs array is required and must not be empty');
    } else if (itemIds.length > 100) {
      errors.push('Cannot update more than 100 items at once');
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates object is required');
    }
    
    if (updates?.status && !VALID_ITEM_STATUSES.includes(updates.status)) {
      errors.push('Invalid status in updates');
    }
    
    if (updates?.category && !VALID_ITEM_CATEGORIES.includes(updates.category)) {
      errors.push('Invalid category in updates');
    }
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await inventoryService.bulkUpdateItems(itemIds, updates, institution);
    
    logger.info('Bulk inventory update completed:', { count: result.modifiedCount });
    return successResponse(res, { modifiedCount: result.modifiedCount }, 'Items updated successfully');
  } catch (error) {
    logger.error('Error in bulk inventory update:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete inventory items
const bulkDeleteInventory = async (req, res) => {
  try {
    logger.info('Bulk deleting inventory items');
    
    const { itemIds } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      errors.push('Item IDs array is required and must not be empty');
    } else if (itemIds.length > 100) {
      errors.push('Cannot delete more than 100 items at once');
    }
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await inventoryService.bulkDeleteItems(itemIds, institution);
    
    logger.info('Bulk inventory deletion completed:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Items deleted successfully');
  } catch (error) {
    logger.error('Error in bulk inventory deletion:', error);
    return errorResponse(res, error.message);
  }
};

// Export inventory
const exportInventory = async (req, res) => {
  try {
    logger.info('Exporting inventory');
    
    const { format, category, status } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (category && !VALID_ITEM_CATEGORIES.includes(category)) {
      errors.push('Invalid category');
    }
    
    if (status && !VALID_ITEM_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await inventoryService.exportInventory(institution, {
      format: format.toLowerCase(),
      category,
      status
    });
    
    logger.info('Inventory exported successfully:', { format });
    return successResponse(res, exportData, 'Inventory exported successfully');
  } catch (error) {
    logger.error('Error exporting inventory:', error);
    return errorResponse(res, error.message);
  }
};

// Get inventory analytics
const getInventoryAnalytics = async (req, res) => {
  try {
    logger.info('Fetching inventory analytics');
    
    const { groupBy, startDate, endDate } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    const validGroupBy = ['category', 'status', 'month', 'location'];
    if (groupBy && !validGroupBy.includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (startDate) {
      const dateError = validateDate(startDate, 'Start date');
      if (dateError) errors.push(dateError);
    }
    
    if (endDate) {
      const dateError = validateDate(endDate, 'End date');
      if (dateError) errors.push(dateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await inventoryService.getInventoryAnalytics(institution, {
      groupBy: groupBy || 'category',
      startDate,
      endDate
    });
    
    logger.info('Inventory analytics fetched successfully');
    return successResponse(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching inventory analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Get inventory valuation
const getInventoryValuation = async (req, res) => {
  try {
    logger.info('Fetching inventory valuation');
    
    const institution = getInstitutionId(req);
    
    // Validation
    if (!institution) {
      return validationErrorResponse(res, ['Institution information is required']);
    }
    
    const valuation = await inventoryService.getInventoryValuation(institution);
    
    logger.info('Inventory valuation fetched successfully');
    return successResponse(res, valuation, 'Valuation retrieved successfully');
  } catch (error) {
    logger.error('Error fetching inventory valuation:', error);
    return errorResponse(res, error.message);
  }
};

// Generate stock alert report
const generateStockAlertReport = async (req, res) => {
  try {
    logger.info('Generating stock alert report');
    
    const institution = getInstitutionId(req);
    
    // Validation
    if (!institution) {
      return validationErrorResponse(res, ['Institution information is required']);
    }
    
    const report = await inventoryService.generateStockAlertReport(institution);
    
    logger.info('Stock alert report generated successfully');
    return successResponse(res, report, 'Stock alert report generated successfully');
  } catch (error) {
    logger.error('Error generating stock alert report:', error);
    return errorResponse(res, error.message);
  }
};

// Transfer inventory between locations
const transferInventory = async (req, res) => {
  try {
    logger.info('Transferring inventory');
    
    const { id } = req.params;
    const { fromLocation, toLocation, quantity, reason } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Item ID');
    if (idError) errors.push(idError);
    
    if (!fromLocation || fromLocation.trim().length === 0) {
      errors.push('From location is required');
    } else if (fromLocation.length > 200) {
      errors.push('From location must not exceed 200 characters');
    }
    
    if (!toLocation || toLocation.trim().length === 0) {
      errors.push('To location is required');
    } else if (toLocation.length > 200) {
      errors.push('To location must not exceed 200 characters');
    }
    
    if (quantity === undefined || quantity === null) {
      errors.push('Quantity is required');
    } else {
      const qtyNum = parseInt(quantity);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        errors.push('Quantity must be a positive number');
      }
    }
    
    if (reason && reason.length > 500) {
      errors.push('Reason must not exceed 500 characters');
    }
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await inventoryService.transferInventory(id, institution, {
      fromLocation,
      toLocation,
      quantity,
      reason,
      transferredBy: req.user?.id
    });
    
    if (!result) {
      return notFoundResponse(res, 'Inventory item not found');
    }
    
    logger.info('Inventory transferred successfully:', { itemId: id });
    return successResponse(res, result, 'Inventory transferred successfully');
  } catch (error) {
    logger.error('Error transferring inventory:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createInventoryItem,
  listInventory,
  updateInventoryItem,
  adjustInventory,
  getInventoryItemById,
  deleteInventoryItem,
  getLowStockItems,
  getInventoryStatistics,
  getStockHistory,
  bulkUpdateInventory,
  bulkDeleteInventory,
  exportInventory,
  getInventoryAnalytics,
  getInventoryValuation,
  generateStockAlertReport,
  transferInventory
};
