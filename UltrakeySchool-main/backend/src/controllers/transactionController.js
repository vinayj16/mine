import * as transactionService from '../services/transactionService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'];
const VALID_TYPES = ['payment', 'refund', 'adjustment', 'fee', 'deposit', 'withdrawal', 'transfer'];
const VALID_PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'cheque', 'online', 'upi', 'wallet', 'other'];
const VALID_GROUP_BY = ['day', 'week', 'month', 'quarter', 'year'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_REFERENCE_LENGTH = 100;
const MIN_AMOUNT = 0;
const MAX_AMOUNT = 10000000;

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

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start >= end) {
    return 'Start date must be before end date';
  }
  return null;
};

const getTransactionById = async (req, res) => {
  try {
    logger.info('Fetching transaction by ID');
    
    const { transactionId } = req.params;
    
    // Validation
    const errors = [];
    
    const transactionIdError = validateObjectId(transactionId, 'Transaction ID');
    if (transactionIdError) errors.push(transactionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const transaction = await transactionService.getTransactionById(transactionId);
    
    if (!transaction) {
      return notFoundResponse(res, 'Transaction not found');
    }
    
    logger.info('Transaction fetched successfully:', { transactionId });
    return successResponse(res, transaction, 'Transaction retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transaction:', error);
    return errorResponse(res, error.message);
  }
};

const getSchoolTransactions = async (req, res) => {
  try {
    logger.info('Fetching school transactions');
    
    const { schoolId } = req.params;
    const { status, type, startDate, endDate, page, limit, sortBy, sortOrder } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
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
    
    if (type && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: ' + VALID_SORT_ORDERS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = {
      status,
      type,
      startDate,
      endDate,
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };

    const result = await transactionService.getSchoolTransactions(schoolId, filters);
    
    logger.info('School transactions fetched successfully:', { schoolId });
    return successResponse(res, result, 'Transactions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching school transactions:', error);
    return errorResponse(res, error.message);
  }
};

const getAllTransactions = async (req, res) => {
  try {
    logger.info('Fetching all transactions');
    
    const { status, type, startDate, endDate, page, limit, sortBy, sortOrder } = req.query;
    
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
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (type && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: ' + VALID_SORT_ORDERS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = {
      status,
      type,
      startDate,
      endDate,
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };

    const result = await transactionService.getAllTransactions(filters);
    
    logger.info('All transactions fetched successfully');
    return successResponse(res, result, 'Transactions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching all transactions:', error);
    return errorResponse(res, error.message);
  }
};

const createRefund = async (req, res) => {
  try {
    logger.info('Creating refund');
    
    const { transactionId } = req.params;
    const userId = req.user?.id;
    const { amount, reason } = req.body;
    
    // Validation
    const errors = [];
    
    const transactionIdError = validateObjectId(transactionId, 'Transaction ID');
    if (transactionIdError) errors.push(transactionIdError);
    
    if (!amount) {
      errors.push('Refund amount is required');
    } else if (typeof amount !== 'number' || amount <= MIN_AMOUNT || amount > MAX_AMOUNT) {
      errors.push('Amount must be between ' + MIN_AMOUNT + ' and ' + MAX_AMOUNT);
    }
    
    if (reason && reason.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transactionService.createRefund(transactionId, req.body, userId);
    
    logger.info('Refund created successfully:', { transactionId, amount });
    return createdResponse(res, result, 'Refund created successfully');
  } catch (error) {
    logger.error('Error creating refund:', error);
    return errorResponse(res, error.message);
  }
};

const getRevenueAnalytics = async (req, res) => {
  try {
    logger.info('Fetching revenue analytics');
    
    const { startDate, endDate, groupBy } = req.query;
    
    // Validation
    const errors = [];
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    const groupByValue = groupBy || 'month';
    if (!VALID_GROUP_BY.includes(groupByValue)) {
      errors.push('Invalid groupBy. Must be one of: ' + VALID_GROUP_BY.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = {
      startDate,
      endDate,
      groupBy: groupByValue
    };

    const analytics = await transactionService.getRevenueAnalytics(filters);
    
    logger.info('Revenue analytics fetched successfully');
    return successResponse(res, analytics, 'Revenue analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching revenue analytics:', error);
    return errorResponse(res, error.message);
  }
};

const getTransactionStats = async (req, res) => {
  try {
    logger.info('Fetching transaction statistics');
    
    const stats = await transactionService.getTransactionStats();
    
    logger.info('Transaction statistics fetched successfully');
    return successResponse(res, stats, 'Transaction statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transaction statistics:', error);
    return errorResponse(res, error.message);
  }
};


// Create transaction
const createTransaction = async (req, res) => {
  try {
    logger.info('Creating transaction');
    
    const { amount, type, paymentMethod, description, reference, schoolId, userId } = req.body;
    
    // Validation
    const errors = [];
    
    if (!amount) {
      errors.push('Amount is required');
    } else if (typeof amount !== 'number' || amount <= MIN_AMOUNT || amount > MAX_AMOUNT) {
      errors.push('Amount must be between ' + MIN_AMOUNT + ' and ' + MAX_AMOUNT);
    }
    
    if (!type) {
      errors.push('Transaction type is required');
    } else if (!VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      errors.push('Invalid payment method. Must be one of: ' + VALID_PAYMENT_METHODS.join(', '));
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (reference && reference.length > MAX_REFERENCE_LENGTH) {
      errors.push('Reference must not exceed ' + MAX_REFERENCE_LENGTH + ' characters');
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const transaction = await transactionService.createTransaction(req.body);
    
    logger.info('Transaction created successfully:', { transactionId: transaction._id, amount, type });
    return createdResponse(res, transaction, 'Transaction created successfully');
  } catch (error) {
    logger.error('Error creating transaction:', error);
    return errorResponse(res, error.message);
  }
};

// Update transaction status
const updateTransactionStatus = async (req, res) => {
  try {
    logger.info('Updating transaction status');
    
    const { transactionId } = req.params;
    const { status } = req.body;
    
    // Validation
    const errors = [];
    
    const transactionIdError = validateObjectId(transactionId, 'Transaction ID');
    if (transactionIdError) errors.push(transactionIdError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const transaction = await transactionService.updateTransactionStatus(transactionId, status);
    
    if (!transaction) {
      return notFoundResponse(res, 'Transaction not found');
    }
    
    logger.info('Transaction status updated successfully:', { transactionId, status });
    return successResponse(res, transaction, 'Transaction status updated successfully');
  } catch (error) {
    logger.error('Error updating transaction status:', error);
    return errorResponse(res, error.message);
  }
};

// Get transactions by status
const getTransactionsByStatus = async (req, res) => {
  try {
    logger.info('Fetching transactions by status');
    
    const { status } = req.params;
    const { schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const transactions = await transactionService.getTransactionsByStatus(status, schoolId);
    
    logger.info('Transactions fetched by status successfully:', { status, count: transactions.length });
    return successResponse(res, transactions, 'Transactions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transactions by status:', error);
    return errorResponse(res, error.message);
  }
};

// Get transactions by type
const getTransactionsByType = async (req, res) => {
  try {
    logger.info('Fetching transactions by type');
    
    const { type } = req.params;
    const { schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!type) {
      errors.push('Type is required');
    } else if (!VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const transactions = await transactionService.getTransactionsByType(type, schoolId);
    
    logger.info('Transactions fetched by type successfully:', { type, count: transactions.length });
    return successResponse(res, transactions, 'Transactions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transactions by type:', error);
    return errorResponse(res, error.message);
  }
};

// Get user transactions
const getUserTransactions = async (req, res) => {
  try {
    logger.info('Fetching user transactions');
    
    const { userId } = req.params;
    const { status, type, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
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
    
    if (type && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await transactionService.getUserTransactions(userId, {
      status,
      type,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('User transactions fetched successfully:', { userId });
    return successResponse(res, result, 'User transactions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user transactions:', error);
    return errorResponse(res, error.message);
  }
};

// Get failed transactions
const getFailedTransactions = async (req, res) => {
  try {
    logger.info('Fetching failed transactions');
    
    const { schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const transactions = await transactionService.getFailedTransactions(schoolId);
    
    logger.info('Failed transactions fetched successfully:', { count: transactions.length });
    return successResponse(res, transactions, 'Failed transactions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching failed transactions:', error);
    return errorResponse(res, error.message);
  }
};

// Get pending transactions
const getPendingTransactions = async (req, res) => {
  try {
    logger.info('Fetching pending transactions');
    
    const { schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const transactions = await transactionService.getPendingTransactions(schoolId);
    
    logger.info('Pending transactions fetched successfully:', { count: transactions.length });
    return successResponse(res, transactions, 'Pending transactions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching pending transactions:', error);
    return errorResponse(res, error.message);
  }
};

// Verify transaction
const verifyTransaction = async (req, res) => {
  try {
    logger.info('Verifying transaction');
    
    const { transactionId } = req.params;
    const { verificationCode } = req.body;
    
    // Validation
    const errors = [];
    
    const transactionIdError = validateObjectId(transactionId, 'Transaction ID');
    if (transactionIdError) errors.push(transactionIdError);
    
    if (!verificationCode || verificationCode.trim().length === 0) {
      errors.push('Verification code is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const transaction = await transactionService.verifyTransaction(transactionId, verificationCode);
    
    if (!transaction) {
      return notFoundResponse(res, 'Transaction not found or verification failed');
    }
    
    logger.info('Transaction verified successfully:', { transactionId });
    return successResponse(res, transaction, 'Transaction verified successfully');
  } catch (error) {
    logger.error('Error verifying transaction:', error);
    return errorResponse(res, error.message);
  }
};

// Cancel transaction
const cancelTransaction = async (req, res) => {
  try {
    logger.info('Cancelling transaction');
    
    const { transactionId } = req.params;
    const { reason } = req.body;
    
    // Validation
    const errors = [];
    
    const transactionIdError = validateObjectId(transactionId, 'Transaction ID');
    if (transactionIdError) errors.push(transactionIdError);
    
    if (reason && reason.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const transaction = await transactionService.cancelTransaction(transactionId, reason);
    
    if (!transaction) {
      return notFoundResponse(res, 'Transaction not found');
    }
    
    logger.info('Transaction cancelled successfully:', { transactionId });
    return successResponse(res, transaction, 'Transaction cancelled successfully');
  } catch (error) {
    logger.error('Error cancelling transaction:', error);
    return errorResponse(res, error.message);
  }
};

// Export transactions
const exportTransactions = async (req, res) => {
  try {
    logger.info('Exporting transactions');
    
    const { format, schoolId, status, type, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (type && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await transactionService.exportTransactions({
      format: format.toLowerCase(),
      schoolId,
      status,
      type,
      startDate,
      endDate
    });
    
    logger.info('Transactions exported successfully:', { format });
    return successResponse(res, exportData, 'Transactions exported successfully');
  } catch (error) {
    logger.error('Error exporting transactions:', error);
    return errorResponse(res, error.message);
  }
};

// Search transactions
const searchTransactions = async (req, res) => {
  try {
    logger.info('Searching transactions');
    
    const { q, schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const transactions = await transactionService.searchTransactions(q, schoolId);
    
    logger.info('Transactions searched successfully:', { query: q, count: transactions.length });
    return successResponse(res, transactions, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching transactions:', error);
    return errorResponse(res, error.message);
  }
};

// Get transaction summary
const getTransactionSummary = async (req, res) => {
  try {
    logger.info('Fetching transaction summary');
    
    const { schoolId, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const summary = await transactionService.getTransactionSummary({ schoolId, startDate, endDate });
    
    logger.info('Transaction summary fetched successfully');
    return successResponse(res, summary, 'Transaction summary retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transaction summary:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getTransactionById,
  getSchoolTransactions,
  getAllTransactions,
  createRefund,
  getRevenueAnalytics,
  getTransactionStats,
  createTransaction,
  updateTransactionStatus,
  getTransactionsByStatus,
  getTransactionsByType,
  getUserTransactions,
  getFailedTransactions,
  getPendingTransactions,
  verifyTransaction,
  cancelTransaction,
  exportTransactions,
  searchTransactions,
  getTransactionSummary
};
