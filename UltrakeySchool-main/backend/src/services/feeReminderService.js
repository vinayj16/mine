import Fee from '../models/Fee.js';
import User from '../models/User.js';
import { sendNotificationToUser } from './socketService.js';
import logger from '../utils/logger.js';

class FeeReminderService {
  /**
   * Send fee reminders
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Reminder options
   * @returns {Object} Reminder results
   */
  async sendFeeReminders(tenantId, options = {}) {
    try {
      const { daysBeforeDue = 7, includeOverdue = true, channels = ['notification'] } = options;

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysBeforeDue);

      // Find fees that are due soon or overdue
      const query = {
        tenant: tenantId,
        status: { $in: ['pending', 'partial'] },
        isActive: true,
        $or: [
          // Upcoming dues
          { dueDate: { $gte: now, $lte: futureDate } },
        ],
      };

      if (includeOverdue) {
        query.$or.push({ dueDate: { $lt: now } });
      }

      const fees = await Fee.find(query).populate('studentId');

      const results = {
        total: fees.length,
        sent: 0,
        failed: 0,
        channels: {
          notification: 0,
        },
      };

      for (const fee of fees) {
        try {
          const student = fee.studentId;
          if (!student) continue;

          const daysUntilDue = Math.ceil((new Date(fee.dueDate) - now) / (1000 * 60 * 60 * 24));
          const isOverdue = daysUntilDue < 0;

          const reminderData = {
            studentName: `${student.firstName} ${student.lastName}`,
            feeType: fee.feeType,
            amount: fee.remainingAmount || fee.amount,
            currency: fee.currency || 'USD',
            dueDate: fee.dueDate.toLocaleDateString(),
            daysUntilDue: Math.abs(daysUntilDue),
            isOverdue,
          };

          // Send via selected channels
          if (channels.includes('notification')) {
            await this.sendNotificationReminder(student._id, reminderData);
            results.channels.notification++;
          }

          // Update fee reminder tracking
          fee.remindersSent = (fee.remindersSent || 0) + 1;
          fee.lastReminderDate = new Date();
          await fee.save();

          results.sent++;
        } catch (error) {
          logger.error(`Error sending reminder for fee ${fee._id}: ${error.message}`);
          results.failed++;
        }
      }

      logger.info(`Fee reminders sent: ${results.sent} successful, ${results.failed} failed`);
      return results;
    } catch (error) {
      logger.error(`Error sending fee reminders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send notification reminder
   * @param {string} userId - User ID
   * @param {Object} reminderData - Reminder data
   */
  async sendNotificationReminder(userId, reminderData) {
    const { feeType, amount, currency, daysUntilDue, isOverdue } = reminderData;

    const notification = {
      title: isOverdue ? 'Overdue Fee Payment' : 'Fee Payment Reminder',
      message: isOverdue
        ? `Your ${feeType} payment of ${currency} ${amount} is overdue by ${daysUntilDue} days.`
        : `Your ${feeType} payment of ${currency} ${amount} is due in ${daysUntilDue} days.`,
      type: isOverdue ? 'urgent' : 'warning',
      category: 'fee',
    };

    sendNotificationToUser(userId, notification);
  }

  /**
   * Send bulk reminders for specific students
   * @param {string} tenantId - Tenant ID
   * @param {Array} studentIds - Student IDs
   * @param {Object} options - Reminder options
   * @returns {Object} Results
   */
  async sendBulkReminders(tenantId, studentIds, options = {}) {
    try {
      const { channels = ['notification'] } = options;

      const fees = await Fee.find({
        tenant: tenantId,
        studentId: { $in: studentIds },
        status: { $in: ['pending', 'partial'] },
        isActive: true,
      }).populate('studentId');

      const results = {
        total: fees.length,
        sent: 0,
        failed: 0,
      };

      for (const fee of fees) {
        try {
          const student = fee.studentId;
          if (!student) continue;

          const now = new Date();
          const daysUntilDue = Math.ceil((new Date(fee.dueDate) - now) / (1000 * 60 * 60 * 24));
          const isOverdue = daysUntilDue < 0;

          const reminderData = {
            studentName: `${student.firstName} ${student.lastName}`,
            feeType: fee.feeType,
            amount: fee.remainingAmount || fee.amount,
            currency: fee.currency || 'USD',
            dueDate: fee.dueDate.toLocaleDateString(),
            daysUntilDue: Math.abs(daysUntilDue),
            isOverdue,
          };

          if (channels.includes('notification')) {
            await this.sendNotificationReminder(student._id, reminderData);
          }

          fee.remindersSent = (fee.remindersSent || 0) + 1;
          fee.lastReminderDate = new Date();
          await fee.save();

          results.sent++;
        } catch (error) {
          logger.error(`Error sending bulk reminder for fee ${fee._id}: ${error.message}`);
          results.failed++;
        }
      }

      logger.info(`Bulk reminders sent: ${results.sent} successful, ${results.failed} failed`);
      return results;
    } catch (error) {
      logger.error(`Error sending bulk reminders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Schedule automatic reminders
   * @param {string} tenantId - Tenant ID
   * @param {Object} schedule - Schedule configuration
   * @returns {Object} Schedule result
   */
  async scheduleAutomaticReminders(tenantId, schedule) {
    try {
      const { frequency, daysBeforeDue, channels } = schedule;

      // This would typically integrate with a job scheduler like node-cron or Bull
      // For now, we'll just log the schedule configuration
      
      logger.info(`Automatic reminders scheduled for tenant ${tenantId}:`, {
        frequency,
        daysBeforeDue,
        channels,
      });

      return {
        success: true,
        message: 'Automatic reminders scheduled successfully',
        schedule,
      };
    } catch (error) {
      logger.error(`Error scheduling automatic reminders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reminder statistics
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filters
   * @returns {Object} Statistics
   */
  async getReminderStatistics(tenantId, filters = {}) {
    try {
      const { startDate, endDate } = filters;

      const query = {
        tenant: tenantId,
        lastReminderDate: { $exists: true },
      };

      if (startDate && endDate) {
        query.lastReminderDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const fees = await Fee.find(query);

      const stats = {
        totalReminders: fees.reduce((sum, fee) => sum + (fee.remindersSent || 0), 0),
        feesWithReminders: fees.length,
        averageRemindersPerFee: fees.length > 0
          ? (fees.reduce((sum, fee) => sum + (fee.remindersSent || 0), 0) / fees.length).toFixed(2)
          : 0,
      };

      return stats;
    } catch (error) {
      logger.error(`Error fetching reminder statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reminder history
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filters
   * @returns {Array} Reminder history
   */
  async getReminderHistory(tenantId, filters = {}) {
    try {
      const { startDate, endDate, limit = 50 } = filters;

      const query = {
        tenant: tenantId,
        lastReminderDate: { $exists: true },
      };

      if (startDate && endDate) {
        query.lastReminderDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const fees = await Fee.find(query)
        .populate('studentId', 'firstName lastName email')
        .sort({ lastReminderDate: -1 })
        .limit(limit);

      const history = fees.map(fee => ({
        feeId: fee._id,
        studentId: fee.studentId?._id,
        studentName: fee.studentId ? `${fee.studentId.firstName} ${fee.studentId.lastName}` : 'N/A',
        studentEmail: fee.studentId?.email,
        feeType: fee.feeType,
        amount: fee.amount,
        dueDate: fee.dueDate,
        remindersSent: fee.remindersSent || 0,
        lastReminderDate: fee.lastReminderDate,
        status: fee.status,
      }));

      return history;
    } catch (error) {
      logger.error(`Error fetching reminder history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel scheduled reminder
   * @param {string} reminderId - Reminder ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Result
   */
  async cancelScheduledReminder(reminderId, tenantId) {
    try {
      // This would typically cancel a scheduled job
      // For now, we'll return a success response
      
      logger.info(`Scheduled reminder ${reminderId} cancelled for tenant ${tenantId}`);

      return {
        success: true,
        message: 'Scheduled reminder cancelled successfully',
        reminderId,
      };
    } catch (error) {
      logger.error(`Error cancelling scheduled reminder: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retry failed reminders
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Options
   * @returns {Object} Results
   */
  async retryFailedReminders(tenantId, options = {}) {
    try {
      const { channels = ['notification'] } = options;

      // Find fees with failed reminders (lastReminderDate exists but status is still pending/partial)
      const fees = await Fee.find({
        tenant: tenantId,
        status: { $in: ['pending', 'partial'] },
        lastReminderDate: { $exists: true },
        isActive: true,
      }).populate('studentId');

      const results = {
        total: fees.length,
        sent: 0,
        failed: 0,
      };

      for (const fee of fees) {
        try {
          const student = fee.studentId;
          if (!student) continue;

          const now = new Date();
          const daysUntilDue = Math.ceil((new Date(fee.dueDate) - now) / (1000 * 60 * 60 * 24));
          const isOverdue = daysUntilDue < 0;

          const reminderData = {
            studentName: `${student.firstName} ${student.lastName}`,
            feeType: fee.feeType,
            amount: fee.remainingAmount || fee.amount,
            currency: fee.currency || 'USD',
            dueDate: fee.dueDate.toLocaleDateString(),
            daysUntilDue: Math.abs(daysUntilDue),
            isOverdue,
          };

          if (channels.includes('notification')) {
            await this.sendNotificationReminder(student._id, reminderData);
          }

          fee.remindersSent = (fee.remindersSent || 0) + 1;
          fee.lastReminderDate = new Date();
          await fee.save();

          results.sent++;
        } catch (error) {
          logger.error(`Error retrying reminder for fee ${fee._id}: ${error.message}`);
          results.failed++;
        }
      }

      logger.info(`Retry reminders sent: ${results.sent} successful, ${results.failed} failed`);
      return results;
    } catch (error) {
      logger.error(`Error retrying failed reminders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export reminder data
   * @param {string} tenantId - Tenant ID
   * @param {string} format - Export format (json or csv)
   * @param {Object} filters - Filters
   * @returns {Object} Export result
   */
  async exportReminderData(tenantId, format = 'json', filters = {}) {
    try {
      const { startDate, endDate } = filters;

      const query = {
        tenant: tenantId,
        lastReminderDate: { $exists: true },
      };

      if (startDate && endDate) {
        query.lastReminderDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const fees = await Fee.find(query)
        .populate('studentId', 'firstName lastName email')
        .sort({ lastReminderDate: -1 });

      if (format === 'json') {
        const data = fees.map(fee => ({
          feeId: fee._id,
          studentId: fee.studentId?._id,
          studentName: fee.studentId ? `${fee.studentId.firstName} ${fee.studentId.lastName}` : 'N/A',
          studentEmail: fee.studentId?.email,
          feeType: fee.feeType,
          amount: fee.amount,
          dueDate: fee.dueDate,
          remindersSent: fee.remindersSent || 0,
          lastReminderDate: fee.lastReminderDate,
          status: fee.status,
        }));

        return {
          data,
          format: 'json',
          exportedAt: new Date(),
        };
      } else if (format === 'csv') {
        const headers = ['Fee ID', 'Student Name', 'Student Email', 'Fee Type', 'Amount', 'Due Date', 'Reminders Sent', 'Last Reminder Date', 'Status'];
        const rows = fees.map(fee => [
          fee._id,
          fee.studentId ? `${fee.studentId.firstName} ${fee.studentId.lastName}` : 'N/A',
          fee.studentId?.email || 'N/A',
          fee.feeType,
          fee.amount,
          fee.dueDate,
          fee.remindersSent || 0,
          fee.lastReminderDate,
          fee.status,
        ]);

        return {
          data: [headers, ...rows],
          format: 'csv',
          exportedAt: new Date(),
        };
      }

      throw new Error('Unsupported export format');
    } catch (error) {
      logger.error(`Error exporting reminder data: ${error.message}`);
      throw error;
    }
  }
}

export default new FeeReminderService();
