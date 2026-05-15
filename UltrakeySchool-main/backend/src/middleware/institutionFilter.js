/**
 * Institution Filter Middleware
 * Ensures all data queries are filtered by institution
 * Provides institution context to all responses
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Add institution filter to all database queries
 */
export const addInstitutionFilter = (req, res, next) => {
  try {
    // Skip for super admin users (they can see all data)
    if (req.user?.role === 'superadmin') {
      return next();
    }

    // Get institution ID from user context
    const institutionId = req.user?.institutionId || req.user?.institution || req.tenantId;
    
    if (!institutionId) {
      logger.warn('No institution context found for request:', {
        userId: req.user?.id,
        path: req.path,
        method: req.method
      });
      return next();
    }

    // Store institution filter for use in controllers
    req.institutionFilter = { institutionId };
    req.institutionId = institutionId;

    // Override common query methods to include institution filter
    const originalJson = res.json;
    res.json = function(data) {
      // Add institution context to successful responses
      if (data && typeof data === 'object') {
        // Add institution metadata to response
        if (data.success !== false) {
          data.institutionContext = {
            institutionId: institutionId,
            institutionCode: req.user?.institutionData?.instituteCode || 'UNKNOWN',
            institutionName: req.user?.institutionData?.name || 'Unknown Institution',
            filtered: true,
            timestamp: new Date().toISOString()
          };
        }

        // Filter arrays to ensure institution isolation
        if (Array.isArray(data.data)) {
          data.data = data.data.filter(item => {
            if (!item.institutionId) return true; // Items without institutionId are public
            return item.institutionId.toString() === institutionId.toString();
          });
        } else if (data.data && typeof data.data === 'object' && data.data.institutionId) {
          // Check single object belongs to institution
          if (data.data.institutionId.toString() !== institutionId.toString()) {
            return originalJson.call(this, {
              success: false,
              error: {
                code: 'INSTITUTION_ACCESS_DENIED',
                message: 'Data does not belong to your institution'
              }
            });
          }
        }
      }

      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('Error in institution filter middleware:', error);
    next();
  }
};

/**
 * Validate institution access for specific resources
 */
export const validateInstitutionAccess = (resourceIdField = 'institutionId') => {
  return (req, res, next) => {
    try {
      // Skip for super admin users
      if (req.user?.role === 'superadmin') {
        return next();
      }

      const userInstitutionId = req.user?.institutionId || req.user?.institution || req.tenantId;
      const resourceInstitutionId = req.params[resourceIdField] || req.body[resourceIdField] || req.query[resourceIdField];

      if (!userInstitutionId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSTITUTION_CONTEXT_MISSING',
            message: 'Institution context is required'
          }
        });
      }

      // If accessing specific resource, validate it belongs to user's institution
      if (resourceInstitutionId && resourceInstitutionId !== userInstitutionId.toString()) {
        logger.warn('Cross-institution access attempt:', {
          userId: req.user.id,
          userInstitution: userInstitutionId,
          targetInstitution: resourceInstitutionId,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          error: {
            code: 'CROSS_INSTITUTION_ACCESS_DENIED',
            message: 'You can only access resources from your own institution'
          }
        });
      }

      // Add institution filter to request body for create/update operations
      if (req.body && typeof req.body === 'object') {
        if (!req.body[resourceIdField]) {
          req.body[resourceIdField] = userInstitutionId;
        }
      }

      next();
    } catch (error) {
      logger.error('Error validating institution access:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INSTITUTION_VALIDATION_ERROR',
          message: 'Error validating institution access'
        }
      });
    }
  };
};

/**
 * Institution-aware query builder
 */
export const buildInstitutionQuery = (req, additionalFilters = {}) => {
  const institutionId = req.user?.institutionId || req.user?.institution || req.tenantId;
  
  if (!institutionId) {
    return additionalFilters;
  }

  return {
    institutionId: institutionId,
    ...additionalFilters
  };
};

/**
 * Add institution headers to response
 */
export const addInstitutionHeaders = (req, res, next) => {
  try {
    const institutionData = req.user?.institutionData;
    
    if (institutionData) {
      res.setHeader('X-Institution-Id', institutionData.id);
      res.setHeader('X-Institution-Code', institutionData.instituteCode);
      res.setHeader('X-Institution-Name', institutionData.name);
      res.setHeader('X-Institution-Type', institutionData.type);
    }

    next();
  } catch (error) {
    logger.error('Error adding institution headers:', error);
    next();
  }
};

/**
 * Institution isolation middleware for WebSocket connections
 */
export const institutionSocketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const user = socket.handshake.auth.user;

    if (!user || !user.institutionId) {
      return next(new Error('Institution context required for WebSocket connection'));
    }

    // Add institution context to socket
    socket.institutionId = user.institutionId;
    socket.institutionData = user.institutionData;

    // Join institution-specific room
    socket.join(`institution:${user.institutionId}`);

    next();
  } catch (error) {
    logger.error('WebSocket institution auth error:', error);
    next(new Error('Institution authentication failed'));
  }
};

export default {
  addInstitutionFilter,
  validateInstitutionAccess,
  buildInstitutionQuery,
  addInstitutionHeaders,
  institutionSocketAuth
};
