import PlatformSetting from '../models/PlatformSetting.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_CATEGORIES = ['general', 'email', 'sms', 'whatsapp', 'payment', 'storage', 'security', 'notification', 'api', 'integration', 'appearance', 'system'];
const VALID_DATA_TYPES = ['string', 'number', 'boolean', 'json', 'array', 'object'];
const VALID_SERVICES = ['smtp', 'sms', 'whatsapp', 'razorpay', 'stripe', 'paypal', 'storage', 's3', 'cloudinary', 'firebase'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_KEY_LENGTH = 100;
const MAX_VALUE_LENGTH = 5000;
const MAX_DESCRIPTION_LENGTH = 500;

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

// Helper function to validate setting key format
const validateSettingKey = (key) => {
  if (!key || key.trim().length === 0) {
    return 'Setting key is required';
  }
  if (key.length > MAX_KEY_LENGTH) {
    return 'Setting key must not exceed ' + MAX_KEY_LENGTH + ' characters';
  }
  // Setting key should follow format: category.subcategory.name (e.g., email.smtp.host)
  if (!/^[a-z0-9_.-]+$/i.test(key)) {
    return 'Invalid setting key format. Only alphanumeric characters, dots, hyphens, and underscores are allowed';
  }
  return null;
};

// Helper function to validate URL format
const validateUrl = (url, fieldName = 'URL') => {
  if (!url) return null; // URL is optional
  try {
    new URL(url);
    return null;
  } catch (e) {
    return 'Invalid ' + fieldName + ' format';
  }
};

// Get all platform settings
const getAllSettings = async (req, res) => {
  try {
    logger.info('Fetching all platform settings');
    
    const { page, limit, category, dataType, search, isPublic } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (dataType && !VALID_DATA_TYPES.includes(dataType)) {
      errors.push('Invalid data type. Must be one of: ' + VALID_DATA_TYPES.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (isPublic !== undefined && isPublic !== 'true' && isPublic !== 'false') {
      errors.push('isPublic must be true or false');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Build query
    const query = { tenantId };
    if (category) query.category = category;
    if (dataType) query.dataType = dataType;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';
    if (search) {
      query.$or = [
        { key: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (pageNum - 1) * limitNum;
    const settings = await PlatformSetting.find(query)
      .sort({ category: 1, key: 1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await PlatformSetting.countDocuments(query);
    
    logger.info('Platform settings fetched successfully');
    return successResponse(res, {
      settings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching platform settings:', error);
    return errorResponse(res, error.message);
  }
};

// Get settings by category
const getSettingsByCategory = async (req, res) => {
  try {
    logger.info('Fetching settings by category');
    
    const { category } = req.params;
    const { page, limit } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (!category) {
      errors.push('Category is required');
    } else if (!VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
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
    
    const skip = (pageNum - 1) * limitNum;
    const settings = await PlatformSetting.find({ tenantId, category })
      .sort({ key: 1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await PlatformSetting.countDocuments({ tenantId, category });
    
    logger.info('Settings fetched by category successfully:', { category });
    return successResponse(res, {
      settings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching settings by category:', error);
    return errorResponse(res, error.message);
  }
};

// Get single setting
const getSettingById = async (req, res) => {
  try {
    logger.info('Fetching setting by ID');
    
    const { settingId } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(settingId, 'Setting ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const setting = await PlatformSetting.findOne({ 
      _id: settingId, 
      tenantId 
    });
    
    if (!setting) {
      return notFoundResponse(res, 'Setting not found');
    }
    
    logger.info('Setting fetched successfully:', { settingId });
    return successResponse(res, setting, 'Setting retrieved successfully');
  } catch (error) {
    logger.error('Error fetching setting:', error);
    return errorResponse(res, error.message);
  }
};

// Get setting by key
const getSettingByKey = async (req, res) => {
  try {
    logger.info('Fetching setting by key');
    
    const { key } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const keyError = validateSettingKey(key);
    if (keyError) errors.push(keyError);
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const setting = await PlatformSetting.findOne({ key, tenantId });
    
    if (!setting) {
      return notFoundResponse(res, 'Setting not found');
    }
    
    logger.info('Setting fetched by key successfully:', { key });
    return successResponse(res, setting, 'Setting retrieved successfully');
  } catch (error) {
    logger.error('Error fetching setting by key:', error);
    return errorResponse(res, error.message);
  }
};

// Create new setting
const createSetting = async (req, res) => {
  try {
    logger.info('Creating platform setting');
    
    const { key, value, category, dataType, description, isPublic, isEncrypted } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    const keyError = validateSettingKey(key);
    if (keyError) errors.push(keyError);
    
    if (value === undefined || value === null) {
      errors.push('Setting value is required');
    } else if (typeof value === 'string' && value.length > MAX_VALUE_LENGTH) {
      errors.push('Value must not exceed ' + MAX_VALUE_LENGTH + ' characters');
    }
    
    if (!category) {
      errors.push('Category is required');
    } else if (!VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (!dataType) {
      errors.push('Data type is required');
    } else if (!VALID_DATA_TYPES.includes(dataType)) {
      errors.push('Invalid data type. Must be one of: ' + VALID_DATA_TYPES.join(', '));
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (isPublic !== undefined && typeof isPublic !== 'boolean') {
      errors.push('isPublic must be a boolean value');
    }
    
    if (isEncrypted !== undefined && typeof isEncrypted !== 'boolean') {
      errors.push('isEncrypted must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Check for duplicate key
    const existingSetting = await PlatformSetting.findOne({ key, tenantId });
    if (existingSetting) {
      return validationErrorResponse(res, ['Setting with this key already exists']);
    }
    
    const settingData = {
      ...req.body,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const setting = new PlatformSetting(settingData);
    await setting.save();
    
    logger.info('Platform setting created successfully:', { settingId: setting._id });
    return createdResponse(res, setting, 'Setting created successfully');
  } catch (error) {
    logger.error('Error creating platform setting:', error);
    return errorResponse(res, error.message);
  }
};

// Update setting
const updateSetting = async (req, res) => {
  try {
    logger.info('Updating platform setting');
    
    const { settingId } = req.params;
    const { value, description, isPublic, isEncrypted } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(settingId, 'Setting ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (value !== undefined && typeof value === 'string' && value.length > MAX_VALUE_LENGTH) {
      errors.push('Value must not exceed ' + MAX_VALUE_LENGTH + ' characters');
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (isPublic !== undefined && typeof isPublic !== 'boolean') {
      errors.push('isPublic must be a boolean value');
    }
    
    if (isEncrypted !== undefined && typeof isEncrypted !== 'boolean') {
      errors.push('isEncrypted must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const setting = await PlatformSetting.findOneAndUpdate(
      { _id: settingId, tenantId },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!setting) {
      return notFoundResponse(res, 'Setting not found');
    }
    
    logger.info('Platform setting updated successfully:', { settingId });
    return successResponse(res, setting, 'Setting updated successfully');
  } catch (error) {
    logger.error('Error updating platform setting:', error);
    return errorResponse(res, error.message);
  }
};

// Delete setting
const deleteSetting = async (req, res) => {
  try {
    logger.info('Deleting platform setting');
    
    const { settingId } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(settingId, 'Setting ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const setting = await PlatformSetting.findOneAndDelete({
      _id: settingId,
      tenantId
    });
    
    if (!setting) {
      return notFoundResponse(res, 'Setting not found');
    }
    
    logger.info('Platform setting deleted successfully:', { settingId });
    return successResponse(res, null, 'Setting deleted successfully');
  } catch (error) {
    logger.error('Error deleting platform setting:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update settings
const bulkUpdateSettings = async (req, res) => {
  try {
    logger.info('Bulk updating platform settings');
    
    const { settings } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (!settings || !Array.isArray(settings)) {
      errors.push('Settings must be an array');
    } else if (settings.length === 0) {
      errors.push('Settings array cannot be empty');
    } else if (settings.length > 100) {
      errors.push('Cannot update more than 100 settings at once');
    } else {
      for (const setting of settings) {
        if (!setting.id) {
          errors.push('Each setting must have an id');
          break;
        }
        const idError = validateObjectId(setting.id, 'Setting ID');
        if (idError) {
          errors.push(idError);
          break;
        }
        if (setting.value !== undefined && typeof setting.value === 'string' && setting.value.length > MAX_VALUE_LENGTH) {
          errors.push('Value must not exceed ' + MAX_VALUE_LENGTH + ' characters');
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updatePromises = settings.map(setting => 
      PlatformSetting.findOneAndUpdate(
        { _id: setting.id, tenantId },
        { ...setting, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
    );
    
    const updatedSettings = await Promise.all(updatePromises);
    
    logger.info('Platform settings bulk updated successfully:', { count: updatedSettings.length });
    return successResponse(res, updatedSettings, 'Settings updated successfully');
  } catch (error) {
    logger.error('Error bulk updating platform settings:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete settings
const bulkDeleteSettings = async (req, res) => {
  try {
    logger.info('Bulk deleting platform settings');
    
    const { settingIds } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (!settingIds || !Array.isArray(settingIds)) {
      errors.push('Setting IDs must be an array');
    } else if (settingIds.length === 0) {
      errors.push('Setting IDs array cannot be empty');
    } else if (settingIds.length > 100) {
      errors.push('Cannot delete more than 100 settings at once');
    } else {
      for (const id of settingIds) {
        const idError = validateObjectId(id, 'Setting ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await PlatformSetting.deleteMany({
      _id: { $in: settingIds },
      tenantId
    });
    
    logger.info('Platform settings bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Settings deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting platform settings:', error);
    return errorResponse(res, error.message);
  }
};

// Test service connection
const testServiceConnection = async (req, res) => {
  try {
    logger.info('Testing service connection');
    
    const { service } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (!service) {
      errors.push('Service name is required');
    } else if (!VALID_SERVICES.includes(service)) {
      errors.push('Invalid service. Must be one of: ' + VALID_SERVICES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Mock service testing - in real implementation, this would test actual connections
    const testResults = {
      smtp: { success: true, message: 'SMTP connection successful', latency: 120 },
      sms: { success: true, message: 'SMS service connected', latency: 85 },
      whatsapp: { success: false, message: 'WhatsApp service not configured', latency: 0 },
      razorpay: { success: true, message: 'Razorpay API connected', latency: 95 },
      stripe: { success: true, message: 'Stripe API connected', latency: 110 },
      paypal: { success: true, message: 'PayPal API connected', latency: 130 },
      storage: { success: true, message: 'Storage service connected', latency: 75 },
      s3: { success: true, message: 'AWS S3 connected', latency: 90 },
      cloudinary: { success: true, message: 'Cloudinary connected', latency: 100 },
      firebase: { success: true, message: 'Firebase connected', latency: 105 }
    };
    
    const result = testResults[service] || { success: false, message: 'Unknown service', latency: 0 };
    
    logger.info('Service connection tested:', { service, success: result.success });
    return successResponse(res, result, 'Service connection test completed');
  } catch (error) {
    logger.error('Error testing service connection:', error);
    return errorResponse(res, error.message);
  }
};

// Reset settings to default
const resetSettingsToDefault = async (req, res) => {
  try {
    logger.info('Resetting settings to default');
    
    const { category } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { tenantId };
    if (category) query.category = category;
    
    // In real implementation, this would reset to actual default values
    const result = await PlatformSetting.updateMany(
      query,
      { $set: { value: null, updatedAt: new Date() } }
    );
    
    logger.info('Settings reset to default successfully:', { count: result.modifiedCount, category });
    return successResponse(res, { resetCount: result.modifiedCount }, 'Settings reset to default successfully');
  } catch (error) {
    logger.error('Error resetting settings to default:', error);
    return errorResponse(res, error.message);
  }
};

// Export settings
const exportSettings = async (req, res) => {
  try {
    logger.info('Exporting platform settings');
    
    const { format, category } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { tenantId };
    if (category) query.category = category;
    
    const settings = await PlatformSetting.find(query).sort({ category: 1, key: 1 });
    
    // In real implementation, this would format data according to the export format
    const exportData = {
      format: format.toLowerCase(),
      exportedAt: new Date().toISOString(),
      totalSettings: settings.length,
      settings: settings.map(s => ({
        key: s.key,
        value: s.value,
        category: s.category,
        dataType: s.dataType,
        description: s.description
      }))
    };
    
    logger.info('Platform settings exported successfully:', { format, count: settings.length });
    return successResponse(res, exportData, 'Settings exported successfully');
  } catch (error) {
    logger.error('Error exporting platform settings:', error);
    return errorResponse(res, error.message);
  }
};

// Import settings
const importSettings = async (req, res) => {
  try {
    logger.info('Importing platform settings');
    
    const { settings, overwrite } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (!settings || !Array.isArray(settings)) {
      errors.push('Settings must be an array');
    } else if (settings.length === 0) {
      errors.push('Settings array cannot be empty');
    } else if (settings.length > 500) {
      errors.push('Cannot import more than 500 settings at once');
    } else {
      for (const setting of settings) {
        const keyError = validateSettingKey(setting.key);
        if (keyError) {
          errors.push(keyError);
          break;
        }
        if (!setting.category || !VALID_CATEGORIES.includes(setting.category)) {
          errors.push('Invalid or missing category in settings');
          break;
        }
        if (!setting.dataType || !VALID_DATA_TYPES.includes(setting.dataType)) {
          errors.push('Invalid or missing data type in settings');
          break;
        }
      }
    }
    
    if (overwrite !== undefined && typeof overwrite !== 'boolean') {
      errors.push('overwrite must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const setting of settings) {
      const existingSetting = await PlatformSetting.findOne({ key: setting.key, tenantId });
      
      if (existingSetting && !overwrite) {
        skippedCount++;
        continue;
      }
      
      if (existingSetting && overwrite) {
        await PlatformSetting.findOneAndUpdate(
          { key: setting.key, tenantId },
          { ...setting, tenantId, updatedAt: new Date() },
          { runValidators: true }
        );
      } else {
        const newSetting = new PlatformSetting({
          ...setting,
          tenantId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await newSetting.save();
      }
      
      importedCount++;
    }
    
    logger.info('Platform settings imported successfully:', { imported: importedCount, skipped: skippedCount });
    return successResponse(res, { importedCount, skippedCount }, 'Settings imported successfully');
  } catch (error) {
    logger.error('Error importing platform settings:', error);
    return errorResponse(res, error.message);
  }
};

// Get settings statistics
const getSettingsStatistics = async (req, res) => {
  try {
    logger.info('Fetching platform settings statistics');
    
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const totalSettings = await PlatformSetting.countDocuments({ tenantId });
    const publicSettings = await PlatformSetting.countDocuments({ tenantId, isPublic: true });
    const encryptedSettings = await PlatformSetting.countDocuments({ tenantId, isEncrypted: true });
    
    const settingsByCategory = await PlatformSetting.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const settingsByDataType = await PlatformSetting.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$dataType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const recentlyUpdated = await PlatformSetting.find({ tenantId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('key category updatedAt');
    
    const statistics = {
      totalSettings,
      publicSettings,
      encryptedSettings,
      privateSettings: totalSettings - publicSettings,
      settingsByCategory: settingsByCategory.map(item => ({
        category: item._id,
        count: item.count
      })),
      settingsByDataType: settingsByDataType.map(item => ({
        dataType: item._id,
        count: item.count
      })),
      recentlyUpdated
    };
    
    logger.info('Platform settings statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching platform settings statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Validate settings configuration
const validateSettingsConfiguration = async (req, res) => {
  try {
    logger.info('Validating settings configuration');
    
    const { category } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { tenantId };
    if (category) query.category = category;
    
    const settings = await PlatformSetting.find(query);
    
    const validationResults = {
      totalChecked: settings.length,
      valid: 0,
      invalid: 0,
      issues: []
    };
    
    for (const setting of settings) {
      let isValid = true;
      
      // Check for empty values
      if (setting.value === null || setting.value === undefined || setting.value === '') {
        validationResults.issues.push({
          key: setting.key,
          issue: 'Empty or null value'
        });
        isValid = false;
      }
      
      // Check data type consistency
      if (setting.dataType === 'number' && typeof setting.value !== 'number') {
        validationResults.issues.push({
          key: setting.key,
          issue: 'Value type does not match declared data type'
        });
        isValid = false;
      }
      
      // Check for URL validity if key contains 'url' or 'endpoint'
      if ((setting.key.includes('url') || setting.key.includes('endpoint')) && typeof setting.value === 'string') {
        const urlError = validateUrl(setting.value);
        if (urlError) {
          validationResults.issues.push({
            key: setting.key,
            issue: 'Invalid URL format'
          });
          isValid = false;
        }
      }
      
      if (isValid) {
        validationResults.valid++;
      } else {
        validationResults.invalid++;
      }
    }
    
    logger.info('Settings configuration validated:', { valid: validationResults.valid, invalid: validationResults.invalid });
    return successResponse(res, validationResults, 'Configuration validation completed');
  } catch (error) {
    logger.error('Error validating settings configuration:', error);
    return errorResponse(res, error.message);
  }
};

// Get public settings (for frontend/client access)
const getPublicSettings = async (req, res) => {
  try {
    logger.info('Fetching public platform settings');
    
    const { category } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant ID is required');
    }
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { tenantId, isPublic: true };
    if (category) query.category = category;
    
    const settings = await PlatformSetting.find(query)
      .select('key value category dataType description')
      .sort({ category: 1, key: 1 });
    
    logger.info('Public platform settings fetched successfully:', { count: settings.length });
    return successResponse(res, settings, 'Public settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching public platform settings:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getAllSettings,
  getSettingsByCategory,
  getSettingById,
  getSettingByKey,
  createSetting,
  updateSetting,
  deleteSetting,
  bulkUpdateSettings,
  bulkDeleteSettings,
  testServiceConnection,
  resetSettingsToDefault,
  exportSettings,
  importSettings,
  getSettingsStatistics,
  validateSettingsConfiguration,
  getPublicSettings
};
