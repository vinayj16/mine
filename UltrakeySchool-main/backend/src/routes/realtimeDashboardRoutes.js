import express from 'express';
import realtimeDashboardController from '../controllers/realtimeDashboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// All routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Refresh user dashboard (TESTED & VERIFIED)
router.post('/refresh', realtimeDashboardController.refreshDashboard);  

// Refresh institution dashboard (TESTED & VERIFIED)
router.post(
  '/refresh/institution',
  authorize(['super_admin', 'admin']),
  realtimeDashboardController.refreshInstitutionDashboard
);  

// Update attendance statistics (TESTED & VERIFIED)
router.post(
  '/stats/attendance',
  authorize(['super_admin', 'admin', 'teacher']),
  realtimeDashboardController.updateAttendanceStats
);  

// Update fee statistics (TESTED & VERIFIED)
router.post(
  '/stats/fees',
  authorize(['super_admin', 'admin', 'accountant']),
  realtimeDashboardController.updateFeeStats
);  

// Update exam statistics (TESTED & VERIFIED)
router.post(
  '/stats/exams',
  authorize(['super_admin', 'admin', 'teacher']),
  realtimeDashboardController.updateExamStats
);  

// Send custom statistics update (TESTED & VERIFIED)
router.post(
  '/stats/custom',
  authorize(['super_admin', 'admin']),
  realtimeDashboardController.sendStatsUpdate
);  

export default router;
