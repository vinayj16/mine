/**
 * Multi-Tenant Middleware
 * Enforces tenant isolation for SaaS deployments
 * Ensures users can only access data from their own institution/tenant
 */

import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import logger from '../utils/logger.js';

/**
 * Extract tenant ID from various sources
 * Priority: req.user.institutionId > req.params.tenantId > req.query.tenantId > req.headers['x-tenant-id']
 */
export const extractTenantId = (req) => {
  // Priority 1: From authenticated user
  if (req.user?.institutionId) {
    return req.user.institutionId.toString();
  }

  // Priority 2: From route parameters
  if (req.params?.tenantId) {
    return req.params.tenantId;
  }

  // Priority 3: From query parameters
  if (req.query?.tenantId) {
    return req.query.tenantId;
  }

  // Priority 4: From headers (for API clients)
  if (req.headers?.['x-tenant-id']) {
    return req.headers['x-tenant-id'];
  }

  // Priority 5: From subdomain (future implementation)
  if (req.subdomain) {
    // This would require domain mapping logic
    return null;
  }

  return null;
};

/**
 * Validate tenant access for authenticated users
 * Ensures users can only access resources from their own tenant
 */
export const validateTenantAccess = async (req, res, next) => {
  try {
    const tenantId = extractTenantId(req);

    // Skip validation for super admin users
    if (req.user?.role === 'superadmin') {
      req.tenantId = tenantId;
      return next();
    }

    // Handle both institutionId and institution fields
    const userTenantId = req.user?.institutionId || req.user?.institution;
    
    // For authenticated users, ensure they belong to the requested tenant
    if (userTenantId) {
      const userTenantIdStr = userTenantId.toString();

      // If a specific tenant is requested, validate access
      if (tenantId && tenantId !== userTenantIdStr) {
        logger.warn(`Tenant access violation: User ${req.user.id} (${userTenantIdStr}) attempted to access tenant ${tenantId}`);
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_ACCESS_DENIED',
            message: 'Access to this tenant is not allowed'
          }
        });
      }

      // Set the tenant ID for this request
      req.tenantId = userTenantIdStr;
      req.user.institutionId = userTenantIdStr; // Ensure institutionId is set for downstream use
    } else {
      // For unauthenticated requests, require explicit tenant specification
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TENANT_ID_REQUIRED',
            message: 'Tenant ID is required for this request'
          }
        });
      }

      // Validate that the tenant exists and is active
      const tenant = await Institution.findById(tenantId).select('status name');
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found'
          }
        });
      }

      if (tenant.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_INACTIVE',
            message: 'Tenant is not active'
          }
        });
      }

      req.tenantId = tenantId;
    }

    logger.debug(`Tenant access validated: ${req.tenantId} for user ${req.user?.id || 'anonymous'}`);
    next();

  } catch (error) {
    logger.error('Tenant validation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TENANT_VALIDATION_ERROR',
        message: 'Error validating tenant access'
      }
    });
  }
};

/**
 * Enforce tenant isolation on database queries
 * Automatically adds tenant filter to queries
 */
export const enforceTenantIsolation = (modelName, tenantField = 'institutionId') => {
  return (req, res, next) => {
    // Store original query methods
    const originalFind = req.db?.[modelName]?.find;
    const originalFindOne = req.db?.[modelName]?.findOne;
    const originalFindById = req.db?.[modelName]?.findById;
    const originalCountDocuments = req.db?.[modelName]?.countDocuments;

    if (!req.tenantQueries) {
      req.tenantQueries = {};
    }

    // Override query methods to include tenant filter
    req.tenantQueries[modelName] = {
      find: (conditions = {}) => {
        const tenantFilter = { [tenantField]: req.tenantId };
        return originalFind ? originalFind({ ...conditions, ...tenantFilter }) : null;
      },

      findOne: (conditions = {}) => {
        const tenantFilter = { [tenantField]: req.tenantId };
        return originalFindOne ? originalFindOne({ ...conditions, ...tenantFilter }) : null;
      },

      findById: (id) => {
        // First find the document, then check tenant ownership
        return originalFindById ? originalFindById(id).then(doc => {
          if (doc && doc[tenantField]?.toString() !== req.tenantId) {
            throw new Error('Document belongs to different tenant');
          }
          return doc;
        }) : null;
      },

      countDocuments: (conditions = {}) => {
        const tenantFilter = { [tenantField]: req.tenantId };
        return originalCountDocuments ? originalCountDocuments({ ...conditions, ...tenantFilter }) : 0;
      }
    };

    next();
  };
};

/**
 * Inject tenant ID into request body for data creation
 */
export const injectTenantId = (tenantField = 'institutionId') => {
  return (req, res, next) => {
    if (req.tenantId && req.body && typeof req.body === 'object') {
      // Don't override if already set
      if (!req.body[tenantField]) {
        req.body[tenantField] = req.tenantId;
      }
    }

    // Also inject into nested objects (like user creation)
    if (req.body?.user && typeof req.body.user === 'object') {
      if (!req.body.user[tenantField]) {
        req.body.user[tenantField] = req.tenantId;
      }
    }

    next();
  };
};

/**
 * Validate tenant subscription and limits
 */
export const validateTenantLimits = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return next(); // Skip if no tenant context
    }

    // Skip for super admin
    if (req.user?.role === 'superadmin') {
      return next();
    }

    // Get tenant information
    const tenant = await Institution.findById(req.tenantId)
      .populate('subscription', 'plan limits features')
      .select('subscription status features');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'Tenant not found'
        }
      });
    }

    // Check if tenant is active
    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_INACTIVE',
          message: 'Tenant account is inactive'
        }
      });
    }

    // Store tenant info in request for use by other middleware/controllers
    req.tenant = {
      id: tenant._id,
      status: tenant.status,
      subscription: tenant.subscription,
      features: tenant.features || []
    };

    // Check subscription limits if needed
    if (tenant.subscription?.limits) {
      req.tenantLimits = tenant.subscription.limits;
    }

    logger.debug(`Tenant validated: ${req.tenantId}, status: ${tenant.status}`);
    next();

  } catch (error) {
    logger.error('Tenant limits validation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TENANT_VALIDATION_ERROR',
        message: 'Error validating tenant limits'
      }
    });
  }
};

/**
 * Tenant-aware caching middleware
 * Ensures cache keys include tenant context
 */
export const tenantAwareCache = (cacheService) => {
  return (req, res, next) => {
    if (!req.tenantId) {
      return next();
    }

    // Override cache methods to include tenant prefix
    const originalGet = cacheService.get.bind(cacheService);
    const originalSet = cacheService.set.bind(cacheService);
    const originalDelete = cacheService.delete.bind(cacheService);

    req.tenantCache = {
      get: (key) => originalGet(`tenant:${req.tenantId}:${key}`),
      set: (key, value, ttl) => originalSet(`tenant:${req.tenantId}:${key}`, value, ttl),
      delete: (key) => originalDelete(`tenant:${req.tenantId}:${key}`)
    };

    next();
  };
};

/**
 * Multi-tenant file storage middleware
 * Ensures files are stored in tenant-specific directories
 */
export const tenantFileStorage = (uploadPath = 'uploads') => {
  return (req, res, next) => {
    if (req.tenantId) {
      // Modify file destination to include tenant directory
      req.tenantUploadPath = `${uploadPath}/${req.tenantId}`;

      // Ensure tenant directory exists
      const tenantDir = path.join(process.cwd(), req.tenantUploadPath);
      if (!fs.existsSync(tenantDir)) {
        fs.mkdirSync(tenantDir, { recursive: true });
      }
    }

    next();
  };
};

/**
 * Cross-tenant data access prevention
 * Prevents users from accessing data from other tenants
 */
export const preventCrossTenantAccess = (req, res, next) => {
  // Add tenant filter to all database operations
  req.tenantFilter = { institutionId: req.tenantId };

  // Override common query methods to include tenant filter
  const originalJson = res.json;
  res.json = function(data) {
    // If data contains documents, filter by tenant
    if (Array.isArray(data)) {
      data = data.filter(item =>
        !item.institutionId || item.institutionId.toString() === req.tenantId
      );
    } else if (data && typeof data === 'object' && data.institutionId) {
      if (data.institutionId.toString() !== req.tenantId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'CROSS_TENANT_ACCESS_DENIED',
            message: 'Access to data from other tenants is not allowed'
          }
        });
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Tenant context logging middleware
 */
export const tenantLogging = (req, res, next) => {
  // Add tenant context to request for logging
  req.tenantContext = {
    tenantId: req.tenantId,
    userId: req.user?.id,
    userRole: req.user?.role,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  logger.debug('Tenant context established', req.tenantContext);
  next();
};

/**
 * Admin-only tenant management middleware
 */
export const requireTenantAdmin = (req, res, next) => {
  // Allow super admin or tenant admin
  if (req.user?.role === 'superadmin' ||
      (req.user?.role === 'admin' && req.user?.institutionId?.toString() === req.tenantId)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: {
      code: 'TENANT_ADMIN_REQUIRED',
      message: 'Tenant administrator access required'
    }
  });
};

export default {
  extractTenantId,
  validateTenantAccess,
  enforceTenantIsolation,
  injectTenantId,
  validateTenantLimits,
  tenantAwareCache,
  tenantFileStorage,
  preventCrossTenantAccess,
  tenantLogging,
  requireTenantAdmin
};

export const optionalTenantAccess = async (req, res, next) => {
  try {
    const tenantId = extractTenantId(req);

    // If no user, try to get a default tenant or skip validation
    if (!req.user) {
      // If tenant ID is provided, validate it exists
      if (tenantId) {
        const tenant = await Institution.findById(tenantId).select('status name');
        if (!tenant) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'TENANT_NOT_FOUND',
              message: 'Tenant not found'
            }
          });
        }
        if (tenant.status !== 'active') {
          return res.status(403).json({
            success: false,
            error: {
              code: 'TENANT_INACTIVE',
              message: 'Tenant is not active'
            }
          });
        }
        req.tenantId = tenantId;
      }
      // If no tenant ID, continue without tenant validation
      return next();
    }

    // Skip validation for super admin users
    if (req.user?.role === 'superadmin') {
      req.tenantId = tenantId || req.user.institutionId?.toString();
      return next();
    }

    // For authenticated users
    if (req.user?.institutionId) {
      const userTenantId = req.user.institutionId.toString();

      if (tenantId && tenantId !== userTenantId) {
        logger.warn(`Tenant access violation: User ${req.user.id} attempted to access tenant ${tenantId}`);
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_ACCESS_DENIED',
            message: 'Access to this tenant is not allowed'
          }
        });
      }

      req.tenantId = userTenantId;
    } else {
      req.tenantId = tenantId;
    }

    next();
  } catch (error) {
    logger.error('Optional tenant validation error:', error);
    next();
  }
};
