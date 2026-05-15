import express from 'express';
import transportFeeController from '../controllers/transportFeeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const {
  createTransportFee,
  getStudentTransportFees,
  getTransportFees,
  payTransportFee,
  getTransportFeeById,
  updateTransportFee,
  deleteTransportFee,
  getTransportFeeStats
} = transportFeeController;

const router = express.Router();

// All routes require authentication
router.use(protect);

// Statistics (accessible by admin, accountant, principal)
router.get('/stats', authorize(['admin', 'accountant', 'principal', 'superadmin', 'institution_admin']), getTransportFeeStats);

// Get all transport fees (accessible by admin, accountant, principal)
router.get('/', authorize(['admin', 'accountant', 'principal', 'superadmin', 'institution_admin']), getTransportFees);

// Create transport fee (accessible by admin, accountant)
router.post('/', authorize(['admin', 'accountant', 'superadmin', 'institution_admin']), createTransportFee);

// Get student transport fees (accessible by student, parent, admin, accountant)
router.get('/student/:studentId', getStudentTransportFees);

// Get transport fee by ID
router.get('/:feeId', getTransportFeeById);

// Pay transport fee (accessible by student, parent, accountant)
router.post('/:feeId/pay', payTransportFee);

// Update transport fee (accessible by admin, accountant)
router.put('/:feeId', authorize(['admin', 'accountant', 'superadmin', 'institution_admin']), updateTransportFee);

// Delete transport fee (accessible by admin)
router.delete('/:feeId', authorize(['admin', 'superadmin', 'institution_admin']), deleteTransportFee);

export default router;
