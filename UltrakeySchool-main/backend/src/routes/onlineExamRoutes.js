import express from 'express';
import onlineExamController from '../controllers/onlineExamController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// All routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Exam Management (Teachers/Admins) (TESTED & VERIFIED)
router.post(
  '/',
  authorize(['teacher', 'principal', 'admin', 'super_admin']),
  onlineExamController.createExam
);  

router.get('/', onlineExamController.getExams);  

router.get('/:id', onlineExamController.getExamById);  

router.put(
  '/:id',
  authorize(['teacher', 'principal', 'admin', 'super_admin']),
  onlineExamController.updateExam
);  

router.delete(
  '/:id',
  authorize(['teacher', 'principal', 'admin', 'super_admin']),
  onlineExamController.deleteExam
);  

router.post(
  '/:id/publish',
  authorize(['teacher', 'principal', 'admin', 'super_admin']),
  onlineExamController.publishExam
);  

// Student Exam Taking (TESTED & VERIFIED)
router.post('/:id/start', authorize(['student']), onlineExamController.startExam);  

router.post(
  '/submissions/:submissionId/answer',
  authorize(['student']),
  onlineExamController.saveAnswer
);  

router.post(
  '/submissions/:submissionId/submit',
  authorize(['student']),
  onlineExamController.submitExam
);  

router.post(
  '/submissions/:submissionId/tab-switch',
  authorize(['student']),
  onlineExamController.recordTabSwitch
);  

// Grading (Teachers/Admins) (TESTED & VERIFIED)
router.post(
  '/submissions/:submissionId/grade',
  authorize(['teacher', 'principal', 'admin', 'super_admin']),
  onlineExamController.manualGradeQuestion
);  

router.get(
  '/:examId/submissions',
  authorize(['teacher', 'principal', 'admin', 'super_admin']),
  onlineExamController.getSubmissions
);  

router.get(
  '/submissions/:submissionId',
  onlineExamController.getSubmissionById
);  

// Plagiarism Detection (Teachers/Admins) (TESTED & VERIFIED)
router.post(
  '/submissions/:submissionId/plagiarism',
  authorize(['teacher', 'principal', 'admin', 'super_admin']),
  onlineExamController.checkPlagiarism
);  

router.post(
  '/:examId/plagiarism/bulk',
  authorize(['teacher', 'principal', 'admin', 'super_admin']),
  onlineExamController.bulkCheckPlagiarism
);  

// Statistics (TESTED & VERIFIED)
router.get(
  '/:id/statistics',
  authorize(['teacher', 'principal', 'admin', 'super_admin']),
  onlineExamController.getExamStatistics
);  

router.get(
  '/student/results',
  authorize(['student', 'parent']),
  onlineExamController.getStudentResults
);  

export default router;
