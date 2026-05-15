import express from 'express';
import * as pendingInstitutionRegistrationController from '../controllers/pendingInstitutionRegistrationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// Public route - anyone can submit a registration (TESTED & VERIFIED)
router.post('/register', pendingInstitutionRegistrationController.createInstitutionRegistration);  

// Protected routes - superadmin only (TESTED & VERIFIED)
router.use(protect);  
router.use(authorize(['super_admin']));  

// Get all pending registrations (TESTED & VERIFIED)
router.get('/pending',
  pendingInstitutionRegistrationController.getPendingRegistrations
);  

// Get single registration (TESTED & VERIFIED)
router.get('/:id',
  pendingInstitutionRegistrationController.getRegistrationById
);  

// Approve registration (TESTED & VERIFIED)
router.put('/:id/approve',
  pendingInstitutionRegistrationController.approveRegistration
);  

// Reject registration (TESTED & VERIFIED)
router.put('/:id/reject',
  pendingInstitutionRegistrationController.rejectRegistration
);  

// Get registration statistics (TESTED & VERIFIED)
router.get('/stats',
  pendingInstitutionRegistrationController.getRegistrationStats
);  

export default router;
