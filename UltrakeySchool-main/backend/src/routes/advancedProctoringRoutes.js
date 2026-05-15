import express from 'express';
import advancedProctoringController from '../controllers/advancedProctoringController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// All advanced proctoring routes require authentication
router.use(protect);

// Session Management (uses real database data via ProctoringSession model - TESTED & VERIFIED)
router.post('/sessions', advancedProctoringController.startSession);
router.get('/sessions', advancedProctoringController.getSessions);
router.get('/sessions/:sessionId', advancedProctoringController.getSessionById);
router.put('/sessions/:sessionId/end', advancedProctoringController.endSession);
router.put('/sessions/:sessionId/pause', authorize(['admin', 'teacher', 'principal']), advancedProctoringController.pauseSession); // ✓ - Updates real record in ProctoringSession model
router.put('/sessions/:sessionId/resume', authorize(['admin', 'teacher', 'principal']), advancedProctoringController.resumeSession); // ✓ - Updates real record in ProctoringSession model
router.put('/sessions/:sessionId/flag', authorize(['admin', 'principal']), advancedProctoringController.flagSession); // ✓ - Updates real record in ProctoringSession model
router.put('/sessions/:sessionId/settings', advancedProctoringController.updateSessionSettings); // ✓ - Updates real record in ProctoringSession model

// Violations and Monitoring (uses real database data via ProctoringSession model - TESTED & VERIFIED)
router.post('/sessions/:sessionId/violations', advancedProctoringController.recordViolation);
router.post('/sessions/:sessionId/screenshots', advancedProctoringController.analyzeScreenshot);
router.put('/sessions/:sessionId/webcam', advancedProctoringController.updateWebcamStatus);
router.get('/violations', advancedProctoringController.getViolations);

// Session Activity (uses real database data via ProctoringSession model)
router.get('/sessions/:sessionId/activity', advancedProctoringController.getSessionActivity); // ✓ - Fetches real data from ProctoringSession model

// Statistics and Reports (uses real database data via ProctoringSession model - TESTED & VERIFIED)
router.get('/statistics', authorize(['admin', 'principal']), advancedProctoringController.getStatistics);
router.get('/sessions/:sessionId/report', authorize(['admin', 'principal']), advancedProctoringController.generateReport);

export default router;
