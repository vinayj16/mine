import paymentGatewayService from '../services/paymentGatewayService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_PAYMENT_GATEWAYS = ['stripe', 'razorpay', 'payu', 'paypal', 'square'];
const VALID_PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'];
const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED'];
const VALID_REFUND_REASONS = ['duplicate', 'fraudulent', 'requested-by-customer', 'other'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 1000000;

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

// Helper function to validate amount
const validateAmount = (amount) => {
  if (amount === undefined || amount === null) {
    return 'Amount is required';
  }
  if (typeof amount !== 'number' || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return 'Amount must be between ' + MIN_AMOUNT + ' and ' + MAX_AMOUNT;
  }
  return null;
};

// Create Stripe Payment
const createStripePayment = async (req, res) => {
  try {
    logger.info('Creating Stripe payment');
    
    const { amount, currency, email, description, metadata } = req.body;
    
    // Validation
    const errors = [];
    
    const amountError = validateAmount(amount);
    if (amountError) errors.push(amountError);
    
    if (!currency) {
      errors.push('Currency is required');
    } else if (!VALID_CURRENCIES.includes(currency.toUpperCase())) {
      errors.push('Invalid currency. Must be one of: ' + VALID_CURRENCIES.join(', '));
    }
    
    if (email) {
      const emailError = validateEmail(email);
      if (emailError) errors.push(emailError);
    }
    
    if (description && description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const payment = await paymentGatewayService.createStripePayment(req.body);
    
    logger.info('Stripe payment created successfully:', { paymentId: payment.id });
    return createdResponse(res, payment, 'Stripe payment created successfully');
  } catch (error) {
    logger.error('Error creating Stripe payment:', error);
    return errorResponse(res, error.message);
  }
};

// Verify Stripe Payment
const verifyStripePayment = async (req, res) => {
  try {
    logger.info('Verifying Stripe payment');
    
    const { paymentIntentId } = req.params;
    
    // Validation
    const errors = [];
    
    if (!paymentIntentId || paymentIntentId.trim().length === 0) {
      errors.push('Payment Intent ID is required');
    } else if (!paymentIntentId.startsWith('pi_')) {
      errors.push('Invalid Stripe Payment Intent ID format');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const verification = await paymentGatewayService.verifyStripePayment(paymentIntentId);
    
    if (!verification) {
      return notFoundResponse(res, 'Payment not found');
    }
    
    logger.info('Stripe payment verified successfully:', { paymentIntentId });
    return successResponse(res, verification, 'Payment verified successfully');
  } catch (error) {
    logger.error('Error verifying Stripe payment:', error);
    return errorResponse(res, error.message);
  }
};

// Create Stripe Customer
const createStripeCustomer = async (req, res) => {
  try {
    logger.info('Creating Stripe customer');
    
    const { email, name, phone, address } = req.body;
    
    // Validation
    const errors = [];
    
    const emailError = validateEmail(email);
    if (emailError) errors.push(emailError);
    
    if (!name || name.trim().length === 0) {
      errors.push('Customer name is required');
    } else if (name.length > 200) {
      errors.push('Name must not exceed 200 characters');
    }
    
    if (phone && !/^\+?[\d\s\-()]{10,}$/.test(phone)) {
      errors.push('Invalid phone number format');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const customer = await paymentGatewayService.createStripeCustomer(req.body);
    
    logger.info('Stripe customer created successfully:', { customerId: customer.id });
    return createdResponse(res, customer, 'Stripe customer created successfully');
  } catch (error) {
    logger.error('Error creating Stripe customer:', error);
    return errorResponse(res, error.message);
  }
};

// Create Razorpay Order
const createRazorpayOrder = async (req, res) => {
  try {
    logger.info('Creating Razorpay order');
    
    const { amount, currency, receipt, notes } = req.body;
    
    // Validation
    const errors = [];
    
    const amountError = validateAmount(amount);
    if (amountError) errors.push(amountError);
    
    if (!currency) {
      errors.push('Currency is required');
    } else if (!VALID_CURRENCIES.includes(currency.toUpperCase())) {
      errors.push('Invalid currency. Must be one of: ' + VALID_CURRENCIES.join(', '));
    }
    
    if (receipt && receipt.length > 40) {
      errors.push('Receipt must not exceed 40 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const order = await paymentGatewayService.createRazorpayOrder(req.body);
    
    logger.info('Razorpay order created successfully:', { orderId: order.id });
    return createdResponse(res, order, 'Razorpay order created successfully');
  } catch (error) {
    logger.error('Error creating Razorpay order:', error);
    return errorResponse(res, error.message);
  }
};

// Verify Razorpay Payment
const verifyRazorpayPayment = async (req, res) => {
  try {
    logger.info('Verifying Razorpay payment');
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Validation
    const errors = [];
    
    if (!razorpay_order_id || razorpay_order_id.trim().length === 0) {
      errors.push('Razorpay order ID is required');
    }
    
    if (!razorpay_payment_id || razorpay_payment_id.trim().length === 0) {
      errors.push('Razorpay payment ID is required');
    }
    
    if (!razorpay_signature || razorpay_signature.trim().length === 0) {
      errors.push('Razorpay signature is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const verification = await paymentGatewayService.verifyRazorpayPayment(req.body);
    
    logger.info('Razorpay payment verified successfully:', { orderId: razorpay_order_id });
    return successResponse(res, verification, 'Payment verified successfully');
  } catch (error) {
    logger.error('Error verifying Razorpay payment:', error);
    return errorResponse(res, error.message);
  }
};

// Create PayU Payment
const createPayUPayment = async (req, res) => {
  try {
    logger.info('Creating PayU payment');
    
    const { amount, productinfo, firstname, email, phone } = req.body;
    
    // Validation
    const errors = [];
    
    const amountError = validateAmount(amount);
    if (amountError) errors.push(amountError);
    
    if (!productinfo || productinfo.trim().length === 0) {
      errors.push('Product info is required');
    } else if (productinfo.length > 200) {
      errors.push('Product info must not exceed 200 characters');
    }
    
    if (!firstname || firstname.trim().length === 0) {
      errors.push('First name is required');
    } else if (firstname.length > 100) {
      errors.push('First name must not exceed 100 characters');
    }
    
    const emailError = validateEmail(email);
    if (emailError) errors.push(emailError);
    
    if (!phone || phone.trim().length === 0) {
      errors.push('Phone number is required');
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(phone)) {
      errors.push('Invalid phone number format');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const payment = await paymentGatewayService.createPayUPayment(req.body);
    
    logger.info('PayU payment created successfully');
    return createdResponse(res, payment, 'PayU payment created successfully');
  } catch (error) {
    logger.error('Error creating PayU payment:', error);
    return errorResponse(res, error.message);
  }
};

// Verify PayU Payment
const verifyPayUPayment = async (req, res) => {
  try {
    logger.info('Verifying PayU payment');
    
    const { txnid, status, hash } = req.body;
    
    // Validation
    const errors = [];
    
    if (!txnid || txnid.trim().length === 0) {
      errors.push('Transaction ID is required');
    }
    
    if (!status || status.trim().length === 0) {
      errors.push('Payment status is required');
    }
    
    if (!hash || hash.trim().length === 0) {
      errors.push('Payment hash is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const verification = await paymentGatewayService.verifyPayUPayment(req.body);
    
    logger.info('PayU payment verified successfully:', { txnid });
    return successResponse(res, verification, 'Payment verified successfully');
  } catch (error) {
    logger.error('Error verifying PayU payment:', error);
    return errorResponse(res, error.message);
  }
};

// Process Refund
const processRefund = async (req, res) => {
  try {
    logger.info('Processing refund');
    
    const { gateway } = req.params;
    const { paymentId, amount, reason } = req.body;
    
    // Validation
    const errors = [];
    
    if (!gateway) {
      errors.push('Payment gateway is required');
    } else if (!VALID_PAYMENT_GATEWAYS.includes(gateway.toLowerCase())) {
      errors.push('Invalid gateway. Must be one of: ' + VALID_PAYMENT_GATEWAYS.join(', '));
    }
    
    if (!paymentId || paymentId.trim().length === 0) {
      errors.push('Payment ID is required');
    }
    
    if (amount !== undefined) {
      const amountError = validateAmount(amount);
      if (amountError) errors.push(amountError);
    }
    
    if (reason && !VALID_REFUND_REASONS.includes(reason)) {
      errors.push('Invalid refund reason. Must be one of: ' + VALID_REFUND_REASONS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const refund = await paymentGatewayService.processRefund(gateway, req.body);
    
    if (!refund) {
      return notFoundResponse(res, 'Payment not found');
    }
    
    logger.info('Refund processed successfully:', { gateway, paymentId });
    return successResponse(res, refund, 'Refund processed successfully');
  } catch (error) {
    logger.error('Error processing refund:', error);
    return errorResponse(res, error.message);
  }
};

// Get Payment Status
const getPaymentStatus = async (req, res) => {
  try {
    logger.info('Fetching payment status');
    
    const { gateway, paymentId } = req.params;
    
    // Validation
    const errors = [];
    
    if (!gateway) {
      errors.push('Payment gateway is required');
    } else if (!VALID_PAYMENT_GATEWAYS.includes(gateway.toLowerCase())) {
      errors.push('Invalid gateway. Must be one of: ' + VALID_PAYMENT_GATEWAYS.join(', '));
    }
    
    if (!paymentId || paymentId.trim().length === 0) {
      errors.push('Payment ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const status = await paymentGatewayService.getPaymentStatus(gateway, paymentId);
    
    if (!status) {
      return notFoundResponse(res, 'Payment not found');
    }
    
    logger.info('Payment status fetched successfully:', { gateway, paymentId });
    return successResponse(res, status, 'Payment status fetched successfully');
  } catch (error) {
    logger.error('Error fetching payment status:', error);
    return errorResponse(res, error.message);
  }
};

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    logger.info('Fetching all payments');
    
    const { gateway, status, startDate, endDate, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (gateway && !VALID_PAYMENT_GATEWAYS.includes(gateway.toLowerCase())) {
      errors.push('Invalid gateway. Must be one of: ' + VALID_PAYMENT_GATEWAYS.join(', '));
    }
    
    if (status && !VALID_PAYMENT_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_PAYMENT_STATUSES.join(', '));
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
    
    const result = await paymentGatewayService.getAllPayments({
      gateway,
      status,
      startDate,
      endDate,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Payments fetched successfully');
    return successResponse(res, result, 'Payments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payments:', error);
    return errorResponse(res, error.message);
  }
};

// Get payment statistics
const getPaymentStatistics = async (req, res) => {
  try {
    logger.info('Fetching payment statistics');
    
    const { gateway, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    if (gateway && !VALID_PAYMENT_GATEWAYS.includes(gateway.toLowerCase())) {
      errors.push('Invalid gateway. Must be one of: ' + VALID_PAYMENT_GATEWAYS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await paymentGatewayService.getPaymentStatistics({
      gateway,
      startDate,
      endDate
    });
    
    logger.info('Payment statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payment statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get payment analytics
const getPaymentAnalytics = async (req, res) => {
  try {
    logger.info('Fetching payment analytics');
    
    const { gateway, startDate, endDate, groupBy } = req.query;
    
    // Validation
    const errors = [];
    
    if (gateway && !VALID_PAYMENT_GATEWAYS.includes(gateway.toLowerCase())) {
      errors.push('Invalid gateway. Must be one of: ' + VALID_PAYMENT_GATEWAYS.join(', '));
    }
    
    const validGroupBy = ['day', 'week', 'month', 'year', 'gateway'];
    if (groupBy && !validGroupBy.includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await paymentGatewayService.getPaymentAnalytics({
      gateway,
      startDate,
      endDate,
      groupBy
    });
    
    logger.info('Payment analytics fetched successfully');
    return successResponse(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payment analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Export payment data
const exportPaymentData = async (req, res) => {
  try {
    logger.info('Exporting payment data');
    
    const { format, gateway, status, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (gateway && !VALID_PAYMENT_GATEWAYS.includes(gateway.toLowerCase())) {
      errors.push('Invalid gateway. Must be one of: ' + VALID_PAYMENT_GATEWAYS.join(', '));
    }
    
    if (status && !VALID_PAYMENT_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_PAYMENT_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await paymentGatewayService.exportPaymentData({
      format: format.toLowerCase(),
      gateway,
      status,
      startDate,
      endDate
    });
    
    logger.info('Payment data exported successfully:', { format });
    return successResponse(res, exportData, 'Data exported successfully');
  } catch (error) {
    logger.error('Error exporting payment data:', error);
    return errorResponse(res, error.message);
  }
};

// Get failed payments
const getFailedPayments = async (req, res) => {
  try {
    logger.info('Fetching failed payments');
    
    const { gateway, startDate, endDate, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (gateway && !VALID_PAYMENT_GATEWAYS.includes(gateway.toLowerCase())) {
      errors.push('Invalid gateway. Must be one of: ' + VALID_PAYMENT_GATEWAYS.join(', '));
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
    
    const result = await paymentGatewayService.getFailedPayments({
      gateway,
      startDate,
      endDate,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Failed payments fetched successfully');
    return successResponse(res, result, 'Failed payments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching failed payments:', error);
    return errorResponse(res, error.message);
  }
};

// Get refunded payments
const getRefundedPayments = async (req, res) => {
  try {
    logger.info('Fetching refunded payments');
    
    const { gateway, startDate, endDate, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (gateway && !VALID_PAYMENT_GATEWAYS.includes(gateway.toLowerCase())) {
      errors.push('Invalid gateway. Must be one of: ' + VALID_PAYMENT_GATEWAYS.join(', '));
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
    
    const result = await paymentGatewayService.getRefundedPayments({
      gateway,
      startDate,
      endDate,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Refunded payments fetched successfully');
    return successResponse(res, result, 'Refunded payments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching refunded payments:', error);
    return errorResponse(res, error.message);
  }
};

// Get payment by transaction ID
const getPaymentByTransactionId = async (req, res) => {
  try {
    logger.info('Fetching payment by transaction ID');
    
    const { transactionId } = req.params;
    
    // Validation
    const errors = [];
    
    if (!transactionId || transactionId.trim().length === 0) {
      errors.push('Transaction ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const payment = await paymentGatewayService.getPaymentByTransactionId(transactionId);
    
    if (!payment) {
      return notFoundResponse(res, 'Payment not found');
    }
    
    logger.info('Payment fetched successfully by transaction ID:', { transactionId });
    return successResponse(res, payment, 'Payment retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payment by transaction ID:', error);
    return errorResponse(res, error.message);
  }
};

// Retry failed payment
const retryFailedPayment = async (req, res) => {
  try {
    logger.info('Retrying failed payment');
    
    const { paymentId } = req.params;
    const { gateway } = req.body;
    
    // Validation
    const errors = [];
    
    if (!paymentId || paymentId.trim().length === 0) {
      errors.push('Payment ID is required');
    }
    
    if (!gateway) {
      errors.push('Payment gateway is required');
    } else if (!VALID_PAYMENT_GATEWAYS.includes(gateway.toLowerCase())) {
      errors.push('Invalid gateway. Must be one of: ' + VALID_PAYMENT_GATEWAYS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const payment = await paymentGatewayService.retryFailedPayment(paymentId, gateway);
    
    if (!payment) {
      return notFoundResponse(res, 'Payment not found');
    }
    
    logger.info('Failed payment retried successfully:', { paymentId });
    return successResponse(res, payment, 'Payment retry initiated successfully');
  } catch (error) {
    logger.error('Error retrying failed payment:', error);
    return errorResponse(res, error.message);
  }
};

// Cancel payment
const cancelPayment = async (req, res) => {
  try {
    logger.info('Cancelling payment');
    
    const { gateway, paymentId } = req.params;
    const { reason } = req.body;
    
    // Validation
    const errors = [];
    
    if (!gateway) {
      errors.push('Payment gateway is required');
    } else if (!VALID_PAYMENT_GATEWAYS.includes(gateway.toLowerCase())) {
      errors.push('Invalid gateway. Must be one of: ' + VALID_PAYMENT_GATEWAYS.join(', '));
    }
    
    if (!paymentId || paymentId.trim().length === 0) {
      errors.push('Payment ID is required');
    }
    
    if (reason && reason.length > 500) {
      errors.push('Reason must not exceed 500 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const payment = await paymentGatewayService.cancelPayment(gateway, paymentId, reason);
    
    if (!payment) {
      return notFoundResponse(res, 'Payment not found');
    }
    
    logger.info('Payment cancelled successfully:', { gateway, paymentId });
    return successResponse(res, payment, 'Payment cancelled successfully');
  } catch (error) {
    logger.error('Error cancelling payment:', error);
    return errorResponse(res, error.message);
  }
};

// Get payment methods
const getPaymentMethods = async (req, res) => {
  try {
    logger.info('Fetching payment methods');
    
    const { gateway, customerId } = req.query;
    
    // Validation
    const errors = [];
    
    if (gateway && !VALID_PAYMENT_GATEWAYS.includes(gateway.toLowerCase())) {
      errors.push('Invalid gateway. Must be one of: ' + VALID_PAYMENT_GATEWAYS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const methods = await paymentGatewayService.getPaymentMethods(gateway, customerId);
    
    logger.info('Payment methods fetched successfully');
    return successResponse(res, methods, 'Payment methods retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payment methods:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createStripePayment,
  verifyStripePayment,
  createStripeCustomer,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createPayUPayment,
  verifyPayUPayment,
  processRefund,
  getPaymentStatus,
  getAllPayments,
  getPaymentStatistics,
  getPaymentAnalytics,
  exportPaymentData,
  getFailedPayments,
  getRefundedPayments,
  getPaymentByTransactionId,
  retryFailedPayment,
  cancelPayment,
  getPaymentMethods
};
