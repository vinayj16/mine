/**
 * Input Sanitization Middleware
 * Prevents XSS, NoSQL injection, and other attacks
 */

import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

// MongoDB injection prevention
export const sanitizeMongo = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized MongoDB injection attempt in ${key}`);
  },
});

// XSS prevention
export const sanitizeXSS = xss();

// HTTP Parameter Pollution prevention
export const preventHPP = hpp({
  whitelist: [
    'page',
    'limit',
    'sort',
    'fields',
    'search',
    'status',
    'role',
    'type',
    'category',
    'tags',
  ],
});

// Custom sanitizer for specific fields
export const sanitizeInput = (req, res, next) => {
  // Sanitize common injection patterns
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove potential script tags
      value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      // Remove potential SQL injection patterns
      value = value.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, '');
      // Trim whitespace
      value = value.trim();
    }
    return value;
  };
  
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      req.body[key] = sanitizeValue(req.body[key]);
    });
  }
  
  // Sanitize query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      req.query[key] = sanitizeValue(req.query[key]);
    });
  }
  
  // Sanitize params
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      req.params[key] = sanitizeValue(req.params[key]);
    });
  }
  
  next();
};
