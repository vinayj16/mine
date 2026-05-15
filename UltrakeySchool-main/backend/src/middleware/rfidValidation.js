import RfidCard from '../models/rfidCard.js';
import { logger } from '../utils/logger.js';

// Middleware to validate RFID card for attendance
export const validateRfidForAttendance = async (req, res, next) => {
  try {
    const { cardId, location } = req.body;
    const institutionId = req.user.institution;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: 'RFID card ID is required for attendance'
      });
    }

    // Find active RFID card
    const rfidCard = await RfidCard.findOne({
      cardId,
      institution: institutionId,
      isActive: true,
      status: 'active'
    }).populate('userId', 'name email role');

    if (!rfidCard) {
      logger.warn(`Invalid RFID card used for attendance: ${cardId} by user: ${req.user.name}`);
      
      return res.status(404).json({
        success: false,
        message: 'Invalid or inactive RFID card',
        code: 'INVALID_RFID_CARD'
      });
    }

    // Update last used timestamp
    await rfidCard.updateLastUsed();

    // Add RFID card info to request
    req.rfidCard = rfidCard;

    logger.info(`RFID card validated for attendance: ${cardId} for user: ${rfidCard.userId.name}`);

    next();

  } catch (error) {
    logger.error('Error validating RFID for attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during RFID validation'
    });
  }
};

// Middleware to validate RFID card for access control
export const validateRfidForAccess = async (req, res, next) => {
  try {
    const { cardId, location } = req.body;
    const institutionId = req.user.institution;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: 'RFID card ID is required for access'
      });
    }

    // Find active RFID card
    const rfidCard = await RfidCard.findOne({
      cardId,
      institution: institutionId,
      isActive: true,
      status: 'active'
    }).populate('userId', 'name email role');

    if (!rfidCard) {
      logger.warn(`Invalid RFID card used for access: ${cardId} at location: ${location || 'unknown'}`);
      
      return res.status(403).json({
        success: false,
        message: 'Access denied: Invalid or inactive RFID card',
        code: 'ACCESS_DENIED_INVALID_RFID'
      });
    }

    // Check if user has access to this location
    const allowedLocations = ['gate', 'library', 'transport', 'classroom', 'office'];
    if (location && !allowedLocations.includes(location)) {
      logger.warn(`Unauthorized location access attempt: ${location} with RFID: ${cardId}`);
      
      return res.status(403).json({
        success: false,
        message: 'Access denied: Unauthorized location',
        code: 'ACCESS_DENIED_UNAUTHORIZED_LOCATION'
      });
    }

    // Update last used timestamp
    await rfidCard.updateLastUsed();

    // Add RFID card info to request
    req.rfidCard = rfidCard;

    logger.info(`RFID card validated for access: ${cardId} for user: ${rfidCard.userId.name} at location: ${location}`);

    next();

  } catch (error) {
    logger.error('Error validating RFID for access:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during RFID validation'
    });
  }
};

// Middleware to validate RFID card for library access
export const validateRfidForLibrary = async (req, res, next) => {
  try {
    const { cardId } = req.body;
    const institutionId = req.user.institution;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: 'RFID card ID is required for library access'
      });
    }

    // Find active RFID card
    const rfidCard = await RfidCard.findOne({
      cardId,
      institution: institutionId,
      isActive: true,
      status: 'active',
      location: 'library'
    }).populate('userId', 'name email role');

    if (!rfidCard) {
      logger.warn(`Invalid RFID card used for library access: ${cardId}`);
      
      return res.status(403).json({
        success: false,
        message: 'Library access denied: Invalid or unauthorized RFID card',
        code: 'LIBRARY_ACCESS_DENIED'
      });
    }

    // Check if user is a student or staff (allowed for library access)
    if (!['student', 'teacher', 'staff'].includes(rfidCard.userType)) {
      logger.warn(`Unauthorized library access attempt: ${rfidCard.userType} with RFID: ${cardId}`);
      
      return res.status(403).json({
        success: false,
        message: 'Library access denied: Unauthorized user type',
        code: 'LIBRARY_ACCESS_DENIED_USER_TYPE'
      });
    }

    // Update last used timestamp
    await rfidCard.updateLastUsed();

    // Add RFID card info to request
    req.rfidCard = rfidCard;

    logger.info(`RFID card validated for library access: ${cardId} for user: ${rfidCard.userId.name}`);

    next();

  } catch (error) {
    logger.error('Error validating RFID for library access:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during RFID validation'
    });
  }
};

// Middleware to validate RFID card for transport access
export const validateRfidForTransport = async (req, res, next) => {
  try {
    const { cardId } = req.body;
    const institutionId = req.user.institution;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: 'RFID card ID is required for transport access'
      });
    }

    // Find active RFID card
    const rfidCard = await RfidCard.findOne({
      cardId,
      institution: institutionId,
      isActive: true,
      status: 'active',
      location: 'transport'
    }).populate('userId', 'name email role');

    if (!rfidCard) {
      logger.warn(`Invalid RFID card used for transport access: ${cardId}`);
      
      return res.status(403).json({
        success: false,
        message: 'Transport access denied: Invalid or unauthorized RFID card',
        code: 'TRANSPORT_ACCESS_DENIED'
      });
    }

    // Check if user is a student (allowed for transport access)
    if (rfidCard.userType !== 'student') {
      logger.warn(`Unauthorized transport access attempt: ${rfidCard.userType} with RFID: ${cardId}`);
      
      return res.status(403).json({
        success: false,
        message: 'Transport access denied: Unauthorized user type',
        code: 'TRANSPORT_ACCESS_DENIED_USER_TYPE'
      });
    }

    // Update last used timestamp
    await rfidCard.updateLastUsed();

    // Add RFID card info to request
    req.rfidCard = rfidCard;

    logger.info(`RFID card validated for transport access: ${cardId} for user: ${rfidCard.userId.name}`);

    next();

  } catch (error) {
    logger.error('Error validating RFID for transport access:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during RFID validation'
    });
  }
};
