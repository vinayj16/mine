import mongoose from 'mongoose';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// API Key Schema
const apiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  keyHash: {
    type: String,
    required: false,
    unique: true,
    index: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  permissions: [{
    type: String,
    enum: [
      // User management
      'users.read', 'users.write', 'users.delete',
      // Student management
      'students.read', 'students.write', 'students.delete',
      // Teacher management
      'teachers.read', 'teachers.write', 'teachers.delete',
      // Attendance
      'attendance.read', 'attendance.write',
      // Grades
      'grades.read', 'grades.write',
      // Classes
      'classes.read', 'classes.write',
      // Reports
      'reports.read', 'reports.generate',
      // Settings
      'settings.read', 'settings.write',
      // All permissions
      '*'
    ]
  }],
  scopes: [{
    type: String,
    enum: ['read', 'write', 'admin'],
    default: ['read']
  }],
  rateLimit: {
    requests: {
      type: Number,
      default: 1000,
      min: 1
    },
    windowMs: {
      type: Number,
      default: 15 * 60 * 1000, // 15 minutes
      min: 1000
    }
  },
  ipWhitelist: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(v);
      },
      message: 'Invalid IP address format'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'expired'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    default: null
  },
  lastUsed: {
    type: Date,
    default: null
  },
  usage: {
    requests: {
      type: Number,
      default: 0
    },
    lastRequestAt: {
      type: Date,
      default: null
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
apiKeySchema.index({ owner: 1 });
apiKeySchema.index({ institution: 1 });
apiKeySchema.index({ status: 1 });
apiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
apiKeySchema.index({ 'usage.lastRequestAt': 1 });

// Pre-save middleware to hash the API key
apiKeySchema.pre('save', function(next) {
  if (this.isModified('key') && !this.keyHash) {
    this.keyHash = crypto.createHash('sha256').update(this.key).digest('hex');
  }
  next();
});

// Instance methods
apiKeySchema.methods = {
  // Verify API key
  verifyKey(providedKey) {
    const hashedKey = crypto.createHash('sha256').update(providedKey).digest('hex');
    return this.keyHash === hashedKey;
  },

  // Check if key has permission
  hasPermission(permission) {
    if (this.permissions.includes('*')) return true;
    return this.permissions.includes(permission);
  },

  // Check if key is expired
  isExpired() {
    return this.expiresAt && new Date() > this.expiresAt;
  },

  // Check if IP is whitelisted
  isIpAllowed(ip) {
    if (!this.ipWhitelist || this.ipWhitelist.length === 0) return true;
    return this.ipWhitelist.includes(ip);
  },

  // Update usage statistics
  updateUsage() {
    this.usage.requests += 1;
    this.usage.lastRequestAt = new Date();
    this.lastUsed = new Date();
    return this.save();
  },

  // Revoke API key
  revoke() {
    this.status = 'inactive';
    return this.save();
  },

  // Regenerate API key
  regenerate() {
    const newKey = ApiKey.generateApiKey();
    this.key = newKey;
    this.keyHash = crypto.createHash('sha256').update(newKey).digest('hex');
    this.lastUsed = null;
    this.usage.requests = 0;
    this.usage.lastRequestAt = null;
    return this.save();
  }
};

// Static methods
apiKeySchema.statics = {
  // Generate a new API key
  generateApiKey() {
    return `ak_${crypto.randomBytes(32).toString('hex')}`;
  },

  // Find API key by hash
  findByKeyHash(keyHash) {
    return this.findOne({ keyHash, status: 'active' });
  },

  // Find API keys by owner
  findByOwner(ownerId) {
    return this.find({ owner: ownerId });
  },

  // Find API keys by institution
  findByInstitution(institutionId) {
    return this.find({ institution: institutionId });
  },

  // Clean up expired API keys
  cleanupExpired() {
    return this.updateMany(
      { expiresAt: { $lt: new Date() }, status: 'active' },
      { status: 'expired' }
    );
  }
};

// Create and export the model
const ApiKey = mongoose.model('ApiKey', apiKeySchema);

// API Key Service
class ApiKeyService {
  /**
   * Create a new API key
   */
  async createApiKey(data) {
    try {
      const {
        name,
        description,
        owner,
        institution,
        permissions = ['read'],
        scopes = ['read'],
        rateLimit = {},
        ipWhitelist = [],
        expiresAt = null,
        metadata = {}
      } = data;

      // Generate API key
      const key = ApiKey.generateApiKey();

      // Create API key document
      const apiKey = new ApiKey({
        name,
        description,
        key,
        owner,
        institution,
        permissions,
        scopes,
        rateLimit: {
          requests: rateLimit.requests || 1000,
          windowMs: rateLimit.windowMs || 15 * 60 * 1000
        },
        ipWhitelist,
        expiresAt,
        metadata
      });

      await apiKey.save();

      logger.info(`API key created: ${name} for user ${owner}`);

      return {
        id: apiKey._id,
        name: apiKey.name,
        key: apiKey.key, // Only return the key once during creation
        permissions: apiKey.permissions,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt
      };

    } catch (error) {
      logger.error('API key creation failed:', error);
      throw new Error(`Failed to create API key: ${error.message}`);
    }
  }

  /**
   * Get API key by ID (without exposing the key)
   */
  async getApiKeyById(id, userId) {
    try {
      const apiKey = await ApiKey.findOne({
        _id: id,
        $or: [
          { owner: userId }, // Owner can see their keys
          { 'metadata.createdBy': userId } // If created by someone else
        ]
      }).select('-key -keyHash');

      return apiKey;
    } catch (error) {
      logger.error('Get API key failed:', error);
      throw new Error('Failed to get API key');
    }
  }

  /**
   * List API keys for a user
   */
  async listApiKeys(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status = 'active' } = options;

      const query = {
        $or: [
          { owner: userId },
          { 'metadata.createdBy': userId }
        ]
      };

      if (status !== 'all') {
        query.status = status;
      }

      const skip = (page - 1) * limit;

      const [apiKeys, total] = await Promise.all([
        ApiKey.find(query)
          .select('-key -keyHash')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('owner', 'name email')
          .populate('institution', 'name'),
        ApiKey.countDocuments(query)
      ]);

      return {
        apiKeys,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      logger.error('List API keys failed:', error);
      throw new Error('Failed to list API keys');
    }
  }

  /**
   * Update API key
   */
  async updateApiKey(id, userId, updates) {
    try {
      const allowedUpdates = [
        'name', 'description', 'permissions', 'scopes',
        'rateLimit', 'ipWhitelist', 'expiresAt', 'status'
      ];

      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      const apiKey = await ApiKey.findOneAndUpdate(
        {
          _id: id,
          $or: [
            { owner: userId },
            { 'metadata.createdBy': userId }
          ]
        },
        filteredUpdates,
        { new: true, runValidators: true }
      ).select('-key -keyHash');

      if (!apiKey) {
        throw new Error('API key not found or access denied');
      }

      logger.info(`API key updated: ${id}`);
      return apiKey;

    } catch (error) {
      logger.error('Update API key failed:', error);
      throw new Error(`Failed to update API key: ${error.message}`);
    }
  }

  /**
   * Delete API key
   */
  async deleteApiKey(id, userId) {
    try {
      const apiKey = await ApiKey.findOneAndDelete({
        _id: id,
        $or: [
          { owner: userId },
          { 'metadata.createdBy': userId }
        ]
      });

      if (!apiKey) {
        throw new Error('API key not found or access denied');
      }

      logger.info(`API key deleted: ${id}`);
      return { message: 'API key deleted successfully' };

    } catch (error) {
      logger.error('Delete API key failed:', error);
      throw new Error(`Failed to delete API key: ${error.message}`);
    }
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey(id, userId) {
    try {
      const apiKey = await ApiKey.findOne({
        _id: id,
        $or: [
          { owner: userId },
          { 'metadata.createdBy': userId }
        ]
      });

      if (!apiKey) {
        throw new Error('API key not found or access denied');
      }

      const newKey = apiKey.regenerate();

      logger.info(`API key regenerated: ${id}`);

      return {
        id: apiKey._id,
        name: apiKey.name,
        key: newKey.key, // Return new key
        permissions: apiKey.permissions,
        scopes: apiKey.scopes,
        regeneratedAt: new Date()
      };

    } catch (error) {
      logger.error('Regenerate API key failed:', error);
      throw new Error(`Failed to regenerate API key: ${error.message}`);
    }
  }

  /**
   * Validate API key for requests
   */
  async validateApiKey(providedKey, requiredPermissions = []) {
    try {
      if (!providedKey) {
        return { valid: false, error: 'API key is required' };
      }

      const hashedKey = crypto.createHash('sha256').update(providedKey).digest('hex');
      const apiKey = await ApiKey.findByKeyHash(hashedKey);

      if (!apiKey) {
        return { valid: false, error: 'Invalid API key' };
      }

      // Check if key is active
      if (apiKey.status !== 'active') {
        return { valid: false, error: 'API key is not active' };
      }

      // Check if key is expired
      if (apiKey.isExpired()) {
        apiKey.status = 'expired';
        await apiKey.save();
        return { valid: false, error: 'API key has expired' };
      }

      // Check permissions
      for (const permission of requiredPermissions) {
        if (!apiKey.hasPermission(permission)) {
          return { valid: false, error: `Missing permission: ${permission}` };
        }
      }

      // Update usage
      await apiKey.updateUsage();

      return {
        valid: true,
        apiKey: {
          id: apiKey._id,
          name: apiKey.name,
          owner: apiKey.owner,
          institution: apiKey.institution,
          permissions: apiKey.permissions,
          scopes: apiKey.scopes,
          rateLimit: apiKey.rateLimit
        }
      };

    } catch (error) {
      logger.error('API key validation failed:', error);
      return { valid: false, error: 'API key validation failed' };
    }
  }

  /**
   * Get API key usage statistics
   */
  async getApiKeyStats(id, userId) {
    try {
      const apiKey = await ApiKey.findOne({
        _id: id,
        $or: [
          { owner: userId },
          { 'metadata.createdBy': userId }
        ]
      }).select('name usage lastUsed createdAt expiresAt status');

      if (!apiKey) {
        throw new Error('API key not found or access denied');
      }

      return {
        id: apiKey._id,
        name: apiKey.name,
        status: apiKey.status,
        usage: apiKey.usage,
        lastUsed: apiKey.lastUsed,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
        daysUntilExpiry: apiKey.expiresAt
          ? Math.ceil((apiKey.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
          : null
      };

    } catch (error) {
      logger.error('Get API key stats failed:', error);
      throw new Error('Failed to get API key statistics');
    }
  }

  /**
   * Clean up expired API keys
   */
  async cleanupExpiredKeys() {
    try {
      const result = await ApiKey.cleanupExpired();
      logger.info(`Cleaned up ${result.modifiedCount} expired API keys`);
      return result;
    } catch (error) {
      logger.error('Cleanup expired API keys failed:', error);
      throw error;
    }
  }

  /**
   * Bulk operations for API keys
   */
  async bulkUpdateStatus(ids, userId, status) {
    try {
      const result = await ApiKey.updateMany(
        {
          _id: { $in: ids },
          $or: [
            { owner: userId },
            { 'metadata.createdBy': userId }
          ]
        },
        { status },
        { runValidators: true }
      );

      logger.info(`Bulk updated ${result.modifiedCount} API keys to status: ${status}`);
      return result;

    } catch (error) {
      logger.error('Bulk update API keys failed:', error);
      throw new Error('Failed to bulk update API keys');
    }
  }

  async getApiKeyUsage(id, userId, options = {}) {
    try {
      const apiKey = await ApiKey.findOne({
        _id: id,
        $or: [{ owner: userId }, { 'metadata.createdBy': userId }]
      }).select('usage lastUsed createdAt');

      if (!apiKey) throw new Error('API key not found');

      return {
        id: apiKey._id,
        totalRequests: apiKey.usage.requests,
        lastRequestAt: apiKey.usage.lastRequestAt,
        lastUsed: apiKey.lastUsed
      };
    } catch (error) {
      logger.error('Get API key usage failed:', error);
      throw error;
    }
  }

  async rotateApiKey(id, userId, gracePeriodHours = 24) {
    try {
      const apiKey = await ApiKey.findOne({
        _id: id,
        $or: [{ owner: userId }, { 'metadata.createdBy': userId }]
      });

      if (!apiKey) throw new Error('API key not found');

      const newKey = ApiKey.generateApiKey();
      apiKey.key = newKey;
      apiKey.keyHash = crypto.createHash('sha256').update(newKey).digest('hex');
      apiKey.usage.requests = 0;
      await apiKey.save();

      return { id: apiKey._id, name: apiKey.name, newKey, rotatedAt: new Date() };
    } catch (error) {
      logger.error('Rotate API key failed:', error);
      throw error;
    }
  }

  async bulkRevokeApiKeys(apiKeyIds, userId, reason) {
    try {
      const result = await ApiKey.updateMany(
        { _id: { $in: apiKeyIds }, $or: [{ owner: userId }, { 'metadata.createdBy': userId }] },
        { status: 'inactive', 'metadata.revokeReason': reason }
      );

      return { revoked: result.modifiedCount, reason };
    } catch (error) {
      logger.error('Bulk revoke API keys failed:', error);
      throw error;
    }
  }

  async getApiKeyAuditLog(id, userId, options = {}) {
    try {
      const apiKey = await ApiKey.findOne({
        _id: id,
        $or: [{ owner: userId }, { 'metadata.createdBy': userId }]
      });

      if (!apiKey) throw new Error('API key not found');

      return {
        logs: [{ action: 'created', timestamp: apiKey.createdAt }],
        pagination: { page: 1, limit: 20, total: 1 }
      };
    } catch (error) {
      logger.error('Get API key audit log failed:', error);
      throw error;
    }
  }

  async testApiKey(providedKey) {
    try {
      const validation = await this.validateApiKey(providedKey);
      return { valid: validation.valid, error: validation.error };
    } catch (error) {
      logger.error('Test API key failed:', error);
      throw error;
    }
  }

  async getApiKeyStatistics(userId, options = {}) {
    try {
      const query = { $or: [{ owner: userId }, { 'metadata.createdBy': userId }] };
      const [total, active] = await Promise.all([
        ApiKey.countDocuments(query),
        ApiKey.countDocuments({ ...query, status: 'active' })
      ]);

      return { total, active, inactive: total - active };
    } catch (error) {
      logger.error('Get API key statistics failed:', error);
      throw error;
    }
  }
}

export default new ApiKeyService();
export { ApiKey };
