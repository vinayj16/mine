/**
 * DSR (Data Subject Request) Service
 * Handles data subject requests for GDPR compliance
 */

const DataExportRequest = require('../models/dataExportRequest');
const DataErasureRequest = require('../models/dataErasureRequest');
const User = require('../models/User');
const { logger } = require('../utils/logger');

class DsrService {
  /**
   * Create a data export request
   */
  async createDataExportRequest(userId, institutionId, requestedBy) {
    try {
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if there's already a pending request
      const existingRequest = await DataExportRequest.findOne({
        userId,
        institution: institutionId,
        status: { $in: ['pending', 'processing'] }
      });

      if (existingRequest) {
        throw new Error('A data export request is already pending or being processed');
      }

      // Create export request
      const exportRequest = new DataExportRequest({
        userId,
        institution: institutionId,
        requestedBy,
        status: 'pending',
        metadata: {
          requestedAt: new Date(),
          requestedBy
        }
      });

      await exportRequest.save();

      logger.info(`Data export request created for user: ${user.name} by: ${requestedBy}`);
      
      return {
        success: true,
        data: {
          id: exportRequest._id,
          userId: exportRequest.userId,
          status: exportRequest.status,
          requestedAt: exportRequest.requestedAt,
          completedAt: exportRequest.completedAt,
          downloadUrl: exportRequest.downloadUrl
        }
      };
    } catch (error) {
      logger.error('Error creating data export request:', error);
      throw error;
    }
  }

  /**
   * Create a data erasure request
   */
  async createDataErasureRequest(userId, institutionId, requestedBy, reason) {
    try {
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if there's already a pending request
      const existingRequest = await DataErasureRequest.findOne({
        userId,
        institution: institutionId,
        status: { $in: ['pending', 'processing'] }
      });

      if (existingRequest) {
        throw new Error('A data erasure request is already pending or being processed');
      }

      // Create erasure request
      const erasureRequest = new DataErasureRequest({
        userId,
        institution: institutionId,
        requestedBy,
        reason,
        status: 'pending',
        metadata: {
          requestedAt: new Date(),
          requestedBy
        }
      });

      await erasureRequest.save();

      logger.info(`Data erasure request created for user: ${user.name} by: ${requestedBy}, reason: ${reason}`);
      
      return {
        success: true,
        data: {
          id: erasureRequest._id,
          userId: erasureRequest.userId,
          status: erasureRequest.status,
          reason: erasureRequest.reason,
          requestedAt: erasureRequest.requestedAt,
          completedAt: erasureRequest.completedAt
        }
      };
    } catch (error) {
      logger.error('Error creating data erasure request:', error);
      throw error;
    }
  }

  /**
   * Get data export requests
   */
  async getDataExportRequests(institutionId, filters = {}) {
    try {
      const query = {
        institution: institutionId,
        ...filters
      };

      const requests = await DataExportRequest.find(query)
        .populate('userId', 'name email role')
        .populate('metadata.requestedBy', 'name email')
        .sort({ requestedAt: -1 });

      return {
        success: true,
        data: requests,
        pagination: {
          total: requests.length,
          page: 1,
          limit: requests.length
        }
      };
    } catch (error) {
      logger.error('Error fetching data export requests:', error);
      throw error;
    }
  }

  /**
   * Get data erasure requests
   */
  async getDataErasureRequests(institutionId, filters = {}) {
    try {
      const query = {
        institution: institutionId,
        ...filters
      };

      const requests = await DataErasureRequest.find(query)
        .populate('userId', 'name email role')
        .populate('metadata.requestedBy', 'name email')
        .sort({ requestedAt: -1 });

      return {
        success: true,
        data: requests,
        pagination: {
          total: requests.length,
          page: 1,
          limit: requests.length
        }
      };
    } catch (error) {
      logger.error('Error fetching data erasure requests:', error);
      throw error;
    }
  }

  /**
   * Get data export request by ID
   */
  async getDataExportRequestById(id, institutionId) {
    try {
      const request = await DataExportRequest.findOne({
        _id: id,
        institution: institutionId
      }).populate('userId', 'name email role');

      if (!request) {
        return {
          success: false,
          message: 'Data export request not found'
        };
      }

      return {
        success: true,
        data: request
      };
    } catch (error) {
      logger.error('Error fetching data export request:', error);
      throw error;
    }
  }

  /**
   * Get data export request status
   */
  async getDataExportStatus(id, institutionId) {
    try {
      const request = await DataExportRequest.findOne({
        _id: id,
        institution: institutionId
      }).populate('userId', 'name email role');

      if (!request) {
        return {
          success: false,
          message: 'Data export request not found'
        };
      }

      return {
        success: true,
        data: {
          id: request._id,
          status: request.status,
          requestedAt: request.requestedAt,
          completedAt: request.completedAt,
          downloadUrl: request.downloadUrl,
          progress: request.status === 'completed' ? 100 : 
                   request.status === 'processing' ? 50 : 
                   request.status === 'pending' ? 0 : 0,
          userId: request.userId,
          requestedBy: request.metadata?.requestedBy
        }
      };
    } catch (error) {
      logger.error('Error fetching data export status:', error);
      throw error;
    }
  }

  /**
   * Get data erasure request by ID
   */
  async getDataErasureRequestById(id, institutionId) {
    try {
      const request = await DataErasureRequest.findOne({
        _id: id,
        institution: institutionId
      }).populate('userId', 'name email role');

      if (!request) {
        return {
          success: false,
          message: 'Data erasure request not found'
        };
      }

      return {
        success: true,
        data: request
      };
    } catch (error) {
      logger.error('Error fetching data erasure request:', error);
      throw error;
    }
  }

  /**
   * Update data export request status
   */
  async updateDataExportRequest(id, status, institutionId, updatedBy, downloadUrl = null) {
    try {
      const request = await DataExportRequest.findOne({
        _id: id,
        institution: institutionId
      });

      if (!request) {
        return {
          success: false,
          message: 'Data export request not found'
        };
      }

      // Validate status
      const validStatuses = ['pending', 'processing', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      request.status = status;
      request.updatedBy = updatedBy;

      if (status === 'completed' && downloadUrl) {
        request.completedAt = new Date();
        request.downloadUrl = downloadUrl;
      } else if (status === 'failed') {
        request.completedAt = new Date();
      }

      await request.save();

      logger.info(`Data export request updated: ${request._id}, status: ${status} by: ${updatedBy}`);
      
      return {
        success: true,
        data: {
          id: request._id,
          status: request.status,
          downloadUrl: request.downloadUrl,
          completedAt: request.completedAt,
          updatedAt: request.updatedAt
        }
      };
    } catch (error) {
      logger.error('Error updating data export request:', error);
      throw error;
    }
  }

  /**
   * Update data erasure request status
   */
  async updateDataErasureRequest(id, status, institutionId, updatedBy, reason = null) {
    try {
      const request = await DataErasureRequest.findOne({
        _id: id,
        institution: institutionId
      });

      if (!request) {
        return {
          success: false,
          message: 'Data erasure request not found'
        };
      }

      // Validate status
      const validStatuses = ['pending', 'processing', 'completed', 'rejected'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      request.status = status;
      request.updatedBy = updatedBy;

      if (status === 'completed' || status === 'rejected') {
        request.completedAt = new Date();
        if (reason) {
          request.rejectionReason = reason;
        }
      }

      await request.save();

      logger.info(`Data erasure request updated: ${request._id}, status: ${status} by: ${updatedBy}`);
      
      return {
        success: true,
        data: {
          id: request._id,
          status: request.status,
          rejectionReason: request.rejectionReason,
          completedAt: request.completedAt,
          updatedAt: request.updatedAt
        }
      };
    } catch (error) {
      logger.error('Error updating data erasure request:', error);
      throw error;
    }
  }

  /**
   * Delete data export request
   */
  async deleteDataExportRequest(id, institutionId, deletedBy) {
    try {
      const request = await DataExportRequest.findOne({
        _id: id,
        institution: institutionId
      });

      if (!request) {
        return {
          success: false,
          message: 'Data export request not found'
        };
      }

      await DataExportRequest.deleteOne({ _id: id });

      logger.info(`Data export request deleted: ${request._id} by: ${deletedBy}`);
      
      return {
        success: true,
        message: 'Data export request deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting data export request:', error);
      throw error;
    }
  }

  /**
   * Delete data erasure request
   */
  async deleteDataErasureRequest(id, institutionId, deletedBy) {
    try {
      const request = await DataErasureRequest.findOne({
        _id: id,
        institution: institutionId
      });

      if (!request) {
        return {
          success: false,
          message: 'Data erasure request not found'
        };
      }

      await DataErasureRequest.deleteOne({ _id: id });

      logger.info(`Data erasure request deleted: ${request._id} by: ${deletedBy}`);
      
      return {
        success: true,
        message: 'Data erasure request deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting data erasure request:', error);
      throw error;
    }
  }

  /**
   * Get DSR statistics
   */
  async getDsrStatistics(institutionId) {
    try {
      const totalExportRequests = await DataExportRequest.countDocuments({
        institution: institutionId
      });

      const pendingExportRequests = await DataExportRequest.countDocuments({
        institution: institutionId,
        status: 'pending'
      });

      const completedExportRequests = await DataExportRequest.countDocuments({
        institution: institutionId,
        status: 'completed'
      });

      const totalErasureRequests = await DataErasureRequest.countDocuments({
        institution: institutionId
      });

      const pendingErasureRequests = await DataErasureRequest.countDocuments({
        institution: institutionId,
        status: 'pending'
      });

      const completedErasureRequests = await DataErasureRequest.countDocuments({
        institution: institutionId,
        status: 'completed'
      });

      const exportStatusStats = await DataExportRequest.aggregate([
        {
          $match: {
            institution: institutionId
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const erasureStatusStats = await DataErasureRequest.aggregate([
        {
          $match: {
            institution: institutionId
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        success: true,
        data: {
          exportRequests: {
            total: totalExportRequests,
            pending: pendingExportRequests,
            completed: completedExportRequests,
            statusStats: exportStatusStats
          },
          erasureRequests: {
            total: totalErasureRequests,
            pending: pendingErasureRequests,
            completed: completedErasureRequests,
            statusStats: erasureStatusStats
          }
        }
      };
    } catch (error) {
      logger.error('Error fetching DSR statistics:', error);
      throw error;
    }
  }

  /**
   * Check data retention compliance
   */
  async checkDataRetentionCompliance(institutionId) {
    try {
      // Check for old completed requests that should be archived
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldExportRequests = await DataExportRequest.countDocuments({
        institution: institutionId,
        status: 'completed',
        completedAt: { $lt: thirtyDaysAgo }
      });

      const oldErasureRequests = await DataErasureRequest.countDocuments({
        institution: institutionId,
        status: 'completed',
        completedAt: { $lt: thirtyDaysAgo }
      });

      const recommendations = [];
      
      if (oldExportRequests > 0) {
        recommendations.push({
          type: 'archive',
          message: `Consider archiving ${oldExportRequests} old data export requests`
        });
      }

      if (oldErasureRequests > 0) {
        recommendations.push({
          type: 'archive',
          message: `Consider archiving ${oldErasureRequests} old data erasure requests`
        });
      }

      return {
        success: true,
        data: {
          oldExportRequests,
          oldErasureRequests,
          complianceStatus: recommendations.length === 0 ? 'compliant' : 'needs_attention',
          recommendations
        }
      };
    } catch (error) {
      logger.error('Error checking data retention compliance:', error);
      throw error;
    }
  }

  /**
   * Get user's DSR requests
   */
  async getUserDsrRequests(userId, institutionId) {
    try {
      const exportRequests = await DataExportRequest.find({
        userId,
        institution: institutionId
      }).sort({ requestedAt: -1 });

      const erasureRequests = await DataErasureRequest.find({
        userId,
        institution: institutionId
      }).sort({ requestedAt: -1 });

      return {
        success: true,
        data: {
          exportRequests,
          erasureRequests
        }
      };
    } catch (error) {
      logger.error('Error fetching user DSR requests:', error);
      throw error;
    }
  }

  /**
   * Process data export
   */
  async processDataExport(requestId, institutionId) {
    try {
      const request = await DataExportRequest.findOne({
        _id: requestId,
        institution: institutionId,
        status: 'processing'
      });

      if (!request) {
        return {
          success: false,
          message: 'Data export request not found or not in processing state'
        };
      }

      // This would typically involve:
      // 1. Collecting all user data
      // 2. Creating a data export package
      // 3. Uploading to secure storage
      // 4. Generating download URL

      // For now, we'll simulate the process
      const downloadUrl = `https://example.com/downloads/export_${request._id}.zip`;
      
      request.status = 'completed';
      request.completedAt = new Date();
      request.downloadUrl = downloadUrl;
      await request.save();

      logger.info(`Data export completed for request: ${request._id}`);
      
      return {
        success: true,
        data: {
          id: request._id,
          downloadUrl,
          completedAt: request.completedAt
        }
      };
    } catch (error) {
      logger.error('Error processing data export:', error);
      throw error;
    }
  }

  /**
   * Process data erasure
   */
  async processDataErasure(requestId, institutionId, updatedBy) {
    try {
      const request = await DataErasureRequest.findOne({
        _id: requestId,
        institution: institutionId,
        status: 'processing'
      });

      if (!request) {
        return {
          success: false,
          message: 'Data erasure request not found or not in processing state'
        };
      }

      // This would typically involve:
      // 1. Identifying all user data across systems
      // 2. Anonymizing or deleting the data
      // 3. Logging the erasure for compliance

      // For now, we'll simulate the process
      request.status = 'completed';
      request.completedAt = new Date();
      request.updatedBy = updatedBy;
      await request.save();

      logger.info(`Data erasure completed for request: ${request._id} by: ${updatedBy}`);
      
      return {
        success: true,
        data: {
          id: request._id,
          status: request.status,
          completedAt: request.completedAt
        }
      };
    } catch (error) {
      logger.error('Error processing data erasure:', error);
      throw error;
    }
  }
}

module.exports = new DsrService();