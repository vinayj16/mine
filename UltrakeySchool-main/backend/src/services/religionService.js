import Religion from '../models/Religion.js';

class ReligionService {
  async createReligion(religionData) {
    const existingReligion = await Religion.findOne({
      name: religionData.name,
      institutionId: religionData.institutionId || null,
      isDeleted: false
    });

    if (existingReligion) {
      throw new Error('Religion with this name already exists');
    }

    const religion = new Religion(religionData);
    return await religion.save();
  }

  async getReligionById(religionId) {
    return await Religion.findById(religionId)
      .populate('institutionId', 'name')
      .populate('metadata.createdBy', 'name')
      .populate('metadata.updatedBy', 'name');
  }

  async getAllReligions(filters = {}, options = {}) {
    const {
      status,
      institutionId,
      search
    } = filters;

    const {
      page = 1,
      limit = 50,
      sortBy = 'displayOrder',
      sortOrder = 'asc'
    } = options;

    const query = { isDeleted: false };

    if (status) query.status = status;
    if (institutionId) query.institutionId = institutionId;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [religions, total] = await Promise.all([
      Religion.find(query)
        .populate('institutionId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Religion.countDocuments(query)
    ]);

    return {
      religions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateReligion(religionId, updateData) {
    const religion = await Religion.findById(religionId);
    if (!religion) {
      throw new Error('Religion not found');
    }

    if (updateData.name) {
      const existingReligion = await Religion.findOne({
        _id: { $ne: religionId },
        name: updateData.name,
        institutionId: religion.institutionId || null,
        isDeleted: false
      });

      if (existingReligion) {
        throw new Error('Religion with this name already exists');
      }
    }

    Object.assign(religion, updateData);
    return await religion.save();
  }

  async deleteReligion(religionId) {
    const religion = await Religion.findById(religionId);
    if (!religion) {
      throw new Error('Religion not found');
    }

    religion.isDeleted = true;
    return await religion.save();
  }

  async getReligionsByStatus(status, institutionId) {
    const query = { status, isDeleted: false };
    if (institutionId) query.institutionId = institutionId;

    return await Religion.find(query)
      .sort({ displayOrder: 1, name: 1 });
  }

  async getReligionsByInstitution(institutionId) {
    return await Religion.find({
      institutionId,
      isDeleted: false
    })
      .sort({ displayOrder: 1, name: 1 });
  }

  async updateStatus(religionId, status, userId) {
    const religion = await Religion.findById(religionId);
    if (!religion) {
      throw new Error('Religion not found');
    }

    religion.status = status;
    religion.metadata.updatedBy = userId;
    return await religion.save();
  }

  async updateDisplayOrder(religionId, displayOrder) {
    const religion = await Religion.findById(religionId);
    if (!religion) {
      throw new Error('Religion not found');
    }

    religion.displayOrder = displayOrder;
    return await religion.save();
  }

  async bulkUpdateStatus(religionIds, status, userId) {
    return await Religion.updateMany(
      { _id: { $in: religionIds }, isDeleted: false },
      {
        $set: {
          status,
          'metadata.updatedBy': userId,
          updatedAt: new Date()
        }
      }
    );
  }

  async getReligionStatistics(institutionId) {
    const match = { isDeleted: false };
    if (institutionId) match.institutionId = institutionId;

    const [
      totalReligions,
      activeReligions,
      inactiveReligions
    ] = await Promise.all([
      Religion.countDocuments(match),
      Religion.countDocuments({ ...match, status: 'active' }),
      Religion.countDocuments({ ...match, status: 'inactive' })
    ]);

    return {
      totalReligions,
      activeReligions,
      inactiveReligions
    };
  }

  async searchReligions(searchTerm, institutionId) {
    const query = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { code: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ],
      isDeleted: false
    };

    if (institutionId) query.institutionId = institutionId;

    return await Religion.find(query)
      .sort({ displayOrder: 1, name: 1 })
      .limit(50);
  }
}

export default new ReligionService();
