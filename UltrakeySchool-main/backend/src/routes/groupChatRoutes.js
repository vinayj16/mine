import express from 'express';
import groupChatController from '../controllers/groupChatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication to all routes (TESTED & VERIFIED)
router.use(protect);

router.post('/rooms', groupChatController.createRoom);  
router.get('/rooms', groupChatController.getRooms);  
router.get('/rooms/:roomId', groupChatController.getRoomById);  
router.post('/rooms/:roomId/messages', groupChatController.sendMessage);  
router.get('/rooms/:roomId/messages', groupChatController.getMessages);  
router.post('/rooms/:roomId/members', groupChatController.addMember);  
router.delete('/rooms/:roomId/members/:userId', groupChatController.removeMember);  
router.put('/rooms/:roomId/read', groupChatController.markAsRead);  
router.delete('/rooms/:roomId/messages/:messageId', groupChatController.deleteMessage);  
router.post('/rooms/:roomId/messages/:messageId/reactions', groupChatController.addReaction);  
router.put('/rooms/:roomId/archive', groupChatController.archiveRoom);  

export default router;
