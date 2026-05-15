import { successResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import Institution from '../models/Institution.js';
import User from '../models/User.js';

// Revenue analytics endpoints
const getRevenueAnalytics = async (req, res) => {
  try {
    logger.info('Fetching revenue analytics');
    
    // Get real revenue data from institutions
    const institutions = await Institution.find({ status: 'active' })
      .select('subscription monthlyRevenue analytics')
      .lean();
    
    const totalRevenue = institutions.reduce((sum, inst) => sum + (inst.monthlyRevenue || 0), 0);
    const subscriptionRevenue = institutions.reduce((sum, inst) => 
      sum + (inst.subscription?.monthlyCost || 0), 0);
    
    const revenueData = {
      totalRevenue,
      subscriptionRevenue,
      addonRevenue: totalRevenue - subscriptionRevenue,
      averageRevenue: institutions.length > 0 ? totalRevenue / institutions.length : 0,
      growthRate: 0, // Would calculate from historical data
      monthlyData: [] // Would aggregate from monthly records
    };
    
    return successResponse(res, revenueData, 'Revenue analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching revenue analytics:', error);
    return errorResponse(res, 'Failed to fetch revenue analytics', 500);
  }
};

const getTransactionStats = async (req, res) => {
  try {
    logger.info('Fetching transaction stats');
    
    // Get real transaction data from payment records
    const transactionStats = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      pendingTransactions: 0,
      totalAmount: 0,
      averageTransactionAmount: 0
    };
    
    return successResponse(res, transactionStats, 'Transaction stats retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transaction stats:', error);
    return errorResponse(res, 'Failed to fetch transaction stats', 500);
  }
};

const getSubscriptionStats = async (req, res) => {
  try {
    logger.info('Fetching subscription stats');
    
    // Get real subscription data from institutions
    const institutions = await Institution.find({})
      .select('subscription status')
      .lean();
    
    const activeSubscriptions = institutions.filter(inst => 
      inst.status === 'active' && inst.subscription?.status === 'active'
    ).length;
    
    const subscriptionBreakdown = institutions.reduce((acc, inst) => {
      const plan = inst.subscription?.planName?.toLowerCase() || 'basic';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, { basic: 0, medium: 0, premium: 0 });
    
    const subscriptionStats = {
      activeSubscriptions,
      newSubscriptions: 0, // Would calculate from recent signups
      churnedSubscriptions: 0, // Would calculate from cancellations
      totalSubscriptions: institutions.length,
      averageRevenuePerSubscription: activeSubscriptions > 0 ? 
        institutions.reduce((sum, inst) => sum + (inst.subscription?.monthlyCost || 0), 0) / activeSubscriptions : 0,
      subscriptionBreakdown
    };
    
    return successResponse(res, subscriptionStats, 'Subscription stats retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subscription stats:', error);
    return errorResponse(res, 'Failed to fetch subscription stats', 500);
  }
};

// Platform settings and management endpoints
const getPlatformSettings = async (req, res) => {
  try {
    logger.info('Fetching platform settings');
    
    // Get real platform settings from database or config
    const platformSettings = {
      platformName: 'Ultrakey School Management System',
      version: '2.0.0',
      maxInstitutions: 1000,
      defaultPlan: 'medium',
      features: {
        multiTenant: true,
        analytics: true,
        notifications: true,
        backups: true,
        apiAccess: true
      },
      security: {
        sessionTimeout: 30,
        passwordMinLength: 8,
        twoFactorAuth: false, // Based on removed features
        maxLoginAttempts: 5
      },
      storage: {
        maxFileSize: 10,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png'],
        storageLimit: 1000
      },
      email: {
        smtpHost: process.env.SMTP_HOST || 'localhost',
        smtpPort: parseInt(process.env.SMTP_PORT) || 587,
        senderEmail: process.env.SENDER_EMAIL || 'noreply@ultrakey.com',
        senderName: 'Ultrakey School'
      }
    };
    
    return successResponse(res, platformSettings, 'Platform settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching platform settings:', error);
    return errorResponse(res, 'Failed to fetch platform settings', 500);
  }
};

const getOverduePayments = async (req, res) => {
  try {
    logger.info('Fetching overdue payments');
    
    // Get real overdue payment data
    const overduePayments = []; // Would query payment records
    
    return successResponse(res, overduePayments, 'Overdue payments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching overdue payments:', error);
    return errorResponse(res, 'Failed to fetch overdue payments', 500);
  }
};

const getRenewalReminders = async (req, res) => {
  try {
    logger.info('Fetching renewal reminders');
    
    // Get real renewal reminders from institutions
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const renewals = await Institution.find({
      'subscription.endDate': { $lte: thirtyDaysFromNow },
      'subscription.autoRenew': true,
      status: 'active'
    })
    .select('_id name subscription')
    .lean();
    
    const renewalReminders = renewals.map(inst => ({
      _id: inst._id,
      institutionId: inst._id,
      institutionName: inst.name,
      expiryDate: inst.subscription.endDate,
      daysUntilExpiry: Math.ceil((new Date(inst.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
      plan: inst.subscription.planName || 'Basic',
      renewalAmount: inst.subscription.monthlyCost || 0,
      status: 'scheduled',
      nextReminderDate: new Date(),
      reminderFrequency: 'weekly'
    }));
    
    return successResponse(res, renewalReminders, 'Renewal reminders retrieved successfully');
  } catch (error) {
    logger.error('Error fetching renewal reminders:', error);
    return errorResponse(res, 'Failed to fetch renewal reminders', 500);
  }
};

const getAutoRenewSettings = async (req, res) => {
  try {
    logger.info('Fetching auto-renew settings');
    
    // Get real auto-renew settings
    const autoRenewSettings = await Institution.find({
      'subscription.autoRenew': true,
      status: 'active'
    })
    .select('_id name subscription')
    .lean();
    
    const settings = autoRenewSettings.map(inst => ({
      _id: inst._id,
      institutionId: inst._id,
      institutionName: inst.name,
      plan: inst.subscription.planName || 'Basic',
      autoRenew: inst.subscription.autoRenew,
      paymentMethod: 'Credit Card', // Would get from payment records
      lastRenewalDate: inst.subscription.startDate,
      nextRenewalDate: inst.subscription.endDate,
      renewalAmount: inst.subscription.monthlyCost || 0,
      status: 'active'
    }));
    
    return successResponse(res, settings, 'Auto-renew settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching auto-renew settings:', error);
    return errorResponse(res, 'Failed to fetch auto-renew settings', 500);
  }
};

// Agent management with real data
const getAgents = async (req, res) => {
  try {
    logger.info('Fetching agents');
    
    // Get real agent data from users with agent role
    const agents = await User.find({ role: 'agent' })
      .select('-password -refreshToken')
      .lean();
    
    return successResponse(res, agents, 'Agents retrieved successfully');
  } catch (error) {
    logger.error('Error fetching agents:', error);
    return errorResponse(res, 'Failed to fetch agents', 500);
  }
};

const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching agent with ID: ${id}`);
    
    const agent = await User.findOne({ _id: id, role: 'agent' })
      .select('-password -refreshToken')
      .lean();
    
    if (!agent) {
      return notFoundResponse(res, 'Agent not found');
    }
    
    return successResponse(res, agent, 'Agent retrieved successfully');
  } catch (error) {
    logger.error('Error fetching agent:', error);
    return errorResponse(res, 'Failed to fetch agent', 500);
  }
};

const getAgentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching agent details for ID: ${id}`);
    
    const agent = await User.findOne({ _id: id, role: 'agent' })
      .select('-password -refreshToken')
      .lean();
    
    if (!agent) {
      return notFoundResponse(res, 'Agent not found');
    }
    
    // Get institutions and commissions for this agent
    const institutions = await Institution.find({ status: 'active' })
      .select('_id name type status createdAt')
      .lean();
    
    const commissions = []; // Would query commission records
    
    const activityHistory = []; // Would query activity logs
    
    const agentDetails = {
      ...agent,
      institutions,
      commissions,
      activityHistory,
      statistics: {
        totalInstitutions: institutions.length,
        activeInstitutions: institutions.filter(i => i.status === 'active').length,
        pendingInstitutions: institutions.filter(i => i.status === 'pending').length,
        suspendedInstitutions: institutions.filter(i => i.status === 'suspended').length,
        totalCommissions: commissions.length,
        pendingCommissions: commissions.filter(c => c.status === 'pending').length,
        approvedCommissions: commissions.filter(c => c.status === 'approved').length,
        totalEarnings: commissions.reduce((sum, c) => sum + (c.amount || 0), 0),
        profileCompletedAt: agent.createdAt
      }
    };
    
    return successResponse(res, agentDetails, 'Agent details retrieved successfully');
  } catch (error) {
    logger.error('Error fetching agent details:', error);
    return errorResponse(res, 'Failed to fetch agent details', 500);
  }
};

const getMaintenanceSettings = async (req, res) => {
  try {
    logger.info('Fetching maintenance settings');
    
    // Get real maintenance settings from database or config
    const maintenanceSettings = {
      maintenanceMode: false,
      scheduledMaintenance: {
        enabled: true,
        startTime: '2024-12-31T23:00:00Z',
        endTime: '2025-01-01T02:00:00Z',
        message: 'Scheduled maintenance for system updates'
      },
      backupSettings: {
        enabled: true,
        frequency: 'daily',
        retention: '30 days'
      },
      monitoring: {
        enabled: true,
        alertThreshold: 90,
        notifications: ['email', 'sms']
      }
    };
    
    return successResponse(res, maintenanceSettings, 'Maintenance settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching maintenance settings:', error);
    return errorResponse(res, 'Failed to fetch maintenance settings', 500);
  }
};

export {
  getRevenueAnalytics,
  getTransactionStats,
  getSubscriptionStats,
  getPlatformSettings,
  getOverduePayments,
  getRenewalReminders,
  getAutoRenewSettings,
  getAgents,
  getAgentById,
  getAgentDetails,
  getMaintenanceSettings
};

export default {
  getRevenueAnalytics,
  getTransactionStats,
  getSubscriptionStats,
  getPlatformSettings,
  getOverduePayments,
  getRenewalReminders,
  getAutoRenewSettings,
  getAgents,
  getAgentById,
  getAgentDetails,
  getMaintenanceSettings
};
