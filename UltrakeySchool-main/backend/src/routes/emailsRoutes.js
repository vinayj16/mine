import express from 'express';
import { authenticate, authorize } from '../middleware/authGuard.js';
import Email from '../models/Email.js';
import User from '../models/User.js';

const router = express.Router();

// All emails routes require authentication
router.use(authenticate);

// Get all emails with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { userId, folder, isRead, isStarred, isImportant, search, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = { userId: req.user.id };
    
    // If admin or superadmin, allow filtering by any userId
    if (userId && ['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.userId = userId;
    }
    
    if (folder) {
      query.folder = folder;
    }
    
    // Exclude trash folder by default
    if (folder !== 'trash') {
      query.folder = { $ne: 'trash' };
    }

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [emails, total] = await Promise.all([
      Email.find(query)
        .populate('sender.userId', 'name email avatar')
        .populate('recipients.userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Email.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: emails,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch emails', error: error.message });
  }
});

// Get email statistics
router.get('/statistics', async (req, res) => {
  try {
    const query = { userId: req.user.id };
    
    // If admin or superadmin, allow filtering by any userId
    if (req.query.userId && ['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.userId = req.query.userId;
    }
    
    const [
      total,
      inbox,
      sent,
      drafts,
      trash,
      unread,
      starred,
      important,
      attachments
    ] = await Promise.all([
      Email.countDocuments(query),
      Email.countDocuments({ ...query, folder: 'inbox' }),
      Email.countDocuments({ ...query, folder: 'sent' }),
      Email.countDocuments({ ...query, folder: 'drafts' }),
      Email.countDocuments({ ...query, folder: 'trash' }),
      Email.countDocuments({ ...query, isRead: false }),
      Email.countDocuments({ ...query, isStarred: true }),
      Email.countDocuments({ ...query, isImportant: true }),
      Email.countDocuments({ ...query, hasAttachment: true })
    ]);

    const stats = {
      total,
      inbox,
      sent,
      drafts,
      trash,
      unread,
      starred,
      important,
      attachments
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
});

// Get single email
router.get('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // If not admin or superadmin, only allow user's own emails
    if (!['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.userId = req.user.id;
    }
    
    const email = await Email.findOne(query)
      .populate('sender.userId', 'name email avatar')
      .populate('recipients.userId', 'name email')
      .populate('threadId');
    
    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    res.json({
      success: true,
      data: email
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch email', error: error.message });
  }
});

// Create new email
router.post('/', async (req, res) => {
  try {
    const { to, cc, bcc, subject, content, htmlContent, attachments, priority } = req.body;
    
    const recipients = [];
    
    // Process recipients
    if (to && Array.isArray(to)) {
      to.forEach(email => {
        recipients.push({ email, type: 'to' });
      });
    }
    if (cc && Array.isArray(cc)) {
      cc.forEach(email => {
        recipients.push({ email, type: 'cc' });
      });
    }
    if (bcc && Array.isArray(bcc)) {
      bcc.forEach(email => {
        recipients.push({ email, type: 'bcc' });
      });
    }
    
    const emailData = {
      sender: {
        userId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar || null
      },
      recipients,
      subject,
      content,
      htmlContent,
      attachments: attachments || [],
      priority: priority || 'normal',
      folder: 'sent',
      status: 'sent',
      userId: req.user.id,
      institutionId: req.user.institutionId || null
    };

    const newEmail = new Email(emailData);
    await newEmail.save();
    
    // Populate references
    await newEmail.populate('sender.userId', 'name email avatar');
    await newEmail.populate('recipients.userId', 'name email');

    res.status(201).json({
      success: true,
      data: newEmail,
      message: 'Email sent successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
});

// Delete email (move to trash)
router.delete('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // If not admin or superadmin, only allow user's own emails
    if (!['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.userId = req.user.id;
    }
    
    const email = await Email.findOne(query);
    
    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    // Move to trash instead of permanent delete
    email.folder = 'trash';
    await email.save();

    res.json({
      success: true,
      message: 'Email moved to trash'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete email', error: error.message });
  }
});

// Update email
router.put('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // If not admin or superadmin, only allow user's own emails
    if (!['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.userId = req.user.id;
    }
    
    const email = await Email.findOne(query);
    
    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    // Update allowed fields
    const allowedFields = ['isRead', 'isStarred', 'isImportant', 'folder', 'tags', 'labels', 'priority'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        email[field] = req.body[field];
      }
    });
    
    await email.save();
    await email.populate('sender.userId', 'name email avatar');
    await email.populate('recipients.userId', 'name email');

    res.json({
      success: true,
      data: email,
      message: 'Email updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update email', error: error.message });
  }
});

// Mark email as read/unread
router.patch('/:id/read', async (req, res) => {
  try {
    const { isRead } = req.body;
    const query = { _id: req.params.id };
    
    // If not admin or superadmin, only allow user's own emails
    if (!['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.userId = req.user.id;
    }
    
    const email = await Email.findOne(query);
    
    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    email.isRead = isRead;
    await email.save();

    res.json({
      success: true,
      data: email,
      message: `Email marked as ${isRead ? 'read' : 'unread'}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update email', error: error.message });
  }
});

// Star/unstar email
router.patch('/:id/star', async (req, res) => {
  try {
    const { isStarred } = req.body;
    const query = { _id: req.params.id };
    
    // If not admin or superadmin, only allow user's own emails
    if (!['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.userId = req.user.id;
    }
    
    const email = await Email.findOne(query);
    
    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    email.isStarred = isStarred;
    await email.save();

    res.json({
      success: true,
      data: email,
      message: `Email ${isStarred ? 'starred' : 'unstarred'}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update email', error: error.message });
  }
});

// Mark email as important/unimportant
router.patch('/:id/important', async (req, res) => {
  try {
    const { isImportant } = req.body;
    const emailIndex = mockEmails.findIndex(e => e._id === req.params.id);
    
    if (emailIndex === -1) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    mockEmails[emailIndex].isImportant = isImportant;
    mockEmails[emailIndex].updatedAt = new Date();

    res.json({
      success: true,
      data: mockEmails[emailIndex],
      message: `Email marked as ${isImportant ? 'important' : 'not important'}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update email', error: error.message });
  }
});

// Move email to folder
router.patch('/:id/move', async (req, res) => {
  try {
    const { folder } = req.body;
    const emailIndex = mockEmails.findIndex(e => e._id === req.params.id);
    
    if (emailIndex === -1) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    const validFolders = ['inbox', 'sent', 'drafts', 'trash'];
    if (!validFolders.includes(folder)) {
      return res.status(400).json({ success: false, message: 'Invalid folder' });
    }

    mockEmails[emailIndex].folder = folder;
    mockEmails[emailIndex].updatedAt = new Date();

    res.json({
      success: true,
      data: mockEmails[emailIndex],
      message: `Email moved to ${folder}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to move email', error: error.message });
  }
});

// Delete email (move to trash)
router.delete('/:id', async (req, res) => {
  try {
    const emailIndex = mockEmails.findIndex(e => e._id === req.params.id);
    
    if (emailIndex === -1) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    // Move to trash if not already there
    if (mockEmails[emailIndex].folder !== 'trash') {
      mockEmails[emailIndex].folder = 'trash';
      mockEmails[emailIndex].updatedAt = new Date();
    } else {
      // Permanent delete if already in trash
      mockEmails.splice(emailIndex, 1);
    }

    res.json({
      success: true,
      message: mockEmails[emailIndex] ? 'Email moved to trash' : 'Email permanently deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete email', error: error.message });
  }
});

export default router;
