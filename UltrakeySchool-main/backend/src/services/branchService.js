import Branch from '../models/Branch.js';
import Institution from '../models/Institution.js';

class BranchService {
  async createBranch(branchData) {
    const institution = await Institution.findById(branchData.institutionId);
    if (!institution) {
      throw new Error('Institution not found');
    }

    const branch = await Branch.create({
      ...branchData,
      institutionName: institution.name,
      institutionType: institution.type
    });

    return branch;
  }

async getBranches(filters = {}, options = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const query = { ...filters };
    const skip = (page - 1) * limit;

    // Use lean() to avoid Mongoose populate issues - just use stored string values
    const [branches, total] = await Promise.all([
      Branch.find(query)
        .lean()
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit),
      Branch.countDocuments(query)
    ]);

    return {
      branches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getBranchById(id) {
    // Use lean() to avoid Mongoose populate issues
    const branch = await Branch.findById(id).lean();
    if (!branch) {
      throw new Error('Branch not found');
    }
    return branch;
  }

  async updateBranch(id, updates) {
    const branch = await Branch.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!branch) {
      throw new Error('Branch not found');
    }

    return branch;
  }

  async deleteBranch(id) {
    const branch = await Branch.findByIdAndUpdate(
      id,
      { $set: { status: 'Inactive' } },
      { new: true }
    );

    if (!branch) {
      throw new Error('Branch not found');
    }

    return branch;
  }

  async getBranchesByInstitution(institutionId) {
    return await Branch.find({ institutionId, status: { $ne: 'Inactive' } });
  }

  async getBranchesByStatus(status) {
    return await Branch.find({ status });
  }

  async searchBranches(query, limit = 20) {
    const regex = new RegExp(query, 'i');
    return await Branch.find({
      $or: [
        { name: regex },
        { code: regex },
        { institutionName: regex }
      ],
      status: { $ne: 'Inactive' }
    }).limit(limit);
  }

  async getBranchStatistics(branchId) {
    const branch = await this.getBranchById(branchId);
    
    return {
      totalStudents: branch.students || 0,
      totalTeachers: branch.teachers || 0,
      totalStaff: branch.staff || 0,
      capacity: branch.capacity || {},
      utilizationRate: branch.capacity?.maxStudents 
        ? ((branch.students / branch.capacity.maxStudents) * 100).toFixed(1)
        : 0,
      status: branch.status,
      lastActivity: branch.lastActivity
    };
  }

  async updateBranchCounts(branchId, counts) {
    const updates = {};
    if (counts.students !== undefined) updates.students = counts.students;
    if (counts.teachers !== undefined) updates.teachers = counts.teachers;
    if (counts.staff !== undefined) updates.staff = counts.staff;

    return await this.updateBranch(branchId, updates);
  }

  async suspendBranch(id, reason) {
    const branch = await Branch.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status: 'Suspended',
          notes: reason 
        } 
      },
      { new: true }
    );

    if (!branch) {
      throw new Error('Branch not found');
    }

    return branch;
  }

  async activateBranch(id) {
    const branch = await Branch.findByIdAndUpdate(
      id,
      { $set: { status: 'Active' } },
      { new: true }
    );

    if (!branch) {
      throw new Error('Branch not found');
    }

    return branch;
  }

  async addTag(id, tag) {
    const branch = await Branch.findByIdAndUpdate(
      id,
      { $addToSet: { tags: tag } },
      { new: true }
    );

    if (!branch) {
      throw new Error('Branch not found');
    }

    return branch;
  }

  async removeTag(id, tag) {
    const branch = await Branch.findByIdAndUpdate(
      id,
      { $pull: { tags: tag } },
      { new: true }
    );

    if (!branch) {
      throw new Error('Branch not found');
    }

    return branch;
  }

  async getBranchDashboard() {
    const [totalBranches, activeBranches, suspendedBranches, totalStudents, totalTeachers] = await Promise.all([
      Branch.countDocuments(),
      Branch.countDocuments({ status: 'Active' }),
      Branch.countDocuments({ status: 'Suspended' }),
      Branch.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: null, total: { $sum: '$students' } } }
      ]),
      Branch.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: null, total: { $sum: '$teachers' } } }
      ])
    ]);

    return {
      totalBranches,
      activeBranches,
      suspendedBranches,
      inactiveBranches: totalBranches - activeBranches - suspendedBranches,
      totalStudents: totalStudents[0]?.total || 0,
      totalTeachers: totalTeachers[0]?.total || 0
    };
  }

  async bulkDelete(ids) {
    const result = await Branch.updateMany(
      { _id: { $in: ids } },
      { $set: { status: 'Inactive' } }
    );

    return result;
  }
}

export default new BranchService();
