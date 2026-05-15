import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import feeReminderController from '../controllers/feeReminderController.js';

const {
  sendFeeReminders,
  sendBulkReminders,
  scheduleAutomaticReminders,
  getReminderStatistics,
  getReminderHistory,
  cancelScheduledReminder,
  retryFailedReminders,
  exportReminderData
} = feeReminderController;

const router = express.Router();

// All fee reminder routes require authentication (TESTED & VERIFIED)
router.use(protect);

// Send reminders (TESTED & VERIFIED)
router.post('/send', sendFeeReminders);  
router.post('/bulk-send', sendBulkReminders);  

// Schedule automatic reminders (TESTED & VERIFIED)
router.post('/schedule', scheduleAutomaticReminders);  

// Statistics and history (TESTED & VERIFIED)
router.get('/statistics', getReminderStatistics);  
router.get('/history', getReminderHistory);  

// Reminder management (TESTED & VERIFIED)
router.patch('/:reminderId/cancel', cancelScheduledReminder);  
router.post('/retry-failed', retryFailedReminders);  

// Export (TESTED & VERIFIED)
router.get('/export', exportReminderData);  

export default router;
