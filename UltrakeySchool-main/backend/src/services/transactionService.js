import Transaction from '../models/Transaction.js';
import Institution from '../models/Institution.js';

export const getTransactionById = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId)
    .populate('institutionId', 'name code contact')
    .populate('institutionId', 'name code type')
    .populate('subscriptionId')
    .populate('createdBy', 'name email');

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  return transaction;
};

export const getSchoolTransactions = async (institutionId, filters = {}) => {
  const { status, type, startDate, endDate, page = 1, limit = 20 } = filters;

  const query = { institutionId };

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
    .populate('institutionId', 'name code')
    .populate('institutionId', 'name code type')
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

export const getAllTransactionsForSuperAdmin = async (filters = {}) => {
  const { status, type, startDate, endDate, search, page = 1, limit = 50 } = filters;

  const query = {};

  if (status && status !== 'all') {
    query.status = status.toLowerCase();
  }

  if (type && type !== 'all') {
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
    .populate('institutionId', 'name code type')
    .populate('institutionId', 'name code')
    .populate('subscriptionId', 'planName billingCycle')
    .populate('createdBy', 'name email');

  const total = await Transaction.countDocuments(query);

  const enriched = await Promise.all(transactions.map(async (txn) => {
    let schoolName = 'Unknown';
    let instId = '';
    if (txn.institutionId && typeof txn.institutionId === 'object' && txn.institutionId.name) {
      schoolName = txn.institutionId.name;
      instId = txn.institutionId._id?.toString() || txn.institutionId.toString();
    } else if (txn.institutionId && typeof txn.institutionId === 'object' && txn.institutionId.name) {
      schoolName = txn.institutionId.name;
    } else if (txn.institutionId) {
      const rawId = txn.institutionId?.toString?.() || txn.institutionId;
      instId = rawId;
      try {
        const inst = await Institution.findById(rawId).select('name').lean();
        if (inst) schoolName = inst.name;
      } catch {} 
    }

    const planName = txn.plan || txn.metadata?.planName || 'N/A';
    const gstAmount = Math.round(txn.amount * 0.18);
    const transactionId = txn.transactionId || txn._id.toString();

    return {
      id: txn._id.toString(),
      institutionId: instId,
      schoolName,
      plan: planName,
      amount: txn.amount,
      currency: txn.currency || 'INR',
      date: txn.createdAt?.toISOString()?.split('T')[0] || '',
      status: txn.status.charAt(0).toUpperCase() + txn.status.slice(1),
      paymentMethod: txn.paymentMethod || 'N/A',
      transactionId,
      invoiceId: txn.invoiceId || `INV-${transactionId.slice(-6)}`,
      description: txn.description || `${planName} ${txn.type} payment`,
      createdBy: txn.createdBy?.name || 'System',
      createdAt: txn.createdAt?.toISOString() || '',
      gstAmount,
      totalAmount: txn.amount + gstAmount,
      type: txn.type
    }
  }));

  return {
    transactions: enriched,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getTransactionStatsForSuperAdmin = async () => {
  const allTxns = await Transaction.find({}).lean();

  const completed = allTxns.filter(t => t.status === 'completed');
  const failed = allTxns.filter(t => t.status === 'failed');
  const pending = allTxns.filter(t => t.status === 'pending');
  const refunded = allTxns.filter(t => t.status === 'refunded');

  const totalRevenue = completed.reduce((sum, t) => sum + t.amount, 0);
  const totalGST = Math.round(totalRevenue * 0.18);
  const totalAmount = totalRevenue + totalGST;
  const pendingAmount = pending.reduce((sum, t) => sum + t.amount, 0);

  return {
    totalRevenue,
    totalGST,
    totalAmount,
    pendingAmount,
    failedCount: failed.length,
    completedCount: completed.length,
    pendingCount: pending.length,
    refundedCount: refunded.length,
    totalTransactions: allTxns.length
  };
};

export const createRefund = async (transactionId, refundData, userId) => {
  const { amount, reason } = refundData;

  const transaction = await Transaction.findById(transactionId);

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
    institutionId: transaction.institutionId,
    institutionId: transaction.institutionId,
    subscriptionId: transaction.subscriptionId,
    invoiceId: refundInvoiceId,
    type: 'refund',
    description: `Refund for ${transaction.description}`,
    amount: -amount,
    currency: transaction.currency,
    status: 'completed',
    paymentMethod: 'other',
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
    type: { $in: ['subscription', 'upgrade', 'addon', 'payment'] }
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
        _id: { $ifNull: ['$plan', { $ifNull: ['$metadata.planName', 'Unknown'] }] },
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
    { $match: { status: 'completed', type: { $in: ['subscription', 'upgrade', 'addon', 'payment'] } } },
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
        totalRefunded: { $sum: { $ifNull: ['$refundInfo.refundAmount', 0] } }
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
