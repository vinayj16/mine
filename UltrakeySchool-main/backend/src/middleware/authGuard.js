import { verifyAccessToken, extractToken } from '../services/tokenService.js';
import { errorResponse } from '../utils/apiResponse.js';
import { resolveAuthenticatedUser, attachUserToRequest } from '../utils/resolveAuthUser.js';
import logger from '../utils/logger.js';

// All available roles in system (matches FRONTEND documentation exactly)
export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  INSTITUTION_ADMIN: 'institution_admin',
  ADMIN: 'admin',
  PRINCIPAL: 'principal',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
  ACCOUNTANT: 'accountant',
  HR_MANAGER: 'hr_manager',
  LIBRARIAN: 'librarian',
  TRANSPORT_MANAGER: 'transport_manager',
  HOSTEL_WARDEN: 'hostel_warden',
  STAFF_MEMBER: 'staff_member',
  AGENT: 'agent'
};

// Main authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return errorResponse(res, 'Authorization header is required', 401);
    }

    const token = extractToken(authHeader);
    
    if (!token) {
      return errorResponse(res, 'Token is required', 401);
    }

    const decoded = verifyAccessToken(token);
    const user = await resolveAuthenticatedUser(decoded);

    if (!user) {
      return errorResponse(res, 'User not found', 401);
    }

    if (user.status !== 'active' && user.isActive !== true) {
      return errorResponse(res, 'User account is deactivated', 401);
    }

    attachUserToRequest(req, user, decoded);
    req.token = token;
    
    logger.info('User authenticated successfully', { 
      userId: req.user.id, 
      role: req.user.role,
      ip: req.ip 
    });
    
    next();
  } catch (error) {
    logger.error('Authentication error:', { 
      error: error.message, 
      stack: error.stack,
      ip: req.ip 
    });
    
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token has expired', 401);
    } else if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401);
    } else {
      return errorResponse(res, 'Authentication failed', 401);
    }
  }
};

// Role normalization map - handles role name variations
const ROLE_NORMALIZATION = {
  'superadmin': 'super_admin',
  'super-admin': 'super_admin',
  'institutionadmin': 'institution_admin',
  'institution-admin': 'institution_admin',
  'hrmanager': 'hr_manager',
  'hr-manager': 'hr_manager',
  'transportmanager': 'transport_manager',
  'transport-manager': 'transport_manager',
  'hostelwarden': 'hostel_warden',
  'hostel-warden': 'hostel_warden',
  'staffmember': 'staff_member',
  'staff-member': 'staff_member',
  'staff_member': 'staff_member',
  'staff': 'staff',
  'agent': 'agent'
};

// Normalize role name for consistent comparison
const normalizeRole = (role) => {
  if (!role) return role;
  const lowerRole = role.toLowerCase().replace(/[_\s-]+/g, '_');
  return ROLE_NORMALIZATION[lowerRole] || lowerRole;
};

// Role-based authorization middleware
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }

      const userRole = req.user.role;
      const normalizedUserRole = normalizeRole(userRole);
      
      // Normalize allowed roles for comparison
      const normalizedAllowedRoles = allowedRoles.map(role => 
        Array.isArray(role) ? role.map(normalizeRole) : normalizeRole(role)
      ).flat();
      
      if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
        logger.warn('Unauthorized access attempt', {
          userId: req.user.id,
          userRole,
          normalizedUserRole,
          requiredRoles: allowedRoles,
          normalizedRequiredRoles: normalizedAllowedRoles,
          ip: req.ip,
          endpoint: req.path,
          method: req.method
        });
        
        return errorResponse(
          res, 
          'Insufficient permissions', 
          403,
          { 
            required: allowedRoles,
            current: userRole 
          }
        );
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      return errorResponse(res, 'Authorization failed', 500);
    }
  };
};

export default {
  authenticate,
  authorize,
  ROLES
};
