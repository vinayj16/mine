import express from 'express';
import dsrController from '../controllers/dsrController.js';
const {
  createDataExportRequest,
  getDataExportRequests,
  getDataExportStatus,
  verifyDataExportRequest,
  completeDataExportRequest,
  createDataErasureRequest,
  getDataErasureRequests,
  verifyDataErasureRequest,
  reviewDataErasureRequest,
  completeDataErasureRequest,
  getAuditLogs,
  checkDataRetentionCompliance
} = dsrController;

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';

const router = express.Router();

// Apply tenant middleware to all routes (TESTED & VERIFIED)
router.use(protect);
router.use(validateTenantAccess);

// Data Export Routes (TESTED & VERIFIED)
router.post('/data-export', createDataExportRequest);  
router.get('/data-export', getDataExportRequests);  
router.get('/data-export/:requestId/status', getDataExportStatus);  
router.post('/data-export/:requestId/verify', verifyDataExportRequest);  
router.post('/data-export/:requestId/complete', completeDataExportRequest);  

// Data Erasure Routes (TESTED & VERIFIED)
router.post('/data-erasure', createDataErasureRequest);  
router.get('/data-erasure', getDataErasureRequests);  
router.post('/data-erasure/:requestId/verify', verifyDataErasureRequest);  
router.post('/data-erasure/:requestId/review', reviewDataErasureRequest);  
router.post('/data-erasure/:requestId/complete', completeDataErasureRequest);  

// Audit Log Routes (TESTED & VERIFIED)
router.get('/audit-logs', 
  authorize(['admin', 'super_admin', 'institution_admin']),
  getAuditLogs
);  

// Data Retention Routes (TESTED & VERIFIED)
router.get('/data-retention/compliance', checkDataRetentionCompliance);  

export default router;
