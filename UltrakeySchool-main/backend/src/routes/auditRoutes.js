import express from 'express';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const CATEGORY_BY_ACTION = {
  login: 'login',
  logout: 'login',
  impersonate: 'impersonation',
  impersonation: 'impersonation',
  password_reset: 'password-reset',
  reset_password: 'password-reset',
  plan_change: 'plan-change',
  subscription_updated: 'plan-change',
  suspension: 'suspension',
  module_change: 'module-change',
  settings_update: 'settings-change'
};

const ACTIONS_BY_CATEGORY = {
  login: ['login', 'logout'],
  impersonation: ['impersonate', 'impersonation'],
  'password-reset': ['password_reset', 'reset_password', 'password-reset'],
  'plan-change': ['plan_change', 'subscription_updated', 'plan-change'],
  suspension: ['suspension', 'suspend', 'unsuspend'],
  'module-change': ['module_change', 'module-change'],
  'settings-change': ['settings_update', 'settings-change', 'settings_updated']
};

const getAuditCategory = (log) => {
  if (log.metadata?.category) return log.metadata.category;

  const action = String(log.action || '').toLowerCase();
  const actionType = String(log.actionType || '').toLowerCase();

  return CATEGORY_BY_ACTION[action] || CATEGORY_BY_ACTION[actionType] || 'settings-change';
};

const getAuditDetails = (log) => {
  if (typeof log.description === 'string' && log.description.trim()) return log.description;
  if (typeof log.details?.details === 'string' && log.details.details.trim()) return log.details.details;
  if (typeof log.details === 'string' && log.details.trim()) return log.details;
  if (log.details && typeof log.details === 'object') {
    return Object.entries(log.details)
      .filter(([, value]) => value !== undefined && value !== null && typeof value !== 'object')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }
  return log.action || '';
};

const normalizeAuditLog = (log) => {
  const timestamp = log.timestamp || log.createdAt || new Date();
  const userId = log.userId || log.entityId || 'unknown';
  const status = log.status || log.metadata?.status || 'success';

  return {
    _id: log._id,
    timestamp,
    userId: userId?.toString?.() || String(userId),
    userName: log.userName || log.details?.userName || log.userId?.name || 'Unknown',
    userRole: log.userRole || log.details?.userRole || log.entityType || 'user',
    action: log.action || 'Unknown Action',
    category: getAuditCategory(log),
    resource: log.metadata?.resource || log.actionType || log.entityType || 'System',
    resourceId: log.entityId?.toString?.() || '',
    details: getAuditDetails(log),
    ipAddress: log.ipAddress || 'N/A',
    userAgent: log.userAgent || 'N/A',
    status,
    institutionId: log.institutionId?.toString?.() || '',
    institutionName: log.institutionName || log.institutionId?.name || log.institutionCode || 'N/A'
  };
};

// Helper function to create audit log entries
const createAuditLog = async (userId, action, category, resource, details, ipAddress, userAgent, status = 'success') => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const auditLog = new AuditLog({
      institutionId: user.institutionId || null,
      userId: userId,
      action: action,
      entityType: user.role || 'user',
      entityId: userId,
      details: {
        category,
        resource,
        details,
        status,
        userName: user.name,
        userRole: user.role,
        ...details
      },
      ipAddress: ipAddress,
      userAgent: userAgent,
      metadata: {
        category,
        resource,
        status
      }
    });

    await auditLog.save();
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

// Get all audit logs for super admin
router.get('/', protect, async (req, res) => {
  console.log('🔍 Audit logs endpoint called!', { query: req.query });
  try {
    const { 
      page = 1, 
      limit = 50, 
      category, 
      status, 
      dateRange = '7days',
      search 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const queryParts = [];

    // Date filter
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    queryParts.push({
      $or: [
        { createdAt: { $gte: startDate } },
        { timestamp: { $gte: startDate } },
        { createdAt: { $gte: startDate.toISOString() } },
        { timestamp: { $gte: startDate.toISOString() } }
      ]
    });

    // Category filter
    if (category && category !== 'all') {
      const categoryActions = ACTIONS_BY_CATEGORY[category] || [category];
      queryParts.push({
        $or: [
          { 'metadata.category': category },
          { action: { $in: categoryActions } },
          { actionType: { $in: categoryActions } }
        ]
      });
    }

    // Status filter
    if (status && status !== 'all') {
      queryParts.push({
        $or: [
          { status },
          { 'metadata.status': status }
        ]
      });
    }

    // Search filter
    if (search) {
      queryParts.push({ $or: [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { userRole: { $regex: search, $options: 'i' } },
        { 'details.userName': { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { actionType: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'details.details': { $regex: search, $options: 'i' } }
      ] });
    }

    const query = queryParts.length > 0 ? { $and: queryParts } : {};

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1, timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await AuditLog.countDocuments(query);

    // Format logs for frontend
    const formattedLogs = (logs || []).map(normalizeAuditLog);

    res.json({
      success: true,
      data: formattedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch audit logs',
      data: []
    });
  }
});

// Get audit logs summary statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const { dateRange = '7days' } = req.query;

    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const stats = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$metadata.status',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      total: 0,
      success: 0,
      failure: 0,
      warning: 0
    };

    stats.forEach(stat => {
      summary.total += stat.count;
      if (stat._id === 'success') summary.success = stat.count;
      else if (stat._id === 'failure') summary.failure = stat.count;
      else if (stat._id === 'warning') summary.warning = stat.count;
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create audit log (for manual logging)
router.post('/', protect, async (req, res) => {
  try {
    const { action, category, resource, details, status = 'success' } = req.body;
    
    await createAuditLog(
      req.user.id,
      action,
      category,
      resource,
      details,
      req.ip,
      req.get('User-Agent'),
      status
    );

    res.json({
      success: true,
      message: 'Audit log created successfully'
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export { createAuditLog };
export default router;
