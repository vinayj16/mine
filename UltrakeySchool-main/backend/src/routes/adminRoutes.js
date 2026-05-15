import express from 'express';
import adminController from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

router.use(protect);

// Account request management routes (uses in-memory mock data - TODO: Replace with database)
router.get('/account-requests', adminController.getAccountRequests); // ✓ - Uses in-memory mock data
router.patch('/account-requests/:id/approve', adminController.approveAccountRequest);
router.patch('/account-requests/:id/reject', adminController.rejectAccountRequest);

// User management routes (uses real database data via UserCredential model - TESTED & VERIFIED)
router.post('/create-credentials', adminController.createCredentials);
router.post('/login', adminController.loginWithCredentials);
router.get('/credentials', adminController.getAllCredentials);

// Support and communication routes (uses emailService - external service)
router.post('/support', adminController.sendSupportEmail); // ✓ - Sends email via emailService

export default router;