import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Installment Plan Schema
const installmentPlanSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  feeInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fee',
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  numberOfInstallments: {
    type: Number,
    required: true,
    min: 2,
    max: 12,
  },
  installmentAmount: {
    type: Number,
    required: true,
  },
  frequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly', 'quarterly'],
    default: 'monthly',
  },
  startDate: {
    type: Date,
    required: true,
  },
  installments: [{
    installmentNumber: Number,
    dueDate: Date,
    amount: Number,
    paidAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'overdue'],
      default: 'pending',
    },
    paidDate: Date,
    paymentId: String,
    lateFee: {
      type: Number,
      default: 0,
    },
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'defaulted'],
    default: 'active',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedDate: Date,
  notes: String,
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

const InstallmentPlan = mongoose.model('InstallmentPlan', installmentPlanSchema);

class InstallmentService {
  /**
   * Create installment plan
   * @param {Object} planData - Plan data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Installment plan
   */
  async createInstallmentPlan(planData, tenantId) {
    try {
      const {
        student,
        feeInvoice,
        totalAmount,
        numberOfInstallments,
        frequency,
        startDate,
        approvedBy,
        notes,
      } = planData;

      // Calculate installment amount
      const installmentAmount = Math.ceil(totalAmount / numberOfInstallments);

      // Generate installment schedule
      const installments = this.generateInstallmentSchedule(
        numberOfInstallments,
        installmentAmount,
        frequency,
        new Date(startDate)
      );

      const plan = new InstallmentPlan({
        student,
        feeInvoice,
        totalAmount,
        numberOfInstallments,
        installmentAmount,
        frequency,
        startDate: new Date(startDate),
        installments,
        approvedBy,
        approvedDate: new Date(),
        notes,
        tenant: tenantId,
      });

      await plan.save();
      await plan.populate(['student', 'feeInvoice', 'approvedBy']);

      logger.info(`Installment plan created: ${plan._id}`);
      return plan;
    } catch (error) {
      logger.error(`Error creating installment plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate installment schedule
   * @param {number} numberOfInstallments - Number of installments
   * @param {number} installmentAmount - Amount per installment
   * @param {string} frequency - Payment frequency
   * @param {Date} startDate - Start date
   * @returns {Array} Installment schedule
   */
  generateInstallmentSchedule(numberOfInstallments, installmentAmount, frequency, startDate) {
    const installments = [];
    let currentDate = new Date(startDate);

    for (let i = 1; i <= numberOfInstallments; i++) {
      installments.push({
        installmentNumber: i,
        dueDate: new Date(currentDate),
        amount: installmentAmount,
        status: 'pending',
      });

      // Calculate next due date based on frequency
      switch (frequency) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
      }
    }

    return installments;
  }

  /**
   * Get installment plans
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filters
   * @returns {Object} Installment plans with pagination
   */
  async getInstallmentPlans(tenantId, filters = {}) {
    try {
      const { page = 1, limit = 10, status, studentId } = filters;
      const query = { tenant: tenantId };

      if (status) query.status = status;
      if (studentId) query.student = studentId;

      const plans = await InstallmentPlan.find(query)
        .populate(['student', 'feeInvoice', 'approvedBy'])
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await InstallmentPlan.countDocuments(query);

      return {
        plans,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching installment plans: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get installment plan by ID
   * @param {string} planId - Plan ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Installment plan
   */
  async getInstallmentPlanById(planId, tenantId) {
    try {
      const plan = await InstallmentPlan.findOne({ _id: planId, tenant: tenantId })
        .populate(['student', 'feeInvoice', 'approvedBy']);

      if (!plan) {
        throw new Error('Installment plan not found');
      }

      return plan;
    } catch (error) {
      logger.error(`Error fetching installment plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pay installment
   * @param {string} planId - Plan ID
   * @param {number} installmentNumber - Installment number
   * @param {Object} paymentData - Payment data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Updated plan
   */
  async payInstallment(planId, installmentNumber, paymentData, tenantId) {
    try {
      const { amount, paymentId } = paymentData;

      const plan = await InstallmentPlan.findOne({ _id: planId, tenant: tenantId });

      if (!plan) {
        throw new Error('Installment plan not found');
      }

      const installment = plan.installments.find(
        inst => inst.installmentNumber === installmentNumber
      );

      if (!installment) {
        throw new Error('Installment not found');
      }

      if (installment.status === 'paid') {
        throw new Error('Installment already paid');
      }

      // Update installment
      installment.paidAmount += amount;
      installment.paidDate = new Date();
      installment.paymentId = paymentId;

      if (installment.paidAmount >= installment.amount) {
        installment.status = 'paid';
      } else {
        installment.status = 'partial';
      }

      // Check if all installments are paid
      const allPaid = plan.installments.every(inst => inst.status === 'paid');
      if (allPaid) {
        plan.status = 'completed';
      }

      await plan.save();

      logger.info(`Installment paid: Plan ${planId}, Installment ${installmentNumber}`);
      return plan;
    } catch (error) {
      logger.error(`Error paying installment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Apply late fees to overdue installments
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Updated plans
   */
  async applyLateFees(tenantId) {
    try {
      const now = new Date();
      const plans = await InstallmentPlan.find({
        tenant: tenantId,
        status: 'active',
      });

      const updatedPlans = [];

      for (const plan of plans) {
        let updated = false;

        for (const installment of plan.installments) {
          if (
            installment.status === 'pending' &&
            new Date(installment.dueDate) < now
          ) {
            const daysOverdue = Math.floor(
              (now - new Date(installment.dueDate)) / (1000 * 60 * 60 * 24)
            );
            
            // Calculate late fee (e.g., 1% per day, max 10% of installment amount)
            const lateFeePercentage = Math.min(daysOverdue * 0.01, 0.1);
            installment.lateFee = Math.ceil(installment.amount * lateFeePercentage);
            installment.status = 'overdue';
            updated = true;
          }
        }

        if (updated) {
          await plan.save();
          updatedPlans.push(plan);
        }
      }

      logger.info(`Late fees applied to ${updatedPlans.length} plans`);
      return updatedPlans;
    } catch (error) {
      logger.error(`Error applying late fees: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel installment plan
   * @param {string} planId - Plan ID
   * @param {string} tenantId - Tenant ID
   * @param {string} reason - Cancellation reason
   * @returns {Object} Updated plan
   */
  async cancelInstallmentPlan(planId, tenantId, reason) {
    try {
      const plan = await InstallmentPlan.findOneAndUpdate(
        { _id: planId, tenant: tenantId },
        {
          status: 'cancelled',
          notes: reason,
        },
        { new: true }
      );

      if (!plan) {
        throw new Error('Installment plan not found');
      }

      logger.info(`Installment plan cancelled: ${planId}`);
      return plan;
    } catch (error) {
      logger.error(`Error cancelling installment plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get upcoming installments
   * @param {string} tenantId - Tenant ID
   * @param {number} days - Number of days to look ahead
   * @returns {Array} Upcoming installments
   */
  async getUpcomingInstallments(tenantId, days = 7) {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const plans = await InstallmentPlan.find({
        tenant: tenantId,
        status: 'active',
      }).populate(['student', 'feeInvoice']);

      const upcomingInstallments = [];

      for (const plan of plans) {
        for (const installment of plan.installments) {
          const dueDate = new Date(installment.dueDate);
          
          if (
            installment.status === 'pending' &&
            dueDate >= now &&
            dueDate <= futureDate
          ) {
            upcomingInstallments.push({
              plan: plan._id,
              student: plan.student,
              installmentNumber: installment.installmentNumber,
              dueDate: installment.dueDate,
              amount: installment.amount,
            });
          }
        }
      }

      return upcomingInstallments;
    } catch (error) {
      logger.error(`Error fetching upcoming installments: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get installment statistics
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Statistics
   */
  async getInstallmentStatistics(tenantId) {
    try {
      const plans = await InstallmentPlan.find({ tenant: tenantId });

      const stats = {
        totalPlans: plans.length,
        activePlans: plans.filter(p => p.status === 'active').length,
        completedPlans: plans.filter(p => p.status === 'completed').length,
        cancelledPlans: plans.filter(p => p.status === 'cancelled').length,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueInstallments: 0,
      };

      for (const plan of plans) {
        stats.totalAmount += plan.totalAmount;

        for (const installment of plan.installments) {
          stats.paidAmount += installment.paidAmount;
          
          if (installment.status === 'pending' || installment.status === 'partial') {
            stats.pendingAmount += installment.amount - installment.paidAmount;
          }
          
          if (installment.status === 'overdue') {
            stats.overdueInstallments++;
          }
        }
      }

      return stats;
    } catch (error) {
      logger.error(`Error fetching installment statistics: ${error.message}`);
      throw error;
    }
  }
}

export default new InstallmentService();
