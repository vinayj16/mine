import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

class ChatService {
  async createConversation(institutionCode, participants, isGroup = false, title = null) {
    return await Conversation.create({ 
      institutionCode, 
      participants, 
      isGroup, 
      title,
      isGlobal: false
    });
  }

  async createGlobalConversation(participants, isGroup = false, title = null) {
    // For global conversations (agents and superadmin), don't require institutionCode
    console.log('🌍 Creating global conversation in service:', { participants, isGroup, title });
    const conversation = await Conversation.create({ 
      participants, 
      isGroup, 
      title,
      isGlobal: true,
      institutionCode: undefined
    });
    console.log('✅ Global conversation created in service:', conversation);
    return conversation;
  }

  async getConversations(institutionCode, userId) {
    return await Conversation.find({
      $or: [
        { institutionCode, 'participants.userId': userId, isActive: true },
        { isGlobal: true, 'participants.userId': userId, isActive: true }
      ]
    }).sort({ updatedAt: -1 });
  }

  async getAgentConversations(userId) {
    // For agents and superadmin, get all conversations (both global and institution-based)
    return await Conversation.find({
      'participants.userId': userId,
      isActive: true
    }).sort({ updatedAt: -1 });
  }

  async getConversationById(conversationId, institutionCode = null) {
    const query = { _id: conversationId, isActive: true };
    if (institutionCode) {
      query.$or = [
        { institutionCode },
        { isGlobal: true }
      ];
    }
    const conv = await Conversation.findOne(query);
    if (!conv) throw new Error('Conversation not found');
    return conv;
  }

  async sendMessage(conversationId, messageData) {
    const message = new Message(messageData);
    await message.save();
    
    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        message: messageData.content,
        senderId: messageData.senderId,
        sentAt: new Date()
      },
      updatedAt: new Date()
    });
    
    return message;
  }

  async getMessages(conversationId, page = 1, limit = 50) {
    return await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email');
  }

  async getChatHistory(userId1, userId2, page = 1, limit = 50) {
    return await Message.find({
      $or: [
        { senderId: userId1, recipientId: userId2 },
        { senderId: userId2, recipientId: userId1 }
      ]
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email');
  }

  async getAllUserMessages(userId, page = 1, limit = 50) {
    return await Message.find({
      $or: [
        { senderId: userId },
        { recipientId: userId }
      ]
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email');
  }

  async markAsRead(conversationId, userId) {
    await Message.updateMany(
      { conversationId, 'readBy.userId': { $ne: userId } },
      { $push: { readBy: { userId, readAt: new Date() } } }
    );

    const conv = await Conversation.findById(conversationId);
    if (conv && conv.unreadCount) {
      conv.unreadCount.set(userId.toString(), 0);
      await conv.save();
    }
  }

  async deleteMessage(messageId, userId) {
    const msg = await Message.findOneAndUpdate(
      { _id: messageId, senderId: userId },
      { isDeleted: true, content: 'This message was deleted' },
      { new: true }
    );
    if (!msg) throw new Error('Message not found or unauthorized');
    return msg;
  }

  async addParticipant(conversationId, userId, name, role) {
    return await Conversation.findByIdAndUpdate(
      conversationId,
      { $push: { participants: { userId, name, role, joinedAt: new Date() } } },
      { new: true }
    );
  }

  async removeParticipant(conversationId, userId) {
    return await Conversation.findByIdAndUpdate(
      conversationId,
      { $pull: { participants: { userId } } },
      { new: true }
    );
  }
}

export default new ChatService();
