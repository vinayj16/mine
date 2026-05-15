import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import studentAttendanceController from '../controllers/studentAttendanceController.js';

const {
  markAttendance,
  bulkMarkAttendance,
  getAttendanceById,
  getAttendanceByDate,
  getStudentAttendance,
  getAllAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStatistics,
  getStudentAttendancePercentage,
  getClassAttendanceReport,
  getDefaultersList,
  getMonthlyAttendanceReport,
  getAttendanceByStatus,
  bulkDeleteAttendance,
  exportAttendance,
  getAttendanceTrends,
  getAttendanceSummary
} = studentAttendanceController;

const router = express.Router();

// All student attendance routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Specific routes (must come before /:id routes) (TESTED & VERIFIED)
router.get('/', getAllAttendance);  
router.get('/statistics', getAttendanceStatistics);  
router.get('/summary', getAttendanceSummary);  
router.get('/trends', getAttendanceTrends);  
router.get('/defaulters', getDefaultersList);  
router.get('/monthly-report', getMonthlyAttendanceReport);  
router.get('/date/:date', getAttendanceByDate);  
router.get('/status/:status', getAttendanceByStatus);  
router.get('/export', authorize(['admin', 'principal']), exportAttendance);  
router.get('/student/:studentId', getStudentAttendance);  
router.get('/student/:studentId/percentage', getStudentAttendancePercentage);  
router.get('/class/:className/section/:section/date/:date', getClassAttendanceReport);  

// CRUD Operations (TESTED & VERIFIED)
router.get('/:id', getAttendanceById);  
router.post('/', authorize(['admin', 'teacher', 'principal']), markAttendance);  
router.put('/:id', authorize(['admin', 'teacher', 'principal']), updateAttendance);  
router.delete('/:id', authorize(['admin', 'principal']), deleteAttendance);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/bulk-mark', authorize(['admin', 'teacher', 'principal']), bulkMarkAttendance);  
router.post('/bulk-delete', authorize(['super_admin']), bulkDeleteAttendance);  

export default router;
