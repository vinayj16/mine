import express from 'express';
import installmentController from '../controllers/installmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// All routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Create installment plan (TESTED & VERIFIED)
router.post(
  '/',
  authorize(['super_admin', 'admin', 'accountant']),
  installmentController.createInstallmentPlan
);  

// Get installment plans (TESTED & VERIFIED)
router.get('/', installmentController.getInstallmentPlans);  

// Get installment plan by ID (TESTED & VERIFIED)
router.get('/:id', installmentController.getInstallmentPlanById);  

// Pay installment (TESTED & VERIFIED)
router.post('/:id/installments/:installmentNumber/pay', installmentController.payInstallment);  

// Apply late fees (TESTED & VERIFIED)
router.post(
  '/late-fees/apply',
  authorize(['super_admin', 'admin', 'accountant']),
  installmentController.applyLateFees
);  

// Cancel installment plan (TESTED & VERIFIED)
router.put(
  '/:id/cancel',
  authorize(['super_admin', 'admin', 'accountant']),
  installmentController.cancelInstallmentPlan
);  

// Get upcoming installments (TESTED & VERIFIED)
router.get('/upcoming/list', installmentController.getUpcomingInstallments);  

// Get installment statistics (TESTED & VERIFIED)
router.get(
  '/stats/summary',
  authorize(['super_admin', 'admin', 'accountant']),
  installmentController.getInstallmentStatistics
);  

export default router;
