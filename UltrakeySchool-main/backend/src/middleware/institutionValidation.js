/**
 * Institution Validation Middleware
 * Ensures complete institution isolation across all endpoints
 */

import Institution from '../models/Institution.js';
import logger from '../utils/logger.js';

/**
 * Validate institution exists and is active
 */
export const validateInstitution = async (req, res, next) => {
  try {
    const institutionId = req.user?.institutionId || req.user?.institution || req.tenantId;
    
    if (!institutionId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSTITUTION_REQUIRED',
          message: 'Institution context is required'
        }
      });
    }

    // Skip for super admin
    if (req.user?.role === 'superadmin') {
      return next();
    }

    const institution = await Institution.findById(institutionId)
      .select('id name instituteCode type status')
      .lean();

    if (!institution) {
      logger.warn(`Institution not found: ${institutionId} for user: ${req.user?.id}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSTITUTION_NOT_FOUND',
          message: 'Institution not found'
        }
      });
    }

    if (institution.status !== 'active') {
      logger.warn(`Inactive institution access attempt: ${institutionId} by user: ${req.user?.id}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSTITUTION_INACTIVE',
          message: 'Your institution account is not active'
        }
      });
    }

    // Add institution to request for use in controllers
    req.institution = institution;
    req.institutionId = institutionId;

    next();
  } catch (error) {
    logger.error('Error validating institution:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INSTITUTION_VALIDATION_ERROR',
        message: 'Error validating institution'
      }
    });
  }
};

/**
 * Ensure user belongs to specified institution
 */
export const validateUserInstitutionAccess = (req, res, next) => {
  try {
    const userInstitutionId = req.user?.institutionId || req.user?.institution;
    const targetInstitutionId = req.params.institutionId || req.body.institutionId || req.query.institutionId;

    // Skip for super admin
    if (req.user?.role === 'superadmin') {
      return next();
    }

    if (targetInstitutionId && targetInstitutionId !== userInstitutionId) {
      logger.warn(`Cross-institution access attempt: User ${req.user?.id} (${userInstitutionId}) -> ${targetInstitutionId}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'CROSS_INSTITUTION_ACCESS_DENIED',
          message: 'You can only access resources from your own institution'
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Error validating user institution access:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INSTITUTION_ACCESS_VALIDATION_ERROR',
        message: 'Error validating institution access'
      }
    });
  }
};

/**
 * Filter data by institution for responses
 */
export const filterByInstitution = (req, res, next) => {
  try {
    const originalJson = res.json;
    
    res.json = function(data) {
      if (!data || typeof data !== 'object') {
        return originalJson.call(this, data);
      }

      // Skip filtering for super admin
      if (req.user?.role === 'superadmin') {
        return originalJson.call(this, data);
      }

      const institutionId = req.user?.institutionId || req.user?.institution || req.tenantId;
      
      if (!institutionId) {
        return originalJson.call(this, data);
      }

      // Add institution context to response
      if (data.success !== false) {
        data.institutionContext = {
          institutionId,
          filtered: true,
          timestamp: new Date().toISOString()
        };
      }

      // Filter arrays by institution
      if (Array.isArray(data.data)) {
        data.data = data.data.filter(item => {
          if (!item.institutionId) return true; // Public items
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

      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('Error setting up institution filter:', error);
    next();
  }
};

/**
 * Add institution headers to responses
 */
export const addInstitutionHeaders = (req, res, next) => {
  try {
    const institution = req.institution;
    
    if (institution) {
      res.setHeader('X-Institution-Id', institution.id);
      res.setHeader('X-Institution-Code', institution.instituteCode);
      res.setHeader('X-Institution-Name', institution.name);
      res.setHeader('X-Institution-Type', institution.type);
      res.setHeader('X-Institution-Status', institution.status);
    }

    next();
  } catch (error) {
    logger.error('Error adding institution headers:', error);
    next();
  }
};

/**
 * Validate institution type for specific features
 */
export const validateInstitutionType = (allowedTypes) => {
  return (req, res, next) => {
    try {
      const institutionType = req.institution?.type;
      
      if (!institutionType) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSTITUTION_TYPE_REQUIRED',
            message: 'Institution type is required'
          }
        });
      }

      if (!allowedTypes.includes(institutionType.toLowerCase())) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSTITUTION_TYPE_NOT_ALLOWED',
            message: `This feature is not available for ${institutionType} institutions`
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Error validating institution type:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INSTITUTION_TYPE_VALIDATION_ERROR',
          message: 'Error validating institution type'
        }
      });
    }
  };
};

export default {
  validateInstitution,
  validateUserInstitutionAccess,
  filterByInstitution,
  addInstitutionHeaders,
  validateInstitutionType
};
