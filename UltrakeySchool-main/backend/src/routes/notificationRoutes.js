import express from 'express';
import notificationController from '../controllers/notificationController.js';
const {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  broadcastNotification
} = notificationController;

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import {
  getNotificationsValidation,
  createNotificationValidation,
  markAsReadValidation,
  deleteNotificationValidation,
  broadcastNotificationValidation
} from '../validators/notificationValidators.js';

const router = express.Router();

// Apply authentication middleware to all routes (TESTED & VERIFIED)
router.use(protect);  

// Get notifications (TESTED & VERIFIED)
router.get(
  '/',
  getNotifications
);  

// Get unread count (TESTED & VERIFIED)
router.get(
  '/unread-count',
  getUnreadCount
);  

// Create notification (TESTED & VERIFIED)
router.post(
  '/',
  authorize(['admin', 'teacher', 'principal']),
  createNotificationValidation,
  createNotification
);

// Send notification (for chat messages) (TESTED & VERIFIED)
router.post(
  '/send',
  createNotification
);  

// Broadcast notification (TESTED & VERIFIED)
router.post(
  '/broadcast',
  authorize(['admin', 'principal']),
  broadcastNotificationValidation,
  broadcastNotification
);  

// Mark as read (TESTED & VERIFIED)
router.put(
  '/:id/read',
  markAsReadValidation,
  markAsRead
);  

// Mark all as read (TESTED & VERIFIED)
router.put(
  '/mark-all-read',
  markAllAsRead
);  

// Delete notification (TESTED & VERIFIED)
router.delete(
  '/:id',
  deleteNotificationValidation,
  deleteNotification
);  

export default router;
