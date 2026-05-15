import express from 'express';
import { authenticate, authorize } from '../middleware/authGuard.js';
import { enforceInstitutionCommunication } from '../middleware/institutionIsolation.js';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import logger from '../utils/logger.js';

const router = express.Router();
router.use(authenticate);

// Send email within institution
router.post('/email/send', enforceInstitutionCommunication, async (req, res) => {
  try {
    const { 
      recipientEmails, 
      subject, 
      message, 
      attachments,
      priority = 'normal'
    } = req.body;

    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipient emails are required'
      });
    }

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    const sender = req.user;
    const results = [];

    for (const email of recipientEmails) {
      try {
        // Verify recipient is in same institution
        const recipient = await User.findOne({ 
          email: email.toLowerCase(),
          institutionId: sender.institutionId 
        });

        if (!recipient) {
          results.push({
            email,
            status: 'failed',
            error: 'User not found in your institution'
          });
          continue;
        }

        // Here you would integrate with your email service
        // For now, we'll just log the email
        logger.info(`Email sent from ${sender.email} to ${email}: ${subject}`);
        
        results.push({
          email,
          status: 'sent',
          recipientName: recipient.name
        });

      } catch (error) {
        results.push({
          email,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Email communication processed',
      data: {
        sent: results.filter(r => r.status === 'sent'),
        failed: results.filter(r => r.status === 'failed'),
        summary: {
          total: recipientEmails.length,
          successful: results.filter(r => r.status === 'sent').length,
          failed: results.filter(r => r.status === 'failed').length
        }
      }
    });

  } catch (error) {
    logger.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Get institution members for communication
router.get('/members', async (req, res) => {
  try {
    const user = req.user;
    const { role, search } = req.query;

    // Build query
    const query = { 
      institutionId: user.institutionId,
      status: 'active'
    };

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const members = await User.find(query)
      .select('name email role department designation class section')
      .sort({ name: 1 });

    // Group by role
    const groupedMembers = members.reduce((acc, member) => {
      if (!acc[member.role]) {
        acc[member.role] = [];
      }
      acc[member.role].push(member);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        members,
        groupedMembers,
        total: members.length,
        summary: Object.keys(groupedMembers).map(role => ({
          role,
          count: groupedMembers[role].length
        }))
      }
    });

  } catch (error) {
    logger.error('Error fetching institution members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      error: error.message
    });
  }
});

// Send internal message/chat
router.post('/message/send', enforceInstitutionCommunication, async (req, res) => {
  try {
    const { 
      recipientId, 
      message, 
      messageType = 'text',
      attachments = []
    } = req.body;

    if (!recipientId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and message are required'
      });
    }

    const sender = req.user;

    // Verify recipient is in same institution
    const recipient = await User.findOne({ 
      _id: recipientId,
      institutionId: sender.institutionId 
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found in your institution'
      });
    }

    // Create message object (you would typically save this to a Message/Chat collection)
    const messageData = {
      senderId: sender._id,
      senderName: sender.name,
      senderEmail: sender.email,
      recipientId: recipient._id,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      message,
      messageType,
      attachments,
      institutionId: sender.institutionId,
      timestamp: new Date(),
      status: 'sent',
      read: false
    };

    // Here you would save to your Message/Chat collection
    // For now, we'll just log and return success
    logger.info(`Message sent from ${sender.email} to ${recipient.email}`);

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...messageData
      }
    });

  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Get conversation history
router.get('/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUser = req.user;

    // Verify the other user is in same institution
    const otherUser = await User.findOne({ 
      _id: userId,
      institutionId: currentUser.institutionId 
    });

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found in your institution'
      });
    }

    // Here you would fetch from your Message/Chat collection
    // For now, return empty conversation
    const messages = []; // This would be populated from your database

    res.json({
      success: true,
      data: {
        messages,
        otherUser: {
          id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          role: otherUser.role
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.length
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: error.message
    });
  }
});

// Get all conversations for current user
router.get('/conversations', async (req, res) => {
  try {
    const currentUser = req.user;
    const { page = 1, limit = 20 } = req.query;

    // Here you would fetch from your Message/Chat collection
    // For now, return empty list
    const conversations = []; // This would be populated from your database

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: conversations.length
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
});

// Send broadcast message to institution members
router.post('/broadcast', authorize([  'institution_admin', 'principal']), async (req, res) => {
  try {
    const { 
      message, 
      targetRoles = [], // Empty means all roles
      messageType = 'announcement',
      priority = 'normal'
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const sender = req.user;

    // Build recipient query
    const recipientQuery = { 
      institutionId: sender.institutionId,
      status: 'active'
    };

    if (targetRoles.length > 0) {
      recipientQuery.role = { $in: targetRoles };
    }

    const recipients = await User.find(recipientQuery)
      .select('name email role');

    if (recipients.length === 0) {
      return res.json({
        success: true,
        message: 'No recipients found',
        data: {
          sent: 0,
          recipients: []
        }
      });
    }

    // Create broadcast message
    const broadcastData = {
      senderId: sender._id,
      senderName: sender.name,
      senderEmail: sender.email,
      message,
      messageType,
      priority,
      targetRoles,
      institutionId: sender.institutionId,
      timestamp: new Date(),
      recipientCount: recipients.length
    };

    // Here you would save to your Message/Notification collection
    // and potentially send push notifications/emails
    logger.info(`Broadcast sent by ${sender.email} to ${recipients.length} members`);

    res.json({
      success: true,
      message: 'Broadcast sent successfully',
      data: {
        ...broadcastData,
        recipients: recipients.map(r => ({
          id: r._id,
          name: r.name,
          email: r.email,
          role: r.role
        }))
      }
    });

  } catch (error) {
    logger.error('Error sending broadcast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast',
      error: error.message
    });
  }
});

// Get communication statistics
router.get('/statistics', authorize([  'institution_admin', 'principal']), async (req, res) => {
  try {
    const currentUser = req.user;
    const { period = '30' } = req.query; // Default to last 30 days

    // Calculate date range
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Here you would fetch from your communication collections
    // For now, return mock statistics
    const statistics = {
      totalMessages: 0,
      totalEmails: 0,
      totalBroadcasts: 0,
      activeConversations: 0,
      period: `${period} days`,
      breakdown: {
        byRole: {},
        byDay: []
      }
    };

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Error fetching communication statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

export default router;
