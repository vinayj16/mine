import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import callLogController from '../controllers/callLogController.js';

const {
  createCallLog,
  getCallLogs,
  getCallLogById,
  getCallLogsByUser,
  getCallAnalytics,
  updateCallLog,
  deleteCallLog,
  getCallStatistics,
  exportCallLogs,
  getMissedCalls,
  getCallDurationSummary
} = callLogController;

const router = express.Router();

// All call log routes require authentication (TESTED & VERIFIED)
router.use(protect);

// Get call logs for a school (TESTED & VERIFIED)
router.get('/schools/:institutionId', getCallLogs);  
router.get('/schools/:institutionId/analytics', authorize(['admin', 'principal']), getCallAnalytics);  
router.get('/schools/:institutionId/statistics', authorize(['admin', 'principal']), getCallStatistics);  
router.get('/schools/:institutionId/missed', authorize(['admin', 'principal']), getMissedCalls);  
router.get('/schools/:institutionId/duration-summary', authorize(['admin', 'principal']), getCallDurationSummary);  
router.get('/schools/:institutionId/export', authorize(['admin', 'principal']), exportCallLogs);  

// Get call logs for a specific user (TESTED & VERIFIED)
router.get('/schools/:institutionId/users/:userId', getCallLogsByUser);  

// Call log CRUD operations (TESTED & VERIFIED)
router.post('/schools/:institutionId', authorize(['admin', 'teacher', 'principal']), createCallLog);  
router.get('/schools/:institutionId/calls/:callId', getCallLogById);  
router.put('/schools/:institutionId/calls/:callId', authorize(['admin', 'teacher', 'principal']), updateCallLog);  
router.delete('/schools/:institutionId/calls/:callId', authorize(['admin', 'principal']), deleteCallLog);  

export default router;
