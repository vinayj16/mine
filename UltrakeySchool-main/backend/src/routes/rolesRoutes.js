import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import Role from '../models/Role.js';
import User from '../models/User.js';

const router = express.Router();

// All roles routes require authentication
router.use(protect);

// Get all roles
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [roles, total] = await Promise.all([
      Role.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum),
      Role.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: roles,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch roles', error: error.message });
  }
});

// Get role statistics
router.get('/stats', async (req, res) => {
  try {
    const [total, rolesWithUsers] = await Promise.all([
      Role.countDocuments(),
      Role.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'role',
            as: 'users'
          }
        },
        {
          $project: {
            name: 1,
            description: 1,
            permissions: 1,
            userCount: { $size: '$users' }
          }
        },
        {
          $sort: { userCount: -1 }
        }
      ])
    ]);

    const stats = {
      total,
      rolesByUserCount: rolesWithUsers
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch role statistics', error: error.message });
  }
});

// Get single role
router.get('/:id', async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch role', error: error.message });
  }
});

// Create new role
router.post('/', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    const roleData = {
      name,
      description,
      permissions: permissions || []
    };

    const newRole = new Role(roleData);
    await newRole.save();

    res.status(201).json({
      success: true,
      data: newRole,
      message: 'Role created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create role', error: error.message });
  }
});

// Update role
router.put('/:id', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, description, permissions },
      { new: true, runValidators: true }
    );
    
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    res.json({
      success: true,
      data: role,
      message: 'Role updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update role', error: error.message });
  }
});

// Delete role
router.delete('/:id', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete role', error: error.message });
  }
});

export default router;
