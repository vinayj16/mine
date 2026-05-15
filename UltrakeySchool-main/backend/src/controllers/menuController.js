import * as menuService from '../services/menuService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse, unauthorizedResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_MENU_ITEM_TYPES = ['link', 'dropdown', 'divider', 'action'];
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

const getMenuForRole = async (req, res) => {
  try {
    logger.info('Fetching menu for role');
    
    const { roleId } = req.params;
    const { schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.getMenuForRole(roleId, schoolId);
    
    if (!menu) {
      return notFoundResponse(res, 'Menu not found for this role');
    }
    
    logger.info('Menu fetched successfully for role:', { roleId });
    return successResponse(res, menu, 'Menu retrieved successfully');
  } catch (error) {
    logger.error('Error fetching menu for role:', error);
    return errorResponse(res, error.message);
  }
};

const getMenuForUser = async (req, res) => {
  try {
    logger.info('Fetching menu for user');
    
    const { userId } = req.params;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.getMenuForUser(userId);
    
    if (!menu) {
      return notFoundResponse(res, 'Menu not found for this user');
    }
    
    logger.info('Menu fetched successfully for user:', { userId });
    return successResponse(res, menu, 'Menu retrieved successfully');
  } catch (error) {
    logger.error('Error fetching menu for user:', error);
    return errorResponse(res, error.message);
  }
};

const getMyMenu = async (req, res) => {
  try {
    logger.info('Fetching menu for current user');
    
    const userId = req.user?.id;
    
    if (!userId) {
      return unauthorizedResponse(res, 'User authentication required');
    }
    
    const menu = await menuService.getMenuForUser(userId);
    
    if (!menu) {
      return notFoundResponse(res, 'Menu not found');
    }
    
    logger.info('Menu fetched successfully for current user');
    return successResponse(res, menu, 'Menu retrieved successfully');
  } catch (error) {
    logger.error('Error fetching menu for current user:', error);
    return errorResponse(res, error.message);
  }
};


const createDefaultMenuForRole = async (req, res) => {
  try {
    logger.info('Creating default menu for role');
    
    const { roleId } = req.params;
    const { schoolId } = req.body;
    
    // Validation
    const errors = [];
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.createDefaultMenuForRole(roleId, schoolId);
    
    logger.info('Default menu created successfully for role:', { roleId });
    return createdResponse(res, menu, 'Default menu created successfully');
  } catch (error) {
    logger.error('Error creating default menu:', error);
    return errorResponse(res, error.message);
  }
};

const updateMenuForRole = async (req, res) => {
  try {
    logger.info('Updating menu for role');
    
    const { roleId } = req.params;
    const { schoolId } = req.query;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!req.body || typeof req.body !== 'object') {
      errors.push('Menu data is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.updateMenuForRole(roleId, schoolId, req.body, userId);
    
    if (!menu) {
      return notFoundResponse(res, 'Menu not found');
    }
    
    logger.info('Menu updated successfully for role:', { roleId });
    return successResponse(res, menu, 'Menu updated successfully');
  } catch (error) {
    logger.error('Error updating menu:', error);
    return errorResponse(res, error.message);
  }
};

const addCustomMenuItem = async (req, res) => {
  try {
    logger.info('Adding custom menu item');
    
    const { roleId } = req.params;
    const { schoolId } = req.query;
    const { label, path, icon, type } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!label || label.trim().length === 0) {
      errors.push('Menu item label is required');
    } else if (label.length > 100) {
      errors.push('Label must not exceed 100 characters');
    }
    
    if (!path || path.trim().length === 0) {
      errors.push('Menu item path is required');
    } else if (path.length > 200) {
      errors.push('Path must not exceed 200 characters');
    }
    
    if (type && !VALID_MENU_ITEM_TYPES.includes(type)) {
      errors.push('Invalid menu item type. Must be one of: ' + VALID_MENU_ITEM_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.addCustomMenuItem(roleId, schoolId, req.body, userId);
    
    logger.info('Custom menu item added successfully:', { roleId });
    return successResponse(res, menu, 'Menu item added successfully');
  } catch (error) {
    logger.error('Error adding custom menu item:', error);
    return errorResponse(res, error.message);
  }
};

const removeCustomMenuItem = async (req, res) => {
  try {
    logger.info('Removing custom menu item');
    
    const { roleId, menuItemPath } = req.params;
    const { schoolId } = req.query;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!menuItemPath || menuItemPath.trim().length === 0) {
      errors.push('Menu item path is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.removeCustomMenuItem(roleId, schoolId, menuItemPath, userId);
    
    if (!menu) {
      return notFoundResponse(res, 'Menu or menu item not found');
    }
    
    logger.info('Custom menu item removed successfully:', { roleId, menuItemPath });
    return successResponse(res, menu, 'Menu item removed successfully');
  } catch (error) {
    logger.error('Error removing custom menu item:', error);
    return errorResponse(res, error.message);
  }
};

const hideMenuItem = async (req, res) => {
  try {
    logger.info('Hiding menu item');
    
    const { roleId } = req.params;
    const { schoolId, menuItemPath } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!menuItemPath || menuItemPath.trim().length === 0) {
      errors.push('Menu item path is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.hideMenuItem(roleId, schoolId, menuItemPath, userId);
    
    if (!menu) {
      return notFoundResponse(res, 'Menu or menu item not found');
    }
    
    logger.info('Menu item hidden successfully:', { roleId, menuItemPath });
    return successResponse(res, menu, 'Menu item hidden successfully');
  } catch (error) {
    logger.error('Error hiding menu item:', error);
    return errorResponse(res, error.message);
  }
};

const showMenuItem = async (req, res) => {
  try {
    logger.info('Showing menu item');
    
    const { roleId } = req.params;
    const { schoolId, menuItemPath } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!menuItemPath || menuItemPath.trim().length === 0) {
      errors.push('Menu item path is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.showMenuItem(roleId, schoolId, menuItemPath, userId);
    
    if (!menu) {
      return notFoundResponse(res, 'Menu or menu item not found');
    }
    
    logger.info('Menu item shown successfully:', { roleId, menuItemPath });
    return successResponse(res, menu, 'Menu item shown successfully');
  } catch (error) {
    logger.error('Error showing menu item:', error);
    return errorResponse(res, error.message);
  }
};

const reorderMenuSections = async (req, res) => {
  try {
    logger.info('Reordering menu sections');
    
    const { roleId } = req.params;
    const { schoolId, sectionOrders } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!sectionOrders || !Array.isArray(sectionOrders)) {
      errors.push('Section orders must be an array');
    } else if (sectionOrders.length === 0) {
      errors.push('Section orders array cannot be empty');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.reorderMenuSections(roleId, schoolId, sectionOrders, userId);
    
    if (!menu) {
      return notFoundResponse(res, 'Menu not found');
    }
    
    logger.info('Menu sections reordered successfully:', { roleId });
    return successResponse(res, menu, 'Menu sections reordered successfully');
  } catch (error) {
    logger.error('Error reordering menu sections:', error);
    return errorResponse(res, error.message);
  }
};

const addQuickAction = async (req, res) => {
  try {
    logger.info('Adding quick action');
    
    const { roleId } = req.params;
    const { schoolId } = req.query;
    const { label, action } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!label || label.trim().length === 0) {
      errors.push('Quick action label is required');
    } else if (label.length > 100) {
      errors.push('Label must not exceed 100 characters');
    }
    
    if (!action || action.trim().length === 0) {
      errors.push('Quick action is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.addQuickAction(roleId, schoolId, req.body, userId);
    
    logger.info('Quick action added successfully:', { roleId });
    return successResponse(res, menu, 'Quick action added successfully');
  } catch (error) {
    logger.error('Error adding quick action:', error);
    return errorResponse(res, error.message);
  }
};

const removeQuickAction = async (req, res) => {
  try {
    logger.info('Removing quick action');
    
    const { roleId, actionId } = req.params;
    const { schoolId } = req.query;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!actionId || actionId.trim().length === 0) {
      errors.push('Action ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.removeQuickAction(roleId, schoolId, actionId, userId);
    
    if (!menu) {
      return notFoundResponse(res, 'Menu or quick action not found');
    }
    
    logger.info('Quick action removed successfully:', { roleId, actionId });
    return successResponse(res, menu, 'Quick action removed successfully');
  } catch (error) {
    logger.error('Error removing quick action:', error);
    return errorResponse(res, error.message);
  }
};

const resetMenuToDefault = async (req, res) => {
  try {
    logger.info('Resetting menu to default');
    
    const { roleId } = req.params;
    const { schoolId } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.resetMenuToDefault(roleId, schoolId, userId);
    
    if (!menu) {
      return notFoundResponse(res, 'Menu not found');
    }
    
    logger.info('Menu reset to default successfully:', { roleId });
    return successResponse(res, menu, 'Menu reset to default successfully');
  } catch (error) {
    logger.error('Error resetting menu to default:', error);
    return errorResponse(res, error.message);
  }
};

// Get all menus
const getAllMenus = async (req, res) => {
  try {
    logger.info('Fetching all menus');
    
    const { schoolId, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
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
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await menuService.getAllMenus(schoolId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('All menus fetched successfully');
    return successResponse(res, result, 'Menus retrieved successfully');
  } catch (error) {
    logger.error('Error fetching all menus:', error);
    return errorResponse(res, error.message);
  }
};

// Clone menu from one role to another
const cloneMenu = async (req, res) => {
  try {
    logger.info('Cloning menu');
    
    const { sourceRoleId, targetRoleId, schoolId } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const sourceRoleIdError = validateObjectId(sourceRoleId, 'Source Role ID');
    if (sourceRoleIdError) errors.push(sourceRoleIdError);
    
    const targetRoleIdError = validateObjectId(targetRoleId, 'Target Role ID');
    if (targetRoleIdError) errors.push(targetRoleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (sourceRoleId === targetRoleId) {
      errors.push('Source and target roles cannot be the same');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.cloneMenu(sourceRoleId, targetRoleId, schoolId, userId);
    
    logger.info('Menu cloned successfully:', { sourceRoleId, targetRoleId });
    return createdResponse(res, menu, 'Menu cloned successfully');
  } catch (error) {
    logger.error('Error cloning menu:', error);
    return errorResponse(res, error.message);
  }
};

// Export menu configuration
const exportMenuConfig = async (req, res) => {
  try {
    logger.info('Exporting menu configuration');
    
    const { roleId } = req.params;
    const { schoolId, format } = req.query;
    
    // Validation
    const errors = [];
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await menuService.exportMenuConfig(roleId, schoolId, format.toLowerCase());
    
    logger.info('Menu configuration exported successfully:', { roleId, format });
    return successResponse(res, exportData, 'Menu configuration exported successfully');
  } catch (error) {
    logger.error('Error exporting menu configuration:', error);
    return errorResponse(res, error.message);
  }
};

// Import menu configuration
const importMenuConfig = async (req, res) => {
  try {
    logger.info('Importing menu configuration');
    
    const { roleId } = req.params;
    const { schoolId, menuConfig } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!menuConfig || typeof menuConfig !== 'object') {
      errors.push('Menu configuration is required and must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menu = await menuService.importMenuConfig(roleId, schoolId, menuConfig, userId);
    
    logger.info('Menu configuration imported successfully:', { roleId });
    return successResponse(res, menu, 'Menu configuration imported successfully');
  } catch (error) {
    logger.error('Error importing menu configuration:', error);
    return errorResponse(res, error.message);
  }
};

// Get menu statistics
const getMenuStatistics = async (req, res) => {
  try {
    logger.info('Fetching menu statistics');
    
    const { schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await menuService.getMenuStatistics(schoolId);
    
    logger.info('Menu statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching menu statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Validate menu structure
const validateMenuStructure = async (req, res) => {
  try {
    logger.info('Validating menu structure');
    
    const { menuConfig } = req.body;
    
    // Validation
    const errors = [];
    
    if (!menuConfig || typeof menuConfig !== 'object') {
      errors.push('Menu configuration is required and must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const validation = await menuService.validateMenuStructure(menuConfig);
    
    logger.info('Menu structure validated');
    return successResponse(res, validation, 'Menu structure validated successfully');
  } catch (error) {
    logger.error('Error validating menu structure:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getMenuForRole,
  getMenuForUser,
  getMyMenu,
  createDefaultMenuForRole,
  updateMenuForRole,
  addCustomMenuItem,
  removeCustomMenuItem,
  hideMenuItem,
  showMenuItem,
  reorderMenuSections,
  addQuickAction,
  removeQuickAction,
  resetMenuToDefault,
  getAllMenus,
  cloneMenu,
  exportMenuConfig,
  importMenuConfig,
  getMenuStatistics,
  validateMenuStructure
};
