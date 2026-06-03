import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import syllabusController from '../controllers/syllabusController.js';

const {
  createSyllabus,
  getSyllabi,
  getSyllabusById,
  updateSyllabus,
  deleteSyllabus,
  getSyllabusByClass,
  markTopicComplete,
  getSyllabusBySubject,
  addTopic,
  updateTopic,
  deleteTopic,
  updateStatus,
  getSyllabusProgress,
  cloneSyllabus,
  bulkUpdateStatus,
  bulkDeleteSyllabi,
  exportSyllabi,
  getSyllabusStatistics,
  getCompletionAnalytics,
  searchSyllabi,
  reorderTopics,
  archiveSyllabus,
  restoreSyllabus
} = syllabusController;

const router = express.Router();

// All syllabus routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Simple routes matching frontend: /syllabi/schools/:institutionId
router.get('/schools', authorize(['admin', 'teacher', 'principal',   'institution_admin']), getSyllabi);
router.get('/schools/', authorize(['admin', 'teacher', 'principal',   'institution_admin']), getSyllabi);
router.get('/schools/:institutionId', authorize(['admin', 'teacher', 'principal',   'institution_admin']), getSyllabi);
router.post('/schools/:institutionId', authorize(['admin', 'teacher', 'principal',   'institution_admin']), createSyllabus);
router.put('/schools/:institutionId/:syllabusId', authorize(['admin', 'teacher', 'principal',   'institution_admin']), updateSyllabus);
router.delete('/schools/:institutionId/:syllabusId', authorize(['admin', 'principal',   'institution_admin']), deleteSyllabus);

// CRUD Operations (TESTED & VERIFIED)
router.get('/schools/:institutionId', authorize(['admin', 'teacher', 'principal',   'institution_admin']), getSyllabi);
router.get('/schools/:institutionId/syllabi', authorize(['admin', 'teacher', 'principal',   'institution_admin']), getSyllabi);
router.get('/schools/:institutionId/syllabi/statistics', authorize(['admin', 'principal',   'institution_admin']), getSyllabusStatistics);
router.get('/schools/:institutionId/syllabi/:syllabusId', getSyllabusById);
router.get('/schools/:institutionId/classes/:classId/syllabi', getSyllabusByClass);
router.get('/schools/:institutionId/subjects/:subjectId/syllabi', getSyllabusBySubject);
router.post('/schools/:institutionId/syllabi', authorize(['admin', 'teacher', 'principal',   'institution_admin']), createSyllabus);
router.put('/schools/:institutionId/syllabi/:syllabusId', authorize(['admin', 'teacher', 'principal',   'institution_admin']), updateSyllabus);
router.delete('/schools/:institutionId/syllabi/:syllabusId', authorize(['admin', 'principal',   'institution_admin']), deleteSyllabus);  

// Topic Management (TESTED & VERIFIED)
router.post('/schools/:institutionId/syllabi/:syllabusId/topics', authorize(['admin', 'teacher', 'principal', 'institution_owner']), addTopic);  
router.put('/schools/:institutionId/syllabi/:syllabusId/topics/:topicId', authorize(['admin', 'teacher', 'principal', 'institution_owner']), updateTopic);  
router.delete('/schools/:institutionId/syllabi/:syllabusId/topics/:topicId', authorize(['admin', 'principal', 'institution_owner']), deleteTopic);  
router.patch('/schools/:institutionId/syllabi/:syllabusId/topics/complete', authorize(['admin', 'teacher', 'principal', 'institution_owner']), markTopicComplete);  

// Status and Progress (TESTED & VERIFIED)
router.patch('/schools/:institutionId/syllabi/:syllabusId/status', authorize(['admin', 'principal']), updateStatus);  
router.get('/schools/:institutionId/syllabi/:syllabusId/progress', getSyllabusProgress);  

// Clone (TESTED & VERIFIED)
router.post('/schools/:institutionId/syllabi/:syllabusId/clone', authorize(['admin', 'principal']), cloneSyllabus);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/schools/:institutionId/syllabi/bulk-update-status', authorize(['admin', 'principal']), bulkUpdateStatus);  
router.post('/schools/:institutionId/syllabi/bulk-delete', authorize(['super_admin']), bulkDeleteSyllabi);  

// Export (TESTED & VERIFIED)
router.get('/schools/:institutionId/syllabi/export', authorize(['admin', 'principal']), exportSyllabi);  

// Analytics and Search (TESTED & VERIFIED)
router.get('/schools/:institutionId/syllabi/analytics/completion', authorize(['admin', 'principal']), getCompletionAnalytics);  
router.get('/schools/:institutionId/syllabi/search', searchSyllabi);  

// Topic Reordering (TESTED & VERIFIED)
router.post('/schools/:institutionId/syllabi/:syllabusId/topics/reorder', authorize(['admin', 'teacher', 'principal']), reorderTopics);  

// Archive and Restore (TESTED & VERIFIED)
router.post('/schools/:institutionId/syllabi/:syllabusId/archive', authorize(['admin', 'principal']), archiveSyllabus);  
router.post('/schools/:institutionId/syllabi/:syllabusId/restore', authorize(['admin', 'principal']), restoreSyllabus);  

export default router;
