import { FeeStructure, Invoice, FinanceTransaction, Budget, Salary } from '../models/finance.js';
import { FeeGroup, FeeType, FeeMaster, FeeAssignment } from '../models/feeCatalog.js';
import Payment from '../models/Payment.js';
import Payroll from '../models/Payroll.js';
import { getInstitutionFilter, matchInstitutionField } from '../utils/tenantContext.js';
import ExpenseCategory from '../models/expenseCategory.js';
import TaxRate from '../models/taxRate.js';
import stripeService from '../services/stripeService.js';
import logger from '../utils/logger.js';
import { 
  successResponse, 
  createdResponse, 
  updatedResponse, 
  deletedResponse, 
  errorResponse,
  notFoundResponse,
  badRequestResponse
} from '../utils/apiResponse.js';

// Fee Structure Controller
const feeStructureController = {
  // Create fee structure
  create: async (req, res) => {
    try {
      const feeStructure = new FeeStructure({
        ...req.body,
        institution: req.tenantId
      });

      await feeStructure.save();

      logger.info(`Fee structure created: ${feeStructure.name}`, {
        institution: req.tenantId,
        user: req.user.id
      });

      return createdResponse(res, { feeStructure }, 'Fee structure created successfully');
    } catch (error) {
      logger.error('Create fee structure error:', error);
      return errorResponse(res, 'Failed to create fee structure', 500);
    }
  },

  // Get all fee structures
  getAll: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        grade,
        category,
        academicYear,
        isActive = true
      } = req.query;

      const instFilter = getInstitutionFilter(req.tenantId);
      const query = instFilter ? { ...instFilter } : { institution: req.tenantId };

      if (grade && grade !== 'all') query.grade = grade;
      if (category) query.category = category;
      if (academicYear) query.academicYear = academicYear;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const skip = (page - 1) * limit;

      const [feeStructures, total] = await Promise.all([
        FeeStructure.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        FeeStructure.countDocuments(query)
      ]);

      return successResponse(res, {
        feeStructures,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, 'Fee structures retrieved successfully');
    } catch (error) {
      logger.error('Get fee structures error:', error);
      return errorResponse(res, 'Failed to retrieve fee structures', 500);
    }
  },

  // Get fee structure by ID
  getById: async (req, res) => {
    try {
      const feeStructure = await FeeStructure.findOne({
        _id: req.params.id,
        institution: req.tenantId
      });

      if (!feeStructure) {
        return notFoundResponse(res, 'Fee structure not found');
      }

      return successResponse(res, { feeStructure }, 'Fee structure retrieved successfully');
    } catch (error) {
      logger.error('Get fee structure by ID error:', error);
      return errorResponse(res, 'Failed to retrieve fee structure', 500);
    }
  },

  // Update fee structure
  update: async (req, res) => {
    try {
      const feeStructure = await FeeStructure.findOneAndUpdate(
        { _id: req.params.id, institution: req.tenantId },
        req.body,
        { new: true, runValidators: true }
      );

      if (!feeStructure) {
        return notFoundResponse(res, 'Fee structure not found');
      }

      logger.info(`Fee structure updated: ${feeStructure.name}`, {
        institution: req.tenantId,
        user: req.user.id
      });

      return successResponse(res, { feeStructure }, 'Fee structure updated successfully');
    } catch (error) {
      logger.error('Update fee structure error:', error);
      return errorResponse(res, 'Failed to update fee structure', 500);
    }
  },

  // Delete fee structure
  delete: async (req, res) => {
    try {
      const feeStructure = await FeeStructure.findOneAndDelete({
        _id: req.params.id,
        institution: req.tenantId
      });

      if (!feeStructure) {
        return notFoundResponse(res, 'Fee structure not found');
      }

      logger.info(`Fee structure deleted: ${feeStructure.name}`, {
        institution: req.tenantId,
        user: req.user.id
      });

      return successResponse(res, 'Fee structure deleted successfully');
    } catch (error) {
      logger.error('Delete fee structure error:', error);
      return errorResponse(res, 'Failed to delete fee structure', 500);
    }
  }
};

// Invoice Controller
const invoiceController = {
  // Create invoice
  create: async (req, res) => {
    try {
      const { student, items, dueDate, academicYear, notes } = req.body;

      // Calculate totals
      let subtotal = 0;
      const processedItems = [];

      for (const item of items) {
        const feeStructure = await FeeStructure.findById(item.feeStructure);
        if (!feeStructure) {
          return badRequestResponse(res, `Invalid fee structure: ${item.feeStructure}`);
        }

        const itemTotal = feeStructure.amount * (item.quantity || 1);
        subtotal += itemTotal;

        processedItems.push({
          feeStructure: item.feeStructure,
          description: item.description || feeStructure.name,
          amount: feeStructure.amount,
          quantity: item.quantity || 1
        });
      }

      const tax = subtotal * 0.18; // 18% GST
      const totalAmount = subtotal + tax;

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const invoice = new Invoice({
        invoiceNumber,
        student,
        institution: req.tenantId,
        items: processedItems,
        subtotal,
        tax,
        totalAmount,
        dueDate,
        academicYear,
        notes,
        createdBy: req.user.id
      });

      await invoice.save();

      logger.info(`Invoice created: ${invoiceNumber}`, {
        institution: req.tenantId,
        user: req.user.id,
        amount: totalAmount
      });

      return createdResponse(res, { invoice }, 'Invoice created successfully');
    } catch (error) {
      logger.error('Create invoice error:', error);
      return errorResponse(res, 'Failed to create invoice', 500);
    }
  },

  // Get all invoices
  getAll: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        student,
        status,
        academicYear,
        overdue
      } = req.query;

      const query = { institution: req.tenantId };

      if (student) query.student = student;
      if (status) query.status = status;
      if (academicYear) query.academicYear = academicYear;

      if (overdue === 'true') {
        query.dueDate = { $lt: new Date() };
        query.status = { $in: ['sent', 'draft'] };
      }

      const skip = (page - 1) * limit;

      const [invoices, total] = await Promise.all([
        Invoice.find(query)
          .populate('student', 'user.name studentId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Invoice.countDocuments(query)
      ]);

      return successResponse(res, {
        invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, 'Invoices retrieved successfully');
    } catch (error) {
      logger.error('Get invoices error:', error);
      return errorResponse(res, 'Failed to retrieve invoices', 500);
    }
  },

  // Get invoice by ID
  getById: async (req, res) => {
    try {
      const invoice = await Invoice.findOne({
        _id: req.params.id,
        institution: req.tenantId
      }).populate('student', 'user.name user.email studentId');

      if (!invoice) {
        return notFoundResponse(res, 'Invoice not found');
      }

      return successResponse(res, { invoice }, 'Invoice retrieved successfully');
    } catch (error) {
      logger.error('Get invoice by ID error:', error);
      return errorResponse(res, 'Failed to retrieve invoice', 500);
    }
  },

  // Update invoice
  update: async (req, res) => {
    try {
      const invoice = await Invoice.findOneAndUpdate(
        { _id: req.params.id, institution: req.tenantId },
        req.body,
        { new: true, runValidators: true }
      );

      if (!invoice) {
        return notFoundResponse(res, 'Invoice not found');
      }

      logger.info(`Invoice updated: ${invoice.invoiceNumber}`, {
        institution: req.tenantId,
        user: req.user.id
      });

      return successResponse(res, { invoice }, 'Invoice updated successfully');
    } catch (error) {
      logger.error('Update invoice error:', error);
      return errorResponse(res, 'Failed to update invoice', 500);
    }
  },

  // Mark invoice as paid
  markAsPaid: async (req, res) => {
    try {
      const { paymentMethod, reference, notes } = req.body;

      const invoice = await Invoice.findOne({
        _id: req.params.id,
        institution: req.tenantId
      });

      if (!invoice) {
        return notFoundResponse(res, 'Invoice not found');
      }

      if (invoice.status === 'paid') {
        return badRequestResponse(res, 'Invoice is already paid');
      }

      // Update invoice
      invoice.status = 'paid';
      invoice.paidDate = new Date();
      invoice.paymentMethod = paymentMethod;

      await invoice.save();

      // Create transaction record
      const transaction = new FinanceTransaction({
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        invoice: invoice._id,
        student: invoice.student,
        institution: req.tenantId,
        type: 'payment',
        amount: invoice.totalAmount,
        paymentMethod,
        reference,
        description: `Payment for invoice ${invoice.invoiceNumber}`,
        status: 'completed',
        processedBy: req.user.id,
        metadata: { notes }
      });

      await transaction.save();

      logger.info(`Invoice marked as paid: ${invoice.invoiceNumber}`, {
        institution: req.tenantId,
        user: req.user.id,
        amount: invoice.totalAmount
      });

      return successResponse(res, { invoice, transaction }, 'Invoice marked as paid successfully');
    } catch (error) {
      logger.error('Mark invoice as paid error:', error);
      return errorResponse(res, 'Failed to mark invoice as paid', 500);
    }
  }
};

// FinanceTransaction Controller
const transactionController = {
  // Get all transactions
  getAll: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        status,
        startDate,
        endDate
      } = req.query;

      const query = { institution: req.tenantId };

      if (type) query.type = type;
      if (status) query.status = status;

      if (startDate || endDate) {
        query.processedAt = {};
        if (startDate) query.processedAt.$gte = new Date(startDate);
        if (endDate) query.processedAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        FinanceTransaction.find(query)
          .populate('student', 'user.name studentId')
          .populate('invoice', 'invoiceNumber')
          .sort({ processedAt: -1 })
          .skip(skip)
          .limit(limit),
        FinanceTransaction.countDocuments(query)
      ]);

      return successResponse(res, {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, 'FinanceTransactions retrieved successfully');
    } catch (error) {
      logger.error('Get transactions error:', error);
      return errorResponse(res, 'Failed to retrieve transactions', 500);
    }
  },

  // Create transaction
  create: async (req, res) => {
    try {
      const { description, category, date, amount, invoiceNo, paymentMethod, type, name, source } = req.body;
      const transaction = new FinanceTransaction({
        institution: req.tenantId,
        description: description || name || '',
        category: category || source || '',
        processedAt: date || new Date(),
        amount: parseFloat(amount) || 0,
        reference: invoiceNo || '',
        paymentMethod: paymentMethod || '',
        type: type || 'income',
        status: 'completed',
        processedBy: req.user.id,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      });
      await transaction.save();
      logger.info(`Transaction created: ${transaction.transactionId}`, { institution: req.tenantId, user: req.user.id });
      return createdResponse(res, { transaction }, 'Transaction created successfully');
    } catch (error) {
      logger.error('Create transaction error:', error);
      return errorResponse(res, error.message || 'Failed to create transaction', 500);
    }
  },

  // Update transaction
  update: async (req, res) => {
    try {
      const { description, category, date, amount, invoiceNo, paymentMethod, name, source } = req.body;
      const updateData = {};
      if (description || name) updateData.description = description || name;
      if (category || source) updateData.category = category || source;
      if (date) updateData.processedAt = date;
      if (amount) updateData.amount = parseFloat(amount);
      if (invoiceNo) updateData.reference = invoiceNo;
      if (paymentMethod) updateData.paymentMethod = paymentMethod;

      const transaction = await FinanceTransaction.findOneAndUpdate(
        { _id: req.params.id, institution: req.tenantId },
        updateData,
        { new: true, runValidators: true }
      );
      if (!transaction) return notFoundResponse(res, 'Transaction not found');
      return updatedResponse(res, { transaction }, 'Transaction updated successfully');
    } catch (error) {
      logger.error('Update transaction error:', error);
      return errorResponse(res, error.message || 'Failed to update transaction', 500);
    }
  },

  // Delete transaction
  delete: async (req, res) => {
    try {
      const transaction = await FinanceTransaction.findOneAndDelete({
        _id: req.params.id,
        institution: req.tenantId
      });
      if (!transaction) return notFoundResponse(res, 'Transaction not found');
      return deletedResponse(res, 'Transaction deleted successfully');
    } catch (error) {
      logger.error('Delete transaction error:', error);
      return errorResponse(res, error.message || 'Failed to delete transaction', 500);
    }
  }
};

// Budget Controller
const budgetController = {
  // Create budget
  create: async (req, res) => {
    try {
      const instId = req.tenantId || req.body.institutionId || req.user?.institutionId;
      const budget = new Budget({
        ...req.body,
        institution: instId,
        createdBy: req.user.id
      });

      await budget.save();

      logger.info(`Budget created: ${budget.title}`, {
        institution: instId,
        user: req.user.id
      });

      return createdResponse(res, { budget }, 'Budget created successfully');
    } catch (error) {
      logger.error('Create budget error:', error);
      if (error.name === 'ValidationError') {
        return errorResponse(res, error.message, 400);
      }
      return errorResponse(res, 'Failed to create budget', 500);
    }
  },

  // Get all budgets
  getAll: async (req, res) => {
    try {
      const { academicYear, category, status } = req.query;

      const query = { institution: req.tenantId };

      if (academicYear) query.academicYear = academicYear;
      if (category) query.category = category;
      if (status) query.status = status;

      const budgets = await Budget.find(query).sort({ createdAt: -1 });

      return successResponse(res, { budgets }, 'Budgets retrieved successfully');
    } catch (error) {
      logger.error('Get budgets error:', error);
      return errorResponse(res, 'Failed to retrieve budgets', 500);
    }
  },

  // Update budget
  update: async (req, res) => {
    try {
      const budget = await Budget.findOneAndUpdate(
        { _id: req.params.id, institution: req.tenantId },
        req.body,
        { new: true, runValidators: true }
      );

      if (!budget) {
        return notFoundResponse(res, 'Budget not found');
      }

      return successResponse(res, { budget }, 'Budget updated successfully');
    } catch (error) {
      logger.error('Update budget error:', error);
      return errorResponse(res, 'Failed to update budget', 500);
    }
  },

  // Delete budget
  delete: async (req, res) => {
    try {
      const budget = await Budget.findOneAndDelete({
        _id: req.params.id,
        institution: req.tenantId
      });

      if (!budget) {
        return notFoundResponse(res, 'Budget not found');
      }

      return successResponse(res, 'Budget deleted successfully');
    } catch (error) {
      logger.error('Delete budget error:', error);
      return errorResponse(res, 'Failed to delete budget', 500);
    }
  }
};

// Salary Controller
const salaryController = {
  // Process salary
  processSalary: async (req, res) => {
    try {
      const { employee, month, year, basicSalary, allowances, deductions, paymentMethod } = req.body;

      const basic = basicSalary || 0;

      let totalAllowances = 0;
      let totalDeductions = 0;

      if (Array.isArray(allowances)) {
        totalAllowances = allowances.reduce((sum, a) => sum + (a.amount || 0), 0);
      }

      if (Array.isArray(deductions)) {
        totalDeductions = deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
      }

      const grossSalary = basic + totalAllowances;
      const netSalary = grossSalary - totalDeductions;

      // Map allowances/deductions to schema-compatible shapes
      const mappedAllowances = (allowances || []).map(a => ({
        type: a.title?.toLowerCase().replace(/\s+/g, '-') || 'other',
        amount: a.amount || 0,
        description: a.title || ''
      }));
      const mappedDeductions = (deductions || []).map(d => ({
        type: d.title?.toLowerCase().replace(/\s+/g, '-') || 'other',
        amount: d.amount || 0,
        description: d.title || ''
      }));

      const salary = new Salary({
        employee,
        institution: req.tenantId,
        basicSalary: basic,
        allowances: mappedAllowances,
        deductions: mappedDeductions,
        grossSalary,
        netSalary,
        paymentDate: new Date(),
        month: typeof month === 'string' ? month : `${year}-${String(month).padStart(2, '0')}`,
        year: parseInt(year),
        paymentMethod: paymentMethod || 'bank-transfer',
        status: 'pending',
        processedBy: req.user.id
      });

      await salary.save();

      // Re-fetch with populated employee
      const populated = await Salary.findById(salary._id).populate('employee', 'name email');

      logger.info(`Salary processed for employee: ${employee}`, {
        institution: req.tenantId,
        user: req.user.id,
        amount: netSalary
      });

      return createdResponse(res, { salary: populated }, 'Salary processed successfully');
    } catch (error) {
      logger.error('Process salary error:', error);
      return errorResponse(res, 'Failed to process salary', 500);
    }
  },

  // Get salary records
  getAll: async (req, res) => {
    try {
      const { employee, month, year } = req.query;

      const query = { institution: req.tenantId };

      if (employee) query.employee = employee;
      if (month) query.month = month;
      if (year) query.year = parseInt(year);

      const salaries = await Salary.find(query)
        .populate('employee', 'name email')
        .sort({ paymentDate: -1 });

      return successResponse(res, { salaries }, 'Salaries retrieved successfully');
    } catch (error) {
      logger.error('Get salaries error:', error);
      return errorResponse(res, 'Failed to retrieve salaries', 500);
    }
  },

  // Get salary by ID
  getById: async (req, res) => {
    try {
      const salary = await Salary.findOne({
        _id: req.params.id,
        institution: req.tenantId
      }).populate('employee', 'name email');

      if (!salary) {
        return notFoundResponse(res, 'Salary record not found');
      }

      return successResponse(res, { salary }, 'Salary retrieved successfully');
    } catch (error) {
      logger.error('Get salary by ID error:', error);
      return errorResponse(res, 'Failed to retrieve salary', 500);
    }
  },

  // Update salary
  update: async (req, res) => {
    try {
      const salary = await Salary.findOneAndUpdate(
        { _id: req.params.id, institution: req.tenantId },
        req.body,
        { new: true, runValidators: true }
      ).populate('employee', 'name email');

      if (!salary) {
        return notFoundResponse(res, 'Salary record not found');
      }

      return successResponse(res, { salary }, 'Salary updated successfully');
    } catch (error) {
      logger.error('Update salary error:', error);
      return errorResponse(res, 'Failed to update salary', 500);
    }
  },

  // Delete salary
  delete: async (req, res) => {
    try {
      const salary = await Salary.findOneAndDelete({
        _id: req.params.id,
        institution: req.tenantId
      });

      if (!salary) {
        return notFoundResponse(res, 'Salary record not found');
      }

      return successResponse(res, 'Salary deleted successfully');
    } catch (error) {
      logger.error('Delete salary error:', error);
      return errorResponse(res, 'Failed to delete salary', 500);
    }
  }
};

// Payment Controller - Stripe Integration
const paymentController = {
  // Create payment intent for invoice
  createPaymentIntent: async (req, res) => {
    try {
      const { invoiceId } = req.params;

      const result = await stripeService.createPaymentIntent(invoiceId, req.user);

      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }

      return successResponse(res, result, 'Payment intent created successfully');
    } catch (error) {
      logger.error('Create payment intent error:', error);
      return errorResponse(res, 'Failed to create payment intent', 500);
    }
  },

  // Create checkout session for invoice
  createCheckoutSession: async (req, res) => {
    try {
      const { invoiceId } = req.params;

      const result = await stripeService.createCheckoutSession(invoiceId, req.user);

      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }

      return successResponse(res, result, 'Checkout session created successfully');
    } catch (error) {
      logger.error('Create checkout session error:', error);
      return errorResponse(res, 'Failed to create checkout session', 500);
    }
  },

  // Handle Stripe webhooks
  handleWebhook: async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      const rawBody = req.body;

      await stripeService.handleWebhook(rawBody, sig);

      return successResponse(res, 'Webhook processed successfully');
    } catch (error) {
      logger.error('Webhook processing error:', error);
      return errorResponse(res, `Webhook error: ${error.message}`, 400);
    }
  },

  // Process refund
  processRefund: async (req, res) => {
    try {
      const { transactionId, amount, reason } = req.body;

      const result = await stripeService.refundPayment(transactionId, amount, reason);

      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }

      return successResponse(res, result, 'Refund processed successfully');
    } catch (error) {
      logger.error('Process refund error:', error);
      return errorResponse(res, 'Failed to process refund', 500);
    }
  },

  // Get payment history for user
  getPaymentHistory: async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const query = { institution: req.tenantId };

      // Filter by user role
      if (req.user.role === 'student') {
        // Find the student record associated with this user
        const Student = (await import('../models/Student.js')).default;
        const student = await Student.findOne({ userId: req.user.id || req.user._id });
        if (student) {
          query.student = student._id;
        } else {
          query.student = req.user.id;
        }
      } else if (req.user.role === 'parent') {
        // For parents, get transactions for their children
        const children = await require('../models/User').find({
          'profile.parents': req.user.id
        }).select('_id');
        query.student = { $in: children.map(child => child._id) };
      }

      if (status) query.status = status;

      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        FinanceTransaction.find(query)
          .populate('student', 'name email studentId')
          .populate('invoice', 'invoiceNumber totalAmount')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        FinanceTransaction.countDocuments(query)
      ]);

      return successResponse(res, {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, 'Payment history retrieved successfully');
    } catch (error) {
      logger.error('Get payment history error:', error);
      return errorResponse(res, 'Failed to retrieve payment history', 500);
    }
  },

  // Get payment methods (future feature)
  getPaymentMethods: async (req, res) => {
    try {
      // This would require storing customer IDs in user profiles
      // For now, return empty array
      return successResponse(res, { paymentMethods: [] }, 'Payment methods retrieved successfully');
    } catch (error) {
      logger.error('Get payment methods error:', error);
      return errorResponse(res, 'Failed to retrieve payment methods', 500);
    }
  }
};

const expenseCategoryController = {
  getExpenseCategories: async (req, res) => {
    try {
      const categories = await ExpenseCategory.find({ institution: req.tenantId })
        .select('name description status')
        .sort({ createdAt: -1 });

      return successResponse(res, { categories }, 'Expense categories retrieved successfully');
    } catch (error) {
      logger.error('Get expense categories error:', error);
      return errorResponse(res, 'Failed to retrieve expense categories', 500);
    }
  }
};

const taxRateController = {
  getTaxRates: async (req, res) => {
    try {
      const rates = await TaxRate.find({ institution: req.tenantId })
        .select('name rate description status type')
        .sort({ createdAt: -1 });

      return successResponse(res, { rates }, 'Tax rates retrieved successfully');
    } catch (error) {
      logger.error('Get tax rates error:', error);
      return errorResponse(res, 'Failed to retrieve tax rates', 500);
    }
  }
};

// Dashboard Controller
const dashboardController = {
  getDashboardData: async (req, res) => {
    try {
      const institutionId = req.tenantId;
      const invoiceInstMatch = matchInstitutionField(institutionId, 'institution');
      const payrollInstMatch = matchInstitutionField(institutionId, 'institution');


      const paidInvoiceMatch = { ...invoiceInstMatch, status: 'paid' };
      const unpaidInvoiceMatch = { ...invoiceInstMatch, status: { $in: ['sent', 'overdue'] } };

      // 1. Top Stats & KPIs
      const [
        totalRevenueResult,
        totalExpensesResult,
        outstandingFeesResult,
        paidInvoicesCount,
        unpaidInvoicesCount,
        currentMonthRevenueResult,
        lastMonthRevenueResult
      ] = await Promise.all([
        Invoice.aggregate([
          { $match: paidInvoiceMatch },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Promise.all([
          Salary.aggregate([
            { $match: { ...invoiceInstMatch, status: { $in: ['paid', 'processed', 'pending'] } } },
            { $group: { _id: null, total: { $sum: '$netSalary' } } }
          ]),
          Budget.aggregate([
            { $match: invoiceInstMatch },
            { $group: { _id: null, total: { $sum: '$spentAmount' } } }
          ])
        ]).then(([salaries, budgets]) => (salaries[0]?.total || 0) + (budgets[0]?.total || 0)),
        Invoice.aggregate([
          { $match: unpaidInvoiceMatch },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Invoice.countDocuments(paidInvoiceMatch),
        Invoice.countDocuments(unpaidInvoiceMatch),
        Invoice.aggregate([
          {
            $match: {
              ...paidInvoiceMatch,
              paidDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }
          },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Invoice.aggregate([
          {
            $match: {
              ...paidInvoiceMatch,
              paidDate: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ])
      ]);

      const instFilter = getInstitutionFilter(institutionId) || { institution: institutionId };

      const [feePaymentsTotalResult, pendingFeePaymentsResult] = await Promise.all([
        Payment.aggregate([
          { $match: { ...instFilter, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Payment.aggregate([
          { $match: { ...instFilter, status: { $in: ['pending', 'processing'] } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      const feePaymentsRevenue = feePaymentsTotalResult[0]?.total || 0;
      const pendingFeePayments = pendingFeePaymentsResult[0]?.total || 0;

      const invoiceRevenue = totalRevenueResult[0]?.total || 0;
      const totalRevenue = invoiceRevenue + feePaymentsRevenue;
      const totalExpenses = totalExpensesResult || 0;
      const outstandingFees = (outstandingFeesResult[0]?.total || 0) + pendingFeePayments;
      const currentMonthRevenue = currentMonthRevenueResult[0]?.total || 0;
      const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;

      const revenueGrowth = lastMonthRevenue > 0 
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // 2. Revenue Trend (last 8 months)
      const eightMonthsAgo = new Date();
      eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 7);
      eightMonthsAgo.setDate(1);

      const revenueTrend = await Invoice.aggregate([
        {
          $match: {
            ...paidInvoiceMatch,
            paidDate: { $gte: eightMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              month: { $month: '$paidDate' },
              year: { $year: '$paidDate' }
            },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      // Format revenue trend
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedRevenueTrend = revenueTrend.map(item => ({
        m: monthNames[item._id.month - 1],
        revenue: item.revenue,
        expenses: 0, // Placeholder
        profit: item.revenue // Placeholder
      }));

      // 3. Expense Distribution
      const [salaryExp, budgetExp] = await Promise.all([
        Salary.aggregate([
          { $match: { ...invoiceInstMatch, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$netSalary' } } }
        ]),
        Budget.aggregate([
          { $match: invoiceInstMatch },
          { $group: { _id: '$category', total: { $sum: '$spentAmount' } } }
        ])
      ]);

      const expensePie = [
        { name: 'Staff Salary', value: salaryExp[0]?.total || 0 },
        ...budgetExp.map(b => ({
          name: b._id.charAt(0).toUpperCase() + b._id.slice(1),
          value: b.total
        }))
      ];

      // 4. Recent Invoices
      const recentInvoices = await Invoice.find(invoiceInstMatch)
        .populate('student', 'firstName lastName name')
        .sort({ createdAt: -1 })
        .limit(10);

      const formattedInvoices = recentInvoices.map(inv => ({
        id: inv.invoiceNumber,
        invoiceNumber: inv.invoiceNumber,
        student: inv.student?.name || [inv.student?.firstName, inv.student?.lastName].filter(Boolean).join(' ') || 'Unknown',
        amount: inv.totalAmount,
        status: inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
        date: inv.createdAt,
        dueDate: inv.dueDate,
        cls: inv.status === 'paid' ? 'badge-soft-success' : (inv.status === 'overdue' ? 'badge-soft-danger' : 'badge-soft-warning')
      }));

      const [recentTransactionsRaw, recentFeePayments, recentSalaries, recentBudgets, recentPayrolls] = await Promise.all([
        FinanceTransaction.find(invoiceInstMatch)
          .sort({ processedAt: -1 })
          .limit(10)
          .lean(),
        Payment.find({ ...instFilter, status: 'completed' })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        Salary.find(invoiceInstMatch)
          .populate('employee', 'name email')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Budget.find(invoiceInstMatch)
          .sort({ updatedAt: -1 })
          .limit(5)
          .lean(),
        Payroll.find(payrollInstMatch)
          .populate('employee', 'name email')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
      ]);

      const financeTransactions = recentTransactionsRaw.map(tx => ({
        transactionId: tx.transactionId,
        type: tx.type === 'payment' ? 'income' : tx.type,
        amount: tx.amount,
        status: tx.status,
        paymentMethod: tx.paymentMethod,
        date: tx.processedAt || tx.createdAt,
        description: tx.description || tx.reference || 'Finance transaction',
        source: 'finance'
      }));

      const paymentTransactions = recentFeePayments.map(p => ({
        transactionId: p.paymentId || p._id?.toString(),
        type: 'income',
        amount: p.amount,
        status: p.status || 'completed',
        paymentMethod: p.paymentMethod || 'online',
        date: p.createdAt,
        description: `Fee payment${p.paymentId ? ` (${p.paymentId})` : ''}`,
        source: 'fees'
      }));

      const recentTransactions = [...financeTransactions, ...paymentTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 15);

      const salariesSummary = {
        total: await Salary.countDocuments(invoiceInstMatch),
        totalPaid: recentSalaries.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.netSalary || 0), 0),
        recent: recentSalaries.map(s => ({
          id: s._id,
          employee: s.employee?.name || 'Staff',
          month: s.month,
          year: s.year,
          netSalary: s.netSalary,
          status: s.status
        }))
      };

      const budgetsSummary = {
        total: await Budget.countDocuments(invoiceInstMatch),
        totalPlanned: recentBudgets.reduce((sum, b) => sum + (b.plannedAmount || 0), 0),
        totalSpent: recentBudgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0),
        recent: recentBudgets.map(b => ({
          id: b._id,
          title: b.title,
          category: b.category,
          plannedAmount: b.plannedAmount,
          spentAmount: b.spentAmount,
          status: b.status
        }))
      };

      const payrollSummary = {
        total: await Payroll.countDocuments(payrollInstMatch),
        totalNet: recentPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0),
        recent: recentPayrolls.map(p => ({
          id: p._id,
          payrollId: p.payrollId,
          employee: p.employee?.name || 'Staff',
          month: p.month,
          year: p.year,
          netSalary: p.netSalary,
          status: p.status
        }))
      };

      // 5. Budget vs Actual
      const budgets = await Budget.find(invoiceInstMatch).limit(5);
      const budgetVsActual = budgets.map(b => ({
        dept: b.title,
        budget: b.plannedAmount,
        actual: b.spentAmount,
        variance: b.plannedAmount - b.spentAmount
      }));

      const totalBudgetPlanned = budgets.reduce((sum, budget) => sum + (budget.plannedAmount || 0), 0);
      const totalBudgetSpent = budgets.reduce((sum, budget) => sum + (budget.spentAmount || 0), 0);
      const budgetUtilization = totalBudgetPlanned > 0 ? Math.round((totalBudgetSpent / totalBudgetPlanned) * 100) : 0;

      // 6. Fee Collection by Term (Quarterly)
      const feeByTerm = await Invoice.aggregate([
        {
          $match: {
            ...invoiceInstMatch,
            status: { $in: ['paid', 'sent', 'overdue'] }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } }
            },
            collected: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0] } },
            outstanding: { $sum: { $cond: [{ $in: ['$status', ['sent', 'overdue']] }, '$totalAmount', 0] } }
          }
        },
        { $sort: { '_id.year': 1, '_id.quarter': 1 } },
        { $limit: 8 }
      ]);

      const formattedFeeByTerm = feeByTerm.map(item => ({
        q: `Q${item._id.quarter}'${item._id.year.toString().slice(-2)}`,
        collected: item.collected,
        outstanding: item.outstanding
      }));

      // Ensure revenue data has profit field
      const enhancedRevenueData = formattedRevenueTrend.map(item => ({
        ...item,
        profit: item.revenue - (item.expenses || 0)
      }));

      const overview = {
        totalIncome: totalRevenue,
        totalExpense: totalExpenses,
        pendingFees: outstandingFees,
        collectedFees: totalRevenue,
        totalFees: paidInvoicesCount + unpaidInvoicesCount,
        currentMonthRevenue,
        budgetUtilization,
        feePaymentsRevenue,
        invoiceRevenue
      };

      const infraStats = [];
      const maintenanceRequests = [];
      const busData = [];
      const safetyReports = [];
      const inventoryItems = [];

      return successResponse(res, {
        overview,
        totalRevenue: overview.totalIncome,
        totalExpenses: overview.totalExpense,
        netIncome: overview.totalIncome - overview.totalExpense,
        pendingPayments: overview.pendingFees,
        recentTransactions,
        monthlyRevenue: enhancedRevenueData.map((item) => ({ month: item.m, revenue: item.revenue, expenses: item.expenses })),
        topStats: [
          { label: 'Total Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}K`, delta: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`, deltaTone: revenueGrowth >= 0 ? 'bg-success' : 'bg-danger', icon: '/assets/img/icons/technology-07.svg', active: 'This Year', inactive: 'Last Year', avatarTone: 'bg-success-transparent' },
          { label: 'Expenses', value: `₹${(totalExpenses / 1000).toFixed(1)}K`, delta: '', deltaTone: 'bg-danger', icon: '/assets/img/icons/technology-08.svg', active: 'This Year', inactive: 'Last Year', avatarTone: 'bg-danger-transparent' },
          { label: 'Outstanding Fees', value: `₹${(outstandingFees / 1000).toFixed(1)}K`, delta: '', deltaTone: 'bg-warning', icon: '/assets/img/icons/technology-09.svg', active: 'Current', inactive: 'Overdue', avatarTone: 'bg-warning-transparent' },
          { label: 'Invoices', value: (paidInvoicesCount + unpaidInvoicesCount).toString(), delta: 'This Year', deltaTone: 'bg-primary', icon: '/assets/img/icons/technology-10.svg', active: paidInvoicesCount.toString() + ' Paid', inactive: unpaidInvoicesCount.toString() + ' Unpaid', avatarTone: 'bg-primary-transparent' }
        ],
        financeKPIs: [
          { label: 'Net Profit / Surplus', value: `₹${((totalRevenue - totalExpenses) / 1000).toFixed(1)}K`, delta: '', deltaTone: 'bg-success', icon: '/assets/img/icons/technology-07.svg', active: 'This Year', inactive: 'Last Year', avatarTone: 'bg-success-transparent' },
          { label: 'Profit Margin', value: `${totalRevenue > 0 ? (((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1) : 0}%`, delta: '', deltaTone: 'bg-primary', icon: '/assets/img/icons/technology-08.svg', active: 'This Year', inactive: 'Last Year', avatarTone: 'bg-primary-transparent' },
          { label: 'Fee Collection (Month)', value: `₹${(currentMonthRevenue / 1000).toFixed(1)}K`, delta: '', deltaTone: 'bg-info', icon: '/assets/img/icons/technology-09.svg', active: 'Collected', inactive: 'Pending', avatarTone: 'bg-info-transparent' },
          { label: 'Pending Fees', value: `₹${(outstandingFees / 1000).toFixed(1)}K`, delta: unpaidInvoicesCount.toString() + ' Students', deltaTone: 'bg-warning', icon: '/assets/img/icons/technology-10.svg', active: '>60 Days', inactive: '<30 Days', avatarTone: 'bg-warning-transparent' }
        ],
        revenueData: enhancedRevenueData,
        expensePie,
        budgetVsActual,
        plData: enhancedRevenueData, // Use revenue data as P&L data
        feeByTerm: formattedFeeByTerm,
        invoices: formattedInvoices,
        salariesSummary,
        budgetsSummary,
        payrollSummary,
        counts: {
          invoices: {
            total: paidInvoicesCount + unpaidInvoicesCount,
            paid: paidInvoicesCount,
            pending: unpaidInvoicesCount
          },
          transactions: recentTransactions.length,
          salaries: salariesSummary?.total || 0,
          payroll: payrollSummary?.total || 0,
          budgets: budgetsSummary?.total || 0
        },
        infraStats,
        maintenanceRequests,
        busData,
        safetyReports,
        inventoryItems
      }, 'Finance dashboard data retrieved successfully');
    } catch (error) {
      logger.error('Get finance dashboard data error:', error);
      return errorResponse(res, 'Failed to retrieve finance dashboard data', 500);
    }
  }
};

// Fee Group Controller
const feeGroupController = {
  create: async (req, res) => {
    try {
      const instId = req.tenantId || req.body.institutionId || req.user?.institutionId;
      const group = new FeeGroup({
        ...req.body,
        institutionId: instId
      });
      await group.save();
      return createdResponse(res, group, 'Fee group created successfully');
    } catch (error) {
      logger.error('Create fee group error:', error);
      if (error.name === 'ValidationError') {
        return errorResponse(res, error.message, 400);
      }
      return errorResponse(res, error.message, 500);
    }
  },

  getAll: async (req, res) => {
    try {
      const instId = req.tenantId || req.query.institutionId || req.user?.institutionId;
      const query = instId ? { institutionId: instId } : {};
      const groups = await FeeGroup.find(query).sort({ createdAt: -1 });
      return successResponse(res, groups, 'Fee groups retrieved successfully');
    } catch (error) {
      logger.error('Get fee groups error:', error);
      return errorResponse(res, error.message, 500);
    }
  },

  update: async (req, res) => {
    try {
      const instId = req.tenantId || req.body.institutionId || req.user?.institutionId;
      const group = await FeeGroup.findOneAndUpdate(
        { _id: req.params.id, ...(instId ? { institutionId: instId } : {}) },
        req.body,
        { new: true, runValidators: true }
      );
      if (!group) return notFoundResponse(res, 'Fee group not found');
      return updatedResponse(res, group, 'Fee group updated successfully');
    } catch (error) {
      logger.error('Update fee group error:', error);
      return errorResponse(res, error.message, 500);
    }
  },

  delete: async (req, res) => {
    try {
      const instId = req.tenantId || req.query.institutionId || req.user?.institutionId;
      const group = await FeeGroup.findOneAndDelete({ _id: req.params.id, ...(instId ? { institutionId: instId } : {}) });
      if (!group) return notFoundResponse(res, 'Fee group not found');
      return deletedResponse(res, 'Fee group deleted successfully');
    } catch (error) {
      logger.error('Delete fee group error:', error);
      return errorResponse(res, error.message, 500);
    }
  }
};

const feeTypeController = {
  create: async (req, res) => {
    try {
      const instId = req.tenantId || req.body.institutionId || req.user?.institutionId;
      const doc = new FeeType({ ...req.body, institutionId: instId });
      await doc.save();
      return createdResponse(res, doc, 'Fee type created successfully');
    } catch (error) {
      logger.error('Create fee type error:', error);
      if (error.name === 'ValidationError') {
        return errorResponse(res, error.message, 400);
      }
      return errorResponse(res, error.message, 500);
    }
  },
  getAll: async (req, res) => {
    try {
      const instId = req.tenantId || req.query.institutionId || req.user?.institutionId;
      const query = instId ? { institutionId: instId } : {};
      const docs = await FeeType.find(query).sort({ createdAt: -1 });
      return successResponse(res, docs, 'Fee types retrieved successfully');
    } catch (error) {
      logger.error('Get fee types error:', error);
      return errorResponse(res, error.message, 500);
    }
  },
  update: async (req, res) => {
    try {
      const instId = req.tenantId || req.body.institutionId || req.user?.institutionId;
      const doc = await FeeType.findOneAndUpdate(
        { _id: req.params.id, ...(instId ? { institutionId: instId } : {}) },
        req.body,
        { new: true, runValidators: true }
      );
      if (!doc) return notFoundResponse(res, 'Fee type not found');
      return updatedResponse(res, doc, 'Fee type updated successfully');
    } catch (error) {
      logger.error('Update fee type error:', error);
      return errorResponse(res, error.message, 500);
    }
  },
  delete: async (req, res) => {
    try {
      const instId = req.tenantId || req.query.institutionId || req.user?.institutionId;
      const doc = await FeeType.findOneAndDelete({ _id: req.params.id, ...(instId ? { institutionId: instId } : {}) });
      if (!doc) return notFoundResponse(res, 'Fee type not found');
      return deletedResponse(res, 'Fee type deleted successfully');
    } catch (error) {
      logger.error('Delete fee type error:', error);
      return errorResponse(res, error.message, 500);
    }
  }
};

const feeMasterController = {
  create: async (req, res) => {
    try {
      const doc = new FeeMaster({ ...req.body, institutionId: req.tenantId });
      await doc.save();
      return createdResponse(res, doc, 'Fee master created successfully');
    } catch (error) {
      logger.error('Create fee master error:', error);
      return errorResponse(res, error.message, 500);
    }
  },
  getAll: async (req, res) => {
    try {
      const docs = await FeeMaster.find({ institutionId: req.tenantId }).sort({ createdAt: -1 });
      return successResponse(res, docs, 'Fee masters retrieved successfully');
    } catch (error) {
      logger.error('Get fee masters error:', error);
      return errorResponse(res, error.message, 500);
    }
  },
  update: async (req, res) => {
    try {
      const doc = await FeeMaster.findOneAndUpdate(
        { _id: req.params.id, institutionId: req.tenantId },
        req.body,
        { new: true, runValidators: true }
      );
      if (!doc) return notFoundResponse(res, 'Fee master not found');
      return updatedResponse(res, doc, 'Fee master updated successfully');
    } catch (error) {
      logger.error('Update fee master error:', error);
      return errorResponse(res, error.message, 500);
    }
  },
  delete: async (req, res) => {
    try {
      const doc = await FeeMaster.findOneAndDelete({ _id: req.params.id, institutionId: req.tenantId });
      if (!doc) return notFoundResponse(res, 'Fee master not found');
      return deletedResponse(res, 'Fee master deleted successfully');
    } catch (error) {
      logger.error('Delete fee master error:', error);
      return errorResponse(res, error.message, 500);
    }
  }
};

const feeAssignmentController = {
  create: async (req, res) => {
    try {
      const doc = new FeeAssignment({ ...req.body, institutionId: req.tenantId });
      await doc.save();
      return createdResponse(res, doc, 'Fee assignment created successfully');
    } catch (error) {
      logger.error('Create fee assignment error:', error);
      return errorResponse(res, error.message, 500);
    }
  },
  getAll: async (req, res) => {
    try {
      const docs = await FeeAssignment.find({ institutionId: req.tenantId }).sort({ createdAt: -1 });
      return successResponse(res, docs, 'Fee assignments retrieved successfully');
    } catch (error) {
      logger.error('Get fee assignments error:', error);
      return errorResponse(res, error.message, 500);
    }
  },
  update: async (req, res) => {
    try {
      const doc = await FeeAssignment.findOneAndUpdate(
        { _id: req.params.id, institutionId: req.tenantId },
        req.body,
        { new: true, runValidators: true }
      );
      if (!doc) return notFoundResponse(res, 'Fee assignment not found');
      return updatedResponse(res, doc, 'Fee assignment updated successfully');
    } catch (error) {
      logger.error('Update fee assignment error:', error);
      return errorResponse(res, error.message, 500);
    }
  },
  delete: async (req, res) => {
    try {
      const doc = await FeeAssignment.findOneAndDelete({ _id: req.params.id, institutionId: req.tenantId });
      if (!doc) return notFoundResponse(res, 'Fee assignment not found');
      return deletedResponse(res, 'Fee assignment deleted successfully');
    } catch (error) {
      logger.error('Delete fee assignment error:', error);
      return errorResponse(res, error.message, 500);
    }
  }
};

export default {
  dashboardController,
  feeStructureController,
  invoiceController,
  transactionController,
  budgetController,
  salaryController,
  paymentController,
  expenseCategoryController,
  taxRateController,
  feeGroupController,
  feeTypeController,
  feeMasterController,
  feeAssignmentController
};
