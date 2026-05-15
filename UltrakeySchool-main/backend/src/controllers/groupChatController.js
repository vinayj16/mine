import groupChatService from '../services/groupChatService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'archived'];
const VALID_ROOM_TYPES = ['public', 'private', 'announcement', 'class', 'department', 'staff'];
const VALID_MESSAGE_TYPES = ['text', 'image', 'file', 'video', 'audio', 'link'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_ROOM_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_MEMBERS_PER_ROOM = 500;

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

// Helper function to validate emoji
const validateEmoji = (emoji) => {
  if (!emoji || emoji.trim().length === 0) {
    return 'Emoji is required';
  }
  // Basic emoji validation - check if it's a single character or valid emoji sequence
  if (emoji.length > 10) {
    return 'Invalid emoji format';
  }
  return null;
};

const createRoom = async (req, res) => {
  try {
    logger.info('Creating group chat room');
    
    const { name, description, type, members, isPrivate, maxMembers } = req.body;
    
    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Room name is required');
    } else if (name.length > MAX_ROOM_NAME_LENGTH) {
      errors.push('Room name must not exceed ' + MAX_ROOM_NAME_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (type && !VALID_ROOM_TYPES.includes(type)) {
      errors.push('Invalid room type. Must be one of: ' + VALID_ROOM_TYPES.join(', '));
    }
    
    if (members && Array.isArray(members)) {
      if (members.length > MAX_MEMBERS_PER_ROOM) {
        errors.push('Cannot add more than ' + MAX_MEMBERS_PER_ROOM + ' members');
      }
      
      for (let i = 0; i < Math.min(members.length, 10); i++) {
        const memberIdError = validateObjectId(members[i], 'Member ID at index ' + i);
        if (memberIdError) {
          errors.push(memberIdError);
          break;
        }
      }
    }
    
    if (maxMembers !== undefined) {
      const maxMembersNum = parseInt(maxMembers);
      if (isNaN(maxMembersNum) || maxMembersNum < 2) {
        errors.push('Max members must be at least 2');
      } else if (maxMembersNum > MAX_MEMBERS_PER_ROOM) {
        errors.push('Max members cannot exceed ' + MAX_MEMBERS_PER_ROOM);
      }
    }
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const room = await groupChatService.createRoom(req.body, req.user.institution);
    
    logger.info('Group chat room created successfully:', { roomId: room._id });
    return createdResponse(res, room, 'Group chat room created successfully');
  } catch (error) {
    logger.error('Error creating group chat room:', error);
    return errorResponse(res, error.message);
  }
};

const getRooms = async (req, res) => {
  try {
    logger.info('Fetching group chat rooms');
    
    const { type, status, search, page, limit, sortBy, sortOrder } = req.query;
    
    // Validation
    const errors = [];
    
    if (type && !VALID_ROOM_TYPES.includes(type)) {
      errors.push('Invalid room type. Must be one of: ' + VALID_ROOM_TYPES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await groupChatService.getRooms(req.user.institution, req.query);
    
    logger.info('Group chat rooms fetched successfully');
    return successResponse(res, result, 'Rooms retrieved successfully');
  } catch (error) {
    logger.error('Error fetching group chat rooms:', error);
    return errorResponse(res, error.message);
  }
};

const getRoomById = async (req, res) => {
  try {
    logger.info('Fetching group chat room by ID');
    
    const { roomId } = req.params;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const room = await groupChatService.getRoomById(roomId, req.user.institution);
    
    if (!room) {
      return notFoundResponse(res, 'Room not found');
    }
    
    logger.info('Group chat room fetched successfully:', { roomId });
    return successResponse(res, room, 'Room retrieved successfully');
  } catch (error) {
    logger.error('Error fetching group chat room:', error);
    return errorResponse(res, error.message);
  }
};

const sendMessage = async (req, res) => {
  try {
    logger.info('Sending message to group chat');
    
    const { roomId } = req.params;
    const { content, type, attachments } = req.body;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    if (!content || content.trim().length === 0) {
      errors.push('Message content is required');
    } else if (content.length > MAX_MESSAGE_LENGTH) {
      errors.push('Message content must not exceed ' + MAX_MESSAGE_LENGTH + ' characters');
    }
    
    if (type && !VALID_MESSAGE_TYPES.includes(type)) {
      errors.push('Invalid message type. Must be one of: ' + VALID_MESSAGE_TYPES.join(', '));
    }
    
    if (attachments && Array.isArray(attachments)) {
      if (attachments.length > 10) {
        errors.push('Cannot attach more than 10 files');
      }
    }
    
    if (!req.user || !req.user.id) {
      errors.push('User information is required');
    }
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const message = await groupChatService.sendMessage(
      roomId,
      { ...req.body, sender: req.user.id },
      req.user.institution
    );
    
    logger.info('Message sent successfully:', { roomId, messageId: message._id });
    return createdResponse(res, message, 'Message sent successfully');
  } catch (error) {
    logger.error('Error sending message:', error);
    return errorResponse(res, error.message);
  }
};

const getMessages = async (req, res) => {
  try {
    logger.info('Fetching messages from group chat');
    
    const { roomId } = req.params;
    const { page, limit, before, after, type } = req.query;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    if (type && !VALID_MESSAGE_TYPES.includes(type)) {
      errors.push('Invalid message type. Must be one of: ' + VALID_MESSAGE_TYPES.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (before) {
      const beforeError = validateObjectId(before, 'Before message ID');
      if (beforeError) errors.push(beforeError);
    }
    
    if (after) {
      const afterError = validateObjectId(after, 'After message ID');
      if (afterError) errors.push(afterError);
    }
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await groupChatService.getMessages(roomId, req.user.institution, req.query);
    
    logger.info('Messages fetched successfully:', { roomId });
    return successResponse(res, result, 'Messages retrieved successfully');
  } catch (error) {
    logger.error('Error fetching messages:', error);
    return errorResponse(res, error.message);
  }
};

const addMember = async (req, res) => {
  try {
    logger.info('Adding member to group chat');
    
    const { roomId } = req.params;
    const { userId, role } = req.body;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (role && !['admin', 'moderator', 'member'].includes(role)) {
      errors.push('Invalid role. Must be one of: admin, moderator, member');
    }
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const room = await groupChatService.addMember(roomId, userId, req.user.institution, role);
    
    if (!room) {
      return notFoundResponse(res, 'Room not found');
    }
    
    logger.info('Member added successfully:', { roomId, userId });
    return successResponse(res, room, 'Member added successfully');
  } catch (error) {
    logger.error('Error adding member:', error);
    return errorResponse(res, error.message);
  }
};

const removeMember = async (req, res) => {
  try {
    logger.info('Removing member from group chat');
    
    const { roomId, userId } = req.params;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const room = await groupChatService.removeMember(roomId, userId, req.user.institution);
    
    if (!room) {
      return notFoundResponse(res, 'Room not found');
    }
    
    logger.info('Member removed successfully:', { roomId, userId });
    return successResponse(res, room, 'Member removed successfully');
  } catch (error) {
    logger.error('Error removing member:', error);
    return errorResponse(res, error.message);
  }
};

const markAsRead = async (req, res) => {
  try {
    logger.info('Marking messages as read');
    
    const { roomId } = req.params;
    const { messageId } = req.body;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    if (messageId) {
      const messageIdError = validateObjectId(messageId, 'Message ID');
      if (messageIdError) errors.push(messageIdError);
    }
    
    if (!req.user || !req.user.id) {
      errors.push('User information is required');
    }
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const room = await groupChatService.markAsRead(roomId, req.user.id, req.user.institution, messageId);
    
    if (!room) {
      return notFoundResponse(res, 'Room not found');
    }
    
    logger.info('Messages marked as read:', { roomId, userId: req.user.id });
    return successResponse(res, room, 'Messages marked as read');
  } catch (error) {
    logger.error('Error marking messages as read:', error);
    return errorResponse(res, error.message);
  }
};

const deleteMessage = async (req, res) => {
  try {
    logger.info('Deleting message from group chat');
    
    const { roomId, messageId } = req.params;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    const messageIdError = validateObjectId(messageId, 'Message ID');
    if (messageIdError) errors.push(messageIdError);
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await groupChatService.deleteMessage(roomId, messageId, req.user.institution);
    
    if (!result) {
      return notFoundResponse(res, 'Message not found');
    }
    
    logger.info('Message deleted successfully:', { roomId, messageId });
    return successResponse(res, result, 'Message deleted successfully');
  } catch (error) {
    logger.error('Error deleting message:', error);
    return errorResponse(res, error.message);
  }
};

const addReaction = async (req, res) => {
  try {
    logger.info('Adding reaction to message');
    
    const { roomId, messageId } = req.params;
    const { emoji } = req.body;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    const messageIdError = validateObjectId(messageId, 'Message ID');
    if (messageIdError) errors.push(messageIdError);
    
    const emojiError = validateEmoji(emoji);
    if (emojiError) errors.push(emojiError);
    
    if (!req.user || !req.user.id) {
      errors.push('User information is required');
    }
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const message = await groupChatService.addReaction(
      roomId,
      messageId,
      req.user.id,
      emoji,
      req.user.institution
    );
    
    if (!message) {
      return notFoundResponse(res, 'Message not found');
    }
    
    logger.info('Reaction added successfully:', { roomId, messageId, emoji });
    return successResponse(res, message, 'Reaction added successfully');
  } catch (error) {
    logger.error('Error adding reaction:', error);
    return errorResponse(res, error.message);
  }
};

const archiveRoom = async (req, res) => {
  try {
    logger.info('Archiving group chat room');
    
    const { roomId } = req.params;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const room = await groupChatService.archiveRoom(roomId, req.user.institution);
    
    if (!room) {
      return notFoundResponse(res, 'Room not found');
    }
    
    logger.info('Room archived successfully:', { roomId });
    return successResponse(res, room, 'Room archived successfully');
  } catch (error) {
    logger.error('Error archiving room:', error);
    return errorResponse(res, error.message);
  }
};

const updateRoom = async (req, res) => {
  try {
    logger.info('Updating group chat room');
    
    const { roomId } = req.params;
    const { name, description, type, maxMembers, status } = req.body;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Room name cannot be empty');
      } else if (name.length > MAX_ROOM_NAME_LENGTH) {
        errors.push('Room name must not exceed ' + MAX_ROOM_NAME_LENGTH + ' characters');
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (type !== undefined && !VALID_ROOM_TYPES.includes(type)) {
      errors.push('Invalid room type. Must be one of: ' + VALID_ROOM_TYPES.join(', '));
    }
    
    if (maxMembers !== undefined) {
      const maxMembersNum = parseInt(maxMembers);
      if (isNaN(maxMembersNum) || maxMembersNum < 2) {
        errors.push('Max members must be at least 2');
      } else if (maxMembersNum > MAX_MEMBERS_PER_ROOM) {
        errors.push('Max members cannot exceed ' + MAX_MEMBERS_PER_ROOM);
      }
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const room = await groupChatService.updateRoom(roomId, req.body, req.user.institution);
    
    if (!room) {
      return notFoundResponse(res, 'Room not found');
    }
    
    logger.info('Room updated successfully:', { roomId });
    return successResponse(res, room, 'Room updated successfully');
  } catch (error) {
    logger.error('Error updating room:', error);
    return errorResponse(res, error.message);
  }
};

const deleteRoom = async (req, res) => {
  try {
    logger.info('Deleting group chat room');
    
    const { roomId } = req.params;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await groupChatService.deleteRoom(roomId, req.user.institution);
    
    if (!result) {
      return notFoundResponse(res, 'Room not found');
    }
    
    logger.info('Room deleted successfully:', { roomId });
    return successResponse(res, null, 'Room deleted successfully');
  } catch (error) {
    logger.error('Error deleting room:', error);
    return errorResponse(res, error.message);
  }
};

const getRoomStatistics = async (req, res) => {
  try {
    logger.info('Fetching room statistics');
    
    const { roomId } = req.params;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await groupChatService.getRoomStatistics(roomId, req.user.institution);
    
    logger.info('Room statistics fetched successfully:', { roomId });
    return successResponse(res, statistics, 'Room statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching room statistics:', error);
    return errorResponse(res, error.message);
  }
};

const exportMessages = async (req, res) => {
  try {
    logger.info('Exporting messages');
    
    const { roomId } = req.params;
    const { format, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (startDate) {
      const startDateObj = new Date(startDate);
      if (isNaN(startDateObj.getTime())) {
        errors.push('Invalid start date format');
      }
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      if (isNaN(endDateObj.getTime())) {
        errors.push('Invalid end date format');
      }
    }
    
    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      if (startDateObj > endDateObj) {
        errors.push('Start date cannot be after end date');
      }
    }
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await groupChatService.exportMessages(
      roomId,
      format.toLowerCase(),
      req.user.institution,
      { startDate, endDate }
    );
    
    logger.info('Messages exported successfully:', { roomId, format });
    return successResponse(res, exportData, 'Messages exported successfully');
  } catch (error) {
    logger.error('Error exporting messages:', error);
    return errorResponse(res, error.message);
  }
};

const pinMessage = async (req, res) => {
  try {
    logger.info('Pinning message');
    
    const { roomId, messageId } = req.params;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    const messageIdError = validateObjectId(messageId, 'Message ID');
    if (messageIdError) errors.push(messageIdError);
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const message = await groupChatService.pinMessage(roomId, messageId, req.user.institution);
    
    if (!message) {
      return notFoundResponse(res, 'Message not found');
    }
    
    logger.info('Message pinned successfully:', { roomId, messageId });
    return successResponse(res, message, 'Message pinned successfully');
  } catch (error) {
    logger.error('Error pinning message:', error);
    return errorResponse(res, error.message);
  }
};

const unpinMessage = async (req, res) => {
  try {
    logger.info('Unpinning message');
    
    const { roomId, messageId } = req.params;
    
    // Validation
    const errors = [];
    
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    
    const messageIdError = validateObjectId(messageId, 'Message ID');
    if (messageIdError) errors.push(messageIdError);
    
    if (!req.user || !req.user.institution) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const message = await groupChatService.unpinMessage(roomId, messageId, req.user.institution);
    
    if (!message) {
      return notFoundResponse(res, 'Message not found');
    }
    
    logger.info('Message unpinned successfully:', { roomId, messageId });
    return successResponse(res, message, 'Message unpinned successfully');
  } catch (error) {
    logger.error('Error unpinning message:', error);
    return errorResponse(res, error.message);
  }
};

export default {
  createRoom,
  getRooms,
  getRoomById,
  sendMessage,
  getMessages,
  addMember,
  removeMember,
  markAsRead,
  deleteMessage,
  addReaction,
  archiveRoom,
  updateRoom,
  deleteRoom,
  getRoomStatistics,
  exportMessages,
  pinMessage,
  unpinMessage
};
