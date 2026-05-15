/**
 * Rate Limiter Middleware
 * Provides API rate limiting functionality
 */

import rateLimit from 'express-rate-limit';
import { tooManyRequestsResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    return tooManyRequestsResponse(res, 'Too many requests from this IP, please try again later.');
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    return tooManyRequestsResponse(res, 'Too many requests from this IP, please try again later.');
  }
});

// Stricter limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth
  message: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    return tooManyRequestsResponse(res, 'Too many authentication attempts, please try again later.');
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    return tooManyRequestsResponse(res, 'Too many authentication attempts, please try again later.');
  }
});

// Login specific limiter
export const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: (req, res) => {
    logger.warn(`Login rate limit exceeded for IP: ${req.ip}, Email: ${req.body.email}`);
    return tooManyRequestsResponse(res, 'Too many login attempts, please try again after an hour.');
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    return tooManyRequestsResponse(res, 'Too many login attempts, please try again after an hour.');
  }
});

// Admin API limiter
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for admin
  message: (req, res) => {
    return tooManyRequestsResponse(res, 'Too many admin requests, please try again later.');
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public API limiter (stricter)
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Lower limit for public endpoints
  message: (req, res) => {
    return tooManyRequestsResponse(res, 'Too many requests, please try again later.');
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Create custom rate limiter
export const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return res.status(429).json({
        success: false,
        error: {
          message: options.message || 'Too many requests, please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      });
    }
  });
};

export default {
  apiLimiter,
  authLimiter,
  loginLimiter,
  adminLimiter,
  publicLimiter,
  createRateLimiter
};
