import feeService from '../services/feeService.js';
import Fee from '../models/Fee.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import { getCache, setCache, deleteCachePattern } from '../config/redis.js';

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
    const schoolId = req.user.schoolId;
    const institutionId = req.user.institutionId;

    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    // Try to get from cache first
    const cacheKey = `fees:overview:${schoolId}:${institutionId || 'default'}:${period}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.info('Fees overview retrieved from cache');
      return successResponse(res, cachedData, 'Fees overview retrieved successfully (cached)');
    }

    const overview = await feeService.getFeesOverview(schoolId, period);

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
    const schoolId = req.user.schoolId;
    const receivedBy = req.user.id;

    const fee = await feeService.collectFee(schoolId, feeId, {
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

    const schoolId = req.user.schoolId;
    const feeData = req.body;

    const fee = await feeService.createFee(schoolId, feeData);

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

    const schoolId = req.user.schoolId;
    const { fees } = req.body;

    const result = await feeService.bulkCreateFees(schoolId, fees);

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
    const schoolId = req.user.schoolId;
    const institutionId = req.user.institutionId;

    // Try to get from cache first
    const cacheKey = `fees:student:${studentId}:${schoolId}:${institutionId || 'default'}:${status || 'all'}:${period || 'all'}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.info('Student fees retrieved from cache');
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const fees = await feeService.getStudentFees(schoolId, studentId, {
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

export const getPendingFees = async (req, res) => {
  try {
    const { limit, sortBy } = req.query;
    const schoolId = req.user.schoolId;
    const institutionId = req.user.institutionId;

    // Try to get from cache first
    const cacheKey = `fees:pending:${schoolId}:${institutionId || 'default'}:${limit || 100}:${sortBy || 'dueDate'}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.info('Pending fees retrieved from cache');
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const fees = await feeService.getPendingFees(schoolId, {
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
    const schoolId = req.user.schoolId;

    const result = await feeService.sendReminders(schoolId, feeIds);

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
    const schoolId = req.user.schoolId;

    const report = await feeService.getFeesReport(schoolId, period, format);

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
    const schoolId = req.user.schoolId;
    const updateData = req.body;

    const fee = await feeService.updateFee(schoolId, id, updateData);

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
    const schoolId = req.user.schoolId;

    const fee = await feeService.deleteFee(schoolId, id);

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
    const schoolId = req.user.schoolId;

    const fees = await feeService.applyLateFee(schoolId);

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
    const schoolId = req.user.schoolId;

    const invoice = await feeService.createInvoice(schoolId, {
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
    const schoolId = req.user.schoolId;
    const institutionId = req.user.institutionId;

    // Try to get from cache first
    const cacheKey = `fees:invoices:${schoolId}:${institutionId || 'default'}:${studentId || 'all'}:${status || 'all'}:${page}:${limit}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.info('Invoices retrieved from cache');
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const invoices = await feeService.getInvoices(schoolId, {
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
    const schoolId = req.user.schoolId;

    const payment = await feeService.initiatePayment(schoolId, invoiceId, {
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
    const { paymentId, razorpayOrderId, razorpaySignature } = req.body;
    const schoolId = req.user.schoolId;

    const result = await feeService.verifyPayment(schoolId, paymentId, {
      razorpayOrderId,
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
    const schoolId = req.user.schoolId;

    const receipt = await feeService.getPaymentReceipt(schoolId, paymentId);

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
