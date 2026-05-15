import ContactMessage from '../models/ContactMessage.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid message statuses
const VALID_STATUSES = ['pending', 'responded', 'archived'];

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (international format)
const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/;

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { field: fieldName, message: 'Invalid ' + fieldName + ' format' } };
  }
  return { valid: true };
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  return EMAIL_REGEX.test(email);
};

/**
 * Validate phone format
 */
const validatePhone = (phone) => {
  return PHONE_REGEX.test(phone) && phone.length >= 10 && phone.length <= 20;
};

/**
 * @desc    Get all contact messages
 * @route   GET /api/v1/contact-messages
 * @access  Private/Admin
 */
const getContactMessages = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        // Validate pagination
        const errors = [];
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || pageNum < 1) {
            errors.push({ field: 'page', message: 'Page must be a positive integer' });
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
        }

        // Validate status if provided
        if (status && !VALID_STATUSES.includes(status)) {
            errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
        }

        // Validate sortOrder
        if (!['asc', 'desc'].includes(sortOrder)) {
            errors.push({ field: 'sortOrder', message: 'Sort order must be asc or desc' });
        }

        if (errors.length > 0) {
            return validationErrorResponse(res, errors);
        }

        const query = { isDeleted: false };

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (pageNum - 1) * limitNum;
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        logger.info('Fetching contact messages with filters');
        const messages = await ContactMessage.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum);

        const total = await ContactMessage.countDocuments(query);

        return successResponse(res, messages, 'Contact messages fetched successfully', {
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            },
            filters: { status, search }
        });
    } catch (error) {
        logger.error('Error in getContactMessages:', error);
        return errorResponse(res, 'Failed to fetch contact messages', 500);
    }
};

/**
 * @desc    Create a contact message
 * @route   POST /api/v1/contact-messages
 * @access  Public
 */
const createContactMessage = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validate required fields
        const errors = [];
        if (!name || name.trim().length < 2) {
            errors.push({ field: 'name', message: 'Name is required and must be at least 2 characters' });
        } else if (name.length > 100) {
            errors.push({ field: 'name', message: 'Name cannot exceed 100 characters' });
        }
        if (!email) {
            errors.push({ field: 'email', message: 'Email is required' });
        } else if (!validateEmail(email)) {
            errors.push({ field: 'email', message: 'Invalid email format' });
        }
        if (!phone) {
            errors.push({ field: 'phone', message: 'Phone is required' });
        } else if (!validatePhone(phone)) {
            errors.push({ field: 'phone', message: 'Invalid phone format (10-20 digits)' });
        }
        if (!message || message.trim().length < 10) {
            errors.push({ field: 'message', message: 'Message is required and must be at least 10 characters' });
        } else if (message.length > 2000) {
            errors.push({ field: 'message', message: 'Message cannot exceed 2000 characters' });
        }
        if (subject && subject.length > 200) {
            errors.push({ field: 'subject', message: 'Subject cannot exceed 200 characters' });
        }

        if (errors.length > 0) {
            return validationErrorResponse(res, errors);
        }

        logger.info('Creating contact message from: ' + email);
        const contactMessage = await ContactMessage.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            subject: subject ? subject.trim() : undefined,
            message: message.trim()
        });

        return createdResponse(res, contactMessage, 'Message sent successfully');
    } catch (error) {
        logger.error('Error in createContactMessage:', error);
        return errorResponse(res, 'Failed to send message', 500);
    }
};

/**
 * @desc    Update contact message status
 * @route   PATCH /api/v1/contact-messages/:id/status
 * @access  Private/Admin
 */
const updateMessageStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        // Validate ID
        const errors = [];
        const validation = validateObjectId(id, 'messageId');
        if (!validation.valid) {
            errors.push(validation.error);
        }

        // Validate status
        if (!status) {
            errors.push({ field: 'status', message: 'Status is required' });
        } else if (!VALID_STATUSES.includes(status)) {
            errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
        }

        if (errors.length > 0) {
            return validationErrorResponse(res, errors);
        }

        logger.info('Updating message status: ' + id + ' to ' + status);
        const message = await ContactMessage.findByIdAndUpdate(
            id,
            { status, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!message) {
            return notFoundResponse(res, 'Message not found');
        }

        return successResponse(res, message, 'Message status updated successfully');
    } catch (error) {
        logger.error('Error in updateMessageStatus:', error);
        return errorResponse(res, 'Failed to update message status', 500);
    }
};

/**
 * @desc    Delete contact message (Soft delete)
 * @route   DELETE /api/v1/contact-messages/:id
 * @access  Private/Admin
 */
const deleteContactMessage = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        const validation = validateObjectId(id, 'messageId');
        if (!validation.valid) {
            return validationErrorResponse(res, [validation.error]);
        }

        logger.info('Deleting contact message: ' + id);
        const message = await ContactMessage.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: Date.now() },
            { new: true }
        );

        if (!message) {
            return notFoundResponse(res, 'Message not found');
        }

        return successResponse(res, null, 'Message deleted successfully');
    } catch (error) {
        logger.error('Error in deleteContactMessage:', error);
        return errorResponse(res, 'Failed to delete message', 500);
    }
};

/**
 * @desc    Get contact message by ID
 * @route   GET /api/v1/contact-messages/:id
 * @access  Private/Admin
 */
const getContactMessageById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        const validation = validateObjectId(id, 'messageId');
        if (!validation.valid) {
            return validationErrorResponse(res, [validation.error]);
        }

        logger.info('Fetching contact message by ID: ' + id);
        const message = await ContactMessage.findOne({ _id: id, isDeleted: false });

        if (!message) {
            return notFoundResponse(res, 'Message not found');
        }

        return successResponse(res, message, 'Message fetched successfully');
    } catch (error) {
        logger.error('Error in getContactMessageById:', error);
        return errorResponse(res, 'Failed to fetch message', 500);
    }
};

/**
 * @desc    Bulk update message status
 * @route   PATCH /api/v1/contact-messages/bulk-status
 * @access  Private/Admin
 */
const bulkUpdateStatus = async (req, res) => {
    try {
        const { messageIds, status } = req.body;

        // Validate messageIds
        const errors = [];
        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            errors.push({ field: 'messageIds', message: 'messageIds must be a non-empty array' });
        } else if (messageIds.length > 100) {
            errors.push({ field: 'messageIds', message: 'Maximum 100 messages allowed per request' });
        } else {
            messageIds.forEach((id, index) => {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    errors.push({ field: 'messageIds[' + index + ']', message: 'Invalid message ID' });
                }
            });
        }

        // Validate status
        if (!status) {
            errors.push({ field: 'status', message: 'Status is required' });
        } else if (!VALID_STATUSES.includes(status)) {
            errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
        }

        if (errors.length > 0) {
            return validationErrorResponse(res, errors);
        }

        logger.info('Bulk updating status for ' + messageIds.length + ' messages');
        const result = await ContactMessage.updateMany(
            { _id: { $in: messageIds }, isDeleted: false },
            { status, updatedAt: Date.now() }
        );

        return successResponse(res, { 
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount
        }, result.modifiedCount + ' messages status updated successfully');
    } catch (error) {
        logger.error('Error in bulkUpdateStatus:', error);
        return errorResponse(res, 'Failed to bulk update status', 500);
    }
};

/**
 * @desc    Bulk delete messages
 * @route   DELETE /api/v1/contact-messages/bulk-delete
 * @access  Private/Admin
 */
const bulkDeleteMessages = async (req, res) => {
    try {
        const { messageIds } = req.body;

        // Validate messageIds
        const errors = [];
        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            errors.push({ field: 'messageIds', message: 'messageIds must be a non-empty array' });
        } else if (messageIds.length > 100) {
            errors.push({ field: 'messageIds', message: 'Maximum 100 messages allowed per request' });
        } else {
            messageIds.forEach((id, index) => {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    errors.push({ field: 'messageIds[' + index + ']', message: 'Invalid message ID' });
                }
            });
        }

        if (errors.length > 0) {
            return validationErrorResponse(res, errors);
        }

        logger.info('Bulk deleting ' + messageIds.length + ' messages');
        const result = await ContactMessage.updateMany(
            { _id: { $in: messageIds } },
            { isDeleted: true, deletedAt: Date.now() }
        );

        return successResponse(res, {
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount
        }, result.modifiedCount + ' messages deleted successfully');
    } catch (error) {
        logger.error('Error in bulkDeleteMessages:', error);
        return errorResponse(res, 'Failed to bulk delete messages', 500);
    }
};

/**
 * @desc    Get message statistics
 * @route   GET /api/v1/contact-messages/statistics
 * @access  Private/Admin
 */
const getMessageStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate date range if provided
        const errors = [];
        if (startDate && isNaN(new Date(startDate).getTime())) {
            errors.push({ field: 'startDate', message: 'Invalid start date format' });
        }
        if (endDate && isNaN(new Date(endDate).getTime())) {
            errors.push({ field: 'endDate', message: 'Invalid end date format' });
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            errors.push({ field: 'dateRange', message: 'Start date must be before end date' });
        }

        if (errors.length > 0) {
            return validationErrorResponse(res, errors);
        }

        const query = { isDeleted: false };
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        logger.info('Fetching message statistics');
        const [total, byStatus, recentCount] = await Promise.all([
            ContactMessage.countDocuments(query),
            ContactMessage.aggregate([
                { $match: query },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            ContactMessage.countDocuments({
                ...query,
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            })
        ]);

        const statistics = {
            total,
            byStatus: byStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            last7Days: recentCount
        };

        return successResponse(res, statistics, 'Message statistics fetched successfully', {
            filters: { startDate, endDate }
        });
    } catch (error) {
        logger.error('Error in getMessageStatistics:', error);
        return errorResponse(res, 'Failed to fetch statistics', 500);
    }
};

/**
 * @desc    Export contact messages
 * @route   GET /api/v1/contact-messages/export
 * @access  Private/Admin
 */
const exportMessages = async (req, res) => {
    try {
        const { format = 'json', status, startDate, endDate } = req.query;

        // Validate format
        const validFormats = ['json', 'csv', 'xlsx'];
        const errors = [];
        if (!validFormats.includes(format)) {
            errors.push({ field: 'format', message: 'Format must be one of: ' + validFormats.join(', ') });
        }

        // Validate status if provided
        if (status && !VALID_STATUSES.includes(status)) {
            errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
        }

        // Validate date range if provided
        if (startDate && isNaN(new Date(startDate).getTime())) {
            errors.push({ field: 'startDate', message: 'Invalid start date format' });
        }
        if (endDate && isNaN(new Date(endDate).getTime())) {
            errors.push({ field: 'endDate', message: 'Invalid end date format' });
        }

        if (errors.length > 0) {
            return validationErrorResponse(res, errors);
        }

        const query = { isDeleted: false };
        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        logger.info('Exporting messages in format: ' + format);
        const messages = await ContactMessage.find(query)
            .select('-isDeleted -__v')
            .sort({ createdAt: -1 })
            .lean();

        if (format === 'json') {
            return successResponse(res, messages, 'Messages exported successfully', {
                format,
                recordCount: messages.length
            });
        }

        return errorResponse(res, 'Export format ' + format + ' not yet implemented', 501);
    } catch (error) {
        logger.error('Error in exportMessages:', error);
        return errorResponse(res, 'Failed to export messages', 500);
    }
};

/**
 * @desc    Get messages by status
 * @route   GET /api/v1/contact-messages/status/:status
 * @access  Private/Admin
 */
const getMessagesByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Validate status
        const errors = [];
        if (!VALID_STATUSES.includes(status)) {
            errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
        }

        // Validate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || pageNum < 1) {
            errors.push({ field: 'page', message: 'Page must be a positive integer' });
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
        }

        if (errors.length > 0) {
            return validationErrorResponse(res, errors);
        }

        const query = { status, isDeleted: false };
        const skip = (pageNum - 1) * limitNum;

        logger.info('Fetching messages by status: ' + status);
        const messages = await ContactMessage.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await ContactMessage.countDocuments(query);

        return successResponse(res, messages, 'Messages fetched successfully', {
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            },
            status
        });
    } catch (error) {
        logger.error('Error in getMessagesByStatus:', error);
        return errorResponse(res, 'Failed to fetch messages', 500);
    }
};

/**
 * @desc    Mark message as read
 * @route   PATCH /api/v1/contact-messages/:id/read
 * @access  Private/Admin
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        const validation = validateObjectId(id, 'messageId');
        if (!validation.valid) {
            return validationErrorResponse(res, [validation.error]);
        }

        logger.info('Marking message as read: ' + id);
        const message = await ContactMessage.findByIdAndUpdate(
            id,
            { isRead: true, readAt: Date.now() },
            { new: true }
        );

        if (!message) {
            return notFoundResponse(res, 'Message not found');
        }

        return successResponse(res, message, 'Message marked as read');
    } catch (error) {
        logger.error('Error in markAsRead:', error);
        return errorResponse(res, 'Failed to mark message as read', 500);
    }
};

/**
 * @desc    Get unread messages count
 * @route   GET /api/v1/contact-messages/unread/count
 * @access  Private/Admin
 */
const getUnreadCount = async (req, res) => {
    try {
        logger.info('Fetching unread messages count');
        const count = await ContactMessage.countDocuments({
            isDeleted: false,
            isRead: { $ne: true }
        });

        return successResponse(res, { count }, 'Unread count fetched successfully');
    } catch (error) {
        logger.error('Error in getUnreadCount:', error);
        return errorResponse(res, 'Failed to fetch unread count', 500);
    }
};


export default {
  getContactMessages,
  createContactMessage,
  updateMessageStatus,
  deleteContactMessage,
  getContactMessageById,
  bulkUpdateStatus,
  bulkDeleteMessages,
  getMessageStatistics,
  exportMessages,
  getMessagesByStatus,
  markAsRead,
  getUnreadCount
};
