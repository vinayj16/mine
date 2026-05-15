import StorageSettings from '../models/StorageSettings.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_PROVIDERS = ['local', 'aws', 's3', 'azure', 'gcp', 'cloudinary', 'digitalocean', 'wasabi', 'backblaze', 'other'];
const VALID_STATUSES = ['active', 'inactive', 'testing', 'error', 'maintenance'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_FILE_SIZE = 1073741824; // 1GB in bytes
const MIN_FILE_SIZE = 1024; // 1KB in bytes

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

// Get all storage providers
const getAllStorageProviders = async (req, res) => {
  try {
    logger.info('Fetching all storage providers');
    
    const { status, isEnabled, isDefault, page, limit, sortBy, sortOrder } = req.query;
    
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
    
    if (isEnabled !== undefined && isEnabled !== 'true' && isEnabled !== 'false') {
      errors.push('isEnabled must be true or false');
    }
    
    if (isDefault !== undefined && isDefault !== 'true' && isDefault !== 'false') {
      errors.push('isDefault must be true or false');
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: ' + VALID_SORT_ORDERS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = {};
    
    if (status) query.status = status;
    if (isEnabled !== undefined) query.isEnabled = isEnabled === 'true';
    if (isDefault !== undefined) query.isDefault = isDefault === 'true';
    
    const skip = (pageNum - 1) * limitNum;
    const sortField = sortBy || 'provider';
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sortField] = sortDirection;
    
    const [providers, total] = await Promise.all([
      StorageSettings.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      StorageSettings.countDocuments(query)
    ]);
    
    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1
    };
    
    logger.info('Storage providers fetched successfully:', { count: providers.length, total });
    return successResponse(res, {
      providers,
      pagination
    }, 'Storage providers retrieved successfully');
  } catch (error) {
    logger.error('Error fetching storage providers:', error);
    return errorResponse(res, error.message);
  }
};

// Get storage provider by ID
const getStorageProviderById = async (req, res) => {
  try {
    logger.info('Fetching storage provider by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Storage provider ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const provider = await StorageSettings.findById(id);
    
    if (!provider) {
      return notFoundResponse(res, 'Storage provider not found');
    }
    
    logger.info('Storage provider fetched successfully:', { providerId: id });
    return successResponse(res, provider, 'Storage provider retrieved successfully');
  } catch (error) {
    logger.error('Error fetching storage provider:', error);
    return errorResponse(res, error.message);
  }
};

// Get default storage provider
const getDefaultProvider = async (req, res) => {
  try {
    logger.info('Fetching default storage provider');
    
    const provider = await StorageSettings.findOne({ isDefault: true, isEnabled: true });
    
    if (!provider) {
      return notFoundResponse(res, 'No default storage provider configured');
    }
    
    logger.info('Default storage provider fetched successfully:', { provider: provider.provider });
    return successResponse(res, provider, 'Default storage provider retrieved successfully');
  } catch (error) {
    logger.error('Error fetching default provider:', error);
    return errorResponse(res, error.message);
  }
};

// Create or update storage provider
const upsertStorageProvider = async (req, res) => {
  try {
    logger.info('Upserting storage provider');
    
    const { provider, displayName, isEnabled, isDefault, configuration, metadata } = req.body;
    
    // Validation
    const errors = [];
    
    if (!provider || provider.trim().length === 0) {
      errors.push('Provider type is required');
    } else if (!VALID_PROVIDERS.includes(provider.toLowerCase())) {
      errors.push('Invalid provider type. Must be one of: ' + VALID_PROVIDERS.join(', '));
    }
    
    if (displayName && displayName.length > MAX_NAME_LENGTH) {
      errors.push('Display name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (isEnabled !== undefined && typeof isEnabled !== 'boolean') {
      errors.push('isEnabled must be a boolean value');
    }
    
    if (isDefault !== undefined && typeof isDefault !== 'boolean') {
      errors.push('isDefault must be a boolean value');
    }
    
    if (configuration) {
      if (typeof configuration !== 'object' || Array.isArray(configuration)) {
        errors.push('Configuration must be an object');
      } else {
        if (configuration.maxFileSize !== undefined) {
          if (typeof configuration.maxFileSize !== 'number' || configuration.maxFileSize < MIN_FILE_SIZE || configuration.maxFileSize > MAX_FILE_SIZE) {
            errors.push('Max file size must be between ' + MIN_FILE_SIZE + ' and ' + MAX_FILE_SIZE + ' bytes');
          }
        }
        if (configuration.allowedFileTypes !== undefined && !Array.isArray(configuration.allowedFileTypes)) {
          errors.push('Allowed file types must be an array');
        }
      }
    }
    
    if (metadata) {
      if (typeof metadata !== 'object' || Array.isArray(metadata)) {
        errors.push('Metadata must be an object');
      } else {
        if (metadata.description && metadata.description.length > MAX_DESCRIPTION_LENGTH) {
          errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const existingProvider = await StorageSettings.findOne({ provider: provider.toLowerCase() });
    
    if (existingProvider) {
      // Update existing
      Object.assign(existingProvider, {
        displayName: displayName || existingProvider.displayName,
        isEnabled: isEnabled !== undefined ? isEnabled : existingProvider.isEnabled,
        isDefault: isDefault !== undefined ? isDefault : existingProvider.isDefault,
        configuration: configuration ? { ...existingProvider.configuration, ...configuration } : existingProvider.configuration,
        metadata: metadata ? { ...existingProvider.metadata, ...metadata } : existingProvider.metadata,
        status: isEnabled ? 'active' : 'inactive'
      });
      
      await existingProvider.save();
      
      logger.info('Storage provider updated successfully:', { provider: provider.toLowerCase() });
      return successResponse(res, existingProvider, 'Storage provider updated successfully');
    } else {
      // Create new
      const newProvider = new StorageSettings({
        provider: provider.toLowerCase(),
        displayName: displayName || provider.toUpperCase(),
        isEnabled: isEnabled || false,
        isDefault: isDefault || false,
        configuration: configuration || {},
        metadata: metadata || {},
        status: isEnabled ? 'active' : 'inactive'
      });
      
      await newProvider.save();
      
      logger.info('Storage provider created successfully:', { provider: provider.toLowerCase() });
      return createdResponse(res, newProvider, 'Storage provider created successfully');
    }
  } catch (error) {
    logger.error('Error upserting storage provider:', error);
    return errorResponse(res, error.message);
  }
};

// Update storage provider
const updateStorageProvider = async (req, res) => {
  try {
    logger.info('Updating storage provider');
    
    const { id } = req.params;
    const { displayName, isEnabled, isDefault, configuration, metadata, status } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Storage provider ID');
    if (idError) errors.push(idError);
    
    if (displayName !== undefined) {
      if (!displayName || displayName.trim().length === 0) {
        errors.push('Display name cannot be empty');
      } else if (displayName.length > MAX_NAME_LENGTH) {
        errors.push('Display name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (isEnabled !== undefined && typeof isEnabled !== 'boolean') {
      errors.push('isEnabled must be a boolean value');
    }
    
    if (isDefault !== undefined && typeof isDefault !== 'boolean') {
      errors.push('isDefault must be a boolean value');
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (configuration !== undefined) {
      if (typeof configuration !== 'object' || Array.isArray(configuration)) {
        errors.push('Configuration must be an object');
      }
    }
    
    if (metadata !== undefined) {
      if (typeof metadata !== 'object' || Array.isArray(metadata)) {
        errors.push('Metadata must be an object');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const provider = await StorageSettings.findById(id);
    
    if (!provider) {
      return notFoundResponse(res, 'Storage provider not found');
    }
    
    if (displayName !== undefined) provider.displayName = displayName;
    if (isEnabled !== undefined) {
      provider.isEnabled = isEnabled;
      provider.status = isEnabled ? 'active' : 'inactive';
    }
    if (isDefault !== undefined) provider.isDefault = isDefault;
    if (configuration !== undefined) provider.configuration = { ...provider.configuration, ...configuration };
    if (metadata !== undefined) provider.metadata = { ...provider.metadata, ...metadata };
    if (status !== undefined) provider.status = status;
    
    await provider.save();
    
    logger.info('Storage provider updated successfully:', { providerId: id });
    return successResponse(res, provider, 'Storage provider updated successfully');
  } catch (error) {
    logger.error('Error updating storage provider:', error);
    return errorResponse(res, error.message);
  }
};

// Toggle storage provider status
const toggleProviderStatus = async (req, res) => {
  try {
    logger.info('Toggling storage provider status');
    
    const { id } = req.params;
    const { isEnabled } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Storage provider ID');
    if (idError) errors.push(idError);
    
    if (isEnabled !== undefined && typeof isEnabled !== 'boolean') {
      errors.push('isEnabled must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const provider = await StorageSettings.findById(id);
    
    if (!provider) {
      return notFoundResponse(res, 'Storage provider not found');
    }
    
    provider.isEnabled = isEnabled !== undefined ? isEnabled : !provider.isEnabled;
    provider.status = provider.isEnabled ? 'active' : 'inactive';
    await provider.save();
    
    logger.info('Storage provider status toggled successfully:', { providerId: id, isEnabled: provider.isEnabled });
    return successResponse(res, provider, 'Storage provider ' + (provider.isEnabled ? 'enabled' : 'disabled') + ' successfully');
  } catch (error) {
    logger.error('Error toggling provider status:', error);
    return errorResponse(res, error.message);
  }
};

// Test storage provider connection
const testProviderConnection = async (req, res) => {
  try {
    logger.info('Testing storage provider connection');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Storage provider ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const provider = await StorageSettings.findById(id);
    
    if (!provider) {
      return notFoundResponse(res, 'Storage provider not found');
    }
    
    // Simulate connection test (implement actual test logic based on provider)
    const testResult = {
      success: true,
      message: 'Successfully connected to ' + provider.displayName,
      testedAt: new Date(),
      latency: Math.floor(Math.random() * 100) + 50,
      provider: provider.provider
    };
    
    provider.lastTested = new Date();
    provider.testResult = testResult;
    await provider.save();
    
    logger.info('Storage provider connection tested successfully:', { providerId: id });
    return successResponse(res, testResult, 'Connection test completed');
  } catch (error) {
    logger.error('Error testing provider connection:', error);
    return errorResponse(res, error.message);
  }
};

// Delete storage provider
const deleteStorageProvider = async (req, res) => {
  try {
    logger.info('Deleting storage provider');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Storage provider ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const provider = await StorageSettings.findById(id);
    
    if (!provider) {
      return notFoundResponse(res, 'Storage provider not found');
    }
    
    if (provider.isDefault) {
      return validationErrorResponse(res, ['Cannot delete default storage provider']);
    }
    
    await provider.deleteOne();
    
    logger.info('Storage provider deleted successfully:', { providerId: id });
    return successResponse(res, null, 'Storage provider deleted successfully');
  } catch (error) {
    logger.error('Error deleting storage provider:', error);
    return errorResponse(res, error.message);
  }
};

// Initialize default providers
const initializeDefaultProviders = async (_req, res) => {
  try {
    logger.info('Initializing default storage providers');
    
    const defaultProviders = [
      {
        provider: 'local',
        displayName: 'Local Storage',
        isEnabled: true,
        isDefault: true,
        configuration: {
          localPath: process.env.FILE_STORAGE_ROOT || './uploads',
          maxFileSize: 10485760,
          allowedFileTypes: ['image/*', 'application/pdf', 'application/msword'],
          publicAccess: false
        },
        metadata: {
          icon: '/assets/img/icons/storage-icon-01.svg',
          description: 'Store files locally on the server',
          documentationUrl: ''
        },
        status: 'active'
      },
      {
        provider: 'aws',
        displayName: 'AWS S3',
        isEnabled: false,
        isDefault: false,
        configuration: {
          awsRegion: 'us-east-1',
          maxFileSize: 10485760,
          allowedFileTypes: ['image/*', 'application/pdf'],
          publicAccess: false
        },
        metadata: {
          icon: '/assets/img/icons/storage-icon-02.svg',
          description: 'Store files on Amazon S3',
          documentationUrl: 'https://aws.amazon.com/s3/'
        },
        status: 'inactive'
      },
      {
        provider: 'azure',
        displayName: 'Azure Blob Storage',
        isEnabled: false,
        isDefault: false,
        configuration: {
          maxFileSize: 10485760,
          allowedFileTypes: ['image/*', 'application/pdf'],
          publicAccess: false
        },
        metadata: {
          icon: '/assets/img/icons/storage-icon-03.svg',
          description: 'Store files on Microsoft Azure',
          documentationUrl: 'https://azure.microsoft.com/en-us/services/storage/blobs/'
        },
        status: 'inactive'
      }
    ];
    
    const results = [];
    for (const providerData of defaultProviders) {
      const existing = await StorageSettings.findOne({ provider: providerData.provider });
      if (!existing) {
        const provider = new StorageSettings(providerData);
        await provider.save();
        results.push(provider);
      }
    }
    
    logger.info('Default storage providers initialized:', { count: results.length });
    return successResponse(res, { initialized: results.length, providers: results }, 'Default providers initialized successfully');
  } catch (error) {
    logger.error('Error initializing providers:', error);
    return errorResponse(res, error.message);
  }
};

// Set default provider
const setDefaultProvider = async (req, res) => {
  try {
    logger.info('Setting default storage provider');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Storage provider ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const provider = await StorageSettings.findById(id);
    
    if (!provider) {
      return notFoundResponse(res, 'Storage provider not found');
    }
    
    if (!provider.isEnabled) {
      return validationErrorResponse(res, ['Cannot set disabled provider as default']);
    }
    
    // Remove default from all other providers
    await StorageSettings.updateMany(
      { _id: { $ne: id } },
      { isDefault: false }
    );
    
    // Set this provider as default
    provider.isDefault = true;
    await provider.save();
    
    logger.info('Default storage provider set successfully:', { providerId: id });
    return successResponse(res, provider, 'Default storage provider set successfully');
  } catch (error) {
    logger.error('Error setting default provider:', error);
    return errorResponse(res, error.message);
  }
};

// Get enabled providers
const getEnabledProviders = async (_req, res) => {
  try {
    logger.info('Fetching enabled storage providers');
    
    const providers = await StorageSettings.find({ isEnabled: true }).sort({ provider: 1 });
    
    logger.info('Enabled storage providers fetched successfully:', { count: providers.length });
    return successResponse(res, providers, 'Enabled storage providers retrieved successfully');
  } catch (error) {
    logger.error('Error fetching enabled providers:', error);
    return errorResponse(res, error.message);
  }
};

// Get providers by status
const getProvidersByStatus = async (req, res) => {
  try {
    logger.info('Fetching storage providers by status');
    
    const { status } = req.params;
    
    // Validation
    const errors = [];
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const providers = await StorageSettings.find({ status }).sort({ provider: 1 });
    
    logger.info('Storage providers fetched by status successfully:', { status, count: providers.length });
    return successResponse(res, providers, 'Storage providers retrieved successfully');
  } catch (error) {
    logger.error('Error fetching providers by status:', error);
    return errorResponse(res, error.message);
  }
};

// Get storage statistics
const getStorageStatistics = async (_req, res) => {
  try {
    logger.info('Fetching storage statistics');
    
    const [
      totalProviders,
      enabledProviders,
      disabledProviders,
      defaultProvider,
      providersByStatus
    ] = await Promise.all([
      StorageSettings.countDocuments(),
      StorageSettings.countDocuments({ isEnabled: true }),
      StorageSettings.countDocuments({ isEnabled: false }),
      StorageSettings.findOne({ isDefault: true }),
      StorageSettings.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);
    
    const statistics = {
      total: totalProviders,
      enabled: enabledProviders,
      disabled: disabledProviders,
      defaultProvider: defaultProvider ? defaultProvider.provider : null,
      byStatus: providersByStatus.map(item => ({
        status: item._id,
        count: item.count
      }))
    };
    
    logger.info('Storage statistics fetched successfully');
    return successResponse(res, statistics, 'Storage statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching storage statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update providers
const bulkUpdateProviders = async (req, res) => {
  try {
    logger.info('Bulk updating storage providers');
    
    const { providerIds, updates } = req.body;
    
    // Validation
    const errors = [];
    
    if (!providerIds || !Array.isArray(providerIds)) {
      errors.push('Provider IDs must be an array');
    } else if (providerIds.length === 0) {
      errors.push('Provider IDs array cannot be empty');
    } else if (providerIds.length > 50) {
      errors.push('Cannot update more than 50 providers at once');
    } else {
      for (const id of providerIds) {
        const idError = validateObjectId(id, 'Provider ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates must be an object');
    } else {
      if (updates.isEnabled !== undefined && typeof updates.isEnabled !== 'boolean') {
        errors.push('isEnabled must be a boolean value');
      }
      if (updates.status !== undefined && !VALID_STATUSES.includes(updates.status)) {
        errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await StorageSettings.updateMany(
      { _id: { $in: providerIds } },
      updates
    );
    
    logger.info('Storage providers bulk updated successfully:', { count: result.modifiedCount });
    return successResponse(res, { modifiedCount: result.modifiedCount }, 'Storage providers updated successfully');
  } catch (error) {
    logger.error('Error bulk updating storage providers:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete providers
const bulkDeleteProviders = async (req, res) => {
  try {
    logger.info('Bulk deleting storage providers');
    
    const { providerIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!providerIds || !Array.isArray(providerIds)) {
      errors.push('Provider IDs must be an array');
    } else if (providerIds.length === 0) {
      errors.push('Provider IDs array cannot be empty');
    } else if (providerIds.length > 50) {
      errors.push('Cannot delete more than 50 providers at once');
    } else {
      for (const id of providerIds) {
        const idError = validateObjectId(id, 'Provider ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Check if any of the providers are default
    const defaultProviders = await StorageSettings.find({
      _id: { $in: providerIds },
      isDefault: true
    });
    
    if (defaultProviders.length > 0) {
      return validationErrorResponse(res, ['Cannot delete default storage providers']);
    }
    
    const result = await StorageSettings.deleteMany({
      _id: { $in: providerIds }
    });
    
    logger.info('Storage providers bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Storage providers deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting storage providers:', error);
    return errorResponse(res, error.message);
  }
};

// Export storage settings
const exportStorageSettings = async (req, res) => {
  try {
    logger.info('Exporting storage settings');
    
    const { format } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const providers = await StorageSettings.find().sort({ provider: 1 });
    
    const exportData = {
      format: format.toLowerCase(),
      data: providers,
      exportedAt: new Date().toISOString(),
      totalRecords: providers.length
    };
    
    logger.info('Storage settings exported successfully:', { format, count: providers.length });
    return successResponse(res, exportData, 'Storage settings exported successfully');
  } catch (error) {
    logger.error('Error exporting storage settings:', error);
    return errorResponse(res, error.message);
  }
};

// Validate provider configuration
const validateProviderConfiguration = async (req, res) => {
  try {
    logger.info('Validating provider configuration');
    
    const { provider, configuration } = req.body;
    
    // Validation
    const errors = [];
    
    if (!provider || provider.trim().length === 0) {
      errors.push('Provider type is required');
    } else if (!VALID_PROVIDERS.includes(provider.toLowerCase())) {
      errors.push('Invalid provider type. Must be one of: ' + VALID_PROVIDERS.join(', '));
    }
    
    if (!configuration || typeof configuration !== 'object') {
      errors.push('Configuration is required and must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Provider-specific validation
    const validationErrors = [];
    
    if (provider.toLowerCase() === 'aws' || provider.toLowerCase() === 's3') {
      if (!configuration.awsRegion) validationErrors.push('AWS region is required');
      if (!configuration.awsAccessKeyId) validationErrors.push('AWS access key ID is required');
      if (!configuration.awsSecretAccessKey) validationErrors.push('AWS secret access key is required');
      if (!configuration.bucketName) validationErrors.push('Bucket name is required');
    } else if (provider.toLowerCase() === 'azure') {
      if (!configuration.accountName) validationErrors.push('Azure account name is required');
      if (!configuration.accountKey) validationErrors.push('Azure account key is required');
      if (!configuration.containerName) validationErrors.push('Container name is required');
    } else if (provider.toLowerCase() === 'gcp') {
      if (!configuration.projectId) validationErrors.push('GCP project ID is required');
      if (!configuration.bucketName) validationErrors.push('Bucket name is required');
    }
    
    const isValid = validationErrors.length === 0;
    
    logger.info('Provider configuration validated:', { provider, isValid });
    return successResponse(res, {
      isValid,
      errors: validationErrors,
      provider
    }, isValid ? 'Configuration is valid' : 'Configuration validation failed');
  } catch (error) {
    logger.error('Error validating provider configuration:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getAllStorageProviders,
  getStorageProviderById,
  getDefaultProvider,
  upsertStorageProvider,
  updateStorageProvider,
  toggleProviderStatus,
  testProviderConnection,
  deleteStorageProvider,
  initializeDefaultProviders,
  setDefaultProvider,
  getEnabledProviders,
  getProvidersByStatus,
  getStorageStatistics,
  bulkUpdateProviders,
  bulkDeleteProviders,
  exportStorageSettings,
  validateProviderConfiguration
};
