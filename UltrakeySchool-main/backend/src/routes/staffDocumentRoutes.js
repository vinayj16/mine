import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import staffDocumentController from '../controllers/staffDocumentController.js';

const {
  upload,
  createStaffDocument,
  getStaffDocumentById,
  getAllStaffDocuments,
  updateStaffDocument,
  deleteStaffDocument,
  downloadStaffDocument,
  getStaffDocumentsByStatus,
  getStaffDocumentsByStaff,
  getStaffDocumentsByType,
  updateStaffDocumentStatus,
  bulkUpdateStaffDocumentStatus,
  bulkDeleteStaffDocuments,
  getStaffDocumentStatistics,
  searchStaffDocuments,
  exportStaffDocuments,
  getExpiringStaffDocuments,
  getExpiredStaffDocuments,
  archiveStaffDocument,
  restoreStaffDocument
} = staffDocumentController;

const router = express.Router();

// All staff document routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Specific routes (must come before /:id routes) (TESTED & VERIFIED)
router.get('/statistics', authorize(['admin', 'principal']), getStaffDocumentStatistics);  
router.get('/search', searchStaffDocuments);  
router.get('/export', authorize(['admin', 'principal']), exportStaffDocuments);  
router.get('/expiring', getExpiringStaffDocuments);  
router.get('/expired', getExpiredStaffDocuments);  
router.get('/status/:status', getStaffDocumentsByStatus);  
router.get('/staff/:staffId', getStaffDocumentsByStaff);  
router.get('/type/:documentType', getStaffDocumentsByType);  

// CRUD Operations (TESTED & VERIFIED)
router.get('/', getAllStaffDocuments);  
router.get('/:id', getStaffDocumentById);  
router.post('/', authorize(['admin', 'principal', 'staff']), upload, createStaffDocument);  
router.put('/:id', authorize(['admin', 'principal', 'staff']), updateStaffDocument);  
router.delete('/:id', authorize(['admin', 'principal']), deleteStaffDocument);  

// File Operations (TESTED & VERIFIED)
router.get('/:id/download', downloadStaffDocument);  

// Status Management (TESTED & VERIFIED)
router.patch('/:id/status', authorize(['admin', 'principal']), updateStaffDocumentStatus);  
router.patch('/:id/archive', authorize(['admin', 'principal']), archiveStaffDocument);  
router.patch('/:id/restore', authorize(['admin', 'principal']), restoreStaffDocument);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/bulk-update-status', authorize(['admin', 'principal']), bulkUpdateStaffDocumentStatus);  
router.post('/bulk-delete', authorize(['super_admin']), bulkDeleteStaffDocuments);  

export default router;
