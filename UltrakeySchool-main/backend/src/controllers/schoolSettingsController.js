import schoolSettingsService from '../services/schoolSettingsService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'suspended', 'archived'];
const VALID_ACADEMIC_YEAR_FORMATS = /^\d{4}-\d{4}$/;
const VALID_GRADING_SYSTEMS = ['percentage', 'gpa', 'letter', 'points'];
const VALID_ATTENDANCE_MODES = ['manual',];
const MAX_NAME_LENGTH = 200;
const MAX_ADDRESS_LENGTH = 500;

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

// Helper function to validate academic year
const validateAcademicYear = (year) => {
  if (!year) {
    return 'Academic year is required';
  }
  if (!VALID_ACADEMIC_YEAR_FORMATS.test(year)) {
    return 'Invalid academic year format. Expected YYYY-YYYY (e.g., 2023-2024)';
  }
  const [startYear, endYear] = year.split('-').map(Number);
  if (endYear !== startYear + 1) {
    return 'Academic year end must be one year after start';
  }
  return null;
};

// Create school settings
const createSchoolSettings = async (req, res) => {
  try {
    logger.info('Creating school settings');
    
    const { institutionId, academicYear, schoolName } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (schoolName && schoolName.length > MAX_NAME_LENGTH) {
      errors.push('School name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settingsData = {
      ...req.body,
      metadata: { createdBy: userId || 'system' }
    };
    
    const settings = await schoolSettingsService.createSchoolSettings(settingsData);
    
    logger.info('School settings created successfully:', { settingsId: settings._id, institutionId });
    return createdResponse(res, settings, 'School settings created successfully');
  } catch (error) {
    logger.error('Error creating school settings:', error);
    return errorResponse(res, error.message);
  }
};

// Get school settings by ID
const getSchoolSettingsById = async (req, res) => {
  try {
    logger.info('Fetching school settings by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Settings ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await schoolSettingsService.getSchoolSettingsById(id);
    
    if (!settings) {
      return notFoundResponse(res, 'School settings not found');
    }
    
    logger.info('School settings fetched successfully:', { settingsId: id });
    return successResponse(res, settings, 'School settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching school settings:', error);
    return errorResponse(res, error.message);
  }
};

// Get school settings by institution
const getSchoolSettingsByInstitution = async (req, res) => {
  try {
    logger.info('Fetching school settings by institution');
    
    const { institutionId } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await schoolSettingsService.getSchoolSettingsByInstitution(institutionId);
    
    if (!settings) {
      return notFoundResponse(res, 'School settings not found');
    }
    
    logger.info('School settings fetched by institution successfully:', { institutionId });
    return successResponse(res, settings, 'School settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching school settings by institution:', error);
    return errorResponse(res, error.message);
  }
};

// Update school settings
const updateSchoolSettings = async (req, res) => {
  try {
    logger.info('Updating school settings');
    
    const { institutionId } = req.params;
    const { academicYear, schoolName, status } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (academicYear !== undefined) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (schoolName !== undefined && schoolName.length > MAX_NAME_LENGTH) {
      errors.push('School name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updateData = { ...req.body, 'metadata.updatedBy': userId || 'system' };
    const settings = await schoolSettingsService.updateSchoolSettings(institutionId, updateData);
    
    if (!settings) {
      return notFoundResponse(res, 'School settings not found');
    }
    
    logger.info('School settings updated successfully:', { institutionId });
    return successResponse(res, settings, 'School settings updated successfully');
  } catch (error) {
    logger.error('Error updating school settings:', error);
    return errorResponse(res, error.message);
  }
};

// Update basic info
const updateBasicInfo = async (req, res) => {
  try {
    logger.info('Updating basic info');
    
    const { institutionId } = req.params;
    const { schoolName, address, phone, email } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (schoolName && schoolName.length > MAX_NAME_LENGTH) {
      errors.push('School name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (address && address.length > MAX_ADDRESS_LENGTH) {
      errors.push('Address must not exceed ' + MAX_ADDRESS_LENGTH + ' characters');
    }
    
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Invalid email format');
      }
    }
    
    if (phone) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(phone)) {
        errors.push('Invalid phone format');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await schoolSettingsService.updateBasicInfo(institutionId, req.body, userId || 'system');
    
    if (!settings) {
      return notFoundResponse(res, 'School settings not found');
    }
    
    logger.info('Basic info updated successfully:', { institutionId });
    return successResponse(res, settings, 'Basic info updated successfully');
  } catch (error) {
    logger.error('Error updating basic info:', error);
    return errorResponse(res, error.message);
  }
};

// Update academic settings
const updateAcademicSettings = async (req, res) => {
  try {
    logger.info('Updating academic settings');
    
    const { institutionId } = req.params;
    const { academicYear, gradingSystem } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (gradingSystem && !VALID_GRADING_SYSTEMS.includes(gradingSystem)) {
      errors.push('Invalid grading system. Must be one of: ' + VALID_GRADING_SYSTEMS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await schoolSettingsService.updateAcademicSettings(institutionId, req.body, userId || 'system');
    
    if (!settings) {
      return notFoundResponse(res, 'School settings not found');
    }
    
    logger.info('Academic settings updated successfully:', { institutionId });
    return successResponse(res, settings, 'Academic settings updated successfully');
  } catch (error) {
    logger.error('Error updating academic settings:', error);
    return errorResponse(res, error.message);
  }
};

// Update exam settings
const updateExamSettings = async (req, res) => {
  try {
    logger.info('Updating exam settings');
    
    const { institutionId } = req.params;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await schoolSettingsService.updateExamSettings(institutionId, req.body, userId || 'system');
    
    if (!settings) {
      return notFoundResponse(res, 'School settings not found');
    }
    
    logger.info('Exam settings updated successfully:', { institutionId });
    return successResponse(res, settings, 'Exam settings updated successfully');
  } catch (error) {
    logger.error('Error updating exam settings:', error);
    return errorResponse(res, error.message);
  }
};

// Update attendance settings
const updateAttendanceSettings = async (req, res) => {
  try {
    logger.info('Updating attendance settings');
    
    const { institutionId } = req.params;
    const { attendanceMode } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (attendanceMode && !VALID_ATTENDANCE_MODES.includes(attendanceMode)) {
      errors.push('Invalid attendance mode. Must be one of: ' + VALID_ATTENDANCE_MODES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await schoolSettingsService.updateAttendanceSettings(institutionId, req.body, userId || 'system');
    
    if (!settings) {
      return notFoundResponse(res, 'School settings not found');
    }
    
    logger.info('Attendance settings updated successfully:', { institutionId });
    return successResponse(res, settings, 'Attendance settings updated successfully');
  } catch (error) {
    logger.error('Error updating attendance settings:', error);
    return errorResponse(res, error.message);
  }
};

// Update fee settings
const updateFeeSettings = async (req, res) => {
  try {
    logger.info('Updating fee settings');
    
    const { institutionId } = req.params;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await schoolSettingsService.updateFeeSettings(institutionId, req.body, userId || 'system');
    
    if (!settings) {
      return notFoundResponse(res, 'School settings not found');
    }
    
    logger.info('Fee settings updated successfully:', { institutionId });
    return successResponse(res, settings, 'Fee settings updated successfully');
  } catch (error) {
    logger.error('Error updating fee settings:', error);
    return errorResponse(res, error.message);
  }
};

// Update notification settings
const updateNotificationSettings = async (req, res) => {
  try {
    logger.info('Updating notification settings');
    
    const { institutionId } = req.params;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await schoolSettingsService.updateNotificationSettings(institutionId, req.body, userId || 'system');
    
    if (!settings) {
      return notFoundResponse(res, 'School settings not found');
    }
    
    logger.info('Notification settings updated successfully:', { institutionId });
    return successResponse(res, settings, 'Notification settings updated successfully');
  } catch (error) {
    logger.error('Error updating notification settings:', error);
    return errorResponse(res, error.message);
  }
};

// Update logo
const updateLogo = async (req, res) => {
  try {
    logger.info('Updating school logo');
    
    const { institutionId } = req.params;
    const { logoUrl } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!logoUrl || logoUrl.trim().length === 0) {
      errors.push('Logo URL is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await schoolSettingsService.updateLogo(institutionId, req.body, userId || 'system');
    
    if (!settings) {
      return notFoundResponse(res, 'School settings not found');
    }
    
    logger.info('School logo updated successfully:', { institutionId });
    return successResponse(res, settings, 'Logo updated successfully');
  } catch (error) {
    logger.error('Error updating school logo:', error);
    return errorResponse(res, error.message);
  }
};

// Update status
const updateStatus = async (req, res) => {
  try {
    logger.info('Updating school settings status');
    
    const { institutionId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await schoolSettingsService.updateStatus(institutionId, status, userId || 'system');
    
    if (!settings) {
      return notFoundResponse(res, 'School settings not found');
    }
    
    logger.info('School settings status updated successfully:', { institutionId, status });
    return successResponse(res, settings, 'Status updated successfully');
  } catch (error) {
    logger.error('Error updating school settings status:', error);
    return errorResponse(res, error.message);
  }
};

// Get all school settings
const getAllSchoolSettings = async (req, res) => {
  try {
    logger.info('Fetching all school settings');
    
    const { status, academicYear, search, page, limit, sortBy, sortOrder } = req.query;
    
    // Validation
    const errors = [];
    
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
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await schoolSettingsService.getAllSchoolSettings(
      { status, academicYear, search },
      { page: pageNum, limit: limitNum, sortBy: sortBy || 'createdAt', sortOrder: sortOrder || 'desc' }
    );
    
    logger.info('School settings fetched successfully');
    return successResponse(res, {
      settings: result.settings || result,
      pagination: result.pagination
    }, 'School settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching school settings:', error);
    return errorResponse(res, error.message);
  }
};

// Delete school settings
const deleteSchoolSettings = async (req, res) => {
  try {
    logger.info('Deleting school settings');
    
    const { institutionId } = req.params;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await schoolSettingsService.deleteSchoolSettings(institutionId);
    
    logger.info('School settings deleted successfully:', { institutionId });
    return successResponse(res, null, 'School settings deleted successfully');
  } catch (error) {
    logger.error('Error deleting school settings:', error);
    return errorResponse(res, error.message);
  }
};

// Get school settings statistics
const getSchoolSettingsStatistics = async (req, res) => {
  try {
    logger.info('Fetching school settings statistics');
    
    const statistics = await schoolSettingsService.getSchoolSettingsStatistics();
    
    logger.info('School settings statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching school settings statistics:', error);
    return errorResponse(res, error.message);
  }
};

export default {
  createSchoolSettings,
  getSchoolSettingsById,
  getSchoolSettingsByInstitution,
  updateSchoolSettings,
  updateBasicInfo,
  updateAcademicSettings,
  updateExamSettings,
  updateAttendanceSettings,
  updateFeeSettings,
  updateNotificationSettings,
  updateLogo,
  updateStatus,
  getAllSchoolSettings,
  deleteSchoolSettings,
  getSchoolSettingsStatistics
};
