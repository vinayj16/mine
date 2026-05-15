/**
 * JWT Configuration and Token Management
 * Provides secure token generation, validation, and management
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// JWT Configuration
export const jwtConfig = {
  // Secrets (should be loaded from environment variables)
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
  
  // Token expiry times
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '24h', // 24 hours for better UX
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d', // 7 days
  resetPasswordExpiry: process.env.JWT_RESET_PASSWORD_EXPIRY || '1h', // 1 hour
  verifyEmailExpiry: process.env.JWT_VERIFY_EMAIL_EXPIRY || '24h', // 24 hours
  
  // Token metadata
  issuer: process.env.JWT_ISSUER || 'edusearch-backend',
  audience: process.env.JWT_AUDIENCE || 'edusearch-client',
  
  // Algorithm
  algorithm: 'HS256',
  
  // Token rotation
  rotateRefreshTokens: process.env.JWT_ROTATE_REFRESH_TOKENS === 'true',
  
  // Blacklist (for token revocation)
  enableBlacklist: process.env.JWT_ENABLE_BLACKLIST !== 'false',
};

// Validate configuration
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
    console.error('⚠️  WARNING: JWT_SECRET not set or using default value in production!');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'your-refresh-secret-key-change-in-production') {
    console.error('⚠️  WARNING: JWT_REFRESH_SECRET not set or using default value in production!');
  }
}

// Token types
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET_PASSWORD: 'reset_password',
  VERIFY_EMAIL: 'verify_email',
  API_KEY: 'api_key',
  MAGIC_LINK: 'magic_link'
};

// Cookie options for refresh tokens
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/api/v1/auth',
  domain: process.env.COOKIE_DOMAIN || undefined
};

// Token blacklist (in-memory, should use Redis in production)
const tokenBlacklist = new Set();

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {String} type - Token type (access, refresh, etc.)
 * @param {Object} options - Additional options
 * @returns {String} JWT token
 */
export const generateToken = (payload, type = TOKEN_TYPES.ACCESS, options = {}) => {
  const {
    secret = type === TOKEN_TYPES.REFRESH ? jwtConfig.refreshSecret : jwtConfig.secret,
    expiresIn = type === TOKEN_TYPES.REFRESH ? jwtConfig.refreshExpiry : jwtConfig.accessExpiry,
    issuer = jwtConfig.issuer,
    audience = jwtConfig.audience,
    algorithm = jwtConfig.algorithm
  } = options;

  // Add token metadata
  const tokenPayload = {
    ...payload,
    type,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomBytes(16).toString('hex') // Unique token ID
  };

  // Generate token
  return jwt.sign(tokenPayload, secret, {
    expiresIn,
    issuer,
    audience,
    algorithm
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @param {String} type - Expected token type
 * @param {Object} options - Additional options
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token, type = TOKEN_TYPES.ACCESS, options = {}) => {
  const {
    secret = type === TOKEN_TYPES.REFRESH ? jwtConfig.refreshSecret : jwtConfig.secret,
    issuer = jwtConfig.issuer,
    audience = jwtConfig.audience,
    algorithms = [jwtConfig.algorithm]
  } = options;

  try {
    // Check if token is blacklisted
    if (jwtConfig.enableBlacklist && isTokenBlacklisted(token)) {
      throw new Error('Token has been revoked');
    }

    // Verify token
    const decoded = jwt.verify(token, secret, {
      issuer,
      audience,
      algorithms
    });

    // Verify token type
    if (decoded.type !== type) {
      throw new Error(`Invalid token type. Expected ${type}, got ${decoded.type}`);
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not yet valid');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for inspection)
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    return null;
  }
};

/**
 * Generate access and refresh token pair
 * @param {Object} user - User object
 * @returns {Object} Token pair
 */
export const generateTokenPair = (user) => {
  const payload = {
    userId: user._id || user.id,
    email: user.email,
    role: user.role,
    institutionId: user.institutionId,
    schoolId: user.schoolId,
    permissions: user.permissions || [],
    plan: user.plan || 'free'
  };

  const accessToken = generateToken(payload, TOKEN_TYPES.ACCESS);
  const refreshToken = generateToken(
    { userId: payload.userId, email: payload.email },
    TOKEN_TYPES.REFRESH
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: parseExpiry(jwtConfig.accessExpiry),
    tokenType: 'Bearer'
  };
};

/**
 * Refresh access token using refresh token
 * @param {String} refreshToken - Refresh token
 * @returns {Object} New token pair
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken, TOKEN_TYPES.REFRESH);

    // Get user from database (you'll need to implement this)
    // const user = await User.findById(decoded.userId);
    // if (!user) throw new Error('User not found');

    // For now, create payload from decoded token
    const payload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      institutionId: decoded.institutionId,
      schoolId: decoded.schoolId,
      permissions: decoded.permissions || [],
      plan: decoded.plan || 'free'
    };

    // Generate new access token
    const accessToken = generateToken(payload, TOKEN_TYPES.ACCESS);

    // Optionally rotate refresh token
    let newRefreshToken = refreshToken;
    if (jwtConfig.rotateRefreshTokens) {
      newRefreshToken = generateToken(
        { userId: payload.userId, email: payload.email },
        TOKEN_TYPES.REFRESH
      );
      // Blacklist old refresh token
      blacklistToken(refreshToken);
    }

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: parseExpiry(jwtConfig.accessExpiry),
      tokenType: 'Bearer'
    };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Generate password reset token
 * @param {Object} user - User object
 * @returns {String} Reset token
 */
export const generateResetPasswordToken = (user) => {
  const payload = {
    userId: user._id || user.id,
    email: user.email,
    purpose: 'password_reset'
  };

  return generateToken(payload, TOKEN_TYPES.RESET_PASSWORD, {
    expiresIn: jwtConfig.resetPasswordExpiry
  });
};

/**
 * Generate email verification token
 * @param {Object} user - User object
 * @returns {String} Verification token
 */
export const generateVerifyEmailToken = (user) => {
  const payload = {
    userId: user._id || user.id,
    email: user.email,
    purpose: 'email_verification'
  };

  return generateToken(payload, TOKEN_TYPES.VERIFY_EMAIL, {
    expiresIn: jwtConfig.verifyEmailExpiry
  });
};

/**
 * Generate magic link token (passwordless login)
 * @param {Object} user - User object
 * @returns {String} Magic link token
 */
export const generateMagicLinkToken = (user) => {
  const payload = {
    userId: user._id || user.id,
    email: user.email,
    purpose: 'magic_link_login'
  };

  return generateToken(payload, TOKEN_TYPES.MAGIC_LINK, {
    expiresIn: '15m' // Short expiry for security
  });
};

/**
 * Blacklist a token (revoke)
 * @param {String} token - Token to blacklist
 */
export const blacklistToken = (token) => {
  if (!jwtConfig.enableBlacklist) return;
  
  const decoded = decodeToken(token);
  if (decoded && decoded.payload) {
    // Store token ID with expiry time
    const expiryTime = decoded.payload.exp * 1000; // Convert to milliseconds
    tokenBlacklist.add(token);
    
    // Auto-remove from blacklist after expiry
    setTimeout(() => {
      tokenBlacklist.delete(token);
    }, expiryTime - Date.now());
  }
};

/**
 * Check if token is blacklisted
 * @param {String} token - Token to check
 * @returns {Boolean} True if blacklisted
 */
export const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Clear token blacklist (for testing)
 */
export const clearBlacklist = () => {
  tokenBlacklist.clear();
};

/**
 * Get token from request header
 * @param {Object} req - Express request object
 * @returns {String|null} Token or null
 */
export const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader) return null;
  
  // Check for Bearer token
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check for simple token
  return authHeader;
};

/**
 * Get refresh token from cookie
 * @param {Object} req - Express request object
 * @returns {String|null} Refresh token or null
 */
export const getRefreshTokenFromCookie = (req) => {
  return req.cookies?.refreshToken || null;
};

/**
 * Parse expiry time to seconds
 * @param {String} expiry - Expiry string (e.g., '15m', '7d', '1h')
 * @returns {Number} Expiry in seconds
 */
export const parseExpiry = (expiry) => {
  const units = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800
  };
  
  const match = expiry.match(/^(\d+)([smhdw])$/);
  if (!match) return 3600; // Default 1 hour
  
  const [, value, unit] = match;
  return parseInt(value) * units[unit];
};

/**
 * Check if token is about to expire
 * @param {String} token - JWT token
 * @param {Number} thresholdSeconds - Threshold in seconds (default: 300 = 5 minutes)
 * @returns {Boolean} True if token expires soon
 */
export const isTokenExpiringSoon = (token, thresholdSeconds = 300) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.payload || !decoded.payload.exp) return false;
    
    const expiryTime = decoded.payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    
    return timeUntilExpiry < (thresholdSeconds * 1000);
  } catch (error) {
    return false;
  }
};

/**
 * Get token expiry time
 * @param {String} token - JWT token
 * @returns {Date|null} Expiry date or null
 */
export const getTokenExpiry = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.payload || !decoded.payload.exp) return null;
    
    return new Date(decoded.payload.exp * 1000);
  } catch (error) {
    return null;
  }
};

/**
 * Get token remaining time in seconds
 * @param {String} token - JWT token
 * @returns {Number} Remaining time in seconds
 */
export const getTokenRemainingTime = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.payload || !decoded.payload.exp) return 0;
    
    const expiryTime = decoded.payload.exp * 1000;
    const currentTime = Date.now();
    const remaining = Math.max(0, expiryTime - currentTime);
    
    return Math.floor(remaining / 1000);
  } catch (error) {
    return 0;
  }
};

/**
 * Validate token payload structure
 * @param {Object} payload - Token payload
 * @param {Array} requiredFields - Required fields
 * @returns {Boolean} True if valid
 */
export const validateTokenPayload = (payload, requiredFields = ['userId', 'email', 'role']) => {
  if (!payload || typeof payload !== 'object') return false;
  
  return requiredFields.every(field => payload.hasOwnProperty(field));
};

/**
 * Create token response object
 * @param {Object} tokens - Token pair
 * @param {Object} user - User object
 * @returns {Object} Token response
 */
export const createTokenResponse = (tokens, user = null) => {
  const response = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenType: tokens.tokenType || 'Bearer',
    expiresIn: tokens.expiresIn || parseExpiry(jwtConfig.accessExpiry)
  };
  
  if (user) {
    response.user = {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar
    };
  }
  
  return response;
};

// Export default configuration
export default {
  jwtConfig,
  TOKEN_TYPES,
  cookieOptions,
  generateToken,
  verifyToken,
  decodeToken,
  generateTokenPair,
  refreshAccessToken,
  generateResetPasswordToken,
  generateVerifyEmailToken,
  generateMagicLinkToken,
  blacklistToken,
  isTokenBlacklisted,
  clearBlacklist,
  getTokenFromHeader,
  getRefreshTokenFromCookie,
  parseExpiry,
  isTokenExpiringSoon,
  getTokenExpiry,
  getTokenRemainingTime,
  validateTokenPayload,
  createTokenResponse
};
