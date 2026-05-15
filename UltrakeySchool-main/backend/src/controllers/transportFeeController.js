import TransportFee from '../models/TransportFee.js';
import StudentTransport from '../models/StudentTransport.js';
import Student from '../models/Student.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import { getCache, setCache, deleteCachePattern } from '../config/redis.js';

// Validation constants
const VALID_PAYMENT_STATUSES = ['pending', 'partial', 'paid', 'overdue', 'waived'];
const VALID_PAYMENT_METHODS = ['cash', 'card', 'upi', 'netbanking', 'cheque', 'dd', 'online'];
const VALID_TERMS = ['first', 'second', 'third', 'annual'];

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

// Create transport fee for a student
export const createTransportFee = async (req, res) => {
  try {
    logger.info('Creating transport fee');
    
    const { studentId, studentTransportId, feeAmount, dueDate, academicYear, term, discount, discountReason } = req.body;
    const schoolId = req.user.schoolId;
    const institutionId = req.user.institutionId;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    const studentTransportIdError = validateObjectId(studentTransportId, 'Student Transport ID');
    if (studentTransportIdError) errors.push(studentTransportIdError);
    
    if (!feeAmount || feeAmount <= 0) {
      errors.push('Fee amount must be greater than 0');
    }
    
    if (!dueDate) {
      errors.push('Due date is required');
    }
    
    if (!academicYear) {
      errors.push('Academic year is required');
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Check if student transport exists
    const studentTransport = await StudentTransport.findOne({
      _id: studentTransportId,
      studentId,
      schoolId,
      status: 'active'
    });
    
    if (!studentTransport) {
      return notFoundResponse(res, 'Student transport not found or inactive');
    }
    
    // Check if fee already exists for this student transport and academic year
    const existingFee = await TransportFee.findOne({
      studentTransportId,
      academicYear,
      term: term || 'annual'
    });
    
    if (existingFee) {
      return errorResponse(res, 'Transport fee already exists for this student transport and academic year', 400);
    }
    
    // Create transport fee
    const transportFee = await TransportFee.create({
      schoolId,
      institutionId,
      studentId,
      studentTransportId,
      feeAmount,
      dueDate: new Date(dueDate),
      academicYear,
      term: term || 'annual',
      discount: discount || 0,
      discountReason
    });
    
    // Invalidate cache
    await deleteCachePattern(`transport:fees:${schoolId}:${institutionId}`);
    
    logger.info('Transport fee created successfully:', { id: transportFee._id });
    return createdResponse(res, transportFee, 'Transport fee created successfully');
  } catch (error) {
    logger.error('Error creating transport fee:', error);
    return errorResponse(res, error.message);
  }
};

// Get transport fees for a student
export const getStudentTransportFees = async (req, res) => {
  try {
    logger.info('Fetching student transport fees');
    
    const { studentId } = req.params;
    const { status, academicYear, term } = req.query;
    const schoolId = req.user.schoolId;
    const institutionId = req.user.institutionId;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Try to get from cache first
    const cacheKey = `transport:fees:student:${studentId}:${schoolId}:${institutionId || 'default'}:${status || 'all'}:${academicYear || 'all'}:${term || 'all'}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.info('Student transport fees retrieved from cache');
      return successResponse(res, cachedData, 'Transport fees retrieved successfully (cached)');
    }
    
    // Build query
    const query = { studentId, schoolId, institutionId };
    if (status) query.paymentStatus = status;
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;
    
    const fees = await TransportFee.find(query)
      .populate('studentTransportId', 'routeName vehicleNumber pickupPoint pickupTime')
      .populate('collectedBy', 'name email')
      .sort({ dueDate: -1 });
    
    // Cache the response for 5 minutes
    await setCache(cacheKey, fees, 300);
    
    logger.info('Student transport fees fetched successfully');
    return successResponse(res, fees, 'Transport fees retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student transport fees:', error);
    return errorResponse(res, error.message);
  }
};

// Get all transport fees (for admin/accountant)
export const getTransportFees = async (req, res) => {
  try {
    logger.info('Fetching transport fees');
    
    const { status, academicYear, term, page = 1, limit = 20 } = req.query;
    const schoolId = req.user.schoolId;
    const institutionId = req.user.institutionId;
    
    // Try to get from cache first
    const cacheKey = `transport:fees:${schoolId}:${institutionId || 'default'}:${status || 'all'}:${academicYear || 'all'}:${term || 'all'}:${page}:${limit}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.info('Transport fees retrieved from cache');
      return successResponse(res, cachedData, 'Transport fees retrieved successfully (cached)');
    }
    
    // Build query
    const query = { schoolId, institutionId };
    if (status) query.paymentStatus = status;
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const [fees, total] = await Promise.all([
      TransportFee.find(query)
        .populate('studentId', 'firstName lastName rollNumber')
        .populate('studentTransportId', 'routeName vehicleNumber pickupPoint')
        .populate('collectedBy', 'name email')
        .sort({ dueDate: -1 })
        .skip(skip)
        .limit(limitNum),
      TransportFee.countDocuments(query)
    ]);
    
    const result = {
      fees,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
    
    // Cache the response for 5 minutes
    await setCache(cacheKey, result, 300);
    
    logger.info('Transport fees fetched successfully');
    return successResponse(res, result, 'Transport fees retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport fees:', error);
    return errorResponse(res, error.message);
  }
};

// Pay transport fee
export const payTransportFee = async (req, res) => {
  try {
    logger.info('Paying transport fee');
    
    const { feeId } = req.params;
    const { paymentMethod, paymentReference, paymentDetails, paidAmount } = req.body;
    const schoolId = req.user.schoolId;
    const institutionId = req.user.institutionId;
    const userId = req.user.id;
    
    // Validation
    const errors = [];
    
    const feeIdError = validateObjectId(feeId, 'Fee ID');
    if (feeIdError) errors.push(feeIdError);
    
    if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      errors.push('Invalid payment method. Must be one of: ' + VALID_PAYMENT_METHODS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Find the fee
    const fee = await TransportFee.findOne({ _id: feeId, schoolId, institutionId });
    
    if (!fee) {
      return notFoundResponse(res, 'Transport fee not found');
    }
    
    if (fee.paymentStatus === 'paid') {
      return errorResponse(res, 'Transport fee already paid', 400);
    }
    
    // Calculate payment
    const amountToPay = paidAmount || (fee.feeAmount - fee.discount - fee.paidAmount);
    const newPaidAmount = fee.paidAmount + amountToPay;
    const totalAmount = fee.feeAmount - fee.discount;
    
    // Update fee
    fee.paidAmount = newPaidAmount;
    fee.paymentMethod = paymentMethod;
    fee.paymentReference = paymentReference;
    fee.paymentDetails = paymentDetails;
    fee.collectedBy = userId;
    fee.paidDate = new Date();
    
    if (newPaidAmount >= totalAmount) {
      fee.paymentStatus = 'paid';
    } else {
      fee.paymentStatus = 'partial';
    }
    
    await fee.save();
    
    // Update student transport fees paid status
    if (fee.paymentStatus === 'paid') {
      await StudentTransport.findByIdAndUpdate(fee.studentTransportId, { feesPaid: true });
    }
    
    // Invalidate cache
    await deleteCachePattern(`transport:fees:${schoolId}:${institutionId}`);
    
    logger.info('Transport fee paid successfully:', { id: feeId });
    return successResponse(res, fee, 'Transport fee paid successfully');
  } catch (error) {
    logger.error('Error paying transport fee:', error);
    return errorResponse(res, error.message);
  }
};

// Get transport fee by ID
export const getTransportFeeById = async (req, res) => {
  try {
    logger.info('Fetching transport fee by ID');
    
    const { feeId } = req.params;
    const schoolId = req.user.schoolId;
    const institutionId = req.user.institutionId;
    
    // Validation
    const errors = [];
    
    const feeIdError = validateObjectId(feeId, 'Fee ID');
    if (feeIdError) errors.push(feeIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const fee = await TransportFee.findOne({ _id: feeId, schoolId, institutionId })
      .populate('studentId', 'firstName lastName rollNumber email phone')
      .populate('studentTransportId', 'routeName vehicleNumber pickupPoint pickupTime dropPoint dropTime')
      .populate('collectedBy', 'name email');
    
    if (!fee) {
      return notFoundResponse(res, 'Transport fee not found');
    }
    
    logger.info('Transport fee fetched successfully');
    return successResponse(res, fee, 'Transport fee retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport fee:', error);
    return errorResponse(res, error.message);
  }
};

// Update transport fee
export const updateTransportFee = async (req, res) => {
  try {
    logger.info('Updating transport fee');
    
    const { feeId } = req.params;
    const { feeAmount, dueDate, discount, discountReason, remarks } = req.body;
    const schoolId = req.user.schoolId;
    const institutionId = req.user.institutionId;
    
    // Validation
    const errors = [];
    
    const feeIdError = validateObjectId(feeId, 'Fee ID');
    if (feeIdError) errors.push(feeIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const fee = await TransportFee.findOne({ _id: feeId, schoolId, institutionId });
    
    if (!fee) {
      return notFoundResponse(res, 'Transport fee not found');
    }
    
    // Update fields
    if (feeAmount !== undefined) fee.feeAmount = feeAmount;
    if (dueDate !== undefined) fee.dueDate = new Date(dueDate);
    if (discount !== undefined) fee.discount = discount;
    if (discountReason !== undefined) fee.discountReason = discountReason;
    if (remarks !== undefined) fee.remarks = remarks;
    
    await fee.save();
    
    // Invalidate cache
    await deleteCachePattern(`transport:fees:${schoolId}:${institutionId}`);
    
    logger.info('Transport fee updated successfully');
    return successResponse(res, fee, 'Transport fee updated successfully');
  } catch (error) {
    logger.error('Error updating transport fee:', error);
    return errorResponse(res, error.message);
  }
};

// Delete transport fee
export const deleteTransportFee = async (req, res) => {
  try {
    logger.info('Deleting transport fee');
    
    const { feeId } = req.params;
    const schoolId = req.user.schoolId;
    const institutionId = req.user.institutionId;
    
    // Validation
    const errors = [];
    
    const feeIdError = validateObjectId(feeId, 'Fee ID');
    if (feeIdError) errors.push(feeIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const fee = await TransportFee.findOne({ _id: feeId, schoolId, institutionId });
    
    if (!fee) {
      return notFoundResponse(res, 'Transport fee not found');
    }
    
    if (fee.paymentStatus === 'paid') {
      return errorResponse(res, 'Cannot delete paid transport fee', 400);
    }
    
    await TransportFee.deleteOne({ _id: feeId });
    
    // Invalidate cache
    await deleteCachePattern(`transport:fees:${schoolId}:${institutionId}`);
    
    logger.info('Transport fee deleted successfully');
    return successResponse(res, null, 'Transport fee deleted successfully');
  } catch (error) {
    logger.error('Error deleting transport fee:', error);
    return errorResponse(res, error.message);
  }
};

// Get transport fee statistics
export const getTransportFeeStats = async (req, res) => {
  try {
    logger.info('Fetching transport fee statistics');
    
    const schoolId = req.user.schoolId;
    const institutionId = req.user.institutionId;
    const { academicYear } = req.query;
    
    // Try to get from cache first
    const cacheKey = `transport:fees:stats:${schoolId}:${institutionId || 'default'}:${academicYear || 'all'}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.info('Transport fee statistics retrieved from cache');
      return successResponse(res, cachedData, 'Transport fee statistics retrieved successfully (cached)');
    }
    
    // Build query
    const query = { schoolId, institutionId };
    if (academicYear) query.academicYear = academicYear;
    
    const [totalFees, paidFees, pendingFees, partialFees, overdueFees] = await Promise.all([
      TransportFee.countDocuments(query),
      TransportFee.countDocuments({ ...query, paymentStatus: 'paid' }),
      TransportFee.countDocuments({ ...query, paymentStatus: 'pending' }),
      TransportFee.countDocuments({ ...query, paymentStatus: 'partial' }),
      TransportFee.countDocuments({ ...query, paymentStatus: 'overdue' })
    ]);
    
    const totalAmount = await TransportFee.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$feeAmount' } } }
    ]);
    
    const collectedAmount = await TransportFee.aggregate([
      { $match: { ...query, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);
    
    const stats = {
      totalFees,
      paidFees,
      pendingFees,
      partialFees,
      overdueFees,
      totalAmount: totalAmount[0]?.total || 0,
      collectedAmount: collectedAmount[0]?.total || 0,
      pendingAmount: (totalAmount[0]?.total || 0) - (collectedAmount[0]?.total || 0)
    };
    
    // Cache the response for 5 minutes
    await setCache(cacheKey, stats, 300);
    
    logger.info('Transport fee statistics fetched successfully');
    return successResponse(res, stats, 'Transport fee statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport fee statistics:', error);
    return errorResponse(res, error.message);
  }
};

export default {
  createTransportFee,
  getStudentTransportFees,
  getTransportFees,
  payTransportFee,
  getTransportFeeById,
  updateTransportFee,
  deleteTransportFee,
  getTransportFeeStats
};
