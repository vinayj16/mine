import express from 'express';
import { authenticate, authorize } from '../middleware/authGuard.js';
import FileManager from '../models/FileManager.js';
import User from '../models/User.js';

const router = express.Router();

// All files routes require authentication
router.use(authenticate);

// Get all files with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { userId, type, fileType, search, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = { ownerId: req.user.id, status: 'active' };
    
    // If admin or superadmin, allow filtering by any userId
    if (userId && ['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.ownerId = userId;
    }
    
    if (type) {
      query.type = type;
    }
    if (fileType) {
      query.fileType = fileType;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [files, total] = await Promise.all([
      FileManager.find(query)
        .populate('ownerId', 'name email avatar')
        .populate('parentId', 'name type')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      FileManager.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: files,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch files', error: error.message });
  }
});

// Get file statistics
router.get('/statistics', async (req, res) => {
  try {
    const query = { ownerId: req.user.id, status: 'active' };
    
    // If admin or superadmin, allow filtering by any userId
    if (req.query.userId && ['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.ownerId = req.query.userId;
    }
    
    const [
      total,
      files,
      folders,
      shared,
      favorites,
      totalSizeAgg,
      typeStats
    ] = await Promise.all([
      FileManager.countDocuments(query),
      FileManager.countDocuments({ ...query, type: 'file' }),
      FileManager.countDocuments({ ...query, type: 'folder' }),
      FileManager.countDocuments({ ...query, isShared: true }),
      FileManager.countDocuments({ ...query, isFavorite: true }),
      FileManager.aggregate([
        { $match: query },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]),
      FileManager.aggregate([
        { $match: query },
        { $group: { _id: '$fileType', count: { $sum: 1 } } }
      ])
    ]);

    const totalSize = totalSizeAgg.length > 0 ? totalSizeAgg[0].totalSize : 0;
    
    const byType = typeStats.reduce((acc, type) => {
      acc[type._id] = type.count;
      return acc;
    }, {});

    const stats = {
      total,
      files,
      folders,
      totalSize,
      shared,
      favorites,
      byType
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
});

// Get storage information
router.get('/storage', async (req, res) => {
  try {
    const { ownerId } = req.query;
    
    let userFiles = await FileManager.find({ ownerId: req.user.id, status: 'active' });
    if (ownerId) {
      userFiles = await FileManager.find({ ownerId, status: 'active' });
    }

    const totalSize = userFiles.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 100 * 1024 * 1024; // 100MB limit
    const usedPercentage = (totalSize / maxSize) * 100;

    const storageInfo = {
      used: totalSize,
      max: maxSize,
      available: maxSize - totalSize,
      usedPercentage: Math.round(usedPercentage * 100) / 100,
      fileCount: userFiles.length
    };

    res.json({
      success: true,
      data: storageInfo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch storage info', error: error.message });
  }
});

// Get single file
router.get('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id, status: 'active' };
    
    // If not admin or superadmin, only allow user's own files
    if (!['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.ownerId = req.user.id;
    }
    
    const file = await FileManager.findOne(query)
      .populate('ownerId', 'name email avatar')
      .populate('parentId', 'name type')
      .populate('sharedWith', 'name email avatar');
    
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch file', error: error.message });
  }
});

// Create new file/folder
router.post('/', async (req, res) => {
  try {
    const { name, type, fileType, size, downloadUrl, parentId, description, tags, color } = req.body;
    
    const fileData = {
      name,
      type: type || 'file',
      fileType: fileType || 'other',
      size: size || 0,
      downloadUrl: downloadUrl || '',
      parentId: parentId || null,
      description: description || '',
      ownerId: req.user.id,
      ownerName: req.user.name,
      ownerImg: req.user.avatar || null,
      institutionId: req.user.institutionId || null,
      tags: tags || [],
      color: color || null,
      isShared: false,
      isFavorite: false,
      status: 'active'
    };

    const newFile = new FileManager(fileData);
    await newFile.save();
    
    // Populate references
    await newFile.populate('ownerId', 'name email avatar');
    if (newFile.parentId) {
      await newFile.populate('parentId', 'name type');
    }

    res.status(201).json({
      success: true,
      data: newFile,
      message: 'File created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create file', error: error.message });
  }
});

// Update file/folder
router.put('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id, status: 'active' };
    
    // If not admin or superadmin, only allow user's own files
    if (!['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.ownerId = req.user.id;
    }
    
    const file = await FileManager.findOne(query);
    
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Update allowed fields
    const allowedFields = ['name', 'description', 'tags', 'color', 'isFavorite', 'isShared', 'sharedWith', 'permissions'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        file[field] = req.body[field];
      }
    });
    
    await file.save();
    await file.populate('ownerId', 'name email avatar');
    if (file.parentId) {
      await file.populate('parentId', 'name type');
    }

    res.json({
      success: true,
      data: file,
      message: 'File updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update file', error: error.message });
  }
});

// Delete file/folder (move to trash)
router.delete('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // If not admin or superadmin, only allow user's own files
    if (!['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.ownerId = req.user.id;
    }
    
    const file = await FileManager.findOne(query);
    
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Move to trash instead of permanent delete
    file.status = 'trash';
    await file.save();

    res.json({
      success: true,
      message: 'File moved to trash'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete file', error: error.message });
  }
});

export default router;
