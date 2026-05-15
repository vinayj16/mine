import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import branchController from '../controllers/branchController.js';

const {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getBranchesByInstitution,
  getBranchesByStatus,
  searchBranches,
  getBranchStatistics,
  updateBranchCounts,
  suspendBranch,
  activateBranch,
  addTag,
  removeTag,
  getBranchDashboard,
  bulkDelete
} = branchController;

const router = express.Router();

// All branch routes require authentication (TESTED & VERIFIED)
router.use(protect);

// CRUD Operations (TESTED & VERIFIED)
router.get('/', getBranches);
router.get('/search', searchBranches);  
router.get('/dashboard', authorize(['admin', 'principal', 'super_admin', 'institution_owner']), getBranchDashboard);  
router.get('/statistics/:id', getBranchStatistics);  
router.get('/institution/:institutionId', getBranchesByInstitution);  
router.get('/status/:status', getBranchesByStatus);  
router.get('/:id', getBranchById);  
router.post('/', authorize(['admin', 'principal', 'super_admin']), createBranch);  
router.put('/:id', authorize(['admin', 'principal', 'super_admin']), updateBranch);  
router.delete('/:id', authorize(['admin', 'principal', 'super_admin']), deleteBranch);  

// Branch Management (TESTED & VERIFIED)
router.patch('/:id/counts', authorize(['admin', 'principal', 'super_admin']), updateBranchCounts);  
router.patch('/:id/suspend', authorize(['admin', 'principal', 'super_admin']), suspendBranch);  
router.patch('/:id/activate', authorize(['admin', 'principal', 'super_admin']), activateBranch);  
router.post('/:id/tags', authorize(['admin', 'principal', 'super_admin']), addTag);  
router.delete('/:id/tags', authorize(['admin', 'principal', 'super_admin']), removeTag);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/bulk-delete', authorize(['admin', 'principal', 'super_admin']), bulkDelete);  

export default router;
