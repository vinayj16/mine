import express from 'express';
import mongoose from 'mongoose';
import { optionalAuth } from '../middleware/authMiddleware.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Helper to check if string is valid MongoDB ObjectId
const isValidObjectId = (str) => {
  if (!str) return false;
  return mongoose.Types.ObjectId.isValid(str) && str.toString().length === 24;
};

// Get all notifications (for authenticated user or public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { limit = 10, unreadOnly = false, page = 1 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = { isActive: true };

    // If user is authenticated with valid ID, filter by their notifications
    if (req.user && req.user.id && isValidObjectId(req.user.id)) {
      query.$or = [
        { recipientId: req.user.id },
        { recipientId: new mongoose.Types.ObjectId(req.user.id) }
      ];
    }

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      totalCount: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.json({
      success: true,
      data: [],
      unreadCount: 0,
      totalCount: 0,
      page: 1,
      totalPages: 0
    });
  }
});

// Get unread count
router.get('/unread-count', optionalAuth, async (req, res) => {
  try {
    let query = { isActive: true, isRead: false };

    if (req.user && req.user.id && isValidObjectId(req.user.id)) {
      query.$or = [
        { recipientId: req.user.id },
        { recipientId: new mongoose.Types.ObjectId(req.user.id) }
      ];
    }

    const count = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.json({
      success: true,
      data: { count: 0 }
    });
  }
});

// Mark notification as read
router.patch('/:id/read', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', optionalAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.id || !isValidObjectId(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    await Notification.updateMany(
      { 
        recipientId: req.user.id,
        isRead: false 
      },
      { isRead: true }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// Delete notification
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }
    
    const notification = await Notification.findByIdAndDelete(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

export default router;
