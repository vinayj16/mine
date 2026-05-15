import { FeeStructure, Invoice, FinanceTransaction, Budget, Salary } from '../models/finance.js';
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

      return createdResponse(res, 'Fee structure created successfully', {
        feeStructure
      });
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

      const query = { institution: req.tenantId };

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

      return successResponse(res, 'Fee structures retrieved successfully', {
        feeStructures,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
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

      return successResponse(res, 'Fee structure retrieved successfully', {
        feeStructure
      });
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

      return successResponse(res, 'Fee structure updated successfully', {
        feeStructure
      });
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

      return createdResponse(res, 'Invoice created successfully', {
        invoice
      });
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

      return successResponse(res, 'Invoices retrieved successfully', {
        invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
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

      return successResponse(res, 'Invoice retrieved successfully', {
        invoice
      });
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

      return successResponse(res, 'Invoice updated successfully', {
        invoice
      });
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

      return successResponse(res, 'Invoice marked as paid successfully', {
        invoice,
        transaction
      });
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

      return successResponse(res, 'FinanceTransactions retrieved successfully', {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Get transactions error:', error);
      return errorResponse(res, 'Failed to retrieve transactions', 500);
    }
  }
};

// Budget Controller
const budgetController = {
  // Create budget
  create: async (req, res) => {
    try {
      const budget = new Budget({
        ...req.body,
        institution: req.tenantId,
        createdBy: req.user.id
      });

      await budget.save();

      logger.info(`Budget created: ${budget.title}`, {
        institution: req.tenantId,
        user: req.user.id
      });

      return createdResponse(res, 'Budget created successfully', {
        budget
      });
    } catch (error) {
      logger.error('Create budget error:', error);
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

      return successResponse(res, 'Budgets retrieved successfully', {
        budgets
      });
    } catch (error) {
      logger.error('Get budgets error:', error);
      return errorResponse(res, 'Failed to retrieve budgets', 500);
    }
  }
};

// Salary Controller
const salaryController = {
  // Process salary
  processSalary: async (req, res) => {
    try {
      const { employee, month, year, allowances, deductions, paymentMethod } = req.body;

      // Calculate salary
      const employeeDoc = await require('../models/User').findById(employee);
      const basicSalary = employeeDoc?.salary || 0;

      let totalAllowances = 0;
      let totalDeductions = 0;

      if (allowances) {
        totalAllowances = allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
      }

      if (deductions) {
        totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
      }

      const grossSalary = basicSalary + totalAllowances;
      const netSalary = grossSalary - totalDeductions;

      const salary = new Salary({
        employee,
        institution: req.tenantId,
        basicSalary,
        allowances: allowances || [],
        deductions: deductions || [],
        grossSalary,
        netSalary,
        paymentDate: new Date(),
        month: `${year}-${month.toString().padStart(2, '0')}`,
        year,
        paymentMethod,
        processedBy: req.user.id
      });

      await salary.save();

      logger.info(`Salary processed for employee: ${employee}`, {
        institution: req.tenantId,
        user: req.user.id,
        amount: netSalary
      });

      return createdResponse(res, 'Salary processed successfully', {
        salary
      });
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

      return successResponse(res, 'Salaries retrieved successfully', {
        salaries
      });
    } catch (error) {
      logger.error('Get salaries error:', error);
      return errorResponse(res, 'Failed to retrieve salaries', 500);
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

      return successResponse(res, 'Payment intent created successfully', result);
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

      return successResponse(res, 'Checkout session created successfully', result);
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

      return successResponse(res, 'Refund processed successfully', result);
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
        query.student = req.user.id;
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

      return successResponse(res, 'Payment history retrieved successfully', {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
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
      return successResponse(res, 'Payment methods retrieved successfully', {
        paymentMethods: []
      });
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

      return successResponse(res, 'Expense categories retrieved successfully', {
        categories
      });
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

      return successResponse(res, 'Tax rates retrieved successfully', {
        rates
      });
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
        // Total Revenue (Paid Invoices)
        Invoice.aggregate([
          { $match: { institution: institutionId, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        // Total Expenses (Paid Salaries + spent amount in budgets)
        Promise.all([
          Salary.aggregate([
            { $match: { institution: institutionId, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$netSalary' } } }
          ]),
          Budget.aggregate([
            { $match: { institution: institutionId } },
            { $group: { _id: null, total: { $sum: '$spentAmount' } } }
          ])
        ]).then(([salaries, budgets]) => {
          const s = salaries[0]?.total || 0;
          const b = budgets[0]?.total || 0;
          return s + b;
        }),
        // Outstanding Fees (Sent or Overdue Invoices)
        Invoice.aggregate([
          { $match: { institution: institutionId, status: { $in: ['sent', 'overdue'] } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        // Paid Invoices Count
        Invoice.countDocuments({ institution: institutionId, status: 'paid' }),
        // Unpaid Invoices Count
        Invoice.countDocuments({ institution: institutionId, status: { $in: ['sent', 'overdue'] } }),
        // Current Month Revenue
        Invoice.aggregate([
          {
            $match: {
              institution: institutionId,
              status: 'paid',
              paidDate: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        // Last Month Revenue
        Invoice.aggregate([
          {
            $match: {
              institution: institutionId,
              status: 'paid',
              paidDate: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ])
      ]);

      const totalRevenue = totalRevenueResult[0]?.total || 0;
      const totalExpenses = totalExpensesResult || 0;
      const outstandingFees = outstandingFeesResult[0]?.total || 0;
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
            institution: institutionId,
            status: 'paid',
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
          { $match: { institution: institutionId, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$netSalary' } } }
        ]),
        Budget.aggregate([
          { $match: { institution: institutionId } },
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
      const recentInvoices = await Invoice.find({ institution: institutionId })
        .populate('student', 'user.name')
        .sort({ createdAt: -1 })
        .limit(5);

      const formattedInvoices = recentInvoices.map(inv => ({
        id: inv.invoiceNumber,
        student: inv.student?.user?.name || 'Unknown',
        amount: `$${inv.totalAmount.toLocaleString()}`,
        status: inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
        cls: inv.status === 'paid' ? 'badge-soft-success' : (inv.status === 'overdue' ? 'badge-soft-danger' : 'badge-soft-warning')
      }));

      // 5. Budget vs Actual
      const budgets = await Budget.find({ institution: institutionId }).limit(5);
      const budgetVsActual = budgets.map(b => ({
        dept: b.title,
        budget: b.plannedAmount,
        actual: b.spentAmount,
        variance: b.plannedAmount - b.spentAmount
      }));

      // 6. Fee Collection by Term (Quarterly)
      const feeByTerm = await Invoice.aggregate([
        {
          $match: {
            institution: institutionId,
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

      return successResponse(res, 'Finance dashboard data retrieved successfully', {
        topStats: [
          { label: 'Total Revenue', value: `$${(totalRevenue / 1000).toFixed(1)}K`, delta: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`, deltaTone: revenueGrowth >= 0 ? 'bg-success' : 'bg-danger', icon: '/assets/img/icons/technology-07.svg', active: 'This Year', inactive: 'Last Year', avatarTone: 'bg-success-transparent' },
          { label: 'Expenses', value: `$${(totalExpenses / 1000).toFixed(1)}K`, delta: '', deltaTone: 'bg-danger', icon: '/assets/img/icons/technology-08.svg', active: 'This Year', inactive: 'Last Year', avatarTone: 'bg-danger-transparent' },
          { label: 'Outstanding Fees', value: `$${(outstandingFees / 1000).toFixed(1)}K`, delta: '', deltaTone: 'bg-warning', icon: '/assets/img/icons/technology-09.svg', active: 'Current', inactive: 'Overdue', avatarTone: 'bg-warning-transparent' },
          { label: 'Invoices', value: (paidInvoicesCount + unpaidInvoicesCount).toString(), delta: 'This Year', deltaTone: 'bg-primary', icon: '/assets/img/icons/technology-10.svg', active: paidInvoicesCount.toString() + ' Paid', inactive: unpaidInvoicesCount.toString() + ' Unpaid', avatarTone: 'bg-primary-transparent' }
        ],
        financeKPIs: [
          { label: 'Net Profit / Surplus', value: `$${((totalRevenue - totalExpenses) / 1000).toFixed(1)}K`, delta: '', deltaTone: 'bg-success', icon: '/assets/img/icons/technology-07.svg', active: 'This Year', inactive: 'Last Year', avatarTone: 'bg-success-transparent' },
          { label: 'Profit Margin', value: `${totalRevenue > 0 ? (((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1) : 0}%`, delta: '', deltaTone: 'bg-primary', icon: '/assets/img/icons/technology-08.svg', active: 'This Year', inactive: 'Last Year', avatarTone: 'bg-primary-transparent' },
          { label: 'Fee Collection (Month)', value: `$${(currentMonthRevenue / 1000).toFixed(1)}K`, delta: '', deltaTone: 'bg-info', icon: '/assets/img/icons/technology-09.svg', active: 'Collected', inactive: 'Pending', avatarTone: 'bg-info-transparent' },
          { label: 'Pending Fees', value: `$${(outstandingFees / 1000).toFixed(1)}K`, delta: unpaidInvoicesCount.toString() + ' Students', deltaTone: 'bg-warning', icon: '/assets/img/icons/technology-10.svg', active: '>60 Days', inactive: '<30 Days', avatarTone: 'bg-warning-transparent' }
        ],
        revenueData: enhancedRevenueData,
        expensePie,
        budgetVsActual,
        plData: enhancedRevenueData, // Use revenue data as P&L data
        feeByTerm: formattedFeeByTerm,
        invoices: formattedInvoices,
        infraStats,
        maintenanceRequests,
        busData,
        safetyReports,
        inventoryItems
      });
    } catch (error) {
      logger.error('Get finance dashboard data error:', error);
      return errorResponse(res, 'Failed to retrieve finance dashboard data', 500);
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
  taxRateController
};
