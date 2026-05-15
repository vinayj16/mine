import fileSharingService from '../services/fileSharingService.js';
import FileSharing from '../models/FileSharing.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_FILE_TYPES = ['document', 'image', 'video', 'audio', 'archive', 'spreadsheet', 'presentation', 'other'];
const VALID_ACCESS_LEVELS = ['view', 'edit', 'download', 'full'];
const VALID_VISIBILITY = ['private', 'shared', 'public'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

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

// Helper function to validate file size
const validateFileSize = (size) => {
  if (size === undefined || size === null) return null;
  const sizeNum = parseInt(size);
  if (isNaN(sizeNum) || sizeNum < 0) {
    return 'File size must be a non-negative number';
  }
  if (sizeNum > MAX_FILE_SIZE) {
    return 'File size must not exceed 100MB';
  }
  return null;
};
const uploadFile = async (req, res) => {
  try {
    logger.info('Uploading file');
    
    const { title, description, category, tags, visibility, accessLevel } = req.body;
    const institution = req.user.institution;
    const uploadedBy = req.user.id;
    
    // Validation
    const errors = [];
    
    if (!req.file) {
      errors.push('No file uploaded');
    }
    
    if (!uploadedBy) {
      errors.push('Uploaded by user ID is required');
    } else {
      const uploadedByError = validateObjectId(uploadedBy, 'Uploaded by user ID');
      if (uploadedByError) errors.push(uploadedByError);
    }
    
    if (!institution) {
      errors.push('Institution is required');
    } else {
      const institutionError = validateObjectId(institution, 'Institution');
      if (institutionError) errors.push(institutionError);
    }
    
    if (title && title.length > 255) {
      errors.push('Title must not exceed 255 characters');
    }
    
    if (description && description.length > 2000) {
      errors.push('Description must not exceed 2000 characters');
    }
    
    if (category && category.length > 100) {
      errors.push('Category must not exceed 100 characters');
    }
    
    if (visibility && !VALID_VISIBILITY.includes(visibility)) {
      errors.push('Invalid visibility. Must be one of: ' + VALID_VISIBILITY.join(', '));
    }
    
    if (accessLevel && !VALID_ACCESS_LEVELS.includes(accessLevel)) {
      errors.push('Invalid access level. Must be one of: ' + VALID_ACCESS_LEVELS.join(', '));
    }
    
    if (req.file) {
      const fileSizeError = validateFileSize(req.file.size);
      if (fileSizeError) errors.push(fileSizeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const file = await fileSharingService.uploadFile(
      {
        file: req.file,
        uploadedBy,
        ...req.body,
      },
      institution
    );

    logger.info('File uploaded successfully:', { fileId: file._id });
    return createdResponse(res, file, 'File uploaded successfully');
  } catch (error) {
    logger.error('Error uploading file:', error);
    return errorResponse(res, error.message);
  }
};

const getFiles = async (req, res) => {
  try {
    logger.info('Fetching files');
    
    const { category, visibility, uploadedBy, fileType, page, limit, sortBy, sortOrder, search } = req.query;
    const institution = req.user.institution;
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution is required');
    } else {
      const institutionError = validateObjectId(institution, 'Institution');
      if (institutionError) errors.push(institutionError);
    }
    
    if (uploadedBy) {
      const uploadedByError = validateObjectId(uploadedBy, 'Uploaded by user ID');
      if (uploadedByError) errors.push(uploadedByError);
    }
    
    if (visibility && !VALID_VISIBILITY.includes(visibility)) {
      errors.push('Invalid visibility. Must be one of: ' + VALID_VISIBILITY.join(', '));
    }
    
    if (fileType && !VALID_FILE_TYPES.includes(fileType)) {
      errors.push('Invalid file type. Must be one of: ' + VALID_FILE_TYPES.join(', '));
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

    const result = await fileSharingService.getFiles(institution, req.query);

    logger.info('Files fetched successfully');
    return successResponse(res, {
      files: result.files,
      pagination: result.pagination
    }, 'Files retrieved successfully');
  } catch (error) {
    logger.error('Error fetching files:', error);
    return errorResponse(res, error.message);
  }
};

const getFileById = async (req, res) => {
  try {
    logger.info('Fetching file by ID');
    
    const { fileId } = req.params;
    const institution = req.user.institution;
    
    // Validation
    const errors = [];
    
    const fileIdError = validateObjectId(fileId, 'File ID');
    if (fileIdError) errors.push(fileIdError);
    
    if (!institution) {
      errors.push('Institution is required');
    } else {
      const institutionError = validateObjectId(institution, 'Institution');
      if (institutionError) errors.push(institutionError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const file = await fileSharingService.getFileById(fileId, institution);
    
    if (!file) {
      return notFoundResponse(res, 'File not found');
    }

    logger.info('File fetched successfully:', { fileId });
    return successResponse(res, file, 'File retrieved successfully');
  } catch (error) {
    logger.error('Error fetching file:', error);
    return errorResponse(res, error.message);
  }
};

const shareFile = async (req, res) => {
  try {
    logger.info('Sharing file');
    
    const { fileId } = req.params;
    const { users, accessLevel } = req.body;
    const institution = req.user.institution;
    
    // Validation
    const errors = [];
    
    const fileIdError = validateObjectId(fileId, 'File ID');
    if (fileIdError) errors.push(fileIdError);
    
    if (!institution) {
      errors.push('Institution is required');
    } else {
      const institutionError = validateObjectId(institution, 'Institution');
      if (institutionError) errors.push(institutionError);
    }
    
    if (!Array.isArray(users) || users.length === 0) {
      errors.push('Users array is required and must not be empty');
    }
    
    if (users && users.length > 100) {
      errors.push('Cannot share with more than 100 users at once');
    }
    
    if (users) {
      for (let i = 0; i < Math.min(users.length, 10); i++) {
        const userIdError = validateObjectId(users[i], 'User ID at index ' + i);
        if (userIdError) {
          errors.push(userIdError);
          break;
        }
      }
    }
    
    if (accessLevel && !VALID_ACCESS_LEVELS.includes(accessLevel)) {
      errors.push('Invalid access level. Must be one of: ' + VALID_ACCESS_LEVELS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const file = await fileSharingService.shareFile(fileId, users, institution);
    
    if (!file) {
      return notFoundResponse(res, 'File not found');
    }

    logger.info('File shared successfully:', { fileId, userCount: users.length });
    return successResponse(res, file, 'File shared successfully');
  } catch (error) {
    logger.error('Error sharing file:', error);
    return errorResponse(res, error.message);
  }
};

const revokeAccess = async (req, res) => {
  try {
    logger.info('Revoking file access');
    
    const { fileId, userId } = req.params;
    const institution = req.user.institution;
    
    // Validation
    const errors = [];
    
    const fileIdError = validateObjectId(fileId, 'File ID');
    if (fileIdError) errors.push(fileIdError);
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!institution) {
      errors.push('Institution is required');
    } else {
      const institutionError = validateObjectId(institution, 'Institution');
      if (institutionError) errors.push(institutionError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const file = await fileSharingService.revokeAccess(fileId, userId, institution);
    
    if (!file) {
      return notFoundResponse(res, 'File not found');
    }

    logger.info('File access revoked successfully:', { fileId, userId });
    return successResponse(res, file, 'File access revoked successfully');
  } catch (error) {
    logger.error('Error revoking file access:', error);
    return errorResponse(res, error.message);
  }
};

const downloadFile = async (req, res) => {
  try {
    logger.info('Downloading file');
    
    const { fileId } = req.params;
    const institution = req.user.institution;
    
    // Validation
    const errors = [];
    
    const fileIdError = validateObjectId(fileId, 'File ID');
    if (fileIdError) errors.push(fileIdError);
    
    if (!institution) {
      errors.push('Institution is required');
    } else {
      const institutionError = validateObjectId(institution, 'Institution');
      if (institutionError) errors.push(institutionError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const fileData = await fileSharingService.downloadFile(fileId, institution);
    
    if (!fileData) {
      return notFoundResponse(res, 'File not found');
    }

    logger.info('File downloaded successfully:', { fileId });
    res.download(fileData.path, fileData.name);
  } catch (error) {
    logger.error('Error downloading file:', error);
    return errorResponse(res, error.message);
  }
};

const deleteFile = async (req, res) => {
  try {
    logger.info('Deleting file');
    
    const { fileId } = req.params;
    const institution = req.user.institution;
    
    // Validation
    const errors = [];
    
    const fileIdError = validateObjectId(fileId, 'File ID');
    if (fileIdError) errors.push(fileIdError);
    
    if (!institution) {
      errors.push('Institution is required');
    } else {
      const institutionError = validateObjectId(institution, 'Institution');
      if (institutionError) errors.push(institutionError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await fileSharingService.deleteFile(fileId, institution);
    
    if (!result) {
      return notFoundResponse(res, 'File not found');
    }

    logger.info('File deleted successfully:', { fileId });
    return successResponse(res, null, 'File deleted successfully');
  } catch (error) {
    logger.error('Error deleting file:', error);
    return errorResponse(res, error.message);
  }
};

const getFilesSharedWithUser = async (req, res) => {
  try {
    logger.info('Fetching files shared with user');
    
    const userId = req.user.id;
    const institution = req.user.institution;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (!institution) {
      errors.push('Institution is required');
    } else {
      const institutionError = validateObjectId(institution, 'Institution');
      if (institutionError) errors.push(institutionError);
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

    const result = await fileSharingService.getFilesSharedWithUser(
      userId,
      institution,
      req.query
    );

    logger.info('Files shared with user fetched successfully');
    return successResponse(res, {
      files: result.files,
      pagination: result.pagination
    }, 'Shared files retrieved successfully');
  } catch (error) {
    logger.error('Error fetching shared files:', error);
    return errorResponse(res, error.message);
  }
};

const getStatistics = async (req, res) => {
  try {
    logger.info('Fetching file statistics');
    
    const institution = req.user.institution;
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution is required');
    } else {
      const institutionError = validateObjectId(institution, 'Institution');
      if (institutionError) errors.push(institutionError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const stats = await fileSharingService.getFileStatistics(institution);

    logger.info('File statistics fetched successfully');
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching file statistics:', error);
    return errorResponse(res, error.message);
  }
};

const updateFileMetadata = async (req, res) => {
  try {
    logger.info('Updating file metadata');
    
    const { fileId } = req.params;
    const { title, description, category, tags, visibility } = req.body;
    const institution = req.user.institution;
    
    // Validation
    const errors = [];
    
    const fileIdError = validateObjectId(fileId, 'File ID');
    if (fileIdError) errors.push(fileIdError);
    
    if (!institution) {
      errors.push('Institution is required');
    } else {
      const institutionError = validateObjectId(institution, 'Institution');
      if (institutionError) errors.push(institutionError);
    }
    
    if (title !== undefined) {
      if (title.trim().length === 0) {
        errors.push('Title cannot be empty');
      } else if (title.length > 255) {
        errors.push('Title must not exceed 255 characters');
      }
    }
    
    if (description && description.length > 2000) {
      errors.push('Description must not exceed 2000 characters');
    }
    
    if (category && category.length > 100) {
      errors.push('Category must not exceed 100 characters');
    }
    
    if (visibility && !VALID_VISIBILITY.includes(visibility)) {
      errors.push('Invalid visibility. Must be one of: ' + VALID_VISIBILITY.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const file = await fileSharingService.updateFileMetadata(
      fileId,
      req.body,
      institution
    );
    
    if (!file) {
      return notFoundResponse(res, 'File not found');
    }

    logger.info('File metadata updated successfully:', { fileId });
    return successResponse(res, file, 'File metadata updated successfully');
  } catch (error) {
    logger.error('Error updating file metadata:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk Operations
const bulkDeleteFiles = async (req, res) => {
  try {
    logger.info('Bulk deleting files');
    
    const { fileIds } = req.body;
    const institution = req.user.institution;
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution is required');
    } else {
      const institutionError = validateObjectId(institution, 'Institution');
      if (institutionError) errors.push(institutionError);
    }
    
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      errors.push('File IDs array is required and must not be empty');
    }
    
    if (fileIds && fileIds.length > 100) {
      errors.push('Cannot delete more than 100 files at once');
    }
    
    if (fileIds) {
      for (let i = 0; i < fileIds.length; i++) {
        const idError = validateObjectId(fileIds[i], 'File ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await FileSharing.deleteMany({
      _id: { $in: fileIds },
      institution: new mongoose.Types.ObjectId(institution)
    });

    logger.info('Files bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, {
      deletedCount: result.deletedCount
    }, 'Files deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting files:', error);
    return errorResponse(res, error.message);
  }
};

const bulkShareFiles = async (req, res) => {
  try {
    logger.info('Bulk sharing files');
    
    const { fileIds, users, accessLevel } = req.body;
    const institution = req.user.institution;
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution is required');
    } else {
      const institutionError = validateObjectId(institution, 'Institution');
      if (institutionError) errors.push(institutionError);
    }
    
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      errors.push('File IDs array is required and must not be empty');
    }
    
    if (fileIds && fileIds.length > 50) {
      errors.push('Cannot share more than 50 files at once');
    }
    
    if (!Array.isArray(users) || users.length === 0) {
      errors.push('Users array is required and must not be empty');
    }
    
    if (users && users.length > 100) {
      errors.push('Cannot share with more than 100 users at once');
    }
    
    if (accessLevel && !VALID_ACCESS_LEVELS.includes(accessLevel)) {
      errors.push('Invalid access level. Must be one of: ' + VALID_ACCESS_LEVELS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const results = [];
    for (const fileId of fileIds) {
      const file = await fileSharingService.shareFile(fileId, users, institution);
      if (file) results.push(file);
    }

    logger.info('Files bulk shared successfully:', { fileCount: results.length, userCount: users.length });
    return successResponse(res, {
      sharedCount: results.length,
      files: results
    }, 'Files shared successfully');
  } catch (error) {
    logger.error('Error bulk sharing files:', error);
    return errorResponse(res, error.message);
  }
};

// Export Files
const exportFilesList = async (req, res) => {
  try {
    logger.info('Exporting files list');
    
    const { format, category, visibility } = req.query;
    const institution = req.user.institution;
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution is required');
    } else {
      const institutionError = validateObjectId(institution, 'Institution');
      if (institutionError) errors.push(institutionError);
    }
    
    const validFormats = ['json', 'csv', 'xlsx'];
    if (!format) {
      errors.push('Format is required');
    } else if (!validFormats.includes(format)) {
      errors.push('Invalid format. Must be one of: ' + validFormats.join(', '));
    }
    
    if (visibility && !VALID_VISIBILITY.includes(visibility)) {
      errors.push('Invalid visibility. Must be one of: ' + VALID_VISIBILITY.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = { institution: new mongoose.Types.ObjectId(institution) };
    if (category) filters.category = category;
    if (visibility) filters.visibility = visibility;

    const files = await FileSharing.find(filters).lean();

    logger.info('Files list exported successfully:', { format, count: files.length });
    return successResponse(res, {
      format,
      count: files.length,
      data: files,
      exportedAt: new Date()
    }, 'Files list exported successfully');
  } catch (error) {
    logger.error('Error exporting files list:', error);
    return errorResponse(res, error.message);
  }
};

export default {
  uploadFile,
  getFiles,
  getFileById,
  shareFile,
  revokeAccess,
  downloadFile,
  deleteFile,
  getFilesSharedWithUser,
  getStatistics,
  updateFileMetadata,
  bulkDeleteFiles,
  bulkShareFiles,
  exportFilesList
};
