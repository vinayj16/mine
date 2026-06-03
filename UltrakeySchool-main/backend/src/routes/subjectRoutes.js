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
    // Use institution from JWT first, fall back to query param (sent by frontend)
    const jwtInstitutionId = req.user?.institutionId || req.user?.institution;
    const queryInstitutionId = req.query.institutionId;
    const institutionId = jwtInstitutionId || queryInstitutionId;
    if (institutionId) {
      req.query.institutionId = institutionId;
      req.query.institutionId = institutionId;
    }
    console.log('[Subject Routes] GET / - using institutionId:', institutionId, '(from JWT:', !!jwtInstitutionId, '| from query:', !!queryInstitutionId, ')');
    getSubjects(req, res, next);
  } catch (err) {
    next(err);
  }
});  
router.post('/', async (req, res, next) => {
  try {
    console.log('[Subject Routes] POST / hit');
    
    let institutionId = req.body.institutionId || req.body.institutionId;
    if (!institutionId && req.user) {
      institutionId = req.user.institutionId || req.user.institution;
    }
    
    if (!institutionId) {
      return res.status(400).json({ success: false, message: 'School ID is required' });
    }
    
    req.params.institutionId = institutionId;
    console.log('[Subject Routes] Using institutionId:', institutionId);
    createSubject(req, res, next);
  } catch (err) {
    console.log('[Subject Routes] Error:', err);
    next(err);
  }
});

// CRUD Operations - ORDER MATTERS: specific routes FIRST
// Note: frontend calls /subjects/:institutionId, not /subjects/schools/:institutionId
router.post('/:institutionId', async (req, res, next) => {
  try {
    console.log('[Subject Routes] POST /:institutionId hit');
    console.log('[Subject Routes] Body:', req.body);
    const institutionId = req.params.institutionId || req.body.institutionId || req.user?.institutionId || req.user?.institution;
    if (!institutionId) {
      return res.status(400).json({ success: false, message: 'School ID is required' });
    }
    req.params.institutionId = institutionId;
    createSubject(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.get('/:institutionId', getSubjects);  
router.get('/:institutionId/:subjectId', getSubjectById);
router.put('/:institutionId/:subjectId', authorize(['admin', 'principal', 'institution_admin']), updateSubject);
router.delete('/:institutionId/:subjectId', authorize(['super_admin', 'institution_admin']), deleteSubject);
router.get('/schools/:institutionId/statistics', authorize(['admin', 'principal']), getSubjectStatistics);  
router.get('/schools/:institutionId/active', getActiveSubjects);  
router.get('/schools/:institutionId/department/:department', getSubjectsByDepartment);  
router.get('/schools/:institutionId/type/:type', getSubjectsByType);  
router.get('/schools/:institutionId/status/:status', getSubjectsByStatus);  
router.get('/schools/:institutionId/search', searchSubjects);  

// Status Management (TESTED & VERIFIED)
router.patch('/schools/:institutionId/:subjectId/status', authorize(['admin', 'principal']), updateSubjectStatus);  
router.patch('/schools/:institutionId/:subjectId/archive', authorize(['admin', 'principal']), archiveSubject);  
router.patch('/schools/:institutionId/:subjectId/restore', authorize(['admin', 'principal']), restoreSubject);  

// Subject Relations (TESTED & VERIFIED)
router.get('/schools/:institutionId/:subjectId/teachers', getSubjectTeachers);  
router.get('/schools/:institutionId/:subjectId/students', getSubjectStudents);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/schools/:institutionId/bulk-update', authorize(['admin', 'principal']), bulkUpdateSubjects);  
router.post('/schools/:institutionId/bulk-delete', authorize(['super_admin']), bulkDeleteSubjects);  

// Export and Duplicate (TESTED & VERIFIED)
router.get('/schools/:institutionId/export', authorize(['admin', 'principal']), exportSubjects);  
router.post('/schools/:institutionId/:subjectId/duplicate', authorize(['admin', 'principal']), duplicateSubject);  

export default router;
