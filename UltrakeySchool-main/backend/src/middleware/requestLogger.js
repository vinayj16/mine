/**
 * Request Logger Middleware
 * Logs all incoming requests with details
 */

import logger from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.http({
    type: 'request',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous',
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger[logLevel]({
      type: 'response',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || 'anonymous',
    });
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn({
        type: 'slow_request',
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
      });
    }
  });
  
  next();
};

export const errorLogger = (err, req, res, next) => {
  logger.error({
    type: 'error',
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || 'anonymous',
    body: req.body,
  });
  
  next(err);
};
