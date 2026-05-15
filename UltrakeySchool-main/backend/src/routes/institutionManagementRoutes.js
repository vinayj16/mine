import express from 'express';
import { authenticate, authorize } from '../middleware/authGuard.js';
import Institution from '../models/Institution.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
router.use(authenticate);

// Get all institutions with their users and statistics
router.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, status } = req.query;
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { instituteCode: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (type) query.type = type;
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [institutions, total] = await Promise.all([
      Institution.find(query)
        .populate('adminId', 'name email phone avatar')
        .populate('principalId', 'name email phone avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Institution.countDocuments(query)
    ]);

    // Get users for each institution
    const institutionsWithUsers = await Promise.all(
      institutions.map(async (institution) => {
        const users = await User.find({ institutionId: institution._id })
          .select('name email role phone department class section status')
          .sort({ createdAt: -1 });

        const stats = {
          totalUsers: users.length,
          teachers: users.filter(u => u.role === 'teacher').length,
          students: users.filter(u => u.role === 'student').length,
          parents: users.filter(u => u.role === 'parent').length,
          admins: users.filter(u => ['admin', 'institution_admin', 'principal'].includes(u.role)).length,
          staff: users.filter(u => ['accountant', 'librarian', 'hr_manager'].includes(u.role)).length
        };

        return {
          ...institution.toObject(),
          users,
          stats
        };
      })
    );

    res.json({
      success: true,
      data: {
        institutions: institutionsWithUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch institutions', error: error.message });
  }
});

// Get institution details with all users
router.get('/:institutionId/details', async (req, res) => {
  try {
    const { institutionId } = req.params;
    
    const institution = await Institution.findById(institutionId)
      .populate('adminId', 'name email phone avatar')
      .populate('principalId', 'name email phone avatar')
      .populate('createdBy', 'name email');

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    const users = await User.find({ institutionId })
      .select('name email role phone department class section status createdAt isEmailVerified')
      .sort({ createdAt: -1 });

    // Group users by role
    const usersByRole = users.reduce((acc, user) => {
      if (!acc[user.role]) acc[user.role] = [];
      acc[user.role].push(user);
      return acc;
    }, {});

    const stats = {
      totalUsers: users.length,
      teachers: users.filter(u => u.role === 'teacher').length,
      students: users.filter(u => u.role === 'student').length,
      parents: users.filter(u => u.role === 'parent').length,
      admins: users.filter(u => ['admin', 'institution_admin', 'principal'].includes(u.role)).length,
      staff: users.filter(u => ['accountant', 'librarian', 'hr_manager'].includes(u.role)).length,
      activeUsers: users.filter(u => u.status === 'active').length,
      verifiedUsers: users.filter(u => u.isEmailVerified).length
    };

    res.json({
      success: true,
      data: {
        institution,
        users,
        usersByRole,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch institution details', error: error.message });
  }
});

// Create credentials for institution users
router.post('/:institutionId/create-credentials', async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { userIds, resetAll } = req.body;

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    let users;
    if (resetAll) {
      users = await User.find({ institutionId });
    } else if (userIds && userIds.length > 0) {
      users = await User.find({ _id: { $in: userIds }, institutionId });
    } else {
      return res.status(400).json({ success: false, message: 'Please provide user IDs or set resetAll to true' });
    }

    const credentials = [];
    
    for (const user of users) {
      // Generate new password
      const newPassword = `${user.role.substring(0, 3)}${Math.floor(100000 + Math.random() * 900000)}`;
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      user.password = hashedPassword;
      user.isEmailVerified = true;
      user.status = 'active';
      await user.save();

      credentials.push({
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionCode: institution.instituteCode,
        temporaryPassword: newPassword
      });
    }

    res.json({
      success: true,
      message: `Created credentials for ${credentials.length} users`,
      data: {
        institution: {
          _id: institution._id,
          name: institution.name,
          instituteCode: institution.instituteCode
        },
        credentials
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create credentials', error: error.message });
  }
});

export default router;
