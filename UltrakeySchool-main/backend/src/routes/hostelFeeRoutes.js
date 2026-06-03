import express from 'express';
import hostelFeeController from '../controllers/hostelFeeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';
import { authorize } from '../middleware/authGuard.js';

const {
  createHostelFee,
  listHostelFees,
  getHostelFeeById,
  updateHostelFee,
  deleteHostelFee,
  payHostelFee,
  getOverdueFees,
  getFeeStatistics,
  bulkCreateFees,
  exportFees
} = hostelFeeController;

const router = express.Router();

// All routes require authentication and tenant validation
router.use(protect);
router.use(validateTenantAccess);

// Statistics (accessible by admin, accountant, principal, superadmin, institution_admin)
router.get('/stats', authorize(['admin', 'accountant', 'principal', 'superadmin', 'institution_admin']), getFeeStatistics);

// Overdue fees
router.get('/overdue', authorize(['admin', 'accountant', 'principal', 'superadmin', 'institution_admin']), getOverdueFees);

// Export fees
router.get('/export', authorize(['admin', 'accountant', 'principal', 'superadmin', 'institution_admin']), exportFees);

// Bulk create fees
router.post('/bulk', authorize(['admin', 'accountant', 'superadmin', 'institution_admin']), bulkCreateFees);

// Get all hostel fees (accessible by admin, accountant, principal, superadmin, institution_admin)
router.get('/', authorize(['admin', 'accountant', 'principal', 'superadmin', 'institution_admin']), listHostelFees);

// Create hostel fee (accessible by admin, accountant)
router.post('/', authorize(['admin', 'accountant', 'superadmin', 'institution_admin']), createHostelFee);

// Get hostel fee by ID
router.get('/:id', getHostelFeeById);

// Pay hostel fee (accessible by student, parent, accountant)
router.post('/:id/pay', payHostelFee);

// Update hostel fee (accessible by admin, accountant)
router.put('/:id', authorize(['admin', 'accountant', 'superadmin', 'institution_admin']), updateHostelFee);

// Delete hostel fee (accessible by admin, superadmin, institution_admin)
router.delete('/:id', authorize(['admin', 'superadmin', 'institution_admin']), deleteHostelFee);

export default router;
