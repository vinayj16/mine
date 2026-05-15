import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import communicationController from '../controllers/communicationController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Message routes
router.post('/messages', communicationController.sendMessage);
router.get('/messages', communicationController.getMessages);
router.patch('/messages/:messageId/read', communicationController.markMessageAsRead);

// Channel routes
router.post('/channels', communicationController.createChannel);
router.get('/channels', communicationController.getChannels);

// Visibility routes
router.post('/visibility', communicationController.updateVisibility);
router.get('/visible-users', communicationController.getVisibleUsers);

export default router;
