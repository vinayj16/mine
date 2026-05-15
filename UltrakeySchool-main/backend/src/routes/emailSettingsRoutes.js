import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import emailSettingsController from '../controllers/emailSettingsController.js';

const {
  getEmailSettings,
  updatePhpMailerSettings,
  updateSmtpSettings,
  updateGoogleSettings,
  toggleProvider,
  testEmailConnection
} = emailSettingsController;

const router = express.Router();

// All email settings routes require authentication (TESTED & VERIFIED)
router.use(protect);

// Get email settings (TESTED & VERIFIED)
router.get('/', authorize(['admin', 'principal', 'super_admin']), getEmailSettings);  

// Update specific provider settings (TESTED & VERIFIED)
router.put('/phpmailer', authorize(['admin', 'principal', 'super_admin']), updatePhpMailerSettings);  
router.put('/smtp', authorize(['admin', 'principal', 'super_admin']), updateSmtpSettings);  
router.put('/google', authorize(['admin', 'principal', 'super_admin']), updateGoogleSettings);  

// Toggle provider (TESTED & VERIFIED)
router.patch('/toggle', authorize(['admin', 'principal', 'super_admin']), toggleProvider);  

// Test email connection (TESTED & VERIFIED)
router.post('/test/:provider', authorize(['admin', 'principal', 'super_admin']), testEmailConnection);  

export default router;
