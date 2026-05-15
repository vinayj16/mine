import installmentService from '../services/installmentService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_PLAN_STATUSES = ['active', 'completed', 'cancelled', 'defaulted'];
const VALID_INSTALLMENT_STATUSES = ['pending', 'paid', 'overdue', 'waived'];
const VALID_PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'cheque', 'online', 'upi'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];

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
const validateDate = (date, fieldName = 'Date') => {
  if (!date) {
    return fieldName + ' is required';
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    return 'Start date cannot be after end date';
  }
  return null;
};

// Helper function to validate amount
const validateAmount = (amount, fieldName = 'Amount') => {
  if (amount === undefined || amount === null) {
    return fieldName + ' is required';
  }
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum < 0) {
    return fieldName + ' must be a non-negative number';
  }
  return null;
};

// Create Installment Plan
const createInstallmentPlan = async (req, res) => {
  try {
    logger.info('Creating installment plan');
    
    const { studentId, feeId, totalAmount, numberOfInstallments, startDate, frequency } = req.body;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    const feeIdError = validateObjectId(feeId, 'Fee ID');
    if (feeIdError) errors.push(feeIdError);
    
    const amountError = validateAmount(totalAmount, 'Total amount');
    if (amountError) errors.push(amountError);
    else if (parseFloat(totalAmount) <= 0) {
      errors.push('Total amount must be greater than 0');
    }
    
    if (!numberOfInstallments || numberOfInstallments < 1) {
      errors.push('Number of installments must be at least 1');
    } else if (numberOfInstallments > 100) {
      errors.push('Number of installments must not exceed 100');
    }
    
    if (startDate) {
      const dateError = validateDate(startDate, 'Start date');
      if (dateError) errors.push(dateError);
    }
    
    if (frequency && !['monthly', 'quarterly', 'weekly', 'custom'].includes(frequency)) {
      errors.push('Invalid frequency. Must be one of: monthly, quarterly, weekly, custom');
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const plan = await installmentService.createInstallmentPlan(req.body, req.user.tenant);
    
    logger.info('Installment plan created successfully:', { planId: plan._id });
    return createdResponse(res, plan, 'Installment plan created successfully');
  } catch (error) {
    logger.error('Error creating installment plan:', error);
    return errorResponse(res, error.message);
  }
};


// Get Installment Plans
const getInstallmentPlans = async (req, res) => {
  try {
    logger.info('Fetching installment plans');
    
    const { studentId, status, page, limit, search } = req.query;
    
    // Validation
    const errors = [];
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (status && !VALID_PLAN_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_PLAN_STATUSES.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await installmentService.getInstallmentPlans(req.user.tenant, req.query);
    
    logger.info('Installment plans fetched successfully');
    return successResponse(res, result, 'Installment plans retrieved successfully');
  } catch (error) {
    logger.error('Error fetching installment plans:', error);
    return errorResponse(res, error.message);
  }
};


// Get Installment Plan by ID
const getInstallmentPlanById = async (req, res) => {
  try {
    logger.info('Fetching installment plan by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Plan ID');
    if (idError) errors.push(idError);
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const plan = await installmentService.getInstallmentPlanById(id, req.user.tenant);
    
    if (!plan) {
      return notFoundResponse(res, 'Installment plan not found');
    }
    
    logger.info('Installment plan fetched successfully:', { planId: id });
    return successResponse(res, plan, 'Installment plan retrieved successfully');
  } catch (error) {
    logger.error('Error fetching installment plan:', error);
    return errorResponse(res, error.message);
  }
};


// Pay Installment
const payInstallment = async (req, res) => {
  try {
    logger.info('Processing installment payment');
    
    const { id, installmentNumber } = req.params;
    const { amount, paymentMethod, transactionId, paymentDate, notes } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Plan ID');
    if (idError) errors.push(idError);
    
    if (!installmentNumber || isNaN(parseInt(installmentNumber))) {
      errors.push('Valid installment number is required');
    } else if (parseInt(installmentNumber) < 1) {
      errors.push('Installment number must be at least 1');
    }
    
    if (amount !== undefined) {
      const amountError = validateAmount(amount, 'Payment amount');
      if (amountError) errors.push(amountError);
    }
    
    if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      errors.push('Invalid payment method. Must be one of: ' + VALID_PAYMENT_METHODS.join(', '));
    }
    
    if (transactionId && transactionId.length > 100) {
      errors.push('Transaction ID must not exceed 100 characters');
    }
    
    if (paymentDate) {
      const dateError = validateDate(paymentDate, 'Payment date');
      if (dateError) errors.push(dateError);
    }
    
    if (notes && notes.length > 1000) {
      errors.push('Notes must not exceed 1000 characters');
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const plan = await installmentService.payInstallment(
      id,
      parseInt(installmentNumber),
      req.body,
      req.user.tenant
    );
    
    logger.info('Installment paid successfully:', { planId: id, installmentNumber });
    return successResponse(res, plan, 'Installment paid successfully');
  } catch (error) {
    logger.error('Error processing installment payment:', error);
    return errorResponse(res, error.message);
  }
};


// Apply Late Fees
const applyLateFees = async (req, res) => {
  try {
    logger.info('Applying late fees');
    
    // Validation
    if (!req.user?.tenant) {
      return validationErrorResponse(res, ['Tenant information is required']);
    }
    
    const plans = await installmentService.applyLateFees(req.user.tenant);
    
    logger.info('Late fees applied successfully:', { count: plans.length });
    return successResponse(res, plans, 'Late fees applied to ' + plans.length + ' plans');
  } catch (error) {
    logger.error('Error applying late fees:', error);
    return errorResponse(res, error.message);
  }
};


// Cancel Installment Plan
const cancelInstallmentPlan = async (req, res) => {
  try {
    logger.info('Cancelling installment plan');
    
    const { id } = req.params;
    const { reason } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Plan ID');
    if (idError) errors.push(idError);
    
    if (!reason || reason.trim().length === 0) {
      errors.push('Cancellation reason is required');
    } else if (reason.length > 500) {
      errors.push('Reason must not exceed 500 characters');
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const plan = await installmentService.cancelInstallmentPlan(id, req.user.tenant, reason);
    
    if (!plan) {
      return notFoundResponse(res, 'Installment plan not found');
    }
    
    logger.info('Installment plan cancelled successfully:', { planId: id });
    return successResponse(res, plan, 'Installment plan cancelled successfully');
  } catch (error) {
    logger.error('Error cancelling installment plan:', error);
    return errorResponse(res, error.message);
  }
};


// Get Upcoming Installments
const getUpcomingInstallments = async (req, res) => {
  try {
    logger.info('Fetching upcoming installments');
    
    const { days = 7 } = req.query;
    
    // Validation
    const errors = [];
    
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1) {
      errors.push('Days must be at least 1');
    } else if (daysNum > 365) {
      errors.push('Days must not exceed 365');
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const installments = await installmentService.getUpcomingInstallments(req.user.tenant, daysNum);
    
    logger.info('Upcoming installments fetched successfully:', { count: installments.length });
    return successResponse(res, installments, 'Upcoming installments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching upcoming installments:', error);
    return errorResponse(res, error.message);
  }
};


// Get Installment Statistics
const getInstallmentStatistics = async (req, res) => {
  try {
    logger.info('Fetching installment statistics');
    
    // Validation
    if (!req.user?.tenant) {
      return validationErrorResponse(res, ['Tenant information is required']);
    }
    
    const stats = await installmentService.getInstallmentStatistics(req.user.tenant);
    
    logger.info('Installment statistics fetched successfully');
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching installment statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Update Installment Plan
const updateInstallmentPlan = async (req, res) => {
  try {
    logger.info('Updating installment plan');
    
    const { id } = req.params;
    const { numberOfInstallments, frequency, lateFeePercentage } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Plan ID');
    if (idError) errors.push(idError);
    
    if (numberOfInstallments !== undefined) {
      if (numberOfInstallments < 1) {
        errors.push('Number of installments must be at least 1');
      } else if (numberOfInstallments > 100) {
        errors.push('Number of installments must not exceed 100');
      }
    }
    
    if (frequency && !['monthly', 'quarterly', 'weekly', 'custom'].includes(frequency)) {
      errors.push('Invalid frequency. Must be one of: monthly, quarterly, weekly, custom');
    }
    
    if (lateFeePercentage !== undefined) {
      const feeNum = parseFloat(lateFeePercentage);
      if (isNaN(feeNum) || feeNum < 0 || feeNum > 100) {
        errors.push('Late fee percentage must be between 0 and 100');
      }
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const plan = await installmentService.updateInstallmentPlan(id, req.body, req.user.tenant);
    
    if (!plan) {
      return notFoundResponse(res, 'Installment plan not found');
    }
    
    logger.info('Installment plan updated successfully:', { planId: id });
    return successResponse(res, plan, 'Installment plan updated successfully');
  } catch (error) {
    logger.error('Error updating installment plan:', error);
    return errorResponse(res, error.message);
  }
};

// Get Overdue Installments
const getOverdueInstallments = async (req, res) => {
  try {
    logger.info('Fetching overdue installments');
    
    const { studentId, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await installmentService.getOverdueInstallments(req.user.tenant, {
      studentId,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Overdue installments fetched successfully');
    return successResponse(res, result, 'Overdue installments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching overdue installments:', error);
    return errorResponse(res, error.message);
  }
};

// Waive Installment
const waiveInstallment = async (req, res) => {
  try {
    logger.info('Waiving installment');
    
    const { id, installmentNumber } = req.params;
    const { reason } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Plan ID');
    if (idError) errors.push(idError);
    
    if (!installmentNumber || isNaN(parseInt(installmentNumber))) {
      errors.push('Valid installment number is required');
    } else if (parseInt(installmentNumber) < 1) {
      errors.push('Installment number must be at least 1');
    }
    
    if (!reason || reason.trim().length === 0) {
      errors.push('Waiver reason is required');
    } else if (reason.length > 500) {
      errors.push('Reason must not exceed 500 characters');
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const plan = await installmentService.waiveInstallment(
      id,
      parseInt(installmentNumber),
      reason,
      req.user.tenant
    );
    
    if (!plan) {
      return notFoundResponse(res, 'Installment plan not found');
    }
    
    logger.info('Installment waived successfully:', { planId: id, installmentNumber });
    return successResponse(res, plan, 'Installment waived successfully');
  } catch (error) {
    logger.error('Error waiving installment:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk Update Installment Plans
const bulkUpdatePlans = async (req, res) => {
  try {
    logger.info('Bulk updating installment plans');
    
    const { planIds, updates } = req.body;
    
    // Validation
    const errors = [];
    
    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      errors.push('Plan IDs array is required and must not be empty');
    } else if (planIds.length > 100) {
      errors.push('Cannot update more than 100 plans at once');
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates object is required');
    }
    
    if (updates?.status && !VALID_PLAN_STATUSES.includes(updates.status)) {
      errors.push('Invalid status in updates');
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await installmentService.bulkUpdatePlans(planIds, updates, req.user.tenant);
    
    logger.info('Bulk plan update completed:', { count: result.modifiedCount });
    return successResponse(res, { modifiedCount: result.modifiedCount }, 'Plans updated successfully');
  } catch (error) {
    logger.error('Error in bulk plan update:', error);
    return errorResponse(res, error.message);
  }
};

// Export Installment Plans
const exportInstallmentPlans = async (req, res) => {
  try {
    logger.info('Exporting installment plans');
    
    const { format, status, studentId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (status && !VALID_PLAN_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await installmentService.exportInstallmentPlans(req.user.tenant, {
      format: format.toLowerCase(),
      status,
      studentId
    });
    
    logger.info('Installment plans exported successfully:', { format });
    return successResponse(res, exportData, 'Plans exported successfully');
  } catch (error) {
    logger.error('Error exporting installment plans:', error);
    return errorResponse(res, error.message);
  }
};

// Get Payment History
const getPaymentHistory = async (req, res) => {
  try {
    logger.info('Fetching payment history');
    
    const { id } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Plan ID');
    if (idError) errors.push(idError);
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await installmentService.getPaymentHistory(id, req.user.tenant, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Payment history fetched successfully:', { planId: id });
    return successResponse(res, result, 'Payment history retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payment history:', error);
    return errorResponse(res, error.message);
  }
};

// Get Installment Analytics
const getInstallmentAnalytics = async (req, res) => {
  try {
    logger.info('Fetching installment analytics');
    
    const { groupBy, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const validGroupBy = ['day', 'week', 'month', 'status', 'student'];
    if (groupBy && !validGroupBy.includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (startDate) {
      const dateError = validateDate(startDate, 'Start date');
      if (dateError) errors.push(dateError);
    }
    
    if (endDate) {
      const dateError = validateDate(endDate, 'End date');
      if (dateError) errors.push(dateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await installmentService.getInstallmentAnalytics(req.user.tenant, {
      groupBy: groupBy || 'month',
      startDate,
      endDate
    });
    
    logger.info('Installment analytics fetched successfully');
    return successResponse(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching installment analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Send Payment Reminders
const sendPaymentReminders = async (req, res) => {
  try {
    logger.info('Sending payment reminders');
    
    const { daysBeforeDue } = req.body;
    
    // Validation
    const errors = [];
    
    if (daysBeforeDue !== undefined) {
      const daysNum = parseInt(daysBeforeDue);
      if (isNaN(daysNum) || daysNum < 0) {
        errors.push('Days before due must be a non-negative number');
      } else if (daysNum > 90) {
        errors.push('Days before due must not exceed 90');
      }
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await installmentService.sendPaymentReminders(req.user.tenant, daysBeforeDue || 3);
    
    logger.info('Payment reminders sent successfully:', { count: result.count });
    return successResponse(res, result, 'Payment reminders sent successfully');
  } catch (error) {
    logger.error('Error sending payment reminders:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createInstallmentPlan,
  getInstallmentPlans,
  getInstallmentPlanById,
  payInstallment,
  applyLateFees,
  cancelInstallmentPlan,
  getUpcomingInstallments,
  getInstallmentStatistics,
  updateInstallmentPlan,
  getOverdueInstallments,
  waiveInstallment,
  bulkUpdatePlans,
  exportInstallmentPlans,
  getPaymentHistory,
  getInstallmentAnalytics,
  sendPaymentReminders
};
