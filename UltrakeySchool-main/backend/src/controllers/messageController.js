import mongoose from 'mongoose';
import Message from '../models/Message.js';
import UserBlock from '../models/UserBlock.js';
import User from '../models/User.js';

// Get messages between two users or for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;

    if (!conversationId) {
      return res.status(400).json({ success: false, error: 'Conversation ID is required' });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Get all messages where user is sender or recipient
    const messages = await Message.aggregate([
      {
        $match: {
          senderId: new mongoose.Types.ObjectId(userId),
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $last: '$content' },
          lastMessageTime: { $last: '$createdAt' },
          senderName: { $last: '$senderName' }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Save a new message
export const saveMessage = async (req, res) => {
  try {
    const { conversationId, senderId, senderName, recipientId, content, messageType } = req.body;

    // Check if sender is blocked by recipient
    const isBlocked = await UserBlock.findOne({
      blockerId: recipientId,
      blockedUserId: senderId,
      isActive: true
    });

    // Check if recipient is blocked by role
    const senderUser = await User.findById(senderId);
    const isRoleBlocked = await UserBlock.findOne({
      blockerId: recipientId,
      blockedRole: senderUser?.role,
      isActive: true
    });

    if (isBlocked || isRoleBlocked) {
      return res.status(403).json({ 
        success: false, 
        error: 'Message blocked. User cannot send messages to this recipient.' 
      });
    }

    const newMessage = new Message({
      conversationId,
      senderId,
      senderName,
      content,
      messageType: messageType || 'text',
      readBy: []
    });

    await newMessage.save();

    res.json({ success: true, data: newMessage });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Block a specific user
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user?.id;
    const { reason } = req.body;

    if (!userId || userId === blockerId) {
      return res.status(400).json({ success: false, error: 'Invalid user ID or cannot block yourself' });
    }

    // Check if already blocked
    const existingBlock = await UserBlock.findOne({
      blockerId,
      blockedUserId: userId,
      isActive: true
    });

    if (existingBlock) {
      return res.status(400).json({ success: false, error: 'User already blocked' });
    }

    const block = new UserBlock({
      blockerId,
      blockedUserId: userId,
      reason: reason || '',
      isActive: true
    });

    await block.save();

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Unblock a specific user
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user?.id;

    const block = await UserBlock.findOneAndUpdate(
      { blockerId, blockedUserId: userId },
      { isActive: false },
      { new: true }
    );

    if (!block) {
      return res.status(404).json({ success: false, error: 'Block not found' });
    }

    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get list of blocked users
export const getBlockedUsers = async (req, res) => {
  try {
    const blockerId = req.user?.id;

    const blockedUsers = await UserBlock.find({
      blockerId,
      isActive: true
    }).populate('blockedUserId', 'name email role');

    res.json({ success: true, data: blockedUsers });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Block users by role
export const blockByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const blockerId = req.user?.id;
    const { reason } = req.body;

    const validRoles = ['student', 'teacher', 'parent', 'staff', 'admin', 'agent', 'superadmin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    // Check if role is already blocked
    const existingBlock = await UserBlock.findOne({
      blockerId,
      blockedRole: role,
      isActive: true
    });

    if (existingBlock) {
      return res.status(400).json({ success: false, error: 'Role already blocked' });
    }

    const block = new UserBlock({
      blockerId,
      blockedRole: role,
      reason: reason || '',
      isActive: true
    });

    await block.save();

    res.json({ success: true, message: `All ${role}s blocked successfully` });
  } catch (error) {
    console.error('Error blocking role:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Unblock users by role
export const unblockByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const blockerId = req.user?.id;

    const block = await UserBlock.findOneAndUpdate(
      { blockerId, blockedRole: role },
      { isActive: false },
      { new: true }
    );

    if (!block) {
      return res.status(404).json({ success: false, error: 'Role block not found' });
    }

    res.json({ success: true, message: `All ${role}s unblocked successfully` });
  } catch (error) {
    console.error('Error unblocking role:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all messages for a user (for staff dashboard)
export const getUserMessages = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    // Get all messages where user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
