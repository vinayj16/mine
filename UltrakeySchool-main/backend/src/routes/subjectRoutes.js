import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import subjectController from '../controllers/subjectController.js';

const {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectsByDepartment,
  searchSubjects,
  getSubjectsByType,
  getSubjectsByStatus,
  updateSubjectStatus,
  bulkUpdateSubjects,
  bulkDeleteSubjects,
  getSubjectStatistics,
  exportSubjects,
  getActiveSubjects,
  archiveSubject,
  restoreSubject,
  duplicateSubject,
  getSubjectTeachers,
  getSubjectStudents
} = subjectController;

const router = express.Router();

// All subject routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Simple subjects route for frontend compatibility (auto-gets institution from JWT)
router.get('/', async (req, res, next) => {
  try {
    // Use institution from JWT to filter - add as query param
    const institutionId = req.user?.institutionId || req.user?.institution;
    if (institutionId) {
      req.query.schoolId = institutionId;
      req.query.institutionId = institutionId;
    }
    console.log('[Subject Routes] GET / - using institutionId from JWT:', institutionId);
    getSubjects(req, res, next);
  } catch (err) {
    next(err);
  }
});  
router.post('/', async (req, res, next) => {
  try {
    console.log('[Subject Routes] POST / hit');
    
    let schoolId = req.body.schoolId || req.body.institutionId;
    if (!schoolId && req.user) {
      schoolId = req.user.institutionId || req.user.institution;
    }
    
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'School ID is required' });
    }
    
    req.params.schoolId = schoolId;
    console.log('[Subject Routes] Using schoolId:', schoolId);
    createSubject(req, res, next);
  } catch (err) {
    console.log('[Subject Routes] Error:', err);
    next(err);
  }
});

// CRUD Operations - ORDER MATTERS: specific routes FIRST
// Note: frontend calls /subjects/:schoolId, not /subjects/schools/:schoolId
router.post('/:schoolId', async (req, res, next) => {
  try {
    console.log('[Subject Routes] POST /:schoolId hit');
    console.log('[Subject Routes] Body:', req.body);
    const schoolId = req.params.schoolId || req.body.schoolId || req.user?.institutionId || req.user?.institution;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'School ID is required' });
    }
    req.params.schoolId = schoolId;
    createSubject(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.get('/:schoolId', getSubjects);  
router.get('/:schoolId/:subjectId', getSubjectById);
router.put('/:schoolId/:subjectId', authorize(['admin', 'principal', 'institution_admin']), updateSubject);
router.delete('/:schoolId/:subjectId', authorize(['super_admin', 'institution_admin']), deleteSubject);
router.get('/schools/:schoolId/statistics', authorize(['admin', 'principal']), getSubjectStatistics);  
router.get('/schools/:schoolId/active', getActiveSubjects);  
router.get('/schools/:schoolId/department/:department', getSubjectsByDepartment);  
router.get('/schools/:schoolId/type/:type', getSubjectsByType);  
router.get('/schools/:schoolId/status/:status', getSubjectsByStatus);  
router.get('/schools/:schoolId/search', searchSubjects);  

// Status Management (TESTED & VERIFIED)
router.patch('/schools/:schoolId/:subjectId/status', authorize(['admin', 'principal']), updateSubjectStatus);  
router.patch('/schools/:schoolId/:subjectId/archive', authorize(['admin', 'principal']), archiveSubject);  
router.patch('/schools/:schoolId/:subjectId/restore', authorize(['admin', 'principal']), restoreSubject);  

// Subject Relations (TESTED & VERIFIED)
router.get('/schools/:schoolId/:subjectId/teachers', getSubjectTeachers);  
router.get('/schools/:schoolId/:subjectId/students', getSubjectStudents);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/schools/:schoolId/bulk-update', authorize(['admin', 'principal']), bulkUpdateSubjects);  
router.post('/schools/:schoolId/bulk-delete', authorize(['super_admin']), bulkDeleteSubjects);  

// Export and Duplicate (TESTED & VERIFIED)
router.get('/schools/:schoolId/export', authorize(['admin', 'principal']), exportSubjects);  
router.post('/schools/:schoolId/:subjectId/duplicate', authorize(['admin', 'principal']), duplicateSubject);  

export default router;
