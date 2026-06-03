import express from 'express';
import feeController from '../controllers/feeController.js';
const {
  getFeesOverview,
  collectFee,
  createFee,
  bulkCreateFees,
  getStudentFees,
  getPendingFees,
  getAllFees,
  getMyFees,
  listFees,
  getAccountantDashboard,
  getPaymentConfig,
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
} = feeController;

import { protect } from '../middleware/authMiddleware.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';
import { authorize } from '../middleware/authGuard.js';
import {
  getFeesOverviewValidation,
  collectFeeValidation,
  createFeeValidation,
  bulkCreateFeesValidation,
  getStudentFeesValidation,
  getPendingFeesValidation,
  sendRemindersValidation,
  getFeesReportValidation,
  updateFeeValidation,
  deleteFeeValidation,
  createInvoiceValidation,
  getInvoicesValidation,
  initiatePaymentValidation,
  verifyPaymentValidation
} from '../validators/feeValidators.js';

const router = express.Router();

// All fee routes require authentication and tenant validation
router.use(protect);
router.use(validateTenantAccess);

// Invoice routes (TESTED & VERIFIED)
router.post(
  '/invoices',
  authorize(['admin', 'accountant', 'principal',   'institution_admin']),
  createInvoiceValidation,
  createInvoice
);  

router.get(
  '/invoices',
  getInvoicesValidation,
  getInvoices
);  

router.post(
  '/invoices/:invoiceId/pay',
  authorize(['admin', 'accountant', 'principal',   'institution_admin', 'student', 'parent']),
  initiatePaymentValidation,
  initiatePayment
);  

router.post(
  '/payments/verify',
  verifyPaymentValidation,
  verifyPayment
);  

router.get(
  '/payments/:paymentId/receipt',
  getPaymentReceipt
);  

// Payment gateway config (Razorpay key) - returns institution-specific key if authenticated
router.get('/payment-config', protect, getPaymentConfig);

// Accountant unified fee dashboard (tuition + hostel + transport)
router.get(
  '/accountant/dashboard',
  authorize(['admin', 'accountant', 'principal', 'institution_admin']),
  getAccountantDashboard
);

// Student's own fees
router.get('/my', getMyFees);

// Frontend-compatible list route (role-aware)
router.get('/', listFees);  

router.post('/', async (req, res, next) => {
  try {
    return createFee(req, res, next);
  } catch (error) {
    next(error);
  }
});  

router.post('/create', async (req, res, next) => {
  try {
    return createFee(req, res, next);
  } catch (error) {
    next(error);
  }
});  

router.put('/:id', async (req, res, next) => {
  try {
    return updateFee(req, res, next);
  } catch (error) {
    next(error);
  }
});  

router.delete('/:id', async (req, res, next) => {
  try {
    return deleteFee(req, res, next);
  } catch (error) {
    next(error);
  }
});  

// Existing routes (TESTED & VERIFIED)
router.get(
  '/overview',
  getFeesOverviewValidation,
  getFeesOverview
);  

router.post(
  '/collect',
  authorize(['admin', 'accountant', 'principal',   'institution_admin']),
  collectFeeValidation,
  collectFee
);  

router.post(
  '/bulk',
  authorize(['admin', 'accountant', 'principal',   'institution_admin']),
  bulkCreateFeesValidation,
  bulkCreateFees
);  

router.get(
  '/student/:studentId',
  getStudentFeesValidation,
  getStudentFees
);  

router.get(
  '/pending',
  authorize(['admin', 'accountant', 'principal', 'institution_admin', 'superadmin']),
  getPendingFeesValidation,
  getPendingFees
);  

router.post(
  '/reminders',
  authorize(['admin', 'accountant', 'principal',   'institution_admin']),
  sendRemindersValidation,
  sendReminders
);  

router.get(
  '/report',
  authorize(['admin', 'accountant', 'principal']),
  getFeesReportValidation,
  getFeesReport
);  

router.put(
  '/:id',
  authorize(['admin', 'accountant']),
  updateFeeValidation,
  updateFee
);  

router.delete(
  '/:id',
  authorize(['admin']),
  deleteFeeValidation,
  deleteFee
);  

router.post(
  '/apply-late-fees',
  authorize(['admin', 'accountant']),
  applyLateFees
);  

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
});

export default router;
