import AdminAlert from '../models/AdminAlert.js';
import Institution from '../models/Institution.js';

class AdminAlertService {
  async getExpiryAlerts(filters = {}) {
    const query = { alertType: 'expiry', ...filters };
    const alerts = await AdminAlert.find(query).sort({ daysUntilExpiry: 1 });
    return alerts;
  }

  async getOverduePayments(filters = {}) {
    const query = { alertType: 'overdue', ...filters };
    const alerts = await AdminAlert.find(query).sort({ daysOverdue: -1 });
    return alerts;
  }

  async getRenewalReminders(filters = {}) {
    const query = { alertType: 'renewal', ...filters };
    const alerts = await AdminAlert.find(query).sort({ nextReminderDate: 1 });
    return alerts;
  }

  async getAutoRenewSettings(filters = {}) {
    const query = { alertType: 'autorenew', ...filters };
    const alerts = await AdminAlert.find(query).sort({ nextRenewalDate: 1 });
    return alerts;
  }

  async getSuspendedInstitutions() {
    const institutions = await Institution.find({ status: 'suspended' });
    return institutions;
  }

  async createAlert(alertData) {
    const alert = await AdminAlert.create(alertData);
    return alert;
  }

  async updateAlert(id, updates) {
    const alert = await AdminAlert.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!alert) throw new Error('Alert not found');
    return alert;
  }

  async deleteAlert(id) {
    const alert = await AdminAlert.findByIdAndDelete(id);
    if (!alert) throw new Error('Alert not found');
    return alert;
  }

  async sendReminder(alertId) {
    const alert = await AdminAlert.findById(alertId);
    if (!alert) throw new Error('Alert not found');

    alert.reminderSent = true;
    alert.lastReminderDate = new Date();
    alert.reminderCount += 1;
    alert.status = 'sent';

    // Calculate next reminder date based on frequency
    const nextDate = new Date();
    if (alert.reminderFrequency === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (alert.reminderFrequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (alert.reminderFrequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    alert.nextReminderDate = nextDate;

    await alert.save();
    return alert;
  }

  async resolveAlert(alertId, resolvedBy) {
    const alert = await AdminAlert.findByIdAndUpdate(
      alertId,
      {
        $set: {
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy
        }
      },
      { new: true }
    );
    if (!alert) throw new Error('Alert not found');
    return alert;
  }

  async toggleAutoRenew(institutionId, autoRenew) {
    const institution = await Institution.findByIdAndUpdate(
      institutionId,
      { $set: { 'subscription.autoRenewal': autoRenew } },
      { new: true }
    );
    if (!institution) throw new Error('Institution not found');

    // Update or create auto-renew alert
    await AdminAlert.findOneAndUpdate(
      { institutionId, alertType: 'autorenew' },
      {
        $set: {
          autoRenew,
          status: autoRenew ? 'active' : 'paused'
        }
      },
      { upsert: true, new: true }
    );

    return institution;
  }

  async generateAlertsFromInstitutions() {
    const institutions = await Institution.find({ status: { $ne: 'inactive' } });
    const alerts = [];

    for (const institution of institutions) {
      const now = new Date();
      const expiryDate = new Date(institution.subscription.endDate);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      // Create expiry alert if within 30 days
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        const existingAlert = await AdminAlert.findOne({
          institutionId: institution._id,
          alertType: 'expiry'
        });

        if (!existingAlert) {
          const alert = await this.createAlert({
            institutionId: institution._id,
            institutionName: institution.name,
            alertType: 'expiry',
            severity: daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 15 ? 'high' : 'medium',
            expiryDate: institution.subscription.endDate,
            daysUntilExpiry,
            amount: institution.subscription.monthlyCost,
            plan: institution.subscription.planName,
            autoRenew: institution.subscription.autoRenewal || false,
            status: 'pending'
          });
          alerts.push(alert);
        }
      }

      // Create overdue alert if expired
      if (daysUntilExpiry < 0 && institution.status !== 'suspended') {
        const existingAlert = await AdminAlert.findOne({
          institutionId: institution._id,
          alertType: 'overdue'
        });

        if (!existingAlert) {
          const alert = await this.createAlert({
            institutionId: institution._id,
            institutionName: institution.name,
            alertType: 'overdue',
            severity: 'critical',
            daysOverdue: Math.abs(daysUntilExpiry),
            amount: institution.subscription.monthlyCost,
            plan: institution.subscription.planName,
            status: 'pending',
            paymentMethod: institution.subscription.paymentMethod || 'Not specified'
          });
          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  async getAlertStatistics() {
    const [
      expiring7Days,
      expiring30Days,
      overdueCount,
      suspendedCount,
      totalOverdueAmount,
      activeAutoRenew
    ] = await Promise.all([
      AdminAlert.countDocuments({ alertType: 'EXPIRY', daysUntilExpiry: { $lte: 7 } }),
      AdminAlert.countDocuments({ alertType: 'EXPIRY', daysUntilExpiry: { $lte: 30 } }),
      AdminAlert.countDocuments({ alertType: 'PAYMENT_OVERDUE' }),
      Institution.countDocuments({ status: 'suspended' }),
      AdminAlert.aggregate([
        { $match: { alertType: 'PAYMENT_OVERDUE' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      AdminAlert.countDocuments({ alertType: 'RENEWAL_REMINDER', autoRenew: true, status: 'active' })
    ]);

    return {
      expiring7Days,
      expiring30Days,
      overdueCount,
      suspendedCount,
      totalOverdueAmount: totalOverdueAmount[0]?.total || 0,
      activeAutoRenew
    };
  }

  async getAllAlerts(filters = {}, options = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      AdminAlert.find(filters)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit),
      AdminAlert.countDocuments(filters)
    ]);

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getAlertById(id) {
    const alert = await AdminAlert.findById(id);
    if (!alert) throw new Error('Alert not found');
    return alert;
  }

  async dismissAlert(alertId, dismissedBy, reason) {
    const alert = await AdminAlert.findByIdAndUpdate(
      alertId,
      {
        $set: {
          status: 'dismissed',
          dismissedAt: new Date(),
          dismissedBy,
          notes: reason
        }
      },
      { new: true }
    );
    if (!alert) throw new Error('Alert not found');
    return alert;
  }

  async bulkDeleteAlerts(alertIds) {
    const result = await AdminAlert.deleteMany({ _id: { $in: alertIds } });
    return { deletedCount: result.deletedCount };
  }
}

export default new AdminAlertService();
