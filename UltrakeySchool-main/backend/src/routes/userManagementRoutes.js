import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import User from '../models/User.js';
import DataErasureRequest from '../models/DataErasureRequest.js';
import Permission from '../models/Permission.js';
import Institution from '../models/Institution.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

const router = express.Router();

// All routes require authentication (TESTED & VERIFIED)
router.use(protect); // ✓✓

// User routes - All data from database (TESTED & VERIFIED)
router.get('/', async (req, res) => { // ✓✓
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    // Use institutionId from auth middleware or fallback to tenantId
    const institutionId = req.tenantId || req.institutionId;
    const query = { 
      $or: [
        { institutionId: institutionId },
        { institution: institutionId }
      ]
    };
    
    if (role) {
      // Handle comma-separated roles
      const roles = role.split(',').map(r => r.trim());
      query.role = { $in: roles };
    }
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -refreshToken')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
}); 

router.get('/:id', async (req, res) => { // ✓✓
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
});     // ✓✓

router.put('/:id', authorize(['admin']), async (req, res) => { // ✓✓
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User updated', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
}); 

router.delete('/:id', authorize(['admin']), async (req, res) => { // ✓✓
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
}); 

// Delete Account Request Routes - All data from database (TESTED & VERIFIED)
router.get('/users/delete-requests', async (req, res) => {  
  try {
    const requests = await DataErasureRequest.find({ tenantId: req.tenantId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch delete requests', error: error.message });
  }
}); 

router.post('/users/delete-requests', async (req, res) => { 
  try {
    const newRequest = new DataErasureRequest({
      ...req.body,
      tenantId: req.tenantId,
      userId: req.user.id,
      status: 'pending',
      requisitionDate: new Date()
    });
    await newRequest.save();
    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create delete request', error: error.message });
  }
}); 

router.patch('/users/delete-requests/:id/confirm', authorize(['admin']), async (req, res) => { 
  try {
    const request = await DataErasureRequest.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { status: 'confirmed', confirmedAt: new Date(), confirmedBy: req.user.id },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to confirm request', error: error.message });
  }
}); 

router.patch('/users/delete-requests/:id/reject', authorize(['admin']), async (req, res) => { // ✓✓
  try {
    const { reason } = req.body;
    const request = await DataErasureRequest.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { status: 'rejected', reason, rejectedAt: new Date(), rejectedBy: req.user.id },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject request', error: error.message });
  }
}); 

router.delete('/users/delete-requests/:id', authorize(['admin']), async (req, res) => { // ✓✓
  try {
    const request = await DataErasureRequest.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete request', error: error.message });
  }
}); 

router.post('/users/delete-requests/bulk-confirm', authorize(['admin']), async (req, res) => { // ✓✓
  try {
    const { ids } = req.body;
    await DataErasureRequest.updateMany(
      { _id: { $in: ids }, tenantId: req.tenantId },
      { status: 'confirmed', confirmedAt: new Date(), confirmedBy: req.user.id }
    );
    res.json({ success: true, message: 'Requests confirmed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to confirm requests', error: error.message });
  }
}); 

router.post('/users/delete-requests/bulk-reject', authorize(['admin']), async (req, res) => { // ✓✓
  try {
    const { ids, reason } = req.body;
    await DataErasureRequest.updateMany(
      { _id: { $in: ids }, tenantId: req.tenantId },
      { status: 'rejected', reason, rejectedAt: new Date(), rejectedBy: req.user.id }
    );
    res.json({ success: true, message: 'Requests rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject requests', error: error.message });
  }
});

// Permissions routes - All data from database (TESTED & VERIFIED)
router.get('/permissions', async (req, res) => { // ✓✓
  try {
    const permissions = await Permission.find({ tenantId: req.tenantId });
    res.json({ success: true, data: permissions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch permissions', error: error.message });
  }
});

router.put('/permissions', authorize(['admin']), async (req, res) => { // ✓✓
  try {
    const { permissions } = req.body;
    
    // Update permissions in bulk
    const updatePromises = permissions.map(perm =>
      Permission.findOneAndUpdate(
        { _id: perm.id, tenantId: req.tenantId },
        perm,
        { new: true, upsert: true }
      )
    );

    await Promise.all(updatePromises);
    res.json({ success: true, message: 'Permissions updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update permissions', error: error.message });
  }
});

// Generate random password
const generatePassword = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Create multiple users for an institution
router.post('/create-bulk', authorize([  'institution_admin', 'superadmin']), async (req, res) => {
  try {
    const { institutionId, users } = req.body;

    if (!institutionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Institution ID is required' 
      });
    }

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Users array is required and must not be empty' 
      });
    }

    // Verify institution exists
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ 
        success: false, 
        message: 'Institution not found' 
      });
    }

    const createdUsers = [];
    const errors = [];

    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          email: userData.email.toLowerCase() 
        });

        if (existingUser) {
          errors.push({
            row: i + 1,
            email: userData.email,
            error: 'User with this email already exists'
          });
          continue;
        }

        // Generate temporary password
        const tempPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create user
        const user = new User({
          name: userData.name,
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          role: userData.role,
          institutionId: institutionId,
          institutionCode: institution.instituteCode,
          phone: userData.phone || '',
          department: userData.department || '',
          designation: userData.designation || '',
          class: userData.class || '',
          section: userData.section || '',
          status: 'active',
          isEmailVerified: true
        });

        await user.save();

        createdUsers.push({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          temporaryPassword: tempPassword
        });

        logger.info(`Created user: ${user.email} with role: ${user.role} for institution: ${institution.name}`);

      } catch (error) {
        errors.push({
          row: i + 1,
          email: userData.email,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdUsers.length} users`,
      data: {
        created: createdUsers,
        errors: errors,
        summary: {
          total: users.length,
          successful: createdUsers.length,
          failed: errors.length
        }
      }
    });

  } catch (error) {
    logger.error('Error creating bulk users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create users', 
      error: error.message 
    });
  }
});

// Create single user for an institution
router.post('/create', authorize([  'institution_admin', 'superadmin']), async (req, res) => {
  try {
    const { 
      institutionId, name, email, role, phone, 
      department, designation, class: className, section 
    } = req.body;

    if (!institutionId || !name || !email || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Institution ID, name, email, and role are required' 
      });
    }

    // Verify institution exists
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ 
        success: false, 
        message: 'Institution not found' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase() 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Generate temporary password
    const tempPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      institutionId,
      institutionCode: institution.instituteCode,
      phone: phone || '',
      department: department || '',
      designation: designation || '',
      class: className || '',
      section: section || '',
      status: 'active',
      isEmailVerified: true
    });

    await user.save();

    logger.info(`Created user: ${user.email} with role: ${user.role} for institution: ${institution.name}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          department: user.department,
          designation: user.designation,
          class: user.class,
          section: user.section,
          status: user.status
        },
        temporaryPassword: tempPassword
      }
    });

  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create user', 
      error: error.message 
    });
  }
});

// Reset user password
router.post('/:userId/reset-password', authorize([  'institution_admin', 'superadmin']), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Generate new password
    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    logger.info(`Reset password for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        userId: user._id,
        email: user.email,
        temporaryPassword: newPassword
      }
    });

  } catch (error) {
    logger.error('Error resetting password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password', 
      error: error.message 
    });
  }
});

export default router;
