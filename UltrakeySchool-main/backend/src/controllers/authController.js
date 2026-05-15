import authService from '../services/authService.js';
import tokenService from '../services/tokenService.js';
import superAdminService from '../services/superAdminService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import { addAccountRequest, userCredentials } from './adminController.js';
import User from '../models/User.js';
import UserCredential from '../models/UserCredential.js';
import Student from '../models/Student.js';
import bcrypt from 'bcryptjs';
import { sendCredentialsEmail } from '../config/email.js';

// Validation constants
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const TOKEN_LENGTH = 64;

// Helper function to validate MongoDB ObjectId
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    return fieldName + ' is required';
  }
  // Accept both MongoDB ObjectIds and string IDs like "inst-1"
  if (typeof id === 'string' && id.startsWith('inst-')) {
    return null;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate email
const validateEmail = (email) => {
  const errors = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required and must be a string');
    return errors;
  }
  
  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    errors.push('Email cannot be empty');
  }
  
  if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
    errors.push('Email must not exceed ' + MAX_EMAIL_LENGTH + ' characters');
  }
  
  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.push('Invalid email format');
  }
  
  return errors;
};

// Helper function to validate password
const validatePassword = (password, fieldName = 'Password') => {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    errors.push(fieldName + ' is required and must be a string');
    return errors;
  }
  
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(fieldName + ' must be at least ' + MIN_PASSWORD_LENGTH + ' characters long');
  }
  
  if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(fieldName + ' must not exceed ' + MAX_PASSWORD_LENGTH + ' characters');
  }
  
  if (!PASSWORD_PATTERN.test(password)) {
    errors.push(fieldName + ' must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  }
  
  return errors;
};

// Helper function to validate name
const validateName = (name) => {
  const errors = [];
  
  if (!name || typeof name !== 'string') {
    errors.push('Name is required and must be a string');
    return errors;
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < MIN_NAME_LENGTH) {
    errors.push('Name must be at least ' + MIN_NAME_LENGTH + ' characters long');
  }
  
  if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
  }
  
  return errors;
};

// Helper function to check if auth is allowed
const isAuthAllowed = () => {
  const authEnabled = process.env.AUTH_ENABLED !== 'false';
  logger.info('Auth check - AUTH_ENABLED:', process.env.AUTH_ENABLED);
  logger.info('Auth check - authEnabled:', authEnabled);
  return authEnabled;
};

// Helper function to reject auth requests
const rejectAuth = (res) => {
  logger.warn('Authentication request rejected: Auth is disabled');
  return errorResponse(res, 'Authentication is temporarily disabled. Please contact your administrator.', 503, 'AUTH_TEMPORARILY_DISABLED');
};

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    logger.info('User registration attempt');
    
    if (!isAuthAllowed()) {
      return rejectAuth(res);
    }
    
    const { email, password, name, role, institutionId } = req.body;
    
    // Validation
    const errors = [];
    
    const emailErrors = validateEmail(email);
    if (emailErrors.length > 0) {
      errors.push(...emailErrors);
    }
    
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      errors.push(...passwordErrors);
    }
    
    const nameErrors = validateName(name);
    if (nameErrors.length > 0) {
      errors.push(...nameErrors);
    }
    
    if (role && typeof role !== 'string') {
      errors.push('Role must be a string');
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      logger.warn('Registration validation failed:', { errors, email });
      return validationErrorResponse(res, errors);
    }
    
    const result = await authService.register(req.body);
    
    logger.info('User registered successfully:', { userId: result.user?.id, email });
    
    // Send credentials email
    try {
      await sendCredentialsEmail(
        { email: result.user.email, name: result.user.name },
        { password, role: result.user.role, institution: institutionId }
      );
      logger.info('Credentials email sent successfully:', { email });
    } catch (emailError) {
      logger.warn('Failed to send credentials email:', emailError);
      // Don't fail registration if email fails
    }
    
    return createdResponse(res, result, 'User registered successfully. Credentials have been sent to your email.');
  } catch (error) {
    logger.error('Registration error:', error);
    
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      return errorResponse(res, error.message, 409, 'EMAIL_ALREADY_EXISTS');
    }
    
    return errorResponse(res, error.message || 'Registration failed', 400, 'REGISTRATION_FAILED');
  }
};

/**
 * User login
 */
const login = async (req, res) => {
  try {
    logger.info('Login attempt');
    logger.info('Request body:', req.body);
    logger.info('Headers:', req.headers);
    
    if (!isAuthAllowed()) {
      logger.warn('Auth not allowed, rejecting request');
      return rejectAuth(res);
    }
    
    const { email, password } = req.body;
    
    // Validation
    const errors = [];
    
    const emailErrors = validateEmail(email);
    if (emailErrors.length > 0) {
      errors.push(...emailErrors);
    }
    
    if (!password || typeof password !== 'string') {
      errors.push('Password is required and must be a string');
    } else if (password.length === 0) {
      errors.push('Password cannot be empty');
    }
    
    if (errors.length > 0) {
      logger.warn('Login validation failed:', { errors, email });
      return validationErrorResponse(res, errors);
    }
    
    // Find user in database (check both User and UserCredential collections)
    let foundUser = null;
    let userType = '';

    try {
      // First try User collection (for SuperAdmin and direct users)
      foundUser = await User.findOne({ email: email.toLowerCase() });
      if (foundUser) {
        userType = 'User';
        logger.info('User found in User collection:', { 
          email: foundUser.email, 
          role: foundUser.role,
          institutionId: foundUser.institutionId,
          _id: foundUser._id
        });
      }
    } catch (dbError) {
      logger.warn('Database query failed for User:', dbError.message);
    }

    // If not found in User collection, try UserCredential collection
    if (!foundUser) {
      try {
        foundUser = await UserCredential.findOne({ email: email.toLowerCase() });
        if (foundUser) {
          userType = 'UserCredential';
          logger.info('User found in UserCredential collection:', { 
            email: foundUser.email, 
            role: foundUser.role,
            institutionId: foundUser.institutionId,
            _id: foundUser._id
          });
        }
      } catch (dbError) {
        logger.warn('Database query failed for UserCredential:', dbError.message);
      }
    }

    // If not found in UserCredential, try Student collection
    if (!foundUser) {
      try {
        foundUser = await Student.findOne({ email: email.toLowerCase() });
        if (foundUser) {
          userType = 'Student';
          logger.info('User found in Student collection:', { 
            email: foundUser.email, 
            role: foundUser.role,
            institutionId: foundUser.institutionId,
            _id: foundUser._id
          });
        }
      } catch (dbError) {
        logger.warn('Database query failed for Student:', dbError.message);
      }
    }

    // Fallback to in-memory array if not found in database
    if (!foundUser) {
      foundUser = userCredentials.find(cred => cred.email.toLowerCase() === email.toLowerCase());
      if (foundUser) {
        userType = 'Memory';
        logger.info('User found in memory userCredentials array:', { 
          email: foundUser.email, 
          role: foundUser.role,
          institutionId: foundUser.institutionId
        });
      }
    }

    // If user found, validate and return
    if (foundUser) {
      // Check password - handle both hashed and plain text passwords
      let isPasswordValid = false;
      
      // Ensure password field exists
      if (!foundUser.password) {
        logger.warn('User found but has no password set:', { email: foundUser.email, userType });
        return errorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }
      
      if (userType === 'User') {
        // User collection uses bcrypt hashed passwords
        isPasswordValid = await bcrypt.compare(password, foundUser.password);
      } else if (userType === 'UserCredential') {
        // UserCredential collection might have hashed or plain text passwords
        // Also allow plain text 'test123' for testing
        if (foundUser.password.startsWith('$2') || foundUser.password.startsWith('$2a')) {
          // Hashed password
          isPasswordValid = await bcrypt.compare(password, foundUser.password);
        } else if (foundUser.password === password) {
          // Plain text password
          isPasswordValid = true;
        } else {
          // Try bcrypt anyway - might work
          isPasswordValid = await bcrypt.compare(password, foundUser.password);
        }
      } else if (userType === 'Student') {
        // Student collection - check if password is hashed or plain text
        if (foundUser.password && (foundUser.password.startsWith('$2') || foundUser.password.startsWith('$2a'))) {
          // Hashed password
          isPasswordValid = await bcrypt.compare(password, foundUser.password);
        } else {
          // Plain text password (for backward compatibility)
          isPasswordValid = foundUser.password === password;
        }
      } else if (userType === 'Memory') {
        // In-memory credentials - check if password is hashed or plain text
        if (foundUser.password && (foundUser.password.startsWith('$2') || foundUser.password.startsWith('$2a'))) {
          // Hashed password
          isPasswordValid = await bcrypt.compare(password, foundUser.password);
        } else {
          // Plain text password (for backward compatibility)
          isPasswordValid = foundUser.password === password;
        }
      } else {
        // Memory array uses plain text
        isPasswordValid = foundUser.password === password;
      }
      
      if (!isPasswordValid) {
        logger.warn('Invalid password for user:', { email: foundUser.email, userType });
        return errorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      // Check if account is active (for UserCredential and Student collections)
      if ((userType === 'UserCredential' || userType === 'Student') && foundUser.status !== 'active') {
        logger.warn('Login attempt for inactive user account:', foundUser.email);
        return errorResponse(res, 'Account is deactivated. Please contact administrator.', 403, 'ACCOUNT_DEACTIVATED');
      }

      // Normalize role for frontend
      let normalizedRole = foundUser.role;
      // Don't normalize - keep the role as is for frontend to recognize
      // if (normalizedRole === 'superadmin') {
      //   normalizedRole = 'SUPER_ADMIN';
      // }

      // Generate JWT tokens
      const userId = foundUser._id ? foundUser._id.toString() : foundUser.userId || foundUser.email;
      // For UserCredential, use institutionId; for User, use institution
      // Check institutionId first (for UserCredential), then institution (for User)
      const userInstitution = foundUser.institutionId || foundUser.institution || null;
      
      // EXPLICIT DEBUG: Log exactly what's in the foundUser document
      console.log('=== AUTH LOGIN DEBUG ===');
      console.log('foundUser.email:', foundUser.email);
      console.log('foundUser._id:', foundUser._id?.toString());
      console.log('foundUser.role:', foundUser.role);
      console.log('foundUser.institutionId:', foundUser.institutionId);
      console.log('foundUser.institutionId type:', typeof foundUser.institutionId);
      console.log('foundUser.institutionId toString:', foundUser.institutionId?.toString());
      console.log('foundUser.institution:', foundUser.institution);
      console.log('userInstitution (used for token):', userInstitution?.toString());
      console.log('=========================');
      
      const tokens = tokenService.generateTokens({
        sub: userId,
        id: userId,
        email: foundUser.email,
        role: normalizedRole,
        institution: userInstitution ? userInstitution.toString() : null
      });

      // Get institution details if user has an institutionId (for any role)
      let institutionData = {};
      if (userInstitution) {
        try {
          const Institution = (await import('../models/Institution.js')).default;
          const institutionIdStr = userInstitution.toString();
          logger.info('Login DEBUG - fetching institution:', institutionIdStr);
          const institutionDetails = await Institution.findById(institutionIdStr).select('name instituteCode type contact address category');
          if (institutionDetails) {
            institutionData = {
              institutionName: institutionDetails.name,
              institutionCode: institutionDetails.instituteCode,
              institutionType: institutionDetails.type,
              institutionCategory: institutionDetails.category,
              institutionContact: institutionDetails.contact
            };
          }
        } catch (err) {
          logger.warn('Could not fetch institution details:', err.message);
        }
      }

      const userResponse = {
        id: userId,
        email: foundUser.email,
        role: normalizedRole,
        name: foundUser.name || foundUser.fullName,
        fullName: foundUser.fullName || foundUser.name,
        schoolId: foundUser.schoolId,
        institutionId: foundUser.institutionId || (foundUser.institution ? foundUser.institution.toString() : null),
        instituteType: foundUser.instituteType || foundUser.institution || foundUser.schoolId,
        instituteCode: foundUser.instituteCode || foundUser.institution || foundUser.schoolId,
        permissions: foundUser.permissions || [],
        modules: foundUser.modules || [],
        plan: foundUser.plan || 'basic',
        status: foundUser.status || 'active',
        ...institutionData
      };

      // Update login status and last login time
      try {
        if (userType === 'UserCredential') {
          await UserCredential.updateOne(
            { email: foundUser.email.toLowerCase() },
            {
              hasLoggedIn: true,
              lastLoginAt: new Date()
            }
          );
        } else if (userType === 'User') {
          await User.updateOne(
            { email: foundUser.email.toLowerCase() },
            {
              lastLoginAt: new Date()
            }
          );
        }
      } catch (dbError) {
        logger.warn('Failed to update login status in database:', dbError.message);
        // Update in-memory storage as fallback
        if (userType === 'Memory') {
          foundUser.hasLoggedIn = true;
        }
      }

      const loginUserId = foundUser._id ? foundUser._id.toString() : (foundUser.userId || foundUser.email);
      logger.info('Login successful for user:', { 
        userId: loginUserId, 
        email: foundUser.email, 
        role: normalizedRole,
        userType 
      });

      // Log activity for audit
      try {
        await superAdminService.logActivity({
          action: 'user_login',
          resourceType: normalizedRole === 'agent' ? 'agent' : 'user',
          resourceId: foundUser._id,
          user: foundUser._id,
          userName: foundUser.name || foundUser.fullName,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'],
          details: {
            userType,
            email: foundUser.email,
            role: normalizedRole
          }
        });
      } catch (auditError) {
        logger.warn('Failed to log login activity:', auditError.message);
      }

      return successResponse(res, {
        user: userResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      }, 'Login successful');
    }

    // If user not found in any collection, return error
    if (!foundUser) {
      logger.warn('User not found in any collection:', { email });
      return errorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

  } catch (error) {
    logger.error('Login error:', error);
    
    if (error.message.includes('Invalid email or password') || error.message.includes('Invalid credentials')) {
      return errorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    
    if (error.message.includes('deactivated') || error.message.includes('inactive')) {
      return errorResponse(res, error.message, 403, 'ACCOUNT_DEACTIVATED');
    }
    
    if (error.message.includes('locked') || error.message.includes('too many attempts')) {
      return errorResponse(res, error.message, 429, 'ACCOUNT_LOCKED');
    }
    
    if (error.message.includes('not verified')) {
      return errorResponse(res, error.message, 403, 'EMAIL_NOT_VERIFIED');
    }
    
    return errorResponse(res, 'An error occurred during login', 500, 'INTERNAL_ERROR');
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    logger.info('Token refresh attempt');
    
    const { refreshToken } = req.body;
    
    // Validation
    const errors = [];
    
    if (!refreshToken || typeof refreshToken !== 'string') {
      errors.push('Refresh token is required and must be a string');
    } else if (refreshToken.trim().length === 0) {
      errors.push('Refresh token cannot be empty');
    }
    
    if (errors.length > 0) {
      logger.warn('Token refresh validation failed:', { errors });
      return validationErrorResponse(res, errors);
    }
    
    const result = await authService.refreshToken(refreshToken);
    
    logger.info('Token refreshed successfully:', { userId: result.user?.id });
    return successResponse(res, result, 'Token refreshed successfully');
  } catch (error) {
    logger.error('Token refresh error:', error);
    
    if (error.message.includes('Invalid refresh token') || error.message.includes('expired')) {
      return errorResponse(res, 'Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
    
    if (error.message.includes('deactivated')) {
      return errorResponse(res, 'Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }
    
    return errorResponse(res, 'Token refresh failed', 401, 'TOKEN_REFRESH_FAILED');
  }
};

/**
 * User logout
 */
const logout = async (req, res) => {
  try {
    logger.info('Logout attempt');
    
    if (!req.user || !req.user.id) {
      logger.warn('Logout attempt without authentication');
      return errorResponse(res, 'Authentication required', 401, 'AUTH_REQUIRED');
    }
    
    const userId = req.user.id;
    const userName = req.user.name;
    const userRole = req.user.role;
    
    await authService.logout(userId);
    
    // Log logout activity for audit
    try {
      await superAdminService.logActivity({
        action: 'user_logout',
        resourceType: userRole === 'agent' ? 'agent' : 'user',
        resourceId: userId,
        user: userId,
        userName: userName,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        details: {
          email: req.user.email,
          role: userRole
        }
      });
    } catch (auditError) {
      logger.warn('Failed to log logout activity:', auditError.message);
    }
    
    logger.info('Logout successful:', { userId });
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    logger.error('Logout error:', error);
    return errorResponse(res, 'Logout failed', 500, 'LOGOUT_FAILED');
  }
};

/**
 * Change user password
 */
const changePassword = async (req, res) => {
  try {
    logger.info('Password change attempt');
    
    if (!req.user || !req.user.id) {
      logger.warn('Password change attempt without authentication');
      return errorResponse(res, 'Authentication required', 401, 'AUTH_REQUIRED');
    }
    
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validation
    const errors = [];
    
    if (!currentPassword || typeof currentPassword !== 'string') {
      errors.push('Current password is required and must be a string');
    } else if (currentPassword.trim().length === 0) {
      errors.push('Current password cannot be empty');
    }
    
    const newPasswordErrors = validatePassword(newPassword, 'New password');
    if (newPasswordErrors.length > 0) {
      errors.push(...newPasswordErrors);
    }
    
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      errors.push('New password and confirm password do not match');
    }
    
    if (currentPassword === newPassword) {
      errors.push('New password must be different from current password');
    }
    
    if (errors.length > 0) {
      logger.warn('Password change validation failed:', { errors, userId: req.user.id });
      return validationErrorResponse(res, errors);
    }
    
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    
    logger.info('Password changed successfully:', { userId: req.user.id });
    return successResponse(res, null, result.message || 'Password changed successfully');
  } catch (error) {
    logger.error('Password change error:', error);
    
    if (error.message.includes('Current password is incorrect') || error.message.includes('incorrect password')) {
      return errorResponse(res, error.message, 400, 'INVALID_CURRENT_PASSWORD');
    }
    
    if (error.message.includes('not found')) {
      return notFoundResponse(res, 'User not found');
    }
    
    return errorResponse(res, 'Password change failed', 400, 'PASSWORD_CHANGE_FAILED');
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    logger.info('Get profile attempt');
    
    if (!req.user || !req.user.id) {
      logger.warn('Get profile attempt without authentication');
      return errorResponse(res, 'Authentication required', 401, 'AUTH_REQUIRED');
    }
    
    const result = await authService.getProfile(req.user.id);
    
    logger.info('Profile fetched successfully:', { userId: req.user.id });
    return successResponse(res, result.data || result, 'Profile retrieved successfully');
  } catch (error) {
    logger.error('Get profile error:', error);
    
    if (error.message.includes('not found')) {
      return notFoundResponse(res, 'User not found');
    }
    
    return errorResponse(res, 'Failed to get profile', 500, 'PROFILE_FETCH_FAILED');
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    logger.info('Update profile attempt');
    
    if (!req.user || !req.user.id) {
      logger.warn('Update profile attempt without authentication');
      return errorResponse(res, 'Authentication required', 401, 'AUTH_REQUIRED');
    }
    
    const { name, email, phone, avatar } = req.body;
    
    // Validation
    const errors = [];
    
    if (name !== undefined) {
      const nameErrors = validateName(name);
      if (nameErrors.length > 0) {
        errors.push(...nameErrors);
      }
    }
    
    if (email !== undefined) {
      const emailErrors = validateEmail(email);
      if (emailErrors.length > 0) {
        errors.push(...emailErrors);
      }
    }
    
    if (phone !== undefined && phone !== null) {
      if (typeof phone !== 'string') {
        errors.push('Phone must be a string');
      } else if (phone.length > 0 && phone.length < 10) {
        errors.push('Phone number must be at least 10 digits');
      } else if (phone.length > 20) {
        errors.push('Phone number must not exceed 20 digits');
      }
    }
    
    if (avatar !== undefined && avatar !== null) {
      if (typeof avatar !== 'string') {
        errors.push('Avatar must be a string (URL)');
      } else if (avatar.length > 500) {
        errors.push('Avatar URL must not exceed 500 characters');
      }
    }
    
    if (errors.length > 0) {
      logger.warn('Update profile validation failed:', { errors, userId: req.user.id });
      return validationErrorResponse(res, errors);
    }
    
    const result = await authService.updateProfile(req.user.id, req.body);
    
    logger.info('Profile updated successfully:', { userId: req.user.id });
    return successResponse(res, result, 'Profile updated successfully');
  } catch (error) {
    logger.error('Update profile error:', error);
    
    if (error.message.includes('not found')) {
      return notFoundResponse(res, 'User not found');
    }
    
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      return errorResponse(res, error.message, 409, 'EMAIL_ALREADY_EXISTS');
    }
    
    if (error.message.includes('Validation')) {
      return errorResponse(res, error.message, 400, 'VALIDATION_ERROR');
    }
    
    return errorResponse(res, 'Failed to update profile', 500, 'PROFILE_UPDATE_FAILED');
  }
};

/**
 * Check authentication status
 */
const checkAuthStatus = async (req, res) => {
  try {
    logger.info('Check auth status');
    
    if (!req.user || !req.user.id) {
      return successResponse(res, { authenticated: false }, 'Not authenticated');
    }
    
    return successResponse(res, {
      authenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
      }
    }, 'Authenticated');
  } catch (error) {
    logger.error('Check auth status error:', error);
    return errorResponse(res, 'Failed to check authentication status', 500, 'AUTH_STATUS_CHECK_FAILED');
  }
};

/**
 * Get authentication configuration
 */
const getAuthConfig = async (req, res) => {
  try {
    logger.info('Get auth config');
    
    const config = {
      authEnabled: process.env.AUTH_ENABLED !== 'false',
      passwordPolicy: {
        minLength: MIN_PASSWORD_LENGTH,
        maxLength: MAX_PASSWORD_LENGTH,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      loginAttempts: {
        maxAttempts: MAX_LOGIN_ATTEMPTS,
        lockoutDuration: LOCKOUT_DURATION_MINUTES
      }
    };
    
    return successResponse(res, config, 'Authentication configuration retrieved');
  } catch (error) {
    logger.error('Get auth config error:', error);
    return errorResponse(res, 'Failed to get authentication configuration', 500, 'AUTH_CONFIG_FETCH_FAILED');
  }
};

// Create Account Request - for institution registration
export const createAccountRequest = async (req, res) => {
  try {
    logger.info('Create account request received:', {
      body: req.body,
      headers: req.headers
    });

    const {
      instituteType,
      instituteCode,
      fullName,
      email,
      password,
      status = 'pending',
      submittedAt
    } = req.body;

    // Validation
    const errors = [];
    
    if (!instituteType || typeof instituteType !== 'string') {
      errors.push('Institute type is required');
    }
    
    if (!instituteCode || typeof instituteCode !== 'string') {
      errors.push('Institute code is required');
    }
    
    if (!fullName || typeof fullName !== 'string') {
      errors.push('Full name is required');
    } else {
      const trimmedName = fullName.trim();
      if (trimmedName.length < MIN_NAME_LENGTH) {
        errors.push('Full name must be at least ' + MIN_NAME_LENGTH + ' characters');
      }
      if (trimmedName.length > MAX_NAME_LENGTH) {
        errors.push('Full name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    // Email validation
    const emailErrors = validateEmail(email);
    if (emailErrors.length > 0) {
      errors.push(...emailErrors);
    }
    
    // Password validation
    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
    } else {
      if (password.length < MIN_PASSWORD_LENGTH) {
        errors.push('Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters');
      }
      if (password.length > MAX_PASSWORD_LENGTH) {
        errors.push('Password must not exceed ' + MAX_PASSWORD_LENGTH + ' characters');
      }
      if (!PASSWORD_PATTERN.test(password)) {
        errors.push('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      }
    }

    logger.info('Validation results:', { errors, errorCount: errors.length });

    if (errors.length > 0) {
      logger.error('Validation failed:', errors);
      return validationErrorResponse(res, errors);
    }

    // Create account request data
    const accountRequest = {
      instituteType: instituteType.trim(),
      instituteCode: instituteCode.trim(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password, // In production, this should be hashed
      status,
      submittedAt: submittedAt || new Date().toISOString(),
      requestId: 'AR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    };

    // Save to database
    const PendingInstitutionRegistration = (await import('../models/PendingInstitutionRegistration.js')).default;
    await PendingInstitutionRegistration.create(accountRequest);
    
    logger.info('Account request created and stored:', {
      requestId: accountRequest.requestId,
      instituteType: accountRequest.instituteType,
      instituteCode: accountRequest.instituteCode,
      email: accountRequest.email
    });

    return createdResponse(res, {
      registrationId: accountRequest.requestId,
      status: accountRequest.status,
      message: 'Account request submitted successfully. Your request is under review.'
    }, 'Account request submitted successfully');

  } catch (error) {
    logger.error('Create account request error:', error);
    return errorResponse(res, 'Failed to create account request', 500, 'ACCOUNT_REQUEST_CREATION_FAILED');
  }
};


export default {
  register,
  login,
  refreshToken,
  logout,
  changePassword,
  getProfile,
  updateProfile,
  checkAuthStatus,
  getAuthConfig,
  createAccountRequest
};
