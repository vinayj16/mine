import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import leaveReportController from '../controllers/leaveReportController.js';

const router = express.Router();

// Apply authentication middleware to all routes (TESTED & VERIFIED)
router.use(protect);  

// Get leave report for all students in a school (TESTED & VERIFIED)
router.get('/schools/:schoolId', leaveReportController.getLeaveReport);  

// Get leave summary for a specific student (TESTED & VERIFIED)
router.get('/students/:studentId', leaveReportController.getStudentLeaveSummary);  

export default router;
