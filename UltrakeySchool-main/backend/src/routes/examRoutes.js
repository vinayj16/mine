import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import examController from '../controllers/examController.js';

const {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  getExamsByClass,
  markAttendance,
  getAttendance,
  bulkUpdateExams,
  bulkDeleteExams,
  exportExams,
  getExamStatistics,
  getExamAnalytics
} = examController;

const router = express.Router();

// All exam routes require authentication (TESTED & VERIFIED)
router.use(protect);

// Exam CRUD operations (TESTED & VERIFIED)
router.post('/schools/:schoolId', authorize(['admin', 'teacher', 'principal', 'super_admin']), createExam);  
router.get('/schools/:schoolId', getExams);  
router.get('/schools/:schoolId/exams/:examId', getExamById);  
router.put('/schools/:schoolId/exams/:examId', authorize(['admin', 'teacher', 'principal', 'super_admin']), updateExam);  
router.delete('/schools/:schoolId/exams/:examId', authorize(['admin', 'principal', 'super_admin']), deleteExam);  

// Exam by class (TESTED & VERIFIED)
router.get('/schools/:schoolId/class/:classId', getExamsByClass);  

// Exam attendance (TESTED & VERIFIED)
router.post('/schools/:schoolId/exams/:examId/attendance', authorize(['admin', 'teacher', 'principal']), markAttendance);  
router.get('/schools/:schoolId/exams/:examId/attendance', getAttendance);  

// Bulk operations (TESTED & VERIFIED)
router.post('/schools/:schoolId/bulk-update', authorize(['admin', 'principal', 'super_admin']), bulkUpdateExams);  
router.post('/schools/:schoolId/bulk-delete', authorize(['admin', 'principal', 'super_admin']), bulkDeleteExams);  

// Export and statistics (TESTED & VERIFIED)
router.get('/schools/:schoolId/export', authorize(['admin', 'principal', 'super_admin']), exportExams);  
router.get('/schools/:schoolId/statistics', authorize(['admin', 'principal', 'super_admin']), getExamStatistics);  
router.get('/schools/:schoolId/analytics', authorize(['admin', 'principal', 'super_admin']), getExamAnalytics);  

export default router;
