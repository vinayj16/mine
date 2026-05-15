import gdprSettingsService from '../services/gdprSettingsService.js';
import GdprSettings from '../models/GdprSettings.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_RETENTION_PERIODS = ['1year', '2years', '3years', '5years', '7years', '10years', 'indefinite'];
const VALID_DATA_CATEGORIES = ['personal', 'academic', 'financial', 'medical', 'behavioral', 'communication'];

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

const getGdprSettings = async (req, res) => {
  try {
    logger.info('Fetching GDPR settings');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await gdprSettingsService.getGdprSettings(institutionId);
    
    if (!settings) {
      return notFoundResponse(res, 'GDPR settings not found');
    }
    
    logger.info('GDPR settings fetched successfully:', { institutionId });
    return successResponse(res, settings, 'GDPR settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching GDPR settings:', error);
    return errorResponse(res, error.message);
  }
};

const updateGdprSettings = async (req, res) => {
  try {
    logger.info('Updating GDPR settings');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { enabled, dataRetentionPeriod, consentRequired, allowDataExport, allowDataDeletion, cookieConsent, privacyPolicyUrl, termsOfServiceUrl } = req.body;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      errors.push('Enabled must be a boolean value');
    }
    
    if (dataRetentionPeriod && !VALID_RETENTION_PERIODS.includes(dataRetentionPeriod)) {
      errors.push('Invalid data retention period. Must be one of: ' + VALID_RETENTION_PERIODS.join(', '));
    }
    
    if (consentRequired !== undefined && typeof consentRequired !== 'boolean') {
      errors.push('Consent required must be a boolean value');
    }
    
    if (allowDataExport !== undefined && typeof allowDataExport !== 'boolean') {
      errors.push('Allow data export must be a boolean value');
    }
    
    if (allowDataDeletion !== undefined && typeof allowDataDeletion !== 'boolean') {
      errors.push('Allow data deletion must be a boolean value');
    }
    
    if (cookieConsent !== undefined && typeof cookieConsent !== 'boolean') {
      errors.push('Cookie consent must be a boolean value');
    }
    
    if (privacyPolicyUrl && privacyPolicyUrl.length > 500) {
      errors.push('Privacy policy URL must not exceed 500 characters');
    }
    
    if (privacyPolicyUrl && !privacyPolicyUrl.match(/^https?:\/\/.+/)) {
      errors.push('Invalid privacy policy URL format');
    }
    
    if (termsOfServiceUrl && termsOfServiceUrl.length > 500) {
      errors.push('Terms of service URL must not exceed 500 characters');
    }
    
    if (termsOfServiceUrl && !termsOfServiceUrl.match(/^https?:\/\/.+/)) {
      errors.push('Invalid terms of service URL format');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await gdprSettingsService.updateGdprSettings(institutionId, req.body);
    
    logger.info('GDPR settings updated successfully:', { institutionId });
    return successResponse(res, settings, 'GDPR settings updated successfully');
  } catch (error) {
    logger.error('Error updating GDPR settings:', error);
    return errorResponse(res, error.message);
  }
};

const toggleGdpr = async (req, res) => {
  try {
    logger.info('Toggling GDPR status');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { enabled } = req.body;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (enabled === undefined) {
      errors.push('Enabled field is required');
    } else if (typeof enabled !== 'boolean') {
      errors.push('Enabled must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await gdprSettingsService.toggleGdpr(institutionId, enabled);
    
    const message = 'GDPR ' + (enabled ? 'enabled' : 'disabled') + ' successfully';
    logger.info(message + ':', { institutionId });
    return successResponse(res, settings, message);
  } catch (error) {
    logger.error('Error toggling GDPR:', error);
    return errorResponse(res, error.message);
  }
};

const deleteGdprSettings = async (req, res) => {
  try {
    logger.info('Deleting GDPR settings');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await gdprSettingsService.deleteGdprSettings(institutionId);
    
    if (!result) {
      return notFoundResponse(res, 'GDPR settings not found');
    }
    
    logger.info('GDPR settings deleted successfully:', { institutionId });
    return successResponse(res, null, 'GDPR settings deleted successfully');
  } catch (error) {
    logger.error('Error deleting GDPR settings:', error);
    return errorResponse(res, error.message);
  }
};

// Create GDPR Settings
const createGdprSettings = async (req, res) => {
  try {
    logger.info('Creating GDPR settings');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { enabled, dataRetentionPeriod, consentRequired, allowDataExport, allowDataDeletion, cookieConsent, privacyPolicyUrl, termsOfServiceUrl } = req.body;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      errors.push('Enabled must be a boolean value');
    }
    
    if (dataRetentionPeriod && !VALID_RETENTION_PERIODS.includes(dataRetentionPeriod)) {
      errors.push('Invalid data retention period. Must be one of: ' + VALID_RETENTION_PERIODS.join(', '));
    }
    
    if (privacyPolicyUrl && !privacyPolicyUrl.match(/^https?:\/\/.+/)) {
      errors.push('Invalid privacy policy URL format');
    }
    
    if (termsOfServiceUrl && !termsOfServiceUrl.match(/^https?:\/\/.+/)) {
      errors.push('Invalid terms of service URL format');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await gdprSettingsService.createGdprSettings(institutionId, req.body);
    
    logger.info('GDPR settings created successfully:', { institutionId });
    return createdResponse(res, settings, 'GDPR settings created successfully');
  } catch (error) {
    logger.error('Error creating GDPR settings:', error);
    return errorResponse(res, error.message);
  }
};

// Get Compliance Status
const getComplianceStatus = async (req, res) => {
  try {
    logger.info('Fetching GDPR compliance status');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    // Validation
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) {
      return validationErrorResponse(res, [institutionIdError]);
    }
    
    const settings = await GdprSettings.findOne({ institutionId: new mongoose.Types.ObjectId(institutionId) });
    
    if (!settings) {
      return notFoundResponse(res, 'GDPR settings not found');
    }
    
    const complianceStatus = {
      isCompliant: settings.enabled && settings.consentRequired && settings.privacyPolicyUrl && settings.termsOfServiceUrl,
      enabled: settings.enabled,
      consentRequired: settings.consentRequired,
      hasPrivacyPolicy: !!settings.privacyPolicyUrl,
      hasTermsOfService: !!settings.termsOfServiceUrl,
      dataRetentionConfigured: !!settings.dataRetentionPeriod,
      allowsDataExport: settings.allowDataExport,
      allowsDataDeletion: settings.allowDataDeletion,
      cookieConsentEnabled: settings.cookieConsent,
      lastUpdated: settings.updatedAt
    };
    
    logger.info('GDPR compliance status fetched successfully');
    return successResponse(res, complianceStatus, 'Compliance status retrieved successfully');
  } catch (error) {
    logger.error('Error fetching compliance status:', error);
    return errorResponse(res, error.message);
  }
};

// Update Data Retention Policy
const updateDataRetentionPolicy = async (req, res) => {
  try {
    logger.info('Updating data retention policy');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { dataRetentionPeriod, categories } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!dataRetentionPeriod) {
      errors.push('Data retention period is required');
    } else if (!VALID_RETENTION_PERIODS.includes(dataRetentionPeriod)) {
      errors.push('Invalid data retention period. Must be one of: ' + VALID_RETENTION_PERIODS.join(', '));
    }
    
    if (categories && !Array.isArray(categories)) {
      errors.push('Categories must be an array');
    }
    
    if (categories && Array.isArray(categories)) {
      const invalidCategories = categories.filter(cat => !VALID_DATA_CATEGORIES.includes(cat));
      if (invalidCategories.length > 0) {
        errors.push('Invalid categories: ' + invalidCategories.join(', ') + '. Must be one of: ' + VALID_DATA_CATEGORIES.join(', '));
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await GdprSettings.findOneAndUpdate(
      { institutionId: new mongoose.Types.ObjectId(institutionId) },
      { 
        dataRetentionPeriod,
        dataCategories: categories || VALID_DATA_CATEGORIES,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!settings) {
      return notFoundResponse(res, 'GDPR settings not found');
    }
    
    logger.info('Data retention policy updated successfully:', { institutionId });
    return successResponse(res, settings, 'Data retention policy updated successfully');
  } catch (error) {
    logger.error('Error updating data retention policy:', error);
    return errorResponse(res, error.message);
  }
};

// Export GDPR Settings
const exportGdprSettings = async (req, res) => {
  try {
    logger.info('Exporting GDPR settings');
    
    const { format } = req.query;
    
    // Validation
    const errors = [];
    
    const validFormats = ['json', 'csv'];
    if (!format) {
      errors.push('Format is required');
    } else if (!validFormats.includes(format)) {
      errors.push('Invalid format. Must be one of: ' + validFormats.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await GdprSettings.find({}).lean();
    
    logger.info('GDPR settings exported successfully:', { format, count: settings.length });
    return successResponse(res, {
      format,
      count: settings.length,
      data: settings,
      exportedAt: new Date()
    }, 'GDPR settings exported successfully');
  } catch (error) {
    logger.error('Error exporting GDPR settings:', error);
    return errorResponse(res, error.message);
  }
};


export default {
  getGdprSettings,
  updateGdprSettings,
  toggleGdpr,
  deleteGdprSettings,
  createGdprSettings,
  getComplianceStatus,
  updateDataRetentionPolicy,
  exportGdprSettings
};
