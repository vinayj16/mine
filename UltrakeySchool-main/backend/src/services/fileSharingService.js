import fs from 'fs/promises';
import logger from '../utils/logger.js';
import FileSharing from '../models/FileSharing.js';

class FileSharingService {
  /**
   * Upload and share file
   * @param {Object} fileData - File data
   * @param {string} institutionId - Institution ID
   * @returns {Object} Shared file
   */
  async uploadFile(fileData, institutionId) {
    try {
      const {
        file,
        uploadedBy,
        sharedWith,
        chatRoom,
        conversation,
        title,
        description,
        category: userCategory,
        tags,
        visibility,
        accessLevel,
        expiresAt,
      } = fileData;

      const resolvedCategory = userCategory || this.determineCategory(file.mimetype);
      const normalizedTags = Array.isArray(tags)
        ? tags
        : tags
          ? tags.split(',').map(t => t.trim()).filter(t => t)
          : [];
      const fileVisibility = visibility || 'private';
      const fileAccessLevel = accessLevel || 'view';
      const isPublic = fileVisibility === 'public';

      const sharedFile = new FileSharing({
        title,
        description,
        name: file.filename,
        originalName: file.originalname,
        fileType: file.mimetype,
        mimeType: file.mimetype,
        size: file.size,
        url: file.path,
        uploadedBy,
        sharedWith: sharedWith || [],
        chatRoom,
        conversation,
        category: resolvedCategory,
        tags: normalizedTags,
        visibility: fileVisibility,
        accessLevel: fileAccessLevel,
        isPublic,
        expiresAt,
        institution: institutionId,
      });

      await sharedFile.save();
      await sharedFile.populate(['uploadedBy', 'sharedWith.user']);

      logger.info(`File uploaded and shared: ${sharedFile._id}`);
      return sharedFile;
    } catch (error) {
      logger.error(`Error uploading file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Determine file category from mime type
   * @param {string} mimeType - MIME type
   * @returns {string} Category
   */
  determineCategory(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || 
        mimeType.includes('text') || mimeType.includes('spreadsheet') ||
        mimeType.includes('presentation')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || 
        mimeType.includes('tar') || mimeType.includes('7z')) return 'archive';
    return 'other';
  }

  /**
   * Get files
   * @param {string} institutionId - Institution ID
   * @param {Object} filters - Filters
   * @returns {Object} Files with pagination
   */
  async getFiles(institutionId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        uploadedBy,
        chatRoom,
        conversation,
        search,
        visibility,
        fileType,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;
      const query = { institution: institutionId };

      if (category) query.category = category;
      if (uploadedBy) query.uploadedBy = uploadedBy;
      if (chatRoom) query.chatRoom = chatRoom;
      if (conversation) query.conversation = conversation;
      if (visibility) query.visibility = visibility;
      if (fileType) query.fileType = fileType;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { originalName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ];
      }

      const allowedSortFields = new Set(['createdAt', 'name', 'size', 'downloads']);
      const sortField = allowedSortFields.has(sortBy) ? sortBy : 'createdAt';
      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      const files = await FileSharing.find(query)
        .populate(['uploadedBy', 'sharedWith.user'])
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ [sortField]: sortDirection });

      const total = await FileSharing.countDocuments(query);

      return {
        files,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
        },
      };
    } catch (error) {
      logger.error(`Error fetching files: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file by ID
   * @param {string} fileId - File ID
   * @param {string} institutionId - Institution ID
   * @returns {Object} File
   */
  async getFileById(fileId, institutionId) {
    try {
      const file = await FileSharing.findOne({
        _id: fileId,
        institution: institutionId,
      }).populate(['uploadedBy', 'sharedWith.user']);

      if (!file) {
        throw new Error('File not found');
      }

      return file;
    } catch (error) {
      logger.error(`Error fetching file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Share file with users
   * @param {string} fileId - File ID
   * @param {Array} users - Array of user IDs with permissions
   * @param {string} institutionId - Institution ID
   * @returns {Object} Updated file
   */
  async shareFile(fileId, users, institutionId) {
    try {
      const file = await FileSharing.findOne({
        _id: fileId,
        institution: institutionId,
      });

      if (!file) {
        throw new Error('File not found');
      }

      users.forEach(({ userId, permission }) => {
        const existingShare = file.sharedWith.find(
          s => s.user.toString() === userId
        );

        if (!existingShare) {
          file.sharedWith.push({
            user: userId,
            permission: permission || 'view',
            sharedAt: new Date(),
          });
        } else {
          existingShare.permission = permission || existingShare.permission;
        }
      });

      await file.save();
      await file.populate(['uploadedBy', 'sharedWith.user']);

      logger.info(`File shared: ${fileId}`);
      return file;
    } catch (error) {
      logger.error(`Error sharing file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Revoke file access
   * @param {string} fileId - File ID
   * @param {string} userId - User ID
   * @param {string} institutionId - Institution ID
   * @returns {Object} Updated file
   */
  async revokeAccess(fileId, userId, institutionId) {
    try {
      const file = await FileSharing.findOne({
        _id: fileId,
        institution: institutionId,
      });

      if (!file) {
        throw new Error('File not found');
      }

      file.sharedWith = file.sharedWith.filter(
        s => s.user.toString() !== userId
      );

      await file.save();

      logger.info(`File access revoked: ${fileId}`);
      return file;
    } catch (error) {
      logger.error(`Error revoking file access: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download file
   * @param {string} fileId - File ID
   * @param {string} institutionId - Institution ID
   * @returns {Object} File data
   */
  async downloadFile(fileId, institutionId) {
    try {
      const file = await FileSharing.findOne({
        _id: fileId,
        institution: institutionId,
      });

      if (!file) {
        throw new Error('File not found');
      }

      file.downloads += 1;
      await file.save();

      return {
        path: file.url,
        name: file.originalName || file.name,
        mimeType: file.mimeType,
      };
    } catch (error) {
      logger.error(`Error downloading file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete file
   * @param {string} fileId - File ID
   * @param {string} institutionId - Institution ID
   * @returns {Object} Deleted file
   */
  async deleteFile(fileId, institutionId) {
    try {
      const file = await FileSharing.findOne({
        _id: fileId,
        institution: institutionId,
      });

      if (!file) {
        throw new Error('File not found');
      }

      // Delete physical file
      try {
        await fs.unlink(file.url);
      } catch (err) {
        logger.warn(`Could not delete physical file: ${err.message}`);
      }

      await file.deleteOne();

      logger.info(`File deleted: ${fileId}`);
      return file;
    } catch (error) {
      logger.error(`Error deleting file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get files shared with user
   * @param {string} userId - User ID
   * @param {string} institutionId - Institution ID
   * @param {Object} filters - Filters
   * @returns {Object} Files with pagination
   */
  async getFilesSharedWithUser(userId, institutionId, filters = {}) {
    try {
      const { page = 1, limit = 20, category } = filters;

      const query = {
        institution: institutionId,
        $or: [
          { 'sharedWith.user': userId },
          { uploadedBy: userId },
          { isPublic: true },
        ],
      };

      if (category) query.category = category;

      const files = await FileSharing.find(query)
        .populate(['uploadedBy', 'sharedWith.user'])
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await FileSharing.countDocuments(query);

      return {
        files,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching shared files: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file statistics
   * @param {string} institutionId - Institution ID
   * @returns {Object} Statistics
   */
  async getFileStatistics(institutionId) {
    try {
      const files = await FileSharing.find({ institution: institutionId });

      const stats = {
        total: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        totalDownloads: files.reduce((sum, f) => sum + f.downloads, 0),
        totalViews: files.reduce((sum, f) => sum + f.views, 0),
        byCategory: {},
        byType: {},
      };

      files.forEach(f => {
        stats.byCategory[f.category] = (stats.byCategory[f.category] || 0) + 1;
        stats.byType[f.fileType] = (stats.byType[f.fileType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error(`Error fetching file statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update file metadata
   * @param {string} fileId - File ID
   * @param {Object} updateData - Update data
   * @param {string} institutionId - Institution ID
   * @returns {Object} Updated file
   */
  async updateFileMetadata(fileId, updateData, institutionId) {
    try {
      const file = await FileSharing.findOneAndUpdate(
        { _id: fileId, institution: institutionId },
        updateData,
        { new: true, runValidators: true }
      ).populate(['uploadedBy', 'sharedWith.user']);

      if (!file) {
        throw new Error('File not found');
      }

      logger.info(`File metadata updated: ${fileId}`);
      return file;
    } catch (error) {
      logger.error(`Error updating file metadata: ${error.message}`);
      throw error;
    }
  }
}

// Add method alias to match controller expectations
FileSharingService.prototype.getStatistics = FileSharingService.prototype.getFileStatistics;

export default new FileSharingService();
