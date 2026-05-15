import Commission from '../models/Commission.js';

class CommissionService {
  async createCommission(commissionData) {
    const commission = new Commission(commissionData);
    return await commission.save();
  }

  async getCommissionById(commissionId) {
    return await Commission.findById(commissionId)
      .populate('agentId', 'name email')
      .populate('institutionId', 'name type');
  }

  async getCommissionsByAgent(agentId, filters = {}) {
    const query = { agentId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    return await Commission.find(query)
      .populate('institutionId', 'name type')
      .sort({ createdAt: -1 });
  }

  async getCommissionSummary(agentId) {
    const commissions = await Commission.find({ agentId });

    const summary = {
      totalCommission: 0,
      pendingCommission: 0,
      approvedCommission: 0,
      paidCommission: 0,
      currentMonthCommission: 0,
      commissionRate: 10
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    commissions.forEach(commission => {
      summary.totalCommission += commission.commissionAmount;

      if (commission.status === 'pending') {
        summary.pendingCommission += commission.commissionAmount;
      } else if (commission.status === 'approved') {
        summary.approvedCommission += commission.commissionAmount;
      } else if (commission.status === 'paid') {
        summary.paidCommission += commission.commissionAmount;
      }

      const commissionDate = new Date(commission.createdAt);
      if (commissionDate.getMonth() === currentMonth && commissionDate.getFullYear() === currentYear) {
        summary.currentMonthCommission += commission.commissionAmount;
      }
    });

    return summary;
  }

  async updateCommissionStatus(commissionId, status, userId, paymentData = {}) {
    const commission = await Commission.findById(commissionId);
    
    if (!commission) {
      throw new Error('Commission not found');
    }

    commission.status = status;
    commission.metadata.updatedBy = userId;

    if (status === 'paid' && paymentData) {
      commission.paymentDate = paymentData.paymentDate || new Date();
      commission.paymentMethod = paymentData.paymentMethod;
      commission.paymentReference = paymentData.paymentReference;
    }

    return await commission.save();
  }

  async updateCommission(commissionId, updateData, userId) {
    const commission = await Commission.findById(commissionId);
    
    if (!commission) {
      throw new Error('Commission not found');
    }

    Object.assign(commission, updateData);
    commission.metadata.updatedBy = userId;
    
    return await commission.save();
  }

  async deleteCommission(commissionId) {
    return await Commission.findByIdAndDelete(commissionId);
  }

  async getAllCommissions(filters = {}, options = {}) {
    const {
      agentId,
      status,
      startDate,
      endDate
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const query = {};

    if (agentId) query.agentId = agentId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [commissions, total] = await Promise.all([
      Commission.find(query)
        .populate('agentId', 'name email')
        .populate('institutionId', 'name type')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Commission.countDocuments(query)
    ]);

    return {
      commissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getCommissionStatistics() {
    const [
      totalCommissions,
      pendingCommissions,
      approvedCommissions,
      paidCommissions,
      totalRevenue
    ] = await Promise.all([
      Commission.countDocuments(),
      Commission.countDocuments({ status: 'pending' }),
      Commission.countDocuments({ status: 'approved' }),
      Commission.countDocuments({ status: 'paid' }),
      Commission.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$commissionAmount' }
          }
        }
      ])
    ]);

    return {
      totalCommissions,
      pendingCommissions,
      approvedCommissions,
      paidCommissions,
      totalRevenue: totalRevenue[0]?.total || 0
    };
  }
}

export default new CommissionService();
