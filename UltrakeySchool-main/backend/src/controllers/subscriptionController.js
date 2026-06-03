import * as subscriptionService from '../services/subscriptionService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import paymentGatewayService from '../services/paymentGatewayService.js';
import emailService from '../services/emailService.js';
import User from '../models/User.js';

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
    
    const { institutionId } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'School ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subscription = await subscriptionService.getSchoolSubscription(institutionId);
    
    if (!subscription) {
      return notFoundResponse(res, 'No active subscription found');
    }
    
    logger.info('School subscription fetched successfully:', { institutionId });
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
    
    const { institutionId, planId, billingCycle, startDate } = req.body;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('School ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'School ID');
      if (institutionIdError) errors.push(institutionIdError);
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
    
    logger.info('Subscription created successfully:', { institutionId, planId });
    return createdResponse(res, result, 'Subscription created successfully');
  } catch (error) {
    logger.error('Error creating subscription:', error);
    return errorResponse(res, error.message);
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly', institutionId } = req.body;
    if (!planId) {
      return validationErrorResponse(res, ['Plan ID is required']);
    }
    const plan = await subscriptionService.getPlanById(planId);
    if (!plan) {
      return notFoundResponse(res, 'Plan not found');
    }
    let amount = plan.price;
    if (!amount || amount <= 0) {
      logger.error('Invalid plan price:', { planId, price: amount, plan });
      return errorResponse(res, `Invalid plan price for ${planId}: ${amount}`);
    }
    if (billingCycle === 'yearly') {
      amount = amount * 12 * 0.85;
    }
    // Subscription payments use PLATFORM Razorpay keys (payments go to superadmin, not institution)
    const razorpayInstance = await paymentGatewayService.getPlatformRazorpay();
    logger.info(`Creating Razorpay order for plan ${planId}: ₹${amount} (${billingCycle})`);
    const order = await paymentGatewayService.createRazorpayOrder({
      amount,
      currency: 'INR',
      receipt: `sub_${Date.now()}`,
      notes: { planId, billingCycle },
      razorpayInstance
    });
    const keyId = await paymentGatewayService.getPlatformRazorpayKeyId();
    return successResponse(res, {
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId
    }, 'Razorpay order created');
  } catch (error) {
    logger.error('Error creating Razorpay order:', error);
    return errorResponse(res, error.message);
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, billingCycle, institutionId, discount } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return validationErrorResponse(res, ['Missing Razorpay payment details']);
    }
    const verification = await paymentGatewayService.verifyRazorpayPayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });
    if (!verification.success) {
      return errorResponse(res, 'Payment verification failed');
    }
    const result = await subscriptionService.createSubscription({
      institutionId,
      planId,
      billingCycle: billingCycle || 'monthly',
      paymentMethod: { type: 'razorpay', brand: 'Razorpay', lastFour: razorpay_payment_id.slice(-4) },
      discount: discount || undefined
    });
    logger.info('Subscription created after Razorpay payment:', { institutionId, planId, razorpay_payment_id });
    try {
      const subscriber = await User.findById(institutionId).select('email name fullName').lean();
      if (subscriber?.email) {
        const plan = await subscriptionService.getPlanById(planId);
        await emailService.sendPaymentConfirmationEmail(subscriber.email, {
          name: subscriber.name || subscriber.fullName || 'Valued Customer',
          planName: plan?.name || planId,
          amount: result.subscription?.price || 0,
          paymentId: razorpay_payment_id,
          status: 'Pending Approval'
        });
      }
    } catch (emailErr) {
      logger.warn('Failed to send payment confirmation email:', emailErr.message);
    }
    return createdResponse(res, result, 'Payment verified and subscription created successfully');
  } catch (error) {
    logger.error('Error verifying payment:', error);
    return errorResponse(res, error.message);
  }
};

// Upgrade subscription
export const upgradeSubscription = async (req, res) => {
  try {
    logger.info('Upgrading subscription');
    
    const { institutionId } = req.params;
    const { targetPlanId } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'School ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!targetPlanId) {
      errors.push('Target plan ID is required');
    }
    // Accept plan name strings ("basic", "medium", "premium") or ObjectIds — service layer handles lookup
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await subscriptionService.upgradeSubscription(institutionId, targetPlanId, userId);
    
    logger.info('Subscription upgraded successfully:', { institutionId, targetPlanId });
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
    
    const { institutionId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'School ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (reason && reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subscription = await subscriptionService.cancelSubscription(institutionId, reason, userId);
    
    if (!subscription) {
      return notFoundResponse(res, 'Subscription not found');
    }
    
    logger.info('Subscription cancelled successfully:', { institutionId });
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
    
    const { institutionId } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'School ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await subscriptionService.renewSubscription(institutionId);
    
    if (!result) {
      return notFoundResponse(res, 'Subscription not found');
    }
    
    logger.info('Subscription renewed successfully:', { institutionId });
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

// Create a new plan (superadmin only)
export const createPlan = async (req, res) => {
  try {
    logger.info('Creating new plan');
    const plan = await subscriptionService.createPlan(req.body);
    logger.info('Plan created successfully:', { planId: plan.planId });
    return createdResponse(res, plan, 'Plan created successfully');
  } catch (error) {
    logger.error('Error creating plan:', error);
    return errorResponse(res, error.message);
  }
};

// Update an existing plan (superadmin only)
export const updatePlan = async (req, res) => {
  try {
    logger.info('Updating plan');
    const { planId } = req.params;
    const plan = await subscriptionService.updatePlan(planId, req.body);
    if (!plan) {
      return notFoundResponse(res, 'Plan not found');
    }
    logger.info('Plan updated successfully:', { planId });
    return successResponse(res, plan, 'Plan updated successfully');
  } catch (error) {
    logger.error('Error updating plan:', error);
    return errorResponse(res, error.message);
  }
};

// Delete a plan (superadmin only)
export const deletePlan = async (req, res) => {
  try {
    logger.info('Deleting plan');
    const { planId } = req.params;
    const plan = await subscriptionService.deletePlan(planId);
    if (!plan) {
      return notFoundResponse(res, 'Plan not found');
    }
    logger.info('Plan deleted successfully:', { planId });
    return successResponse(res, null, 'Plan deleted successfully');
  } catch (error) {
    logger.error('Error deleting plan:', error);
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
    
    const { institutionId } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'School ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await subscriptionService.checkSubscriptionLimits(institutionId);
    
    logger.info('Subscription limits checked successfully:', { institutionId });
    return successResponse(res, result, 'Subscription limits retrieved successfully');
  } catch (error) {
    logger.error('Error checking subscription limits:', error);
    return errorResponse(res, error.message);
  }
};

// Get pending subscriptions (for superadmin approval)
export const getPendingSubscriptions = async (req, res) => {
  try {
    logger.info('Fetching pending subscriptions');
    
    const { default: Subscription } = await import('../models/Subscription.js');
    const subscriptions = await Subscription.find({ status: 'pending' })
      .populate('institutionId', 'name instituteCode')
      .sort({ createdAt: -1 })
      .lean();
    
    logger.info('Pending subscriptions fetched:', { count: subscriptions.length });
    return successResponse(res, subscriptions, 'Pending subscriptions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching pending subscriptions:', error);
    return errorResponse(res, error.message);
  }
};

// Approve or reject a subscription
// eslint-disable-next-line max-statements
export const approveSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { action, notes } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return validationErrorResponse(res, ['Action must be "approve" or "reject"']);
    }

    const result = await subscriptionService.approveSubscription(subscriptionId, action, notes);

    logger.info(`Subscription ${action}d: ${subscriptionId}`);
    return successResponse(res, result, `Subscription ${action}d successfully`);
  } catch (error) {
    logger.error('Error approving subscription:', error);
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
    
    const { institutionId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'School ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (reason && reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subscription = await subscriptionService.suspendSubscription(institutionId, reason, userId);
    
    if (!subscription) {
      return notFoundResponse(res, 'Subscription not found');
    }
    
    logger.info('Subscription suspended successfully:', { institutionId });
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
    
    const { institutionId } = req.params;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'School ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subscription = await subscriptionService.reactivateSubscription(institutionId, userId);
    
    if (!subscription) {
      return notFoundResponse(res, 'Subscription not found');
    }
    
    logger.info('Subscription reactivated successfully:', { institutionId });
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
    
    const { institutionId } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'School ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const history = await subscriptionService.getSubscriptionHistory(institutionId);
    
    logger.info('Subscription history fetched successfully:', { institutionId, count: history.length });
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
    
    const { institutionId } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'School ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const usage = await subscriptionService.getSubscriptionUsage(institutionId);
    
    logger.info('Subscription usage fetched successfully:', { institutionId });
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
    
    const { institutionId } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'School ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await subscriptionService.sendRenewalReminder(institutionId);
    
    logger.info('Renewal reminder sent successfully:', { institutionId });
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
