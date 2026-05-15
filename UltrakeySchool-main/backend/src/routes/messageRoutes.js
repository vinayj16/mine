import express from 'express';
import { getMessages, getConversations, saveMessage, blockUser, unblockUser, getBlockedUsers, blockByRole, unblockByRole, getUserMessages } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get messages for a conversation
router.get('/messages/:conversationId', protect, getMessages);

// Get all conversations for a user
router.get('/conversations', protect, getConversations);

// Get all messages for a user (for staff dashboard)
router.get('/messages', protect, getUserMessages);

// Save a new message
router.post('/messages', protect, saveMessage);

// Block a specific user
router.post('/block/:userId', protect, blockUser);

// Unblock a specific user
router.post('/unblock/:userId', protect, unblockUser);

// Get list of blocked users
router.get('/blocked-users', protect, getBlockedUsers);

// Block users by role
router.post('/block-role/:role', protect, blockByRole);

// Unblock users by role
router.post('/unblock-role/:role', protect, unblockByRole);

export default router;
