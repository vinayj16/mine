import express from 'express';
import { authenticate, authorize } from '../middleware/authGuard.js';
import Note from '../models/Note.js';
import User from '../models/User.js';

const router = express.Router();

// All notes routes require authentication
router.use(authenticate);

// Get all notes with filtering
router.get('/', async (req, res) => {
  try {
    const { userId, status, priority, tag, search, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = { userId: req.user.id };
    
    // If admin or superadmin, allow filtering by any userId
    if (userId && ['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.userId = userId;
    }
    
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (tag) {
      query.tag = tag;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [notes, total] = await Promise.all([
      Note.find(query)
        .populate('userId', 'name email avatar')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Note.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: notes,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notes', error: error.message });
  }
});

// Get single note
router.get('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // If not admin or superadmin, only allow user's own notes
    if (!['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.userId = req.user.id;
    }
    
    const note = await Note.findOne(query)
      .populate('userId', 'name email avatar');
    
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch note', error: error.message });
  }
});

// Create new note
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, tag, important } = req.body;
    
    const noteData = {
      title,
      description,
      priority: priority || 'medium',
      tag: tag || 'personal',
      status: 'active',
      important: important || false,
      userId: req.user.id,
      userName: req.user.name,
      userAvatar: req.user.avatar || null,
      institutionId: req.user.institutionId || null
    };

    const newNote = new Note(noteData);
    await newNote.save();
    
    // Populate user info
    await newNote.populate('userId', 'name email avatar');

    res.status(201).json({
      success: true,
      data: newNote,
      message: 'Note created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create note', error: error.message });
  }
});

// Update note
router.put('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // If not admin or superadmin, only allow user's own notes
    if (!['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.userId = req.user.id;
    }
    
    const note = await Note.findOne(query);
    
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Update allowed fields
    const allowedFields = ['title', 'description', 'priority', 'tag', 'important', 'status'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        note[field] = req.body[field];
      }
    });
    
    await note.save();
    await note.populate('userId', 'name email avatar');

    res.json({
      success: true,
      data: note,
      message: 'Note updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update note', error: error.message });
  }
});

// Delete note (move to trash)
router.delete('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // If not admin or superadmin, only allow user's own notes
    if (!['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.userId = req.user.id;
    }
    
    const note = await Note.findOne(query);
    
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Move to trash instead of permanent delete
    note.status = 'trash';
    await note.save();

    res.json({
      success: true,
      message: 'Note moved to trash'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete note', error: error.message });
  }
});

// Restore note from trash
router.post('/:id/restore', async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // If not admin or superadmin, only allow user's own notes
    if (!['superadmin', 'admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.userId = req.user.id;
    }
    
    const note = await Note.findOne(query);
    
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    note.status = 'active';
    note.deletedAt = null;
    await note.save();

    res.json({
      success: true,
      message: 'Note restored from trash'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to restore note', error: error.message });
  }
});

// Permanent delete note
router.delete('/:id/permanent', authorize(['superadmin', 'admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id });
    
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    await Note.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Note permanently deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to permanently delete note', error: error.message });
  }
});

export default router;
