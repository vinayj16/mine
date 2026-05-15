import hostelFeeService from '../services/hostelFeeService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['pending', 'paid', 'overdue', 'cancelled', 'refunded'];
const VALID_PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'online', 'cheque', 'upi'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];

// Helper function to get institution ID
const getInstitutionId = (req) => req.user?.schoolId || req.user?.institutionId || req.tenantId;

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

const createHostelFee = async (req, res, next) => {
  try {
    logger.info('Creating hostel fee');
    
    const { studentId, description, amount, dueDate, roomId, feeType } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (!description || description.trim().length === 0) {
      errors.push('Description is required');
    } else if (description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
    
    if (amount === undefined || amount === null) {
      errors.push('Amount is required');
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        errors.push('Amount must be a positive number');
      } else if (amountNum > 1000000) {
        errors.push('Amount must not exceed 1,000,000');
      }
    }
    
    const dueDateError = validateDate(dueDate, 'Due date');
    if (dueDateError) errors.push(dueDateError);
    
    if (roomId) {
      const roomIdError = validateObjectId(roomId, 'Room ID');
      if (roomIdError) errors.push(roomIdError);
    }
    
    if (feeType && feeType.length > 100) {
      errors.push('Fee type must not exceed 100 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const payload = await hostelFeeService.createFee({
      institutionId: institution,
      studentId,
      description,
      amount,
      dueDate,
      roomId,
      feeType
    });
    
    logger.info('Hostel fee created successfully:', { feeId: payload._id });
    return createdResponse(res, payload, 'Hostel fee created successfully');
  } catch (error) {
    logger.error('Error creating hostel fee:', error);
    next(error);
  }
};

const listHostelFees = async (req, res, next) => {
  try {
    logger.info('Fetching hostel fees');
    
    const { studentId, status, fromDate, toDate, roomId, page, limit, search } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (roomId) {
      const roomIdError = validateObjectId(roomId, 'Room ID');
      if (roomIdError) errors.push(roomIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (fromDate) {
      const fromDateError = validateDate(fromDate, 'From date');
      if (fromDateError) errors.push(fromDateError);
    }
    
    if (toDate) {
      const toDateError = validateDate(toDate, 'To date');
      if (toDateError) errors.push(toDateError);
    }
    
    if (fromDate && toDate) {
      const rangeError = validateDateRange(fromDate, toDate);
      if (rangeError) errors.push(rangeError);
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
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const fees = await hostelFeeService.listFees(institution, {
      studentId,
      status,
      fromDate,
      toDate,
      roomId,
      page: pageNum,
      limit: limitNum,
      search
    });
    
    logger.info('Hostel fees fetched successfully');
    return successResponse(res, fees, 'Hostel fees retrieved successfully');
  } catch (error) {
    logger.error('Error fetching hostel fees:', error);
    next(error);
  }
};

const getHostelFeeById = async (req, res, next) => {
  try {
    logger.info('Fetching hostel fee by ID');
    
    const { id } = req.params;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    const idError = validateObjectId(id, 'Fee ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const fee = await hostelFeeService.getFeeById(id, institution);
    
    if (!fee) {
      return notFoundResponse(res, 'Hostel fee not found');
    }
    
    logger.info('Hostel fee fetched successfully:', { feeId: id });
    return successResponse(res, fee, 'Hostel fee retrieved successfully');
  } catch (error) {
    logger.error('Error fetching hostel fee:', error);
    next(error);
  }
};

const updateHostelFee = async (req, res, next) => {
  try {
    logger.info('Updating hostel fee');
    
    const { id } = req.params;
    const { description, amount, dueDate, status } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    const idError = validateObjectId(id, 'Fee ID');
    if (idError) errors.push(idError);
    
    if (description !== undefined) {
      if (!description || description.trim().length === 0) {
        errors.push('Description cannot be empty');
      } else if (description.length > 500) {
        errors.push('Description must not exceed 500 characters');
      }
    }
    
    if (amount !== undefined) {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        errors.push('Amount must be a positive number');
      } else if (amountNum > 1000000) {
        errors.push('Amount must not exceed 1,000,000');
      }
    }
    
    if (dueDate !== undefined) {
      const dueDateError = validateDate(dueDate, 'Due date');
      if (dueDateError) errors.push(dueDateError);
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const fee = await hostelFeeService.updateFee(id, institution, req.body);
    
    if (!fee) {
      return notFoundResponse(res, 'Hostel fee not found');
    }
    
    logger.info('Hostel fee updated successfully:', { feeId: id });
    return successResponse(res, fee, 'Hostel fee updated successfully');
  } catch (error) {
    logger.error('Error updating hostel fee:', error);
    next(error);
  }
};

const deleteHostelFee = async (req, res, next) => {
  try {
    logger.info('Deleting hostel fee');
    
    const { id } = req.params;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    const idError = validateObjectId(id, 'Fee ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const fee = await hostelFeeService.deleteFee(id, institution);
    
    if (!fee) {
      return notFoundResponse(res, 'Hostel fee not found');
    }
    
    logger.info('Hostel fee deleted successfully:', { feeId: id });
    return successResponse(res, null, 'Hostel fee deleted successfully');
  } catch (error) {
    logger.error('Error deleting hostel fee:', error);
    next(error);
  }
};

const payHostelFee = async (req, res, next) => {
  try {
    logger.info('Marking hostel fee as paid');
    
    const { id } = req.params;
    const { transactionReference, paymentMethod, paidAmount, paymentDate } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    const idError = validateObjectId(id, 'Fee ID');
    if (idError) errors.push(idError);
    
    if (!transactionReference || transactionReference.trim().length === 0) {
      errors.push('Transaction reference is required');
    } else if (transactionReference.length > 100) {
      errors.push('Transaction reference must not exceed 100 characters');
    }
    
    if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      errors.push('Invalid payment method. Must be one of: ' + VALID_PAYMENT_METHODS.join(', '));
    }
    
    if (paidAmount !== undefined) {
      const paidAmountNum = parseFloat(paidAmount);
      if (isNaN(paidAmountNum) || paidAmountNum <= 0) {
        errors.push('Paid amount must be a positive number');
      } else if (paidAmountNum > 1000000) {
        errors.push('Paid amount must not exceed 1,000,000');
      }
    }
    
    if (paymentDate) {
      const paymentDateError = validateDate(paymentDate, 'Payment date');
      if (paymentDateError) errors.push(paymentDateError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const payment = await hostelFeeService.markPaid(id, transactionReference, {
      paymentMethod,
      paidAmount,
      paymentDate,
      paidBy: req.user?.id
    });
    
    if (!payment) {
      return notFoundResponse(res, 'Hostel fee not found');
    }
    
    logger.info('Hostel fee marked as paid successfully:', { feeId: id });
    return successResponse(res, payment, 'Payment recorded successfully');
  } catch (error) {
    logger.error('Error marking hostel fee as paid:', error);
    next(error);
  }
};

const getOverdueFees = async (req, res, next) => {
  try {
    logger.info('Fetching overdue hostel fees');
    
    const { studentId, roomId, page, limit } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (roomId) {
      const roomIdError = validateObjectId(roomId, 'Room ID');
      if (roomIdError) errors.push(roomIdError);
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
    
    const fees = await hostelFeeService.getOverdueFees(institution, {
      studentId,
      roomId,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Overdue hostel fees fetched successfully');
    return successResponse(res, fees, 'Overdue fees retrieved successfully');
  } catch (error) {
    logger.error('Error fetching overdue hostel fees:', error);
    next(error);
  }
};

const getFeeStatistics = async (req, res, next) => {
  try {
    logger.info('Fetching hostel fee statistics');
    
    const { startDate, endDate, roomId } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
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
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (roomId) {
      const roomIdError = validateObjectId(roomId, 'Room ID');
      if (roomIdError) errors.push(roomIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await hostelFeeService.getFeeStatistics(institution, {
      startDate,
      endDate,
      roomId
    });
    
    logger.info('Hostel fee statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching hostel fee statistics:', error);
    next(error);
  }
};

const bulkCreateFees = async (req, res, next) => {
  try {
    logger.info('Bulk creating hostel fees');
    
    const { fees } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (!fees || !Array.isArray(fees) || fees.length === 0) {
      errors.push('Fees array is required and must not be empty');
    } else {
      if (fees.length > 100) {
        errors.push('Cannot create more than 100 fees at once');
      }
      
      for (let i = 0; i < Math.min(fees.length, 10); i++) {
        const fee = fees[i];
        
        if (!fee.studentId) {
          errors.push('Student ID is required for fee at index ' + i);
          break;
        }
        
        if (!fee.amount || parseFloat(fee.amount) <= 0) {
          errors.push('Valid amount is required for fee at index ' + i);
          break;
        }
        
        if (!fee.dueDate) {
          errors.push('Due date is required for fee at index ' + i);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await hostelFeeService.bulkCreateFees(institution, fees);
    
    logger.info('Hostel fees created successfully:', { count: result.count });
    return createdResponse(res, result, 'Hostel fees created successfully');
  } catch (error) {
    logger.error('Error bulk creating hostel fees:', error);
    next(error);
  }
};

const exportFees = async (req, res, next) => {
  try {
    logger.info('Exporting hostel fees');
    
    const { format, status, startDate, endDate, studentId } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution information is required');
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
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
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (studentId) {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await hostelFeeService.exportFees(institution, format.toLowerCase(), {
      status,
      startDate,
      endDate,
      studentId
    });
    
    logger.info('Hostel fees exported successfully:', { format });
    return successResponse(res, exportData, 'Fees exported successfully');
  } catch (error) {
    logger.error('Error exporting hostel fees:', error);
    next(error);
  }
};


export default {
  createHostelFee,
  listHostelFees,
  getHostelFeeById,
  updateHostelFee,
  deleteHostelFee,
  payHostelFee,
  getOverdueFees,
  getFeeStatistics,
  bulkCreateFees,
  exportFees
};
