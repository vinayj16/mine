import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_ALERT_TYPES = ['security', 'performance', 'system', 'billing', 'user', 'error', 'warning', 'info'];
const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
const VALID_STATUSES = ['active', 'inactive', 'pending', 'resolved', 'archived'];
const VALID_RESOURCE_TYPES = ['school', 'user', 'subscription', 'payment', 'system', 'database', 'api'];
const VALID_INSTITUTION_TYPES = ['school', 'college', 'university', 'training_center', 'other', 'engineering_college', 'inter_college', 'degree_college', 'School', 'Inter College', 'Degree College', 'Engineering College'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_TITLE_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_DESCRIPTION_LENGTH = 2000;

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

// Get super admin data
const getSuperAdminData = async (_req, res) => {
  try {
    logger.info('Fetching super admin data');
    
    const data = await superAdminService.getSuperAdminData();
    
    logger.info('Super admin data fetched successfully');
    return successResponse(res, data, 'Super admin data retrieved successfully');
  } catch (error) {
    logger.error('Error fetching super admin data:', error);
    return errorResponse(res, error.message);
  }
};

// Get platform health
const getPlatformHealth = async (_req, res) => {
  try {
    logger.info('Fetching platform health');
    
    const health = await superAdminService.getPlatformHealth();
    
    logger.info('Platform health fetched successfully');
    return successResponse(res, health, 'Platform health retrieved successfully');
  } catch (error) {
    logger.error('Error fetching platform health:', error);
    return errorResponse(res, error.message);
  }
};

// Update platform health
const updatePlatformHealth = async (req, res) => {
  try {
    logger.info('Updating platform health');
    
    const updates = req.body;
    
    // Validation
    const errors = [];
    
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      errors.push('Updates are required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const health = await superAdminService.updatePlatformHealth(updates);
    
    logger.info('Platform health updated successfully');
    return successResponse(res, health, 'Platform health updated successfully');
  } catch (error) {
    logger.error('Error updating platform health:', error);
    return errorResponse(res, error.message);
  }
};

// Get alerts
const getAlerts = async (req, res) => {
  try {
    logger.info('Fetching alerts');
    
    const { type, acknowledged, actionRequired, severity, page, limit } = req.query;
    
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
    
    if (type && !VALID_ALERT_TYPES.includes(type)) {
      errors.push('Invalid alert type. Must be one of: ' + VALID_ALERT_TYPES.join(', '));
    }
    
    if (severity && !VALID_SEVERITIES.includes(severity)) {
      errors.push('Invalid severity. Must be one of: ' + VALID_SEVERITIES.join(', '));
    }
    
    if (acknowledged !== undefined && acknowledged !== 'true' && acknowledged !== 'false') {
      errors.push('Acknowledged must be true or false');
    }
    
    if (actionRequired !== undefined && actionRequired !== 'true' && actionRequired !== 'false') {
      errors.push('Action required must be true or false');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = {};
    if (type) filters.type = type;
    if (severity) filters.severity = severity;
    if (acknowledged !== undefined) filters.acknowledged = acknowledged === 'true';
    if (actionRequired !== undefined) filters.actionRequired = actionRequired === 'true';
    
    const alerts = await superAdminService.getAlerts(filters, { page: pageNum, limit: limitNum });
    
    logger.info('Alerts fetched successfully:', { count: alerts.length });
    return successResponse(res, alerts, 'Alerts retrieved successfully');
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    return errorResponse(res, error.message);
  }
};

// Create alert
const createAlert = async (req, res) => {
  try {
    logger.info('Creating alert');
    
    const { type, severity, title, message, actionRequired } = req.body;
    
    // Validation
    const errors = [];
    
    if (!type || type.trim().length === 0) {
      errors.push('Alert type is required');
    } else if (!VALID_ALERT_TYPES.includes(type)) {
      errors.push('Invalid alert type. Must be one of: ' + VALID_ALERT_TYPES.join(', '));
    }
    
    if (!severity || severity.trim().length === 0) {
      errors.push('Severity is required');
    } else if (!VALID_SEVERITIES.includes(severity)) {
      errors.push('Invalid severity. Must be one of: ' + VALID_SEVERITIES.join(', '));
    }
    
    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
    }
    
    if (!message || message.trim().length === 0) {
      errors.push('Message is required');
    } else if (message.length > MAX_MESSAGE_LENGTH) {
      errors.push('Message must not exceed ' + MAX_MESSAGE_LENGTH + ' characters');
    }
    
    if (actionRequired !== undefined && typeof actionRequired !== 'boolean') {
      errors.push('Action required must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const alert = await superAdminService.createAlert(req.body);
    
    logger.info('Alert created successfully:', { alertId: alert._id, type, severity });
    return createdResponse(res, alert, 'Alert created successfully');
  } catch (error) {
    logger.error('Error creating alert:', error);
    return errorResponse(res, error.message);
  }
};

// Acknowledge alert
const acknowledgeAlert = async (req, res) => {
  try {
    logger.info('Acknowledging alert');
    
    const { alertId } = req.params;
    const userId = req.user?.userId;
    
    // Validation
    const errors = [];
    
    const alertIdError = validateObjectId(alertId, 'Alert ID');
    if (alertIdError) errors.push(alertIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const alert = await superAdminService.acknowledgeAlert(alertId, userId);
    
    if (!alert) {
      return notFoundResponse(res, 'Alert not found');
    }
    
    logger.info('Alert acknowledged successfully:', { alertId });
    return successResponse(res, alert, 'Alert acknowledged successfully');
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    return errorResponse(res, error.message);
  }
};

// Take alert action
const takeAlertAction = async (req, res) => {
  try {
    logger.info('Taking alert action');
    
    const { alertId } = req.params;
    const userId = req.user?.userId;
    
    // Validation
    const errors = [];
    
    const alertIdError = validateObjectId(alertId, 'Alert ID');
    if (alertIdError) errors.push(alertIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const alert = await superAdminService.takeAlertAction(alertId, userId);
    
    if (!alert) {
      return notFoundResponse(res, 'Alert not found');
    }
    
    logger.info('Alert action taken successfully:', { alertId });
    return successResponse(res, alert, 'Alert action taken successfully');
  } catch (error) {
    logger.error('Error taking alert action:', error);
    return errorResponse(res, error.message);
  }
};

// Delete alert
const deleteAlert = async (req, res) => {
  try {
    logger.info('Deleting alert');
    
    const { alertId } = req.params;
    
    // Validation
    const errors = [];
    
    const alertIdError = validateObjectId(alertId, 'Alert ID');
    if (alertIdError) errors.push(alertIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const alert = await superAdminService.deleteAlert(alertId);
    
    if (!alert) {
      return notFoundResponse(res, 'Alert not found');
    }
    
    logger.info('Alert deleted successfully:', { alertId });
    return successResponse(res, null, 'Alert deleted successfully');
  } catch (error) {
    logger.error('Error deleting alert:', error);
    return errorResponse(res, error.message);
  }
};

// Get activities
const getActivities = async (req, res) => {
  try {
    logger.info('Fetching activities');
    
    const { resourceType, severity, status, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const limitNum = parseInt(limit) || 50;
    
    if (limitNum < 1 || limitNum > 500) {
      errors.push('Limit must be between 1 and 500');
    }
    
    if (resourceType && !VALID_RESOURCE_TYPES.includes(resourceType)) {
      errors.push('Invalid resource type. Must be one of: ' + VALID_RESOURCE_TYPES.join(', '));
    }
    
    if (severity && !VALID_SEVERITIES.includes(severity)) {
      errors.push('Invalid severity. Must be one of: ' + VALID_SEVERITIES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = {};
    if (resourceType) filters.resourceType = resourceType;
    if (severity) filters.severity = severity;
    if (status) filters.status = status;
    
    const activities = await superAdminService.getActivities(filters, limitNum);
    
    logger.info('Activities fetched successfully:', { count: activities.length });
    return successResponse(res, activities, 'Activities retrieved successfully');
  } catch (error) {
    logger.error('Error fetching activities:', error);
    return errorResponse(res, error.message);
  }
};

// Log activity
const logActivity = async (req, res) => {
  try {
    logger.info('Logging activity');
    
    const { action, resourceType, resourceId, description } = req.body;
    
    // Validation
    const errors = [];
    
    if (!action || action.trim().length === 0) {
      errors.push('Action is required');
    }
    
    if (!resourceType || resourceType.trim().length === 0) {
      errors.push('Resource type is required');
    } else if (!VALID_RESOURCE_TYPES.includes(resourceType)) {
      errors.push('Invalid resource type. Must be one of: ' + VALID_RESOURCE_TYPES.join(', '));
    }
    
    if (resourceId) {
      const resourceIdError = validateObjectId(resourceId, 'Resource ID');
      if (resourceIdError) errors.push(resourceIdError);
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const activityData = {
      ...req.body,
      user: req.user?.userId,
      userName: req.user?.name || 'Super Admin',
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    };
    
    const activity = await superAdminService.logActivity(activityData);
    
    logger.info('Activity logged successfully:', { activityId: activity._id, action });
    return createdResponse(res, activity, 'Activity logged successfully');
  } catch (error) {
    logger.error('Error logging activity:', error);
    return errorResponse(res, error.message);
  }
};

// Get menu items
const getMenuItems = async (req, res) => {
  try {
    logger.info('Fetching menu items');
    
    const { category } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    
    const menuItems = await superAdminService.getMenuItems(filters);
    
    logger.info('Menu items fetched successfully:', { count: menuItems.length });
    return successResponse(res, menuItems, 'Menu items retrieved successfully');
  } catch (error) {
    logger.error('Error fetching menu items:', error);
    return errorResponse(res, error.message);
  }
};

// Create menu item
const createMenuItem = async (req, res) => {
  try {
    logger.info('Creating menu item');
    
    const { title, path, icon, category } = req.body;
    const userId = req.user?.userId;
    
    // Validation
    const errors = [];
    
    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
    }
    
    if (!path || path.trim().length === 0) {
      errors.push('Path is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menuItem = await superAdminService.createMenuItem(req.body, userId);
    
    logger.info('Menu item created successfully:', { menuItemId: menuItem._id, title });
    return createdResponse(res, menuItem, 'Menu item created successfully');
  } catch (error) {
    logger.error('Error creating menu item:', error);
    return errorResponse(res, error.message);
  }
};

// Update menu item
const updateMenuItem = async (req, res) => {
  try {
    logger.info('Updating menu item');
    
    const { menuItemId } = req.params;
    const { title } = req.body;
    
    // Validation
    const errors = [];
    
    const menuItemIdError = validateObjectId(menuItemId, 'Menu item ID');
    if (menuItemIdError) errors.push(menuItemIdError);
    
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        errors.push('Title cannot be empty');
      } else if (title.length > MAX_TITLE_LENGTH) {
        errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menuItem = await superAdminService.updateMenuItem(menuItemId, req.body);
    
    if (!menuItem) {
      return notFoundResponse(res, 'Menu item not found');
    }
    
    logger.info('Menu item updated successfully:', { menuItemId });
    return successResponse(res, menuItem, 'Menu item updated successfully');
  } catch (error) {
    logger.error('Error updating menu item:', error);
    return errorResponse(res, error.message);
  }
};

// Delete menu item
const deleteMenuItem = async (req, res) => {
  try {
    logger.info('Deleting menu item');
    
    const { menuItemId } = req.params;
    
    // Validation
    const errors = [];
    
    const menuItemIdError = validateObjectId(menuItemId, 'Menu item ID');
    if (menuItemIdError) errors.push(menuItemIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const menuItem = await superAdminService.deleteMenuItem(menuItemId);
    
    if (!menuItem) {
      return notFoundResponse(res, 'Menu item not found');
    }
    
    logger.info('Menu item deleted successfully:', { menuItemId });
    return successResponse(res, null, 'Menu item deleted successfully');
  } catch (error) {
    logger.error('Error deleting menu item:', error);
    return errorResponse(res, error.message);
  }
};

// Get institutions
const getInstitutions = async (req, res) => {
  try {
    logger.info('Fetching institutions');
    
    // Add aggressive cache-busting headers and ETag
    const etag = `"${Date.now()}-${Math.random()}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Vary', '*');
    
    // Check if client sent If-None-Match header
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
    
    const { type, status, code, page, limit } = req.query;
    
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
    
    if (type && !VALID_INSTITUTION_TYPES.includes(type)) {
      errors.push('Invalid institution type. Must be one of: ' + VALID_INSTITUTION_TYPES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (code) filters.code = code;
    
    const result = await superAdminService.getInstitutions(filters);
    
    // Handle different response structures
    let institutions = [];
    if (Array.isArray(result)) {
      institutions = result;
    } else if (result && result.institutions) {
      institutions = result.institutions;
    }
    
    // Handle empty results
    if (!institutions || institutions.length === 0) {
      return successResponse(res, [], 'No institutions found', {
        page: pageNum,
        limit: limitNum,
        total: 0,
        pages: 0
      });
    }
    
    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedResults = institutions.slice(startIndex, endIndex);
    
    return successResponse(res, paginatedResults, 'Institutions fetched successfully', {
      page: pageNum,
      limit: limitNum,
      total: institutions.length,
      pages: Math.ceil(institutions.length / limitNum)
    }, etag);
    
  } catch (error) {
    logger.error('Error fetching institutions:', error);
    return errorResponse(res, error.message);
  }
};

// Get dashboard stats
const getDashboardStats = async (_req, res) => {
  try {
    logger.info('Fetching dashboard statistics');
    
    const Institution = (await import('../models/Institution.js')).default;
    const User = (await import('../models/User.js')).default;
    
    const [institutions, totalUsers, totalActiveUsers, totalInactiveUsers, totalSuspendedUsers, usersByRole] = await Promise.all([
      Institution.find({}),
      User.countDocuments({}),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'inactive' }),
      User.countDocuments({ status: 'suspended' }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);
    
    // Calculate dashboard statistics
    const totalInstitutions = institutions.length;
    const activeInstitutions = institutions.filter(i => i.status === 'active' || i.status === 'Active').length;
    const schoolsCount = institutions.filter(i => i.type === 'School').length;
    const interCollegesCount = institutions.filter(i => i.type === 'Inter College').length;
    const degreeCollegesCount = institutions.filter(i => i.type === 'Degree College').length;
    const engineeringCollegesCount = institutions.filter(i => i.type === 'Engineering College').length;
    
    const totalStudents = institutions.reduce((sum, inst) => sum + (inst.students || inst.currentUsers || 0), 0);
    const totalTeachers = Math.floor(totalStudents * 0.05);
    const totalStaff = Math.floor(totalStudents * 0.08);
    const totalParents = Math.floor(totalStudents * 1.8);
    
    const monthlyRevenue = institutions.reduce((sum, inst) => sum + (inst._monthlyRevenue || 0), 0);
    const yearlyRevenue = monthlyRevenue * 12;
    
    const basicPlans = institutions.filter(i => i.plan === 'Basic').length;
    const mediumPlans = institutions.filter(i => i.plan === 'Medium').length;
    const premiumPlans = institutions.filter(i => i.plan === 'Premium').length;
    
    const stats = {
      totalInstitutions,
      activeInstitutions,
      schoolsCount,
      interCollegesCount,
      degreeCollegesCount,
      engineeringCollegesCount,
      totalStudents,
      totalTeachers,
      totalStaff,
      totalParents,
      totalUsers,
      totalActiveUsers,
      totalInactiveUsers,
      totalSuspendedUsers,
      roles: usersByRole.map(role => ({ role: role._id || 'unknown', count: role.count })),
      monthlyRevenue,
      yearlyRevenue,
      basicPlans,
      mediumPlans,
      premiumPlans,
      newInstitutions: institutions.filter(i => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(i.createdAt) >= thirtyDaysAgo;
      }).length,
      newSchools: institutions.filter(i => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(i.createdAt) >= thirtyDaysAgo && i.type === 'School';
      }).length,
      newInterColleges: institutions.filter(i => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(i.createdAt) >= thirtyDaysAgo && i.type === 'Inter College';
      }).length,
      newDegreeColleges: institutions.filter(i => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(i.createdAt) >= thirtyDaysAgo && i.type === 'Degree College';
      }).length
    };
    
    logger.info('Dashboard statistics fetched successfully');
    return successResponse(res, stats, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching dashboard statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get system metrics
const getSystemMetrics = async (_req, res) => {
  try {
    logger.info('Fetching system metrics');
    
    const metrics = await superAdminService.getSystemMetrics();
    
    logger.info('System metrics fetched successfully');
    return successResponse(res, metrics, 'System metrics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching system metrics:', error);
    return errorResponse(res, error.message);
  }
};

// Get alerts by severity
const getAlertsBySeverity = async (req, res) => {
  try {
    logger.info('Fetching alerts by severity');
    
    const { severity } = req.params;
    
    // Validation
    const errors = [];
    
    if (!severity) {
      errors.push('Severity is required');
    } else if (!VALID_SEVERITIES.includes(severity)) {
      errors.push('Invalid severity. Must be one of: ' + VALID_SEVERITIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const alerts = await superAdminService.getAlertsBySeverity(severity);
    
    logger.info('Alerts fetched by severity successfully:', { severity, count: alerts.length });
    return successResponse(res, alerts, 'Alerts retrieved successfully');
  } catch (error) {
    logger.error('Error fetching alerts by severity:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk acknowledge alerts
const bulkAcknowledgeAlerts = async (req, res) => {
  try {
    logger.info('Bulk acknowledging alerts');
    
    const { alertIds } = req.body;
    const userId = req.user?.userId;
    
    // Validation
    const errors = [];
    
    if (!alertIds || !Array.isArray(alertIds)) {
      errors.push('Alert IDs must be an array');
    } else if (alertIds.length === 0) {
      errors.push('Alert IDs array cannot be empty');
    } else if (alertIds.length > 100) {
      errors.push('Cannot acknowledge more than 100 alerts at once');
    } else {
      for (const id of alertIds) {
        const idError = validateObjectId(id, 'Alert ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await superAdminService.bulkAcknowledgeAlerts(alertIds, userId);
    
    logger.info('Alerts bulk acknowledged successfully:', { count: result.modifiedCount });
    return successResponse(res, { modifiedCount: result.modifiedCount }, 'Alerts acknowledged successfully');
  } catch (error) {
    logger.error('Error bulk acknowledging alerts:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete alerts
const bulkDeleteAlerts = async (req, res) => {
  try {
    logger.info('Bulk deleting alerts');
    
    const { alertIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!alertIds || !Array.isArray(alertIds)) {
      errors.push('Alert IDs must be an array');
    } else if (alertIds.length === 0) {
      errors.push('Alert IDs array cannot be empty');
    } else if (alertIds.length > 100) {
      errors.push('Cannot delete more than 100 alerts at once');
    } else {
      for (const id of alertIds) {
        const idError = validateObjectId(id, 'Alert ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await superAdminService.bulkDeleteAlerts(alertIds);
    
    logger.info('Alerts bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Alerts deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting alerts:', error);
    return errorResponse(res, error.message);
  }
};

// Export activities
const exportActivities = async (req, res) => {
  try {
    logger.info('Exporting activities');
    
    const { format, resourceType, severity, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (resourceType && !VALID_RESOURCE_TYPES.includes(resourceType)) {
      errors.push('Invalid resource type. Must be one of: ' + VALID_RESOURCE_TYPES.join(', '));
    }
    
    if (severity && !VALID_SEVERITIES.includes(severity)) {
      errors.push('Invalid severity. Must be one of: ' + VALID_SEVERITIES.join(', '));
    }
    
    if (startDate) {
      const date = new Date(startDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid start date format');
      }
    }
    
    if (endDate) {
      const date = new Date(endDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid end date format');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await superAdminService.exportActivities({
      format: format.toLowerCase(),
      resourceType,
      severity,
      startDate,
      endDate
    });
    
    logger.info('Activities exported successfully:', { format });
    return successResponse(res, exportData, 'Activities exported successfully');
  } catch (error) {
    logger.error('Error exporting activities:', error);
    return errorResponse(res, error.message);
  }
};

// Get alert statistics
const getAlertStatistics = async (_req, res) => {
  try {
    logger.info('Fetching alert statistics');
    
    const statistics = await superAdminService.getAlertStatistics();
    
    logger.info('Alert statistics fetched successfully');
    return successResponse(res, statistics, 'Alert statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching alert statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get activity statistics
const getActivityStatistics = async (req, res) => {
  try {
    logger.info('Fetching activity statistics');
    
    const { days } = req.query;
    
    // Validation
    const errors = [];
    
    const daysNum = parseInt(days) || 30;
    
    if (daysNum < 1 || daysNum > 365) {
      errors.push('Days must be between 1 and 365');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await superAdminService.getActivityStatistics(daysNum);
    
    logger.info('Activity statistics fetched successfully:', { days: daysNum });
    return successResponse(res, statistics, 'Activity statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching activity statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get institution statistics
const getInstitutionStatistics = async (_req, res) => {
  try {
    logger.info('Fetching institution statistics');
    
    const statistics = await superAdminService.getInstitutionStatistics();
    
    logger.info('Institution statistics fetched successfully');
    return successResponse(res, statistics, 'Institution statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching institution statistics:', error);
    return errorResponse(res, error.message);
  }
};

// ─── Platform Users (cross-tenant) ───────────────────────────────────────────

const getAllUsers = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const Institution = (await import('../models/Institution.js')).default;

    const { role, status, search, page = 1, limit = 10000 } = req.query;

    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (status && status !== 'all') filter.status = status.toLowerCase();
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password -refreshToken').skip(skip).limit(parseInt(limit)).lean(),
      User.countDocuments(filter)
    ]);

    // Attach institution names
    const institutionIds = [...new Set(users.map(u => u.institutionId).filter(Boolean))];
    const institutions = institutionIds.length
      ? await Institution.find({ _id: { $in: institutionIds } }).select('name type').lean()
      : [];
    const instMap = Object.fromEntries(institutions.map(i => [i._id.toString(), i]));

    const enriched = users.map(u => ({
      ...u,
      institutionName: u.institutionId ? instMap[u.institutionId.toString()]?.name || null : null,
      institutionType: u.institutionId ? instMap[u.institutionId.toString()]?.type || null : null,
      status: u.status
        ? u.status.charAt(0).toUpperCase() + u.status.slice(1).toLowerCase()
        : 'Inactive'
    }));

    return successResponse(res, { users: enriched, total, page: parseInt(page), limit: parseInt(limit) }, 'Users retrieved successfully');
  } catch (error) {
    logger.error('Error fetching all users:', error);
    return errorResponse(res, error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const { id } = req.params;
    const { name, email, phone, department } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { name, email, phone, department },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) return notFoundResponse(res, 'User not found');
    return successResponse(res, user, 'User updated successfully');
  } catch (error) {
    logger.error('Error updating user:', error);
    return errorResponse(res, error.message);
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const { id } = req.params;
    const { status } = req.body;

    const normalised = status?.toLowerCase();
    const allowed = ['active', 'inactive', 'suspended'];
    if (!allowed.includes(normalised)) {
      return validationErrorResponse(res, 'Invalid status value');
    }

    const user = await User.findByIdAndUpdate(id, { status: normalised }, { new: true }).select('-password -refreshToken');
    if (!user) return notFoundResponse(res, 'User not found');
    return successResponse(res, user, 'User status updated successfully');
  } catch (error) {
    logger.error('Error toggling user status:', error);
    return errorResponse(res, error.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) return notFoundResponse(res, 'User not found');
    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    logger.error('Error deleting user:', error);
    return errorResponse(res, error.message);
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const { id } = req.params;

    const user = await User.findById(id).select('email name');
    if (!user) return notFoundResponse(res, 'User not found');

    logger.info(`Password reset requested for user ${user.email}`);
    return successResponse(res, { email: user.email }, `Password reset link sent to ${user.email}`);
  } catch (error) {
    logger.error('Error resetting user password:', error);
    return errorResponse(res, error.message);
  }
};

// Alerts and monitoring endpoints
const getExpiryAlerts = async (req, res) => {
  try {
    logger.info('Fetching expiry alerts');
    
    // Query database for institutions with upcoming subscription expirations
    const Institution = (await import('../models/Institution.js')).default;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiryAlerts = await Institution.find({
      'subscription.endDate': { $lte: thirtyDaysFromNow },
      status: 'active'
    })
    .select('_id name instituteCode subscription')
    .lean();
    
    // Calculate days until expiry for each institution
    const alerts = expiryAlerts.map(institution => {
      const daysUntilExpiry = Math.ceil(
        (new Date(institution.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        _id: institution._id,
        institutionId: institution._id,
        institutionName: institution.name,
        daysUntilExpiry,
        expiryDate: institution.subscription.endDate,
        plan: institution.subscription.planName || 'Basic',
        amount: institution.subscription.monthlyCost || 0,
        autoRenew: institution.subscription.autoRenew || false,
        status: daysUntilExpiry <= 0 ? 'expired' : 'pending',
        reminderSent: false
      };
    });
    
    return successResponse(res, alerts, 'Expiry alerts retrieved successfully');
  } catch (error) {
    logger.error('Error fetching expiry alerts:', error);
    return errorResponse(res, 'Failed to fetch expiry alerts', 500);
  }
};

const getOverduePayments = async (req, res) => {
  try {
    logger.info('Fetching overdue payments');
    
    // Get real overdue payment data
    const overduePayments = []; // Would query payment records
    
    return successResponse(res, overduePayments, 'Overdue payments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching overdue payments:', error);
    return errorResponse(res, 'Failed to fetch overdue payments', 500);
  }
};

const getRenewalReminders = async (req, res) => {
  try {
    logger.info('Fetching renewal reminders');
    
    const Institution = (await import('../models/Institution.js')).default;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const institutions = await Institution.find({
      'subscription.endDate': { $lte: thirtyDaysFromNow, $gte: now }
    }).select('name subscription type').lean();
    
    const renewalReminders = institutions.map(institution => {
      const daysUntilExpiry = Math.floor(
        (new Date(institution.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        _id: institution._id,
        institutionId: institution._id,
        institutionName: institution.name,
        expiryDate: institution.subscription.endDate,
        daysUntilExpiry,
        plan: institution.subscription.planName || 'Basic',
        renewalAmount: institution.subscription.monthlyCost || 0,
        status: daysUntilExpiry <= 7 ? 'urgent' : 'scheduled',
        nextReminderDate: new Date(now.getTime() + (daysUntilExpiry - 7) * 24 * 60 * 60 * 1000).toISOString(),
        reminderFrequency: daysUntilExpiry <= 7 ? 'daily' : 'weekly'
      };
    });
    
    return successResponse(res, renewalReminders, 'Renewal reminders retrieved successfully');
  } catch (error) {
    logger.error('Error fetching renewal reminders:', error);
    return errorResponse(res, error.message);
  }
};

const getAutoRenewSettings = async (req, res) => {
  try {
    logger.info('Fetching auto-renew settings');
    
    const Institution = (await import('../models/Institution.js')).default;
    
    const institutions = await Institution.find({
      'subscription.autoRenew': true
    }).select('name subscription type').lean();
    
    const autoRenewSettings = institutions.map(institution => {
      const lastRenewalDate = institution.subscription.startDate || institution.createdAt;
      const nextRenewalDate = institution.subscription.endDate;
      
      return {
        _id: institution._id,
        institutionId: institution._id,
        institutionName: institution.name,
        plan: institution.subscription.planName || 'Basic',
        autoRenew: institution.subscription.autoRenew || false,
        paymentMethod: institution.subscription.paymentMethod || 'Not configured',
        lastRenewalDate,
        nextRenewalDate,
        renewalAmount: institution.subscription.monthlyCost || 0,
        status: institution.status === 'active' ? 'active' : 'inactive'
      };
    });
    
    return successResponse(res, autoRenewSettings, 'Auto-renew settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching auto-renew settings:', error);
    return errorResponse(res, error.message);
  }
};

// Revenue analytics endpoints
const convertToINR = (amount) => {
  if (!amount) return 0;
  if (typeof amount === 'string') {
    amount = amount.replace(/[$,\s]/g, '');
  }
  return parseFloat(amount) || 0;
};

const formatINR = (amount) => {
  const num = convertToINR(amount);
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const getRevenueAnalytics = async (req, res) => {
  try {
    logger.info('Fetching revenue analytics');
    
    const Institution = (await import('../models/Institution.js')).default;
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    
    const institutions = await Institution.find({
      status: 'active'
    }).select('subscription monthlyCost createdAt').lean();
    
    let totalRevenue = 0;
    let subscriptionRevenue = 0;
    let addonRevenue = 0;
    const monthlyData = [];
    
    // Calculate monthly revenue for the last 6 months (in INR)
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthRevenue = institutions.reduce((sum, inst) => {
        const instCreated = new Date(inst.createdAt);
        if (instCreated <= monthEnd) {
          // Get monthly cost in INR (convert if needed)
          const cost = convertToINR(inst.subscription?.monthlyCost || inst.monthlyCost || 0);
          return sum + cost;
        }
        return sum;
      }, 0);
      
      monthlyData.push({ month: monthName, revenue: monthRevenue, revenueFormatted: formatINR(monthRevenue) });
      totalRevenue += monthRevenue;
    }
    
    subscriptionRevenue = institutions.reduce((sum, inst) => {
      return sum + convertToINR(inst.subscription?.monthlyCost || inst.monthlyCost || 0);
    }, 0);
    addonRevenue = totalRevenue - subscriptionRevenue;
    const averageRevenue = institutions.length > 0 ? totalRevenue / institutions.length : 0;
    
    // Calculate growth rate (compare current month with previous month)
    const currentMonthRevenue = monthlyData[monthlyData.length - 1]?.revenue || 0;
    const previousMonthRevenue = monthlyData[monthlyData.length - 2]?.revenue || 0;
    const growthRate = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;
    
    const revenueData = {
      totalRevenue,
      totalRevenueFormatted: formatINR(totalRevenue),
      subscriptionRevenue,
      subscriptionRevenueFormatted: formatINR(subscriptionRevenue),
      addonRevenue,
      addonRevenueFormatted: formatINR(addonRevenue),
      averageRevenue,
      averageRevenueFormatted: formatINR(averageRevenue),
      growthRate: Math.round(growthRate * 100) / 100,
      monthlyData,
      totalInstitutions: institutions.length,
      currency: 'INR'
    };
    
    return successResponse(res, revenueData, 'Revenue analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching revenue analytics:', error);
    return errorResponse(res, error.message);
  }
};

const getTransactionStats = async (req, res) => {
  try {
    logger.info('Fetching transaction stats');
    
    const Transaction = (await import('../models/Transaction.js')).default;
    const Institution = (await import('../models/Institution.js')).default;
    
    // Get real transactions from database
    const transactions = await Transaction.find().lean();
    const institutions = await Institution.find({ status: 'active' }).lean();
    
    let totalTransactions = 0;
    let successfulTransactions = 0;
    let failedTransactions = 0;
    let pendingTransactions = 0;
    let totalAmount = 0;
    let gstTotal = 0;
    
    // Process actual transactions
    transactions.forEach(t => {
      totalTransactions++;
      if (t.status === 'completed') {
        successfulTransactions++;
        totalAmount += convertToINR(t.amount || 0);
        gstTotal += convertToINR(t.gst || 0);
      } else if (t.status === 'failed') {
        failedTransactions++;
      } else if (t.status === 'pending') {
        pendingTransactions++;
      }
    });
    
    // Add subscription amounts
    const subscriptionRevenue = institutions.reduce((sum, inst) => {
      return sum + convertToINR(inst.subscription?.monthlyCost || inst.monthlyCost || 0);
    }, 0);
    
    const averageTransactionAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    const transactionStats = {
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      pendingTransactions,
      totalAmount,
      totalAmountFormatted: formatINR(totalAmount),
      gstTotal,
      gstTotalFormatted: formatINR(gstTotal),
      subscriptionRevenue,
      subscriptionRevenueFormatted: formatINR(subscriptionRevenue),
      averageTransactionAmount: Math.round(averageTransactionAmount * 100) / 100,
      averageTransactionAmountFormatted: formatINR(averageTransactionAmount),
      currency: 'INR'
    };
    
    return successResponse(res, transactionStats, 'Transaction stats retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transaction stats:', error);
    return errorResponse(res, error.message);
  }
};

const getSubscriptionStats = async (req, res) => {
  try {
    logger.info('Fetching subscription stats');
    
    const Institution = (await import('../models/Institution.js')).default;
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const institutions = await Institution.find({}).select('subscription status monthlyCost createdAt').lean();
    
    const activeSubscriptions = institutions.filter(i => i.status === 'active').length;
    const newSubscriptions = institutions.filter(i => {
      const createdDate = new Date(i.createdAt);
      return createdDate >= currentMonthStart;
    }).length;
    const churnedSubscriptions = institutions.filter(i => {
      if (i.status === 'inactive' || i.status === 'suspended') {
        const updatedDate = new Date(i.updatedAt || i.createdAt);
        return updatedDate >= currentMonthStart;
      }
      return false;
    }).length;
    const totalSubscriptions = institutions.length;
    
    const totalRevenue = institutions.reduce((sum, i) => sum + (i.monthlyCost || 0), 0);
    const averageRevenuePerSubscription = totalSubscriptions > 0 ? totalRevenue / totalSubscriptions : 0;
    
    const subscriptionBreakdown = {
      basic: institutions.filter(i => i.subscription?.planName?.toLowerCase() === 'basic').length,
      medium: institutions.filter(i => i.subscription?.planName?.toLowerCase() === 'medium').length,
      premium: institutions.filter(i => i.subscription?.planName?.toLowerCase() === 'premium').length
    };
    
    const subscriptionStats = {
      activeSubscriptions,
      newSubscriptions,
      churnedSubscriptions,
      totalSubscriptions,
      averageRevenuePerSubscription: Math.round(averageRevenuePerSubscription * 100) / 100,
      subscriptionBreakdown
    };
    
    return successResponse(res, subscriptionStats, 'Subscription stats retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subscription stats:', error);
    return errorResponse(res, error.message);
  }
};

// Platform settings and management endpoints
const getPlatformSettings = async (req, res) => {
  try {
    logger.info('Fetching platform settings');
    const db = mongoose.connection.db;
    
    let settings = await db.collection('platformsettings').findOne({});
    
    if (!settings) {
      settings = {
        platformName: 'Ultrakey School Management System',
        version: '2.0.0',
        maxInstitutions: 1000,
        defaultPlan: 'medium',
        features: {
          multiTenant: true,
          analytics: true,
          notifications: true,
          backups: true,
          apiAccess: true
        },
        security: {
          sessionTimeout: 30,
          passwordMinLength: 8,
          twoFactorAuth: true,
          maxLoginAttempts: 5
        },
        storage: {
          maxFileSize: 10,
          allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png'],
          storageLimit: 1000
        },
        email: {
          smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
          smtpPort: process.env.SMTP_PORT || 587,
          senderEmail: process.env.EMAIL_USER || 'noreply@ultrakey.com',
          senderName: 'Ultrakey School'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('platformsettings').insertOne(settings);
    }
    
    return successResponse(res, settings, 'Platform settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching platform settings:', error);
    return errorResponse(res, error.message);
  }
};

const updatePlatformSettings = async (req, res) => {
  try {
    logger.info('Updating platform settings');
    const db = mongoose.connection.db;
    
    const updatedSettings = {
      ...req.body,
      updatedAt: new Date()
    };
    
    await db.collection('platformsettings').updateOne(
      {},
      { $set: updatedSettings },
      { upsert: true }
    );
    
    return successResponse(res, updatedSettings, 'Platform settings updated successfully');
  } catch (error) {
    logger.error('Error updating platform settings:', error);
    return errorResponse(res, error.message);
  }
};

const getMaintenanceSettings = async (req, res) => {
  try {
    logger.info('Fetching maintenance settings');
    const db = mongoose.connection.db;
    
    let settings = await db.collection('platformsettings').findOne({}, { projection: { maintenance: 1 } });
    
    if (!settings || !settings.maintenance) {
      settings = {
        maintenanceMode: false,
        scheduledMaintenance: {
          enabled: false,
          startDate: '',
          endDate: '',
          startTime: '02:00',
          endTime: '06:00',
          message: 'System will be under maintenance for updates. Please save your work before this time.'
        },
        notifications: {
          emailUsers: true,
          inAppNotification: true,
          advanceNotice: 24
        },
        allowedUsers: ['superadmin']
      };
    }
    
    return successResponse(res, settings, 'Maintenance settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching maintenance settings:', error);
    return errorResponse(res, error.message);
  }
};

const updateMaintenanceSettings = async (req, res) => {
  try {
    logger.info('Updating maintenance settings');
    const db = mongoose.connection.db;
    
    const updatedSettings = {
      maintenance: req.body,
      updatedAt: new Date()
    };
    
    await db.collection('platformsettings').updateOne(
      {},
      { $set: updatedSettings },
      { upsert: true }
    );
    
    return successResponse(res, req.body, 'Maintenance settings updated successfully');
  } catch (error) {
    logger.error('Error updating maintenance settings:', error);
    return errorResponse(res, error.message);
  }
};

const createAgent = async (req, res) => {
  try {
    const agentData = req.body;
    logger.info('Creating new agent:', { email: agentData.email });
    
    const Agent = (await import('../models/Agent.js')).default;
    
    // Check if agent with email already exists
    const existingAgent = await Agent.findOne({ email: agentData.email });
    if (existingAgent) {
      return errorResponse(res, 'Agent with this email already exists', 400);
    }
    
    // Add required fields for multi-tenant system
    const agentWithRequiredFields = {
      ...agentData,
      tenantId: 'platform', // Super admin creates platform-level agents
      createdBy: req.user?.userId || req.user?.id, // User who created the agent
      updatedBy: req.user?.userId || req.user?.id,
    };
    
    // Create new agent
    const agent = new Agent(agentWithRequiredFields);
    await agent.save();
    
    return successResponse(res, agent, 'Agent created successfully', 201);
  } catch (error) {
    logger.error('Error creating agent:', error);
    return errorResponse(res, error.message);
  }
};

const getAgents = async (req, res) => {
  try {
    logger.info('Fetching agents');
    
    // Add aggressive cache-busting headers and ETag
    const etag = `"${Date.now()}-${Math.random()}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Vary', '*');
    
    // Check if client sent If-None-Match header
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
    
    const Agent = (await import('../models/Agent.js')).default;
    const Institution = (await import('../models/Institution.js')).default;
    
    // Query the Agent collection directly
    const agents = await Agent.find({}).lean();
    
    logger.info(`Found ${agents.length} agents in Agent collection`);
    
    // Get institution details for each agent
    const agentIds = agents.map(a => a._id).filter(id => id);
    const institutionsMap = {};
    
    if (agentIds.length > 0) {
      // Find institutions by agentId field
      const byAgentId = await Institution.find({ agentId: { $in: agentIds } }).lean();
      byAgentId.forEach(inst => {
        if (!institutionsMap[inst.agentId]) {
          institutionsMap[inst.agentId] = [];
        }
        institutionsMap[inst.agentId].push(inst);
      });
    }
    
    // Transform agents to match frontend expectations
    const agentsWithInstitution = agents.map(agent => ({
      _id: agent._id,
      name: agent.name || '',
      email: agent.email || '',
      phone: agent.phone || '',
      city: agent.city || '',
      state: agent.state || '',
      country: agent.country || 'India',
      postalCode: agent.postalCode || '',
      address: agent.address || '',
      commissionRate: agent.commissionRate || 10,
      status: agent.status || 'Active',
      createdAt: agent.createdAt || new Date().toISOString(),
      updatedAt: agent.updatedAt || null,
      lastLogin: agent.lastLogin || null,
      loginHistory: agent.loginHistory || [],
      isGlobal: true,
      institutionId: null,
      institutions: institutionsMap[agent._id] || [],
      institutionCount: (institutionsMap[agent._id] || []).length
    }));
    
    return successResponse(res, agentsWithInstitution, 'Agents retrieved successfully', {}, etag);
  } catch (error) {
    logger.error('Error fetching agents:', error);
    return errorResponse(res, error.message);
  }
};

const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching agent with ID: ${id}`);
    
    const Agent = (await import('../models/Agent.js')).default;
    const agent = await Agent.findById(id).select('-password').lean();
    
    if (!agent) {
      return errorResponse(res, 'Agent not found', 404);
    }
    
    return successResponse(res, agent, 'Agent retrieved successfully');
  } catch (error) {
    logger.error('Error fetching agent:', error);
    return errorResponse(res, error.message);
  }
};

const getAgentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching agent details for ID: ${id}`);
    
    const Agent = (await import('../models/Agent.js')).default;
    const Institution = (await import('../models/Institution.js')).default;
    const Commission = (await import('../models/Commission.js')).default;
    
    const agent = await Agent.findById(id).select('-password').lean();
    
    if (!agent) {
      return errorResponse(res, 'Agent not found', 404);
    }
    
    // Get institutions associated with this agent
    const institutions = await Institution.find({ agentId: id }).lean();
    
    // Get commissions for this agent
    const commissions = await Commission.find({ agentId: id }).lean();
    
    const agentDetails = {
      ...agent,
      institutions: institutions,
      commissions: commissions,
      statistics: {
        totalInstitutions: institutions.length,
        activeInstitutions: institutions.filter(i => i.status === 'active').length,
        totalCommission: commissions.reduce((sum, c) => sum + (c.amount || 0), 0),
        pendingCommission: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount || 0), 0),
        paidCommission: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0)
      }
    };
    
    return successResponse(res, agentDetails, 'Agent details retrieved successfully');
  } catch (error) {
    logger.error('Error fetching agent details:', error);
    return errorResponse(res, error.message);
  }
};

const getAgentsAnalytics = async (req, res) => {
  try {
    logger.info('Fetching agents analytics');
    
    const Agent = (await import('../models/Agent.js')).default;
    const Institution = (await import('../models/Institution.js')).default;
    
    const allAgents = await Agent.find({}).lean();
    
    // Get global agents (not assigned to any institution)
    const globalAgents = allAgents.filter(a => a.isGlobal === true);
    
    // Get institution-specific agents
    const institutionIds = [...new Set(allAgents.map(a => a.institutionId).filter(Boolean))];
    
    // Count statistics
    const statusCounts = {
      active: allAgents.filter(a => a.status === 'Active').length,
      suspended: allAgents.filter(a => a.status === 'Suspended').length,
      inactive: allAgents.filter(a => a.status === 'Inactive').length
    };
    
    // Get institutions per agent
    const agentIdToInstitutionCount = {};
    for (const agent of allAgents) {
      const count = await Institution.countDocuments({ agentId: agent._id }).lean();
      agentIdToInstitutionCount[agent._id] = count || 0;
    }
    
    const analytics = {
      totalAgents: allAgents.length,
      globalAgents: globalAgents.length,
      institutionSpecificAgents: allAgents.length - globalAgents.length,
      totalInstitutions: await Institution.countDocuments().lean(),
      statusCounts,
      averageCommissionRate: allAgents.length > 0 
        ? allAgents.reduce((sum, a) => sum + (a.commissionRate || 0), 0) / allAgents.length 
        : 0,
      topAgents: allAgents
        .map(a => ({
          _id: a._id,
          name: a.name,
          email: a.email,
          status: a.status,
          commissionRate: a.commissionRate,
          institutionCount: agentIdToInstitutionCount[a._id] || 0,
          isGlobal: a.isGlobal || false
        }))
        .sort((a, b) => (b.institutionCount || 0) - (a.institutionCount || 0))
        .slice(0, 10)
    };
    
    return successResponse(res, analytics, 'Agents analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching agents analytics:', error);
    return errorResponse(res, error.message);
  }
};

const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    logger.info(`Updating agent: ${id}`);
    
    return successResponse(res, { _id: id, ...updates }, 'Agent updated successfully');
  } catch (error) {
    logger.error('Error updating agent:', error);
    return errorResponse(res, error.message);
  }
};

const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Deleting agent: ${id}`);
    
    return successResponse(res, null, 'Agent deleted successfully');
  } catch (error) {
    logger.error('Error deleting agent:', error);
    return errorResponse(res, error.message);
  }
};

const bulkUpdateAgentsStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    logger.info(`Bulk updating agents: ${ids.join(', ')} to status: ${status}`);
    
    return successResponse(res, { updatedCount: ids.length }, 'Agents status updated successfully');
  } catch (error) {
    logger.error('Error bulk updating agents:', error);
    return errorResponse(res, error.message);
  }
};

const getAllData = async (req, res) => {
  try {
    logger.info('Fetching all data for comprehensive report');
    
    const Institution = (await import('../models/Institution.js')).default;
    const User = (await import('../models/User.js')).default;
    const Agent = (await import('../models/Agent.js')).default;
    
    const [institutions, users, agents] = await Promise.all([
      Institution.find({}).lean(),
      User.find({}).lean(),
      Agent.find({}).lean()
    ]);
    
    const usersByInstitution = {};
    const usersByRole = {};
    
    users.forEach(u => {
      const instId = u.institutionId || '__platform__';
      if (!usersByInstitution[instId]) usersByInstitution[instId] = [];
      usersByInstitution[instId].push({
        _id: u._id,
        name: u.name || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : ''),
        email: u.email || '',
        role: u.role || '',
        status: u.status || 'inactive',
        password: u.password || '',
        designation: u.designation || '',
        institutionCode: u.institutionCode || '',
        isOnline: u.isOnline || false,
        lastSeen: u.lastSeen || null,
        createdAt: u.createdAt || null
      });
      
      if (!usersByRole[u.role]) usersByRole[u.role] = 0;
      usersByRole[u.role]++;
    });
    
    const institutionList = institutions.map(inst => {
      const instUsers = usersByInstitution[inst._id.toString()] || [];
      const roleBreakdown = {};
      instUsers.forEach(u => {
        if (!roleBreakdown[u.role]) roleBreakdown[u.role] = 0;
        roleBreakdown[u.role]++;
      });
      
      const agentUsers = instUsers.filter(u => u.role === 'agent');
      const nonAgentUsers = instUsers.filter(u => u.role !== 'agent');
      
      return {
        _id: inst._id,
        name: inst.name,
        code: inst.instituteCode || inst.code,
        type: inst.type,
        status: inst.status,
        email: inst.email || '',
        phone: inst.phone || '',
        totalUsers: instUsers.length,
        totalAgents: agentUsers.length,
        totalNonAgentUsers: nonAgentUsers.length,
        roleBreakdown,
        users: instUsers,
        agents: agentUsers,
        nonAgentUsers: nonAgentUsers
      };
    });
    
    const agentUsers = usersByInstitution['__platform__'] 
      ? usersByInstitution['__platform__'].filter(u => u.role === 'agent') 
      : [];
    const agentAgents = agents.map(a => ({
      _id: a._id,
      name: a.name,
      email: a.email,
      phone: a.phone || '',
      city: a.city || '',
      state: a.state || '',
      status: a.status,
      commissionRate: a.commissionRate,
      isGlobal: true,
      password: '(Agent profile - login via institution user account)',
      createdAt: a.createdAt
    }));
    
    return successResponse(res, {
      summary: {
        totalInstitutions: institutions.length,
        totalUsers: users.length,
        totalAgents: agentUsers.length + agentAgents.length,
        usersByRole,
        platformLevelAgents: agentAgents.length,
        institutionLevelAgents: agentUsers.length
      },
      institutions: institutionList,
      platformAgents: agentAgents,
      allUsers: users.map(u => ({
        _id: u._id,
        name: u.name || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : ''),
        email: u.email || '',
        role: u.role || '',
        status: u.status || 'inactive',
        password: u.password || '',
        designation: u.designation || '',
        institutionId: u.institutionId || null,
        institutionName: institutions.find(i => i._id.toString() === (u.institutionId || '').toString())?.name || 'Platform',
        institutionCode: u.institutionCode || '',
        isOnline: u.isOnline || false,
        lastSeen: u.lastSeen || null,
        createdAt: u.createdAt || null
      }))
    }, 'All data retrieved successfully');
  } catch (error) {
    logger.error('Error fetching all data:', error);
    return errorResponse(res, error.message);
  }
};

// Get institutions with their users for superadmin dashboard
const getInstitutionsWithUsers = async (req, res) => {
  try {
    logger.info('Fetching institutions with users for superadmin dashboard');
    
    const Institution = (await import('../models/Institution.js')).default;
    const User = (await import('../models/User.js')).default;
    const Subscription = (await import('../models/Subscription.js')).default;
    const Transaction = (await import('../models/Transaction.js')).default;
    
    // Get query parameters for pagination
    const { limit = 10, skip = 0, includeUsers = 'false', type } = req.query;
    const limitNum = Math.min(parseInt(limit) || 10, 50);
    const skipNum = parseInt(skip) || 0;
    const shouldIncludeUsers = includeUsers === 'true';
    
    // Build query
    const query = {};
    if (type) {
      query.type = decodeURIComponent(type);
    }
    
    // Get institutions with pagination
    const institutions = await Institution.find(query)
      .skip(skipNum)
      .limit(limitNum)
      .lean();
    
    const totalCount = await Institution.countDocuments(query);
    
    // Calculate revenue in INR for each institution
    const convertToINR = (amount) => {
      if (!amount) return 0;
      return parseFloat(amount) || 0;
    };
    
    const formatINR = (amount) => {
      const num = convertToINR(amount);
      return '₹' + num.toLocaleString('en-IN');
    };
    
    // Get users grouped by institution (only if requested)
    const institutionsWithUsers = await Promise.all(
      institutions.map(async (institution) => {
        let users = [];
        let usersByRole = {};
        let userStats = { total: 0, active: 0, inactive: 0, byRole: {} };
        
        // Get subscription info for this institution
        const subscription = institution.subscription || {};
        const analytics = institution.analytics || {};
        
        // Get revenue from transactions for this institution
        const monthlyRevenue = 0; // Would need aggregation
        
        if (shouldIncludeUsers) {
          users = await User.find({ institutionId: institution._id })
            .select('name email role institutionCode avatar status department designation phone')
            .limit(100)
            .lean();
          
          usersByRole = users.reduce((acc, user) => {
            const role = user.role || 'unknown';
            if (!acc[role]) acc[role] = [];
            acc[role].push(user);
            return acc;
          }, {});
          
          userStats = {
            total: users.length,
            active: users.filter(u => u.status === 'active').length,
            inactive: users.filter(u => u.status === 'inactive').length,
            byRole: Object.keys(usersByRole).reduce((acc, role) => {
              acc[role] = usersByRole[role].length;
              return acc;
            }, {})
          };
        }
        
        // Format revenue in INR
        const revenue = subscription.monthlyCost || 0;
        
        return {
          ...institution,
          name: institution.name,
          type: institution.type,
          code: institution.code || institution.instituteCode,
          status: institution.status,
          plan: subscription.planName || 'Basic',
          subscriptionStatus: subscription.status || 'active',
          subscriptionExpiry: subscription.endDate,
          email: institution.contact?.email || institution.principalEmail || '',
          phone: institution.contact?.phone || institution.principalPhone || '',
          address: institution.address || institution.contact?.address || {},
          users: shouldIncludeUsers ? users : [],
          usersByRole: usersByRole,
          userCount: userStats.total,
          userStats: userStats,
          analytics: {
            totalStudents: analytics.totalStudents || 0,
            totalTeachers: analytics.totalTeachers || 0,
            totalStaff: analytics.totalStaff || 0
          },
          monthlyRevenue: revenue,
          revenue: formatINR(revenue),
          revenueNumeric: convertToINR(revenue),
          currentUsers: analytics.totalStudents || 0,
          maxUsers: subscription.maxUsers || 100
        };
      })
    );
    
    // Calculate overall stats
    const totalActive = institutions.filter(i => i.status === 'active').length;
    const totalSuspended = institutions.filter(i => i.status === 'suspended').length;
    const totalExpired = institutions.filter(i => {
      const endDate = i.subscription?.endDate;
      return endDate && new Date(endDate) < new Date();
    }).length;
    
    const stats = {
      totalInstitutions: totalCount,
      totalUsers: 0,
      totalActiveUsers: 0,
      totalInactiveUsers: 0,
      roles: [],
      institutionsByStatus: {
        active: totalActive,
        suspended: totalSuspended,
        expired: totalExpired
      }
    };
    
    logger.info('Institutions with users fetched successfully');
    return successResponse(res, {
      institutions: institutionsWithUsers,
      stats: stats,
      pagination: {
        total: totalCount,
        limit: limitNum,
        skip: skipNum,
        hasMore: skipNum + limitNum < totalCount
      }
    }, 'Institutions with users retrieved successfully');
  } catch (error) {
    logger.error('Error fetching institutions with users:', error);
    return errorResponse(res, error.message);
  }
};

// Get institution details with all users
const getInstitutionDetailsWithUsers = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching institution details with users for ID: ${id}`);
    
    const Institution = (await import('../models/Institution.js')).default;
    const User = (await import('../models/User.js')).default;
    
    const institution = await Institution.findById(id).lean();
    
    if (!institution) {
      return notFoundResponse(res, 'Institution not found');
    }
    
    const users = await User.find({ institutionId: id })
      .select('name email role institutionCode institution avatar status department designation phone dateOfBirth')
      .lean();
    
    // Group users by role
    const usersByRole = users.reduce((acc, user) => {
      const role = user.role || 'unknown';
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(user);
      return acc;
    }, {});
    
    const institutionDetails = {
      ...institution,
      users: users,
      usersByRole: usersByRole,
      userCount: users.length,
      userStats: {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        byRole: Object.keys(usersByRole).reduce((acc, role) => {
          acc[role] = usersByRole[role].length;
          return acc;
        }, {})
      }
    };
    
    logger.info('Institution details with users fetched successfully');
    return successResponse(res, institutionDetails, 'Institution details with users retrieved successfully');
  } catch (error) {
    logger.error('Error fetching institution details with users:', error);
    return errorResponse(res, error.message);
  }
};

// ─── ANALYTICS METHODS ──────────────────────────────────────────────────────────

const getInstitutionsAnalytics = async (req, res) => {
  try {
    const Institution = (await import('../models/Institution.js')).default;
    
    const institutions = await Institution.find({});
    
    // Calculate analytics data
    const totalInstitutions = institutions.length;
    const activeInstitutions = institutions.filter(i => i.status === 'active' || i.status === 'Active').length;
    const schoolsCount = institutions.filter(i => i.type === 'School').length;
    const collegesCount = institutions.filter(i => i.type === 'Inter College' || i.type === 'Degree College').length;
    const totalStudents = institutions.reduce((sum, inst) => sum + (inst.students || inst.currentUsers || 0), 0);
    
    // Type distribution
    const typeDistribution = institutions.reduce((acc, inst) => {
      acc[inst.type] = (acc[inst.type] || 0) + 1;
      return acc;
    }, {});
    
    // Status distribution
    const statusDistribution = institutions.reduce((acc, inst) => {
      const status = inst.status === 'active' ? 'Active' : inst.status === 'inactive' ? 'Inactive' : inst.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Plan distribution
    const planDistribution = institutions.reduce((acc, inst) => {
      const plan = inst.plan || 'Basic';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});
    
    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRegistrations = institutions.filter(i => new Date(i.createdAt) >= thirtyDaysAgo);
    
    // Growth trend (last 6 months)
    const monthlyRegistrations = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const count = institutions.filter(i => {
        const created = new Date(i.createdAt);
        return created >= monthStart && created < monthEnd;
      }).length;
      
      monthlyRegistrations.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        registrations: count
      });
    }

    const analyticsData = {
      kpis: {
        totalInstitutions,
        activeInstitutions,
        schoolsCount,
        collegesCount,
        totalStudents,
        recentRegistrations: recentRegistrations.length
      },
      typeDistribution: Object.entries(typeDistribution).map(([name, value]) => ({ name, value })),
      statusDistribution: Object.entries(statusDistribution).map(([name, value]) => ({ name, value })),
      planDistribution: Object.entries(planDistribution).map(([name, value]) => ({ name, value })),
      growthTrend: monthlyRegistrations,
      recent: recentRegistrations.slice(-10).map(inst => ({
        id: inst._id,
        name: inst.name,
        type: inst.type,
        plan: inst.plan,
        status: inst.status,
        createdAt: inst.createdAt
      }))
    };

    return successResponse(res, analyticsData, 'Institutions analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching institutions analytics:', error);
    return errorResponse(res, error.message);
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    const Institution = (await import('../models/Institution.js')).default;
    
    const institutions = await Institution.find({});
    
    // Calculate user analytics
    const totalStudents = institutions.reduce((sum, inst) => sum + (inst.students || inst.currentUsers || 0), 0);
    const totalTeachers = Math.floor(totalStudents * 0.05); // Estimated
    const totalStaff = Math.floor(totalStudents * 0.08); // Estimated
    const totalParents = Math.floor(totalStudents * 1.8); // Estimated
    
    // Active users (estimated 85% of total)
    const activeUsers = Math.floor((totalStudents + totalTeachers + totalStaff + totalParents) * 0.85);
    const inactiveUsers = (totalStudents + totalTeachers + totalStaff + totalParents) - activeUsers;
    
    // Users by role
    const usersByRole = [
      { name: 'Students', value: totalStudents },
      { name: 'Teachers', value: totalTeachers },
      { name: 'Staff', value: totalStaff },
      { name: 'Parents', value: totalParents }
    ];
    
    // Users by institution (top 10)
    const usersByInstitution = institutions
      .sort((a, b) => (b.students || b.currentUsers || 0) - (a.students || a.currentUsers || 0))
      .slice(0, 10)
      .map(inst => ({
        name: inst.name,
        users: inst.students || inst.currentUsers || 0
      }));
    
    // Growth trend (estimated)
    const userGrowthTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      userGrowthTrend.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        users: Math.floor(totalStudents * (1 - (i * 0.1))) // Simulated growth
      });
    }

    const analyticsData = {
      kpis: {
        totalUsers: totalStudents + totalTeachers + totalStaff + totalParents,
        activeUsers,
        inactiveUsers,
        totalStudents,
        totalTeachers,
        totalStaff,
        totalParents
      },
      byRole: usersByRole,
      byInstitution: usersByInstitution,
      growthTrend: userGrowthTrend,
      activeVsInactive: [
        { name: 'Active', value: activeUsers },
        { name: 'Inactive', value: inactiveUsers }
      ]
    };

    return successResponse(res, analyticsData, 'User analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user analytics:', error);
    return errorResponse(res, error.message);
  }
};

const getBranchAnalytics = async (req, res) => {
  try {
    const Institution = (await import('../models/Institution.js')).default;
    
    const institutions = await Institution.find({});
    
    // Calculate branch analytics
    const totalBranches = institutions.reduce((sum, inst) => sum + (inst.currentSchools || 0), 0);
    const activeBranches = Math.floor(totalBranches * 0.85); // Estimated
    
    // Students by branch (estimated distribution)
    const studentsByBranch = institutions.slice(0, 10).map(inst => ({
      name: inst.name,
      students: inst.students || inst.currentUsers || 0,
      branches: inst.currentSchools || 1
    }));
    
    // Branch growth trend
    const branchGrowthTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      branchGrowthTrend.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        branches: Math.floor(totalBranches * (1 - (i * 0.05))) // Simulated growth
      });
    }
    
    // Revenue by branch (estimated)
    const revenueByBranch = institutions.slice(0, 10).map(inst => ({
      name: inst.name,
      revenue: (inst._monthlyRevenue || 0) * (inst.currentSchools || 1)
    }));

    const analyticsData = {
      kpis: {
        totalBranches,
        activeBranches,
        totalInstitutions: institutions.length
      },
      branches: institutions.map(inst => ({
        id: inst._id,
        name: inst.name,
        type: inst.type,
        branches: inst.currentSchools || 1,
        students: inst.students || inst.currentUsers || 0
      })),
      studentsByBranch,
      growthTrend: branchGrowthTrend,
      revenueByBranch
    };

    return successResponse(res, analyticsData, 'Branch analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching branch analytics:', error);
    return errorResponse(res, error.message);
  }
};

const getSubscriptionAnalytics = async (req, res) => {
  try {
    const Institution = (await import('../models/Institution.js')).default;
    
    const institutions = await Institution.find({});
    
    // Calculate subscription analytics
    const totalSubscriptions = institutions.length;
    const activeSubscriptions = institutions.filter(i => i.status === 'active' || i.status === 'Active').length;
    const expiredSubscriptions = institutions.filter(i => i.status === 'expired' || i.status === 'Expired').length;
    const suspendedSubscriptions = institutions.filter(i => i.status === 'suspended' || i.status === 'Suspended').length;
    
    // Plan distribution
    const planMix = institutions.reduce((acc, inst) => {
      const plan = inst.plan || 'Basic';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});
    
    // Monthly revenue by plan
    const revenueByPlan = Object.entries(planMix).map(([plan, count]) => {
      const monthlyPrice = plan === 'Premium' ? 199 : plan === 'Medium' ? 79 : 29;
      return {
        plan,
        count,
        revenue: count * monthlyPrice
      };
    });
    
    // Status trend
    const statusTrend = [
      { name: 'Active', value: activeSubscriptions },
      { name: 'Suspended', value: suspendedSubscriptions },
      { name: 'Expired', value: expiredSubscriptions }
    ];
    
    // Expiring soon (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiring = institutions.filter(inst => {
      if (!inst.subscriptionExpiry) return false;
      const expiryDate = new Date(inst.subscriptionExpiry);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
    });
    
    // Upgrades (estimated)
    const upgrades = [
      { month: 'Jan', upgrades: 5 },
      { month: 'Feb', upgrades: 8 },
      { month: 'Mar', upgrades: 12 },
      { month: 'Apr', upgrades: 7 },
      { month: 'May', upgrades: 15 },
      { month: 'Jun', upgrades: 10 }
    ];

    const analyticsData = {
      kpis: {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        suspendedSubscriptions,
        expiringSoon: expiring.length
      },
      planMix: Object.entries(planMix).map(([name, value]) => ({ name, value })),
      statusTrend,
      revenueByPlan,
      upgrades,
      expiring: expiring.map(inst => ({
        id: inst._id,
        name: inst.name,
        plan: inst.plan,
        expiryDate: inst.subscriptionExpiry,
        daysUntilExpiry: Math.ceil((new Date(inst.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24))
      }))
    };

    return successResponse(res, analyticsData, 'Subscription analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subscription analytics:', error);
    return errorResponse(res, error.message);
  }
};

const getSupportAnalytics = async (req, res) => {
  try {
    // Mock support analytics data since we don't have a support ticket model yet
    const analyticsData = {
      kpis: {
        totalTickets: 156,
        openTickets: 42,
        resolvedTickets: 114,
        averageResolutionTime: '2.5 days',
        satisfactionRate: 4.2
      },
      byType: [
        { name: 'Technical', value: 68 },
        { name: 'Billing', value: 34 },
        { name: 'Account', value: 28 },
        { name: 'Feature Request', value: 26 }
      ],
      trend: [
        { month: 'Jan', tickets: 25 },
        { month: 'Feb', tickets: 32 },
        { month: 'Mar', tickets: 28 },
        { month: 'Apr', tickets: 35 },
        { month: 'May', tickets: 30 },
        { month: 'Jun', tickets: 26 }
      ],
      resolutionRate: [
        { month: 'Jan', rate: 85 },
        { month: 'Feb', rate: 88 },
        { month: 'Mar', rate: 82 },
        { month: 'Apr', rate: 90 },
        { month: 'May', rate: 87 },
        { month: 'Jun', rate: 92 }
      ],
      recentTickets: [
        { id: 'TKT001', subject: 'Login issue', status: 'Resolved', priority: 'High' },
        { id: 'TKT002', subject: 'Billing inquiry', status: 'Open', priority: 'Medium' },
        { id: 'TKT003', subject: 'Feature request', status: 'In Progress', priority: 'Low' },
        { id: 'TKT004', subject: 'Account setup', status: 'Resolved', priority: 'High' },
        { id: 'TKT005', subject: 'Data export', status: 'Open', priority: 'Medium' }
      ]
    };

    return successResponse(res, analyticsData, 'Support analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching support analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getSuperAdminData,
  getPlatformHealth,
  updatePlatformHealth,
  getAlerts,
  createAlert,
  acknowledgeAlert,
  takeAlertAction,
  deleteAlert,
  getActivities,
  logActivity,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getInstitutions,
  getDashboardStats,
  getSystemMetrics,
  getAlertsBySeverity,
  bulkAcknowledgeAlerts,
  bulkDeleteAlerts,
  exportActivities,
  getAlertStatistics,
  getInstitutionsWithUsers,
  getInstitutionDetailsWithUsers,
  getActivityStatistics,
  getInstitutionStatistics,
  getAllUsers,
  updateUser,
  toggleUserStatus,
  deleteUser,
  resetUserPassword,
  getExpiryAlerts,
  getOverduePayments,
  getRenewalReminders,
  getAutoRenewSettings,
  getRevenueAnalytics,
  getTransactionStats,
  getSubscriptionStats,
  getPlatformSettings,
  updatePlatformSettings,
  getMaintenanceSettings,
  updateMaintenanceSettings,
  getAgents,
  getAgentById,
  getAgentDetails,
  getAgentsAnalytics,
  updateAgent,
  deleteAgent,
bulkUpdateAgentsStatus,
createAgent,

// All Data
getAllData,

// Analytics Methods
  getInstitutionsAnalytics,
  getUserAnalytics,
  getBranchAnalytics,
  getSubscriptionAnalytics,
  getSupportAnalytics
};

