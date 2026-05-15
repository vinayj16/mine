import User from '../models/User.js';
import Agent from '../models/Agent.js';

class UserProfileService {
   async getUserProfile(schoolId, userId, userRole = null) {
     let user;
     
     // For agents, look directly in User collection (agents are stored as users with role 'agent')
    if (userRole === 'agent') {
      user = await User.findById(userId).select('-password').lean();
    } else {
      // For non-agent users, look in User collection
      let query = {
        _id: userId
      };
      
      // Only add schoolId to query if schoolId is provided
      if (schoolId) {
        query.schoolId = schoolId;
      }
      
      user = await User.findOne(query).lean();
    }
    
     if (!user) {
       throw new Error('User not found');
     }

     return this.formatUserProfile(user, userRole);
   }

  async updateUserProfile(schoolId, userId, updateData) {
    const allowedFields = ['name', 'email', 'phone', 'profileImage', 'department', 'address', 'city', 'state', 'country', 'postalCode', 'dateOfBirth', 'gender'];
    const filteredData = {};

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    // For agents, don't filter by schoolId
    const query = { _id: userId };
    if (schoolId) {
      query.schoolId = schoolId;
    }

    const user = await User.findOneAndUpdate(
      query,
      { $set: filteredData },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return this.formatUserProfile(user.toObject());
  }

  async updateLastLogin(userId) {
    await User.findByIdAndUpdate(userId, {
      $set: { lastLogin: new Date() }
    });
  }

  async getUserPermissions(userId) {
    const user = await User.findById(userId).lean();
    
    if (!user) {
      throw new Error('User not found');
    }

    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
      principal: ['read', 'write', 'manage_academic'],
      teacher: ['read', 'write', 'manage_classes'],
      student: ['read'],
      parent: ['read'],
      staff: ['read', 'write']
    };

    return rolePermissions[user.role] || ['read'];
  }

  formatUserProfile(user, userRole = null) {
    // Handle agent users with different field structure
    if (userRole === 'agent') {
      return {
        id: user._id.toString(),
        name: user.name || user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.profileImage || '/assets/img/placeholder-avatar.webp',
        department: user.department || 'Sales',
        lastLogin: user.lastLogin || new Date(),
        isOnline: true,
        permissions: ['agent_access', 'view_commissions', 'manage_profile'],
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        commissionRate: user.commissionRate
      };
    }
    
    // Handle regular users
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.profileImage || '/assets/img/placeholder-avatar.webp',
      department: user.department,
      lastLogin: user.lastLogin || new Date(),
      isOnline: true,
      permissions: []
    };
  }
}

export default new UserProfileService();
