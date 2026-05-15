import User from '../models/User.js';
import Institution from '../models/Institution.js';
import logger from '../utils/logger.js';

/**
 * Middleware to ensure users can only access data from their own institution
 */
export const enforceInstitutionIsolation = async (req, res, next) => {
  try {
    // Get user from request (should be set by auth middleware)
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Superadmins can access all institutions
    if (user.role === 'superadmin' || user.role === 'super_admin') {
      return next();
    }

    // Get user's institution ID
    const userInstitutionId = user.institutionId;
    
    if (!userInstitutionId) {
      return res.status(403).json({
        success: false,
        message: 'User is not associated with any institution'
      });
    }

    // Add institution filter to query parameters
    req.institutionFilter = { institutionId: userInstitutionId };
    
    // For routes that use schoolId parameter, ensure it matches user's institution
    if (req.params.schoolId && req.params.schoolId !== userInstitutionId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Cannot access data from other institutions'
      });
    }

    // For routes that use institutionId parameter, ensure it matches user's institution
    if (req.params.institutionId && req.params.institutionId !== userInstitutionId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Cannot access data from other institutions'
      });
    }

    // Add institution ID to request for easy access
    req.userInstitutionId = userInstitutionId;

    next();
  } catch (error) {
    logger.error('Error in institution isolation middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to filter queries by institution
 */
export const addInstitutionFilter = (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return next();
    }

    // Superadmins can access all institutions
    if (user.role === 'superadmin' || user.role === 'super_admin') {
      return next();
    }

    const userInstitutionId = user.institutionId;
    
    if (!userInstitutionId) {
      return next();
    }

    // Add institution filter to the request
    req.institutionFilter = { institutionId: userInstitutionId };
    req.userInstitutionId = userInstitutionId;

    next();
  } catch (error) {
    logger.error('Error adding institution filter:', error);
    next();
  }
};

/**
 * Middleware to validate institution access for specific operations
 */
export const validateInstitutionAccess = async (req, res, next) => {
  try {
    const user = req.user;
    const { institutionId } = req.body;
    const { institutionId: paramInstitutionId } = req.params;

    // Superadmins can access all institutions
    if (user.role === 'superadmin' || user.role === 'super_admin') {
      return next();
    }

    const userInstitutionId = user.institutionId;
    
    if (!userInstitutionId) {
      return res.status(403).json({
        success: false,
        message: 'User is not associated with any institution'
      });
    }

    // Check body institutionId
    if (institutionId && institutionId !== userInstitutionId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Cannot perform operations on other institutions'
      });
    }

    // Check parameter institutionId
    if (paramInstitutionId && paramInstitutionId !== userInstitutionId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Cannot access data from other institutions'
      });
    }

    // Auto-add institutionId to request body if not present
    if (!req.body.institutionId && userInstitutionId) {
      req.body.institutionId = userInstitutionId;
    }

    next();
  } catch (error) {
    logger.error('Error validating institution access:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Helper function to apply institution filter to queries
 */
export const applyInstitutionFilter = (query, req) => {
  if (req.institutionFilter) {
    return { ...query, ...req.institutionFilter };
  }
  return query;
};

/**
 * Middleware to ensure communication is within institution
 */
export const enforceInstitutionCommunication = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Superadmins can communicate with all
    if (user.role === 'superadmin' || user.role === 'super_admin') {
      return next();
    }

    const userInstitutionId = user.institutionId;
    
    if (!userInstitutionId) {
      return res.status(403).json({
        success: false,
        message: 'User is not associated with any institution'
      });
    }

    // For communication endpoints, validate recipient is in same institution
    const { recipientId, recipientEmail } = req.body;
    
    if (recipientId) {
      const recipient = await User.findById(recipientId);
      if (!recipient || recipient.institutionId.toString() !== userInstitutionId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Cannot communicate with users from other institutions'
        });
      }
    }

    if (recipientEmail) {
      const recipient = await User.findOne({ email: recipientEmail.toLowerCase() });
      if (!recipient || recipient.institutionId.toString() !== userInstitutionId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Cannot communicate with users from other institutions'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Error enforcing institution communication:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
