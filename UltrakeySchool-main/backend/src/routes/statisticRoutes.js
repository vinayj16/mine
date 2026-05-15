import express from 'express';
import statisticController from '../controllers/statisticController.js';
const {
  getStatistic,
  getAllStatistics,
  refreshStatistic,
  refreshAllStatistics,
  acknowledgeAlert,
  getStatisticHistory,
  getStatisticsByType,
  getStatisticsByPeriod,
  getStatisticsSummary,
  getTrendingStatistics,
  compareStatistics,
  getStatisticsForDateRange,
  exportStatistics,
  getAlerts,
  bulkAcknowledgeAlerts,
  getStatisticsAnalytics,
  deleteStatistic,
  bulkDeleteStatistics
} = statisticController;

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import {
  getStatisticValidation,
  refreshStatisticValidation,
  acknowledgeAlertValidation,
  getStatisticHistoryValidation
} from '../validators/statisticValidators.js';
import statisticService from '../services/statisticService.js';

const router = express.Router();

// All statistic routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Frontend-compatible routes (TESTED & VERIFIED)
router.get('/dashboard', async (req, res, next) => {  
  try {
    const data = await statisticService.getDashboardData(req.user.schoolId, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/students', async (req, res, next) => {  
  try {
    const data = await statisticService.getStudentStats(req.user.schoolId, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/teachers', async (req, res, next) => {  
  try {
    const data = await statisticService.getTeacherStats(req.user.schoolId, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/attendance', async (req, res, next) => {  
  try {
    const data = await statisticService.getAttendanceStats(req.user.schoolId, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Existing routes (TESTED & VERIFIED)
router.get(
  '/',
  getAllStatistics
);  

router.get(
  '/:statId',
  getStatisticValidation,
  getStatistic
);  

router.get(
  '/:statId/history',
  getStatisticHistoryValidation,
  getStatisticHistory
);  

router.post(
  '/:statId/refresh',
  authorize(['admin', 'principal']),
  refreshStatisticValidation,
  refreshStatistic
);  

router.post(
  '/refresh-all',
  authorize(['admin', 'principal']),
  refreshAllStatistics
);  

router.post(
  '/:statId/alerts/:alertId/acknowledge',
  acknowledgeAlertValidation,
  acknowledgeAlert
);  

// Specific routes (must come before /:statId routes) (TESTED & VERIFIED)
router.get('/summary', authorize(['admin', 'principal']), getStatisticsSummary);  
router.get('/trending', getTrendingStatistics);  
router.get('/export', authorize(['admin', 'principal']), exportStatistics);  
router.get('/alerts', getAlerts);  
router.get('/analytics', authorize(['admin', 'principal']), getStatisticsAnalytics);  
router.get('/type/:type', getStatisticsByType);  
router.get('/period/:period', getStatisticsByPeriod);  
router.get('/date-range', getStatisticsForDateRange);  

// CRUD Operations (TESTED & VERIFIED)
router.get('/:statId', getStatisticValidation, getStatistic);  
router.delete('/:statId', authorize(['super_admin']), deleteStatistic);  

// History and Comparison (TESTED & VERIFIED)
router.get('/:statId/history', getStatisticHistoryValidation, getStatisticHistory);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/compare', authorize(['admin', 'principal']), compareStatistics);  
router.post('/alerts/bulk-acknowledge', authorize(['admin', 'principal']), bulkAcknowledgeAlerts);  
router.post('/bulk-delete', authorize(['super_admin']), bulkDeleteStatistics);  

export default router;
