import multer from 'multer';
import storageService from '../services/storageService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse, forbiddenResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_FOLDERS = ['uploads', 'documents', 'profile-images', 'attachments', 'media', 'exports', 'temp'];
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const VALID_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv'
];
const ALLOWED_FILE_TYPES = [...VALID_IMAGE_TYPES, ...VALID_DOCUMENT_TYPES];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_COUNT = 10;
const MIN_IMAGE_QUALITY = 1;
const MAX_IMAGE_QUALITY = 100;

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

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_COUNT
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type ' + file.mimetype + ' is not allowed'), false);
    }
  }
});

const uploadController = {
  // Upload single file
  uploadSingle: async (req, res) => {
    try {
      logger.info('Uploading single file');
      
      if (!req.file) {
        return validationErrorResponse(res, ['No file provided']);
      }

      const { folder, isPublic, processImage, quality } = req.body;
      const institutionId = req.tenantId;
      const userId = req.user?.id;
      
      // Validation
      const errors = [];
      
      if (!institutionId) {
        errors.push('Institution ID is required');
      }
      
      if (!userId) {
        errors.push('User ID is required');
      }
      
      if (folder && !VALID_FOLDERS.includes(folder)) {
        errors.push('Invalid folder. Must be one of: ' + VALID_FOLDERS.join(', '));
      }
      
      if (quality) {
        const qualityNum = parseInt(quality);
        if (isNaN(qualityNum) || qualityNum < MIN_IMAGE_QUALITY || qualityNum > MAX_IMAGE_QUALITY) {
          errors.push('Quality must be between ' + MIN_IMAGE_QUALITY + ' and ' + MAX_IMAGE_QUALITY);
        }
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      // Validate file
      const validation = storageService.validateFile(req.file);
      if (!validation.isValid) {
        return validationErrorResponse(res, validation.errors);
      }

      // Upload file
      const result = await storageService.uploadFile(req.file, {
        folder: folder || 'uploads',
        institutionId,
        isPublic: isPublic !== 'false',
        processImage: processImage !== 'false',
        quality: quality ? parseInt(quality) : 85
      });

      if (!result.success) {
        return errorResponse(res, result.error);
      }

      logger.info('File uploaded successfully:', { 
        key: result.file.key,
        institution: institutionId,
        user: userId,
        size: result.file.size
      });

      return createdResponse(res, result.file, 'File uploaded successfully');
    } catch (error) {
      logger.error('File upload error:', error);
      return errorResponse(res, 'Failed to upload file');
    }
  },

  // Upload multiple files
  uploadMultiple: async (req, res) => {
    try {
      logger.info('Uploading multiple files');
      
      if (!req.files || req.files.length === 0) {
        return validationErrorResponse(res, ['No files provided']);
      }

      const { folder, isPublic, processImage, quality } = req.body;
      const institutionId = req.tenantId;
      const userId = req.user?.id;
      
      // Validation
      const errors = [];
      
      if (!institutionId) {
        errors.push('Institution ID is required');
      }
      
      if (!userId) {
        errors.push('User ID is required');
      }
      
      if (folder && !VALID_FOLDERS.includes(folder)) {
        errors.push('Invalid folder. Must be one of: ' + VALID_FOLDERS.join(', '));
      }
      
      if (req.files.length > MAX_FILES_COUNT) {
        errors.push('Maximum ' + MAX_FILES_COUNT + ' files allowed at once');
      }
      
      if (quality) {
        const qualityNum = parseInt(quality);
        if (isNaN(qualityNum) || qualityNum < MIN_IMAGE_QUALITY || qualityNum > MAX_IMAGE_QUALITY) {
          errors.push('Quality must be between ' + MIN_IMAGE_QUALITY + ' and ' + MAX_IMAGE_QUALITY);
        }
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      // Validate all files
      const validationErrors = [];
      req.files.forEach((file, index) => {
        const validation = storageService.validateFile(file);
        if (!validation.isValid) {
          validationErrors.push('File ' + (index + 1) + ': ' + validation.errors.join(', '));
        }
      });

      if (validationErrors.length > 0) {
        return validationErrorResponse(res, validationErrors);
      }

      // Upload all files
      const result = await storageService.uploadMultipleFiles(req.files, {
        folder: folder || 'uploads',
        institutionId,
        isPublic: isPublic !== 'false',
        processImage: processImage !== 'false',
        quality: quality ? parseInt(quality) : 85
      });

      logger.info('Multiple files uploaded:', { 
        uploaded: result.uploaded,
        total: result.total,
        institution: institutionId,
        user: userId
      });

      return createdResponse(res, {
        uploaded: result.successful.map(r => r.file),
        failed: result.failed,
        summary: {
          total: result.total,
          uploaded: result.uploaded,
          failed: result.errors
        }
      }, 'Successfully uploaded ' + result.uploaded + ' of ' + result.total + ' files');
    } catch (error) {
      logger.error('Multiple file upload error:', error);
      return errorResponse(res, 'Failed to upload files');
    }
  },

  // Upload profile image
  uploadProfileImage: async (req, res) => {
    try {
      logger.info('Uploading profile image');
      
      if (!req.file) {
        return validationErrorResponse(res, ['No image provided']);
      }

      const institutionId = req.tenantId;
      const userId = req.params.userId || req.user?.id;
      const currentUserId = req.user?.id;
      const userRole = req.user?.role;
      
      // Validation
      const errors = [];
      
      if (!institutionId) {
        errors.push('Institution ID is required');
      }
      
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
      
      // Only allow users to upload their own profile image or admins to upload any
      if (userId !== currentUserId && !['admin', 'institution_admin', 'superadmin'].includes(userRole)) {
        return forbiddenResponse(res, 'You can only upload your own profile image');
      }

      // Validate file type
      if (!req.file.mimetype.startsWith('image/')) {
        errors.push('Only image files are allowed for profile pictures');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      // Upload file
      const result = await storageService.uploadFile(req.file, {
        folder: 'profile-images',
        fileName: 'profile_' + userId + '_' + Date.now() + '.jpg',
        institutionId,
        isPublic: true,
        processImage: true,
        quality: 85
      });

      if (!result.success) {
        return errorResponse(res, result.error);
      }

      // Update user profile with image URL
      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(userId, {
        'profile.avatar': result.file.url
      });

      logger.info('Profile image uploaded successfully:', { 
        userId,
        institution: institutionId,
        uploadedBy: currentUserId,
        imageUrl: result.file.url
      });

      return successResponse(res, {
        imageUrl: result.file.url,
        file: result.file
      }, 'Profile image uploaded successfully');
    } catch (error) {
      logger.error('Profile image upload error:', error);
      return errorResponse(res, 'Failed to upload profile image');
    }
  },

  // Upload document
  uploadDocument: async (req, res) => {
    try {
      logger.info('Uploading document');
      
      if (!req.file) {
        return validationErrorResponse(res, ['No document provided']);
      }

      const { documentType, description } = req.body;
      const institutionId = req.tenantId;
      const userId = req.user?.id;
      
      // Validation
      const errors = [];
      
      if (!institutionId) {
        errors.push('Institution ID is required');
      }
      
      if (!userId) {
        errors.push('User ID is required');
      }
      
      if (description && description.length > 500) {
        errors.push('Description must not exceed 500 characters');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      // Upload file
      const result = await storageService.uploadFile(req.file, {
        folder: 'documents',
        institutionId,
        isPublic: false,
        processImage: false
      });

      if (!result.success) {
        return errorResponse(res, result.error);
      }

      logger.info('Document uploaded successfully:', { 
        key: result.file.key,
        institution: institutionId,
        user: userId,
        documentType,
        size: result.file.size
      });

      return createdResponse(res, {
        ...result.file,
        documentType,
        description,
        uploadedBy: userId,
        uploadedAt: new Date()
      }, 'Document uploaded successfully');
    } catch (error) {
      logger.error('Document upload error:', error);
      return errorResponse(res, 'Failed to upload document');
    }
  },

  // Get presigned URL for private file
  getPresignedUrl: async (req, res) => {
    try {
      logger.info('Generating presigned URL');
      
      const { key } = req.params;
      const { expiresIn } = req.query;
      const institutionId = req.tenantId;
      const userRole = req.user?.role;
      
      // Validation
      const errors = [];
      
      if (!key || key.trim().length === 0) {
        errors.push('File key is required');
      }
      
      if (expiresIn) {
        const expiresInNum = parseInt(expiresIn);
        if (isNaN(expiresInNum) || expiresInNum < 60 || expiresInNum > 86400) {
          errors.push('Expires in must be between 60 and 86400 seconds (1 minute to 24 hours)');
        }
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      // Verify user has access to this file
      if (!key.includes('institution_' + institutionId) && 
          !['superadmin', 'institution_admin'].includes(userRole)) {
        return forbiddenResponse(res, 'Access denied to this file');
      }

      const result = await storageService.getPresignedUrl(key, parseInt(expiresIn) || 3600);

      if (!result.success) {
        return errorResponse(res, result.error);
      }

      logger.info('Presigned URL generated successfully:', { key });
      return successResponse(res, {
        url: result.url,
        expiresIn: result.expiresIn
      }, 'Presigned URL generated successfully');
    } catch (error) {
      logger.error('Get presigned URL error:', error);
      return errorResponse(res, 'Failed to generate presigned URL');
    }
  },

  // Delete file
  deleteFile: async (req, res) => {
    try {
      logger.info('Deleting file');
      
      const { key } = req.params;
      const institutionId = req.tenantId;
      const userRole = req.user?.role;
      const userId = req.user?.id;
      
      // Validation
      const errors = [];
      
      if (!key || key.trim().length === 0) {
        errors.push('File key is required');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      // Verify user has permission to delete this file
      if (!key.includes('institution_' + institutionId) && 
          !['superadmin', 'institution_admin'].includes(userRole)) {
        return forbiddenResponse(res, 'Access denied to delete this file');
      }

      const result = await storageService.deleteFile(key);

      if (!result.success) {
        return errorResponse(res, result.error);
      }

      logger.info('File deleted successfully:', { 
        key,
        institution: institutionId,
        user: userId
      });

      return successResponse(res, null, 'File deleted successfully');
    } catch (error) {
      logger.error('Delete file error:', error);
      return errorResponse(res, 'Failed to delete file');
    }
  },

  // Get file metadata
  getFileMetadata: async (req, res) => {
    try {
      logger.info('Fetching file metadata');
      
      const { key } = req.params;
      const institutionId = req.tenantId;
      const userRole = req.user?.role;
      
      // Validation
      const errors = [];
      
      if (!key || key.trim().length === 0) {
        errors.push('File key is required');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      // Verify user has access to this file
      if (!key.includes('institution_' + institutionId) && 
          !['superadmin', 'institution_admin'].includes(userRole)) {
        return forbiddenResponse(res, 'Access denied to this file');
      }

      const result = await storageService.getFileMetadata(key);

      if (!result.success) {
        return notFoundResponse(res, 'File not found');
      }

      logger.info('File metadata fetched successfully:', { key });
      return successResponse(res, result.metadata, 'File metadata retrieved successfully');
    } catch (error) {
      logger.error('Get file metadata error:', error);
      return errorResponse(res, 'Failed to retrieve file metadata');
    }
  },

  // List files in institution folder
  listInstitutionFiles: async (req, res) => {
    try {
      logger.info('Listing institution files');
      
      const { folder, continuationToken, maxKeys } = req.query;
      const institutionId = req.tenantId;
      
      // Validation
      const errors = [];
      
      if (!institutionId) {
        errors.push('Institution ID is required');
      }
      
      if (folder && !VALID_FOLDERS.includes(folder)) {
        errors.push('Invalid folder. Must be one of: ' + VALID_FOLDERS.join(', '));
      }
      
      if (maxKeys) {
        const maxKeysNum = parseInt(maxKeys);
        if (isNaN(maxKeysNum) || maxKeysNum < 1 || maxKeysNum > 1000) {
          errors.push('Max keys must be between 1 and 1000');
        }
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      const prefix = (folder || 'uploads') + '/institution_' + institutionId + '/';
      const result = await storageService.listFiles(prefix, parseInt(maxKeys) || 1000, continuationToken);

      if (!result.success) {
        return errorResponse(res, result.error);
      }

      logger.info('Institution files listed successfully:', { 
        institution: institutionId,
        count: result.files?.length || 0
      });

      return successResponse(res, {
        files: result.files,
        isTruncated: result.isTruncated,
        nextContinuationToken: result.nextContinuationToken
      }, 'Files retrieved successfully');
    } catch (error) {
      logger.error('List files error:', error);
      return errorResponse(res, 'Failed to retrieve files');
    }
  },


  // Bulk delete files
  bulkDeleteFiles: async (req, res) => {
    try {
      logger.info('Bulk deleting files');
      
      const { keys } = req.body;
      const institutionId = req.tenantId;
      const userRole = req.user?.role;
      const userId = req.user?.id;
      
      // Validation
      const errors = [];
      
      if (!keys || !Array.isArray(keys) || keys.length === 0) {
        errors.push('File keys array is required and must not be empty');
      } else if (keys.length > 100) {
        errors.push('Maximum 100 files can be deleted at once');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      // Verify user has permission to delete these files
      const unauthorizedKeys = keys.filter(key => 
        !key.includes('institution_' + institutionId) && 
        !['superadmin', 'institution_admin'].includes(userRole)
      );

      if (unauthorizedKeys.length > 0) {
        return forbiddenResponse(res, 'Access denied to delete some files');
      }

      const result = await storageService.bulkDeleteFiles(keys);

      logger.info('Files bulk deleted successfully:', { 
        deleted: result.deleted,
        total: keys.length,
        institution: institutionId,
        user: userId
      });

      return successResponse(res, {
        deleted: result.deleted,
        failed: result.failed,
        summary: {
          total: keys.length,
          deleted: result.deleted,
          failed: result.failed.length
        }
      }, result.deleted + ' file(s) deleted successfully');
    } catch (error) {
      logger.error('Bulk delete files error:', error);
      return errorResponse(res, 'Failed to delete files');
    }
  },

  // Get upload statistics
  getUploadStatistics: async (req, res) => {
    try {
      logger.info('Fetching upload statistics');
      
      const institutionId = req.tenantId;
      
      // Validation
      const errors = [];
      
      if (!institutionId) {
        errors.push('Institution ID is required');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      const stats = await storageService.getUploadStatistics(institutionId);

      logger.info('Upload statistics fetched successfully');
      return successResponse(res, stats, 'Upload statistics retrieved successfully');
    } catch (error) {
      logger.error('Get upload statistics error:', error);
      return errorResponse(res, 'Failed to retrieve upload statistics');
    }
  },

  // Get storage usage
  getStorageUsage: async (req, res) => {
    try {
      logger.info('Fetching storage usage');
      
      const institutionId = req.tenantId;
      
      // Validation
      const errors = [];
      
      if (!institutionId) {
        errors.push('Institution ID is required');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      const usage = await storageService.getStorageUsage(institutionId);

      logger.info('Storage usage fetched successfully');
      return successResponse(res, usage, 'Storage usage retrieved successfully');
    } catch (error) {
      logger.error('Get storage usage error:', error);
      return errorResponse(res, 'Failed to retrieve storage usage');
    }
  },

  // Copy file
  copyFile: async (req, res) => {
    try {
      logger.info('Copying file');
      
      const { sourceKey, destinationKey } = req.body;
      const institutionId = req.tenantId;
      const userRole = req.user?.role;
      const userId = req.user?.id;
      
      // Validation
      const errors = [];
      
      if (!sourceKey || sourceKey.trim().length === 0) {
        errors.push('Source key is required');
      }
      
      if (!destinationKey || destinationKey.trim().length === 0) {
        errors.push('Destination key is required');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      // Verify user has access to source file
      if (!sourceKey.includes('institution_' + institutionId) && 
          !['superadmin', 'institution_admin'].includes(userRole)) {
        return forbiddenResponse(res, 'Access denied to source file');
      }

      const result = await storageService.copyFile(sourceKey, destinationKey);

      if (!result.success) {
        return errorResponse(res, result.error);
      }

      logger.info('File copied successfully:', { 
        sourceKey,
        destinationKey,
        institution: institutionId,
        user: userId
      });

      return createdResponse(res, result.file, 'File copied successfully');
    } catch (error) {
      logger.error('Copy file error:', error);
      return errorResponse(res, 'Failed to copy file');
    }
  },

  // Move file
  moveFile: async (req, res) => {
    try {
      logger.info('Moving file');
      
      const { sourceKey, destinationKey } = req.body;
      const institutionId = req.tenantId;
      const userRole = req.user?.role;
      const userId = req.user?.id;
      
      // Validation
      const errors = [];
      
      if (!sourceKey || sourceKey.trim().length === 0) {
        errors.push('Source key is required');
      }
      
      if (!destinationKey || destinationKey.trim().length === 0) {
        errors.push('Destination key is required');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      // Verify user has access to source file
      if (!sourceKey.includes('institution_' + institutionId) && 
          !['superadmin', 'institution_admin'].includes(userRole)) {
        return forbiddenResponse(res, 'Access denied to source file');
      }

      const result = await storageService.moveFile(sourceKey, destinationKey);

      if (!result.success) {
        return errorResponse(res, result.error);
      }

      logger.info('File moved successfully:', { 
        sourceKey,
        destinationKey,
        institution: institutionId,
        user: userId
      });

      return successResponse(res, result.file, 'File moved successfully');
    } catch (error) {
      logger.error('Move file error:', error);
      return errorResponse(res, 'Failed to move file');
    }
  },

  // Rename file
  renameFile: async (req, res) => {
    try {
      logger.info('Renaming file');
      
      const { key, newName } = req.body;
      const institutionId = req.tenantId;
      const userRole = req.user?.role;
      const userId = req.user?.id;
      
      // Validation
      const errors = [];
      
      if (!key || key.trim().length === 0) {
        errors.push('File key is required');
      }
      
      if (!newName || newName.trim().length === 0) {
        errors.push('New name is required');
      } else if (newName.length > 255) {
        errors.push('New name must not exceed 255 characters');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      // Verify user has access to file
      if (!key.includes('institution_' + institutionId) && 
          !['superadmin', 'institution_admin'].includes(userRole)) {
        return forbiddenResponse(res, 'Access denied to this file');
      }

      const result = await storageService.renameFile(key, newName);

      if (!result.success) {
        return errorResponse(res, result.error);
      }

      logger.info('File renamed successfully:', { 
        oldKey: key,
        newKey: result.file.key,
        institution: institutionId,
        user: userId
      });

      return successResponse(res, result.file, 'File renamed successfully');
    } catch (error) {
      logger.error('Rename file error:', error);
      return errorResponse(res, 'Failed to rename file');
    }
  },

  // Search files
  searchFiles: async (req, res) => {
    try {
      logger.info('Searching files');
      
      const { q, folder, fileType } = req.query;
      const institutionId = req.tenantId;
      
      // Validation
      const errors = [];
      
      if (!institutionId) {
        errors.push('Institution ID is required');
      }
      
      if (!q || q.trim().length === 0) {
        errors.push('Search query is required');
      } else if (q.length > 200) {
        errors.push('Search query must not exceed 200 characters');
      }
      
      if (folder && !VALID_FOLDERS.includes(folder)) {
        errors.push('Invalid folder. Must be one of: ' + VALID_FOLDERS.join(', '));
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      const result = await storageService.searchFiles(institutionId, q, { folder, fileType });

      logger.info('Files searched successfully:', { query: q });
      return successResponse(res, result, 'Search results retrieved successfully');
    } catch (error) {
      logger.error('Search files error:', error);
      return errorResponse(res, 'Failed to search files');
    }
  },

  // Get file by ID
  getFileById: async (req, res) => {
    try {
      logger.info('Fetching file by ID');
      
      const { id } = req.params;
      const institutionId = req.tenantId;
      
      // Validation
      const errors = [];
      
      const idError = validateObjectId(id, 'File ID');
      if (idError) errors.push(idError);
      
      if (!institutionId) {
        errors.push('Institution ID is required');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      const file = await storageService.getFileById(id, institutionId);

      if (!file) {
        return notFoundResponse(res, 'File not found');
      }

      logger.info('File fetched successfully:', { id });
      return successResponse(res, file, 'File retrieved successfully');
    } catch (error) {
      logger.error('Get file by ID error:', error);
      return errorResponse(res, 'Failed to retrieve file');
    }
  },

  // Get recent uploads
  getRecentUploads: async (req, res) => {
    try {
      logger.info('Fetching recent uploads');
      
      const { limit } = req.query;
      const institutionId = req.tenantId;
      const userId = req.user?.id;
      
      // Validation
      const errors = [];
      
      if (!institutionId) {
        errors.push('Institution ID is required');
      }
      
      const limitNum = parseInt(limit) || 20;
      if (limitNum < 1 || limitNum > 100) {
        errors.push('Limit must be between 1 and 100');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      const files = await storageService.getRecentUploads(institutionId, userId, limitNum);

      logger.info('Recent uploads fetched successfully');
      return successResponse(res, files, 'Recent uploads retrieved successfully');
    } catch (error) {
      logger.error('Get recent uploads error:', error);
      return errorResponse(res, 'Failed to retrieve recent uploads');
    }
  },

  // Validate file before upload
  validateFileBeforeUpload: async (req, res) => {
    try {
      logger.info('Validating file before upload');
      
      const { fileName, fileSize, mimeType } = req.body;
      
      // Validation
      const errors = [];
      
      if (!fileName || fileName.trim().length === 0) {
        errors.push('File name is required');
      }
      
      if (!fileSize) {
        errors.push('File size is required');
      } else {
        const size = parseInt(fileSize);
        if (isNaN(size) || size <= 0) {
          errors.push('File size must be a positive number');
        } else if (size > MAX_FILE_SIZE) {
          errors.push('File size exceeds maximum allowed size of ' + (MAX_FILE_SIZE / 1024 / 1024) + 'MB');
        }
      }
      
      if (!mimeType || mimeType.trim().length === 0) {
        errors.push('MIME type is required');
      } else if (!ALLOWED_FILE_TYPES.includes(mimeType)) {
        errors.push('File type ' + mimeType + ' is not allowed');
      }
      
      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      logger.info('File validation successful');
      return successResponse(res, { valid: true }, 'File validation successful');
    } catch (error) {
      logger.error('Validate file error:', error);
      return errorResponse(res, 'Failed to validate file');
    }
  }
};

// Multer middleware functions
const uploadMiddleware = {
  single: (fieldName = 'file') => upload.single(fieldName),
  multiple: (fieldName = 'files', maxCount = MAX_FILES_COUNT) => upload.array(fieldName, maxCount),
  fields: (fields) => upload.fields(fields)
};

// Export all functions
export default {
  uploadController,
  uploadMiddleware
};
