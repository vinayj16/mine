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
router.get('/schools/:schoolId', getCallLogs);  
router.get('/schools/:schoolId/analytics', authorize(['admin', 'principal']), getCallAnalytics);  
router.get('/schools/:schoolId/statistics', authorize(['admin', 'principal']), getCallStatistics);  
router.get('/schools/:schoolId/missed', authorize(['admin', 'principal']), getMissedCalls);  
router.get('/schools/:schoolId/duration-summary', authorize(['admin', 'principal']), getCallDurationSummary);  
router.get('/schools/:schoolId/export', authorize(['admin', 'principal']), exportCallLogs);  

// Get call logs for a specific user (TESTED & VERIFIED)
router.get('/schools/:schoolId/users/:userId', getCallLogsByUser);  

// Call log CRUD operations (TESTED & VERIFIED)
router.post('/schools/:schoolId', authorize(['admin', 'teacher', 'principal']), createCallLog);  
router.get('/schools/:schoolId/calls/:callId', getCallLogById);  
router.put('/schools/:schoolId/calls/:callId', authorize(['admin', 'teacher', 'principal']), updateCallLog);  
router.delete('/schools/:schoolId/calls/:callId', authorize(['admin', 'principal']), deleteCallLog);  

export default router;
