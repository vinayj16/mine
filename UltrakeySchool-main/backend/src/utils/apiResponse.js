/**
 * Standardized API Response Helper
 * Provides consistent response format across all endpoints
 */

export const successResponse = (res, data, message = 'Success', meta = null) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(200).json(response);
};

export const createdResponse = (res, data, message = 'Created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const updatedResponse = (res, data, message = 'Updated successfully') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const deletedResponse = (res, message = 'Deleted successfully') => {
  return res.status(200).json({
    success: true,
    message,
    timestamp: new Date().toISOString()
  });
};

export const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    error: {
      message,
      code: getErrorCode(statusCode)
    },
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.error.details = errors;
  }

  return res.status(statusCode).json(response);
};

export const badRequestResponse = (res, message = 'Bad request', errors = null) => {
  const response = {
    success: false,
    error: {
      message,
      code: 'BAD_REQUEST'
    },
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.error.details = errors;
  }

  return res.status(400).json(response);
};

export const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors
    },
    timestamp: new Date().toISOString()
  });
};

export const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    error: {
      message,
      code: 'UNAUTHORIZED'
    },
    timestamp: new Date().toISOString()
  });
};

export const forbiddenResponse = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    error: {
      message,
      code: 'FORBIDDEN'
    },
    timestamp: new Date().toISOString()
  });
};

export const notFoundResponse = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    error: {
      message,
      code: 'NOT_FOUND'
    },
    timestamp: new Date().toISOString()
  });
};

export const conflictResponse = (res, message = 'Resource already exists') => {
  return res.status(409).json({
    success: false,
    error: {
      message,
      code: 'CONFLICT'
    },
    timestamp: new Date().toISOString()
  });
};

export const serverErrorResponse = (res, error) => {
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    },
    timestamp: new Date().toISOString()
  });
};

export const tooManyRequestsResponse = (res, message = 'Too many requests') => {
  return res.status(429).json({
    success: false,
    error: {
      message,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    timestamp: new Date().toISOString()
  });
};

const getErrorCode = (statusCode) => {
  const errorCodes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE'
  };
  return errorCodes[statusCode] || 'UNKNOWN_ERROR';
};

export default {
  successResponse,
  createdResponse,
  updatedResponse,
  deletedResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  badRequestResponse,
  tooManyRequestsResponse
};
