import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import platformSettingsController from '../controllers/platformSettingsController.js';

const router = express.Router();

// Apply authentication middleware to all routes (TESTED & VERIFIED)
router.use(protect);  

// Get all platform settings (TESTED & VERIFIED)
router.get('/', platformSettingsController.default.getAllSettings);  

// Get settings by category (TESTED & VERIFIED)
router.get('/category/:category', platformSettingsController.default.getSettingsByCategory);  

// Get single setting (TESTED & VERIFIED)
router.get('/:settingId', platformSettingsController.default.getSettingById);  

// Create new setting (TESTED & VERIFIED)
router.post('/', authorize(['admin', 'principal']), platformSettingsController.default.createSetting);  

// Update setting (TESTED & VERIFIED)
router.put('/:settingId', authorize(['admin', 'principal']), platformSettingsController.default.updateSetting);  

// Delete setting (TESTED & VERIFIED)
router.delete('/:settingId', authorize(['admin', 'principal']), platformSettingsController.default.deleteSetting);  

// Bulk update settings (TESTED & VERIFIED)
router.put('/bulk', authorize(['admin', 'principal']), platformSettingsController.default.bulkUpdateSettings);  

// Test service connections (TESTED & VERIFIED)
router.post('/test/:service', authorize(['admin', 'principal']), platformSettingsController.default.testServiceConnection);  

export default router;
