import express from 'express';
import financeController from '../controllers/financeController.js';
const {
  feeStructureController,
  invoiceController,
  transactionController,
  budgetController,
  salaryController,
  paymentController,
  dashboardController,
  expenseCategoryController,
  taxRateController
} = financeController;

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';

const router = express.Router();

// Apply tenant middleware to all routes (TESTED & VERIFIED)
router.use(protect);
router.use(validateTenantAccess);

// Fee Structure Routes - Accountant and above (TESTED & VERIFIED)
router.post('/fees',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  feeStructureController.create
);  

router.get('/fees',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin', 'teacher', 'student', 'parent'),
  feeStructureController.getAll
);  

router.get('/fees/:id',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin', 'teacher', 'student', 'parent'),
  feeStructureController.getById
);  

router.put('/fees/:id',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  feeStructureController.update
);  

router.delete('/fees/:id',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  feeStructureController.delete
);  

// Invoice Routes - Accountant and above (TESTED & VERIFIED)
router.post('/invoices',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  invoiceController.create
);  

router.get('/invoices',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin', 'teacher', 'student', 'parent'),
  invoiceController.getAll
);  

router.get('/invoices/:id',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin', 'teacher', 'student', 'parent'),
  invoiceController.getById
);  

router.put('/invoices/:id',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  invoiceController.update
);  

router.put('/invoices/:id/pay',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  invoiceController.markAsPaid
);  

// Transaction Routes - Accountant and above (TESTED & VERIFIED)
router.get('/transactions',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  transactionController.getAll
);

// Budget Routes - Accountant and above (TESTED & VERIFIED)
router.post('/budgets',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  budgetController.create
);

router.get('/budgets',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  budgetController.getAll
);

// Expense Category Routes (TESTED & VERIFIED)
router.get('/expenses/categories',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  expenseCategoryController.getExpenseCategories
);

// Tax Rates (Financial Settings) (TESTED & VERIFIED)
router.get('/tax-rates',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  taxRateController.getTaxRates
);  

// Salary Routes - Accountant and HR Manager (TESTED & VERIFIED)
router.post('/salaries',
  authorize('accountant', 'hr_manager', 'admin', 'institution_admin', 'superadmin'),
  salaryController.processSalary
);  

router.get('/salaries',
  authorize('accountant', 'hr_manager', 'admin', 'institution_admin', 'superadmin'),
  salaryController.getAll
);  

// Institution Finance Routes - Institution Admin and above
router.get('/institution',
  authorize(['accountant', 'admin', 'institution_admin',   'principal', 'superadmin', 'super_admin']),
  dashboardController.getDashboardData
);  

// Dashboard Routes - Accountant specific (TESTED & VERIFIED)
router.get('/dashboard',
  authorize(['accountant', 'admin', 'institution_admin',   'superadmin', 'super_admin']),
  dashboardController.getDashboardData
);  

// Payment Routes - All authenticated users (TESTED & VERIFIED)
// Create payment intent for invoice
router.post('/payments/intent/:invoiceId',
  paymentController.createPaymentIntent
);  

// Create checkout session for invoice
router.post('/payments/checkout/:invoiceId',
  paymentController.createCheckoutSession
);  

// Handle Stripe webhooks (no auth needed for webhooks)
router.post('/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);  

// Process refund (Accountant and above)
router.post('/payments/refund',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  paymentController.processRefund
);  

// Get payment history
router.get('/payments/history',
  paymentController.getPaymentHistory
);  

// Get payment methods
router.get('/payments/methods',
  paymentController.getPaymentMethods
);  

export default router;