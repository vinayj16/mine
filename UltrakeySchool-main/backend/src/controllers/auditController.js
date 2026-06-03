import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { category, status, dateRange, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (category && category !== 'all') query.category = category;
    if (status && status !== 'all') query.status = status;

    if (dateRange) {
      const now = new Date();
      let startDate;
      switch (dateRange) {
        case '24h': startDate = new Date(now - 24 * 60 * 60 * 1000); break;
        case '7days': startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
        case '30days': startDate = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
        case '90days': startDate = new Date(now - 90 * 24 * 60 * 60 * 1000); break;
        default: startDate = null;
      }
      if (startDate) query.createdAt = { $gte: startDate };
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
  }
};

export const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found' });
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit log', error: error.message });
  }
};

export const createAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.create({
      ...req.body,
      userId: req.user?._id || req.body.userId,
      userName: req.user?.name || req.body.userName || 'System',
      userRole: req.user?.role || req.body.userRole || 'system',
      ipAddress: req.ip || req.body.ipAddress,
      timestamp: new Date()
    });
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create audit log', error: error.message });
  }
};

export const deleteAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found' });
    res.json({ success: true, message: 'Audit log deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete audit log', error: error.message });
  }
};

export const getAuditLogSummary = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalLogs, categoryStats, statusStats, recentActivity] = await Promise.all([
      AuditLog.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      AuditLog.find({ createdAt: { $gte: thirtyDaysAgo } })
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        categoryStats,
        statusStats,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get audit summary', error: error.message });
  }
};
