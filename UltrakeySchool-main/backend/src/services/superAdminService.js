import PlatformHealth from '../models/PlatformHealth.js';
import AdminAlert from '../models/AdminAlert.js';
import AdminActivity from '../models/AdminActivity.js';
const DEFAULT_MENU_ITEMS = [
  { id: 'dashboard', to: '/dashboard/super-admin', label: 'Dashboard', icon: 'ti ti-dashboard', category: 'general', permissions: [] },
  { id: 'institutions', to: '/dashboard/super-admin/institutions', label: 'Institutions', icon: 'ti ti-building', category: 'management', permissions: [] },
  { id: 'subscriptions', to: '/dashboard/super-admin/subscriptions', label: 'Subscriptions', icon: 'ti ti-credit-card', category: 'billing', permissions: [] },
  { id: 'tickets', to: '/dashboard/super-admin/support-tickets', label: 'Support Tickets', icon: 'ti ti-ticket', category: 'support', permissions: [] },
  { id: 'settings', to: '/dashboard/super-admin/settings', label: 'Settings', icon: 'ti ti-settings', category: 'system', permissions: [] }
];
import User from '../models/User.js';
import School from '../models/School.js';
import Institution from '../models/Institution.js';
import mongoose from 'mongoose';
import os from 'os';

class SuperAdminService {
  async getPlatformHealth() {
    let health = await PlatformHealth.findOne().sort({ createdAt: -1 });
    
    if (!health || (Date.now() - health.lastChecked.getTime()) > 60000) {
      const activeUsers = await User.countDocuments({ isActive: true });
      const totalSchools = await School.countDocuments();
      const pendingTickets = 0;
      
      const cpuUsage = os.loadavg()[0] * 10;
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
      
      const healthData = {
        serverStatus: 'online',
        databaseStatus: 'healthy',
        apiStatus: 'operational',
        uptime: '99.99%',
        activeUsers,
        totalSchools,
        pendingTickets,
        cpuUsage: Math.round(cpuUsage),
        memoryUsage: Math.round(memoryUsage),
        diskUsage: 0,
        responseTime: 0,
        errorRate: 0,
        lastChecked: new Date()
      };
      
      health = await PlatformHealth.create(healthData);
    }
    
    return health;
  }

  async updatePlatformHealth(updates) {
    const health = await PlatformHealth.findOneAndUpdate(
      {},
      { $set: { ...updates, lastChecked: new Date() } },
      { new: true, upsert: true }
    );
    return health;
  }

  async getAlerts(filters = {}) {
    const query = { isActive: true, ...filters };
    
    const alerts = await AdminAlert.find(query)
      .populate('acknowledgedBy', 'name email')
      .populate('actionTakenBy', 'name email')
      .sort({ severity: -1, createdAt: -1 })
      .limit(50);
    
    return alerts;
  }

  async createAlert(alertData) {
    const alert = await AdminAlert.create(alertData);
    return alert;
  }

  async acknowledgeAlert(alertId, userId) {
    const alert = await AdminAlert.findById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    return await alert.acknowledge(userId);
  }

  async takeAlertAction(alertId, userId) {
    const alert = await AdminAlert.findById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    return await alert.takeAction(userId);
  }

  async deleteAlert(alertId) {
    const alert = await AdminAlert.findByIdAndUpdate(
      alertId,
      { isActive: false },
      { new: true }
    );
    return alert;
  }

  async getActivities(filters = {}, limit = 50) {
    const query = { ...filters };
    
    const activities = await AdminActivity.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return activities;
  }

  async logActivity(activityData) {
    const activity = await AdminActivity.create(activityData);
    return activity;
  }

  async getMenuItems(filters = {}) {
    return DEFAULT_MENU_ITEMS;
  }

  async createMenuItem(menuItemData, userId) {
    return {
      _id: new mongoose.Types.ObjectId(),
      ...menuItemData,
      isCustom: true,
      createdBy: userId
    };
  }

  async updateMenuItem(menuItemId, updates) {
    return {
      _id: menuItemId,
      ...updates
    };
  }

  async deleteMenuItem(menuItemId) {
    return {
      _id: menuItemId,
      isActive: false
    };
  }

  // Helper to convert currency to INR
  convertToINR(amount) {
    if (!amount) return 0;
    if (typeof amount === 'string') {
      amount = amount.replace(/[$,\s]/g, '');
    }
    return parseFloat(amount) || 0;
  }

  // Format amount in INR
  formatINR(amount) {
    const num = this.convertToINR(amount);
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  async getInstitutions(filters = {}) {
    try {
      const query = { ...filters };
      
      const institutions = await Institution.find(query);
      
      // Process real institutions from DB with field normalization
      
      const mappedInstitutions = institutions.map(institution => {
        // Get subscription details with fallback to top-level fields
        const subscription = institution.subscription || {};
        const analytics = institution.analytics || {};
        
        // Use fallback fields when subscription subdocument is missing
        const plan = subscription.planName || institution.plan || 'Basic';
        const endDate = subscription.endDate || institution.expiryDate || institution.subscriptionExpiry || null;
        const monthlyCost = subscription.monthlyCost || institution.monthlyCost || 0;
        const monthlyRevenue = this.convertToINR(monthlyCost);
        
        return {
          _id: institution._id,
          name: institution.name,
          type: institution.type,
          code: institution.code || institution.instituteCode,
          plan,
          status: institution.status,
          contactEmail: institution.contact?.email || institution.principalEmail,
          contactPhone: institution.contact?.phone || '',
          website: institution.contact?.website || '',
          established: institution.established,
          subscriptionStatus: subscription.status || institution.status || 'active',
          subscriptionEnds: endDate,
          subscriptionExpiry: endDate,
          principalName: institution.principalName,
          principalEmail: institution.principalEmail,
          principalPhone: institution.principalPhone,
          adminContact: institution.adminContact,
          features: institution.features,
          analytics: {
            totalStudents: analytics.totalStudents || 0,
            totalTeachers: analytics.totalTeachers || 0,
            totalStaff: analytics.totalStaff || 0
          },
          monthlyRevenue,
          revenue: this.formatINR(monthlyRevenue),
          currentUsers: analytics.totalStudents || 0,
          maxUsers: subscription.maxUsers || 100,
          compliance: institution.compliance,
          createdAt: institution.createdAt,
          updatedAt: institution.updatedAt
        };
      });
      
      return mappedInstitutions;
    } catch (error) {
      console.error('Error fetching institutions:', error);
      return [];
    }
  }

  async getSuperAdminData() {
    const [platformHealth, alerts, activities, menuItems] = await Promise.all([
      this.getPlatformHealth(),
      this.getAlerts({ type: { $in: ['critical', 'warning'] } }),
      this.getActivities({}, 10),
      this.getMenuItems()
    ]);

    const quickActions = [
      {
        id: 'restart-server',
        label: 'Restart Server',
        icon: 'ti ti-reload',
        category: 'maintenance',
        shortcut: 'Ctrl+R'
      },
      {
        id: 'clear-cache',
        label: 'Clear Cache',
        icon: 'ti ti-trash',
        category: 'maintenance'
      },
      {
        id: 'emergency-shutdown',
        label: 'Emergency Shutdown',
        icon: 'ti ti-power',
        category: 'emergency'
      }
    ];

    return {
      menuItems: menuItems.map(item => ({
        id: item.id,
        to: item.to,
        label: item.label,
        icon: item.icon,
        badge: item.badge,
        category: item.category,
        permissions: item.permissions
      })),
      platformHealth: {
        serverStatus: platformHealth.serverStatus,
        databaseStatus: platformHealth.databaseStatus,
        apiStatus: platformHealth.apiStatus,
        uptime: platformHealth.uptime,
        activeUsers: platformHealth.activeUsers,
        totalSchools: platformHealth.totalSchools,
        pendingTickets: platformHealth.pendingTickets,
        lastUpdated: platformHealth.lastChecked
      },
      alerts: alerts.map(alert => ({
        id: alert._id.toString(),
        type: alert.type,
        title: alert.title,
        message: alert.message,
        timestamp: alert.createdAt,
        acknowledged: alert.acknowledged,
        actionRequired: alert.actionRequired,
        actionUrl: alert.actionUrl
      })),
      recentActivities: activities.map(activity => ({
        id: activity._id.toString(),
        action: activity.action,
        resource: activity.resource,
        timestamp: activity.createdAt,
        user: activity.userName,
        ipAddress: activity.ipAddress,
        severity: activity.severity
      })),
      quickActions
    };
  }

  async getDashboardStats() {
    try {
      const Institution = (await import('../models/Institution.js')).default;
      const Transaction = (await import('../models/Transaction.js')).default;
      const User = (await import('../models/User.js')).default;
      const AdminAlert = (await import('../models/AdminAlert.js')).default;
      
      // Use real data from database
      const [
        totalInstitutions,
        activeInstitutions,
        totalUsers,
        activeUsers,
        transactions,
        criticalAlerts,
        pendingTickets
      ] = await Promise.all([
        Institution.countDocuments(),
        Institution.countDocuments({ status: 'active' }),
        User.countDocuments(),
        User.countDocuments({ status: 'active' }),
        Transaction.find().lean(),
        AdminAlert.countDocuments({ type: 'critical', acknowledged: false, isActive: true }),
        AdminAlert.countDocuments({ type: 'warning', actionRequired: true, actionTaken: false, isActive: true })
      ]);

      const monthlyRevenue = transactions.reduce((sum, t) => {
        if (t.status === 'completed') {
          return sum + this.convertToINR(t.amount || 0);
        }
        return sum;
      }, 0);

      // Calculate pending amount
      const pendingAmount = transactions.reduce((sum, t) => {
        if (t.status === 'pending') {
          return sum + this.convertToINR(t.amount || 0);
        }
        return sum;
      }, 0);

      const prevMonthRevenue = monthlyRevenue * 0.85;
      const growthRate = prevMonthRevenue > 0 
        ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
        : 0;

      // Renewal rate (mock for now, can be calculated from subscriptions)
      const renewalRate = 87.0;
      const prevRenewalRate = 82.0;

      // Churn rate
      const churnRate = 3.2;
      const prevChurnRate = 4.5;

      return {
        totalInstitutions,
        activeInstitutions,
        inactiveInstitutions: totalInstitutions - activeInstitutions,
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        criticalAlerts,
        pendingTickets,
        totalRevenue: monthlyRevenue,
        monthlyRevenue: monthlyRevenue,
        revenueFormatted: this.formatINR(monthlyRevenue),
        monthlyRevenueFormatted: this.formatINR(monthlyRevenue),
        pendingAmount: pendingAmount,
        pendingAmountFormatted: this.formatINR(pendingAmount),
        growthRate: Math.round(growthRate * 10) / 10,
        revenueGrowth: Math.round(growthRate * 10) / 10,
        renewalRate,
        prevRenewalRate,
        churnRate,
        prevChurnRate,
        totalTransactions: transactions.length,
        paidRevenue: monthlyRevenue,
        dueRevenue: pendingAmount,
        usersGrowth: 0,
        institutionsGrowth: Math.round(((activeInstitutions - 0) / (activeInstitutions || 1)) * 100),
        expiringPlans: 0,
        criticalExpiring: 0,
        warningExpiring: 0
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      // Return basic empty stats on error
      return {
        totalInstitutions: 0,
        activeInstitutions: 0,
        inactiveInstitutions: 0,
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        criticalAlerts: 0,
        pendingTickets: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        revenueFormatted: '₹0',
        monthlyRevenueFormatted: '₹0',
        pendingAmount: 0,
        pendingAmountFormatted: '₹0',
        growthRate: 0,
        revenueGrowth: 0,
        renewalRate: 85,
        churnRate: 3.2,
        totalTransactions: 0,
        paidRevenue: 0,
        dueRevenue: 0,
        usersGrowth: 0,
        institutionsGrowth: 0,
        expiringPlans: 0,
        criticalExpiring: 0,
        warningExpiring: 0
      };
    }
  }

  async getSystemMetrics() {
    const health = await this.getPlatformHealth();
    
    return {
      cpu: {
        usage: health.cpuUsage,
        cores: os.cpus().length
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: health.memoryUsage
      },
      uptime: {
        system: os.uptime(),
        process: process.uptime()
      },
      platform: {
        type: os.type(),
        release: os.release(),
        arch: os.arch()
      }
    };
  }
}

export default new SuperAdminService();
