import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import resultController from '../controllers/resultController.js';

const {
  getResults,
  getResultById,
  createResult,
  updateResult,
  deleteResult,
  publishResult,
  bulkCreateResults,
  bulkDeleteResults,
  bulkPublishResults,
  getResultsByStudent,
  getResultsByExam,
  getResultStatistics,
  exportResults,
  calculateGrades
} = resultController;

const router = express.Router();

// All result routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Result CRUD operations (TESTED & VERIFIED)
router.post('/schools/:schoolId', authorize(['admin', 'teacher', 'principal', 'super_admin']), createResult);  
router.get('/schools/:schoolId', getResults);  
router.get('/:id', getResultById);  
router.put('/:id', authorize(['admin', 'teacher', 'principal', 'super_admin']), updateResult);  
router.delete('/:id', authorize(['admin', 'principal', 'super_admin']), deleteResult);  

// Publish result (TESTED & VERIFIED)
router.patch('/:id/publish', authorize(['admin', 'teacher', 'principal', 'super_admin']), publishResult);  

// Bulk operations (TESTED & VERIFIED)
router.post('/schools/:schoolId/bulk-create', authorize(['admin', 'teacher', 'principal', 'super_admin']), bulkCreateResults);  
router.post('/bulk-delete', authorize(['admin', 'principal', 'super_admin']), bulkDeleteResults);  
router.post('/bulk-publish', authorize(['admin', 'teacher', 'principal', 'super_admin']), bulkPublishResults);  

// Results by student/exam (TESTED & VERIFIED)
router.get('/student/:studentId', getResultsByStudent);  
router.get('/exam/:examId', getResultsByExam);  

// Statistics and export (TESTED & VERIFIED)
router.get('/schools/:schoolId/statistics', authorize(['admin', 'principal', 'super_admin']), getResultStatistics);  
router.get('/schools/:schoolId/export', authorize(['admin', 'principal', 'super_admin']), exportResults);  
router.post('/calculate-grades', authorize(['admin', 'teacher', 'principal', 'super_admin']), calculateGrades);  

export default router;
