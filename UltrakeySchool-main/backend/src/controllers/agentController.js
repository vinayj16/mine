import Agent from '../models/Agent.js';
import User from '../models/User.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid agent statuses
const VALID_STATUSES = ['Active', 'Inactive', 'Suspended', 'Pending'];

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { field: fieldName, message: `Invalid ${fieldName} format` } };
  }
  return { valid: true };
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const getDefaultAgentSettings = (user = {}) => ({
  notifications: {
    emailNotifications: user.settings?.notifications?.emailNotifications ?? true,
    smsNotifications: user.settings?.notifications?.smsNotifications ?? false,
    pushNotifications: user.settings?.notifications?.pushNotifications ?? true,
    commissionAlerts: user.settings?.notifications?.commissionAlerts ?? true,
    newInstitutionAlerts: user.settings?.notifications?.newInstitutionAlerts ?? true,
    performanceReports: user.settings?.notifications?.performanceReports ?? false
  },
  privacy: {
    showProfileToPublic: user.settings?.privacy?.showProfileToPublic ?? false,
    showPerformanceStats: user.settings?.privacy?.showPerformanceStats ?? true,
    allowContactRequests: user.settings?.privacy?.allowContactRequests ?? false
  },
  preferences: {
    language: user.settings?.preferences?.language || user.preferences?.language || 'English',
    timezone: user.settings?.preferences?.timezone || user.preferences?.timezone || 'Asia/Kolkata',
    dateFormat: user.settings?.preferences?.dateFormat || 'DD/MM/YYYY',
    currency: user.settings?.preferences?.currency || user.preferences?.currency || 'INR',
    theme: user.settings?.preferences?.theme || user.preferences?.theme || 'light'
  },
  security: {
    notifications: user.settings?.security?.notifications ?? false,
    emails: user.settings?.security?.emails ?? false,
    sms: user.settings?.security?.sms ?? false,
    twoFactorAuth: user.settings?.security?.twoFactorAuth ?? false,
    sessionTimeout: user.settings?.security?.sessionTimeout ?? 30,
    lastPasswordChange: user.settings?.security?.lastPasswordChange || new Date().toISOString().split('T')[0]
  }
});

const findAgentSettingsOwner = async (req, select = '') => {
  const agentId = req.user?._id || req.user?.id;
  const agentEmail = req.user?.email;

  const userSelect = select || '-password';
  let owner = null;

  if (agentId && mongoose.Types.ObjectId.isValid(agentId)) {
    owner = await User.findById(agentId).select(userSelect);
  }

  if (!owner && agentEmail) {
    owner = await User.findOne({ email: agentEmail.toLowerCase() }).select(userSelect);
  }

  if (!owner && agentId) {
    owner = await Agent.findById(agentId).select(select || '-__v');
  }

  if (!owner && agentEmail) {
    owner = await Agent.findOne({ email: agentEmail.toLowerCase() }).select(select || '-__v');
  }

  return owner;
};

/**
 * Validate phone format
 */
const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

// @desc    Create a new agent
// @route   POST /api/v1/agents
// @access  Private (Super Admin)
const createAgent = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      commissionRate,
      status,
      notes
    } = req.body;

    // Validate required fields
    const errors = [];
    if (!name || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name is required and must be at least 2 characters' });
    }
    if (!email || !validateEmail(email)) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }
    if (!phone || !validatePhone(phone)) {
      errors.push({ field: 'phone', message: 'Valid phone number is required' });
    }
    if (commissionRate !== undefined && (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100)) {
      errors.push({ field: 'commissionRate', message: 'Commission rate must be between 0 and 100' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    // Check if agent with this email already exists
    const existingAgent = await Agent.findOne({ 
      email: email.toLowerCase(),
      tenantId: req.user.tenantId 
    });

    if (existingAgent) {
      return errorResponse(res, 'An agent with this email already exists', 409);
    }

    // Create new agent
    const agent = await Agent.create({
      name,
      email: email.toLowerCase(),
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      commissionRate,
      status: status || 'Active',
      notes,
      tenantId: req.user.tenantId,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    logger.info(`New agent created: ${agent._id} by user: ${req.user._id}`);

    return createdResponse(res, agent, 'Agent created successfully');
  } catch (error) {
    logger.error('Error creating agent:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return errorResponse(res, 'An agent with this email already exists', 409);
    }

    return errorResponse(res, 'Error creating agent', 500);
  }
};

// @desc    Get all agents
// @route   GET /api/v1/agents
// @access  Private (Super Admin)
const getAgents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      city,
      state,
      country,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return validationErrorResponse(res, [{ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') }]);
    }

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return validationErrorResponse(res, [{ field: 'page', message: 'Page must be a positive integer' }]);
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return validationErrorResponse(res, [{ field: 'limit', message: 'Limit must be between 1 and 100' }]);
    }

    // Build query
    const query = { tenantId: req.user.tenantId };

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    // Add filters
    if (status) query.status = status;
    if (city) query.city = { $regex: city, $options: 'i' };
    if (state) query.state = { $regex: state, $options: 'i' };
    if (country) query.country = { $regex: country, $options: 'i' };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    logger.info(`Fetching agents for tenant ${req.user.tenantId}`);

    // Execute query with pagination
    const agents = await Agent.find(query)
      .sort(sort)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    // Get total count
    const total = await Agent.countDocuments(query);

    return successResponse(res, agents, 'Agents retrieved successfully', {
      pagination: {
        current: pageNum,
        pageSize: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      filters: { status, city, state, country, search }
    });
  } catch (error) {
    logger.error('Error getting agents:', error);
    return errorResponse(res, 'Error retrieving agents', 500);
  }
};

// @desc    Get single agent by ID
// @route   GET /api/v1/agents/:id
// @access  Private (Super Admin)
const getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Agent retrieved successfully',
      data: agent
    });
  } catch (error) {
    logger.error('Error getting agent by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving agent',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update agent
// @route   PUT /api/v1/agents/:id
// @access  Private (Super Admin)
const updateAgent = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      commissionRate,
      status,
      notes
    } = req.body;

    // Validate email format if provided
    if (email && !validateEmail(email)) {
      return validationErrorResponse(res, [{ field: 'email', message: 'Valid email is required' }]);
    }

    // Validate phone format if provided
    if (phone && !validatePhone(phone)) {
      return validationErrorResponse(res, [{ field: 'phone', message: 'Valid phone number is required' }]);
    }

    // Validate commission rate if provided
    if (commissionRate !== undefined && (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100)) {
      return validationErrorResponse(res, [{ field: 'commissionRate', message: 'Commission rate must be between 0 and 100' }]);
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return validationErrorResponse(res, [{ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') }]);
    }

    // Find agent
    let agent = await Agent.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email.toLowerCase() !== agent.email) {
      const existingAgent = await Agent.findOne({
        email: email.toLowerCase(),
        tenantId: req.user.tenantId,
        _id: { $ne: req.params.id }
      });

      if (existingAgent) {
        return res.status(400).json({
          success: false,
          message: 'An agent with this email already exists'
        });
      }
    }

    // Update agent
    agent = await Agent.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email: email ? email.toLowerCase() : agent.email,
        phone,
        address,
        city,
        state,
        country,
        postalCode,
        commissionRate,
        status,
        notes,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');

    logger.info(`Agent updated: ${agent._id} by user: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Agent updated successfully',
      data: agent
    });
  } catch (error) {
    logger.error('Error updating agent:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An agent with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating agent',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete agent
// @route   DELETE /api/v1/agents/:id
// @access  Private (Super Admin)
const deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    await Agent.findByIdAndDelete(req.params.id);

    logger.info(`Agent deleted: ${agent._id} by user: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting agent:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting agent',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get agent statistics
// @route   GET /api/v1/agents/statistics
// @access  Private (Super Admin)
const getAgentStatistics = async (req, res) => {
  try {
    const statistics = await Agent.getStatistics(req.user.tenantId);

    res.status(200).json({
      success: true,
      message: 'Agent statistics retrieved successfully',
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting agent statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving agent statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get active agents
// @route   GET /api/v1/agents/active
// @access  Private (Super Admin)
const getActiveAgents = async (req, res) => {
  try {
    const agents = await Agent.findActive(req.user.tenantId)
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Active agents retrieved successfully',
      data: agents
    });
  } catch (error) {
    logger.error('Error getting active agents:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving active agents',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @route   POST /api/v1/agents/complete-profile
// @desc    Agent completes their profile after first login
// @access  Private (Agent)
const completeAgentProfile = async (req, res) => {
  try {
    const { 
      aadharCard, 
      panCard, 
      bankAccount, 
      dateOfBirth, 
      gender, 
      emergencyContact,
      profilePhoto
    } = req.body;

    const agentId = req.user._id || req.user.id;
    
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Update agent profile
    agent.aadharCard = aadharCard || '';
    agent.panCard = panCard || '';
    agent.bankAccount = bankAccount || {};
    agent.dateOfBirth = dateOfBirth || null;
    agent.gender = gender || '';
    agent.emergencyContact = emergencyContact || {};
    agent.profilePhoto = profilePhoto || '';
    agent.profileComplete = true;
    agent.profileCompletedAt = new Date();

    await agent.save();

    // Add activity log
    agent.activityHistory.push({
      action: 'profile_completed',
      description: 'Agent completed their profile',
      timestamp: new Date()
    });
    await agent.save();

    res.status(200).json({
      success: true,
      message: 'Profile completed successfully',
      data: {
        profileComplete: agent.profileComplete,
        profileCompletedAt: agent.profileCompletedAt
      }
    });
  } catch (error) {
    logger.error('Error completing agent profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @route   GET /api/v1/agents/my-profile
// @desc    Get agent's own profile
// @access  Private (Agent)
const getAgentProfile = async (req, res) => {
  try {
    const agentId = req.user._id || req.user.id;
    const agentEmail = req.user.email;
    
    // First try to find in User model (where agents are actually stored)
    let user = await User.findById(agentId).select('-password');
    
    // If not found in User model, try Agent model by ID
    if (!user) {
      user = await Agent.findById(agentId);
    }
    
    // If still not found, try to find by email in Agent collection
    if (!user && agentEmail) {
      user = await Agent.findOne({ email: agentEmail });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Get institutions created by this agent
    const Institution = (await import('../models/Institution.js')).default;
    const institutions = await Institution.find({ agentId: user._id }).lean();
    
    // Get commissions for this agent
    const Commission = (await import('../models/Commission.js')).default;
    const commissions = await Commission.find({ agentId: user._id }).lean();
    
    const totalCommission = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const pendingCommission = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const paidCommission = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        ...user.toObject(),
        activityHistory: user.activityHistory?.slice(-20) || [],
        institutionsCreated: institutions,
        institutionCount: institutions.length,
        commissionData: {
          totalCommission,
          pendingCommission,
          paidCommission,
          commissionCount: commissions.length
        }
      }
    });
  } catch (error) {
    logger.error('Error getting agent profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @route   POST /api/v1/agents/log-activity
// @desc    Log agent activity
// @access  Private
const logAgentActivity = async (req, res) => {
  try {
    const { action, description, entityType, entityId, metadata } = req.body;
    const agentId = req.user._id || req.user.id;
    
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    agent.activityHistory.push({
      action,
      description,
      entityType: entityType || '',
      entityId: entityId || '',
      metadata: metadata || {},
      timestamp: new Date()
    });

    await agent.save();

    res.status(200).json({
      success: true,
      message: 'Activity logged successfully'
    });
  } catch (error) {
    logger.error('Error logging agent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging activity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};



// @desc    Get agent settings
// @route   GET /api/v1/agent/settings
// @access  Private (Agent)
const getSettings = async (req, res) => {
  try {
    const user = await findAgentSettingsOwner(req);
    const settings = getDefaultAgentSettings(user || {});

    return successResponse(res, settings, 'Agent settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching agent settings:', error);
    return errorResponse(res, 'Failed to fetch agent settings', 500);
  }
};

// @desc    Update agent settings
// @route   PUT /api/v1/agent/settings
// @access  Private (Agent)
const updateSettings = async (req, res) => {
  try {
    const { notifications, privacy, preferences, security } = req.body;

    const user = await findAgentSettingsOwner(req);

    if (!user) {
      return notFoundResponse(res, 'Agent not found');
    }

    // Initialize settings if not present
    if (!user.settings) {
      user.settings = {};
    }

    // Update each category if provided
    if (notifications) {
      user.settings.notifications = { ...user.settings.notifications, ...notifications };
    }
    if (privacy) {
      user.settings.privacy = { ...user.settings.privacy, ...privacy };
    }
    if (preferences) {
      user.settings.preferences = { ...user.settings.preferences, ...preferences };
    }
    if (security) {
      user.settings.security = { ...user.settings.security, ...security };
    }

    // Mark settings as modified for Mongoose
    user.markModified('settings');
    await user.save();

    logger.info(`Agent settings updated for ${req.user?.id || req.user?.email}`);
    return successResponse(res, getDefaultAgentSettings(user), 'Agent settings updated successfully');
  } catch (error) {
    logger.error('Error updating agent settings:', error);
    return errorResponse(res, 'Failed to update agent settings', 500);
  }
};

export default {
  createAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
  getAgentStatistics,
  getActiveAgents,
  completeAgentProfile,
  getAgentProfile,
  getSettings,
  updateSettings,
  logAgentActivity
};
