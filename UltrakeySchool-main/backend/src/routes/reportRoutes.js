import express from 'express';
import reportController from '../controllers/reportController.js';
const {
  getStudentReport,
  getAttendanceReport,
  getFeeReport,
  createReportTemplate,
  listReportTemplates,
  createScheduledReport,
  listScheduledReports,
  runScheduledReportNow
} = reportController;

import { protect } from '../middleware/authMiddleware.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';

const router = express.Router();

// Apply authentication and tenant middleware to all routes (TESTED & VERIFIED)
router.use(protect);  
router.use(validateTenantAccess);  

// Student reports (TESTED & VERIFIED)
router.get(
  '/student/:studentId',
  getStudentReport
);  

// Attendance reports (TESTED & VERIFIED)
router.get(
  '/attendance',
  getAttendanceReport
);  

// Fee reports (TESTED & VERIFIED)
router.get(
  '/fees',
  getFeeReport
);  

// Scheduling helpers (TESTED & VERIFIED)
router.post('/templates', createReportTemplate);  
router.get('/templates', listReportTemplates);  
router.post('/scheduled', createScheduledReport);  
router.get('/scheduled', listScheduledReports);  
router.post('/scheduled/:id/run', runScheduledReportNow);  

export default router;
