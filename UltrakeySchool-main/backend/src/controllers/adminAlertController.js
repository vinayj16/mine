/**
 * Admin Alert Controller
 * Manages system alerts for administrators
 * Handles expiry alerts, payment reminders, renewals, and suspensions
 */

import adminAlertService from '../services/adminAlertService.js';
import ApiResponse from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id) => {
  if (!id) {
    throw new Error('ID is required');
  }
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new Error('Invalid ID format');
  }
  return id;
};

/**
 * Validate alert data
 */
const validateAlertData = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate) {
    if (!data.type) {
      errors.push('Alert type is required');
    }
    if (!data.institutionId) {
      errors.push('Institution ID is required');
    }
  }
  
  const validTypes = ['EXPIRY', 'PAYMENT_OVERDUE', 'RENEWAL_REMINDER', 'SUSPENSION', 'CUSTOM'];
  if (data.type && !validTypes.includes(data.type.toUpperCase())) {
    errors.push(`Type must be one of: ${validTypes.join(', ')}`);
  }
  
  const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  if (data.severity && !validSeverities.includes(data.severity.toUpperCase())) {
    errors.push(`Severity must be one of: ${validSeverities.join(', ')}`);
  }
  
  const validStatuses = ['pending', 'sent', 'resolved', 'dismissed'];
  if (data.status && !validStatuses.includes(data.status.toLowerCase())) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }
  
  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.details = errors;
    throw error;
  }
  
  return true;
};

/**
 * Get expiry alerts
 * @route GET /api/v1/admin-alerts/expiry
 */
const getExpiryAlerts = async (req, res, next) => {
  try {
    const { status, severity, page, limit, sortBy, sortOrder } = req.query;
    
    const filters = {};
    if (status) filters.status = status.toLowerCase();
    if (severity) filters.severity = severity.toUpperCase();

    const options = {
      page: Math.max(1, parseInt(page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit) || 20)),
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };

    const result = await adminAlertService.getExpiryAlerts(filters, options);
    
    logger.info('Expiry alerts retrieved', {
      userId: req.user?.id,
      count: result.alerts?.length || result.length,
      filters
    });

    return ApiResponse.success(
      res,
      'Expiry alerts retrieved successfully',
      result
    );
  } catch (error) {
    logger.error('Error getting expiry alerts:', error);
    next(error);
  }
};

/**
 * Get overdue payment alerts
 * @route GET /api/v1/admin-alerts/overdue-payments
 */
const getOverduePayments = async (req, res, next) => {
  try {
    const { status, page, limit, sortBy, sortOrder } = req.query;
    
    const filters = {};
    if (status) filters.status = status.toLowerCase();

    const options = {
      page: Math.max(1, parseInt(page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit) || 20)),
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };

    const result = await adminAlertService.getOverduePayments(filters, options);
    
    logger.info('Overdue payment alerts retrieved', {
      userId: req.user?.id,
      count: result.alerts?.length || result.length,
      filters
    });

    return ApiResponse.success(
      res,
      'Overdue payment alerts retrieved successfully',
      result
    );
  } catch (error) {
    logger.error('Error getting overdue payments:', error);
    next(error);
  }
};

/**
 * Get renewal reminder alerts
 * @route GET /api/v1/admin-alerts/renewal-reminders
 */
const getRenewalReminders = async (req, res, next) => {
  try {
    const { status, daysUntilExpiry, page, limit } = req.query;
    
    const filters = {};
    if (status) filters.status = status.toLowerCase();
    if (daysUntilExpiry) filters.daysUntilExpiry = parseInt(daysUntilExpiry);

    const options = {
      page: Math.max(1, parseInt(page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit) || 20))
    };

    const result = await adminAlertService.getRenewalReminders(filters, options);
    
    logger.info('Renewal reminder alerts retrieved', {
      userId: req.user?.id,
      count: result.alerts?.length || result.length,
      filters
    });

    return ApiResponse.success(
      res,
      'Renewal reminder alerts retrieved successfully',
      result
    );
  } catch (error) {
    logger.error('Error getting renewal reminders:', error);
    next(error);
  }
};

/**
 * Get auto-renew settings
 * @route GET /api/v1/admin-alerts/auto-renew-settings
 */
const getAutoRenewSettings = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    const options = {
      page: Math.max(1, parseInt(page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit) || 50))
    };

    const result = await adminAlertService.getAutoRenewSettings(options);
    
    logger.info('Auto-renew settings retrieved', {
      userId: req.user?.id,
      count: result.institutions?.length || result.length
    });

    return ApiResponse.success(
      res,
      'Auto-renew settings retrieved successfully',
      result
    );
  } catch (error) {
    logger.error('Error getting auto-renew settings:', error);
    next(error);
  }
};

/**
 * Get suspended institutions
 * @route GET /api/v1/admin-alerts/suspended-institutions
 */
const getSuspendedInstitutions = async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;
    
    const options = {
      page: Math.max(1, parseInt(page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit) || 20)),
      sortBy: sortBy || 'suspendedAt',
      sortOrder: sortOrder || 'desc'
    };

    const result = await adminAlertService.getSuspendedInstitutions(options);
    
    logger.info('Suspended institutions retrieved', {
      userId: req.user?.id,
      count: result.institutions?.length || result.length
    });

    return ApiResponse.success(
      res,
      'Suspended institutions retrieved successfully',
      result
    );
  } catch (error) {
    logger.error('Error getting suspended institutions:', error);
    next(error);
  }
};

/**
 * Create new alert
 * @route POST /api/v1/admin-alerts
 */
const createAlert = async (req, res, next) => {
  try {
    // Validate alert data
    validateAlertData(req.body);
    
    const alertData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const alert = await adminAlertService.createAlert(alertData);
    
    logger.info('Alert created', {
      alertId: alert._id,
      type: alert.type,
      institutionId: alert.institutionId,
      userId: req.user?.id
    });

    return ApiResponse.created(
      res,
      'Alert created successfully',
      alert
    );
  } catch (error) {
    logger.error('Error creating alert:', error);
    if (error.details) {
      return ApiResponse.badRequest(res, error.message, error.details);
    }
    next(error);
  }
};

/**
 * Update alert
 * @route PUT /api/v1/admin-alerts/:id
 */
const updateAlert = async (req, res, next) => {
  try {
    const alertId = validateObjectId(req.params.id);
    
    // Validate update data
    validateAlertData(req.body, true);
    
    const updateData = {
      ...req.body,
      updatedBy: req.user?.id,
      updatedAt: new Date()
    };

    const alert = await adminAlertService.updateAlert(alertId, updateData);
    
    if (!alert) {
      return ApiResponse.notFound(res, 'Alert not found');
    }

    logger.info('Alert updated', {
      alertId: alert._id,
      userId: req.user?.id,
      updates: Object.keys(req.body)
    });

    return ApiResponse.success(
      res,
      'Alert updated successfully',
      alert
    );
  } catch (error) {
    logger.error('Error updating alert:', error);
    if (error.details) {
      return ApiResponse.badRequest(res, error.message, error.details);
    }
    next(error);
  }
};

/**
 * Delete alert
 * @route DELETE /api/v1/admin-alerts/:id
 */
const deleteAlert = async (req, res, next) => {
  try {
    const alertId = validateObjectId(req.params.id);
    
    const alert = await adminAlertService.deleteAlert(alertId);
    
    if (!alert) {
      return ApiResponse.notFound(res, 'Alert not found');
    }

    logger.info('Alert deleted', {
      alertId,
      userId: req.user?.id,
      type: alert.type
    });

    return ApiResponse.success(
      res,
      'Alert deleted successfully',
      { id: alertId }
    );
  } catch (error) {
    logger.error('Error deleting alert:', error);
    next(error);
  }
};

/**
 * Bulk delete alerts
 * @route POST /api/v1/admin-alerts/bulk-delete
 */
const bulkDeleteAlerts = async (req, res, next) => {
  try {
    const { alertIds } = req.body;
    
    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return ApiResponse.badRequest(res, 'Alert IDs array is required');
    }
    
    // Validate all IDs
    alertIds.forEach(id => validateObjectId(id));
    
    const result = await adminAlertService.bulkDeleteAlerts(alertIds);

    logger.info('Bulk delete alerts', {
      userId: req.user?.id,
      count: result.deletedCount
    });

    return ApiResponse.success(
      res,
      `Successfully deleted ${result.deletedCount} alert(s)`,
      {
        deletedCount: result.deletedCount,
        requestedCount: alertIds.length
      }
    );
  } catch (error) {
    logger.error('Error bulk deleting alerts:', error);
    next(error);
  }
};

/**
 * Send reminder for alert
 * @route POST /api/v1/admin-alerts/:id/send-reminder
 */
const sendReminder = async (req, res, next) => {
  try {
    const alertId = validateObjectId(req.params.id);
    
    const alert = await adminAlertService.sendReminder(alertId, req.user?.id);
    
    if (!alert) {
      return ApiResponse.notFound(res, 'Alert not found');
    }

    logger.info('Reminder sent', {
      alertId: alert._id,
      userId: req.user?.id,
      institutionId: alert.institutionId
    });

    return ApiResponse.success(
      res,
      'Reminder sent successfully',
      alert
    );
  } catch (error) {
    logger.error('Error sending reminder:', error);
    next(error);
  }
};

/**
 * Resolve alert
 * @route POST /api/v1/admin-alerts/:id/resolve
 */
const resolveAlert = async (req, res, next) => {
  try {
    const alertId = validateObjectId(req.params.id);
    const { notes } = req.body;
    const resolvedBy = req.user?.id;
    
    const alert = await adminAlertService.resolveAlert(alertId, resolvedBy, notes);
    
    if (!alert) {
      return ApiResponse.notFound(res, 'Alert not found');
    }

    logger.info('Alert resolved', {
      alertId: alert._id,
      userId: req.user?.id,
      institutionId: alert.institutionId
    });

    return ApiResponse.success(
      res,
      'Alert resolved successfully',
      alert
    );
  } catch (error) {
    logger.error('Error resolving alert:', error);
    next(error);
  }
};

/**
 * Dismiss alert
 * @route POST /api/v1/admin-alerts/:id/dismiss
 */
const dismissAlert = async (req, res, next) => {
  try {
    const alertId = validateObjectId(req.params.id);
    const { reason } = req.body;
    
    const alert = await adminAlertService.dismissAlert(alertId, req.user?.id, reason);
    
    if (!alert) {
      return ApiResponse.notFound(res, 'Alert not found');
    }

    logger.info('Alert dismissed', {
      alertId: alert._id,
      userId: req.user?.id,
      reason
    });

    return ApiResponse.success(
      res,
      'Alert dismissed successfully',
      alert
    );
  } catch (error) {
    logger.error('Error dismissing alert:', error);
    next(error);
  }
};

/**
 * Toggle auto-renew for institution
 * @route PATCH /api/v1/admin-alerts/institutions/:institutionId/auto-renew
 */
const toggleAutoRenew = async (req, res, next) => {
  try {
    const institutionId = validateObjectId(req.params.institutionId);
    const { autoRenew } = req.body;
    
    if (typeof autoRenew !== 'boolean') {
      return ApiResponse.badRequest(res, 'autoRenew must be a boolean value');
    }
    
    const institution = await adminAlertService.toggleAutoRenew(institutionId, autoRenew, req.user?.id);
    
    if (!institution) {
      return ApiResponse.notFound(res, 'Institution not found');
    }

    logger.info('Auto-renew toggled', {
      institutionId,
      autoRenew,
      userId: req.user?.id
    });

    return ApiResponse.success(
      res,
      `Auto-renew ${autoRenew ? 'enabled' : 'disabled'} successfully`,
      {
        institutionId: institution._id,
        autoRenew: institution.autoRenew
      }
    );
  } catch (error) {
    logger.error('Error toggling auto-renew:', error);
    next(error);
  }
};

/**
 * Generate alerts from institutions
 * @route POST /api/v1/admin-alerts/generate
 */
const generateAlerts = async (req, res, next) => {
  try {
    const { daysBeforeExpiry } = req.body;
    
    const options = {
      daysBeforeExpiry: daysBeforeExpiry || 30,
      generatedBy: req.user?.id
    };

    const alerts = await adminAlertService.generateAlertsFromInstitutions(options);
    
    logger.info('Alerts generated', {
      userId: req.user?.id,
      count: alerts.length,
      daysBeforeExpiry: options.daysBeforeExpiry
    });

    return ApiResponse.success(
      res,
      `Generated ${alerts.length} alert(s) successfully`,
      {
        alerts,
        count: alerts.length
      }
    );
  } catch (error) {
    logger.error('Error generating alerts:', error);
    next(error);
  }
};

/**
 * Get alert statistics
 * @route GET /api/v1/admin-alerts/statistics
 */
const getAlertStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const options = {};
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const stats = await adminAlertService.getAlertStatistics(options);
    
    logger.info('Alert statistics retrieved', {
      userId: req.user?.id,
      totalAlerts: stats.total
    });

    return ApiResponse.success(
      res,
      'Alert statistics retrieved successfully',
      stats
    );
  } catch (error) {
    logger.error('Error getting alert statistics:', error);
    next(error);
  }
};

/**
 * Get alert by ID
 * @route GET /api/v1/admin-alerts/:id
 */
const getAlertById = async (req, res, next) => {
  try {
    const alertId = validateObjectId(req.params.id);
    
    const alert = await adminAlertService.getAlertById(alertId);
    
    if (!alert) {
      return ApiResponse.notFound(res, 'Alert not found');
    }

    logger.info('Alert retrieved', {
      alertId,
      userId: req.user?.id
    });

    return ApiResponse.success(
      res,
      'Alert retrieved successfully',
      alert
    );
  } catch (error) {
    logger.error('Error getting alert by ID:', error);
    next(error);
  }
};

/**
 * Get all alerts with filtering
 * @route GET /api/v1/admin-alerts
 */
const getAllAlerts = async (req, res, next) => {
  try {
    const { 
      type, 
      status, 
      severity, 
      institutionId,
      page, 
      limit, 
      sortBy, 
      sortOrder 
    } = req.query;
    
    const filters = {};
    if (type) filters.type = type.toUpperCase();
    if (status) filters.status = status.toLowerCase();
    if (severity) filters.severity = severity.toUpperCase();
    if (institutionId) filters.institutionId = institutionId;

    const options = {
      page: Math.max(1, parseInt(page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit) || 20)),
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };

    const result = await adminAlertService.getAllAlerts(filters, options);
    
    logger.info('All alerts retrieved', {
      userId: req.user?.id,
      count: result.alerts?.length || 0,
      total: result.pagination?.total || 0,
      filters
    });

    return ApiResponse.success(
      res,
      'Alerts retrieved successfully',
      result
    );
  } catch (error) {
    logger.error('Error getting all alerts:', error);
    next(error);
  }
};

export default {
  getAllAlerts,
  getAlertById,
  getExpiryAlerts,
  getOverduePayments,
  getRenewalReminders,
  getAutoRenewSettings,
  getSuspendedInstitutions,
  createAlert,
  updateAlert,
  deleteAlert,
  bulkDeleteAlerts,
  sendReminder,
  resolveAlert,
  dismissAlert,
  toggleAutoRenew,
  generateAlerts,
  getAlertStatistics
};
