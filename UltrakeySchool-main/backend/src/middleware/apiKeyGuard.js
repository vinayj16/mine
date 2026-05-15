import apiKeyService from '../services/apiKeyService.js';
import { errorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

// Validation constants
const API_KEY_MIN_LENGTH = 32;
const API_KEY_MAX_LENGTH = 128;
const API_KEY_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_REQUESTS_PER_MINUTE = 100;
const MAX_REQUESTS_PER_HOUR = 1000;

// Rate limiting tracking per API key
const rateLimitTracker = new Map();

// Helper function to validate API key format
const validateApiKeyFormat = (apiKey) => {
  const errors = [];
  
  if (!apiKey || typeof apiKey !== 'string') {
    errors.push('API key must be a non-empty string');
    return errors;
  }
  
  const trimmedKey = apiKey.trim();
  
  if (trimmedKey.length < API_KEY_MIN_LENGTH) {
    errors.push('API key must be at least ' + API_KEY_MIN_LENGTH + ' characters');
  }
  
  if (trimmedKey.length > API_KEY_MAX_LENGTH) {
    errors.push('API key must not exceed ' + API_KEY_MAX_LENGTH + ' characters');
  }
  
  if (!API_KEY_PATTERN.test(trimmedKey)) {
    errors.push('API key contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed');
  }
  
  return errors;
};

// Helper function to check rate limits
const checkRateLimit = (apiKey) => {
  const now = Date.now();
  
  if (!rateLimitTracker.has(apiKey)) {
    rateLimitTracker.set(apiKey, {
      minute: { count: 0, resetAt: now + 60000 },
      hour: { count: 0, resetAt: now + 3600000 }
    });
  }
  
  const tracker = rateLimitTracker.get(apiKey);
  
  // Reset minute counter if needed
  if (now >= tracker.minute.resetAt) {
    tracker.minute.count = 0;
    tracker.minute.resetAt = now + 60000;
  }
  
  // Reset hour counter if needed
  if (now >= tracker.hour.resetAt) {
    tracker.hour.count = 0;
    tracker.hour.resetAt = now + 3600000;
  }
  
  // Check limits
  if (tracker.minute.count >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = Math.ceil((tracker.minute.resetAt - now) / 1000);
    return {
      allowed: false,
      reason: 'Rate limit exceeded: ' + MAX_REQUESTS_PER_MINUTE + ' requests per minute',
      retryAfter: waitTime
    };
  }
  
  if (tracker.hour.count >= MAX_REQUESTS_PER_HOUR) {
    const waitTime = Math.ceil((tracker.hour.resetAt - now) / 60000);
    return {
      allowed: false,
      reason: 'Rate limit exceeded: ' + MAX_REQUESTS_PER_HOUR + ' requests per hour',
      retryAfter: waitTime * 60
    };
  }
  
  return { allowed: true };
};

// Helper function to increment rate limit counters
const incrementRateLimit = (apiKey) => {
  if (rateLimitTracker.has(apiKey)) {
    const tracker = rateLimitTracker.get(apiKey);
    tracker.minute.count++;
    tracker.hour.count++;
  }
};

// Helper function to resolve API key from request
const resolveApiKey = (req) => {
  try {
    // Check multiple sources for API key
    const headerKey = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'];
    const queryKey = req.query?.apiKey;
    const bodyKey = req.body?.apiKey;
    
    // Priority: Authorization header (Bearer) > x-api-key header > query > body
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    
    if (headerKey) {
      return headerKey.trim();
    }
    
    if (queryKey) {
      return queryKey.trim();
    }
    
    if (bodyKey) {
      return bodyKey.trim();
    }
    
    return null;
  } catch (error) {
    logger.error('Error resolving API key:', error);
    return null;
  }
};

// Helper function to respond with invalid key error
const respondInvalidKey = (res, message = 'API key missing or invalid', code = 'API_KEY_INVALID', statusCode = 401) => {
  logger.warn('API key validation failed:', { message, code });
  return errorResponse(res, message, statusCode, code);
};

// Helper function to log API key usage
const logApiKeyUsage = (apiKey, req, success = true) => {
  try {
    const logData = {
      apiKeyId: apiKey?._id || apiKey?.id,
      apiKeyName: apiKey?.name,
      userId: apiKey?.userId || apiKey?.user,
      method: req.method,
      path: req.path,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      success,
      timestamp: new Date().toISOString()
    };
    
    if (success) {
      logger.info('API key usage:', logData);
    } else {
      logger.warn('API key usage failed:', logData);
    }
  } catch (error) {
    logger.error('Error logging API key usage:', error);
  }
};

// Helper function to check API key permissions
const checkApiKeyPermissions = (apiKey, req) => {
  try {
    // Check if API key has required permissions for this endpoint
    if (apiKey.permissions && Array.isArray(apiKey.permissions)) {
      // If permissions array is empty or contains '*', allow all
      if (apiKey.permissions.length === 0 || apiKey.permissions.includes('*')) {
        return { allowed: true };
      }
      
      // Check if the request method and path match any permission
      const method = req.method.toLowerCase();
      const path = req.path;
      
      // Check for specific permission patterns
      const hasPermission = apiKey.permissions.some(permission => {
        if (permission === '*') return true;
        
        // Check for method:path pattern
        if (permission.includes(':')) {
          const [permMethod, permPath] = permission.split(':');
          if (permMethod === '*' || permMethod.toLowerCase() === method) {
            if (permPath === '*' || path.startsWith(permPath)) {
              return true;
            }
          }
        }
        
        // Check for path-only pattern
        if (path.startsWith(permission)) {
          return true;
        }
        
        return false;
      });
      
      if (!hasPermission) {
        return {
          allowed: false,
          reason: 'API key does not have permission to access this endpoint'
        };
      }
    }
    
    // Check if API key is restricted to specific IP addresses
    if (apiKey.allowedIPs && Array.isArray(apiKey.allowedIPs) && apiKey.allowedIPs.length > 0) {
      const clientIP = req.ip || req.connection?.remoteAddress;
      if (!apiKey.allowedIPs.includes(clientIP)) {
        return {
          allowed: false,
          reason: 'API key is not authorized from this IP address'
        };
      }
    }
    
    // Check if API key is restricted to specific domains
    if (apiKey.allowedDomains && Array.isArray(apiKey.allowedDomains) && apiKey.allowedDomains.length > 0) {
      const origin = req.headers.origin || req.headers.referer;
      if (origin) {
        const domain = new URL(origin).hostname;
        if (!apiKey.allowedDomains.some(allowed => domain.endsWith(allowed))) {
          return {
            allowed: false,
            reason: 'API key is not authorized from this domain'
          };
        }
      }
    }
    
    return { allowed: true };
  } catch (error) {
    logger.error('Error checking API key permissions:', error);
    return {
      allowed: false,
      reason: 'Error validating API key permissions'
    };
  }
};

/**
 * Middleware to require a valid API key
 */
export const requireApiKey = async (req, res, next) => {
  try {
    logger.info('API key validation required:', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });
    
    const providedKey = resolveApiKey(req);
    
    if (!providedKey) {
      logApiKeyUsage(null, req, false);
      return respondInvalidKey(res, 'API key is required. Provide it via x-api-key header, Authorization Bearer token, or apiKey query parameter', 'API_KEY_REQUIRED');
    }
    
    // Validate API key format
    const formatErrors = validateApiKeyFormat(providedKey);
    if (formatErrors.length > 0) {
      logApiKeyUsage(null, req, false);
      return respondInvalidKey(res, 'Invalid API key format: ' + formatErrors.join(', '), 'API_KEY_INVALID_FORMAT');
    }
    
    // Check rate limits
    const rateLimitCheck = checkRateLimit(providedKey);
    if (!rateLimitCheck.allowed) {
      logApiKeyUsage(null, req, false);
      res.setHeader('Retry-After', rateLimitCheck.retryAfter);
      return respondInvalidKey(res, rateLimitCheck.reason, 'RATE_LIMIT_EXCEEDED', 429);
    }
    
    // Validate API key with service
    const validation = await apiKeyService.validateApiKey(providedKey);
    if (!validation.valid) {
      logApiKeyUsage(null, req, false);
      return respondInvalidKey(res, validation.error || 'Invalid API key', 'API_KEY_INVALID');
    }
    
    // Check API key permissions
    const permissionCheck = checkApiKeyPermissions(validation.apiKey, req);
    if (!permissionCheck.allowed) {
      logApiKeyUsage(validation.apiKey, req, false);
      return respondInvalidKey(res, permissionCheck.reason, 'API_KEY_INSUFFICIENT_PERMISSIONS', 403);
    }
    
    // Increment rate limit counter
    incrementRateLimit(providedKey);
    
    // Attach API key to request
    req.apiKey = validation.apiKey;
    req.apiKeyId = validation.apiKey._id || validation.apiKey.id;
    
    // Log successful usage
    logApiKeyUsage(validation.apiKey, req, true);
    
    logger.info('API key validated successfully:', {
      apiKeyId: req.apiKeyId,
      apiKeyName: validation.apiKey.name
    });
    
    next();
  } catch (error) {
    logger.error('API key validation error:', error);
    return errorResponse(res, 'Unable to validate API key: ' + error.message, 500, 'API_KEY_VALIDATION_ERROR');
  }
};

/**
 * Middleware for optional API key validation
 */
export const optionalApiKey = async (req, res, next) => {
  try {
    logger.info('Optional API key validation:', {
      method: req.method,
      path: req.path
    });
    
    const providedKey = resolveApiKey(req);
    
    if (!providedKey) {
      logger.info('No API key provided, continuing without API key');
      return next();
    }
    
    // Validate API key format
    const formatErrors = validateApiKeyFormat(providedKey);
    if (formatErrors.length > 0) {
      logApiKeyUsage(null, req, false);
      return respondInvalidKey(res, 'Invalid API key format: ' + formatErrors.join(', '), 'API_KEY_INVALID_FORMAT');
    }
    
    // Check rate limits
    const rateLimitCheck = checkRateLimit(providedKey);
    if (!rateLimitCheck.allowed) {
      logApiKeyUsage(null, req, false);
      res.setHeader('Retry-After', rateLimitCheck.retryAfter);
      return respondInvalidKey(res, rateLimitCheck.reason, 'RATE_LIMIT_EXCEEDED', 429);
    }
    
    // Validate API key with service
    const validation = await apiKeyService.validateApiKey(providedKey);
    if (!validation.valid) {
      logApiKeyUsage(null, req, false);
      return respondInvalidKey(res, validation.error || 'Invalid API key', 'API_KEY_INVALID');
    }
    
    // Check API key permissions
    const permissionCheck = checkApiKeyPermissions(validation.apiKey, req);
    if (!permissionCheck.allowed) {
      logApiKeyUsage(validation.apiKey, req, false);
      return respondInvalidKey(res, permissionCheck.reason, 'API_KEY_INSUFFICIENT_PERMISSIONS', 403);
    }
    
    // Increment rate limit counter
    incrementRateLimit(providedKey);
    
    // Attach API key to request
    req.apiKey = validation.apiKey;
    req.apiKeyId = validation.apiKey._id || validation.apiKey.id;
    
    // Log successful usage
    logApiKeyUsage(validation.apiKey, req, true);
    
    logger.info('Optional API key validated successfully:', {
      apiKeyId: req.apiKeyId,
      apiKeyName: validation.apiKey.name
    });
    
    next();
  } catch (error) {
    logger.error('Optional API key validation error:', error);
    return errorResponse(res, 'Unable to validate API key: ' + error.message, 500, 'API_KEY_VALIDATION_ERROR');
  }
};

/**
 * Middleware to check specific API key permissions
 */
export const requireApiKeyPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.apiKey) {
        logger.warn('API key permission check failed: No API key in request');
        return respondInvalidKey(res, 'API key is required', 'API_KEY_REQUIRED');
      }
      
      const apiKey = req.apiKey;
      
      // Check if API key has the required permission
      if (apiKey.permissions && Array.isArray(apiKey.permissions)) {
        if (apiKey.permissions.includes('*') || apiKey.permissions.includes(requiredPermission)) {
          logger.info('API key has required permission:', {
            apiKeyId: req.apiKeyId,
            permission: requiredPermission
          });
          return next();
        }
      }
      
      logger.warn('API key lacks required permission:', {
        apiKeyId: req.apiKeyId,
        requiredPermission,
        availablePermissions: apiKey.permissions
      });
      
      return respondInvalidKey(
        res,
        'API key does not have the required permission: ' + requiredPermission,
        'API_KEY_INSUFFICIENT_PERMISSIONS',
        403
      );
    } catch (error) {
      logger.error('API key permission check error:', error);
      return errorResponse(res, 'Unable to check API key permissions', 500, 'API_KEY_PERMISSION_CHECK_ERROR');
    }
  };
};

/**
 * Get rate limit status for an API key
 */
export const getRateLimitStatus = (apiKey) => {
  if (!rateLimitTracker.has(apiKey)) {
    return {
      minute: { count: 0, limit: MAX_REQUESTS_PER_MINUTE, remaining: MAX_REQUESTS_PER_MINUTE },
      hour: { count: 0, limit: MAX_REQUESTS_PER_HOUR, remaining: MAX_REQUESTS_PER_HOUR }
    };
  }
  
  const tracker = rateLimitTracker.get(apiKey);
  const now = Date.now();
  
  return {
    minute: {
      count: tracker.minute.count,
      limit: MAX_REQUESTS_PER_MINUTE,
      remaining: MAX_REQUESTS_PER_MINUTE - tracker.minute.count,
      resetsIn: Math.max(0, Math.ceil((tracker.minute.resetAt - now) / 1000))
    },
    hour: {
      count: tracker.hour.count,
      limit: MAX_REQUESTS_PER_HOUR,
      remaining: MAX_REQUESTS_PER_HOUR - tracker.hour.count,
      resetsIn: Math.max(0, Math.ceil((tracker.hour.resetAt - now) / 60000))
    }
  };
};

/**
 * Reset rate limits for an API key (admin function)
 */
export const resetRateLimit = (apiKey) => {
  if (rateLimitTracker.has(apiKey)) {
    rateLimitTracker.delete(apiKey);
    logger.info('Rate limit reset for API key:', { apiKey: apiKey.substring(0, 8) + '...' });
    return true;
  }
  return false;
};

/**
 * Clear all rate limit tracking (admin function)
 */
export const clearAllRateLimits = () => {
  const count = rateLimitTracker.size;
  rateLimitTracker.clear();
  logger.info('All rate limits cleared:', { count });
  return count;
};

export default {
  requireApiKey,
  optionalApiKey,
  requireApiKeyPermission,
  getRateLimitStatus,
  resetRateLimit,
  clearAllRateLimits,
  // Export constants for testing/configuration
  API_KEY_MIN_LENGTH,
  API_KEY_MAX_LENGTH,
  MAX_REQUESTS_PER_MINUTE,
  MAX_REQUESTS_PER_HOUR
};
