import * as guardianService from '../services/guardianService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'suspended', 'archived'];
const VALID_RELATIONSHIPS = ['father', 'mother', 'guardian', 'grandfather', 'grandmother', 'uncle', 'aunt', 'sibling', 'other'];
const VALID_PERMISSIONS = ['view_grades', 'view_attendance', 'view_fees', 'make_payments', 'receive_notifications', 'view_schedule', 'contact_teachers', 'view_reports'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];

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

// Helper function to validate email
const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  return null;
};

// Helper function to validate phone
const validatePhone = (phone) => {
  if (!phone || phone.trim().length === 0) {
    return null;
  }
  const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
  if (!phoneRegex.test(phone)) {
    return 'Invalid phone number format';
  }
  return null;
};

const getAllGuardians = async (req, res, next) => {
  try {
    logger.info('Fetching all guardians');
    
    const { schoolId } = req.params;
    const { status, search, page, limit, relationship, hasPermission } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (relationship && !VALID_RELATIONSHIPS.includes(relationship)) {
      errors.push('Invalid relationship. Must be one of: ' + VALID_RELATIONSHIPS.join(', '));
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
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = { status, search, page: pageNum, limit: limitNum, relationship, hasPermission };
    const result = await guardianService.getAllGuardians(schoolId, filters);
    
    logger.info('Guardians fetched successfully');
    return successResponse(res, result, 'Guardians retrieved successfully');
  } catch (error) {
    logger.error('Error fetching guardians:', error);
    next(error);
  }
};

const getGuardianById = async (req, res, next) => {
  try {
    logger.info('Fetching guardian by ID');
    
    const { schoolId, guardianId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const guardianIdError = validateObjectId(guardianId, 'Guardian ID');
    if (guardianIdError) errors.push(guardianIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const guardian = await guardianService.getGuardianById(guardianId, schoolId);
    
    if (!guardian) {
      return notFoundResponse(res, 'Guardian not found');
    }
    
    logger.info('Guardian fetched successfully:', { guardianId });
    return successResponse(res, guardian, 'Guardian retrieved successfully');
  } catch (error) {
    logger.error('Error fetching guardian:', error);
    next(error);
  }
};

const getGuardiansByStudentId = async (req, res, next) => {
  try {
    logger.info('Fetching guardians by student ID');
    
    const { schoolId, studentId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const guardians = await guardianService.getGuardiansByStudentId(studentId, schoolId);
    
    logger.info('Guardians fetched successfully for student:', { studentId });
    return successResponse(res, guardians, 'Guardians retrieved successfully');
  } catch (error) {
    logger.error('Error fetching guardians by student:', error);
    next(error);
  }
};

const getPrimaryGuardian = async (req, res, next) => {
  try {
    logger.info('Fetching primary guardian');
    
    const { schoolId, studentId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const guardian = await guardianService.getPrimaryGuardian(studentId, schoolId);
    
    if (!guardian) {
      return notFoundResponse(res, 'Primary guardian not found');
    }
    
    logger.info('Primary guardian fetched successfully:', { studentId });
    return successResponse(res, guardian, 'Primary guardian retrieved successfully');
  } catch (error) {
    logger.error('Error fetching primary guardian:', error);
    next(error);
  }
};

const getEmergencyContacts = async (req, res, next) => {
  try {
    logger.info('Fetching emergency contacts');
    
    const { schoolId, studentId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const guardians = await guardianService.getEmergencyContacts(studentId, schoolId);
    
    logger.info('Emergency contacts fetched successfully:', { studentId });
    return successResponse(res, guardians, 'Emergency contacts retrieved successfully');
  } catch (error) {
    logger.error('Error fetching emergency contacts:', error);
    next(error);
  }
};

const createGuardian = async (req, res, next) => {
  try {
    logger.info('Creating guardian');
    
    const { schoolId } = req.params;
    const { firstName, lastName, email, phone, relationship, address, occupation, emergencyContact } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!firstName || firstName.trim().length === 0) {
      errors.push('First name is required');
    } else if (firstName.length > 50) {
      errors.push('First name must not exceed 50 characters');
    }
    
    if (!lastName || lastName.trim().length === 0) {
      errors.push('Last name is required');
    } else if (lastName.length > 50) {
      errors.push('Last name must not exceed 50 characters');
    }
    
    const emailError = validateEmail(email);
    if (emailError) errors.push(emailError);
    
    const phoneError = validatePhone(phone);
    if (phoneError) errors.push(phoneError);
    
    if (relationship && !VALID_RELATIONSHIPS.includes(relationship)) {
      errors.push('Invalid relationship. Must be one of: ' + VALID_RELATIONSHIPS.join(', '));
    }
    
    if (address && address.length > 500) {
      errors.push('Address must not exceed 500 characters');
    }
    
    if (occupation && occupation.length > 100) {
      errors.push('Occupation must not exceed 100 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const guardianData = { ...req.body, schoolId };
    const guardian = await guardianService.createGuardian(guardianData);
    
    logger.info('Guardian created successfully:', { guardianId: guardian._id });
    return createdResponse(res, guardian, 'Guardian created successfully');
  } catch (error) {
    logger.error('Error creating guardian:', error);
    next(error);
  }
};

const updateGuardian = async (req, res, next) => {
  try {
    logger.info('Updating guardian');
    
    const { schoolId, guardianId } = req.params;
    const { firstName, lastName, email, phone, relationship, address, occupation, status } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const guardianIdError = validateObjectId(guardianId, 'Guardian ID');
    if (guardianIdError) errors.push(guardianIdError);
    
    if (firstName !== undefined) {
      if (!firstName || firstName.trim().length === 0) {
        errors.push('First name cannot be empty');
      } else if (firstName.length > 50) {
        errors.push('First name must not exceed 50 characters');
      }
    }
    
    if (lastName !== undefined) {
      if (!lastName || lastName.trim().length === 0) {
        errors.push('Last name cannot be empty');
      } else if (lastName.length > 50) {
        errors.push('Last name must not exceed 50 characters');
      }
    }
    
    if (email !== undefined) {
      const emailError = validateEmail(email);
      if (emailError) errors.push(emailError);
    }
    
    if (phone !== undefined) {
      const phoneError = validatePhone(phone);
      if (phoneError) errors.push(phoneError);
    }
    
    if (relationship !== undefined && !VALID_RELATIONSHIPS.includes(relationship)) {
      errors.push('Invalid relationship. Must be one of: ' + VALID_RELATIONSHIPS.join(', '));
    }
    
    if (address !== undefined && address.length > 500) {
      errors.push('Address must not exceed 500 characters');
    }
    
    if (occupation !== undefined && occupation.length > 100) {
      errors.push('Occupation must not exceed 100 characters');
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const guardian = await guardianService.updateGuardian(guardianId, schoolId, req.body);
    
    if (!guardian) {
      return notFoundResponse(res, 'Guardian not found');
    }
    
    logger.info('Guardian updated successfully:', { guardianId });
    return successResponse(res, guardian, 'Guardian updated successfully');
  } catch (error) {
    logger.error('Error updating guardian:', error);
    next(error);
  }
};

const deleteGuardian = async (req, res, next) => {
  try {
    logger.info('Deleting guardian');
    
    const { schoolId, guardianId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const guardianIdError = validateObjectId(guardianId, 'Guardian ID');
    if (guardianIdError) errors.push(guardianIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const guardian = await guardianService.deleteGuardian(guardianId, schoolId);
    
    if (!guardian) {
      return notFoundResponse(res, 'Guardian not found');
    }
    
    logger.info('Guardian deleted successfully:', { guardianId });
    return successResponse(res, null, 'Guardian deleted successfully');
  } catch (error) {
    logger.error('Error deleting guardian:', error);
    next(error);
  }
};

const addChildToGuardian = async (req, res, next) => {
  try {
    logger.info('Adding child to guardian');
    
    const { schoolId, guardianId } = req.params;
    const { studentId, relationship, isPrimary, isEmergencyContact } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const guardianIdError = validateObjectId(guardianId, 'Guardian ID');
    if (guardianIdError) errors.push(guardianIdError);
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (relationship && !VALID_RELATIONSHIPS.includes(relationship)) {
      errors.push('Invalid relationship. Must be one of: ' + VALID_RELATIONSHIPS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const guardian = await guardianService.addChildToGuardian(guardianId, schoolId, req.body);
    
    if (!guardian) {
      return notFoundResponse(res, 'Guardian not found');
    }
    
    logger.info('Child added to guardian successfully:', { guardianId, studentId });
    return successResponse(res, guardian, 'Child added successfully');
  } catch (error) {
    logger.error('Error adding child to guardian:', error);
    next(error);
  }
};

const removeChildFromGuardian = async (req, res, next) => {
  try {
    logger.info('Removing child from guardian');
    
    const { schoolId, guardianId, studentId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const guardianIdError = validateObjectId(guardianId, 'Guardian ID');
    if (guardianIdError) errors.push(guardianIdError);
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const guardian = await guardianService.removeChildFromGuardian(guardianId, schoolId, studentId);
    
    if (!guardian) {
      return notFoundResponse(res, 'Guardian not found');
    }
    
    logger.info('Child removed from guardian successfully:', { guardianId, studentId });
    return successResponse(res, guardian, 'Child removed successfully');
  } catch (error) {
    logger.error('Error removing child from guardian:', error);
    next(error);
  }
};

const updateChildRelationship = async (req, res, next) => {
  try {
    logger.info('Updating child relationship');
    
    const { schoolId, guardianId, studentId } = req.params;
    const { relationship, isPrimary, isEmergencyContact } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const guardianIdError = validateObjectId(guardianId, 'Guardian ID');
    if (guardianIdError) errors.push(guardianIdError);
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (relationship !== undefined && !VALID_RELATIONSHIPS.includes(relationship)) {
      errors.push('Invalid relationship. Must be one of: ' + VALID_RELATIONSHIPS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const guardian = await guardianService.updateChildRelationship(guardianId, schoolId, studentId, req.body);
    
    if (!guardian) {
      return notFoundResponse(res, 'Guardian not found');
    }
    
    logger.info('Child relationship updated successfully:', { guardianId, studentId });
    return successResponse(res, guardian, 'Relationship updated successfully');
  } catch (error) {
    logger.error('Error updating child relationship:', error);
    next(error);
  }
};

const updateGuardianPermissions = async (req, res, next) => {
  try {
    logger.info('Updating guardian permissions');
    
    const { schoolId, guardianId } = req.params;
    const { permissions } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const guardianIdError = validateObjectId(guardianId, 'Guardian ID');
    if (guardianIdError) errors.push(guardianIdError);
    
    if (permissions && Array.isArray(permissions)) {
      for (let i = 0; i < permissions.length; i++) {
        if (!VALID_PERMISSIONS.includes(permissions[i])) {
          errors.push('Invalid permission at index ' + i + '. Must be one of: ' + VALID_PERMISSIONS.join(', '));
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const guardian = await guardianService.updateGuardianPermissions(guardianId, schoolId, req.body);
    
    if (!guardian) {
      return notFoundResponse(res, 'Guardian not found');
    }
    
    logger.info('Guardian permissions updated successfully:', { guardianId });
    return successResponse(res, guardian, 'Permissions updated successfully');
  } catch (error) {
    logger.error('Error updating guardian permissions:', error);
    next(error);
  }
};

const getGuardianStats = async (req, res, next) => {
  try {
    logger.info('Fetching guardian statistics');
    
    const { schoolId } = req.params;
    
    // Validation
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) {
      return validationErrorResponse(res, [schoolIdError]);
    }
    
    const stats = await guardianService.getGuardianStats(schoolId);
    
    logger.info('Guardian statistics fetched successfully');
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching guardian statistics:', error);
    next(error);
  }
};

const searchGuardians = async (req, res, next) => {
  try {
    logger.info('Searching guardians');
    
    const { schoolId } = req.params;
    const { q, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query (q) is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const guardians = await guardianService.searchGuardians(schoolId, q, { page: pageNum, limit: limitNum });
    
    logger.info('Guardian search completed successfully');
    return successResponse(res, guardians, 'Guardians retrieved successfully');
  } catch (error) {
    logger.error('Error searching guardians:', error);
    next(error);
  }
};

const getGuardiansWithPermission = async (req, res, next) => {
  try {
    logger.info('Fetching guardians with specific permission');
    
    const { schoolId, permission } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!permission || permission.trim().length === 0) {
      errors.push('Permission is required');
    } else if (!VALID_PERMISSIONS.includes(permission)) {
      errors.push('Invalid permission. Must be one of: ' + VALID_PERMISSIONS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const guardians = await guardianService.getGuardiansWithPermission(schoolId, permission);
    
    logger.info('Guardians with permission fetched successfully:', { permission });
    return successResponse(res, guardians, 'Guardians retrieved successfully');
  } catch (error) {
    logger.error('Error fetching guardians with permission:', error);
    next(error);
  }
};

const bulkUpdateStatus = async (req, res, next) => {
  try {
    logger.info('Bulk updating guardian statuses');
    
    const { schoolId } = req.params;
    const { guardianIds, status } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!guardianIds || !Array.isArray(guardianIds) || guardianIds.length === 0) {
      errors.push('Guardian IDs array is required and must not be empty');
    } else {
      if (guardianIds.length > 100) {
        errors.push('Cannot update more than 100 guardians at once');
      }
      
      for (let i = 0; i < Math.min(guardianIds.length, 10); i++) {
        const idError = validateObjectId(guardianIds[i], 'Guardian ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!status || status.trim().length === 0) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await guardianService.bulkUpdateStatus(schoolId, guardianIds, status);
    
    logger.info('Guardian statuses updated successfully:', { count: result.modifiedCount });
    return successResponse(res, result, 'Guardian statuses updated successfully');
  } catch (error) {
    logger.error('Error bulk updating guardian statuses:', error);
    next(error);
  }
};

const exportGuardians = async (req, res, next) => {
  try {
    logger.info('Exporting guardians');
    
    const { schoolId } = req.params;
    const { format, status, relationship } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (relationship && !VALID_RELATIONSHIPS.includes(relationship)) {
      errors.push('Invalid relationship. Must be one of: ' + VALID_RELATIONSHIPS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await guardianService.exportGuardians(schoolId, format.toLowerCase(), { status, relationship });
    
    logger.info('Guardians exported successfully:', { format });
    return successResponse(res, exportData, 'Guardians exported successfully');
  } catch (error) {
    logger.error('Error exporting guardians:', error);
    next(error);
  }
};

const getGuardiansByRelationship = async (req, res, next) => {
  try {
    logger.info('Fetching guardians by relationship');
    
    const { schoolId, relationship } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!relationship || relationship.trim().length === 0) {
      errors.push('Relationship is required');
    } else if (!VALID_RELATIONSHIPS.includes(relationship)) {
      errors.push('Invalid relationship. Must be one of: ' + VALID_RELATIONSHIPS.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await guardianService.getGuardiansByRelationship(schoolId, relationship, { page: pageNum, limit: limitNum });
    
    logger.info('Guardians fetched successfully by relationship:', { relationship });
    return successResponse(res, result, 'Guardians retrieved successfully');
  } catch (error) {
    logger.error('Error fetching guardians by relationship:', error);
    next(error);
  }
};


export default {
  getAllGuardians,
  getGuardianById,
  getGuardiansByStudentId,
  getPrimaryGuardian,
  getEmergencyContacts,
  createGuardian,
  updateGuardian,
  deleteGuardian,
  addChildToGuardian,
  removeChildFromGuardian,
  updateChildRelationship,
  updateGuardianPermissions,
  getGuardianStats,
  searchGuardians,
  getGuardiansWithPermission,
  bulkUpdateStatus,
  exportGuardians,
  getGuardiansByRelationship
};
