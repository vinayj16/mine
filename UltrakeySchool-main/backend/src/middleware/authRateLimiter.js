/**
 * Authentication Rate Limiter
 * Prevents brute force attacks on authentication endpoints
 */

import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for login attempts
 * 20 attempts per 5 minutes per IP (development-friendly)
 */
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_LOGIN_ATTEMPTS',
      message: 'Too many login attempts. Please try again after 5 minutes.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false
});

/**
 * Rate limiter for registration
 * 3 registrations per hour per IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REGISTRATION_ATTEMPTS',
      message: 'Too many registration attempts. Please try again after 1 hour.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for password reset requests
 * 3 requests per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_PASSWORD_RESET_ATTEMPTS',
      message: 'Too many password reset requests. Please try again after 1 hour.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for token refresh
 * 10 requests per 15 minutes per IP
 */
export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_TOKEN_REFRESH_ATTEMPTS',
      message: 'Too many token refresh attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * General auth rate limiter
 * 20 requests per 15 minutes per IP
 */
export const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  refreshTokenLimiter,
  generalAuthLimiter
};
