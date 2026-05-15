import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';

const router = express.Router();
const SUPPORT_MANAGERS = ['admin', 'principal', 'institution_admin', 'super_admin', 'superadmin', 'agent'];
const VALID_TICKET_STATUSES = ['open', 'in-progress', 'pending', 'resolved', 'closed', 'reopened'];

// All support tickets routes require authentication
router.use(protect);

// Get all support tickets with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, category, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { isDeleted: false };
    
    if (status) {
      query.status = status;
    }
    if (priority) {
      query['priority.level'] = priority;
    }
    if (category) {
      query['category.primary'] = category;
    }
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'requester.name': { $regex: search, $options: 'i' } },
        { 'requester.email': { $regex: search, $options: 'i' } }
      ];
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('requester.userId', 'name email')
        .populate('assignment.assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      SupportTicket.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tickets', error: error.message });
  }
});

// Get support ticket statistics
router.get('/statistics', async (req, res) => {
  try {
    const query = { isDeleted: false };
    
    const [
      total,
      open,
      inProgress,
      resolved,
      closed,
      highPriority,
      mediumPriority,
      lowPriority,
      urgentPriority,
      criticalPriority
    ] = await Promise.all([
      SupportTicket.countDocuments(query),
      SupportTicket.countDocuments({ ...query, status: 'open' }),
      SupportTicket.countDocuments({ ...query, status: 'in-progress' }),
      SupportTicket.countDocuments({ ...query, status: 'resolved' }),
      SupportTicket.countDocuments({ ...query, status: 'closed' }),
      SupportTicket.countDocuments({ ...query, 'priority.level': 'high' }),
      SupportTicket.countDocuments({ ...query, 'priority.level': 'medium' }),
      SupportTicket.countDocuments({ ...query, 'priority.level': 'low' }),
      SupportTicket.countDocuments({ ...query, 'priority.level': 'urgent' }),
      SupportTicket.countDocuments({ ...query, 'priority.level': 'critical' })
    ]);

    const categoryStats = await SupportTicket.aggregate([
      { $match: query },
      { $group: { _id: '$category.primary', count: { $sum: 1 } } }
    ]);

    const byCategory = categoryStats.reduce((acc, cat) => {
      acc[cat._id] = cat.count;
      return acc;
    }, {});

    const stats = {
      total,
      open,
      inProgress,
      resolved,
      closed,
      highPriority,
      mediumPriority,
      lowPriority,
      urgentPriority,
      criticalPriority,
      byCategory
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
});

// Get single support ticket
router.get('/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ 
      _id: req.params.id, 
      isDeleted: false 
    })
      .populate('requester.userId', 'name email')
      .populate('assignment.assignedTo', 'name email')
      .populate('relatedTickets', 'ticketNumber subject status');
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch ticket', error: error.message });
  }
});

// Create new support ticket
router.post('/', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const { subject, description, priority, category, requesterName, requesterEmail, requesterPhone } = req.body;
    
    // Generate unique ticket number
    const ticketNumber = 'TKT-' + Date.now().toString().slice(-8);
    
    const ticketData = {
      ticketNumber,
      subject,
      description,
      priority: {
        level: priority || 'medium'
      },
      category: {
        primary: category || 'general'
      },
      requester: {
        name: requesterName || req.user.name,
        email: requesterEmail || req.user.email,
        phone: requesterPhone,
        userId: req.user.id,
        institutionId: req.user.institutionId,
        role: req.user.role || 'guest'
      },
      createdBy: req.user.id
    };

    const newTicket = new SupportTicket(ticketData);
    await newTicket.save();

    // Populate references
    await newTicket.populate('requester.userId', 'name email');

    res.status(201).json({
      success: true,
      data: newTicket,
      message: 'Ticket created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create ticket', error: error.message });
  }
});

// Update support ticket
router.put('/:id', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const { status, priority, category, assignment, resolution } = req.body;
    
    const ticket = await SupportTicket.findOne({ 
      _id: req.params.id, 
      isDeleted: false 
    });
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Update fields
    if (status) {
      await ticket.updateStatus(status, req.user.id);
    }
    
    if (priority) {
      ticket.priority.level = priority;
    }
    
    if (category) {
      ticket.category.primary = category;
    }
    
    if (assignment && assignment.assignedTo) {
      await ticket.assignTo(assignment.assignedTo, req.user.id);
    }
    
    if (resolution) {
      ticket.resolution = {
        ...resolution,
        resolvedBy: req.user.id,
        resolvedAt: new Date()
      };
    }
    
    ticket.updatedBy = req.user.id;
    await ticket.save();
    
    // Populate references
    await ticket.populate('requester.userId', 'name email');
    await ticket.populate('assignment.assignedTo', 'name email');

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update ticket', error: error.message });
  }
});

// Update support ticket status
router.patch('/:id/status', authorize(SUPPORT_MANAGERS), async (req, res) => {
  try {
    const { status } = req.body;

    if (!VALID_TICKET_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_TICKET_STATUSES.join(', ')}`
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    await ticket.updateStatus(status, req.user.id);
    await ticket.populate('requester.userId', 'name email');
    await ticket.populate('assignment.assignedTo', 'name email');

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket status updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update ticket status', error: error.message });
  }
});

// Delete support ticket
router.delete('/:id', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ 
      _id: req.params.id, 
      isDeleted: false 
    });
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Soft delete
    ticket.isDeleted = true;
    ticket.updatedBy = req.user.id;
    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete ticket', error: error.message });
  }
});

export default router;
