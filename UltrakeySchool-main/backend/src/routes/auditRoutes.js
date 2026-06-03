import express from 'express';
import {
  getAuditLogs,
  getAuditLogById,
  createAuditLog,
  deleteAuditLog,
  getAuditLogSummary
} from '../controllers/auditController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAuditLogs);
router.get('/summary', getAuditLogSummary);
router.get('/:id', getAuditLogById);
router.post('/', createAuditLog);
router.delete('/:id', deleteAuditLog);

export default router;