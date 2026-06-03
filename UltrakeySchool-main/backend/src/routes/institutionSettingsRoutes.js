import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';
import {
  getInstitutionSettings,
  updateInstitutionProfile,
  updateBranding,
  getPublicBranding,
  updateEmailConfig,
  updatePaymentGateway,
  updateSupport,
  getLoginActivity,
  trackLogin
} from '../controllers/institutionSettingsController.js';

const router = express.Router();

// Public route — login screen & email renderers can fetch branding without auth
router.get('/:id/branding/public', getPublicBranding);

// All routes below require authentication
router.use(protect);
router.use(validateTenantAccess);

// Settings bundle (single fetch for the settings page)
router.get('/:id/settings', authorize(['admin', 'institution_admin', 'principal', 'superadmin']), getInstitutionSettings);

// Profile / Branding
router.put('/:id/profile', authorize(['admin', 'institution_admin', 'principal', 'superadmin']), updateInstitutionProfile);
router.put('/:id/branding', authorize(['admin', 'institution_admin', 'principal', 'superadmin']), updateBranding);

// Email / SMTP configuration (institution-scoped)
router.put('/:id/email-config', authorize(['admin', 'institution_admin', 'principal', 'superadmin']), updateEmailConfig);

// Payment gateway (institution-scoped)
router.put('/:id/payment-gateway', authorize(['admin', 'institution_admin', 'principal', 'superadmin']), updatePaymentGateway);

// Support contact
router.put('/:id/support', authorize(['admin', 'institution_admin', 'principal', 'superadmin']), updateSupport);

// Login activity
router.get('/:id/login-activity', authorize(['admin', 'institution_admin', 'principal', 'superadmin']), getLoginActivity);
router.post('/:id/track-login', trackLogin); // any authenticated user can self-report their own login

export default router;

