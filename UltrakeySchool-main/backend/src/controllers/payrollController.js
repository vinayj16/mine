import Payroll from '../models/Payroll.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_PAYROLL_STATUSES = ['draft', 'pending', 'approved', 'paid', 'rejected'];
const VALID_PAYMENT_METHODS = ['bank-transfer', 'cash', 'cheque', 'online'];
const VALID_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

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

// Helper function to validate amount
const validateAmount = (amount, fieldName = 'Amount') => {
  if (amount === undefined || amount === null) {
    return fieldName + ' is required';
  }
  if (typeof amount !== 'number' || amount < 0) {
    return fieldName + ' must be a positive number';
  }
  return null;
};

// Helper function to validate year
const validateYear = (year) => {
  if (!year) {
    return 'Year is required';
  }
  const yearNum = parseInt(year);
  if (isNaN(yearNum) || yearNum < MIN_YEAR || yearNum > MAX_YEAR) {
    return 'Year must be between ' + MIN_YEAR + ' and ' + MAX_YEAR;
  }
  return null;
};

// Helper function to validate month
const validateMonth = (month) => {
  if (!month) {
    return 'Month is required';
  }
  const monthNum = parseInt(month);
  if (!VALID_MONTHS.includes(monthNum)) {
    return 'Month must be between 1 and 12';
  }
  return null;
};

const payrollController = {
  // Create payroll
  async create(req, res) {
    try {
      logger.info('Creating payroll');
      
      const { employee, month, year, basicSalary, allowances, deductions, status, paymentMethod } = req.body;
      const tenantId = req.tenantId;
      const userId = req.user?.id;
      
      // Validation
      const errors = [];
      
      if (!tenantId) {
        errors.push('Tenant information is required');
      }
      
      if (!userId) {
        errors.push('User authentication is required');
      }
      
      if (!employee) {
        errors.push('Employee is required');
      } else {
        const employeeError = validateObjectId(employee, 'Employee ID');
        if (employeeError) errors.push(employeeError);
      }
      
      const monthError = validateMonth(month);
      if (monthError) errors.push(monthError);
      
      const yearError = validateYear(year);
      if (yearError) errors.push(yearError);
      
      const basicSalaryError = validateAmount(basicSalary, 'Basic salary');
      if (basicSalaryError) errors.push(basicSalaryError);
      
      if (allowances !== undefined) {
        if (typeof allowances !== 'object' || Array.isArray(allowances)) {
          errors.push('Allowances must be an object');
        }
      }
      
      if (deductions !== undefined) {
        if (typeof deductions !== 'object' || Array.isArray(deductions)) {
          errors.push('Deductions must be an object');
        }
      }
      
      if (status && !VALID_PAYROLL_STATUSES.includes(status)) {
        errors.push('Invalid status. Must be one of: ' + VALID_PAYROLL_STATUSES.join(', '));
      }
      
      if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        errors.push('Invalid payment method. Must be one of: ' + VALID_PAYMENT_METHODS.join(', '));
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }
      
      // Check for duplicate payroll
      const existingPayroll = await Payroll.findOne({
        employee,
        month: parseInt(month),
        year: parseInt(year),
        institution: tenantId
      });
      
      if (existingPayroll) {
        return validationErrorResponse(res, ['Payroll already exists for this employee in the specified month and year']);
      }
      
      const count = await Payroll.countDocuments({ institution: tenantId });
      const payrollId = 'P' + String(count + 1).padStart(6, '0');
      
      const payroll = new Payroll({
        ...req.body,
        payrollId,
        institution: tenantId,
        createdBy: userId
      });
      
      await payroll.save();
      
      logger.info('Payroll created successfully:', { payrollId, institution: tenantId });
      return createdResponse(res, payroll, 'Payroll created successfully');
    } catch (error) {
      logger.error('Error creating payroll:', error);
      return errorResponse(res, error.message);
    }
  },

  // Get all payrolls
  async getAll(req, res) {
    try {
      logger.info('Fetching all payrolls');
      
      const { page, limit, status, month, year, employee, search } = req.query;
      const tenantId = req.tenantId;
      
      // Validation
      const errors = [];
      
      if (!tenantId) {
        errors.push('Tenant information is required');
      }
      
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      
      if (pageNum < 1) {
        errors.push('Page must be greater than 0');
      }
      
      if (limitNum < 1 || limitNum > 100) {
        errors.push('Limit must be between 1 and 100');
      }
      
      if (status && !VALID_PAYROLL_STATUSES.includes(status)) {
        errors.push('Invalid status. Must be one of: ' + VALID_PAYROLL_STATUSES.join(', '));
      }
      
      if (month) {
        const monthError = validateMonth(month);
        if (monthError) errors.push(monthError);
      }
      
      if (year) {
        const yearError = validateYear(year);
        if (yearError) errors.push(yearError);
      }
      
      if (employee) {
        const employeeError = validateObjectId(employee, 'Employee ID');
        if (employeeError) errors.push(employeeError);
      }
      
      if (search && search.length > 200) {
        errors.push('Search query must not exceed 200 characters');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }
      
      const query = { institution: tenantId };
      
      if (status) query.status = status;
      if (month) query.month = parseInt(month);
      if (year) query.year = parseInt(year);
      if (employee) query.employee = employee;
      if (search) {
        query.payrollId = { $regex: search, $options: 'i' };
      }
      
      const skip = (pageNum - 1) * limitNum;
      
      const [payrolls, total] = await Promise.all([
        Payroll.find(query)
          .populate('employee', 'name email phone avatar')
          .populate('createdBy', 'name')
          .sort({ year: -1, month: -1 })
          .skip(skip)
          .limit(limitNum),
        Payroll.countDocuments(query)
      ]);
      
      logger.info('Payrolls fetched successfully');
      return successResponse(res, {
        payrolls,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }, 'Payrolls retrieved successfully');
    } catch (error) {
      logger.error('Error fetching payrolls:', error);
      return errorResponse(res, error.message);
    }
  },

  // Get payroll by ID
  async getById(req, res) {
    try {
      logger.info('Fetching payroll by ID');
      
      const { id } = req.params;
      const tenantId = req.tenantId;
      
      // Validation
      const errors = [];
      
      const idError = validateObjectId(id, 'Payroll ID');
      if (idError) errors.push(idError);
      
      if (!tenantId) {
        errors.push('Tenant information is required');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }
      
      const payroll = await Payroll.findOne({
        _id: id,
        institution: tenantId
      })
        .populate('employee', 'name email phone avatar')
        .populate('createdBy', 'name');
      
      if (!payroll) {
        return notFoundResponse(res, 'Payroll not found');
      }
      
      logger.info('Payroll fetched successfully:', { payrollId: payroll.payrollId });
      return successResponse(res, payroll, 'Payroll retrieved successfully');
    } catch (error) {
      logger.error('Error fetching payroll:', error);
      return errorResponse(res, error.message);
    }
  },

  // Update payroll
  async update(req, res) {
    try {
      logger.info('Updating payroll');
      
      const { id } = req.params;
      const { basicSalary, allowances, deductions, status, paymentMethod } = req.body;
      const tenantId = req.tenantId;
      
      // Validation
      const errors = [];
      
      const idError = validateObjectId(id, 'Payroll ID');
      if (idError) errors.push(idError);
      
      if (!tenantId) {
        errors.push('Tenant information is required');
      }
      
      if (basicSalary !== undefined) {
        const basicSalaryError = validateAmount(basicSalary, 'Basic salary');
        if (basicSalaryError) errors.push(basicSalaryError);
      }
      
      if (allowances !== undefined) {
        if (typeof allowances !== 'object' || Array.isArray(allowances)) {
          errors.push('Allowances must be an object');
        }
      }
      
      if (deductions !== undefined) {
        if (typeof deductions !== 'object' || Array.isArray(deductions)) {
          errors.push('Deductions must be an object');
        }
      }
      
      if (status !== undefined && !VALID_PAYROLL_STATUSES.includes(status)) {
        errors.push('Invalid status. Must be one of: ' + VALID_PAYROLL_STATUSES.join(', '));
      }
      
      if (paymentMethod !== undefined && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        errors.push('Invalid payment method. Must be one of: ' + VALID_PAYMENT_METHODS.join(', '));
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }
      
      const payroll = await Payroll.findOneAndUpdate(
        { _id: id, institution: tenantId },
        req.body,
        { new: true, runValidators: true }
      )
        .populate('employee', 'name email phone avatar')
        .populate('createdBy', 'name');
      
      if (!payroll) {
        return notFoundResponse(res, 'Payroll not found');
      }
      
      logger.info('Payroll updated successfully:', { payrollId: payroll.payrollId });
      return successResponse(res, payroll, 'Payroll updated successfully');
    } catch (error) {
      logger.error('Error updating payroll:', error);
      return errorResponse(res, error.message);
    }
  },

  // Delete payroll
  async delete(req, res) {
    try {
      logger.info('Deleting payroll');
      
      const { id } = req.params;
      const tenantId = req.tenantId;
      
      // Validation
      const errors = [];
      
      const idError = validateObjectId(id, 'Payroll ID');
      if (idError) errors.push(idError);
      
      if (!tenantId) {
        errors.push('Tenant information is required');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }
      
      const payroll = await Payroll.findOneAndDelete({
        _id: id,
        institution: tenantId
      });
      
      if (!payroll) {
        return notFoundResponse(res, 'Payroll not found');
      }
      
      logger.info('Payroll deleted successfully:', { payrollId: payroll.payrollId });
      return successResponse(res, null, 'Payroll deleted successfully');
    } catch (error) {
      logger.error('Error deleting payroll:', error);
      return errorResponse(res, error.message);
    }
  },

  // Approve payroll
  async approve(req, res) {
    try {
      logger.info('Approving payroll');
      
      const { id } = req.params;
      const tenantId = req.tenantId;
      const userId = req.user?.id;
      
      // Validation
      const errors = [];
      
      const idError = validateObjectId(id, 'Payroll ID');
      if (idError) errors.push(idError);
      
      if (!tenantId) {
        errors.push('Tenant information is required');
      }
      
      if (!userId) {
        errors.push('User authentication is required');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }
      
      const payroll = await Payroll.findOneAndUpdate(
        { _id: id, institution: tenantId },
        { status: 'approved', approvedBy: userId, approvedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate('employee', 'name email phone avatar')
        .populate('createdBy', 'name');
      
      if (!payroll) {
        return notFoundResponse(res, 'Payroll not found');
      }
      
      logger.info('Payroll approved successfully:', { payrollId: payroll.payrollId });
      return successResponse(res, payroll, 'Payroll approved successfully');
    } catch (error) {
      logger.error('Error approving payroll:', error);
      return errorResponse(res, error.message);
    }
  },

  // Reject payroll
  async reject(req, res) {
    try {
      logger.info('Rejecting payroll');
      
      const { id } = req.params;
      const { reason } = req.body;
      const tenantId = req.tenantId;
      const userId = req.user?.id;
      
      // Validation
      const errors = [];
      
      const idError = validateObjectId(id, 'Payroll ID');
      if (idError) errors.push(idError);
      
      if (!tenantId) {
        errors.push('Tenant information is required');
      }
      
      if (!userId) {
        errors.push('User authentication is required');
      }
      
      if (reason && reason.length > 500) {
        errors.push('Reason must not exceed 500 characters');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }
      
      const payroll = await Payroll.findOneAndUpdate(
        { _id: id, institution: tenantId },
        { status: 'rejected', rejectedBy: userId, rejectedAt: new Date(), rejectionReason: reason },
        { new: true, runValidators: true }
      )
        .populate('employee', 'name email phone avatar')
        .populate('createdBy', 'name');
      
      if (!payroll) {
        return notFoundResponse(res, 'Payroll not found');
      }
      
      logger.info('Payroll rejected successfully:', { payrollId: payroll.payrollId });
      return successResponse(res, payroll, 'Payroll rejected successfully');
    } catch (error) {
      logger.error('Error rejecting payroll:', error);
      return errorResponse(res, error.message);
    }
  },

  // Mark as paid
  async markAsPaid(req, res) {
    try {
      logger.info('Marking payroll as paid');
      
      const { id } = req.params;
      const { paymentDate, paymentReference } = req.body;
      const tenantId = req.tenantId;
      const userId = req.user?.id;
      
      // Validation
      const errors = [];
      
      const idError = validateObjectId(id, 'Payroll ID');
      if (idError) errors.push(idError);
      
      if (!tenantId) {
        errors.push('Tenant information is required');
      }
      
      if (!userId) {
        errors.push('User authentication is required');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }
      
      const updateData = {
        status: 'paid',
        paidBy: userId,
        paidAt: paymentDate || new Date()
      };
      
      if (paymentReference) {
        updateData.paymentReference = paymentReference;
      }
      
      const payroll = await Payroll.findOneAndUpdate(
        { _id: id, institution: tenantId },
        updateData,
        { new: true, runValidators: true }
      )
        .populate('employee', 'name email phone avatar')
        .populate('createdBy', 'name');
      
      if (!payroll) {
        return notFoundResponse(res, 'Payroll not found');
      }
      
      logger.info('Payroll marked as paid successfully:', { payrollId: payroll.payrollId });
      return successResponse(res, payroll, 'Payroll marked as paid successfully');
    } catch (error) {
      logger.error('Error marking payroll as paid:', error);
      return errorResponse(res, error.message);
    }
  },

  // Get payroll statistics
  async getStatistics(req, res) {
    try {
      logger.info('Fetching payroll statistics');
      
      const { year, month } = req.query;
      const tenantId = req.tenantId;
      
      // Validation
      const errors = [];
      
      if (!tenantId) {
        errors.push('Tenant information is required');
      }
      
      if (year) {
        const yearError = validateYear(year);
        if (yearError) errors.push(yearError);
      }
      
      if (month) {
        const monthError = validateMonth(month);
        if (monthError) errors.push(monthError);
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }
      
      const filter = { institution: tenantId };
      if (year) filter.year = parseInt(year);
      if (month) filter.month = parseInt(month);
      
      const [
        totalPayrolls,
        statusBreakdown,
        totalAmount,
        paymentMethodBreakdown
      ] = await Promise.all([
        Payroll.countDocuments(filter),
        Payroll.aggregate([
          { $match: filter },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Payroll.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$netSalary' } } }
        ]),
        Payroll.aggregate([
          { $match: filter },
          { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
        ])
      ]);
      
      const statistics = {
        totalPayrolls,
        totalAmount: totalAmount[0]?.total || 0,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        paymentMethodBreakdown: paymentMethodBreakdown.reduce((acc, item) => {
          acc[item._id || 'not-specified'] = item.count;
          return acc;
        }, {})
      };
      
      logger.info('Payroll statistics fetched successfully');
      return successResponse(res, statistics, 'Statistics retrieved successfully');
    } catch (error) {
      logger.error('Error fetching payroll statistics:', error);
      return errorResponse(res, error.message);
    }
  },

  // Export payroll data
  async exportData(req, res) {
    try {
      logger.info('Exporting payroll data');
      
      const { format, year, month, status } = req.query;
      const tenantId = req.tenantId;
      
      // Validation
      const errors = [];
      
      if (!tenantId) {
        errors.push('Tenant information is required');
      }
      
      if (!format || format.trim().length === 0) {
        errors.push('Export format is required');
      } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
        errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
      }
      
      if (year) {
        const yearError = validateYear(year);
        if (yearError) errors.push(yearError);
      }
      
      if (month) {
        const monthError = validateMonth(month);
        if (monthError) errors.push(monthError);
      }
      
      if (status && !VALID_PAYROLL_STATUSES.includes(status)) {
        errors.push('Invalid status. Must be one of: ' + VALID_PAYROLL_STATUSES.join(', '));
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }
      
      const filter = { institution: tenantId };
      if (year) filter.year = parseInt(year);
      if (month) filter.month = parseInt(month);
      if (status) filter.status = status;
      
      const payrolls = await Payroll.find(filter)
        .populate('employee', 'name email phone')
        .lean();
      
      const exportData = {
        format: format.toLowerCase(),
        exportDate: new Date().toISOString(),
        totalRecords: payrolls.length,
        data: payrolls
      };
      
      logger.info('Payroll data exported successfully:', { format, count: payrolls.length });
      return successResponse(res, exportData, 'Data exported successfully');
    } catch (error) {
      logger.error('Error exporting payroll data:', error);
      return errorResponse(res, error.message);
    }
  },

  // Bulk delete payrolls
  async bulkDelete(req, res) {
    try {
      logger.info('Bulk deleting payrolls');
      
      const { payrollIds } = req.body;
      const tenantId = req.tenantId;
      
      // Validation
      const errors = [];
      
      if (!tenantId) {
        errors.push('Tenant information is required');
      }
      
      if (!payrollIds || !Array.isArray(payrollIds)) {
        errors.push('Payroll IDs must be an array');
      } else if (payrollIds.length === 0) {
        errors.push('Payroll IDs array cannot be empty');
      } else if (payrollIds.length > 100) {
        errors.push('Cannot delete more than 100 payrolls at once');
      } else {
        for (const id of payrollIds) {
          const idError = validateObjectId(id, 'Payroll ID');
          if (idError) {
            errors.push(idError);
            break;
          }
        }
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }
      
      const result = await Payroll.deleteMany({
        _id: { $in: payrollIds },
        institution: tenantId
      });
      
      logger.info('Payrolls bulk deleted successfully:', { count: result.deletedCount });
      return successResponse(res, { deletedCount: result.deletedCount }, 'Payrolls deleted successfully');
    } catch (error) {
      logger.error('Error bulk deleting payrolls:', error);
      return errorResponse(res, error.message);
    }
  },

  // Get employee payroll history
  async getEmployeeHistory(req, res) {
    try {
      logger.info('Fetching employee payroll history');
      
      const { employeeId } = req.params;
      const { page, limit, year } = req.query;
      const tenantId = req.tenantId;
      
      // Validation
      const errors = [];
      
      const employeeIdError = validateObjectId(employeeId, 'Employee ID');
      if (employeeIdError) errors.push(employeeIdError);
      
      if (!tenantId) {
        errors.push('Tenant information is required');
      }
      
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      
      if (pageNum < 1) {
        errors.push('Page must be greater than 0');
      }
      
      if (limitNum < 1 || limitNum > 100) {
        errors.push('Limit must be between 1 and 100');
      }
      
      if (year) {
        const yearError = validateYear(year);
        if (yearError) errors.push(yearError);
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }
      
      const filter = {
        employee: employeeId,
        institution: tenantId
      };
      
      if (year) filter.year = parseInt(year);
      
      const skip = (pageNum - 1) * limitNum;
      
      const [payrolls, total] = await Promise.all([
        Payroll.find(filter)
          .sort({ year: -1, month: -1 })
          .skip(skip)
          .limit(limitNum),
        Payroll.countDocuments(filter)
      ]);
      
      logger.info('Employee payroll history fetched successfully');
      return successResponse(res, {
        payrolls,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }, 'Payroll history retrieved successfully');
    } catch (error) {
      logger.error('Error fetching employee payroll history:', error);
      return errorResponse(res, error.message);
    }
  }
};

export default payrollController;
