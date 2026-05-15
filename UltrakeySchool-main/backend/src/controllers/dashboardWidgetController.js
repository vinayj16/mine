import dashboardWidgetService from '../services/dashboardWidgetService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid widget types
const VALID_WIDGET_TYPES = ['chart', 'stats', 'table', 'calendar', 'list', 'card', 'graph', 'progress', 'timeline'];

// Valid widget sizes
const VALID_WIDGET_SIZES = ['small', 'medium', 'large', 'full'];

// Valid user roles
const VALID_ROLES = ['student', 'teacher', 'parent', 'admin', 'principal', 'superadmin', 'staff'];

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { field: fieldName, message: 'Invalid ' + fieldName + ' format' } };
  }
  return { valid: true };
};

/**
 * Validate position object
 */
const validatePosition = (position) => {
  if (!position || typeof position !== 'object') {
    return false;
  }
  if (typeof position.x !== 'number' || typeof position.y !== 'number') {
    return false;
  }
  if (position.x < 0 || position.y < 0 || position.x > 100 || position.y > 100) {
    return false;
  }
  return true;
};

/**
 * Create widget
 */
const createWidget = async (req, res) => {
  try {
    const { type, title, size, position, config } = req.body;
    const userId = req.user?.id;
    const institution = req.user?.institution;

    // Validate required fields
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    } else {
      const validation = validateObjectId(userId, 'userId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (!type) {
      errors.push({ field: 'type', message: 'Widget type is required' });
    } else if (!VALID_WIDGET_TYPES.includes(type)) {
      errors.push({ field: 'type', message: 'Widget type must be one of: ' + VALID_WIDGET_TYPES.join(', ') });
    }
    if (!title || title.trim().length < 2) {
      errors.push({ field: 'title', message: 'Widget title is required and must be at least 2 characters' });
    } else if (title.length > 100) {
      errors.push({ field: 'title', message: 'Widget title cannot exceed 100 characters' });
    }
    if (size && !VALID_WIDGET_SIZES.includes(size)) {
      errors.push({ field: 'size', message: 'Widget size must be one of: ' + VALID_WIDGET_SIZES.join(', ') });
    }
    if (position && !validatePosition(position)) {
      errors.push({ field: 'position', message: 'Invalid position format (x and y must be 0-100)' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Creating widget: ' + title + ' for user: ' + userId);
    const widget = await dashboardWidgetService.createWidget(userId, req.body, institution);

    return createdResponse(res, widget, 'Widget created successfully');
  } catch (error) {
    logger.error('Error creating widget:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get user widgets
 */
const getUserWidgets = async (req, res) => {
  try {
    const userId = req.user?.id;
    const institution = req.user?.institution;

    // Validate userId
    if (!userId) {
      return validationErrorResponse(res, [{ field: 'userId', message: 'User ID is required' }]);
    }

    const validation = validateObjectId(userId, 'userId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Fetching widgets for user: ' + userId);
    const widgets = await dashboardWidgetService.getUserWidgets(userId, institution);

    return successResponse(res, widgets, 'Widgets fetched successfully');
  } catch (error) {
    logger.error('Error fetching widgets:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get widget by ID
 */
const getWidgetById = async (req, res) => {
  try {
    const { widgetId } = req.params;
    const userId = req.user?.id;
    const institution = req.user?.institution;

    // Validate IDs
    const errors = [];
    const widgetValidation = validateObjectId(widgetId, 'widgetId');
    if (!widgetValidation.valid) {
      errors.push(widgetValidation.error);
    }
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    } else {
      const userValidation = validateObjectId(userId, 'userId');
      if (!userValidation.valid) {
        errors.push(userValidation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching widget by ID: ' + widgetId);
    const widget = await dashboardWidgetService.getWidgetById(widgetId, userId, institution);

    if (!widget) {
      return notFoundResponse(res, 'Widget not found');
    }

    return successResponse(res, widget, 'Widget fetched successfully');
  } catch (error) {
    logger.error('Error fetching widget:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update widget
 */
const updateWidget = async (req, res) => {
  try {
    const { widgetId } = req.params;
    const { type, title, size, config } = req.body;
    const userId = req.user?.id;
    const institution = req.user?.institution;

    // Validate IDs
    const errors = [];
    const widgetValidation = validateObjectId(widgetId, 'widgetId');
    if (!widgetValidation.valid) {
      errors.push(widgetValidation.error);
    }
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }

    // Validate fields if provided
    if (type && !VALID_WIDGET_TYPES.includes(type)) {
      errors.push({ field: 'type', message: 'Widget type must be one of: ' + VALID_WIDGET_TYPES.join(', ') });
    }
    if (title && title.trim().length < 2) {
      errors.push({ field: 'title', message: 'Widget title must be at least 2 characters' });
    } else if (title && title.length > 100) {
      errors.push({ field: 'title', message: 'Widget title cannot exceed 100 characters' });
    }
    if (size && !VALID_WIDGET_SIZES.includes(size)) {
      errors.push({ field: 'size', message: 'Widget size must be one of: ' + VALID_WIDGET_SIZES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Updating widget: ' + widgetId);
    const widget = await dashboardWidgetService.updateWidget(widgetId, userId, req.body, institution);

    if (!widget) {
      return notFoundResponse(res, 'Widget not found');
    }

    return successResponse(res, widget, 'Widget updated successfully');
  } catch (error) {
    logger.error('Error updating widget:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Delete widget
 */
const deleteWidget = async (req, res) => {
  try {
    const { widgetId } = req.params;
    const userId = req.user?.id;
    const institution = req.user?.institution;

    // Validate IDs
    const errors = [];
    const widgetValidation = validateObjectId(widgetId, 'widgetId');
    if (!widgetValidation.valid) {
      errors.push(widgetValidation.error);
    }
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Deleting widget: ' + widgetId);
    const result = await dashboardWidgetService.deleteWidget(widgetId, userId, institution);

    if (!result) {
      return notFoundResponse(res, 'Widget not found');
    }

    return successResponse(res, null, 'Widget deleted successfully');
  } catch (error) {
    logger.error('Error deleting widget:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update widget position
 */
const updateWidgetPosition = async (req, res) => {
  try {
    const { widgetId } = req.params;
    const { position } = req.body;
    const userId = req.user?.id;
    const institution = req.user?.institution;

    // Validate IDs and position
    const errors = [];
    const widgetValidation = validateObjectId(widgetId, 'widgetId');
    if (!widgetValidation.valid) {
      errors.push(widgetValidation.error);
    }
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }
    if (!position) {
      errors.push({ field: 'position', message: 'Position is required' });
    } else if (!validatePosition(position)) {
      errors.push({ field: 'position', message: 'Invalid position format (x and y must be 0-100)' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Updating widget position: ' + widgetId);
    const widget = await dashboardWidgetService.updateWidgetPosition(widgetId, userId, position, institution);

    if (!widget) {
      return notFoundResponse(res, 'Widget not found');
    }

    return successResponse(res, widget, 'Widget position updated successfully');
  } catch (error) {
    logger.error('Error updating widget position:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update widget size
 */
const updateWidgetSize = async (req, res) => {
  try {
    const { widgetId } = req.params;
    const { size } = req.body;
    const userId = req.user?.id;
    const institution = req.user?.institution;

    // Validate IDs and size
    const errors = [];
    const widgetValidation = validateObjectId(widgetId, 'widgetId');
    if (!widgetValidation.valid) {
      errors.push(widgetValidation.error);
    }
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }
    if (!size) {
      errors.push({ field: 'size', message: 'Size is required' });
    } else if (!VALID_WIDGET_SIZES.includes(size)) {
      errors.push({ field: 'size', message: 'Widget size must be one of: ' + VALID_WIDGET_SIZES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Updating widget size: ' + widgetId);
    const widget = await dashboardWidgetService.updateWidgetSize(widgetId, userId, size, institution);

    if (!widget) {
      return notFoundResponse(res, 'Widget not found');
    }

    return successResponse(res, widget, 'Widget size updated successfully');
  } catch (error) {
    logger.error('Error updating widget size:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Reorder widgets
 */
const reorderWidgets = async (req, res) => {
  try {
    const { widgetOrders } = req.body;
    const userId = req.user?.id;
    const institution = req.user?.institution;

    // Validate widgetOrders
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }
    if (!widgetOrders || !Array.isArray(widgetOrders) || widgetOrders.length === 0) {
      errors.push({ field: 'widgetOrders', message: 'widgetOrders must be a non-empty array' });
    } else if (widgetOrders.length > 50) {
      errors.push({ field: 'widgetOrders', message: 'Maximum 50 widgets allowed per request' });
    } else {
      widgetOrders.forEach((order, index) => {
        if (!order.widgetId || !mongoose.Types.ObjectId.isValid(order.widgetId)) {
          errors.push({ field: 'widgetOrders[' + index + '].widgetId', message: 'Invalid widget ID' });
        }
        if (typeof order.order !== 'number' || order.order < 0) {
          errors.push({ field: 'widgetOrders[' + index + '].order', message: 'Order must be a non-negative number' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Reordering ' + widgetOrders.length + ' widgets');
    await dashboardWidgetService.reorderWidgets(userId, widgetOrders, institution);

    return successResponse(res, null, 'Widgets reordered successfully');
  } catch (error) {
    logger.error('Error reordering widgets:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Toggle widget visibility
 */
const toggleWidgetVisibility = async (req, res) => {
  try {
    const { widgetId } = req.params;
    const userId = req.user?.id;
    const institution = req.user?.institution;

    // Validate IDs
    const errors = [];
    const widgetValidation = validateObjectId(widgetId, 'widgetId');
    if (!widgetValidation.valid) {
      errors.push(widgetValidation.error);
    }
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Toggling widget visibility: ' + widgetId);
    const widget = await dashboardWidgetService.toggleWidgetVisibility(widgetId, userId, institution);

    if (!widget) {
      return notFoundResponse(res, 'Widget not found');
    }

    return successResponse(res, widget, 'Widget visibility toggled successfully');
  } catch (error) {
    logger.error('Error toggling widget visibility:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get widget data
 */
const getWidgetData = async (req, res) => {
  try {
    const { widgetId } = req.params;
    const userId = req.user?.id;
    const institution = req.user?.institution;

    // Validate IDs
    const errors = [];
    const widgetValidation = validateObjectId(widgetId, 'widgetId');
    if (!widgetValidation.valid) {
      errors.push(widgetValidation.error);
    }
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching widget data: ' + widgetId);
    const data = await dashboardWidgetService.getWidgetData(widgetId, userId, institution);

    return successResponse(res, data, 'Widget data fetched successfully');
  } catch (error) {
    logger.error('Error fetching widget data:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get widget templates
 */
const getWidgetTemplates = async (req, res) => {
  try {
    const role = req.user?.role;
    const institution = req.user?.institution;

    // Validate role
    if (!role || !VALID_ROLES.includes(role)) {
      return validationErrorResponse(res, [{ field: 'role', message: 'Valid user role is required' }]);
    }

    logger.info('Fetching widget templates for role: ' + role);
    const templates = await dashboardWidgetService.getWidgetTemplates(role, institution);

    return successResponse(res, templates, 'Widget templates fetched successfully', {
      role
    });
  } catch (error) {
    logger.error('Error fetching widget templates:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Create widget template
 */
const createWidgetTemplate = async (req, res) => {
  try {
    const { name, type, config, roles } = req.body;
    const institution = req.user?.institution;

    // Validate required fields
    const errors = [];
    if (!name || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Template name is required and must be at least 2 characters' });
    } else if (name.length > 100) {
      errors.push({ field: 'name', message: 'Template name cannot exceed 100 characters' });
    }
    if (!type) {
      errors.push({ field: 'type', message: 'Widget type is required' });
    } else if (!VALID_WIDGET_TYPES.includes(type)) {
      errors.push({ field: 'type', message: 'Widget type must be one of: ' + VALID_WIDGET_TYPES.join(', ') });
    }
    if (roles && Array.isArray(roles)) {
      roles.forEach((role, index) => {
        if (!VALID_ROLES.includes(role)) {
          errors.push({ field: 'roles[' + index + ']', message: 'Invalid role' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Creating widget template: ' + name);
    const template = await dashboardWidgetService.createWidgetTemplate(req.body, institution);

    return createdResponse(res, template, 'Widget template created successfully');
  } catch (error) {
    logger.error('Error creating widget template:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Reset to default
 */
const resetToDefault = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const institution = req.user?.institution;

    // Validate user data
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }
    if (!role || !VALID_ROLES.includes(role)) {
      errors.push({ field: 'role', message: 'Valid user role is required' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Resetting dashboard to default for user: ' + userId);
    const widgets = await dashboardWidgetService.resetToDefault(userId, role, institution);

    return successResponse(res, widgets, 'Dashboard reset to default successfully');
  } catch (error) {
    logger.error('Error resetting dashboard:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Bulk delete widgets
 */
const bulkDeleteWidgets = async (req, res) => {
  try {
    const { widgetIds } = req.body;
    const userId = req.user?.id;
    const institution = req.user?.institution;

    // Validate widgetIds
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }
    if (!widgetIds || !Array.isArray(widgetIds) || widgetIds.length === 0) {
      errors.push({ field: 'widgetIds', message: 'widgetIds must be a non-empty array' });
    } else if (widgetIds.length > 50) {
      errors.push({ field: 'widgetIds', message: 'Maximum 50 widgets allowed per request' });
    } else {
      widgetIds.forEach((id, index) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ field: 'widgetIds[' + index + ']', message: 'Invalid widget ID' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Bulk deleting ' + widgetIds.length + ' widgets');
    const result = await dashboardWidgetService.bulkDeleteWidgets(userId, widgetIds, institution);

    return successResponse(res, result, result.deletedCount + ' widgets deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting widgets:', error);
    return errorResponse(res, 'Failed to bulk delete widgets', 500);
  }
};

/**
 * Clone widget
 */
const cloneWidget = async (req, res) => {
  try {
    const { widgetId } = req.params;
    const userId = req.user?.id;
    const institution = req.user?.institution;

    // Validate IDs
    const errors = [];
    const widgetValidation = validateObjectId(widgetId, 'widgetId');
    if (!widgetValidation.valid) {
      errors.push(widgetValidation.error);
    }
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Cloning widget: ' + widgetId);
    const widget = await dashboardWidgetService.cloneWidget(widgetId, userId, institution);

    if (!widget) {
      return notFoundResponse(res, 'Widget not found');
    }

    return createdResponse(res, widget, 'Widget cloned successfully');
  } catch (error) {
    logger.error('Error cloning widget:', error);
    return errorResponse(res, error.message, 500);
  }
};


export default {
  createWidget,
  getUserWidgets,
  getWidgetById,
  updateWidget,
  deleteWidget,
  updateWidgetPosition,
  updateWidgetSize,
  reorderWidgets,
  toggleWidgetVisibility,
  getWidgetData,
  getWidgetTemplates,
  createWidgetTemplate,
  resetToDefault,
  bulkDeleteWidgets,
  cloneWidget
};
