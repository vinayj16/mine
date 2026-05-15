import Grade from '../models/Grade.js';

class GradeService {
  async createGrade(gradeData) {
    const overlapping = await Grade.findOne({
      institutionId: gradeData.institutionId,
      academicYear: gradeData.academicYear,
      isDeleted: false,
      $or: [
        {
          marksFrom: { $lte: gradeData.marksFrom },
          marksTo: { $gte: gradeData.marksFrom }
        },
        {
          marksFrom: { $lte: gradeData.marksTo },
          marksTo: { $gte: gradeData.marksTo }
        },
        {
          marksFrom: { $gte: gradeData.marksFrom },
          marksTo: { $lte: gradeData.marksTo }
        }
      ]
    });

    if (overlapping) {
      throw new Error('Grade range overlaps with existing grade');
    }

    const grade = new Grade(gradeData);
    return await grade.save();
  }

  async getGradeById(gradeId) {
    return await Grade.findById(gradeId)
      .populate('institutionId', 'name type')
      .populate('metadata.createdBy', 'name')
      .populate('metadata.updatedBy', 'name');
  }

  async getGradeByGradeId(gradeId) {
    return await Grade.findOne({ gradeId, isDeleted: false })
      .populate('institutionId', 'name type');
  }

  async getAllGrades(filters = {}, options = {}) {
    const {
      institutionId,
      academicYear,
      status,
      grade,
      minPoints,
      maxPoints,
      search
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'displayOrder',
      sortOrder = 'asc'
    } = options;

    const query = { isDeleted: false };

    if (institutionId) query.institutionId = institutionId;
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;
    if (grade) query.grade = new RegExp(grade, 'i');
    if (minPoints !== undefined) query.points = { ...query.points, $gte: minPoints };
    if (maxPoints !== undefined) query.points = { ...query.points, $lte: maxPoints };

    if (search) {
      query.$or = [
        { grade: { $regex: search, $options: 'i' } },
        { gradeId: { $regex: search, $options: 'i' } },
        { percentage: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [grades, total] = await Promise.all([
      Grade.find(query)
        .populate('institutionId', 'name type')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Grade.countDocuments(query)
    ]);

    return {
      grades,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateGrade(gradeId, updateData) {
    const grade = await Grade.findById(gradeId);
    
    if (!grade) {
      throw new Error('Grade not found');
    }

    if (updateData.marksFrom !== undefined || updateData.marksTo !== undefined) {
      const marksFrom = updateData.marksFrom ?? grade.marksFrom;
      const marksTo = updateData.marksTo ?? grade.marksTo;

      const overlapping = await Grade.findOne({
        _id: { $ne: gradeId },
        institutionId: grade.institutionId,
        academicYear: grade.academicYear,
        isDeleted: false,
        $or: [
          {
            marksFrom: { $lte: marksFrom },
            marksTo: { $gte: marksFrom }
          },
          {
            marksFrom: { $lte: marksTo },
            marksTo: { $gte: marksTo }
          },
          {
            marksFrom: { $gte: marksFrom },
            marksTo: { $lte: marksTo }
          }
        ]
      });

      if (overlapping) {
        throw new Error('Grade range overlaps with existing grade');
      }
    }

    Object.assign(grade, updateData);
    return await grade.save();
  }

  async deleteGrade(gradeId) {
    const grade = await Grade.findById(gradeId);
    
    if (!grade) {
      throw new Error('Grade not found');
    }

    grade.isDeleted = true;
    return await grade.save();
  }

  async updateStatus(gradeId, status) {
    return await Grade.findByIdAndUpdate(
      gradeId,
      { status },
      { new: true, runValidators: true }
    );
  }

  async getGradesByInstitution(institutionId, academicYear) {
    const query = { 
      institutionId, 
      isDeleted: false 
    };
    
    if (academicYear) {
      query.academicYear = academicYear;
    }

    return await Grade.find(query)
      .sort({ displayOrder: 1, points: -1 });
  }

  async getGradesByStatus(status, institutionId) {
    const query = { 
      status, 
      isDeleted: false 
    };
    
    if (institutionId) {
      query.institutionId = institutionId;
    }

    return await Grade.find(query)
      .populate('institutionId', 'name type')
      .sort({ displayOrder: 1 });
  }

  async getGradeByMarks(marks, institutionId, academicYear) {
    return await Grade.findOne({
      institutionId,
      academicYear,
      marksFrom: { $lte: marks },
      marksTo: { $gte: marks },
      status: 'active',
      isDeleted: false
    });
  }

  async bulkUpdateStatus(gradeIds, status) {
    return await Grade.updateMany(
      { _id: { $in: gradeIds } },
      { status },
      { runValidators: true }
    );
  }

  async updateDisplayOrder(gradeId, displayOrder) {
    return await Grade.findByIdAndUpdate(
      gradeId,
      { displayOrder },
      { new: true, runValidators: true }
    );
  }

  async getGradeStatistics(institutionId, academicYear) {
    const query = { isDeleted: false };
    
    if (institutionId) query.institutionId = institutionId;
    if (academicYear) query.academicYear = academicYear;

    const [
      totalGrades,
      activeGrades,
      inactiveGrades,
      gradesByPoints,
      averagePoints
    ] = await Promise.all([
      Grade.countDocuments(query),
      Grade.countDocuments({ ...query, status: 'active' }),
      Grade.countDocuments({ ...query, status: 'inactive' }),
      Grade.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$points',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]),
      Grade.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            avgPoints: { $avg: '$points' }
          }
        }
      ])
    ]);

    return {
      totalGrades,
      activeGrades,
      inactiveGrades,
      gradesByPoints,
      averagePoints: averagePoints[0]?.avgPoints || 0
    };
  }

  async searchGrades(searchTerm, institutionId) {
    const query = {
      isDeleted: false,
      $or: [
        { grade: { $regex: searchTerm, $options: 'i' } },
        { gradeId: { $regex: searchTerm, $options: 'i' } },
        { percentage: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    if (institutionId) {
      query.institutionId = institutionId;
    }

    return await Grade.find(query)
      .populate('institutionId', 'name type')
      .sort({ displayOrder: 1 })
      .limit(20);
  }
}

export default new GradeService();
