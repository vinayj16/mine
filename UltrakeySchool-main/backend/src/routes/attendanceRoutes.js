import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import attendanceController from '../controllers/attendanceController.js';
import {
  markAttendanceValidation,
  getStatsValidation,
  getHistoryValidation,
  getBulkAttendanceValidation
} from '../validators/attendanceValidators.js';

const {
  getAttendanceStats,
  markAttendance,
  getAttendanceHistory,
  getBulkAttendance,
  getAttendanceWithSummary,
  bulkMarkAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceReport,
  getAttendancePercentage,
  getLowAttendanceUsers
} = attendanceController;

const router = express.Router();

// All attendance routes require authentication
router.use(protect);

// Simple CRUD routes (uses real database data via Attendance model - TESTED & VERIFIED)
router.get('/', getHistoryValidation, getAttendanceHistory);
router.get('/bulk', authorize('admin', 'teacher', 'principal'), getBulkAttendanceValidation, getBulkAttendance);
router.get('/with-summary', authorize('admin', 'teacher', 'principal'), getAttendanceWithSummary);
router.delete('/:id', authorize('admin', 'principal'), deleteAttendance);
router.get('/stats', authorize('admin', 'teacher', 'principal', 'institution_owner'), getStatsValidation, getAttendanceStats);
router.get('/percentage', authorize('admin', 'teacher', 'principal'), getAttendancePercentage);
router.get('/low-attendance', authorize('admin', 'principal'), getLowAttendanceUsers);
router.post('/mark', authorize('admin', 'teacher', 'principal'), markAttendanceValidation, markAttendance);
router.get('/history', getHistoryValidation, getAttendanceHistory);
router.post('/bulk-mark', authorize('admin', 'principal', 'institution_admin', 'teacher'), bulkMarkAttendance);
router.get('/staff', authorize('admin', 'principal', 'institution_admin', 'teacher', 'staff', 'staff_member'), getBulkAttendanceValidation, getBulkAttendance);
router.get('/report', authorize('admin', 'principal', 'institution_admin'), getAttendanceReport);
router.get('/today', authorize('admin', 'principal', 'institution_admin', 'teacher'), getBulkAttendance);

export default router;