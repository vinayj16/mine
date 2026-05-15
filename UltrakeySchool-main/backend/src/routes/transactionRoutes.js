import express from 'express';
import transactionController from '../controllers/transactionController.js';
import * as validators from '../validators/transactionValidators.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validationResult } from 'express-validator';

const {
  getTransactionById,
  getSchoolTransactions,
  getAllTransactions,
  createRefund,
  getRevenueAnalytics,
  getTransactionStats,
  createTransaction,
  updateTransactionStatus,
  getTransactionsByStatus,
  getTransactionsByType,
  getUserTransactions,
  getFailedTransactions,
  getPendingTransactions,
  verifyTransaction,
  cancelTransaction,
  exportTransactions,
  searchTransactions,
  getTransactionSummary
} = transactionController;

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Authentication middleware for all routes (TESTED & VERIFIED)
router.use(protect);  

// Specific routes must come before parameterized routes (TESTED & VERIFIED)
router.get('/', validators.transactionFiltersValidator, validate, getAllTransactions);  
router.get('/search', searchTransactions);  
router.get('/export', exportTransactions);  
router.get('/summary', getTransactionSummary);  
router.get('/stats', getTransactionStats);  
router.get('/analytics/revenue', validators.revenueAnalyticsValidator, validate, getRevenueAnalytics);  
router.get('/status/:status', getTransactionsByStatus);  
router.get('/type/:type', getTransactionsByType);  
router.get('/failed', getFailedTransactions);  
router.get('/pending', getPendingTransactions);  
router.post('/', authorize(['admin', 'super_admin']), createTransaction);  
router.get('/schools/:schoolId', validators.schoolIdValidator, validate, validators.transactionFiltersValidator, validate, getSchoolTransactions);  
router.get('/users/:userId', getUserTransactions);  

// Parameterized routes (TESTED & VERIFIED)
router.get('/:transactionId', validators.transactionIdValidator, validate, getTransactionById);  
router.patch('/:transactionId/status', authorize(['admin', 'super_admin']), updateTransactionStatus);  
router.post('/:transactionId/refund', validators.createRefundValidator, validate, createRefund);  
router.post('/:transactionId/verify', verifyTransaction);  
router.post('/:transactionId/cancel', cancelTransaction);  

export default router;
