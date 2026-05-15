import express from 'express';
import realDataController from '../controllers/realDataController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// All routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Get teachers data (TESTED & VERIFIED)
router.get(
  '/teachers',
  authorize(['super_admin', 'admin', 'teacher']),
  realDataController.getTeachersData
);  

// Get students data (TESTED & VERIFIED)
router.get(
  '/students',
  authorize(['super_admin', 'admin', 'teacher', 'parent']),
  realDataController.getStudentsData
);  

// Get parents data (TESTED & VERIFIED)
router.get(
  '/parents',
  authorize(['super_admin', 'admin']),
  realDataController.getParentsData
);  

// Get finance data (TESTED & VERIFIED)
router.get(
  '/finance',
  authorize(['super_admin', 'admin', 'accountant']),
  realDataController.getFinanceData
);  

// Get revenue analytics (TESTED & VERIFIED)
router.get(
  '/revenue/analytics',
  authorize(['super_admin', 'admin']),
  realDataController.getRevenueAnalytics
);  

// Get transaction stats (TESTED & VERIFIED)
router.get(
  '/transactions/stats',
  authorize(['super_admin', 'admin', 'accountant']),
  realDataController.getTransactionStats
);  

// Get subscription stats (TESTED & VERIFIED)
router.get(
  '/subscriptions/stats',
  authorize(['super_admin', 'admin']),
  realDataController.getSubscriptionStats
);  

// Get schools data (TESTED & VERIFIED)
router.get(
  '/schools',
  authorize(['super_admin', 'admin']),
  realDataController.getSchoolsData
);  

export default router;
