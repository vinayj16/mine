/**
 * Multi-tenant Middleware
 * Provides tenant isolation for multi-institution deployments
 */

import mongoose from 'mongoose';
import { forbiddenResponse, unauthorizedResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Extract tenant ID from various sources
 * Priority: params > body > header > token
 */
export const extractTenantId = (req) => {
  // From URL params
  if (req.params.institutionId) {
    return req.params.institutionId;
  }
  
  // From body
  if (req.body.institution) {
    return req.body.institution;
  }
  
  // From header
  if (req.headers['x-institution-id']) {
    return req.headers['x-institution-id'];
  }
  
  // From authenticated user
  if (req.user && req.user.institution) {
    return req.user.institution;
  }
  
  return null;
};

/**
 * Add tenant filter to query
 * @param {Object} query - Mongoose query
 * @param {string} tenantId - Tenant ID
 * @param {string} field - Field name (default: institution)
 */
export const addTenantFilter = (query, tenantId, field = 'institution') => {
  if (!tenantId) {
    return query;
  }
  
  // Handle string or ObjectId
  const tenantValue = mongoose.Types.ObjectId.isValid(tenantId) 
    ? new mongoose.Types.ObjectId(tenantId) 
    : tenantId;
  
  return query.where(field, tenantValue);
};

/**
 * Tenant middleware - ensures tenant isolation
 */
export const tenantMiddleware = (req, res, next) => {
  try {
    // Skip for super admin
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }
    
    const tenantId = extractTenantId(req);
    
    if (!tenantId && req.user) {
      // For authenticated users, use their institution
      if (req.user.institution) {
        req.tenantId = req.user.institution;
      }
    } else {
      req.tenantId = tenantId;
    }
    
    logger.debug('Tenant identified', { 
      tenantId: req.tenantId, 
      userId: req.user?.id,
      path: req.path 
    });
    
    next();
  } catch (error) {
    logger.error('Tenant middleware error:', error);
    return forbiddenResponse(res, 'Tenant identification failed');
  }
};

/**
 * Require tenant context
 */
export const requireTenant = (req, res, next) => {
  if (!req.tenantId && (!req.user || !req.user.institution)) {
    return forbiddenResponse(res, 'Institution context required');
  }
  next();
};

/**
 * Filter query by tenant
 */
export const filterByTenant = (model) => {
  return async (req, res, next) => {
    try {
      // Skip for super admin
      if (req.user && req.user.role === 'super_admin') {
        return next();
      }
      
      const tenantId = req.tenantId || (req.user && req.user.institution);
      
      if (tenantId && model) {
        const tenantValue = mongoose.Types.ObjectId.isValid(tenantId) 
          ? new mongoose.Types.ObjectId(tenantId) 
          : tenantId;
        
        req.tenantQuery = { institution: tenantValue };
      }
      
      next();
    } catch (error) {
      logger.error('Filter by tenant error:', error);
      next(error);
    }
  };
};

/**
 * Validate tenant access
 * Ensures user can only access their institution's data
 */
export const validateTenantAccess = (req, res, next) => {
  try {
    // Skip for super admin
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }
    
    const requestedTenantId = extractTenantId(req);
    const userTenantId = req.user && req.user.institution;
    
    // If no specific tenant requested, use user's tenant
    if (!requestedTenantId) {
      return next();
    }
    
    // Convert to string for comparison
    const requested = requestedTenantId.toString();
    const userTenant = userTenantId ? userTenantId.toString() : null;
    
    // Check if user has access to requested tenant
    if (userTenant && requested !== userTenant) {
      logger.warn('Tenant access denied', {
        userId: req.user?.id,
        userTenant,
        requestedTenant: requested,
        path: req.path
      });
      return forbiddenResponse(res, 'You do not have access to this institution');
    }
    
    next();
  } catch (error) {
    logger.error('Validate tenant access error:', error);
    return forbiddenResponse(res, 'Tenant access validation failed');
  }
};

/**
 * Add tenant to create operations
 */
export const addTenantToBody = (req, res, next) => {
  try {
    // Skip for super admin
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }
    
    // Add institution to body if not present
    if (req.body && !req.body.institution) {
      const tenantId = req.tenantId || (req.user && req.user.institution);
      if (tenantId) {
        req.body.institution = tenantId;
      }
    }
    
    next();
  } catch (error) {
    logger.error('Add tenant to body error:', error);
    next(error);
  }
};

/**
 * Inject tenant context to queries
 * Use this middleware to automatically add tenant filter to all queries
 */
export const tenantQueryMiddleware = (schema) => {
  schema.pre('find', function() {
    // Skip for super admin
    if (this.op === 'find' && this.getQuery()._superAdmin !== true) {
      // Add tenant filter if available
      // This is handled at the route level for more control
    }
  });
};

/**
 * Get tenant-specific collection name
 * Useful for multi-database setups
 */
export const getTenantCollectionName = (baseName, tenantId) => {
  if (!tenantId) {
    return baseName;
  }
  return `${baseName}_${tenantId}`;
};

/**
 * Sanitize tenant ID
 */
export const sanitizeTenantId = (tenantId) => {
  if (!tenantId) {
    return null;
  }
  
  // If it's a valid ObjectId string, convert to ObjectId
  if (mongoose.Types.ObjectId.isValid(tenantId)) {
    return new mongoose.Types.ObjectId(tenantId);
  }
  
  return tenantId;
};

export default {
  extractTenantId,
  addTenantFilter,
  tenantMiddleware,
  requireTenant,
  filterByTenant,
  validateTenantAccess,
  addTenantToBody,
  tenantQueryMiddleware,
  getTenantCollectionName,
  sanitizeTenantId
};
