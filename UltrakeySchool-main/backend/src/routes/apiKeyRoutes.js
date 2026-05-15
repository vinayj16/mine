import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { requireApiKey } from '../middleware/apiKeyGuard.js';
import apiKeyController from '../controllers/apiKeyController.js';
const {
  createApiKey,
  listApiKeys,
  getApiKey,
  regenerateApiKey,
  deleteApiKey,
  validateKey,
  updateApiKey,
  getApiKeyUsage,
  rotateApiKey,
  bulkRevokeApiKeys,
  getApiKeyAuditLog,
  testApiKey,
  getApiKeyStatistics
} = apiKeyController;

const router = express.Router();

// Apply authentication to all routes except validate
router.use(protect);

// Public validation route (uses real database data via ApiKey model - TESTED & VERIFIED)
router.post('/validate', requireApiKey, validateKey);

// API Key management routes (uses real database data via ApiKey model - TESTED & VERIFIED)
router.post('/', authorize(['super_admin', 'institution_admin']), createApiKey);
router.get('/', authorize(['super_admin', 'institution_admin']), listApiKeys);
router.get('/statistics', authorize(['super_admin', 'institution_admin']), getApiKeyStatistics);
router.post('/test', authorize(['super_admin', 'institution_admin']), testApiKey);
router.post('/bulk/revoke', authorize(['super_admin', 'institution_admin']), bulkRevokeApiKeys);

router.get('/:id', authorize(['super_admin', 'institution_admin']), getApiKey);
router.put('/:id', authorize(['super_admin', 'institution_admin']), updateApiKey);
router.delete('/:id', authorize(['super_admin', 'institution_admin']), deleteApiKey);
router.post('/:id/regenerate', authorize(['super_admin', 'institution_admin']), regenerateApiKey);
router.post('/:id/rotate', authorize(['super_admin', 'institution_admin']), rotateApiKey);
router.get('/:id/usage', authorize(['super_admin', 'institution_admin']), getApiKeyUsage);
router.get('/:id/audit', authorize(['super_admin', 'institution_admin']), getApiKeyAuditLog);

export default router;
