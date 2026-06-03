import feeService from '../services/feeService.js';
import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import Institution from '../models/Institution.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import { getCache, setCache, deleteCachePattern } from '../config/redis.js';
import { resolveTenantContext, normalizeFeeType } from '../utils/tenantContext.js';

const STAFF_FEE_ROLES = ['admin', 'accountant', 'principal', 'institution_admin', 'superadmin'];

// Validation constants
const VALID_FEE_STATUSES = ['pending', 'paid', 'partial', 'overdue', 'cancelled', 'waived'];
const VALID_PAYMENT_METHODS = ['cash', 'card', 'upi', 'netbanking', 'cheque', 'dd', 'online'];
const VALID_PERIODS = ['this-month', 'last-month', 'this-quarter', 'last-quarter', 'this-year', 'last-year', 'custom'];
const VALID_REPORT_FORMATS = ['summary', 'detailed', 'export'];

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
const validateDate = (dateString, fieldName = 'Date') => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

export const getFeesOverview = async (req, res) => {
  try {
    logger.info('Fetching fees overview');
    
    const { period = 'this-month' } = req.query;
    const { institutionId } = await resolveTenantContext(req);

    // Validation
    const errors = [];
    
    if (!institutionId && !institutionId) {
      errors.push('Institution context is required');
    }
    
    if (!VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    // Try to get from cache first
    const cacheKey = `fees:overview:${institutionId}:${institutionId || 'default'}:${period}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.info('Fees overview retrieved from cache');
      return successResponse(res, cachedData, 'Fees overview retrieved successfully (cached)');
    }

    const overview = await feeService.getFeesOverview(institutionId, period);

    // Cache the response for 5 minutes
    await setCache(cacheKey, overview, 300);

    logger.info('Fees overview fetched successfully');
    return successResponse(res, overview, 'Fees overview retrieved successfully');
  } catch (error) {
    logger.error('Error fetching fees overview:', error);
    return errorResponse(res, error.message);
  }
};

export const collectFee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { feeId, amount, paymentMethod, transactionId, remarks } = req.body;
    const { institutionId } = await resolveTenantContext(req, { studentId: req.body.studentId });
    const receivedBy = req.user.id;

    const fee = await feeService.collectFee(institutionId, feeId, {
      amount,
      paymentMethod,
      transactionId,
      receivedBy,
      remarks
    });

    res.json({
      success: true,
      message: 'Fee payment collected successfully',
      data: fee
    });
  } catch (error) {
    console.error('Error collecting fee:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to collect fee',
      error: error.message
    });
  }
};

export const createFee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { institutionId } = await resolveTenantContext(req, { studentId: req.body.studentId });
    if (!institutionId && !institutionId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to resolve school or institution for this fee. Ensure students exist for the institution.'
      });
    }

    const feeData = {
      ...req.body,
      feeType: normalizeFeeType(req.body.feeType),
      description: req.body.description || req.body.remarks
    };

    const fee = await feeService.createFee(institutionId, feeData);

    res.status(201).json({
      success: true,
      message: 'Fee created successfully',
      data: fee
    });
  } catch (error) {
    console.error('Error creating fee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create fee',
      error: error.message
    });
  }
};

export const bulkCreateFees = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { institutionId } = await resolveTenantContext(req);
    const { fees } = req.body;

    const result = await feeService.bulkCreateFees(institutionId, fees);

    res.status(201).json({
      success: true,
      message: `${result.length} fees created successfully`,
      data: {
        count: result.length,
        fees: result
      }
    });
  } catch (error) {
    console.error('Error bulk creating fees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create fees',
      error: error.message
    });
  }
};

export const getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status, period } = req.query;
    const { institutionId } = await resolveTenantContext(req, { studentId });

    // Try to get from cache first
    const cacheKey = `fees:student:${studentId}:${institutionId}:${institutionId || 'default'}:${status || 'all'}:${period || 'all'}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.info('Student fees retrieved from cache');
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const fees = await feeService.getStudentFees(institutionId, studentId, {
      status,
      period
    });

    // Cache the response for 5 minutes
    await setCache(cacheKey, fees, 300);

    res.json({
      success: true,
      data: fees
    });
  } catch (error) {
    console.error('Error fetching student fees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student fees',
      error: error.message
    });
  }
};

export const getAllFees = async (req, res) => {
  try {
    const { limit, status } = req.query;
    const { institutionId } = await resolveTenantContext(req);

    const fees = await feeService.getAllFees(institutionId, {
      limit: parseInt(limit, 10) || 200,
      status
    });

    res.json({ success: true, data: fees });
  } catch (error) {
    console.error('Error fetching all fees:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch fees'
    });
  }
};

export const getMyFees = async (req, res) => {
  try {
    const { status, period } = req.query;
    let studentId = req.user.id || req.user._id;

    // For students, always use their own ID - no override allowed
    if (req.user.role === 'student') {
      // Find the student record associated with this user
      const Student = (await import('../models/Student.js')).default;
      const student = await Student.findOne({ userId: req.user.id || req.user._id });
      if (student) {
        studentId = student._id;
      }
    } else {
      // For non-students (parents, admins), allow querying specific student if provided
      studentId = req.query.studentId || req.params.studentId || studentId;
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student id is required' });
    }

    const { institutionId } = await resolveTenantContext(req, { studentId });
    const fees = await feeService.getStudentFees(institutionId, studentId, { status, period });

    res.json({ success: true, data: fees });
  } catch (error) {
    console.error('Error fetching my fees:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch fees'
    });
  }
};

export const getAccountantDashboard = async (req, res) => {
  try {
    const { institutionId } = await resolveTenantContext(req);
    const data = await feeService.getAccountantDashboard(institutionId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching accountant fee dashboard:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load accountant dashboard'
    });
  }
};

export const getPaymentConfig = async (req, res) => {
  const institutionId = req.query.institutionId || req.user?.institutionId;
  let razorpayKey = process.env.RAZORPAY_KEY_ID || 'rzp_test_123456789';
  
  if (institutionId) {
    try {
      const inst = await Institution.findById(institutionId).select('settings.payment-gateway').lean();
      const pgSettings = inst?.settings?.['payment-gateway'];
      if (pgSettings?.enabled && pgSettings?.provider === 'razorpay') {
        const keyId = pgSettings.razorpay?.keyId || pgSettings.apiKey || pgSettings.merchantId;
        if (keyId) razorpayKey = keyId;
      }
    } catch {}
  }
  
  res.json({
    success: true,
    data: {
      razorpayKey,
      currency: 'INR'
    }
  });
};

export const listFees = async (req, res) => {
  const role = (req.user?.role || '').toLowerCase();
  if (role === 'student' || role === 'parent') {
    return getMyFees(req, res);
  }
  if (STAFF_FEE_ROLES.includes(role)) {
    return getAllFees(req, res);
  }
  return getPendingFees(req, res);
};

export const getPendingFees = async (req, res) => {
  try {
    const { limit, sortBy } = req.query;
    const { institutionId } = await resolveTenantContext(req);

    // Try to get from cache first
    const cacheKey = `fees:pending:${institutionId}:${institutionId || 'default'}:${limit || 100}:${sortBy || 'dueDate'}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.info('Pending fees retrieved from cache');
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const fees = await feeService.getPendingFees(institutionId, {
      limit: parseInt(limit) || 100,
      sortBy: sortBy || 'dueDate'
    });

    // Cache the response for 5 minutes
    await setCache(cacheKey, fees, 300);

    res.json({
      success: true,
      data: fees
    });
  } catch (error) {
    console.error('Error fetching pending fees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending fees',
      error: error.message
    });
  }
};

export const sendReminders = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { feeIds } = req.body;
    const { institutionId } = await resolveTenantContext(req);

    const result = await feeService.sendReminders(institutionId, feeIds);

    res.json({
      success: true,
      message: `Reminders sent for ${result.modifiedCount} fees`,
      data: {
        count: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminders',
      error: error.message
    });
  }
};

export const getFeesReport = async (req, res) => {
  try {
    const { period, format = 'summary' } = req.query;
    const { institutionId } = await resolveTenantContext(req);

    const report = await feeService.getFeesReport(institutionId, period, format);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating fees report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate fees report',
      error: error.message
    });
  }
};

export const updateFee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { institutionId } = await resolveTenantContext(req);
    const updateData = req.body;

    const fee = await feeService.updateFee(institutionId, id, updateData);

    res.json({
      success: true,
      message: 'Fee updated successfully',
      data: fee
    });
  } catch (error) {
    console.error('Error updating fee:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update fee',
      error: error.message
    });
  }
};

export const deleteFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { institutionId } = await resolveTenantContext(req);

    const fee = await feeService.deleteFee(institutionId, id);

    res.json({
      success: true,
      message: 'Fee deleted successfully',
      data: fee
    });
  } catch (error) {
    console.error('Error deleting fee:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete fee',
      error: error.message
    });
  }
};

export const applyLateFees = async (req, res) => {
  try {
    const { institutionId } = await resolveTenantContext(req);

    const fees = await feeService.applyLateFee(institutionId);

    res.json({
      success: true,
      message: `Late fees applied to ${fees.length} records`,
      data: {
        count: fees.length,
        fees
      }
    });
  } catch (error) {
    console.error('Error applying late fees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply late fees',
      error: error.message
    });
  }
};
import Razorpay from 'razorpay';

/**
 * Create invoice
 */
export const createInvoice = async (req, res) => {
  try {
    const { studentId, items, dueDate, notes } = req.body;
    const { institutionId } = await resolveTenantContext(req, { studentId });

    const invoice = await feeService.createInvoice(institutionId, {
      studentId,
      items,
      dueDate,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create invoice',
      error: error.message
    });
  }
};

/**
 * Get invoices
 */
export const getInvoices = async (req, res) => {
  try {
    const { studentId, status, page = 1, limit = 20 } = req.query;
    const { institutionId } = await resolveTenantContext(req, { studentId });

    // Try to get from cache first
    const cacheKey = `fees:invoices:${institutionId}:${institutionId || 'default'}:${studentId || 'all'}:${status || 'all'}:${page}:${limit}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.info('Invoices retrieved from cache');
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const invoices = await feeService.getInvoices(institutionId, {
      studentId,
      status,
      page,
      limit
    });

    // Cache the response for 5 minutes
    await setCache(cacheKey, invoices, 300);

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message
    });
  }
};

/**
 * Initiate payment for invoice
 */
export const initiatePayment = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { paymentMethod, amount } = req.body;
    const { institutionId } = await resolveTenantContext(req);

    const payment = await feeService.initiatePayment(institutionId, invoiceId, {
      paymentMethod,
      amount
    });

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment',
      error: error.message
    });
  }
};

/**
 * Verify payment
 */
export const verifyPayment = async (req, res) => {
  try {
    const {
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpay_payment_id,
      razorpaySignature
    } = req.body;
    const { institutionId } = await resolveTenantContext(req);

    const result = await feeService.verifyPayment(institutionId, paymentId, {
      razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || razorpay_payment_id,
      razorpaySignature
    });

    res.json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Payment verification failed',
      error: error.message
    });
  }
};

/**
 * Get payment receipt
 */
export const getPaymentReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { institutionId } = await resolveTenantContext(req);

    const receipt = await feeService.getPaymentReceipt(institutionId, paymentId);

    res.json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error('Error fetching payment receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment receipt',
      error: error.message
    });
  }
};


export default {
  getFeesOverview,
  collectFee,
  createFee,
  bulkCreateFees,
  getStudentFees,
  getAllFees,
  getMyFees,
  listFees,
  getAccountantDashboard,
  getPaymentConfig,
  getPendingFees,
  sendReminders,
  getFeesReport,
  updateFee,
  deleteFee,
  applyLateFees,
  createInvoice,
  getInvoices,
  initiatePayment,
  verifyPayment,
  getPaymentReceipt
};
