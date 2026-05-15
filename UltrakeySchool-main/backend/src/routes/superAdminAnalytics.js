import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import superAdminController from '../controllers/superAdminController.js';

const {
  getRevenueAnalytics,
  getSubscriptionStats,
  getTransactionStats
} = superAdminController;

const router = express.Router();

// All super admin analytics routes require authentication (TESTED & VERIFIED)
router.use(protect);  
router.use(authorize(['super_admin']));  

// Revenue analytics (TESTED & VERIFIED)
router.get('/revenue', getRevenueAnalytics);  
router.get('/revenue-analytics', getRevenueAnalytics);  
router.get('/transactions/analytics/revenue', getRevenueAnalytics);  

// Summary statistics (TESTED & VERIFIED)
router.get('/summary', getSubscriptionStats);  
router.get('/transactions/stats', getTransactionStats);  
router.get('/subscriptions/stats', getSubscriptionStats);  

export default router;
