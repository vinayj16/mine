import User from '../models/User.js';
import tokenService from './tokenService.js';
import crypto from 'crypto';

const authService = {
  /**
   * Register a new user
   */
  register: async (userData) => {
    try {
      // Validate required fields
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('Invalid email format');
      }

      // Validate password strength
      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email }
        ]
      });

      if (existingUser) {
        if (existingUser.email === userData.email) {
          throw new Error('User already exists with this email');
        }
      }

      // Block direct registration of superadmin role
      if (userData.role === 'superadmin') {
        throw new Error('Superadmin cannot be created through self-registration. Only one superadmin exists.');
      }

      // Block direct registration of agent role - agents must be created via agent controller
      if (userData.role === 'agent') {
        throw new Error('Agents cannot be created through user registration. Use the agent creation endpoint.');
      }

      // Prevent creating duplicate superadmins
      const existingSuperadmin = await User.findOne({ role: 'superadmin' });
      if (userData.role === 'superadmin' || existingSuperadmin) {
        throw new Error('A superadmin already exists. Only one superadmin is allowed.');
      }

      // Create new user - handle institutionId as either ObjectId or string
      const { institutionId, ...restUserData } = userData;
      
      const user = new User({
        ...restUserData,
        status: 'active',
        isActive: true,
        institution: institutionId || null
      });

      await user.save();

      // Generate tokens
      const tokenPayload = {
        sub: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        institution: user.institution || user.institutionId?.toString() || null
      };

      const tokens = tokenService.generateTokens(tokenPayload);

      // Store refresh token hash for security
      user.refreshToken = hashToken(tokens.refreshToken);
      await user.save();

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          avatar: user.avatar,
          institutionId: user.institution,
          schoolId: user.schoolId
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      };
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  /**
   * User login
   */
  login: async (email, password) => {
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Find user in users collection first
      let user = await User.findOne({ email }).select('+password');
      let loginSource = 'user';

      // If not found in users, check agents collection
      if (!user) {
        const Agent = (await import('../models/Agent.js')).default;
        const agent = await Agent.findOne({ email }).select('+password');
        if (agent) {
          // Verify agent password
          const isAgentPasswordValid = await agent.comparePassword(password);
          if (!isAgentPasswordValid) {
            throw new Error('Invalid email or password');
          }
          // Create a virtual user object from agent data for token generation
          user = {
            _id: agent._id,
            email: agent.email,
            name: agent.name,
            role: 'agent',
            status: agent.status === 'Active' ? 'active' : 'inactive',
            isActive: agent.status === 'Active',
            institutionId: null,
            plan: null,
            avatar: '',
            lastLogin: new Date(),
            save: async function() {
              agent.lastLogin = new Date();
              agent.loginCount = (agent.loginCount || 0) + 1;
              await agent.save();
            }
          };
          loginSource = 'agent';
        }
      }

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if account is active
      if (user.status !== 'active' && user.isActive !== true) {
        throw new Error('Account is deactivated. Please contact administrator.');
      }

      // Verify password (only for users, agents already verified above)
      if (loginSource === 'user') {
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }
      }

      // Generate tokens
      const tokenPayload = {
        sub: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        institution: user.institution || user.institutionId?.toString() || null
      };

      const tokens = tokenService.generateTokens(tokenPayload);

      // Store refresh token hash
      user.refreshToken = hashToken(tokens.refreshToken);
      user.lastLogin = new Date();
      await user.save();

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          avatar: user.avatar,
          institutionId: user.institutionId,
          schoolId: user.schoolId,
          lastLogin: user.lastLogin
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      };
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken) => {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      // Additional validation for token format
      if (typeof refreshToken !== 'string' || refreshToken.trim() === '') {
        throw new Error('Invalid refresh token format');
      }

      // Verify refresh token
      const decoded = tokenService.verifyRefreshToken(refreshToken);

      // Find user with matching refresh token hash
      const user = await User.findOne({
        _id: decoded.id || decoded.sub,
        refreshToken: hashToken(refreshToken)
      });

      if (!user) {
        throw new Error('Invalid refresh token');
      }

      // Check if account is still active
      if (user.status !== 'active' && user.isActive !== true) {
        throw new Error('Account is deactivated');
      }

      // Generate new tokens
      const tokenPayload = {
        sub: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        institution: user.institutionId?.toString()
      };

      const tokens = tokenService.generateTokens(tokenPayload);

      // Update refresh token hash
      user.refreshToken = hashToken(tokens.refreshToken);
      await user.save();

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      };
    } catch (error) {
      throw new Error(error.message || 'Token refresh failed');
    }
  },

  /**
   * User logout
   */
  logout: async (userId) => {
    try {
      // Clear refresh token from database
      await User.findByIdAndUpdate(userId, {
        refreshToken: null,
        lastLogout: new Date()
      });

      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      throw new Error('Logout failed');
    }
  },

  /**
   * Change password
   */
  changePassword: async (userId, currentPassword, newPassword) => {
    try {
      // Validate input
      if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required');
      }

      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }

      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      user.passwordChangedAt = new Date();
      await user.save();

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      throw new Error(error.message || 'Password change failed');
    }
  },

  /**
   * Get user profile
   */
  getProfile: async (userId) => {
    try {
      // First try User collection
      let user = await User.findById(userId)
        .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
        .lean();

      // If not found, try UserCredential collection
      if (!user) {
        const UserCredential = (await import('../models/UserCredential.js')).default;
        user = await UserCredential.findById(userId).lean();
        
        if (user) {
          // Convert UserCredential format to match User format
          user = {
            _id: user._id,
            name: user.fullName,
            email: user.email,
            role: user.role,
            plan: 'basic',
            permissions: user.permissions || [],
            modules: [],
            institutionId: user.institution,
            status: user.status,
            lastLogin: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          };
        }
      }

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            plan: user.plan,
            permissions: user.permissions || getDefaultPermissions(user.role),
            modules: user.modules || [],
            avatar: user.avatar,
            institutionId: user.institutionId,
            schoolId: user.schoolId,
            status: user.status || (user.isActive ? 'active' : 'inactive'),
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to get profile');
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId, updateData) => {
    try {
      const allowedFields = [
        'name', 'avatar', 'preferences', 'address', 'dateOfBirth', 'gender'
      ];

      const filteredData = {};
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        { ...filteredData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-password -refreshToken');

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      };
    } catch (error) {
      throw new Error(error.message || 'Profile update failed');
    }
  },

  /**
   * Get current user with permissions
   */
  getCurrentUser: async (userId) => {
    try {
      const user = await User.findById(userId)
        .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
        .lean();

      if (!user) {
        throw new Error('User not found');
      }

      // Get permissions based on role
      const permissions = user.permissions || getDefaultPermissions(user.role);

      return {
        success: true,
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenant_id: user.institutionId || user.schoolId,
          profile: {
            address: user.address,
            avatar: user.avatar
          },
          permissions
        }
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to get user');
    }
  }
};

/**
 * Helper: Hash token for storage
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Helper: Get default permissions based on role
 */
function getDefaultPermissions(role) {
  const permissionsMap = {
    admin: [
      'attendance.mark',
      'attendance.view',
      'notes.create',
      'notes.edit',
      'homework.assign',
      'homework.grade',
      'fees.manage',
      'students.view',
      'students.edit',
      'teachers.view',
      'teachers.edit',
      'settings.manage',
      'reports.view',
      'users.manage'
    ],
    teacher: [
      'attendance.mark',
      'attendance.view',
      'notes.create',
      'notes.edit',
      'homework.assign',
      'homework.grade',
      'students.view',
      'reports.view'
    ],
    student: [
      'attendance.view',
      'notes.view',
      'homework.view',
      'homework.submit',
      'fees.view',
      'reports.view'
    ],
    parent: [
      'students.view',
      'attendance.view',
      'homework.view',
      'fees.view',
      'reports.view'
    ]
  };

  return permissionsMap[role] || [];
}

export default authService;
