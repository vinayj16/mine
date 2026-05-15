import Transaction from '../models/Transaction.js';
import Subscription from '../models/Subscription.js';

export const getTransactionById = async (transactionId) => {
  const transaction = await Transaction.findOne({ transactionId })
    .populate('schoolId', 'name code contact')
    .populate('subscriptionId')
    .populate('createdBy', 'name email');
  
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  return transaction;
};

export const getSchoolTransactions = async (schoolId, filters = {}) => {
  const { status, type, startDate, endDate, page = 1, limit = 20 } = filters;

  const query = { schoolId };

  if (status) {
    query.status = status;
  }

  if (type) {
    query.type = type;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const transactions = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('subscriptionId', 'planName billingCycle');

  const total = await Transaction.countDocuments(query);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getAllTransactions = async (filters = {}) => {
  const { status, type, startDate, endDate, page = 1, limit = 50 } = filters;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (type) {
    query.type = type;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const transactions = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('schoolId', 'name code')
    .populate('subscriptionId', 'planName')
    .populate('createdBy', 'name email');

  const total = await Transaction.countDocuments(query);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const createRefund = async (transactionId, refundData, userId) => {
  const { amount, reason } = refundData;

  const transaction = await Transaction.findOne({ transactionId });
  
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.status === 'refunded') {
    throw new Error('Transaction already refunded');
  }

  if (transaction.status !== 'completed') {
    throw new Error('Only completed transactions can be refunded');
  }

  if (amount > transaction.amount) {
    throw new Error('Refund amount cannot exceed transaction amount');
  }

  transaction.status = 'refunded';
  transaction.refundInfo = {
    refundedAt: new Date(),
    refundAmount: amount,
    refundReason: reason,
    refundedBy: userId
  };

  await transaction.save();

  const refundTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const refundInvoiceId = `REF-${transaction.invoiceId}`;

  const refundTransaction = new Transaction({
    transactionId: refundTransactionId,
    schoolId: transaction.schoolId,
    subscriptionId: transaction.subscriptionId,
    invoiceId: refundInvoiceId,
    type: 'refund',
    description: `Refund for ${transaction.description}`,
    amount: -amount,
    currency: transaction.currency,
    status: 'completed',
    paymentMethod: transaction.paymentMethod,
    metadata: {
      originalTransactionId: transactionId,
      refundReason: reason
    },
    createdBy: userId,
    processedAt: new Date()
  });

  await refundTransaction.save();

  return { transaction, refundTransaction };
};

export const getRevenueAnalytics = async (filters = {}) => {
  const { startDate, endDate, groupBy = 'month' } = filters;

  const matchStage = {
    status: 'completed',
    type: { $in: ['subscription', 'upgrade', 'addon'] }
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  let groupByFormat;
  if (groupBy === 'day') {
    groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  } else if (groupBy === 'month') {
    groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  } else {
    groupByFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
  }

  const revenueByPeriod = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupByFormat,
        totalRevenue: { $sum: '$amount' },
        subscriptionRevenue: {
          $sum: {
            $cond: [{ $eq: ['$type', 'subscription'] }, '$amount', 0]
          }
        },
        upgradeRevenue: {
          $sum: {
            $cond: [{ $eq: ['$type', 'upgrade'] }, '$amount', 0]
          }
        },
        addonRevenue: {
          $sum: {
            $cond: [{ $eq: ['$type', 'addon'] }, '$amount', 0]
          }
        },
        transactions: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const revenueByPlan = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$metadata.planId',
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const totalRevenue = revenueByPeriod.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalTransactions = revenueByPeriod.reduce((sum, item) => sum + item.transactions, 0);

  return {
    revenueByPeriod,
    revenueByPlan,
    summary: {
      totalRevenue,
      totalTransactions,
      averageRevenue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
    }
  };
};

export const getTransactionStats = async () => {
  const totalCompleted = await Transaction.countDocuments({ status: 'completed' });
  const totalPending = await Transaction.countDocuments({ status: 'pending' });
  const totalFailed = await Transaction.countDocuments({ status: 'failed' });
  const totalRefunded = await Transaction.countDocuments({ status: 'refunded' });

  const revenueStats = await Transaction.aggregate([
    { $match: { status: 'completed', type: { $in: ['subscription', 'upgrade', 'addon'] } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        avgTransaction: { $avg: '$amount' }
      }
    }
  ]);

  const refundStats = await Transaction.aggregate([
    { $match: { status: 'refunded' } },
    {
      $group: {
        _id: null,
        totalRefunded: { $sum: '$refundInfo.refundAmount' }
      }
    }
  ]);

  return {
    transactions: {
      completed: totalCompleted,
      pending: totalPending,
      failed: totalFailed,
      refunded: totalRefunded
    },
    revenue: {
      total: revenueStats[0]?.totalRevenue || 0,
      average: revenueStats[0]?.avgTransaction || 0
    },
    refunds: {
      total: refundStats[0]?.totalRefunded || 0
    }
  };
};
