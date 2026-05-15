import qrCodeAttendanceService from '../services/qrCodeAttendanceService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid QR session types
const VALID_SESSION_TYPES = ['class', 'event', 'meeting', 'exam'];

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { field: fieldName, message: `Invalid ${fieldName} format` } };
  }
  return { valid: true };
};

/**
 * Validate location data
 */
const validateLocation = (location) => {
  if (!location) return { valid: true };
  
  const { latitude, longitude } = location;
  if (latitude !== undefined && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
    return { valid: false, error: { field: 'latitude', message: 'Latitude must be between -90 and 90' } };
  }
  if (longitude !== undefined && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
    return { valid: false, error: { field: 'longitude', message: 'Longitude must be between -180 and 180' } };
  }
  return { valid: true };
};

// QR Code Attendance
const generateAttendanceQR = async (req, res) => {
  try {
    const { sessionType, classId, duration, expiresAt } = req.body;

    // Validate required fields
    const errors = [];
    if (!sessionType || !VALID_SESSION_TYPES.includes(sessionType)) {
      errors.push({ field: 'sessionType', message: `Session type must be one of: ${VALID_SESSION_TYPES.join(', ')}` });
    }
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (duration && (isNaN(duration) || duration < 1 || duration > 1440)) {
      errors.push({ field: 'duration', message: 'Duration must be between 1 and 1440 minutes' });
    }
    if (expiresAt) {
      const expiry = new Date(expiresAt);
      if (isNaN(expiry.getTime()) || expiry < new Date()) {
        errors.push({ field: 'expiresAt', message: 'Expiry date must be a valid future date' });
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const sessionData = {
      ...req.body,
      schoolId: req.user.tenant,
      teacherId: req.user._id,
    };

    logger.info(`Generating attendance QR for session type: ${sessionType}`);
    const result = await qrCodeAttendanceService.generateAttendanceQR(sessionData);
    
    return createdResponse(res, result, 'QR code generated successfully');
  } catch (error) {
    logger.error('Error generating attendance QR:', error);
    return errorResponse(res, error.message, 500);
  }
};

const scanAttendanceQR = async (req, res) => {
  try {
    const { qrCodeData, location } = req.body;

    // Validate required fields
    const errors = [];
    if (!qrCodeData || qrCodeData.length < 10) {
      errors.push({ field: 'qrCodeData', message: 'Valid QR code data is required' });
    }

    // Validate location if provided
    if (location) {
      const locationValidation = validateLocation(location);
      if (!locationValidation.valid) {
        errors.push(locationValidation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Scanning attendance QR for user ${req.user._id}`);
    const result = await qrCodeAttendanceService.scanQRCodeAttendance(
      qrCodeData,
      req.user._id,
      location
    );
    
    return successResponse(res, result, 'Attendance marked successfully');
  } catch (error) {
    logger.error('Error scanning attendance QR:', error);
    return errorResponse(res, error.message, 500);
  }
};

const generatePersonalQR = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    // Validate userId
    const validation = validateObjectId(userId, 'userId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info(`Generating personal QR for user ${userId}`);
    const result = await qrCodeAttendanceService.generatePersonalQR(userId);
    
    return successResponse(res, result, 'Personal QR code generated successfully');
  } catch (error) {
    logger.error('Error generating personal QR:', error);
    return errorResponse(res, error.message, 500);
  }
};

const scanPersonalQR = async (req, res) => {
  try {
    const { qrCodeData, location } = req.body;

    // Validate required fields
    const errors = [];
    if (!qrCodeData || qrCodeData.length < 10) {
      errors.push({ field: 'qrCodeData', message: 'Valid QR code data is required' });
    }

    // Validate location if provided
    if (location) {
      const locationValidation = validateLocation(location);
      if (!locationValidation.valid) {
        errors.push(locationValidation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Scanning personal QR for tenant ${req.user.tenant}`);
    const result = await qrCodeAttendanceService.scanPersonalQR(
      qrCodeData,
      req.user.tenant,
      req.user._id
    );
    
    return successResponse(res, result, 'Attendance marked successfully');
  } catch (error) {
    logger.error('Error scanning personal QR:', error);
    return errorResponse(res, error.message, 500);
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const { sessionType, page = 1, limit = 20 } = req.query;

    // Validate sessionType if provided
    if (sessionType && !VALID_SESSION_TYPES.includes(sessionType)) {
      return validationErrorResponse(res, [{ field: 'sessionType', message: `Session type must be one of: ${VALID_SESSION_TYPES.join(', ')}` }]);
    }

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return validationErrorResponse(res, [{ field: 'page', message: 'Page must be a positive integer' }]);
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return validationErrorResponse(res, [{ field: 'limit', message: 'Limit must be between 1 and 100' }]);
    }

    logger.info(`Fetching active sessions for tenant ${req.user.tenant}`);
    const sessions = await qrCodeAttendanceService.getActiveSessions(req.user.tenant, { 
      sessionType, 
      page: pageNum, 
      limit: limitNum 
    });
    
    return successResponse(res, sessions, 'Active sessions fetched successfully');
  } catch (error) {
    logger.error('Error fetching active sessions:', error);
    return errorResponse(res, error.message, 500);
  }
};

const invalidateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Validate sessionId
    const validation = validateObjectId(sessionId, 'sessionId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info(`Invalidating session ${sessionId}`);
    const result = await qrCodeAttendanceService.invalidateSession(sessionId);
    
    if (!result) {
      return notFoundResponse(res, 'Session not found');
    }

    return successResponse(res, result, 'Session invalidated successfully');
  } catch (error) {
    logger.error('Error invalidating session:', error);
    return errorResponse(res, error.message, 500);
  }
};

const getQRCodeStats = async (req, res) => {
  try {
    const { startDate, endDate, sessionType, page = 1, limit = 20 } = req.query;

    // Validate date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
      }
    }

    // Validate sessionType if provided
    if (sessionType && !VALID_SESSION_TYPES.includes(sessionType)) {
      return validationErrorResponse(res, [{ field: 'sessionType', message: `Session type must be one of: ${VALID_SESSION_TYPES.join(', ')}` }]);
    }

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return validationErrorResponse(res, [{ field: 'page', message: 'Page must be a positive integer' }]);
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return validationErrorResponse(res, [{ field: 'limit', message: 'Limit must be between 1 and 100' }]);
    }

    logger.info(`Fetching QR code stats for tenant ${req.user.tenant}`);
    const stats = await qrCodeAttendanceService.getStatistics(req.user.tenant, { 
      startDate, 
      endDate, 
      sessionType, 
      page: pageNum, 
      limit: limitNum 
    });
    
    return successResponse(res, stats, 'Statistics fetched successfully');
  } catch (error) {
    logger.error('Error fetching QR code stats:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get all attendance methods for a user
 */
const getUserAttendanceMethods = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    const validation = validateObjectId(userId, 'userId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info(`Fetching attendance methods for user ${userId}`);
    
    const [personalQR] = await Promise.all([
      qrCodeAttendanceService.getPersonalQR(userId).catch(() => null)
    ]);

    const methods = {
      personalQR: personalQR ? { enabled: true, qrCode: personalQR.qrCode } : { enabled: false }
    };

    return successResponse(res, methods, 'Attendance methods fetched successfully');
  } catch (error) {
    logger.error('Error fetching user attendance methods:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get attendance history for advanced methods
 */
const getAdvancedAttendanceHistory = async (req, res) => {
  try {
    const { userId, method, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Validate userId if provided
    if (userId) {
      const validation = validateObjectId(userId, 'userId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }
    }

    // Validate method if provided
    const validMethods = ['qr', 'all'];
    if (method && !validMethods.includes(method)) {
      return validationErrorResponse(res, [{ field: 'method', message: `Method must be one of: ${validMethods.join(', ')}` }]);
    }

    // Validate date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
      }
    }

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return validationErrorResponse(res, [{ field: 'page', message: 'Page must be a positive integer' }]);
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return validationErrorResponse(res, [{ field: 'limit', message: 'Limit must be between 1 and 100' }]);
    }

    logger.info(`Fetching advanced attendance history for tenant ${req.user.tenant}`);
    
    // TODO: Implement service method to fetch combined history
    const history = {
      data: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0,
        pages: 0
      }
    };

    return successResponse(res, history, 'Attendance history fetched successfully');
  } catch (error) {
    logger.error('Error fetching attendance history:', error);
    return errorResponse(res, error.message, 500);
  }
};


export default {
  generateAttendanceQR,
  scanAttendanceQR,
  generatePersonalQR,
  scanPersonalQR,
  getActiveSessions,
  invalidateSession,
  getQRCodeStats,
  getUserAttendanceMethods,
  getAdvancedAttendanceHistory,
};
