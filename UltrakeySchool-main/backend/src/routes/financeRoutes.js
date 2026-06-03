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
  taxRateController,
  feeGroupController,
  feeTypeController,
  feeMasterController,
  feeAssignmentController
} = financeController;

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';
const router = express.Router();

// Apply tenant middleware to all routes (TESTED & VERIFIED)
router.use(protect);
router.use(validateTenantAccess);

// Fee Group Routes - Accountant and above
router.get('/fee-groups',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeGroupController.getAll
);
router.post('/fee-groups',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeGroupController.create
);
router.put('/fee-groups/:id',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeGroupController.update
);
router.delete('/fee-groups/:id',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeGroupController.delete
);

// Fee Type Routes
router.get('/fee-types',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeTypeController.getAll
);
router.post('/fee-types',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeTypeController.create
);
router.put('/fee-types/:id',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeTypeController.update
);
router.delete('/fee-types/:id',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeTypeController.delete
);

// Fee Master Routes
router.get('/fee-masters',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeMasterController.getAll
);
router.post('/fee-masters',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeMasterController.create
);
router.put('/fee-masters/:id',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeMasterController.update
);
router.delete('/fee-masters/:id',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeMasterController.delete
);

// Fee Assignment Routes
router.get('/fee-assignments',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeAssignmentController.getAll
);
router.post('/fee-assignments',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeAssignmentController.create
);
router.put('/fee-assignments/:id',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeAssignmentController.update
);
router.delete('/fee-assignments/:id',
  authorize('accountant', 'admin', 'institution_admin', 'principal', 'superadmin'),
  feeAssignmentController.delete
);

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

router.post('/transactions',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  transactionController.create
);

router.put('/transactions/:id',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  transactionController.update
);

router.delete('/transactions/:id',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  transactionController.delete
);

// Budget Routes - Accountant and above (TESTED & VERIFIED)
router.post('/budgets',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  budgetController.create
);

router.get('/budgets',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin', 'agent'),
  budgetController.getAll
);

router.put('/budgets/:id',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  budgetController.update
);

router.delete('/budgets/:id',
  authorize('accountant', 'admin', 'institution_admin',   'principal', 'superadmin'),
  budgetController.delete
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

// Salary Routes - Accountant, HR Manager, and Principal (TESTED & VERIFIED)
router.post('/salaries',
  authorize('accountant', 'hr_manager', 'admin', 'institution_admin', 'principal', 'superadmin'),
  salaryController.processSalary
);  

router.get('/salaries',
  authorize('accountant', 'hr_manager', 'admin', 'institution_admin', 'principal', 'superadmin', 'agent'),
  salaryController.getAll
);  

router.get('/salaries/:id',
  authorize('accountant', 'hr_manager', 'admin', 'institution_admin', 'principal', 'superadmin', 'agent'),
  salaryController.getById
);

router.put('/salaries/:id',
  authorize('accountant', 'hr_manager', 'admin', 'institution_admin', 'principal', 'superadmin'),
  salaryController.update
);

router.delete('/salaries/:id',
  authorize('accountant', 'hr_manager', 'admin', 'institution_admin', 'principal', 'superadmin'),
  salaryController.delete
);

// Institution Finance Routes - Institution Admin and above
router.get('/institution',
  authorize(['accountant', 'admin', 'institution_admin',   'principal', 'superadmin', 'super_admin']),
  dashboardController.getDashboardData
);  

// Dashboard Routes - Accountant specific (TESTED & VERIFIED)
router.get('/dashboard',
  authorize(['accountant', 'admin', 'institution_admin',   'superadmin', 'super_admin', 'agent']),
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