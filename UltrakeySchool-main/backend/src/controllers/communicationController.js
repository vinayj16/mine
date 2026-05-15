import { CommunicationMessage, CommunicationChannel, UserVisibility } from '../models/Communication.js';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Helper function to validate MongoDB ObjectId
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    return fieldName + ' is required';
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Send message between users/applications
export const sendMessage = async (req, res) => {
  try {
    const { from, to, type, subject, content, institutionId, priority, metadata } = req.body;
    const senderId = req.user?.id;

    // Validation
    const errors = [];
    
    if (!senderId) {
      errors.push({ field: 'sender', message: 'Authentication required' });
    }
    
    if (!to || (Array.isArray(to) && to.length === 0)) {
      errors.push({ field: 'to', message: 'Recipient is required' });
    }
    
    if (!type || !['chat', 'email', 'calendar', 'file', 'note', 'system'].includes(type)) {
      errors.push({ field: 'type', message: 'Invalid message type' });
    }
    
    if (!content) {
      errors.push({ field: 'content', message: 'Content is required' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    // Check communication permissions
    const sender = await User.findById(senderId);
    if (!sender) {
      return notFoundResponse(res, 'Sender not found');
    }

    // Validate recipients and check permissions
    const recipients = Array.isArray(to) ? to : [to];
    const validRecipients = [];
    
    for (const recipientId of recipients) {
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        continue;
      }

      // Check if sender can communicate with recipient
      if (!canCommunicate(sender, recipient)) {
        logger.warn(`Communication not allowed: ${senderId} -> ${recipientId}`);
        continue;
      }

      validRecipients.push(recipient._id);
    }

    if (validRecipients.length === 0) {
      return errorResponse(res, 'No valid recipients found', 403);
    }

    // Create message
    const message = new CommunicationMessage({
      id: generateId(),
      from: senderId,
      to: validRecipients,
      type,
      subject,
      content,
      institutionId,
      priority: priority || 'medium',
      metadata: metadata || {},
      read: false,
      delivered: true
    });

    await message.save();

    // Update channel activity if this is a chat message
    if (type === 'chat' && metadata?.channelId) {
      await CommunicationChannel.findByIdAndUpdate(
        metadata.channelId,
        { lastActivity: new Date() }
      );
    }

    logger.info(`Message sent from ${senderId} to ${validRecipients.length} recipients`);
    return createdResponse(res, message, 'Message sent successfully');

  } catch (error) {
    logger.error('Error sending message:', error);
    return errorResponse(res, 'Failed to send message', 500);
  }
};

// Get messages for user
export const getMessages = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { type, institutionId, page = 1, limit = 50 } = req.query;

    if (!userId) {
      return errorResponse(res, 'Authentication required', 401);
    }

    // Build query
    const query = {
      $or: [
        { from: userId },
        { to: userId }
      ]
    };

    if (type) {
      query.type = type;
    }

    if (institutionId) {
      query.institutionId = institutionId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await CommunicationMessage.find(query)
      .populate('from', 'name email')
      .populate('to', 'name email')
      .populate('institutionId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await CommunicationMessage.countDocuments(query);

    return successResponse(res, {
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Messages retrieved successfully');

  } catch (error) {
    logger.error('Error getting messages:', error);
    return errorResponse(res, 'Failed to get messages', 500);
  }
};

// Create communication channel
export const createChannel = async (req, res) => {
  try {
    const { name, type, participants, institutionId } = req.body;
    const creatorId = req.user?.id;

    if (!creatorId) {
      return errorResponse(res, 'Authentication required', 401);
    }

    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Channel name is required' });
    }
    
    if (!type || !['chat', 'email', 'calendar', 'file', 'note'].includes(type)) {
      errors.push({ field: 'type', message: 'Invalid channel type' });
    }
    
    if (!participants || participants.length === 0) {
      errors.push({ field: 'participants', message: 'At least one participant is required' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    // Validate participants and check permissions
    const validParticipants = [creatorId];
    
    for (const participantId of participants) {
      if (participantId === creatorId) continue;
      
      const participant = await User.findById(participantId);
      if (!participant) continue;

      const creator = await User.findById(creatorId);
      if (!canCommunicate(creator, participant)) continue;

      validParticipants.push(participantId);
    }

    if (validParticipants.length < 2) {
      return errorResponse(res, 'Need at least 2 valid participants', 400);
    }

    // Create channel
    const channel = new CommunicationChannel({
      id: generateId(),
      name,
      type,
      participants: validParticipants,
      institutionId,
      isActive: true,
      lastActivity: new Date()
    });

    await channel.save();

    logger.info(`Channel created: ${name} with ${validParticipants.length} participants`);
    return createdResponse(res, channel, 'Channel created successfully');

  } catch (error) {
    logger.error('Error creating channel:', error);
    return errorResponse(res, 'Failed to create channel', 500);
  }
};

// Get channels for user
export const getChannels = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { institutionId, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const query = {
      participants: userId,
      isActive: true
    };

    if (institutionId) {
      query.institutionId = institutionId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const channels = await CommunicationChannel.find(query)
      .populate('participants', 'name email')
      .populate('institutionId', 'name')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await CommunicationChannel.countDocuments(query);

    return successResponse(res, {
      channels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Channels retrieved successfully');

  } catch (error) {
    logger.error('Error getting channels:', error);
    return errorResponse(res, 'Failed to get channels', 500);
  }
};

// Update user visibility
export const updateVisibility = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { onlineStatus, isVisibleToAgents, isVisibleToSuperAdmin } = req.body;

    if (!userId) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const user = await User.findById(userId);
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    const visibilityData = {
      userId,
      isInstitution: !!user.institutionId,
      institutionId: user.institutionId,
      role: user.role,
      isVisibleToAgents: isVisibleToAgents !== undefined ? isVisibleToAgents : true,
      isVisibleToSuperAdmin: isVisibleToSuperAdmin !== undefined ? isVisibleToSuperAdmin : true,
      visibleInstitutions: user.institutionId ? [user.institutionId] : [],
      onlineStatus: onlineStatus || 'online',
      lastSeen: new Date()
    };

    const visibility = await UserVisibility.findOneAndUpdate(
      { userId },
      visibilityData,
      { upsert: true, new: true }
    );

    logger.info(`Visibility updated for user ${userId}: ${onlineStatus}`);
    return successResponse(res, visibility, 'Visibility updated successfully');

  } catch (error) {
    logger.error('Error updating visibility:', error);
    return errorResponse(res, 'Failed to update visibility', 500);
  }
};

// Get visible users
export const getVisibleUsers = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { institutionId } = req.query;

    if (!userId) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return notFoundResponse(res, 'User not found');
    }

    // Build query based on user role
    let query = {};

    // Super admin can see everyone
    if (currentUser.role === 'super_admin') {
      // No restrictions
    }
    // Agent can see everyone
    else if (currentUser.role === 'agent') {
      // No restrictions
    }
    // Institution users can see users in same institution
    else {
      if (institutionId) {
        query.institutionId = institutionId;
      } else if (currentUser.institutionId) {
        query.institutionId = currentUser.institutionId;
      }
    }

    const visibleUsers = await UserVisibility.find(query)
      .populate('userId', 'name email role')
      .populate('institutionId', 'name')
      .sort({ lastSeen: -1 })
      .lean();

    // Filter out self
    const filteredUsers = visibleUsers.filter(
      user => user.userId._id.toString() !== userId
    );

    return successResponse(res, filteredUsers, 'Visible users retrieved successfully');

  } catch (error) {
    logger.error('Error getting visible users:', error);
    return errorResponse(res, 'Failed to get visible users', 500);
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const message = await CommunicationMessage.findOneAndUpdate(
      { 
        id: messageId,
        to: userId 
      },
      { 
        read: true,
        'metadata.readAt': new Date()
      },
      { new: true }
    );

    if (!message) {
      return notFoundResponse(res, 'Message not found');
    }

    return successResponse(res, message, 'Message marked as read');

  } catch (error) {
    logger.error('Error marking message as read:', error);
    return errorResponse(res, 'Failed to mark message as read', 500);
  }
};

// Helper function to check communication permissions
function canCommunicate(user1, user2) {
  // Super admin can communicate with anyone
  if (user1.role === 'super_admin') return true;
  
  // Agent can communicate with anyone
  if (user1.role === 'agent') return true;

  // Users in same institution can communicate
  if (user1.institutionId && user2.institutionId) {
    return user1.institutionId.toString() === user2.institutionId.toString();
  }

  return false;
}
export default {
  // Communication message routes
  sendMessage,
  getMessages,
  
  // User visibility routes
  updateVisibility,
  getVisibleUsers,
  
  // Channel management routes
  createChannel,
  getChannels,
  
  // Message management routes
  markMessageAsRead,
  
  // Helper function
  canCommunicate
};