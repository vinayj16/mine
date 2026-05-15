import RfidCard from '../models/rfidCard.js';
import User from '../models/User.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'lost', 'blocked', 'damaged'];
const VALID_USER_TYPES = ['student', 'teacher', 'staff', 'parent', 'visitor', 'admin'];
const VALID_LOCATIONS = ['gate', 'library', 'transport', 'classroom', 'office',  'hostel', 'lab'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_CARD_ID_LENGTH = 50;
const MAX_SERIAL_NUMBER_LENGTH = 100;
const MAX_REASON_LENGTH = 500;

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

// Create RFID Card
const createRfidCard = async (req, res) => {
  try {
    logger.info('Creating RFID card');
    
    const { cardId, userId, userType, serialNumber, location } = req.body;
    const institutionId = req.user?.institution;
    const createdBy = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!cardId || cardId.trim().length === 0) {
      errors.push('Card ID is required');
    } else if (cardId.length > MAX_CARD_ID_LENGTH) {
      errors.push('Card ID must not exceed ' + MAX_CARD_ID_LENGTH + ' characters');
    }
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!userType) {
      errors.push('User type is required');
    } else if (!VALID_USER_TYPES.includes(userType)) {
      errors.push('Invalid user type. Must be one of: ' + VALID_USER_TYPES.join(', '));
    }
    
    if (!serialNumber || serialNumber.trim().length === 0) {
      errors.push('Serial number is required');
    } else if (serialNumber.length > MAX_SERIAL_NUMBER_LENGTH) {
      errors.push('Serial number must not exceed ' + MAX_SERIAL_NUMBER_LENGTH + ' characters');
    }
    
    if (location && !VALID_LOCATIONS.includes(location)) {
      errors.push('Invalid location. Must be one of: ' + VALID_LOCATIONS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }
    
    // Check if card ID or serial number already exists
    const existingCard = await RfidCard.findOne({ 
      $or: [{ cardId }, { serialNumber }],
      institution: institutionId 
    });
    
    if (existingCard) {
      return validationErrorResponse(res, ['Card ID or Serial Number already exists']);
    }
    
    // Create RFID card
    const rfidCard = new RfidCard({
      cardId,
      userId,
      userType,
      serialNumber,
      location: location || 'gate',
      institution: institutionId,
      createdBy
    });
    
    await rfidCard.save();
    
    logger.info('RFID card created successfully:', { cardId, userId: user._id });
    return createdResponse(res, {
      id: rfidCard._id,
      cardId: rfidCard.cardId,
      serialNumber: rfidCard.serialNumber,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      status: rfidCard.status,
      location: rfidCard.location,
      assignedAt: rfidCard.assignedAt
    }, 'RFID card created successfully');
  } catch (error) {
    logger.error('Error creating RFID card:', error);
    return errorResponse(res, error.message);
  }
};

// Validate RFID Card
const validateRfidCard = async (req, res) => {
  try {
    logger.info('Validating RFID card');
    
    const { cardId, location } = req.body;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!cardId || cardId.trim().length === 0) {
      errors.push('Card ID is required');
    }
    
    if (location && !VALID_LOCATIONS.includes(location)) {
      errors.push('Invalid location. Must be one of: ' + VALID_LOCATIONS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Find active RFID card
    const rfidCard = await RfidCard.findOne({
      cardId,
      institution: institutionId,
      isActive: true,
      status: 'active'
    }).populate('userId', 'name email role');
    
    if (!rfidCard) {
      return notFoundResponse(res, 'Invalid or inactive RFID card');
    }
    
    // Update last used timestamp
    await rfidCard.updateLastUsed();
    
    logger.info('RFID card validated successfully:', { cardId, userId: rfidCard.userId._id });
    return successResponse(res, {
      cardId: rfidCard.cardId,
      user: {
        id: rfidCard.userId._id,
        name: rfidCard.userId.name,
        email: rfidCard.userId.email,
        role: rfidCard.userId.role
      },
      userType: rfidCard.userType,
      location: location || rfidCard.location,
      lastUsed: rfidCard.lastUsed,
      status: rfidCard.status
    }, 'RFID card validated successfully');
  } catch (error) {
    logger.error('Error validating RFID card:', error);
    return errorResponse(res, error.message);
  }
};

// Get RFID Cards
const getRfidCards = async (req, res) => {
  try {
    logger.info('Fetching RFID cards');
    
    const { page, limit, status, userType, location, search } = req.query;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (userType && !VALID_USER_TYPES.includes(userType)) {
      errors.push('Invalid user type. Must be one of: ' + VALID_USER_TYPES.join(', '));
    }
    
    if (location && !VALID_LOCATIONS.includes(location)) {
      errors.push('Invalid location. Must be one of: ' + VALID_LOCATIONS.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Build query
    const query = { institution: institutionId, isActive: true };
    if (status) query.status = status;
    if (userType) query.userType = userType;
    if (location) query.location = location;
    if (search) {
      query.$or = [
        { cardId: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (pageNum - 1) * limitNum;
    const rfidCards = await RfidCard.find(query)
      .populate('userId', 'name email role')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await RfidCard.countDocuments(query);
    
    logger.info('RFID cards fetched successfully');
    return successResponse(res, {
      rfidCards,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'RFID cards retrieved successfully');
  } catch (error) {
    logger.error('Error fetching RFID cards:', error);
    return errorResponse(res, error.message);
  }
};

// Get RFID Card by ID
const getRfidCardById = async (req, res) => {
  try {
    logger.info('Fetching RFID card by ID');
    
    const { id } = req.params;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'RFID Card ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const rfidCard = await RfidCard.findOne({
      _id: id,
      institution: institutionId,
      isActive: true
    })
      .populate('userId', 'name email role')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!rfidCard) {
      return notFoundResponse(res, 'RFID card not found');
    }
    
    logger.info('RFID card fetched successfully:', { cardId: id });
    return successResponse(res, rfidCard, 'RFID card retrieved successfully');
  } catch (error) {
    logger.error('Error fetching RFID card:', error);
    return errorResponse(res, error.message);
  }
};

// Update RFID Card
const updateRfidCard = async (req, res) => {
  try {
    logger.info('Updating RFID card');
    
    const { id } = req.params;
    const { status, location, metadata } = req.body;
    const institutionId = req.user?.institution;
    const updatedBy = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'RFID Card ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (location !== undefined && !VALID_LOCATIONS.includes(location)) {
      errors.push('Invalid location. Must be one of: ' + VALID_LOCATIONS.join(', '));
    }
    
    if (metadata !== undefined && typeof metadata !== 'object') {
      errors.push('Metadata must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const rfidCard = await RfidCard.findOne({
      _id: id,
      institution: institutionId,
      isActive: true
    });
    
    if (!rfidCard) {
      return notFoundResponse(res, 'RFID card not found');
    }
    
    // Update fields
    if (status) {
      rfidCard.status = status;
      if (status === 'blocked' || status === 'lost' || status === 'damaged') {
        rfidCard.isActive = false;
      } else if (status === 'active') {
        rfidCard.isActive = true;
      }
    }
    
    if (location) {
      rfidCard.location = location;
    }
    
    if (metadata) {
      rfidCard.metadata = { ...rfidCard.metadata, ...metadata };
    }
    
    rfidCard.updatedBy = updatedBy;
    await rfidCard.save();
    
    logger.info('RFID card updated successfully:', { cardId: id });
    return successResponse(res, {
      id: rfidCard._id,
      cardId: rfidCard.cardId,
      status: rfidCard.status,
      location: rfidCard.location,
      isActive: rfidCard.isActive,
      updatedAt: rfidCard.updatedAt
    }, 'RFID card updated successfully');
  } catch (error) {
    logger.error('Error updating RFID card:', error);
    return errorResponse(res, error.message);
  }
};

// Delete RFID Card
const deleteRfidCard = async (req, res) => {
  try {
    logger.info('Deleting RFID card');
    
    const { id } = req.params;
    const institutionId = req.user?.institution;
    const updatedBy = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'RFID Card ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const rfidCard = await RfidCard.findOne({
      _id: id,
      institution: institutionId,
      isActive: true
    });
    
    if (!rfidCard) {
      return notFoundResponse(res, 'RFID card not found');
    }
    
    // Soft delete
    rfidCard.isActive = false;
    rfidCard.status = 'inactive';
    rfidCard.updatedBy = updatedBy;
    await rfidCard.save();
    
    logger.info('RFID card deleted successfully:', { cardId: id });
    return successResponse(res, null, 'RFID card deactivated successfully');
  } catch (error) {
    logger.error('Error deleting RFID card:', error);
    return errorResponse(res, error.message);
  }
};

// Block RFID Card
const blockRfidCard = async (req, res) => {
  try {
    logger.info('Blocking RFID card');
    
    const { id } = req.params;
    const { reason } = req.body;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'RFID Card ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (reason && reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const rfidCard = await RfidCard.findOne({
      _id: id,
      institution: institutionId,
      isActive: true
    });
    
    if (!rfidCard) {
      return notFoundResponse(res, 'RFID card not found');
    }
    
    await rfidCard.blockCard(reason || 'Manual block');
    
    logger.info('RFID card blocked successfully:', { cardId: id, reason });
    return successResponse(res, null, 'RFID card blocked successfully');
  } catch (error) {
    logger.error('Error blocking RFID card:', error);
    return errorResponse(res, error.message);
  }
};

// Activate RFID Card
const activateRfidCard = async (req, res) => {
  try {
    logger.info('Activating RFID card');
    
    const { id } = req.params;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'RFID Card ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const rfidCard = await RfidCard.findOne({
      _id: id,
      institution: institutionId
    });
    
    if (!rfidCard) {
      return notFoundResponse(res, 'RFID card not found');
    }
    
    await rfidCard.activateCard();
    
    logger.info('RFID card activated successfully:', { cardId: id });
    return successResponse(res, null, 'RFID card activated successfully');
  } catch (error) {
    logger.error('Error activating RFID card:', error);
    return errorResponse(res, error.message);
  }
};

// Get RFID Card Statistics
const getRfidStatistics = async (req, res) => {
  try {
    logger.info('Fetching RFID statistics');
    
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const totalCards = await RfidCard.countDocuments({
      institution: institutionId,
      isActive: true
    });
    
    const activeCards = await RfidCard.countDocuments({
      institution: institutionId,
      isActive: true,
      status: 'active'
    });
    
    const blockedCards = await RfidCard.countDocuments({
      institution: institutionId,
      status: 'blocked'
    });
    
    const lostCards = await RfidCard.countDocuments({
      institution: institutionId,
      status: 'lost'
    });
    
    const damagedCards = await RfidCard.countDocuments({
      institution: institutionId,
      status: 'damaged'
    });
    
    const byLocation = await RfidCard.aggregate([
      {
        $match: {
          institution: new mongoose.Types.ObjectId(institutionId),
          isActive: true
        }
      },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const byUserType = await RfidCard.aggregate([
      {
        $match: {
          institution: new mongoose.Types.ObjectId(institutionId),
          isActive: true
        }
      },
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const statistics = {
      total: totalCards,
      active: activeCards,
      blocked: blockedCards,
      lost: lostCards,
      damaged: damagedCards,
      byLocation: byLocation.map(item => ({
        location: item._id,
        count: item.count
      })),
      byUserType: byUserType.map(item => ({
        userType: item._id,
        count: item.count
      }))
    };
    
    logger.info('RFID statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching RFID statistics:', error);
    return errorResponse(res, error.message);
  }
};


export default {
  createRfidCard,
  validateRfidCard,
  getRfidCards,
  getRfidCardById,
  updateRfidCard,
  deleteRfidCard,
  blockRfidCard,
  activateRfidCard,
  getRfidStatistics
};
