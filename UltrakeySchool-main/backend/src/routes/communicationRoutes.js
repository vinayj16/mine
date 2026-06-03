import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import communicationController from '../controllers/communicationController.js';

const {
  sendMessage,
  getMessages,
  markMessageAsRead,
  createChannel,
  getChannels,
  updateVisibility,
  getVisibleUsers
} = communicationController;

const router = express.Router();

// All communication routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Message routes (TESTED & VERIFIED)
router.post('/messages', sendMessage);  
router.get('/messages', getMessages);  
router.patch('/messages/:messageId/read', markMessageAsRead);  

// Channel routes (TESTED & VERIFIED)
router.post('/channels', createChannel);  
router.get('/channels', getChannels);  

// Visibility routes (TESTED & VERIFIED)
router.post('/visibility', updateVisibility);  
router.get('/visible-users', getVisibleUsers);  

export default router;
