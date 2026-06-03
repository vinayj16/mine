import AcademicReason from '../models/AcademicReason.js';

class AcademicReasonService {
  /**
   * Create a new academic reason
   */
  async createReason(institutionId, reasonData, userId) {
    const reason = await AcademicReason.create({
      ...reasonData,
      institutionId,
      createdBy: userId
    });
    return reason;
  }

  /**
   * Get all reasons with filters
   */
  async getReasons(institutionId, filters = {}, options = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    const query = { institutionId, ...filters };
    const skip = (page - 1) * limit;
    
    const [reasons, total] = await Promise.all([
      AcademicReason.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit),
      AcademicReason.countDocuments(query)
    ]);

    return {
      reasons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get reason by ID
   */
  async getReasonById(reasonId, institutionId) {
    const reason = await AcademicReason.findOne({ _id: reasonId, institutionId });
    if (!reason) {
      throw new Error('Reason not found');
    }
    return reason;
  }

  /**
   * Update reason
   */
  async updateReason(reasonId, institutionId, updates, userId) {
    const reason = await AcademicReason.findOneAndUpdate(
      { _id: reasonId, institutionId },
      { ...updates, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!reason) {
      throw new Error('Reason not found');
    }
    return reason;
  }

  /**
   * Delete reason (soft delete)
   */
  async deleteReason(reasonId, institutionId) {
    const reason = await AcademicReason.findOneAndUpdate(
      { _id: reasonId, institutionId },
      { status: 'inactive' },
      { new: true }
    );
    if (!reason) {
      throw new Error('Reason not found');
    }
    return reason;
  }

  /**
   * Get reasons by role
   */
  async getReasonsByRole(institutionId, role) {
    return await AcademicReason.find({ institutionId, role, status: 'active' });
  }

  /**
   * Get reasons by category
   */
  async getReasonsByCategory(institutionId, category) {
    return await AcademicReason.find({ institutionId, category, status: 'active' });
  }

  /**
   * Get reasons by severity
   */
  async getReasonsBySeverity(institutionId, severity) {
    return await AcademicReason.find({ institutionId, severity, status: 'active' });
  }

  /**
   * Get analytics
   */
  async getAnalytics(institutionId) {
    const reasons = await AcademicReason.find({ institutionId });
    const activeReasons = reasons.filter(r => r.status === 'active');

    const reasonsByCategory = {};
    const reasonsByRole = {};
    const reasonsBySeverity = {};

    activeReasons.forEach(reason => {
      reasonsByCategory[reason.category] = (reasonsByCategory[reason.category] || 0) + 1;
      reasonsByRole[reason.role] = (reasonsByRole[reason.role] || 0) + 1;
      reasonsBySeverity[reason.severity] = (reasonsBySeverity[reason.severity] || 0) + 1;
    });

    const topUsedReasons = activeReasons
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(r => ({ reason: r.reason, count: r.usageCount }));

    return {
      totalReasons: reasons.length,
      activeReasons: activeReasons.length,
      reasonsByCategory,
      reasonsByRole,
      reasonsBySeverity,
      topUsedReasons
    };
  }

  /**
   * Increment usage count
   */
  async incrementUsage(reasonId, institutionId) {
    const reason = await AcademicReason.findOneAndUpdate(
      { _id: reasonId, institutionId },
      { 
        $inc: { usageCount: 1 },
        lastUsed: new Date()
      },
      { new: true }
    );
    return reason;
  }

  /**
   * Bulk delete reasons
   */
  async bulkDeleteReasons(reasonIds, institutionId) {
    const result = await AcademicReason.updateMany(
      { _id: { $in: reasonIds }, institutionId },
      { status: 'inactive' }
    );
    return { deletedCount: result.modifiedCount };
  }

  /**
   * Toggle reason status
   */
  async toggleStatus(reasonId, institutionId) {
    const reason = await AcademicReason.findOne({ _id: reasonId, institutionId });
    if (!reason) {
      throw new Error('Reason not found');
    }
    reason.status = reason.status === 'active' ? 'inactive' : 'active';
    await reason.save();
    return reason;
  }

  /**
   * Get most used reasons
   */
  async getMostUsedReasons(institutionId, limit = 10, filters = {}) {
    const query = { institutionId, status: 'active', ...filters };
    return await AcademicReason.find(query)
      .sort({ usageCount: -1 })
      .limit(limit);
  }

  /**
   * Search reasons with filters
   */
  async searchReasons(institutionId, query, limit = 20, filters = {}) {
    const regex = new RegExp(query, 'i');
    const searchQuery = {
      institutionId,
      status: 'active',
      $or: [
        { reason: regex },
        { description: regex }
      ],
      ...filters
    };
    return await AcademicReason.find(searchQuery).limit(limit);
  }

  /**
   * Export reasons to CSV
   */
  async exportToCSV(institutionId, filters = {}) {
    const reasons = await AcademicReason.find({ institutionId, ...filters });
    
    if (reasons.length === 0) {
      return 'reason,description,role,category,severity,status,usageCount\n';
    }

    const headers = ['reason', 'description', 'role', 'category', 'severity', 'status', 'usageCount'];
    const csvRows = [
      headers.join(','),
      ...reasons.map(r => {
        return [
          `"${r.reason || ''}"`,
          `"${r.description || ''}"`,
          r.role,
          r.category,
          r.severity,
          r.status,
          r.usageCount
        ].join(',');
      })
    ];

    return csvRows.join('\n');
  }
}

export default new AcademicReasonService();
