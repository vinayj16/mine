import chatService from '../services/chatService.js';
import Conversation from '../models/Conversation.js';

const createConversation = async (req, res, next) => {
  try {
    const { institutionCode } = req.params;
    const { participants, isGroup, title } = req.body;
    
    // Add institutionCode to each participant
    const participantsWithCode = participants.map(p => ({
      ...p,
      institutionCode
    }));
    
    const conv = await chatService.createConversation(institutionCode, participantsWithCode, isGroup, title);
    res.status(201).json({ success: true, data: conv });
  } catch (error) {
    next(error);
  }
};

const createGlobalConversation = async (req, res, next) => {
  try {
    console.log('📝 Creating global conversation with data:', JSON.stringify(req.body, null, 2));
    const { participants, isGroup, title } = req.body;
    
    // Add email and institutionCode to participants from user data
    const participantsWithDetails = participants.map(p => ({
      ...p,
      email: p.email || '', // Should come from frontend
      institutionCode: p.institutionCode || '' // Should come from frontend
    }));
    
    console.log('📝 Participants with details:', JSON.stringify(participantsWithDetails, null, 2));
    
    const conv = await chatService.createGlobalConversation(participantsWithDetails, isGroup, title);
    console.log('✅ Global conversation created:', JSON.stringify(conv, null, 2));
    res.status(201).json({ success: true, data: conv });
  } catch (error) {
    console.error('❌ Error creating global conversation:', error);
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const { institutionCode, userId } = req.params;
    const convs = await chatService.getConversations(institutionCode, userId);
    res.json({ success: true, data: convs });
  } catch (error) {
    next(error);
  }
};

const getAgentConversations = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const convs = await chatService.getAgentConversations(userId);
    res.json({ success: true, data: convs });
  } catch (error) {
    next(error);
  }
};

const getConversationById = async (req, res, next) => {
  try {
    const { institutionCode, conversationId } = req.params;
    const conv = await chatService.getConversationById(conversationId, institutionCode);
    res.json({ success: true, data: conv });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const messageData = {
      ...req.body,
      senderId: req.user.id,
      senderName: req.user.name,
      readBy: []
    };
    
    const message = await chatService.sendMessage(conversationId, messageData);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await chatService.getMessages(conversationId, parseInt(page), parseInt(limit));
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    await chatService.markAsRead(conversationId, userId);
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    const message = await chatService.deleteMessage(messageId, userId);
    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// Get chat history between two users
const getChatHistory = async (req, res, next) => {
  try {
    const { userId1, userId2 } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const messages = await chatService.getChatHistory(userId1, userId2, parseInt(page), parseInt(limit));
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// Get all messages for a user (both sent and received)
const getAllUserMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const messages = await chatService.getAllUserMessages(userId, parseInt(page), parseInt(limit));
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error)
  }
};

// Block user from conversation
const blockUser = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { userIdToBlock } = req.body;
    const currentUserId = req.user.id;
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    
    // Check if current user is a participant
    const isParticipant = conversation.participants.some(p => p.userId === currentUserId);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not a participant in this conversation' });
    }
    
    // Add user to blocked list if not already blocked
    if (!conversation.blockedUsers.includes(userIdToBlock)) {
      conversation.blockedUsers.push(userIdToBlock);
      await conversation.save();
    }
    
    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    next(error);
  }
};

// Unblock user from conversation
const unblockUser = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { userIdToUnblock } = req.body;
    const currentUserId = req.user.id;
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    
    // Check if current user is a participant
    const isParticipant = conversation.participants.some(p => p.userId === currentUserId);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not a participant in this conversation' });
    }
    
    // Remove user from blocked list
    conversation.blockedUsers = conversation.blockedUsers.filter(id => id !== userIdToUnblock);
    await conversation.save();
    
    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    next(error);
  }
};

export {
  createConversation,
  createGlobalConversation,
  getConversations,
  getAgentConversations,
  getConversationById,
  sendMessage,
  getMessages,
  getChatHistory,
  getAllUserMessages,
  markAsRead,
  deleteMessage,
  blockUser,
  unblockUser
};
