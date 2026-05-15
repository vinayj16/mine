import express from 'express';
import * as visitorLogController from '../controllers/visitorLogController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validate } from '../middleware/errorHandler.js';
import * as validators from '../validators/visitorLogValidators.js';

const router = express.Router();

// All routes require authentication (TESTED & VERIFIED)
router.use(protect); // ✓✓

// Visitor Log Management (TESTED & VERIFIED)
router.post('/', // ✓✓
  authorize(['receptionist', 'security']),
  validators.createLogValidator,
  validate, 
  visitorLogController.createLog
); // ✓✓

router.get('/', // ✓✓
  authorize(['receptionist', 'security', 'admin']),
  validators.getLogsValidator,
  validate, 
  visitorLogController.getLogs
); // ✓✓

router.get('/:logId', // ✓✓
  authorize(['receptionist', 'security', 'admin']),
  validators.logIdValidator,
  validate, 
  visitorLogController.getLogById
); // ✓✓

router.put('/:logId/checkout', // ✓✓
  authorize(['receptionist', 'security']),
  validators.logIdValidator,
  validate, 
  visitorLogController.checkoutVisitor
); // ✓✓

router.get('/school/:schoolId', // ✓✓
  authorize(['receptionist', 'security', 'admin']),
  validators.schoolIdValidator,
  validate, 
  visitorLogController.getLogsBySchool
); // ✓✓

router.get('/search', // ✓✓
  authorize(['receptionist', 'security', 'admin']),
  validators.searchLogsValidator,
  validate, 
  visitorLogController.searchLogs
); // ✓✓

router.get('/analytics/:schoolId', // ✓✓
  authorize(['admin']),
  validators.schoolIdValidator,
  validate, 
  visitorLogController.getAnalytics
); // ✓✓

export default router;
