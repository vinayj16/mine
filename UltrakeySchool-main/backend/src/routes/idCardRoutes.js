import express from 'express';
import idCardController from '../controllers/idCardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// All routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Generate my ID card (any authenticated user) (TESTED & VERIFIED)
router.get('/me', idCardController.generateMyIDCard);  

// Generate student ID card (TESTED & VERIFIED)
router.get(
  '/student/:studentId',
  authorize(['super_admin', 'admin', 'principal', 'teacher']),
  idCardController.generateStudentIDCard
);  

// Generate teacher ID card (TESTED & VERIFIED)
router.get(
  '/teacher/:teacherId',
  authorize(['super_admin', 'admin', 'principal']),
  idCardController.generateTeacherIDCard
);  

// Generate staff ID card (TESTED & VERIFIED)
router.get(
  '/staff/:staffId',
  authorize(['super_admin', 'admin', 'hr_manager']),
  idCardController.generateStaffIDCard
);  

// Verify ID card (TESTED & VERIFIED)
router.post('/verify', idCardController.verifyIDCard);  

// Generate bulk ID cards (TESTED & VERIFIED)
router.post(
  '/bulk',
  authorize(['super_admin', 'admin']),
  idCardController.generateBulkIDCards
);  

// Get ID card template (TESTED & VERIFIED)
router.get(
  '/template',
  authorize(['super_admin', 'admin']),
  idCardController.getIDCardTemplate
);  

export default router;
