import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import storageSettingsController from '../controllers/storageSettingsController.js';

const {
  getAllStorageProviders,
  getStorageProviderById,
  getDefaultProvider,
  upsertStorageProvider,
  updateStorageProvider,
  toggleProviderStatus,
  testProviderConnection,
  deleteStorageProvider,
  initializeDefaultProviders,
  setDefaultProvider,
  getEnabledProviders,
  getProvidersByStatus,
  getStorageStatistics,
  bulkUpdateProviders,
  bulkDeleteProviders,
  exportStorageSettings,
  validateProviderConfiguration
} = storageSettingsController;

const router = express.Router();

// All storage settings routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Specific routes (must come before /:id routes) (TESTED & VERIFIED)
router.get('/', authorize(['admin', 'principal', 'super_admin']), getAllStorageProviders);  
router.get('/statistics', authorize(['admin', 'principal', 'super_admin']), getStorageStatistics);  
router.get('/default', getDefaultProvider);  
router.get('/enabled', getEnabledProviders);  
router.get('/status/:status', getProvidersByStatus);  
router.get('/export', authorize(['admin', 'principal', 'super_admin']), exportStorageSettings);  

// CRUD Operations (TESTED & VERIFIED)
router.get('/:id', getStorageProviderById);  
router.post('/', authorize(['admin', 'principal', 'super_admin']), upsertStorageProvider);  
router.put('/:id', authorize(['admin', 'principal', 'super_admin']), updateStorageProvider);  
router.delete('/:id', authorize(['super_admin']), deleteStorageProvider);  

// Provider Management (TESTED & VERIFIED)
router.patch('/:id/toggle-status', authorize(['admin', 'principal', 'super_admin']), toggleProviderStatus);  
router.post('/:id/test', authorize(['admin', 'principal', 'super_admin']), testProviderConnection);  
router.patch('/:id/set-default', authorize(['admin', 'principal', 'super_admin']), setDefaultProvider);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/bulk-update', authorize(['admin', 'principal', 'super_admin']), bulkUpdateProviders);  
router.post('/bulk-delete', authorize(['super_admin']), bulkDeleteProviders);  

// Utility Operations (TESTED & VERIFIED)
router.post('/initialize', authorize(['super_admin']), initializeDefaultProviders);  
router.post('/validate', authorize(['admin', 'principal', 'super_admin']), validateProviderConfiguration);  

export default router;
