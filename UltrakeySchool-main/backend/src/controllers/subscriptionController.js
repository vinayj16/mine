import * as subscriptionService from '../services/subscriptionService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'expired', 'cancelled', 'suspended', 'trial', 'pending'];
const VALID_BILLING_CYCLES = ['monthly', 'quarterly', 'yearly', 'lifetime'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_REASON_LENGTH = 500;
const MAX_DAYS_EXPIRING = 90;
const MIN_DAYS_EXPIRING = 1;

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

// Helper function to validate email
const validateEmail = (email) => {
  if (!email) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  return null;
};

// Get school subscription
export const getSchoolSubscription = async (req, res) => {
  try {
    logger.info('Fetching school subscription');
    
    const { schoolId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subscription = await subscriptionService.getSchoolSubscription(schoolId);
    
    if (!subscription) {
      return notFoundResponse(res, 'No active subscription found');
    }
    
    logger.info('School subscription fetched successfully:', { schoolId });
    return successResponse(res, subscription, 'Subscription retrieved successfully');
  } catch (error) {
    logger.error('Error fetching school subscription:', error);
    return errorResponse(res, error.message);
  }
};

// Get all plans
export const getAllPlans = async (_req, res) => {
  try {
    logger.info('Fetching all subscription plans');
    
    const plans = await subscriptionService.getAllPlans();
    
    logger.info('Subscription plans fetched successfully:', { count: plans.length });
    return successResponse(res, plans, 'Subscription plans retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subscription plans:', error);
    return errorResponse(res, error.message);
  }
};

// Get plan by ID
export const getPlanById = async (req, res) => {
  try {
    logger.info('Fetching subscription plan by ID');
    
    const { planId } = req.params;
    
    // Validation
    const errors = [];
    
    const planIdError = validateObjectId(planId, 'Plan ID');
    if (planIdError) errors.push(planIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const plan = await subscriptionService.getPlanById(planId);
    
    if (!plan) {
      return notFoundResponse(res, 'Plan not found');
    }
    
    logger.info('Subscription plan fetched successfully:', { planId });
    return successResponse(res, plan, 'Subscription plan retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subscription plan:', error);
    return errorResponse(res, error.message);
  }
};

// Create subscription
export const createSubscription = async (req, res) => {
  try {
    logger.info('Creating subscription');
    
    const { schoolId, planId, billingCycle, startDate } = req.body;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    } else {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!planId) {
      errors.push('Plan ID is required');
    } else {
      const planIdError = validateObjectId(planId, 'Plan ID');
      if (planIdError) errors.push(planIdError);
    }
    
    if (billingCycle && !VALID_BILLING_CYCLES.includes(billingCycle)) {
      errors.push('Invalid billing cycle. Must be one of: ' + VALID_BILLING_CYCLES.join(', '));
    }
    
    if (startDate) {
      const date = new Date(startDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid start date format');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await subscriptionService.createSubscription(req.body);
    
    logger.info('Subscription created successfully:', { schoolId, planId });
    return createdResponse(res, result, 'Subscription created successfully');
  } catch (error) {
    logger.error('Error creating subscription:', error);
    return errorResponse(res, error.message);
  }
};

// Upgrade subscription
export const upgradeSubscription = async (req, res) => {
  try {
    logger.info('Upgrading subscription');
    
    const { schoolId } = req.params;
    const { targetPlanId } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!targetPlanId) {
      errors.push('Target plan ID is required');
    } else {
      const targetPlanIdError = validateObjectId(targetPlanId, 'Target plan ID');
      if (targetPlanIdError) errors.push(targetPlanIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await subscriptionService.upgradeSubscription(schoolId, targetPlanId, userId);
    
    logger.info('Subscription upgraded successfully:', { schoolId, targetPlanId });
    return successResponse(res, result, 'Subscription upgraded successfully');
  } catch (error) {
    logger.error('Error upgrading subscription:', error);
    return errorResponse(res, error.message);
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    logger.info('Cancelling subscription');
    
    const { schoolId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (reason && reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subscription = await subscriptionService.cancelSubscription(schoolId, reason, userId);
    
    if (!subscription) {
      return notFoundResponse(res, 'Subscription not found');
    }
    
    logger.info('Subscription cancelled successfully:', { schoolId });
    return successResponse(res, subscription, 'Subscription cancelled successfully');
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    return errorResponse(res, error.message);
  }
};

// Renew subscription
export const renewSubscription = async (req, res) => {
  try {
    logger.info('Renewing subscription');
    
    const { schoolId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await subscriptionService.renewSubscription(schoolId);
    
    if (!result) {
      return notFoundResponse(res, 'Subscription not found');
    }
    
    logger.info('Subscription renewed successfully:', { schoolId });
    return successResponse(res, result, 'Subscription renewed successfully');
  } catch (error) {
    logger.error('Error renewing subscription:', error);
    return errorResponse(res, error.message);
  }
};

// Get expiring subscriptions
export const getExpiringSubscriptions = async (req, res) => {
  try {
    logger.info('Fetching expiring subscriptions');
    
    const { days } = req.query;
    
    // Validation
    const errors = [];
    
    const daysNum = parseInt(days) || 7;
    
    if (daysNum < MIN_DAYS_EXPIRING || daysNum > MAX_DAYS_EXPIRING) {
      errors.push('Days must be between ' + MIN_DAYS_EXPIRING + ' and ' + MAX_DAYS_EXPIRING);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subscriptions = await subscriptionService.getExpiringSubscriptions(daysNum);
    
    logger.info('Expiring subscriptions fetched successfully:', { days: daysNum, count: subscriptions.length });
    return successResponse(res, subscriptions, 'Expiring subscriptions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching expiring subscriptions:', error);
    return errorResponse(res, error.message);
  }
};

// Get subscription stats
export const getSubscriptionStats = async (_req, res) => {
  try {
    logger.info('Fetching subscription statistics');
    
    const stats = await subscriptionService.getSubscriptionStats();
    
    logger.info('Subscription statistics fetched successfully');
    return successResponse(res, stats, 'Subscription statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subscription statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Check subscription limits
export const checkSubscriptionLimits = async (req, res) => {
  try {
    logger.info('Checking subscription limits');
    
    const { schoolId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await subscriptionService.checkSubscriptionLimits(schoolId);
    
    logger.info('Subscription limits checked successfully:', { schoolId });
    return successResponse(res, result, 'Subscription limits retrieved successfully');
  } catch (error) {
    logger.error('Error checking subscription limits:', error);
    return errorResponse(res, error.message);
  }
};

// Subscribe to coming soon notifications
export const subscribeComingSoon = async (req, res) => {
  try {
    logger.info('Processing coming soon subscription');
    
    const { email } = req.body;
    
    // Validation
    const errors = [];
    
    const emailError = validateEmail(email);
    if (emailError) errors.push(emailError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Define schema if not exists
    let ComingSoonSubscription;
    try {
      ComingSoonSubscription = mongoose.model('ComingSoonSubscription');
    } catch {
      const comingSoonSchema = new mongoose.Schema({
        email: {
          type: String,
          required: true,
          unique: true,
          lowercase: true,
          trim: true
        },
        subscribedAt: {
          type: Date,
          default: Date.now
        },
        notified: {
          type: Boolean,
          default: false
        }
      });
      ComingSoonSubscription = mongoose.model('ComingSoonSubscription', comingSoonSchema);
    }
    
    // Check if email already subscribed
    const existing = await ComingSoonSubscription.findOne({ email: email.toLowerCase() });
    if (existing) {
      logger.info('Email already subscribed to coming soon:', { email });
      return successResponse(res, null, 'You are already subscribed to our launch notifications');
    }
    
    // Create new subscription
    await ComingSoonSubscription.create({
      email: email.toLowerCase()
    });
    
    logger.info('Coming soon subscription created successfully:', { email });
    return createdResponse(res, null, 'Successfully subscribed! We will notify you when we launch.');
  } catch (error) {
    logger.error('Error processing coming soon subscription:', error);
    return errorResponse(res, error.message);
  }
};

// Get subscriptions by status
export const getSubscriptionsByStatus = async (req, res) => {
  try {
    logger.info('Fetching subscriptions by status');
    
    const { status } = req.params;
    
    // Validation
    const errors = [];
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subscriptions = await subscriptionService.getSubscriptionsByStatus(status);
    
    logger.info('Subscriptions fetched by status successfully:', { status, count: subscriptions.length });
    return successResponse(res, subscriptions, 'Subscriptions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subscriptions by status:', error);
    return errorResponse(res, error.message);
  }
};

// Get all subscriptions
export const getAllSubscriptions = async (req, res) => {
  try {
    logger.info('Fetching all subscriptions');
    
    const { status, planId, page, limit, sortBy, sortOrder } = req.query;
    
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
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (planId) {
      const planIdError = validateObjectId(planId, 'Plan ID');
      if (planIdError) errors.push(planIdError);
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: ' + VALID_SORT_ORDERS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = { status, planId };
    const options = {
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };
    
    const result = await subscriptionService.getAllSubscriptions(filters, options);
    
    logger.info('All subscriptions fetched successfully');
    return successResponse(res, result, 'Subscriptions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching all subscriptions:', error);
    return errorResponse(res, error.message);
  }
};

// Suspend subscription
export const suspendSubscription = async (req, res) => {
  try {
    logger.info('Suspending subscription');
    
    const { schoolId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (reason && reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subscription = await subscriptionService.suspendSubscription(schoolId, reason, userId);
    
    if (!subscription) {
      return notFoundResponse(res, 'Subscription not found');
    }
    
    logger.info('Subscription suspended successfully:', { schoolId });
    return successResponse(res, subscription, 'Subscription suspended successfully');
  } catch (error) {
    logger.error('Error suspending subscription:', error);
    return errorResponse(res, error.message);
  }
};

// Reactivate subscription
export const reactivateSubscription = async (req, res) => {
  try {
    logger.info('Reactivating subscription');
    
    const { schoolId } = req.params;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subscription = await subscriptionService.reactivateSubscription(schoolId, userId);
    
    if (!subscription) {
      return notFoundResponse(res, 'Subscription not found');
    }
    
    logger.info('Subscription reactivated successfully:', { schoolId });
    return successResponse(res, subscription, 'Subscription reactivated successfully');
  } catch (error) {
    logger.error('Error reactivating subscription:', error);
    return errorResponse(res, error.message);
  }
};

// Get subscription history
export const getSubscriptionHistory = async (req, res) => {
  try {
    logger.info('Fetching subscription history');
    
    const { schoolId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const history = await subscriptionService.getSubscriptionHistory(schoolId);
    
    logger.info('Subscription history fetched successfully:', { schoolId, count: history.length });
    return successResponse(res, history, 'Subscription history retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subscription history:', error);
    return errorResponse(res, error.message);
  }
};

// Get subscription usage
export const getSubscriptionUsage = async (req, res) => {
  try {
    logger.info('Fetching subscription usage');
    
    const { schoolId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const usage = await subscriptionService.getSubscriptionUsage(schoolId);
    
    logger.info('Subscription usage fetched successfully:', { schoolId });
    return successResponse(res, usage, 'Subscription usage retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subscription usage:', error);
    return errorResponse(res, error.message);
  }
};

// Export subscriptions
export const exportSubscriptions = async (req, res) => {
  try {
    logger.info('Exporting subscriptions');
    
    const { format, status, planId } = req.query;
    
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
    
    if (planId) {
      const planIdError = validateObjectId(planId, 'Plan ID');
      if (planIdError) errors.push(planIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await subscriptionService.exportSubscriptions({
      format: format.toLowerCase(),
      status,
      planId
    });
    
    logger.info('Subscriptions exported successfully:', { format });
    return successResponse(res, exportData, 'Subscriptions exported successfully');
  } catch (error) {
    logger.error('Error exporting subscriptions:', error);
    return errorResponse(res, error.message);
  }
};

// Get revenue statistics
export const getRevenueStatistics = async (req, res) => {
  try {
    logger.info('Fetching revenue statistics');
    
    const { startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
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
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        errors.push('Start date must be before or equal to end date');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await subscriptionService.getRevenueStatistics({ startDate, endDate });
    
    logger.info('Revenue statistics fetched successfully');
    return successResponse(res, statistics, 'Revenue statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching revenue statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get plan statistics
export const getPlanStatistics = async (req, res) => {
  try {
    logger.info('Fetching plan statistics');
    
    const { planId } = req.params;
    
    // Validation
    const errors = [];
    
    const planIdError = validateObjectId(planId, 'Plan ID');
    if (planIdError) errors.push(planIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await subscriptionService.getPlanStatistics(planId);
    
    logger.info('Plan statistics fetched successfully:', { planId });
    return successResponse(res, statistics, 'Plan statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching plan statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Send renewal reminder
export const sendRenewalReminder = async (req, res) => {
  try {
    logger.info('Sending renewal reminder');
    
    const { schoolId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await subscriptionService.sendRenewalReminder(schoolId);
    
    logger.info('Renewal reminder sent successfully:', { schoolId });
    return successResponse(res, result, 'Renewal reminder sent successfully');
  } catch (error) {
    logger.error('Error sending renewal reminder:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk send renewal reminders
export const bulkSendRenewalReminders = async (req, res) => {
  try {
    logger.info('Bulk sending renewal reminders');
    
    const { days } = req.body;
    
    // Validation
    const errors = [];
    
    const daysNum = parseInt(days) || 7;
    
    if (daysNum < MIN_DAYS_EXPIRING || daysNum > MAX_DAYS_EXPIRING) {
      errors.push('Days must be between ' + MIN_DAYS_EXPIRING + ' and ' + MAX_DAYS_EXPIRING);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await subscriptionService.bulkSendRenewalReminders(daysNum);
    
    logger.info('Bulk renewal reminders sent successfully:', { count: result.sentCount });
    return successResponse(res, result, 'Renewal reminders sent successfully');
  } catch (error) {
    logger.error('Error bulk sending renewal reminders:', error);
    return errorResponse(res, error.message);
  }
};
