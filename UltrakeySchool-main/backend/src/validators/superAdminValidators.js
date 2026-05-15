import { body, param, query } from 'express-validator';

export const updatePlatformHealthValidator = [
  body('serverStatus').optional().isIn(['online', 'maintenance', 'offline']).withMessage('Invalid server status'),
  body('databaseStatus').optional().isIn(['healthy', 'degraded', 'critical']).withMessage('Invalid database status'),
  body('apiStatus').optional().isIn(['operational', 'degraded', 'outage']).withMessage('Invalid API status'),
  body('uptime').optional().isString().withMessage('Uptime must be a string'),
  body('activeUsers').optional().isInt({ min: 0 }).withMessage('Active users must be a non-negative integer'),
  body('totalSchools').optional().isInt({ min: 0 }).withMessage('Total schools must be a non-negative integer'),
  body('pendingTickets').optional().isInt({ min: 0 }).withMessage('Pending tickets must be a non-negative integer')
];

export const createAlertValidator = [
  body('type').isIn(['critical', 'warning', 'info']).withMessage('Invalid alert type'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('actionRequired').optional().isBoolean().withMessage('Action required must be a boolean'),
  body('actionUrl').optional().trim().isURL().withMessage('Action URL must be a valid URL'),
  body('severity').optional().isInt({ min: 1, max: 10 }).withMessage('Severity must be between 1 and 10'),
  body('expiresAt').optional().isISO8601().withMessage('Expires at must be a valid date')
];

export const alertIdValidator = [
  param('alertId').isMongoId().withMessage('Invalid alert ID')
];

export const getAlertsValidator = [
  query('type').optional().isIn(['critical', 'warning', 'info']).withMessage('Invalid alert type'),
  query('acknowledged').optional().isBoolean().withMessage('Acknowledged must be a boolean'),
  query('actionRequired').optional().isBoolean().withMessage('Action required must be a boolean')
];

export const logActivityValidator = [
  body('action').trim().notEmpty().withMessage('Action is required'),
  body('resource').trim().notEmpty().withMessage('Resource is required'),
  body('resourceType').isIn(['school', 'user', 'subscription', 'ticket', 'module', 'setting', 'system', 'other']).withMessage('Invalid resource type'),
  body('resourceId').optional().isMongoId().withMessage('Invalid resource ID'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  body('status').optional().isIn(['success', 'failed', 'pending']).withMessage('Invalid status'),
  body('details').optional().isObject().withMessage('Details must be an object'),
  body('errorMessage').optional().trim()
];

export const getActivitiesValidator = [
  query('resourceType').optional().isIn(['school', 'user', 'subscription', 'ticket', 'module', 'setting', 'system', 'other']).withMessage('Invalid resource type'),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  query('status').optional().isIn(['success', 'failed', 'pending']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const createMenuItemValidator = [
  body('id').trim().notEmpty().withMessage('ID is required'),
  body('to').trim().notEmpty().withMessage('Path is required'),
  body('label').trim().notEmpty().withMessage('Label is required'),
  body('icon').trim().notEmpty().withMessage('Icon is required'),
  body('category').isIn(['platform', 'analytics', 'security', 'system']).withMessage('Invalid category'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
  body('description').optional().trim()
];

export const updateMenuItemValidator = [
  param('menuItemId').isMongoId().withMessage('Invalid menu item ID'),
  body('to').optional().trim().notEmpty().withMessage('Path cannot be empty'),
  body('label').optional().trim().notEmpty().withMessage('Label cannot be empty'),
  body('icon').optional().trim().notEmpty().withMessage('Icon cannot be empty'),
  body('category').optional().isIn(['platform', 'analytics', 'security', 'system']).withMessage('Invalid category'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

export const menuItemIdValidator = [
  param('menuItemId').isMongoId().withMessage('Invalid menu item ID')
];

export const getMenuItemsValidator = [
  query('category').optional().isIn(['platform', 'analytics', 'security', 'system']).withMessage('Invalid category')
];
