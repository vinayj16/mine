/**
 * Authentication Validation Middleware
 * Validates input for authentication endpoints
 */

/**
 * Validate registration data
 */
export const validateRegister = (req, res, next) => {
  const { email, password, name, role } = req.body;
  const errors = [];

  // Email validation
  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
  }

  // Password validation
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }

  // Name validation
  if (!name) {
    errors.push('Name is required');
  } else if (name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Role validation
  if (!role) {
    errors.push('Role is required');
  } else {
    const validRoles = ['admin',   'teacher', 'student', 'parent', 'staff'];
    if (!validRoles.includes(role)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
  }

  next();
};

/**
 * Validate login data
 */
export const validateLogin = (req, res, next) => {
  // Check if bypass mode is enabled and request has role/mockRole
  if (process.env.AUTH_BYPASS_MODE === 'true' && (req.body.role || req.body.mockRole || req.headers['x-bypass-role'])) {
    return next();
  }

  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
  }

  next();
};

/**
 * Validate password change data
 */
export const validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const errors = [];

  if (!currentPassword) {
    errors.push('Current password is required');
  }

  if (!newPassword) {
    errors.push('New password is required');
  } else {
    if (newPassword.length < 6) {
      errors.push('New password must be at least 6 characters long');
    }
    if (!/[A-Z]/.test(newPassword)) {
      errors.push('New password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(newPassword)) {
      errors.push('New password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(newPassword)) {
      errors.push('New password must contain at least one number');
    }
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push('New password must be different from current password');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
  }

  next();
};

/**
 * Validate password reset data
 */
export const validatePasswordReset = (req, res, next) => {
  const { token, newPassword } = req.body;
  const errors = [];

  if (!token) {
    errors.push('Reset token is required');
  }

  if (!newPassword) {
    errors.push('New password is required');
  } else {
    if (newPassword.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    if (!/[A-Z]/.test(newPassword)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(newPassword)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(newPassword)) {
      errors.push('Password must contain at least one number');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
  }

  next();
};

/**
 * Validate email
 */
export const validateEmail = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
  }

  next();
};

/**
 * Validate refresh token
 */
export const validateRefreshToken = (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Refresh token is required'
      }
    });
  }

  next();
};

/**
 * Validate token
 */
export const validateToken = (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Token is required'
      }
    });
  }

  next();
};

export default {
  validateRegister,
  validateLogin,
  validatePasswordChange,
  validatePasswordReset,
  validateEmail,
  validateRefreshToken,
  validateToken
};
