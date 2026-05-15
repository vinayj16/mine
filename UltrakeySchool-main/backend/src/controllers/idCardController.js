import idCardService from '../services/idCardService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_USER_TYPES = ['student', 'teacher', 'staff'];
const VALID_CARD_STATUSES = ['active', 'inactive', 'expired', 'revoked'];
const VALID_EXPORT_FORMATS = ['json', 'pdf', 'png', 'jpg'];

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

// Generate Student ID Card
const generateStudentIDCard = async (req, res) => {
  try {
    logger.info('Generating student ID card');
    
    const { studentId } = req.params;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const idCard = await idCardService.generateStudentIDCard(studentId, req.user.tenant);
    
    if (!idCard) {
      return notFoundResponse(res, 'Student not found');
    }
    
    logger.info('Student ID card generated successfully:', { studentId });
    return successResponse(res, idCard, 'Student ID card generated successfully');
  } catch (error) {
    logger.error('Error generating student ID card:', error);
    return errorResponse(res, error.message);
  }
};

// Generate Teacher ID Card
const generateTeacherIDCard = async (req, res) => {
  try {
    logger.info('Generating teacher ID card');
    
    const { teacherId } = req.params;
    
    // Validation
    const errors = [];
    
    const teacherIdError = validateObjectId(teacherId, 'Teacher ID');
    if (teacherIdError) errors.push(teacherIdError);
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const idCard = await idCardService.generateTeacherIDCard(teacherId, req.user.tenant);
    
    if (!idCard) {
      return notFoundResponse(res, 'Teacher not found');
    }
    
    logger.info('Teacher ID card generated successfully:', { teacherId });
    return successResponse(res, idCard, 'Teacher ID card generated successfully');
  } catch (error) {
    logger.error('Error generating teacher ID card:', error);
    return errorResponse(res, error.message);
  }
};

// Generate Staff ID Card
const generateStaffIDCard = async (req, res) => {
  try {
    logger.info('Generating staff ID card');
    
    const { staffId } = req.params;
    
    // Validation
    const errors = [];
    
    const staffIdError = validateObjectId(staffId, 'Staff ID');
    if (staffIdError) errors.push(staffIdError);
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const idCard = await idCardService.generateStaffIDCard(staffId, req.user.tenant);
    
    if (!idCard) {
      return notFoundResponse(res, 'Staff not found');
    }
    
    logger.info('Staff ID card generated successfully:', { staffId });
    return successResponse(res, idCard, 'Staff ID card generated successfully');
  } catch (error) {
    logger.error('Error generating staff ID card:', error);
    return errorResponse(res, error.message);
  }
};

// Generate My ID Card
const generateMyIDCard = async (req, res) => {
  try {
    logger.info('Generating my ID card');
    
    // Validation
    const errors = [];
    
    if (!req.user?._id) {
      errors.push('User information is required');
    }
    
    if (!req.user?.role) {
      errors.push('User role is required');
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    let idCard;
    
    switch (req.user.role) {
      case 'student':
        idCard = await idCardService.generateStudentIDCard(req.user._id, req.user.tenant);
        break;
      case 'teacher':
        idCard = await idCardService.generateTeacherIDCard(req.user._id, req.user.tenant);
        break;
      default:
        idCard = await idCardService.generateStaffIDCard(req.user._id, req.user.tenant);
    }
    
    if (!idCard) {
      return notFoundResponse(res, 'User not found');
    }
    
    logger.info('My ID card generated successfully:', { userId: req.user._id, role: req.user.role });
    return successResponse(res, idCard, 'ID card generated successfully');
  } catch (error) {
    logger.error('Error generating my ID card:', error);
    return errorResponse(res, error.message);
  }
};

// Verify ID Card
const verifyIDCard = async (req, res) => {
  try {
    logger.info('Verifying ID card');
    
    const { qrData } = req.body;
    
    // Validation
    const errors = [];
    
    if (!qrData || qrData.trim().length === 0) {
      errors.push('QR code data is required');
    } else if (qrData.length > 1000) {
      errors.push('QR code data must not exceed 1000 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const verification = await idCardService.verifyIDCard(qrData);
    
    logger.info('ID card verification completed');
    return successResponse(res, verification, 'ID card verification completed');
  } catch (error) {
    logger.error('Error verifying ID card:', error);
    return errorResponse(res, error.message);
  }
};

// Generate Bulk ID Cards
const generateBulkIDCards = async (req, res) => {
  try {
    logger.info('Generating bulk ID cards');
    
    const { userIds, userType } = req.body;
    
    // Validation
    const errors = [];
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      errors.push('User IDs array is required and must not be empty');
    } else {
      if (userIds.length > 100) {
        errors.push('Cannot generate more than 100 ID cards at once');
      }
      
      for (let i = 0; i < Math.min(userIds.length, 10); i++) {
        const idError = validateObjectId(userIds[i], 'User ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!userType || userType.trim().length === 0) {
      errors.push('User type is required');
    } else if (!VALID_USER_TYPES.includes(userType)) {
      errors.push('Invalid user type. Must be one of: ' + VALID_USER_TYPES.join(', '));
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const idCards = await idCardService.generateBulkIDCards(userIds, req.user.tenant, userType);
    
    logger.info('Bulk ID cards generated successfully:', { count: idCards.length, userType });
    return successResponse(res, idCards, idCards.length + ' ID cards generated successfully');
  } catch (error) {
    logger.error('Error generating bulk ID cards:', error);
    return errorResponse(res, error.message);
  }
};

// Get ID Card Template
const getIDCardTemplate = async (req, res) => {
  try {
    logger.info('Fetching ID card template');
    
    // Validation
    if (!req.user?.tenant) {
      return validationErrorResponse(res, ['Tenant information is required']);
    }
    
    const template = await idCardService.getIDCardTemplate(req.user.tenant);
    
    if (!template) {
      return notFoundResponse(res, 'ID card template not found');
    }
    
    logger.info('ID card template fetched successfully');
    return successResponse(res, template, 'ID card template fetched successfully');
  } catch (error) {
    logger.error('Error fetching ID card template:', error);
    return errorResponse(res, error.message);
  }
};

// Update ID Card Template
const updateIDCardTemplate = async (req, res) => {
  try {
    logger.info('Updating ID card template');
    
    const { layout, colors, logo, fields } = req.body;
    
    // Validation
    const errors = [];
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (layout && typeof layout !== 'object') {
      errors.push('Layout must be an object');
    }
    
    if (colors && typeof colors !== 'object') {
      errors.push('Colors must be an object');
    }
    
    if (logo && logo.length > 500) {
      errors.push('Logo URL must not exceed 500 characters');
    }
    
    if (fields && !Array.isArray(fields)) {
      errors.push('Fields must be an array');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const template = await idCardService.updateIDCardTemplate(req.user.tenant, req.body);
    
    if (!template) {
      return notFoundResponse(res, 'ID card template not found');
    }
    
    logger.info('ID card template updated successfully');
    return successResponse(res, template, 'ID card template updated successfully');
  } catch (error) {
    logger.error('Error updating ID card template:', error);
    return errorResponse(res, error.message);
  }
};

// Get ID Card by ID
const getIDCardById = async (req, res) => {
  try {
    logger.info('Fetching ID card by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'ID Card ID');
    if (idError) errors.push(idError);
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const idCard = await idCardService.getIDCardById(id, req.user.tenant);
    
    if (!idCard) {
      return notFoundResponse(res, 'ID card not found');
    }
    
    logger.info('ID card fetched successfully:', { idCardId: id });
    return successResponse(res, idCard, 'ID card retrieved successfully');
  } catch (error) {
    logger.error('Error fetching ID card:', error);
    return errorResponse(res, error.message);
  }
};

// Update ID Card Status
const updateIDCardStatus = async (req, res) => {
  try {
    logger.info('Updating ID card status');
    
    const { id } = req.params;
    const { status, reason } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'ID Card ID');
    if (idError) errors.push(idError);
    
    if (!status || status.trim().length === 0) {
      errors.push('Status is required');
    } else if (!VALID_CARD_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_CARD_STATUSES.join(', '));
    }
    
    if (reason && reason.length > 500) {
      errors.push('Reason must not exceed 500 characters');
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const idCard = await idCardService.updateIDCardStatus(id, req.user.tenant, status, reason);
    
    if (!idCard) {
      return notFoundResponse(res, 'ID card not found');
    }
    
    logger.info('ID card status updated successfully:', { idCardId: id, status });
    return successResponse(res, idCard, 'ID card status updated successfully');
  } catch (error) {
    logger.error('Error updating ID card status:', error);
    return errorResponse(res, error.message);
  }
};

// Get All ID Cards
const getAllIDCards = async (req, res) => {
  try {
    logger.info('Fetching all ID cards');
    
    const { userType, status, page, limit, search } = req.query;
    
    // Validation
    const errors = [];
    
    if (userType && !VALID_USER_TYPES.includes(userType)) {
      errors.push('Invalid user type. Must be one of: ' + VALID_USER_TYPES.join(', '));
    }
    
    if (status && !VALID_CARD_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_CARD_STATUSES.join(', '));
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
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await idCardService.getAllIDCards(req.user.tenant, {
      userType,
      status,
      page: pageNum,
      limit: limitNum,
      search
    });
    
    logger.info('ID cards fetched successfully');
    return successResponse(res, result, 'ID cards retrieved successfully');
  } catch (error) {
    logger.error('Error fetching ID cards:', error);
    return errorResponse(res, error.message);
  }
};

// Export ID Cards
const exportIDCards = async (req, res) => {
  try {
    logger.info('Exporting ID cards');
    
    const { format, userType, status } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (userType && !VALID_USER_TYPES.includes(userType)) {
      errors.push('Invalid user type. Must be one of: ' + VALID_USER_TYPES.join(', '));
    }
    
    if (status && !VALID_CARD_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_CARD_STATUSES.join(', '));
    }
    
    if (!req.user?.tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await idCardService.exportIDCards(req.user.tenant, format.toLowerCase(), {
      userType,
      status
    });
    
    logger.info('ID cards exported successfully:', { format });
    return successResponse(res, exportData, 'ID cards exported successfully');
  } catch (error) {
    logger.error('Error exporting ID cards:', error);
    return errorResponse(res, error.message);
  }
};

// Get ID Card Statistics
const getIDCardStatistics = async (req, res) => {
  try {
    logger.info('Fetching ID card statistics');
    
    // Validation
    if (!req.user?.tenant) {
      return validationErrorResponse(res, ['Tenant information is required']);
    }
    
    const statistics = await idCardService.getIDCardStatistics(req.user.tenant);
    
    logger.info('ID card statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching ID card statistics:', error);
    return errorResponse(res, error.message);
  }
};


export default {
  generateStudentIDCard,
  generateTeacherIDCard,
  generateStaffIDCard,
  generateMyIDCard,
  verifyIDCard,
  generateBulkIDCards,
  getIDCardTemplate,
  updateIDCardTemplate,
  getIDCardById,
  updateIDCardStatus,
  getAllIDCards,
  exportIDCards,
  getIDCardStatistics
};
