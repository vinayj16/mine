import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

// Default options: 100 requests per 15 minutes per IP
const defaultOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
};

/**
 * Global rate limiter — applied to all API routes
 */
export const globalLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX) || 300, // 300 requests per window
  handler: (req, res, next, options) => {
    logger.warn(`[RateLimit] Global limit exceeded: IP=${req.ip}, Path=${req.originalUrl}`);
    res.status(429).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting for super admins
    if (req.user?.role === 'superadmin') return true;
    return false;
  }
});

/**
 * Strict rate limiter — for auth/login routes (5 requests per minute)
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10, // 10 login attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    logger.warn(`[RateLimit] Auth limit exceeded: IP=${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many login attempts. Please try again after a minute.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Moderate rate limiter — for write/modify operations (30 requests per minute)
 */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_WRITE_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many write requests. Please slow down.',
    code: 'WRITE_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    logger.warn(`[RateLimit] Write limit exceeded: IP=${req.ip}, Path=${req.originalUrl}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please slow down.',
      code: 'WRITE_RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * API key rate limiter — for public/unauthenticated endpoints
 */
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please authenticate or try again later.',
    code: 'PUBLIC_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Create a custom rate limiter with specific options
 */
export const createRateLimiter = (options = {}) => {
  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

export default {
  globalLimiter,
  authLimiter,
  writeLimiter,
  publicLimiter,
  createRateLimiter
};
