import SupportTicket from '../models/SupportTicket.js';
import mongoose from 'mongoose';

class SupportTicketService {
  async generateTicketNumber() {
    const count = await SupportTicket.countDocuments();
    const year = new Date().getFullYear();
    const number = String(count + 1).padStart(6, '0');
    return `TKT-${year}-${number}`;
  }

  async createTicket(ticketData) {
    const ticketNumber = await this.generateTicketNumber();
    
    const ticket = new SupportTicket({
      ...ticketData,
      ticketNumber,
      timeline: {
        createdAt: new Date()
      }
    });
    
    return await ticket.save();
  }

  async getTicketById(ticketId) {
    return await SupportTicket.findById(ticketId)
      .populate('assignment.assignedTo', 'name email')
      .populate('assignment.assignedBy', 'name email')
      .populate('resolution.resolvedBy', 'name email')
      .populate('relatedTickets', 'ticketNumber subject status');
  }

  async getTicketByNumber(ticketNumber) {
    return await SupportTicket.findOne({ ticketNumber })
      .populate('assignment.assignedTo', 'name email')
      .populate('assignment.assignedBy', 'name email')
      .populate('resolution.resolvedBy', 'name email')
      .populate('relatedTickets', 'ticketNumber subject status');
  }

  async getAllTickets(filters = {}, options = {}) {
    const {
      status,
      priority,
      category,
      assignedTo,
      requesterEmail,
      source,
      startDate,
      endDate,
      search
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const query = { isDeleted: false };

    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    if (priority) {
      if (Array.isArray(priority)) {
        query['priority.level'] = { $in: priority };
      } else {
        query['priority.level'] = priority;
      }
    }

    if (category) {
      query['category.primary'] = category;
    }

    if (assignedTo) {
      query['assignment.assignedTo'] = assignedTo;
    }

    if (requesterEmail) {
      query['requester.email'] = requesterEmail;
    }

    if (source) {
      query.source = source;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'requester.name': { $regex: search, $options: 'i' } },
        { 'requester.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('assignment.assignedTo', 'name email')
        .populate('assignment.assignedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      SupportTicket.countDocuments(query)
    ]);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateTicket(ticketId, updateData) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    Object.assign(ticket, updateData);
    return await ticket.save();
  }

  async updateTicketStatus(ticketId, status, userId) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return await ticket.updateStatus(status, userId);
  }

  async deleteTicket(ticketId) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.isDeleted = true;
    return await ticket.save();
  }

  async addMessage(ticketId, messageData) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const message = {
      id: new mongoose.Types.ObjectId().toString(),
      ...messageData,
      timestamp: new Date()
    };

    return await ticket.addMessage(message);
  }

  async getTicketMessages(ticketId) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return ticket.communication.messages;
  }

  async assignTicket(ticketId, userId, assignedBy, team, department) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (team) ticket.assignment.team = team;
    if (department) ticket.assignment.department = department;

    return await ticket.assignTo(userId, assignedBy);
  }

  async reassignTicket(ticketId, newUserId, assignedBy, reason) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.assignment.assignedTo) {
      ticket.assignment.reassignmentHistory.push({
        from: ticket.assignment.assignedTo,
        to: newUserId,
        reason,
        timestamp: new Date()
      });
      ticket.assignment.reassignmentCount += 1;
    }

    ticket.assignment.assignedTo = newUserId;
    ticket.assignment.assignedBy = assignedBy;
    ticket.assignment.assignedAt = new Date();

    return await ticket.save();
  }

  async escalateTicket(ticketId, level, reason, escalatedBy, escalatedTo) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return await ticket.escalate(level, reason, escalatedBy, escalatedTo);
  }

  async resolveTicket(ticketId, resolutionData, userId) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.resolution = {
      ...resolutionData,
      resolvedBy: userId,
      resolvedAt: new Date()
    };

    ticket.status = 'resolved';
    ticket.timeline.resolvedAt = new Date();
    ticket.timeline.resolutionTime = ticket.timeline.resolvedAt - ticket.timeline.createdAt;

    return await ticket.save();
  }

  async closeTicket(ticketId, userId) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return await ticket.updateStatus('closed', userId);
  }

  async reopenTicket(ticketId, reason, userId) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.status = 'reopened';
    ticket.timeline.reopenedAt = new Date();
    ticket.timeline.resolvedAt = null;
    ticket.timeline.closedAt = null;
    ticket.updatedBy = userId;

    const message = {
      id: new mongoose.Types.ObjectId().toString(),
      sender: {
        name: 'System',
        role: 'system'
      },
      content: `Ticket reopened. Reason: ${reason}`,
      timestamp: new Date(),
      type: 'system',
      visibility: 'internal'
    };

    ticket.communication.messages.push(message);

    return await ticket.save();
  }

  async addAttachment(ticketId, attachmentData) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.attachments.push({
      ...attachmentData,
      uploadedAt: new Date()
    });

    return await ticket.save();
  }

  async linkRelatedTickets(ticketId, relatedTicketIds) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.relatedTickets = [...new Set([...ticket.relatedTickets, ...relatedTicketIds])];
    return await ticket.save();
  }

  async submitSatisfactionSurvey(ticketId, surveyData) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.satisfaction = {
      ...ticket.satisfaction,
      ...surveyData,
      surveyCompleted: true,
      surveyCompletedAt: new Date()
    };

    return await ticket.save();
  }

  async sendSatisfactionSurvey(ticketId) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.satisfaction.surveySent = true;
    ticket.satisfaction.surveySentAt = new Date();

    return await ticket.save();
  }

  async getTicketsByStatus(status) {
    return await SupportTicket.find({ status, isDeleted: false })
      .populate('assignment.assignedTo', 'name email')
      .sort({ createdAt: -1 });
  }

  async getTicketsByPriority(priority) {
    return await SupportTicket.find({ 'priority.level': priority, isDeleted: false })
      .populate('assignment.assignedTo', 'name email')
      .sort({ createdAt: -1 });
  }

  async getTicketsByCategory(category) {
    return await SupportTicket.find({ 'category.primary': category, isDeleted: false })
      .populate('assignment.assignedTo', 'name email')
      .sort({ createdAt: -1 });
  }

  async getTicketsByRequester(email) {
    return await SupportTicket.find({ 'requester.email': email, isDeleted: false })
      .populate('assignment.assignedTo', 'name email')
      .sort({ createdAt: -1 });
  }

  async getTicketsByAssignee(userId) {
    return await SupportTicket.find({ 'assignment.assignedTo': userId, isDeleted: false })
      .populate('assignment.assignedTo', 'name email')
      .sort({ createdAt: -1 });
  }

  async getOverdueTickets() {
    const now = new Date();
    
    const tickets = await SupportTicket.find({
      status: { $in: ['open', 'in-progress', 'pending'] },
      isDeleted: false
    }).populate('assignment.assignedTo', 'name email');

    return tickets.filter(ticket => {
      if (!ticket.priority.sla || !ticket.priority.sla.resolutionTime) {
        return false;
      }

      const deadline = new Date(ticket.timeline.createdAt.getTime() + ticket.priority.sla.resolutionTime * 60000);
      return now > deadline;
    });
  }

  async getTicketsRequiringEscalation() {
    const now = new Date();
    
    const tickets = await SupportTicket.find({
      status: { $in: ['open', 'in-progress', 'pending'] },
      'priority.autoEscalate': true,
      isDeleted: false
    }).populate('assignment.assignedTo', 'name email');

    return tickets.filter(ticket => {
      if (!ticket.priority.escalationThreshold) {
        return false;
      }

      const threshold = new Date(ticket.timeline.createdAt.getTime() + ticket.priority.escalationThreshold * 60000);
      return now > threshold && !ticket.timeline.escalatedAt;
    });
  }

  async searchTickets(searchTerm) {
    return await SupportTicket.find({
      $or: [
        { ticketNumber: { $regex: searchTerm, $options: 'i' } },
        { subject: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'requester.name': { $regex: searchTerm, $options: 'i' } },
        { 'requester.email': { $regex: searchTerm, $options: 'i' } }
      ],
      isDeleted: false
    })
      .populate('assignment.assignedTo', 'name email')
      .sort({ createdAt: -1 });
  }

  async getTicketStatistics() {
    const [
      total,
      open,
      inProgress,
      pending,
      resolved,
      closed,
      reopened,
      byPriority,
      byCategory,
      avgResolutionTime,
      avgResponseTime
    ] = await Promise.all([
      SupportTicket.countDocuments({ isDeleted: false }),
      SupportTicket.countDocuments({ status: 'open', isDeleted: false }),
      SupportTicket.countDocuments({ status: 'in-progress', isDeleted: false }),
      SupportTicket.countDocuments({ status: 'pending', isDeleted: false }),
      SupportTicket.countDocuments({ status: 'resolved', isDeleted: false }),
      SupportTicket.countDocuments({ status: 'closed', isDeleted: false }),
      SupportTicket.countDocuments({ status: 'reopened', isDeleted: false }),
      SupportTicket.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$priority.level', count: { $sum: 1 } } }
      ]),
      SupportTicket.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$category.primary', count: { $sum: 1 } } }
      ]),
      SupportTicket.aggregate([
        { $match: { 'timeline.resolutionTime': { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$timeline.resolutionTime' } } }
      ]),
      SupportTicket.aggregate([
        { $match: { 'timeline.responseTime': { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$timeline.responseTime' } } }
      ])
    ]);

    return {
      total,
      byStatus: {
        open,
        inProgress,
        pending,
        resolved,
        closed,
        reopened
      },
      byPriority: byPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byCategory: byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      averageResolutionTime: avgResolutionTime[0]?.avg || 0,
      averageResponseTime: avgResponseTime[0]?.avg || 0
    };
  }

  async getTicketResolutionAnalytics(startDate, endDate) {
    const match = {
      'timeline.resolvedAt': { $exists: true, $ne: null },
      isDeleted: false
    };

    if (startDate || endDate) {
      match['timeline.resolvedAt'] = {};
      if (startDate) match['timeline.resolvedAt'].$gte = new Date(startDate);
      if (endDate) match['timeline.resolvedAt'].$lte = new Date(endDate);
    }

    const [
      resolutionStats,
      byPriority,
      byCategory,
      byAssignee
    ] = await Promise.all([
      SupportTicket.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalResolved: { $sum: 1 },
            avgResolutionTime: { $avg: '$timeline.resolutionTime' },
            minResolutionTime: { $min: '$timeline.resolutionTime' },
            maxResolutionTime: { $max: '$timeline.resolutionTime' }
          }
        }
      ]),
      SupportTicket.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$priority.level',
            count: { $sum: 1 },
            avgResolutionTime: { $avg: '$timeline.resolutionTime' }
          }
        }
      ]),
      SupportTicket.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$category.primary',
            count: { $sum: 1 },
            avgResolutionTime: { $avg: '$timeline.resolutionTime' }
          }
        }
      ]),
      SupportTicket.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$assignment.assignedTo',
            count: { $sum: 1 },
            avgResolutionTime: { $avg: '$timeline.resolutionTime' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      overall: resolutionStats[0] || {},
      byPriority,
      byCategory,
      topResolvers: byAssignee
    };
  }

  async getAgentPerformance(userId, startDate, endDate) {
    const match = {
      'assignment.assignedTo': mongoose.Types.ObjectId(userId),
      isDeleted: false
    };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const [
      totalAssigned,
      resolved,
      avgResolutionTime,
      avgResponseTime,
      satisfactionRatings
    ] = await Promise.all([
      SupportTicket.countDocuments(match),
      SupportTicket.countDocuments({ ...match, status: 'resolved' }),
      SupportTicket.aggregate([
        { $match: { ...match, 'timeline.resolutionTime': { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$timeline.resolutionTime' } } }
      ]),
      SupportTicket.aggregate([
        { $match: { ...match, 'timeline.responseTime': { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$timeline.responseTime' } } }
      ]),
      SupportTicket.aggregate([
        { $match: { ...match, 'satisfaction.rating': { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$satisfaction.rating' }, count: { $sum: 1 } } }
      ])
    ]);

    return {
      totalAssigned,
      resolved,
      resolutionRate: totalAssigned > 0 ? (resolved / totalAssigned) * 100 : 0,
      averageResolutionTime: avgResolutionTime[0]?.avg || 0,
      averageResponseTime: avgResponseTime[0]?.avg || 0,
      satisfactionScore: satisfactionRatings[0]?.avg || 0,
      satisfactionCount: satisfactionRatings[0]?.count || 0
    };
  }

  async getDashboardMetrics() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      openTickets,
      unassignedTickets,
      overdueTickets,
      newToday,
      resolvedToday,
      new7Days,
      resolved7Days,
      new30Days,
      resolved30Days,
      avgSatisfaction
    ] = await Promise.all([
      SupportTicket.countDocuments({ status: 'open', isDeleted: false }),
      SupportTicket.countDocuments({ status: 'open', 'assignment.assignedTo': null, isDeleted: false }),
      this.getOverdueTickets().then(tickets => tickets.length),
      SupportTicket.countDocuments({ createdAt: { $gte: last24Hours }, isDeleted: false }),
      SupportTicket.countDocuments({ status: 'resolved', 'timeline.resolvedAt': { $gte: last24Hours }, isDeleted: false }),
      SupportTicket.countDocuments({ createdAt: { $gte: last7Days }, isDeleted: false }),
      SupportTicket.countDocuments({ status: 'resolved', 'timeline.resolvedAt': { $gte: last7Days }, isDeleted: false }),
      SupportTicket.countDocuments({ createdAt: { $gte: last30Days }, isDeleted: false }),
      SupportTicket.countDocuments({ status: 'resolved', 'timeline.resolvedAt': { $gte: last30Days }, isDeleted: false }),
      SupportTicket.aggregate([
        { $match: { 'satisfaction.rating': { $exists: true }, isDeleted: false } },
        { $group: { _id: null, avg: { $avg: '$satisfaction.rating' } } }
      ])
    ]);

    return {
      current: {
        open: openTickets,
        unassigned: unassignedTickets,
        overdue: overdueTickets
      },
      today: {
        new: newToday,
        resolved: resolvedToday
      },
      last7Days: {
        new: new7Days,
        resolved: resolved7Days
      },
      last30Days: {
        new: new30Days,
        resolved: resolved30Days
      },
      satisfaction: {
        average: avgSatisfaction[0]?.avg || 0
      }
    };
  }
}

export default new SupportTicketService();
