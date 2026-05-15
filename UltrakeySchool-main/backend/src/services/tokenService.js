/**
 * Token Service
 * Handles JWT token generation, validation, and refresh
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

// Token configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-this';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

/**
 * Generate access token
 * @param {Object} payload - Data to encode in token
 * @returns {string} JWT access token
 */
export const generateAccessToken = (payload) => {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
      issuer: 'edusearch'
    });
    logger.info(`Access token generated for user: ${payload.id || payload._id}`);
    return token;
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw error;
  }
};

/**
 * Generate refresh token
 * @param {Object} payload - Data to encode in token
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  try {
    const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRE,
      issuer: 'edusearch'
    });
    logger.info(`Refresh token generated for user: ${payload.id || payload._id}`);
    return token;
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw error;
  }
};

/**
 * Generate both access and refresh tokens
 * @param {Object} payload - Token payload (can be user object or custom payload)
 * @returns {Object} Object containing access and refresh tokens
 */
export const generateTokens = (payload) => {
  // If payload is a user object, extract necessary fields
  const tokenPayload = payload._id ? {
    id: payload._id || payload.id,
    sub: payload._id?.toString() || payload.id?.toString(),
    email: payload.email,
    role: payload.role,
    institution: payload.institution || payload.institutionId
  } : payload;

  return {
    accessToken: generateAccessToken(tokenPayload),
    refreshToken: generateRefreshToken(tokenPayload),
    expiresIn: JWT_EXPIRE
  };
};

/**
 * Verify access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  try {
    // Additional validation for token format
    if (typeof token !== 'string' || token.trim() === '') {
      throw new Error('Invalid token format');
    }
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.warn('Access token verification failed:', error.message);
    throw error;
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  try {
    // Additional validation for token format
    if (typeof token !== 'string' || token.trim() === '') {
      throw new Error('Invalid refresh token format');
    }
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    logger.warn('Refresh token verification failed:', error.message);
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
  try {
    // Additional validation for token format
    if (typeof token !== 'string' || token.trim() === '') {
      throw new Error('Invalid token format');
    }
    return jwt.decode(token);
  } catch (error) {
    logger.warn('Token decoding failed:', error.message);
    throw error;
  }
};

/**
 * Hash password
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw error;
  }
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {boolean} True if passwords match
 */
export const comparePassword = async (password, hashedPassword) => {
  try {
    // Additional validation for password format
    if (typeof password !== 'string' || password.trim() === '') {
      throw new Error('Invalid password format');
    }
    if (typeof hashedPassword !== 'string' || hashedPassword.trim() === '') {
      throw new Error('Invalid hashed password format');
    }
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error('Password comparison failed:', error);
    throw error;
  }
};

/**
 * Extract token from authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
export const extractToken = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  // Additional validation for auth header format
  if (typeof authHeader !== 'string' || authHeader.trim() === '') {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  const token = parts[1];
  if (!token || token.trim() === '') {
    return null;
  }

  return token;
};

/**
 * Extract token from authorization header (alias)
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
export const extractTokenFromHeader = (authHeader) => {
  return extractToken(authHeader);
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
export const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  hashPassword,
  comparePassword,
  extractToken,
  extractTokenFromHeader,
  isTokenExpired,
  getTokenExpiration
};
