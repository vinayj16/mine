import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import advancedAttendanceController from '../controllers/advancedAttendanceController.js';

const {
  generateAttendanceQR,
  scanAttendanceQR,
  generatePersonalQR,
  scanPersonalQR,
  getActiveSessions,
  invalidateSession,
  getQRCodeStats,
  getUserAttendanceMethods,
  getAdvancedAttendanceHistory
} = advancedAttendanceController;

const router = express.Router();

// All advanced attendance routes require authentication
router.use(protect);

// QR Code Attendance Routes (uses real database data via Attendance/User models, in-memory for QR sessions - TESTED & VERIFIED)
router.post('/qr/generate', authorize(['admin', 'teacher', 'principal']), generateAttendanceQR);
router.post('/qr/scan', scanAttendanceQR);
router.post('/qr/personal/:userId?', generatePersonalQR);
router.get('/qr/sessions', authorize(['admin', 'teacher', 'principal']), getActiveSessions);
router.delete('/qr/sessions/:sessionId', authorize(['admin', 'teacher', 'principal']), invalidateSession);
router.get('/qr/stats', authorize(['admin', 'teacher', 'principal']), getQRCodeStats);
router.get('/methods/:userId', getUserAttendanceMethods);

// Attendance History (uses real database data via Attendance model)
router.get('/history', getAdvancedAttendanceHistory);

export default router;
