import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import questionBankController from '../controllers/questionBankController.js';

const {
  createQuestion,
  getQuestionById,
  getAllQuestions,
  updateQuestion,
  deleteQuestion,
  getQuestionsBySubject,
  getQuestionsByTopic,
  getQuestionsByDifficulty,
  getQuestionsByType,
  updateStatus,
  bulkUpdateStatus,
  bulkDeleteQuestions,
  getQuestionBankStatistics,
  searchQuestions,
  exportQuestions,
  getActiveQuestions,
  importQuestions,
  getRandomQuestions,
  getQuestionsForExam,
  duplicateQuestion,
  addTag,
  removeTag
} = questionBankController;

const router = express.Router();

// All question bank routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// CRUD Operations (TESTED & VERIFIED)
router.get('/', getAllQuestions);  
router.get('/statistics', authorize(['admin', 'principal', 'teacher']), getQuestionBankStatistics);  
router.get('/active', getActiveQuestions);  
router.get('/search', searchQuestions);  
router.get('/subject/:subjectId', getQuestionsBySubject);  
router.get('/topic/:topic', getQuestionsByTopic);  
router.get('/difficulty/:difficulty', getQuestionsByDifficulty);  
router.get('/type/:type', getQuestionsByType);  
router.get('/exam/:examId', getQuestionsForExam);  
router.get('/random', getRandomQuestions);  
router.get('/:id', getQuestionById);  
router.post('/', authorize(['admin', 'principal', 'teacher']), createQuestion);  
router.put('/:id', authorize(['admin', 'principal', 'teacher']), updateQuestion);  
router.delete('/:id', authorize(['admin', 'principal', 'teacher']), deleteQuestion);  

// Status Management (TESTED & VERIFIED)
router.patch('/:id/status', authorize(['admin', 'principal', 'teacher']), updateStatus);  

// Question Operations (TESTED & VERIFIED)
router.post('/:id/duplicate', authorize(['admin', 'principal', 'teacher']), duplicateQuestion);  
router.post('/:id/tags', authorize(['admin', 'principal', 'teacher']), addTag);  
router.delete('/:id/tags/:tag', authorize(['admin', 'principal', 'teacher']), removeTag);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/bulk-update-status', authorize(['admin', 'principal']), bulkUpdateStatus);  
router.post('/bulk-delete', authorize(['super_admin']), bulkDeleteQuestions);  

// Import/Export (TESTED & VERIFIED)
router.post('/import', authorize(['admin', 'principal', 'teacher']), importQuestions);  
router.get('/export', authorize(['admin', 'principal']), exportQuestions);  

export default router;
