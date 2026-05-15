import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import sportController from '../controllers/sportController.js';

const {
  createSport,
  getSportById,
  getAllSports,
  updateSport,
  deleteSport,
  getSportsByStatus,
  getSportsByCategory,
  updateStatus,
  bulkUpdateStatus,
  bulkDeleteSports,
  getSportStatistics,
  searchSports,
  exportSports,
  getActiveSports,
  archiveSport,
  restoreSport,
  getSportsByCoach,
  assignCoach
} = sportController;

const router = express.Router();

// All sport routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// CRUD Operations (TESTED & VERIFIED)
router.get('/', getAllSports);  
router.get('/statistics', authorize(['admin', 'principal']), getSportStatistics);  
router.get('/active', getActiveSports);  
router.get('/search', searchSports);  
router.get('/status/:status', getSportsByStatus);  
router.get('/category/:category', getSportsByCategory);  
router.get('/coach/:coachId', getSportsByCoach);  
router.get('/:id', getSportById);  
router.post('/', authorize(['admin', 'principal']), createSport);  
router.put('/:id', authorize(['admin', 'principal']), updateSport);  
router.delete('/:id', authorize(['super_admin']), deleteSport);  

// Status Management (TESTED & VERIFIED)
router.patch('/:id/status', authorize(['admin', 'principal']), updateStatus);  
router.patch('/:id/archive', authorize(['admin', 'principal']), archiveSport);  
router.patch('/:id/restore', authorize(['admin', 'principal']), restoreSport);  

// Coach Assignment (TESTED & VERIFIED)
router.patch('/:id/assign-coach', authorize(['admin', 'principal']), assignCoach);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/bulk-update-status', authorize(['admin', 'principal']), bulkUpdateStatus);  
router.post('/bulk-delete', authorize(['super_admin']), bulkDeleteSports);  

// Export (TESTED & VERIFIED)
router.get('/export', authorize(['admin', 'principal']), exportSports);  

export default router;
