import express from 'express';
import planChangeRequestController from '../controllers/planChangeRequestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// All routes require authentication and tenant validation
router.use(protect);
router.use(validateTenantAccess);

// Get all plan change requests
router.get('/', planChangeRequestController.getPlanChangeRequests);

// Get single plan change request
router.get('/:id', planChangeRequestController.getPlanChangeRequestById);

// Create plan change request
router.post('/', authorize(['admin', 'institution_admin']), planChangeRequestController.createPlanChangeRequest);

// Approve plan change request
router.post('/:id/approve', authorize(['superadmin', 'admin']), planChangeRequestController.approvePlanChangeRequest);

// Reject plan change request
router.post('/:id/reject', authorize(['superadmin', 'admin']), planChangeRequestController.rejectPlanChangeRequest);

// Complete plan change request
router.post('/:id/complete', authorize(['superadmin', 'admin']), planChangeRequestController.completePlanChangeRequest);

// Cancel plan change request
router.post('/:id/cancel', authorize(['admin', 'institution_admin']), planChangeRequestController.cancelPlanChangeRequest);

export default router;
