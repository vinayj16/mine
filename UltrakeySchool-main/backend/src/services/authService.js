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
          institutionId: user.institutionId
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
      let user = await User.findOne({ email }).select('+password +refreshToken');
      let loginSource = 'user';

       // If not found in users, check agents collection
       if (!user) {
         const Agent = (await import('../models/Agent.js')).default;
         const agent = await Agent.findOne({ email }).select('+password');
         if (agent) {
           const isAgentPasswordValid = await agent.comparePassword(password);
           if (!isAgentPasswordValid) {
             throw new Error('Invalid email or password');
           }
           if (agent.status !== 'Active') {
             throw new Error('Account is deactivated. Please contact administrator.');
           }
           user = agent;
           loginSource = 'agent';
         }
       }

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (loginSource === 'user' && user.status !== 'active' && user.isActive !== true) {
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
        role: loginSource === 'agent' ? 'agent' : user.role,
        institution: user.institution || user.institutionId?.toString() || null
      };

      const tokens = tokenService.generateTokens(tokenPayload);

      const hashedRefresh = hashToken(tokens.refreshToken);
      if (loginSource === 'agent') {
        const Agent = (await import('../models/Agent.js')).default;
        const { buildAgentIdFilter } = await import('../utils/agentAuthHelpers.js');
        const idFilter = buildAgentIdFilter(user._id) || { email: user.email.toLowerCase() };
        await Agent.updateOne(idFilter, {
          $set: { refreshToken: hashedRefresh, lastLogin: new Date(), role: 'agent' },
          $inc: { loginCount: 1 }
        });
      } else {
        user.refreshToken = hashedRefresh;
        user.lastLogin = new Date();
        await user.save();
      }

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: loginSource === 'agent' ? 'agent' : user.role,
          plan: user.plan,
          avatar: user.avatar,
          institutionId: user.institutionId,
          institutionId: user.institutionId,
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

       const hashedRefresh = hashToken(refreshToken);

       let user = await User.findOne({ refreshToken: hashedRefresh });
       let loginSource = 'user';

       if (!user) {
         const Agent = (await import('../models/Agent.js')).default;
         user = await Agent.findOne({ refreshToken: hashedRefresh }).select('+refreshToken');
         if (user) {
           loginSource = 'agent';
         }
       }

       if (!user) {
         throw new Error('Invalid refresh token');
       }

       if (loginSource === 'agent' && user.status !== 'Active') {
         throw new Error('Account is deactivated');
       }
       if (loginSource === 'user' && user.status !== 'active' && user.isActive !== true) {
         throw new Error('Account is deactivated');
       }

       // Generate new tokens
       const tokenPayload = {
         sub: user._id.toString(),
         id: user._id.toString(),
         email: user.email,
         role: loginSource === 'user' ? user.role : 'agent',
         institution: loginSource === 'user' ? user.institutionId?.toString() : user.institutionId?.toString()
       };

       const tokens = tokenService.generateTokens(tokenPayload);

       const newHashedRefresh = hashToken(tokens.refreshToken);
       if (loginSource === 'user') {
         user.refreshToken = newHashedRefresh;
         await user.save();
       } else {
         const Agent = (await import('../models/Agent.js')).default;
         const { buildAgentIdFilter } = await import('../utils/agentAuthHelpers.js');
         const idFilter = buildAgentIdFilter(user._id) || { email: user.email?.toLowerCase() };
         await Agent.updateOne(idFilter, {
           $set: { refreshToken: newHashedRefresh, lastLogin: new Date() },
           $inc: { loginCount: 1 }
         });
       }

       return {
         accessToken: tokens.accessToken,
         refreshToken: tokens.refreshToken,
         expiresIn: tokens.expiresIn
       };
      } catch (error) {
        console.error('=== REFRESH TOKEN ERROR ===', error.name, error.message, error.stack);
        throw new Error(error.message || 'Token refresh failed');
      }
   },

  /**
   * User logout
   */
  logout: async (userId, role) => {
    try {
      const normalizedRole = (role || '').toLowerCase();
      if (normalizedRole === 'agent') {
        const Agent = (await import('../models/Agent.js')).default;
        await Agent.findByIdAndUpdate(String(userId), {
          refreshToken: null,
          lastLogout: new Date()
        });
      } else {
        await User.findByIdAndUpdate(userId, {
          refreshToken: null,
          lastLogout: new Date()
        });
      }

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
        const ucUser = await UserCredential.findById(userId).lean();
        
          if (ucUser) {
          // Convert UserCredential format to match User format
          user = {
            _id: ucUser._id,
            name: ucUser.fullName,
            email: ucUser.email,
            role: ucUser.role,
            plan: 'basic',
            permissions: ucUser.permissions || [],
            modules: [],
            avatar: ucUser.avatar || ucUser.photo || '',
            institutionId: ucUser.institutionId || ucUser.institution,
            status: ucUser.status,
            lastLogin: ucUser.lastLoginAt,
            createdAt: ucUser.createdAt,
            updatedAt: ucUser.updatedAt
          };
        }
      }

      if (!user) {
        return {
          success: true,
          data: {
            user: {
              id: userId,
              name: 'Unknown User',
              email: '',
              role: 'guest',
              plan: 'basic',
              permissions: [],
              modules: [],
              status: 'inactive',
              institutionId: null,
              institutionData: null
            }
          }
        };
      }

      // Fetch institution details if user has an institutionId
      let institutionData = null;
      const institutionId = user.institutionId || user.institution;
      if (institutionId) {
        try {
          const Institution = (await import('../models/Institution.js')).default;
          const institutionDoc = await Institution.findById(institutionId.toString())
            .select('name instituteCode type status contact address email phone')
            .lean();
          if (institutionDoc) {
            institutionData = {
              id: institutionDoc._id,
              name: institutionDoc.name,
              instituteCode: institutionDoc.instituteCode || institutionDoc.code,
              type: institutionDoc.type,
              status: institutionDoc.status,
              contact: institutionDoc.contact || {
                email: institutionDoc.email,
                phone: institutionDoc.phone,
                address: institutionDoc.address
              }
            };
          }
        } catch (instErr) {
          // Non-blocking: institution fetch failure should not break profile
          console.warn('[authService.getProfile] Could not fetch institution details:', instErr.message);
        }
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
            institutionId: user.institutionId,
            status: user.status || (user.isActive ? 'active' : 'inactive'),
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            institutionData
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
        'name', 'avatar', 'preferences', 'address', 'dateOfBirth', 'gender',
        'phone', 'email', 'bio', 'bloodGroup', 'department', 'designation',
        'salary', 'joiningDate', 'skills', 'qualification', 'experience',
        'linkedinProfile', 'aadharCard', 'panCard', 'bankAccount', 'bankIfsc',
        'photo', 'employeeId'
      ];

      const filteredData = {};
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });

      // Try User collection first (for superadmins, direct users)
      let user = await User.findByIdAndUpdate(
        userId,
        { ...filteredData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-password -refreshToken');

      if (user) {
        return {
          success: true,
          message: 'Profile updated successfully',
          data: { user }
        };
      }

      // If not found in User collection, try UserCredential (staff members, students, etc.)
      const UserCredential = (await import('../models/UserCredential.js')).default;
      const ucUser = await UserCredential.findById(userId);

      if (ucUser) {
        // Update compatible fields in UserCredential
        const ucUpdate = {};
        if (filteredData.name) ucUpdate.fullName = filteredData.name;
        if (filteredData.email) ucUpdate.email = filteredData.email;
        if (filteredData.phone) ucUpdate.phone = filteredData.phone;
        if (filteredData.avatar || filteredData.photo) ucUpdate.avatar = filteredData.avatar || filteredData.photo;

        if (Object.keys(ucUpdate).length > 0) {
          await UserCredential.findByIdAndUpdate(userId, { ...ucUpdate, updatedAt: new Date() });
        }

        // Also try to find/create a User document for extended profile fields
        // (bio, bloodGroup, department, etc. are not on UserCredential)
        const userOnlyKeys = Object.keys(filteredData).filter(k => !['name', 'email', 'phone', 'avatar', 'photo'].includes(k));
        if (userOnlyKeys.length > 0 || filteredData.name || filteredData.avatar || filteredData.photo) {
          const userOnlyData = {};
          userOnlyKeys.forEach(k => { userOnlyData[k] = filteredData[k]; });
          if (filteredData.name) userOnlyData.name = filteredData.name;
          if (filteredData.avatar) userOnlyData.avatar = filteredData.avatar;
          if (filteredData.photo) userOnlyData.avatar = filteredData.photo;
          if (filteredData.phone) userOnlyData.phone = filteredData.phone;

          // Try to find existing User with matching email or userId
          let linkedUser = await User.findOne({
            $or: [
              { _id: userId },
              { email: ucUser.email.toLowerCase() }
            ]
          });

          if (linkedUser) {
            // Update existing User document with extended fields
            await User.findByIdAndUpdate(linkedUser._id, {
              ...userOnlyData,
              role: ucUser.role,
              institutionId: ucUser.institution || ucUser.institutionId,
              updatedAt: new Date()
            });
          } else {
            // Create a User document linked to this UserCredential
            await User.create({
              _id: userId,
              name: filteredData.name || ucUser.fullName,
              email: filteredData.email || ucUser.email,
              role: ucUser.role,
              institutionId: ucUser.institution || ucUser.institutionId,
              ...userOnlyData,
              status: ucUser.status || 'active',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }

        return {
          success: true,
          message: 'Profile updated successfully',
          data: { user: { ...ucUser.toObject(), ...filteredData } }
        };
      }

      // If not found in User or UserCredential, try Student collection
      const Student = (await import('../models/Student.js')).default;
      const studentUser = await Student.findById(userId);

      if (studentUser) {
        // Update compatible fields in Student
        const studentUpdate = {};
        if (filteredData.name) studentUpdate.name = filteredData.name;
        if (filteredData.email) studentUpdate.email = filteredData.email;
        if (filteredData.phone) studentUpdate.phone = filteredData.phone;
        if (filteredData.avatar || filteredData.photo) studentUpdate.avatar = filteredData.avatar || filteredData.photo;
        if (filteredData.address) studentUpdate.address = filteredData.address;
        if (filteredData.dateOfBirth) studentUpdate.dateOfBirth = filteredData.dateOfBirth;
        if (filteredData.gender) studentUpdate.gender = filteredData.gender;
        if (filteredData.bloodGroup) studentUpdate.bloodGroup = filteredData.bloodGroup;

        if (Object.keys(studentUpdate).length > 0) {
          await Student.findByIdAndUpdate(userId, { ...studentUpdate, updatedAt: new Date() });
        }

        return {
          success: true,
          message: 'Profile updated successfully',
          data: { user: { ...studentUser.toObject(), ...filteredData } }
        };
      }

      throw new Error('User not found');
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
          tenant_id: user.institutionId || user.institutionId,
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
