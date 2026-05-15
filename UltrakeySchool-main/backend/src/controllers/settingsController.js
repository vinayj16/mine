import settingsService from '../services/settingsService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_IMAGE_TYPES = ['logo', 'favicon', 'icon', 'darkLogo'];
const VALID_TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney'];
const VALID_DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
const VALID_TIME_FORMATS = ['12h', '24h'];
const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CNY', 'AUD'];
const MAX_COMPANY_NAME_LENGTH = 200;

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

// Get settings
const getSettings = async (req, res) => {
  try {
    logger.info('Fetching settings');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await settingsService.getSettings(institutionId);
    
    if (!settings) {
      return notFoundResponse(res, 'Settings not found');
    }
    
    logger.info('Settings fetched successfully:', { institutionId });
    return successResponse(res, settings, 'Settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching settings:', error);
    return errorResponse(res, error.message);
  }
};

// Update company settings
const updateCompanySettings = async (req, res) => {
  try {
    logger.info('Updating company settings');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { companyName, email, phone, address, website } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (companyName && companyName.length > MAX_COMPANY_NAME_LENGTH) {
      errors.push('Company name must not exceed ' + MAX_COMPANY_NAME_LENGTH + ' characters');
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
    
    if (website) {
      try {
        new URL(website);
      } catch (e) {
        errors.push('Invalid website URL format');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updateData = { ...req.body, metadata: { updatedBy: userId || 'system' } };
    const settings = await settingsService.updateCompanySettings(institutionId, updateData);
    
    logger.info('Company settings updated successfully:', { institutionId });
    return successResponse(res, settings, 'Company settings updated successfully');
  } catch (error) {
    logger.error('Error updating company settings:', error);
    return errorResponse(res, error.message);
  }
};

// Update company images
const updateCompanyImages = async (req, res) => {
  try {
    logger.info('Updating company images');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { imageType, imageData } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!imageType) {
      errors.push('Image type is required');
    } else if (!VALID_IMAGE_TYPES.includes(imageType)) {
      errors.push('Invalid image type. Must be one of: ' + VALID_IMAGE_TYPES.join(', '));
    }
    
    if (!imageData || imageData.trim().length === 0) {
      errors.push('Image data is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await settingsService.updateCompanyImages(institutionId, imageType, imageData);
    
    logger.info('Company image updated successfully:', { institutionId, imageType });
    return successResponse(res, settings, 'Company image updated successfully');
  } catch (error) {
    logger.error('Error updating company images:', error);
    return errorResponse(res, error.message);
  }
};

// Update localization
const updateLocalization = async (req, res) => {
  try {
    logger.info('Updating localization settings');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { timezone, dateFormat, timeFormat, currency, language } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (timezone && !VALID_TIMEZONES.includes(timezone)) {
      errors.push('Invalid timezone. Must be one of: ' + VALID_TIMEZONES.join(', '));
    }
    
    if (dateFormat && !VALID_DATE_FORMATS.includes(dateFormat)) {
      errors.push('Invalid date format. Must be one of: ' + VALID_DATE_FORMATS.join(', '));
    }
    
    if (timeFormat && !VALID_TIME_FORMATS.includes(timeFormat)) {
      errors.push('Invalid time format. Must be one of: ' + VALID_TIME_FORMATS.join(', '));
    }
    
    if (currency && !VALID_CURRENCIES.includes(currency)) {
      errors.push('Invalid currency. Must be one of: ' + VALID_CURRENCIES.join(', '));
    }
    
    if (language && language.length > 10) {
      errors.push('Language code must not exceed 10 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updateData = { ...req.body, metadata: { updatedBy: userId || 'system' } };
    const settings = await settingsService.updateLocalization(institutionId, updateData);
    
    logger.info('Localization settings updated successfully:', { institutionId });
    return successResponse(res, settings, 'Localization settings updated successfully');
  } catch (error) {
    logger.error('Error updating localization settings:', error);
    return errorResponse(res, error.message);
  }
};

// Update prefixes
const updatePrefixes = async (req, res) => {
  try {
    logger.info('Updating prefixes');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { prefixes } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!prefixes || typeof prefixes !== 'object') {
      errors.push('Prefixes must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await settingsService.updatePrefixes(institutionId, prefixes, userId || 'system');
    
    logger.info('Prefixes updated successfully:', { institutionId });
    return successResponse(res, settings, 'Prefixes updated successfully');
  } catch (error) {
    logger.error('Error updating prefixes:', error);
    return errorResponse(res, error.message);
  }
};

// Update preferences
const updatePreferences = async (req, res) => {
  try {
    logger.info('Updating preferences');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updateData = { ...req.body, metadata: { updatedBy: userId || 'system' } };
    const settings = await settingsService.updatePreferences(institutionId, updateData);
    
    logger.info('Preferences updated successfully:', { institutionId });
    return successResponse(res, settings, 'Preferences updated successfully');
  } catch (error) {
    logger.error('Error updating preferences:', error);
    return errorResponse(res, error.message);
  }
};

// Delete settings
const deleteSettings = async (req, res) => {
  try {
    logger.info('Deleting settings');
    
    const institutionId = req.user?.institutionId || req.params.institutionId;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await settingsService.deleteSettings(institutionId);
    
    logger.info('Settings deleted successfully:', { institutionId });
    return successResponse(res, null, 'Settings deleted successfully');
  } catch (error) {
    logger.error('Error deleting settings:', error);
    return errorResponse(res, error.message);
  }
};

// Get maintenance mode
const getMaintenanceMode = async (req, res) => {
  try {
    logger.info('Fetching maintenance mode');
    
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await settingsService.getMaintenanceMode(institutionId);
    
    logger.info('Maintenance mode fetched successfully:', { institutionId });
    return successResponse(res, result, 'Maintenance mode retrieved successfully');
  } catch (error) {
    logger.error('Error fetching maintenance mode:', error);
    return errorResponse(res, error.message);
  }
};

// Toggle maintenance mode
const toggleMaintenanceMode = async (req, res) => {
  try {
    logger.info('Toggling maintenance mode');
    
    const institutionId = req.user?.institutionId || req.body.institutionId;
    const { enabled } = req.body;
    
    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (enabled === undefined || enabled === null) {
      errors.push('Enabled field is required');
    } else if (typeof enabled !== 'boolean') {
      errors.push('Enabled must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await settingsService.toggleMaintenanceMode(institutionId, enabled);
    
    logger.info('Maintenance mode toggled successfully:', { institutionId, enabled });
    return successResponse(res, settings, 'Maintenance mode ' + (enabled ? 'enabled' : 'disabled') + ' successfully');
  } catch (error) {
    logger.error('Error toggling maintenance mode:', error);
    return errorResponse(res, error.message);
  }
};

// Get launch date
const getLaunchDate = async (req, res) => {
  try {
    logger.info('Fetching launch date');
    
    // Define schema if not exists
    let LaunchSettings;
    try {
      LaunchSettings = mongoose.model('LaunchSettings');
    } catch {
      const launchSettingsSchema = new mongoose.Schema({
        launchDate: {
          type: Date,
          required: true
        },
        updatedAt: {
          type: Date,
          default: Date.now
        }
      });
      LaunchSettings = mongoose.model('LaunchSettings', launchSettingsSchema);
    }

    // Get launch date
    const settings = await LaunchSettings.findOne();
    
    if (!settings) {
      // Default to 60 days from now if not set
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 60);
      
      logger.info('Launch date not set, returning default');
      return successResponse(res, {
        launchDate: defaultDate.toISOString()
      }, 'Launch date retrieved successfully');
    }

    logger.info('Launch date fetched successfully');
    return successResponse(res, {
      launchDate: settings.launchDate.toISOString()
    }, 'Launch date retrieved successfully');
  } catch (error) {
    logger.error('Error fetching launch date:', error);
    return errorResponse(res, error.message);
  }
};

// Update launch date
const updateLaunchDate = async (req, res) => {
  try {
    logger.info('Updating launch date');
    
    const { launchDate } = req.body;
    
    // Validation
    const errors = [];
    
    if (!launchDate) {
      errors.push('Launch date is required');
    } else if (isNaN(Date.parse(launchDate))) {
      errors.push('Invalid launch date format');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Define schema if not exists
    let LaunchSettings;
    try {
      LaunchSettings = mongoose.model('LaunchSettings');
    } catch {
      const launchSettingsSchema = new mongoose.Schema({
        launchDate: {
          type: Date,
          required: true
        },
        updatedAt: {
          type: Date,
          default: Date.now
        }
      });
      LaunchSettings = mongoose.model('LaunchSettings', launchSettingsSchema);
    }

    // Update or create launch date
    const settings = await LaunchSettings.findOneAndUpdate(
      {},
      { launchDate: new Date(launchDate), updatedAt: new Date() },
      { upsert: true, new: true }
    );
    
    logger.info('Launch date updated successfully');
    return successResponse(res, {
      launchDate: settings.launchDate.toISOString()
    }, 'Launch date updated successfully');
  } catch (error) {
    logger.error('Error updating launch date:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getSettings,
  updateCompanySettings,
  updateCompanyImages,
  updateLocalization,
  updatePrefixes,
  updatePreferences,
  deleteSettings,
  getMaintenanceMode,
  toggleMaintenanceMode,
  getLaunchDate,
  updateLaunchDate
};
