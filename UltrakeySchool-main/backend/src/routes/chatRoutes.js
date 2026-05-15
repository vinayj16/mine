import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import * as chatController from '../controllers/chatController.js';

const router = express.Router();

// All chat routes require authentication (TESTED & VERIFIED)
router.use(protect);

// Conversation Routes (TESTED & VERIFIED)
router.post('/institutions/:institutionCode/conversations', authorize(['admin', 'teacher', 'principal', 'student', 'parent']), chatController.createConversation);  
router.get('/institutions/:institutionCode/users/:userId/conversations', chatController.getConversations);  
router.get('/institutions/:institutionCode/conversations/:conversationId', chatController.getConversationById);

// Agent conversation routes (platform-wide, no schoolId required)
router.get('/agent-conversations', authorize(['agent', 'superadmin']), chatController.getAgentConversations);

// Global conversation routes (for agents and superadmin to chat with anyone)
router.post('/global-conversations', authorize(['agent', 'superadmin']), chatController.createGlobalConversation);  

// Message Routes (TESTED & VERIFIED)
router.post('/conversations/:conversationId/messages', chatController.sendMessage);  
router.get('/conversations/:conversationId/messages', chatController.getMessages);  
router.put('/conversations/:conversationId/read', chatController.markAsRead);  
router.delete('/messages/:messageId', chatController.deleteMessage);

// Chat History Routes
router.get('/history/:userId1/:userId2', chatController.getChatHistory);
router.get('/user/:userId/messages', chatController.getAllUserMessages);

// Block/Unblock Routes
router.post('/conversations/:conversationId/block', chatController.blockUser);
router.post('/conversations/:conversationId/unblock', chatController.unblockUser);

export default router;
