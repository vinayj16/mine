import express from 'express';
import { authenticate, authorize } from '../middleware/authGuard.js';
import ContactMessage from '../models/ContactMessage.js';

const router = express.Router();

router.get('/', authenticate, authorize('superadmin', 'admin', 'institution_admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: { $ne: true } };
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [messages, total] = await Promise.all([
      ContactMessage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      ContactMessage.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: messages,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }
    const contactMessage = await ContactMessage.create({ name, email, phone, subject, message });
    res.status(201).json({ success: true, data: contactMessage, message: 'Message sent successfully' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
  }
});

router.put('/:id', authenticate, authorize('superadmin', 'admin', 'institution_admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const update = {};
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes;
    update.respondedAt = status === 'responded' ? new Date() : undefined;

    const message = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    res.json({ success: true, data: message, message: 'Message updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update message', error: error.message });
  }
});

router.delete('/:id', authenticate, authorize('superadmin', 'admin', 'institution_admin'), async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: { isDeleted: true } }, { new: true });
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete message', error: error.message });
  }
});

export default router;
