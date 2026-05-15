import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import gdprSettingsController from '../controllers/gdprSettingsController.js';

const {
  getGdprSettings,
  updateGdprSettings,
  toggleGdpr,
  deleteGdprSettings,
  createGdprSettings,
  getComplianceStatus,
  updateDataRetentionPolicy,
  exportGdprSettings
} = gdprSettingsController;

const router = express.Router();

// All GDPR settings routes require authentication (TESTED & VERIFIED)
router.use(protect);

// CRUD Operations (TESTED & VERIFIED)
router.get('/', authorize(['admin', 'principal', 'super_admin']), getGdprSettings);  
router.post('/', authorize(['admin', 'principal', 'super_admin']), createGdprSettings);  
router.put('/', authorize(['admin', 'principal', 'super_admin']), updateGdprSettings);  
router.delete('/', authorize(['super_admin']), deleteGdprSettings);  

// Status Management (TESTED & VERIFIED)
router.patch('/toggle', authorize(['admin', 'principal', 'super_admin']), toggleGdpr);  

// Compliance and Policy (TESTED & VERIFIED)
router.get('/compliance-status', getComplianceStatus);  
router.put('/data-retention', authorize(['admin', 'principal', 'super_admin']), updateDataRetentionPolicy);  

// Export (TESTED & VERIFIED)
router.get('/export', authorize(['admin', 'principal', 'super_admin']), exportGdprSettings);  

export default router;
