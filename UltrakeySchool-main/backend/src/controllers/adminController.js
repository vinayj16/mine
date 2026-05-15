import emailService from '../services/emailService.js';
import logger from '../utils/logger.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import UserCredential from '../models/UserCredential.js';
import Institution from '../models/Institution.js';
import bcrypt from 'bcryptjs';

// In-memory storage for demo purposes (will be replaced with database in production)
// TODO: Replace with database storage
export let userCredentials = []; // Temporary for backward compatibility

// Function to add new account request (called from auth controller)
export const addAccountRequest = (requestData) => {
  // This function is no longer needed as we use database storage
  // Kept for backward compatibility
  logger.info('Account request add called (deprecated - using database)');
  return requestData;
};

// Create login credentials for approved account requests
export const createCredentials = async (req, res) => {
  try {
    logger.info('Create credentials request received:', {
      body: req.body
    });

    const { userId, email, password, role, permissions } = req.body;
    
    // Get institutionId from JWT token - check both institution and institutionId fields
    const institutionId = req.user?.institution || req.user?.institutionId || req.body.institutionId;
    logger.info('Create credentials - institutionId from token:', { 
      institution: req.user?.institution, 
      institutionId: req.user?.institutionId,
      finalId: institutionId 
    });

    // Validation
    const errors = [];
    
    if (!userId || typeof userId !== 'string') {
      errors.push('User ID is required');
    }
    
    if (!email || typeof email !== 'string') {
      errors.push('Email is required');
    } else {
      const emailErrors = validateEmail(email);
      if (emailErrors.length > 0) {
        errors.push(...emailErrors);
      }
    }
    
    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
    } else if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    
    if (!role || typeof role !== 'string') {
      errors.push('Role is required');
    }

    if (!institutionId) {
      errors.push('Institution ID is required');
    }

    if (errors.length > 0) {
      logger.error('Create credentials validation failed:', errors);
      return validationErrorResponse(res, errors);
    }

    // Find the institution by ID (handle various ID formats)
    let institution;
    
    if (!institutionId || typeof institutionId !== 'string') {
      return validationErrorResponse(res, ['Institution ID is required']);
    }
    
    // For string IDs like "inst-1", we don't need to verify with database lookup
    // The institutionId from JWT token is sufficient
    // Just log for debugging
    logger.info('Using institutionId from token:', institutionId);

    // Create user credentials (in production, this would be saved to database)
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const plainPassword = password; // Keep plain password for email
    
    // Normalize permissions to snake_case
    const normalizePermissions = (perms) => {
      if (!perms || !Array.isArray(perms)) return [];
      return perms.map(p => {
        // Convert camelCase to snake_case
        return p.replace(/([A-Z])/g, '_$1').toLowerCase();
      });
    };
    
    const userCredential = {
      userId: userId,
      email: email.trim().toLowerCase(),
      password: hashedPassword, // Store hashed password
      role: role.toLowerCase().replace(' ', '_'),
      permissions: normalizePermissions(permissions),
      institutionId: institutionId, // Use string ID from token (like "inst-1")
      instituteType: 'School', // Default - could be enhanced to fetch from institution
      instituteCode: institutionId, // Use the institutionId as code
      fullName: 'User', // Placeholder, should be sent from frontend
      createdAt: new Date().toISOString(),
      status: 'active',
      hasLoggedIn: false // Track first-time login for welcome email
    };

    // Store credentials in database
    try {
      const newCred = new UserCredential(userCredential);
      await newCred.save();
      logger.info('User credentials saved to database:', {
        userId: userCredential.userId,
        email: userCredential.email,
        role: userCredential.role
      });
    } catch (dbError) {
      logger.error('Failed to save credentials to database:', dbError.message);
      // Also keep in memory as fallback
      userCredentials.push(userCredential);
    }

    // Return success response directly without helper
    return res.status(201).json({
      success: true,
      data: {
        userId: userCredential.userId,
        email: userCredential.email,
        role: userCredential.role,
        instituteType: userCredential.instituteType,
        instituteCode: userCredential.instituteCode,
        fullName: userCredential.fullName
      },
      message: 'Login credentials created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Create credentials error:', error);
    logger.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to create credentials',
        code: 'CREATE_CREDENTIALS_FAILED'
      },
      timestamp: new Date().toISOString()
    });
  }
};

// Login endpoint for testing created credentials
export const loginWithCredentials = async (req, res) => {
  try {
    logger.info('Login attempt with credentials:', {
      email: req.body.email
    });

    const { email, password } = req.body;

    if (!email || !password) {
      return validationErrorResponse(res, ['Email and password are required']);
    }

    // Find user credentials (try database first, fallback to in-memory)
    let user = null;
    try {
      user = await UserCredential.findOne({ email: email.toLowerCase() });
      if (user) {
        logger.info('User found in database:', { email: user.email, role: user.role });
      }
    } catch (dbError) {
      logger.warn('Database query failed, falling back to in-memory storage:', dbError.message);
    }

    // Fallback to in-memory storage if not found in database
    if (!user) {
      user = userCredentials.find(cred => cred.email.toLowerCase() === email.toLowerCase());
      if (user) {
        logger.info('User found in memory storage:', { email: user.email, role: user.role });
      }
    }

    if (!user) {
      logger.warn('Login attempt with invalid email:', email);
      return errorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check password (in production, this should be hashed)
    if (user.password !== password) {
      logger.warn('Login attempt with invalid password for user:', email);
      return errorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status !== 'active') {
      logger.warn('Login attempt for inactive account:', email);
      return errorResponse(res, 'Account is not active', 401, 'ACCOUNT_INACTIVE');
    }

    // Check if this is the user's first login and send welcome email
    const isFirstLogin = !user.hasLoggedIn;

    if (isFirstLogin) {
      try {
        // Send welcome email for first-time login
        await emailService.sendWelcomeEmail(user.email, {
          fullName: user.fullName,
          instituteType: user.instituteType,
          instituteCode: user.instituteCode,
          requestId: user.userId,
          email: user.email
        });

        logger.info('Welcome email sent for first login:', { email: user.email });

        // Update the user's hasLoggedIn status in database
        try {
          await UserCredential.updateOne(
            { email: user.email.toLowerCase() },
            {
              hasLoggedIn: true,
              lastLoginAt: new Date()
            }
          );
        } catch (dbError) {
          logger.warn('Failed to update login status in database:', dbError.message);
          // Update in-memory storage as fallback
          user.hasLoggedIn = true;
        }

      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
        // Don't fail the login if email fails, just log it
      }
    } else {
      // Update last login time for returning users
      try {
        await UserCredential.updateOne(
          { email: user.email.toLowerCase() },
          { lastLoginAt: new Date() }
        );
      } catch (dbError) {
        logger.warn('Failed to update last login time in database:', dbError.message);
      }
    }

    // Return success response (in production, this would include JWT tokens)
    return successResponse(res, {
      userId: user.userId,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      instituteType: user.instituteType,
      instituteCode: user.instituteCode,
      permissions: user.permissions,
      isFirstLogin: isFirstLogin, // Include this in response for frontend
      message: isFirstLogin ? 'Welcome! First login successful' : 'Login successful'
    }, isFirstLogin ? 'Welcome! First login successful' : 'Login successful');

  } catch (error) {
    logger.error('Login error:', error);
    return errorResponse(res, 'Login failed', 500, 'LOGIN_FAILED');
  }
};

// Helper function to validate email
function validateEmail(email) {
  const errors = [];
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!EMAIL_PATTERN.test(email)) {
    errors.push('Invalid email format');
  }
  
  return errors;
}

// Get all account requests
export const getAccountRequests = async (req, res) => {
  try {
    logger.info('Get account requests called:', {
      query: req.query
    });

    const PendingInstitutionRegistration = (await import('../models/PendingInstitutionRegistration.js')).default;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await PendingInstitutionRegistration.countDocuments(query);
    
    // Get requests
    const requests = await PendingInstitutionRegistration
      .find(query)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get stats
    const stats = {
      total: await PendingInstitutionRegistration.countDocuments(),
      pending: await PendingInstitutionRegistration.countDocuments({ status: 'pending' }),
      approved: await PendingInstitutionRegistration.countDocuments({ status: 'approved' }),
      rejected: await PendingInstitutionRegistration.countDocuments({ status: 'rejected' })
    };
    
    logger.info('Returning requests:', {
      total: total,
      paginated: requests.length,
      page: page,
      limit: limit
    });
    
    return successResponse(res, {
      requests: requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRequests: total,
        hasNext: skip + requests.length < total,
        hasPrev: page > 1
      },
      stats: stats
    }, 'Account requests retrieved successfully');
    
  } catch (error) {
    logger.error('Get account requests error:', error);
    return errorResponse(res, 'Failed to get account requests', 500, 'GET_ACCOUNT_REQUESTS_FAILED');
  }
};

// Get account request statistics
export const getAccountRequestStats = async (req, res) => {
  try {
    const PendingInstitutionRegistration = (await import('../models/PendingInstitutionRegistration.js')).default;
    
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const stats = {
      total: await PendingInstitutionRegistration.countDocuments(),
      pending: await PendingInstitutionRegistration.countDocuments({ status: 'pending' }),
      approved: await PendingInstitutionRegistration.countDocuments({ status: 'approved' }),
      rejected: await PendingInstitutionRegistration.countDocuments({ status: 'rejected' }),
      thisMonth: await PendingInstitutionRegistration.countDocuments({
        submittedAt: { $gte: thisMonthStart }
      }),
      lastMonth: await PendingInstitutionRegistration.countDocuments({
        submittedAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
      })
    };
    
    return successResponse(res, stats, 'Account request statistics retrieved successfully');
    
  } catch (error) {
    logger.error('Get account request stats error:', error);
    return errorResponse(res, 'Failed to get account request statistics', 500, 'GET_STATS_FAILED');
  }
};

// Get single account request
export const getAccountRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const PendingInstitutionRegistration = (await import('../models/PendingInstitutionRegistration.js')).default;
    
    const request = await PendingInstitutionRegistration.findById(id).lean();
    
    if (!request) {
      return notFoundResponse(res, 'Account request not found');
    }
    
    return successResponse(res, request, 'Account request retrieved successfully');
    
  } catch (error) {
    logger.error('Get account request by ID error:', error);
    return errorResponse(res, 'Failed to get account request', 500, 'GET_REQUEST_FAILED');
  }
};

// Approve account request
export const approveAccountRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const PendingInstitutionRegistration = (await import('../models/PendingInstitutionRegistration.js')).default;
    
    const request = await PendingInstitutionRegistration.findById(id);
    
    if (!request) {
      return notFoundResponse(res, 'Account request not found');
    }
    
    // Update request status
    request.status = 'approved';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = req.user?.id || 'admin';
    request.adminNotes = adminNotes || '';
    
    await request.save();
    
    logger.info('Account request approved:', {
      requestId: id,
      instituteType: request.instituteType,
      instituteCode: request.instituteCode
    });
    
    return successResponse(res, request, 'Account request approved successfully');
    
  } catch (error) {
    logger.error('Approve account request error:', error);
    return errorResponse(res, 'Failed to approve account request', 500, 'APPROVE_REQUEST_FAILED');
  }
};

// Reject account request
export const rejectAccountRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const PendingInstitutionRegistration = (await import('../models/PendingInstitutionRegistration.js')).default;
    
    if (!rejectionReason) {
      return errorResponse(res, 'Rejection reason is required', 400, 'REJECTION_REASON_REQUIRED');
    }
    
    const request = await PendingInstitutionRegistration.findById(id);
    
    if (!request) {
      return notFoundResponse(res, 'Account request not found');
    }
    
    // Update request status
    request.status = 'rejected';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = req.user?.id || 'admin';
    request.rejectionReason = rejectionReason;
    
    await request.save();
    
    logger.info('Account request rejected:', {
      requestId: id,
      instituteType: request.instituteType,
      instituteCode: request.instituteCode,
      rejectionReason
    });
    
    return successResponse(res, request, 'Account request rejected successfully');
    
  } catch (error) {
    logger.error('Reject account request error:', error);
    return errorResponse(res, 'Failed to reject account request', 500, 'REJECT_REQUEST_FAILED');
  }
};

// Send support email from institution to superadmin
export const sendSupportEmail = async (req, res) => {
  try {
    logger.info('Support email request received:', {
      fromEmail: req.body.fromEmail,
      subject: req.body.subject,
      institutionName: req.body.institutionName
    });

    const { fromEmail, institutionName, subject, message, priority = 'medium' } = req.body;

    // Validation
    const errors = [];

    if (!fromEmail || typeof fromEmail !== 'string') {
      errors.push('Sender email is required');
    } else {
      const emailErrors = validateEmail(fromEmail);
      if (emailErrors.length > 0) {
        errors.push(...emailErrors);
      }
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      errors.push('Subject is required');
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      errors.push('Message is required');
    }

    if (errors.length > 0) {
      logger.error('Support email validation failed:', errors);
      return validationErrorResponse(res, errors);
    }

    // Send support email to superadmin
    await emailService.sendSupportEmail(
      fromEmail.trim(),
      institutionName || 'Unknown Institution',
      subject.trim(),
      message.trim(),
      priority
    );

    logger.info('Support email sent successfully:', {
      from: fromEmail,
      to: process.env.SUPERADMIN_EMAIL,
      subject: subject
    });

    return successResponse(res, {
      message: 'Support request sent successfully',
      sentTo: process.env.SUPERADMIN_EMAIL
    }, 'Support request sent successfully');

  } catch (error) {
    logger.error('Send support email error:', error);
    return errorResponse(res, 'Failed to send support request', 500, 'SEND_SUPPORT_EMAIL_FAILED');
  }
};

// Get all user credentials for superadmin management
export const getAllCredentials = async (req, res) => {
  try {
    logger.info('Get all credentials request received');

    // Handle both institutionId and institution fields from token
    const userInstitutionId = req.user?.institutionId || req.user?.institution;
    const isSuperAdmin = req.user?.role === 'superadmin' || req.user?.role === 'super_admin';
    
    // Fetch from database - filter by institution if not superadmin
    let credentials = [];
    try {
      const query = isSuperAdmin ? {} : { institutionId: userInstitutionId?.toString() };
      credentials = await UserCredential.find(query)
        .select('-password')
        .sort({ createdAt: -1 });
      logger.info(`Found ${credentials.length} credentials in database`);
    } catch (dbError) {
      logger.warn('Database query failed:', dbError.message);
    }

    // Also include in-memory credentials (filter by user's institution if not superadmin)
    const memoryCredentials = userCredentials.map(cred => ({
      _id: `mem-${cred.userId}`,
      userId: cred.userId,
      email: cred.email,
      password: cred.password,
      role: cred.role,
      institutionId: cred.institutionId,
      permissions: cred.permissions,
      instituteType: cred.instituteType,
      instituteCode: cred.instituteCode,
      fullName: cred.fullName,
      status: cred.status,
      hasLoggedIn: cred.hasLoggedIn,
      createdAt: cred.createdAt,
      isInMemory: true
    }));

    // Filter memory credentials by institution if needed
    let filteredMemory = memoryCredentials;
    if (!isSuperAdmin && userInstitutionId) {
      filteredMemory = memoryCredentials.filter(c => c.institutionId === userInstitutionId?.toString());
    }

    // Combine database and memory credentials
    const allCredentials = [...credentials, ...filteredMemory];

    return successResponse(res, {
      credentials: allCredentials,
      total: allCredentials.length
    }, 'Credentials retrieved successfully');

  } catch (error) {
    logger.error('Get all credentials error:', error);
    return errorResponse(res, 'Failed to retrieve credentials', 500, 'GET_CREDENTIALS_FAILED');
  }
};

export default {
  getAccountRequests,
  getAccountRequestStats,
  getAccountRequestById,
  approveAccountRequest,
  rejectAccountRequest,
  createCredentials,
  loginWithCredentials,
  addAccountRequest,
  sendSupportEmail,
  getAllCredentials
};
