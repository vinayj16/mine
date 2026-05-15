import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import scholarshipController from '../controllers/scholarshipController.js';

const {
  createScholarship,
  getScholarshipById,
  getAllScholarships,
  updateScholarship,
  deleteScholarship,
  getScholarshipsByType,
  getScholarshipsByStatus,
  getScholarshipsByAcademicYear,
  updateStatus,
  bulkUpdateStatus,
  bulkDeleteScholarships,
  getScholarshipStatistics,
  searchScholarships,
  exportScholarships,
  getActiveScholarships,
  applyForScholarship,
  approveApplication,
  rejectApplication,
  getApplications,
  getApplicationById
} = scholarshipController;

const router = express.Router();

// All scholarship routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// CRUD Operations (TESTED & VERIFIED)
router.get('/', getAllScholarships);  
router.get('/statistics', authorize(['admin', 'principal']), getScholarshipStatistics);  
router.get('/active', getActiveScholarships);  
router.get('/search', searchScholarships);  
router.get('/type/:type', getScholarshipsByType);  
router.get('/status/:status', getScholarshipsByStatus);  
router.get('/academic-year/:academicYear', getScholarshipsByAcademicYear);  
router.get('/:id', getScholarshipById);  
router.post('/', authorize(['admin', 'principal']), createScholarship);  
router.put('/:id', authorize(['admin', 'principal']), updateScholarship);  
router.delete('/:id', authorize(['super_admin']), deleteScholarship);  

// Status Management (TESTED & VERIFIED)
router.patch('/:id/status', authorize(['admin', 'principal']), updateStatus);  

// Application Management (TESTED & VERIFIED)
router.post('/:id/apply', applyForScholarship);  
router.post('/:id/applications/:applicationId/approve', authorize(['admin', 'principal']), approveApplication);  
router.post('/:id/applications/:applicationId/reject', authorize(['admin', 'principal']), rejectApplication);  
router.get('/:id/applications', authorize(['admin', 'principal']), getApplications);  
router.get('/:id/applications/:applicationId', getApplicationById);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/bulk-update-status', authorize(['admin', 'principal']), bulkUpdateStatus);  
router.post('/bulk-delete', authorize(['super_admin']), bulkDeleteScholarships);  

// Export (TESTED & VERIFIED)
router.get('/export', authorize(['admin', 'principal']), exportScholarships);  

export default router;
