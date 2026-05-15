import sidebarService from '../services/sidebarService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const MAX_RECENT_ITEMS = 20;
const MAX_BOOKMARKS = 50;
const MAX_QUICK_ACTIONS = 20;
const MAX_LABEL_LENGTH = 100;
const MAX_URL_LENGTH = 500;

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

// Get user preferences
const getUserPreferences = async (req, res) => {
  try {
    logger.info('Fetching user preferences');
    
    const { userId, schoolId } = req.user;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.getUserPreferences(userId, schoolId);
    
    logger.info('User preferences fetched successfully:', { userId });
    return successResponse(res, preferences, 'Preferences retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user preferences:', error);
    return errorResponse(res, error.message);
  }
};

// Update preferences
const updatePreferences = async (req, res) => {
  try {
    logger.info('Updating preferences');
    
    const { userId, schoolId } = req.user;
    const updates = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.updatePreferences(userId, schoolId, updates);
    
    logger.info('Preferences updated successfully:', { userId });
    return successResponse(res, preferences, 'Preferences updated successfully');
  } catch (error) {
    logger.error('Error updating preferences:', error);
    return errorResponse(res, error.message);
  }
};

// Toggle collapsed
const toggleCollapsed = async (req, res) => {
  try {
    logger.info('Toggling sidebar collapsed state');
    
    const { userId, schoolId } = req.user;
    const { isCollapsed } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (isCollapsed === undefined || isCollapsed === null) {
      errors.push('isCollapsed field is required');
    } else if (typeof isCollapsed !== 'boolean') {
      errors.push('isCollapsed must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.toggleCollapsed(userId, schoolId, isCollapsed);
    
    logger.info('Sidebar state updated successfully:', { userId, isCollapsed });
    return successResponse(res, preferences, 'Sidebar state updated');
  } catch (error) {
    logger.error('Error toggling sidebar state:', error);
    return errorResponse(res, error.message);
  }
};

// Add recent item
const addRecentItem = async (req, res) => {
  try {
    logger.info('Adding recent item');
    
    const { userId, schoolId } = req.user;
    const item = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!item || typeof item !== 'object') {
      errors.push('Item must be an object');
    } else {
      if (!item.label || item.label.trim().length === 0) {
        errors.push('Item label is required');
      } else if (item.label.length > MAX_LABEL_LENGTH) {
        errors.push('Label must not exceed ' + MAX_LABEL_LENGTH + ' characters');
      }
      
      if (!item.url || item.url.trim().length === 0) {
        errors.push('Item URL is required');
      } else if (item.url.length > MAX_URL_LENGTH) {
        errors.push('URL must not exceed ' + MAX_URL_LENGTH + ' characters');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.addRecentItem(userId, schoolId, item);
    
    logger.info('Recent item added successfully:', { userId });
    return successResponse(res, preferences.recentItems, 'Recent item added');
  } catch (error) {
    logger.error('Error adding recent item:', error);
    return errorResponse(res, error.message);
  }
};

// Clear recent items
const clearRecentItems = async (req, res) => {
  try {
    logger.info('Clearing recent items');
    
    const { userId, schoolId } = req.user;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.clearRecentItems(userId, schoolId);
    
    logger.info('Recent items cleared successfully:', { userId });
    return successResponse(res, preferences, 'Recent items cleared');
  } catch (error) {
    logger.error('Error clearing recent items:', error);
    return errorResponse(res, error.message);
  }
};

// Add bookmark
const addBookmark = async (req, res) => {
  try {
    logger.info('Adding bookmark');
    
    const { userId, schoolId } = req.user;
    const bookmark = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!bookmark || typeof bookmark !== 'object') {
      errors.push('Bookmark must be an object');
    } else {
      if (!bookmark.label || bookmark.label.trim().length === 0) {
        errors.push('Bookmark label is required');
      } else if (bookmark.label.length > MAX_LABEL_LENGTH) {
        errors.push('Label must not exceed ' + MAX_LABEL_LENGTH + ' characters');
      }
      
      if (!bookmark.url || bookmark.url.trim().length === 0) {
        errors.push('Bookmark URL is required');
      } else if (bookmark.url.length > MAX_URL_LENGTH) {
        errors.push('URL must not exceed ' + MAX_URL_LENGTH + ' characters');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.addBookmark(userId, schoolId, bookmark);
    
    logger.info('Bookmark added successfully:', { userId });
    return successResponse(res, preferences.bookmarks, 'Bookmark added');
  } catch (error) {
    logger.error('Error adding bookmark:', error);
    return errorResponse(res, error.message);
  }
};

// Remove bookmark
const removeBookmark = async (req, res) => {
  try {
    logger.info('Removing bookmark');
    
    const { userId, schoolId } = req.user;
    const { bookmarkId } = req.params;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!bookmarkId || bookmarkId.trim().length === 0) {
      errors.push('Bookmark ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.removeBookmark(userId, schoolId, bookmarkId);
    
    logger.info('Bookmark removed successfully:', { userId, bookmarkId });
    return successResponse(res, preferences.bookmarks, 'Bookmark removed');
  } catch (error) {
    logger.error('Error removing bookmark:', error);
    return errorResponse(res, error.message);
  }
};

// Update bookmark order
const updateBookmarkOrder = async (req, res) => {
  try {
    logger.info('Updating bookmark order');
    
    const { userId, schoolId } = req.user;
    const { bookmarks } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!bookmarks || !Array.isArray(bookmarks)) {
      errors.push('Bookmarks must be an array');
    } else if (bookmarks.length > MAX_BOOKMARKS) {
      errors.push('Cannot have more than ' + MAX_BOOKMARKS + ' bookmarks');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.updateBookmarkOrder(userId, schoolId, bookmarks);
    
    logger.info('Bookmark order updated successfully:', { userId });
    return successResponse(res, preferences.bookmarks, 'Bookmark order updated');
  } catch (error) {
    logger.error('Error updating bookmark order:', error);
    return errorResponse(res, error.message);
  }
};

// Get sidebar data
const getSidebarData = async (req, res) => {
  try {
    logger.info('Fetching sidebar data');
    
    const { userId, schoolId, role } = req.user;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const data = await sidebarService.getSidebarData(userId, schoolId, role);
    
    logger.info('Sidebar data fetched successfully:', { userId });
    return successResponse(res, data, 'Sidebar data retrieved successfully');
  } catch (error) {
    logger.error('Error fetching sidebar data:', error);
    return errorResponse(res, error.message);
  }
};

// Reset preferences
const resetPreferences = async (req, res) => {
  try {
    logger.info('Resetting preferences');
    
    const { userId, schoolId } = req.user;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.resetPreferences(userId, schoolId);
    
    logger.info('Preferences reset successfully:', { userId });
    return successResponse(res, preferences, 'Preferences reset to defaults');
  } catch (error) {
    logger.error('Error resetting preferences:', error);
    return errorResponse(res, error.message);
  }
};

// Export preferences
const exportPreferences = async (req, res) => {
  try {
    logger.info('Exporting preferences');
    
    const { userId, schoolId } = req.user;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.exportPreferences(userId, schoolId);
    
    logger.info('Preferences exported successfully:', { userId });
    return successResponse(res, preferences, 'Preferences exported successfully');
  } catch (error) {
    logger.error('Error exporting preferences:', error);
    return errorResponse(res, error.message);
  }
};

// Import preferences
const importPreferences = async (req, res) => {
  try {
    logger.info('Importing preferences');
    
    const { userId, schoolId } = req.user;
    const preferencesData = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!preferencesData || typeof preferencesData !== 'object') {
      errors.push('Preferences data must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.importPreferences(userId, schoolId, preferencesData);
    
    logger.info('Preferences imported successfully:', { userId });
    return successResponse(res, preferences, 'Preferences imported successfully');
  } catch (error) {
    logger.error('Error importing preferences:', error);
    return errorResponse(res, error.message);
  }
};

// Menu customization functions
export const hideMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    // Mock implementation
    return successResponse(res, { hidden: true }, 'Menu item hidden successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const showMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    // Mock implementation
    return successResponse(res, { hidden: false }, 'Menu item shown successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getMenuCustomization = async (req, res) => {
  try {
    // Mock implementation
    return successResponse(res, { menu: [] }, 'Menu customization retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateMenuCustomization = async (req, res) => {
  try {
    const customization = req.body;
    // Mock implementation
    return successResponse(res, customization, 'Menu customization updated successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const addCustomMenuItem = async (req, res) => {
  try {
    const menuItem = req.body;
    // Mock implementation
    return successResponse(res, menuItem, 'Custom menu item added successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const removeCustomMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    // Mock implementation
    return successResponse(res, { deleted: true }, 'Custom menu item removed successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateMenuItemVisibility = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { visible } = req.body;
    // Mock implementation
    return successResponse(res, { visible }, 'Menu item visibility updated successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// Add quick action
const addQuickAction = async (req, res) => {
  try {
    logger.info('Adding quick action');
    
    const { userId, schoolId } = req.user;
    const action = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!action || typeof action !== 'object') {
      errors.push('Action must be an object');
    } else {
      if (!action.label || action.label.trim().length === 0) {
        errors.push('Action label is required');
      } else if (action.label.length > MAX_LABEL_LENGTH) {
        errors.push('Label must not exceed ' + MAX_LABEL_LENGTH + ' characters');
      }
      
      if (!action.icon || action.icon.trim().length === 0) {
        errors.push('Action icon is required');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.addQuickAction(userId, schoolId, action);
    
    logger.info('Quick action added successfully:', { userId });
    return successResponse(res, preferences.quickActions, 'Quick action added');
  } catch (error) {
    logger.error('Error adding quick action:', error);
    return errorResponse(res, error.message);
  }
};

// Remove quick action
const removeQuickAction = async (req, res) => {
  try {
    logger.info('Removing quick action');
    
    const { userId, schoolId } = req.user;
    const { actionId } = req.params;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!actionId || actionId.trim().length === 0) {
      errors.push('Action ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.removeQuickAction(userId, schoolId, actionId);
    
    logger.info('Quick action removed successfully:', { userId, actionId });
    return successResponse(res, preferences.quickActions, 'Quick action removed');
  } catch (error) {
    logger.error('Error removing quick action:', error);
    return errorResponse(res, error.message);
  }
};

// Toggle quick action
const toggleQuickAction = async (req, res) => {
  try {
    logger.info('Toggling quick action');
    
    const { userId, schoolId } = req.user;
    const { actionId } = req.params;
    const { enabled } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!actionId || actionId.trim().length === 0) {
      errors.push('Action ID is required');
    }
    
    if (enabled === undefined || enabled === null) {
      errors.push('Enabled field is required');
    } else if (typeof enabled !== 'boolean') {
      errors.push('Enabled must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.toggleQuickAction(userId, schoolId, actionId, enabled);
    
    logger.info('Quick action toggled successfully:', { userId, actionId, enabled });
    return successResponse(res, preferences.quickActions, 'Quick action toggled');
  } catch (error) {
    logger.error('Error toggling quick action:', error);
    return errorResponse(res, error.message);
  }
};

// Update quick action order
const updateQuickActionOrder = async (req, res) => {
  try {
    logger.info('Updating quick action order');
    
    const { userId, schoolId } = req.user;
    const { quickActions } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!quickActions || !Array.isArray(quickActions)) {
      errors.push('Quick actions must be an array');
    } else if (quickActions.length > MAX_QUICK_ACTIONS) {
      errors.push('Cannot have more than ' + MAX_QUICK_ACTIONS + ' quick actions');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.updateQuickActionOrder(userId, schoolId, quickActions);
    
    logger.info('Quick action order updated successfully:', { userId });
    return successResponse(res, preferences.quickActions, 'Quick action order updated');
  } catch (error) {
    logger.error('Error updating quick action order:', error);
    return errorResponse(res, error.message);
  }
};

// Update expanded menus
const updateExpandedMenus = async (req, res) => {
  try {
    logger.info('Updating expanded menus');
    
    const { userId, schoolId } = req.user;
    const { expandedMenus } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!expandedMenus || !Array.isArray(expandedMenus)) {
      errors.push('Expanded menus must be an array');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await sidebarService.updateExpandedMenus(userId, schoolId, expandedMenus);
    
    logger.info('Expanded menus updated successfully:', { userId });
    return successResponse(res, preferences, 'Expanded menus updated');
  } catch (error) {
    logger.error('Error updating expanded menus:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getUserPreferences,
  updatePreferences,
  toggleCollapsed,
  addRecentItem,
  clearRecentItems,
  addBookmark,
  removeBookmark,
  updateBookmarkOrder,
  addQuickAction,
  removeQuickAction,
  toggleQuickAction,
  updateQuickActionOrder,
  updateExpandedMenus,
  getSidebarData,
  resetPreferences,
  exportPreferences,
  importPreferences,
  hideMenuItem,
  showMenuItem,
  getMenuCustomization,
  updateMenuCustomization,
  addCustomMenuItem,
  removeCustomMenuItem,
  updateMenuItemVisibility
};
